// SPDX-License-Identifier: GPL-3.0-only

export type ComplianceRegion = 'US Federal' | 'EU' | 'Industry-Specific' | 'Global'

export interface ComplianceMandate {
  id: string
  name: string
  fullName: string
  region: ComplianceRegion
  scope: string
  pqcRequirement: string
  hardDeadline: string | null
  deadlineYear: number | null
  pqcMandatoryNow: boolean
  relevantArticles: string[]
  url: string
}

export type IndustryComplianceMap = Record<string, string[]>

// ── Compliance Mandates ───────────────────────────────────────────────────────

export const COMPLIANCE_MANDATES: ComplianceMandate[] = [
  {
    id: 'CNSA-2.0',
    name: 'CNSA 2.0',
    fullName: 'Commercial National Security Algorithm Suite 2.0',
    region: 'US Federal',
    scope: 'US National Security Systems',
    pqcRequirement:
      'ML-KEM-1024 and ML-DSA-87 required. Software signing exclusive by 2030; all NSS by 2033.',
    hardDeadline: '2030',
    deadlineYear: 2030,
    pqcMandatoryNow: true,
    relevantArticles: ['CNSA 2.0 Timeline', 'NSA Advisory MFQ-U-OO-815099-23'],
    url: 'https://media.defense.gov/2022/Sep/07/2003071834/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS_.PDF',
  },
  {
    id: 'NIST-IR-8547',
    name: 'NIST IR 8547',
    fullName: 'Transition to Post-Quantum Cryptography Standards',
    region: 'US Federal',
    scope: 'All US federal systems; strongly recommended for private sector',
    pqcRequirement:
      'Deprecate RSA/ECC after 2030; disallow entirely after 2035. Mandates ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205).',
    hardDeadline: '2030',
    deadlineYear: 2030,
    pqcMandatoryNow: false,
    relevantArticles: ['Section 2.1 Deprecation Timeline', 'Table 1'],
    url: 'https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf',
  },
  {
    id: 'GDPR',
    name: 'GDPR',
    fullName: 'General Data Protection Regulation',
    region: 'EU',
    scope: 'Personal data of EU residents processed by any organization globally',
    pqcRequirement:
      'Article 32 requires "appropriate technical measures" including encryption. As best practice evolves, PQC will become expected. No explicit PQC mandate yet.',
    hardDeadline: null,
    deadlineYear: null,
    pqcMandatoryNow: false,
    relevantArticles: ['Article 32', 'Recital 83'],
    url: 'https://gdpr-info.eu/art-32-gdpr/',
  },
  {
    id: 'NIS2',
    name: 'NIS2',
    fullName: 'Network and Information Security Directive 2',
    region: 'EU',
    scope: 'Essential and important entities in EU member states',
    pqcRequirement:
      'Article 21 mandates cryptography and encryption policies. ENISA guidance explicitly covers PQC transition planning for essential services.',
    hardDeadline: '2024',
    deadlineYear: 2024,
    pqcMandatoryNow: true,
    relevantArticles: ['Article 21(2)(h)', 'Article 24'],
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555',
  },
  {
    id: 'DORA',
    name: 'DORA',
    fullName: 'Digital Operational Resilience Act',
    region: 'EU',
    scope: 'Financial entities (banks, insurers, investment firms) in EU',
    pqcRequirement:
      'Article 9 requires ICT security policies including cryptographic controls. Enforceable January 2025. Implicit PQC obligation as regulators update guidance.',
    hardDeadline: '2025',
    deadlineYear: 2025,
    pqcMandatoryNow: true,
    relevantArticles: ['Article 9', 'Article 10', 'Article 16'],
    url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554',
  },
  {
    id: 'HIPAA',
    name: 'HIPAA',
    fullName: 'Health Insurance Portability and Accountability Act',
    region: 'US Federal',
    scope:
      'Protected Health Information (PHI/ePHI) held by covered entities and business associates',
    pqcRequirement:
      'Security Rule requires encryption of ePHI "where feasible." HHS expected to update guidance as NIST deprecates classical algorithms.',
    hardDeadline: null,
    deadlineYear: null,
    pqcMandatoryNow: false,
    relevantArticles: ['45 CFR §164.312(a)(2)(iv)', '45 CFR §164.312(e)(2)(ii)'],
    url: 'https://www.hhs.gov/hipaa/for-professionals/security/index.html',
  },
  {
    id: 'PCI-DSS',
    name: 'PCI DSS v4.0',
    fullName: 'Payment Card Industry Data Security Standard v4.0',
    region: 'Industry-Specific',
    scope: 'Any entity that stores, processes, or transmits cardholder data',
    pqcRequirement:
      'Requirement 12.3.3 mandates cryptographic inventory and algorithm review. Req 4.2.1 targets strong cryptography. PQC explicitly planned for future versions.',
    hardDeadline: '2025',
    deadlineYear: 2025,
    pqcMandatoryNow: false,
    relevantArticles: ['Req 4.2.1', 'Req 12.3.3'],
    url: 'https://www.pcisecuritystandards.org/',
  },
  {
    id: 'FIPS-140-3',
    name: 'FIPS 140-3',
    fullName: 'FIPS 140-3 Cryptographic Module Validation Program',
    region: 'US Federal',
    scope: 'Cryptographic modules used in US federal systems',
    pqcRequirement:
      'PQC algorithms must be CMVP-validated before federal deployment. ACVP algorithm-level testing available now; full module-level validation required for production.',
    hardDeadline: null,
    deadlineYear: null,
    pqcMandatoryNow: false,
    relevantArticles: ['FIPS 140-3', 'CMVP Validation Program'],
    url: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program',
  },
  {
    id: 'CCPA-CPRA',
    name: 'CCPA/CPRA',
    fullName: 'California Consumer Privacy Act / California Privacy Rights Act',
    region: 'US Federal',
    scope: 'Personal information of California residents',
    pqcRequirement:
      'Reasonable security measures implied by statute. FTC guidance on "reasonable security" will evolve as NIST standards finalize.',
    hardDeadline: null,
    deadlineYear: null,
    pqcMandatoryNow: false,
    relevantArticles: ['Cal. Civ. Code §1798.150', 'Cal. Civ. Code §1798.100'],
    url: 'https://oag.ca.gov/privacy/ccpa',
  },
  {
    id: 'ISO-27001',
    name: 'ISO 27001',
    fullName: 'ISO/IEC 27001 Information Security Management',
    region: 'Global',
    scope: 'Organizations voluntarily seeking ISMS certification',
    pqcRequirement:
      'Annex A control A.8.24 "Use of cryptography" requires policies on algorithm lifecycle. PQC planning required as part of cryptographic risk management per ISO 27005.',
    hardDeadline: null,
    deadlineYear: null,
    pqcMandatoryNow: false,
    relevantArticles: ['A.8.24', 'ISO 27005 risk assessment'],
    url: 'https://www.iso.org/standard/27001',
  },
]

