/**
 * TaskFlow — Demo Seed Script
 * Run: node scripts/seed-demo.js
 *
 * Requires the server to be running on http://localhost:3000
 * Creates: 2 users, 3 projects, 8 tasks with varied statuses
 */

const BASE = 'http://localhost:3000';

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`${path} → ${data.error || res.status}`);
  return data;
}

async function get(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`GET ${path} → ${data.error || res.status}`);
  return data;
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

async function run() {
  console.log('\n🚀  TaskFlow Demo Seed Script\n');
  console.log('   Connecting to', BASE, '...\n');

  // ── Check server health ────────────────────────────────────────────────────
  try {
    const res = await fetch(`${BASE}/api/health`);
    if (!res.ok) throw new Error();
  } catch {
    console.error('❌  Server is not running. Start it first: npm start\n');
    process.exit(1);
  }

  // ── 1. Sign up Admin ───────────────────────────────────────────────────────
  console.log('📝  Creating Admin user...');
  let adminToken, adminId, memberId;
  try {
    const { token, user } = await post('/api/auth/signup', {
      name: 'Raghu Admin',
      email: 'admin@taskflow.demo',
      password: 'Admin@123',
      role: 'Admin'
    });
    adminToken = token;
    adminId = user.id;
    console.log('   ✅ Admin created  →  admin@taskflow.demo  /  Admin@123');
  } catch (e) {
    if (e.message.includes('already registered')) {
      console.log('   ⚠️  Admin already exists — logging in...');
      const { token, user } = await post('/api/auth/login', {
        email: 'admin@taskflow.demo',
        password: 'Admin@123'
      });
      adminToken = token;
      adminId = user.id;
      console.log('   ✅ Logged in as Admin');
    } else throw e;
  }

  // ── 2. Sign up Member ──────────────────────────────────────────────────────
  console.log('📝  Creating Member user...');
  try {
    const { user } = await post('/api/auth/signup', {
      name: 'Priya Member',
      email: 'member@taskflow.demo',
      password: 'Member@123',
      role: 'Member'
    });
    memberId = user.id;
    console.log('   ✅ Member created  →  member@taskflow.demo  /  Member@123');
  } catch (e) {
    if (e.message.includes('already registered')) {
      console.log('   ⚠️  Member already exists — fetching id...');
      const { users } = await get('/api/users', adminToken);
      const m = users.find(u => u.email === 'member@taskflow.demo');
      memberId = m?.id;
      console.log('   ✅ Member found:', memberId);
    } else throw e;
  }

  // ── 3. Create Projects ─────────────────────────────────────────────────────
  console.log('\n📁  Creating Projects...');

  const p1 = await post('/api/projects', {
    name: 'Mobile App Launch',
    description: 'End-to-end development and launch of the TaskFlow mobile application for iOS and Android.'
  }, adminToken).then(d => d.project).catch(() => null);

  const p2 = await post('/api/projects', {
    name: 'Website Redesign',
    description: 'Revamp the marketing website with new brand identity, animations and CMS integration.'
  }, adminToken).then(d => d.project).catch(() => null);

  const p3 = await post('/api/projects', {
    name: 'Q3 Sprint Planning',
    description: 'Planning and execution of engineering deliverables for the Q3 product sprint cycle.'
  }, adminToken).then(d => d.project).catch(() => null);

  const projects = [p1, p2, p3].filter(Boolean);
  console.log(`   ✅ Created ${projects.length} projects`);

  // ── 4. Add Member to all projects ─────────────────────────────────────────
  console.log('\n👥  Adding Member to projects...');
  for (const p of projects) {
    try {
      await post(`/api/projects/${p.id}/members`, { userId: memberId }, adminToken);
    } catch {}
  }
  console.log('   ✅ Priya Member added to all projects');

  // ── 5. Fetch updated project list (for correct IDs) ───────────────────────
  const { projects: allProjects } = await get('/api/projects', adminToken);
  const proj = (name) => allProjects.find(p => p.name === name);

  // ── 6. Create Tasks ────────────────────────────────────────────────────────
  console.log('\n✅  Creating Tasks...');

  const tasks = [
    // Mobile App Launch
    { projectId: proj('Mobile App Launch')?.id, title: 'Design onboarding screens', description: 'Create Figma mockups for 5 onboarding screens including splash, login, signup, permissions, and home.', status: 'Done', priority: 'High', dueDate: daysFromNow(-5), assigneeId: memberId },
    { projectId: proj('Mobile App Launch')?.id, title: 'Implement push notifications', description: 'Integrate Firebase Cloud Messaging for iOS and Android. Handle foreground and background states.', status: 'In Progress', priority: 'High', dueDate: daysFromNow(2), assigneeId: memberId },
    { projectId: proj('Mobile App Launch')?.id, title: 'App Store submission', description: 'Prepare screenshots, app description, privacy policy and submit to App Store and Play Store.', status: 'Todo', priority: 'Medium', dueDate: daysFromNow(10), assigneeId: adminId },

    // Website Redesign
    { projectId: proj('Website Redesign')?.id, title: 'Create new brand guidelines', description: 'Define color palette, typography, logo usage, and component library for the rebrand.', status: 'Done', priority: 'High', dueDate: daysFromNow(-3), assigneeId: memberId },
    { projectId: proj('Website Redesign')?.id, title: 'Build landing page', description: 'Implement the new hero section, features grid, pricing table, and CTA using Next.js.', status: 'In Progress', priority: 'High', dueDate: daysFromNow(3), assigneeId: memberId },
    { projectId: proj('Website Redesign')?.id, title: 'SEO audit and fixes', description: 'Run Lighthouse audit, fix performance issues, add meta tags, structured data, and sitemap.', status: 'Todo', priority: 'Low', dueDate: daysFromNow(-1), assigneeId: adminId },

    // Q3 Sprint
    { projectId: proj('Q3 Sprint Planning')?.id, title: 'Sprint retrospective report', description: 'Document Q2 sprint outcomes, velocity metrics, blockers, and improvement actions for Q3.', status: 'Done', priority: 'Medium', dueDate: daysFromNow(-7), assigneeId: adminId },
    { projectId: proj('Q3 Sprint Planning')?.id, title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing, staging deploy, and production release workflow.', status: 'Todo', priority: 'High', dueDate: daysFromNow(-2), assigneeId: memberId },
  ];

  let created = 0;
  for (const t of tasks) {
    if (!t.projectId) continue;
    try {
      await post('/api/tasks', t, adminToken);
      created++;
    } catch (e) {
      console.log('   ⚠️  Skipped task:', t.title, '—', e.message);
    }
  }
  console.log(`   ✅ Created ${created} tasks`);

  // ── Done ───────────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🎉  DEMO DATA READY — Record Now!               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🌐  Open:  http://localhost:3000                            ║
║                                                              ║
║  👑  ADMIN LOGIN                                             ║
║      Email   :  admin@taskflow.demo                          ║
║      Password:  Admin@123                                    ║
║                                                              ║
║  👤  MEMBER LOGIN  (use incognito window)                    ║
║      Email   :  member@taskflow.demo                         ║
║      Password:  Member@123                                   ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  📹  DEMO VIDEO SCRIPT (2–5 min)                             ║
║                                                              ║
║  1. Open http://localhost:3000 → Log in as Admin             ║
║  2. Show Dashboard  → stats cards (total, overdue, done)     ║
║  3. Go to Projects  → 3 project cards with progress bars     ║
║  4. Go to Tasks     → Kanban board (Todo/In Progress/Done)   ║
║  5. Change a task status using the dropdown on a task card   ║
║  6. Go to Team      → 2 members with role badges             ║
║  7. Open incognito  → Log in as Member                       ║
║  8. Show Member view — limited to their assigned tasks       ║
║  9. Update a task status as Member                           ║
║  10. Back to Admin  → Dashboard shows updated counts         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

run().catch(e => {
  console.error('\n❌  Seed failed:', e.message, '\n');
  process.exit(1);
});
