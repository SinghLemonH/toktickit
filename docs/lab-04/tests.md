# Lab 4 Test Plan and Traceability Matrix

## 1. Test Strategy

Testing in Sprint 4 adheres strictly to Test-Driven Development (TDD) and Spec-Driven Development (Spec DD). All tests are mapped directly to the Acceptance Criteria (AC-01 through AC-20) established in `docs/lab-04/specification.md`.

### 1.1. Testing Levels
- **Unit Tests**: Pure business logic verification (status transition matrix by role including PENDING, resolution gate validator, action input parser, dashboard window helpers) located under `server/tests/lab-04/*.unit.test.ts` to match `server/vitest.config.ts`.
- **API and Integration Tests**: Supertest executing against the Express backend and PostgreSQL database with disabled parallelism (`fileParallelism: false`) to ensure deterministic test execution.
- **UI Component Tests**: Vitest with React Testing Library simulating component interactions, mock API responses, validation error rendering, and role restrictions.
- **UI Style Tests**: Playwright and static token assertions validating adherence to Zen Green CSS tokens in `theme.css`, readable badge labels, and accessible contrast ratios.
- **End-to-End Tests**: Playwright executing complete user journeys in real browser contexts across desktop, tablet, and mobile viewports.
- **Performance Smoke Tests**: Validating that aggregate dashboard queries execute in under 500ms on seeded data.
- **Static Type Check**: Running `tsc --noEmit` on both server and client to guarantee zero TypeScript compiler errors.
- **Isolated Migration & Rollback Test**: Running additive migration, seed, and rollback verification against an isolated temporary schema/database so shared test tables remain untouched.
- **Regression Verification**: Running all test suites from Lab 1, Lab 2, and Lab 3 to guarantee zero backward compatibility breakage.

### 1.2. Contract Changes Affecting Earlier Tests
The following intentional contract changes evolved earlier sprint behavior:
1. **Resolution Gate Enforcement**: In Lab 3, tickets could transition to `RESOLVED` directly without actions taken. In Lab 4, moving to `RESOLVED` requires an assigned owner, at least one completed Action Taken, and zero planned Actions Taken. Existing tests in `server/tests/lab-03/staff-ticket-detail.api.test.ts` must seed a completed Action Taken and supply `expectedVersion`.
2. **Transition Matrix Evolution**: The direct transition from `OPEN` to `RESOLVED` permitted in Lab 3 is now retired in favor of the full lifecycle (`OPEN` -> `IN_PROGRESS` -> `RESOLVED`).
3. **Optimistic Locking**: Status transitions and ticket assignments now require integer `expectedVersion`. Earlier tests are updated to fetch current version before invoking status mutations without weakening assertions.

---

## 2. Test Traceability Matrix

