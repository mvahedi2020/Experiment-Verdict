export type Arm = {
  assigned: number;
  exposed: number;
  complete: number;
  complaints: number;
};
export type Evidence = {
  id: string;
  name: string;
  note: string;
  a: Arm;
  b: Arm;
};
export type Rule = {
  id: string;
  kind: "predeclared" | "post-result";
  primary: number;
  guardrail: number;
  reason: string;
};
export const original: Rule = {
  id: "EV-R1",
  kind: "predeclared",
  primary: 2,
  guardrail: 1,
  reason: "Original fictional decision contract",
};
export const fixtures: Evidence[] = [
  {
    id: "EV-E1",
    name: "Balanced signal",
    note: "Complete exposure; original thresholds can be satisfied.",
    a: { assigned: 5000, exposed: 5000, complete: 3000, complaints: 100 },
    b: { assigned: 5000, exposed: 5000, complete: 3400, complaints: 110 },
  },
  {
    id: "EV-E2",
    name: "Headline + harm",
    note: "Completion improves while the complaint guardrail deteriorates.",
    a: { assigned: 5000, exposed: 5000, complete: 3000, complaints: 100 },
    b: { assigned: 5000, exposed: 5000, complete: 3400, complaints: 250 },
  },
  {
    id: "EV-E3",
    name: "Inconclusive sample",
    note: "Small sample and complaint cells; descriptive counts only.",
    a: { assigned: 100, exposed: 100, complete: 60, complaints: 2 },
    b: { assigned: 100, exposed: 100, complete: 64, complaints: 3 },
  },
  {
    id: "EV-E4",
    name: "Assignment invalid",
    note: "Curated allocation imbalance; no formal SRM test is claimed.",
    a: { assigned: 5000, exposed: 5000, complete: 3000, complaints: 100 },
    b: { assigned: 3000, exposed: 3000, complete: 2040, complaints: 66 },
  },
  {
    id: "EV-E5",
    name: "Exposure invalid",
    note: "900 assigned variant people lack exposure records.",
    a: { assigned: 5000, exposed: 5000, complete: 3000, complaints: 100 },
    b: { assigned: 5000, exposed: 4100, complete: 3400, complaints: 110 },
  },
];
export function interval(a: number, na: number, b: number, nb: number) {
  const delta = 100 * (b / nb - a / na);
  if (Math.min(a, na - a, b, nb - b) < 10)
    return { delta, lower: null, upper: null };
  const margin =
    196 *
    Math.sqrt(((a / na) * (1 - a / na)) / na + ((b / nb) * (1 - b / nb)) / nb);
  return { delta, lower: delta - margin, upper: delta + margin };
}
export function assess(e: Evidence, r: Rule = original) {
  const primary = interval(
    e.a.complete,
    e.a.assigned,
    e.b.complete,
    e.b.assigned,
  );
  const guardrail = interval(
    e.a.complaints,
    e.a.assigned,
    e.b.complaints,
    e.b.assigned,
  );
  const issues: string[] = [];
  if (e.a.assigned !== e.b.assigned) issues.push("Assignment is imbalanced");
  if (e.a.exposed !== e.a.assigned || e.b.exposed !== e.b.assigned)
    issues.push("Exposure records are incomplete");
  if (Math.min(e.a.assigned, e.b.assigned) < 1000)
    issues.push("Fewer than 1,000 people per arm");
  if (primary.lower === null || guardrail.upper === null)
    issues.push("Small cells suppress interval interpretation");
  const eligible =
    issues.length === 0 &&
    primary.lower !== null &&
    primary.lower >= r.primary &&
    guardrail.upper !== null &&
    guardrail.upper <= r.guardrail;
  return { primary, guardrail, issues, eligible };
}
export const contract = {
  id: "EV-C1",
  hypothesis:
    "A simpler onboarding checklist increases completion without unacceptable complaints.",
  population:
    "First-time workspace creators; one independent binary outcome per assigned person",
  window: "Fictional 2026-09-14 through 2026-09-27 inclusive (14 days)",
  predeclaration:
    "Fictional EV-R1 declared 2026-09-13 before observation; not a real preregistration",
  primary: "Completed checklist / assigned people",
  guardrail: "People reporting complaints / assigned people",
  assignment:
    "Exact balanced assignment; curated quality signal, not a formal SRM test",
  exposure: "All assigned people must have exposure records",
  minimumArm: 1000,
  minimumCell: 10,
  method:
    "B minus A; approximate 95% unpooled Wald interval with z=1.96; independent-binomial assumption; no multiplicity or sequential adjustment",
} as const;
export const limits = [
  "Fictional 2026-09-14 to 2026-09-27 evidence; no real experiment or causal certification.",
  "Approx 95% marginal unpooled normal intervals assume independent binomial outcomes.",
  "No multiplicity or sequential adjustment; approximation may have poor coverage.",
  "Exploratory mobile segment: 80/arm, completion 48/56, complaints 1/2. Descriptive only; no segment winner.",
];
export const references = [
  "primary",
  "guardrail",
  "quality",
  "segment",
] as const;
export type Ref = (typeof references)[number];
export type Snapshot = {
  contract: typeof contract;
  evidence: Evidence;
  originalRule: Rule;
  activeRule: Rule;
  assessment: ReturnType<typeof assess>;
  limits: string[];
};
export function snapshot(e: Evidence, r: Rule): Snapshot {
  return structuredClone({
    contract,
    evidence: e,
    originalRule: original,
    activeRule: r,
    assessment: assess(e),
    limits,
  });
}
export type Verdict = "proceed" | "iterate" | "stop";
export type Review = {
  id: string;
  at: string;
  verdict: Verdict;
  rationale: string;
  refs: Ref[];
  snapshot: Snapshot;
};
export type Withdrawal = { reviewId: string; at: string; reason: string };
export type State = {
  schema: 1;
  rules: Rule[];
  reviews: Review[];
  withdrawals: Withdrawal[];
};
export function initial(): State {
  return { schema: 1, rules: [{ ...original }], reviews: [], withdrawals: [] };
}
// Bind the exact current inputs separately from immutable persisted history.
export function reviewInputKey(
  evidence: Evidence,
  rule: Rule,
  verdict: Verdict,
  rationale: string,
  refs: Ref[],
) {
  return JSON.stringify({ evidence: evidence.id, rule, verdict, rationale, refs });
}
export function createReview(
  s: State,
  e: Evidence,
  r: Rule,
  verdict: Verdict,
  rationale: string,
  refs: Ref[],
): Review {
  if (
    rationale.trim().length < 20 ||
    rationale.length > 2000 ||
    refs.length === 0
  )
    throw Error(
      "Add a rationale of 20–2,000 characters and select evidence references.",
    );
  if (verdict === "proceed" && !assess(e).eligible)
    throw Error(
      "Proceed is blocked by the original rules or evidence quality.",
    );
  return {
    id: `EV-V${s.reviews.length + 1}`,
    at: new Date().toISOString(),
    verdict,
    rationale: rationale.trim(),
    refs: [...new Set(refs)],
    snapshot: snapshot(e, r),
  };
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
export function parseState(raw: string): State | null {
  try {
    const s = JSON.parse(raw) as State;
    if (
      !s ||
      s.schema !== 1 ||
      !Array.isArray(s.rules) ||
      !Array.isArray(s.reviews) ||
      !Array.isArray(s.withdrawals) ||
      s.rules.length < 1 ||
      s.rules.length > 100 ||
      s.reviews.length > 100 ||
      s.withdrawals.length > 100 ||
      !same(s.rules[0], original)
    )
      return null;
    if (
      s.rules.some(
        (r, i) =>
          i > 0 &&
          (r.id !== `EV-R${i + 1}` ||
            r.kind !== "post-result" ||
            !Number.isFinite(r.primary) ||
            !Number.isFinite(r.guardrail) ||
            r.primary < 0 ||
            r.primary > 20 ||
            r.guardrail < 0 ||
            r.guardrail > 20 ||
            typeof r.reason !== "string" ||
            r.reason.trim().length < 20 ||
            r.reason.length > 2000),
      )
    )
      return null;
    if (
      s.reviews.some((v, i) => {
        const e = fixtures.find((e) => e.id === v.snapshot?.evidence?.id),
          r = s.rules.find((r) => r.id === v.snapshot?.activeRule?.id);
        return (
          !e ||
          !r ||
          v.id !== `EV-V${i + 1}` ||
          typeof v.at !== "string" ||
          !Number.isFinite(Date.parse(v.at)) ||
          !["proceed", "iterate", "stop"].includes(v.verdict) ||
          typeof v.rationale !== "string" ||
          v.rationale.trim().length < 20 ||
          v.rationale.length > 2000 ||
          !Array.isArray(v.refs) ||
          !v.refs.length ||
          new Set(v.refs).size !== v.refs.length ||
          v.refs.some((x) => !references.includes(x)) ||
          !same(v.snapshot, snapshot(e, r)) ||
          (v.verdict === "proceed" && !assess(e).eligible)
        );
      })
    )
      return null;
    if (
      s.withdrawals.some(
        (w, i) =>
          !s.reviews.some((v) => v.id === w.reviewId) ||
          s.withdrawals.slice(0, i).some((x) => x.reviewId === w.reviewId) ||
          typeof w.at !== "string" ||
          !Number.isFinite(Date.parse(w.at)) ||
          typeof w.reason !== "string" ||
          w.reason.trim().length < 20 ||
          w.reason.length > 2000,
      )
    )
      return null;
    return s;
  } catch {
    return null;
  }
}
