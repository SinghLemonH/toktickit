import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const ROOT_DIR = process.cwd();
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "artifacts", "lab-02", "screenshots");

function getBase64Image(relPath) {
  const fullPath = path.join(SCREENSHOTS_DIR, relPath);
  if (!fs.existsSync(fullPath)) return "";
  const ext = path.extname(fullPath).replace(".", "");
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(fullPath).toString("base64");
  return `data:${mime};base64,${data}`;
}

const images = {
  selectRequester: getBase64Image("select-requester.png"),
  createInitial: getBase64Image("create-ticket/initial.png"),
  createValidation: getBase64Image("create-ticket/validation-error.png"),
  createDesktop: getBase64Image("create-ticket/desktop.png"),
  createTablet: getBase64Image("create-ticket/tablet.png"),
  createMobile: getBase64Image("create-ticket/mobile.png"),
  createSuccess: getBase64Image("create-ticket/success.png"),
  myTicketsRequesterA: getBase64Image("my-tickets/requester-a.png"),
  myTicketsRequesterB: getBase64Image("my-tickets/requester-b.png"),
  myTicketsDesktop: getBase64Image("my-tickets/desktop.png"),
  myTicketsTablet: getBase64Image("my-tickets/tablet.png"),
  myTicketsMobile: getBase64Image("my-tickets/mobile.png"),
  ticketDetailActive: getBase64Image("ticket-detail/active.png"),
  ticketDetailSoftRemoved: getBase64Image("ticket-detail/soft-removed.png"),
  ticketDetailUnauthorized: getBase64Image("ticket-detail/unauthorized.png"),
  ticketDetailDesktop: getBase64Image("ticket-detail/desktop.png"),
  ticketDetailTablet: getBase64Image("ticket-detail/tablet.png"),
  ticketDetailMobile: getBase64Image("ticket-detail/mobile.png"),
};

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Lab 2 Submission Report — TokTickIT</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1a2e22;
      background: #ffffff;
      line-height: 1.45;
      font-size: 10.5pt;
      margin: 0;
      padding: 0;
    }
    .page-break {
      page-break-before: always;
      margin-top: 20px;
    }
    .avoid-break {
      page-break-inside: avoid;
    }
    header.report-header {
      border-bottom: 3px solid #006B3C;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .report-title {
      font-size: 18pt;
      font-weight: 800;
      color: #006B3C;
      margin: 0 0 4px 0;
    }
    .report-subtitle {
      font-size: 11pt;
      color: #495057;
      margin: 0 0 10px 0;
    }
    .meta-box {
      display: flex;
      justify-content: space-between;
      background: #F5F7F6;
      border: 1px solid #D0E6D8;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 9.5pt;
    }
    .part-title {
      font-size: 14pt;
      font-weight: 700;
      color: #006B3C;
      border-left: 5px solid #006B3C;
      padding-left: 10px;
      margin: 22px 0 12px 0;
      background: #EAF6EF;
      padding-top: 6px;
      padding-bottom: 6px;
    }
    .part-subtitle {
      font-size: 11pt;
      font-weight: 600;
      color: #0B7A46;
      margin: 14px 0 6px 0;
    }
    p, li {
      font-size: 10pt;
      margin: 4px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
    }
    th, td {
      border: 1px solid #cfd8dc;
      padding: 5px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #006B3C;
      color: #ffffff;
      font-weight: 600;
    }
    tr:nth-child(even) td {
      background: #f9fbf9;
    }
    .badge-pass {
      background: #EAF6EF;
      color: #006B3C;
      border: 1px solid #006B3C;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 8pt;
    }
    pre, code {
      font-family: Consolas, "Courier New", monospace;
      font-size: 8.5pt;
    }
    pre {
      background: #f4f6f5;
      border: 1px solid #dcdfdc;
      border-radius: 4px;
      padding: 8px 10px;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      margin: 8px 0;
    }
    .screenshot-card {
      border: 1px solid #d0e6d8;
      border-radius: 6px;
      padding: 8px;
      background: #ffffff;
      margin: 10px 0;
      page-break-inside: avoid;
    }
    .screenshot-card img {
      width: 100%;
      height: auto;
      border-radius: 4px;
      border: 1px solid #e0e0e0;
      display: block;
    }
    .screenshot-caption {
      font-size: 8.5pt;
      font-weight: 600;
      color: #2e7d32;
      margin-top: 5px;
      text-align: center;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      page-break-inside: avoid;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      page-break-inside: avoid;
    }
    .placeholder-box {
      border: 2px dashed #E65100;
      background: #FFF8E1;
      border-radius: 6px;
      padding: 14px;
      margin: 12px 0;
      page-break-inside: avoid;
    }
    .placeholder-title {
      font-weight: bold;
      color: #BF360C;
      font-size: 10pt;
      margin-bottom: 4px;
    }
    .placeholder-desc {
      font-size: 9pt;
      color: #5D4037;
    }
    .callout-info {
      background: #EAF6EF;
      border-left: 4px solid #006B3C;
      padding: 8px 12px;
      border-radius: 0 4px 4px 0;
      margin: 8px 0;
      font-size: 9pt;
    }
  </style>
