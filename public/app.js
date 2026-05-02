/* ── TEAM TASK MANAGER — Professional SPA ───────────────────────────────── */

const $app       = document.getElementById('app');
const $toasts    = document.getElementById('toast-container');
const $overlay   = document.getElementById('modal-overlay');
const $modalBox  = document.getElementById('modal-box');

const state = {
  token:      localStorage.getItem('ttm_token'),
  user:       JSON.parse(localStorage.getItem('ttm_user') || 'null'),
  users:      [],
  projects:   [],
  tasks:      [],
  summary:    {},
  page:       'dashboard',
  authMode:   'login',
  taskFilter: 'all'
};

/* ── API ──────────────────────────────────────────────────────────────────── */

async function api(path, opts = {}) {
  const res = await fetch(path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
      ...(opts.headers || {})
    }
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

/* ── SESSION ──────────────────────────────────────────────────────────────── */

function setSession(d) {
  state.token = d.token;
  state.user  = d.user;
  localStorage.setItem('ttm_token', d.token);
  localStorage.setItem('ttm_user', JSON.stringify(d.user));
}

function logout() {
  localStorage.removeItem('ttm_token');
  localStorage.removeItem('ttm_user');
  Object.assign(state, { token: null, user: null, authMode: 'login', page: 'dashboard' });
  renderAuth();
}

async function loadApp() {
  if (!state.token) return renderAuth();
  try {
    const [dash, users, projects, tasks] = await Promise.all([
      api('/api/dashboard'), api('/api/users'), api('/api/projects'), api('/api/tasks')
    ]);
    state.summary  = dash.summary;
    state.users    = users.users;
    state.projects = projects.projects;
    state.tasks    = tasks.tasks;
    renderApp();
  } catch { logout(); }
}

/* ── HELPERS ──────────────────────────────────────────────────────────────── */

function esc(v = '') {
  return String(v).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c]);
}

function today() { return new Date().toISOString().slice(0, 10); }
function isAdmin() { return state.user?.role === 'Admin'; }

function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
}

const AV_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
function avColor(s = '') {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AV_COLORS[h % AV_COLORS.length];
}

function fmtDate(d) {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ── ICONS ────────────────────────────────────────────────────────────────── */

const I = {
  dashboard: `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>`,
  projects:  `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  tasks:     `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  team:      `<svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  plus:      `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  logout:    `<svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  refresh:   `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`,
  check:     `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
  warn:      `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  clock:     `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  user:      `<svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  logo:      `<svg width="18" height="18" fill="none" stroke="white" stroke-width="2.5" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
};

/* ── BADGES ───────────────────────────────────────────────────────────────── */

function statusBadge(s) {
  const map = { 'Todo': 'badge-gray', 'In Progress': 'badge-warning', 'Done': 'badge-success' };
  return `<span class="badge ${map[s] || 'badge-gray'}">${esc(s)}</span>`;
}

function priorityBadge(p) {
  const map = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };
  return `<span class="badge ${map[p] || 'badge-gray'}">${esc(p)}</span>`;
}

function roleBadge(r) {
  return `<span class="badge ${r === 'Admin' ? 'badge-primary' : 'badge-gray'}">${esc(r)}</span>`;
}

const PRIO_COLOR = { High: '#ef4444', Medium: '#d97706', Low: '#10b981' };
const PROJ_COLORS = ['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#14b8a6'];
function projColor(id) { return PROJ_COLORS[id % PROJ_COLORS.length]; }

/* ── AUTH ─────────────────────────────────────────────────────────────────── */

