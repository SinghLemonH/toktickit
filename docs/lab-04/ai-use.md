# Lab 4 AI Collaboration and Reflection

## 1. Tooling Disclosure

- **Primary Platform**: Google Antigravity Agentic Platform
- **Primary Model**: Google Gemini (Pro and Flash)
- **Peer Review & Specification Advisor Model**: Anthropic Claude (via Claude Code)
- **Methodology**: Spec-Driven Development (Spec DD) and Test-Driven Development (TDD)
- **Primary Roles**:
  - Specification Agent: Decomposes requirements, evaluates edge cases, drafts contracts, and performs peer review critique.
  - Coding Agent: Implements automated test suites first (TDD), writes minimal compliant code, and resolves regressions.

---

## 2. Selected Key Prompts Portfolio

The following prompts document senior prompt engineering interactions during Sprint 4 (paraphrased for formal clarity):

| # | Stage / Role | Senior Prompt Context and Instruction | Invariants and Spec References | Outcome and Modifications |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Architecture / Principal Architect | "Act as a Principal Systems Architect. Analyze the CPE 334 Lab 4 handout. Decompose the sprint into a staged execution plan of 7 issues. Define hard architectural boundaries, state transition rules, and integration flow into lab4-staging." | Handout Sec 4, 11; FR-01..20; strictly formal English; zero em dashes. | Established 7-issue staged plan; enforced base branch `lab4-staging` and strict PR peer review flow. |
| **2** | Security / Security Engineer | "Act as a Senior Security Engineer. Audit Sprint 4 RBAC rules. Specify Express middleware authorization for Actions Taken, Workflow, and Dashboards. Enforce that Requesters accessing other users tickets receive 404 rather than 403 to prevent ticket ID enumeration." | BR-03, BR-04, BR-22; HTTP 401/403/404; session actor extraction. | Enforced session-only `performedById` extraction; returned 404 for unowned tickets to prevent ID enumeration. |
| **3** | Database / Data Architect | "Act as a PostgreSQL and Prisma Data Architect. Design the `ActionTaken` and `TicketStatusHistory` models with optimistic concurrency support. Ensure backward compatibility with Lab 1, 2, and 3 data. Include rollback SQL script and composite indexes." | Spec Sec 7; `Ticket.version @default(0)`; composite indexes; additive migrations; rollback SQL. | Added composite indexes `(ticketId, actionAt)` and `(assigneeId, status)`; planned safe additive SQL migration and rollback script. |
| **4** | Specification / Technical Lead | "Act as a Lead Software Engineer. Consolidate and refine the Sprint 4 engineering contract across `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md`. Ensure strict alignment with the course rubric and existing Lab 2 and 3 error conventions." | Standard error format `{ error: { code, message, fields? } }`; parity query filters; zero em dashes. | Unified contracts across all 4 documents; harmonized error payloads with Lab 2 and Lab 3 conventions. |
| **5** | Domain Workflow / Systems Architect | "Act as a Domain Modeler. Formulate the Ticket status transition matrix and server-side Resolution Gate. Ensure transitions to Resolved strictly require an assigned owner, at least one completed Action Taken, and zero planned Actions Taken. Guard ticket assignments against removing owners on resolved tickets." | BR-11, BR-12, BR-17, BR-18; 400 `RESOLUTION_GATE_NOT_MET`; 400 `TICKET_LOCKED`. | Implemented centralized workflow rules in `server/src/domain/workflow.ts`, with transactional state changes and version increments. |
| **6** | Peer Review & Critique / Claude Advisor | "Critique the draft contracts against all rubric criteria. Identify any discrepancies in error payloads, missing dashboard states, unhandled concurrency edge cases on ticket assignments, future action dating, and test runner directory alignment." | Handout Sec 4..12; Answer Part 1..9; theme.css token inspection; vitest config. | Caught assignment bypass on resolved tickets, future dating on planned vs completed actions, completedById attribution, and unassigned dashboard card gap. |

---

## 3. Engineering Reflection (My Reflection)

### Dual-Agent Synergy: Specification Agent vs Coding Agent
Working across Sprint 4 demonstrates the value of dividing AI collaboration into two distinct, sequential phases:
1. **The Specification Agent Phase**: Utilizing the model as a systems architect before writing any executable code was crucial. In our initial specification draft, several subtle edge cases were identified through iterative critique: preventing ticket owner removal on resolved tickets, differentiating future date bounds between planned and completed actions, tracking actual work completion via `completedById`, and ensuring strict error schema parity with earlier sprints. Through collaborative prompt engineering and peer review, the specification agent helped refine the contract into an internally consistent engineering blueprint.
2. **The Coding Agent Phase**: Once the specification and test traceability matrix are locked, the coding agent will operate under strict constraints. By providing the specification contract as an invariant guardrail, the coding agent will write automated tests first (TDD) and implement minimal, compliant code to satisfy them. This methodology prevents architectural drift and preserves backward compatibility with Lab 1 through Lab 3 code.

### Human-in-the-Loop Oversight
While agentic AI accelerated specification drafting and edge-case discovery, human engineering oversight remained indispensable:
- **Architectural Validation**: Evaluating database indexing strategies and ensuring that migrations do not lock tables or drop legacy columns required human discernment.
- **Security Invariant Verification**: Verifying that authorization was strictly enforced at the Express layer rather than relying on frontend UI visibility checks required diligent code review.
- **Quality and Standards Enforcement**: Enforcing strict course rules, such as zero Unicode em dashes, verifiable test paths, and authentic peer review records, proved that the human engineer remains the ultimate quality gatekeeper.
