# Lab 4 Peer Review Log

- **Author**: Wichitchai Suwanno (@SinghLemonH, Student ID: 67070503439)
- **Reviewer**: Wathit Tritsananawakit (@WATHITx, Student ID: 67070403495)

Every Lab 4 Issue is developed on an isolated feature branch, merged through a Pull Request into `lab4-staging`, peer-reviewed before merge, and ultimately released to `main` through a final release PR.

## Peer Review Registry Table

| Issue | Pull Request | Reviewer Comment | Author Response | Approved |
| :--- | :--- | :--- | :--- | :---: |
| **#46** Sprint 4 engineering contract and baseline config | [#53](https://github.com/SinghLemonH/toktickit/pull/53) | Baseline/specification PR approved: verified AGENTS.md, documentation set under docs/lab-04, and vitest config. No code-level blocker. | Acknowledged. Baseline specifications and test matrix established. Proceeding to Issue #47 implementation. | Yes |
| **#47** Actions Taken database foundation, migration, seed | [#54](https://github.com/SinghLemonH/toktickit/pull/54) | Great work on this PR! The migration and rollback look well covered, and I like that the seed data is idempotent and includes realistic ticket scenarios. The Actions Taken APIs also handle important edge cases like role-based access, optimistic locking, and idempotency keys. Having all 133 server tests and 47 client tests passing is a solid result. Overall, everything looks well tested and ready to go. | Acknowledged. All acceptance criteria and tests for Actions Taken foundation, migration, rollback, and seed verified. Moving forward to Issue #48. | Yes |
| **#48** Ticket workflow, resolution gate, history | [#55](https://github.com/SinghLemonH/toktickit/pull/55) | This PR is a solid implementation of the ticket lifecycle work in issue #48: centralized status-transition rules, a pure resolution gate, optimistic concurrency (expectedVersion + 409 STALE_UPDATE), requester reopen behavior, and append-only ticket history tracking. The patch is well-scoped and consistent with the stated contract, and the test evidence is strong: the workflow unit tests and API tests are listed as passing, with the broader server/client regressions also reported as green. | Acknowledged. Ticket workflow transition matrix, pure resolution gate validator, optimistic locking (409), requester reopen with advisory flag reset, and status history audit trail verified with 100% test pass rate. Merged and proceeding to Issue #49. | Yes |
| **#49** Role-based dashboards backend API | [#56](https://github.com/SinghLemonH/toktickit/pull/56) | Assessment: This looks ready to merge. The PR is focused, well-scoped, and aligned with the Lab 4 dashboard contract: it adds the requester and staff dashboard APIs, enforces role-based access, and introduces the statusGroup=active and itPriority=none filtering semantics in the ticket list queries. Scope is narrow and coherent: dashboard routes, server filtering logic, and test coverage. Risk level: low. | Acknowledged. Backend dashboard endpoints, server-side database aggregations, list filtering parity (statusGroup=active, itPriority=none), and full test coverage verified with 100% pass rate. Merged and proceeding to Issue #50. | Yes |
| **#50** Actions Taken UI on ticket detail | [#57](https://github.com/SinghLemonH/toktickit/pull/57) | Pending review | Pending response | Pending |
| **#51** Dashboards UI, navigation, Lab 2 cleanup | [#58](https://github.com/SinghLemonH/toktickit/pull/58) | Role-aware dashboard pages, metric cards with drill-down links, dashboard-first navigation, visible access-denied handling, Lab 2 cleanup, requester recent and attention panels, staff queue metrics, recent activity, and administrator user counts. | Acknowledged. Role-specific dashboard routing, metric panels, drill-down navigation, administrator user counts, and navigation cleanup were reviewed. PR #58 merged into `lab4-staging`; proceeding to Issue #52. | Yes |
| **#52** Final hardening, multi-viewport E2E, release QA | To be recorded upon PR creation | Pending review | Pending response | Pending |
| **Release** `lab4-staging` to `main` | To be recorded upon release PR | Pending review | Pending response | Pending |

## Detailed Review Threads

### Pull Request #53 (Issue #46)
- **Reviewer**: @WATHITx
- **Decision**: Approved and merged into `lab4-staging`.
- **Reviewer Summary**: "This is a baseline/specification PR for Sprint 4, not a feature-implementation PR. The main changes are updating AGENTS.md to the Sprint 4 contract and continuity guidance, adding the Lab 4 documentation set under docs/lab-04, and setting fileParallelism: false in server/vitest.config.ts to reduce flaky parallel test runs. Status: Ready to merge as a baseline/specification PR. Risk level: Low."
- **Author Response**: Baseline specifications, test matrix, and zero-defect baseline confirmed. Implementation begins on Issue #47.

