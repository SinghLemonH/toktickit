# Lab 2 UI Specification — Zen Green Theme (TokTickIT)

Status: DRAFT v1 — implemented as Bootstrap 5 CSS-variable overrides (Bootstrap stays; not replaced).

## 1. Color Tokens

Applied by overriding Bootstrap's Sass/CSS variables in `client/src/theme.css`, loaded after Bootstrap:

| Token | Value | Bootstrap variable overridden | Usage |
|---|---|---|---|
| Primary green | `#006B3C` | `--bs-primary` | App header, primary buttons, strong emphasis |
| Secondary green | `#0B7A46` | `--bs-info` (repurposed) | Active tabs, focus accents, links, hover states |
| Pale green | `#EAF6EF` | custom `--zg-pale-green` | Selected rows, success backgrounds, subtle emphasis |
| Page background | `#F5F7F6` | `--bs-body-bg` | Page background |
| Surface/cards | `#FFFFFF` + subtle border | `--bs-card-bg`, `--bs-border-color` | Cards, panels |
| Text | `#1F2E28` (dark charcoal-green) | `--bs-body-color` | Body text |
| Editable field | white bg, `--bs-border-color` neutral | Bootstrap `.form-control` default | Editable inputs |
| Read-only field | `#F1F4F2` (gray-green) bg | custom `.form-control-readonly` | Read-only display fields |
| Error | `#B3261E` text/border | `--bs-danger` | Field-level validation errors |
| Warning | amber `#B25E00` badge | `--bs-warning` (custom contrast fix) | Non-decorative warnings only |
| Success | `#146C43` text on `--zg-pale-green` bg | `--bs-success` | Confirmation states |

## 2. Typography and Spacing

- Base font: system font stack (Bootstrap default) at 16px body / 14px helper text.
- Headings use Bootstrap's `h1`–`h4` scale unchanged; page titles are `h4` inside the app shell.
- Spacing follows Bootstrap's spacing scale (`.mb-3`, `.p-3`, etc.) — no custom spacing unit
  introduced, to stay consistent with the existing Lab 1 conventions.
- Labels: `font-weight: 600`, `margin-bottom: 4px`, always above their control (never beside it).

## 3. Component States

- **Editable control**: white background, 1px neutral border, focus ring in Secondary green
  (`box-shadow` override of `.form-control:focus`).
- **Read-only control**: `.form-control-readonly` class — gray-green background, no focus ring,
  `cursor: default`, still keyboard-focusable for screen readers with an `aria-readonly="true"`.
- **Invalid control**: red border (`--bs-danger`) + error text directly below via Bootstrap's
  `.invalid-feedback` pattern, always rendered (never a single top-of-form error only).
- **Disabled control/button**: Bootstrap `disabled` attribute + reduced opacity (`0.65`) + `cursor:
  not-allowed`; disabled controls never respond to click/keyboard activation.
- **Focused control**: visible focus ring at all times for keyboard users — never removed via
  `outline: none` without a replacement.
- **Busy button** (Submit while in flight): Bootstrap spinner + `disabled`, label changes to
  "Submitting…"; re-enabled only on response (success navigates away, failure re-enables).

## 4. Required-Field Marker and Validation Placement

- Required fields: red asterisk (`*`) immediately after the label text, `aria-label="required"` on
  the asterisk span for screen readers.
- The asterisk never substitutes for an actual validation message — every invalid required field also
  shows inline text via `.invalid-feedback` directly under the control.

## 5. Button Hierarchy

| Type | Style | Example |
|---|---|---|
| Primary | Solid Primary green, white text | Submit, Continue |
| Secondary | Outline Primary green | Cancel, Change Requester |
| Tertiary | Text-only link style | Clear Filters |
| Destructive | Outline/solid Error red | Remove Attachment (confirm step) |
| Disabled | Any of the above at 0.65 opacity, `cursor: not-allowed` | — |
| Busy | Primary style + spinner, `disabled` | Submit while request is in flight |

Every icon-only control (e.g. a trash icon for remove) has a visible `aria-label` and a native
`title` tooltip — icons support the label, they never replace it silently.

## 6. Attachment Selection and Error Presentation

- Drag-and-drop or file-picker input, showing selected files as a list with name + size before upload.
- Per-file inline rejection message directly under that file's row when type/size is invalid (BR-29) —
  not a single generic error for the whole picker.
- A running counter ("3 of 5 attachments") so the 5-file limit (BR-28) is visible before submission,
  not only discovered via a server error.

## 7. Screen States (all data-driven screens)

