# Sprint 3 Specification: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

> **Sprint Context**: Sprint 3 (Lab 3) replaces the temporary Development Requester selector from Lab 2 with secure authentication, role-based authorization (RBAC), operational IT Staff workflows, and minimalist Administrator user management.
> **Status**: APPROVED
> **Target Release**: `lab3-staging` -> `main`

---

## 1. Sprint Goal

Deliver a secure, role-based multi-user foundation for TokTickIT supporting three distinct roles: **Requester**, **IT Staff**, and **Administrator**. This sprint eliminates the development requester selector, implements secure HTTP-only cookie authentication with mandatory first-login password changes, introduces an operational IT Staff Ticket Queue and Ticket Detail workflow with dual-channel Public Comments and role-restricted Internal Notes, and provides a minimalist Administrator User Management console with account safety invariants.

---

## 2. Stakeholder Request

> *"The temporary Requester selector was useful for development, but the system now needs real users. Replace it with secure login. Administrators need a simple User Management screen where they can view users, create an account, assign one role, update basic account information, activate or deactivate an account, and set a new initial password. A user signing in with an initial password must choose a new password before entering the application.*
> 
> *Requesters must continue using the ticket functions built in Lab 2, but the current Requester must now come from the authenticated account. IT Staff need a professional Ticket Queue where they can find work, open Ticket Detail, claim or reassign a Ticket, set IT Priority, communicate with the Requester through Public Comments, record private Internal Notes, and update the Ticket through its permitted workflow. Requesters may indicate that a problem appears resolved, but IT Staff remain responsible for formally resolving or closing the Ticket.*
> 
> *Protect every API and screen according to role and ownership. Hiding a button is not authorization. Continue using the Zen Green design language and reusable components established in Lab 2."*

---

## 3. Scope

### 3.1. In-Scope Work
- **Authentication & Identity**:
  - Secure authentication via email address and password using bcrypt hashing.
  - HTTP-only, secure cookie-based session management (`toktickit_session`).
  - Mandatory first-login password change for accounts flagged with initial/temporary passwords before entering normal application views.
  - Session verification (`/api/auth/me`) and secure logout invalidating session cookies.
  - Full removal of Lab 2 Development Requester selector; identity is derived exclusively on the backend from authenticated session.
- **Role-Based Authorization (RBAC)**:
  - Three mutually exclusive roles: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
  - Server-side enforcement on all endpoints; forbidden actions return HTTP `403 Forbidden` with safe error details.
- **IT Staff Workflows**:
  - Shared Ticket Queue with real-time text search (ticket number, summary), structured filters (Category, Requested Priority, IT Priority, Ticket Status, Assignment), column sorting, and pagination.
  - Ticket Detail interface with operational field updates: Claim ownership, Reassign to active IT Staff/Admin, set IT Priority, and execute permitted ticket status transitions.
  - Dual-channel communication:
    - **Public Comments**: Shared communication visible to Requester, IT Staff, and Administrator.
    - **Internal Notes**: Operational notes visible strictly to IT Staff and Administrator; access forbidden to Requesters.
- **Requester Continuity & Resolution Indication**:
  - Continued Lab 2 capabilities (create tickets, view owned tickets, view/manage attachments) tied to authenticated user.
  - Ability to post Public Comments on owned tickets.
  - Ability to indicate that a problem appears resolved (`isProblemResolvedIndicated: true`), automatically generating a system/public comment without directly closing or resolving the ticket.
- **Administrator User Management**:
  - Minimalist user management interface displaying user directory (Name, Email, Role, Status, Edit action).
  - Search by name or email, and optional role filter.
  - Create user with name, email, one permitted role, activation state, and initial password.
  - Edit user basic details (name, email, role, activation state).
  - Set a new initial password forcing password change on next login.
  - Built-in safety invariants: prevent self-deactivation, prevent deactivating or removing the last active Administrator, enforce deactivation over deletion.
- **Database Evolution**:
  - Migration of Lab 2 `DevRequester` records into unified `User` model without data loss.
  - Relational mapping for ticket ownership, assignment (`assignedTo`), `Comment`, and `InternalNote`.
  - Idempotent seed data providing realistic users across all roles and ticket statuses.

