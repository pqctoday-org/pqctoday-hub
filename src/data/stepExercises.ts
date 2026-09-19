// SPDX-License-Identifier: GPL-3.0-only
/**
 * Round 9, wave 2 (2026-09-19) — one exercise per workshop step, with feedback
 * that explains why. The 90 band's education row asks for "an exercise with
 * feedback on every step that takes input"; this is the data the sittings
 * fill, keyed `<module id>/<workshop step id>`, rendered by StepExercise under
 * the step body. A question must be answerable from the step it sits under
 * (the sitting reads the step's component before writing it); `why` names
 * the concept, not "correct". stepExercises.test.ts pins that every key is a
 * real module step and every entry has one correct option and a reason.
 */

export interface StepExercise {
  /** The question, in the step's own terms. */
  prompt: string
  /** Two to four options. */
  options: string[]
  /** Index into `options`. */
  answer: number
  /** Why that option is right — the concept, one or two sentences. */
  why: string
}

export const STEP_EXERCISES: Record<string, StepExercise> = {
  // ── PQC 101 (batch 1, 2026-09-19; written from the step components) ──
  'pqc-101/algorithm-families': {
    prompt:
      "Which problem does Shor's algorithm solve in polynomial time on a large quantum computer?",
    options: [
      'Integer factorisation and the discrete logarithm (RSA and ECC)',
      'Finding the closest vector in a noisy high-dimensional lattice',
      'Inverting a hash function',
    ],
    answer: 0,
    why: 'That is why RSA and ECC are marked broken. Lattice and hash problems have no known quantum speedup, which is what makes ML-KEM, ML-DSA and SLH-DSA candidates.',
  },
  'pqc-101/algorithm-comparison': {
    prompt: 'ML-KEM is quantum-resistant because its security rests on which problem?',
    options: [
      'Module Learning With Errors (M-LWE)',
      'Integer factorisation',
      'The discrete logarithm',
    ],
    answer: 0,
    why: 'The comparison table gives M-LWE as the basis: no known quantum or classical algorithm solves it efficiently, unlike factoring and discrete logs.',
  },
  'pqc-101/key-generation': {
    prompt:
      'After generating an RSA-2048 key and an ML-KEM-768 key, what does the step call the main migration cost of PQC?',
    options: [
      'The larger public key',
      'A slower key-generation command',
      'A new file format for private keys',
    ],
    answer: 0,
    why: 'Both keys come out of the same openssl genpkey command; what changes is the size of the public key, which is what certificates, handshakes and storage must carry.',
  },
  'pqc-101/signature-demo': {
    prompt:
      'Which signature scheme in the demo is hash-based, with tiny keys but large signatures?',
    options: ['SLH-DSA-SHA2-128s', 'ML-DSA-65', 'ED25519'],
    answer: 0,
    why: 'SLH-DSA rests on hash functions alone and pays for that conservative assumption with signature size; ML-DSA is lattice-based, and ED25519 is classical elliptic-curve.',
  },
  // ── Quantum Threats ──
  'quantum-threats/security-levels': {
    prompt:
      'Pick an algorithm that ends at 0-bit security under quantum attack. Which attack did that?',
    options: ["Shor's algorithm", "Grover's algorithm", 'Both equally'],
    answer: 0,
    why: "Shor's solves factoring and discrete logs in polynomial time, taking RSA and ECC to zero. Grover's only halves the effective bits of symmetric ciphers and hashes.",
  },
  'quantum-threats/vulnerability-matrix': {
    prompt: "In the matrix, what does Grover's algorithm do to AES-128?",
    options: [
      'Halves its security bits (weakened, not broken)',
      'Breaks it completely',
      'Nothing at all',
    ],
    answer: 0,
    why: "Grover's gives a quadratic speedup on search, so 128 bits of key become about 64 bits of work: weakened, which is why AES-256 is the recommendation, not a new cipher.",
  },
  'quantum-threats/key-size-analyzer': {
    prompt:
      'Comparing two algorithms side by side, which pair shows a broken scheme next to a safe one?',
    options: [
      'ECDSA P-256 next to ML-DSA-65',
      'AES-128 next to AES-256',
      'ML-KEM-768 next to ML-DSA-65',
    ],
    answer: 0,
    why: "ECDSA is broken by Shor's; ML-DSA-65 is lattice-based and safe. AES-128 and AES-256 are both only weakened, and the two ML schemes are both safe.",
  },
  'quantum-threats/hndl-timeline': {
    prompt: 'The HNDL timeline computes "Migrate by" as which formula?',
    options: [
      'CRQC year minus data lifetime minus migration time',
      'CRQC year plus data lifetime',
      'Today plus migration time',
    ],
    answer: 0,
    why: 'Data captured today must still be secret when a CRQC arrives, so its lifetime and the time your migration takes are both subtracted from the CRQC year.',
  },
  'quantum-threats/hnfl-timeline': {
    prompt:
      'Why is a signing credential that is still valid when a CRQC arrives "at risk" in the HNFL calculator?',
    options: [
      'Its private key can be recovered and past or future signatures forged',
      'It stops verifying automatically',
      'Its public key becomes secret',
    ],
    answer: 0,
    why: 'Harvest-now-forge-later: an adversary who recovers the signing key from the public key can forge signatures that verify under a credential still trusted at that date.',
  },
  // ── CBOM ──
  'cbom/source-coverage-mapper': {
    prompt: 'In the coverage map, what is the "true ghost" that no scanner parses?',
    options: ['The legacy appliance', 'The TLS endpoints', 'The container images'],
    answer: 0,
    why: 'The mapper shows which sources each existing tool covers; the legacy appliance appears in none, so it needs manual or passive discovery before the CBOM is complete.',
  },
  'cbom/format-chooser': {
    prompt:
      'Rendering the same asset in both formats, why does the step recommend CycloneDX 1.7 for a CBOM today?',
    options: [
      'SPDX 3.0.1 has no cryptography model, so the crypto fields have nowhere to go',
      'SPDX files are larger',
      'CycloneDX is the only format an SBOM can use',
    ],
    answer: 0,
    why: 'CycloneDX 1.7 expresses algorithm, parameter set and quantum level per asset; SPDX 3.0.1 cannot carry them yet, though the PKIC profiles work aims at both.',
  },
  'cbom/cbom-verify': {
    prompt: 'Why does the policy check normalise algorithm names before evaluating the Rego rules?',
    options: [
      'So that the same algorithm written three ways matches one rule',
      'To shorten the CBOM file',
      'Because Rego cannot read strings',
    ],
    answer: 0,
    why: 'Scanners, HSMs and certificates name the same mechanism differently; the rules match on the normalised name, which is the point of the Cryptography Registry.',
  },
  'cbom/key-correlator': {
    prompt: 'Four artifacts collapse into one logical key. What correlates them?',
    options: ['The SPKI fingerprint of the public key', 'The file name', 'The creation date'],
    answer: 0,
    why: 'The same public key shows up as a certificate, an HSM object, a config entry and a scanner finding; the SPKI fingerprint is the identity they share, while symmetric keys correlate by KCV.',
  },
  // ── Batch 2 (2026-09-19): every remaining workshop step the per-step probe marks as taking input; each written from the step component and the data it renders ──
  // crypto-agility
  'crypto-agility/agility-assessment': {
    prompt:
      "You answer Partial to all three questions of the Algorithm Agility dimension. What does that dimension's score bar read?",
    options: ['3/6 pts — Developing', '3/6 pts — Foundational', '1.5/6 pts — Not Started'],
    answer: 0,
    why: 'Each Partial is worth one point against a six-point dimension, and 50% is exactly where the Developing band starts. Foundational covers 25-49%, so three Partials clear it.',
  },
  // web-gateway-pqc
  'web-gateway-pqc/topology-builder': {
    prompt:
      "You load the 'CDN + WAF + Load Balancer' preset and click Analyze Topology. What HNDL Exposure does the analysis report?",
    options: ['Medium', 'High', 'Low'],
    answer: 1,
    why: 'Three of the four segments (two Classical TLS 1.3 hops and one Plaintext hop) are quantum-vulnerable, and once more than half the segments are vulnerable the exposure is rated High; only the client-to-CDN hop is PQC Hybrid.',
  },
  'web-gateway-pqc/handshake-budget': {
    prompt:
      "You tick both Session Resumption (PSK, -90%) and Certificate Compression (RFC 8879, -30%). How does the calculator combine them into the 'After mitigations' figure?",
    options: [
      'Only the larger reduction (90%) applies',
      'The percentages add up to 120%, capped at 100%',
      'Each reduction applies to what is left after the previous one — about 93% saved in total',
    ],
    answer: 2,
    why: 'Mitigations are applied in sequence, each shrinking the remaining handshake size by its own percentage, so savings compound multiplicatively rather than adding: 10% of the size remains after PSK, then 70% of that remains after compression.',
  },
  // hsm-pqc
  'hsm-pqc/migration-planner': {
    prompt:
      "With Thales Luna 7 selected (downtime '30-60 minutes per HSM') and the default fleet of 10 HSMs, what Rolling Upgrade Estimate does Phase 2 show, and why?",
    options: [
      '30 - 60 minutes, because all HSMs upgrade in parallel',
      '5.0 - 10.0 hours, because the rolling upgrade takes one HSM at a time',
      '2.5 - 5.0 hours, because half the fleet upgrades at once',
    ],
    answer: 1,
    why: 'A rolling upgrade keeps classical operations running on the rest of the fleet by upgrading one HSM at a time, so the per-HSM downtime window is multiplied by the fleet size: 30 and 60 minutes times 10 gives 300 to 600 minutes.',
  },
  // secrets-management-pqc
  'secrets-management-pqc/secrets-architecture-mapper': {
    prompt:
      "You click 'Select All Critical'. How many of the 8 secret types are selected, and which are left out?",
    options: [
      '8 — every secret type is Critical',
      '5 — only the types with Immediate HNDL exposure',
      '6 — OAuth Tokens & JWTs and Service Account Credentials stay unselected',
    ],
    answer: 2,
    why: 'The button selects by PQC risk level, not by HNDL exposure: six types are rated Critical (including API Keys, which are Critical but only Delayed HNDL), while OAuth Tokens & JWTs and Service Account Credentials are rated High and so stay unselected.',
  },
  // network-security-pqc
  'network-security-pqc/tls-inspection-lab': {
    prompt:
      "You select Hybrid ECDSA+ML-DSA-65 and switch to Full Inspect. Why does the lab flag 'Inspection Challenges Detected'?",
    options: [
      'ML-DSA signatures cannot be re-signed by a TLS proxy at all',
      'Hybrid certificates force TLS 1.2, which NGFWs no longer inspect',
      'Its 8.5 KB certificate chain exceeds the ~4 KB buffer limit of classical NGFW inspection engines',
    ],
    answer: 2,
    why: 'Intercepting proxies must parse and re-sign the full certificate chain, and classical NGFW buffers were sized for chains of a few kilobytes; the hybrid chain is more than double that, so inspection needs a firmware update that expands the buffer.',
  },
  'network-security-pqc/ids-signature-updater': {
    prompt:
      'With the Base False Positive Rate slider at its default 5%, you enable the PQC Downgrade Attack Detection rule. What Est. False Positive rate does the summary now show?',
    options: [
      '5% — toggling rules never changes the base rate',
      '7% — each active high-FP rule multiplies the base rate by 1.4',
      '9% — a high-FP rule adds a flat 4 points',
    ],
    answer: 1,
    why: 'Rules tagged with high false-positive risk amplify alert volume, so the estimate scales the base rate by a multiplier that grows 0.4 per active high-FP rule; Downgrade Attack Detection is the only such rule, giving 5% times 1.4.',
  },
  // crypto-dev-apis
  'crypto-dev-apis/build-buy-oss': {
    prompt:
      'Expand the Open Source strategy card. According to its PQC Implications, which libraries are the only ones offering FIPS certification for PQC?',
    options: [
      'OpenSSL oqsprovider and Bouncy Castle',
      'AWS-LC and wolfSSL',
      'liboqs and cloudflare/circl',
    ],
    answer: 1,
    why: "Open source leads PQC adoption, but the card points out that FIPS-certified PQC is available only where a commercial entity funds the validation: AWS-LC through Amazon's backing and wolfSSL through its commercial licence.",
  },
  'crypto-dev-apis/crypto-agility-patterns': {
    prompt:
      "In the Hybrid / Composite Operations pattern's Java example, when does verification of the combined ECDSA + ML-DSA signature succeed?",
    options: [
      'Only when both the ECDSA and the ML-DSA signatures verify',
      'When either one of the two signatures verifies',
      'When the ML-DSA signature verifies; the ECDSA half is advisory',
    ],
    answer: 0,
    why: 'A hybrid signature is only as strong as requiring both halves: if either algorithm is later broken, the other still has to be forged, which is exactly why the combined result stays secure. Accepting either alone would let an attacker forge the weaker one.',
  },
  'crypto-dev-apis/migration-decision-lab': {
    prompt:
      "In the Decision Wizard you choose Java / Kotlin, then JCA/JCE (standard), then 'No HSM needed'. Which migration path is recommended, and at what effort?",
    options: [
      'Bouncy Castle: Add PQC algorithms — low effort',
      'JCA: Migrate to Bouncy Castle provider — low effort',
      '.NET: Add Bouncy Castle C# for PQC — medium effort',
    ],
    answer: 1,
    why: "Standard JCA code keeps working when Bouncy Castle is registered as an extra provider, so the path is low effort: register the provider, then request ML-DSA or ML-KEM through the same JCA calls. The 'Add PQC algorithms' path is for teams already on Bouncy Castle.",
  },
  // pqc-testing-validation
  'pqc-testing-validation/active-pqc-scanner': {
    prompt:
      'After the scan, api.internal:8443 carries the Hybrid PQC badge yet still shows a risk score of 28. What is the remaining vulnerability it lists?',
    options: [
      'Its cipher suite runs in CBC mode',
      'Its ECDSA certificate is still quantum-vulnerable — only the key exchange is hybrid',
      'It negotiates the deprecated TLS 1.2',
    ],
    answer: 1,
    why: 'A hybrid X25519+ML-KEM-768 key exchange protects the session secret, but authentication still rests on the classical ECDSA certificate, so the endpoint is not fully quantum-safe until the certificate moves to ML-DSA or a composite.',
  },
  'pqc-testing-validation/tvla-leakage-analyzer': {
    prompt:
      'The note under the leakage bars says classical fixed-vs-random TVLA fails for ML-KEM/ML-DSA. Why?',
    options: [
      'Lattice operations run in constant time, so there is no power variation to measure',
      "10,000 traces are too few for Welch's t-test to reach significance",
      'Public key and ciphertext are structurally coupled, so a fixed ciphertext always uses the same secret polynomial and the fixed set is trivially distinguishable',
    ],
    answer: 2,
    why: 'Because the fixed set is distinguishable by construction regardless of implementation quality, the test would flag every implementation; the step instead targets specific algorithmic stages such as NTT/INTT, polynomial multiplication and modular reduction.',
  },
  // verification-closure
  'verification-closure/closure-handover-register': {
    prompt:
      'You have picked an owner for all five capabilities, ticked all four closure criteria, but left the re-eval date blank on one capability. What does the gate show?',
    options: [
      'Closure gate OPEN — program can close',
      'Not ready to close — 1 capability(ies) unassigned',
      'Not ready to close — 1 criterion(a) unmet',
    ],
    answer: 1,
    why: 'A capability only counts as handed over when it has both a permanent owner and a re-evaluation date; an owner without a date is still orphaned, so the register stays at 4/5 assigned and the gate stays shut.',
  },
  // exec-quantum-impact
  'exec-quantum-impact/how-to-act': {
    prompt:
      'In the Success Metrics panel, what target does the executive plan set for HNDL Exposure?',
    options: [
      '100% — every data asset re-encrypted with PQC',
      'Quarterly — HNDL reported to the board each quarter',
      "< 5 years — the maximum gap between a data asset's confidentiality requirement and its PQC migration date",
    ],
    answer: 2,
    why: 'Harvest-now-decrypt-later risk is measured as a time window: how long data must stay secret beyond the date it is protected by PQC. Keeping that gap under five years is the metric, while 100% and Quarterly belong to the inventory-coverage and board-awareness KPIs.',
  },
  'exec-quantum-impact/self-assessment': {
    prompt:
      "You check only 'We store data requiring confidentiality beyond 10 years' (+15) and 'We operate in a regulated industry' (+15). What does the exposure score read?",
    options: ['30/100 — Moderate Exposure', '30/100 — Low Exposure', '15/100 — Low Exposure'],
    answer: 1,
    why: 'The nine weights sum to 100, so two 15-point statements give 30%. Moderate Exposure starts at 40% and High at 70%; below 40% the checklist reports lower direct exposure and advises documenting the migration plan and monitoring regulation.',
  },
  // vendor-risk
  'vendor-risk/vendor-scorecard': {
    prompt:
      'One of your selected products reports its PQC support as planned. Does it count toward the auto-detected PQC Algorithm Support dimension?',
    options: [
      'Yes — any stated PQC support counts',
      'Yes, but only at half weight',
      "No — a product counts only once its readiness reaches the hybrid-or-full tier; planned, pilot and narrative-only claims don't",
    ],
    answer: 2,
    why: "The two auto-detected dimensions measure delivered readiness, not intent: a product has to be roughly 70% of the way to fully deployed before it raises the vendor's score, which keeps roadmap promises from inflating procurement decisions.",
  },
  'vendor-risk/supply-chain-matrix': {
    prompt:
      'You open the matrix without having selected an industry or country. What does the Migration Gap × Impact section show?',
    options: [
      "Migration Gap only, worst first — Impact cannot be computed without the industry's threat data",
      'A default Impact of 3 for every domain',
      "The catalog's own migration-priority field used as Impact",
    ],
    answer: 0,
    why: "Impact is the severity-weighted count of a specific industry's threats naming each domain, so with no industry there is nothing to weigh; the step deliberately refuses to substitute the catalog's curated priority, which would justify a priority score with itself.",
  },
  // dev-quantum-impact
  'dev-quantum-impact/how-to-act': {
    prompt:
      "In the developer phased action plan, under which phase does 'Configure hybrid TLS (X25519MLKEM768) in staging' appear?",
    options: ['This Week', '90 Days', '6 Months'],
    answer: 1,
    why: 'Hybrid crypto in staging is the 90-day milestone, after the immediate crypto audit and the 30-day PQC test environment; the six-month phase is the complete protocol migration plan with a CBOM and runbooks.',
  },
  'dev-quantum-impact/self-assessment': {
    prompt:
      "You check 'I write or maintain code that configures TLS connections' (+15), 'My code directly calls cryptographic libraries' (+15) and 'I work with JWTs, signed cookies, or API authentication tokens' (+12). What does the exposure score read?",
    options: ['42/100 — Moderate Exposure', '42/100 — Low Exposure', '42/100 — High Exposure'],
    answer: 0,
    why: 'The nine competencies weigh 100 in total, so 42 points is 42%, which crosses the 40% Moderate line but stays under the 70% High line; the advice at that band is a crypto inventory plus a hybrid TLS pilot.',
  },
  // arch-quantum-impact
  'arch-quantum-impact/how-to-act': {
    prompt:
      "In the Phased Action Plan, under which phase does 'Produce Architecture Decision Records' appear?",
    options: ['This Week', '90 Days', '6 Months'],
    answer: 1,
    why: 'The plan sequences the work: crypto touchpoints are mapped this week, the abstraction layer is designed within 30 days, and only then are the algorithm, hybrid-strategy and certificate-migration decisions written up as ADRs at the 90-day mark.',
  },
  'arch-quantum-impact/self-assessment': {
    prompt:
      "You tick only 'I design or maintain PKI / certificate hierarchies' (+15), 'My architectures include KMS, HSM, or key management components' (+15) and 'Our current architecture lacks a cryptographic abstraction layer' (+12). Which exposure band does your score land in?",
    options: ['Low Exposure', 'High Exposure', 'Moderate Exposure'],
    answer: 2,
    why: 'The nine checklist weights add up to 100, so 42 points is 42%; the banding puts 70% and above at High Exposure, 40-69% at Moderate Exposure, and anything under 40% at Low Exposure.',
  },
  // ops-quantum-impact
  'ops-quantum-impact/how-to-act': {
    prompt: "In the Success Metrics panel, which metric carries the target '1 system'?",
    options: ['Pilot Completion', 'Lab Validation', 'Certificate Inventory'],
    answer: 0,
    why: 'The six-month action is to migrate one non-critical system as a proof of concept, so its matching metric is a single system fully migrated; Certificate Inventory targets 100% and Lab Validation targets Complete.',
  },
  'ops-quantum-impact/self-assessment': {
    prompt:
      "You tick only 'I manage TLS certificate lifecycle' (+15) and 'Some certificate operations are still manual' (+10), scoring 25/100. What does the result panel advise?",
    options: [
      'Start with a certificate inventory and automate any remaining manual renewal processes',
      'Review your monitoring baselines now so you have a clean pre-migration benchmark',
      'Prioritise building PQC operational playbooks and identifying which CA and VPN vendors have published timelines',
    ],
    answer: 1,
    why: '25 of 100 points is below the 40% threshold, so the step reports Low Exposure and gives the monitoring-baseline advice; the inventory-and-automation advice is reserved for 70% and above, and the playbook advice for 40-69%.',
  },
  // pqc-business-case
  'pqc-business-case/roi-calculator': {
    prompt: 'According to the Calculation Methodology, how is the Payback Period computed?',
    options: [
      'Capex divided by the monthly net annual benefit (benefit after opex), not the horizon total',
      'Total horizon cost divided by total horizon benefit',
      'Capex divided by the gross annual benefit before opex is deducted',
    ],
    answer: 0,
    why: 'Payback uses the annual net benefit (gross benefit minus annual opex) rather than the horizon-scaled total, so a longer planning horizon cannot make payback look shorter than it really is; the KPI card describes it as capex recouped from net benefit.',
  },
  'pqc-business-case/breach-simulator': {
    prompt:
      "In 'How this number is built', why does the model add no separate reputational-damage term on top of the IBM breach figure?",
    options: [
      'Reputational damage is modelled in the Cost of Inaction step instead',
      'The GRI 2025 survey does not cover reputational loss',
      "IBM's figure already includes lost business and reputational damage, so adding it again would double-count",
    ],
    answer: 2,
    why: "The cost of one breach today starts from IBM's total breach cost, which already folds in detection, notification, lost business and reputation; a second reputational line would count the same loss twice.",
  },
  'pqc-business-case/cost-of-inaction': {
    prompt:
      "The 'What this is telling you' panel says waiting costs you more over the horizon than starting now — for what reason?",
    options: [
      'Because the migration itself gets more expensive every year on its own',
      'Because you carry full exposure for longer and pay a rising premium to compress the work later',
      'Because the discount rate rises with each year of delay',
    ],
    answer: 1,
    why: 'The delayed scenario keeps full breach exposure running for the extra years and adds a per-year delay premium to the migration cost; the base migration cost itself is held constant between the two scenarios.',
  },
  'pqc-business-case/board-pitch': {
    prompt:
      "In 'How this pitch is built', what scale multiplier does the budget band get when 200 or more products are in scope?",
    options: ['×0.7', '×1.2', '×1.5'],
    answer: 2,
    why: 'The budget band is first keyed to the assessment risk level and then scaled by estate size: ×1.5 at 200+ products, ×1.2 at 50+, ×0.7 under 10 products, and ×1 otherwise.',
  },
  // pqc-governance
  'pqc-governance/raci-builder': {
    prompt:
      "You click cells until two roles on the 'Deployment' row both show 'A'. What does the step flag?",
    options: [
      "A 'Multiple Accountable assignments' warning — RACI requires exactly one A per activity",
      'Nothing — shared accountability between two roles is allowed',
      "A 'Missing Accountable assignment' warning",
    ],
    answer: 0,
    why: "Accountable is the one role that owns the outcome and signs off; the step's rule is that accountability split across two people is accountability held by no one, so more than one A on an activity raises the error banner.",
  },
  'pqc-governance/kpi-dashboard': {
    prompt: 'How is the Overall Score on the KPI Dashboard computed from the sliders?',
    options: [
      'The simple average of all KPI sliders',
      'A weighted average using the per-persona weights in the Weight column, which sum to 100%',
      'The lowest KPI score, since the weakest link sets readiness',
    ],
    answer: 1,
    why: 'Each KPI is a 0-100 measure and the selected persona lens assigns each one a weight; the weighted average is rounded to a whole number, so switching the lens changes the score even with the same slider values.',
  },
  // compliance-strategy
  'compliance-strategy/jurisdiction-mapper': {
    prompt:
      'You tick two jurisdictions whose earliest deadlines are more than three years apart and a high-severity conflict appears. Which deadline does the step say your migration must meet?',
    options: [
      'The later one, since it leaves more time to comply everywhere',
      'The earliest one across all selected jurisdictions',
      'The average of the two, as a negotiated compromise',
    ],
    answer: 1,
    why: 'A migration that spans jurisdictions is bound by the strictest regulator. The conflict panel flags any deadline gap wider than three years and tells you to plan to the earliest date so every jurisdiction is satisfied at once.',
  },
  'compliance-strategy/audit-readiness': {
    prompt:
      "You have checked 20 of the checklist's 30 items. Which maturity level does the checklist's maturity scale assign to that overall readiness?",
    options: ['Developing', 'Established', 'Optimized'],
    answer: 1,
    why: 'Overall readiness is the share of all 30 items checked, so 20 of 30 rounds to 67%. The maturity scale places 61-80% in the Established band, above Developing (41-60%) and below Optimized (81-100%).',
  },
  // migration-program
  'migration-program/roadmap-builder': {
    prompt:
      'The step says Track B (Integrity / Signatures & PKI) is not urgent today yet must start early. What reason does it give?',
    options: [
      'Trust-Now-Forge-Later: replacing signing keys and trust anchors takes years, even though forgery only matters once a quantum computer exists',
      'Harvest-Now-Decrypt-Later: signatures recorded today can be decrypted later',
      'Regulators require signature migration to finish before key-exchange migration begins',
    ],
    answer: 0,
    why: "Track A is urgent because encrypted traffic captured now can be decrypted later, but Track B's driver is lead time: forged signatures only become a threat once a quantum computer can forge them, while re-issuing signing keys and PKI trust anchors is multi-year work, so it must begin early.",
  },
  'migration-program/stakeholder-comms': {
    prompt:
      'In the Default engagement strategy selector, which strategy does the step assign to a stakeholder with high power but low interest?',
    options: ['Manage closely', 'Keep informed', 'Keep satisfied', 'Monitor'],
    answer: 2,
    why: 'The selector is a power/interest grid: high power and high interest are managed closely, low power with high interest are kept informed, low on both are monitored, and a powerful but uninterested stakeholder such as a board chair is kept satisfied so they do not become a blocker.',
  },
  'migration-program/kpi-tracker': {
    prompt:
      "One of your KPIs is locked because no data is available. How does the step's overall migration score treat that KPI?",
    options: [
      'It is left out of both the weighted sum and the total weight',
      'It counts as a score of zero and pulls the headline down',
      "It is scored at 50 with the persona's default weight",
    ],
    answer: 0,
    why: 'The headline is a weighted average over only the KPIs actually scored: locked and not-yet-scored dimensions are dropped from both the numerator and the denominator, so an unscored KPI cannot drag the number down, which is also why the step tells you how many of the KPIs the score describes.',
  },
  'migration-program/deployment-playbook': {
    prompt:
      'In the Canary Deployment section, which item is marked critical and must be satisfied before you move on to Progressive Rollout?',
    options: [
      'Increase to 10% traffic',
      'Update HSTS preload entries if applicable',
      'Run the canary for a minimum of 24 hours',
    ],
    answer: 2,
    why: 'A 1% canary only proves itself once latency, error rates and client compatibility have been watched across a full daily cycle, so the playbook makes the 24-hour soak the critical gate before widening to 10%, 50% and full production.',
  },
  // skills-team-structure
  'skills-team-structure/team-sizing': {
    prompt:
      'With the default 2,000 cryptographic instances, the First two years phase (1 / 500) and OT in scope, how many estimated program FTEs does the calculator show?',
    options: ['8', '5', '4'],
    answer: 1,
    why: '2,000 instances at one FTE per 500 gives a variable pool of 4, which already covers the three-person dedicated core (QRPM, Cryptographic Architect, PMO Analyst) rather than adding to it, and the OT toggle adds one specialist on top: 4 + 1 = 5.',
  },
  'skills-team-structure/crypto-champions': {
    prompt:
      'A platform row has a named champion but only three of the four commitments ticked. What does the roster flag that platform as?',
    options: [
      'Incomplete champion readiness',
      'An unstaffed platform',
      'Nothing — three of four commitments is enough',
    ],
    answer: 0,
    why: 'Unstaffed means no name at all. Once a champion is named, the roster checks all four readiness commitments together — foundations training, quarterly briefings, design-review sign-off and shepherding library upgrades — and lists any platform missing even one under incomplete readiness.',
  },
}

export function stepExerciseFor(moduleId: string, stepId: string): StepExercise | undefined {
  return STEP_EXERCISES[`${moduleId}/${stepId}`]
}
