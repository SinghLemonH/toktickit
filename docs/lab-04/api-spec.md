# Lab 4 REST API Specification

Base path: `/api`. All existing endpoints from Lab 1, Lab 2, and Lab 3 remain active with unchanged contracts except where explicitly updated below.

Authentication is strictly enforced via the `toktickit_session` HTTP-only cookie. Protected endpoints return HTTP 401 when the session is missing or invalid, and HTTP 403 when the authenticated user role lacks authorization. To prevent resource enumeration, when a Requester accesses a ticket they do not own, the system responds with HTTP 404 Not Found.

## 1. Conventions and Error Formats

### 1.1. Standard Error Body
All Lab 4 endpoints return errors in the established JSON structure matching Lab 2 and Lab 3:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable explanation of the error",
    "fields": {
      "followUpNote": "Follow-up note is mandatory when follow-up is required"
    }
  }
}
```

### 1.2. Error Code Registry
| HTTP Code | Error Code | Description |
| :---: | :--- | :--- |
| **400** | `VALIDATION_ERROR` | A required field is missing, invalid, or exceeds length bounds. |
| **400** | `INVALID_STATUS_TRANSITION` | Requested status transition is not permitted by the transition matrix. |
| **400** | `RESOLUTION_GATE_NOT_MET` | Transition to Resolved is blocked because the Resolution Gate conditions are not satisfied. |
| **400** | `ACTION_IMMUTABLE` | Action Taken is in Completed or Cancelled status and cannot be modified. |
| **400** | `TICKET_LOCKED` | Operations (adding actions or reassigning owner) are blocked because the ticket is in a terminal or resolved status. |
| **401** | `UNAUTHORIZED` | Authentication session missing, invalid, or expired. |
| **403** | `FORBIDDEN` | Authenticated user lacks permission for the requested action. |
| **404** | `NOT_FOUND` | Ticket, Action Taken, or user resource does not exist (or requester does not own ticket). |
| **409** | `STALE_UPDATE` | Optimistic locking collision: `expectedVersion` does not match the database `version`. |
| **500** | `INTERNAL_ERROR` | Unexpected server failure. |

### 1.3. Optimistic Concurrency Control
Entities supporting concurrency control expose an integer `version`. Mutation requests must include `expectedVersion` in the request body. If the stored record version does not match `expectedVersion`, the server aborts the update and returns HTTP 409:
```json
{
  "error": {
    "code": "STALE_UPDATE",
    "message": "This record was updated by another user. Please reload the latest state.",
    "currentVersion": 4
  }
}
```

### 1.4. Timestamp Conventions
All timestamps returned by APIs are formatted as ISO-8601 UTC strings (e.g., `2026-10-11T12:00:00.000Z`). Clients format timestamps in the `Asia/Bangkok` timezone.

---

## 2. Actions Taken Endpoints

### 2.1. GET /api/tickets/:id/actions
Retrieves all Actions Taken associated with a Ticket in stable chronological order.

- **Authorization**:
  - `IT_STAFF`, `ADMINISTRATOR`: Permitted on any ticket.
  - `REQUESTER`: Permitted only if `ticket.requesterId == req.user.id`.
- **Response 200 OK**:
```json
[
  {
    "id": 101,
    "ticketId": 15,
    "actionAt": "2026-10-11T09:30:00.000Z",
    "description": "Replaced faulty RAM module and ran diagnostic memory suite.",
    "result": "Diagnostic passed with 0 errors.",
    "followUpRequired": true,
    "followUpNote": "Monitor system stability over the next 48 hours.",
    "attachmentNotes": "Memory test log saved as memtest-results.log",
    "status": "COMPLETED",
    "performedBy": {
      "id": 4,
      "name": "Sarah Johnson"
    },
    "assignee": {
      "id": 4,
      "name": "Sarah Johnson"
    },
    "completedBy": {
      "id": 4,
      "name": "Sarah Johnson"
    },
    "version": 2,
    "clientRequestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "createdAt": "2026-10-11T09:35:00.000Z",
    "updatedAt": "2026-10-11T10:00:00.000Z"
  }
]
```
- **Response 404 Not Found**: Ticket does not exist, or caller is a Requester who does not own the ticket.

### 2.2. POST /api/staff/tickets/:id/actions
Creates a new Action Taken under a Ticket.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "actionAt": "2026-10-11T09:30:00.000Z",
  "description": "Inspected network cable and replaced damaged patch cord.",
  "result": "",
  "status": "PLANNED",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": null,
  "assigneeId": 4,
  "clientRequestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```
