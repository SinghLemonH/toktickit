# AI Use and Reflection — Lab 2

I used **Antigravity with Google Gemini (gemini-2.5-pro / flash)** as my AI coding assistant throughout Lab 2.

## Selected Key Prompts

| Prompt Name | Actual Prompt Text / Interaction |
|---|---|
| Contract & Spec Analysis | "Review docs/lab-02/specification.md, tests.md, ui-spec.md, and api-spec.md before writing any code." |
| Database Migration & Seed | "Implement Prisma schema for DevelopmentRequester, Ticket, Attachment, and idempotent seed." |
| Zen Green Theme & CSS Styling | "ตรวจดูปุ่ม Primary ใน theme.css ทำไมยังเป็นสีฟ้าของ Bootstrap ให้แก้เป็น Zen Green #006B3C" |
| Cancel Button Navigation Bug | "ปุ่ม Cancel ใน CreateTicket.tsx กดแล้วไม่ไปไหน ให้ navigate กลับไป /tickets" |
| Attachment Lifecycle & Soft-removal | "Implement Ticket Detail + Attachments lifecycle with soft removal and reason modal (Issue 17)" |
| Playwright E2E & Visual Screenshots | "เอาละงั้นมาเริ่ม Issue สุดท้ายกันเลยโดยตอนนี้ฉันสร้าง Branch ใหม่ละลองเช็คดูได้เพื่อความมั่นใจ" (Issue 18 E2E Test Suite) |
| Git Workflow & Merge Conflict Resolution | "เกิดอะไรขึ้นอธิบายปัญหาและการแก้ที" (Resolving modify/delete revert conflict between main and lab2-staging) |

## Reflection

Overall, using an AI coding agent with Spec-Driven Development (Spec DD) and Test-Driven Development (TDD) made the implementation of Lab 2 clean, structured, and resilient. Having formal contracts (`specification.md`, `tests.md`, `api-spec.md`, `ui-spec.md`) prevented scope creep and guesswork.

The AI excelled at scaffolding boilerplate (Supertest and Vitest test suites, Express routing, Multer configurations, and responsive CSS variables) and writing complex test fixtures. 

However, developer oversight was critical when resolving edge cases:
1. Detecting CSS specificity issues where Bootstrap's default `.btn-primary` class was overriding Zen Green palette variables.
2. Handling Git branch divergences and understanding Git's revert semantics (`modify/delete` conflicts on merge) to ensure no working code was accidentally deleted.
3. Enforcing strict security boundaries such as verifying requester ownership in middleware before serving ticket details or attachments.

Working alongside the AI as an engineering pair-programmer ensured full ownership of every line of code while maintaining high velocity and 100% test passing rates.