function renderAuth() {
  const signup = state.authMode === 'signup';
  $app.innerHTML = `
    <div class="auth-wrap">
      <div class="auth-hero">
        <div class="auth-brand">
          <div class="auth-brand-icon">${I.logo}</div>
          TaskFlow
        </div>
        <div class="auth-hero-content">
          <h1>Manage tasks,<br/>ship faster.</h1>
          <p>A focused workspace for small teams — create projects, assign ownership, and track every task to done.</p>
        </div>
        <div class="auth-features">
          <div class="auth-feature"><div class="auth-feature-dot"></div>Role-based access — Admin &amp; Member</div>
          <div class="auth-feature"><div class="auth-feature-dot"></div>Project teams with task assignment</div>
          <div class="auth-feature"><div class="auth-feature-dot"></div>Live dashboard — status, overdue, progress</div>
          <div class="auth-feature"><div class="auth-feature-dot"></div>Kanban board — Todo · In Progress · Done</div>
        </div>
      </div>
      <div class="auth-form-side">
        <div class="auth-form-box">
          <h2>${signup ? 'Create account' : 'Welcome back'}</h2>
          <p class="auth-subtitle">${signup ? 'Join your team on TaskFlow' : 'Sign in to your workspace'}</p>
          <form id="authForm">
            ${signup ? `<div class="field"><label>Full Name</label><input name="name" placeholder="Alex Johnson" autocomplete="name" required minlength="2" /></div>` : ''}
            <div class="field"><label>Email address</label><input name="email" type="email" placeholder="you@company.com" autocomplete="email" required /></div>
            <div class="field">
              <label>Password</label>
              <input name="password" type="password" placeholder="${signup ? 'Min 6 characters' : 'Your password'}" autocomplete="${signup ? 'new-password' : 'current-password'}" required minlength="6" />
            </div>
            ${signup ? `<div class="field"><label>Role</label><select name="role"><option value="Member">Member</option><option value="Admin">Admin</option></select></div>` : ''}
            <p class="error-msg" id="authErr"></p>
            <button class="btn btn-primary btn-full" type="submit" style="margin-top:6px">${signup ? 'Create account' : 'Sign in'}</button>
          </form>
          <p style="margin-top:18px;text-align:center;font-size:0.88rem;color:var(--text-2)">
            ${signup ? 'Already have an account?' : "Don't have an account?"}
            <button class="btn-link" id="switchAuth" style="margin-left:4px">${signup ? 'Sign in' : 'Sign up'}</button>
          </p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('switchAuth').addEventListener('click', () => {
    state.authMode = signup ? 'login' : 'signup';
    renderAuth();
  });

  document.getElementById('authForm').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    const errEl = document.getElementById('authErr');
    errEl.textContent = '';
    try {
      const data = await api(signup ? '/api/auth/signup' : '/api/auth/login', {
        method: 'POST', body: JSON.stringify(payload)
      });
      setSession(data);
      await loadApp();
    } catch (err) { errEl.textContent = err.message; }
  });
}

/* ── APP SHELL ────────────────────────────────────────────────────────────── */

function renderApp() {
  const pages = [
    { id: 'dashboard', label: 'Dashboard', icon: I.dashboard },
    { id: 'projects',  label: 'Projects',  icon: I.projects,  count: state.projects.length },
    { id: 'tasks',     label: 'Tasks',     icon: I.tasks,     count: state.tasks.filter(t => t.status !== 'Done').length },
    { id: 'team',      label: 'Team',      icon: I.team,      count: state.users.length }
  ];

  const curPage = pages.find(p => p.id === state.page);

  $app.innerHTML = `
    <div class="layout">
      <nav class="sidebar">
        <div class="sidebar-brand">
          <div class="sidebar-brand-icon">${I.logo}</div>
          TaskFlow
        </div>
        <div class="sidebar-nav">
          <div class="sidebar-section-label">Navigation</div>
          ${pages.map(p => `
            <button class="nav-item ${state.page === p.id ? 'active' : ''}" data-page="${p.id}">
              ${p.icon} ${p.label}
              ${p.count !== undefined ? `<span class="nav-badge">${p.count}</span>` : ''}
            </button>
          `).join('')}
        </div>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="avatar" style="background:${avColor(state.user.name)}">${initials(state.user.name)}</div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name">${esc(state.user.name)}</div>
              <div class="sidebar-user-role">${esc(state.user.role)}</div>
            </div>
            <button id="logoutBtn" title="Logout" style="background:none;border:none;padding:5px;cursor:pointer;color:rgba(255,255,255,0.38)">${I.logout}</button>
          </div>
        </div>
      </nav>

      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <div class="topbar-title">${curPage?.label || ''}</div>
            <div class="topbar-sub">
              <span class="role-dot"></span>
              ${isAdmin() ? 'Admin view' : 'Member view'}
            </div>
          </div>
          <div class="topbar-actions">
            ${isAdmin() && state.page === 'projects' ? `<button class="btn btn-primary btn-sm" id="btnNewProject">${I.plus} New Project</button>` : ''}
            ${isAdmin() && state.page === 'tasks'    ? `<button class="btn btn-primary btn-sm" id="btnNewTask">${I.plus} New Task</button>` : ''}
            ${isAdmin() && state.page === 'team'     ? `<button class="btn btn-secondary btn-sm" id="btnAddMember">${I.plus} Add to Project</button>` : ''}
            <button class="btn btn-ghost btn-sm" id="btnRefresh" title="Refresh">${I.refresh}</button>
          </div>
        </header>

        <div class="page" id="pageContent">
          ${renderPage()}
        </div>
      </div>
    </div>
  `;

  bindShell();
}

function renderPage() {
  switch (state.page) {
    case 'dashboard': return renderDashboard();
    case 'projects':  return renderProjects();
    case 'tasks':     return renderTasks();
    case 'team':      return renderTeam();
    default:          return renderDashboard();
  }
}

function bindShell() {
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('btnRefresh').addEventListener('click', loadApp);
  document.getElementById('btnNewProject')?.addEventListener('click', showCreateProject);
  document.getElementById('btnNewTask')?.addEventListener('click', showCreateTask);
  document.getElementById('btnAddMember')?.addEventListener('click', () => showAddMember());

  document.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { state.page = btn.dataset.page; renderApp(); });
  });

  bindPageEvents();
}

/* ── DASHBOARD ────────────────────────────────────────────────────────────── */

function renderDashboard() {
  const s = state.summary;

  const stats = [
    { label: 'Total Tasks',  value: s.total,      bg: '#eef2ff', color: '#6366f1' },
    { label: 'To Do',        value: s.todo,        bg: '#f0fdf4', color: '#16a34a' },
    { label: 'In Progress',  value: s.inProgress,  bg: '#fff7ed', color: '#d97706' },
    { label: 'Completed',    value: s.done,        bg: '#eff6ff', color: '#2563eb' },
    { label: 'Overdue',      value: s.overdue,     bg: '#fff1f2', color: '#e11d48' },
  ].map(c => `
    <div class="stat-card">
      <div class="stat-top">
        <div class="stat-label">${c.label}</div>
        <div class="stat-icon" style="background:${c.bg}">
          <svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="${c.color}"/></svg>
        </div>
      </div>
      <div class="stat-value" style="color:${c.color}">${c.value}</div>
    </div>
  `).join('');

  const recent = state.tasks.slice(0, 8).map(t => {
    const ov = t.status !== 'Done' && t.due_date < today();
    return `
      <div class="task-list-item">
        <div class="task-list-bar" style="background:${PRIO_COLOR[t.priority] || '#94a3b8'}"></div>
        <div class="task-list-info">
          <div class="task-list-title">${esc(t.title)}</div>
          <div class="task-list-sub">${esc(t.project_name || '')} · ${esc(t.assignee_name || 'Unassigned')}</div>
        </div>
        <div style="flex-shrink:0;text-align:right">
          ${statusBadge(t.status)}
          <div style="font-size:0.73rem;margin-top:3px;color:${ov ? 'var(--danger)' : 'var(--text-3)'};font-weight:${ov ? '700' : '400'}">${fmtDate(t.due_date)}</div>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:var(--text-3);font-size:0.9rem;padding:8px 0">No tasks yet.</p>';

  const projRows = state.projects.slice(0, 5).map(p => {
    const pt = state.tasks.filter(t => t.project_id === p.id);
    const done = pt.filter(t => t.status === 'Done').length;
    const pct = pt.length ? Math.round(done / pt.length * 100) : 0;
    const c = projColor(p.id);
    return `
      <div class="proj-dash-row">
        <div>
          <div class="proj-dash-name">${esc(p.name)}</div>
          <div class="proj-dash-sub">${pt.length} tasks · ${p.members?.length || 0} members</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:0.83rem;font-weight:700;color:${c}">${pct}%</div>
          <div class="mini-prog"><div class="mini-prog-bar" style="width:${pct}%;background:${c}"></div></div>
        </div>
      </div>
    `;
  }).join('') || '<p style="color:var(--text-3);font-size:0.88rem">No projects yet.</p>';

  return `
    <div class="stats-grid">${stats}</div>
    <div class="dash-grid">
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Recent Tasks</div>
          <button class="btn btn-ghost btn-sm" data-page="tasks">View all</button>
        </div>
        <div class="panel-body">${recent}</div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">Projects</div>
          <button class="btn btn-ghost btn-sm" data-page="projects">View all</button>
        </div>
        <div class="panel-body">${projRows}</div>
      </div>
    </div>
  `;
}

