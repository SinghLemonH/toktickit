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
| **#49** Role-based dashboards backend API | To be recorded upon PR creation | Pending review | Pending response | Pending |
| **#50** Actions Taken UI on ticket detail | To be recorded upon PR creation | Pending review | Pending response | Pending |
| **#51** Dashboards UI, navigation, Lab 2 cleanup | To be recorded upon PR creation | Pending review | Pending response | Pending |
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