</head>
<body>

  <header class="report-header">
    <h1 class="report-title">CPE 334 — Lab 2 Engineering Evidence Report</h1>
    <div class="report-subtitle">TokTickIT: Requester Ticketing MVP with UI Foundation & Zen Green Theme</div>
    <div class="meta-box">
      <div>
        <strong>Student:</strong> Wichitchai Suwanno (วิชญ์ชัย สุวรรโณ)<br>
        <strong>Student ID:</strong> 67070403439 &nbsp;|&nbsp; <strong>GitHub:</strong> <a href="https://github.com/SinghLemonH">SinghLemonH</a>
      </div>
      <div>
        <strong>Partner / Reviewer:</strong> Wathit Tritsananawakit (วาทิต ตริศนานวขิต)<br>
        <strong>Student ID:</strong> 67070503495 &nbsp;|&nbsp; <strong>GitHub:</strong> <a href="https://github.com/WATHITx">WATHITx</a>
      </div>
      <div>
        <strong>Repository:</strong> <a href="https://github.com/SinghLemonH/toktickit">SinghLemonH/toktickit</a><br>
        <strong>Main Branch Target:</strong> <code>main</code> (merged via <code>lab2-staging</code>)
      </div>
    </div>
  </header>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 1 -->
  <!-- ========================================================================= -->
  <section id="part-1">
    <div class="part-title">Answer Part 1: Git Use with Engineering Workflow</div>
    
    <div class="callout-info">
      <strong>Engineering Workflow Summary:</strong> Development strictly followed the branch isolation protocol specified in <code>AGENTS.md</code>: Each feature was implemented in a dedicated branch (<code>feature/&lt;issue&gt;-*</code>), peer-reviewed via Pull Request into <code>lab2-staging</code>, verified with automated tests, and finally integrated into <code>main</code> via PR #28.
    </div>

    <div class="part-subtitle">1.1 Git Commit History on Main Branch</div>
    <p>The following log demonstrates feature branches developed independently, peer-reviewed into <code>lab2-staging</code>, and finally merged into <code>main</code>:</p>
    <pre>
