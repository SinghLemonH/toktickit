import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT_DIR = process.cwd();
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "docs", "lab-03", "screenshots");

function getBase64Image(filename) {
  const fullPath = path.join(SCREENSHOTS_DIR, filename);
  if (!fs.existsSync(fullPath)) return "";
  const ext = path.extname(fullPath).replace(".", "");
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(fullPath).toString("base64");
  return `data:${mime};base64,${data}`;
}

const images = {
  gitGraph: getBase64Image("git-graph.png"),
  kanbanBoard: getBase64Image("kanban-board-done.png"),
  gitignore: getBase64Image("gitignore-evidence.png"),
  consoleServer: getBase64Image("03-console-server-tests.png"),
  consoleClient: getBase64Image("03-console-client-tests.png"),
  consolePlaywright: getBase64Image("03-console-playwright-tests.png"),
  loginScreen: getBase64Image("01-login-screen.png"),
  loginInvalid: getBase64Image("01-login-invalid-credentials.png"),
  loginInactive: getBase64Image("01-login-inactive-account.png"),
  adminShell: getBase64Image("01-admin-app-shell.png"),
  afterLogout: getBase64Image("01-after-logout.png"),
  passwordQuarantine: getBase64Image("02-mandatory-password-change-quarantine.png"),
  passwordSatisfied: getBase64Image("02-password-requirements-satisfied.png"),
  passwordSuccess: getBase64Image("02-password-change-success.png"),
  queuePage: getBase64Image("03-staff-queue-page.png"),
  queueSearch: getBase64Image("03-staff-queue-search-filter.png"),
  queueEmpty: getBase64Image("03-staff-queue-empty.png"),
  queueSortPagination: getBase64Image("03-staff-queue-sort-pagination.png"),
  ticketClaimed: getBase64Image("03-staff-ticket-claimed.png"),
  priorityUpdated: getBase64Image("03-staff-priority-updated.png"),
  statusModal: getBase64Image("03-status-change-modal.png"),
  statusSuccess: getBase64Image("03-status-changed-success.png"),
  publicComment: getBase64Image("03-public-comment-posted.png"),
  internalNote: getBase64Image("03-internal-note-added.png"),
  ticketDetailResolutionAtt: getBase64Image("03-staff-ticket-detail-resolution-attachment.png"),
  adminUsersTable: getBase64Image("04-admin-users-table.png"),
  adminSearchUsers: getBase64Image("04-admin-search-users.png"),
  adminCreateModal: getBase64Image("04-admin-create-user-modal.png"),
  adminCreateSuccess: getBase64Image("04-admin-user-created-success.png"),
  adminDuplicateEmail: getBase64Image("04-admin-duplicate-email-error.png"),
  adminSelfGuard: getBase64Image("04-admin-self-deactivation-guard.png"),
  adminResetModal: getBase64Image("04-admin-reset-password-modal.png"),
  adminResetSuccess: getBase64Image("04-admin-password-reset-success.png"),
  adminForbiddenAccess: getBase64Image("04-admin-forbidden-access.png"),
  respLoginDesktop: getBase64Image("responsive-login-desktop.png"),
  respLoginTablet: getBase64Image("responsive-login-tablet.png"),
  respLoginMobile: getBase64Image("responsive-login-mobile.png"),
  respQueueDesktop: getBase64Image("responsive-queue-desktop.png"),
  respQueueTablet: getBase64Image("responsive-queue-tablet.png"),
  respQueueMobile: getBase64Image("responsive-queue-mobile.png"),
  respDetailDesktop: getBase64Image("responsive-detail-desktop.png"),
  respDetailTablet: getBase64Image("responsive-detail-tablet.png"),
  respDetailMobile: getBase64Image("03-staff-ticket-detail-initial.png"),
  respAdminDesktop: getBase64Image("responsive-admin-desktop.png"),
  respAdminTablet: getBase64Image("responsive-admin-tablet.png"),
  respAdminMobile: getBase64Image("responsive-admin-mobile.png"),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CPE 334 Lab 3 Engineering Evidence Report - TokTickIT</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 15mm 16mm;
    }
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      color: #111111;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
      margin: 0;
      padding: 0;
    }
    .page-break {
      page-break-before: always;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
    header.report-header {
      border-bottom: 2px solid #111111;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .report-title {
      font-size: 16pt;
      font-weight: bold;
      color: #111111;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 3px 0;
      text-align: center;
    }
    .report-subtitle {
      font-size: 10.5pt;
      color: #333333;
      margin: 0 0 10px 0;
      text-align: center;
      font-style: italic;
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      border: 1px solid #999999;
      background: #fafafa;
      padding: 6px 12px;
      font-size: 8.5pt;
      line-height: 1.45;
    }
    .part-title {
      font-size: 12pt;
      font-weight: bold;
      color: #111111;
      margin: 16px 0 6px 0;
      border-bottom: 1.5px solid #333333;
      padding-bottom: 3px;
    }
    .part-subtitle {
      font-size: 10pt;
      font-weight: bold;
      color: #222222;
      margin: 10px 0 3px 0;
    }
    p, li {
      font-size: 9pt;
      margin: 3px 0;
      text-align: justify;
    }
    ul {
      margin: 3px 0 6px 18px;
      padding: 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 10px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
      border-top: 2px solid #111111;
      border-bottom: 2px solid #111111;
    }
    th, td {
      border-top: 1px solid #dddddd;
      border-bottom: 1px solid #dddddd;
      padding: 4px 6px;
      text-align: left;
      vertical-align: top;
    }
    th {
      border-bottom: 1.5px solid #111111;
      background: #f4f4f4;
      color: #111111;
      font-weight: bold;
    }
    .badge-pass {
      color: #006B3C;
      font-weight: bold;
    }
    pre, code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 8pt;
    }
    pre {
      background: #1e1e1e;
      color: #d4d4d4;
      border: 1px solid #444444;
      padding: 6px 8px;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 4px 0 6px 0;
    }
    .screenshot-card {
      border: 1px solid #cccccc;
      padding: 3px;
      background: #ffffff;
      margin: 6px auto;
      text-align: center;
      page-break-inside: avoid;
    }
    .screenshot-card img {
      max-width: 100%;
      max-height: 240px;
      height: auto;
      display: inline-block;
    }
    .screenshot-caption {
      font-size: 7.5pt;
      font-style: italic;
      color: #333333;
      margin-top: 3px;
      text-align: center;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      page-break-inside: avoid;
    }
    .grid-2 .screenshot-card img {
      max-height: 180px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 6px;
      page-break-inside: avoid;
    }
    .grid-3 .screenshot-card img {
      max-height: 165px;
    }
    a {
      color: #004d26;
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <!-- REPORT HEADER -->
  <header class="report-header">
    <div class="report-title">CPE 334 Lab 3 Engineering Evidence Report</div>
    <div class="report-subtitle">TokTickIT: Users, Roles, IT Staff Ticketing, and Admin Screens</div>
    <div class="meta-box">
      <div style="white-space: nowrap;">
        <strong>Student:</strong> Wichitchai Suwanno (67070503439) | GitHub: <code>SinghLemonH</code><br>
        <strong>Partner / Reviewer:</strong> Wathit Tritsananawakit (67070403495) | GitHub: <code>WATHITx</code>
      </div>
      <div style="text-align: right; white-space: nowrap;">
        <strong>Repository:</strong> SinghLemonH/toktickit<br>
        <strong>Main Branch Target:</strong> main (via lab3-staging)
      </div>
    </div>
  </header>

  <!-- ANSWER PART 1 -->
  <section>
    <div class="part-title">1. Answer Part 1: Git Use with Engineering Workflow</div>
    <p><strong>1.1 Repository and Workflow URLs:</strong></p>
    <ul>
      <li><strong>GitHub Repository:</strong> <a href="https://github.com/SinghLemonH/toktickit">https://github.com/SinghLemonH/toktickit</a></li>
      <li><strong>GitHub Project Kanban Board:</strong> <a href="https://github.com/users/SinghLemonH/projects/2/views/1">https://github.com/users/SinghLemonH/projects/2/views/1</a></li>
      <li><strong>Sprint 3 Issues:</strong> #29 (Contract), #30 (DB Evolution), #31 (Auth Engine), #32 (Requester & Comments), #33 (Staff Queue & Ops), #34 (Admin Users), #35 (E2E Release)</li>
      <li><strong>Sprint 3 Pull Requests:</strong> PR #37 (Issue #29), PR #38 (Issue #30), PR #39 (Issue #31), PR #40 (Issue #32), PR #41 (Issue #33), PR #42 (Issue #34), PR #43 (Issue #35), Release PR #45 (staging to main)</li>
    </ul>

    <div class="part-subtitle">1.2 GitHub Project Kanban Board (All Issues in Done)</div>
    <p>The screenshot below demonstrates the live GitHub Project board where all 7 Sprint 3 issues have transitioned to the <strong>Done</strong> column following peer review and QA verification:</p>
    <div class="screenshot-card" style="max-width: 95%;">
      <img src="${images.kanbanBoard}" alt="GitHub Project Kanban Board Done">
      <div class="screenshot-caption">Figure 1.1: GitHub Project Kanban Board with all Sprint 3 issues in Done state.</div>
    </div>

    <div class="part-subtitle">1.3 Git Commit History Graph on Main Branch</div>
    <p>The Git graph below confirms that each feature was built on an isolated branch, merged into <code>lab3-staging</code> via pull request with peer review, and finally released to <code>main</code> in PR #45:</p>
    <div class="screenshot-card" style="max-width: 88%;">
      <img src="${images.gitGraph}" alt="Git Graph Main Branch" style="max-height: 250px;">
      <div class="screenshot-caption">Figure 1.2: Git commit history graph demonstrating feature branch isolation, staging integration, and main release.</div>
    </div>
  </section>

  <!-- ANSWER PART 1 CONTINUED (Page 2) -->
  <section class="page-break">
    <div class="part-subtitle">1.4 Peer Review Record (Rendered docs/lab-03/reviewer.md)</div>
    <table>
      <thead>
        <tr>
          <th>PR</th>
          <th>Issue</th>
          <th>Reviewer</th>
          <th>Merge Commit</th>
          <th>Reviewer Feedback Summary</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>PR #37</strong></td>
          <td>#29 (Contract & Guide)</td>
          <td>@WATHITx</td>
          <td><code>96894da</code></td>
          <td>Approved: Comprehensive specification contracts and invariants established upfront.</td>
        </tr>
        <tr>
          <td><strong>PR #38</strong></td>
          <td>#30 (DB Evolution & Seed)</td>
          <td>@WATHITx</td>
          <td><code>4a638b9</code></td>
          <td>Approved: Expand-and-contract schema evolution preserves Lab 2 backward compatibility.</td>
        </tr>
        <tr>
          <td><strong>PR #39</strong></td>
          <td>#31 (Auth & Pass Change)</td>
          <td>@WATHITx</td>
          <td><code>ba7f526</code></td>
          <td>Approved: Cookie session security and mandatory password change quarantine verified.</td>
        </tr>
        <tr>
          <td><strong>PR #40</strong></td>
          <td>#32 (Requester Comments)</td>
          <td>@WATHITx</td>
          <td><code>314cb8f</code></td>
          <td>Approved: Public comments and Problem Appears Resolved flag implemented cleanly.</td>
        </tr>
        <tr>
          <td><strong>PR #41</strong></td>
          <td>#33 (Staff Operations)</td>
          <td>@WATHITx</td>
          <td><code>0f5145d</code></td>
          <td>Approved: Ticket queue, BR-15 status transitions, and confidential internal notes verified.</td>
        </tr>
        <tr>
          <td><strong>PR #42</strong></td>
          <td>#34 (User Management)</td>
          <td>@WATHITx</td>
          <td><code>b91c91e</code></td>
          <td>Approved: Administrator safety guards (BR-16 self-deactivation, BR-17 last admin) solid.</td>
        </tr>
        <tr>
          <td><strong>PR #43</strong></td>
          <td>#35 (E2E & Release QA)</td>
          <td>@WATHITx</td>
          <td><code>be577ae</code></td>
          <td>Approved: 165/165 tests passing, responsive testing on all viewports verified.</td>
        </tr>
        <tr>
          <td><strong>PR #45</strong></td>
          <td>Release QA (staging to main)</td>
          <td>Self / Partner</td>
          <td><code>2620972</code></td>
          <td>Final QA release merged into main with clean test baseline.</td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">1.5 Repository Directory Structure & .gitignore Verification</div>
    <p>Directory tree strictly adheres to bounded architectural layers across <code>docs/lab-03/</code>, <code>server/</code>, <code>client/</code>, and <code>e2e/lab-03/</code>. Due to deep dependency hierarchies (<code>node_modules</code>) and build targets, the active repository structure is curated below (depth 2-3) alongside verified <code>.gitignore</code> rules:</p>
    <div class="grid-2" style="margin-top: 6px;">
      <div>
        <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 8pt;">Architectural Directory Tree (Depth 2-3):</p>
        <pre style="margin: 0; font-size: 7.2pt; line-height: 1.35; max-height: 230px; overflow: hidden; background: #fafafa; color: #111; border: 1px solid #bbb; padding: 5px 6px;">toktickit/
├── client/                 (React + Vite + Zen Green)
│   ├── src/
│   │   ├── components/     (AppShell, RouteGuard)
│   │   ├── context/        (Auth, Requester)
│   │   ├── pages/          (Login, Queue, Detail, Admin)
│   │   └── AppRouter.tsx   (Guarded RBAC routes)
│   └── tests/lab-03/       (Component unit tests)
├── server/                 (Express + TypeScript + Prisma)
│   ├── prisma/             (Schema evolution &amp; seed)
│   ├── src/
│   │   ├── auth/           (Cookie session engine)
│   │   ├── middleware/     (Auth &amp; RBAC quarantine)
│   │   └── routes/         (Auth, tickets, notes, admin)
│   ├── tests/lab-03/       (API integration &amp; RBAC)
│   └── uploads/            (Attachment storage)
├── docs/lab-03/            (Specifications, tests, logs)
│   └── screenshots/        (Visual evidence artifacts)
├── e2e/lab-03/             (Playwright E2E suites)
└── .gitignore              (Secret &amp; database isolation)</pre>
        <div class="screenshot-caption" style="margin-top: 2px;">Figure 1.3a: Repository architectural tree (dependencies excluded).</div>
      </div>
      <div>
        <p style="margin: 0 0 3px 0; font-weight: bold; font-size: 8pt;">.gitignore Rules Configuration:</p>
        <div class="screenshot-card" style="margin: 0; background: #1e1e1e; border: 1px solid #777;">
          <img src="${images.gitignore}" alt="Rendered .gitignore" style="max-height: 200px; width: 100%; object-fit: contain;">
        </div>
        <div class="screenshot-caption" style="margin-top: 2px;">Figure 1.3b: Active .gitignore rules isolating dependencies, env secrets, and DBs.</div>
      </div>
    </div>
  </section>

  <!-- ANSWER PART 2 -->
  <section class="page-break">
    <div class="part-title">2. Answer Part 2: Spec DD (Specification-Driven Development)</div>
    <p><strong>Specification Contract Files:</strong> <a href="file:///docs/lab-03/specification.md">docs/lab-03/specification.md</a>, <a href="file:///docs/lab-03/api-spec.md">docs/lab-03/api-spec.md</a>, and <a href="file:///docs/lab-03/ui-spec.md">docs/lab-03/ui-spec.md</a>. All specifications were merged and approved in PR #37 prior to implementation PRs.</p>

    <div class="part-subtitle">2.1 Numbered Functional Requirements (FR-01 to FR-20 Summary)</div>
    <table>
      <thead>
        <tr>
          <th>FR ID</th>
          <th>Module</th>
          <th>Requirement Summary</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>FR-01 to FR-06</strong></td>
          <td>Authentication & Session</td>
          <td>Email/password auth with bcrypt, HTTP-only signed cookie (<code>toktickit_session</code>), mandatory first-login password quarantine, /api/auth/me session check, and session termination via /api/auth/logout.</td>
        </tr>
        <tr>
          <td><strong>FR-07 to FR-10</strong></td>
          <td>Requester & Legacy Continuity</td>
          <td>Identity derived strictly from session (DevRequester retired), ticket creation and ticket viewing bound to authenticated requester, public comments, and Problem Appears Resolved indicator.</td>
        </tr>
        <tr>
          <td><strong>FR-11 to FR-15</strong></td>
          <td>IT Staff Operations</td>
          <td>Staff Ticket Queue with debounced text search, multi-filter dropdowns, sorting, and pagination. Claim ticket ownership, reassign staff, update IT Priority, and execute BR-15 permitted status transitions.</td>
        </tr>
        <tr>
          <td><strong>FR-16 to FR-20</strong></td>
          <td>Admin User Management</td>
          <td>User directory table with search and role filter, account creation with compliant initial password generator, edit account details, reset initial password, and enforce invariant safety guards (BR-16, BR-17).</td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">2.2 Role-Based Authorization Matrix (RBAC)</div>
    <table>
      <thead>
        <tr>
          <th>Screen / Capability</th>
          <th>Requester</th>
          <th>IT Staff</th>
          <th>Administrator</th>
          <th>Enforcement Mechanism</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Login / Logout / Change Password</td>
          <td>Allowed</td>
          <td>Allowed</td>
          <td>Allowed</td>
          <td><code>authenticateSession</code> middleware</td>
        </tr>
        <tr>
          <td>View Owned Tickets (<code>/tickets</code>)</td>
          <td>Allowed (Own)</td>
          <td>Allowed (Own)</td>
          <td>Allowed (Own)</td>
          <td>Filtered to <code>req.user.id</code></td>
        </tr>
        <tr>
          <td>Staff Ticket Queue (<code>/staff/queue</code>)</td>
          <td>Forbidden (403)</td>
          <td>Allowed</td>
          <td>Allowed</td>
          <td><code>requireRole(["IT_STAFF", "ADMINISTRATOR"])</code></td>
        </tr>
        <tr>
          <td>Claim / Reassign Ticket</td>
          <td>Forbidden (403)</td>
          <td>Allowed</td>
          <td>Allowed</td>
          <td><code>requireRole(["IT_STAFF", "ADMINISTRATOR"])</code></td>
        </tr>
        <tr>
          <td>Set IT Priority & Change Status</td>
          <td>Forbidden (403)</td>
          <td>Allowed</td>
          <td>Allowed</td>
          <td>BR-15 Permitted State Machine Validation</td>
        </tr>
        <tr>
          <td>Public Comments Stream</td>
          <td>Allowed (Own)</td>
          <td>Allowed (All)</td>
          <td>Allowed (All)</td>
          <td>Shared ticket communication</td>
        </tr>
        <tr>
          <td>Confidential Internal Notes</td>
          <td>Forbidden (403)</td>
          <td>Allowed</td>
          <td>Allowed</td>
          <td>Dual-channel confidentiality guard (BR-06)</td>
        </tr>
        <tr>
          <td>User Management (<code>/admin/users</code>)</td>
          <td>Forbidden (403)</td>
          <td>Forbidden (403)</td>
          <td>Allowed</td>
          <td><code>requireRole(["ADMINISTRATOR"])</code></td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">2.3 Database Migration Strategy & Product Definition of Done (DoD)</div>
    <p><strong>Migration Decisions:</strong> Adopted the Expand-and-Contract migration pattern. DevRequester records were preserved during transition and migrated directly into the unified <code>User</code> model with bcrypt hashes. <code>Ticket.requesterId</code> foreign keys were rebound to <code>User.id</code> without data loss. Legacy <code>PENDING</code> ticket status was preserved in schema while operational transitions strictly follow BR-14.</p>
    <p><strong>Product Definition of Done:</strong> (1) All 20 ACs pass in automated tests; (2) Zero DevRequester remnants in production client; (3) Clean Prisma migrations and idempotent seed; (4) 100% automated test suites passing; (5) Zero layout overflow on mobile (375px), tablet (768px), and desktop (1280px); (6) Documentation 100% written in English with zero em dashes.</p>
  </section>

  <!-- ANSWER PART 3 -->
  <section class="page-break">
    <div class="part-title">3. Answer Part 3: Test DD and Traceability</div>
    <p><strong>Traceability Reference:</strong> Documented in <code>docs/lab-03/tests.md</code>. 100% of Acceptance Criteria map directly to automated tests across API, Component, and E2E layers.</p>

    <div class="part-subtitle">3.1 Planned-Test Traceability Matrix (Excerpt)</div>
    <table>
      <thead>
        <tr>
          <th>Test ID</th>
          <th>Layer</th>
          <th>AC</th>
          <th>Target Behavior</th>
          <th>Automated Test File</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>API-01</strong></td>
          <td>API</td>
          <td>AC-01</td>
          <td>Valid credentials issue HTTP-only session cookie</td>
          <td><code>server/tests/lab-03/auth.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>API-04</strong></td>
          <td>API</td>
          <td>AC-04</td>
          <td>Quarantine access when mustChangePassword is true</td>
          <td><code>server/tests/lab-03/auth.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>API-10</strong></td>
          <td>API</td>
          <td>AC-10</td>
          <td>Requester forbidden from Internal Notes (403)</td>
          <td><code>server/tests/lab-03/comments-notes.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>API-11</strong></td>
          <td>API</td>
          <td>AC-11</td>
          <td>Staff Queue search, filter, and pagination</td>
          <td><code>server/tests/lab-03/staff-queue.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>API-14</strong></td>
          <td>API</td>
          <td>AC-14</td>
          <td>BR-15 Permitted status transitions validation</td>
          <td><code>server/tests/lab-03/staff-ticket-detail.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>API-18</strong></td>
          <td>API</td>
          <td>AC-18</td>
          <td>Admin self-deactivation rejected with 400</td>
          <td><code>server/tests/lab-03/users-admin.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>API-19</strong></td>
          <td>API</td>
          <td>AC-19</td>
          <td>Last active admin removal rejected with 409</td>
          <td><code>server/tests/lab-03/users-admin.api.test.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>UI-01</strong></td>
          <td>Component</td>
          <td>AC-01</td>
          <td>Login form validation and safe error feedback</td>
          <td><code>client/tests/lab-03/Login.test.tsx</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>UI-02</strong></td>
          <td>Component</td>
          <td>AC-04</td>
          <td>Password complexity real-time checklist</td>
          <td><code>client/tests/lab-03/ChangePassword.test.tsx</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>UI-03</strong></td>
          <td>Component</td>
          <td>AC-11</td>
          <td>Staff Queue table, debouncing, and badges</td>
          <td><code>client/tests/lab-03/StaffTicketQueue.test.tsx</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>UI-04</strong></td>
          <td>Component</td>
          <td>AC-12</td>
          <td>Staff Ticket Detail operational controls & tabs</td>
          <td><code>client/tests/lab-03/StaffTicketDetail.test.tsx</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>UI-05</strong></td>
          <td>Component</td>
          <td>AC-18</td>
          <td>Admin User Management safety guards</td>
          <td><code>client/tests/lab-03/UserManagement.test.tsx</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>E2E-01</strong></td>
          <td>E2E</td>
          <td>AC-01</td>
          <td>End-to-end login, app shell navigation, logout</td>
          <td><code>e2e/lab-03/authentication.spec.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>E2E-02</strong></td>
          <td>E2E</td>
          <td>AC-04</td>
          <td>Mandatory password change first-login flow</td>
          <td><code>e2e/lab-03/authentication.spec.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>E2E-03</strong></td>
          <td>E2E</td>
          <td>AC-12</td>
          <td>Complete Staff ticket handling lifecycle</td>
          <td><code>e2e/lab-03/staff-ticket-flow.spec.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
        <tr>
          <td><strong>E2E-04</strong></td>
          <td>E2E</td>
          <td>AC-16</td>
          <td>Admin user management & safety guards</td>
          <td><code>e2e/lab-03/user-administration.spec.ts</code></td>
          <td><span class="badge-pass">Passed</span></td>
        </tr>
      </tbody>
    </table>
  </section>

  <!-- ANSWER PART 3.2 (Console Test Evidence) -->
  <section class="page-break avoid-break">
    <div class="part-subtitle">3.2 Passing Automated Test Execution Output from Main (165/165 Passed)</div>
    <p>The following terminal console screenshots demonstrate 100% passing automated tests (165/165 total) on the <code>main</code> branch, covering the Express backend API, React client components, and Playwright end-to-end integration flows:</p>

    <div style="margin-top: 6px;">
      <p style="margin: 3px 0 1px 0; font-weight: bold; font-size: 8pt;">Backend API & Unit Test Suites (server/ - 14 test files, 111 passed):</p>
      <div class="screenshot-card" style="margin: 2px 0 5px 0; background: #000; border: 1px solid #777;">
        <img src="${images.consoleServer}" alt="Backend Tests Console Output" style="max-height: 185px; width: 100%; object-fit: contain;">
        <div class="screenshot-caption" style="color: #666;">Figure 3.1a: Vitest backend test execution output (111/111 passed).</div>
      </div>

      <p style="margin: 4px 0 1px 0; font-weight: bold; font-size: 8pt;">Frontend Component Test Suites (client/ - 14 test files, 47 passed):</p>
      <div class="screenshot-card" style="margin: 2px 0 5px 0; background: #000; border: 1px solid #777;">
        <img src="${images.consoleClient}" alt="Frontend Tests Console Output" style="max-height: 185px; width: 100%; object-fit: contain;">
        <div class="screenshot-caption" style="color: #666;">Figure 3.1b: Vitest React Testing Library component test output (47/47 passed).</div>
      </div>

      <p style="margin: 4px 0 1px 0; font-weight: bold; font-size: 8pt;">Playwright End-to-End Integration Suites (root - 7 test flows, 7 passed):</p>
      <div class="screenshot-card" style="margin: 2px 0 5px 0; background: #000; border: 1px solid #777;">
        <img src="${images.consolePlaywright}" alt="Playwright E2E Tests Console Output" style="max-height: 185px; width: 100%; object-fit: contain;">
        <div class="screenshot-caption" style="color: #666;">Figure 3.1c: Playwright end-to-end integration test output (7/7 passed).</div>
      </div>
    </div>
  </section>

  <!-- ANSWER PART 4 -->
  <section class="page-break avoid-break">
    <div class="part-title">4. Answer Part 4: AI Use with Reflection</div>
    <p><strong>AI Assistant Tooling:</strong> Google Antigravity Agent with Google Gemini. Full log in <code>docs/lab-03/ai-use.md</code>.</p>

    <div class="part-subtitle">4.1 Selected Key Prompts Table</div>
    <table>
      <thead>
        <tr>
          <th>Prompt Topic</th>
          <th>Actual Prompt / Context Framing</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Strategic Architecture & RBAC</strong></td>
          <td>"Act as a Principal Software Architect. Analyze trade-offs between HTTP-only secure cookie sessions versus Bearer JWT. Define strict server-side RBAC invariants for Express + TypeScript + Prisma + React."</td>
        </tr>
        <tr>
          <td><strong>Formal Contract Synthesis (Spec DD)</strong></td>
          <td>"Draft formal engineering specification for Sprint 3. Explicitly define: (1) Numbered Functional Requirements (FR-01+); (2) Invariant Business Rules (BR-01+) including admin safety guards; (3) Observable Acceptance Criteria (AC-01+)."</td>
        </tr>
        <tr>
          <td><strong>Defensive REST API Contract</strong></td>
          <td>"Design complete REST API contract under /api. Ensure uniform JSON error responses. Ensure Requester attempts to access Internal Notes return 403 Forbidden."</td>
        </tr>
        <tr>
          <td><strong>DB Evolution & Seed (Issue #30)</strong></td>
          <td>"Execute database evolution using Expand-Contract pattern: retain DevRequester during transition, migrate existing data to User with bcrypt hashes, update Ticket relations, and build idempotent seed script."</td>
        </tr>
        <tr>
          <td><strong>Auth Engine & Quarantine (Issue #31)</strong></td>
          <td>"Construct authentication engine using signed cookies (toktickit_session). Build middleware detecting mustChangePassword: true and quarantining users to Change Password screen with live complexity checklist."</td>
        </tr>
        <tr>
          <td><strong>Comments Stream & Isolation (Issue #32)</strong></td>
          <td>"Retire legacy /select-requester. Implement Public Comments stream and Problem Appears Resolved flag workflow without prematurely mutating ticket status to RESOLVED."</td>
        </tr>
        <tr>
          <td><strong>Staff Queue & Operations (Issue #33)</strong></td>
          <td>"Build Staff Ticket Queue with multi-filter search, sorting, and pagination. Implement ticket claim/reassign, independent IT Priority, BR-15 permitted status transitions, and amber confidential internal notes."</td>
        </tr>
        <tr>
          <td><strong>Admin User Management (Issue #34)</strong></td>
          <td>"Build User Management (/admin/users). Enforce safety invariants: mandatory initial password with safe generator, prevention of self-deactivation (BR-16), and prevention of deactivating the last active admin (BR-17)."</td>
        </tr>
        <tr>
          <td><strong>E2E Integration & QA (Issue #35)</strong></td>
          <td>"Implement Playwright E2E suites covering E2E-01 to E2E-04. Capture responsive screenshot evidence across Desktop (1280x800), Tablet (768x1024), and Mobile (375x667)."</td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">4.2 My Reflection on AI Use</div>
    <p>Using an AI pair programmer with Spec-Driven Development (Spec DD) and Test-Driven Development (TDD) elevated velocity while enforcing architectural rigor. Dividing the AI into two roles: The Specification Agent for upfront RFC-style contract drafting and threat modeling, and The Coding Agent for test-backed implementation: prevented hallucination and scope creep. Human architectural oversight was vital in enforcing security invariants: ensuring server-side RBAC validation cannot be bypassed by client-side UI inspection, preserving administrative accounts against self-lockout, and executing zero-downtime database migrations without breaking legacy sprint test suites.</p>
  </section>

  <!-- ANSWER PART 5 -->
  <section class="page-break avoid-break">
    <div class="part-title">5. Answer Part 5: Working Login and Password Change UI</div>
    
    <div class="part-subtitle">5.1 Authentication Feedback (Valid, Invalid, and Inactive Account Block)</div>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.loginScreen}" alt="Login Screen">
        <div class="screenshot-caption">Figure 5.1a: Zen Green Login Screen (/login).</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.loginInvalid}" alt="Invalid Credentials">
        <div class="screenshot-caption">Figure 5.1b: Invalid credentials generic error.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.loginInactive}" alt="Inactive Account Response">
        <div class="screenshot-caption">Figure 5.1c: Inactive account blocked with generic error (BR-02).</div>
      </div>
    </div>

    <div class="part-subtitle">5.2 Mandatory First-Login Password Quarantine & Complexity Checklist</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.passwordQuarantine}" alt="Quarantine Screen">
        <div class="screenshot-caption">Figure 5.2a: Quarantine screen on first sign-in (Submit disabled).</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.passwordSatisfied}" alt="Checklist Satisfied">
        <div class="screenshot-caption">Figure 5.2b: Live complexity checklist turns green upon valid input.</div>
      </div>
    </div>

    <div class="part-subtitle">5.3 App Shell with Role Badges & Direct Access Blocked after Logout</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.adminShell}" alt="App Shell Role Badge">
        <div class="screenshot-caption">Figure 5.3a: Authenticated app shell showing role badges (Admin).</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.afterLogout}" alt="Blocked after Logout">
        <div class="screenshot-caption">Figure 5.3b: Cookie destroyed; redirected to login; direct access blocked.</div>
      </div>
    </div>
  </section>

  <!-- ANSWER PART 6 -->
  <section class="page-break avoid-break">
    <div class="part-title">6. Answer Part 6: Working IT Staff Ticket Queue UI</div>
    
    <div class="part-subtitle">6.1 Realistic Queue Data, Search, Multi-Filter, Sorting & Pagination</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.queuePage}" alt="Queue Table">
        <div class="screenshot-caption">Figure 6.1a: IT Staff Queue showing columns, priority badges, status pills, and owner assignments.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.queueSearch}" alt="Queue Search">
        <div class="screenshot-caption">Figure 6.1b: Real-time debounced search by summary keyword and multi-parameter dropdown filtering.</div>
      </div>
    </div>

    <div class="part-subtitle">6.2 Column Sorting, Pagination State & Empty Filter Feedback</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.queueSortPagination}" alt="Column Sorting & Pagination">
        <div class="screenshot-caption">Figure 6.2a: Active column sorting with indicator and operational pagination controls.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.queueEmpty}" alt="Empty Queue State">
        <div class="screenshot-caption">Figure 6.2b: Clean empty/no-results feedback when no tickets match active filter criteria.</div>
      </div>
    </div>
  </section>

  <!-- ANSWER PART 7 -->
  <section class="page-break avoid-break">
    <div class="part-title">7. Answer Part 7: Working IT Staff Ticket Detail UI</div>
    
    <div class="part-subtitle">7.1 Operational Controls: Claim/Reassign, IT Priority & Permitted Status Transitions</div>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.ticketClaimed}" alt="Ticket Claimed">
        <div class="screenshot-caption">Figure 7.1a: Ticket claimed by staff.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.priorityUpdated}" alt="IT Priority Updated">
        <div class="screenshot-caption">Figure 7.1b: IT Priority updated independently.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.statusModal}" alt="Status Change Modal">
        <div class="screenshot-caption">Figure 7.1c: BR-15 Status change modal.</div>
      </div>
    </div>

    <div class="part-subtitle">7.2 Dual-Channel Communication: Public Comments vs Confidential Internal Notes</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.publicComment}" alt="Public Comments">
        <div class="screenshot-caption">Figure 7.2a: Public comments stream visible to Requesters and Staff.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.internalNote}" alt="Confidential Internal Notes">
        <div class="screenshot-caption">Figure 7.2b: Amber-styled confidential Internal Notes (strictly staff-only).</div>
      </div>
  </section>

  <!-- ANSWER PART 7 CONTINUED (Page 10) -->
  <section class="page-break avoid-break">
    <div class="part-subtitle">7.3 Attachment Continuity & Requester Resolution Indication</div>
    <div class="screenshot-card" style="max-width: 80%;">
      <img src="${images.ticketDetailResolutionAtt}" alt="Resolution Indication & Attachments">
      <div class="screenshot-caption">Figure 7.3: Blue banner indicating Requester problem resolution alongside preserved Lab 2 attachments section.</div>
    </div>

    <div class="part-subtitle">7.4 Direct API Authorization Evidence (Server-Side RBAC Verification)</div>
    <p>The following real API execution traces prove that RBAC is enforced strictly at the Express middleware layer, rejecting unauthorized direct API calls even when requested with valid user session tokens:</p>
    <pre>
