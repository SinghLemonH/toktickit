# Lab 4 Sprint Engineering Specification

Sprint 4 engineering contract for TokTickIT. It extends `docs/lab-03/specification.md`; every Lab 1, 2, and 3 requirement, rule, and API remains in force unless this document explicitly evolves it. Full technical details are defined in `api-spec.md` (REST contract), `ui-spec.md` (screens and layouts), and `tests.md` (planned tests and traceability).

## 1. Sprint Goal

Complete the core service-desk workflow: IT Staff and Administrators record the actual work on a Ticket as Actions Taken, the backend enforces the final Ticket status rules (including a resolution gate and stale-update protection), every role starts from a concise dashboard linking into detailed views, and the complete application built across Labs 1 to 3 is hardened, regression-tested, and ready for final release.

## 2. Stakeholder Request Interpretation

While the service desk can already receive Tickets and communicate via Public Comments and Internal Notes, it lacks a structured mechanism to plan, execute, and verify actual technical work. Each Ticket requires a recorded list of Actions Taken: when the work occurred, description of the action, result obtained, who performed it (recorded automatically from the session), whether follow-up is necessary (with an accompanying note), and references to related attachment files. 

The primary Ticket Owner coordinates the Ticket overall, while different IT Staff members can perform individual actions. A Requester indication that "the problem appears resolved" is purely advisory: IT Staff must evaluate the recorded actions and formally transition the Ticket to Resolved. Furthermore, Requesters and IT Staff require concise, role-appropriate dashboards that summarize operational load without replacing the comprehensive Ticket lists. Finally, all features must adhere consistently to the Zen Green design system.

## 3. Scope

### 3.1. Included
- Actions Taken on Tickets: list, create, view/edit, complete, and cancel, with assignees selected from active IT Staff or Administrators.
- Read-only Actions Taken presentation for Requesters on Tickets they own.
- Final Ticket status-transition matrix with role-based enforcement, server-side resolution gate, Requester reopen capability, and append-only status audit history.
- Optimistic concurrency protection (`expectedVersion`) for Ticket status updates and Action Taken edits to prevent accidental overwrites.
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

## 4. Roles and Authorization Matrix

### 4.1. Authorization Matrix
| Operational Capability | Requester | IT Staff | Administrator |
| :--- | :---: | :---: | :---: |
| View own Dashboard (`/dashboard`) | Allowed | Not Allowed (Forbidden) | Not Allowed (Forbidden) |
| View Staff Dashboard (`/dashboard`) | Not Allowed (Forbidden) | Allowed | Allowed (includes User Counts) |
| View Actions Taken on owned Ticket | Allowed (Read-only) | Allowed | Allowed |
| View Actions Taken on other Ticket | Not Allowed (404) | Allowed | Allowed |
| Create Action Taken on Ticket | Not Allowed (403) | Allowed | Allowed |
| Edit/Complete/Cancel Action Taken | Not Allowed (403) | Allowed | Allowed |
| Change Ticket Status via Queue/Detail | Not Allowed (403) | Allowed (Matrix & Gate) | Allowed (Matrix & Gate) |
| Reopen own Resolved or Closed Ticket | Allowed (Reopen only) | Allowed (Full Matrix) | Allowed (Full Matrix) |
| View Status History on owned Ticket | Allowed | Allowed | Allowed |
| View Internal Notes | Not Allowed (403/Hidden) | Allowed | Allowed |
| User Management (`/admin/users`) | Not Allowed (Forbidden) | Not Allowed (Forbidden) | Allowed |

## 5. Functional Requirements

### Actions Taken
- **FR-01**: The system shall allow IT Staff and Administrators to create an Action Taken on any active Ticket with Action Date/Time, Description, Result, Follow-Up Required flag, Follow-up Note, Attachment Notes, and an Assignee.
- **FR-02**: The system shall record the authenticated user as "Performed by" automatically; client-supplied values for this field shall be ignored.
- **FR-03**: The system shall list all Actions Taken of a Ticket in stable chronological order for IT Staff and Administrators.
- **FR-04**: The system shall allow IT Staff and Administrators to edit a Planned Action Taken and mark it Completed or Cancelled.
- **FR-05**: The system shall present all Actions Taken on a Ticket to the owning Requester in read-only mode, hiding all creation and modification controls.

### Ticket Lifecycle and Workflow
- **FR-06**: The system shall permit Ticket status transitions only along the authorized status-transition matrix and only for roles permitted for that specific transition.
- **FR-07**: The system shall reject transitions to Resolved unless the Resolution Gate (BR-11) is satisfied, even when client interfaces are bypassed.
- **FR-08**: The system shall allow a Requester to reopen their own Ticket if it is currently Resolved or Closed.
- **FR-09**: The system shall append an immutable audit log entry in `TicketStatusHistory` for every successful status transition.
- **FR-10**: The system shall detect stale Ticket status updates and Action edits using `expectedVersion`, returning HTTP 409 Conflict rather than overwriting newer records.
- **FR-11**: The Requester "problem appears resolved" indication shall remain advisory and shall not directly modify Ticket status.