* a761739 fix(ui): use custom English labels for attachment inputs and add ai-use docs
*   e7344c8 Merge pull request #28 from SinghLemonH/lab2-staging (Release Lab 2 to main)
|\\  
| *   f26947e Merge branch 'main' into lab2-staging to resolve revert conflicts
| |\\  
| |/  
|/|   
* |   fc0cea3 Merge pull request #21 from SinghLemonH/feature/14-requester-context
| | *   a314567 Merge pull request #27 from SinghLemonH/feature/18-qa-release
| | |\\  
| | | * 8674f2d feat(lab2): E2E test suite, responsive screenshots, and QA release verification (closes #18)
| | |/  
| | *   2d2e87c Merge pull request #26 from SinghLemonH/feature/17-design-refresh
| | |\\  
| | | * 05311fe feat(lab2): implement Ticket Detail and Attachment lifecycle with soft removal (closes #17)
| | | * fff5e56 fix(ui): Zen Green button theme, Cancel navigation, and responsive menu
| | |/  
| | *   fe9ee43 Merge pull request #25 from SinghLemonH/feature/16-my-tickets
| | |\\  
| | | * 0f52eda feat(lab2): My Tickets list with search, filter, sort, and pagination (closes #16)
| | |/  
| | *   cfce190 Merge pull request #24 from SinghLemonH/feature/15-create-tickets
| | |\\  
| | | * 05c8e58 feat: implement Create Ticket API and UI with validation (closes #15)
| | |/  
| | *   9cfd291 Merge pull request #23 from SinghLemonH/feature/14-requester-context
| | |\\  
| | | * 090b5a9 feat(lab2): development requester context, selection screen, route guard (closes #14)
| | |/  
| *   304c370 Merge pull request #20 from SinghLemonH/feature/13-extend-lab1-repo
| |\\  
| | * 6bf6302 feat(lab2): extend schema/seed, add Zen Green theme, router/multer/playwright deps (closes #13)
| |/  
| * bb5e27b Merge pull request #19 from SinghLemonH/feature/12-lab2-spec-docs
|/  
* f874b9d docs: add Lab 2 engineering contract (spec, schema, api-spec, tests, ui-spec, AGENTS.md)
    </pre>

    <div class="placeholder-box">
      <div class="placeholder-title">📷 USER PLACEHOLDER: Git Graph Visual Screenshot</div>
      <div class="placeholder-desc">
        (ใส่รูปภาพแคปหน้าจอ Network Graph / Git Log Graph จาก GitHub Insights หรือ Git GUI เช่น GitKraken / VS Code Git Graph แสดงกิ่งก้านการ merge เข้าสู่ staging และ main)
      </div>
    </div>

    <div class="part-subtitle">1.2 GitHub Project & Final Kanban Board</div>
    <p>All Lab 2 issues (#12 through #18) were tracked through states <em>Backlog &rarr; Specified &rarr; Started &rarr; PR Review &rarr; Done</em>.</p>
    
    <div class="placeholder-box">
      <div class="placeholder-title">📷 USER PLACEHOLDER: GitHub Project Kanban Board Screenshot (All in Done)</div>
      <div class="placeholder-desc">
        (ใส่รูปภาพแคปหน้าจอ GitHub Project Board ของ Lab 2 ที่แสดงคอลัมน์ <strong>Done</strong> ครบทั้ง Issue #12, #13, #14, #15, #16, #17, #18)
      </div>
    </div>

    <div class="part-subtitle">1.3 Peer Review Record (Rendered <code>docs/lab-02/reviewer.md</code>)</div>
    <table>
      <thead>
        <tr>
          <th>PR #</th>
          <th>Issue / Scope</th>
          <th>Reviewer</th>
          <th>Outcome / Decision</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/19">PR #19</a></td>
          <td>Issue #12 (Spec DD & Test DD)</td>
          <td>WATHITx</td>
          <td>Merged — 3 minor follow-ups noted (AGENTS.md TL;DR, ticket number limit), addressed in Issue #13.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/20">PR #20</a></td>
          <td>Issue #13 (Extend Lab 1 Repo)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>lab2-staging</code>.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/23">PR #23</a></td>
          <td>Issue #14 (Dev Requester Context)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>lab2-staging</code>.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/24">PR #24</a></td>
          <td>Issue #15 (Create Ticket)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>lab2-staging</code>.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/25">PR #25</a></td>
          <td>Issue #16 (My Tickets)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>lab2-staging</code>.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/26">PR #26</a></td>
          <td>Issue #17 (Ticket Detail + Attachments)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>lab2-staging</code>.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/27">PR #27</a></td>
          <td>Issue #18 (QA & Release Integration)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>lab2-staging</code>.</td>
        </tr>
        <tr>
          <td><a href="https://github.com/SinghLemonH/toktickit/pull/28">PR #28</a></td>
          <td>Lab 2 Sprint Release PR (staging &rarr; main)</td>
          <td>WATHITx</td>
          <td>Approved & Merged into <code>main</code>. Conflict resolved cleanly.</td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">1.4 Repository Configuration & Directory Structure</div>
    <p><strong>.gitignore verification:</strong> Preserves secrets, artifacts, node_modules, and uploads while tracking essential structure:</p>
    <pre>
node_modules/
dist/
.env
server/uploads/*
!server/uploads/.gitkeep
test-results/
playwright-report/
    </pre>

    <div class="placeholder-box">
      <div class="placeholder-title">📷 USER PLACEHOLDER: IDE Directory Structure Screenshot</div>
      <div class="placeholder-desc">
        (ใส่รูปภาพแคปหน้าจอโครงสร้าง Folder ใน VS Code Explorer ด้านซ้าย ที่เห็น client, server, docs, e2e, artifacts ครบถ้วน)
      </div>
    </div>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 2 -->
  <!-- ========================================================================= -->
  <section id="part-2" class="page-break">
    <div class="part-title">Answer Part 2: Spec DD (Specification-Driven Development)</div>
    
    <div class="callout-info">
      <strong>Engineering Contract:</strong> Full specification documented at <a href="https://github.com/SinghLemonH/toktickit/blob/main/docs/lab-02/specification.md"><code>docs/lab-02/specification.md</code></a>. It establishes 8 Functional Requirements (FR-01 to FR-08), 35 Business Rules (BR-01 to BR-35), 20 Acceptance Criteria (AC-01 to AC-20), and a 2-part Definition of Done.
    </div>

    <div class="part-subtitle">2.1 Summary of Business Rules & Acceptance Criteria</div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Key Rule / Criteria IDs</th>
          <th>Requirement Summary</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Ticket Number & Status</td>
          <td>BR-01, BR-02, AC-01</td>
          <td>Backend-generated unique number <code>TKT-YYYY-NNNNNN</code>. Begins with status <code>NEW</code>.</td>
        </tr>
        <tr>
          <td>Development Identity</td>
          <td>BR-03, BR-04, AC-02, AC-12</td>
          <td>Testing selector for simulating ownership. Inactive requesters excluded. Route-guarded.</td>
        </tr>
        <tr>
          <td>Ownership & Isolation</td>
          <td>BR-07, BR-08, AC-03, AC-20</td>
          <td>Strict requester isolation: queries scoped to requesterId; cross-requester access returns 404.</td>
        </tr>
        <tr>
          <td>Validation Constraints</td>
          <td>BR-18 &ndash; BR-21, AC-04</td>
          <td>Summary (1&ndash;120 chars), Description (20&ndash;2000 chars), valid Category & Related System.</td>
        </tr>
        <tr>
          <td>Attachment Lifecycle</td>
          <td>BR-24 &ndash; BR-35, AC-15, AC-16</td>
          <td>Max 5 active attachments, 5MB each (JPG, PNG, WEBP, PDF). Soft-removal requires 1&ndash;200 char reason. Blocked download for removed files.</td>
        </tr>
        <tr>
          <td>Responsive & Visual</td>
          <td>BR-36, AC-18</td>
          <td>Mobile (&lt;768px), Tablet (768&ndash;991px), Desktop (&ge;992px) without horizontal scrolling.</td>
        </tr>
      </tbody>
    </table>

    <div class="placeholder-box">
      <div class="placeholder-title">📷 USER PLACEHOLDER: Proof of Specification Pre-dating Implementation</div>
      <div class="placeholder-desc">
        (ใส่รูปภาพแคปหน้าจอ PR #19 หรือ Git Commit <code>f874b9d</code> ที่แสดงว่าไฟล์ <code>docs/lab-02/specification.md</code> ถูก commit และ merge ก่อนเริ่ม implementation ใน Issue #13-#18)
      </div>
    </div>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 3 -->
  <!-- ========================================================================= -->
  <section id="part-3" class="page-break">
    <div class="part-title">Answer Part 3: Test DD and Traceability</div>

    <div class="callout-info">
      <strong>Traceability Reference:</strong> Documented in <a href="https://github.com/SinghLemonH/toktickit/blob/main/docs/lab-02/tests.md"><code>docs/lab-02/tests.md</code></a>. 100% of Acceptance Criteria (AC-01 through AC-20) map directly to planned automated tests across Unit, API, UI, Responsive, and E2E layers.
    </div>

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
          <td>UNIT-01, 02</td>
          <td>Unit</td>
          <td>AC-01</td>
          <td>Ticket Number formatting <code>TKT-YYYY-NNNNNN</code> & sequence</td>
          <td><code>server/tests/lab-02/ticket-number.unit.test.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>API-01</td>
          <td>API</td>
          <td>AC-01</td>
          <td>POST /api/tickets with valid payload (201 Created)</td>
          <td><code>server/tests/lab-02/create-ticket.api.test.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>API-02, 03</td>
          <td>API</td>
          <td>AC-04</td>
          <td>POST /api/tickets missing summary / short description (400)</td>
          <td><code>server/tests/lab-02/create-ticket.api.test.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>API-08</td>
          <td>API</td>
          <td>AC-12</td>
          <td>GET /api/dev-requesters filters out inactive users</td>
          <td><code>server/tests/lab-02/dev-requesters.api.test.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>API-09, 18</td>
          <td>API</td>
          <td>AC-03, 20</td>
          <td>Cross-requester ticket and attachment access returns 404</td>
          <td><code>server/tests/lab-02/ticket-detail.api.test.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>API-15, 16</td>
          <td>API</td>
          <td>AC-15, 16</td>
          <td>Attachment soft-removal with reason & download blocking</td>
          <td><code>server/tests/lab-02/attachments.api.test.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>UI-01, 02</td>
          <td>UI</td>
          <td>AC-02, 13</td>
          <td>Route guard redirection and empty-requester handling</td>
          <td><code>client/tests/lab-02/RouteGuard.test.tsx</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>UI-03, 04</td>
          <td>UI</td>
          <td>AC-04, BR-21</td>
          <td>Summary validation & submit busy state debounce</td>
          <td><code>client/tests/lab-02/CreateTicket.test.tsx</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>UI-10, 11, 12</td>
          <td>UI</td>
          <td>AC-14, 15, 16</td>
          <td>Read-only fields, removal reason modal, active vs removed styling</td>
          <td><code>client/tests/lab-02/AttachmentSection.test.tsx</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
        <tr>
          <td>E2E-01, 02</td>
          <td>E2E</td>
          <td>AC-01..17</td>
          <td>Full browser flow: Select &rarr; Create &rarr; List &rarr; Detail &rarr; Soft Remove</td>
          <td><code>e2e/lab-02/requester-ticket-flow.spec.ts</code></td>
          <td><span class="badge-pass">PASS</span></td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">3.2 Passing Automated Test Execution Output from Main</div>
    <pre>
=== SERVER SUITE (Vitest + Supertest) ===
 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/dev-requesters.api.test.ts (1 test)
 ✓ tests/lab-02/ticket-number.unit.test.ts (2 tests)
 ✓ tests/lab-02/create-ticket.api.test.ts (4 tests)
 ✓ tests/lab-02/ticket-detail.api.test.ts (4 tests)
 ✓ tests/lab-02/my-tickets.api.test.ts (5 tests)
 ✓ tests/lab-02/attachments.api.test.ts (10 tests)
 Test Files  8 passed (8) | Tests  28 passed (28)

=== CLIENT SUITE (Vitest + React Testing Library) ===
 ✓ tests/lab-01/App.test.tsx (3 tests)
 ✓ tests/lab-02/RouteGuard.test.tsx (2 tests)
 ✓ tests/lab-02/RequesterSelection.test.tsx (3 tests)
 ✓ tests/lab-02/CreateTicket.test.tsx (3 tests)
 ✓ tests/lab-02/MyTickets.test.tsx (3 tests)
 ✓ tests/lab-02/TicketDetail.test.tsx (2 tests)
 ✓ tests/lab-02/AttachmentSection.test.tsx (2 tests)
 Test Files  7 passed (7) | Tests  18 passed (18)

=== E2E & RESPONSIVE SUITE (Playwright) ===
 ok 1 E2E-01: Select Requester A -> create ticket -> verify in My Tickets -> switch to Requester B (3.1s)
 ok 2 E2E-02: Ticket Detail, Add Attachment, Soft Removal with Reason (1.7s)
 ok 3 Cross-Requester Direct Access Protection (AC-03, AC-20) (1.2s)
 ok 4 RESP: Capture Responsive Screenshots at 375px, 850px, 1280px (8.0s)
 4 passed (15.4s)
    </pre>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 4 -->
  <!-- ========================================================================= -->
  <section id="part-4" class="page-break">
    <div class="part-title">Answer Part 4: AI Use with Reflection</div>

    <div class="callout-info">
      <strong>AI Assistant Tooling:</strong> Antigravity with Google Gemini (gemini-2.5-pro / flash). Complete record available at <a href="https://github.com/SinghLemonH/toktickit/blob/main/docs/lab-02/ai-use.md"><code>docs/lab-02/ai-use.md</code></a>.
    </div>

    <div class="part-subtitle">4.1 Selected Key Prompts Table</div>
    <table>
      <thead>
        <tr>
          <th>Prompt Topic</th>
          <th>Actual Prompt / Interaction Content</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Contract & Spec Audit</td>
          <td><em>"Review docs/lab-02/specification.md, tests.md, ui-spec.md, and api-spec.md before writing any code. Check for ambiguities."</em></td>
        </tr>
        <tr>
          <td>Database Schema & Seed</td>
          <td><em>"Implement Prisma schema for DevelopmentRequester, Ticket, Attachment, and idempotent seed."</em></td>
        </tr>
        <tr>
          <td>Zen Green Theme Fix</td>
          <td><em>"ตรวจดูปุ่ม Primary ใน theme.css ทำไมยังเป็นสีฟ้าของ Bootstrap ให้แก้เป็น Zen Green #006B3C"</em></td>
        </tr>
        <tr>
          <td>Cancel Button Navigation</td>
          <td><em>"ปุ่ม Cancel ใน CreateTicket.tsx กดแล้วไม่ไปไหน ให้ navigate กลับไป /tickets"</em></td>
        </tr>
        <tr>
          <td>Attachment Lifecycle</td>
          <td><em>"Implement Ticket Detail + Attachments lifecycle with soft removal and reason modal (Issue 17)"</em></td>
        </tr>
        <tr>
          <td>Playwright E2E Setup</td>
          <td><em>"เอาละงั้นมาเริ่ม Issue สุดท้ายกันเลยโดยตอนนี้ฉันสร้าง Branch ใหม่ละลองเช็คดูได้เพื่อความมั่นใจ"</em></td>
        </tr>
        <tr>
          <td>Merge Conflict Resolution</td>
          <td><em>"เกิดอะไรขึ้นอธิบายปัญหาและการแก้ที"</em> (Resolving revert modify/delete conflicts cleanly)</td>
        </tr>
        <tr>
          <td>UI English Localization</td>
          <td><em>"แก้ตรง Attachments ให้เป็นภาษาอังกฤษล้วน ไม่ให้ติดคำว่า เรียกดู... ของบราวเซอร์"</em></td>
        </tr>
      </tbody>
    </table>

    <div class="part-subtitle">4.2 My Reflection on AI Use</div>
    <p>
      Using an AI coding agent with Spec-Driven Development (Spec DD) and Test-Driven Development (TDD) greatly streamlined Lab 2 development. Having a rigid, pre-agreed contract (<code>specification.md</code> and <code>tests.md</code>) prevented AI hallucinations and scope creep. The AI was particularly effective at generating boilerplate code, test suites with comprehensive edge-case assertions, and diagnosing subtle runtime problems.
    </p>
    <p>
      However, active developer ownership was mandatory: I had to guide the agent to respect Bootstrap variable precedence in <code>theme.css</code>, resolve a complex Git merge conflict caused by an upstream revert commit without losing code, and ensure all file upload controls were consistently localized in English rather than defaulting to the browser's OS language.
    </p>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 5 -->
  <!-- ========================================================================= -->
  <section id="part-5" class="page-break">
    <div class="part-title">Answer Part 5: Development Requester Select Screen</div>

    <div class="callout-info">
      <strong>Testing Mechanism:</strong> Implemented at <code>/select-requester</code>. Serves as a simulated session context for Lab 2 multi-user ticket ownership testing prior to full authentication in Lab 3. Only active requesters are populated from PostgreSQL.
    </div>

    <div class="screenshot-card">
      <img src="${images.selectRequester}" alt="Development Requester Selection Screen">
      <div class="screenshot-caption">Figure 5.1: Development Requester Selection Screen with active users loaded from PostgreSQL and testing disclaimer.</div>
    </div>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 6 -->
  <!-- ========================================================================= -->
  <section id="part-6" class="page-break">
    <div class="part-title">Answer Part 6: Working Ticket Screen: Create Mode</div>

    <div class="part-subtitle">6.1 Scenario 1 & 2: Requester Pre-population & Reference Data Loaded</div>
    <p>When entering Create Ticket, the selected requester (e.g. Jennifer Anderson) is displayed in the header and locked into the ticket payload. Category and Related System dropdowns are dynamically loaded from PostgreSQL.</p>
    <div class="screenshot-card">
      <img src="${images.createDesktop}" alt="Create Ticket Desktop View">
      <div class="screenshot-caption">Figure 6.1: Create Ticket (Desktop View) with auto-assigned ticket number, loaded reference data, and English file picker.</div>
    </div>

    <div class="part-subtitle">6.2 Scenario 3: Validation Failure with Field-Level Messages</div>
    <p>Submitting an empty form triggers client-side and server-side validation. Red asterisks remain paired with inline error alerts below each invalid field.</p>
    <div class="screenshot-card">
      <img src="${images.createValidation}" alt="Validation Error State">
      <div class="screenshot-caption">Figure 6.2: Create Ticket Validation Failure displaying inline error feedback for Category, System, Summary, and Description.</div>
    </div>

    <div class="part-subtitle">6.3 Scenario 4: Successful Submission with Generated Ticket Number</div>
    <p>Submitting a valid form creates the ticket in PostgreSQL and returns the official unique Ticket Number (e.g. <code>TKT-2026-000105</code>).</p>
    <div class="screenshot-card">
      <img src="${images.createSuccess}" alt="Create Ticket Success State">
      <div class="screenshot-caption">Figure 6.3: Create Ticket Success Modal showing generated Ticket Number and navigation options.</div>
    </div>

    <div class="placeholder-box">
      <div class="placeholder-title">📷 USER PLACEHOLDER: Backend Failure / Form Value Retention Screenshot</div>
      <div class="placeholder-desc">
        (ใส่รูปภาพแคปหน้าจอ Create Ticket ตอนปิด backend server หรือทดสอบส่งไม่ผ่าน แล้วแสดงกล่อง error สีแดงด้านบน พร้อมฟอร์มที่ข้อความที่พิมพ์ไว้ยังอยู่ครบ ไม่หาย)
      </div>
    </div>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 7 -->
  <!-- ========================================================================= -->
  <section id="part-7" class="page-break">
    <div class="part-title">Answer Part 7: Working My Tickets Screen</div>

    <div class="callout-info">
      <strong>Requester Ownership & Data Isolation:</strong> Tickets are strictly filtered by the active <code>requesterId</code>. When switching from Requester A to Requester B, Requester A's tickets disappear completely from the view.
    </div>

    <div class="part-subtitle">7.1 Multi-User Data Isolation (Requester A vs. Requester B)</div>
    <div class="grid-2">
      <div class="screenshot-card">
        <img src="${images.myTicketsRequesterA}" alt="My Tickets Requester A">
        <div class="screenshot-caption">Figure 7.1a: Requester A (Jennifer Anderson) viewing her own support tickets.</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.myTicketsRequesterB}" alt="My Tickets Requester B">
        <div class="screenshot-caption">Figure 7.1b: Switched to Requester B (David Chen); Jennifer's tickets are isolated and absent.</div>
      </div>
    </div>

    <div class="part-subtitle">7.2 Search, Filtering, Sorting, and Pagination Controls</div>
    <div class="screenshot-card">
      <img src="${images.myTicketsDesktop}" alt="My Tickets Full Desktop">
      <div class="screenshot-caption">Figure 7.2: My Tickets screen demonstrating Search bar, Category/Priority/Status filter dropdowns, Clear Filters, and Zen Green badges.</div>
    </div>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 8 -->
  <!-- ========================================================================= -->
  <section id="part-8" class="page-break">
    <div class="part-title">Answer Part 8: Working Ticket Screen: View Mode & Attachments</div>

    <div class="part-subtitle">8.1 Owned Ticket Detail (Read-Only) & Attachment Addition</div>
    <p>All ticket header fields (Ticket No, Date, Category, System, Requester, Priorities, Summary, Description) are rendered as read-only. Active attachments display a green icon, file size, and Download/Remove actions.</p>
    <div class="screenshot-card">
      <img src="${images.ticketDetailActive}" alt="Ticket Detail Active Attachments">
      <div class="screenshot-caption">Figure 8.1: Ticket Detail view with read-only attributes and active attachment controls.</div>
    </div>

    <div class="part-subtitle">8.2 Soft-Removal with Reason & Download Block</div>
    <p>Removing an attachment requires a 1&ndash;200 character reason. After soft-removal, metadata remains visible with a strikethrough/gray style, the removal reason is displayed, and download capability is strictly disabled.</p>
    <div class="screenshot-card">
      <img src="${images.ticketDetailSoftRemoved}" alt="Ticket Detail Soft Removed Attachment">
      <div class="screenshot-caption">Figure 8.2: Attachment soft-removed with mandatory reason; marked as 'Unavailable' and download blocked.</div>
    </div>

    <div class="part-subtitle">8.3 Cross-Requester Direct Access Protection</div>
    <p>Attempting to directly navigate to a ticket belonging to another requester produces an access error / 404 screen, preventing data leakage.</p>
    <div class="screenshot-card">
      <img src="${images.ticketDetailUnauthorized}" alt="Unauthorized Direct Access Rejection">
      <div class="screenshot-caption">Figure 8.3: Direct navigation to another requester's ticket is rejected with an Access Denied / Not Found alert.</div>
    </div>
  </section>

  <!-- ========================================================================= -->
  <!-- ANSWER PART 9 -->
  <!-- ========================================================================= -->
  <section id="part-9" class="page-break">
    <div class="part-title">Answer Part 9: Zen Green UI and Responsive Evidence</div>

    <div class="callout-info">
      <strong>Theme Specification:</strong> Implemented in <code>client/src/theme.css</code> via CSS variables overriding Bootstrap 5: Primary Green (<code>#006B3C</code>), Secondary Green (<code>#0B7A46</code>), Pale Green (<code>#EAF6EF</code>), Background (<code>#F5F7F6</code>).
    </div>

    <div class="part-subtitle">9.1 Responsive Layout Evidence across 3 Viewports</div>

    <p><strong>Create Ticket Screen:</strong> Desktop (&ge;992px), Tablet (768&ndash;991px), Mobile (&lt;768px)</p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.createDesktop}" alt="Create Ticket Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.createTablet}" alt="Create Ticket Tablet">
        <div class="screenshot-caption">Tablet (850px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.createMobile}" alt="Create Ticket Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>

    <p><strong>My Tickets Screen:</strong> Desktop table view, responsive card layout on smaller viewports.</p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.myTicketsDesktop}" alt="My Tickets Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.myTicketsTablet}" alt="My Tickets Tablet">
        <div class="screenshot-caption">Tablet (850px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.myTicketsMobile}" alt="My Tickets Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>

    <p><strong>Ticket Detail Screen:</strong> Read-only form grid and attachment actions adapting cleanly across screens.</p>
    <div class="grid-3">
      <div class="screenshot-card">
        <img src="${images.ticketDetailDesktop}" alt="Ticket Detail Desktop">
        <div class="screenshot-caption">Desktop (1280px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.ticketDetailTablet}" alt="Ticket Detail Tablet">
        <div class="screenshot-caption">Tablet (850px)</div>
      </div>
      <div class="screenshot-card">
        <img src="${images.ticketDetailMobile}" alt="Ticket Detail Mobile">
        <div class="screenshot-caption">Mobile (375px)</div>
      </div>
    </div>

    <div class="part-subtitle">9.2 Completed Visual Checklist</div>
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
          <td>Zen Green Color Palette</td>
          <td>App header, buttons, and badges use <code>#006B3C</code> and <code>#0B7A46</code>.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td>Editable vs Read-only Inputs</td>
          <td>Read-only fields shaded in warm gray-green with clear lock indication; distinct from editable inputs.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td>Button Hierarchy & Busy State</td>
          <td>Primary, secondary, and destructive buttons follow visual hierarchy. Spinners active during submission.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td>No Horizontal Overflow</td>
          <td>All pages tested at 375px width without unintended horizontal page scrolling.</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
        <tr>
          <td>Accessibility & Non-color Badges</td>
          <td>Status and priority badges include text labels and directional icons (not color alone).</td>
          <td><span class="badge-pass">VERIFIED</span></td>
        </tr>
      </tbody>
    </table>
  </section>

</body>
</html>
`;

async function main() {
  const htmlPath = path.join(ROOT_DIR, "Lab2_Submission_Report.html");
  const pdfPath = path.join(ROOT_DIR, "Lab2_Submission_Report.pdf");

  fs.writeFileSync(htmlPath, htmlContent, "utf-8");
  console.log("Generated HTML at:", htmlPath);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "12mm",
      bottom: "14mm",
      left: "14mm",
      right: "14mm",
    },
  });

  await browser.close();
  console.log("Successfully generated PDF report at:", pdfPath);
}

main().catch((err) => {
  console.error("PDF generation failed:", err);
  process.exit(1);
});