### 3.2. Explicitly Out-of-Scope (Deferred to Lab 4+)
- Email delivery, automated invitation emails, password reset links via email.
- Self-registration / public sign-up.
- IT Staff "Actions Taken" records (deferred to Lab 4).
- Multi-factor authentication (MFA), OAuth / Social login, Single Sign-On (SSO).
- Multi-tenant organizations, departments, customer administration.
- Multiple roles per user (each user has strictly one role).
- Hard deletion of user accounts, bulk user operations, user CSV import/export.
- Account history audit logs, profile pictures, department management.
- SLA calculations, automated escalation triggers, background notifications.

---

## 4. Functional Requirements

### Authentication & Session Management
- **FR-01**: The system shall authenticate users using email address and password against securely hashed credentials.
- **FR-02**: The system shall set an HTTP-only, SameSite=Lax session cookie upon successful authentication.
- **FR-03**: The system shall detect whether an authenticated user has an initial temporary password (`mustChangePassword: true`) and restrict application navigation strictly to the Change Password screen until a valid new password is confirmed.
- **FR-04**: The system shall allow an authenticated user to change their password, verify the current password, validate complexity rules, update password hash, and set `mustChangePassword: false`.
- **FR-05**: The system shall provide an endpoint `/api/auth/me` returning the current user identity, role, and password change status.
- **FR-06**: The system shall terminate authenticated sessions via `/api/auth/logout`, clearing the session cookie.

### Role-Based Access & Requester Flow
- **FR-07**: The system shall reject unauthenticated requests to protected endpoints with `401 Unauthorized`.
- **FR-08**: The system shall reject authenticated requests attempting operations unauthorized for the user's role with `403 Forbidden`.
- **FR-09**: The system shall associate newly created tickets and attachments directly with the authenticated Requester identity (`req.user.id`).
- **FR-10**: The system shall restrict Requesters to viewing and managing only their own tickets and permitted attachments.
- **FR-11**: The system shall allow Requesters to post Public Comments on their owned tickets.
- **FR-12**: The system shall allow Requesters to trigger "Problem Appears Resolved", flagging the ticket (`isProblemResolvedIndicated: true`) and appending a public notice without changing ticket status to `RESOLVED` or `CLOSED`.

### IT Staff Ticket Operations
- **FR-13**: The system shall provide IT Staff with a paginated Ticket Queue supporting search by ticket number or summary text.
- **FR-14**: The system shall allow IT Staff to filter the queue by category, requested priority, IT priority, ticket status, and assignee.
- **FR-15**: The system shall allow IT Staff to sort the queue by ticket number, created date, requested priority, IT priority, and status.
- **FR-16**: The system shall allow IT Staff to claim ticket ownership or reassign ticket ownership to any active IT Staff or Administrator.
- **FR-17**: The system shall allow IT Staff to update IT Priority independently from Requested Priority.
- **FR-18**: The system shall allow IT Staff to update ticket status according to the permitted status transition matrix.
- **FR-19**: The system shall allow IT Staff and Administrators to create and retrieve Public Comments on any ticket.
- **FR-20**: The system shall allow IT Staff and Administrators to create and retrieve Internal Notes on any ticket, while preventing Requesters from accessing Internal Notes.

### Administrator User Management
- **FR-21**: The system shall provide Administrators with a user list displaying Name, Email, Role, Status (`Active`/`Inactive`), and an Edit trigger.
- **FR-22**: The system shall allow Administrators to search users by name or email, and filter by role.
- **FR-23**: The system shall allow Administrators to create new user accounts with Name, Email, Role, Activation State, and an Initial Password (`mustChangePassword: true`).
- **FR-24**: The system shall allow Administrators to edit existing user accounts (Name, Email, Role, Activation State).
- **FR-25**: The system shall allow Administrators to set a new initial password for any user account, forcing a password change on that user's next login.
- **FR-26**: The system shall prevent an Administrator from deactivating their own account.
- **FR-27**: The system shall prevent the deactivation or role change of the last active Administrator in the system.

---

## 5. Business Rules

