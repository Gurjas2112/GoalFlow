<p align="center">
  <h1 align="center">🎯 GoalFlow</h1>
  <p align="center"><strong>In-House Goal Setting & Tracking Portal</strong></p>
  <p align="center">
    A structured, digital goal management system supporting the full lifecycle of employee goals — from creation and alignment to quarterly check-ins and performance visibility.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express" />
    <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql" />
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript" />
  </p>
</p>

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Architecture](#-solution-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Workflow](#-system-workflow)
- [User Roles & Permissions](#-user-roles--permissions)
- [Score Computation Engine](#-score-computation-engine)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Endpoints](#-api-endpoints)
- [Demo Credentials](#-demo-credentials)
- [Deployment](#-deployment)

---

## 🔍 Problem Statement

Organizations relying on manual or fragmented goal-tracking methods struggle with:

| Pain Point | Impact |
|---|---|
| **No alignment visibility** | Managers can't monitor team progress in real-time |
| **Spreadsheet chaos** | Employees lack clarity on how work connects to org priorities |
| **Manual review cycles** | HR teams piece together data at appraisal time |
| **No audit trail** | Post-lock changes go untracked |
| **Delayed escalations** | Overdue goals and missing check-ins are not flagged |

**GoalFlow** eliminates these blind spots with a structured, audit-ready digital portal.

---

## 🏗 Solution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GOALFLOW PORTAL                          │
├──────────────────┬──────────────────┬───────────────────────────┤
│   Employee View  │  Manager View    │      Admin View           │
│  ┌────────────┐  │  ┌────────────┐  │  ┌─────────────────────┐  │
│  │ Goal Sheet │  │  │ Team Goals │  │  │ Dashboard           │  │
│  │ Check-in   │  │  │ Review     │  │  │ User Management     │  │
│  └────────────┘  │  │ Approve    │  │  │ Cycle Configuration │  │
│                  │  │ Comment    │  │  │ Reports & Export    │  │
│                  │  └────────────┘  │  │ Analytics Charts    │  │
│                  │                  │  │ Audit Trail         │  │
│                  │                  │  │ Escalation Engine   │  │
│                  │                  │  └─────────────────────┘  │
├──────────────────┴──────────────────┴───────────────────────────┤
│                    React + Vite (Frontend)                       │
├─────────────────────────────────────────────────────────────────┤
│                    Express.js REST API                           │
├─────────────────────────────────────────────────────────────────┤
│                    Prisma ORM + PostgreSQL (Supabase)            │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🎯 Core (Must-Have)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Goal Sheet Lifecycle** | DRAFT → SUBMITTED → APPROVED/RETURNED → LOCKED |
| 2 | **Validation Engine** | Max 8 goals, min 10% weightage each, total = 100% |
| 3 | **4 UoM Types** | NUMERIC_MIN (higher=better), NUMERIC_MAX (lower=better), TIMELINE (date), ZERO (0=success) |
| 4 | **Score Computation** | Formula-based auto-scoring per UoM type |
| 5 | **Quarterly Check-ins** | Employees log actuals, managers review & comment |
| 6 | **Achievement Tracking** | Planned vs Actual with computed scores per quarter |
| 7 | **Audit Trail** | Every post-lock edit is logged with old/new values |
| 8 | **Role-Based Access** | Employee, Manager, Admin with distinct views |
| 9 | **Cycle Management** | Admin-configurable goal-setting and check-in windows |
| 10 | **CSV Export** | Download achievement reports as CSV |

### 🚀 Bonus Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Shared Goals** | Manager can push org-level KPIs to multiple employees |
| 2 | **Escalation Engine** | Configurable rules for overdue goals/check-ins |
| 3 | **Analytics Dashboard** | QoQ trends, department heatmap, goal distribution, manager effectiveness |
| 4 | **Cycle Override** | Admin can force-open any cycle for demo/testing |
| 5 | **Premium Dark UI** | Glassmorphism, gradient animations, micro-interactions |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + TypeScript | Component-based UI |
| **Bundler** | Vite 8 | Fast HMR dev server |
| **Routing** | React Router v7 | Client-side navigation |
| **Charts** | Recharts | Analytics visualizations |
| **HTTP Client** | Axios | API communication |
| **Backend** | Express.js 4 | REST API server |
| **ORM** | Prisma 6 | Type-safe database access |
| **Database** | PostgreSQL (Supabase) | Cloud-hosted relational DB |
| **Auth** | JWT (jsonwebtoken) | Stateless authentication |
| **Hashing** | bcryptjs | Password security |
| **Deployment** | Vercel | Frontend hosting |

---

## 🔄 System Workflow

### Phase 1: Goal Setting (Admin opens cycle)

```
Admin creates GOAL_SETTING cycle
         │
         ▼
Employee creates Goal Sheet ──► Adds 1-8 goals (10-100% weight each)
         │                              │
         │                    Validates: total = 100%, min 10%
         │                              │
         ▼                              ▼
Employee submits ──────────────► Status: SUBMITTED
         │
         ▼
Manager reviews ──┬──► Approve → Status: LOCKED ✅
                  │
                  └──► Return (with reason) → Status: RETURNED 🔄
                              │
                              ▼
                    Employee edits & resubmits
```

### Phase 2: Quarterly Check-in (Q1/Q2/Q3/Q4 cycles)

```
Admin opens Q1/Q2/Q3/Q4 cycle
         │
         ▼
Employee logs actual achievements ──► Score auto-computed
         │
         ▼
Manager reviews & adds comments ──► Check-in recorded
         │
         ▼
Repeat for each quarter
```

### Phase 3: Reporting & Analytics

```
Admin views ──┬──► Achievement Report (Planned vs Actual)
              ├──► Completion Dashboard (who's done, who's not)
              ├──► QoQ Trend Charts
              ├──► Department Heatmap
              ├──► Goal Distribution (by thrust area, UoM, status)
              ├──► Manager Effectiveness (check-in rates)
              └──► CSV Export for offline analysis
```

### Escalation Flow

```
Escalation rules fire automatically:
  ├── Goal not submitted after 7 days → Notify EMPLOYEE
  ├── Goal not submitted after 14 days → Notify MANAGER
  ├── Goal not approved after 5 days → Notify MANAGER
  ├── Goal not approved after 10 days → Notify ADMIN
  └── Check-in not done after 7 days → Notify EMPLOYEE
```

---

## 👤 User Roles & Permissions

| Action | Employee | Manager | Admin |
|--------|:--------:|:-------:|:-----:|
| Create goal sheet | ✅ | — | — |
| Add/edit/delete goals | ✅ (own, draft/returned) | ✅ (team, submitted) | ✅ (any) |
| Submit goal sheet | ✅ | — | — |
| Approve/return goals | — | ✅ (team) | ✅ (any) |
| Log achievements | ✅ | — | ✅ |
| Add check-in comments | — | ✅ | ✅ |
| View reports | — | ✅ (team) | ✅ (all) |
| View analytics | — | ✅ (limited) | ✅ (full) |
| Manage users | — | — | ✅ |
| Configure cycles | — | — | ✅ |
| View audit log | — | — | ✅ |
| Manage escalations | — | — | ✅ |
| Unlock locked sheets | — | — | ✅ |
| Push shared goals | — | ✅ | ✅ |

---

## 📊 Score Computation Engine

The system supports 4 Units of Measurement with formula-based scoring:

### 1. NUMERIC_MIN (Higher is Better)
```
Score = min(actual / target, 1.0)

Example: Target = 1,000,000 revenue, Actual = 850,000
Score = 850,000 / 1,000,000 = 0.85 (85%)
```

### 2. NUMERIC_MAX (Lower is Better)
```
Score = min(target / actual, 1.0)

Example: Target = 24 hours TAT, Actual = 28 hours
Score = 24 / 28 = 0.857 (85.7%)
```

### 3. TIMELINE (Date-based)
```
If completed on or before deadline: Score = 1.0
If completed after deadline:
  Score = max(1 - (daysLate / totalDays), 0)

Example: Deadline = Sep 30, Completed = Oct 15
Score = max(1 - (15 / totalDays), 0)
```

### 4. ZERO (Zero = Success)
```
If actual == 0: Score = 1.0
Else: Score = max(1 - (actual * 0.2), 0)

Example: Zero incidents target, Actual = 2 incidents
Score = max(1 - (2 × 0.2), 0) = 0.6 (60%)
```

### Weighted Overall Score
```
Overall = Σ (goal_score × goal_weightage) / 100
```

---

## 📁 Project Structure

```
GoalFlow/
├── apps/
│   ├── api/                    # Express.js Backend
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── prisma.ts       # Prisma client singleton
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts     # JWT auth + RBAC middleware
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts     # Login, /me
│   │   │   │   ├── users.ts    # User CRUD, team listing
│   │   │   │   ├── goalSheets.ts # Sheet lifecycle
│   │   │   │   ├── goals.ts    # Goal CRUD + shared goals
│   │   │   │   ├── achievements.ts # Achievement tracking
│   │   │   │   ├── checkIns.ts # Manager check-in comments
│   │   │   │   ├── cycles.ts   # Cycle management
│   │   │   │   ├── reports.ts  # Achievement + completion reports
│   │   │   │   ├── audit.ts    # Audit log viewer
│   │   │   │   ├── escalations.ts # Escalation rules + events
│   │   │   │   └── analytics.ts # QoQ, heatmap, distribution
│   │   │   └── utils/
│   │   │       ├── audit.ts    # Audit log writer
│   │   │       └── scoreCompute.ts # Score computation engine
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                    # React Frontend
│       ├── src/
│       │   ├── main.tsx        # App entry
│       │   ├── App.tsx         # Router + layout
│       │   ├── index.css       # Design system
│       │   ├── lib/
│       │   │   └── api.ts      # Axios client
│       │   ├── context/
│       │   │   └── AuthContext.tsx # Auth state management
│       │   ├── components/
│       │   │   ├── Shared.tsx  # Badges, meters, modals
│       │   │   └── Sidebar.tsx # Navigation sidebar
│       │   └── pages/
│       │       ├── LoginPage.tsx
│       │       ├── EmployeeGoalsPage.tsx
│       │       ├── EmployeeCheckInPage.tsx
│       │       ├── ManagerTeamPage.tsx
│       │       ├── ManagerReviewPage.tsx
│       │       ├── AdminDashboardPage.tsx
│       │       ├── AdminUsersPage.tsx
│       │       ├── AdminCyclesPage.tsx
│       │       ├── AdminReportsPage.tsx
│       │       ├── AdminAnalyticsPage.tsx
│       │       ├── AdminAuditPage.tsx
│       │       └── AdminEscalationsPage.tsx
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared types & validation
│       └── src/index.ts
│
├── prisma/
│   ├── schema.prisma           # Database schema (13 models)
│   ├── seed.ts                 # Demo data seeder
│   └── migrations/             # SQL migrations
│
├── .env                        # Environment variables
└── package.json                # Workspace root
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** (via Supabase or local)

### 1. Clone & Install

```bash
git clone https://github.com/Gurjas2112/GoalFlow.git
cd GoalFlow
npm install
cd apps/web && npm install && cd ../..
```

### 2. Configure Environment

Create `.env` in the project root:

```env
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
PORT=4000
FRONTEND_URL="http://localhost:5173"
```

### 3. Setup Database

```bash
# Run migration
npx prisma migrate dev --name init

# Generate client
npx prisma generate

# Seed demo data
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 4. Start Development Servers

```bash
# Terminal 1: API Server (port 4000)
cd apps/api
npx ts-node --transpile-only --compiler-options '{"module":"CommonJS"}' src/index.ts

# Terminal 2: Frontend (port 5173)
cd apps/web
npm run dev
```

### 5. Open App

Navigate to **http://localhost:5173** and use the quick-login buttons.

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |

### Goal Sheets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goal-sheets/my` | Get own sheet |
| GET | `/api/goal-sheets/team` | Get team sheets (Manager/Admin) |
| GET | `/api/goal-sheets/:id` | Get specific sheet |
| POST | `/api/goal-sheets` | Create new sheet |
| POST | `/api/goal-sheets/:id/submit` | Submit for approval |
| POST | `/api/goal-sheets/:id/approve` | Approve & lock |
| POST | `/api/goal-sheets/:id/return` | Return for rework |
| POST | `/api/goal-sheets/:id/unlock` | Admin unlock |

### Goals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/goals` | Add goal to sheet |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| POST | `/api/goals/shared` | Push shared goal |

### Achievements & Check-ins
| Method | Endpoint | Description |
|--------|----------|-------------|
| PUT | `/api/achievements/:goalId` | Log achievement |
| GET | `/api/achievements/sheet/:sheetId` | Get sheet achievements |
| POST | `/api/check-ins` | Add check-in comment |
| GET | `/api/check-ins/:goalSheetId` | Get check-in history |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| GET/POST | `/api/cycles` | Manage cycles |
| GET | `/api/reports/achievement` | Achievement report |
| GET | `/api/reports/achievement/export` | CSV export |
| GET | `/api/audit` | Audit log |
| GET | `/api/analytics/*` | Analytics data |
| GET/PUT | `/api/escalations/*` | Escalation management |

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | `admin@goalflow.demo` | `Admin@123` | Full system access |
| **Manager** | `manager@goalflow.demo` | `Manager@123` | Team oversight & approvals |
| **Employee 1** | `emp1@goalflow.demo` | `Emp@123` | Locked goals (check-in ready) |
| **Employee 2** | `emp2@goalflow.demo` | `Emp@123` | Draft goals (creation demo) |

---

## 🌐 Deployment

- **Frontend**: Deployed on [Vercel](https://goal-flow-theta.vercel.app)
- **Database**: Supabase PostgreSQL (ap-south-1)
- **API**: Express.js backend

---

## 📄 License

Built for **AtomQuest Hackathon 2026** by [Gurjas Gandhi](https://github.com/Gurjas2112).
