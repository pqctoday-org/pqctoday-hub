// SPDX-License-Identifier: AGPL-3.0-only
/** Canonical Hub-authored worked reference for the existing Orrin N7 capstone.
 * Revision changes when answers/assumptions change. This is fictional teaching data,
 * not a laboratory approval, certificate, deployment result or semantic grader.
 * Source symbols identify the existing authoring basis; UI sources use the module's
 * SHARED_SOURCES. Inactive paths and optional extended artifacts stay empty.
 */
import type { CapstoneState, CertPathId } from './sharedData'
import type { BoundaryLens } from './coreData'
import type { AnchorComponentId } from './anchorScenario'

export interface WorkedCapstoneField {
  cell: string
  artifact: number
  paths: 'all' | readonly CertPathId[]
  answer: string | readonly string[]
  why: string
  sourceSymbols: readonly string[]
  required: boolean
}
export interface WorkedBoundaryDecision {
  cell: string
  lens: BoundaryLens
  component: AnchorComponentId
  selected: boolean
  why: string
  contrary: string
}

export const CAPSTONE_REFERENCE = {
  id: 'crypto-product-certification-capstone-worked-reference',
  revision: 1,
  assumptions: [
    'Hub-authored teaching fixtures use fictional Orrin N7 and its four existing customer profiles. Baseline firmware 4.2.1 coverage is a scenario assumption; no actual certificate or issuing authority is claimed.',
    'Assume 5.0.0 is planned and not yet submitted. Other non-covered statuses need stated assumptions; a market date does not create certification.',
    'Level 3 and EAL4 augmented with AVA_VAN.5 are sample planning targets, not universal obligations or computed optima. Supported alternatives remain valid.',
    'Scheme and jurisdiction applicability depend on the buyer question; no new legal duty or assurance equivalence is introduced.',
    'The PCI worked reference assumes fictional hardware revision EX-A to complete the device scope. This identifier is a teaching fixture, not an actual listing.',
    'The generic CC manufacturer case uses a conditional ST-only strategy. Its issuing scheme is not provided, and recognition or validation is not established.',
  ],
  requiredFieldCount: 43,
  selectedPathRequiredCounts: {
    fips: 29,
    cc: 29,
    'eucc-eidas': 32,
    pci: 31,
  },
} as const

