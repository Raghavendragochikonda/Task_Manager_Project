require('dotenv').config({ quiet: true });

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: false,
  lastModified: false,
  setHeaders(res) { res.setHeader('Cache-Control', 'no-store'); }
}));

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120).transform((v) => v.toLowerCase()),
  password: z.string().min(6).max(80),
  role: z.enum(['Admin', 'Member']).default('Member')
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1)
});

const projectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).default('')
});

const memberSchema = z.object({
  userId: z.coerce.number().int().positive()
});

const taskSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1000).default(''),
  status: z.enum(['Todo', 'In Progress', 'Done']).default('Todo'),
  priority: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  assigneeId: z.coerce.number().int().positive().nullable().optional()
});

const statusSchema = z.object({
  status: z.enum(['Todo', 'In Progress', 'Done'])
});

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

function parseBody(schema, req, res) {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return null;
  }
  return parsed.data;
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.id);
    if (!user) return res.status(401).json({ error: 'Invalid session' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'Admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

function canAccessProject(userId, role, projectId) {
  if (role === 'Admin') return true;
  return Boolean(db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(projectId, userId));
}

function hydrateProject(row) {
  return {
    ...row,
    members: db.prepare(`
      SELECT u.id, u.name, u.email, u.role, pm.role AS projectRole
      FROM project_members pm
      JOIN users u ON u.id = pm.user_id
      WHERE pm.project_id = ?
      ORDER BY u.name
    `).all(row.id)
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/signup', (req, res) => {
  const body = parseBody(signupSchema, req, res);
  if (!body) return;

  const existingUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  const role = existingUsers === 0 ? 'Admin' : body.role;

  try {
    const passwordHash = bcrypt.hashSync(body.password, 10);
    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run(body.name, body.email, passwordHash, role);
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Email already registered' });
    res.status(500).json({ error: 'Could not create account' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const body = parseBody(loginSchema, req, res);
  if (!body) return;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(body.email);
  if (!user || !bcrypt.compareSync(body.password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/users', auth, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users ORDER BY name').all();
  res.json({ users });
});

app.get('/api/projects', auth, (req, res) => {
  const rows = req.user.role === 'Admin'
    ? db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
    : db.prepare(`
        SELECT p.* FROM projects p
        JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = ?
        ORDER BY p.created_at DESC
      `).all(req.user.id);
  res.json({ projects: rows.map(hydrateProject) });
});

app.post('/api/projects', auth, requireAdmin, (req, res) => {
  const body = parseBody(projectSchema, req, res);
  if (!body) return;

  const create = db.transaction(() => {
    const result = db.prepare('INSERT INTO projects (name, description, created_by) VALUES (?, ?, ?)').run(body.name, body.description, req.user.id);
    db.prepare('INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)').run(result.lastInsertRowid, req.user.id, 'Owner');
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(result.lastInsertRowid);
  });

  res.status(201).json({ project: hydrateProject(create()) });
});

app.post('/api/projects/:id/members', auth, requireAdmin, (req, res) => {
  const projectId = Number(req.params.id);
  const body = parseBody(memberSchema, req, res);
  if (!body) return;

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(projectId);
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(body.userId);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  if (!user) return res.status(404).json({ error: 'User not found' });

  db.prepare(`
    INSERT INTO project_members (project_id, user_id, role)
    VALUES (?, ?, 'Member')
    ON CONFLICT(project_id, user_id) DO NOTHING
  `).run(projectId, body.userId);
  res.status(201).json({ project: hydrateProject(db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId)) });
});

app.delete('/api/projects/:projectId/members/:userId', auth, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ? AND role != ?')
    .run(Number(req.params.projectId), Number(req.params.userId), 'Owner');
  res.status(204).end();
});

app.get('/api/tasks', auth, (req, res) => {
  const rows = req.user.role === 'Admin'
    ? db.prepare(`
        SELECT t.*, p.name AS project_name, u.name AS assignee_name
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        LEFT JOIN users u ON u.id = t.assignee_id
        ORDER BY t.due_date ASC, t.created_at DESC
      `).all()
    : db.prepare(`
        SELECT t.*, p.name AS project_name, u.name AS assignee_name
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = ?
        LEFT JOIN users u ON u.id = t.assignee_id
        WHERE t.assignee_id = ? OR pm.user_id = ?
        ORDER BY t.due_date ASC, t.created_at DESC
      `).all(req.user.id, req.user.id, req.user.id);
  res.json({ tasks: rows });
});

app.post('/api/tasks', auth, requireAdmin, (req, res) => {
  const body = parseBody(taskSchema, req, res);
  if (!body) return;
  if (!canAccessProject(req.user.id, req.user.role, body.projectId)) return res.status(403).json({ error: 'No access to project' });

  const project = db.prepare('SELECT id FROM projects WHERE id = ?').get(body.projectId);
  if (!project) return res.status(404).json({ error: 'Project not found' });

  if (body.assigneeId) {
    const member = db.prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?').get(body.projectId, body.assigneeId);
    if (!member) return res.status(400).json({ error: 'Assignee must be a project member' });
  }

  const result = db.prepare(`
    INSERT INTO tasks (project_id, title, description, status, priority, due_date, assignee_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(body.projectId, body.title, body.description, body.status, body.priority, body.dueDate, body.assigneeId || null, req.user.id);

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ task });
});

app.patch('/api/tasks/:id/status', auth, (req, res) => {
  const body = parseBody(statusSchema, req, res);
  if (!body) return;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(req.params.id));
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (!canAccessProject(req.user.id, req.user.role, task.project_id)) return res.status(403).json({ error: 'No access to task' });

  db.prepare('UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(body.status, task.id);
  res.json({ task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) });
});

app.get('/api/dashboard', auth, (req, res) => {
  const tasks = req.user.role === 'Admin'
    ? db.prepare('SELECT status, due_date FROM tasks').all()
    : db.prepare(`
        SELECT t.status, t.due_date
        FROM tasks t
        JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = ?
      `).all(req.user.id);

  const today = new Date().toISOString().slice(0, 10);
  const summary = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'Todo').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
    overdue: tasks.filter((t) => t.status !== 'Done' && t.due_date < today).length
  };
  res.json({ summary });
});

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Team Task Manager running on http://localhost:${PORT}`);
});
