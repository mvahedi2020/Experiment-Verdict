# Experiment Verdict

A fictional experiment scorecard for a product manager reviewing whether an intervention merits proceeding, iteration, or stopping. The prototype keeps original rules, data quality, guardrails, uncertainty, and a human rationale together.

## Reviewer route

[Open the interactive demo](https://mvahedi2020.github.io/Experiment-Verdict/).

1. [Product brief](docs/product/Product_Brief.md): user, decision, alternative.
2. [PRD](docs/product/PRD.md): requirements and acceptance.
3. [Sample contract](docs/product/Sample_Contract.md): fictional records and statistical boundaries.
4. [Walkthrough](docs/product/Sample_Walkthrough.md): primary and recovery stories.
5. [Case study](docs/product/Case_Study.md), [decisions and risks](docs/product/Decisions_and_Risks.md), [validation](docs/product/Validation.md).

Mo provides Product / Program Management direction and portfolio scope. Codex generated implementation, fictional fixtures, documentation, and automated checks. This is not a claim of manual coding by Mo, real experimentation, human research, commercial results, or causal certification.

## Run locally

Node 24: `npm ci`, `npm run dev`; open `http://127.0.0.1:4194/Experiment-Verdict/`. Checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit`.

Local browser storage holds versioned reviews on this origin only. No accounts, services, AI calls, analytics, or live experiments. The production base is `/Experiment-Verdict/`.
