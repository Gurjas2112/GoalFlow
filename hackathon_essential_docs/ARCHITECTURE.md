# GoalFlow — System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  React 18 + TypeScript + Vite              Deployed on: Vercel      │
│  ┌─────────────┐ ┌─────────────┐ ┌────────────────────────────┐    │
│  │ LoginPage   │ │ Employee    │ │ Admin Dashboard            │    │
│  │ + SSO btn   │ │ Goals/      │ │ Analytics / Audit /        │    │
│  │ (MSAL.js)   │ │ Check-in    │ │ Escalations / Reports      │    │
│  └──────┬──────┘ └──────┬──────┘ └─────────────┬──────────────┘    │
│         │               │                       │                   │
│  ┌──────┴───────────────┴───────────────────────┴──────────────┐   │
│  │ AuthContext (JWT) │ Axios API Client │ React Router v7      │   │
│  └──────────────────────────────┬──────────────────────────────┘   │
└─────────────────────────────────┼───────────────────────────────────┘
                                  │ REST API calls (HTTPS)
┌─────────────────────────────────┼───────────────────────────────────┐
│                         API LAYER                                    │
│  Express.js 4 + TypeScript               Deployed on: Railway       │
│                                                                      │
│  ┌─── Authentication ─────────────────────────────────────────┐     │
│  │ /api/auth/login    JWT token generation                    │     │
│  │ /api/auth/me       Token verification                     │     │
│  │ /api/auth/sso      Azure AD token → JWT (auto-provision)  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─── Core Routes ────────────────────────────────────────────┐     │
│  │ /api/goal-sheets   CRUD + submit/approve/return/unlock     │     │
│  │ /api/goals         CRUD + shared goals (push to N users)   │     │
│  │ /api/achievements  Log actuals → auto-compute score        │     │
│  │ /api/check-ins     Manager quarterly review comments       │     │
│  │ /api/cycles        Cycle CRUD + override toggle            │     │
│  │ /api/users         User CRUD + team listing                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─── Admin & Analytics ──────────────────────────────────────┐     │
│  │ /api/reports       Achievement report + CSV export          │     │
│  │ /api/analytics     QoQ trends, heatmap, distribution       │     │
│  │ /api/audit         Post-lock change log viewer              │     │
│  │ /api/escalations   Rules CRUD + open/resolve events        │     │
│  │ /api/notifications Email/Teams log + manual trigger         │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─── Background Jobs ────────────────────────────────────────┐     │
│  │ Escalation Trigger  Runs every 60 mins via setInterval     │     │
│  │  → Scans DRAFT sheets > N days (GOAL_NOT_SUBMITTED)        │     │
│  │  → Scans SUBMITTED sheets > N days (GOAL_NOT_APPROVED)     │     │
│  │  → Scans LOCKED sheets without check-ins (CHECKIN_NOT_DONE)│     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─── Middleware ─────────────────────────────────────────────┐     │
│  │ JWT Auth          Token verification + user injection       │     │
│  │ RBAC              requireRole('ADMIN', 'MANAGER')          │     │
│  │ CORS              Locked to FRONTEND_URL                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌─── Utilities ──────────────────────────────────────────────┐     │
│  │ scoreCompute.ts   4 UoM formulas (MIN/MAX/TIMELINE/ZERO)   │     │
│  │ audit.ts          Post-lock change tracker                  │     │
│  │ notify.ts         SendGrid email + Teams webhook (3 retries)│     │
│  └────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ Prisma ORM (type-safe queries)
┌──────────────────────────────────┼──────────────────────────────────┐
│                         DATA LAYER                                   │
│  PostgreSQL (Supabase)              Region: ap-south-1 (Mumbai)     │
│                                                                      │
│  ┌─── 9 Core Models ─────────────────────────────────────────┐     │
│  │ User          id, name, email, role, managerId, deptId     │     │
│  │ Department    id, name                                     │     │
│  │ GoalCycle     id, phase, year, dates, isOverride           │     │
│  │ GoalSheet     id, userId, cycleId, status, timestamps      │     │
│  │ Goal          id, sheetId, thrust, uom, target, weightage  │     │
│  │ Achievement   id, goalId, cycleId, actual, score           │     │
│  │ CheckIn       id, sheetId, managerId, comment              │     │
│  │ AuditLog      id, userId, action, field, old/new values    │     │
│  │ Escalation    id, userId, reason, status, resolvedAt       │     │
│  │ EscalationRule eventType, triggerDays, notifyRole, active   │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  Connection: PgBouncer pooling (runtime) + Direct (migrations)      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                     EXTERNAL INTEGRATIONS                            │
│                                                                      │
│  ┌── Azure AD ──┐  ┌── SendGrid ──┐  ┌── Teams ──────────────┐    │
│  │ MSAL.js      │  │ Email API    │  │ Incoming Webhook      │    │
│  │ OAuth2 popup │  │ 3x retry     │  │ Adaptive cards        │    │
│  │ Group claims │  │ 100/day free │  │ Deep-link support     │    │
│  │ Auto-provn   │  │ HTML styled  │  │ GoalFlow branding     │    │
│  └──────────────┘  └──────────────┘  └───────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Score Computation Engine

