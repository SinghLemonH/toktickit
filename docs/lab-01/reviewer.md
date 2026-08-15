# Peer Review Record — Lab 1 (TokTickIT)

## Reviewer Details

| Field           | You                        | Partner                        |
|------------------|-----------------------------|----------------------------------|
| Name             | Wichitchai Suwanno          | Wathit Tritsananawakit           |
| Student ID       | 67070503439                 | 67070403439                      |
| GitHub Username  | SinghLemonH                 | WATHITx                          |

## Pull Requests Reviewed

### PRs you reviewed (on WATHITx/toktickit)

| PR | Issue | Outcome |
|----|-------|---------|
| [WATHITx/toktickit #6 — Feature/1 project foundation](https://github.com/WATHITx/toktickit/pull/6) | Issue 1 | Approved & Merged |
| [WATHITx/toktickit #7 — Feature/2 heath check](https://github.com/WATHITx/toktickit/pull/7) | Issue 2 (1st attempt) | Changes Requested → Closed (superseded by #8) |
| [WATHITx/toktickit #8 — Feature/2 health check](https://github.com/WATHITx/toktickit/pull/8) | Issue 2 (revised) | Approved & Merged |
| [WATHITx/toktickit #9 — Feature/3-category-seed](https://github.com/WATHITx/toktickit/pull/9) | Issue 3 | Approved & Merged |
| [WATHITx/toktickit #10 — Feature/4-category-list](https://github.com/WATHITx/toktickit/pull/10) | Issue 4 | Approved & Merged |

### PRs partner reviewed (on SinghLemonH/toktickit)

| PR | Issue | Outcome |
|----|-------|---------|
| [SinghLemonH/toktickit #1 — feature/1-project-foundation](https://github.com/SinghLemonH/toktickit/pull/1) | Issue 1 | Approved & Merged |
| [SinghLemonH/toktickit #6 — feature/2-health-check](https://github.com/SinghLemonH/toktickit/pull/6) | Issue 2 | Approved & Merged |
| [SinghLemonH/toktickit #7 — feature/3-category-seed](https://github.com/SinghLemonH/toktickit/pull/7) | Issue 3 | Approved & Merged |
| [SinghLemonH/toktickit #8 — feature/4-category-list](https://github.com/SinghLemonH/toktickit/pull/8) | Issue 4 | Approved & Merged |

---

## Direction 1 — Partner reviewed your Pull Requests

### PR #6 — feature/2-health-check
**Partner's comment:**
> Merge now if you want the health endpoint in and the UI to show Online/Offline behavior; it's low-risk and works as described. If you prefer stricter behavior, address the two small improvements above (parse health JSON and either fetch or document categories) and add tests before merging.

**Your response:** Merged as-is, since the health check scope was complete and the suggested improvements belonged to later Issues (categories = Issue 4).

### PR #7 — feature/3-category-seed
**Partner's comment:**
> Meets Issue 3 criteria — done: Category model: id(autoincrement), name(unique), createdAt(now()) — ✓. Migration creates table + unique index on name — ✓. Seed uses prisma.category.upsert for the four names and is idempotent — ✓. High-priority nit (fix or acknowledge): seed.ts closes getPrisma() in .finally instead of reusing the prisma variable; if getPrisma() creates a new client this may leave the real client undisconnected and hang the process. Change to prisma.$disconnect().

**Your response:** Confirmed `getPrisma()` returns a singleton client (same instance reused across calls), so the existing `.finally()` disconnect was safe, and merged the PR.

### PR #8 — feature/4-category-list
**Partner's comment:**
> Great — the /api/categories endpoint and client integration look correct and tests are added. Approving subject to CI passing. Please ensure CI runs migrations + seed before tests, or adjust the test to seed/mock DB. Also consider restoring mocks in client tests (afterEach) to avoid cross-test interference. Minor UX suggestion: show placeholder when no categories.

**Your response:** Verified tests passed locally against the seeded database and merged the PR.

---

## Direction 2 — You reviewed Partner's Pull Requests

### PR #6 — Feature/1 project foundation
**Your comment (round 1):**
> The README is still just # TokTickIT Issue 1 requires setup instructions to be present. Could you add please.

**Your comment (round 2, after fix):**
> Went through the branch and also ran it locally to check things server and client actually work, not just eyeballing the code. Really solid on the basics — .gitignore is set up properly so no .env or node_modules snuck into the repo, which is honestly the thing I'd worry about most and you nailed it. Bootstrap's already wired up on the client side too, and the folder structure matches what the labsheet asks for exactly.

**Your comment (round 3, final approval):**
> Nice, just pulled the latest changes and both are sorted — now README actually walks through setup properly, and the backend boots fine with the placeholder model in place. Ran it locally again just to be sure and everything comes up clean. Approving, good to merge :D

**Partner's response:** Added the missing README setup instructions as requested, then the PR was approved and merged.

### PR #7 — Feature/2 heath check (changes requested)
**Your comment:**
> Ahh.. I Think Two things to fix before merging:
> 1. Remove committed build artifacts: client/tests/lab-01/App.test.js and client/tests/setup.js look like compiled output accidentally committed alongside the .ts/.tsx source files. Please remove them, they can cause duplicate test runs.
> 2. Error message isn't specific enough: "The system is currently offline." doesn't tell the user what went wrong. Per the labsheet spec, please use a message like "Unable to connect to TokTickIT API" so it's actually useful for debugging.
> Everything else looks good — health check returns 200 correctly and the Online/Offline states render as expected.

**Partner's response:**
> I change branch to #8, can you review that and don't merge this one.

(Partner fixed both issues on a new branch and opened PR #8; PR #7 was closed unmerged.)

### PR #8 — Feature/2 health check (revised, approved)
**Your comment:**
> Now I think everything already fine — it's looks good, so health check returns 200 correctly and the Online/Offline states render as expected.
> it's ready, I will merge it

**Partner's response:** Reacted with ❤️; PR was approved and merged.

### PR #9 — Feature/3-category-seed
**Your comment:**
> After I reviewed for this issue:
> - Category model matches spec (id, unique name, createdAt)
> - Migration applied, table exists in PostgreSQL
> - Seed inserts the 4 required categories using upsert
> - Ran seed twice, no duplicates, confirmed idempotent
> - Checked data in Prisma Studio, 4 correct rows
> - npm test still passes, no .env/credentials committed
> Than that all look good, Pass!!

**Partner's response:** No changes requested; PR was merged.

### PR #10 — Feature/4-category-list
**Your comment:**
> Reviewed and tested locally so... all good :D
> - /api/categories returns categories from DB, ordered by id
> - Supertest confirms the endpoint response
> - Frontend fetches real data, no hard-coded categories
> - Loading and error states work correctly
> - npm test passes on both server and client
> Great job ma boy

**Partner's response:** No changes requested; PR was merged.