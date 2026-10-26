# AGENTS.md: TokTickIT

> **TL;DR: READ THIS FIRST BEFORE WRITING CODE OR SWITCHING CONVERSATIONS.**
> You are working on **Lab 4: Actions Taken, Dashboards, and Final Regression**.
> Follow Spec-Driven Development (Spec DD) and Test-Driven Development (TDD).
> Extend Lab 1, Lab 2, and Lab 3; do NOT break, rewrite, or delete existing functionality.
> **All documentation files under `docs/lab-04/` must be 100% written in formal English and must NEVER use em dashes.**

---

## Quick Resume Board (Live Sprint 4 State Tracker)

When an AI agent starts or resumes work in a new conversation, **immediately read this board** and run the verification commands to know where the project stands.

| Issue | Title | Branch | Status | Key Deliverables |
| :--- | :--- | :--- | :--- | :--- |
| **#46** | **Sprint 4 Engineering Contract, Continuity Guide & Baseline Config** | `feature/46-sprint4-contract-and-agent-guide` | **Done** | Merged into `lab4-staging` via PR #53. |
| **#47** | **Actions Taken Database Foundation, Migration, Rollback & Seed** | `feature/47-actions-taken-backend-foundation` | **Done** | Merged into `lab4-staging` via PR #54. |
| **#48** | **Ticket Workflow, Resolution Gate, Stale-Update Guard & History** | `feature/48-ticket-workflow` | **Done** | Merged into `lab4-staging` via PR #55. |
| **#49** | **Role-Based Dashboards Backend API & Metric Verification** | `feature/49-dashboard-api` | **Done** | Merged into `lab4-staging` via PR #56. |
| **#50** | **Actions Taken UI on Ticket Detail** | `feature/50-actions-taken-ui` | **In Progress** | `ActionsTakenSection` component, inline create, view/edit, read-only mode, status alerts |
| **#51** | **Dashboards UI, Navigation & Lab 2 Remnants Cleanup** | `feature/51-dashboards-ui-and-nav` | **Todo** | Role-based Dashboard page, Zen Green metric cards, role-aware navigation, clean Lab 2 remnants |
| **#52** | **Final Hardening, Multi-Viewport E2E & Visual Artifacts** | `feature/52-final-hardening` | **Todo** | Playwright E2E suites, multi-viewport screenshots (1280, 768, 375), accessibility & visual checklist |

### Resume Checklist for Any New Session:
1. Run `git branch --show-current` and `git status` to verify current branch and uncommitted work.
2. Verify target branch: all feature work branches off and PRs into **`lab4-staging`** (never directly into `main`).
3. Check the board above to identify the active issue.
4. Run test suites (`npm test` in `server/` and `client/`) to ensure the baseline passes.
5. Re-read the corresponding section in `docs/lab-04/specification.md` and `docs/lab-04/tests.md` before coding.

---

## What This Project Is

TokTickIT is an IT support ticketing system built incrementally sprint by sprint:
- **Sprint 1**: Foundation, Health check, Category API and UI.
- **Sprint 2**: Requester context, Ticket creation, My Tickets table, Attachments, Zen Green theme.
- **Sprint 3**: Real authentication, Role-based authorization (`Requester`, `IT Staff`, `Administrator`), IT Staff Queue and Operational Details, Minimalist Administrator User Management, Public Comments, and Internal Notes.
- **Sprint 4 (Current)**: Actions Taken on Tickets, full Ticket lifecycle and resolution gates, role-appropriate Dashboards (Requester, IT Staff, Administrator), optimistic concurrency, and final product regression hardening.

The engineering contract for Sprint 4 is located in `docs/lab-04/`:
- `docs/lab-04/specification.md`
- `docs/lab-04/api-spec.md`
- `docs/lab-04/ui-spec.md`
- `docs/lab-04/tests.md`
- `docs/lab-04/reviewer.md`
- `docs/lab-04/ai-use.md`

---

## Hard Boundaries: Never Cross These

1. **Extend, Do Not Break**: Existing Lab 1, Lab 2, and Lab 3 functionality must continue working seamlessly. Ticket ownership, users, attachments, comments, and notes remain valid and backward-compatible.
2. **Strict RBAC on the Server**: "Hiding a button is not authorization." Every protected route must strictly enforce authentication and role permissions on the Express backend with appropriate HTTP status codes (`401 Unauthorized`, `403 Forbidden`).
3. **Session and Security Invariants**:
   - Authentication is handled via **HTTP-only, Secure Cookie** (`toktickit_session`). No auth secrets or JWT tokens stored in localStorage.
   - Dual-channel confidentiality: `InternalNote` endpoints and data are strictly forbidden to `Requester` roles.
   - Requester Actions Taken: Requesters can only view Actions Taken on their own tickets (read-only); Requesters cannot create or edit Actions Taken.
   - Resolution Gate Invariant: A Ticket cannot be marked `RESOLVED` unless it has an assigned owner, at least one `COMPLETED` Action Taken, and zero `PLANNED` Actions Taken.
   - Optimistic Concurrency Invariant: State changes and Action edits must require and verify `expectedVersion` to prevent stale overwrite conflicts (`409 STALE_UPDATE`).
