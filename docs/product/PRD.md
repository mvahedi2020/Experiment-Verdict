# Product requirements

Read the original contract → choose a fictional evidence version → inspect outcome, guardrail, quality and segment limits → select proceed/iterate/stop with rationale and evidence references → review exact snapshot → commit and export.

| Requirement | Acceptance |
|---|---|
| Original predeclared contract | Always visible; a later revision is labeled post-result and cannot replace original eligibility |
| Evidence quality | Assignment imbalance and missing exposure block proceed |
| Uncertainty | Numerators, denominators, differences and approx 95% intervals shown; small cells suppress intervals |
| Human verdict | Rationale of at least 20 characters and at least one reviewer-selected evidence reference required |
| Proceed gate | Requires original primary lower bound ≥2 percentage points, complaint upper bound ≤1 point, valid quality and interpretable cells |
| Review | Preview binds evidence, active rule, rationale, references, raw storage value and readability; stale preview cannot mutate |
| Recovery | Compatible records restore; invalid bytes are preserved; failed reads never overwrite unseen storage; failed writes stay in memory with notice |
| History | Append-only reviews and post-result revisions; withdrawal adds a record without deleting original; reset explicitly ends local history |
| Accessibility | Native labels and controls, Escape cancels, forward/reverse Tab focus scope, returned trigger focus, responsive scorecard; inline modal validation |

Success means a saved and exportable versioned review; cancellation makes no state change. A stale or incompatible browser state stops a write and explains how to refresh or inspect reset. Export is a JSON snapshot of the selected review, not a recalculation from current controls.
