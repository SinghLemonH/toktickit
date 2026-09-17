# AGENTS.md — TokTickIT

> **TL;DR — READ THIS FIRST BEFORE WRITING CODE OR SWITCHING CONVERSATIONS.**
> You are working on **Lab 3: Users, Roles, IT Staff Ticketing, and Admin Screens**.
> Follow Spec-Driven Development (Spec DD) and Test-Driven Development (TDD).
> Extend Lab 1 and Lab 2; do NOT break, rewrite, or delete existing functionality.
> **All documentation files under `docs/lab-03/` must be 100% written in formal English.**

---

## ⚡ Quick Resume Board (Live Sprint 3 State Tracker)

When an AI agent starts or resumes work in a new conversation, **immediately read this board** and run the verification commands to know where the project stands.

| Issue | Title | Branch | Status | Key Deliverables |
| :--- | :--- | :--- | :--- | :--- |
| **#29** | **Sprint 3 Engineering Contract & Continuity Guide** | `feature/29-sprint3-contract-and-agent-guide` | **Done** | `docs/lab-03/` (spec, api, ui, tests, reviewer, ai-use), `AGENTS.md` |
| **#30** | **Database Evolution, User Migration & Seed Data** | `feature/30-db-migration-and-seed` | **In Progress** | Prisma models (`User`, `Comment`, `InternalNote`), migration script, seed |
| **#31** | **Authentication Engine & Mandatory Password Change** | `feature/31-auth-and-password-change` | Pending | Cookie auth API, session guards, Login UI, Change Password UI |
| **#32** | **Requester Regression & Public Comments** | `feature/32-requester-regression-comments` | Pending | Remove DevRequester selector, Public Comments, "Problem Appears Resolved" flag |
| **#33** | **IT Staff Ticket Queue & Operational Details** | `feature/33-staff-queue-and-ticket-operations` | Pending | Staff Queue (Search, Filter, Sort, Pagination), Claim/Reassign, IT Priority, Status, Internal Notes |
| **#34** | **Administrator User Management** | `feature/34-admin-user-management` | Pending | User table, Create/Edit user modal, Reset password, Self-deactivation & last admin safety guards |
| **#35** | **E2E Integration, Visual Artifacts & QA Release** | `feature/35-e2e-artifacts-release` | Pending | Playwright tests, UI screenshots (Desktop/Tablet/Mobile), `reviewer.md`, PR to main |

### Resume Checklist for Any New Session:
1. Run `git branch --show-current` and `git status` to verify current branch and uncommitted work.
2. Verify target branch: all feature work branches off and PRs into **`lab3-staging`** (never directly into `main`).
3. Check the board above to identify the active issue.
4. Run test suites (`npm test` in `server/` and `client/`) to ensure the baseline passes.
5. Re-read the corresponding section in `docs/lab-03/specification.md` and `docs/lab-03/tests.md` before coding.

---

## What This Project Is

TokTickIT is an IT support ticketing system built incrementally sprint by sprint.
- **Sprint 1**: Foundation, Health check, Category API & UI.
- **Sprint 2**: Requester context, Ticket creation, My Tickets table, Attachments, Zen Green theme.
- **Sprint 3 (Current)**: Real authentication, Role-based authorization (`Requester`, `IT Staff`, `Administrator`), IT Staff Queue & Operational Details, Minimalist Administrator User Management, Public Comments, and Internal Notes.

The engineering contract for Sprint 3 is located in `docs/lab-03/`:
- `docs/lab-03/specification.md`
- `docs/lab-03/api-spec.md`
- `docs/lab-03/ui-spec.md`
- `docs/lab-03/tests.md`
- `docs/lab-03/reviewer.md`
- `docs/lab-03/ai-use.md`

---

## Hard Boundaries — Never Cross These

1. **Extend, Do Not Break**: Existing Lab 1 and Lab 2 functionality must continue working seamlessly. Ticket ownership from Lab 2 is migrated to the new `User` model without data loss.
2. **Strict RBAC on the Server**: "Hiding a button is not authorization." Every protected route must strictly enforce authentication and role permissions on the Express backend with appropriate HTTP status codes (`401 Unauthorized`, `403 Forbidden`).
3. **Session & Security Invariants**:
   - Authentication is handled via **HTTP-only, Secure Cookie** (`toktickit_session`). No auth secrets or JWT tokens stored in localStorage or exposed to client JavaScript.
   - Passwords must be hashed using `bcrypt` (never stored in plaintext).
   - Mandatory first-login password change: Users with `mustChangePassword: true` cannot access normal application screens until a valid new password is saved.
   - Dual-channel confidentiality: `InternalNote` endpoints and data are strictly forbidden to `Requester` roles.
   - Admin safety guards: Administrators cannot deactivate their own account; the system must never allow deactivating the last active Administrator. No hard user deletion (use deactivation).
4. **Explicitly Out of Scope for Lab 3**:
   - No email delivery (no invitation emails, no reset emails).
   - No self-registration (all accounts are created by Admin or seeded).
   - No MFA, social login, SSO, or multi-tenant structures.
   - No IT Staff "Actions Taken" (deferred to Lab 4).
   - No multiple roles per user (one user = exactly one role).
5. **Quality & TDD**:
   - Never report a task "done" without automated tests written, running, and passing.
   - Never disable, comment out, or skip tests to make a suite pass.
6. **Documentation Language**:
   - **All documents under `docs/lab-03/` must be written in 100% pure English.**

---

## Tech Stack

- **Backend**: Express + TypeScript, ESM modules, run via `tsx`. Prisma ORM → PostgreSQL.
- **Backend Tests**: Vitest + Supertest.
- **Frontend**: React + Vite + TypeScript, styled with **Bootstrap 5** and **Zen Green** CSS variable overrides.
- **Frontend Tests**: Vitest + React Testing Library.
- **E2E Testing**: Playwright (`e2e/lab-03/`).
- **Authentication**: Cookie-based session (`toktickit_session`), bcrypt password hashing.

---

## Standard Commands

```bash
# Backend
cd server && npm run dev          # Start backend server
cd server && npm test             # Run Vitest API/unit tests
cd server && npx prisma migrate dev
cd server && npm run seed         # Run idempotent seed script

# Frontend
cd client && npm run dev          # Start Vite dev server
cd client && npm test             # Run Vitest + React Testing Library

# End-to-End Testing
npx playwright test               # Run Playwright E2E suite
```

---

## Git Workflow

- **Base Branch**: `lab3-staging` (created from `main`).
- **Feature Branch**: `feature/<issue-number>-<short-description>`.
- **Integration**: Every feature branch merges via Pull Request into `lab3-staging`.
- **Release**: Only the final Sprint 3 QA release PR merges `lab3-staging` → `main`.
- **Rule**: Never commit directly to `main` or `lab3-staging`.