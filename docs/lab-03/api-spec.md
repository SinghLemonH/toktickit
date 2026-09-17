# Sprint 3 REST API Specification: TokTickIT

> **Base Path**: `/api`  
> **Format**: JSON (`application/json`)  
> **Authentication**: Cookie-based session (`toktickit_session`, HTTP-only, SameSite=Lax, Secure in production)  
> **Status**: APPROVED

---

## 1. Authentication & Security Model

All API endpoints (except `/api/auth/login` and `/api/health`) require an authenticated session established via the `toktickit_session` cookie.

### 1.1. Session Cookie
- **Cookie Name**: `toktickit_session`
- **Attributes**: `HttpOnly; Path=/; SameSite=Lax` (and `Secure` in production environments).
- **Contents**: Cryptographically signed JWT containing `{ userId: number, role: string, mustChangePassword: boolean }`.
- **Client Security**: Client-side JavaScript cannot read, edit, or extract session secrets, eliminating XSS token theft vectors.

### 1.2. Standard Error Response Format
All errors return a predictable, uniform JSON schema:

```json
{
  "error": {
    "code": "BAD_REQUEST | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | VALIDATION_ERROR | INTERNAL_ERROR",
    "message": "Human-readable description of the error",
    "details": []
  }
}
```

### 1.3. Standard HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Malformed syntax, invalid payload, or illegal status transition.
- `401 Unauthorized`: Unauthenticated request, expired session, or invalid credentials.
- `403 Forbidden`: Authenticated user lacks permission for the requested resource (e.g. Requester accessing Admin API or Internal Notes).
- `404 Not Found`: Requested resource does not exist (or is hidden to prevent enumeration).
- `409 Conflict`: Business invariant conflict (duplicate email, deactivating last active administrator).
- `500 Internal Server Error`: Unexpected server-side failure.

---

## 2. Authentication Endpoints

### 2.1. `POST /api/auth/login`
Authenticates a user with email and password.

- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "janderson@toktickit.com",
    "password": "Password123!"
  }
  ```
- **Validation**:
  - `email`: Required, valid email format.
  - `password`: Required, non-empty string.
- **Success Response (200 OK)**:
  - Sets `Set-Cookie: toktickit_session=...; HttpOnly; Path=/; SameSite=Lax`
  ```json
  {
    "user": {
      "id": 1,
      "email": "janderson@toktickit.com",
      "name": "Jennifer Anderson",
      "role": "REQUESTER",
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Invalid email or password, or account is inactive (`isActive: false`).
    ```json
    {
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Invalid email or password"
      }
    }
    ```

### 2.2. `POST /api/auth/logout`
Terminates the current authenticated session.

- **Access**: Authenticated
- **Request Body**: None
- **Success Response (200 OK)**:
  - Sets `Set-Cookie: toktickit_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### 2.3. `GET /api/auth/me`
Retrieves identity and role information for the currently authenticated user.

- **Access**: Authenticated
- **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "id": 1,
      "email": "janderson@toktickit.com",
      "name": "Jennifer Anderson",
      "role": "REQUESTER",
      "mustChangePassword": false
    }
  }
  ```
- **Error Response (401 Unauthorized)**: Session missing or expired.

### 2.4. `POST /api/auth/change-password`
Changes the authenticated user's password. Required for users flagged with `mustChangePassword: true`.

- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "currentPassword": "InitialPass123!",
    "newPassword": "MyNewSecurePassword2026!"
  }
  ```
- **Validation**:
  - `currentPassword`: Required, matches current password hash.
  - `newPassword`: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character.
- **Success Response (200 OK)**:
  - Updates password hash, sets `mustChangePassword: false`, refreshes session cookie.
  ```json
  {
    "message": "Password changed successfully",
    "user": {
      "id": 1,
      "email": "janderson@toktickit.com",
      "name": "Jennifer Anderson",
      "role": "REQUESTER",
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `newPassword` fails complexity rules.
  - `401 Unauthorized`: `currentPassword` is incorrect.

---

## 3. Requester Ticket Endpoints (Lab 2 Continuation)

### 3.1. `GET /api/tickets`
Lists tickets owned by the authenticated Requester (`ticket.requesterId == req.user.id`).

- **Access**: `REQUESTER`, `ADMINISTRATOR`
- **Query Parameters**:
  - `status`: Optional filter (`NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `CANCELLED`).
  - `search`: Optional string matching ticketNumber or summary.
  - `page`: Integer (default: 1).
  - `pageSize`: Integer (default: 10).
- **Success Response (200 OK)**:
  ```json
  {
    "tickets": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-000012",
        "summary": "Laptop battery drains quickly",
        "category": { "id": 1, "name": "Hardware" },
        "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
        "requestedPriority": "HIGH",
        "currentStatus": "IN_PROGRESS",
        "isProblemResolvedIndicated": false,
        "createdAt": "2026-09-12T08:30:00.000Z",
        "updatedAt": "2026-09-12T09:15:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 1,
      "totalPages": 1,
      "currentPage": 1,
      "pageSize": 10
    }
  }
  ```

### 3.2. `POST /api/tickets`
Creates a new support ticket.

- **Access**: `REQUESTER`, `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "categoryId": 1,
    "relatedSystemId": 2,
    "summary": "Cannot connect to VPN from home",
    "description": "Getting error code 412 when attempting to connect.",
    "requestedPriority": "HIGH"
  }
  ```
- **Ownership**: Automatically bound to `req.user.id`. Client cannot supply a `requesterId`.
- **Success Response (201 Created)**: Returns created Ticket with generated `ticketNumber` and `currentStatus: "NEW"`.

### 3.3. `GET /api/tickets/:id`
Retrieves ticket detail for an owned ticket, including attachments and public comments.

- **Access**: `REQUESTER` (owned only), `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (200 OK)**:
  ```json
  {
    "id": 12,
    "ticketNumber": "TKT-2026-000012",
    "summary": "Laptop battery drains quickly",
    "description": "My laptop battery is draining much faster than usual.",
    "requester": { "id": 1, "name": "Jennifer Anderson", "email": "janderson@toktickit.com" },
    "assignedTo": { "id": 3, "name": "Michael Brown", "email": "mbrown@toktickit.com" },
    "category": { "id": 1, "name": "Hardware" },
    "relatedSystem": { "id": 2, "name": "Corporate Laptop" },
    "requestedPriority": "HIGH",
    "itPriority": "HIGH",
    "currentStatus": "IN_PROGRESS",
    "isProblemResolvedIndicated": false,
    "createdAt": "2026-09-12T08:30:00.000Z",
    "attachments": [],
    "comments": []
  }
  ```
- **Error Response (404 Not Found)**: Ticket does not exist or belongs to another user (protecting requester isolation).

### 3.4. `POST /api/tickets/:id/resolve-indicated`
Allows a Requester to signal that their issue appears resolved.

- **Access**: `REQUESTER` (owned only)
- **Request Body**: None (or optional note string)
- **Behavior**:
  - Validates ticket belongs to requester and is not already `RESOLVED` or `CLOSED`.
  - Sets `isProblemResolvedIndicated = true`.
  - Creates an automated Public Comment: *"Requester indicated that the problem appears resolved."*
  - Does NOT transition ticket status to `RESOLVED` (formal resolution is reserved for IT Staff).
- **Success Response (200 OK)**: Returns updated ticket object.

---

## 4. Public Comments & Internal Notes

### 4.1. `GET /api/tickets/:id/comments`
Retrieves all Public Comments for a ticket.

- **Access**: `REQUESTER` (owned tickets), `IT_STAFF`, `ADMINISTRATOR`
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "ticketId": 12,
      "content": "We have dispatched a replacement battery to your office.",
      "createdAt": "2026-09-12T10:00:00.000Z",
      "author": {
        "id": 3,
        "name": "Michael Brown",
        "role": "IT_STAFF"
      }
    }
  ]
  ```

### 4.2. `POST /api/tickets/:id/comments`
Appends a new Public Comment to a ticket.

- **Access**: `REQUESTER` (owned tickets), `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "content": "Thank you! I will let you know when it arrives."
  }
  ```
- **Validation**: `content` must be between 1 and 2,000 characters and not purely whitespace.
- **Success Response (201 Created)**: Returns created comment object.

### 4.3. `GET /api/staff/tickets/:id/notes`
Retrieves role-restricted Internal Notes for a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR` strictly.
- **Requester Rejection**: Returns `403 Forbidden` without exposing note count or existence.
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "ticketId": 12,
      "content": "Checked warranty status: coverage expires next month.",
      "createdAt": "2026-09-12T09:30:00.000Z",
      "author": {
        "id": 3,
        "name": "Michael Brown",
        "role": "IT_STAFF"
      }
    }
  ]
  ```

### 4.4. `POST /api/staff/tickets/:id/notes`
Appends an Internal Note to a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR` strictly (`403 Forbidden` for Requesters).
- **Request Body**:
  ```json
  {
    "content": "Battery model BT-902 ordered from vendor supplier."
  }
  ```
- **Validation**: `content` 1 to 2,000 non-whitespace characters.
- **Success Response (201 Created)**: Returns created note object.

---

## 5. IT Staff Ticket Queue & Operations

### 5.1. `GET /api/staff/tickets`
Retrieves the shared IT Staff Ticket Queue.

- **Access**: `IT_STAFF`, `ADMINISTRATOR` (`403 Forbidden` for Requesters).
- **Query Parameters**:
  - `q`: Search string matching `ticketNumber` or `summary`.
  - `categoryId`: Integer filter.
  - `status`: TicketStatus enum filter (`NEW`, `OPEN`, `IN_PROGRESS`, etc.).
  - `requestedPriority`: Priority enum filter (`LOW`, `MEDIUM`, `HIGH`).
  - `itPriority`: Priority enum filter (`LOW`, `MEDIUM`, `HIGH`).
  - `assignedTo`: Filter by user ID, `"unassigned"`, or `"me"`.
  - `sortBy`: Field to sort (`ticketNumber`, `createdAt`, `updatedAt`, `requestedPriority`, `itPriority`, `currentStatus`). Default: `createdAt`.
  - `sortOrder`: `"asc"` or `"desc"`. Default: `"desc"`.
  - `page`: Integer page number (default: 1).
  - `pageSize`: Items per page (default: 10, max: 50).