- **Validation and Idempotency Rules**:
  - `status`: Optional enum `PLANNED` or `COMPLETED`. Defaults to `PLANNED`. If `COMPLETED`, a non-empty `result` is required.
  - `actionAt`: Optional ISO string. Defaults to current timestamp. For `COMPLETED` actions, it cannot precede Ticket `createdAt` (at minute precision) or exceed current time by more than 5 minutes. For `PLANNED` actions, future dates are allowed.
  - `description`: Required string, 1 to 2000 characters after trimming.
  - `result`: Optional while Planned (up to 2000 chars); mandatory when status is `COMPLETED`.
  - `followUpRequired`: Boolean.
  - `followUpNote`: Required (1 to 1000 characters) when `followUpRequired` is true. Cleared to null when false.
  - `assigneeId`: Optional integer. Defaults to `req.user.id`. Must refer to an active IT Staff or Administrator.
  - `completedById`: Automatically assigned to `req.user.id` when created as `COMPLETED`. Null when `PLANNED`.
  - `clientRequestId`: UUID string. If a row with this `(ticketId, clientRequestId)` already exists, the server returns HTTP 200 with the existing row (idempotent replay).
- **Response 201 Created**: Action created successfully.
- **Response 200 OK**: Idempotent replay of previously created Action.
- **Response 400 Bad Request**: Validation failure, Ticket is in Closed/Cancelled status, or attempting to add a `PLANNED` Action to a `RESOLVED` Ticket (`TICKET_LOCKED`).

### 2.3. PATCH /api/staff/tickets/:id/actions/:actionId
Edits a planned action, completes it, or cancels it.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "actionAt": "2026-10-11T10:00:00.000Z",
  "description": "Updated diagnostic steps.",
  "result": "Issue resolved successfully.",
  "status": "COMPLETED",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": null,
  "assigneeId": 5,
  "expectedVersion": 1
}
```
- **Rules**:
  - Ticket Lock Check: If parent ticket is Closed or Cancelled, rejected with HTTP 400 `TICKET_LOCKED`.
  - Updatable fields: `actionAt`, `description`, `result`, `status`, `followUpRequired`, `followUpNote`, `attachmentNotes`, `assigneeId`.
  - Completing Future Planned Action: If transitioning to `COMPLETED` and `actionAt` is omitted by the client, and the stored `actionAt` is currently in the future, the server automatically updates `actionAt` to the current timestamp (`new Date()`). If client explicitly sends `actionAt`, it must satisfy the 5-minute clock-skew bound.
  - Once status is `COMPLETED` or `CANCELLED`, the action is immutable. Attempts to edit return HTTP 400 `ACTION_IMMUTABLE`.
  - Transitioning to `COMPLETED` sets `completedById = req.user.id` and requires a non-empty `result`.
  - Requires integer `expectedVersion`. Returns HTTP 409 `STALE_UPDATE` if version mismatch.
- **Response 200 OK**: Returns updated Action Taken object.

---

## 3. Ticket Workflow Endpoints

### 3.1. GET /api/tickets/:id (Updated Contract)
Retrieves ticket operational details.

- **Authorization**:
  - `IT_STAFF`, `ADMINISTRATOR`: Permitted on any ticket.
  - `REQUESTER`: Permitted only if `ticket.requesterId == req.user.id`. Non-owned tickets or non-existent tickets return HTTP 404 Not Found.
- Returns all Lab 2/3 fields plus:
  - `version`: Current integer version for optimistic locking.
  - `allowedTransitions`: Array of statuses permitted from the current status for the authenticated caller role.
  - `resolutionGate`: Object `{ ok: boolean, reasons: string[] }` evaluating current gate readiness.

### 3.2. PATCH /api/staff/tickets/:id/status
Transitions Ticket status along permitted paths.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "status": "RESOLVED",
  "expectedVersion": 3
}
```
- **Resolution Gate Check (BR-11)**:
  - If target status is `RESOLVED`, the system verifies:
    1. `assignedToId` is not null.
    2. At least one `COMPLETED` Action Taken exists.
    3. Zero `PLANNED` Actions Taken exist.
  - If any condition fails, returns HTTP 400 `RESOLUTION_GATE_NOT_MET`:
    ```json
    {
      "error": {
        "code": "RESOLUTION_GATE_NOT_MET",
        "message": "Resolution gate criteria not satisfied",
        "reasons": [
          "A Ticket Owner must be assigned before resolving",
          "At least one Completed Action Taken is required"
        ]
      }
    }
    ```
- **Response 200 OK**: Returns updated Ticket object including new `version` and `allowedTransitions`.