| Test ID | Level | Requirement / AC | Description and Verification Target | Expected Result | Automated Test File | Status |
| :---: | :---: | :---: | :--- | :--- | :--- | :---: |
| **UNIT-01** | Unit | BR-12, BR-13 | Transition matrix evaluation by role (including PENDING) | Returns true for valid transitions; false for invalid; Cancelled has no exits | `server/tests/lab-04/status-transitions.unit.test.ts` | Planned |
| **UNIT-02** | Unit | BR-11 | Resolution gate pure evaluation function | Fails when no owner, no completed action, or planned actions exist; passes when satisfied | `server/tests/lab-04/resolution-gate.unit.test.ts` | Planned |
| **UNIT-03** | Unit | BR-06, BR-07, BR-08 | Action Taken input validator | Validates description length, follow-up note conditionally, minute precision on date | `server/tests/lab-04/action-taken.unit.test.ts` | Planned |
| **API-01** | API | AC-01, FR-01, FR-02 | Create valid Action Taken with authenticated staff | HTTP 201; saved under correct ticket; `performedBy` set to session user | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-02** | API | BR-04 | Attempt to supply spoofed `performedById` | Ignored; creator remains authenticated caller | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-03** | API | AC-01, BR-02, BR-05 | Assign action to a different active staff user | HTTP 201; action saved with designated assignee | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-04** | API | AC-04, BR-05 | Assign action to inactive user or requester | HTTP 400 `VALIDATION_ERROR`; operation rejected | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-05** | API | AC-03, BR-07 | Submit `followUpRequired=true` without note | HTTP 400 with `fields.followUpNote` error | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-06** | API | BR-06, BR-08 | Empty description or invalid future timestamp for Completed | HTTP 400 `VALIDATION_ERROR` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-07** | API | FR-03 | List actions for a ticket | HTTP 200; stable ordering by `actionAt` then `id` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-08** | API | FR-04, BR-09 | Edit planned action and transition to Completed | HTTP 200; version increments; result mandatory; `completedById` recorded | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-09** | API | BR-09 | Attempt to edit Completed or Cancelled action | HTTP 400 `ACTION_IMMUTABLE`; record unchanged | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-10** | API | AC-10, BR-17 | Edit action with stale `expectedVersion` | HTTP 409 `STALE_UPDATE`; record unchanged | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-11** | API | BR-10 | Add or edit action on Closed or Cancelled ticket | HTTP 400 `TICKET_LOCKED` | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-12** | API | BR-01 | Access action ID with mismatched ticket ID | HTTP 404 Not Found | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-13** | API | AC-19 | Idempotent replay of same `clientRequestId` | HTTP 200 OK with existing action record | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-14** | API | BR-08 | Create Planned Action with future date | HTTP 201 Created; future date accepted for planning | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-15** | API | BR-08 | Create Completed Action with future date > 5 minutes | HTTP 400 `VALIDATION_ERROR`; rejected | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-16** | API | FR-01 | Create Action directly as Completed with result | HTTP 201 Created; status Completed and `completedById` recorded | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-17** | API | BR-08 | Complete future Planned Action without actionAt | HTTP 200 OK; actionAt automatically resets to current time | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **API-18** | API | BR-10 | Add Planned Action to Resolved ticket | HTTP 400 `TICKET_LOCKED`; planned action rejected | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **SEC-01** | Security | AC-05, BR-03 | Requester attempts to call staff action endpoints | HTTP 403 Forbidden; no records written | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **SEC-02** | Security | AC-06, FR-05 | Requester reads actions of own vs other ticket | Own ticket: HTTP 200; Other ticket: HTTP 404 | `server/tests/lab-04/actions-taken.api.test.ts` | Planned |
| **WF-01** | API | AC-07, FR-07, BR-11 | Transition to Resolved failing resolution gate | HTTP 400 `RESOLUTION_GATE_NOT_MET` with reasons | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-02** | API | AC-08, BR-11, BR-16 | Transition to Resolved satisfying all gate rules | HTTP 200; status updated; history recorded | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-03** | API | AC-09, BR-12 | Transition outside authorized state matrix | HTTP 400 `INVALID_STATUS_TRANSITION`; rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-04** | API | AC-10, FR-10, BR-17 | Status change with outdated `expectedVersion` | HTTP 409 `STALE_UPDATE`; status preserved | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-05** | API | AC-15, FR-08, BR-13 | Requester reopens own Resolved or Closed ticket | HTTP 200; status Reopened; reason recorded; advisory flag cleared | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-06** | API | AC-11, FR-11, BR-15 | Requester sets "problem appears resolved" flag | HTTP 200; flag true; ticket status unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-07** | API | AC-12, FR-09, BR-16 | Retrieve ticket status audit history | HTTP 200; chronological order; reason included | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-08** | API | BR-18 | Attempt to reassign owner on Resolved ticket | HTTP 400 `TICKET_LOCKED`; assignment blocked | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-09** | API | AC-10, BR-17 | Assign ticket owner with stale `expectedVersion` | HTTP 409 `STALE_UPDATE`; assignment rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **WF-10** | API | AC-10, BR-17 | Reopen ticket with stale `expectedVersion` | HTTP 409 `STALE_UPDATE`; reopen rejected | `server/tests/lab-04/ticket-workflow.api.test.ts` | Planned |
| **DASH-01** | API | AC-02, BR-22 | Requester dashboard metrics isolation | HTTP 200; counts scoped only to caller tickets | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-02** | API | FR-12, BR-19, BR-20 | Requester metric calculation accuracy | Counts match independent database queries | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-03** | API | AC-14, BR-23 | Requester dashboard for user with 0 tickets | HTTP 200; counts = 0; attentionTickets = []; recentTickets = [] | `server/tests/lab-04/requester-dashboard.api.test.ts` | Planned |
| **DASH-04** | API | AC-13, FR-13, BR-21 | Staff dashboard operational calculations (6 cards) | Active counts match database `groupBy` queries | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-05** | API | AC-13, FR-15, FR-16 | Drill-down parity check with `statusGroup=active` | Filtered queue count equals dashboard card count | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-06** | API | FR-14 | Administrator extra user account metrics | `userCounts` returned for Admin; absent for Staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **DASH-SEC** | Security | BR-22 | Dashboard role authorization guards | Requester accessing staff dashboard gets 403; unauthenticated gets 401 | `server/tests/lab-04/staff-dashboard.api.test.ts` | Planned |
| **PERF-01** | Smoke | BR-21 | Dashboard endpoint latency budget | Response time < 500ms on seeded dataset | `server/tests/lab-04/performance-smoke.test.ts` | Planned |
| **MIG-01** | Migration | AC-16, BR-26 | Additive migration preserves existing data and rollback | Executed in isolated temp database/schema; tables and counts verified | `server/tests/lab-04/migration-seed.test.ts` | Planned |
| **MIG-02** | Migration | BR-26 | Seed idempotency verification | Running seed twice produces identical row counts | `server/tests/lab-04/migration-seed.test.ts` | Planned |
| **UI-01** | UI | FR-13, FR-15 | Staff dashboard metric cards (6 cards) and navigation | Cards display numbers and valid drill-down links | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-02** | UI | AC-14, FR-18 | Staff dashboard loading, empty, and retry states | Skeleton rendered; retry button functional | `client/tests/lab-04/StaffDashboard.test.tsx` | Planned |
| **UI-03** | UI | FR-12, FR-15 | Requester dashboard cards and attention tickets | Cards render correct values and navigate cleanly | `client/tests/lab-04/RequesterDashboard.test.tsx` | Planned |
| **UI-04** | UI | FR-01, AC-03 | Actions Taken create form logic and validation | Follow-up note required only when checked | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-05** | UI | AC-06, FR-05 | Requester read-only Actions Taken view | Renders list; write/edit buttons absent | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-06** | UI | AC-19, FR-19 | Double submit prevention and form preservation | Button disabled while saving; text preserved | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-07** | UI | AC-07, FR-06 | Resolution Gate feedback in status dropdown | Missing gate requirements displayed clearly | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **UI-08** | UI | AC-20, FR-20 | Forbidden screen on unauthorized route | Renders 403 page with link to Dashboard | `client/tests/lab-04/Navigation.test.tsx` | Planned |
| **UI-09** | UI | FR-04 | Actions Taken list renders Completed By and Assignee | Visible attribution for completed actions | `client/tests/lab-04/ActionsTaken.test.tsx` | Planned |
| **UI-10** | UI | AC-15, FR-08 | Requester Reopen button and modal reason input | Opens modal, submits reason, refreshes status | `client/tests/lab-04/TicketWorkflow.test.tsx` | Planned |
| **STYLE-01** | UI Style | AC-18 | Zen Green tokens and computed badge styles | Playwright verification of `theme.css` tokens and badge text cues | `e2e/lab-04/responsive-accessibility.spec.ts` | Planned |
| **E2E-01** | E2E | AC-01, AC-06 | Multiple staff record actions on single ticket | Both actions visible; requester view read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | Planned |
| **E2E-02** | E2E | AC-07, AC-08, AC-15 | Full ticket lifecycle from create to reopen | Gate enforced; resolution recorded; reopen works | `e2e/lab-04/ticket-resolution.spec.ts` | Planned |
| **E2E-03** | E2E | AC-13 | Staff dashboard drill-down navigation journeys | Clicking card filters queue with exact parity | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **E2E-04** | E2E | AC-02 | Requester dashboard journeys and attention items | Shows attention tickets; drill-down to My Tickets | `e2e/lab-04/dashboards.spec.ts` | Planned |
| **RESP-01** | Responsive | AC-18 | Multi-viewport inspection across 1280, 768, 375 | Zero horizontal scroll; no clipping or overlap | `e2e/lab-04/responsive-accessibility.spec.ts` | Planned |
| **A11Y-01** | Accessibility | AC-18 | Keyboard navigation and visible focus rings | Accessible Tab cycle; focus trap in modals | `e2e/lab-04/responsive-accessibility.spec.ts` | Planned |
| **TSC-01** | Typecheck | DoD 6 | TypeScript strict compilation without emit | Zero errors on `server` and `client` | `npx tsc --noEmit` | Planned |
| **REG-01** | Regression | AC-17, FR-17 | Complete Lab 1 to Lab 3 backend test suites | All suites pass 100% after documented contract adjustments | `server/tests/lab-01..03/*` | Planned |
| **REG-02** | Regression | AC-17, FR-17 | Complete Lab 1 to Lab 3 client test suites | All suites pass 100% without regression | `client/tests/lab-01..03/*` | Planned |
| **REG-E2E-01** | Regression | AC-17 | Lab 2 Requester Ticket Flow E2E | Passes with session login through /login | `e2e/lab-02/requester-ticket-flow.spec.ts` | Planned |
| **REG-E2E-02** | Regression | AC-17 | Lab 3 Authentication, Staff & Admin E2E | All 3 Playwright specs pass cleanly | `e2e/lab-03/*` | Planned |