### Identity & Authentication Rules
- **BR-01**: Only active users (`isActive: true`) with valid credentials may authenticate. Inactive users receive a generic authentication failure response (`401 Unauthorized: Invalid credentials`) to prevent account status enumeration.
- **BR-02**: Any user with `mustChangePassword: true` cannot access normal application screens or endpoints until a new valid password conforming to complexity rules is successfully saved.
- **BR-03**: Password complexity policy: All new passwords (and initial passwords) must have a minimum length of 8 characters and contain at least one uppercase letter (`[A-Z]`), one lowercase letter (`[a-z]`), one numeric digit (`[0-9]`), and one special character (`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`).
- **BR-04**: Passwords must never be stored, logged, or returned in plaintext; they must be hashed using bcrypt with a salt round factor of at least 10.
- **BR-05**: User email addresses must be unique across the system (case-insensitive comparison).
- **BR-06**: Each user must be assigned exactly one role: `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`.

### Ownership & Authorization Rules
- **BR-07**: Requester operations derive ownership exclusively from the authenticated session context (`req.user.id`), never from a client-supplied `requesterId` parameter.
- **BR-08**: A Requester can only read, update, or add comments to tickets where `ticket.requesterId == req.user.id`. Requests for tickets owned by other users return `404 Not Found` (to avoid leaking resource existence) or `403 Forbidden`.
- **BR-09**: Each ticket may have zero or one primary Ticket Owner (`assignedToId`), who must be an active user with role `IT_STAFF` or `ADMINISTRATOR`.
- **BR-10**: Requested Priority is immutable after ticket creation. IT Priority initially defaults to Requested Priority upon creation and may subsequently be altered only by IT Staff or Administrator.

### Dual-Channel Communication Rules
- **BR-11**: Public Comments are visible to Requester, IT Staff, and Administrator. They are append-only; editing and deletion are prohibited in Lab 3.
- **BR-12**: Internal Notes are strictly visible to IT Staff and Administrator. Requesters are blocked at the server level from reading or creating Internal Notes (`403 Forbidden`). Internal Notes are append-only.
- **BR-13**: Comment and note content cannot be empty or solely whitespace. Content length must be between 1 and 2,000 characters.

### Ticket Status Transition Rules
- **BR-14**: Permitted ticket statuses are: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **BR-15**: Allowed Status Transitions by Role:
  - Initial status is always `NEW`.
  - When an IT Staff claims or begins work on a `NEW` ticket, it transitions to `OPEN` or `IN_PROGRESS`.
  - IT Staff may transition:
    - `NEW` -> `OPEN`, `CANCELLED`
    - `OPEN` -> `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `IN_PROGRESS` -> `WAITING_FOR_REQUESTER`, `RESOLVED`, `CANCELLED`
    - `WAITING_FOR_REQUESTER` -> `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
    - `RESOLVED` -> `CLOSED`, `REOPENED`
    - `CLOSED` -> `REOPENED`
    - `REOPENED` -> `IN_PROGRESS`, `RESOLVED`, `CANCELLED`
  - Requesters **cannot** set status directly to `RESOLVED` or `CLOSED`. They can only trigger "Problem Appears Resolved", which sets `isProblemResolvedIndicated = true` and posts an automated Public Comment.

### Administrator Safety Rules
- **BR-16**: An Administrator is prohibited from deactivating their own account (`req.user.id == targetUser.id`).
- **BR-17**: The system must never permit deactivating or reassigning the role of the last remaining active Administrator. If `count(User where role == ADMINISTRATOR and isActive == true) <= 1`, deactivation or demotion of that user is rejected with HTTP `409 Conflict`.
- **BR-18**: User deletion is prohibited. All user lifecycle management is performed via `isActive: true` or `isActive: false`.

---

## 6. UI Specification Summary

The application maintains strict visual consistency with the **Zen Green** theme established in Lab 2.

### 6.1. Screens & Navigation
1. **Login Screen (`/login`)**:
   - Clean, centered Zen Green card with TokTickIT branding.
   - Inputs: Email address, Password (with toggle visibility icon).
   - Safe error alerts for invalid credentials without field-level enumeration.
2. **Mandatory Change Password Screen (`/change-password`)**:
   - Modal or locked screen displayed whenever authenticated user has `mustChangePassword: true`.
   - Fields: Current (temporary) password, New password, Confirm new password.
   - Real-time password requirement checklist (8+ chars, uppercase, lowercase, number, symbol).