4. **Explicitly Out of Scope for Lab 4**:
   - No automatic SLA clocks, escalation engines, on-call scheduling, or breach notifications.
   - No external email, SMS, LINE, or push notification services.
   - No inventory management, purchasing, spare parts, payroll, or time-sheet cost accounting.
   - No multi-level approval workflows or electronic signatures.
   - No BI report builders or data export warehouses.
   - No deletion of Actions Taken or status history records.
5. **Quality and TDD**:
   - Never report a task "done" without automated tests written, running, and passing.
   - Never disable, comment out, or skip tests to make a suite pass.
6. **Documentation Language**:
   - **All documents under `docs/lab-04/` must be written in 100% formal English.**
7. **No AI-Style Em Dashes**:
   - Never use em dashes (Unicode U+2014) in any markdown documentation, commit messages, or comments. Always use standard colons (`:`), hyphens (`-`), commas, or natural English phrasing instead.

---

## Tech Stack

- **Backend**: Express + TypeScript, ESM modules, run via `tsx`. Prisma ORM -> PostgreSQL.
- **Backend Tests**: Vitest + Supertest (`fileParallelism: false`).
- **Frontend**: React + Vite + TypeScript, styled with **Bootstrap 5** and **Zen Green** CSS variable overrides.
- **Frontend Tests**: Vitest + React Testing Library.
- **E2E Testing**: Playwright (`e2e/`).
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

- **Base Branch**: `lab4-staging` (created from `main`).
- **Feature Branch**: `feature/<issue-number>-<short-description>`.
- **Integration**: Every feature branch merges via Pull Request into `lab4-staging`.
- **Release**: Only the final Sprint 4 release PR merges `lab4-staging` -> `main`.
- **Rule**: Never commit directly to `main` or `lab4-staging`.

---

## Final Submission Structure (Course Handout: Answer Part 1 to Part 9, 60 Points Total)

| Part | Title | Points | Required Submission Evidence |
| :--- | :--- | :---: | :--- |
| **Answer Part 1** | **Git Use with Engineering Workflow** | 10 | Commit-history evidence showing feature branches merged into `lab4-staging` and then `main`; final GitHub Project/Kanban with all Issues in `Done`; rendered `reviewer.md` with reviewer identity (`@WATHITx`), PR links, comments, responses, and approvals; README and `.gitignore` evidence; repository directory structure. |
| **Answer Part 2** | **Spec DD** | 5 | Link to and rendered `docs/lab-04/specification.md`. Show numbered requirements (FRs), business rules (BRs), Actions Taken and Ticket transition rules, dashboard calculations, acceptance criteria (ACs), migration decisions, and Product Definition of Done. Include evidence that the specification existed before implementation PRs. |
| **Answer Part 3** | **Test DD and Traceability** | 10 | Link to and rendered `docs/lab-04/tests.md`. Include planned tests, AC traceability, actual test-file paths, and final status. Include complete unit, API/integration, UI, authorization, workflow, regression, and E2E passing test output from `main`. |
| **Answer Part 4** | **AI Use with Reflection** | 5 | Rendered `docs/lab-04/ai-use.md` naming the LLM used and showing 6-10 selected key prompts (senior prompt engineering). Provide a brief "My Reflection" on specification-agent and coding-agent use without em dashes. |
| **Answer Part 5** | **Working IT Staff Dashboard UI** | 5 | Demonstrate approved operational metrics, current-user Actions Taken, recent or urgent Tickets, accurate counts, drill-down behavior, loading, empty, forbidden, safe-failure, and responsive behavior. Include evidence that selected metrics match database queries. |
| **Answer Part 6** | **Working Actions Taken UI** | 10 | Demonstrate list, create, assign, edit, status transition, complete, cancel, validation, inactive-assignee rejection, role restrictions, safe failures, and responsive behavior. Show different Actions Taken on one Ticket. |
| **Answer Part 7** | **Working Ticket Workflow** | 5 | Demonstrate permitted Ticket transitions, stable ordering, append-only behavior, and role-appropriate visibility. |
| **Answer Part 8** | **Working Requester Dashboard and Final Regression UI** | 5 | Demonstrate Requester-owned metrics, recent and attention-required Tickets, drill-down, ownership protection, and representative regression evidence for authentication, My Tickets, Ticket Detail, Attachments, Public Comments, IT Staff functions, Internal Notes, and Administrator user management. |
| **Answer Part 9** | **Zen Green UI, Responsive, Accessibility, and Final Polish** | 5 | Rendered `ui-spec.md` plus desktop, tablet, and mobile screenshots for all major Lab 4 screens. Include completed visual and accessibility checklist for design consistency, dashboards, Actions Taken, editable/read-only fields, validation placement, keyboard focus, clipping, overlap, and horizontal overflow. |
