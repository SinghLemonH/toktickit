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

The following prompts document senior prompt engineering interactions during Sprint 4:

| # | Stage / Role | Senior Prompt Summary and Context | Invariants and Spec References | Outcome and Modifications |
| :---: | :--- | :--- | :--- | :--- |
| **1** | Architecture / Principal Architect | Act as a Principal Systems Architect. Decompose Lab 4 requirements into a staged sprint plan. Define clear boundaries, data evolution strategies, and state transition invariants. | Handout Sec 4; FR-01..20; zero em dashes; strictly formal English. | Established 7-issue staged plan; enforced base branch `lab4-staging` and strict PR peer review flow. |
| **2** | Security / Security Engineer | Act as a Senior Security Engineer. Review Sprint 4 RBAC rules. Specify Express middleware authorization for Actions Taken and Dashboards. Enforce that Requesters only read their own Actions and cannot access Internal Notes. | BR-03, BR-05, BR-21; HTTP 401/403 status codes; 404 on unowned tickets. | Enforced session-only `performedById` extraction; returned 404 for unowned tickets to prevent ID enumeration. |
| **3** | Database / Data Architect | Act as a PostgreSQL and Prisma Data Architect. Design the `ActionTaken` and `TicketStatusHistory` models with optimistic concurrency support. Ensure backward compatibility with Lab 1, 2, and 3 data. | Spec Sec 7; `Ticket.version @default(0)`; composite indexes; additive migrations; rollback SQL. | Added composite indexes `(ticketId, actionAt)` and `(assigneeId, status)`; planned safe additive SQL migration and rollback script. |
| **4** | Specification / Technical Lead | Act as a Lead Software Engineer. Consolidate and refine the Sprint 4 engineering contract across `specification.md`, `api-spec.md`, `ui-spec.md`, and `tests.md`. Ensure strict alignment with the course rubric. | Standard error format `{ error: { code, message, fields? } }`; parity query filters; zero em dashes. | Unified contracts across all 4 documents; harmonized error payloads with Lab 2 and Lab 3 conventions. |

*(Additional prompts will be logged chronologically as subsequent feature issues are implemented).*

---

## 3. Engineering Reflection (My Reflection)

### Dual-Agent Synergy: Specification Agent vs Coding Agent
Working across Sprint 4 demonstrates the value of dividing AI collaboration into two distinct, sequential phases:
1. **The Specification Agent Phase**: Utilizing the model as a systems architect before writing any executable code was crucial. By prompting the model to explore boundary conditions (such as clock skew allowances on `actionAt`, concurrent writer race conditions, and inactive user assignments), we produced a bulletproof specification. This upfront rigor eliminated hallucinated requirements and scope creep.
2. **The Coding Agent Phase**: Once the specification and test traceability matrix were locked, the coding agent operated under tight constraints. By providing the specification contract as an invariant guardrail, the coding agent writes tests first (TDD) and implements minimal, clean code to satisfy them. This prevents architectural drift and preserves backward compatibility with Lab 1 through Lab 3 code.

### Human-in-the-Loop Oversight
While agentic AI accelerated implementation and documentation drafting, human engineering oversight remained indispensable:
- **Architectural Validation**: Evaluating database indexing strategies and ensuring that migrations did not lock tables or drop legacy columns required human discernment.
- **Security Invariant Verification**: Verifying that authorization was strictly enforced at the Express layer rather than relying on frontend UI visibility checks required diligent code review.
- **Quality and Standards Enforcement**: Catching subtle defects, such as Vitest database test concurrency flakiness and enforcing the strict zero em dash rule, proved that the human engineer remains the ultimate quality gatekeeper.
