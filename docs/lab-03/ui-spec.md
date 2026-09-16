# Sprint 3 UI & Design Specification — TokTickIT

> **Sprint Context**: Lab 3 extends the **Zen Green** design language established in Lab 2.
> **Status**: APPROVED

---

## 1. Design System & Zen Green Tokens

TokTickIT utilizes Bootstrap 5 themed through CSS custom property overrides in `client/src/theme.css`.

### 1.1. Color Palette
- **Primary Brand (Zen Green)**: `#006B3C` (Primary buttons, active links, header navbar accent).
- **Primary Hover**: `#00522E`
- **Light Green Surface**: `#E8F5E9` (Active pill backgrounds, badge highlights).
- **Body Background**: `#F8F9FA` (Soft neutral off-white).
- **Card Surface**: `#FFFFFF` with `box-shadow: 0 1px 3px rgba(0,0,0,0.08); border-radius: 8px;`.
- **Text Primary**: `#212529`
- **Text Muted**: `#6C757D`
- **Internal Note Accent (Amber/Warning)**: `#FFF3CD` surface, `#856404` text, `#FFEEBA` border (Visually distinguishes private staff notes from public comments).

### 1.2. Status Badges & Pills
- `NEW`: Background `#E2E3E5`, Text `#383D41`
- `OPEN`: Background `#CCE5FF`, Text `#004085`
- `IN_PROGRESS`: Background `#FFF3CD`, Text `#856404`
- `WAITING_FOR_REQUESTER`: Background `#E8DAEF`, Text `#5B2C6F`
- `RESOLVED`: Background `#D4EDDA`, Text `#155724`
- `CLOSED`: Background `#D6D8D9`, Text `#1B1E21`
- `REOPENED`: Background `#FADBD8`, Text `#78281F`
- `CANCELLED`: Background `#F8D7DA`, Text `#721C24`

### 1.3. Role Badges
- `REQUESTER`: Badge outline secondary (`border: 1px solid #6C757D; color: #495057;`)
- `IT_STAFF`: Badge solid primary Zen Green (`background-color: #006B3C; color: #FFFFFF;`)
- `ADMINISTRATOR`: Badge dark purple (`background-color: #4A235A; color: #FFFFFF;`)

---

## 2. Screen Specifications

### 2.1. Screen 1: Login (`/login`)
- **Layout**: Centered card (max-width `420px`) on a light Zen Green background with TokTickIT brand icon.
- **Controls**:
  - `Email Address`: `<input type="email">` with placeholder `you@company.com`.
  - `Password`: `<input type="password">` with visibility toggle eye button.
  - `Sign In` Button: Zen Green `.btn-primary`, full width, displays loading spinner during authentication requests.
- **Feedback & Error States**:
  - Invalid credentials or inactive account displays an alert banner at the top of the card: `"Invalid email or password. Please try again."` (Safe message; does not leak user existence).
  - Validation: Displays red input border and inline feedback if required fields are submitted empty.

### 2.2. Screen 2: Mandatory First-Login Password Change (`/change-password`)
- **Behavior**: Automatically rendered if the authenticated user has `mustChangePassword === true`. Access to navbar and normal views is blocked.
- **Card Content**:
  - Heading: *"Change Your Password"*, subtext: *"You must update your temporary initial password before proceeding."*
  - Fields:
    - Current (Temporary) Password
    - New Password
    - Confirm New Password
  - Real-time Checklist:
    - [ ] At least 8 characters
    - [ ] Include uppercase and lowercase letters
    - [ ] Include a number and a special character
  - Button: `Continue to TokTickIT` (disabled until checklist criteria are met and passwords match).

### 2.3. Screen 3: Application Shell & Navbar
- **Header**: Zen Green bar (`#006B3C`) with white text and TokTickIT brand logo.
- **Role-Based Navigation Links**:
  - `REQUESTER`:
    - `My Tickets` (`/tickets`)
    - `+ Create Ticket` (`/tickets/create`)
  - `IT_STAFF`:
    - `Ticket Queue` (`/staff/queue`)
  - `ADMINISTRATOR`:
    - `Ticket Queue` (`/staff/queue`)
    - `User Management` (`/admin/users`)
- **Right Profile Menu**:
  - Displays user's full name, role pill badge, and a `Log Out` button with confirmation.

### 2.4. Screen 4: Requester Ticket Detail (`/tickets/:id`)
- **Extends Lab 2 screen**: Readonly details (Ticket No, Created Date, Category, System, Summary, Description, Status, Attachments).
- **Additions**:
  - **Public Comments Stream**: Chronological message bubbles with author name, role badge, timestamp, and message text.
  - **Add Comment Form**: Textarea (with char counter `0 / 2000`) and Zen Green `Post Comment` button.
  - **"Problem Appears Resolved" Button**:
    - Placed in ticket header next to status pill.
    - Hidden if ticket is already `RESOLVED` or `CLOSED`, or if already marked.
    - Clicking displays a confirmation dialog: *"Confirm that your issue has been resolved? This will notify IT Staff."*
    - On confirm: Sets flag and appends public notice.