### Pull Request #54 (Issue #47)
- **Reviewer**: @WATHITx
- **Decision**: Approved and merged into `lab4-staging`.
- **Reviewer Summary**: "Great work on this PR! The migration and rollback look well covered, and I like that the seed data is idempotent and includes realistic ticket scenarios. The Actions Taken APIs also handle important edge cases like role-based access, optimistic locking, and idempotency keys. Having all 133 server tests and 47 client tests passing is a solid result. Overall, everything looks well tested and ready to go."
- **Author Response**: Actions Taken schema, reversible rollback, idempotent seed, and REST endpoints verified with 100% test pass rate. Merged and proceeded to Issue #48.

### Pull Request #55 (Issue #48)
- **Reviewer**: @WATHITx
- **Decision**: Approved and merged into `lab4-staging`.
- **Reviewer Summary**: "This PR is a solid implementation of the ticket lifecycle work in issue #48: centralized status-transition rules, a pure resolution gate, optimistic concurrency (expectedVersion + 409 STALE_UPDATE), requester reopen behavior, and append-only ticket history tracking. The patch is well-scoped and consistent with the stated contract, and the test evidence is strong: the workflow unit tests and API tests are listed as passing, with the broader server/client regressions also reported as green."
- **Author Response**: Acknowledged. Single source of truth transition matrix, pure resolution gate evaluation, atomic version increment, Requester reopen with advisory flag reset, and append-only status audit trail verified with 100% test pass rate across all 160 server tests and 47 client tests. Merged and proceeding to Issue #49.

### Pull Request #56 (Issue #49)
- **Reviewer**: @WATHITx
- **Decision**: Approved and merged into `lab4-staging`.
- **Reviewer Summary**: "Assessment: This looks ready to merge. The PR is focused, well-scoped, and aligned with the Lab 4 dashboard contract: it adds the requester and staff dashboard APIs, enforces role-based access, and introduces the statusGroup=active and itPriority=none filtering semantics in the ticket list queries. Summary: Scope is narrow and coherent: dashboard routes, server filtering logic, and test coverage. The changes line up with the PR description and the repo's Lab 4 requirements. The author explicitly calls out that UI synchronization and E2E journeys are intentionally out of scope for this backend PR, which is a good boundary. Core changes: Requester dashboard API in server/src/routes/dashboard.ts, Scoped metrics, attention tickets, recent tickets, Bangkok timezone, and drill-down links. Staff dashboard API in the same file: Operational counts, recent activity, and admin-only user counts. Filter parity updates in server/src/app.ts and server/src/routes/staffTickets.ts: statusGroup=active with intersection logic, itPriority=none handling, compatibility with both status and currentStatus. Test coverage added in server/tests/lab-04: requester dashboard API tests, staff dashboard API tests, performance smoke test. Merge readiness: Risk level: low. Reasoning: server-side contract work only, no migration-heavy or cross-cutting refactor, and the PR description reports passing tests. I did not identify a blocking issue in the diff after review. The main follow-up is not a blocker but a validation step: confirm the frontend query string sync matches the backend contract before the UI PR is considered complete."
- **Author Response**: Acknowledged. Role-based dashboard APIs, server-side database calculation via $transaction (BR-21), list query filtering parity with strict intersection and itPriority=none, zero-state handling, and automated test coverage across DASH-01 through DASH-06, DASH-SEC, and PERF-01 verified with 100% test pass rate. Merged into lab4-staging and proceeding to Issue #50.

### Pull Request #57 (Issue #50)
- **Reviewer**: @WATHITx
- **Decision**: Pending review.
- **Reviewer Summary**: To be recorded.
- **Author Response**: Pending response.

### Pull Request #58 (Issue #51)
- **Reviewer**: @WATHITx
- **Decision**: Approved and merged into `lab4-staging`.
- **Reviewer Summary**: "This PR adds the role-aware dashboard experience and route-level access control for the app. It adds requester and staff dashboard pages with metric cards and drill-down links, changes navigation to a dashboard-first flow, updates unauthorized-role handling, and removes obsolete Lab 2 navigation. The Requester Dashboard includes aggregated ticket metrics, recent tickets, and quick actions. The Staff Dashboard includes queue metrics, recent operational activity, and administrator-only user account counts. The `/dashboard` route is added and the root route redirects to it, with staff and administrator route guards refined."
- **Author Response**: Acknowledged. Role-specific dashboard routing, metric panels, drill-down navigation, administrator user counts, and navigation cleanup were reviewed. PR #58 merged into `lab4-staging`; proceeding to Issue #52.
