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
  // ── Batch 3 (2026-09-19): every workshop step the per-step probe (answer submitted) still found without exercise feedback; written from the step component and the data it renders ──
  // pqc-candidates
  'pqc-candidates/lifecycle': {
    prompt:
      "You click the 'Round 3 — Down-selection' tile. How many schemes does the round description say advance into it?",
    options: ['14', 'Nine', '40'],
    answer: 1,
    why: 'The lifecycle narrows at each round: 40 schemes were submitted in Round 1, 14 advanced to Round 2 under NIST IR 8528, and only nine (FAEST, MQOM, SDitH, UOV, MAYO, QR-UOV, SNOVA, SQIsign, HAWK) survive into the Round 3 down-selection.',
  },
  // standards-bodies
  'standards-bodies/coverage-grid': {
    prompt:
      'Which cell of the coverage grid shows only a dash, meaning no organisation is listed there?',
    options: [
      'United States — Regulatory Agency',
      'European Union — Certification Body',
      'Global — Compliance Framework',
    ],
    answer: 2,
    why: 'No truly global, legally binding compliance framework exists; the closest thing is the CCRA mutual-recognition arrangement, which sits in the certification column. Every other cell names at least one body.',
  },
  // crypto-registry
  'crypto-registry/algorithm-normalizer': {
    prompt:
      "You click the RSA2048 preset (labelled 'Vendor scanner (under-specified)'). What does the resolver report?",
    options: [
      'Resolved to a canonical family: RSASSA-PKCS1',
      'No canonical family found — the registry has no bare RSA family',
      'Resolved to a canonical family: RSAES-OAEP',
    ],
    answer: 1,
    why: "The registry deliberately splits RSA into signature families (RSASSA-PKCS1, RSASSA-PSS) and encryption families (RSAES-PKCS1, RSAES-OAEP), so a scanner that says only 'RSA2048' has not told you which one it found. That ambiguity is exactly what a fully-qualified name removes.",
  },
  'crypto-registry/curve-lookup': {
    prompt: 'You click the X25519 preset. What does the result card show in its OID box?',
    options: [
      "'Not assigned' — X25519 resolves to Curve25519, which the registry lists without an OID",
      '1.2.840.10045.3.1.7, the same OID as P-256',
      "'No canonical curve found', because X25519 is a key-agreement name rather than a curve",
    ],
    answer: 0,
    why: "X25519 is the IETF/TLS name for key agreement over the Montgomery form of Curve25519, so the lookup aliases it to the registry's Curve25519 entry. That entry carries a form (Montgomery) but no OID, which the card renders as 'Not assigned'.",
  },
  // hybrid-crypto
  'hybrid-crypto/hybrid-signatures': {
    prompt:
      'You sign and then verify under the Nesting tab. What does the separability explanation say about the EC component?',
    options: [
      'It cannot be verified alone, because the fused challenge μ binds both public keys (SNS)',
      'It is stripped out entirely by the outer ML-DSA layer, so only ML-DSA remains',
      'It still verifies alone, but swapping it for a different EC signature would invalidate the outer ML-DSA signature (WNS)',
    ],
    answer: 2,
    why: 'Nesting wraps the EC signature inside the ML-DSA signature (sign_ML(msg ‖ sig_EC)), which binds the EC component but does not stop an attacker extracting and presenting it on its own. That is Weak Non-Separability; only the fused Silithium construction reaches Strong Non-Separability.',
  },
  // crypto-mgmt-modernization
  'crypto-mgmt-modernization/no-regret-roi': {
    prompt:
      "You drag the 'P(CRQC within horizon)' slider from 100% down to 0%. Which benefit stream falls to zero?",
    options: [
      'Quantum breach avoidance — the only quantum-dependent stream, counted in Scenario B',
      'M&A readiness, because the Crypto Center of Excellence saving assumes a CRQC',
      'All six streams shrink proportionally, since the probability multiplies the whole benefit',
    ],
    answer: 0,
    why: 'The model separates five streams that pay off regardless of quantum arrival (outage avoidance, CLM automation, FIPS drift, library CVE, M&A readiness) from the single stream that depends on a CRQC materialising. Only that quantum-breach stream is multiplied by the probability, which is why Scenario A ignores it entirely.',
  },
  'crypto-mgmt-modernization/posture-kpi': {
    prompt:
      'With the Board audience filter active (the default), which of the six pre-selected KPIs appears dimmed because Board is not one of its suggested audiences?',
    options: [
      'Cert-expiry risk (≤30 d)',
      'CBOM coverage: certificates',
      '% inventory backed by current FIPS 140-3',
    ],
    answer: 1,
    why: 'Each KPI carries a suggested stakeholder list, and the designer fades any KPI whose list does not include the active audience. CBOM coverage of certificates is pitched at the CISO and architect, whereas cert-expiry risk and FIPS 140-3 coverage both name the Board.',
  },
  // pki-enrollment-protocols
  'pki-enrollment-protocols/cmp-ir': {
    prompt:
      "You click 'Send CMP Initial Request' and a certificate is issued. Which key signed that certificate?",
    options: [
      'The end-entity key you generated in Step 1',
      'The shared secret entered for PBM-MAC protection',
      "The mock CA's ML-DSA-65 key",
    ],
    answer: 2,
    why: "In a CMP Initial Request the end-entity key only proves possession inside the CRMF template; the certificate itself is built and signed by the CA. Here the in-process server's issuance callback signs it with the mock CA's ML-DSA-65 key, and the shared secret merely MAC-protects the PKIMessage exchange.",
  },
  'pki-enrollment-protocols/est-enroll': {
    prompt:
      "You run simpleenroll (CSR → PKCS#7). What envelope does the 'Response body' panel show the server returning?",
    options: [
      'base64(PKCS#7 SignedData) containing one certificate',
      'A bare PEM certificate with no wrapper',
      'A CMP PKIMessage carrying the certificate',
    ],
    answer: 0,
    why: 'EST simpleenroll (RFC 7030 §4.2) is defined by its two wire shapes: the client POSTs a base64 PKCS#10 CSR, and the server answers with a base64 PKCS#7 SignedData that carries the issued certificate. The step builds exactly that degenerate SignedData envelope around the cert.',
  },
  // merkle-tree-certs
  'merkle-tree-certs/build-tree': {
    prompt:
      "You click 'Load 8 sample certs' and then 'Build Merkle Tree'. What Inclusion Proof size do the Tree Statistics show?",
    options: ['64 B', '96 B', '256 B'],
    answer: 1,
    why: 'Eight leaves give a tree of height 3, and an inclusion proof carries one 32-byte sibling hash per level, so the proof is 3 × 32 = 96 bytes. Doubling the leaves to 16 would add only one more hash.',
  },
  'merkle-tree-certs/verify-proof': {
    prompt:
      "After selecting a leaf, you flip one hex character in a sibling hash and click 'Verify Tampered'. What does the result panel show?",
    options: [
      'Verification Passed — a single character is within tolerance',
      'Verification Passed for the untouched siblings and Failed only for the tampered one',
      'Verification Failed — the computed root diverges completely from the signed root',
    ],
    answer: 2,
    why: 'Every step of the proof hashes the running value with the next sibling, so one changed character alters that hash and every hash above it (the avalanche effect). The computed root therefore no longer matches the signed root, which is what makes Merkle proofs infeasible to forge.',
  },
  'merkle-tree-certs/size-comparison': {
    prompt:
      "You move the 'Standalone subtree' slider one step right, doubling the batch from ~2.5K to ~5K certs. How much does the standalone proof grow?",
    options: [
      'By 32 bytes — one extra sibling hash',
      'It doubles, from 384 B to 768 B',
      'It depends on which signature algorithm is selected',
    ],
    answer: 0,
    why: 'Proof size scales logarithmically with subtree size: each doubling adds one more level to the tree and hence one more 32-byte hash to the authentication path. The signature algorithm never enters into it, which is why the two MTC columns differ only by their subtree depth.',
  },
  'merkle-tree-certs/ct-log': {
    prompt:
      "In the Misissuance Audit panel you edit one certificate's subject in place and click 'Re-audit Batch'. What does the audit report?",
    options: [
      'Audit Passed — only the edited leaf hash changes, the root is unaffected',
      'Misissuance Detected — the recomputed root diverges from the published STH',
      'Audit skipped — edited certificates are excluded from the batch',
    ],
    answer: 1,
    why: "A CT monitor recomputes the Merkle root from the full batch; changing even one certificate changes its leaf hash and every hash above it, so the recomputed root no longer matches the Signed Tree Head the CA signed. The CA's ML-DSA signature over the original root cannot be forged to cover the tampered batch.",
  },
  // tls-basics
  'tls-basics/simulate': {
    prompt:
      "In the server panel's 'Hybrid (Classical + PQC)' row, what key-share size does the X25519MLKEM768 button's tooltip give?",
    options: [
      '32 B — the X25519 share alone',
      '1,184 B — the ML-KEM-768 public key alone',
      '1,216 B combined (ML-KEM-768 1,184 + X25519 32)',
    ],
    answer: 2,
    why: 'A hybrid key share concatenates both components in the ClientHello, so the client sends the 1,184-byte ML-KEM-768 encapsulation key plus the 32-byte X25519 point. That combined 1,216 bytes is the handshake cost of hedging classical and post-quantum key exchange together.',
  },
  // mls-group-messaging
  'mls-group-messaging/treekem': {
    prompt:
      "You click 'Add' until the group has 8 members, then click 'Update'. How many nodes light up as re-keyed?",
    options: [
      "4 — the committer's leaf plus the three nodes on its path up to the root",
      "8 — every member's leaf",
      '15 — every node in the tree',
    ],
    answer: 0,
    why: "A TreeKEM Commit re-keys only the committer's direct path, the chain of nodes from its leaf to the root. With 8 leaves the tree has depth 3, so that path is the leaf, two internal nodes and the root: O(log N) nodes rather than every node.",
  },
  // web-gateway-pqc
  'web-gateway-pqc/vendor-readiness': {
    prompt:
      'You tick exactly two products: one whose PQC status is Production and one whose status is Planned. What Gateway PQC Readiness Score appears?',
    options: ['50%', '65%', '100%'],
    answer: 1,
    why: "The score gives full credit to products with production PQC support and only 30% credit to products whose support is merely planned, then divides by the number selected: (1 + 0.3) / 2 = 65%. A 'No Roadmap' product would contribute nothing.",
  },
  // api-security-jwt
  'api-security-jwt/jwt-inspector': {
    prompt:
      'You switch the sample token from ES256 to ML-DSA-44. What changes in the Algorithm Analysis?',
    options: [
      'Only the badge changes; the signature stays 64 bytes',
      'The decoder now needs a public key before it can show the payload',
      'The badge flips from Quantum Vulnerable to Quantum Safe and the signature grows from 64 to 2,420 bytes',
    ],
    answer: 2,
    why: "ES256 is classical elliptic-curve signing, which Shor's algorithm breaks, so it is flagged quantum-vulnerable with a 64-byte signature. ML-DSA-44 is lattice-based and quantum-safe at NIST level 2, but its signature is 2,420 bytes, roughly 38 times larger, which is the size cost the inspector is showing you.",
  },
  'api-security-jwt/pqc-signing': {
    prompt:
      'You sign the payload with ML-DSA-65 and open the Size Comparison panel. How much larger is the ML-DSA-65 signature than the ES256 signature it is compared against?',
    options: [
      'About 52 times — 3,309 bytes versus 64 bytes',
      'About 4 times — the base64url encoding is what grows',
      'About 12 times — 3,309 bytes versus 256 bytes',
    ],
    answer: 0,
    why: 'ML-DSA-65 is a lattice signature of 3,309 bytes, while an ES256 (ECDSA P-256) signature is just 64 bytes, so the ratio the panel prints rounds to 52. The header and payload segments are unchanged; the signature segment alone drives the token growth.',
  },
  // hsm-pqc
  'hsm-pqc/pkcs11-simulator': {
    prompt:
      'In Step 3 (Encapsulate: Derive Session Key), the detail contrasts the new v3.2 encapsulate call with the classic wrap-key call. After the call returns, what leaves the HSM and what stays inside?',
    options: [
      'The derived AES key is exported so the peer can use it; the ciphertext stays inside',
      'Only the 1,088-byte KEM ciphertext leaves; the derived AES session key stays inside the HSM as a new key object',
      'Both the ciphertext and the AES key are returned, like a classic RSA-OAEP wrap',
    ],
    answer: 1,
    why: 'A KEM encapsulation does not wrap an existing key: it derives a brand-new secret key object from the shared secret and simultaneously emits the ciphertext. The ciphertext travels to the private-key holder, who decapsulates it into the same key, so the session key never has to be exposed.',
  },
  // kms-pqc
  'kms-pqc/kmip-explorer': {
    prompt:
      'On the Key Types tab, the buffer-sizing alert compares an ML-KEM-1024 secret key with an ECDH P-256 key. By what factor is the PQC secret key larger, and what does the alert say must be pre-configured before migration?',
    options: [
      'About 4x — only TLS record sizes need adjusting',
      'About 20x — only the KMIP client library needs updating',
      'About 99x (3,168 B vs 32 B) — KMIP message buffers, TLS record sizes and database columns',
    ],
    answer: 2,
    why: 'Lattice key material is orders of magnitude bigger than elliptic-curve material: an ML-KEM-1024 secret key is 3,168 bytes against 32 bytes for a P-256 key. Every hop that stores or transports the key — protocol buffers, TLS records and database columns — must be sized for that before PQC keys are created.',
  },
  'kms-pqc/aws-policy-lab': {
    prompt:
      'The solution snippet adds a Deny statement on kms:Decrypt whose condition is StringNotEquals on aws:tlsCipherSuites = TLS_AES_256_GCM_SHA384_PQ. When does that Deny actually fire?',
    options: [
      "Whenever the caller's TLS cipher suite is anything other than the PQ hybrid suite — classical-only connections are refused",
      'Only when the caller uses the PQ hybrid suite, forcing them back to classical TLS',
      'On every Decrypt call regardless of TLS, so the AppRole must be re-allowed separately',
    ],
    answer: 0,
    why: 'A Deny combined with a not-equals condition inverts the check: the statement matches exactly when the negotiated cipher suite is not the PQ suite, so classical-only connections are rejected while PQ hybrid TLS connections fall through to the Allow. That is what protects the master key from harvest-now-decrypt-later capture of its Decrypt traffic.',
  },
  // stateful-signatures
  'stateful-signatures/state-management': {
    prompt:
      'With M32 selected, you switch the Winternitz parameter from W1 to W8. According to the W explanation panel, what changes and what stays the same?',
    options: [
      'Security drops from 128-bit to 96-bit, but signing gets faster',
      'The signature gets smaller (34 chains instead of 265) at about 8 times more hash work per signature; the security level is identical',
      'Nothing but the parameter-set name changes; signature size is fixed by the tree height',
    ],
    answer: 1,
    why: 'The Winternitz parameter is a pure time-versus-bandwidth trade-off inside the one-time signature: a larger W lets each hash chain encode more bits, so fewer chains are needed and the signature shrinks, but each chain must be iterated up to W-1 times, which multiplies the signing work. Security depends on the hash output length, not on W.',
  },
  'stateful-signatures/slh-dsa-live': {
    prompt:
      "The explainer under the demo asks 'Why is SLH-DSA stateless?' when the LMS/XMSS schemes from Steps 1–3 are not. What does SLH-DSA do differently on each signing operation?",
    options: [
      'It signs with a much shorter tree, so leaf reuse is harmless',
      'It keeps the counter inside the HSM where it cannot be lost',
      'It never consumes a leaf index — it derives a fresh, ephemeral one-time key per signature from a randomizer drawn from the private key seed',
    ],
    answer: 2,
    why: 'Stateless hash-based signing replaces the monotonic leaf counter with a per-signature randomizer derived from the private seed, so every signature is self-contained and there is no register to persist or protect. That is why the same private key can be backed up, replicated across HSMs, or even held in software — things that are forbidden for LMS and XMSS.',
  },
  // slh-dsa
  'slh-dsa/keygen': {
    prompt:
      "You generate a key with SHA2-128s, then switch the parameter set to SHA2-128f and generate again. Comparing the two Parameter Details cards, what changes between the 's' and 'f' variants?",
    options: [
      "Only the signature: the public key stays 32 B at Level 1, but the signature grows from 7.7 KB to 16.7 KB because 'f' trades size for faster signing",
      'The public key doubles from 32 B to 64 B while the signature size is unchanged',
      'The NIST level rises from 1 to 3, which is why the signature is larger',
    ],
    answer: 0,
    why: "The small and fast variants of a parameter set share the same security level, hash function and 32-byte public key; they differ in how the hypertree is shaped. The 'f' layout signs faster but must include a longer authentication path, so its signature is more than twice the size of the 's' layout's.",
  },
  'slh-dsa/sign-verify': {
    prompt:
      "You sign a message in Pure mode, then open the HashSLH-DSA variants and pick SHA-256 before clicking '3. Verify Signature'. Which mode does the verify actually use?",
    options: [
      'SHA-256 pre-hash, because the dropdown is the current selection',
      'Pure — the mode the signature was made with; the step warns that verify uses the signed-with mode, not the currently selected one',
      'Both are tried and the first one that validates wins',
    ],
    answer: 1,
    why: "Pure and pre-hashed SLH-DSA sign different byte strings, so a signature is only meaningful under the mode it was produced with. The demo remembers the mode used at signing time and verifies with that, showing a warning when the selector has drifted, rather than letting a mismatched mode produce a false 'Signature Invalid'.",
  },
  'slh-dsa/context-deterministic': {
    prompt:
      "In the Pre-hash mode dropdown you pick a variant marked '(Non-FIPS 205)' such as SHA-3 and a warning appears. Which pre-hash functions does the warning say FIPS 205 §11 actually permits for HashSLH-DSA?",
    options: [
      'Any hash available in PKCS#11 v3.2, since the standard leaves the choice open',
      'Only SHA-256 — the other options exist purely for interoperability testing',
      'SHA-256, SHA-512, SHAKE-128 and SHAKE-256 — the four functions matching the internal hash families of the 12 parameter sets',
    ],
    answer: 2,
    why: 'The standard restricts pre-hashing to the same hash families the parameter sets already use internally: SHA2 sets pre-hash with SHA-256 or SHA-512, SHAKE sets with SHAKE-128 or SHAKE-256. Other functions can be requested through the PKCS#11 interface but fall outside the HashSLH-DSA specification, which is why the demo flags them.',
  },
  // email-signing
  'email-signing/live-hsm': {
    prompt:
      'The status banner comes back with the provider-missing warning (the bundle does not export the init entry point). What happens to the sign, encrypt and dual-sign demos underneath?',
    options: [
      'They still appear and work with software keys; only the HSM toggle inside each demo stays disabled',
      'They are hidden entirely until the provider registers successfully',
      'They run, but every operation is routed to the HSM and fails with an error',
    ],
    answer: 0,
    why: 'Provider registration only gates the hardware-backed path. The CMS demos are rendered for the ok, already-registered and provider-missing outcomes alike, and the banner tells the reader to fall back to Software mode, so signing and encryption still exercise real PQC keys held in the browser.',
  },
  // healthcare-pqc
  'healthcare-pqc/pharma-ip-calculator': {
    prompt:
      'With the default pipeline loaded, you drag the Estimated CRQC Year slider from 2035 (consensus) toward 2042 (conservative). What happens to Total Portfolio Exposure, and why?',
    options: [
      'It rises, because a later CRQC gives attackers more years to harvest data',
      'It falls, because a compound is only At Risk while its patent expiry is after the CRQC year, and its exposure scales with how many years past CRQC the patent still runs',
      'It stays the same — exposure depends only on commercial value and encryption choice',
    ],
    answer: 1,
    why: 'Harvest-now-decrypt-later only pays off if the stolen trial data is still commercially protected when a CRQC arrives. The calculator therefore treats each compound as exposed only when its expiry year is beyond the CRQC year, and scales the dollar exposure by that overlap (capped at ten years), so pushing CRQC later shrinks the overlap for every compound.',
  },
  'healthcare-pqc/patient-privacy-mapper': {
    prompt:
      "Click Select All, then move Expected CRQC Arrival to 2040 (conservative). How many of the 10 categories does the 'Exposed at CRQC 2040' counter show, and which one drops out?",
    options: [
      '10 of 10 — every category outlives a 14-year window',
      '8 of 10 — Adult EHR and Pediatric EHR both fall inside the window',
      '9 of 10 — only Adult EHR (10-year true retention) is shorter than the 14-year window until 2040',
    ],
    answer: 2,
    why: 'A category counts as exposed when its true retention period is longer than the years remaining until CRQC arrival, because data harvested today would still be inside its retention window when it becomes decryptable. From 2026, a 2040 CRQC leaves 14 years; Adult EHR is retained 10 years, while every other category is retained 25 years to a lifetime.',
  },
  'healthcare-pqc/device-safety-simulator': {
    prompt:
      'With the default Cardiac Pacemaker (32 KB RAM) selected, the feasibility panel says 2 of 4 evaluated algorithms are feasible. Which two, and why those?',
    options: [
      'LMS (H5/W8) and XMSS (H10) — hash-based verification needs only about 4-5 KB of RAM, whereas ML-DSA-44 verification exceeds the RAM and FN-DSA needs floating point the core lacks',
      'ML-DSA-44 and FN-DSA — lattice schemes have the smallest verification footprint',
      'ML-DSA-44 and LMS (H5/W8) — one lattice and one hash-based option for hybrid mode',
    ],
    answer: 0,
    why: 'On a tiny Cortex-M0+ class implant the binding constraint is verification memory: hash-based signature verification fits in a few kilobytes, while ML-DSA-44 needs more RAM than the device has and its 1.3 KB public key strains flash, and FN-DSA relies on double-precision floating point that must be emulated without an FPU.',
  },
  'healthcare-pqc/hospital-migration-planner': {
    prompt:
      "You change one layer's Crypto Posture from No Change to Hybrid (Classical + PQC). Which numbers on the page move, and which stay put?",
    options: [
      'Its priority score rises, moving it into an earlier phase; the budget is unaffected',
      'Its budget subtotal becomes endpoints x cost-per-endpoint x 0.7; its priority score and phase do not change because they are scored only from sensitivity, internet exposure and vendor readiness',
      'Both the score and the budget rise, since a hybrid posture is treated as higher risk',
    ],
    answer: 1,
    why: "The planner separates two questions: how urgent a layer is, and what migrating it costs. Urgency is derived from the layer's data sensitivity, whether it is internet-facing and how ready its vendors are, none of which the posture control touches; posture only sets the cost factor applied to the endpoint count.",
  },
  // automotive-pqc
  'automotive-pqc/ota-orchestration-planner': {
    prompt:
      'You switch the Signature Algorithm from ECDSA P-256 to ML-DSA-65. Which Campaign Metric does not change, and what is its value?',
    options: [
      'Fleet Bandwidth — the fleet size is what drives it, not the algorithm',
      'Sig Overhead — it is fixed at 32 signatures per package',
      'Critical Path — still Gateway ECU (15 min) then ADAS Main Controller (45 min) = 60 min, because it is the longest dependency chain by update time',
    ],
    answer: 2,
    why: "The critical path is the longest sequential chain of ECU update times through the dependency graph: every ECU depends on the gateway, and the ADAS controller's 45-minute update is the longest of those, so the chain is 15 + 45 minutes. Signature choice only adds bytes per package, which changes overhead and bandwidth, not update sequencing.",
  },
  'automotive-pqc/lifecycle-migration-roadmap': {
    prompt:
      'With the scenario left at its defaults — model year 2027, 18-year road life, CRQC arrival 2035 — what does the Vulnerable Years card show?',
    options: [
      '10 yr — the vehicle is on the road until 2045, ten years past a 2035 CRQC',
      'None — four OTA windows are enough to migrate before 2035',
      '8 yr — the vulnerability window starts at the last OTA window, not at CRQC arrival',
    ],
    answer: 0,
    why: "The vulnerability window is simply the part of the vehicle's service life that falls after the CRQC arrival year: 2027 plus 18 years puts end-of-life at 2045, and 2045 minus 2035 leaves ten years in which fielded classical crypto is breakable. OTA windows are counted separately and, as the note says, the calculation assumes no OTA crypto upgrade was deployed.",
  },
  // aerospace-pqc
  'aerospace-pqc/satellite-link-budget': {
    prompt:
      'In the Handshake Latency panel, X25519 and ML-KEM-768 show exactly the same time (for example 1.80 s on GEO), yet the data overhead line says 35.5x classical. Why are the two latencies equal?',
    options: [
      'Because the PQC handshake is compressed to the same byte count as X25519',
      'Because both handshakes take the same 3 round trips, so latency is 3 x RTT either way; what grows is the bytes per round — 1,184 + 1,088 for ML-KEM-768 versus 32 + 32 for X25519',
      'Because ML-KEM-768 needs one fewer round trip, which cancels out its larger messages',
    ],
    answer: 1,
    why: 'Over a satellite link, latency is dominated by propagation delay times the number of round trips, and a KEM-based handshake needs the same number of rounds as the classical key exchange. The PQC cost shows up as payload instead: 1,184 B key + 1,088 B ciphertext = 2,272 bytes per round (FIPS 203) against 64 against 64, which is the 35.5x overhead ratio, and matters most where every handshake is repeated for SEU-driven key refresh.',
  },
  'aerospace-pqc/fleet-interoperability-matrix': {
    prompt:
      'In the default fleet, what does the Crypto Interoperability Matrix show for the Boeing 737-800 paired with the Airbus A350 XWB?',
    options: [
      'Gateway-Mediated — the A350 is PQC-native, so a ground gateway bridges the link',
      'Native PQC — both are in-service airframes',
      'Legacy (Unprotected) — the 737-800 is gateway-only, so the pairing gets no PQC link at all',
    ],
    answer: 2,
    why: 'A link is Native PQC only when both aircraft are PQC-native and Gateway-Mediated only when both are at least retrofit-capable; an ACARS-only, gateway-only airframe like the 737-800 pulls every pairing down to Legacy.',
  },
  'aerospace-pqc/mission-crypto-lifecycle': {
    prompt:
      "The Mission PQC Readiness panel shows an 'Algorithm Decision Window'. How many years before the Launch / Delivery Year does that window open?",
    options: ['3 years before', '1 year before', '5 years before'],
    answer: 0,
    why: 'The planner back-dates a three-year design phase from launch: algorithm selection fills the first year, crypto library integration and DO-178C certification the second, key provisioning the last, so the algorithm choice must be locked three years out.',
  },
  // energy-utilities-pqc
  'energy-utilities-pqc/protocol-security-analyzer': {
    prompt:
      'Select IEC 61850 GOOSE and expand it. Which of its two crypto layers is tagged Quantum-safe, and why?',
    options: [
      'Message Authentication — HMAC-SHA256 is symmetric, so no PQC replacement is needed',
      'Key Distribution — RSA-2048 certificates are already quantum-safe',
      'Neither; both GOOSE layers are quantum-vulnerable',
    ],
    answer: 0,
    why: "Per-message GOOSE authentication is an HMAC, a symmetric construction that Shor's algorithm does not touch; the quantum exposure is the RSA-based key distribution that seeds those HMAC keys, which is why only that layer maps to ML-KEM-768.",
  },
  'energy-utilities-pqc/substation-migration-planner': {
    prompt:
      'Switch Connectivity to Air-Gapped. What does the Migration Summary say happens to the effort estimates?',
    options: [
      'They gain 30% overhead',
      'They gain 50% overhead for manual configuration and limited remote access',
      'They are unchanged; connectivity only changes zone priority',
    ],
    answer: 1,
    why: "Air-gapped sites cannot be reconfigured remotely, so every zone's hours are scaled up by half; serial links get a smaller 30% uplift, and fiber or cellular add nothing to the estimate.",
  },
  'energy-utilities-pqc/smart-meter-key-manager': {
    prompt:
      'In the DLMS/COSEM Key Types table, which key wraps the GEK and GAK during key transport and is never transmitted in cleartext?',
    options: ['GEK (Global Encryption Key)', 'KEK (Key Encryption Key)', 'HLS Secret'],
    answer: 1,
    why: 'The key-encryption key exists only to protect the other keys while they travel, which is why it rotates only on provisioning or compromise rather than annually like the global encryption and authentication keys.',
  },
  'energy-utilities-pqc/grid-migration-roadmap': {
    prompt:
      'Change Budget Level from Normal to Constrained. What changes on every phase in the Migration Gantt Chart?',
    options: [
      "Each phase's duration grows by 40%; its cost stays the same",
      "Each phase's cost grows by 40%; its duration stays the same",
      'Both cost and duration grow by 40%',
    ],
    answer: 0,
    why: "Budget in this planner is a pacing lever: a constrained budget stretches each phase's months by a factor of 1.4, while the dollar estimate is driven only by service-territory size, so the cost labels do not move.",
  },
  'energy-utilities-pqc/rf-mesh-simulator': {
    prompt: "What condition makes the simulator declare 'Mesh Collapse'?",
    options: [
      'ToA per meter exceeds 10 seconds',
      'A Pure PQC payload is selected',
      'Total Cell Time exceeds the 24-hour reporting window',
    ],
    answer: 2,
    why: "Every meter's time-on-air is summed as if the cell were perfectly scheduled; once that total overruns the daily window the meters can never all report, which is the collapse. A per-meter ToA above 10 s only raises the separate battery-drain warning.",
  },
  // iot-ot-pqc
  'iot-ot-pqc/constrained-algorithm': {
    prompt:
      "Select Class 0 (2 KB RAM). Which is the only PQC signature algorithm that shows 'Fits'?",
    options: ['XMSS (H10)', 'FN-DSA-512', 'LMS (H10/W4)'],
    answer: 2,
    why: 'LMS is the smallest PQC verifier at about half a kilobyte of RAM and a 56-byte public key; XMSS and FN-DSA start at Class 1, and no PQC KEM fits Class 0 at all, so key exchange there needs pre-shared keys or a gateway.',
  },
  'iot-ot-pqc/firmware-signing': {
    prompt:
      "After signing, which algorithm choices show a 'State counter … (monotonic, never rollback)' line under the signing step?",
    options: ['ML-DSA-44 and ML-DSA-65', 'LMS / HSS and XMSS', 'All four algorithms'],
    answer: 1,
    why: 'Hash-based LMS and XMSS are stateful one-time-signature trees: reusing a leaf index leaks the key, so the signer must advance a monotonic counter kept in a TPM or secure element on every signature. ML-DSA is stateless and needs no counter.',
  },
  'iot-ot-pqc/dtls-handshake': {
    prompt:
      'Whichever KEM and signature you pick, which DTLS 1.3 handshake message is drawn as the largest bar?',
    options: [
      'ClientHello — it carries the KEM public key',
      'Certificate — it carries three public keys and two chain signatures',
      'CertificateVerify — it carries the fresh handshake signature',
    ],
    answer: 1,
    why: "The certificate chain multiplies the signature algorithm's sizes: three certificates each carry a public key and two carry an issuer signature, so with ML-DSA-44 that one message tops 9 KB while CertificateVerify holds a single signature.",
  },
  'iot-ot-pqc/cert-chain-bloat': {
    prompt: 'Which mitigation shows the largest reduction, and why can it be that large?',
    options: [
      'Merkle Tree Certificates (−85%) — Merkle proofs replace the leaf signatures',
      'Certificate Compression (−30%) — Brotli shrinks the chain',
      'Session Resumption (PSK) (−90%) — no certificates are sent at all on reconnection',
    ],
    answer: 2,
    why: "Resuming with a pre-shared key skips the certificate exchange entirely, so the chain's size stops mattering on reconnects; the other mitigations still ship a chain, just a smaller one.",
  },
  'iot-ot-pqc/scada-assessment': {
    prompt:
      "Which posture makes a Purdue layer's Migration Priority drop to 0 and show 'Quantum-resistant'?",
    options: ['PQC Hybrid (ML-KEM + X25519)', 'TLS 1.3 (X25519)', 'ECDSA P-256 / TLS 1.3'],
    answer: 0,
    why: "TLS 1.3 on its own still keys the session with X25519, which Shor's algorithm breaks; only the hybrid that adds ML-KEM is treated as non-vulnerable, which zeroes the score regardless of internet exposure or asset lifetime.",
  },
  'iot-ot-pqc/hardware-constraints': {
    prompt:
      'In the Secure Boot Delay Calculator, which algorithm shows the fewest verification Cycles?',
    options: ['ECDSA P-256', 'ML-DSA-44', 'RSA-3072'],
    answer: 2,
    why: 'RSA verification is one modular exponentiation with a tiny public exponent, about 100k cycles here; ECDSA verification needs two scalar multiplications (2M cycles) and ML-DSA-44 sits between at 400k. Verify time is those cycles divided by the MCU clock.',
  },
  // ai-security-pqc
  'ai-security-pqc/agentic-commerce-simulator': {
    prompt:
      "Pick 'Simple Agent Purchase' and switch on the Quantum Overlay. How many of its five steps are flagged vulnerable, and why is step 2 (which uses AES-256-GCM) among them?",
    options: [
      "All five — step 2's TLS session is keyed by ECDH P-256, which Shor's algorithm breaks",
      'Four — AES-256-GCM makes step 2 quantum-safe',
      'Only the two steps that use RSA-2048',
    ],
    answer: 0,
    why: 'A symmetric cipher is only as safe as the key exchange that established its key: the AES session in step 2 is negotiated with elliptic-curve Diffie-Hellman, so a harvested transcript can be decrypted later, which is why its replacement is hybrid ML-KEM-768.',
  },
  'ai-security-pqc/scale-encryption-planner': {
    prompt:
      'Leave Retention (years) at its default of 7. Which HNDL Risk label does the PQC Migration Analysis show?',
    options: [
      'Low — data expires before most CRQC estimates',
      'Medium — retention to 2033 overlaps early CRQC estimates (2030–2035)',
      'High — retention runs well into the CRQC threat window',
    ],
    answer: 1,
    why: 'The planner adds retention to 2026: seven years lands on 2033, inside the 2031–2035 band it calls Medium; four years or fewer expires by 2030 (Low), and ten or more runs past 2035 (High).',
  },
  // confidential-computing
  'confidential-computing/tee-architecture-explorer': {
    prompt:
      "With all three filters left at 'All', what does the PQC-Ready tile show, and which platform is counted?",
    options: [
      '4 — every platform marked Planned',
      '1 — AWS Nitro Enclaves, the only one at Preview (Production or Preview count as ready)',
      '0 — no platform is at Production',
    ],
    answer: 1,
    why: "Ready here means shipping or in preview, not merely on a roadmap: AWS KMS's ML-KEM key agreement is in preview, while SGX, TDX, CCA and SEV-SNP are only Planned and TrustZone and Keystone are community-only.",
  },
  'confidential-computing/encryption-mechanisms': {
    prompt:
      'You drag the AES Key Width slider in the Grover Impact Calculator to 192-bit. What do the Post-Quantum Security cell and the assessment box show?',
    options: [
      '96-bit, and the box turns red — 96 is below the 128-bit post-quantum floor the calculator treats as safe, even though the NIST cell still reads Category 3',
      '96-bit with a green box — NIST Category 3 counts as safe',
      "192-bit — Grover's algorithm does not affect AES-192",
    ],
    answer: 0,
    why: "Grover's quadratic speedup halves the effective key strength, so the calculator reports half the classical bits and only marks a width safe when that halved figure still reaches 128 bits — which only the 256-bit setting does.",
  },
  'confidential-computing/tee-hsm-channel': {
    prompt:
      'In PQC mode, step 3 of the live provisioning demo derives the AES-256 KEK from the ML-KEM-768 shared secret with HKDF. How does the enclave end up holding the same KEK?',
    options: [
      'The HSM wraps the KEK with the attestation key and ships it inside the TLS record',
      'The KEK travels in the clear inside the signed attestation report',
      'It decapsulates the ML-KEM ciphertext and re-derives the KEK with the same HKDF info string — no KEK is ever transmitted',
    ],
    answer: 2,
    why: 'A KEM gives both parties the same shared secret without sending it; each side then runs the identical HKDF derivation, so the wrapping key exists at both ends but never crosses the channel.',
  },
  // platform-eng-pqc
  'platform-eng-pqc/crypto-posture-monitor': {
    prompt:
      "In the Capacity Planner tab's Cryptographic Object Size Comparison table, which row shows the largest size multiplier?",
    options: [
      'Signature: ECDSA P-256 → ML-DSA-65 (52×)',
      'SBOM Attestation (DSSE): ECDSA P-256 signature → SLH-DSA-128f signature (67×)',
      'TLS 1.3 Handshake: ECDSA P-256 + X25519 → ML-DSA-65 + ML-KEM-768 (4×)',
    ],
    answer: 1,
    why: 'The multiplier column divides the PQC size by the classical size, and the stateless hash-based SLH-DSA-128f signature chosen for SBOMs is by far the largest object relative to its ECDSA baseline — larger even than the ML-DSA-65 signature row.',
  },
  // soc-implementation-pqc
  'soc-implementation-pqc/how-to-act': {
    prompt:
      "In the SOC phased action plan, under which phase does 'Add ML-KEM-768/1024 and hybrid key-exchange NamedGroup codepoints to traffic-analysis rules' appear?",
    options: ['This Week', '30 Days', '90 Days'],
    answer: 1,
    why: 'The plan puts registry access and CTI subscriptions in the first week, then makes NamedGroup parsing the opening task of the downgrade-and-drift detection phase, because the hybrid-downgrade correlation rule cannot be written until the SIEM can see those codepoints.',
  },
  'soc-implementation-pqc/self-assessment': {
    prompt:
      'You tick the five heaviest statements — posture registry (+16), NamedGroup parsing (+12), east-west visibility (+12), playbooks drafted (+12) and tabletop run (+12) — and nothing else. What does the readiness panel show?',
    options: [
      '64/100 — Developing Posture',
      '64/100 — Mature SOC Posture',
      '80/100 — Mature SOC Posture',
    ],
    answer: 0,
    why: 'The nine weights sum to 100, so those five give 64 points; the Mature band only starts at 70%, and anything from 40% up to that reads as Developing, with the panel pointing at the posture registry and NamedGroup parsing as the biggest leverage.',
  },
  // verification-closure
  'verification-closure/decommission-checklist': {
    prompt:
      "You click Deprecate on the top asset but leave its 'Dependents migrated' box unticked. What happens to the Remove button?",
    options: [
      'It becomes active — Deprecate is the only prerequisite for Remove',
      'It is active, but the later re-scan reports the asset STILL present',
      "It stays disabled — Remove is gated on the 'Dependents migrated' checkbox",
    ],
    answer: 2,
    why: 'Removing a key that other systems still depend on breaks them, so the tracker refuses to advance an asset to the remove stage until the dependents have been migrated; the re-scan gate only comes into play afterwards, at verify.',
  },
  'verification-closure/coverage-planner': {
    prompt:
      'With the default inputs (40 Tier-1, 600 Tier-2, 3,400 Tier-3, a 15% sample rate, 6 waves), what does the Total verifications row show?',
    options: [
      '640 — 16% of 4,040',
      '606 — a flat 15% of 4,040',
      '4,040 — every system is verified',
    ],
    answer: 0,
    why: 'Tier-1 is verified in full (40) while only the sample rate is applied to the lower tiers (90 of Tier-2, 510 of Tier-3), so the total lands slightly above a flat 15% of the estate; any sampled failure widens that wave to 100%.',
  },
  // vendor-risk
  'vendor-risk/contract-clauses': {
    prompt:
      'In the PQC Compliance Deadline Year dropdown, which year is labelled as CNSA 2.0 full enforcement for all NSS and the year NIST IR 8547 disallows RSA/ECC?',
    options: ['2030', '2033', '2035'],
    answer: 2,
    why: "The dropdown stacks the milestones: 2030 is CNSA 2.0 exclusivity for signing and networking plus the NIST deprecation target, 2033 covers browsers, servers, cloud and operating systems, and 2035 is the point where CNSA 2.0 applies to every NSS and NIST's draft schedule disallows classical public-key algorithms.",
  },
  // research-quantum-impact
  'research-quantum-impact/how-to-act': {
    prompt:
      'In the Success Metrics panel of the researcher plan, what target is set for Hands-On Experience?',
    options: [
      '≥ 3 algorithms — ML-KEM, ML-DSA and at least one hash-based scheme',
      '≥ 1 presentation',
      'Intermediate',
    ],
    answer: 0,
    why: 'The plan measures hands-on literacy by breadth across the NIST families: a lattice KEM, a lattice signature and a hash-based signature, so a researcher has touched each of the standardised approaches rather than just one.',
  },
  'research-quantum-impact/self-assessment': {
    prompt:
      'You check three statements: data requiring >10 year confidentiality (+18), research touching cryptography/security (+15) and HPC access via SSH/VPN (+12). What does the exposure panel show?',
    options: ['45/100 — Low Exposure', '45/100 — Moderate Exposure', '45/100 — High Exposure'],
    answer: 1,
    why: 'The nine weights total 100, so those three statements give 45%; High Exposure needs 70% or more and Low is anything under 40%, so 45 lands in the Moderate band with advice to start an HNDL risk assessment for your most sensitive datasets.',
  },
  // pqc-governance
  'pqc-governance/policy-generator': {
    prompt:
      'You pick Key Management Policy. Your assessment recorded hardcoded crypto (no runtime algorithm swap) and critical data sensitivity. Which Maximum Key Rotation Period is pre-selected?',
    options: [
      '90 days — critical data sensitivity always wins',
      "2 years — hardcoded crypto can't be rotated often, so the longest safe interval is suggested",
      '1 year — the middle option when the two signals conflict',
    ],
    answer: 1,
    why: 'The rotation suggestion checks crypto agility before data sensitivity: an estate that cannot swap algorithms at runtime cannot absorb frequent rotations, so it is pushed to the longest interval even when the data would otherwise justify a 90-day cycle.',
  },
  // pqc-risk-management
  'pqc-risk-management/crqc-scenario-planner': {
    prompt:
      "You move the CRQC Arrival Year slider until the badge under it reads '6 years remaining'. Which urgency label is shown beside it?",
    options: ['CRITICAL URGENCY', 'MEDIUM URGENCY', 'HIGH URGENCY'],
    answer: 2,
    why: 'Urgency is banded purely on years remaining: three or fewer is critical, four to six is high, seven to ten is medium and anything longer is low — six sits at the top of the high band, not yet critical.',
  },
  'pqc-risk-management/risk-register-builder': {
    prompt:
      "You set an entry to Likelihood '4 — Likely' and Impact '4 — Major'. What does its badge show?",
    options: ['Score: 16 (High)', 'Score: 16 (Critical)', 'Score: 8 (Medium)'],
    answer: 0,
    why: 'The score is likelihood multiplied by impact on a 5×5 matrix, and the level bands are Critical at 20 or more, High from 12, Medium from 6 and Low below that — so 16 is High, one step short of the 5×4 or 4×5 combinations that reach Critical.',
  },
  'pqc-risk-management/compliance-gap-analysis': {
    prompt:
      'You drag the CRQC arrival slider from 2035 (Consensus) down to 2033. What happens to the overall badge on an RSA-2048 asset?',
    options: [
      'At Risk becomes Critical — CRQC now lands at least two years before the 2035 NIST Disallowance milestone',
      'Nothing — only PQC-classified assets change status when the slider moves',
      'It becomes N/A because the milestone is now after CRQC',
    ],
    answer: 0,
    why: 'A classical asset is Critical against any milestone the CRQC beats by two or more years; at 2035 no milestone is that far ahead so every classical asset is merely At Risk, but at 2033 the 2035 disallowance date qualifies and the worst-of-milestones badge escalates.',
  },
  // data-asset-sensitivity
  'data-asset-sensitivity/asset-inventory': {
    prompt:
      "You add an asset with Retention Period '5–10 years' and leave the CRQC slider at 2034. What does its HNDL Risk Year column show?",
    options: [
      '2044 — the retention is added to the CRQC year',
      "2027 — the CRQC year minus the band's 7-year midpoint, not yet flagged at risk",
      '2027 (at risk)',
    ],
    answer: 1,
    why: "The HNDL risk year is the point from which data encrypted today is still valuable when a CRQC arrives, so it is the assumed CRQC year minus the retention band's representative lifetime; it is only flagged as at risk once that year is already at or before 2026.",
  },
  'data-asset-sensitivity/sensitivity-scoring': {
    prompt:
      'You raise the Sensitivity Tier weight slider from its default 30% to 50%. What happens to the other three weights?',
    options: [
      'They stay where they are and the total reads 120% (must sum to 100%)',
      'They all reset to an equal share of the remaining 50%',
      'They are scaled down in proportion to their current values so the total stays at 100%',
    ],
    answer: 2,
    why: 'The composite score is a weighted average, so the four weights must always sum to 100%; when one slider moves, the remainder is redistributed across the other three in the same ratio they already had, and the last one absorbs any rounding.',
  },

  // ── crypto-product-certification (PCI author, 2026-09-24) — keep identical to
  //    modules/CryptoProductCertification/data/pciData.ts `stepExercises` ──
  'crypto-product-certification/pci-evidence-review': {
    prompt:
      'A payment HSM’s PTS listing carries the Post Quantum Cryptography (PQC) notation. What does that notation establish?',
    options: [
      'That the evaluated device supports PQC; which algorithms it implements is stated in its Security Policy',
      'That PCI has approved ML-KEM and ML-DSA for PIN processing on that device',
      'That the device meets a PCI deadline for migrating to PQC',
      'That the device’s FIPS 140-3 certificate also covers its PQC algorithms',
    ],
    answer: 0,
    why: 'The listing field definition says the notation "is for the existence of PQC support": algorithm details sit in the Security Policy and readiness details come from the vendor. Public PCI material names no PQC algorithm, parameter set or deadline, and a FIPS certificate is separate evidence under a separate scheme.',
  },

  // ── crypto-product-certification — FIPS author (2026-09-24) ──
  'crypto-product-certification/fips-level-planner': {
    prompt:
      'A customer’s PQC deadline is close, so Orrin N7 adds ML-KEM and ML-DSA to its already-validated HSM firmware. Which CMVP route does the planner accept?',
    options: [
      'TRNS — the deadline makes it an algorithm transition',
      'UPDT if each of the five change ratios stays under 30 %, otherwise a Full Submission',
      'ALG — it only adds algorithms',
      'CVE — it closes a quantum vulnerability',
    ],
    answer: 1,
    why: 'Route eligibility comes from the Management Manual, not the calendar: new approved algorithms, services and self-tests are security-relevant changes (UPDT under 30 % per category, else FS). TRNS needs a published CMVP transition, ALG allows no code change, and CVE may not add cryptography.',
  },
}

export function stepExerciseFor(moduleId: string, stepId: string): StepExercise | undefined {
  return STEP_EXERCISES[`${moduleId}/${stepId}`]
}