### 2.5. Screen 5: IT Staff Ticket Queue (`/staff/queue`)
- **Toolbar**:
  - Search Input: Real-time debounced text input (`"Search by ticket number or summary..."`).
  - Filter Controls: Dropdown selectors for Category, Requested Priority, IT Priority, Status, and Assignee (`All`, `Unassigned`, `Assigned to me`).
  - Clear Filters button when active.
- **Desktop Table View**:
  - Columns:
    1. Ticket No. (Linked to detail)
    2. Created Date (Formatted `MMM DD, YYYY hh:mm A`)
    3. Summary (Truncated with tooltip if long)
    4. Category
    5. Req. Priority (Badge: Low, Med, High)
    6. IT Priority (Badge: Low, Med, High)
    7. Current Status (Zen status badge)
    8. Ticket Owner (Staff name or `Unassigned` italicized)
    9. Action (`Open`)
  - Column headers support click-to-sort (Ticket No, Created Date, Status, Priority).
- **Mobile Card View (< 768px)**:
  - Stacks records into clean cards showing Ticket No, Summary, Badges, and `Open` button.
- **Pagination Footer**:
  - Showing `X to Y of Z tickets`.
  - Previous / Next buttons and clickable page numbers.
- **Empty / No Results State**:
  - Illustrative empty icon with *"No tickets match your search filters."* and a *"Reset Filters"* button.

### 2.6. Screen 6: IT Staff Ticket Detail (`/staff/tickets/:id`)
- **Information Grouping**:
  - Header: Breadcrumb (`Ticket Queue > Ticket Detail`), Ticket No, Back to Queue button.
  - Top Grid: Category, Related System, Requester (Name + Email), Created Date.
  - Operational Controls Panel:
    - **Ticket Owner**: Dropdown list of active IT Staff and Admins + `Claim Ticket` quick-action button.
    - **IT Priority**: Dropdown selector (`LOW`, `MEDIUM`, `HIGH`).
    - **Current Status**: Dropdown showing permitted next states with a `Change Status` confirmation modal.
  - Problem Resolved Banner: If `isProblemResolvedIndicated === true`, an alert banner is shown: *"Requester indicated that this issue appears resolved. Verify and formally close when ready."*
- **Conversation Interface (Dual Channels)**:
  - **Tabs**:
    - **Tab 1: Public Comments** (Icon: Chat bubble) — Shared messages visible to requester.
    - **Tab 2: Internal Notes** (Icon: Lock / Shield, styled in Amber `#FFF3CD` with warning border) — Explicit staff banner: *"Internal Notes are private and never visible to Requesters."*
  - Dedicated input box for each tab to prevent accidental cross-posting.

### 2.7. Screen 7: Administrator User Management (`/admin/users`)
- **Header**:
  - Title: *"User Management"*
  - Search bar: *"Search users by name or email..."*
  - Role Filter dropdown: `All Roles`, `Requester`, `IT Staff`, `Administrator`.
  - `+ Create User` button (Zen Green).
- **Users Table**:
  - Columns: Full Name, Email Address, Role (colored badge), Status (`Active` green pill / `Inactive` gray pill), Actions (`Edit`).
- **Create User Modal**:
  - Full Name (`<input required>`)
  - Email Address (`<input type="email" required>`)
  - Role (Select: `Requester`, `IT Staff`, `Administrator`)
  - Active Toggle Switch (default `true`)
  - Initial Password input with `Generate Safe Password` button that generates a compliant random string.
  - Helper note: *"User will be required to change password upon first login."*
  - Buttons: `Save User`, `Cancel`.
- **Edit User Modal**:
  - Full Name, Email, Role, Active Toggle.
  - `Deactivate User` action button (with red outline).
  - Safety Guards:
    - If user attempts to deactivate their own account: switch is disabled with tooltip: *"You cannot deactivate your own account."*
    - If user is the last active Administrator: Role dropdown and Active switch are disabled with warning alert: *"At least one active Administrator must exist."*
  - `Reset Initial Password` button: opens password sub-form to set a new temporary password forcing first-login change.

---

## 3. Responsive Breakpoints & Testing Viewports

- **Desktop (1280px × 800px)**: Multi-column tables, side-by-side detail grids, full navigation bar.
- **Tablet (768px × 1024px)**: Compressed table columns, collapsible sidebar navigation if applicable, full-width modal dialogs.
- **Mobile (375px × 667px)**: Hamburger navigation menu, card-based ticket lists instead of multi-column tables, stacked form fields, touch-friendly 44px tap targets.

---

## 4. Accessibility & Feedback Checklist
- [ ] Color contrast ratios $\ge 4.5:1$ for all text against backgrounds.
- [ ] Visible focus rings (`outline: 2px solid #006B3C`) on keyboard tab navigation.
- [ ] `aria-label` and `role` attributes on buttons, toggles, badges, and modal dialogs.
- [ ] Screen reader friendly alerts (`aria-live="polite"`) for form validation and success toasts.
