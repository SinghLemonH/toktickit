# AI Use and Reflection — Lab 3

> **AI Pair Programmer**: Google Gemini (via Google Antigravity Agentic Platform)  
> **Methodology**: Spec-Driven Development (Spec DD), Test-Driven Development (TDD), and Architectural Invariant Verification.

---

## 1. Selected Key Prompts (Prompt Engineering Portfolio)

Below is a curated selection of senior prompt engineering interactions used to guide the AI assistant through the specification and architecture phases of Lab 3. Each prompt demonstrates deliberate contextual framing, constraint specification, and security guardrail enforcement.

### Prompt 1: Strategic Architecture Alignment & Trade-Off Analysis
> *"Act as a Principal Software Architect. We are transitioning TokTickIT from Lab 2's development requester selector to enterprise-grade Authentication and Role-Based Access Control (RBAC) supporting Requester, IT Staff, and Administrator. Analyze the architectural trade-offs between HTTP-only secure cookie sessions versus Bearer JWT in client memory/storage, with specific emphasis on XSS mitigation, CSRF implications, and seamless automated Playwright E2E execution. Present the recommended approach alongside strict invariant rules for our stack (Express + TypeScript + Prisma + React).*

### Prompt 2: Formal Engineering Contract Synthesis (Spec DD)
> *"Draft the formal engineering specification for Sprint 3 adhering strictly to the CPE 334 course rubric. Structure the document into the 11 mandatory RFC-style sections. Explicitly define: (1) Numbered Functional Requirements (FR-01+) covering authentication, dual-channel communication, staff ticket operations, and admin user management; (2) Invariant Business Rules (BR-01+) including admin self-deactivation guards and last-admin survival guarantees; (3) Data evolution migrating DevRequester to User without data loss; and (4) Observable Acceptance Criteria (AC-01+) that directly map to automated verification.*

### Prompt 3: Defensive REST API Contract Design
> *"Design the complete REST API contract under `/api` in `docs/lab-03/api-spec.md`. Enforce uniform JSON error responses `{ error: { code, message, details } }`. Ensure all endpoints specify exact HTTP methods, request/response payloads, authentication mechanisms, and server-side RBAC guards. Critically, ensure that Requester attempts to query Internal Notes or other users' private tickets return clean 403 or 404 responses without leaking resource existence or metadata.*

### Prompt 4: Cross-Session Continuity & Agent Workflow Engineering
> *"Refactor `AGENTS.md` to establish a persistent Quick Resume Board and operational playbook for any incoming AI agent across arbitrary conversation contexts. Define exact inspection commands (`git branch --show-current`, `git status`, test baseline execution), strict git branching topology (`feature/<issue>` -> `lab3-staging` -> `main`), and non-negotiable boundaries (zero hard user deletes, mandatory first-login password change, pure English technical documentation). The guide must enable any AI subagent to resume development immediately without hallucination or duplicate effort.*

### Prompt 5: Test-Driven Verification Matrix Formulation
> *"Construct the end-to-end Test Traceability Matrix in `docs/lab-03/tests.md` bridging each defined Acceptance Criterion (AC-01 through AC-20) to concrete automated test files across the three-tier pyramid: Supertest API suites (`server/tests/lab-03/`), React Testing Library component suites (`client/src/tests/lab-03/`), and Playwright E2E journeys (`e2e/lab-03/`). Specify preconditions, test inputs, and deterministic assertions for every test ID.*

---

## 2. My Reflection

Working with an AI coding partner using Spec-Driven Development (Spec DD) on Lab 3 transformed our development velocity while significantly elevating architectural discipline. In complex enterprise domains like multi-role ticketing systems with dual-channel messaging and security invariants, relying on casual conversational prompting frequently leads to subtle edge-case omissions.

By adopting a **Senior Prompt Engineering** paradigm—explicitly declaring domain invariants, security threat models (such as preventing user enumeration and enforcing last-admin protection), and precise interface contracts before writing production code—the AI functioned not as an unguided generator, but as a high-precision technical amplifier.

The primary engineering insights gathered during this phase include:
1. **Contract-First Rigor Prevents Scope Creep**: Setting up `specification.md`, `api-spec.md`, and `ui-spec.md` upfront eliminated ambiguity between backend route guards and frontend role-based rendering.
2. **Context Continuity Architecture**: Embedding a persistent state tracker inside `AGENTS.md` solved the common failure mode of AI context loss across conversation resets, guaranteeing seamless handoffs between sprints.
3. **Defensive Security by Design**: Directing the AI to incorporate server-side RBAC validation independently of UI controls ensured that "hiding a button is not authorization" remained an uncompromised system invariant.
