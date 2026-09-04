# Lab 2 Test Plan and Results — TokTickIT

Status: DRAFT v1, to be filled in with Pass/Fail during implementation.

## 1. Test Strategy

Test-Driven Development is used per issue: for each Acceptance Criterion in scope, write the failing
test first (unit/API/UI as appropriate), then implement the smallest change to pass it, then refactor.
No test is written after the fact to match whatever the AI coding agent happened to build.

Levels used in this project (matching the real stack, not the illustrative Jest examples in the
handout):
- **Unit** — Vitest, isolated logic (e.g. Ticket Number formatting, validation functions)
- **API/Integration** — Vitest + Supertest, hitting the real Express app against a test database
- **UI Component** — Vitest + React Testing Library
- **Responsive/Visual** — Playwright screenshots at 3 viewport widths + manual checklist
- **E2E** — Playwright, full browser flows against the running app

## 2. Planned Tests

| Test ID | Type | AC | What it tests | Expected Result | Test File |
|---|---|---|---|---|---|
| UNIT-01 | Unit | AC-01 | Ticket Number formatter produces `TKT-YYYY-NNNNNN` | Correct zero-padded format | `server/tests/lab-02/ticket-number.unit.test.ts` |
| UNIT-02 | Unit | AC-01 | Ticket Number counter increments per year, resets logically for a new year | Sequential values, no collision | `server/tests/lab-02/ticket-number.unit.test.ts` |
| API-01 | API | AC-01 | POST /api/tickets with valid data | 201, ticket saved, ticketNumber returned | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-02 | API | AC-04 | POST /api/tickets missing summary | 400 VALIDATION_ERROR, fields.summary set | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-03 | API | AC-04 | POST /api/tickets with description under 20 chars | 400 VALIDATION_ERROR | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-04 | API | — (BR-19) | POST /api/tickets with unknown categoryId | 400 INVALID_CATEGORY | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-05 | API | AC-06 | POST /api/tickets with a 6MB attachment | 400 INVALID_ATTACHMENT | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-06 | API | AC-06 | POST /api/tickets with a .exe attachment | 400 INVALID_ATTACHMENT | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-07 | API | AC-19 | Ticket created, one attachment upload fails mid-way | 201, ticket returned, failedAttachments populated | `server/tests/lab-02/create-ticket.api.test.ts` |
| API-08 | API | AC-12 | GET /api/dev-requesters excludes inactive | Inactive requester absent from response | `server/tests/lab-02/dev-requesters.api.test.ts` |
| API-09 | API | AC-03, AC-20 | GET /api/tickets/:id for a ticket owned by another requester | 404, no ticket data leaked | `server/tests/lab-02/ticket-detail.api.test.ts` |
| API-10 | API | AC-11 | GET /api/tickets with page=2 pageSize=10 on 15 tickets | Correct 5 remaining items + metadata | `server/tests/lab-02/my-tickets.api.test.ts` |
| API-11 | API | — (BR-16) | GET /api/tickets with page=99 on 15 tickets | 200, empty items, valid metadata (not an error) | `server/tests/lab-02/my-tickets.api.test.ts` |
| API-12 | API | AC-09 | GET /api/tickets?search=zzzznotfound | 200, empty items (no-results case) | `server/tests/lab-02/my-tickets.api.test.ts` |
| API-13 | API | AC-10 | GET /api/tickets?sortBy=ticketNumber&sortDir=asc | Items ordered correctly | `server/tests/lab-02/my-tickets.api.test.ts` |
| API-14 | API | — (BR-13) | GET /api/tickets with 2 combined filters | AND logic applied correctly | `server/tests/lab-02/my-tickets.api.test.ts` |
| API-15 | API | AC-15 | DELETE /api/attachments/:id without reason | 400 VALIDATION_ERROR | `server/tests/lab-02/attachments.api.test.ts` |
| API-16 | API | AC-16 | GET /api/attachments/:id/download on a removed attachment | 404, file not served | `server/tests/lab-02/attachments.api.test.ts` |
| API-17 | API | — (BR-28) | POST attachment on a ticket that already has 5 active | 400 TOO_MANY_ATTACHMENTS | `server/tests/lab-02/attachments.api.test.ts` |
| API-18 | API | — (BR-33) | DELETE /api/attachments/:id not owned by requester | 404 | `server/tests/lab-02/attachments.api.test.ts` |
| API-19 | API | — | DELETE an already-removed attachment | 409 ALREADY_REMOVED | `server/tests/lab-02/attachments.api.test.ts` |
| UI-01 | UI | AC-02 | Navigate to /tickets with no requester selected | Redirects to /select-requester | `client/tests/lab-02/RouteGuard.test.tsx` |
| UI-02 | UI | AC-13 | Selector screen with zero active requesters | Empty state shown, Continue disabled | `client/tests/lab-02/RequesterSelection.test.tsx` |
| UI-03 | UI | AC-04 | Submit Create Ticket with empty Summary | Inline field error, no fetch call made | `client/tests/lab-02/CreateTicket.test.tsx` |
| UI-04 | UI | — (BR-21) | Click Submit twice quickly | Second click has no effect (button disabled) | `client/tests/lab-02/CreateTicket.test.tsx` |
| UI-05 | UI | AC-05 | Submit fails with simulated 500 | Safe error shown, form values retained | `client/tests/lab-02/CreateTicket.test.tsx` |
| UI-06 | UI | AC-06 | Select an oversized file in the attachment picker | Inline rejection message, no upload attempted | `client/tests/lab-02/AttachmentPicker.test.tsx` |
| UI-07 | UI | AC-08 | Requester with 0 tickets opens My Tickets | Empty state (not no-results) shown | `client/tests/lab-02/MyTickets.test.tsx` |
| UI-08 | UI | AC-09 | Filter combination matches nothing | No-results state with Clear Filters button | `client/tests/lab-02/MyTickets.test.tsx` |
| UI-09 | UI | AC-17 | Change Requester while on My Tickets | List reloads, shows new requester's data only | `client/tests/lab-02/MyTickets.test.tsx` |
| UI-10 | UI | AC-14 | Open Ticket Detail for an owned ticket | All fields render read-only | `client/tests/lab-02/TicketDetail.test.tsx` |
| UI-11 | UI | AC-15 | Click remove on an attachment without entering a reason | Confirm button disabled until reason entered | `client/tests/lab-02/AttachmentSection.test.tsx` |
| UI-12 | UI | AC-16 | Attachment list includes a removed item | Shown with disabled/greyed download control | `client/tests/lab-02/AttachmentSection.test.tsx` |
| RESP-01 | Responsive | AC-18 | Create Ticket at 375px width | No horizontal scroll, no clipped labels | Playwright screenshot, manual checklist |
| RESP-02 | Responsive | AC-18 | My Tickets at 375px width (card layout) | No horizontal scroll, all data visible | Playwright screenshot, manual checklist |
| RESP-03 | Responsive | AC-18 | Ticket Detail at 768px (tablet) | Two-column layout, no overlap | Playwright screenshot, manual checklist |
| E2E-01 | E2E | AC-01, AC-17, AC-03 | Select Requester A → create ticket → find it in My Tickets → switch to Requester B → confirm A's ticket is gone | Full flow passes end to end | `e2e/lab-02/requester-ticket-flow.spec.ts` |
| E2E-02 | E2E | AC-14, AC-15, AC-16 | Open ticket → add attachment → remove it with a reason → confirm it shows as removed and undownloadable | Full flow passes end to end | `e2e/lab-02/requester-ticket-flow.spec.ts` |

