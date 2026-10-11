# Lab 4 Sprint Engineering Specification

Sprint 4 engineering contract for TokTickIT. It extends `docs/lab-03/specification.md`; every Lab 1, 2, and 3 requirement, rule, and API remains in force unless this document explicitly evolves it. Full technical details are defined in `api-spec.md` (REST contract), `ui-spec.md` (screens and layouts), and `tests.md` (planned tests and traceability).

## 1. Sprint Goal

Complete the core service-desk workflow: IT Staff and Administrators record the actual work on a Ticket as Actions Taken, the backend enforces the final Ticket status rules (including a resolution gate and stale-update protection), every role starts from a concise dashboard linking into detailed views, and the complete application built across Labs 1 to 3 is hardened, regression-tested, and ready for final release.

## 2. Stakeholder Request Interpretation

While the service desk can already receive Tickets and communicate via Public Comments and Internal Notes, it lacks a structured mechanism to plan, execute, and verify actual technical work. Each Ticket requires a recorded list of Actions Taken: when the work occurred, description of the action, result obtained, who performed it (recorded automatically from the session), who completed it, whether follow-up is necessary (with an accompanying note), and references to related attachment files. 

The primary Ticket Owner coordinates the Ticket overall, while different IT Staff members can perform individual actions. A Requester indication that "the problem appears resolved" is purely advisory: IT Staff must evaluate the recorded actions and formally transition the Ticket to Resolved. Furthermore, Requesters and IT Staff require concise, role-appropriate dashboards that summarize operational load without replacing the comprehensive Ticket lists. Finally, all features must adhere consistently to the Zen Green design system.

## 3. Scope

### 3.1. Included
- Actions Taken on Tickets: list, create, view/edit, complete, and cancel, with assignees selected from active IT Staff or Administrators.
- Read-only Actions Taken presentation for Requesters on Tickets they own.
- Final Ticket status-transition matrix with role-based enforcement, server-side resolution gate, Requester reopen capability, and append-only status audit history.
- Optimistic concurrency protection (`expectedVersion`) for Ticket status updates, ticket assignments, and Action Taken edits to prevent accidental overwrites.
- Role-based Dashboards for Requesters and IT Staff (Administrators reuse the Staff Dashboard with additional user-account statistics).
- Drill-down navigation: every metric card links to a filtered view or detail screen with matching query parameters.
- Dashboard set as the primary landing page and first navigation item for authenticated users.
- PostgreSQL Prisma schema evolution, safe additive migration, documented rollback script, and an idempotent seed script.
- Final regression verification of all Lab 1, 2, and 3 features, responsive multi-viewport layouts, accessibility compliance, and removal of obsolete artifacts.

### 3.2. Explicitly Excluded
- Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
- External email, SMS, LINE, or push notification services.
- Inventory tracking, purchasing, spare parts, payroll, and time-sheet billing calculations.
- Multi-level approval workflows and digital signatures.
- Advanced business-intelligence report builders, custom query designers, or export warehouses.
- Hard deletion of Actions Taken or status history records.
- Any feature not specified in this engineering contract.

## 4. Functional Requirements

### 4.1. Role Authorization Matrix
Note: Both Requesters and Staff navigate to the single `/dashboard` route in the frontend, which renders the appropriate view based on the session role. HTTP 403 Forbidden is enforced if a user calls the opposite role's API endpoint (`/api/dashboard/requester` vs `/api/dashboard/staff`).

| Operational Capability | Requester | IT Staff | Administrator |
| :--- | :---: | :---: | :---: |
| Sees Requester Dashboard | Allowed | Not Allowed (403 on API) | Not Allowed (403 on API) |
| Sees Staff Dashboard | Not Allowed (403 on API) | Allowed | Allowed (includes User Counts) |
| View Actions Taken on owned Ticket | Allowed (Read-only) | Allowed | Allowed |
| View Actions Taken on other Ticket | Not Allowed (404) | Allowed | Allowed |
| Create Action Taken on Ticket | Not Allowed (403) | Allowed | Allowed |
| Edit/Complete/Cancel Action Taken | Not Allowed (403) | Allowed | Allowed |
| Change Ticket Status via Queue/Detail | Not Allowed (403) | Allowed (Matrix & Gate) | Allowed (Matrix & Gate) |
| Assign/Reassign Ticket Owner | Not Allowed (403) | Allowed (Active Status only) | Allowed (Active Status only) |
| Reopen own Resolved or Closed Ticket | Allowed (Reopen only) | Allowed (Full Matrix) | Allowed (Full Matrix) |
| View Status History on owned Ticket | Allowed | Allowed | Allowed |
| View Internal Notes | Not Allowed (Hidden) | Allowed | Allowed |
| User Management (`/admin/users`) | Not Allowed (Forbidden) | Not Allowed (Forbidden) | Allowed |

