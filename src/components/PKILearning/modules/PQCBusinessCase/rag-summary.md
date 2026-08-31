# PQC Business Case

## Overview

The PQC Business Case module helps CISOs and executives build a compelling financial justification for post-quantum cryptography migration. It covers ROI calculation with weighted cost dimensions, breach scenario simulation comparing classical vs. quantum-enabled breach costs, and a structured board pitch builder that produces exportable executive presentations. All workshops integrate live data from the app's migration catalog, compliance frameworks, and assessment engine.

## Key Concepts

- **PQC Migration Cost Categories** — four dimensions: migration costs (infrastructure layer upgrades), breach avoidance (quantum-enabled attack prevention), compliance penalties (regulatory fine avoidance), and operational/competitive advantages
- **ROI Calculation** — computed from three inputs rather than a fixed weighted scorecard: migration cost (products to migrate × cost per product, plus annual opex), breach-avoidance savings (industry breach baseline × quantum multiplier × breach probability), and compliance savings (framework count × penalty per incident × incident rate); combined into a payback period and multi-year ROI percentage
- **Breach Cost Modeling** — industry-specific breach cost baselines multiplied by data record count, regulatory fines, and HNDL exposure years; compares "breach today" vs. "quantum-enabled breach" costs
- **TCO (Total Cost of Ownership)** — full lifecycle cost including acquisition, deployment, training, maintenance, and ongoing operational expenses for PQC migration
- **Board Communication** — structured executive pitch with sections for executive summary, risk overview, cost-benefit analysis, proposed timeline, budget request, and recommended actions
- **Payback Period** — months until migration investment is recovered through breach avoidance and compliance savings

## Workshop / Interactive Activities

The workshop has 5 interactive steps:

1. **Cost Model Explorer** — compares six costing models on one scenario before committing to a single number
2. **ROI Calculator** — computes estimated migration cost, annual benefit, payback period, and 3-year ROI percentage from live migration-catalog data
3. **Breach Scenario Simulator** — adjustable sliders for data records, regulatory fines, and HNDL years; compares classical vs. quantum breach costs with industry-specific baselines; generates key findings and cost-of-inaction analysis
4. **Cost of Inaction** — models the compounding 5-year cost of delaying migration (breach risk, complexity premiums, regulatory penalties), using the Breach Scenario Simulator's output
5. **Board Pitch Builder** — 6-section artifact builder pre-populated from the earlier steps; produces a formatted board memo with date, industry, country, and confidentiality classification; exports as Markdown

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- Ponemon Institute Cost of a Data Breach methodology
- FAIR (Factor Analysis of Information Risk)
