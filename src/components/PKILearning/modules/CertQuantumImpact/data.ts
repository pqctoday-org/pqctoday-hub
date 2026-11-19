// SPDX-License-Identifier: AGPL-3.0-only
import type { RoleGuideData } from '../../common/roleGuide/types'

export const CERT_GUIDE_DATA: RoleGuideData = {
  roleId: 'cert-engineer',
  roleLabel: 'Certification & Validation Engineer',
  tagline:
    'Your validation scoping, evidence discipline, and scheme boundary decisions determine whether PQC products ship with defensible assurance or stall in lab queues.',

  // Step 1: Why It Matters
  urgencyStatement:
    'Post-quantum adoption collides directly with certification lead times. With FIPS 140-2 certificates moved to the CMVP Historical List in September 2026, PQC algorithm testing expanding ACVP and CAST/PCT requirements, and separate clocks running across CNSA 2.0, EO 14412, EUCC, NIAP Policy #33, and PCI, certification engineers must verify exact certificate scope before engineering schedules lock in.',

  threatImpacts: [
    {
      id: 'fips-140-2-historical-cmvp-queue',
      title: 'FIPS 140-2 Historical List Transition & CMVP Queue Pressure',
      description:
        'Active FIPS 140-2 certificates transitioned to the CMVP Historical List on 21 September 2026. Adding PQC algorithms to legacy modules requires FIPS 140-3 submissions through a congested Modules in Process (MIP) queue, making submission-route planning (new validation vs. 1SUB/3SUB/5SUB) critical.',
      severity: 'critical',
      timeframe: 'Active now (Sept 2026 sunset)',
      exampleScenario:
        'A product team assumes an existing FIPS 140-2 Level 3 HSM certificate can be patched with ML-KEM-768 in six weeks. In reality, the FIPS 140-2 certificate is Historical, federal procurements require FIPS 140-3, and a new CMVP submission plus CSTL testing requires multi-quarter lead time.',
    },
    {
      id: 'acvp-aft-cast-pct',
      title: 'ACVP Seed-Driven AFT keyGen & CAST/PCT (IG 10.3.A)',
      description:
        'PQC algorithm validation introduces deterministic seed-driven Algorithm Functional Tests (AFT) for keyGen alongside encapsulation/decapsulation and signing/verification vectors. Inside the module, FIPS 140-3 IG 10.3.A requires pre-operational Cryptographic Algorithm Self-Tests (CASTs) and conditional Pairwise Consistency Tests (PCTs) for ML-KEM, ML-DSA, and SLH-DSA.',
      severity: 'critical',
      timeframe: 'Immediate lab & firmware impact',
      exampleScenario:
        'A vendor exposes only randomized ML-DSA key generation through its PKCS#11 interface. When the CSTL runs ACVP AFT keyGen vectors, the harness cannot inject deterministic 32-byte seeds, forcing a firmware test-harness redesign and re-audit of the module boundary.',
    },
    {
      id: 'esv-entropy-validation',
      title: 'Entropy Source Validation (ESV / SP 800-90B / SP 800-90C)',
      description:
        'FIPS 140-3 modules require validated entropy sources under NIST SP 800-90B via the CMVP Entropy Source Validation (ESV) program, and RBG constructions must align with NIST SP 800-90C (finalized September 2025). PQC key generation (especially ML-KEM and ML-DSA seed material) depends on full-entropy seeding and documented health tests.',
      severity: 'high',
      timeframe: 'Mandatory for FIPS 140-3 submissions',
      exampleScenario:
        'An HSM firmware team integrates ML-KEM-768 and ML-DSA-65 using a new hardware noise source, but forgets to schedule an independent ESV submission. CMVP rejects the module package until an active ESV certificate is linked to the exact OE and conditioning component.',
    },
    {
      id: 'eucc-niap-policy-33',
      title: 'EUCC (CIR (EU) 2024/482) & NIAP Policy #33 CNSA 2.0 Cut-Offs',
      description:
        'Common Criteria evaluations now split across regional schemes with distinct PQC rules: the EUCC scheme under CIR (EU) 2024/482 references the EUCC Agreed Cryptographic Mechanisms (ACM v2) for PQC parameter guidance, while US NIAP CCEVS Policy Letter #33 enforces CNSA 2.0 algorithm cut-offs for National Security System Protection Profiles.',
      severity: 'high',
      timeframe: '2026–2031 scheme milestones',
      exampleScenario:
        'A network appliance vendor targets both US NSS buyers (under NIAP cPP Network Devices + Policy #33) and European qualified signature deployments (under EUCC + EN 419 221-5). Assuming a single Common Criteria evaluation covers both schemes fails because Protection Profile claims, PQC parameter sets, and assurance continuity rules diverge.',
    },
    {
      id: 'pci-pts-vs-dss-boundaries',
      title: 'PCI PTS HSM v5.0 vs. PCI DSS v4.0.1 Scope Boundaries',
      description:
        'Payment security separates device approval (PCI PTS HSM v5.0) from operational environment compliance (PCI DSS v4.0.1, PIN Security v3.1, P2PE, KMO v1.0). PCI SSC has published PQC preparation guidance but has not yet mandated PQC algorithms in PTS HSM v5.0 — conflating PCI DSS cryptographic inventory duties with HSM device-approval rules creates costly scoping errors.',
      severity: 'medium',
      timeframe: '2026–2030 planning horizon',
      exampleScenario:
        'An acquiring bank’s audit team demands a "PCI PTS PQC-certified HSM" for a 2027 PCI DSS v4.0.1 assessment. A certification engineer must clarify that PCI DSS v4.0.1 requires cryptographic inventory and strong-cryptography governance, while PTS HSM v5.0 device approvals are listed separately by PCI SSC without a current PQC mandate.',
    },
    {
      id: 'acvp-cmvp-claim-conflation',
      title: 'Avoiding ACVP-vs.-CMVP & Marketing-Claim Conflation',
      description:
        'Vendors frequently market "FIPS 140-3 PQC validated" when they hold only an ACVP algorithm certificate, an unvalidated "FIPS-ready" build, or a Modules in Process (MIP) listing. Certification engineers and reviewers must enforce a strict evidence ladder distinguishing algorithm vectors, ESV certificates, MIP entries, and active CMVP module certificates.',
      severity: 'critical',
      timeframe: 'Ongoing procurement & review risk',
      exampleScenario:
        'A supplier cites an ACVP certificate number for ML-KEM-768 as proof of FIPS 140-3 module compliance in a federal RFP. Checking the CMVP Validated Modules database reveals the module certificate covers only an earlier firmware build without ML-KEM in its Security Policy.',
    },
  ],

  selfAssessment: [
    {
      id: 'fips-140-2-legacy',
      label:
        'Our product portfolio or estate still relies on FIPS 140-2 certificates moved to the CMVP Historical List (Sept 2026)',
      weight: 14,
    },
    {
      id: 'acvp-pqc-vectors',
      label:
        'Our cryptographic modules or test harnesses must pass ACVP AFT/VAL vectors for ML-KEM, ML-DSA, or SLH-DSA',
      weight: 14,
    },
    {
      id: 'cast-pct-ig103a',
      label:
        'We have not yet verified pre-operational CAST and conditional PCT coverage for PQC algorithms against FIPS 140-3 IG 10.3.A',
      weight: 12,
    },
    {
      id: 'esv-entropy-cert',
      label:
        'Our target FIPS 140-3 module lacks a linked, active CMVP ESV certificate or SP 800-90C RBG documentation for its target OE',
      weight: 12,
    },
    {
      id: 'nss-civilian-scope',
      label:
        'Our modules serve US National Security Systems (CNSA 2.0 / NIAP Policy #33) or federal civilian HVAs (EO 14412 / OMB M-26-15)',
      weight: 12,
    },
    {
      id: 'eucc-eidas-scope',
      label:
        'We certify or procure products under EUCC (CIR (EU) 2024/482), Common Criteria, or eIDAS QSCD Protection Profiles',
      weight: 10,
    },
    {
      id: 'pci-payment-scope',
      label:
        'Our scope spans payment HSMs (PCI PTS HSM v5.0) alongside operational PCI DSS v4.0.1 / PIN / P2PE assessments',
      weight: 8,
    },
    {
      id: 'vendor-claim-audit',
      label:
        'We lack a formal evidence-verification checklist separating ACVP certificates, MIP listings, and active CMVP Security Policies',
      weight: 10,
    },
    {
      id: 'cbom-module-mapping',
      label:
        'We have not mapped deployed firmware/library versions in a CBOM to exact CMVP, EUCC, or PCI certificate boundaries',
      weight: 8,
    },
  ],

  // Step 2: What to Learn
  skillGaps: [
    {
      id: 'scheme-architecture',
      category: 'Certification Fundamentals',
      skill: 'Multi-Scheme Certification Architecture',
      description:
        'Distinguishing standards, evaluation criteria, and certification schemes across CMVP, Common Criteria/EUCC, and PCI SSC.',
      targetLevel: 'intermediate',
      linkedModules: [
        { id: 'crypto-product-certification', label: 'Cryptographic Product Certification' },
        { id: 'standards-bodies', label: 'Standards Bodies' },
      ],
    },
    {
      id: 'fips-140-3-cmvp',
      category: 'FIPS 140-3 & CMVP',
      skill: 'FIPS 140-3 Module Boundaries, Security Policy & IG 10.3.A',
      description:
        'Defining physical/logical cryptographic boundaries, Approved services, CAST/PCT self-tests, and CMVP submission routes.',
      targetLevel: 'advanced',
      linkedModules: [
        { id: 'fips-140-3-certification', label: 'FIPS 140-3 Certification' },
        { id: 'hsm-pqc', label: 'HSM & PQC' },
      ],
    },
    {
      id: 'acvp-testing',
      category: 'Algorithm Validation',
      skill: 'ACVP Protocol, Seed-Driven AFT & Harness Engineering',
      description:
        'Running ACVTS vector sets for ML-KEM, ML-DSA, and SLH-DSA, handling deterministic keyGen seeds, and verifying OE bindings.',
      targetLevel: 'advanced',
      linkedModules: [{ id: 'acvp-lab-workflow', label: 'ACVP Lab Workflow' }],
    },
    {
      id: 'esv-entropy',
      category: 'Entropy & RBG Validation',
      skill: 'CMVP ESV, SP 800-90B Health Tests & SP 800-90C RBGs',
      description:
        'Preparing noise-source characterization, IID/non-IID min-entropy assessments, conditioning components, and ESV reuse packages.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'entropy-randomness', label: 'Entropy & Randomness' }],
    },
    {
      id: 'cc-eucc-niap',
      category: 'Common Criteria & EUCC',
      skill: 'EUCC (CIR (EU) 2024/482), ACM v2 & NIAP Policy #33',
      description:
        'Navigating Protection Profiles, Assurance Continuity, EUCC ACM v2 PQC recommendations, and NIAP CNSA 2.0 cut-offs.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'cc-eucc-certification', label: 'Common Criteria & EUCC' }],
    },
    {
      id: 'pci-boundaries',
      category: 'Payment Security',
      skill: 'PCI PTS HSM v5.0 vs. PCI DSS v4.0.1 Scoping',
      description:
        'Separating payment HSM device approvals from operational PIN, P2PE, KMO, and PCI DSS v4.0.1 audit obligations.',
      targetLevel: 'basic',
      linkedModules: [{ id: 'pci-certification', label: 'PCI Certification' }],
    },
    {
      id: 'cbom-evidence',
      category: 'Evidence & Traceability',
      skill: 'CBOM-to-Certificate Traceability',
      description:
        'Linking CycloneDX CBOM module/firmware identifiers to active CMVP, ACVP, ESV, EUCC, and PCI listing records.',
      targetLevel: 'intermediate',
      linkedModules: [{ id: 'cbom', label: 'CBOM: Cryptographic Bill of Materials' }],
    },
  ],

  knowledgeDomains: [
    {
      name: 'Scheme Foundations & Governance',
      description:
        'Understand how standards bodies, evaluation criteria, and regional certification schemes interact.',
      modules: [
        { id: 'crypto-product-certification', label: 'Product Certification' },
        { id: 'standards-bodies', label: 'Standards Bodies' },
        { id: 'cbom', label: 'CBOM' },
      ],
    },
    {
      name: 'FIPS 140-3, ACVP & Entropy (ESV)',
      description:
        'Master CMVP module validation, ACVP PQC vector workflows, and SP 800-90B/90C entropy assurance.',
      modules: [
        { id: 'fips-140-3-certification', label: 'FIPS 140-3 Certification' },
        { id: 'acvp-lab-workflow', label: 'ACVP Lab Workflow' },
        { id: 'entropy-randomness', label: 'Entropy & Randomness' },
      ],
    },
    {
      name: 'Common Criteria, EUCC & NIAP',
      description:
        'Navigate Protection Profiles, EUCC ACM v2 PQC guidance, eIDAS QSCD chains, and NIAP Policy #33.',
      modules: [{ id: 'cc-eucc-certification', label: 'Common Criteria & EUCC' }],
    },
    {
      name: 'Payment & Hardware Boundaries',
      description:
        'Separate PCI PTS HSM v5.0 device approvals from operational PCI DSS rules and HSM firmware architecture.',
      modules: [
        { id: 'pci-certification', label: 'PCI Certification' },
        { id: 'hsm-pqc', label: 'HSM & PQC' },
      ],
    },
  ],

  // Step 3: How to Act
  actionItems: [
    {
      id: 'cert-immediate-1',
      phase: 'immediate',
      title: 'Audit Active vs. Historical Certificates & ACVP Claims',
      description:
        'Verify every in-scope cryptographic module against the official CMVP, EUCC, NIAP, and PCI SSC registries.',
      checklist: [
        'Flag every FIPS 140-2 certificate moved to the CMVP Historical List (21 September 2026)',
        'Separate ACVP algorithm certificates and MIP entries from active FIPS 140-3 module certificates',
        'Record Unknown wherever a vendor cites a certificate without an exact firmware/OE match',
      ],
    },
    {
      id: 'cert-immediate-2',
      phase: 'immediate',
      title: 'Verify Applicable Policy & Scheme Clocks',
      description:
        'Map each product or deployment to the exact regulatory and scheme mandates that legally or contractually apply.',
      checklist: [
        'Distinguish US NSS (CNSA 2.0 FAQ v2.2 / NIAP Policy #33) from federal civilian (EO 14412 / OMB M-26-15)',
        'Identify EUCC (CIR (EU) 2024/482) and eIDAS QSCD requirements separately from US FIPS 140-3',
        'Document PCI PTS HSM v5.0 device-approval dates separately from PCI DSS v4.0.1 audit cycles',
      ],
    },
    {
      id: 'cert-30d-1',
      phase: '30-day',
      title: 'Validate ACVP Harness & IG 10.3.A Self-Test Readiness',
      description:
        'Confirm your module or test lab harness can execute PQC ACVP vector sets and FIPS 140-3 self-tests.',
      checklist: [
        'Verify deterministic seed-driven AFT keyGen harness support for ML-KEM, ML-DSA, and SLH-DSA',
        'Map pre-operational CASTs and conditional PCTs against current FIPS 140-3 IG 10.3.A',
        'Confirm operating environment (OE) equivalence and compiler/ABI flags match the Security Policy',
      ],
    },
    {
      id: 'cert-90d-1',
      phase: '90-day',
      title: 'Lock ESV Entropy & Multi-Scheme Evidence Packages',
      description:
        'Close entropy and cross-scheme evidence gaps before locking CSTL or ITSEF evaluation contracts.',
      checklist: [
        'Verify active CMVP ESV certificate coverage (SP 800-90B) and SP 800-90C RBG documentation',
        'Select CMVP submission route (new validation vs. 1SUB/3SUB/5SUB) and align with MIP queue lead times',
        'Reconcile FIPS 140-3 boundary documentation with EUCC Security Target / Protection Profile claims',
      ],
    },
    {
      id: 'cert-6mo-1',
      phase: '6-month',
      title: 'Operationalize CBOM-Linked Certificate Lifecycle Tracking',
      description:
        'Establish repeatable evidence hygiene so future PQC parameter or firmware updates do not break validation.',
      checklist: [
        'Link CycloneDX CBOM entries to exact CMVP, ACVP, ESV, EUCC, and PCI listing identifiers',
        'Track CMVP/EUCC assurance-continuity and automated validation (ACVTS/ESV/ACMVP) updates',
        'Schedule semi-annual Security Policy and Protection Profile drift reviews ahead of 2027–2031 gates',
      ],
    },
  ],

  quickWins: [
    {
      id: 'qw-cmvp-check',
      label: 'Verify one vendor PQC claim in CMVP',
      description:
        'Check whether a supplier’s "FIPS 140-3 PQC" claim is an active module Security Policy or merely an ACVP algorithm record.',
    },
    {
      id: 'qw-esv-check',
      label: 'Confirm ESV certificate linkage',
      description:
        'Verify that every target FIPS 140-3 module references an active ESV certificate covering its actual operating environment.',
    },
    {
      id: 'qw-scheme-map',
      label: 'Draft a 1-page scheme boundary table',
      description:
        'Map FIPS 140-3, EUCC/NIAP, and PCI PTS/DSS obligations side by side so product and audit teams stop conflating them.',
    },
  ],

  kpiMetrics: [
    {
      label: 'Historical FIPS 140-2 Exposure',
      target: 'Example: 0 in regulated scope',
      description:
        'Count of regulated deployments still relying on FIPS 140-2 Historical List certificates without a FIPS 140-3 transition plan.',
    },
    {
      label: 'Verified Certificate-to-OE Coverage',
      target: 'Example: 100%',
      description:
        'Percentage of in-scope modules whose deployed firmware and OE match an active Security Policy, EUCC certificate, or PCI listing.',
    },
    {
      label: 'ACVP PQC Harness Readiness',
      target: 'Example: 100% of target algorithms',
      description:
        'Target PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) passing demo ACVTS vector sets including seed-driven AFT keyGen.',
    },
    {
      label: 'ESV Entropy Certificate Coverage',
      target: 'Example: 100% of FIPS 140-3 submissions',
      description:
        'Percentage of planned FIPS 140-3 module submissions backed by an active SP 800-90B ESV certificate.',
    },
    {
      label: 'Unverified Vendor Claims (Unknown)',
      target: 'Example: 0 at procurement gate',
      description:
        'Count of supplier PQC certification claims still marked Unknown pending primary registry verification.',
    },
    {
      label: 'MIP / ITSEF Queue Buffer',
      target: 'Organization-set',
      description:
        'Schedule margin between planned lab submission dates and applicable 2027/2030/2031 regulatory or customer cut-offs.',
    },
  ],
}
