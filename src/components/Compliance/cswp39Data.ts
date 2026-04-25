// SPDX-License-Identifier: GPL-3.0-only
/**
 * Static data for the CSWP.39 Framework Explorer tab on the Compliance page.
 * Content derived from NIST CSWP.39 (Dec 2025) "Considerations for Achieving Crypto Agility".
 * Shared narrative prose lives in the CryptoMgmtModernization Learn module (content.ts);
 * this file only enumerates requirements and cross-references.
 *
 * SOURCE STALENESS: bump CSWP39_SOURCE_METADATA.dataExtractedAt and nextReviewBy
 * every time the upstream NIST CSWP.39 document is verified against this static data.
 * The vitest spec in cswp39Data.test.ts fails CI if nextReviewBy < today, forcing
 * a manual re-verification cycle.
 */

export interface CSWP39SourceMetadata {
  documentLabel: string
  documentTitle: string
  documentVersion: string
  publicationDate: string
  sourceUrl: string
  localPdfPath: string
  dataExtractedAt: string
  nextReviewBy: string
}

export const CSWP39_SOURCE_METADATA: CSWP39SourceMetadata = {
  documentLabel: 'NIST CSWP.39',
  documentTitle: 'Considerations for Achieving Cryptographic Agility',
  documentVersion: 'Final',
  publicationDate: '2025-12-19',
  sourceUrl: 'https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.39.pdf',
  localPdfPath: '/library/NIST_CSWP_39.pdf',
  dataExtractedAt: '2026-04-25',
  nextReviewBy: '2026-07-24',
}

export interface CSWP39Step {
  id: 'govern' | 'inventory' | 'identify-gaps' | 'prioritise' | 'implement'
  number: 1 | 2 | 3 | 4 | 5
  title: string
  sectionRef: string
  explainer: string
  requirements: string[]
  cpmPillar: string
}

export const CSWP39_STEPS: CSWP39Step[] = [
  {
    id: 'govern',
    number: 1,
    title: 'Govern',
    sectionRef: '§5.1–5.4',
    explainer:
      'Embed crypto policy into standards, mandates, supply chains, threats, business requirements, partner ecosystem, stakeholders, crypto policies, and crypto architecture.',
    requirements: [
      'Documented organisation-wide crypto policy',
      'RACI (Responsible, Accountable, Consulted, Informed) across crypto decisions',
      'Standards-watch subscription (IETF, NIST, CA/B Forum, ETSI, BSI, ANSSI)',
      'Stakeholder and partner-ecosystem register',
      'Exception-handling workflow with compensating-control record',
    ],
    cpmPillar: 'Governance',
  },
  {
    id: 'inventory',
    number: 2,
    title: 'Inventory',
    sectionRef: '§5.2',
    explainer:
      'Build an asset-centric Cryptographic Bill of Materials (CBOM) across all six CSWP.39 asset classes — not just certificates.',
    requirements: [
      'CBOM covering Code, Libraries, Applications, Files, Protocols, and Systems',
      'Automated ingestion from SBOM / CMDB pipelines',
      'Annual refresh cadence at minimum (daily preferred)',
      'Asset criticality and data-sensitivity metadata per record',
      'Entropy Source Validation (SP 800-90B) status tracked alongside FIPS 140-3 cert number',
    ],
    cpmPillar: 'Inventory',
  },
  {
    id: 'identify-gaps',
    number: 3,
    title: 'Identify Gaps',
    sectionRef: '§5.3',
    explainer:
      'Audit the Management Tools layer that sits between Assets and the Risk Management engine. Without this layer the Information Repository is populated manually and the Risk Analysis Engine has stale, incomplete data.',
    requirements: [
      'Crypto scanners — algorithms, key lengths, cert details across code and traffic',
      'Vulnerability management — CVE feeds, library EoL tracking',
      'Asset management — CMDB / SBOM → CBOM pipelines',
      'Log management (SIEM) — crypto-drift events, cipher-suite anomalies',
      'Zero-Trust enforcement — policy engines that block disallowed cipher suites',
      'Data classification — sensitivity tags that drive prioritisation',
    ],
    cpmPillar: 'Observability',
  },
  {
    id: 'prioritise',
    number: 4,
    title: 'Prioritise',
    sectionRef: '§5.4',
    explainer:
      'Run a Risk Analysis Prioritisation Engine informed by crypto policy to produce a ranked asset list and KPIs the organisation can act on.',
    requirements: [
      'Scoring model incorporating FIPS status, ESV status, PQC readiness, EoL, posture score',
      'Critical / High / Medium / Low queue with per-asset action guidance',
      'KPI set reviewed monthly (coverage, MTTR, drift events, validation freshness)',
      'Data-sensitivity multiplier applied to attack-surface score',
      'Feedback loop to Governance — KPI exceptions update policy-as-code',
    ],
    cpmPillar: 'Assurance',
  },
  {
    id: 'implement',
    number: 5,
    title: 'Implement — Mitigate or Migrate',
    sectionRef: '§4.6 / §5.5',
    explainer:
      'For each prioritised asset choose Migration (algorithm swap, preferred when agility allows) or Mitigation (crypto gateway / bump-in-the-wire, when direct modification is infeasible).',
    requirements: [
      'Crypto-agility assessment per asset (source available? modular API? update cadence?)',
      'Migration path with algorithm target (ML-KEM-768, ML-DSA-65, SLH-DSA) and timeline',
      'Mitigation gateway spec when migration blocked — with mandatory sunset date',
      '§4.6 callout — "Mitigation is not a permanent solution"; decommission plan required',
      'Evidence artefacts per change type — CMVP cert number, ACVP run, CVE-scan clean',
    ],
    cpmPillar: 'Lifecycle',
  },
]