```
┌──────────────┬─────────────────────────────────────────┬──────────┐
│ UoM Type     │ Formula                                 │ Example  │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ NUMERIC_MIN  │ score = min(actual / target, 1.0)       │ 85%      │
│ (higher=good)│ Target: 1M, Actual: 850K → 0.85        │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ NUMERIC_MAX  │ score = min(target / actual, 1.0)       │ 85.7%    │
│ (lower=good) │ Target: 24h, Actual: 28h → 0.857       │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ TIMELINE     │ On time → 1.0                           │ 100%     │
│ (date-based) │ Late → max(1 - daysLate/total, 0)      │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ ZERO         │ actual == 0 → 1.0                       │ 60%      │
│ (0=success)  │ else → max(1 - actual*0.2, 0)           │          │
├──────────────┼─────────────────────────────────────────┼──────────┤
│ WEIGHTED     │ Overall = Σ(score × weightage) / 100    │          │
└──────────────┴─────────────────────────────────────────┴──────────┘
```

## Goal Sheet Lifecycle

```
  EMPLOYEE                    MANAGER                     ADMIN
  ────────                    ───────                     ─────
  Create sheet
  Add goals (1-8)
  Set weightage (≥10% each)
  Validate total = 100%
       │
       ▼
  ┌─────────┐
  │  DRAFT  │
  └────┬────┘
       │ submit
       ▼
  ┌──────────┐
  │SUBMITTED │──── 📧 Email + Teams → Manager
  └────┬─────┘
       │
       ├──── approve ──► ┌────────┐ ──── 📧 Email → Employee
       │                 │ LOCKED │
       │                 └────────┘
       │
       └──── return ───► ┌──────────┐ ──── 📧 Email → Employee
         (with reason)   │ RETURNED │
                         └────┬─────┘
                              │ edit & resubmit
                              └──► SUBMITTED
```

## Escalation Flow

```
Hourly Job (setInterval)
    │
    ├── Check DRAFT sheets > N days ──────► GOAL_NOT_SUBMITTED
    ├── Check SUBMITTED sheets > N days ──► GOAL_NOT_APPROVED
    └── Check LOCKED without check-in ───► CHECKIN_NOT_DONE
         │
         ▼
    Create Escalation record
    (visible in Admin → Escalations)
         │
         ▼
    Admin resolves manually
```

## Cost Structure: $5/month Total

```
┌────────────────┬──────────┬──────────┬──────────────────────────────┐
│ Service        │ Plan     │ Cost     │ What's Included              │
├────────────────┼──────────┼──────────┼──────────────────────────────┤
│ Supabase       │ Free     │ $0       │ 500MB PostgreSQL, 200 conns  │
│ Vercel         │ Free     │ $0       │ Global CDN, auto SSL         │
│ Railway        │ Hobby    │ $5       │ API container, auto-deploy   │
│ Azure AD       │ Free     │ $0       │ SSO, Graph API, 50 apps      │
│ SendGrid       │ Free     │ $0       │ 100 emails/day               │
│ GitHub         │ Free     │ $0       │ Repo, Actions, GHCR          │
├────────────────┼──────────┼──────────┼──────────────────────────────┤
│ TOTAL          │          │ $5/month │ Full production stack        │
└────────────────┴──────────┴──────────┴──────────────────────────────┘
```