const WORKED_STATES = {
  fips: {
    path: 'fips',
    boundaries: {
      fips: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      cc: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      pci: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    },
    matrix: {
      'us-federal-agency': {
        fips: 'applies',
        cc: 'may-apply',
        eucc: 'does-not-answer',
        'pci-pts': 'does-not-answer',
      },
      'eu-qtsp': {
        fips: 'does-not-answer',
        cc: 'may-apply',
        eucc: 'applies',
        'pci-pts': 'does-not-answer',
      },
      'secure-element-manufacturer': {
        fips: 'may-apply',
        cc: 'may-apply',
        eucc: 'may-apply',
        'pci-pts': 'does-not-answer',
      },
      'payment-processor': {
        fips: 'may-apply',
        cc: 'does-not-answer',
        eucc: 'does-not-answer',
        'pci-pts': 'applies',
      },
    },
    fips: {
      level: '3',
      justification:
        'For this fictional Orrin N7 appliance, use Level 3 as the sample target because keys and approved services are inside a tamper-responsive enclosure with controlled roles. This is a proposed target for the named module configuration, not proof that all required areas meet the level or a rule that the federal buyer universally requires it.',
      route: 'FS',
      evidence:
        'Describe the implemented ML-KEM/ML-DSA services and parameter sets, algorithm-test scope, SSP lifecycle, self-tests/indicators, roles/services/FSM changes, and revised Security Policy/boundary. Optional hybrid is limited to the existing selected construction and its conditions. These are evidence categories to prepare in the sample, not claims that this exercise ran an algorithm validation or issued a module certificate.',
    },
    cc: {
      ppClaim: '',
      assurance: '',
      route: '',
      notes: '',
    },
    eidas: {
      links: {},
      change: '',
      notes: '',
    },
    pci: {
      scope: '',
      requirements: '',
      cloudModules: [],
      entity: [],
      pqcFlag: '',
      route: '',
    },
    claims:
      'In this fictional scenario, firmware 4.2.1 is the baseline version named by the sample module record; its approved-mode claim is limited to the module boundary and configuration named by that record.\nOrrin N7 firmware 5.0.0 adds ML-KEM and ML-DSA and is not covered by the baseline certificate; passing algorithm tests or entering a process queue does not make that firmware validated.\nA PCI PTS HSM listing identifies a device configuration at initial deployment; it does not certify every cloud service, tenant environment or payment processor operation, and it does not turn into a CC or CMVP certificate.',
    release: {
      fips: {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the fictional 4.2.1 baseline record separate. Plan an FS proposal for 5.0.0 unless a documented impact analysis establishes the existing UPDT conditions; no percentage or authority decision is guessed. Read current timeline applicability at runtime, and do not call a target date evidence or coverage.',
      },
      'cc-eucc': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Identify the actual issuing scheme and baseline ST first. For the sample new cryptographic functions, propose re-evaluation/major-change analysis of affected claims; reuse is bounded by that scheme. No complete device or trust-service status follows from the HSM component record.',
      },
      'pci-pts': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the existing baseline device listing distinct from 5.0.0. Use the existing recognized-lab scoping route and current Program Guide to plan the changed device configuration; no assumed delta, fixed PQC deadline or approval is invented.',
      },
    },
    extended: {},
  },
  cc: {
    path: 'cc',
    boundaries: {
      fips: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      cc: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      pci: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    },
    matrix: {
      'us-federal-agency': {
        fips: 'applies',
        cc: 'may-apply',
        eucc: 'does-not-answer',
        'pci-pts': 'does-not-answer',
      },
      'eu-qtsp': {
        fips: 'does-not-answer',
        cc: 'may-apply',
        eucc: 'applies',
        'pci-pts': 'does-not-answer',
      },
      'secure-element-manufacturer': {
        fips: 'may-apply',
        cc: 'may-apply',
        eucc: 'may-apply',
        'pci-pts': 'does-not-answer',
      },
      'payment-processor': {
        fips: 'may-apply',
        cc: 'does-not-answer',
        eucc: 'does-not-answer',
        'pci-pts': 'applies',
      },
    },
    fips: {
      level: '',
      justification: '',
      route: '',
      evidence: '',
    },
    cc: {
      ppClaim: 'none',
      assurance:
        'Proposed sample target: EAL4 augmented with AVA_VAN.5; issuing scheme and accepted assessment basis must be identified before any certification claim.',
      route: 're-evaluation',
      notes:
        'For the generic manufacturer case, no issuing national scheme is specified. Keep that as an explicit input, not an inferred EUCC/CCRA recognition claim. The ST-only worked strategy includes the HSM enclosure, firmware, cryptographic functions and tenant isolation; revise cryptographic SFRs, key-management/update interfaces and vulnerability assumptions for 5.0.0, and propose re-evaluation of changed claims.',
    },
    eidas: {
      links: {},
      change: '',
      notes: '',
    },
    pci: {
      scope: '',
      requirements: '',
      cloudModules: [],
      entity: [],
      pqcFlag: '',
      route: '',
    },
    claims:
      'In this fictional scenario, firmware 4.2.1 is the baseline version named by the sample module record; its approved-mode claim is limited to the module boundary and configuration named by that record.\nOrrin N7 firmware 5.0.0 adds ML-KEM and ML-DSA and is not covered by the baseline certificate; passing algorithm tests or entering a process queue does not make that firmware validated.\nA PCI PTS HSM listing identifies a device configuration at initial deployment; it does not certify every cloud service, tenant environment or payment processor operation, and it does not turn into a CC or CMVP certificate.',
    release: {
      fips: {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the fictional 4.2.1 baseline record separate. Plan an FS proposal for 5.0.0 unless a documented impact analysis establishes the existing UPDT conditions; no percentage or authority decision is guessed. Read current timeline applicability at runtime, and do not call a target date evidence or coverage.',
      },
      'cc-eucc': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Identify the actual issuing scheme and baseline ST first. For the sample new cryptographic functions, propose re-evaluation/major-change analysis of affected claims; reuse is bounded by that scheme. No complete device or trust-service status follows from the HSM component record.',
      },
      'pci-pts': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the existing baseline device listing distinct from 5.0.0. Use the existing recognized-lab scoping route and current Program Guide to plan the changed device configuration; no assumed delta, fixed PQC deadline or approval is invented.',
      },
    },
    extended: {},
  },
  'eucc-eidas': {
    path: 'eucc-eidas',
    boundaries: {
      fips: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      cc: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      pci: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    },
    matrix: {
      'us-federal-agency': {
        fips: 'applies',
        cc: 'may-apply',
        eucc: 'does-not-answer',
        'pci-pts': 'does-not-answer',
      },
      'eu-qtsp': {
        fips: 'does-not-answer',
        cc: 'may-apply',
        eucc: 'applies',
        'pci-pts': 'does-not-answer',
      },
      'secure-element-manufacturer': {
        fips: 'may-apply',
        cc: 'may-apply',
        eucc: 'may-apply',
        'pci-pts': 'does-not-answer',
      },
      'payment-processor': {
        fips: 'may-apply',
        cc: 'does-not-answer',
        eucc: 'does-not-answer',
        'pci-pts': 'applies',
      },
    },
    fips: {
      level: '',
      justification: '',
      route: '',
      evidence: '',
    },
    cc: {
      ppClaim: '',
      assurance: '',
      route: '',
      notes: '',
    },
    eidas: {
      links: {
        legal: 'eidas',
        scheme: 'eucc-reg',
        pp: 'pp-en',
        assurance: 'high-van5',
        crypto: 'acm2',
      },
      change: 'major',
      notes:
        'This example uses the existing buyer\u2019s EUCC/EN 419221-5 HSM route and applicable ACM v2 guidance at the module\u2019s stated source date. The complete QSCD assessment basis and trust-service qualification are separate; do not transfer the component certificate or draft guidance into those claims. Record the PP version and applicable change basis before making a real claim; no new date or obligation is inferred.',
    },
    pci: {
      scope: '',
      requirements: '',
      cloudModules: [],
      entity: [],
      pqcFlag: '',
      route: '',
    },
    claims:
      'In this fictional scenario, firmware 4.2.1 is the baseline version named by the sample module record; its approved-mode claim is limited to the module boundary and configuration named by that record.\nOrrin N7 firmware 5.0.0 adds ML-KEM and ML-DSA and is not covered by the baseline certificate; passing algorithm tests or entering a process queue does not make that firmware validated.\nA PCI PTS HSM listing identifies a device configuration at initial deployment; it does not certify every cloud service, tenant environment or payment processor operation, and it does not turn into a CC or CMVP certificate.',
    release: {
      fips: {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the fictional 4.2.1 baseline record separate. Plan an FS proposal for 5.0.0 unless a documented impact analysis establishes the existing UPDT conditions; no percentage or authority decision is guessed. Read current timeline applicability at runtime, and do not call a target date evidence or coverage.',
      },
      'cc-eucc': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Identify the actual issuing scheme and baseline ST first. For the sample new cryptographic functions, propose re-evaluation/major-change analysis of affected claims; reuse is bounded by that scheme. No complete device or trust-service status follows from the HSM component record.',
      },
      'pci-pts': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the existing baseline device listing distinct from 5.0.0. Use the existing recognized-lab scoping route and current Program Guide to plan the changed device configuration; no assumed delta, fixed PQC deadline or approval is invented.',
      },
    },
    extended: {},
  },
  pci: {
    path: 'pci',
    boundaries: {
      fips: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      cc: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
      pci: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    },
    matrix: {
      'us-federal-agency': {
        fips: 'applies',
        cc: 'may-apply',
        eucc: 'does-not-answer',
        'pci-pts': 'does-not-answer',
      },
      'eu-qtsp': {
        fips: 'does-not-answer',
        cc: 'may-apply',
        eucc: 'applies',
        'pci-pts': 'does-not-answer',
      },
      'secure-element-manufacturer': {
        fips: 'may-apply',
        cc: 'may-apply',
        eucc: 'may-apply',
        'pci-pts': 'does-not-answer',
      },
      'payment-processor': {
        fips: 'may-apply',
        cc: 'does-not-answer',
        eucc: 'does-not-answer',
        'pci-pts': 'applies',
      },
    },
    fips: {
      level: '',
      justification: '',
      route: '',
      evidence: '',
    },
    cc: {
      ppClaim: '',
      assurance: '',
      route: '',
      notes: '',
    },
    eidas: {
      links: {},
      change: '',
      notes: '',
    },
    pci: {
      scope:
        'Fictional Orrin N7 appliance, hardware revision EX-A (declared worked-example assumption), baseline firmware 4.2.1 and candidate firmware 5.0.0. Device hardware, firmware and cryptographic functions are scoped together; network-service operation and processor assessments remain separate. No real approval or listing identifier is claimed.',
      requirements: 'v5',
      cloudModules: ['Remote Administration', 'HSM Solution Security'],
      entity: ['PIN Security'],
      pqcFlag: 'exists',
      route: 'lab-scoping',
    },
    claims:
      'In this fictional scenario, firmware 4.2.1 is the baseline version named by the sample module record; its approved-mode claim is limited to the module boundary and configuration named by that record.\nOrrin N7 firmware 5.0.0 adds ML-KEM and ML-DSA and is not covered by the baseline certificate; passing algorithm tests or entering a process queue does not make that firmware validated.\nA PCI PTS HSM listing identifies a device configuration at initial deployment; it does not certify every cloud service, tenant environment or payment processor operation, and it does not turn into a CC or CMVP certificate.',
    release: {
      fips: {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the fictional 4.2.1 baseline record separate. Plan an FS proposal for 5.0.0 unless a documented impact analysis establishes the existing UPDT conditions; no percentage or authority decision is guessed. Read current timeline applicability at runtime, and do not call a target date evidence or coverage.',
      },
      'cc-eucc': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Identify the actual issuing scheme and baseline ST first. For the sample new cryptographic functions, propose re-evaluation/major-change analysis of affected claims; reuse is bounded by that scheme. No complete device or trust-service status follows from the HSM component record.',
      },
      'pci-pts': {
        baseline: 'covered',
        candidate: 'planned',
        route:
          'Keep the existing baseline device listing distinct from 5.0.0. Use the existing recognized-lab scoping route and current Program Guide to plan the changed device configuration; no assumed delta, fixed PQC deadline or approval is invented.',
      },
    },
    extended: {},
  },
} satisfies Record<CertPathId, CapstoneState>

