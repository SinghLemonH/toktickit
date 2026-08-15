# AI Use and Reflection — Lab 1

I used [Claude / Antigravity with Gemini — ระบุของจริง] as my AI coding assistant throughout Lab 1.

## Selected Key Prompts

| Prompt Name                  | Actual Prompt Text                                                                 |
|-------------------------------|--------------------------------------------------------------------------------------|
| Diagnose missing GitHub Issues | "Issue 2, 3, 4 หาไม่เจอตอนเพิ่มเข้า board ทำไง"                                     |
| Fix Board setup               | "ลบ feature 1 เสดจำเป็นต้อง ลบเลยไหม"                                                |
| New machine setup             | "ตอนนี้ฉันเปลี่ยนคอมทำต้องทำไงก่อนเริ่ม issue 2"                                     |
| Implement health check        | "From my guild pls focus to check is this really correctly for that target from guild" (guided health check implementation)          |
| Fix offline error handling    | (screenshot of raw browser NetworkError message, asking why it wasn't the custom message) |
| Review teammate's PR          | "check my word correctly enough for reviewed merge and eazy to understand or not if you is my friend" |
| Debug Prisma shadow DB error  | (screenshot of `P3014` permission denied error during `prisma migrate dev`)          |
| Implement category seed       | "ถูกไหม" (validating Category model + seed.ts against spec)                          |
| Implement category list API   | "ถูกไหม" (validating `/api/categories` route implementation)                         |
| Release PR guidance           | "งั้นคือต้องเข้า main ไหม"                                                            |

## Reflection

Overall, using an AI assistant sped up implementation significantly, especially for boilerplate (Express routes, Prisma models, Vitest mocks) and for diagnosing environment-specific errors (e.g. the Prisma shadow-database permission error, and the GitHub Issue vs. Pull Request numbering confusion on the board). 

The most useful pattern was pasting terminal screenshots directly and asking "ถูกไหม" (is this right?) — this let the assistant catch subtle issues I wouldn't have noticed myself, like leftover TODO comments in `schema.prisma`, unused `void getPrisma;` placeholders, and a generic offline error message that didn't match the specification. 

I had to stay actively involved to understand *why* each fix worked (e.g. why `fetch()` throws before reaching `res.ok`, why the shadow database needs `CREATEDB` permission, why feature branches should branch from `lab1-staging` and not `main`) rather than just copy-pasting code, since I remain responsible for explaining every change during grading.