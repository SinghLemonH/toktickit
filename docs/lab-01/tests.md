# Lab 1 — Test Plan and Evidence  

Test files location: `server/tests/lab-01/`, `client/tests/lab-01/`

| Test ID | Tool      | Test Description                                             |
|---------|-----------|----------------------------------------------------------------|
| API-01  | Supertest | Health endpoint returns 200 and expected JSON                 |
| API-02  | Supertest | Categories endpoint returns the four seeded categories        |
| UI-01   | Vitest    | TokTickIT heading renders                                      |
| UI-02   | Vitest    | Loading state changes to category list on success              |
| UI-03   | Vitest    | API failure displays a useful error message                    |

## Evidence — All Tests Passing

**Server (`cd server && npm test`):**
✓ tests/lab-01/health.test.ts (1)
✓ tests/lab-01/categories.test.ts (1)

Test Files 2 passed (2)
Tests 2 passed (2)


**Client (`cd client && npm test`):**
✓ tests/lab-01/App.test.tsx (3)
✓ renders the TokTickIT heading
✓ shows Online and the seeded categories on success
✓ shows an Offline error message when the API is unavailable

Test Files 1 passed (1)
Tests 3 passed (3)