# Lab 4 UI Specification: Zen Green Design and Final Application Shell

This document defines user interface layouts, design tokens, responsive behavior, interaction states, and accessibility standards for Sprint 4.

## 1. Zen Green Design System

All screens strictly adhere to the established Zen Green palette and typography tokens defined in `client/src/theme.css`:

### 1.1. Color and Token Palette
- **Primary Brand**: `--bs-primary: #006b3c` (Primary actions, active navigation items)
- **Secondary Accent**: `--bs-info: #0b7a46` (Repurposed as secondary brand green, link color)
- **Background Tint**: `--zg-pale-green: #eaf6ef` (Completed action badges, soft success highlights)
- **Read-Only Input Background**: `--zg-readonly-bg: #f3f5f4` (Un-editable fields, disabled inputs)
- **Body Background**: `--bs-body-bg: #f5f7f6` (Application canvas background)
- **Body Text**: `--bs-body-color: #1f2e28` (High-contrast typography)
- **Border Neutral**: `--bs-border-color: #dde5e1` (Card borders, dividers)
- **Card Shadow**: `--zg-shadow-soft: 0 1px 2px rgba(31, 46, 40, 0.04), 0 8px 24px rgba(31, 46, 40, 0.06)`
- **Interactive Transition**: `--zg-transition: 150ms ease`

### 1.2. Status Badges and Labels
Status badges must never rely on color alone. Each badge displays explicit text:
- **Planned Action**: Secondary outline badge with text label "Planned".
- **Completed Action**: Solid pale green badge (`--zg-pale-green`) with text label "Completed".
- **Cancelled Action**: Muted neutral badge with text label "Cancelled".
- **Follow-Up Indicator**: Orange accent badge with flag icon and text "Follow-Up".

### 1.3. Private vs Shared Content Distinction
- **Shared Content**: Public Comments use neutral white cards with standard borders and a green "Public" pill badge visible to all parties.
- **Private Content**: Internal Notes are styled with a distinct amber background tint (`#FEF3C7`), dark amber border (`#D97706`), and a prominent lock icon with "Internal Note: Staff Only" heading. Internal notes are strictly stripped from all Requester views.

---

## 2. Application Navigation and App Shell

### 2.1. Landing Behavior
- Authenticated users are routed to `/dashboard` immediately upon signing in.
- Role-based landing ensures Requesters see the Requester Dashboard while Staff and Administrators see the IT Staff Dashboard.

### 2.2. Navigation Menus
Matching the real `AppShell` and `MobileMenu` components:
- **Desktop Navbar**:
  - Requester: Dashboard, My Tickets, Create Ticket, User Badge, Logout.
  - IT Staff: Dashboard, Ticket Queue, User Badge, Logout.
  - Administrator: Dashboard, Ticket Queue, User Management, User Badge, Logout.
- **Mobile Menu**:
  - Dynamically mirrors desktop navigation according to the active user role.
  - Implements focus trapping and Escape-key closure.
  - Highlights active routes with `aria-current="page"`.

---

## 3. Screen Layouts and States

### 3.1. IT Staff Dashboard
- **Welcome Banner**: Displays staff member greeting and queue overview summary.
- **Metric Cards Row**:
  - 5 key operational cards: New, Open, In Progress, Waiting for Requester, My Assigned.
  - Counts for `myAssigned` and `unassigned` aggregate active tickets only.
  - Each card shows large numerical counts and a clickable "View" drill-down link leading to `/staff/queue` with the corresponding filter parameter pre-applied.
- **Main Section (2-Column Grid on Desktop)**:
  - Left Column (70%): "Recent Operational Tickets" displaying up to 5 recently updated records with Ticket No, Title, Status badge, and timestamp.
  - Right Column (30%): Quick Actions panel with direct buttons for "Search Tickets" and "My Queue" (Staff do not have Create Ticket).
- **Administrator Enhancement**:
  - Administrators receive an additional metric section displaying Total Users, Active Users, and Inactive Users with a link to User Management.

### 3.2. Requester Dashboard
- **Welcome Banner**: Welcomes the authenticated requester by name.
- **Metric Cards Row**:
  - Cards: My Open Tickets, Waiting for Requester, In Progress, Resolved, Closed.
  - Drill-down links lead to `/tickets` with matching filter parameters (`currentStatus` and `statusGroup`).
- **Content Grid**:
  - "Attention Required": Highlights tickets in `WAITING_FOR_REQUESTER` requiring user response.
  - "My Recent Tickets": Lists up to 5 of the requester's recent tickets with click-to-view navigation.
  - "Quick Actions": Direct buttons for "Create Ticket" and "View My Tickets".

### 3.3. Dashboard States (Handout 8.1 & 8.2)
- **Loading State**: Displays skeleton cards with subtle pulse animation while data is fetching.
- **Empty State**:
  - Staff: "No tickets in queue. All systems operating smoothly."
  - Requester: "You have no active support requests. Need assistance? Create a ticket."
- **Forbidden State**: Displays dedicated 403 screen with "Access Denied" heading, explanation, and a primary button returning to the user's role-appropriate dashboard.
- **Safe Failure Feedback**: In case of network or API failure, presents an error banner with "Unable to load dashboard data" and a functional "Retry" button.

