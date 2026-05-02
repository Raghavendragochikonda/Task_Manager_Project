# TaskFlow — Team Task Manager

A full-stack team productivity app with JWT authentication, Admin/Member role-based access control, project & task management, and a live dashboard — built with Node.js, Express, SQLite, and vanilla JavaScript.

> **Live Demo:** *(add your Railway URL here after deployment)*
> **GitHub Repo:** *(add your GitHub repo link here)*
> **Demo Video:** *(add your 2–5 min Loom/YouTube link here)*

---

## Screenshots

> *(Add screenshots after deployment — auth screen, dashboard, kanban board, projects)*

---

## Features

| Feature | Details |
|---|---|
| **Authentication** | Signup / Login with JWT (7-day tokens), bcrypt password hashing |
| **Role-Based Access** | First user auto-becomes Admin; subsequent users choose Admin or Member |
| **Projects** | Admins create projects; members are added per-project |
| **Task Management** | Create tasks with title, description, priority (Low/Medium/High), due date, assignee |
| **Kanban Board** | Three-column view: Todo → In Progress → Done; any member can update status |
| **Dashboard** | Live stats: Total, Todo, In Progress, Completed, Overdue counts |
| **Team View** | All registered users with roles |
| **Validations** | Zod schema validation on every API endpoint |
| **Security** | Helmet.js headers, CORS, foreign-key enforcement in SQLite |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ |
| Framework | Express 5 |
| Database | SQLite via `better-sqlite3` |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` |
| Validation | Zod |
| Frontend | Vanilla HTML, CSS, JavaScript (SPA) |
| Deployment | Railway (Nixpacks) |

---

## Local Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd raghu_project

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env

# 4. Start the server
npm start
```

Open **http://localhost:3000**

### Dev mode (auto-restart on file changes)

```bash
npm run dev
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the server listens on |
| `JWT_SECRET` | *(required)* | Secret key for signing JWT tokens — use a long random string in production |
| `DB_PATH` | `./data/team-task-manager.sqlite` | Path to the SQLite database file |

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | No | Create account |
| POST | `/api/auth/login` | No | Login, receive JWT |
| GET | `/api/me` | Yes | Get current user |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Yes | List all users |

### Projects
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/projects` | Yes | All |
| POST | `/api/projects` | Yes | Admin only |
| POST | `/api/projects/:id/members` | Yes | Admin only |
| DELETE | `/api/projects/:id/members/:userId` | Yes | Admin only |

### Tasks
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| GET | `/api/tasks` | Yes | All |
| POST | `/api/tasks` | Yes | Admin only |
| PATCH | `/api/tasks/:id/status` | Yes | All (project members) |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard` | Yes | Summary stats |

---

## Database Schema

```
users          → id, name, email, password_hash, role, created_at
projects       → id, name, description, created_by, created_at
project_members→ project_id, user_id, role (Owner/Member), joined_at
tasks          → id, project_id, title, description, status, priority,
                 due_date, assignee_id, created_by, created_at, updated_at
```

---

## Deployment on Railway

### Step-by-step

**1. Push code to GitHub**
```bash
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

**2. Create Railway project**
- Go to [railway.app](https://railway.app) → **New Project**
- Select **Deploy from GitHub repo**
- Authorize Railway and pick your repository

**3. Set environment variables in Railway**

In your Railway project → **Variables** tab, add:

| Key | Value |
|---|---|
| `JWT_SECRET` | A long random string, e.g. `openssl rand -hex 32` output |
| `DB_PATH` | `/app/data/team-task-manager.sqlite` |

> `PORT` is set automatically by Railway — do not override it.

**4. Deploy**
- Railway auto-detects Node.js via Nixpacks and runs `npm start`
- Watch the build logs — deployment takes ~1–2 minutes
- Once done, click **Generate Domain** to get your public URL

**5. Verify**
- Open your Railway URL
- Sign up (first user = Admin)
- Create a project, add members, create tasks, check dashboard

### railway.json (already included)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Role-Based Access Control

| Action | Admin | Member |
|---|---|---|
| Create project | ✅ | ❌ |
| Add member to project | ✅ | ❌ |
| Create task | ✅ | ❌ |
| View own projects | ✅ | ✅ |
| Update task status | ✅ | ✅ (project members only) |
| View dashboard | ✅ (all tasks) | ✅ (own projects only) |
| View team | ✅ | ✅ |

---

## How the App Works (Demo Flow)

1. **Sign up** as the first user → automatically becomes **Admin**
2. Open another browser/incognito → sign up as a **Member**
3. As Admin:
   - Create a **project** (e.g. "Mobile App Launch")
   - Add the Member user to the project
   - Create **tasks** with priorities, due dates, assignees
4. As Member: view assigned tasks on the Kanban board, update status
5. Check the **Dashboard** for live stats and overdue count

---

## Submission Checklist

- [ ] App deployed and live on Railway
- [ ] GitHub repo is public with this README
- [ ] Demo video recorded (2–5 min) showing signup, project creation, task assignment, dashboard
- [ ] Live URL, GitHub link, and video link submitted