### 4.2. Functional Requirement Statements
- **FR-01**: The system shall allow IT Staff and Administrators to create an Action Taken on any active Ticket with Action Date/Time, Description, Result, Follow-Up Required flag, Follow-up Note, Attachment Notes, and an Assignee. An Action may be created as `PLANNED` or directly as `COMPLETED` (requiring a non-empty Result).
- **FR-02**: The system shall record the authenticated user as "Performed by" automatically; client-supplied values for this field shall be ignored.
- **FR-03**: The system shall list all Actions Taken of a Ticket in stable chronological order for IT Staff and Administrators.
- **FR-04**: The system shall allow IT Staff and Administrators to edit a Planned Action Taken, update its date, and mark it Completed (recording "Completed by") or Cancelled.
- **FR-05**: The system shall present all Actions Taken on a Ticket to the owning Requester in read-only mode, hiding all creation and modification controls.
- **FR-06**: The system shall permit Ticket status transitions only along the authorized status-transition matrix and only for roles permitted for that specific transition.
- **FR-07**: The system shall reject transitions to Resolved unless the Resolution Gate (BR-11) is satisfied, even when client interfaces are bypassed.
- **FR-08**: The system shall allow a Requester to reopen their own Ticket if it is currently Resolved or Closed, recording an optional reason and incrementing ticket version.
- **FR-09**: The system shall append an immutable audit log entry in `TicketStatusHistory` for every successful status transition.
- **FR-10**: The system shall detect stale Ticket status updates, ticket reassignments, and Action edits using `expectedVersion`, returning HTTP 409 Conflict rather than overwriting newer records.
- **FR-11**: The Requester "problem appears resolved" indication shall remain advisory and shall not directly modify Ticket status.
- **FR-12**: The system shall provide a Requester Dashboard summarizing metrics, attention items (Waiting for Requester), recently updated tickets, and resolved tickets strictly owned by the authenticated Requester.
- **FR-13**: The system shall provide an IT Staff Dashboard summarizing operational queue workload (including unassigned count) and the current user's assigned active work.
- **FR-14**: The system shall provide Administrators with the IT Staff Dashboard supplemented with concise user-account counts.
- **FR-15**: Every dashboard count and card shall provide drill-down links to the Ticket Queue or My Tickets with matching filters pre-applied.
- **FR-16**: The Ticket Queue and My Tickets screens shall accept URL query parameters matching dashboard metrics (`statusGroup`, `currentStatus`, `status`, `itPriority`, `assignedTo`).
- **FR-17**: All Lab 1, 2, and 3 screens and APIs shall remain fully operational for permitted roles after accounting for documented contract evolutions.
- **FR-18**: Every interface shall present consistent loading, validation, success, empty, forbidden, conflict, and safe failure feedback.
- **FR-19**: Repeated form submissions shall be prevented by disabling submit buttons during active network requests.
- **FR-20**: Authenticated users navigating to unauthorized routes shall receive a clear Forbidden page rather than an unexpected login redirect.

## 5. Business Rules