### 3.4. Actions Taken on Ticket Detail
Located between the Ticket Summary metadata card and the Comments section:
- **IT Staff Mode**:
  - Header with "+ Add Action" button.
  - Inline Add Action form with fields: Action Date/Time (defaults to now, allows future date for Planned), Assignee select (active staff only), Description textarea, Result textarea, Follow-Up Required checkbox, Follow-Up Note textarea (conditionally visible and required), and Attachment Notes.
  - "Performed by" is displayed read-only as the current user.
  - Action list table on desktop; responsive stacked cards on mobile.
  - Action status controls: Edit, Complete (requires non-empty Result), and Cancel (with inline confirmation dialog).
  - Save button disables and renders "Saving..." while submitting to prevent double clicks.
- **Requester Mode**:
  - Titled "Work Performed by IT".
  - Clean, read-only list without any creation, editing, or status transition buttons.
  - Displays Action Date, Description, Result, Performed By, and Follow-Up indicator.

### 3.5. Ticket Status Controls and Requester Reopen
- On `StaffTicketDetail`:
  - Status dropdown dynamically populated from server `allowedTransitions`.
  - Explanatory alert banner displayed when the Resolution Gate is unsatisfied, explicitly stating missing conditions.
  - Status change requires confirmation modal.
  - HTTP 409 Conflict triggers a clear "Record changed by another user" reload banner.
- On `TicketDetail` (Requester):
  - Tickets in `RESOLVED` or `CLOSED` status render a prominent "Reopen Ticket" button.
  - Clicking Reopen opens a modal to supply an optional reason, transitioning the ticket to `REOPENED` and updating the Status History card.

---

## 4. Responsive Viewport Specifications

| Viewport Category | Width | Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop** | 1280px | Full two-column dashboard grid; table layouts for queues and actions; full top navigation bar. |
| **Tablet** | 768px | Metric cards wrap into 2x2 grid; sidebar quick actions stack below main content; tables enable horizontal scroll wrappers without page-level overflow. |
| **Mobile** | 375px | Single-column stacked cards; action table transforms into card view; hamburger mobile menu replaces top bar; all inputs span 100% container width. |

---

## 5. Visual and Accessibility Quality Checklist

The following checklist must be fully verified and recorded with evidence before final release:

| Check Item | Inspection Criteria | Desktop (1280px) | Tablet (768px) | Mobile (375px) |
| :--- | :--- | :---: | :---: | :---: |
| **1. Design Consistency** | Consistent Zen Green tokens, font hierarchy, card borders | Pending | Pending | Pending |
| **2. Role Navigation** | Links strictly adapt to role; unauthorized paths blocked | Pending | Pending | Pending |
| **3. Non-Color Badges** | All status, priority, and action badges carry text labels | Pending | Pending | Pending |
| **4. Read-Only Visuals** | Read-only fields use `--zg-readonly-bg` with standard text | Pending | Pending | Pending |
| **5. Validation Messages** | Errors render beneath inputs with aria-describedby binding | Pending | Pending | Pending |
| **6. Keyboard Focus** | Interactive elements show visible focus ring; focus trap active | Pending | Pending | Pending |
| **7. No Clipping / Overlap** | Text wraps cleanly; modals fit viewport without clipping | Pending | Pending | Pending |
| **8. Zero Horizontal Scroll** | `scrollWidth <= innerWidth` (zero page horizontal overflow) | Pending | Pending | Pending |
| **9. Safe Feedback** | Skeletons on loading, clear empty states, retry on failure | Pending | Pending | Pending |

---

## 6. Screenshot Evidence Matrix for Submission Report

Screenshots will be captured and stored under `artifacts/lab-04/screenshots/`:

| Part | Screen Target and State | Viewports to Capture | Storage Path |
| :--- | :--- | :--- | :--- |
| **Part 5** | Staff Dashboard: Normal Operational State | 1280px, 768px, 375px | `artifacts/lab-04/screenshots/staff-dashboard/normal/` |
| **Part 5** | Staff Dashboard: Loading Skeleton State | 1280px | `artifacts/lab-04/screenshots/staff-dashboard/loading.png` |
| **Part 5** | Staff Dashboard: Empty Queue State | 1280px | `artifacts/lab-04/screenshots/staff-dashboard/empty.png` |
| **Part 5** | Staff Dashboard: Safe Failure with Retry | 1280px | `artifacts/lab-04/screenshots/staff-dashboard/failure.png` |
| **Part 6** | Actions Taken: List, Create Form, View/Edit | 1280px, 768px, 375px | `artifacts/lab-04/screenshots/actions-taken/` |
| **Part 7** | Ticket Workflow: Status Dropdown & Resolution Gate | 1280px | `artifacts/lab-04/screenshots/ticket-workflow/` |
| **Part 8** | Requester Dashboard: Normal, Attention & Empty | 1280px, 768px, 375px | `artifacts/lab-04/screenshots/requester-dashboard/` |
| **Part 8** | Final Regression: Login, Queue, Detail, Admin Users | 1280px | `artifacts/lab-04/screenshots/regression/` |
| **Part 9** | Forbidden Access Screen (HTTP 403) | 1280px, 375px | `artifacts/lab-04/screenshots/forbidden/` |
