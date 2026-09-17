# Sprint 3 Test Plan & Traceability Matrix: TokTickIT

> **Test Methodology**: Spec-Driven Development (Spec DD) & Test-Driven Development (TDD).
> All automated tests are defined prior to feature implementation and must pass before release.
> **Status**: APPROVED

---

## 1. Test Architecture & Structure

TokTickIT employs a three-tier automated testing pyramid for Lab 3:

```
                  ┌──────────────────────┐
                  │   Playwright E2E     │  e2e/lab-03/*.spec.ts
                  ├──────────────────────┤
                  │ React RTL Components │  client/src/tests/lab-03/*.test.tsx
                  ├──────────────────────┤
                  │ Supertest API / Unit │  server/tests/lab-03/*.test.ts
                  └──────────────────────┘
```

1. **Backend Integration & Security Tests (`server/tests/lab-03/`)**:
   - Supertest + Vitest testing Express routes against test database.
   - Enforces authentication cookies, session parsing, password hashing, and server-side RBAC guards.
2. **Frontend UI Component Tests (`client/src/tests/lab-03/`)**:
   - React Testing Library + Vitest.
   - Tests form validations, disabled states, checklist updates, search filtering, and safe error renderings.
3. **End-to-End Regression & Flow Tests (`e2e/lab-03/`)**:
   - Playwright testing full user journeys across real browsers with cookies, navigation redirects, and CRUD workflows.

---

## 2. Test Traceability Matrix

| Test ID | Type | Req / AC | What It Tests | Expected Result | Automated Test File | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | API | AC-01 | Valid user credentials authentication | Sets `toktickit_session` cookie; returns 200 with user data and role | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-02** | API | AC-02 | Inactive user account login attempt | Rejects with 401 Unauthorized; generic error message without account leakage | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-03** | API | AC-03 | Non-existent user or invalid password | Rejects with 401 Unauthorized; generic failure response | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-04** | API | AC-04 | Access normal endpoints with `mustChangePassword=true` | Blocks request with 403 or redirect indicator until password changed | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-05** | API | AC-05 | New password failing complexity policy | Rejects with 400 Bad Request; lists missing requirements | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-06** | API | AC-06 | Session logout endpoint | Clears session cookie; subsequent `/api/auth/me` returns 401 | `server/tests/lab-03/auth.api.test.ts` | Planned |
| **API-07** | API | AC-07 | Requester fetches tickets with client-supplied ID | Ignores query ID; applies authenticated `req.user.id` strictly | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **API-08** | API | AC-10 | Requester requests Internal Notes | Returns 403 Forbidden; zero internal note content leaked | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-09** | API | AC-08 | Requester posts Public Comment on owned ticket | Persists comment with author metadata; returns 201 Created | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-10** | API | AC-09 | Requester marks "Problem Appears Resolved" | Sets `isProblemResolvedIndicated=true`; logs public note; status unchanged | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| **API-11** | API | AC-11 | Staff retrieves Ticket Queue with search & filters | Returns matching tickets, correct pagination metadata, and sorting | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| **API-12** | API | AC-12 | Staff claims ticket ownership | Updates `assignedToId` to claiming staff; returns 200 OK | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-13** | API | AC-13 | Staff updates IT Priority | Modifies `itPriority` while `requestedPriority` remains intact | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-14** | API | AC-14 | Staff updates status according to transition rules | Valid transitions succeed; invalid transitions return 400 Bad Request | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| **API-15** | API | AC-15 | Admin retrieves user list with role filter | Returns all users with role and status pills; 403 for non-admins | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-16** | API | AC-16 | Admin creates user with initial password | Creates user with `mustChangePassword=true` and hashed password | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-17** | API | AC-17 | Admin creates user with duplicate email | Rejects with 409 Conflict | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-18** | API | AC-18 | Admin attempts self-deactivation | Rejects with 400 Bad Request; preserves admin active status | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-19** | API | AC-19 | Admin attempts to deactivate the last active Admin | Rejects with 409 Conflict; prevents zero-admin state | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| **API-20** | API | AC-20 | Non-admin accesses `/api/admin/*` endpoints | Returns 403 Forbidden | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| **UI-01** | Component | AC-01 | Login form submission and validation | Renders form, validates empty inputs, posts payload, redirects on success | `client/src/tests/lab-03/Login.test.tsx` | Planned |
| **UI-02** | Component | AC-04 | Change Password checklist validation | Live checklist updates green on valid input; disables submit until valid | `client/src/tests/lab-03/ChangePassword.test.tsx` | Planned |
| **UI-03** | Component | AC-11 | Staff Queue table rendering & search debouncing | Renders table with badges, filters trigger updates, handles empty state | `client/src/tests/lab-03/StaffTicketQueue.test.tsx` | Planned |
| **UI-04** | Component | AC-12 | Staff Ticket Detail controls & tabs | Renders dual tabs (Comments vs Notes), claim button, status modal | `client/src/tests/lab-03/StaffTicketDetail.test.tsx` | Planned |
| **UI-05** | Component | AC-18 | Admin User Management safety warnings | Disables self-deactivation switch with tooltip; shows last admin alert | `client/src/tests/lab-03/UserManagement.test.tsx` | Planned |
| **E2E-01** | E2E | AC-01 | End-to-end login, app shell navigation, logout | User logs in, sees role navigation, logs out, session terminated | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-02** | E2E | AC-04 | Mandatory password change on first login | Initial password user is forced to change password before entering app | `e2e/lab-03/authentication.spec.ts` | Planned |
| **E2E-03** | E2E | AC-12 | Complete Staff Ticket handling flow | Staff views queue, claims ticket, changes priority/status, writes note | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| **E2E-04** | E2E | AC-16 | Admin User Management lifecycle | Admin creates user, edits role, sets initial password, verifies safety guards | `e2e/lab-03/user-administration.spec.ts` | Planned |

---

## 3. Test Execution Commands

```bash
# Run Backend API & Integration Test Suites
cd server && npm test

# Run Specific Backend Test Suite
cd server && npx vitest run tests/lab-03/auth.api.test.ts

# Run Frontend React Testing Library Suites
cd client && npm test

# Run End-to-End Playwright Tests
npx playwright test e2e/lab-03/
```