### Role Dashboards
- **FR-12**: The system shall provide a Requester Dashboard summarizing metrics, attention items (Waiting for Requester), and recent tickets strictly owned by the authenticated Requester.
- **FR-13**: The system shall provide an IT Staff Dashboard summarizing operational queue workload and the current user's assigned work.
- **FR-14**: The system shall provide Administrators with the IT Staff Dashboard supplemented with concise user-account counts.
- **FR-15**: Every dashboard count and card shall provide drill-down links to the Ticket Queue or My Tickets with matching filters pre-applied.
- **FR-16**: The Ticket Queue and My Tickets screens shall accept URL query parameters matching dashboard metrics (`statusGroup`, `currentStatus`, `status`, `itPriority`, `assignedTo`).

### System Hardening and Accessibility
- **FR-17**: All Lab 1, 2, and 3 screens and APIs shall remain fully operational for permitted roles without regression.
- **FR-18**: Every interface shall present consistent loading, validation, success, empty, forbidden, conflict, and safe failure feedback.
- **FR-19**: Repeated form submissions shall be prevented by disabling submit buttons during active network requests.
- **FR-20**: Authenticated users navigating to unauthorized routes shall receive a clear Forbidden page rather than an unexpected login redirect.

## 6. Business Rules

### Actions Taken Rules
- **BR-01**: An Action Taken belongs to exactly one Ticket and cannot be moved or re-linked to another Ticket.
- **BR-02**: The Ticket Owner coordinates the Ticket, but an Action Taken may be performed by or assigned to any active IT Staff member or Administrator.
- **BR-03**: Only IT Staff and Administrators may create or modify Actions Taken. Requesters may only read Actions on Tickets they own.
- **BR-04**: "Performed by" is permanently bound to the authenticated creator upon creation and cannot be updated.
- **BR-05**: The assignee must be an active IT Staff or Administrator user; if omitted, it defaults to the creator. Non-staff or inactive assignees shall be rejected.
- **BR-06**: Action Description is mandatory (1 to 2000 characters after trimming). Result is optional while status is Planned (up to 2000 characters) and becomes mandatory when transitioning to Completed. Attachment Notes are optional (up to 500 characters).
- **BR-07**: When Follow-Up Required is true, Follow-up Note is mandatory (1 to 1000 characters). When false, any provided Follow-up Note is cleared to null.
- **BR-08**: Action Date/Time defaults to the current timestamp. It cannot be earlier than Ticket creation time (evaluated at minute precision) and cannot be more than 5 minutes in the future.
- **BR-09**: Action status transitions strictly from `PLANNED` to `COMPLETED` or `PLANNED` to `CANCELLED`. Once Completed or Cancelled, the record is read-only and cannot be altered or deleted.
- **BR-10**: Actions Taken cannot be added, edited, or cancelled on Tickets with status `CLOSED` or `CANCELLED`.

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
  - Note: Legacy `PENDING` tickets are treated as a valid transition source to `OPEN` or `CANCELLED` (Staff).
- **BR-13**: Requesters are authorized only to trigger the `REOPENED` transition on their own Tickets currently in `RESOLVED` or `CLOSED` status.
- **BR-14**: Reopening a Ticket immediately clears any active "problem appears resolved" flag.
- **BR-15**: The Requester indication that the problem appears resolved is purely advisory and does not change Ticket status.
- **BR-16**: Every successful status transition appends a permanent record in `TicketStatusHistory` recording from-status, to-status, changed-by user, and timestamp.
- **BR-17**: Status transitions and Action updates must supply `expectedVersion`. If the record has been updated concurrently (`version != expectedVersion`), the update is rejected with HTTP 409 `STALE_UPDATE`.