# Test 1: Requester attempting to write confidential Internal Note (AC-10 / BR-06)
$ curl -i -X POST http://localhost:3000/api/staff/tickets/1/notes \
  -H "Cookie: toktickit_session=&lt;VALID_REQUESTER_TOKEN&gt;" \
  -H "Content-Type: application/json" \
  -d '{"content": "Unauthorized attempt to create internal note"}'

HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
{"error": "Access forbidden: Insufficient permissions"}

# Test 2: IT Staff attempting to access Administrator User Management (AC-20 / BR-05)
$ curl -i -X GET http://localhost:3000/api/admin/users \
  -H "Cookie: toktickit_session=&lt;VALID_IT_STAFF_TOKEN&gt;"

HTTP/1.1 403 Forbidden
Content-Type: application/json; charset=utf-8
{"error": "Access forbidden: Insufficient permissions"}

# Test 3: Unauthenticated user attempting to query Staff Queue (BR-01)
$ curl -i -X GET http://localhost:3000/api/staff/tickets

HTTP/1.1 401 Unauthorized
Content-Type: application/json; charset=utf-8
{"error": "Authentication required"}
    </pre>
  </section>

  <!-- ANSWER PART 8 -->
  <section class="page-break avoid-break">
    <div class="part-title">8. Answer Part 8: Working Administrator User Management UI</div>
    
    <div class="part-subtitle">8.1 User Directory, Search, Role Badges & Status Pills</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.adminUsersTable}" alt="Users Directory">
        <div class="screenshot-caption">Figure 8.1a: Minimalist Administrator User Management (/admin/users) with role badges and active status pills.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.adminSearchUsers}" alt="Search Users">
        <div class="screenshot-caption">Figure 8.1b: Real-time search by user name or email address.</div>
      </div>
    </div>

    <div class="part-subtitle">8.2 Account Provisioning, Initial Password Reset & Duplicate Email Conflict Error</div>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.adminCreateModal}" alt="Create User Modal">
        <div class="screenshot-caption">Figure 8.2a: Create User modal with Generate Safe Password button.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.adminDuplicateEmail}" alt="Duplicate Email Error">
        <div class="screenshot-caption">Figure 8.2b: Duplicate email conflict error banner (AC-17).</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.adminResetModal}" alt="Reset Password Modal">
        <div class="screenshot-caption">Figure 8.2c: Administrative password reset dialog.</div>
      </div>
    </div>

    <div class="part-subtitle">8.3 Invariant Safety Guards & Non-Admin Forbidden Access</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.adminSelfGuard}" alt="Self-Deactivation Guard">
        <div class="screenshot-caption">Figure 8.3a: Self-deactivation prevention guard (BR-16) and last admin guard (BR-17).</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.adminForbiddenAccess}" alt="Non-Admin Forbidden Access">
        <div class="screenshot-caption">Figure 8.3b: Non-admin IT Staff blocked from accessing /admin/users and redirected away.</div>
      </div>
    </div>
  </section>

  <!-- ANSWER PART 9 -->
  <section class="page-break">
    <div class="part-title">9. Answer Part 9: Zen Green UI and Responsive Evidence</div>
    
    <div class="part-subtitle">9.1 Rendered UI Specification Summary (docs/lab-03/ui-spec.md)</div>
    <table>
      <thead>
        <tr>
          <th>Design Token / Parameter</th>
          <th>Specification Standard</th>
          <th>Implementation Evidence</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Color Hierarchy (Zen Green)</strong></td>
          <td>Primary: #006B3C, Hover: #00522E, Surface: #E8F5E9, Amber: #D97706</td>
          <td>Verified in CSS variable overrides (<code>theme.css</code>). Contrast >= 4.5:1 on all text elements.</td>
        </tr>
        <tr>
          <td><strong>Typography System</strong></td>
          <td>System Sans-Serif font stack (-apple-system, BlinkMacSystemFont, Segoe UI)</td>
          <td>Clear font size hierarchy: h1 (24px), h2 (20px), body (14px), small (12px).</td>
        </tr>
        <tr>
          <td><strong>Responsive Breakpoints</strong></td>
          <td>Desktop (1280px), Tablet (768px), Mobile (375px)</td>
          <td>Full fluid grid with no unwanted horizontal scroll at 375px mobile viewport.</td>
        </tr>
        <tr>
          <td><strong>Component States</strong></td>
          <td>Busy spinners on all buttons, disabled states during API calls, safe error alerts</td>
          <td>Verified across all forms (Login, Password Change, Status Modal, User Management).</td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">9.2 Responsive Layout Evidence across 3 Viewports</div>
    <p><strong>Login Screen:</strong></p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.respLoginDesktop}" alt="Login Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respLoginTablet}" alt="Login Tablet">
        <div class="screenshot-caption">Tablet (768px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respLoginMobile}" alt="Login Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>

    <p><strong>Staff Ticket Queue Screen:</strong></p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.respQueueDesktop}" alt="Queue Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respQueueTablet}" alt="Queue Tablet">
        <div class="screenshot-caption">Tablet (768px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respQueueMobile}" alt="Queue Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>
  </section>

  <!-- ANSWER PART 9 CONTINUED (Page 10) -->
  <section class="page-break">
    <p><strong>Staff Ticket Detail Screen:</strong></p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.respDetailDesktop}" alt="Detail Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respDetailTablet}" alt="Detail Tablet">
        <div class="screenshot-caption">Tablet (768px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respDetailMobile}" alt="Detail Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>

    <p><strong>Administrator User Management Screen:</strong></p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.respAdminDesktop}" alt="Admin Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respAdminTablet}" alt="Admin Tablet">
        <div class="screenshot-caption">Tablet (768px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.respAdminMobile}" alt="Admin Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>

    <div class="part-subtitle">9.3 Completed Visual Checklist</div>
    <table>
      <thead>
        <tr>
          <th>Design Requirement</th>
          <th>Implementation Evidence</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Zen Green Color Palette</strong></td>
          <td>App header, primary buttons, and badges use #006B3C, #00522E, and #E8F5E9.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td><strong>Editable vs Read-only Inputs</strong></td>
          <td>Requester detail is strictly read-only; staff operational controls clearly grouped.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td><strong>Button Hierarchy & Busy State</strong></td>
          <td>Primary Zen Green buttons show spinners and disable during API in-flight requests.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td><strong>No Horizontal Overflow</strong></td>
          <td>All screens verified at 375px mobile viewport without unwanted horizontal scroll.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td><strong>Accessibility & Status Badges</strong></td>
          <td>All status and priority badges include text labels and directional icons. Contrast &gt;= 4.5:1.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td><strong>Safety Guard Tooltips & Alerts</strong></td>
          <td>Admin self-deactivation and last admin removal blocked with explicit explanation banners.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
      </tbody>
    </table>
  </section>

</body>
</html>
`;

async function main() {
  const htmlPath = path.join(ROOT_DIR, "Lab3_Submission_Report.html");
  const pdfPath = path.join(ROOT_DIR, "Lab3_Submission_Report.pdf");

  fs.writeFileSync(htmlPath, htmlContent, "utf-8");
  console.log("Generated HTML at:", htmlPath);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `
      <div style="font-size: 8pt; font-family: 'Times New Roman', serif; color: #555555; width: 100%; padding: 0 16mm; display: flex; justify-content: space-between; border-top: 1px solid #cccccc; padding-top: 4px;">
        <span></span>
        <span>CPE 334 Lab 3 Engineering Evidence Report</span>
        <span>Page <span class="pageNumber"></span></span>
      </div>
    `,
    margin: {
      top: "14mm",
      bottom: "16mm",
      left: "16mm",
      right: "16mm",
    },
  });

  await browser.close();
  console.log("Successfully generated PDF report at:", pdfPath);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