3. **Application Shell & Navbar**:
   - Displays TokTickIT logo, active navigation links according to role:
     - `REQUESTER`: "My Tickets", "Create Ticket"
     - `IT_STAFF`: "Ticket Queue"
     - `ADMINISTRATOR`: "User Management", "Ticket Queue"
   - Right-side profile widget: User name, role badge (`Requester`, `IT Staff`, `Admin`), and "Log Out" button.
4. **Requester Ticket Detail (`/tickets/:id`)**:
   - Preserves Lab 2 layout with readonly fields and attachments.
   - Added: Public Comments conversation stream and comment input form.
   - Added: "Problem Appears Resolved" button if ticket is not yet resolved/closed and not already indicated.
5. **IT Staff Ticket Queue (`/staff/queue`)**:
   - Search bar (by Ticket No. or Summary) and Filter triggers (Category, Priority, Status, Assignee).
   - Zen Green responsive table on desktop / card layout on mobile.
   - Columns: Ticket No, Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner, Actions.
   - Pagination controls (items per page, previous/next, page numbers).
6. **IT Staff Ticket Detail (`/staff/tickets/:id`)**:
   - Operational editing: Claim Ticket button, Assignee dropdown, IT Priority dropdown, Ticket Status transition dropdown with confirmation.
   - Tabbed or split conversation interface:
     - Tab 1: **Public Comments** (Zen Green accent, public badge).
     - Tab 2: **Internal Notes** (Amber/Yellow warning styling, private staff-only badge).
7. **Administrator User Management (`/admin/users`)**:
   - Minimalist user list: Name, Email, Role badge, Status pill (`Active` / `Inactive`), and Edit button.
   - Header with search input, role filter dropdown, and "+ Create User" button.
   - User creation modal with initial password input and "Generate Safe Password" helper button.
   - User edit modal with name, email, role, and active toggle. Deactivate confirmation dialog with safety checks.

---

## 7. Data Model Changes

### 7.1. Prisma Schema Evolution
The database evolves from Lab 2 without dropping existing tables or records.

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

model User {
  id                 Int       @id @default(autoincrement())
  email              String    @unique
  name               String
  passwordHash       String
  role               Role      @default(REQUESTER)
  isActive           Boolean   @default(true)
  mustChangePassword Boolean   @default(false)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  submittedTickets   Ticket[]  @relation("RequesterTickets")
  assignedTickets    Ticket[]  @relation("AssignedTickets")
  comments           Comment[]
  internalNotes      InternalNote[]

  @@index([role])
  @@index([isActive])
}

// Ticket model evolves with assignedTo, resolution flag, and updated relations:
model Ticket {
  id                         Int          @id @default(autoincrement())
  ticketNumber               String       @unique

  requesterId                Int
  requester                  User         @relation("RequesterTickets", fields: [requesterId], references: [id])

  assignedToId               Int?
  assignedTo                 User?        @relation("AssignedTickets", fields: [assignedToId], references: [id])

  categoryId                 Int
  category                   Category     @relation(fields: [categoryId], references: [id])

  relatedSystemId            Int
  relatedSystem              RelatedSystem @relation(fields: [relatedSystemId], references: [id])

  summary                    String
  description                String

  requestedPriority          Priority
  itPriority                 Priority?
  currentStatus              TicketStatus @default(NEW)
  isProblemResolvedIndicated Boolean      @default(false)

  createdAt                  DateTime     @default(now())
  updatedAt                  DateTime     @updatedAt

  attachments                Attachment[]
  comments                   Comment[]
  internalNotes              InternalNote[]

  @@index([requesterId, createdAt])
  @@index([assignedToId])
  @@index([currentStatus])
  @@index([requestedPriority])
  @@index([itPriority])
}

