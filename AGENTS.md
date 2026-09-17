# AGENTS.md: TokTickIT

> **TL;DR: READ THIS FIRST BEFORE WRITING CODE OR SWITCHING CONVERSATIONS.**
> You are working on **Lab 3: Users, Roles, IT Staff Ticketing, and Admin Screens**.
> Follow Spec-Driven Development (Spec DD) and Test-Driven Development (TDD).
> Extend Lab 1 and Lab 2; do NOT break, rewrite, or delete existing functionality.
> **All documentation files under `docs/lab-03/` must be 100% written in formal English and must NEVER use em dashes.**

---

## ⚡ Quick Resume Board (Live Sprint 3 State Tracker)

When an AI agent starts or resumes work in a new conversation, **immediately read this board** and run the verification commands to know where the project stands.

| Issue | Title | Branch | Status | Key Deliverables |
| :--- | :--- | :--- | :--- | :--- |
| **#29** | **Sprint 3 Engineering Contract & Continuity Guide** | `feature/29-sprint3-contract-and-agent-guide` | **Done** | `docs/lab-03/` (spec, api, ui, tests, reviewer, ai-use), `AGENTS.md` |
| **#30** | **Database Evolution, User Migration & Seed Data** | `feature/30-db-migration-and-seed` | **Done** | Prisma models (`User`, `Comment`, `InternalNote`), migration script, idempotent seed |
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

## Hard Boundaries: Never Cross These

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
7. **No AI-Style Em Dashes**:
   - Never use em dashes (Unicode U+2014) in any markdown documentation, commit messages, or comments. Em dashes make writing look artificially generated. Always use standard colons (`:`), hyphens (`-`), commas, or natural English phrasing instead.

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

---

## 📋 Final Submission Structure (Course Handout: Answer Part 1 - Part 9, 60 Points Total)

When generating the final PDF report for submission at the end of Sprint 3 (Issue #35), you must follow the exact structure and headings below:

| Part | Title | Points | Required Submission Evidence |
| :--- | :--- | :--- | :--- |
| **Answer Part 1** | **Git Use with Engineering Workflow** | 10 | Commit-history evidence showing feature branches merged into `lab3-staging` and then `main`; final GitHub Project/Kanban with all Issues in `Done`; rendered `reviewer.md` with reviewer identity, PR links, comments, responses, and approvals; README and `.gitignore` evidence; repository directory structure. |
| **Answer Part 2** | **Spec DD** | 5 | Link to and rendered `docs/lab-03/specification.md`. Show numbered requirements (FRs), business rules (BRs), authorization matrix or rules, acceptance criteria (ACs), migration decisions, and Product Definition of Done. Include evidence that the specification existed before implementation PRs. |
| **Answer Part 3** | **Test DD and Traceability** | 10 | Link to and rendered `docs/lab-03/tests.md`. Include planned tests, AC traceability, actual test-file paths, and final status. Include complete unit, API/integration, UI, authorization, regression, and E2E passing test output from `main`. |
| **Answer Part 4** | **AI Use with Reflection** | 5 | Rendered `docs/lab-03/ai-use.md` naming the LLM used and showing 6-10 selected key prompts (senior prompt engineering). Provide a brief "My Reflection" on specification-agent and coding-agent use. |
| **Answer Part 5** | **Working Login and Password Change UI** | 5 | Demonstrate valid and invalid login, inactive-account handling, busy and safe failure feedback, mandatory first-password change, authenticated user/role display, logout, and direct access blocked after logout. |
| **Answer Part 6** | **Working IT Staff Ticket Queue UI** | 5 | Demonstrate realistic queue data, search, filters, sorting, pagination, assigned/unassigned ownership, status and priority badges, open-detail action, empty/no-results/failure feedback, and responsive behavior. |
| **Answer Part 7** | **Working IT Staff Ticket Detail UI** | 10 | Demonstrate claim/reassign, IT Priority, permitted status changes, Public Comments, Internal Notes, Attachment continuity, Requester resolution indication, role restrictions, validation, and safe failure behavior. Include direct API authorization evidence. |
| **Answer Part 8** | **Working Administrator User Management UI** | 5 | Demonstrate minimalist User Management screen: user list (Name, Email, Role, Status, Edit), search by name or email, optional role filter, create user with initial password, duplicate-email & invalid validation, edit user, set new initial password & required change at next login, prevention of self-deactivation & last active admin removal, forbidden access for non-admins, Zen Green presentation. |
| **Answer Part 9** | **Zen Green UI and Responsive Evidence** | 5 | Rendered `ui-spec.md` plus desktop, tablet, and mobile screenshots for all major Lab 3 screens. Include completed visual checklist for design consistency, role navigation, badges, editable/read-only fields, validation placement, focus, clipping, overlap, and horizontal overflow. |
