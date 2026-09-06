import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ImageRun,
} from "docx";

const ROOT_DIR = process.cwd();
const SCREENSHOTS_DIR = path.join(ROOT_DIR, "artifacts", "lab-02", "screenshots");

function safeReadImage(relPath) {
  const fullPath = path.join(SCREENSHOTS_DIR, relPath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath);
  }
  return null;
}

// Standard table border style (simple black lines)
const standardBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: "000000",
      }),
    ],
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: "000000",
      }),
    ],
  });
}

function createP(text, options = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text,
        size: 22, // 11pt
        bold: options.bold || false,
        italics: options.italics || false,
        color: "000000",
      }),
    ],
  });
}

function createCodeBlock(codeText) {
  const lines = codeText.trim().split("\n");
  return lines.map(
    (line) =>
      new Paragraph({
        spacing: { before: 20, after: 20 },
        children: [
          new TextRun({
            text: line,
            font: "Consolas",
            size: 18, // 9pt
            color: "222222",
          }),
        ],
      })
  );
}

function createPlaceholderBox(instructionText) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              top: { style: BorderStyle.DASHED, size: 8, color: "555555" },
              bottom: { style: BorderStyle.DASHED, size: 8, color: "555555" },
              left: { style: BorderStyle.DASHED, size: 8, color: "555555" },
              right: { style: BorderStyle.DASHED, size: 8, color: "555555" },
            },
            shading: { fill: "F5F5F5" },
            margins: { top: 200, bottom: 200, left: 240, right: 240 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `[ กรุณาแทรกภาพหน้าจอ: ${instructionText} ]`,
                    bold: true,
                    size: 22,
                    color: "333333",
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function createImageBox(imageBuffer, width = 560, height = 310, caption = "") {
  if (!imageBuffer) return [];
  const paras = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      children: [
        new ImageRun({
          data: imageBuffer,
          transformation: { width, height },
        }),
      ],
    }),
  ];
  if (caption) {
    paras.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 140 },
        children: [
          new TextRun({
            text: caption,
            italics: true,
            size: 18, // 9pt
            color: "444444",
          }),
        ],
      })
    );
  }
  return paras;
}

// Load Images
const imgSelectRequester = safeReadImage("select-requester.png");
const imgCreateDesktop = safeReadImage("create-ticket/desktop.png");
const imgCreateValidation = safeReadImage("create-ticket/validation-error.png");
const imgCreateSuccess = safeReadImage("create-ticket/success.png");
const imgMyTicketsA = safeReadImage("my-tickets/requester-a.png");
const imgMyTicketsB = safeReadImage("my-tickets/requester-b.png");
const imgMyTicketsDesktop = safeReadImage("my-tickets/desktop.png");
const imgTicketDetailActive = safeReadImage("ticket-detail/active.png");
const imgTicketDetailRemoved = safeReadImage("ticket-detail/soft-removed.png");
const imgTicketDetailUnauthorized = safeReadImage("ticket-detail/unauthorized.png");
const imgCreateTablet = safeReadImage("create-ticket/tablet.png");
const imgCreateMobile = safeReadImage("create-ticket/mobile.png");
const imgMyTicketsTablet = safeReadImage("my-tickets/tablet.png");
const imgMyTicketsMobile = safeReadImage("my-tickets/mobile.png");
const imgDetailTablet = safeReadImage("ticket-detail/tablet.png");
const imgDetailMobile = safeReadImage("ticket-detail/mobile.png");