/* ── PROJECTS PAGE ────────────────────────────────────────────────────────── */

function renderProjects() {
  if (!state.projects.length) {
    return `<div class="empty-state"><p>No projects yet.${isAdmin() ? ' Use the <strong>New Project</strong> button above.' : ''}</p></div>`;
  }
  return `<div class="cards-grid">${state.projects.map(projCard).join('')}</div>`;
}

function projCard(p) {
  const pt = state.tasks.filter(t => t.project_id === p.id);
  const done = pt.filter(t => t.status === 'Done').length;
  const pct  = pt.length ? Math.round(done / pt.length * 100) : 0;
  const ov   = pt.filter(t => t.status !== 'Done' && t.due_date < today()).length;
  const c = projColor(p.id);

  const avHtml = (p.members || []).slice(0, 5).map(m =>
    `<div class="member-avatar" style="background:${avColor(m.name)}" title="${esc(m.name)}">${initials(m.name)}</div>`
  ).join('');
  const extra = Math.max(0, (p.members?.length || 0) - 5);

  return `
    <div class="proj-card">
      <div class="proj-card-accent" style="background:${c}"></div>
      <div class="proj-card-body">
        <div class="proj-card-title">${esc(p.name)}</div>
        <div class="proj-card-desc">${esc(p.description || 'No description')}</div>
        <div class="proj-stats">
          <span>${pt.length} tasks</span>
          <span>${done} done</span>
          ${ov ? `<span style="color:var(--danger);font-weight:600">${ov} overdue</span>` : ''}
        </div>
        ${pt.length ? `<div class="proj-progress"><div class="proj-progress-bar" style="width:${pct}%;background:${c}"></div></div>` : ''}
        <div class="proj-footer">
          <div class="member-avatars">
            ${avHtml}
            ${extra > 0 ? `<div class="member-avatar" style="background:var(--text-3)">+${extra}</div>` : ''}
          </div>
          ${isAdmin() ? `<button class="btn btn-secondary btn-sm" data-add-member="${p.id}">${I.plus} Member</button>` : ''}
        </div>
      </div>
    </div>
  `;
}