export const CAPSTONE_WORKED_FIELDS: readonly WorkedCapstoneField[] = [
  {
    cell: 'boundaries.fips',
    artifact: 1,
    paths: 'all',
    answer: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    why: 'Use the existing EXPECTED_INSIDE sample for the harder cloud offering; rationale for every selected and excluded component is listed separately. Do not generalize the CC sample boundary into every possible TOE.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#EXPECTED_INSIDE',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#evaluateBoundary',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_COMPONENT_DETAILS',
    ],
    required: true,
  },
  {
    cell: 'boundaries.cc',
    artifact: 1,
    paths: 'all',
    answer: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    why: 'Use the existing EXPECTED_INSIDE sample for the harder cloud offering; rationale for every selected and excluded component is listed separately. Do not generalize the CC sample boundary into every possible TOE.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#EXPECTED_INSIDE',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#evaluateBoundary',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_COMPONENT_DETAILS',
    ],
    required: true,
  },
  {
    cell: 'boundaries.pci',
    artifact: 1,
    paths: 'all',
    answer: ['appliance-hardware', 'firmware', 'crypto-library', 'tenant-partition'],
    why: 'Use the existing EXPECTED_INSIDE sample for the harder cloud offering; rationale for every selected and excluded component is listed separately. Do not generalize the CC sample boundary into every possible TOE.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#EXPECTED_INSIDE',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#evaluateBoundary',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_COMPONENT_DETAILS',
    ],
    required: true,
  },
  {
    cell: 'matrix.us-federal-agency.fips',
    artifact: 2,
    paths: 'all',
    answer: 'applies',
    why: 'The fictional agency asks for a CMVP module in approved mode; use the exact version and configuration, not the whole cloud service.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.us-federal-agency.cc',
    artifact: 2,
    paths: 'all',
    answer: 'may-apply',
    why: 'Only if this buyer separately requests CC procurement evidence. No such additional requirement is assumed.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.us-federal-agency.eucc',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'EUCC product evidence does not answer this US CMVP module-validation question.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.us-federal-agency.pci-pts',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'A payment-device listing does not answer the agency module question.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.eu-qtsp.fips',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'A FIPS validation alone does not answer the explicitly assumed EUCC/EN 419221-5 question.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.eu-qtsp.cc',
    artifact: 2,
    paths: 'all',
    answer: 'may-apply',
    why: 'CC-based evidence may be relevant only after identifying the issuing scheme, evaluated configuration and accepted assessment basis; CCRA recognition is separate from QSCD certification.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.eu-qtsp.eucc',
    artifact: 2,
    paths: 'all',
    answer: 'applies',
    why: 'This existing sample explicitly assumes the QTSP buyer requests EUCC for the HSM against EN 419221-5. This is not a universal eIDAS route or proof of complete QSCD/trust-service qualification.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.eu-qtsp.pci-pts',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'The payment-device approval does not answer the selected QTSP HSM assessment question.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.secure-element-manufacturer.fips',
    artifact: 2,
    paths: 'all',
    answer: 'may-apply',
    why: 'A module record may be accepted as evidence for a site tool; the sample does not establish the chip evaluator\u2019s acceptance.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.secure-element-manufacturer.cc',
    artifact: 2,
    paths: 'all',
    answer: 'may-apply',
    why: 'Evidence for an HSM used in the chip-production environment is conditional on the evaluator and production-site assumptions; the HSM is not itself the chip TOE.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.secure-element-manufacturer.eucc',
    artifact: 2,
    paths: 'all',
    answer: 'may-apply',
    why: 'An EUCC HSM record may be relevant if the actual assessment route accepts it; jurisdiction/recognition is not inferred from manufacturing chips.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.secure-element-manufacturer.pci-pts',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'No payment-card personalisation requirement is stated for this fictional manufacturer; do not invent one.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.payment-processor.fips',
    artifact: 2,
    paths: 'all',
    answer: 'may-apply',
    why: 'Commercial or operational requirements may ask for a module record. A FIPS record never becomes a PTS listing, and no substitution rule is invented.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.payment-processor.cc',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'A CC certificate does not answer the payment device/operations question as stated.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.payment-processor.eucc',
    artifact: 2,
    paths: 'all',
    answer: 'does-not-answer',
    why: 'An EUCC certificate does not answer the stated PCI device/operations question.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'matrix.payment-processor.pci-pts',
    artifact: 2,
    paths: 'all',
    answer: 'applies',
    why: 'The fictional processor explicitly asks for this HSM model, hardware and firmware listing. Its PIN/P2PE/KMO operational assessments remain separate and scope-dependent.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#REFERENCE_MATRIX',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_CUSTOMER_PROFILES',
    ],
    required: true,
  },
  {
    cell: 'claims',
    artifact: 10,
    paths: 'all',
    answer:
      'In this fictional scenario, firmware 4.2.1 is the baseline version named by the sample module record; its approved-mode claim is limited to the module boundary and configuration named by that record.\nOrrin N7 firmware 5.0.0 adds ML-KEM and ML-DSA and is not covered by the baseline certificate; passing algorithm tests or entering a process queue does not make that firmware validated.\nA PCI PTS HSM listing identifies a device configuration at initial deployment; it does not certify every cloud service, tenant environment or payment processor operation, and it does not turn into a CC or CMVP certificate.',
    why: 'Each example names a record object/version or an explicit scope limit. Use these as inspectable comparison examples, not a phrase detector that certifies arbitrary alternative text. Fictional baseline coverage comes only from the existing ANCHOR_RELEASES assumption.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#FOUR_QUESTIONS',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#PASS_CONDITIONS',
    ],
    required: true,
  },
  {
    cell: 'release.fips.baseline',
    artifact: 12,
    paths: 'all',
    answer: 'covered',
    why: 'Use the existing fictional Certified baseline label: only its named firmware 4.2.1 record and configuration. This is an exercise assumption, not verification of a real certificate.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#COVERAGE_LABEL',
    ],
    required: true,
  },
  {
    cell: 'release.fips.candidate',
    artifact: 12,
    paths: 'all',
    answer: 'planned',
    why: 'For this worked planning example, explicitly assume the fictional 5.0.0 candidate has not yet been submitted and is planned. The existing anchor says no current certificate covers it. In-evaluation would require a separate explicit submission assumption; a date or test pass never means covered.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#COVERAGE_LABEL',
    ],
    required: true,
  },
  {
    cell: 'release.cc-eucc.baseline',
    artifact: 12,
    paths: 'all',
    answer: 'covered',
    why: 'Use the existing fictional Certified baseline label: only its named firmware 4.2.1 record and configuration. This is an exercise assumption, not verification of a real certificate.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#COVERAGE_LABEL',
    ],
    required: true,
  },
  {
    cell: 'release.cc-eucc.candidate',
    artifact: 12,
    paths: 'all',
    answer: 'planned',
    why: 'For this worked planning example, explicitly assume the fictional 5.0.0 candidate has not yet been submitted and is planned. The existing anchor says no current certificate covers it. In-evaluation would require a separate explicit submission assumption; a date or test pass never means covered.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#COVERAGE_LABEL',
    ],
    required: true,
  },
  {
    cell: 'release.pci-pts.baseline',
    artifact: 12,
    paths: 'all',
    answer: 'covered',
    why: 'Use the existing fictional Certified baseline label: only its named firmware 4.2.1 record and configuration. This is an exercise assumption, not verification of a real certificate.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#COVERAGE_LABEL',
    ],
    required: true,
  },
  {
    cell: 'release.pci-pts.candidate',
    artifact: 12,
    paths: 'all',
    answer: 'planned',
    why: 'For this worked planning example, explicitly assume the fictional 5.0.0 candidate has not yet been submitted and is planned. The existing anchor says no current certificate covers it. In-evaluation would require a separate explicit submission assumption; a date or test pass never means covered.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_RELEASES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#COVERAGE_LABEL',
    ],
    required: true,
  },
  {
    cell: 'fips.level',
    artifact: 3,
    paths: ['fips'],
    answer: '3',
    why: 'Use Level 3 as one fictional planning target already illustrated by the capstone baseline example, for a tamper-responsive HSM and controlled roles/services. It is not a rule that every federal buyer requires Level 3, a decision about every FIPS area, or an equivalence to EAL4. Alternative levels need their own stated threat/environment rationale.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'fips.justification',
    artifact: 3,
    paths: ['fips'],
    answer:
      'For this fictional Orrin N7 appliance, use Level 3 as the sample target because keys and approved services are inside a tamper-responsive enclosure with controlled roles. This is a proposed target for the named module configuration, not proof that all required areas meet the level or a rule that the federal buyer universally requires it.',
    why: 'This states a threat/environment-based proposed target and its limits. More than 40 characters alone does not establish a valid rationale.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'fips.route',
    artifact: 3,
    paths: ['fips'],
    answer: 'FS',
    why: 'The sample adds code, algorithms, SSP/service/self-test changes. Their per-category percentages are not supplied, so do not invent the UPDT threshold result. FS is the existing conservative planning candidate, not a declaration by CMVP; ALG/CVE/TRNS do not authorize this new cryptography.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'cc.ppClaim',
    artifact: 4,
    paths: ['cc'],
    answer: 'none',
    why: 'Use the existing ST-only option for the generic secure-element-manufacturer case: the chip PP is not the HSM PP, and that customer has not specified a mandatory HSM PP. A different existing QTSP profile explicitly requests EN 419221-5 and is covered separately below.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'cc.assurance',
    artifact: 4,
    paths: ['cc'],
    answer:
      'Proposed sample target: EAL4 augmented with AVA_VAN.5; issuing scheme and accepted assessment basis must be identified before any certification claim.',
    why: 'This uses the module\u2019s existing named-component example to teach a specific proposed assurance package, not an unexplained EAL4+ or an assertion of FIPS equivalence. The anchor does not identify the generic manufacturer\u2019s issuing scheme, so that remains an explicit input rather than an invented national scheme.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'cc.route',
    artifact: 4,
    paths: ['cc'],
    answer: 're-evaluation',
    why: 'New cryptographic security functions change the ST/TSF claims; the existing route aid proposes re-evaluation. Re-assessment of an unchanged TOE cannot certify new code, and maintenance is not automatic.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'eidas.links.legal',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer: 'eidas',
    why: 'The sample legal layer is eIDAS 2.0 and its applicable acts; eIDAS is neither the scheme nor the PP.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'eidas.links.scheme',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer: 'eucc-reg',
    why: 'Use the already explicit sample buyer requirement for EUCC; this is not a universal eIDAS/QSCD route.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'eidas.links.pp',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer: 'pp-en',
    why: 'Use the already selected EN 419221-5 PP for the HSM, not the chip platform PP and not a regulation as PP.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'eidas.links.assurance',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer: 'high-van5',
    why: 'Use the existing sample EUCC-high/EAL4 augmented AVA_VAN.5 option; name components, do not translate it into FIPS Level 4.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'eidas.links.crypto',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer: 'acm2',
    why: 'Use the module\u2019s applicable ACM v2 guidance as of its source date; do not treat ACM v3 draft as adopted or FIPS 203/204 alone as complete scheme evidence.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'eidas.change',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer: 'major',
    why: 'The new mechanisms/key-management/ST claims are the existing major-change example. Classification is proposed in the exercise; urgency is not a reason to call a change minor.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'pci.scope',
    artifact: 6,
    paths: ['pci'],
    answer:
      'Fictional Orrin N7 appliance, hardware revision EX-A (declared worked-example assumption), baseline firmware 4.2.1 and candidate firmware 5.0.0. Device hardware, firmware and cryptographic functions are scoped together; network-service operation and processor assessments remain separate. No real approval or listing identifier is claimed.',
    why: 'A complete fictional device-scope example names model, declared fictional hardware revision and separate baseline/candidate firmware. This does not borrow a real listing or infer operator assessment from device scope.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'pci.requirements',
    artifact: 6,
    paths: ['pci'],
    answer: 'v5',
    why: 'Use the existing v5.0 option for this worked new-approval/cloud planning example, with the module\u2019s dated source scope. Do not invent an effective date or declare every existing v4 device invalid.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'pci.entity',
    artifact: 6,
    paths: ['pci'],
    answer: ['PIN Security'],
    why: 'The existing timed payment-PIN customer claim explicitly establishes PIN operations. P2PE and KMO applicability remain conditional on the actual service/brand scope; no rule that KMO replaces the others is invented.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'pci.pqcFlag',
    artifact: 6,
    paths: ['pci'],
    answer: 'exists',
    why: 'The listing notation indicates support exists; it is not approval of particular PQC algorithms or parameter sets.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'pci.route',
    artifact: 6,
    paths: ['pci'],
    answer: 'lab-scoping',
    why: 'Use the existing recognized-lab scoping answer. No public source used by the module determines an automatic delta route for the changed device.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#chosenPathCheck',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/anchorScenario.ts#ANCHOR_SCENARIO',
    ],
    required: true,
  },
  {
    cell: 'release.fips.route',
    artifact: 12,
    paths: 'all',
    answer:
      'Keep the fictional 4.2.1 baseline record separate. Plan an FS proposal for 5.0.0 unless a documented impact analysis establishes the existing UPDT conditions; no percentage or authority decision is guessed. Read current timeline applicability at runtime, and do not call a target date evidence or coverage.',
    why: 'Give a useful route/timing rationale without inventing a completion year or authority outcome. The generated market date has its own scoped instrument and does not create approval.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#marketDeadlineRows',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#MANDATE_SCOPE_NOTE',
    ],
    required: false,
  },
  {
    cell: 'release.cc-eucc.route',
    artifact: 12,
    paths: 'all',
    answer:
      'Identify the actual issuing scheme and baseline ST first. For the sample new cryptographic functions, propose re-evaluation/major-change analysis of affected claims; reuse is bounded by that scheme. No complete device or trust-service status follows from the HSM component record.',
    why: 'Give a useful route/timing rationale without inventing a completion year or authority outcome. The generated market date has its own scoped instrument and does not create approval.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#marketDeadlineRows',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#MANDATE_SCOPE_NOTE',
    ],
    required: false,
  },
  {
    cell: 'release.pci-pts.route',
    artifact: 12,
    paths: 'all',
    answer:
      'Keep the existing baseline device listing distinct from 5.0.0. Use the existing recognized-lab scoping route and current Program Guide to plan the changed device configuration; no assumed delta, fixed PQC deadline or approval is invented.',
    why: 'Give a useful route/timing rationale without inventing a completion year or authority outcome. The generated market date has its own scoped instrument and does not create approval.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#marketDeadlineRows',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#MANDATE_SCOPE_NOTE',
    ],
    required: false,
  },
  {
    cell: 'fips.evidence',
    artifact: 3,
    paths: ['fips'],
    answer:
      'Describe the implemented ML-KEM/ML-DSA services and parameter sets, algorithm-test scope, SSP lifecycle, self-tests/indicators, roles/services/FSM changes, and revised Security Policy/boundary. Optional hybrid is limited to the existing selected construction and its conditions. These are evidence categories to prepare in the sample, not claims that this exercise ran an algorithm validation or issued a module certificate.',
    why: 'New algorithms affect the declared module and its evidence; no new profile, parameter selection or ACVP implementation is introduced.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#SHARED_SOURCES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
    ],
    required: false,
  },
  {
    cell: 'cc.notes',
    artifact: 4,
    paths: ['cc'],
    answer:
      'For the generic manufacturer case, no issuing national scheme is specified. Keep that as an explicit input, not an inferred EUCC/CCRA recognition claim. The ST-only worked strategy includes the HSM enclosure, firmware, cryptographic functions and tenant isolation; revise cryptographic SFRs, key-management/update interfaces and vulnerability assumptions for 5.0.0, and propose re-evaluation of changed claims.',
    why: 'Identifies the actual known unknown while supplying concrete ST/change reasoning; a long note is not a certified-quality rationale.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#FOUR_QUESTIONS',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#ROUTE_DECISION_AID',
    ],
    required: false,
  },
  {
    cell: 'eidas.notes',
    artifact: 5,
    paths: ['eucc-eidas'],
    answer:
      'This example uses the existing buyer\u2019s EUCC/EN 419221-5 HSM route and applicable ACM v2 guidance at the module\u2019s stated source date. The complete QSCD assessment basis and trust-service qualification are separate; do not transfer the component certificate or draft guidance into those claims. Record the PP version and applicable change basis before making a real claim; no new date or obligation is inferred.',
    why: 'Keeps law, scheme, PP, assurance and cryptographic guidance separate under the existing sample assumption.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#EIDAS_SCENARIO_SCOPE',
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#EIDAS_LINKS',
    ],
    required: false,
  },
  {
    cell: 'pci.cloudModules',
    artifact: 6,
    paths: ['pci'],
    answer: ['Remote Administration', 'HSM Solution Security'],
    why: 'These are the module\u2019s existing cloud-relevant examples. Key-Transfer Functionality is relevant if the declared sample service includes that functionality; do not make every module or entity assessment universal. No actual cloud service is approved by these selections.',
    sourceSymbols: [
      'src/components/PKILearning/modules/CryptoProductCertification/data/sharedData.ts#PCI_CLOUD_MODULES',
      'src/components/PKILearning/modules/CryptoProductCertification/data/coreData.ts#CUSTOMER_APPLICABILITY',
    ],
    required: false,
  },
]