model Comment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
}
```

### 7.2. Lab 2 Migration Strategy
- Migration evolves `DevRequester` records directly into the `User` table, mapping `DevRequester.id` to `User.id` and setting `role = REQUESTER`, `mustChangePassword = true`, and a known default initial password hash.
- All foreign keys on `Ticket.requesterId` point cleanly to `User.id`.
- Ticket status enum adds `WAITING_FOR_REQUESTER` and `REOPENED` seamlessly.

### 7.3. Idempotent Seed Data
- Minimum active Requesters: 4 (e.g., Jennifer Anderson, David Lee, Emily Davis, Alex Thompson) + 1 inactive Requester (Kevin Patel).
- Minimum active IT Staff: 3 (e.g., Michael Brown, Sarah Johnson, Robert Wilson) + 1 inactive IT Staff (Lisa Martinez).
- Minimum active Administrators: 1 (e.g., John Smith / `admin@toktickit.com`).
- Realistic ticket distribution across categories, priorities, owners, comments, and internal notes.

---

## 8. REST API Contract Summary

Detailed request/response schemas are specified in `docs/lab-03/api-spec.md`.

- `POST /api/auth/login` - Authenticates user, sets HTTP-only cookie.
- `POST /api/auth/logout` - Clears session cookie.
- `GET /api/auth/me` - Returns current authenticated user and role.
- `POST /api/auth/change-password` - Validates current password, saves new password, clears `mustChangePassword`.
- `GET /api/tickets` - Continues Lab 2 Requester tickets (filtered strictly to `req.user.id`).
- `POST /api/tickets` - Creates ticket under `req.user.id`.
- `GET /api/tickets/:id` - Requester ticket detail with attachments and public comments.
- `POST /api/tickets/:id/resolve-indicated` - Requester indicates problem resolved.
- `GET /api/staff/tickets` - IT Staff ticket queue (query params: `q`, `category`, `status`, `requestedPriority`, `itPriority`, `assignedTo`, `page`, `pageSize`, `sortBy`, `sortOrder`).
- `GET /api/staff/tickets/:id` - IT Staff ticket detail including internal notes.
- `PATCH /api/staff/tickets/:id/assign` - Claims or assigns ticket to IT Staff/Admin.
- `PATCH /api/staff/tickets/:id/priority` - Updates IT priority.
- `PATCH /api/staff/tickets/:id/status` - Updates ticket status following permitted transitions.
- `GET /api/tickets/:id/comments` & `POST /api/tickets/:id/comments` - Public comments (all authenticated users with ticket access).
- `GET /api/staff/tickets/:id/notes` & `POST /api/staff/tickets/:id/notes` - Internal notes (`IT_STAFF` and `ADMINISTRATOR` only; `403` for `REQUESTER`).
- `GET /api/admin/users` - Administrator user list with query search and role filter.
- `POST /api/admin/users` - Creates new user with initial password.
- `PATCH /api/admin/users/:id` - Edits user details and active state.
- `POST /api/admin/users/:id/reset-password` - Sets new initial password for user.

---

## 9. Acceptance Criteria

- **AC-01 (Valid Login)**: Given an active user with valid credentials, when logging in via `POST /api/auth/login`, then the backend sets an HTTP-only session cookie and returns user profile, role, and password change status.
- **AC-02 (Inactive Account Rejection)**: Given an inactive user account (`isActive: false`), when attempting login with correct credentials, then the backend rejects with HTTP `401 Unauthorized` without leaking account existence or status.
- **AC-03 (Invalid Credentials)**: Given non-existent email or wrong password, then the backend returns HTTP `401 Unauthorized` with a generic failure message.
- **AC-04 (Mandatory Password Change Enforcement)**: Given a user with `mustChangePassword: true`, when accessing normal protected endpoints, then the backend restricts access until `POST /api/auth/change-password` succeeds with a valid new password.
- **AC-05 (Password Complexity Enforcement)**: Given a new password failing complexity criteria (less than 8 chars, missing uppercase/lowercase/number/symbol), when submitting password change, then the backend returns HTTP `400 Bad Request` with specific validation errors.
- **AC-06 (Logout Invalidation)**: Given an authenticated session, when `POST /api/auth/logout` is called, then the session cookie is cleared and subsequent requests return HTTP `401 Unauthorized`.
- **AC-07 (Requester Ownership Isolation)**: Given an authenticated Requester, when requesting tickets, then only tickets created by `req.user.id` are returned. Providing another user's ID does not expose other data.
- **AC-08 (Requester Public Comment)**: Given an authenticated Requester viewing an owned ticket, when submitting a valid comment, then the comment is persisted and visible to Requester and Staff.
- **AC-09 (Requester Resolution Indication)**: Given an owned unresolved ticket, when the Requester triggers "Problem Appears Resolved", then `isProblemResolvedIndicated` is set to `true` and a public note is appended without setting status to `RESOLVED` or `CLOSED`.
- **AC-10 (Internal Notes Confidentiality)**: Given an authenticated Requester, when requesting `GET` or `POST /api/staff/tickets/:id/notes`, then the backend responds with HTTP `403 Forbidden` and exposes no note content.
- **AC-11 (Staff Queue Search & Filter)**: Given authenticated IT Staff, when querying `/api/staff/tickets` with search terms and category/status/priority filters, then only matching tickets are returned with correct pagination metadata.
- **AC-12 (Staff Ticket Ownership Assignment)**: Given an active ticket, when IT Staff claims or reassigns the ticket to another active staff member, then `assignedToId` is updated and persisted.
- **AC-13 (Staff IT Priority Update)**: Given an active ticket, when IT Staff updates IT Priority, then `itPriority` is updated while `requestedPriority` remains unchanged.
- **AC-14 (Permitted Status Transitions)**: Given a ticket in `OPEN` status, when IT Staff transitions to `IN_PROGRESS` or `RESOLVED`, the update succeeds. Invalid transitions (e.g. `CLOSED` directly from `NEW`) return HTTP `400 Bad Request`.
- **AC-15 (Admin User Listing)**: Given an Administrator, when calling `GET /api/admin/users`, then all system users are returned with Name, Email, Role, and Status.
- **AC-16 (Admin User Creation)**: Given an Administrator, when submitting valid new user details with an initial password, then the user is created with `mustChangePassword: true` and hashed credentials.
- **AC-17 (Admin Duplicate Email Prevention)**: Given an existing email address, when creating or updating a user with that email, then the backend returns HTTP `409 Conflict`.
- **AC-18 (Admin Self-Deactivation Prevention)**: Given an Administrator, when attempting to deactivate their own account, then the backend rejects the request with HTTP `400 Bad Request`.
- **AC-19 (Admin Last Admin Protection)**: Given a system with only one active Administrator, when attempting to deactivate or change the role of that user, then the backend rejects with HTTP `409 Conflict`.
- **AC-20 (Role Route Guarding)**: Given a user with role `REQUESTER` or `IT_STAFF`, when attempting to access `/api/admin/*` endpoints, then the backend rejects with HTTP `403 Forbidden`.

---

## 10. Product Definition of Done (DoD)

1. [ ] **Specification Compliance**: All 20 Acceptance Criteria (AC-01 through AC-20) verified and mapped to passing automated tests.
2. [ ] **Zero DevRequester Remnants**: Development requester selector and its client-side state are completely removed.
3. [ ] **Database Integrity**: Prisma migrations run cleanly from Lab 2 schema without data loss. Seed script is idempotent and seeds all required roles and sample records.
4. [ ] **Automated Test Coverage**:
   - Backend test suites in `server/tests/lab-03/` cover auth, RBAC, staff queue, ticket operations, notes, and admin management.
   - Frontend component tests in `client/src/.../lab-03 tests/` cover login, password change, queue, ticket detail, and user management.
   - End-to-end Playwright tests in `e2e/lab-03/` cover authentication, ticket workflow, and administration.
   - 100% of automated tests pass without skipping, disabling, or mocking out essential checks.
5. [ ] **UI & Responsive Verification**: All new screens match the Zen Green theme with zero layout breaks or horizontal overflows across Desktop (1280px), Tablet (768px), and Mobile (375px).
6. [ ] **Documentation Complete**: `specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`, `reviewer.md`, and `ai-use.md` exist in `docs/lab-03/` written in 100% English.

---

## 11. Assumptions and Architectural Decisions

1. **Authentication via HTTP-only Cookies**: Chosen over Bearer JWT in LocalStorage to safeguard against XSS token leakage, streamline Playwright E2E sessions, and adhere to industry standards.
2. **Password Complexity**: Strict rule requiring at least 8 characters, uppercase, lowercase, numbers, and special symbols for both initial passwords and user updates.
3. **Problem Appears Resolved Behavior**: Requester action sets `isProblemResolvedIndicated: true` and logs an automated comment; formal ticket resolution remains under IT Staff authority.
4. **Admin Initial Password Management**: Admin inputs the initial password directly with a built-in helper to generate a secure compliant password.