async function generateDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Calibri",
            size: 22, // 11pt
            color: "000000",
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // 1 inch
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Header / Title block
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80 },
            children: [
              new TextRun({
                text: "CPE 334 Introduction to Software Engineering in the Age of AI Agents",
                bold: true,
                size: 28, // 14pt
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 160 },
            children: [
              new TextRun({
                text: "Lab 2: TokTickIT Requester Ticketing MVP with UI Foundation",
                bold: true,
                size: 24, // 12pt
              }),
            ],
          }),

          // Info Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    borders: standardBorders,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "ผู้จัดทำ: ", bold: true }),
                          new TextRun("นายวิชญ์ชัย สุวรรโณ (รหัสนักศึกษา 67070403439)\n"),
                          new TextRun({ text: "GitHub: ", bold: true }),
                          new TextRun("SinghLemonH"),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    borders: standardBorders,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "Partner / ผู้ตรวจ: ", bold: true }),
                          new TextRun("นายวาทิต ตริศนานวขิต (รหัสนักศึกษา 67070503495)\n"),
                          new TextRun({ text: "GitHub: ", bold: true }),
                          new TextRun("WATHITx"),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 2,
                    borders: standardBorders,
                    margins: { top: 100, bottom: 100, left: 150, right: 150 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: "GitHub Repository: ", bold: true }),
                          new TextRun("https://github.com/SinghLemonH/toktickit\n"),
                          new TextRun({ text: "Staging Branch: ", bold: true }),
                          new TextRun("lab2-staging | "),
                          new TextRun({ text: "Target Main Branch: ", bold: true }),
                          new TextRun("main"),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),

          new Paragraph({ spacing: { before: 160, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 1
          // -------------------------------------------------------------
          createHeading1("Answer Part 1: Git Use with Engineering Workflow"),
          createP(
            "ใน Lab 2 นี้ กลุ่มของพวกเราได้ปฏิบัติตามแนวทางการทำงานแบบ Git Workflow อย่างเคร่งครัด โดยแบ่งการทำงานแต่ละงาน (Issue #12 ถึง #18) ออกเป็น Feature Branch แยกจากกัน ทุก Feature Branch จะถูกส่งผ่าน Pull Request เข้าสู่ branch lab2-staging เพื่อให้เพื่อน (Reviewer) ตรวจสอบและอนุมัติก่อนเสมอ เมื่อผ่านการทดสอบครบทุกส่วนแล้ว จึงเปิด Release Pull Request (PR #28) จาก lab2-staging รวมเข้าสู่ main"
          ),

          createHeading2("1.1 Git Commit History บน Branch Main"),
          createP(
            "ประวัติ Git Log ด้านล่างนี้แสดงให้เห็นลำดับการพัฒนาของแต่ละ Feature Branch ที่ถูก Merge เข้า lab2-staging และสุดท้ายถูก Merge รวมเข้าสู่ main อย่างเป็นระเบียบ:"
          ),
          ...createCodeBlock(`
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
`),

          createPlaceholderBox("ภาพแคปหน้าจอ Network Graph / Git Log Graph จาก GitHub Insights หรือ Git GUI (แสดงการแตกกิ่ง Feature Branch และ Merge รวมเข้า Staging/Main)"),

          createHeading2("1.2 GitHub Project และ Kanban Board"),
          createP(
            "ทุก Issue ของ Lab 2 (ตั้งแต่ Issue #12 ถึง #18) ถูกจัดการผ่าน GitHub Projects และผ่านขั้นตอนตามสถานะ Backlog -> Specified -> Started -> PR Review -> Done จนเสร็จสิ้นทั้งหมด"
          ),
          createPlaceholderBox("ภาพแคปหน้าจอ GitHub Project Kanban Board ของโปรเจกต์ ที่แสดงว่าทุก Issue (#12 - #18) ย้ายมาอยู่ในคอลัมน์ Done ครบทุกใบ"),

          createHeading2("1.3 ข้อมูลการตรวจทานโดย Reviewer (docs/lab-02/reviewer.md)"),
          createP(
            "ตารางสรุป Pull Request ในการพัฒนา Lab 2 ที่ผ่านการ Review และ Approve โดย Partner (WATHITx):"
          ),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue / Scope", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("Reviewer", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผลการตรวจและข้อคิดเห็น", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #19")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #12 (Spec DD & Test DD)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Merged (มีข้อเสนอแนะ 3 ข้อ ให้แก้ไขใน Issue #13)")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #20")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #13 (Extend Lab 1 Repo)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #23")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #14 (Dev Requester Context)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #24")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #15 (Create Ticket)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #25")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #16 (My Tickets)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #26")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #17 (Ticket Detail & Attachments)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #27")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Issue #18 (QA & Release Integration)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("PR #28")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Lab 2 Sprint Release (staging -> main)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("WATHITx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Approved & Merged เข้าสู่ main สมบูรณ์")] }),
                ],
              }),
            ],
          }),

          createHeading2("1.4 เนื้อหา README, .gitignore และ Directory Structure"),
          createP("เนื้อหาไฟล์ .gitignore ในโปรเจกต์:"),
          ...createCodeBlock(`
node_modules/
dist/
.env
server/uploads/*
!server/uploads/.gitkeep
test-results/
playwright-report/
`),
          createPlaceholderBox("ภาพแคปหน้าจอ Directory Structure จากโปรแกรม VS Code ทางแถบซ้ายมือ (แสดงโฟลเดอร์ client, server, docs, e2e, artifacts ครบถ้วน)"),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 2
          // -------------------------------------------------------------
          createHeading1("Answer Part 2: Spec DD (Specification-Driven Development)"),
          createP(
            "เอกสาร Specification ฉบับเต็มถูกจัดทำไว้ที่ docs/lab-02/specification.md โดยระบุข้อกำหนดฟังก์ชัน (FR-01 ถึง FR-08), กฎเกณฑ์ทางธุรกิจ (BR-01 ถึง BR-35), เกณฑ์การยอมรับ (AC-01 ถึง AC-20) และ Definition of Done ครบถ้วนก่อนเริ่มต้นเขียนโค้ด"
          ),
          createP("ลิงก์เอกสารบน GitHub: https://github.com/SinghLemonH/toktickit/blob/main/docs/lab-02/specification.md"),

          createHeading2("2.1 สรุปหมวดหมู่ Business Rules และ Acceptance Criteria"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("หมวดหมู่", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("รหัสกฎ / เกณฑ์", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("รายละเอียดข้อกำหนด", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Ticket Number & Status")] }),
                  new TableCell({ borders: standardBorders, children: [createP("BR-01, BR-02, AC-01")] }),
                  new TableCell({ borders: standardBorders, children: [createP("หมายเลขตั๋วสร้างจาก Backend รูปแบบ TKT-YYYY-NNNNNN และเริ่มต้นด้วยสถานะ NEW เสมอ")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Development Requester")] }),
                  new TableCell({ borders: standardBorders, children: [createP("BR-03, BR-04, AC-02, AC-12")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ใช้เป็นกลไกจำลองตัวตนสำหรับทดสอบสิทธิ์ใน Lab 2 ไม่รวม inactive user และมี RouteGuard ดักไว้")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Ownership & Isolation")] }),
                  new TableCell({ borders: standardBorders, children: [createP("BR-07, BR-08, AC-03, AC-20")] }),
                  new TableCell({ borders: standardBorders, children: [createP("แยกข้อมูลของผู้ใช้แต่ละคนเด็ดขาด หากเปิดตั๋วหรือไฟล์ของคนอื่น จะต้องถูกปฏิเสธ (404)")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Validation Constraints")] }),
                  new TableCell({ borders: standardBorders, children: [createP("BR-18 ถึง BR-21, AC-04")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Summary ต้องมีความยาว 1-120 ตัวอักษร, Description 20-2000 ตัวอักษร, ต้องเลือก Category และ System")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Attachment Lifecycle")] }),
                  new TableCell({ borders: standardBorders, children: [createP("BR-24 ถึง BR-35, AC-15, AC-16")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ไฟล์แนบสูงสุด 5 ไฟล์ ขนาดไม่เกิน 5MB (JPG, PNG, WEBP, PDF) การลบเป็น Soft-removal พร้อมระบุเหตุผล 1-200 ตัวอักษร และปิดกั้นการดาวน์โหลดไฟล์ที่ถูกลบ")] }),
                ],
              }),
            ],
          }),

          createPlaceholderBox("ภาพแคปหน้าจอหลักฐานว่าเอกสาร specification.md ถูกสร้างและ merge เข้าสู่ staging ก่อนเริ่มทำ Issue โค้ด (เช่น ภาพ PR #19 หรือ Commit f874b9d)"),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 3
          // -------------------------------------------------------------
          createHeading1("Answer Part 3: Test DD and Traceability"),
          createP(
            "เอกสารแผนการทดสอบระบุไว้ใน docs/lab-02/tests.md โดยใช้แนวทาง TDD (Test-Driven Development) เขียน Test ที่ล้มเหลวก่อนเริ่มเขียนโค้ดฟีเจอร์ ทุกเกณฑ์การยอมรับ (AC-01 ถึง AC-20) ถูกผูกเข้ากับชุดทดสอบแบบอัตโนมัติ 100%"
          ),
          createP("ลิงก์เอกสารบน GitHub: https://github.com/SinghLemonH/toktickit/blob/main/docs/lab-02/tests.md"),

          createHeading2("3.1 ตาราง Planned-Test Traceability Matrix (ตัวอย่างหลัก)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Test ID", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("Layer", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("พฤติกรรมที่ทดสอบ", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("ไฟล์ Test ที่รัน", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผลลัพธ์", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("UNIT-01, 02")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Unit")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-01")] }),
                  new TableCell({ borders: standardBorders, children: [createP("สร้าง Ticket Number รูปแบบ TKT-YYYY-NNNNNN และลำดับต่อเนื่อง")] }),
                  new TableCell({ borders: standardBorders, children: [createP("server/tests/lab-02/ticket-number.unit.test.ts")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("API-01")] }),
                  new TableCell({ borders: standardBorders, children: [createP("API")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-01")] }),
                  new TableCell({ borders: standardBorders, children: [createP("POST /api/tickets บันทึกตั๋วสำเร็จ ตอบกลับ 201 Created")] }),
                  new TableCell({ borders: standardBorders, children: [createP("server/tests/lab-02/create-ticket.api.test.ts")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("API-02, 03")] }),
                  new TableCell({ borders: standardBorders, children: [createP("API")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-04")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ตรวจสอบ validation ฟิลด์ว่าง หรือ description สั้นเกินไป (400)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("server/tests/lab-02/create-ticket.api.test.ts")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("API-09, 18")] }),
                  new TableCell({ borders: standardBorders, children: [createP("API")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-03, 20")] }),
                  new TableCell({ borders: standardBorders, children: [createP("เข้าถึงตั๋วหรือไฟล์ของคนอื่น ตอบกลับ 404 ป้องกันข้อมูลรั่วไหล")] }),
                  new TableCell({ borders: standardBorders, children: [createP("server/tests/lab-02/ticket-detail.api.test.ts")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("UI-03, 04")] }),
                  new TableCell({ borders: standardBorders, children: [createP("UI")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-04, BR-21")] }),
                  new TableCell({ borders: standardBorders, children: [createP("แสดง error สีแดงใต้ช่อง และ disable ปุ่ม Submit ขณะส่ง")] }),
                  new TableCell({ borders: standardBorders, children: [createP("client/tests/lab-02/CreateTicket.test.tsx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("UI-11, 12")] }),
                  new TableCell({ borders: standardBorders, children: [createP("UI")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-15, 16")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Modal ให้ใส่เหตุผลการลบ และแสดงสถานะ Unavailable เมื่อถูกลบ")] }),
                  new TableCell({ borders: standardBorders, children: [createP("client/tests/lab-02/AttachmentSection.test.tsx")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("E2E-01, 02")] }),
                  new TableCell({ borders: standardBorders, children: [createP("E2E")] }),
                  new TableCell({ borders: standardBorders, children: [createP("AC-01..17")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ทดสอบ Flow การทำงานทั้งระบบตั้งแต่เลือกผู้ใช้จนลบไฟล์แนบ")] }),
                  new TableCell({ borders: standardBorders, children: [createP("e2e/lab-02/requester-ticket-flow.spec.ts")] }),
                  new TableCell({ borders: standardBorders, children: [createP("PASS", { bold: true })] }),
                ],
              }),
            ],
          }),

          createHeading2("3.2 ผลการรัน Automated Test ทั้งหมดบน Main Branch"),
          createP(
            "ผลการรันคำสั่งทดสอบจริงบน branch main ทั้งฝั่ง Server (28 tests), Client (18 tests) และ Playwright E2E (4 flows):"
          ),
          ...createCodeBlock(`
=== SERVER TESTS (Vitest + Supertest) ===
 ✓ tests/lab-01/health.test.ts (1 test)
 ✓ tests/lab-01/categories.test.ts (1 test)
 ✓ tests/lab-02/dev-requesters.api.test.ts (1 test)
 ✓ tests/lab-02/ticket-number.unit.test.ts (2 tests)
 ✓ tests/lab-02/create-ticket.api.test.ts (4 tests)
 ✓ tests/lab-02/ticket-detail.api.test.ts (4 tests)
 ✓ tests/lab-02/my-tickets.api.test.ts (5 tests)
 ✓ tests/lab-02/attachments.api.test.ts (10 tests)
 Test Files  8 passed (8) | Tests  28 passed (28)

=== CLIENT TESTS (Vitest + React Testing Library) ===
 ✓ tests/lab-01/App.test.tsx (3 tests)
 ✓ tests/lab-02/RouteGuard.test.tsx (2 tests)
 ✓ tests/lab-02/RequesterSelection.test.tsx (3 tests)
 ✓ tests/lab-02/CreateTicket.test.tsx (3 tests)
 ✓ tests/lab-02/MyTickets.test.tsx (3 tests)
 ✓ tests/lab-02/TicketDetail.test.tsx (2 tests)
 ✓ tests/lab-02/AttachmentSection.test.tsx (2 tests)
 Test Files  7 passed (7) | Tests  18 passed (18)

=== E2E TESTS (Playwright) ===
 ok 1 E2E-01: Select Requester A -> create ticket -> verify in My Tickets -> switch to Requester B (3.1s)
 ok 2 E2E-02: Ticket Detail, Add Attachment, Soft Removal with Reason (1.7s)
 ok 3 Cross-Requester Direct Access Protection (AC-03, AC-20) (1.2s)
 ok 4 RESP: Capture Responsive Screenshots at 375px, 850px, 1280px (8.0s)
 4 passed (15.4s)
`),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 4
          // -------------------------------------------------------------
          createHeading1("Answer Part 4: AI Use with Reflection"),
          createP(
            "ใน Lab 2 นี้ ผมได้ใช้ Antigravity (Google Gemini 2.5) เป็นผู้ช่วยในการเขียนโค้ดและตรวจสอบเอกสาร (บันทึกไว้ที่ docs/lab-02/ai-use.md)"
          ),

          createHeading2("4.1 ตาราง Prompts สำคัญที่ใช้ในการทำงาน"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("หัวข้อการทำงาน", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("ข้อความ Prompt ที่ใช้จริง", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("ตรวจสอบข้อกำหนด (Contract Audit)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Review docs/lab-02/specification.md, tests.md, ui-spec.md, and api-spec.md before writing any code.")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("สร้างฐานข้อมูลและ Seed")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Implement Prisma schema for DevelopmentRequester, Ticket, Attachment, and idempotent seed.")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("แก้ไขสีปุ่มธีม Zen Green")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ตรวจดูปุ่ม Primary ใน theme.css ทำไมยังเป็นสีฟ้าของ Bootstrap ให้แก้เป็น Zen Green #006B3C")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("แก้ไขปุ่ม Cancel")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ปุ่ม Cancel ใน CreateTicket.tsx กดแล้วไม่ไปไหน ให้ navigate กลับไป /tickets")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("จัดการวงจรชีวิตไฟล์แนบ")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Implement Ticket Detail + Attachments lifecycle with soft removal and reason modal (Issue 17)")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("ทดสอบระบบ E2E")] }),
                  new TableCell({ borders: standardBorders, children: [createP("เอาละงั้นมาเริ่ม Issue สุดท้ายกันเลยโดยตอนนี้ฉันสร้าง Branch ใหม่ละลองเช็คดูได้เพื่อความมั่นใจ")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("แก้ปัญหา Git Merge Conflict")] }),
                  new TableCell({ borders: standardBorders, children: [createP("เกิดอะไรขึ้นอธิบายปัญหาและการแก้ที (วิเคราะห์และแก้ข้อขัดแย้งจากการ revert ใน main)")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("ปรับแต่งปุ่มไฟล์แนบเป็นภาษาอังกฤษ")] }),
                  new TableCell({ borders: standardBorders, children: [createP("มันต้องเป็นภาษาอังกฤษ (เปลี่ยนปุ่ม Browse ภาษาไทยของบราวเซอร์ให้เป็น Choose Files ภาษาอังกฤษ)")] }),
                ],
              }),
            ],
          }),

          createHeading2("4.2 ความคิดเห็นและสิ่งที่ได้เรียนรู้จากการใช้ AI (My Reflection)"),
          createP(
            "การนำ AI เข้ามาช่วยในการทำแล็บครั้งนี้ ช่วยประหยัดเวลาในการสร้างโครงสร้างโค้ดเริ่มต้น (Boilerplate) ได้เป็นอย่างมาก โดยเฉพาะการตั้งค่า Vitest, Supertest, Express Routes และ Prisma Schema แต่สิ่งที่ผมได้เรียนรู้คือ การมีเอกสารข้อกำหนดที่ชัดเจน (Spec-Driven Development) มีความจำเป็นมาก เพราะหากไม่มีข้อกำหนดที่รัดกุม AI อาจจะสร้างโค้ดนอกเหนือขอบเขตงานได้"
          ),
          createP(
            "นอกจากนี้ ยังต้องอาศัยการตรวจสอบอย่างละเอียดของมนุษย์ เช่น ปัญหา CSS ของ Bootstrap ที่ทับสีปุ่ม Zen Green, ข้อความภาษาไทยเริ่มต้นของช่องเลือกไฟล์ในบราวเซอร์ และการแก้ปัญหา Git Merge Conflict ตอน Release ซึ่งเกิดจากประวัติ commit เก่า ทำให้ผมเข้าใจการทำงานของ Git และกลไกเบื้องหลังของระบบได้ดียิ่งขึ้น"
          ),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 5
          // -------------------------------------------------------------
          createHeading1("Answer Part 5: Development Requester Select Screen"),
          createP(
            "หน้าต่างเลือกตัวตนจำลอง (Select Development Requester) อยู่ที่เส้นทาง /select-requester ทำหน้าที่จำลองการเข้าสู่ระบบเพื่อใช้ทดสอบการเป็นเจ้าของตั๋วของ Requester แต่ละคนใน Lab 2 รายชื่อผู้ใช้จะถูกดึงมาจากฐานข้อมูล PostgreSQL เฉพาะผู้ใช้ที่ active เท่านั้น พร้อมมีข้อความแจ้งเตือนชัดเจนว่าระบบล็อกอินจริงจะตามมาใน Lab 3"
          ),
          ...createImageBox(imgSelectRequester, 500, 280, "รูปที่ 5.1: หน้าจอ Select Development Requester พร้อม Dropdown รายชื่อผู้ใช้และข้อความเตือน"),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 6
          // -------------------------------------------------------------
          createHeading1("Answer Part 6: Working Ticket Screen: Create Mode"),
          createP(
            "หน้าจอสร้างตั๋ว (/tickets/create) มีการตรวจสอบความถูกต้องของข้อมูล (Validation) ทั้งฝั่ง Client และ Server ฟิลด์หมายเลขตั๋วและวันที่ถูกสร้างโดยระบบ และแสดงชื่อ Requester ที่เลือกไว้อย่างถูกต้อง"
          ),

          createHeading2("6.1 การแสดงผลเริ่มต้น และการโหลดข้อมูลอ้างอิงจาก Database"),
          createP(
            "เมื่อเปิดหน้าจอ Create Ticket ระบบจะดึงข้อมูลหมวดหมู่ (Category) และระบบที่เกี่ยวข้อง (Related System) จากฐานข้อมูลมาใส่ใน Dropdown โดยอัตโนมัติ และแสดงปุ่มเลือกไฟล์แนบเป็นภาษาอังกฤษอย่างถูกต้อง"
          ),
          ...createImageBox(imgCreateDesktop, 540, 310, "รูปที่ 6.1: หน้า Create Ticket บน Desktop แสดงข้อมูล Dropdown จาก Database ครบถ้วน"),

          createHeading2("6.2 การแจ้งเตือนข้อผิดพลาด (Validation Failure)"),
          createP(
            "เมื่อพยายามกดยื่นฟอร์มโดยไม่กรอกข้อมูล ระบบจะแสดงข้อความเตือนสีแดงใต้แต่ละฟิลด์ทันที และมีดอกจันสีแดงกำกับฟิลด์ที่จำเป็น"
          ),
          ...createImageBox(imgCreateValidation, 540, 310, "รูปที่ 6.2: แสดง Error ข้อความเตือนสีแดงเมื่อไม่กรอก Category, Related System, Summary หรือ Description"),

          createHeading2("6.3 การบันทึกสำเร็จและออกหมายเลขตั๋ว"),
          createP(
            "เมื่อกรอกข้อมูลถูกต้องและกด Submit ระบบจะบันทึกลง PostgreSQL และแสดงป๊อปอัปแจ้งผลสำเร็จ พร้อมหมายเลขตั๋วทางการ เช่น TKT-2026-000106"
          ),
          ...createImageBox(imgCreateSuccess, 500, 280, "รูปที่ 6.3: แสดงผลการสร้างตั๋วสำเร็จ พร้อมหมายเลขตั๋วอย่างเป็นทางการ"),

          createPlaceholderBox("ภาพแคปหน้าจอ Create Ticket ตอนจำลองปิด Backend Server แล้วกด Submit เพื่อแสดงว่ามีกล่องแจ้งเตือนสีแดงด้านบน และข้อความที่พิมพ์ไว้ในฟอร์มยังคงอยู่ครบถ้วน"),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 7
          // -------------------------------------------------------------
          createHeading1("Answer Part 7: Working My Tickets Screen"),
          createP(
            "หน้า My Tickets (/tickets) แสดงรายการตั๋วของผู้ใช้ที่เลือกไว้ พร้อมระบบค้นหา (Search), กรอง (Filters), จัดเรียง (Sort) และแบ่งหน้า (Pagination)"
          ),

          createHeading2("7.1 การแยกสิทธิ์ของผู้ใช้แต่ละคน (Data Isolation)"),
          createP(
            "เมื่อเลือกผู้ใช้เป็น Requester A (Jennifer Anderson) จะเห็นเฉพาะตั๋วของตนเอง และเมื่อกด Change Requester สลับเป็น Requester B (David Chen) ตั๋วของ Requester A จะหายไปทันที แสดงว่าระบบแยกสิทธิ์ตาม requesterId อย่างสมบูรณ์"
          ),
          ...createImageBox(imgMyTicketsA, 540, 270, "รูปที่ 7.1a: My Tickets ของ Requester A (Jennifer Anderson) แสดงรายการตั๋วของตนเอง"),
          ...createImageBox(imgMyTicketsB, 540, 270, "รูปที่ 7.1b: สลับเป็น Requester B (David Chen) ตั๋วของ Jennifer หายไป ไม่ปรากฏให้เห็น"),

          createHeading2("7.2 เครื่องมือ Search, Filters, Sort และ Pagination"),
          createP(
            "มีแถบค้นหาข้อความ, Dropdown กรองตามหมวดหมู่, ลำดับความสำคัญ, สถานะ และปุ่ม Clear Filters เมื่อต้องการรีเซ็ตค่าการค้นหา"
          ),
          ...createImageBox(imgMyTicketsDesktop, 540, 300, "รูปที่ 7.2: หน้า My Tickets เต็มรูปแบบ แสดงช่องค้นหา ฟิลเตอร์ และตารางข้อมูล"),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 8
          // -------------------------------------------------------------
          createHeading1("Answer Part 8: Working Ticket Screen: View Mode and Attachments"),
          createP(
            "หน้าจอ Ticket Detail (/tickets/:id) แสดงข้อมูลตั๋วแบบอ่านอย่างเดียว (Read-only) และรองรับการจัดการไฟล์แนบ"
          ),

          createHeading2("8.1 หน้ารายละเอียดตั๋วแบบอ่านอย่างเดียวและไฟล์แนบที่ใช้งานได้"),
          createP(
            "ทุกช่องข้อมูลเป็นแบบอ่านอย่างเดียว มีการจัดหมวดหมู่ชัดเจน ไฟล์แนบที่ยังใช้งานอยู่จะมีปุ่ม Download และปุ่ม Remove สีแดง"
          ),
          ...createImageBox(imgTicketDetailActive, 540, 310, "รูปที่ 8.1: หน้า Ticket Detail แสดงข้อมูลแบบ Read-only และปุ่มดาวน์โหลด/ลบไฟล์แนบ"),

          createHeading2("8.2 การลบไฟล์แนบแบบ Soft-removal พร้อมระบุเหตุผล"),
          createP(
            "การลบไฟล์แนบจะเปิด Modal บังคับให้กรอกเหตุผล (1-200 ตัวอักษร) ปุ่มยืนยันจะถูกปิดใช้งานจนกว่าจะพิมพ์เหตุผล เมื่อลบแล้วข้อมูลยังคงอยู่และขึ้นสถานะ Unavailable พร้อมระบุเหตุผล แต่ปุ่มดาวน์โหลดจะถูกปิดกั้นอย่างสมบูรณ์"
          ),
          ...createImageBox(imgTicketDetailRemoved, 540, 310, "รูปที่ 8.2: ไฟล์แนบที่ถูกลบแสดงข้อความขีดฆ่า เหตุผลการลบ และปิดกั้นการดาวน์โหลด"),

          createHeading2("8.3 การป้องกันการเข้าถึงข้ามสิทธิ์ (Cross-Requester Protection)"),
          createP(
            "หากผู้ใช้พยายามพิมพ์ URL ตรงๆ เพื่อเข้าดูตั๋วของ Requester คนอื่น ระบบจะแสดงข้อความ Ticket not found or access denied (404) เพื่อป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต"
          ),
          ...createImageBox(imgTicketDetailUnauthorized, 500, 270, "รูปที่ 8.3: การปฏิเสธการเข้าถึงเมื่อพยายามเปิดตั๋วของผู้อื่นโดยตรง"),

          new Paragraph({ spacing: { before: 200, after: 100 } }),

          // -------------------------------------------------------------
          // Answer Part 9
          // -------------------------------------------------------------
          createHeading1("Answer Part 9: Zen Green UI and Responsive Evidence"),
          createP(
            "การออกแบบ UI ใช้ธีม Zen Green โดยปรับแต่งผ่าน CSS Variables ทับ Bootstrap 5: สีหลัก Primary Green (#006B3C), สีรอง Secondary Green (#0B7A46), สีอ่อน Pale Green (#EAF6EF) และพื้นหลัง (#F5F7F6)"
          ),

          createHeading2("9.1 ภาพหลักฐาน Responsive Layout บน 3 ขนาดหน้าจอ"),
          createP(
            "หน้าจอได้รับการทดสอบบน Desktop (1280px), Tablet (850px) และ Mobile (375px) โดยไม่มีปัญหาการล้นหน้าจอ (No horizontal overflow)"
          ),

          createP("ก. หน้า Create Ticket (Tablet 850px และ Mobile 375px):", { bold: true }),
          ...createImageBox(imgCreateTablet, 480, 270, "Create Ticket — Tablet View (850px)"),
          ...createImageBox(imgCreateMobile, 300, 480, "Create Ticket — Mobile View (375px)"),

          createP("ข. หน้า My Tickets (Tablet 850px และ Mobile 375px):", { bold: true }),
          ...createImageBox(imgMyTicketsTablet, 480, 270, "My Tickets — Tablet View (850px)"),
          ...createImageBox(imgMyTicketsMobile, 300, 480, "My Tickets — Mobile View (375px)"),

          createP("ค. หน้า Ticket Detail (Tablet 850px และ Mobile 375px):", { bold: true }),
          ...createImageBox(imgDetailTablet, 480, 270, "Ticket Detail — Tablet View (850px)"),
          ...createImageBox(imgDetailMobile, 300, 480, "Ticket Detail — Mobile View (375px)"),

          createHeading2("9.2 ตารางสรุปการตรวจสอบ UI (Visual Checklist)"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("หัวข้อการตรวจสอบ", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผลการตรวจสอบและการทำงานจริง", { bold: true })] }),
                  new TableCell({ borders: standardBorders, children: [createP("สถานะ", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("สีธีม Zen Green")] }),
                  new TableCell({ borders: standardBorders, children: [createP("แถบ Header, ปุ่มกด และ Badge ใช้สีเขียว #006B3C และ #0B7A46 ถูกต้อง")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผ่าน (VERIFIED)", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("ความแตกต่างของช่องกรอก")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ช่อง Read-only มีสีพื้นหลังเทาอมเขียวจางๆ แตกต่างจากช่องกรอกปกติชัดเจน")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผ่าน (VERIFIED)", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("ลำดับขั้นปุ่มและการรอ")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ปุ่มบันทึก ปุ่มยกเลิก และปุ่มลบมีสไตล์ชัดเจน และแสดง spinner ระหว่างส่งข้อมูล")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผ่าน (VERIFIED)", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("การไม่ล้นหน้าจอ (No Overflow)")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ทุกหน้าจอเมื่อเปิดบนมือถือ (375px) ปรับเป็นคอลัมน์เดี่ยว ไม่มีแถบเลื่อนแนวนอน")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผ่าน (VERIFIED)", { bold: true })] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ borders: standardBorders, children: [createP("Accessibility & Badges")] }),
                  new TableCell({ borders: standardBorders, children: [createP("Badge ลำดับความสำคัญและสถานะมีข้อความและสัญลักษณ์กำกับ ไม่พึ่งพาเพียงสีอย่างเดียว")] }),
                  new TableCell({ borders: standardBorders, children: [createP("ผ่าน (VERIFIED)", { bold: true })] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outPath = path.join(ROOT_DIR, "Lab2_Submission_Report.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("Successfully generated DOCX report at:", outPath);
}

generateDocx().catch((err) => {
  console.error("Failed to generate DOCX:", err);
  process.exit(1);
});
