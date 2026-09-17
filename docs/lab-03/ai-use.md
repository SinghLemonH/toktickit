# AI Use and Reflection: Lab 3

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

### Prompt 6: Zero-Downtime Data Migration & Expand-Contract Schema Evolution (Issue #30)
> *"Act as a Staff Database Reliability Engineer. Execute the database evolution for Issue #30 on `feature/30-db-migration-and-seed`. Evolve the relational schema to introduce `User`, `Role`, `Comment`, and `InternalNote` models with cascade safety and indexed foreign keys while updating `Ticket` relations. To maintain strict backward compatibility without breaking existing Lab 2 API tests and middleware, apply an Expand-and-Contract migration pattern: retain `DevRequester` during this transitional phase, execute an atomic SQL data migration copying existing development requesters into `User` with compliant initial bcrypt hashes and synchronized serial sequences, and transition `Ticket.requesterId` cleanly to `User.id`. Finally, write an idempotent seed script provisioning realistic users across all three roles and realistic ticket distributions."*

### Prompt 7: Defense-in-Depth Authentication & Mandatory First-Login Password Lifecycle (Issue #31)
> *"Act as a Principal Application Security Engineer. Implement Issue #31 on `feature/31-auth-and-password-change`. Construct the enterprise authentication engine using cryptographically signed HTTP-only cookies (`toktickit_session`), strict bcrypt credential verification, and server-side session parsing. Enforce defense-in-depth against account enumeration by returning identical generic 401 errors for both unknown accounts and inactive users. Build strict route guards that detect `mustChangePassword: true` and quarantine access to the Change Password screen with real-time complexity validation (minimum 8 characters, uppercase, lowercase, numeric, and symbol). Finally, implement the Zen Green Login and Change Password React views, backed by comprehensive Supertest and React Testing Library suites."*

---

## 2. My Reflection

Working with an AI coding partner using Spec-Driven Development (Spec DD) on Lab 3 transformed our development velocity while significantly elevating architectural discipline. In complex enterprise domains like multi-role ticketing systems with dual-channel messaging and security invariants, relying on casual conversational prompting frequently leads to subtle edge-case omissions.

By adopting a **Senior Prompt Engineering** paradigm: explicitly declaring domain invariants, security threat models (such as preventing user enumeration and enforcing last-admin protection), and precise interface contracts before writing production code - the AI functioned not as an unguided generator, but as a high-precision technical amplifier.

The primary engineering insights gathered during this phase include:
1. **Contract-First Rigor Prevents Scope Creep**: Setting up `specification.md`, `api-spec.md`, and `ui-spec.md` upfront eliminated ambiguity between backend route guards and frontend role-based rendering.
2. **Context Continuity Architecture**: Embedding a persistent state tracker inside `AGENTS.md` solved the common failure mode of AI context loss across conversation resets, guaranteeing seamless handoffs between sprints.
3. **Defensive Security by Design**: Directing the AI to incorporate server-side RBAC validation independently of UI controls ensured that "hiding a button is not authorization" remained an uncompromised system invariant.
4. **Backward-Compatible Schema Evolution (Expand-and-Contract)**: Migrating relational models without breaking prior sprint test suites requires disciplined staging. Retaining `DevRequester` during the transition while migrating ticket foreign keys cleanly to `User` and synchronizing sequence IDs ensured 100% regression pass rates across all Lab 1 and Lab 2 automated suites.
5. **Stateful Security with Stateless Ergonomics**: Establishing signed HTTP-only cookies while maintaining an active-user database verification layer combined the security advantages of server-managed sessions with the operational simplicity of cookie tokens. Quarantining accounts flagged with initial passwords at the middleware level prevented unauthorized API access even if client-side route guards were bypassed.