### Dashboard Metric Rules
- **BR-18**: "Active" tickets for dashboard aggregation comprise statuses: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`, and legacy `PENDING`.
- **BR-19**: "Recent" tickets for dashboard activity lists represent records updated within the rolling last 7 days (7 x 24 hours) from request time.
- **BR-20**: All dashboard metrics must be computed server-side directly from database records. In-memory array filtering of entire collections is prohibited.
- **BR-21**: Requester Dashboard metrics strictly scope queries to the authenticated user ID (`requesterId = req.user.id`).
- **BR-22**: Zero-state dashboard handling: users with no tickets or assignments must receive zero counts and empty arrays with HTTP 200, never errors.
- **BR-23**: Adding or updating an Action Taken updates the parent Ticket's `updatedAt` timestamp, ensuring dashboard recently-updated queues stay fresh.
- **BR-24**: Dashboard recent activity lists are capped at a maximum of 5 items, sorted in descending order of update time.
- **BR-25**: Database seeds must be idempotent, safely re-runnable, and provide realistic records across all statuses and ownership conditions.

## 7. Data Changes and Architectural Decisions

### 7.1. Database Models and Indexes
- **Model `ActionTaken`**:
  - Fields: `id`, `ticketId`, `performedById`, `assigneeId`, `actionAt`, `description`, `result`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `status`, `version`, `clientRequestId`, `createdAt`, `updatedAt`.
  - Composite indexes: `@@index([ticketId, actionAt])` and `@@index([assigneeId, status])`.
  - Unique constraint: `@@unique([ticketId, clientRequestId])` for idempotent action creation.
- **Model `TicketStatusHistory`**:
  - Fields: `id`, `ticketId`, `fromStatus`, `toStatus`, `changedById`, `changedAt`.
  - Composite indexes: `@@index([ticketId, changedAt])` and `@@index([toStatus, changedAt])`.
- **Model `Ticket` Evolution**:
  - Added field: `version Int @default(0)` to support atomic optimistic locking.

### 7.2. Database Design Justifications (Mandatory)
1. **Decision 1: Append-Only Status Audit Table vs In-Row Timestamps**:
   - Rather than storing multiple transition timestamps directly on the Ticket table, a dedicated `TicketStatusHistory` table provides an immutable audit trail. This enables precise historical tracking, role attribution, and compliance without cluttering the core operational entity.
2. **Decision 2: Optimistic Version-Based Concurrency Control**:
   - Ticket status changes and action updates employ integer `version` fields with atomic conditional updates (`updateMany where id and version`). This avoids heavy database row locks while completely preventing lost-update anomalies during concurrent staff operations.

### 7.3. Migration, Backfill, and Rollback Strategy
- **Additive Migration**: The migration creates `ActionTaken`, `TicketStatusHistory`, and adds `version` (default 0) to `Ticket`. No existing tables or columns are dropped or renamed.
- **Legacy Records**: Existing tickets created in Labs 1 to 3 start with `version = 0`, zero Actions Taken, and no status history. They remain fully operational. If a staff member resolves a legacy ticket, they must first record a Completed Action Taken to satisfy the Resolution Gate.
- **Rollback SQL (`server/prisma/rollback-lab4.sql`)**: Drops `ActionTaken` and `TicketStatusHistory` tables, drops `ActionStatus` enum, and removes the `version` column from `Ticket`. Verification tests verify row counts before migration, after migration, and after rollback.

## 8. UI Specification Summary

- **App Shell and Navigation**: `/dashboard` becomes the primary landing page upon login. The navigation bar displays role-appropriate links:
  - Requester: Dashboard, My Tickets, Create Ticket, Profile / Logout.
  - IT Staff: Dashboard, Ticket Queue, Profile / Logout.
  - Administrator: Dashboard, Ticket Queue, User Management, Profile / Logout.
- **Mobile Menu**: Fully role-aware, matching desktop navigation with keyboard trap and accessible toggle controls.
- **Actions Taken UI**:
  - Located on Ticket Detail between summary metadata and Public Comments.
  - IT Staff sees an inline "+ Add Action" form, action rows with status badges, and edit/complete/cancel options.
  - Requester sees a clean read-only list titled "Work Performed by IT".
  - Field errors render directly below the corresponding input with `aria-describedby` links.
- **Status Control**:
  - Displays only permitted transitions dynamically.
  - Shows clear explanatory alert banners if the Resolution Gate is not yet satisfied.
  - Provides inline confirmation for status changes.

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
- **AC-10**: Given a status update or action edit with an outdated `expectedVersion`, the server rejects the update with HTTP 409 `STALE_UPDATE`.
- **AC-11**: Given a Requester marking "problem appears resolved", the flag is updated without altering the Ticket status.
- **AC-12**: Given multiple status transitions on a Ticket, the history endpoint returns entries in ascending chronological order.
- **AC-13**: Given an IT Staff member, the staff dashboard metrics accurately reflect authoritative database counts and drill-down links produce matching row counts.
- **AC-14**: Given a user with zero tickets or assignments, dashboard endpoints return zero counts and empty arrays with HTTP 200.
- **AC-15**: Given a Requester viewing their own Resolved or Closed Ticket, the system permits reopening the Ticket, setting status to Reopened and clearing the resolution advisory flag.
- **AC-16**: Given existing database records from Labs 1 to 3, running the Lab 4 migration preserves all existing users, tickets, comments, and attachments intact.
- **AC-17**: Given the complete application, all existing automated test suites from Labs 1, 2, and 3 continue to pass without failure.
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