export interface CSWP39Tier {
  level: 1 | 2 | 3 | 4
  name: string
  characteristics: string
  howToReach: string[]
  tone: 'error' | 'warning' | 'info' | 'success'
}

export const CSWP39_TIERS: CSWP39Tier[] = [
  {
    level: 1,
    name: 'Partial',
    characteristics:
      'Crypto practices unstructured; each team selects its own algorithms; no formal policy; supply-chain crypto risks unknown.',
    howToReach: ['Ad-hoc crypto choices are the baseline — no specific criteria'],
    tone: 'error',
  },
  {
    level: 2,
    name: 'Risk-Informed',
    characteristics:
      'Management-approved crypto policy exists but not organisation-wide; cryptographic architecture being developed; risk assessments drive prioritisation.',
    howToReach: [
      'Publish a management-approved crypto policy',
      'Stand up initial cryptographic inventory (certificates + libraries)',
      'Run first organisation-wide crypto-risk assessment',
    ],
    tone: 'warning',
  },
  {
    level: 3,
    name: 'Repeatable',
    characteristics:
      'Crypto agility formally integrated into risk management; roles and responsibilities defined; automated discovery and remediation tools deployed; agility practices tested.',
    howToReach: [
      'Automate CBOM ingestion from SBOM / CMDB pipelines',
      'Deploy crypto scanners, SIEM drift alerts, CMVP change-notice subscriptions',
      'Run tabletop exercises simulating algorithm / cert / library swap',
    ],
    tone: 'info',
  },
  {
    level: 4,
    name: 'Adaptive',
    characteristics:
      'Crypto agility measured and reported to executives; linked to financial and mission objectives; policies updated in near-real-time as standards and threats evolve.',
    howToReach: [
      'Policy-as-code with automated enforcement gates',
      'Continuous CMVP / ACVP / ESV synchronisation with inventory',
      'Board-level crypto attestation quarterly; IG-delta impact analysis live',
    ],
    tone: 'success',
  },
]

export interface CSWP39CrossWalkRow {
  stepId: CSWP39Step['id']
  frameworks: Array<{
    label: string
    hint: string
    /** Search term used on the Compliance Frameworks tab to surface the matching record */
    searchQuery: string
    /** Which of the existing 5 tabs to jump to */
    targetTab: 'standards' | 'technical' | 'certification' | 'compliance'
  }>
}

export const CSWP39_CROSS_WALK: CSWP39CrossWalkRow[] = [
  {
    stepId: 'govern',
    frameworks: [
      {
        label: 'OMB M-23-02',
        hint: 'US federal crypto-inventory mandate through 2035',
        searchQuery: 'OMB',
        targetTab: 'compliance',
      },
      {
        label: 'DORA Art. 9',
        hint: 'EU ICT risk management',
        searchQuery: 'DORA',
        targetTab: 'compliance',
      },
      {
        label: 'NIS2 Art. 21',
        hint: 'EU cybersecurity measures including cryptography',
        searchQuery: 'NIS2',
        targetTab: 'compliance',
      },
      {
        label: 'NSM-10',
        hint: 'US National Security Memorandum on quantum',
        searchQuery: 'NSM',
        targetTab: 'compliance',
      },
    ],
  },
  {
    stepId: 'inventory',
    frameworks: [
      {
        label: 'OMB M-23-02',
        hint: 'Annual crypto-inventory submission',
        searchQuery: 'OMB',
        targetTab: 'compliance',
      },
      {
        label: 'CNSA 2.0',
        hint: 'NSS inventory of classical and PQC crypto',
        searchQuery: 'CNSA',
        targetTab: 'compliance',
      },
      {
        label: 'CycloneDX CBOM',
        hint: 'OWASP CBOM authoritative schema',
        searchQuery: 'CycloneDX',
        targetTab: 'technical',
      },
    ],
  },
  {
    stepId: 'identify-gaps',
    frameworks: [
      {
        label: 'FIPS 140-3 IG',
        hint: 'NIST CMVP Implementation Guidance updates',
        searchQuery: 'FIPS 140-3',
        targetTab: 'certification',
      },
      {
        label: 'CMVP change notices',
        hint: 'CMVP Modules-in-Process queue',
        searchQuery: 'CMVP',
        targetTab: 'certification',
      },
    ],
  },
  {
    stepId: 'prioritise',
    frameworks: [
      {
        label: 'NIST SP 800-131A',
        hint: 'Algorithm-transition priorities (3DES / RSA-1024 sunset)',
        searchQuery: '800-131A',
        targetTab: 'technical',
      },
      {
        label: 'CNSA 2.0 deadlines',
        hint: 'NSS PQC deadlines 2030 / 2033',
        searchQuery: 'CNSA',
        targetTab: 'compliance',
      },
    ],
  },
  {
    stepId: 'implement',
    frameworks: [
      {
        label: 'FIPS 203 / 204 / 205',
        hint: 'ML-KEM, ML-DSA, SLH-DSA PQC standards',
        searchQuery: 'FIPS 203',
        targetTab: 'technical',
      },
      {
        label: 'FIPS 140-3 Level 3',
        hint: 'Validated module requirement',
        searchQuery: 'FIPS 140-3',
        targetTab: 'certification',
      },
      {
        label: 'ACVP',
        hint: 'Automated Cryptographic Validation Protocol',
        searchQuery: 'ACVP',
        targetTab: 'certification',
      },
      {
        label: 'CA/B SC-081v3',
        hint: '47-day TLS cert cadence by March 2029',
        searchQuery: 'SC-081',
        targetTab: 'compliance',
      },
    ],
  },
]
