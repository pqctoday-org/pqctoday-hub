// SPDX-License-Identifier: GPL-3.0-only
/**
 * Persona-context hints for the Compliance page.
 *
 * Each entry maps an industry label or region key to the recommended
 * Compliance tab section and a short editorial rationale shown in the
 * context banner.
 *
 * MAINTENANCE: review this file when:
 *   • A new industry is added to the Assessment wizard (src/data/assessmentData.ts)
 *   • A new certification scheme is added to the compliance CSV
 *   • NIST/EU/regional guidance changes which scheme is primary for an industry
 *
 * Keys MUST match the canonical display labels from INDUSTRY_SLUG_TO_LABEL
 * (src/data/personaConfig.ts) and the region codes from RegionBloc
 * (src/data/complianceData.ts).
 */

export interface ComplianceHint {
  /** MobileSection / desktop tab to pre-select */
  section: string
  /** Short label shown in the hint banner, e.g. "Certification Schemes → FIPS 140-3" */
  sectionLabel: string
  /** One-sentence editorial rationale */
  rationale: string
}

export const INDUSTRY_COMPLIANCE_HINT: Record<string, ComplianceHint> = {
  'Finance & Banking': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'FIPS 140-3 validated modules are mandatory for US federal financial systems and broadly adopted in banking for encryption compliance.',
  },
  'Government & Defense': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'FIPS 140-3 is required for federal information systems. Common Criteria EAL4+ applies to high-assurance defense products.',
  },
  Healthcare: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'HIPAA requires FIPS-validated encryption for ePHI. FIPS 140-3 validated modules satisfy this requirement.',
  },
  Telecommunications: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → ACVP',
    rationale:
      'Algorithm-level ACVP validation is key for telecom protocol stacks. Common Criteria applies to network infrastructure products.',
  },
  Technology: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → ACVP',
    rationale:
      'ACVP validates algorithm implementations directly. FIPS 140-3 applies if building products for federal customers.',
  },
  'Energy & Utilities': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'NERC-CIP and federal energy regulations increasingly require FIPS-validated cryptographic modules for critical infrastructure.',
  },
  Automotive: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → Common Criteria',
    rationale:
      'Common Criteria (ISO/IEC 15408) is used for automotive V2X and ECU security evaluations under UN R155.',
  },
  Aerospace: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'DO-326A and federal programs require FIPS-validated modules. Common Criteria applies to avionics security products.',
  },
  'Retail & E-Commerce': {
    section: 'certification',
    sectionLabel: 'Certification Schemes → FIPS 140-3',
    rationale:
      'PCI-DSS aligns with FIPS 140-3 for payment cryptography. FIPS validation is the baseline for payment processors.',
  },
}

/** EU region pushes the Common Criteria / EUCC tab */
export const REGION_COMPLIANCE_HINT: Record<string, ComplianceHint | undefined> = {
  eu: {
    section: 'certification',
    sectionLabel: 'Certification Schemes → Common Criteria',
    rationale:
      'EU Cybersecurity Act (EUCC scheme) mandates Common Criteria evaluations for products sold in the EU market.',
  },
}
