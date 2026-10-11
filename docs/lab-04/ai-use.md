# Lab 4 AI Collaboration and Reflection

## 1. Tooling Disclosure

- **Platform**: Google Antigravity Agentic Platform
- **Model**: Google Gemini (Pro and Flash)
- **Methodology**: Spec-Driven Development (Spec DD) and Test-Driven Development (TDD)
- **Primary Agents**:
  - Specification Agent: Responsible for architectural requirement decomposition, invariant definition, edge-case analysis, and RFC drafting.
  - Coding Agent: Responsible for strict test-first implementation, test execution, regression verification, and code refactoring.

---

## 2. Selected Key Prompts Portfolio

The following 8 prompts represent key senior prompt engineering interactions across Sprint 4:

| # | Stage / Role | Senior Prompt Summary and Context | Invariants and Spec References | Outcome and Modifications |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Architecture / Principal Architect | Act as a Principal Systems Architect. Decompose Lab 4 requirements into a staged sprint plan. Define clear boundaries, data evolution strategies, and state transition invariants. | Handout Sec 4; FR-01..20; zero em dashes; strictly formal English. | Kept 7-issue staged plan; enforced base branch `lab4-staging` and strict PR peer review flow. |
| **2** | Security / Security Engineer | Act as a Senior Security Engineer. Review Sprint 4 RBAC rules. Specify Express middleware authorization for Actions Taken and Dashboards. Enforce that Requesters only read their own Actions and cannot access Internal Notes. | BR-03, BR-05, BR-21; HTTP 401/403 status codes; session-derived actor identity. | Defined session-only `performedById` extraction; rejected client-provided actor spoofing; ensured strict 403 on role mismatches. |
| **3** | Database / Data Architect | Act as a PostgreSQL and Prisma Data Architect. Design the `ActionTaken` and `TicketStatusHistory` models with optimistic concurrency support. Ensure backward compatibility with Lab 1, 2, and 3 data. | Spec Sec 7; `Ticket.version`; composite indexes; additive migrations; idempotent seed. | Added composite indexes `(ticketId, actionAt)` and `(assigneeId, status)`; crafted safe additive SQL migration and rollback script. |
| **4** | Workflow / Domain Modeler | Act as a Backend Domain Modeler. Define the Ticket status transition engine and Resolution Gate. The gate must mandate an assigned owner, at least one completed Action, and zero planned Actions before moving to Resolved. | BR-11, BR-12, BR-14; HTTP 400 with structured validation reasons; append-only history. | Centralized transition logic into `ticketWorkflow.ts`; added transaction-bound history logging and version incrementing. |
| **5** | Concurrency / Systems Engineer | Act as a Concurrency Specialist. Implement optimistic locking for ticket status transitions and Action Taken edits using `expectedVersion`. Prevent mid-air collisions without locking tables. | BR-17; HTTP 409 `STALE_UPDATE`; client retry semantics. | Used atomic conditional update `updateMany` checking `version`; returned `currentVersion` on 409 conflict so client can offer reload. |
| **6** | Analytics / Backend Engineer | Act as a Backend Performance Engineer. Implement aggregate metric endpoints `GET /api/dashboard/requester` and `GET /api/dashboard/staff`. Query authoritative database records using Prisma `count` and `groupBy`. | BR-18..22; Asian/Bangkok timestamp normalization; response time under 500ms (PERF-01). | Avoided in-memory collection filtering; used parallel database aggregation; verified 1:1 parity with raw SQL counts. |
| **7** | Frontend / UX Engineer | Act as a Senior React Engineer. Create the `ActionsTakenSection` and Dashboard views styled with Zen Green design tokens. Implement inline forms, double-click save prevention, and error summaries. | UI-01..11; accessibility labels; responsive viewports (1280px, 768px, 375px). | Built responsive card-and-table views; bound aria attributes; guaranteed form preservation upon recoverable errors. |
| **8** | QA / Test Automation Architect | Act as an E2E Test Architect. Construct Playwright end-to-end user journeys for Actions Taken and ticket resolution. Verify multi-viewport responsiveness and ensure zero regressions across Labs 1 to 3. | AC-01..19; E2E-01..07; 100% green test pyramid. | Automated full lifecycle flow from creation to resolution and requester reopen; captured responsive screenshot artifacts. |

---

## 3. Engineering Reflection (My Reflection)

### Dual-Agent Synergy: Specification Agent vs Coding Agent
Working across Sprint 4 demonstrated the power of separating AI assistance into two distinct, sequential phases:
1. **The Specification Agent Phase**: Utilizing the model as a systems architect before writing any executable code was crucial. By prompting the model to explore boundary conditions (such as clock skew allowances on `actionAt`, concurrent writer race conditions, and inactive user assignments), we produced a bulletproof specification. This upfront rigor eliminated hallucinated requirements and scope creep.
2. **The Coding Agent Phase**: Once the specification and test traceability matrix were locked, the coding agent operated under tight constraints. By providing the specification contract as an invariant guardrail, the coding agent wrote tests first (TDD) and implemented minimal, clean code to satisfy them. This prevented architectural drift and preserved backward compatibility with Lab 1 through Lab 3 code.

### Human-in-the-Loop Oversight
While agentic AI accelerated implementation and test authoring, human engineering oversight remained indispensable:
- **Architectural Validation**: Evaluating database indexing strategies and ensuring that migrations did not lock tables or drop legacy columns required human discernment.
- **Security Invariant Verification**: Verifying that authorization was strictly enforced at the Express layer rather than relying on frontend UI visibility checks required diligent code review.
- **Quality and Standards Enforcement**: Catching subtle defects, such as Vitest database test concurrency flakiness and enforcing the strict zero em dash rule, proved that the human engineer remains the ultimate quality gatekeeper.
