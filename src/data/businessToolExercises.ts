// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — "Try it" under a Command Center tool, one
 * question per tool answerable from the tool's own inputs and outputs, with a
 * reason that names the concept. Written during the business-tool sittings
 * from each tool's rendered controls (label dump at 4.97.0).
 * businessToolExercises.test.ts pins ids, option counts and reasons.
 */
import type { StepExercise } from '@/data/stepExercises'

export const BUSINESS_TOOL_EXERCISES: Record<string, StepExercise[]> = {
  'roi-calculator': [
    {
      prompt:
        'Halve the Annual Breach Probability input. What tells you the case did not depend on the scary number?',
      options: [
        'The payback period still lands inside the planning horizon',
        'The capex per product falls',
        'The discount rate changes',
      ],
      answer: 0,
      why: 'Payback is total cost against expected loss avoided; if it survives a halved breach probability, the case rests on the migration economics, not on one assumption.',
    },
  ],
  'board-pitch': [
    {
      prompt: 'Which three things does the tool say a board deck needs on one slide?',
      options: [
        'One ask, one date, one consequence of missing it',
        'A budget table, a Gantt chart and a risk heatmap',
        'The full crypto inventory',
      ],
      answer: 0,
      why: 'The "what a good answer looks like" line is the test: if the ask needs a second slide to explain, it is not clear enough yet.',
    },
  ],
  'breach-simulator': [
    {
      prompt:
        'Set Years of Stored Data to 10 and migration time to 3 years. What does the Mosca verdict compare?',
      options: [
        'Data lifetime plus migration time against the expected CRQC arrival',
        'Breach cost against budget',
        'Your industry against the global average',
      ],
      answer: 0,
      why: "Mosca's theorem: if the years your data must stay secret plus the years migration takes exceed the years until a CRQC, you are already late.",
    },
  ],
  'cost-of-inaction': [
    {
      prompt:
        'Slide the migration delay from 0 to 3 years with the horizon fixed. What does the chart show?',
      options: [
        'The year where waiting becomes the more expensive choice',
        'A constant cost',
        'The breach probability falling',
      ],
      answer: 0,
      why: 'Cumulative NPV of migrate-now against delay crosses where accumulated exposure plus the delay premium exceeds the cost of acting; the breakdown names the driver.',
    },
  ],
  'cost-model-explorer': [
    {
      prompt: 'After Run Monte Carlo, what is the honest number to bring to a budget discussion?',
      options: [
        'The spread between the parametric, bottom-up and Monte Carlo estimates',
        'The lowest of the six figures',
        'The cost-of-inaction line',
      ],
      answer: 0,
      why: 'One scenario, six lenses: the range between estimates is the uncertainty, and the slider that moves it most is the assumption to defend; the inaction line measures a different thing.',
    },
  ],
  'crqc-scenario': [
    {
      prompt: 'Move the CRQC arrival year earlier. What appears in the Algorithms Broken panel?',
      options: [
        'Every classical public-key algorithm you rely on, as of that year',
        'Only RSA',
        'Nothing until 2040',
      ],
      answer: 0,
      why: 'RSA-2048, ECDSA P-256 and their kin all fall to Shor at once; the year sets the HNDL exposure window for data kept past it.',
    },
  ],
  'risk-register': [
    {
      prompt: 'Why does the tool say an unowned risk is a note, not a risk?',
      options: [
        'Without a named owner and review date, no one is answerable for treating it',
        'Because owners set the likelihood',
        'Because unowned risks cannot be exported',
      ],
      answer: 0,
      why: 'A register is a commitment: each entry needs a person who signs for the treatment and a date it is looked at again.',
    },
  ],
  'risk-treatment-plan': [
    {
      prompt: 'Place a risk at Likelihood 4 / Impact 5 and choose Mitigate. Where does it appear?',
      options: [
        'In the Treatment Summary and the Migration Priority Order, with your rationale',
        'Only on the heatmap',
        'In the risk register as a new row',
      ],
      answer: 0,
      why: 'The heatmap visualises the register; the treatment and its rationale become the plan, and the priority order is where you argue sequence.',
    },
  ],
  'compliance-checklist': [
    {
      prompt:
        'Star a framework on the Compliance page and come back. What does each framework gain here?',
      options: [
        'Its own checklist with a deadline, an owner and evidence items',
        'A colour',
        'A link to the FAQ',
      ],
      answer: 0,
      why: 'The checklist is per framework so the evidence ("Crypto inventory mapped to this framework") can be traced to the obligation it satisfies.',
    },
  ],
  'audit-checklist': [
    {
      prompt:
        'Tick "CBOM generated" and add an evidence row with a CMVP certificate number. What moves?',
      options: [
        'Cryptographic Inventory readiness, from Not Started toward Established',
        'The Exceptions count',
        'The policy version',
      ],
      answer: 0,
      why: 'Each area scores from its ticked controls; an evidence row is what lets an auditor follow the tick to the certificate.',
    },
  ],
  'compliance-timeline': [
    {
      prompt:
        'Select two jurisdictions and add a milestone with a year. What does the Gap Analysis say per framework?',
      options: [
        'Whether the plan meets the deadline or by how many years it misses',
        'Which jurisdiction is stricter',
        'The cost of compliance',
      ],
      answer: 0,
      why: 'The timeline overlays your milestones on each framework deadline; the gap is measured in years, framework by framework.',
    },
  ],
  'raci-builder': [
    {
      prompt: 'Set two roles to Accountable on the same activity. What happens?',
      options: [
        'The row is flagged: two Accountables means nobody',
        'Both are accepted',
        'The second becomes Responsible',
      ],
      answer: 0,
      why: 'Accountable is the single owner who signs off and is answerable; RACI allows exactly one per activity.',
    },
  ],
  'policy-generator': [
    {
      prompt:
        'Approve ML-KEM and ML-DSA, list RSA as an algorithm to retire and set a 2-year exception window. What does the export contain?',
      options: [
        'A policy naming the approved and prohibited algorithms, the exception process and the review cadence',
        'A contract clause',
        'A risk register',
      ],
      answer: 0,
      why: 'The template turns the choices into policy text with the standards cited (NIST, ENISA, ISO/IEC, IETF, FIPS 140-3) so the document names what it requires.',
    },
  ],
  'kpi-dashboard': [
    {
      prompt: 'Why do some KPIs show as needing assessment or compliance data?',
      options: [
        'They are scored from live data and unlock when that step is complete',
        'They are optional',
        'They are weighted zero',
      ],
      answer: 0,
      why: 'The dashboard scores from the assessment, the compliance page and the Migrate catalogue where it can; a KPI with no data is shown as locked, not as zero.',
    },
  ],
  'vendor-scorecard': [
    {
      prompt: 'Score two vendors on the six criteria. Which criterion carries the most weight?',
      options: [
        'PQC Algorithm Support (25%)',
        'FIPS 140-3 Validation (20%)',
        'SBOM/CBOM Delivery (10%)',
      ],
      answer: 0,
      why: 'The weights are printed beside each criterion; algorithm support is the largest because without it the other five cannot matter yet.',
    },
  ],
  'contract-clause': [
    {
      prompt: 'Require a CMVP certificate number as evidence. Which clause carries it?',
      options: ['FIPS Validation Mandate', 'PQC Timeline Requirements', 'Audit Rights'],
      answer: 0,
      why: 'The validation clause names the security level, the timeline and the evidence (certificate number, module name and version) the vendor must produce.',
    },
  ],
  'supply-chain-matrix': [
    {
      prompt: 'Which products does the tool say are the programme rather than logistics?',
      options: [
        'The suppliers you cannot replace inside your own deadline',
        'Every product with a CVE',
        'The cheapest to replace',
      ],
      answer: 0,
      why: 'The matrix maps migration gap against impact from catalogue data; the high-gap, high-impact, hard-to-replace corner is where the deadline risk sits.',
    },
  ],
  'roadmap-builder': [
    {
      prompt: 'What does each phase need besides an end date?',
      options: [
        'An exit test someone outside the room can check',
        'A budget line',
        'A named vendor',
      ],
      answer: 0,
      why: 'The two tracks run on the eight-phase spine with gates G0 to G6; a gate is a checkable criterion, which is what "done" has to mean.',
    },
  ],
  'stakeholder-comms': [
    {
      prompt:
        'Put the board in "Manage closely" with a quarterly dashboard. Which two inputs decide that placement?',
      options: ['Power and interest', 'Budget and headcount', 'Region and industry'],
      answer: 0,
      why: 'The stakeholder map is a power/interest grid: high power and high interest are managed closely, high power and low interest kept satisfied.',
    },
  ],
  'kpi-tracker': [
    {
      prompt: 'Set the program start year and switch View as. What becomes a real number?',
      options: ['Pace-to-Deadline', 'Budget per FTE', 'The number of vendors'],
      answer: 0,
      why: 'Pace needs a start date and a deadline; the vendor, FIPS, threat and compliance KPIs then auto-score from the Migrate catalogue and the assessment.',
    },
  ],
  'deployment-playbook': [
    {
      prompt: "What is the tool's only real test of a playbook?",
      options: [
        'A colleague could run it at 3 am without calling you',
        'It has seven phases',
        'It cites CSWP.39',
      ],
      answer: 0,
      why: 'The seven checklists from Pre-Deployment Preparation to Rollback Procedures exist so the steps are explicit enough to run unaided.',
    },
  ],
  'hybrid-transition-planner': [
    {
      prompt: 'Why does the tool flag a hybrid plan without an exit trigger?',
      options: [
        'Hybrid without an end date is permanent, and permanent hybrid is twice the maintenance forever',
        'Hybrid is not allowed by CSWP.39',
        'Exit triggers are required by FIPS',
      ],
      answer: 0,
      why: 'The CSWP.39 §3.2.4 decision tree picks traditional+PQC, PQC+PQC, pure PQC or a gateway; each hybrid choice needs a stated condition for leaving it.',
    },
  ],
  'mti-negotiator': [
    {
      prompt: 'What must the mandatory-to-implement set be checked against?',
      options: [
        'The protocol matrix, so both ends can negotiate it today',
        'The vendor price list',
        'The board deck',
      ],
      answer: 0,
      why: 'An MTI signature, KEM and hash are only useful if peers implement them; the matrix records what each protocol actually supports.',
    },
  ],
  'crypto-api-refactor-audit': [
    {
      prompt: 'What does the tool say a good refactor plan lists?',
      options: [
        'Call sites, not libraries',
        'Libraries, not call sites',
        'Only the languages in use',
      ],
      answer: 0,
      why: 'The refactor happens where code calls the API; the grade depends on how hardcoded those calls are, and the plan is phased by call site.',
    },
  ],
  'cloud-responsibility-matrix': [
    {
      prompt: 'What may no cell of the matrix say without more?',
      options: ['"Shared", without saying who acts first', '"Customer"', '"Provider"'],
      answer: 0,
      why: 'Shared responsibility only works when the first mover is named per asset class; the matrix carries PQC availability per cloud and the BYOK, FedRAMP and sovereign overlays.',
    },
  ],
  'crypto-architecture-diagram': [
    {
      prompt:
        'Add an app, a library, an HSM and a CA with dependencies. What does the artefact store?',
      options: [
        'Both the structured table and the Mermaid diagram',
        'Only the picture',
        'Only the component names',
      ],
      answer: 0,
      why: 'The table is the inventory; the diagram is drawn from it, so the detail line (for example an HSM without ML-DSA firmware) stays with the component.',
    },
  ],
  'management-tools-audit': [
    {
      prompt: 'Rate a category "None". Where does it land in the output?',
      options: [
        'In the gap list, ordered by importance',
        'At the bottom of the export',
        'It is hidden',
      ],
      answer: 0,
      why: 'CSWP.39 §5 step 3 audits the management-tools layer; a category with no coverage is a gap that has to change before a production key does.',
    },
  ],
  'crypto-cbom-builder': [
    {
      prompt: 'Why does the tool prefer a CBOM you can regenerate over a hand-built one?',
      options: [
        'A hand-built CBOM is accurate for a week; a generated one for as long as you keep generating it',
        'Generated files are smaller',
        'Hand-built CBOMs cannot be exported',
      ],
      answer: 0,
      why: 'The three views map an SBOM, library posture and HSM inventory into CycloneDX 1.7; the value is in the pipeline, not the file.',
    },
  ],
  'crypto-vulnerability-watch': [
    {
      prompt: 'What does the watch say about a list that surfaces everything?',
      options: [
        'It gets ignored like everything else',
        'It is more complete',
        'It should be exported weekly',
      ],
      answer: 0,
      why: 'The digest is the top CVEs per selected product by severity, joined through CPE from the NVD snapshot: a short list you will actually read.',
    },
  ],
  'program-charter': [
    {
      prompt: 'Which gate does a signed charter close?',
      options: ['G0: charter, budget and QRPM approved', 'G3', 'G6'],
      answer: 0,
      why: 'Phase 0 ends when the sponsor signs, the steering committee is seated, the programme manager is appointed and the multi-year budget is committed.',
    },
  ],
  'initial-scoping': [
    {
      prompt: 'What does the tool call the most valuable finding of a first scoping?',
      options: [
        'An honest inventory gap: "we do not know what is in this estate"',
        'The top vendor',
        'The estate size',
      ],
      answer: 0,
      why: 'A first cut names the top systems, an estate-size estimate and the vendor dependencies; a stated unknown is a finding, not a failure.',
    },
  ],
  'skills-team-plan': [
    {
      prompt: 'Enter 2,400 instances. What sizes the core roles?',
      options: [
        'The 1-FTE-per-500-instances heuristic for years 1–2, then 1 per 1,000 in rollout',
        'The number of vendors',
        'The budget',
      ],
      answer: 0,
      why: 'The heuristic converts estate size into dedicated effort; each role then gets a build, borrow or buy decision.',
    },
  ],
  'infra-modernization-planner': [
    {
      prompt: 'List HSMs with firmware and PQC status. Which of them need a plan beyond firmware?',
      options: [
        'Those without PQC capability, scheduled for hardware replacement in 2–4 years',
        'All of them',
        'None; firmware covers everything',
      ],
      answer: 0,
      why: 'A PQC-capable HSM takes a firmware upgrade; one that cannot run ML-DSA needs a replacement window, which is what the schedule records.',
    },
  ],
  'refresh-cycle-alignment': [
    {
      prompt: 'Which assets does the tool say need a decision now?',
      options: [
        'Those whose refresh lands after your deadline',
        'Those refreshing next year',
        'Cloud assets only',
      ],
      answer: 0,
      why: 'PQC work rides funded refresh programmes where it can; an asset whose cycle misses the deadline cannot, so it needs its own budget line.',
    },
  ],
  'accelerated-execution-profile': [
    {
      prompt: 'What is pre-approved in the profile before the timeline moves?',
      options: [
        'Risk acceptances, a compressed wave order and a surge request, with a named activation authority',
        'A new vendor',
        'A longer deadline',
      ],
      answer: 0,
      why: 'A contingency package is only useful if it can be pulled without a fresh approval cycle; the profile records who may pull it.',
    },
  ],
  'data-at-rest-strategy': [
    {
      prompt: 'Which stores does the tool say to treat first?',
      options: [
        'Those whose retention keeps them secret for years — the harvest-now targets',
        'The largest',
        'The newest',
      ],
      answer: 0,
      why: 'Retention drives order: data that must stay secret for ten years is exposed to harvest-now-decrypt-later; data expiring next quarter is not.',
    },
  ],
  'migration-verification': [
    {
      prompt: 'A system runs both the old and the new algorithm. Is it migrated?',
      options: [
        'No — evidence that the old algorithm is gone is the standard',
        'Yes, once the new one works',
        'Yes, if the vendor says so',
      ],
      answer: 0,
      why: 'The five-point evidence standard (observed negotiation, negative test, chain under PQC, downgrade documented, dossier) plus the SP 800-88 decommissioning log prove removal.',
    },
  ],
}
