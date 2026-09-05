# Peer Review Record — Lab 2 (TokTickIT)

## Reviewer Details

| Field           | You                        | Partner                        |
|------------------|-----------------------------|----------------------------------|
| Name             | Wichitchai Suwanno          | Wathit Tritsananawakit           |
| Student ID       | 67070403439                 | 67070503495                      |
| GitHub Username  | SinghLemonH                 | WATHITx                          |

## Pull Requests Reviewed

Keep this table updated as each PR is opened, reviewed, and merged — fill it in as it happens, not
all at once at the end.

### PRs partner reviewed (on SinghLemonH/toktickit)

| PR | Issue | Outcome |
|----|-------|---------|
| [SinghLemonH/toktickit #19 — feature/12-lab2-spec-docs](https://github.com/SinghLemonH/toktickit/pull/19) | Issue #12 (Spec DD & Test DD) | Merged — 3 minor follow-ups noted, addressed in Issue #13 |
| [SinghLemonH/toktickit #20 — feature/13-extend-lab1-repo](https://github.com/SinghLemonH/toktickit/pull/20) | Issue #13 (Extend Lab 1 Repo) | Approved & Merged |
| [SinghLemonH/toktickit #23 — feature/14-requester-context](https://github.com/SinghLemonH/toktickit/pull/23) | Issue #14 (Dev Requester Context) | Approved & Merged |
| [SinghLemonH/toktickit #24 — feature/15-create-tickets](https://github.com/SinghLemonH/toktickit/pull/24) | Issue #15 (Create Ticket) | Approved & Merged |
| [SinghLemonH/toktickit #25 — feature/16-my-tickets](https://github.com/SinghLemonH/toktickit/pull/25) | Issue #16 (My Tickets) | Approved & Merged |
| [SinghLemonH/toktickit #26 — feature/17-design-refresh](https://github.com/SinghLemonH/toktickit/pull/26) | Issue #17 (Ticket Detail + Attachments) | Approved & Merged |
| _add row per PR_ | | |

### PRs you reviewed (on WATHITx/toktickit)

| PR | Issue | Outcome |
|----|-------|---------|
| [WATHITx/toktickit #21 — docs: Spec DD & Test DD](https://github.com/WATHITx/toktickit/pull/21) | Spec DD & Test DD (partner's copy) | Reviewed in rounds — see comments below |
| _add row per PR_ | | |

---

## Direction 1 — Partner reviewed your Pull Requests

### PR #19 — feature/12-lab2-spec-docs (Spec DD & Test DD)
**Partner's comment:**
> Add a quick reference/getting-to-know guide section to the AGENTS.md file for developers. The current
> AGENTS.md file is detailed but rather concise (76 lines). Consider adding a short TL;DR summary at the
> top: "Read this before writing any code. Important: Extend Lab 1, do not restructure. Write tests
> first. See section 8.9 of the documentation." This isn't a hindrance, but it would make it easier for
> humans (not just AI agents) to get started.
>
> In the specification.md file, add a subsection "Questions for Reviewers." The requirements are locked
> in and signed by the authors, but there's no explicit call for reviewers to provide final feedback
> before Issue #2 begins. Feedback: After the DoD, add: "Please confirm: Does this contract cover all
> the terms specified? Are scope exclusions acceptable? Are any ACs in conflict with the requirements in
> the documentation?" This isn't a hindrance — the checklist in the PR description already serves this
> purpose — but clearer "signing gate" language would enhance the requirements-driven approach.
>
> Clearly clarify the ticket numbering format in special cases in the api-spec.md file. The requirements
> state that... TKT-YYYY-NNNNNN (adding leading zeros makes it 6 digits), but it doesn't clearly state:
> what happens when 1 million tickets are processed in a year? (Exceeding the limit → 7 digits?) Note:
> the tests in Lab 2 won't reach 1 million tickets, so this is an issue that needs improvement to
> support future documentation. It's not a problem that hinders workflow, but adding a note like
> "assuming fewer than 1 million tickets per year" makes sense.
>
> The commented part isn't a major issue, but a minor detail that can be overlooked. Do you want to fix
> it? If not, please let me know and I will approve the request.

**Your response:** Agreed all three points were reasonable improvements, not blockers. Told partner to
merge now; the three follow-ups (AGENTS.md TL;DR, "Questions for Reviewers" section, ticket-number
edge-case note) would be addressed as a small documentation commit at the start of Issue #13, so as not
to hold up the merge.

**Partner's response:** "I think your workflow is fine for now. I will merge it and wait for your first
draft." Merged PR #19 into `lab2-staging`.

---

## Direction 2 — You reviewed Partner's Pull Requests

### PR #21 — docs: Spec DD & Test DD
**Your comment (api-spec.md):**
> Approving — no blockers. A few things worth flagging for later issues, not this PR:
> 1. Ticket Number sequence isn't year-scoped — decide now whether it resets per year, since changing
>    it later touches the schema too.
> 2. Ownership failures return 403, which confirms the resource exists to a non-owner. Consider 404
>    instead for a tighter security posture (not required, just safer).
> 3. "Retrieve Attachment metadata" is listed as its own required API capability in the handout — right
>    now it's only reachable via GET /api/tickets/:id. Might be worth adding a dedicated endpoint so
>    it's unambiguous for grading.
> 4. Error response shape isn't consistent ({ "error": string } vs { "errors": object }) — worth
>    picking one now before the frontend builds error handling around it.
> None of these block merging the spec — just want them on record before implementation starts.

**Your comment (ui-spec.md, partial review):**
> Reviewed Sections 1–3 (Color Tokens, Typography/Spacing, Component States) so far. Values are concrete
> and testable (16px base font, defined spacing scale, distinct read-only/invalid/disabled states) —
> good implementable detail. Question: color tokens are named `--color-primary` etc. rather than
> overriding Bootstrap's own `--bs-*` variables — need to confirm these actually get applied to
> Bootstrap components, or Bootstrap's built-in classes won't pick up the Zen Green theme automatically.
> Haven't yet reviewed the remaining sections (badges, per-screen layout, responsive rules,
> accessibility) — pending partner sharing the rest of the file for full sign-off.

**Partner's response:** _pending — update once partner replies/fixes and the remaining sections are
reviewed._

---

## Notable Comments and Resolutions

- PR #19: partner flagged AGENTS.md brevity, missing reviewer sign-off language in specification.md,
  and an undocumented ticket-number overflow edge case → agreed to fix in a follow-up commit rather
  than block the merge; tracked as the first task of Issue #13.
- PR #21: flagged a real ownership gap risk pattern (403 vs 404) and a possible spec/schema
  consistency question (ticket-number year scoping) for the partner's independent implementation —
  non-blocking, partner's call on how to resolve.

## Sign-off

- [x] Issue #12 / PR #19 reviewed and merged (follow-ups tracked for Issue #13)
- [ ] PR #21 fully reviewed (all 4 files) and approved
- [ ] All remaining Lab 2 Issues (#13–#18) reviewed and approved
- [ ] Final release PR (`lab2-staging → main`) reviewed and approved
- [ ] Reviewer confirms all required tests pass on the final `main` branch