/* ── TASKS (KANBAN) PAGE ──────────────────────────────────────────────────── */

function renderTasks() {
  let tasks = state.tasks;
  if (state.taskFilter !== 'all') {
    tasks = tasks.filter(t => String(t.project_id) === String(state.taskFilter));
  }

  function col(status, dotColor) {
    const ct = tasks.filter(t => t.status === status);
    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <div class="kanban-col-title">
            <div class="col-dot" style="background:${dotColor}"></div>
            ${status}
          </div>
          <span class="col-count">${ct.length}</span>
        </div>
        <div class="kanban-col-body">
          ${ct.length ? ct.map(taskCard).join('') : `<div style="padding:20px;text-align:center;color:var(--text-3);font-size:0.84rem">No tasks</div>`}
        </div>
      </div>
    `;
  }

  return `
    <div class="filter-bar">
      <select id="taskFilter">
        <option value="all">All Projects</option>
        ${state.projects.map(p => `<option value="${p.id}" ${String(p.id) === String(state.taskFilter) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
      </select>
      <span style="font-size:0.84rem;color:var(--text-3)">${tasks.length} task${tasks.length !== 1 ? 's' : ''}</span>
    </div>
    <div class="kanban">
      ${col('Todo',        '#94a3b8')}
      ${col('In Progress', '#d97706')}
      ${col('Done',        '#10b981')}
    </div>
  `;
}

function taskCard(t) {
  const ov = t.status !== 'Done' && t.due_date < today();
  const pc = (t.priority || 'medium').toLowerCase();
  return `
    <div class="task-card task-priority-${pc}">
      <div class="task-card-title">${esc(t.title)}</div>
      <div class="task-card-project">${esc(t.project_name || `Project #${t.project_id}`)}</div>
      ${t.description ? `<div class="task-card-desc">${esc(t.description).slice(0, 90)}${t.description.length > 90 ? '…' : ''}</div>` : ''}
      <div class="task-card-meta">
        ${priorityBadge(t.priority)}
        <span class="badge badge-gray">${I.user} ${esc(t.assignee_name || 'Unassigned')}</span>
      </div>
      <div class="task-card-foot">
        <span class="${ov ? 'due-overdue' : 'due-normal'}">${I.clock} ${fmtDate(t.due_date)}${ov ? ' · Overdue' : ''}</span>
      </div>
      <select class="task-status-select" data-task-id="${t.id}">
        <option ${t.status === 'Todo'        ? 'selected' : ''}>Todo</option>
        <option ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
        <option ${t.status === 'Done'        ? 'selected' : ''}>Done</option>
      </select>
    </div>
  `;
}

/* ── TEAM PAGE ────────────────────────────────────────────────────────────── */

function renderTeam() {
  if (!state.users.length) return `<div class="empty-state"><p>No team members yet.</p></div>`;
  return `
    <div class="team-grid">
      ${state.users.map(u => `
        <div class="team-card">
          <div class="team-avatar" style="background:${avColor(u.name)}">${initials(u.name)}</div>
          <div class="team-info">
            <div class="team-name">${esc(u.name)}</div>
            <div class="team-email">${esc(u.email)}</div>
            ${roleBadge(u.role)}
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/* ── PAGE EVENT BINDING ───────────────────────────────────────────────────── */

function bindPageEvents() {
  document.querySelectorAll('[data-task-id]').forEach(sel => {
    sel.addEventListener('change', async e => {
      try {
        await api(`/api/tasks/${e.target.dataset.taskId}/status`, {
          method: 'PATCH', body: JSON.stringify({ status: e.target.value })
        });
        toast('Status updated', 'success');
        await loadApp();
      } catch (err) { toast(err.message, 'error'); }
    });
  });

  document.getElementById('taskFilter')?.addEventListener('change', e => {
    state.taskFilter = e.target.value;
    document.getElementById('pageContent').innerHTML = renderPage();
    bindPageEvents();
  });

  document.querySelectorAll('[data-add-member]').forEach(btn => {
    btn.addEventListener('click', () => showAddMember(btn.dataset.addMember));
  });
}

/* ── MODAL SYSTEM ─────────────────────────────────────────────────────────── */

function showModal(html) {
  $modalBox.innerHTML = html;
  $overlay.classList.remove('hidden');
  $overlay.onclick = e => { if (e.target === $overlay) closeModal(); };
  $modalBox.querySelector('#mClose')?.addEventListener('click', closeModal);
  $modalBox.querySelector('#mCancel')?.addEventListener('click', closeModal);
}

function closeModal() {
  $overlay.classList.add('hidden');
  $modalBox.innerHTML = '';
}

/* ── MODAL: CREATE PROJECT ────────────────────────────────────────────────── */

function showCreateProject() {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">New Project</div>
      <button class="modal-close" id="mClose">✕</button>
    </div>
    <form id="mForm">
      <div class="modal-body">
        <div class="field"><label>Project Name</label><input name="name" required minlength="2" placeholder="e.g. Mobile App Launch" autofocus /></div>
        <div class="field"><label>Description</label><textarea name="description" placeholder="Goals, scope, and notes…"></textarea></div>
        <p class="error-msg" id="mErr"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="mCancel">Cancel</button>
        <button type="submit" class="btn btn-primary">${I.plus} Create Project</button>
      </div>
    </form>
  `);
  document.getElementById('mForm').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api('/api/projects', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(e.currentTarget))) });
      closeModal(); toast('Project created!', 'success'); await loadApp();
    } catch (err) { document.getElementById('mErr').textContent = err.message; }
  });
}

