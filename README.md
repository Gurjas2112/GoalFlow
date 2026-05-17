<p align="center">
  <h1 align="center">🎯 GoalFlow</h1>
  <p align="center"><strong>In-House Goal Setting & Tracking Portal</strong></p>
  <p align="center">
    A structured, digital goal management system supporting the full lifecycle of employee goals — from creation and alignment to quarterly check-ins and performance visibility.
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" />
    <img src="https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express" />
    <img src="https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=flat-square&logo=postgresql" />
    <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript" />
    <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker" />
    <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" />
  </p>
  <p align="center">
    <a href="https://goal-flow-theta.vercel.app"><strong>🌐 Live Demo</strong></a> · 
    <a href="#-demo-credentials"><strong>🔑 Demo Login</strong></a> · 
    <a href="#-docker-containerization"><strong>🐳 Docker</strong></a>
  </p>
</p>

---

## 📋 Table of Contents

- [Live Demo](#-live-demo)
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
- [Docker Containerization](#-docker-containerization)
- [Azure AD SSO Setup](#-azure-ad--microsoft-entra-id-sso-setup)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | [goal-flow-theta.vercel.app](https://goal-flow-theta.vercel.app) |
| **Homepage** | [goal-flow-theta.vercel.app/](https://goal-flow-theta.vercel.app/) |
| **Login** | [goal-flow-theta.vercel.app/login](https://goal-flow-theta.vercel.app/login) |

> **Quick Start:** Visit the homepage → click a demo account button → auto-login to any role!

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
| 1 | **Microsoft Entra ID SSO** | Azure AD login via MSAL with auto-provisioning and group→role mapping |
| 2 | **Email Notifications** | SendGrid-powered emails on goal submit, approve, and return events |
| 3 | **Teams Integration** | Webhook adaptive cards with deep-link navigation to goal sheets |
| 4 | **Escalation Engine** | Configurable rules for overdue goals/check-ins with resolution workflow |
| 5 | **Analytics Dashboard** | QoQ trends, department heatmap, goal distribution, manager effectiveness |
| 6 | **Shared Goals** | Manager can push org-level KPIs to multiple employees |
| 7 | **Cycle Override** | Admin can force-open any cycle for demo/testing |
| 8 | **Premium Dark UI** | Glassmorphism, gradient animations, micro-interactions |
| 9 | **Landing Page** | Stunning homepage with hero, features, testimonials, FAQ |
| 10 | **Signup Flow** | Multi-step registration with password strength indicator |
| 11 | **Docker Containerization** | Multi-stage builds, Node 22 Alpine, Nginx + health checks |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + TypeScript 6 | Component-based UI |
| **Bundler** | Vite 8 + Rolldown | Lightning-fast builds |
| **Routing** | React Router v7 | Client-side SPA navigation |
| **Charts** | Recharts 3 | Analytics visualizations |
| **HTTP Client** | Axios | API communication |
| **SSO** | MSAL.js (@azure/msal-browser) | Azure AD OAuth2 popup login |
| **Backend** | Express.js 4 | REST API server |
| **ORM** | Prisma 6 | Type-safe database access |
| **Database** | PostgreSQL 16 (Supabase) | Cloud-hosted relational DB |
| **Auth** | JWT + Microsoft Entra ID | Stateless auth + SSO |
| **Hashing** | bcryptjs | Password security |
| **Email** | SendGrid API | Transactional email notifications |
| **Teams** | Incoming Webhooks | Adaptive card notifications |
| **Containers** | Docker + docker-compose | Multi-stage production builds |
| **Deployment** | Vercel + Railway | Frontend CDN + API hosting |

---

## 🔄 System Workflow

### End-to-End User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        GOALFLOW USER JOURNEY                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  🌐 VISITOR                                                             │
│  ├── Lands on Homepage (/) → sees features, stats, testimonials, FAQ    │
│  ├── Clicks "Get Started Free" → Signup (/signup)                       │
│  ├── Clicks "Try Demo" → Login (/login) with demo account pre-fill      │
│  └── Clicks demo role button → auto-fills credentials on login page     │
│                                                                         │
│  📝 SIGNUP FLOW                                                         │
│  ├── Enter name, email, department, password                            │
│  ├── Password strength indicator validates in real-time                 │
│  ├── Account created → success page with next steps                     │
│  └── Redirects to Login                                                 │
│                                                                         │
│  🔐 LOGIN                                                               │
│  ├── Email/Password login (JWT auth)                                    │
│  ├── Microsoft SSO popup (Azure AD — auto-appears if configured)        │
│  ├── Quick Demo Access: 4 pre-configured accounts                       │
│  └── Redirects to role-appropriate dashboard                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

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
         │                       📧 Email → Manager
         │                       💬 Teams → Manager channel
         ▼
Manager reviews ──┬──► Approve → Status: LOCKED ✅
                  │              📧 Email → Employee
                  │              💬 Teams → notification
                  └──► Return (with reason) → Status: RETURNED 🔄
                              │              📧 Email → Employee
                              ▼
                    Employee edits & resubmits
```

### Phase 2: Quarterly Check-in (Q1/Q2/Q3/Q4 cycles)

```
Admin opens Q1/Q2/Q3/Q4 cycle
         │
         ▼
Employee logs actual achievements ──► Score auto-computed per UoM type
         │                              ├── NUMERIC_MIN: actual/target
         │                              ├── NUMERIC_MAX: target/actual
         │                              ├── TIMELINE: date comparison
         │                              └── ZERO: 0=100%, penalty per unit
         ▼
Manager reviews & adds comments ──► Check-in recorded with timestamp
         │
         ▼
Weighted overall score = Σ (goal_score × goal_weightage) / 100
```

### Phase 3: Reporting & Analytics

```
Admin views ──┬──► Achievement Report (Planned vs Actual per employee)
              ├──► Completion Dashboard (who's done, who's pending)
              ├──► QoQ Trend Charts (line chart across quarters)
              ├──► Department Heatmap (color-coded performance grid)
              ├──► Goal Distribution (by thrust area, UoM, status)
              ├──► Manager Effectiveness (check-in completion rates)
              └──► CSV Export for offline analysis / HR integration
```

### Escalation Flow

```
Escalation rules fire automatically:
  ├── Goal not submitted after 7 days  → 📧 Notify EMPLOYEE
  ├── Goal not submitted after 14 days → 📧 Notify MANAGER
  ├── Goal not approved after 5 days   → 📧 Notify MANAGER
  ├── Goal not approved after 10 days  → 📧 Notify ADMIN
  └── Check-in not done after 7 days   → 📧 Notify EMPLOYEE

Admin can view, acknowledge, and resolve escalation events.
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
│   │   │   │   ├── sso.ts      # Azure AD SSO endpoint
│   │   │   │   ├── users.ts    # User CRUD, team listing
│   │   │   │   ├── goalSheets.ts # Sheet lifecycle + notifications
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
│   │   │       ├── notify.ts   # SendGrid + Teams webhooks
│   │   │       └── scoreCompute.ts # Score computation engine
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                    # React Frontend
│       ├── public/
│       │   ├── logo.png        # GoalFlow brand logo
│       │   ├── favicon.svg     # Browser tab icon
│       │   └── icons.svg       # Sprite icons
│       ├── src/
│       │   ├── main.tsx        # App entry
│       │   ├── App.tsx         # Router + layout
│       │   ├── index.css       # Design system (487 lines)
│       │   ├── lib/
│       │   │   ├── api.ts      # Axios client
│       │   │   └── msalConfig.ts # Azure AD MSAL configuration
│       │   ├── context/
│       │   │   └── AuthContext.tsx # Auth state management
│       │   ├── components/
│       │   │   ├── Shared.tsx  # Badges, meters, modals
│       │   │   └── Sidebar.tsx # Navigation sidebar + logo
│       │   └── pages/
│       │       ├── HomePage.tsx           # 🏠 Public landing page
│       │       ├── LoginPage.tsx          # 🔐 Login + SSO + demo access
│       │       ├── SignupPage.tsx         # 📝 Registration flow
│       │       ├── EmployeeGoalsPage.tsx  # 📋 Goal sheet management
│       │       ├── EmployeeCheckInPage.tsx # ✅ Achievement logging
│       │       ├── ManagerTeamPage.tsx    # 👥 Team oversight
│       │       ├── ManagerReviewPage.tsx  # 📊 Sheet review + approval
│       │       ├── AdminDashboardPage.tsx # 📊 Admin overview
│       │       ├── AdminUsersPage.tsx     # 👤 User management
│       │       ├── AdminCyclesPage.tsx    # 🔄 Cycle configuration
│       │       ├── AdminReportsPage.tsx   # 📈 Reports + CSV export
│       │       ├── AdminAnalyticsPage.tsx # 📉 Charts + heatmaps
│       │       ├── AdminAuditPage.tsx     # 🔍 Audit trail viewer
│       │       ├── AdminEscalationsPage.tsx # ⚠️ Escalation mgmt
│       │       ├── AdminScoringDemoPage.tsx # 💯 Score calculator
│       │       └── AdminNotificationsPage.tsx # 📧 Notification settings
│       ├── Dockerfile          # Multi-stage: Node 22 → Nginx
│       ├── nginx.conf          # SPA routing + API proxy
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
├── docker-compose.yml          # 3-container orchestration
├── .env                        # Environment variables
├── .env.docker                 # Docker-specific env (gitignored)
└── package.json                # Workspace root (3 workspaces)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 20.19 (recommended: 22 LTS)
- **npm** ≥ 10
- **PostgreSQL** (via Supabase or local)
- **Docker** (optional, for containerized deployment)

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
# Database (Supabase)
DATABASE_URL="postgresql://user:password@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/postgres"

# Auth
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
FRONTEND_URL="http://localhost:5173"
APP_BASE_URL="http://localhost:5173"

# Azure AD SSO (optional — SSO button auto-appears when configured)
AZURE_CLIENT_ID="your-azure-app-client-id"
AZURE_CLIENT_SECRET="your-azure-client-secret"
AZURE_TENANT_ID="your-azure-tenant-id"
AZURE_GROUP_ADMIN="object-id-of-GoalFlow-Admins-group"
AZURE_GROUP_MANAGER="object-id-of-GoalFlow-Managers-group"
AZURE_GROUP_EMPLOYEE="object-id-of-GoalFlow-Employees-group"

# Email Notifications (optional)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@goalflow.demo"

# Teams Notifications (optional)
TEAMS_WEBHOOK_URL="your-teams-incoming-webhook-url"
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

### Authentication & SSO
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/sso` | Azure AD SSO login (auto-provisions users) |

### Goal Sheets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goal-sheets/my` | Get own sheet |
| GET | `/api/goal-sheets/team` | Get team sheets (Manager/Admin) |
| GET | `/api/goal-sheets/:id` | Get specific sheet |
| POST | `/api/goal-sheets` | Create new sheet |
| POST | `/api/goal-sheets/:id/submit` | Submit for approval (📧 notifies manager) |
| POST | `/api/goal-sheets/:id/approve` | Approve & lock (📧 notifies employee) |
| POST | `/api/goal-sheets/:id/return` | Return for rework (📧 notifies employee) |
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

| Layer | Service | URL |
|-------|---------|-----|
| **Frontend** | Vercel | [goal-flow-theta.vercel.app](https://goal-flow-theta.vercel.app) |
| **Database** | Supabase PostgreSQL | ap-south-1 (Mumbai) |
| **API** | Railway / Express.js | Backend hosting |

### Deployment Cost (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free | $0 |
| Vercel | Free | $0 |
| Railway | Hobby | $5 |
| Azure AD | Free | $0 |
| SendGrid | Free (100 emails/day) | $0 |
| GitHub | Free | $0 |
| **Total** | | **$5/month** |

---

## 🔐 Microsoft Entra ID (Azure AD) SSO Setup

1. **Create App Registration** at [portal.azure.com](https://portal.azure.com) → Microsoft Entra ID → App registrations
2. Set redirect URI: `http://localhost:5173` (dev) + your Vercel URL (prod)
3. Add API permissions: `User.Read`, `User.ReadBasic.All`, `Directory.Read.All`
4. Create 3 security groups: `GoalFlow-Admins`, `GoalFlow-Managers`, `GoalFlow-Employees`
5. Enable group claims in Token configuration
6. Add env vars (`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, group Object IDs) to your API
7. Add `VITE_AZURE_CLIENT_ID` and `VITE_AZURE_TENANT_ID` to Vercel
8. The **"Sign in with Microsoft"** button auto-appears on the login page

### SSO Flow
```
User clicks "Sign in with Microsoft"
        │
        ▼
MSAL popup → Microsoft login
        │
        ▼
Access token sent to /api/auth/sso
        │
        ▼
Backend validates → maps groups to roles
        │
        ▼
User auto-provisioned if new → JWT issued
        │
        ▼
Redirects to role-appropriate dashboard
```

---

## 📧 Email & Teams Notifications

### Events that trigger notifications:

| Event | Email (SendGrid) | Teams (Webhook) | Recipient |
|-------|:-:|:-:|---|
| Goal sheet submitted | ✅ | ✅ | Manager |
| Goal sheet approved | ✅ | ✅ | Employee |
| Goal sheet returned | ✅ | ✅ | Employee |
| Check-in reminder | ✅ | — | Employee |

### SendGrid Email Setup

1. Go to [sendgrid.com](https://sendgrid.com) → Sign up (free tier: 100 emails/day)
2. Navigate to **Settings → API Keys → Create API Key**
   - Name: `GoalFlow`
   - Permissions: **Restricted Access** → enable **Mail Send → Full Access**
3. Copy the API key (shown only once)
4. Add to your `.env`:
   ```env
   SENDGRID_API_KEY="SG.xxxxxxxxxxxxxxxxxxxxx"
   SENDGRID_FROM_EMAIL="noreply@goalflow.demo"
   ```
5. *(Optional)* Verify a sender identity under **Settings → Sender Authentication** for production use

### Microsoft Teams Webhook Setup

1. Open **Microsoft Teams** → go to the channel where you want notifications
2. Click the **⋯ (three dots)** next to the channel name → **Connectors** (or **Manage channel → Connectors**)
3. Search for **"Incoming Webhook"** → click **Configure**
4. Set the webhook name: `GoalFlow Bot`
5. *(Optional)* Upload an icon for the bot
6. Click **Create** → a webhook URL is generated:
   ```
   https://xxxxx.webhook.office.com/webhookb2/xxxx/IncomingWebhook/xxxx/xxxx
   ```
7. **Copy the URL** and add it to your `.env`:
   ```env
   TEAMS_WEBHOOK_URL="https://xxxxx.webhook.office.com/webhookb2/xxxx/IncomingWebhook/xxxx/xxxx"
   ```
8. Click **Done** in Teams

### What notifications look like in Teams:

```
┌──────────────────────────────────────┐
│ 🎯 GoalFlow: Goals Submitted        │
│ 17/05/2026, 10:00:00 AM             │
│                                      │
│ **Priya Patel** submitted their      │
│ goal sheet for review.               │
│                                      │
│ [Open in GoalFlow →]                 │
└──────────────────────────────────────┘
```

- Notifications are **fire-and-forget** (non-blocking) — the app works fully without them configured
- Deep links navigate directly to the relevant goal sheet in GoalFlow

---

## 🐳 Docker Containerization

### Quick Start (One Command)

```bash
# Clone and start with Docker
git clone https://github.com/Gurjas2112/GoalFlow.git
cd GoalFlow
cp .env.docker .env

# Build and start all 3 containers
docker-compose up -d --build

# Run database migrations + seed
docker-compose exec goalflow-api npx prisma migrate deploy
docker-compose exec goalflow-api npx prisma db seed
```

### Architecture

```
┌──────────────────────────────────────────────────────┐
│  Docker Network: goalflow-network                    │
│                                                      │
│  ┌──────────────┐  ┌───────────────┐                │
│  │ goalflow-web │  │ goalflow-api  │                │
│  │ Nginx + React│  │ Express.js    │                │
│  │ Port: 5173   │  │ Port: 4000    │                │
│  └──────┬───────┘  └───────┬───────┘                │
│         │                  │                         │
│         └──────┬───────────┘                         │
│                ▼                                     │
│  ┌─────────────────────┐                             │
│  │ goalflow-postgres   │                             │
│  │ PostgreSQL 16       │                             │
│  │ Port: 5432          │                             │
│  └─────────────────────┘                             │
└──────────────────────────────────────────────────────┘
```

### Commands

| Command | Description |
|---------|-------------|
| `docker-compose up -d` | Start all services |
| `docker-compose logs -f` | View live logs |
| `docker-compose down` | Stop all services |
| `docker-compose down -v` | Stop + delete data |
| `docker-compose exec goalflow-api npx prisma studio` | Database GUI |

### Services

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `goalflow-web` | Node 22 → Nginx Alpine | 5173 | Frontend SPA |
| `goalflow-api` | Node 22 Alpine (multi-stage) | 4000 | Express REST API |
| `goalflow-postgres` | PostgreSQL 16 Alpine | 5432 | Database |

---

## 🔐 Azure AD / Microsoft Entra ID SSO Setup

### Prerequisites

- Azure account (free or paid) — [Create free account](https://azure.microsoft.com/free/)
- [Azure CLI](https://aka.ms/installazurecliwindows) installed (`az --version` to verify)

### Quick Setup (5 minutes)

```bash
# 1. Login to Azure
az login

# 2. Get your Tenant ID
az account show --query tenantId -o tsv
# → Copy this as AZURE_TENANT_ID

# 3. Create App Registration
az ad app create --display-name "GoalFlow" \
  --web-redirect-uris "http://localhost:5173" "https://goal-flow-theta.vercel.app"
# → Copy "appId" as AZURE_CLIENT_ID

# 4. Create Client Secret (⚠️ password shown ONCE — save it!)
az ad app credential create --id "YOUR_APP_ID" --years 2
# → Copy "password" as AZURE_CLIENT_SECRET

# 5. Create Security Groups
az ad group create --display-name "GoalFlow-Admins" --mail-nickname "goalflow-admins"
# → Copy "id" as AZURE_GROUP_ADMIN

az ad group create --display-name "GoalFlow-Managers" --mail-nickname "goalflow-managers"
# → Copy "id" as AZURE_GROUP_MANAGER

az ad group create --display-name "GoalFlow-Employees" --mail-nickname "goalflow-employees"
# → Copy "id" as AZURE_GROUP_EMPLOYEE

# 6. Add yourself to Admin group
az ad signed-in-user show --query id -o tsv
# → Copy your user ID

az ad group member add --group "GoalFlow-Admins" --member-id "YOUR_USER_ID"
```

### Update `.env` with Azure Values

```env
AZURE_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
AZURE_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_REDIRECT_URI="http://localhost:5173"
AZURE_GROUP_ADMIN="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_GROUP_MANAGER="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
AZURE_GROUP_EMPLOYEE="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Update Frontend Environment (Vercel)

```
VITE_AZURE_CLIENT_ID=<your-app-id>
VITE_AZURE_TENANT_ID=<your-tenant-id>
VITE_AZURE_REDIRECT_URI=https://goal-flow-theta.vercel.app
```

### How SSO Works

```
User clicks "Sign in with Microsoft"
    ↓
MSAL.js opens Azure AD popup
    ↓
User authenticates with Microsoft account
    ↓
Azure returns ID token + group claims
    ↓
Frontend sends token to POST /api/auth/sso
    ↓
Backend verifies token, maps group → role:
  GoalFlow-Admins    → ADMIN
  GoalFlow-Managers  → MANAGER
  GoalFlow-Employees → EMPLOYEE
    ↓
Auto-provisions user if first login
    ↓
Returns JWT token → user logged in
```

### Quick Reference

| Variable | Command to Get It |
|----------|------------------|
| `AZURE_TENANT_ID` | `az account show --query tenantId -o tsv` |
| `AZURE_CLIENT_ID` | `az ad app show --id "APP_ID" --query appId -o tsv` |
| `AZURE_CLIENT_SECRET` | `az ad app credential create --id "APP_ID"` |
| `AZURE_GROUP_ADMIN` | `az ad group show --group "GoalFlow-Admins" --query id -o tsv` |
| `AZURE_GROUP_MANAGER` | `az ad group show --group "GoalFlow-Managers" --query id -o tsv` |
| `AZURE_GROUP_EMPLOYEE` | `az ad group show --group "GoalFlow-Employees" --query id -o tsv` |

### Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid Client ID" | Verify `AZURE_CLIENT_ID` matches `az ad app show --id "APP_ID"` |
| "Redirect URI mismatch" | Run `az ad app update --id "APP_ID" --web-redirect-uris "http://localhost:5173"` |
| "User not in any group" | Run `az ad group member add --group "GoalFlow-Employees" --member-id "USER_ID"` |
| SSO button not showing | Ensure `VITE_AZURE_CLIENT_ID` is set (non-empty) in Vercel env vars |

---

## 📄 License

Built for **AtomQuest Hackathon 1.0 (2026)** by [Gurjas Gandhi](https://github.com/Gurjas2112).

---

## 🏆 Submission Summary

| Deliverable | Status | Details |
|-------------|--------|---------|
| Live Demo | ✅ | [goal-flow-theta.vercel.app](https://goal-flow-theta.vercel.app) |
| Source Code | ✅ | [GitHub](https://github.com/Gurjas2112/GoalFlow) |
| Demo Credentials | ✅ | 4 accounts (Admin, Manager, 2 Employees) |
| Homepage | ✅ | Hero, features, stats, testimonials, FAQ |
| Signup Flow | ✅ | Registration with password strength |
| Docker | ✅ | 3-container compose (Node 22 + Nginx + PG16) |
| SSO | ✅ | Microsoft Entra ID (Azure AD) |
| Notifications | ✅ | SendGrid email + Teams webhooks |
| Analytics | ✅ | QoQ trends, heatmaps, distributions |
| Audit Trail | ✅ | Complete change history |
| Escalations | ✅ | Automated rule-based alerts |
| Monthly Cost | ✅ | **$5/month** (Railway hobby) |
