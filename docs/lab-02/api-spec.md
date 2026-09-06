# Lab 2 API Contract — TokTickIT

Status: LOCKED v1 — matches `docs/lab-02/schema.prisma` exactly. Changing an endpoint here requires
updating the schema doc and vice versa; they must never drift apart.

## Global conventions

- **Ownership header**: every Requester-scoped request sends `X-Dev-Requester-Id: <int>`. There is no
  session/cookie — this is the entire "who is asking" mechanism for Lab 2 (BR-05).
- **Error shape** (all 4xx/5xx responses):
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Human-readable summary", "fields": { "summary": "Summary must be 5-120 characters" } } }
  ```
  `fields` is present only for validation errors (400) and maps field name → message.
- **Non-owner access** returns `404` with `{ "error": { "code": "NOT_FOUND", "message": "Ticket not found" } }`
  — never `403` — so a non-owner cannot distinguish "doesn't exist" from "not yours" (BR-11).
- **Pagination metadata shape** (returned alongside any list):
  ```json
  { "page": 1, "pageSize": 10, "totalItems": 42, "totalPages": 5 }
  ```

---

## GET /api/categories
Returns active Categories for the Create Ticket form.

- Query: none
- 200 response: `[{ "id": 1, "name": "Hardware" }, ...]` — only rows where `isActive = true`
- No ownership check (public reference data)

## GET /api/related-systems
Same shape/behavior as above, for `RelatedSystem`.

## GET /api/dev-requesters
Returns active Development Requesters for the Selection screen.

- 200 response: `[{ "id": 1, "name": "Jennifer Anderson", "email": "jennifer@example.com" }, ...]` —
  only `isActive = true` (BR-06)
- No ownership check (this endpoint is what establishes identity, so it can't require it)

---

## POST /api/tickets
Creates a Ticket for the Requester identified by `X-Dev-Requester-Id`.

- Headers: `X-Dev-Requester-Id` (required)
- Request body (`multipart/form-data`, since attachments may be included at creation):
  ```
  categoryId: number
  relatedSystemId: number
  summary: string
  description: string
  requestedPriority: "LOW" | "MEDIUM" | "HIGH"
  attachments: File[]   // 0-5 files, optional
  ```
- Validation (BR-17…BR-22, BR-26…BR-29), in order:
  1. `X-Dev-Requester-Id` resolves to an existing, active DevRequester → else `400 INACTIVE_OR_UNKNOWN_REQUESTER`
  2. `categoryId` references an existing, active Category → else `400 INVALID_CATEGORY`
  3. `relatedSystemId` references an existing, active RelatedSystem → else `400 INVALID_RELATED_SYSTEM`
  4. `summary` trimmed length 5–120 → else `400 VALIDATION_ERROR` (`fields.summary`)
  5. `description` trimmed length 20–2000 → else `400 VALIDATION_ERROR` (`fields.description`)
  6. `requestedPriority` is one of the enum values → else `400 VALIDATION_ERROR` (`fields.requestedPriority`)
  7. Each attachment: type in JPG/JPEG/PNG/WEBP/PDF (checked by content sniffing, not extension) and
     ≤5MB → else `400 INVALID_ATTACHMENT` naming the offending file(s); at most 5 attachments total
     → else `400 TOO_MANY_ATTACHMENTS`
- Ticket Number generation (BR-01): inside the same DB transaction as the Ticket insert, atomically
  increment `TicketNumberCounter` for the current year (`UPDATE ... SET lastValue = lastValue + 1
  WHERE year = ? RETURNING lastValue`, upserting the year row first if absent), then format
  `TKT-{year}-{lastValue padded to 6 digits}`.
  **Edge case**: this format assumes fewer than 1,000,000 tickets per year. If `lastValue` exceeds
  999999, the number is not truncated — it simply widens past 6 digits (e.g. `TKT-2026-1000000`)
  rather than overflowing or erroring. This scenario is out of scope for Lab 2's test data (seed +
  manual testing will never approach that volume) and is noted here only so the behavior is defined
  rather than undefined if it were ever hit.
- Success: **201**
  ```json
  {
    "id": 1234,
    "ticketNumber": "TKT-2026-000123",
    "ticketDate": "2026-08-29T09:14:00.000Z",
    "requesterId": 1,
    "categoryId": 3,
    "relatedSystemId": 5,
    "summary": "Laptop battery drains quickly",
    "description": "...",
    "requestedPriority": "MEDIUM",
    "itPriority": null,
    "currentStatus": "NEW",
    "attachments": [ { "id": 10, "originalFilename": "photo.jpg", "sizeBytes": 204800, "uploadedAt": "..." } ],
    "failedAttachments": []
  }
  ```
- **Partial failure (BR-25)**: if the Ticket row is created but one or more attachment uploads fail
  (e.g. disk write error) after passing validation, still return **201** with the successfully
  attached files in `attachments` and the failed filenames in `failedAttachments`, so the frontend can
  tell the user which ones to retry via `POST /api/tickets/:id/attachments`. This only applies to
  failures *after* validation passed — a validation failure (step 7 above) blocks creation entirely
  and returns 400 with nothing created (BR-23).
- **500** `INTERNAL_ERROR` for any unexpected failure — generic message only, no stack trace (BR-24).

---

## GET /api/tickets
Returns a paginated, filtered, sorted list of the requesting Requester's own Tickets.

- Headers: `X-Dev-Requester-Id` (required)
- Query parameters:

| Param | Type | Default | Notes |
|---|---|---|---|
| `search` | string | — | matches `ticketNumber` (prefix, case-insensitive) OR `summary` (substring, case-insensitive) — BR-12 |
| `categoryId` | number | — | exact match |
| `requestedPriority` | LOW\|MEDIUM\|HIGH | — | exact match |
| `itPriority` | LOW\|MEDIUM\|HIGH | — | exact match |
| `currentStatus` | TicketStatus | — | exact match |
| `sortBy` | `createdAt`\|`updatedAt`\|`ticketNumber` | `createdAt` | invalid value falls back to default rather than erroring |
| `sortDir` | `asc`\|`desc` | `desc` | invalid value falls back to default |
| `page` | number | 1 | requesting beyond the last page returns an empty `items` array with valid metadata (BR-16) |
| `pageSize` | 10\|25\|50 | 10 | any other value falls back to 10 (BR-15) |

- Filters combine with AND (BR-13). Secondary sort is always `ticketNumber ASC` for tie-breaking
  (BR-14), applied after whatever `sortBy` the caller picked.
- Success: **200**
  ```json
  {
    "items": [ { "id": 1234, "ticketNumber": "TKT-2026-000123", "summary": "...", "categoryName": "Hardware", "requestedPriority": "MEDIUM", "itPriority": null, "currentStatus": "NEW", "createdAt": "...", "updatedAt": "..." } ],
    "page": 1, "pageSize": 10, "totalItems": 42, "totalPages": 5
  }
  ```
- Only rows where `requesterId` matches the header's resolved Requester are ever returned (BR-09/BR-10)
  — this is a `WHERE` clause in the query, never a post-fetch filter.

---

## GET /api/tickets/:id
Returns one Ticket owned by the requesting Requester, with its full attachment list (active + removed
metadata).

- Headers: `X-Dev-Requester-Id` (required)
- **404** if the Ticket doesn't exist OR exists but belongs to a different Requester (BR-11, BR-38)
- Success: **200**
  ```json
  {
    "id": 1234, "ticketNumber": "TKT-2026-000123",
    "createdAt": "...", "categoryName": "Hardware", "relatedSystemName": "Corporate Laptop",
    "summary": "...", "description": "...",
    "requestedPriority": "MEDIUM", "itPriority": null, "currentStatus": "NEW",
    "attachments": [
      { "id": 10, "originalFilename": "photo.jpg", "sizeBytes": 204800, "uploadedAt": "...", "removedAt": null, "removalReason": null },
      { "id": 11, "originalFilename": "old.pdf", "sizeBytes": 51200, "uploadedAt": "...", "removedAt": "...", "removalReason": "Wrong file" }
    ]
  }
  ```

## POST /api/tickets/:id/attachments
Adds one Attachment to an existing owned Ticket.

- Headers: `X-Dev-Requester-Id` (required)
- Body: `multipart/form-data` with a single `file` field
- **404** if Ticket not owned (BR-11)
- **400 INVALID_ATTACHMENT** if wrong type or >5MB (BR-26, BR-27)
- **400 TOO_MANY_ATTACHMENTS** if the Ticket already has 5 active attachments (BR-28)
- Success: **201** with the created attachment's metadata (same shape as in the list above)

## GET /api/tickets/:id/attachments
Returns just the attachment metadata array for an owned Ticket (same array shape as in
`GET /api/tickets/:id`). Provided separately for cases where the frontend only needs to refresh the
attachment panel without re-fetching the whole ticket.

- **404** if Ticket not owned

## GET /api/attachments/:id/download
Streams the file for an active Attachment on an owned Ticket.

- Headers: `X-Dev-Requester-Id` (required)
- **404** if the Attachment doesn't exist, isn't owned by this Requester (via its Ticket), OR has been
  soft-removed (BR-34 — removed files are never downloadable, and we don't distinguish "removed" from
  "not found" in the response to keep the ownership-hiding behavior consistent)
- Success: **200** with the file bytes and correct `Content-Type`/`Content-Disposition` headers

## DELETE /api/attachments/:id
Soft-removes an active Attachment on an owned Ticket.

- Headers: `X-Dev-Requester-Id` (required)
- Body: `{ "reason": string }` — required, 1–200 characters (BR-32) → else `400 VALIDATION_ERROR`
- **404** if the Attachment doesn't exist or isn't owned (BR-33)
- **409 ALREADY_REMOVED** if the Attachment is already soft-removed (idempotency guard — removing twice
  is a conflict, not a silent success)
- Success: **200** with the updated attachment metadata (`removedAt`/`removalReason` populated)

---

## HTTP status code summary

| Status | Used for |
|---|---|
| 200 | Successful retrieval, successful soft-removal |
| 201 | Ticket created, Attachment created |
| 400 | Validation failure, invalid reference ID, invalid/oversized/excess attachment |
| 404 | Resource doesn't exist OR isn't owned by the requesting Requester |
| 409 | Attachment already soft-removed |
| 500 | Unexpected server error (generic message only) |