Every screen that loads data implements all of: **initial/loading**, **success**, **empty**,
**no-results** (list screens only), and **failure** states, styled consistently:
- Loading: Bootstrap spinner centered in the content area, no layout shift when data arrives.
- Empty (zero records ever): icon + short message + a primary call-to-action (e.g. "Create your first
  ticket").
- No-results (filters/search matched nothing): different icon/message + "Clear Filters" tertiary
  action — must be visually distinguishable from Empty.
- Failure: pale-red banner with a generic safe message + a "Retry" secondary button; never raw error
  text or stack traces.

## 8. Application Shell

- Top bar: TokTickIT wordmark (left), primary nav — **My Tickets**, **Create Ticket** (center/left),
  current Requester name + **Change Requester** dropdown (right).
- Active page indicated by a Secondary-green underline/background on the current nav item.
- Mobile (<768px): nav collapses into a hamburger menu; Requester name/Change Requester moves into
  the same collapsed menu.

## 9. Development Requester Selection Screen

- Centered card, max-width ~480px, on the plain page background.
- Icon + "Select Development Requester" heading + one-sentence "testing only" explanation (exact
  wording from handout Section 8.1).
- Dropdown (native `<select>` for full keyboard/screen-reader support) listing active Requesters by
  name.
- Info callout: "Only active development requesters are shown."
- Secondary callout: "Authentication coming in Lab 3" note, per handout Figure.
- Continue button (Primary) — disabled until a Requester is chosen or while loading.
- States: loading (spinner replaces dropdown), empty (message + disabled Continue, per BR-08),
  failure (retry banner).

## 10. Create Ticket Screen

Layout order, top to bottom:
1. Read-only system fields row: Ticket Number ("Assigned after submission" placeholder pre-save),
   Ticket Date (today's date, read-only).
2. Classification row: Category, Related System, Requested Priority — three selects side by side on
   desktop, stacked on mobile.
3. Summary — single-line input, full width, character counter (x/120).
4. Description — multiline textarea, full width, resizable vertically only, character counter
   (x/2000).
5. Attachments panel (Section 6 above).
6. Action row: Submit (Primary, busy state per Section 3) + Cancel (Secondary) — right-aligned on
   desktop, full-width stacked on mobile.

On success: the form is replaced by a confirmation panel showing the generated Ticket Number in large
text plus "View Ticket" and "Create Another" actions.

## 11. My Tickets Screen

- Header: "My Tickets" title + subtitle + "Create Ticket" primary button (top-right).
- Search bar (Ticket Number/Summary) + filter row (Category, Requested Priority, IT Priority, Current
  Status) + "Clear Filters" tertiary link, all in one control strip.
- **Desktop (≥992px)**: table with sortable column headers (click to sort, arrow indicator) —
  Ticket No., Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Last
  Updated.
- **Mobile (<768px)**: one card per ticket — Ticket No. + Summary prominent, badges for
  Category/Priority/Status below, Last Updated small/muted; tapping the card opens Ticket Detail.
- Pagination: page-size selector (10/25/50) + Previous/Next + page numbers, bottom of the list.
- Priority/Status badges: colored pill + text label (never color-only) — e.g. High priority badge
  reads "High" with a warning-amber pill, not just an amber dot.

## 12. Requester Ticket Detail Screen

- Breadcrumb: "My Tickets > Ticket Details" + "Back to My Tickets" link (top-right, per Figure 1).
- Read-only info grid (2–4 columns on desktop, stacked on mobile): Ticket No., Ticket Date, Category,
  Related System, Requester, Requested Priority, IT Priority, Current Status.
- Summary and Description shown below the grid, full width, read-only styled text blocks.
- **Attachments panel** — visually separated (card border / distinct background) from the ticket-info
  grid above it:
  - Each attachment row: filename, size, uploaded date, download icon (active) or a greyed
    "Unavailable" label (removed) with the removal reason shown in muted text.
  - "Add Attachment" action opens the same picker as Create Ticket (Section 6), respecting the 5-file
    active limit.
  - "Remove" action per active attachment opens a confirmation dialog requiring a non-empty reason
    (Confirm button stays disabled until text is entered) before the soft removal is submitted.
- No Public Comments / Internal Notes / Actions Taken / status-change controls anywhere on this screen.

## 13. Responsive Rules

| Viewport | Rule |
|---|---|
| Desktop ≥992px | Multi-column layouts as specified per screen; content max-width ~1140px, centered |
| Tablet 768–991px | Two-column where practical; Summary/Description get full available width |
| Mobile <768px | Single column, fields stack vertically, buttons full-width and ≥44px tap height, no horizontal scroll |
| All sizes | No clipped labels, no overlapping messages, no hidden buttons, no truncated attachment filenames (ellipsis with full name in a tooltip instead) |

## 14. Accessibility

- All interactive controls reachable and operable via keyboard (Tab/Shift+Tab/Enter/Space).
- Visible focus ring on every focusable element (Section 3).
- Every icon-only control has `aria-label` + `title`.
- Status/priority conveyed by text label, not color alone.
- Form errors associated with their input via `aria-describedby` pointing at the `.invalid-feedback`
  element.

## 15. Visual Inspection Checklist and Screenshot Paths

Screenshots captured via Playwright at 375px / 850px / 1280px widths, stored at:
```
artifacts/lab-02/screenshots/create-ticket/{mobile,tablet,desktop}.png
artifacts/lab-02/screenshots/my-tickets/{mobile,tablet,desktop}.png
artifacts/lab-02/screenshots/ticket-detail/{mobile,tablet,desktop}.png
```

Checklist (also listed in `tests.md` Section 4): no horizontal scroll, no clipping, no overlap,
required-asterisk paired with message, read-only vs editable clearly distinct, badges legible without
color reliance, attachment names don't overflow, pagination usable on mobile.
