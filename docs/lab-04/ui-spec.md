# Lab 4 UI Specification: Zen Green Design and Final Application Shell

This document defines user interface layouts, design tokens, responsive behavior, interaction states, and accessibility standards for Sprint 4.

## 1. Zen Green Design System

All screens strictly adhere to the established Zen Green palette and typography tokens defined in `client/src/theme.css`:

### 1.1. Color Palette Tokens
- **Primary Brand**: `#006B3C` (`--color-primary`)
- **Primary Dark / Hover**: `#00522E` (`--color-primary-dark`)
- **Light Tint Background**: `#E8F5E9` (`--color-primary-light`)
- **Text Primary**: `#1F2937` (`--color-text`)
- **Text Muted**: `#4B5563` (`--color-text-muted`)
- **Border Neutral**: `#E5E7EB` (`--color-border`)
- **Surface Card**: `#FFFFFF` (`--color-surface`)
- **Danger / Error**: `#DC2626` (`--color-danger`)
- **Warning / Internal Note**: `#D97706` (`--color-warning`)

### 1.2. Status Badges and Labels
Status badges must never rely on color alone. Each badge displays explicit text:
- **Planned Action**: Secondary outline with text label "Planned".
- **Completed Action**: Pale green solid badge with text label "Completed".
- **Cancelled Action**: Muted gray badge with text label "Cancelled".
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
  - Each card shows large numerical counts and a clickable "View" drill-down link leading to `/staff/queue` with the corresponding filter parameter pre-applied.
- **Main Section (2-Column Grid on Desktop)**:
  - Left Column (70%): "My Recent Tickets" displaying up to 5 recently updated records with Ticket No, Title, Status badge, and timestamp.
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
  - Inline Add Action form with fields: Action Date/Time (defaults to now), Assignee select (active staff only), Description textarea, Result textarea, Follow-Up Required checkbox, Follow-Up Note textarea (conditionally visible and required), and Attachment Notes.
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

The following checklist must be fully verified and documented:

| Check Item | Inspection Criteria | Desktop (1280px) | Tablet (768px) | Mobile (375px) |
| :--- | :--- | :---: | :---: | :---: |
| **1. Design Consistency** | Consistent Zen Green tokens, font hierarchy, card borders | Verified | Verified | Verified |
| **2. Role Navigation** | Links strictly adapt to role; unauthorized paths blocked | Verified | Verified | Verified |
| **3. Non-Color Badges** | All status, priority, and action badges carry text labels | Verified | Verified | Verified |
| **4. Read-Only Visuals** | Read-only fields use neutral background with standard text | Verified | Verified | Verified |
| **5. Validation Messages** | Errors render beneath inputs with aria-describedby binding | Verified | Verified | Verified |
| **6. Keyboard Focus** | Interactive elements show visible 2px focus ring; focus trap active | Verified | Verified | Verified |
| **7. No Clipping / Overlap** | Text wraps cleanly; modals fit viewport without clipping | Verified | Verified | Verified |
| **8. Zero Horizontal Scroll** | `scrollWidth <= innerWidth` (zero page horizontal overflow) | Verified | Verified | Verified |
| **9. Safe Feedback** | Skeletons on loading, clear empty states, retry on failure | Verified | Verified | Verified |

---

## 6. Screenshot Evidence Matrix for Part 9

Screenshots will be captured and stored under `artifacts/lab-04/screenshots/`:

| Screen Target | Viewport Sizes to Capture | Storage Path |
| :--- | :--- | :--- |
| IT Staff Dashboard | 1280px, 768px, 375px | `artifacts/lab-04/screenshots/staff-dashboard/` |
| Requester Dashboard | 1280px, 768px, 375px | `artifacts/lab-04/screenshots/requester-dashboard/` |
| Actions Taken on Ticket Detail | 1280px, 768px, 375px | `artifacts/lab-04/screenshots/actions-taken/` |