export const CAPSTONE_BOUNDARY_DECISIONS: readonly WorkedBoundaryDecision[] = [
  {
    cell: 'boundaries.fips[client-sdk]',
    lens: 'fips',
    component: 'client-sdk',
    selected: false,
    why: 'Outside: runs on customer hosts; including it would change the module operational-environment scope.',
    contrary:
      'Including the client SDK adds customer-host software and its environment to the declared scope; an appliance record does not automatically cover it.',
  },
  {
    cell: 'boundaries.fips[network-service]',
    lens: 'fips',
    component: 'network-service',
    selected: false,
    why: 'Outside: cloud front-end servers are outside the tamper-responsive enclosure; do not stretch a hardware boundary over the service fleet.',
    contrary:
      'Including the network service adds the front-end/service fleet to the declared scope; a device or module record alone does not establish that service claim.',
  },
  {
    cell: 'boundaries.fips[appliance-hardware]',
    lens: 'fips',
    component: 'appliance-hardware',
    selected: true,
    why: 'Inside: the fictional tamper-responsive enclosure defines this hardware module.',
    contrary:
      'Excluding the appliance hardware removes the physical protection boundary on which this worked configuration relies.',
  },
  {
    cell: 'boundaries.fips[firmware]',
    lens: 'fips',
    component: 'firmware',
    selected: true,
    why: 'Inside: implements roles, services, self-tests and key management.',
    contrary:
      'Excluding firmware leaves the sample roles, services, self-tests and update logic outside the claimed configuration.',
  },
  {
    cell: 'boundaries.fips[crypto-library]',
    lens: 'fips',
    component: 'crypto-library',
    selected: true,
    why: 'Inside: the algorithm implementations are part of the firmware and approved services.',
    contrary:
      'Excluding the cryptographic library removes the implementation used by the sample cryptographic services from the claimed scope.',
  },
  {
    cell: 'boundaries.fips[tenant-partition]',
    lens: 'fips',
    component: 'tenant-partition',
    selected: true,
    why: 'Inside: partition enforcement is implemented by the firmware; an omitted isolation function must not be claimed validated.',
    contrary:
      'Excluding tenant-partition enforcement removes the sample isolation function from scope; tenant isolation cannot then be inferred from the record.',
  },
  {
    cell: 'boundaries.cc[client-sdk]',
    lens: 'cc',
    component: 'client-sdk',
    selected: false,
    why: 'Outside in this worked TOE: customer SDK is an environment dependency. A differently defined ST could include it, so this is not a universal CC boundary.',
    contrary:
      'Including the client SDK adds customer-host software and its environment to the declared scope; an appliance record does not automatically cover it.',
  },
  {
    cell: 'boundaries.cc[network-service]',
    lens: 'cc',
    component: 'network-service',
    selected: false,
    why: 'Outside in this worked TOE: no evaluated API/front-end claim is made. Another declared TOE may include it and must state the changed scope.',
    contrary:
      'Including the network service adds the front-end/service fleet to the declared scope; a device or module record alone does not establish that service claim.',
  },
  {
    cell: 'boundaries.cc[appliance-hardware]',
    lens: 'cc',
    component: 'appliance-hardware',
    selected: true,
    why: 'Inside: this worked HSM TOE includes physical-protection functions.',
    contrary:
      'Excluding the appliance hardware removes the physical protection boundary on which this worked configuration relies.',
  },
  {
    cell: 'boundaries.cc[firmware]',
    lens: 'cc',
    component: 'firmware',
    selected: true,
    why: 'Inside: contains the security functions and update logic claimed by this TOE.',
    contrary:
      'Excluding firmware leaves the sample roles, services, self-tests and update logic outside the claimed configuration.',
  },
  {
    cell: 'boundaries.cc[crypto-library]',
    lens: 'cc',
    component: 'crypto-library',
    selected: true,
    why: 'Inside: otherwise this TOE would not claim the cryptographic functions relied on by the sample buyer.',
    contrary:
      'Excluding the cryptographic library removes the implementation used by the sample cryptographic services from the claimed scope.',
  },
  {
    cell: 'boundaries.cc[tenant-partition]',
    lens: 'cc',
    component: 'tenant-partition',
    selected: true,
    why: 'Inside in this cloud worked TOE: tenant isolation is a claimed security function, not inferred from the cloud brand.',
    contrary:
      'Excluding tenant-partition enforcement removes the sample isolation function from scope; tenant isolation cannot then be inferred from the record.',
  },
  {
    cell: 'boundaries.pci[client-sdk]',
    lens: 'pci',
    component: 'client-sdk',
    selected: false,
    why: 'Outside the approved-device boundary: customer software/operations are not the device listing.',
    contrary:
      'Including the client SDK adds customer-host software and its environment to the declared scope; an appliance record does not automatically cover it.',
  },
  {
    cell: 'boundaries.pci[network-service]',
    lens: 'pci',
    component: 'network-service',
    selected: false,
    why: 'Outside the device scope; remote administration/cloud solution modules and operator scope remain separate.',
    contrary:
      'Including the network service adds the front-end/service fleet to the declared scope; a device or module record alone does not establish that service claim.',
  },
  {
    cell: 'boundaries.pci[appliance-hardware]',
    lens: 'pci',
    component: 'appliance-hardware',
    selected: true,
    why: 'Inside: a PTS listing names the model and hardware/firmware configuration.',
    contrary:
      'Excluding the appliance hardware removes the physical protection boundary on which this worked configuration relies.',
  },
  {
    cell: 'boundaries.pci[firmware]',
    lens: 'pci',
    component: 'firmware',
    selected: true,
    why: 'Inside: the actual approved firmware version is part of device identity.',
    contrary:
      'Excluding firmware leaves the sample roles, services, self-tests and update logic outside the claimed configuration.',
  },
  {
    cell: 'boundaries.pci[crypto-library]',
    lens: 'pci',
    component: 'crypto-library',
    selected: true,
    why: 'Inside: device cryptographic security functions belong to its evaluated configuration.',
    contrary:
      'Excluding the cryptographic library removes the implementation used by the sample cryptographic services from the claimed scope.',
  },
  {
    cell: 'boundaries.pci[tenant-partition]',
    lens: 'pci',
    component: 'tenant-partition',
    selected: true,
    why: 'Inside the worked device/function scope; this does not certify every tenant or the provider\u2019s operations.',
    contrary:
      'Excluding tenant-partition enforcement removes the sample isolation function from scope; tenant isolation cannot then be inferred from the record.',
  },
]

/** Fresh copy for inspection/tests; never use it to replace a learner draft implicitly. */
export function capstoneWorkedState(path: CertPathId): CapstoneState {
  return structuredClone(WORKED_STATES[path])
}

/** The existing timed path only, plus visible contextual fields; no all-path mandate. */
export function capstoneWorkedFields(
  path: CertPathId,
  artifact?: number
): readonly WorkedCapstoneField[] {
  return CAPSTONE_WORKED_FIELDS.filter(
    (field) =>
      (field.paths === 'all' || field.paths.includes(path)) &&
      (artifact === undefined || field.artifact === artifact)
  )
}
