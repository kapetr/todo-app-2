# Incident Report: Duplicate issue proliferation in `todo-app-2`

**Date observed:** 2026-05-20
**Repo:** `kapetr/todo-app-2`
**Symptom:** What started as ~8 PRD-derived issues grew to **31 issues**, with the same scope re-decomposed four times and CI/CD work re-filed as new tickets ten times. The product itself shipped successfully — the damage is contained to issue-tracker noise and wasted heartbeat cycles.

---

## 1. What happened

The PRD (#1, *Simple Todo App*) was decomposed by `/to-issues` on four separate occasions, each producing a fresh set of tickets covering the **same** scope:

| Scope | Run 1 — 05-19 14:09 | Run 2 — 05-19 14:57 | Run 3 — 05-19 21:58 | Run 4 — 05-20 01:26 |
|---|---|---|---|---|
| Bootstrap / scaffold       | #2 | #17 | #33 | #43 |
| Core CRUD + localStorage   | #3 | #18 | #34 | #44 |
| Inline edit todo           | **#5** | **#20** | **#35** | **#45** |
| Filter view                | #7 | #21 | #36 | #46 |
| Toggle / counts / delete   | #4, #6 | #19 | — | — |
| Polish                     | #8 | — | — | — |

Separately, CI/CD for GitHub Pages was filed as a *new* ticket every time a previous attempt failed or got revisited:

`#22 → #29 → #31 → #41 → #50 → #51 → #53 → #55 → #57 → #59`

All 31 issues are now CLOSED. 28 PRs merged. The app is live at https://kapetr.github.io/todo-app-2/.

---

## 2. Root cause analysis

The agent's heartbeat orchestrator (`HEARTBEAT.md`) has two structural gaps and one behavioural gap.

### 2.1 Gap: no "PRD already decomposed" check

`HEARTBEAT.md` § *Orchestrate Work First* only inspects labels:

1. Is there a ticket with `working`? → implement.
2. Is there a ticket with `needs review`? → review.
3. Otherwise → pick the next unblocked ticket.

It never asks **"does the existing backlog (open *and* closed) already cover the PRD?"**. So once a session closed every open issue, a later heartbeat saw "no open work" and — instead of recognising the PRD as fulfilled — re-ran `/to-issues` against the PRD, producing a fresh duplicate set.

### 2.2 Gap: no "PRD done" terminal state

There is no defined success state. The workflow has no step that says *"if all PRD-derived issues are closed and the acceptance criteria are met, mark the PRD `done` and halt."* Without this, the heartbeat is structurally incapable of exiting on its own.

### 2.3 Gap: CI/CD failures filed as new tickets

When the GitHub Actions deploy failed (e.g. #41 — *blocked, needs workflow OAuth scope*), the next heartbeat treated the deploy gap as fresh scope and filed a new ticket rather than re-opening the existing one. This explains the 10-deep chain of near-identical CI/CD issues.

### 2.4 Contributing factor: heartbeat had no off-switch

The schedule was configured `* * * * *` (every minute) with no maximum-iteration guard, no idle-detection ("if nothing meaningful changed in N cycles, stop"), and no auto-disable when the PRD reaches `done`. So even after the product shipped, the heartbeat kept firing and kept finding "no open work → must create more."

---

## 3. Proposed safety mechanisms

Ordered by impact. (1) and (2) alone would have prevented this incident.

### 3.1 Idempotency check before `/to-issues`  *(highest impact)*

Before invoking `/to-issues`, the agent must check **all** issues (open + closed, not just open) for tickets linked to the same PRD. Rule:

> If ≥1 issue already exists referencing this PRD (via label, milestone, or `Closes #<prd>` body link), **do not** run `/to-issues` again. Either pick up unfinished scope from the existing set or treat the PRD as decomposed.

Implementation hint: require every issue produced by `/to-issues` to carry a `prd:<n>` label or be added to a `PRD-<n>` milestone. Then the precondition is a single `gh issue list --label prd:<n> --state all` check.

### 3.2 Explicit PRD lifecycle  *(high impact)*

Introduce a `done` label (or terminal `done` issue state) on the PRD itself. Add to the heartbeat workflow:

> **Step 0a:** If the PRD has label `done`, exit immediately and request schedule deletion.
>
> **Step N (after closing the last child issue):** If all PRD-derived issues are closed *and* acceptance criteria pass (e.g. CI green, deploy live), label the PRD `done` and call `delete_schedule` on the heartbeat.

This gives the agent a way to *finish*. Without it, a heartbeat will always look for more work.

### 3.3 Re-open instead of re-file for failed work

When the agent detects that prior work on a scope failed (CI red, deploy not live, review rejected), the rule should be:

> Re-open the most recent closed issue covering this scope and add a comment describing the new failure mode. Only file a new issue if no prior issue covers the scope.

A simple heuristic: search closed issues by title similarity / shared label before creating a new one. For CI/CD specifically, reserve a single canonical label (e.g. `area:ci`) and require that only one open `area:ci` issue exist at a time.

### 3.4 Heartbeat self-limiting guards  *(defence in depth)*

Even with the above, give the heartbeat structural brakes:

- **Idle-cycle cap.** If N consecutive heartbeats produce no merged PR and no label transitions, stop and notify the user. ("I think I'm done — is there more work?")
- **Issue-creation rate limit.** No more than X new issues per rolling 24h without explicit human approval. The agent in this incident created 23 issues over 15 hours — a rate limit of e.g. 10/day would have surfaced the bug after run 2.
- **Auto-disable when PRD is `done`.** The heartbeat should call `delete_schedule` on itself when its terminal condition is reached, not wait for a human.

### 3.5 Make duplication visible to the agent  *(low cost, useful)*

Add to every heartbeat's first read: `gh issue list --state all --search "in:title <key tokens from PRD>"` and surface near-duplicate titles. The agent should refuse to file a new issue whose title is ≥80% similar to an existing closed one without an explicit reason logged.

---

## 4. Suggested edits to `HEARTBEAT.md`

Concretely, the workflow doc should grow these sections:

1. **§ Step 0b — PRD lifecycle check.** Read the PRD's label. If `done`, exit and disable schedule. If absent, proceed.
2. **§ Decomposition precondition.** Before `/to-issues`: verify no prior `prd:<n>`-labelled issues exist. If they do, the PRD is already decomposed — skip `/to-issues`.
3. **§ Done detection.** After closing any ticket, evaluate: are all PRD-children closed and acceptance criteria green? If yes → label PRD `done` → `delete_schedule`.
4. **§ Failure handling.** When work on a scope failed, re-open the existing ticket rather than filing a new one. Single-issue invariant for CI/CD scope (`area:ci`).

---

## 5. What this incident did *not* cause

For completeness — the failure mode was bounded:

- No code regressions; all merged PRs were independently valid.
- No data loss; the PRD itself is intact.
- No external side effects beyond GitHub issue noise.
- The end product matches the PRD acceptance criteria.

The cost was: ~23 unnecessary issues, ~16 unnecessary PRs reviewed/merged, and a heartbeat that would have run forever had it not been stopped manually.
