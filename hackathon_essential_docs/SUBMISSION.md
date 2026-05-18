# GoalFlow — AtomQuest Hackathon 2026 Submission

**Updated:** 2026-05-18 (Final Submission)

---

## 🔗 Key Links

| Resource | URL |
|----------|-----|
| **Live Demo** | [goal-flow-theta.vercel.app](https://goal-flow-theta.vercel.app) |
| **GitHub Repo** | [github.com/Gurjas2112/GoalFlow](https://github.com/Gurjas2112/GoalFlow) |
| **Architecture** | [hackathon_docs/ARCHITECTURE.md](hackathon_docs/ARCHITECTURE.md) |

---

## 🔑 Demo Credentials (Pre-Seeded)

| Role | Email | Password | Sheet State |
|------|-------|----------|-------------|
| **Admin** | `admin@goalflow.demo` | `Admin@123` | Full system access |
| **Manager** | `manager@goalflow.demo` | `Manager@123` | Team oversight |
| **Sales Manager** | `salesmgr@goalflow.demo` | `Manager@123` | Sales team |
| **Employee 1** | `emp1@goalflow.demo` | `Emp@123` | LOCKED sheet (check-in ready) |
| **Employee 2** | `emp2@goalflow.demo` | `Emp@123` | DRAFT sheet (creation demo) |
| **Sales Employee** | `sales1@goalflow.demo` | `Emp@123` | SUBMITTED (approval demo) |

---

## ✨ Quick Demo Script (5 mins)

### 1. Employee Journey (1.5 min)
1. Login as `emp1@goalflow.demo` → See **locked** goal sheet with 4 goals (Revenue, Efficiency, Delivery, Safety)
2. View achievements — scores auto-computed (85%, 85.7%)
3. Show all 4 UoM types working

### 2. Manager Journey (1.5 min)
1. Switch to `manager@goalflow.demo` → See team members in sidebar
2. Click **Vikram Desai** (sales employee) → Sheet is SUBMITTED with 4 goals
3. Demo **approve** (→ LOCKED) or **return** (→ RETURNED with reason)
4. Show check-in with comment

### 3. Admin Journey (2 min)
1. Switch to `admin@goalflow.demo` → Dashboard with stats
2. **Analytics** → QoQ trend charts, department heatmap, goal distribution
3. **Escalations** → Open escalation for emp2 (not submitted), resolved one for manager
4. **Audit Log** → Submission and approval events tracked
5. **Reports** → CSV export button
6. **Cycles** → Show override toggle for demo

---

## ✅ Feature Coverage

### Must-Have (Core)
- [x] Goal sheet lifecycle: DRAFT → SUBMITTED → APPROVED/RETURNED → LOCKED
- [x] Validation: max 8 goals, min 10% weight, total = 100%
- [x] 4 UoM types with formula-based scoring
- [x] Quarterly check-ins with manager comments
- [x] Achievement tracking (Planned vs Actual)
- [x] Post-lock audit trail
- [x] Role-based access (Employee/Manager/Admin)
- [x] Cycle management with admin override
- [x] CSV export for achievement reports

### Good-to-Have (Bonus)
- [x] Microsoft Entra ID SSO (MSAL.js + backend group→role mapping)
- [x] Email notifications (SendGrid with 3-attempt retry + logging)
- [x] Teams webhooks (adaptive cards with deep links)
- [x] Escalation engine (rules CRUD + hourly trigger job)
- [x] Analytics dashboard (QoQ, heatmap, distribution, manager effectiveness)
- [x] Shared goals (primary owner syncing)

### Jury Feedback Fixes
- [x] Escalation trigger job (runs hourly via setInterval)
- [x] Email retry logic with in-memory notification log
- [x] Pre-populated demo data (6 users, 3 sheets, achievements, escalations)
- [x] Detailed validation error messages (weightage breakdowns)
- [x] Timeline UoM deadline validation
- [x] Goal deletion audit trail
- [x] Cycle overlap guard
- [x] Notification history endpoint for admin

---

## 🛠 Tech Stack & Cost

| Layer | Technology | Cost/month |
|-------|-----------|:----------:|
| Frontend | React 18 + Vite (Vercel) | $0 |
| Backend | Express.js + Prisma (Railway) | $5 |
| Database | PostgreSQL (Supabase) | $0 |
| Auth | JWT + Azure AD (MSAL) | $0 |
| Email | SendGrid | $0 |
| CI/CD | GitHub Actions | $0 |
| **Total** | | **$5/month** |

---

Built by [Gurjas Gandhi](https://github.com/Gurjas2112) for AtomQuest Hackathon 2026