### Actions Taken Rules
- **BR-01**: An Action Taken belongs to exactly one Ticket and cannot be moved or re-linked to another Ticket.
- **BR-02**: The Ticket Owner coordinates the Ticket, but an Action Taken may be performed by or assigned to any active IT Staff member or Administrator.
- **BR-03**: Only IT Staff and Administrators may create or modify Actions Taken. Requesters may only read Actions on Tickets they own. Attempting to access Actions on another user's Ticket returns HTTP 404.
- **BR-04**: "Performed by" is permanently bound to the authenticated creator upon creation and cannot be updated.
- **BR-05**: The assignee must be an active IT Staff or Administrator user; if omitted, it defaults to the creator. Non-staff or inactive assignees shall be rejected with HTTP 400.
- **BR-06**: Action Description is mandatory (1 to 2000 characters after trimming). Result is optional while status is Planned (up to 2000 characters) and becomes mandatory when transitioning to Completed. Attachment Notes are optional (up to 500 characters).
- **BR-07**: When Follow-Up Required is true, Follow-up Note is mandatory (1 to 1000 characters). When false, any provided Follow-up Note is cleared to null.
- **BR-08**: Action Date/Time defaults to the current timestamp. For `COMPLETED` actions, it cannot precede Ticket creation time (evaluated at minute precision) and cannot be more than 5 minutes in the future. For `PLANNED` actions, future dates are allowed to support work scheduling. When completing a planned action, if `actionAt` is omitted and stored date is in the future, it automatically resets to the current timestamp.
- **BR-09**: Action status transitions strictly from `PLANNED` to `COMPLETED` or `PLANNED` to `CANCELLED`. Once an action is in `COMPLETED` or `CANCELLED` status, it is immutable; any modification attempt is rejected with HTTP 400 `ACTION_IMMUTABLE`. Completing an action sets `completedById` to the authenticated user.
- **BR-10**: Actions Taken cannot be added, edited, or cancelled on Tickets with status `CLOSED` or `CANCELLED`. Furthermore, adding a `PLANNED` Action on a `RESOLVED` Ticket is prohibited to prevent retroactively violating the Resolution Gate. Attempts return HTTP 400 `TICKET_LOCKED`.

### Ticket Lifecycle and Resolution Rules
- **BR-11 (Resolution Gate)**: A Ticket may transition to `RESOLVED` only when all three conditions are satisfied:
  1. The Ticket has an assigned Ticket Owner (`assignedToId` is not null).
  2. The Ticket has at least one `COMPLETED` Action Taken.
  3. The Ticket has zero `PLANNED` Actions Taken.
- **BR-12**: Permitted status transitions follow the authoritative matrix:
  - `NEW` -> `OPEN` (Staff), `IN_PROGRESS` (Staff), `CANCELLED` (Staff)
  - `OPEN` -> `IN_PROGRESS` (Staff), `WAITING_FOR_REQUESTER` (Staff), `CANCELLED` (Staff)
  - `IN_PROGRESS` -> `WAITING_FOR_REQUESTER` (Staff), `RESOLVED` (Staff, gated by BR-11), `CANCELLED` (Staff)
  - `WAITING_FOR_REQUESTER` -> `IN_PROGRESS` (Staff), `RESOLVED` (Staff, gated by BR-11), `CANCELLED` (Staff)
  - `RESOLVED` -> `CLOSED` (Staff), `REOPENED` (Requester or Staff)
  - `CLOSED` -> `REOPENED` (Requester or Staff)
  - `REOPENED` -> `IN_PROGRESS` (Staff), `CANCELLED` (Staff)
  - `CANCELLED` -> Terminal state (no further transitions permitted).
  - Legacy `PENDING` -> `OPEN` (Staff), `CANCELLED` (Staff).
- **BR-13**: Requesters are authorized only to trigger the `REOPENED` transition on their own Tickets currently in `RESOLVED` or `CLOSED` status.
- **BR-14**: Reopening a Ticket immediately clears any active "problem appears resolved" flag.
- **BR-15**: The Requester indication that the problem appears resolved is purely advisory and does not change Ticket status.
- **BR-16**: Every successful status transition appends a permanent record in `TicketStatusHistory` recording from-status, to-status, changed-by user, optional reason, and timestamp.
- **BR-17**: Status transitions (`PATCH /api/staff/tickets/:id/status`), assignments (`PATCH /api/staff/tickets/:id/assign`), and Action updates (`PATCH /api/staff/tickets/:id/actions/:actionId`) must supply `expectedVersion`. If the record has been updated concurrently (`version != expectedVersion`), the update is rejected with HTTP 409 `STALE_UPDATE`. For Requester reopen (`POST /api/tickets/:id/reopen`), `expectedVersion` is optional; if provided and mismatched with the current ticket version, it returns HTTP 409 `STALE_UPDATE`.
- **BR-18**: Assigning or reassigning a ticket owner (`PATCH /api/staff/tickets/:id/assign`) is prohibited on terminal or resolved tickets (`RESOLVED`, `CLOSED`, `CANCELLED`) to prevent bypassing the Resolution Gate owner requirement. Attempts return HTTP 400 `TICKET_LOCKED`.

