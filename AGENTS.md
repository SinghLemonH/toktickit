# AGENTS.md — TokTickIT

Instructions for any AI coding agent (Claude Code, etc.) working in this repository. Read this file
in full before making changes.

## What this project is

TokTickIT is a CPE 334 course project: an IT support ticketing system built incrementally sprint by
sprint (Lab 1, Lab 2, Lab 3, ...). Each Lab has its own contract under `docs/lab-XX/`.

**You are currently working on Lab 2.** The full engineering contract for this sprint is:
`docs/lab-02/specification.md`, `docs/lab-02/tests.md`, `docs/lab-02/ui-spec.md`,
`docs/lab-02/api-spec.md`. Read all four before writing any code for a Lab 2 issue. If something is
ambiguous or missing, say so explicitly instead of inventing a business rule.

## Hard boundaries — do not cross these

- **Do not modify, refactor, rename, or delete anything that already exists from Lab 1** (the
  `Category` model, `/api/categories`, `/api/health`, existing `App.tsx` structure, existing tests)
  unless a specific Lab 2 issue explicitly asks you to change it. Add alongside, don't rewrite.
- **Do not implement anything explicitly out of scope for Lab 2**: no login/passwords/sessions/JWT,
  no IT Staff dashboard, no Public Comments/Internal Notes/Actions Taken, no ticket status changes
  beyond initial `NEW`, no admin/user-management screens.
- **Do not report a task "done"** unless the required automated tests for that issue exist, run, and
  pass. Never skip, disable, or comment out a test to make a suite pass.
- **Do not invent business rules.** If `specification.md` doesn't cover a case you hit while coding,
  stop and ask rather than guessing.

## Tech stack (as it actually exists in this repo)

- **Backend**: Express + TypeScript, ESM modules, run via `tsx`. Prisma ORM → PostgreSQL.
- **Backend tests**: Vitest + Supertest (NOT Jest — do not add Jest or ts-jest to this repo).
- **Frontend**: React + Vite + TypeScript, styled with **Bootstrap 5**.
- **Frontend tests**: Vitest + React Testing Library.
- **Zen Green theme**: implemented as CSS variable overrides on top of Bootstrap (not a Bootstrap
  removal, not a from-scratch CSS system). Override Bootstrap's theme variables
  (`--bs-primary`, `--bs-body-bg`, etc.) and add small custom classes only where Bootstrap has no
  equivalent (e.g. read-only field styling, priority/status badges).
- **Routing**: `react-router-dom`. Routes for Lab 2: `/select-requester`, `/tickets` (My Tickets),
  `/tickets/create`, `/tickets/:id`.
- **File uploads**: `multer` on the backend for attachment handling.
- **E2E**: Playwright. Configuration is added early (Lab 2 Issue #2) but the actual E2E spec is only
  written in the final QA issue, once all screens exist.

## Commands

```bash
# backend
cd server && npm run dev        # start API
cd server && npm test           # vitest
cd server && npx prisma migrate dev
cd server && npm run seed       # idempotent — safe to re-run

# frontend
cd client && npm run dev        # start Vite dev server
cd client && npm test           # vitest + testing-library

# e2e (once added in Issue #2)
npx playwright test
```

## Git workflow (already established from Lab 1 — keep using it)

- Branch naming: `feature/<issue-number>-<short-description>`.
- Every feature branch → PR into `lab2-staging` (not `main`) for Lab 2 work.
- Only the final Lab 2 release PR goes `lab2-staging → main`.
- Never commit directly to `main` or `lab2-staging`.

## When starting any Lab 2 issue

1. Re-read the relevant sections of `docs/lab-02/specification.md`, `api-spec.md`, and `ui-spec.md`
   for that issue.
2. List any ambiguities or conflicts you find before writing code.
3. Write/confirm the failing test(s) for the acceptance criteria this issue covers first.
4. Implement the smallest correct change to make them pass.
5. State explicitly which Acceptance Criteria (AC-xx) and which test files you completed.