// ── Industry → Compliance Mandate Mapping ────────────────────────────────────

export const INDUSTRY_COMPLIANCE_MAP: IndustryComplianceMap = {
  'Finance & Banking': ['DORA', 'GDPR', 'PCI-DSS', 'NIST-IR-8547', 'ISO-27001', 'FIPS-140-3'],
  'Government & Defense': ['CNSA-2.0', 'NIST-IR-8547', 'FIPS-140-3'],
  Healthcare: ['HIPAA', 'GDPR', 'NIST-IR-8547', 'ISO-27001'],
  Telecommunications: ['NIS2', 'GDPR', 'NIST-IR-8547', 'ISO-27001'],
  Technology: ['GDPR', 'CCPA-CPRA', 'NIST-IR-8547', 'ISO-27001', 'PCI-DSS'],
  'Energy & Utilities': ['NIS2', 'NIST-IR-8547', 'ISO-27001'],
  Automotive: ['GDPR', 'NIS2', 'ISO-27001'],
  Aerospace: ['CNSA-2.0', 'NIST-IR-8547', 'FIPS-140-3'],
  'Retail & E-Commerce': ['GDPR', 'CCPA-CPRA', 'PCI-DSS', 'ISO-27001'],
  Insurance: ['DORA', 'GDPR', 'ISO-27001', 'NIST-IR-8547'],
  'Legal / eSignature': ['GDPR', 'NIST-IR-8547', 'ISO-27001'],
  'Payment Card Industry': ['PCI-DSS', 'GDPR', 'NIST-IR-8547', 'FIPS-140-3'],
  'Supply Chain / Logistics': ['GDPR', 'NIS2', 'ISO-27001'],
  'IoT / OT': ['NIS2', 'NIST-IR-8547', 'ISO-27001'],
  'Media / Entertainment': ['GDPR', 'CCPA-CPRA', 'ISO-27001'],
  Other: ['GDPR', 'ISO-27001', 'NIST-IR-8547'],
}

// ── Helper: get mandates for an industry ─────────────────────────────────────

export function getMandatesForIndustry(industry: string): ComplianceMandate[] {
  const ids = INDUSTRY_COMPLIANCE_MAP[industry] ?? INDUSTRY_COMPLIANCE_MAP['Other']
  return ids
    .map((id) => COMPLIANCE_MANDATES.find((m) => m.id === id))
    .filter((m): m is ComplianceMandate => m !== undefined)
}

export function getEarliestDeadline(mandateIds: string[]): {
  year: number | null
  name: string
} {
  const mandates = mandateIds
    .map((id) => COMPLIANCE_MANDATES.find((m) => m.id === id))
    .filter((m): m is ComplianceMandate => m !== undefined && m.deadlineYear !== null)
    .sort((a, b) => (a.deadlineYear ?? 9999) - (b.deadlineYear ?? 9999))

  if (mandates.length === 0) return { year: null, name: '' }
  return { year: mandates[0].deadlineYear, name: mandates[0].name }
}