### Dashboard Metric Rules
- **BR-19**: "Active" tickets for dashboard aggregation comprise statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`, and legacy `PENDING`.
- **BR-20**: "Recent" tickets for dashboard activity lists represent records updated within the rolling last 7 days (7 x 24 hours) from request time.
- **BR-21**: All dashboard metrics must be computed server-side directly from database records. In-memory array filtering of entire collections is prohibited.
- **BR-22**: Requester Dashboard metrics strictly scope queries to the authenticated user ID (`requesterId = req.user.id`).
- **BR-23**: Zero-state dashboard handling: users with no tickets or assignments must receive zero counts and empty arrays with HTTP 200, never errors.
- **BR-24**: Adding or updating an Action Taken updates the parent Ticket's `updatedAt` timestamp, ensuring dashboard recently-updated queues stay fresh.
- **BR-25**: Dashboard recent operational activity lists display up to 5 tickets of any status updated within the rolling last 7 days, sorted in descending order of update time.
- **BR-26**: Database seeds must be idempotent, safely re-runnable, and provide at least 12 realistic records across all statuses and ownership conditions with staggered timestamps extending past 7 days.

## 6. UI Specification Summary

- **App Shell and Navigation**: `/dashboard` becomes the primary landing page upon login. The navigation bar displays role-appropriate links matching the real application shell:
  - Requester: Dashboard, My Tickets, Create Ticket, User Badge, Logout.
  - IT Staff: Dashboard, Ticket Queue, User Badge, Logout.
  - Administrator: Dashboard, Ticket Queue, User Management, User Badge, Logout.
- **Mobile Menu**: Fully role-aware, matching desktop navigation with keyboard trap and accessible toggle controls.
- **Actions Taken UI**:
  - Located on Ticket Detail between summary metadata and Public Comments.
  - IT Staff sees an inline "+ Add Action" form, action rows with status badges, and edit/complete/cancel options.
  - Action list displays: Action Date, Description, Result, Status, Assignee, Performed By, and Completed By (when completed).
  - Requester sees a clean read-only list titled "Work Performed by IT".
  - Field errors render directly below the corresponding input with `aria-describedby` links.
- **Status Control**:
  - Displays only permitted transitions dynamically.
  - Shows clear explanatory alert banners if the Resolution Gate is not yet satisfied.
  - Provides confirmation before saving status transitions.
  - Status History card renders directly below the status control box.
- **Visual Design Tokens**: Strictly uses tokens from `client/src/theme.css` (`--bs-primary: #006b3c`, `--bs-info: #0b7a46`, `--zg-pale-green: #eaf6ef`, `--zg-readonly-bg: #f3f5f4`, `--zg-shadow-soft`).

## 7. Data Changes