/* ── MODAL: ADD MEMBER ────────────────────────────────────────────────────── */

function showAddMember(preProjectId = null) {
  showModal(`
    <div class="modal-header">
      <div class="modal-title">Add Team Member to Project</div>
      <button class="modal-close" id="mClose">✕</button>
    </div>
    <form id="mForm">
      <div class="modal-body">
        <div class="field">
          <label>Project</label>
          <select name="projectId" required>
            ${state.projects.map(p => `<option value="${p.id}" ${String(p.id) === String(preProjectId) ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>User</label>
          <select name="userId" required>
            ${state.users.map(u => `<option value="${u.id}">${esc(u.name)} (${esc(u.role)})</option>`).join('')}
          </select>
        </div>
        <p class="error-msg" id="mErr"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="mCancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Add Member</button>
      </div>
    </form>
  `);
  document.getElementById('mForm').addEventListener('submit', async e => {
    e.preventDefault();
    const { projectId, userId } = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await api(`/api/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId: Number(userId) }) });
      closeModal(); toast('Member added!', 'success'); await loadApp();
    } catch (err) { document.getElementById('mErr').textContent = err.message; }
  });
}

/* ── MODAL: CREATE TASK ───────────────────────────────────────────────────── */

function showCreateTask() {
  const firstProj = state.projects[0];
  const members = firstProj?.members?.length ? firstProj.members : state.users;

  showModal(`
    <div class="modal-header">
      <div class="modal-title">New Task</div>
      <button class="modal-close" id="mClose">✕</button>
    </div>
    <form id="mForm">
      <div class="modal-body">
        <div class="field">
          <label>Project</label>
          <select name="projectId" id="mTaskProj" required>
            ${state.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Task Title</label><input name="title" required minlength="2" placeholder="e.g. Prepare sprint review" autofocus /></div>
        <div class="field"><label>Description</label><textarea name="description" placeholder="Acceptance criteria, context…"></textarea></div>
        <div class="two-col">
          <div class="field">
            <label>Priority</label>
            <select name="priority"><option>Medium</option><option>High</option><option>Low</option></select>
          </div>
          <div class="field">
            <label>Status</label>
            <select name="status"><option>Todo</option><option>In Progress</option><option>Done</option></select>
          </div>
        </div>
        <div class="two-col">
          <div class="field"><label>Due Date</label><input name="dueDate" type="date" required value="${today()}" /></div>
          <div class="field">
            <label>Assignee</label>
            <select name="assigneeId" id="mAssignee">
              ${members.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('')}
            </select>
          </div>
        </div>
        <p class="error-msg" id="mErr"></p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" id="mCancel">Cancel</button>
        <button type="submit" class="btn btn-primary">${I.plus} Create Task</button>
      </div>
    </form>
  `);

  document.getElementById('mTaskProj').addEventListener('change', e => {
    const proj = state.projects.find(p => String(p.id) === e.target.value);
    const mbrs = proj?.members?.length ? proj.members : state.users;
    document.getElementById('mAssignee').innerHTML = mbrs.map(u => `<option value="${u.id}">${esc(u.name)}</option>`).join('');
  });

  document.getElementById('mForm').addEventListener('submit', async e => {
    e.preventDefault();
    const payload = Object.fromEntries(new FormData(e.currentTarget));
    payload.assigneeId = payload.assigneeId ? Number(payload.assigneeId) : null;
    try {
      await api('/api/tasks', { method: 'POST', body: JSON.stringify(payload) });
      closeModal(); toast('Task created!', 'success'); await loadApp();
    } catch (err) { document.getElementById('mErr').textContent = err.message; }
  });
}

/* ── TOAST ────────────────────────────────────────────────────────────────── */

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `${type === 'success' ? I.check : I.warn} ${esc(msg)}`;
  $toasts.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

/* ── BOOT ─────────────────────────────────────────────────────────────────── */

loadApp();
