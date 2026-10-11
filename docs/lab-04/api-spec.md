# Lab 4 REST API Specification

Base path: `/api`. All existing endpoints from Lab 1, Lab 2, and Lab 3 remain active with unchanged contracts except where explicitly updated below.

Authentication is strictly enforced via the `toktickit_session` HTTP-only cookie. Protected endpoints return HTTP 401 when the session is missing or invalid, and HTTP 403 when the authenticated user role lacks authorization.

## 1. Conventions and Error Formats

### 1.1. Standard Error Body
All Lab 4 endpoints return errors in the standard JSON structure:
```json
{
  "error": "Human-readable explanation of the error",
  "code": "ERROR_CODE",
  "fields": {
    "followUpNote": "Follow-up note is mandatory when follow-up is required"
  }
}
```

### 1.2. Error Code Registry
| HTTP Code | Error Code | Description |
| :---: | :--- | :--- |
| **400** | `VALIDATION` | A required field is missing, invalid, or exceeds length bounds. |
| **400** | `INVALID_TRANSITION` | Requested status transition is not permitted by the transition matrix. |
| **400** | `RESOLUTION_GATE` | Transition to Resolved is blocked because the Resolution Gate conditions are not satisfied. |
| **400** | `TICKET_LOCKED` | Actions Taken cannot be added or edited on Closed or Cancelled tickets. |
| **401** | `UNAUTHORIZED` | Authentication session missing, invalid, or expired. |
| **403** | `FORBIDDEN` | Authenticated user lacks permission for the requested resource or ticket ownership. |
| **404** | `NOT_FOUND` | Ticket, Action Taken, or user resource does not exist. |
| **409** | `STALE_UPDATE` | Optimistic locking collision: `expectedVersion` does not match the database `version`. |
| **500** | `INTERNAL_ERROR` | Unexpected server failure. |

### 1.3. Optimistic Concurrency Control
Entities supporting concurrency control expose an integer `version`. Mutation requests must include `expectedVersion` in the request body. If the stored record version does not match `expectedVersion`, the server aborts the update and returns HTTP 409:
```json
{
  "error": "This record was updated by another user. Please reload the latest state.",
  "code": "STALE_UPDATE",
  "currentVersion": 4
}
```

### 1.4. Timestamp Conventions
All timestamps returned by APIs are formatted as ISO-8601 UTC strings (e.g., `2026-10-11T12:00:00.000Z`). Clients are responsible for formatting timestamps in the `Asia/Bangkok` timezone.

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
    "version": 2,
    "createdAt": "2026-10-11T09:35:00.000Z",
    "updatedAt": "2026-10-11T10:00:00.000Z"
  }
]
```
- **Response 403 Forbidden**: Caller is a Requester who does not own the ticket.
- **Response 404 Not Found**: Ticket does not exist.

### 2.2. POST /api/staff/tickets/:id/actions
Creates a new Action Taken under a Ticket.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "actionAt": "2026-10-11T09:30:00.000Z",
  "description": "Inspected network cable and replaced damaged patch cord.",
  "result": "Link connectivity restored at 1Gbps.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": null,
  "assigneeId": 4,
  "clientRequestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```
- **Validation Rules**:
  - `actionAt`: Optional ISO string. Defaults to current timestamp. Cannot precede Ticket `createdAt` (evaluated at minute precision) or exceed current time by more than 5 minutes.
  - `description`: Required string, 1 to 2000 characters after trimming.
  - `result`: Optional string, up to 2000 characters.
  - `followUpRequired`: Boolean.
  - `followUpNote`: Required (1 to 1000 characters) when `followUpRequired` is true. Cleared to null when false.
  - `assigneeId`: Optional integer. Defaults to `req.user.id`. Must refer to an active IT Staff or Administrator.
  - `clientRequestId`: Optional UUID string for request idempotency.
- **Response 201 Created**: Returns created Action Taken object.
- **Response 400 Bad Request**: Validation failure or Ticket is in Closed/Cancelled status.

### 2.3. PATCH /api/staff/tickets/:id/actions/:actionId
Edits a planned action, completes it, or cancels it.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "description": "Updated diagnostic steps.",
  "result": "Issue resolved successfully.",
  "status": "COMPLETED",
  "expectedVersion": 1
}
```
- **Rules**:
  - Once status is `COMPLETED` or `CANCELLED`, the action is immutable.
  - Transitioning to `COMPLETED` requires a non-empty `result` field.
  - Requires `expectedVersion`. Returns 409 if version mismatch.
- **Response 200 OK**: Returns updated Action Taken object.

---

## 3. Ticket Workflow Endpoints

### 3.1. PATCH /api/staff/tickets/:id/status
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
  - If any condition fails, returns HTTP 400 `RESOLUTION_GATE` with detailed reasons array:
    ```json
    {
      "error": "Resolution gate criteria not satisfied",
      "code": "RESOLUTION_GATE",
      "reasons": [
        "A Ticket Owner must be assigned before resolving",
        "At least one Completed Action Taken is required"
      ]
    }
    ```
- **Response 200 OK**: Returns updated Ticket object including new `version` and `allowedTransitions`.

### 3.2. POST /api/tickets/:id/reopen
Allows Requesters to reopen their own Resolved or Closed tickets.

- **Authorization**: `REQUESTER` (must own ticket).
- **Request Body**:
```json
{
  "reason": "The issue reoccurred after rebooting."
}
```
- **Behavior**:
  - Permitted only from statuses `RESOLVED` or `CLOSED`.
  - Transitions status to `REOPENED`.
  - Clears `isProblemResolvedIndicated` flag.
  - Records an entry in `TicketStatusHistory`.
- **Response 200 OK**: Returns updated Ticket.

### 3.3. GET /api/tickets/:id/history
Retrieves the append-only status audit trail.

- **Authorization**: Permitted to any user authorized to view the ticket.
- **Response 200 OK**:
```json
[
  {
    "id": 1,
    "fromStatus": "NEW",
    "toStatus": "IN_PROGRESS",
    "changedAt": "2026-10-11T08:00:00.000Z",
    "changedBy": {
      "id": 4,
      "name": "Sarah Johnson"
    }
  }
]
```

---

## 4. Role Dashboard Endpoints

### 4.1. GET /api/dashboard/requester
Returns summary statistics strictly for the authenticated Requester.

- **Authorization**: `REQUESTER`.
- **Response 200 OK**:
```json
{
  "metrics": {
    "myOpenTickets": 3,
    "inProgress": 2,
    "resolved": 5,
    "closed": 12
  },
  "links": {
    "myOpenTickets": "/tickets?statusGroup=active",
    "inProgress": "/tickets?status=IN_PROGRESS",
    "resolved": "/tickets?status=RESOLVED",
    "closed": "/tickets?status=CLOSED"
  },
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

### 4.2. GET /api/dashboard/staff
Returns operational queue statistics for IT Staff and Administrators.

- **Authorization**: `IT_STAFF`, `ADMINISTRATOR`.
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
    "myAssigned": "/staff/queue?assignedTo=me",
    "unassigned": "/staff/queue?assignedTo=unassigned"
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
*(Note: `userCounts` is included only when the caller role is `ADMINISTRATOR`.)*