### 7.1. Database Models and Enums
- **Enum `ActionStatus`**: `PLANNED`, `COMPLETED`, `CANCELLED`.
- **Model `ActionTaken`**:
  - Fields: `id`, `ticketId`, `performedById`, `assigneeId`, `completedById` (nullable), `actionAt`, `description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `status` (`ActionStatus`), `version`, `clientRequestId`, `createdAt`, `updatedAt`.
  - Composite indexes: `@@index([ticketId, actionAt])` and `@@index([assigneeId, status])`.
  - Unique constraint: `@@unique([ticketId, clientRequestId])` for idempotent action creation.
- **Model `TicketStatusHistory`**:
  - Fields: `id`, `ticketId`, `fromStatus`, `toStatus`, `changedById`, `reason` (nullable string), `changedAt`.
  - Composite indexes: `@@index([ticketId, changedAt])` and `@@index([toStatus, changedAt])`.
- **Model `Ticket` Evolution**:
  - Added field: `version Int @default(0)` to support atomic optimistic locking.

### 7.2. Migration and Backfill Decisions
- **Additive Migration**: An additive migration creates `ActionTaken`, `TicketStatusHistory`, `ActionStatus` enum, and adds `version` (default 0) to `Ticket`. No existing tables or columns are dropped or renamed.
- **Legacy Records**: Existing tickets created in Labs 1 to 3 start with `version = 0`, zero Actions Taken, and no status history. They remain fully operational. If a staff member resolves a legacy ticket, they must first record a Completed Action Taken to satisfy the Resolution Gate.
- **Rollback SQL (`server/prisma/rollback-lab4.sql`)**: Drops `ActionTaken` and `TicketStatusHistory` tables, drops `ActionStatus` enum, and removes the `version` column from `Ticket`. Verification tests verify row counts before migration, after migration, and after rollback.
- **Seed Strategy**: The seed script populates at least 12 demo tickets with staggered timestamps (some within 7 days, some older than 7 days) to demonstrate realistic recent vs older dashboard buckets.

## 8. API Contract

Base path: `/api`. Error responses follow standard `{ error: { code, message, fields? } }`.

### 8.1. Actions Taken Endpoints
- `GET /api/tickets/:id/actions`: Returns actions array. Staff/Admin access all; Requesters access owned tickets (other tickets return 404).
- `POST /api/staff/tickets/:id/actions`: Creates action (status defaults to `PLANNED` or can be set to `COMPLETED` with result). Replay with same `clientRequestId` returns HTTP 200 with existing row.
- `PATCH /api/staff/tickets/:id/actions/:actionId`: Edits Planned action, completes it (recording `completedById`), or cancels it. Updatable fields: `actionAt`, `description`, `result`, `status`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `assigneeId`. Requires `expectedVersion`. Modifying Completed/Cancelled action returns 400 `ACTION_IMMUTABLE`.

### 8.2. Ticket Workflow Endpoints
- `GET /api/tickets/:id`: Returns ticket details, `version`, `allowedTransitions`, and `resolutionGate: { ok, reasons }`. Permitted to IT Staff/Admin for any ticket, and Requesters for owned tickets (non-owned returns 404).
- `PATCH /api/staff/tickets/:id/status`: Transitions status with `expectedVersion`. Enforces matrix and Resolution Gate (returns 400 `RESOLUTION_GATE_NOT_MET` with reasons).
- `PATCH /api/staff/tickets/:id/assign`: Updates owner and increments `version`. Blocked on `RESOLVED`/`CLOSED`/`CANCELLED` tickets with 400 `TICKET_LOCKED`.
- `POST /api/tickets/:id/reopen`: Reopens resolved or closed ticket for owning requester, accepting optional `reason` and optional `expectedVersion`. Clears advisory resolved flag and increments version.
- `GET /api/tickets/:id/history`: Returns audit trail sorted by `changedAt asc`. Permitted to IT Staff/Admin for any ticket, and Requesters for owned tickets (non-owned returns 404).

### 8.3. Dashboard Endpoints
- `GET /api/dashboard/requester`: Returns `myOpenTickets`, `waitingForRequester`, `inProgress`, `resolved`, `closed`, `attentionTickets`, and `recentTickets`.
- `GET /api/dashboard/staff`: Returns `newTickets`, `openTickets`, `inProgress`, `waitingForRequester`, `myAssigned` (active only), `unassigned` (active only), `recentTickets` (recent operational tickets), and `userCounts` (Admin only).
- Query filtering support: `GET /api/tickets` and `GET /api/staff/tickets` accept `statusGroup=active` (matching BR-19) and `itPriority=none`.

## 9. Acceptance Criteria

- **AC-01**: Given a permitted IT Staff member, when creating an Action Taken with valid data, it is saved under the correct Ticket with the authenticated creator as `performedBy`.
- **AC-02**: Given an authenticated Requester, when fetching dashboard data, only metrics and recent tickets belonging to that Requester are returned.
- **AC-03**: Given an IT Staff member, when `followUpRequired` is checked, the system requires a non-empty `followUpNote`.
- **AC-04**: Given an IT Staff member, when assigning an action to an inactive user or non-staff user, the system rejects the assignment with HTTP 400.
- **AC-05**: Given an authenticated Requester, when attempting to create or edit an Action Taken via direct API calls, the server returns HTTP 403 Forbidden.
- **AC-06**: Given an authenticated Requester, when viewing their own Ticket, all Actions Taken are displayed in read-only format without write controls.
- **AC-07**: Given a Ticket missing an owner, completed actions, or containing planned actions, when an IT Staff attempts to transition it to Resolved, the system rejects it with HTTP 400 `RESOLUTION_GATE_NOT_MET` and lists the missing gate conditions.
- **AC-08**: Given a Ticket satisfying all Resolution Gate criteria, when an IT Staff transitions it to Resolved, the update succeeds and records an entry in `TicketStatusHistory`.
- **AC-09**: Given any user, when attempting a status transition not allowed by the transition matrix, the server rejects the request with HTTP 400 `INVALID_STATUS_TRANSITION`.
- **AC-10**: Given a status update, assignment, or action edit with an outdated `expectedVersion`, the server rejects the update with HTTP 409 `STALE_UPDATE`.
- **AC-11**: Given a Requester marking "problem appears resolved", the flag is updated without altering the Ticket status.
- **AC-12**: Given multiple status transitions on a Ticket, the history endpoint returns entries in ascending chronological order.
- **AC-13**: Given an IT Staff member, the staff dashboard metrics accurately reflect authoritative database counts and drill-down links produce matching row counts.
- **AC-14**: Given a user with zero tickets or assignments, dashboard endpoints return zero counts and empty arrays with HTTP 200.
- **AC-15**: Given a Requester viewing their own Resolved or Closed Ticket, the system permits reopening the Ticket, setting status to Reopened, recording the reason in history, and clearing the resolution advisory flag.
- **AC-16**: Given existing database records from Labs 1 to 3, running the Lab 4 migration preserves all existing users, tickets, comments, and attachments intact.
- **AC-17**: Given the complete application, all existing automated test suites from Labs 1, 2, and 3 continue to pass without failure after accounting for documented contract evolutions.
- **AC-18**: Given the application across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports, all screens display without clipping, overlapping controls, or horizontal overflow.
- **AC-19**: Given double-clicking a submit button or network retries, duplicate records are prevented and entered form data is preserved upon recoverable errors.
- **AC-20**: Given an authenticated user accessing an unauthorized route directly via URL, the system displays a clear Forbidden screen with a link to return to Dashboard.

## 10. Product Definition of Done

1. All 20 Acceptance Criteria (AC-01 through AC-20) are verified by passing automated unit, API, and E2E tests.
2. The engineering specification was created and merged before implementation feature branches.
3. Database migrations are additive, preserve legacy data, and include a verified rollback script.
4. Server-side RBAC enforces permissions on all endpoints with proper HTTP 401, 403, and 404 responses.
5. All automated test suites (server, client, Playwright) pass 100% on the final integration branch.
6. TypeScript compile check (`tsc --noEmit`) completes with zero errors on both client and server.
7. Visual and responsive quality checklist is verified across Desktop, Tablet, and Mobile viewports without horizontal scrolling.
8. Obsolete Lab 2 remnants are cleaned from the user interface.
9. All documentation files under `docs/lab-04/` are written in formal English with zero Unicode em dashes.
10. All sprint issues are tracked on GitHub Kanban and moved to Done following peer review sign-offs.

## 11. Assumptions and Decisions

1. **Assignee Selection Scope**: In accordance with AC-01 and Rubric Part 6, the assignee for an Action Taken must be selected from active IT Staff or Administrators. Inactive accounts and Requesters are strictly rejected.
2. **Resolution Gate Enforcement on Legacy Tickets**: Existing tickets that do not have Actions Taken cannot bypass the Resolution Gate. To resolve a legacy ticket, staff must record at least one Completed Action Taken.
3. **Information Hiding via 404**: In alignment with Lab 3 security conventions, when a Requester queries actions, comments, or details of a Ticket they do not own, the system responds with HTTP 404 Not Found rather than 403 Forbidden to prevent ticket existence enumeration.
4. **Idempotency Strategy**: Creating an Action Taken uses a client-generated UUID `clientRequestId`. Submitting the same request again returns HTTP 200 with the existing record rather than creating a duplicate or failing.
5. **Performed by vs Assignee vs Completed by**: `performedBy` permanently denotes the creator who initially logged the action. The `assignee` denotes the technician currently assigned to the action. When an action is transitioned to Completed, `completedById` is recorded as the user who finalized the work.
6. **Future Dating on Planned Actions**: To allow technicians to plan maintenance, `PLANNED` actions may specify future dates. The strict clock-skew restriction (not more than 5 minutes in the future) applies exclusively to `COMPLETED` actions. When completing a planned action, if `actionAt` is omitted, it resets automatically to the current timestamp.
7. **Resolved Ticket Invariant on Planned Actions**: Adding a `PLANNED` Action to a Ticket already in `RESOLVED` status is prohibited (returns `TICKET_LOCKED`) to prevent retroactively violating the Resolution Gate condition. To schedule further work, the Ticket must first be reopened.
8. **Ticket Detail Route Guard Modernization**: In Lab 2, `GET /api/tickets/:id` was protected with `requireActiveRequester`. For Lab 4, the ticket detail endpoint (as well as `/actions` and `/history`) operates under an expanded role-aware guard: authenticated IT Staff and Administrators may view any ticket, while Requesters are restricted to tickets they own (returning HTTP 404 for non-existent or unowned tickets).
