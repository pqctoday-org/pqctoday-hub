// SPDX-License-Identifier: AGPL-3.0-only
export interface CertExercise {
  title: string
  prompt: string
  workshopStepIndex: number
  workshopStepLabel: string
  decisionChecklist: string[]
}

export const CERT_QUANTUM_EXERCISES: CertExercise[] = [
  {
    title: 'Scenario: Scoped CMVP vs. ACVP Evidence Audit',
    prompt:
      'A hardware security module vendor submits a bid claiming "FIPS 140-3 Level 3 PQC validated for ML-KEM-768 and ML-DSA-65." Their packet includes an ACVP certificate number for ML-KEM-768, a Modules in Process (MIP) entry for firmware v4.2, and an active FIPS 140-3 certificate for firmware v3.9 (classical only). Audit the claim, classify each artifact by what it actually proves, and specify what must be recorded as Unknown before procurement sign-off.',
    workshopStepIndex: 0,
    workshopStepLabel: 'Step 1: Why It Matters',
    decisionChecklist: [
      'Separate algorithm validation from module validation: the ACVP certificate proves only that the ML-KEM-768 implementation passed automated test vectors on a specified OE — it is not a FIPS 140-3 module certificate.',
      'Check firmware and Security Policy binding: the active FIPS 140-3 Level 3 certificate covers firmware v3.9 (classical only) and cannot be extended to v4.2; the MIP listing confirms only that v4.2 is in the CMVP queue, with no guaranteed approval date.',
      'Record Unknown for ML-DSA-65 algorithm status (no ACVP number provided), ESV entropy certificate linkage on v4.2, and IG 10.3.A CAST/PCT coverage until primary CMVP/ACVP registry records and the draft/final Security Policy are verified.',
    ],
  },
  {
    title: 'Scenario: FIPS 140-2 Historical Cutover & Re-Submission Triage',
    prompt:
      'Your engineering team maintains three cryptographic modules: (A) an HSM on a FIPS 140-2 Level 3 certificate moved to the Historical List in September 2026 serving US federal civilian agencies, (B) a software crypto library with an active FIPS 140-3 Level 1 certificate adding ML-KEM-768 and ML-DSA-65, and (C) an embedded NSS appliance facing CNSA 2.0 new-acquisition rules in January 2027. Triage the validation path, ESV/ACVP prerequisites, and realistic queue sequencing for each module.',
    workshopStepIndex: 2,
    workshopStepLabel: 'Step 3: How to Act',
    decisionChecklist: [
      'Module A (Historical FIPS 140-2, federal civilian): cannot be updated under FIPS 140-2; schedule a full FIPS 140-3 submission (including SP 800-90B ESV certificate and SP 800-90C RBG documentation) aligned with EO 14412 / OMB M-26-15 milestones (2030 key establishment, 2031 signatures).',
      'Module B (Active FIPS 140-3 Level 1 software library): verify whether adding ML-KEM-768/ML-DSA-65 qualifies for a CMVP update route or requires a new validation, build deterministic seed-driven ACVP AFT keyGen harnesses, and verify IG 10.3.A CAST/PCT self-tests before CSTL submission.',
      'Module C (NSS appliance, CNSA 2.0): verify NIAP Policy #33 Protection Profile cut-offs alongside FIPS 140-3; flag the January 2027 new-acquisition gate immediately so program management can plan exception governance or validated PQC readiness rather than assuming late-2026 lab turnaround.',
    ],
  },
  {
    title: 'Scenario: Multi-Scheme (FIPS 140-3 + EUCC + PCI) Boundary Mapping',
    prompt:
      'A global payments and identity HSM vendor wants to market one hardware platform to US federal civilian agencies, European Qualified Trust Service Providers (QTSPs), and payment acquiring networks. Map which certification scheme governs each buyer, where PQC is currently mandated versus recommended, and which evidence artifacts cannot be reused across schemes.',
    workshopStepIndex: 3,
    workshopStepLabel: 'Step 4: Certification Evidence Scope',
    decisionChecklist: [
      'US federal civilian scope: governed by FIPS 140-3 (CMVP) plus ACVP and ESV, with EO 14412 / OMB M-26-15 setting 2030 key-establishment and 2031 signature dates for agency HVAs/high-impact systems (and NIST IR 8547 setting 2030 deprecation / post-2035 disallowance).',
      'European QTSP / eIDAS scope: governed by EUCC (CIR (EU) 2024/482) and eIDAS QSCD Protection Profiles (e.g., EN 419 221-5) with EUCC ACM v2 guiding PQC parameter sets; a FIPS 140-3 certificate does not substitute for an EUCC certificate or QSCD conformity assessment.',
      'Payment network scope: device approval is governed by PCI PTS HSM v5.0 (no current PQC mandate), while operational cryptographic inventory and key-management controls fall under PCI DSS v4.0.1, PIN Security v3.1, P2PE, and KMO v1.0 — keep device approval and operational assessment evidence strictly separated.',
    ],
  },
]
