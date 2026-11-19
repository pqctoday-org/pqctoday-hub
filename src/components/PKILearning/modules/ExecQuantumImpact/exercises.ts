// SPDX-License-Identifier: AGPL-3.0-only
export interface ExecExercise {
  title: string
  prompt: string
  workshopStepIndex: number
  workshopStepLabel: string
  decisionChecklist: string[]
}

export const EXEC_QUANTUM_EXERCISES: ExecExercise[] = [
  {
    title: 'Scenario: Board Quantum Risk Briefing',
    prompt:
      'You are preparing a 15-minute board briefing for a mid-sized financial institution with 30-year data retention. Separate known facts, CRQC scenarios, potentially applicable obligations, and evidence still needed. Produce three board questions and proposed owners; do not invent an exposure score.',
    workshopStepIndex: 0,
    workshopStepLabel: 'Step 1: Why It Matters',
    decisionChecklist: [
      'Known facts: 30-year confidentiality requirement + multi-year migration duration exceeds early/moderate CRQC timelines under Mosca’s inequality (shelf life + migration time > time to CRQC); NIST finalized FIPS 203/204/205 in August 2024 and final NIST IR 8547 in October 2026.',
      'Potentially applicable obligations: DORA / NIS2 (if EU financial operations apply) impose ICT/cryptography risk-management duties rather than fixed PQC dates; EO 14412 / CNSA 2.0 apply only if the institution holds covered US federal civilian or NSS contracts.',
      'Three board questions & owners: (1) What long-lived customer/transaction archives are transmitted over quantum-vulnerable key exchange today? (Owner: CISO / Chief Architect); (2) Which top-10 core banking and custody vendors have published FIPS 203/204 roadmaps vs. Unknown? (Owner: Chief Procurement Officer / TPRM); (3) What multi-year budget and steering structure will govern our PQC inventory and pilot phase? (Owner: CFO / CIO).',
    ],
  },
  {
    title: 'Scenario: Vendor PQC Readiness Review',
    prompt:
      'Your top five vendors report different PQC maturity. Identify what evidence would support each claim, record Unknown where the product or version is not scoped, and propose an owner and review date before carrying a vendor KPI into the dashboard.',
    workshopStepIndex: 3,
    workshopStepLabel: 'Step 4: Organisational Evidence Scope',
    decisionChecklist: [
      'Require product- and version-scoped evidence (e.g., CMVP module or CAVP algorithm certificate numbers for FIPS 203/204/205, CycloneDX CBOM, or release notes for the exact deployed edition) rather than marketing press releases.',
      'Record Unknown for any vendor where the deployed product edition, firmware tier, or KMS/HSM dependency is not yet verified—never count Unknown as compliant or low risk.',
      'Assign a named vendor owner (Procurement / Architecture lead) and a 30- or 90-day verification deadline before including the vendor in the KPI Dashboard.',
    ],
  },
  {
    title: 'Scenario: Compliance Deadline Collision',
    prompt:
      'Classify DORA and NIS2 as broader cyber-risk duties, NIST IR 8547 as final NIST transition guidance (not a statute), and any scoped national roadmap or mandate separately. Determine applicability before prioritizing work, and list the official source and owner who must verify each conclusion.',
    workshopStepIndex: 2,
    workshopStepLabel: 'Step 3: How to Act',
    decisionChecklist: [
      'Broader cyber-resilience statutes (DORA Regulation (EU) 2022/2554; NIS2 Directive (EU) 2022/2555): require state-of-the-art cryptographic risk management and policies, verified by General Counsel / Chief Compliance Officer.',
      'Standards transition baseline (NIST IR 8547, final October 2026): sets 2030 deprecation and post-2035 disallowance of quantum-vulnerable public-key algorithms in NIST standards; not a self-executing statute, verified by CISO / Head of Standards.',
      'Scoped government mandates (NSA CNSA 2.0 FAQ v2.2 for US NSS; EO 14412 & OMB M-26-15 for US federal civilian agencies with 2030 key-establishment / 2031 signature dates and a proposed FAR contractor rule; EU Coordinated PQC Roadmap v1.1 for 2030/2035 national milestones): verify contract and jurisdictional scope with Legal & Government Contracts lead before prioritizing spend.',
    ],
  },
]