### 3.3. PATCH /api/staff/tickets/:id/assign
Assigns or reassigns the ticket owner.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "assignedToId": 4,
  "expectedVersion": 3
}
```
- **Rules**:
  - `assignedToId` must refer to an active IT Staff or Administrator user (or null to unassign).
  - Requires `expectedVersion`. Returns HTTP 409 `STALE_UPDATE` if version mismatch. Increments ticket `version` upon success.
  - Guard against bypassing owner requirements (BR-18): Reassignment is blocked if ticket status is `RESOLVED`, `CLOSED`, or `CANCELLED`. Returns HTTP 400 `TICKET_LOCKED`.
- **Response 200 OK**: Returns updated Ticket.

### 3.4. POST /api/tickets/:id/reopen
Allows Requesters to reopen their own Resolved or Closed tickets.

- **Authorization**: `REQUESTER` (must own ticket).
- **Request Body**:
```json
{
  "reason": "The issue reoccurred after rebooting.",
  "expectedVersion": 4
}
```
- **Behavior**:
  - Permitted only from statuses `RESOLVED` or `CLOSED`.
  - Transitions status to `REOPENED` and increments ticket `version`.
  - If `expectedVersion` is supplied and does not match database version, returns HTTP 409 `STALE_UPDATE`.
  - Clears `isProblemResolvedIndicated` flag.
  - Records an entry in `TicketStatusHistory` storing the optional `reason`.
- **Response 200 OK**: Returns updated Ticket.

### 3.5. GET /api/tickets/:id/history
Retrieves the append-only status audit trail.

- **Authorization**:
  - `IT_STAFF`, `ADMINISTRATOR`: Permitted on any ticket.
  - `REQUESTER`: Permitted only if `ticket.requesterId == req.user.id`.
- **Response 404 Not Found**: Ticket does not exist, or caller is a Requester who does not own the ticket.
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "fromStatus": "NEW",
    "toStatus": "IN_PROGRESS",
    "reason": null,
    "changedAt": "2026-10-11T08:00:00.000Z",
    "changedBy": {
      "id": 4,
      "name": "Sarah Johnson"
    }
  }
]
```

---

## 4. Role Dashboard and List Filtering Endpoints

### 4.1. List Query Filtering Contract
Both `GET /api/tickets` (Requester My Tickets) and `GET /api/staff/tickets` (Staff Ticket Queue) support:
- `statusGroup=active`: Filters tickets matching active statuses (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `REOPENED`, and legacy `PENDING`).
- `itPriority=none`: Filters tickets where `itPriority` is null.
- Existing filters (`status`, `currentStatus`, `category`, `search`, `assignedTo`) remain active and combine with `statusGroup`.

### 4.2. GET /api/dashboard/requester
Returns summary statistics strictly for the authenticated Requester.

- **Authorization**: `REQUESTER`.
- **Response 200 OK**:
```json
{
  "metrics": {
    "myOpenTickets": 3,
    "waitingForRequester": 1,
    "inProgress": 2,
    "resolved": 5,
    "closed": 12
  },
  "links": {
    "myOpenTickets": "/tickets?statusGroup=active",
    "waitingForRequester": "/tickets?currentStatus=WAITING_FOR_REQUESTER",
    "inProgress": "/tickets?currentStatus=IN_PROGRESS",
    "resolved": "/tickets?currentStatus=RESOLVED",
    "closed": "/tickets?currentStatus=CLOSED"
  },
  "attentionTickets": [
    {
      "id": 12,
      "ticketNumber": "TKT-2026-000012",
      "title": "Please provide device serial number",
      "currentStatus": "WAITING_FOR_REQUESTER",
      "updatedAt": "2026-10-11T08:30:00.000Z"
    }
  ],
  "recentTickets": [
    {
      "id": 15,
      "ticketNumber": "TKT-2026-000015",
      "title": "Laptop battery drains quickly",
      "currentStatus": "IN_PROGRESS",
      "updatedAt": "2026-10-11T09:14:00.000Z"
    }
  ],
  "timeZone": "Asia/Bangkok",
  "generatedAt": "2026-10-11T10:00:00.000Z"
}
```

### 4.3. GET /api/dashboard/staff
Returns operational queue statistics for IT Staff and Administrators.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Calculation Rules**:
  - `myAssigned`: Counts tickets where `assignedToId == req.user.id` and status is active (BR-19).
  - `unassigned`: Counts tickets where `assignedToId == null` and status is active (BR-19).
  - `recentTickets`: Up to 5 tickets of any status updated within the rolling last 7 days, sorted by `updatedAt desc`.
- **Response 200 OK**:
```json
{
  "metrics": {
    "newTickets": 14,
    "openTickets": 23,
    "inProgress": 18,
    "waitingForRequester": 7,
    "myAssigned": 16,
    "unassigned": 12
  },
  "links": {
    "newTickets": "/staff/queue?status=NEW",
    "openTickets": "/staff/queue?status=OPEN",
    "inProgress": "/staff/queue?status=IN_PROGRESS",
    "waitingForRequester": "/staff/queue?status=WAITING_FOR_REQUESTER",
    "myAssigned": "/staff/queue?assignedTo=me&statusGroup=active",
    "unassigned": "/staff/queue?assignedTo=unassigned&statusGroup=active"
  },
  "recentTickets": [
    {
      "id": 15,
      "ticketNumber": "TKT-2026-000015",
      "title": "VPN disconnects randomly",
      "currentStatus": "RESOLVED",
      "updatedAt": "2026-10-11T09:14:00.000Z"
    }
  ],
  "userCounts": {
    "totalUsers": 25,
    "activeUsers": 23,
    "inactiveUsers": 2
  },
  "timeZone": "Asia/Bangkok",
  "generatedAt": "2026-10-11T10:00:00.000Z"
}
```
*(Note: `userCounts` is included only when caller role is `ADMINISTRATOR`.)*
