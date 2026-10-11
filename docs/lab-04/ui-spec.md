# Lab 4 UI Specification: Zen Green Design and Final Application Shell

This document defines the user interface layout, design tokens, responsive behavior, and accessibility standards for Sprint 4.

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

---

## 2. Application Navigation and App Shell

### 2.1. Landing Behavior
- Authenticated users are routed to `/dashboard` immediately upon signing in.
- Role-based default landing ensures Requesters see the Requester Dashboard while Staff and Administrators see the IT Staff Dashboard.

### 2.2. Navigation Menus
- **Desktop Navbar**:
  - Requester: Dashboard, My Tickets, Create Ticket, Profile Dropdown.
  - IT Staff: Dashboard, Ticket Queue, Profile Dropdown.
  - Administrator: Dashboard, Ticket Queue, User Management, Profile Dropdown.
- **Mobile Menu**:
  - Dynamically mirrors the desktop navigation according to the active user role.
  - Implements focus trapping and Escape-key closure.
  - Highlights active routes with `aria-current="page"`.

---

## 3. Screen Layouts

### 3.1. IT Staff Dashboard
- **Welcome Banner**: Displays staff member greeting and queue overview summary.
- **Metric Cards Row**:
  - 5 key operational cards: New, Open, In Progress, Waiting for Requester, My Assigned.
  - Each card shows large numerical counts and a clickable "View" drill-down link leading to `/staff/queue` with the corresponding filter parameter pre-applied.
- **Main Section (2-Column Grid on Desktop)**:
  - Left Column (70%): "My Recent Tickets" displaying up to 5 recently updated records with Ticket No, Title, Status badge, and timestamp.
  - Right Column (30%): "Quick Actions" panel with direct buttons for Create Ticket, Search Tickets, and My Queue.
- **Administrator Enhancement**:
  - Administrators receive an additional metric section displaying Total Users, Active Users, and Inactive Users with a link to User Management.

### 3.2. Requester Dashboard
- **Welcome Banner**: Welcomes the authenticated requester by first name.
- **Metric Cards Row**:
  - 4 cards: My Open Tickets, In Progress, Resolved, Closed.
  - Drill-down links lead to `/tickets` with matching status filter parameters.
- **Content Grid**:
  - "My Recent Tickets": Lists up to 5 of the requester's recent tickets with click-to-view navigation.
  - "Quick Actions": Direct buttons for "Create Ticket" and "View My Tickets".

### 3.3. Actions Taken on Ticket Detail
Located between the Ticket Summary metadata card and the Comments section:
- **IT Staff Mode**:
  - Header with "+ Add Action" button.
  - Inline Add Action form with fields: Action Date/Time (defaults to now), Assignee select, Description textarea, Result textarea, Follow-Up Required checkbox, Follow-Up Note textarea (conditionally visible and required), and Attachment Notes.
  - "Performed by" is displayed read-only as the current user.
  - Action list table on desktop; responsive stacked cards on mobile.
  - Action status controls: Edit, Complete (requires Result), and Cancel (with inline confirmation).
  - Save button disables and renders "Saving..." while submitting.
- **Requester Mode**:
  - Titled "Work Performed by IT".
  - Clean, read-only list without any creation, editing, or status transition buttons.
  - Displays Action Date, Description, Result, Performed By, and Follow-Up indicator.

### 3.4. Ticket Status Workflow Controls
- On `StaffTicketDetail`:
  - Status dropdown dynamically populated from server `allowedTransitions`.
  - Explanatory banner displayed when the Resolution Gate is unsatisfied, explicitly stating missing conditions.
  - Status change requires explicit confirmation.
  - HTTP 409 Conflict triggers a clear "Record changed by another user" reload banner.

---

## 4. Responsive Viewport Specifications

| Viewport Category | Width | Layout Adjustments |
| :--- | :--- | :--- |
| **Desktop** | 1280px | Full two-column dashboard grid; table layouts for queues and actions; full top navigation bar. |
| **Tablet** | 768px | Metric cards wrap into 2x2 grid; sidebar quick actions stack below main content; tables enable horizontal scroll wrappers without page-level overflow. |
| **Mobile** | 375px | Single-column stacked cards; action table transforms into card view; hamburger mobile menu replaces top bar; all inputs span 100% container width. |

---

## 5. Visual and Accessibility Quality Checklist

All screens are validated against the 9 quality dimensions:

1. **Design Consistency**: Zen Green variables utilized consistently; uniform 8px/12px border radiuses.
2. **Role Navigation**: Navbar and mobile menu strictly adapt to active role; unauthorized links never rendered.
3. **Badges**: Text labels present on every status and priority badge; color never used as the sole indicator.
4. **Editable vs Read-Only**: Read-only fields use neutral background (`#F9FAFB`) with standard text color; edit inputs have distinct focus borders.
5. **Validation Placement**: Field-level validation messages appear directly beneath inputs with `aria-describedby` linkage.
6. **Keyboard Focus**: Interactive elements show visible 2px focus ring; modal and mobile menu trap focus correctly.
7. **No Clipping or Overlap**: Text wraps properly; modals fit within mobile viewports with internal scrollbars.
8. **Horizontal Overflow**: `document.documentElement.scrollWidth == window.innerWidth` across all viewports (zero horizontal page scroll).
9. **Safe Feedback**: Loading skeletons, clean empty states, and dismissible error banners implemented uniformly.
