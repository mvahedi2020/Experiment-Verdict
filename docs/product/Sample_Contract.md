# Sample contract

All people, records, results and experiment details are fictional. Hypothesis EV-H1: simplifying an onboarding checklist increases completion without an unacceptable increase in complaints. Population: eligible first-time workspace creators in a fixed fictional 14-day window, one binary outcome per independent assigned person. Original rule EV-R1 is presented as predeclared within the fictional story, not a historical real preregistration.

Original thresholds: ≥1,000 assigned people per arm; exactly balanced allocation; complete exposure; primary approx 95% interval lower bound ≥2 percentage points; complaint upper bound ≤1 point. Primary and guardrail must each have at least 10 successes and failures per arm for interval interpretation. Exact balance is a curated quality signal, not a general sample-ratio-mismatch statistical test.

| Evidence version | Arm sizes | Completion A/B | Complaints A/B | Quality |
|---|---|---|---|---|
| EV-E1 balanced | 5,000 / 5,000 | 3,000 / 3,400 | 100 / 110 | Eligible |
| EV-E2 harm | 5,000 / 5,000 | 3,000 / 3,400 | 100 / 250 | Guardrail harm |
| EV-E3 small | 100 / 100 | 60 / 64 | 2 / 3 | Insufficient sample and small cells |
| EV-E4 assignment | 5,000 / 3,000 | 3,000 / 2,040 | 100 / 66 | Imbalanced assignment |
| EV-E5 exposure | 5,000 / 5,000 | 3,000 / 3,400 | 100 / 110 | Only 4,100 variant exposures logged |

Difference B−A and unpooled Wald interval: difference ±1.96√(pA(1−pA)/nA+pB(1−pB)/nB). [NIST formula and cautions](https://itl.nist.gov/div898/software/dataplot/refman1/auxillar/diffprop.htm). NIST notes poor coverage of this approximation in some settings; it is not a simultaneous or multiple-testing-adjusted interval. This pedagogical prototype suppresses intervals when any success/failure cell is below 10. A positive interval does not by itself certify causality. Repeated peeking, correlated people, attrition and external validity are outside the fixture.

Exploratory segment EV-S1 (mobile): 80 people per arm, completion 48/56, complaints 1/2. It is descriptive only, underpowered, not adjusted for multiple comparisons, and cannot justify a segment winner or rollout. Post-result revisions retain immutable IDs and reason; relaxed thresholds cannot unlock proceed when original rules fail.