- **Success Response (200 OK)**:
  ```json
  {
    "tickets": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-000012",
        "summary": "Laptop battery drains quickly",
        "category": { "id": 1, "name": "Hardware" },
        "requester": { "id": 1, "name": "Jennifer Anderson" },
        "assignedTo": { "id": 3, "name": "Michael Brown" },
        "requestedPriority": "HIGH",
        "itPriority": "MEDIUM",
        "currentStatus": "IN_PROGRESS",
        "isProblemResolvedIndicated": false,
        "createdAt": "2026-09-12T08:30:00.000Z",
        "updatedAt": "2026-09-12T09:15:00.000Z"
      }
    ],
    "pagination": {
      "totalItems": 87,
      "totalPages": 9,
      "currentPage": 1,
      "pageSize": 10
    }
  }
  ```

### 5.2. `PATCH /api/staff/tickets/:id/assign`
Claims or reassigns ownership of a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "assignedToId": 3
  }
  ```
  *(Pass `null` to unassign, or an active user ID with role `IT_STAFF` or `ADMINISTRATOR`)*
- **Success Response (200 OK)**: Returns updated ticket with new assignee.
- **Error Responses**:
  - `400 Bad Request`: Target user is inactive or not an IT Staff / Administrator.

### 5.3. `PATCH /api/staff/tickets/:id/priority`
Updates the operational IT Priority.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "itPriority": "HIGH"
  }
  ```
- **Validation**: Value must be `LOW`, `MEDIUM`, or `HIGH`.
- **Success Response (200 OK)**: Returns updated ticket.

### 5.4. `PATCH /api/staff/tickets/:id/status`
Updates ticket status according to permitted state transitions.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "status": "RESOLVED"
  }
  ```
- **Transition Matrix Enforcement**:
  - Enforces BR-15 state transitions.
  - If status change is illegal (e.g. `NEW` -> `CLOSED`), returns `400 Bad Request`.
- **Success Response (200 OK)**: Returns updated ticket.

---

## 6. Administrator User Management Endpoints

### 6.1. `GET /api/admin/users`
Lists all system users.

- **Access**: `ADMINISTRATOR` strictly (`403 Forbidden` for other roles).
- **Query Parameters**:
  - `q`: Search query matching user name or email.
  - `role`: Optional filter by role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
  - `isActive`: Optional boolean filter (`true`, `false`).
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "janderson@toktickit.com",
      "role": "REQUESTER",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T00:00:00.000Z"
    },
    {
      "id": 2,
      "name": "John Smith",
      "email": "admin@toktickit.com",
      "role": "ADMINISTRATOR",
      "isActive": true,
      "mustChangePassword": false,
      "createdAt": "2026-09-01T00:00:00.000Z"
    }
  ]
  ```

### 6.2. `POST /api/admin/users`
Creates a new user account.

- **Access**: `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "name": "Alex Thompson",
    "email": "alex.thompson@toktickit.com",
    "role": "IT_STAFF",
    "isActive": true,
    "initialPassword": "InitialPassword123!"
  }
  ```
- **Behavior**:
  - Checks for duplicate email (`409 Conflict`).
  - Validates `initialPassword` against password complexity rules.
  - Hashes password with bcrypt.
  - Sets `mustChangePassword = true`.
- **Success Response (201 Created)**: Returns created user record (excluding `passwordHash`).

### 6.3. `PATCH /api/admin/users/:id`
Updates basic user account information.

- **Access**: `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "name": "Alex Thompson Jr.",
    "email": "alex.t@toktickit.com",
    "role": "IT_STAFF",
    "isActive": false
  }
  ```
- **Safety Invariants**:
  - **Self-Deactivation Guard**: If `targetUser.id == req.user.id` and `isActive === false`, rejects with `400 Bad Request` (*"Administrators cannot deactivate their own account"*).
  - **Last Administrator Guard**: If `targetUser.role == ADMINISTRATOR` and `targetUser.isActive == true`, and deactivating or changing role would leave zero active administrators, rejects with `409 Conflict` (*"Cannot deactivate or demote the last active Administrator"*).
- **Success Response (200 OK)**: Returns updated user record.

### 6.4. `POST /api/admin/users/:id/reset-password`
Sets a new initial password for a user.

- **Access**: `ADMINISTRATOR`
- **Request Body**:
  ```json
  {
    "initialPassword": "TemporaryPass2026!"
  }
  ```
- **Behavior**:
  - Validates password complexity.
  - Updates password hash with bcrypt.
  - Sets `mustChangePassword = true` (forcing password change on user's next login).
- **Success Response (200 OK)**:
  ```json
  {
    "message": "Initial password set successfully; user must change it upon next login."
  }
  ```