## 3. Acceptance-Criterion Traceability

| AC | Covered by |
|---|---|
| AC-01 | UNIT-01, UNIT-02, API-01, E2E-01 |
| AC-02 | UI-01 |
| AC-03 | API-09, E2E-01 |
| AC-04 | API-02, API-03, UI-03 |
| AC-05 | UI-05 |
| AC-06 | API-05, API-06, UI-06 |
| AC-07 | API-17 |
| AC-08 | UI-07 |
| AC-09 | API-12, UI-08 |
| AC-10 | API-13 |
| AC-11 | API-10 |
| AC-12 | API-08 |
| AC-13 | UI-02 |
| AC-14 | UI-10, E2E-02 |
| AC-15 | API-15, UI-11, E2E-02 |
| AC-16 | API-16, UI-12, E2E-02 |
| AC-17 | UI-09, E2E-01 |
| AC-18 | RESP-01, RESP-02, RESP-03 |
| AC-19 | API-07 |
| AC-20 | API-09, API-18 |

## 4. Responsive and Visual Checklist

Run against Create Ticket, My Tickets, and Ticket Detail at 375px (mobile), 850px (tablet), and 1280px
(desktop):

- [ ] No horizontal page scrolling at any width
- [ ] No clipped labels or truncated button text
- [ ] No overlapping elements or messages
- [ ] Required-field asterisk always paired with a validation message on error
- [ ] Read-only fields visually distinct from editable fields at every width
- [ ] Priority/status badges legible and consistent (not relying on color alone)
- [ ] Attachment names don't overflow their container
- [ ] Pagination controls remain usable/tappable on mobile

## 5. Test Commands

```bash
cd server && npm test              # Vitest unit + API tests
cd client && npm test              # Vitest + Testing Library UI tests
npx playwright test                # E2E + responsive screenshots (from repo root)
```

## 6. Final Results

To be filled in before submission — paste the final passing test-run output here, run from the final
`main` branch.

## 7. Known Limitations or Deferred Tests

To be filled in if any planned test is deferred with reviewer approval (should be empty in a
compliant submission — no required test may be skipped).
