// SPDX-License-Identifier: GPL-3.0-only
/**
 * Static framework requirement data for the Regulatory Gap Assessment workshop step.
 * Keyed by jurisdiction ID matching JurisdictionMapper's JURISDICTIONS list.
 */

export interface FrameworkRequirement {
  id: string
  category: 'Inventory' | 'Algorithm' | 'Certification' | 'Policy' | 'Supply Chain' | 'Timeline'
  requirement: string
  framework: string
  commonGap: boolean
  effort: 'Low' | 'Medium' | 'High'
  deadline?: number
}

export interface JurisdictionFramework {
  jurisdictionId: string
  jurisdictionLabel: string
  primaryFramework: string
  secondaryFrameworks: string[]
  requirements: FrameworkRequirement[]
}

export const JURISDICTION_FRAMEWORKS: JurisdictionFramework[] = [
  {
    jurisdictionId: 'us',
    jurisdictionLabel: 'United States',
    primaryFramework: 'CNSA 2.0 / NIST IR 8547',
    secondaryFrameworks: ['FIPS 140-3', 'NIST SP 800-131A', 'CMMC 2.0'],
    requirements: [
      {
        id: 'us-inv-1',
        category: 'Inventory',
        requirement:
          'Maintain a complete cryptographic inventory of all assets using classical public-key algorithms',
        framework: 'NIST IR 8547',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'us-alg-1',
        category: 'Algorithm',
        requirement:
          'Deploy ML-KEM for all new key establishment; plan migration of existing RSA/ECDH systems',
        framework: 'CNSA 2.0',
        commonGap: true,
        effort: 'High',
        deadline: 2030,
      },
      {
        id: 'us-alg-2',
        category: 'Algorithm',
        requirement:
          'Deploy ML-DSA or SLH-DSA for all digital signature applications; retire RSA and ECDSA',
        framework: 'CNSA 2.0',
        commonGap: true,
        effort: 'High',
        deadline: 2030,
      },
      {
        id: 'us-cert-1',
        category: 'Certification',
        requirement:
          'Use only FIPS 140-3 validated cryptographic modules for classified or sensitive federal systems',
        framework: 'FIPS 140-3',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'us-pol-1',
        category: 'Policy',
        requirement:
          'Document PQC migration plan with timeline aligned to CNSA 2.0 preferred and exclusive deadlines',
        framework: 'CNSA 2.0',
        commonGap: true,
        effort: 'Low',
        deadline: 2025,
      },
      {
        id: 'us-sc-1',
        category: 'Supply Chain',
        requirement:
          'Assess all third-party software and hardware vendors for PQC migration readiness',
        framework: 'NIST SP 800-161',
        commonGap: true,
        effort: 'Medium',
      },
    ],
  },
  {
    jurisdictionId: 'eu',
    jurisdictionLabel: 'European Union',
    primaryFramework: 'ENISA / ETSI TR 103 619',
    secondaryFrameworks: ['NIS2 Directive', 'eIDAS 2.0', 'GDPR'],
    requirements: [
      {
        id: 'eu-inv-1',
        category: 'Inventory',
        requirement:
          'Conduct cryptographic agility assessment and document all quantum-vulnerable assets',
        framework: 'ENISA PQC Recommendations',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'eu-alg-1',
        category: 'Algorithm',
        requirement:
          'Adopt ETSI-recommended hybrid PQC/classical schemes for transition period key establishment',
        framework: 'ETSI TR 103 619',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'eu-pol-1',
        category: 'Policy',
        requirement:
          'Align PQC migration with NIS2 risk management obligations for critical infrastructure operators',
        framework: 'NIS2 Directive',
        commonGap: true,
        effort: 'Low',
      },
      {
        id: 'eu-pol-2',
        category: 'Policy',
        requirement:
          'Ensure GDPR data minimization obligations are maintained during re-encryption of archived data',
        framework: 'GDPR',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'eu-cert-1',
        category: 'Certification',
        requirement:
          'Cloud services using PQC should pursue EU Cybersecurity Act (EUCS) certification alignment',
        framework: 'EU Cybersecurity Act',
        commonGap: false,
        effort: 'High',
      },
    ],
  },
  {
    jurisdictionId: 'uk',
    jurisdictionLabel: 'United Kingdom',
    primaryFramework: 'NCSC PQC Guidance',
    secondaryFrameworks: ['UK Cyber Essentials Plus', 'NCSC CAF'],
    requirements: [
      {
        id: 'uk-inv-1',
        category: 'Inventory',
        requirement:
          'Identify and prioritize quantum-vulnerable cryptographic dependencies per NCSC migration guidance',
        framework: 'NCSC PQC Migration Guidance',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'uk-alg-1',
        category: 'Algorithm',
        requirement:
          'Transition to NIST-standardized PQC algorithms (ML-KEM, ML-DSA) per NCSC timeline recommendations',
        framework: 'NCSC PQC Migration Guidance',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'uk-pol-1',
        category: 'Policy',
        requirement:
          'Address PQC risks under NCSC Cyber Assessment Framework (CAF) for critical national infrastructure operators',
        framework: 'NCSC CAF',
        commonGap: true,
        effort: 'Low',
      },
    ],
  },
  {
    jurisdictionId: 'ca',
    jurisdictionLabel: 'Canada',
    primaryFramework: 'CCCS / CSE PQC Guidance',
    secondaryFrameworks: ['ITSP.40.111', 'Protected B / C requirements'],
    requirements: [
      {
        id: 'ca-inv-1',
        category: 'Inventory',
        requirement:
          'Complete cryptographic inventory as recommended by the Canadian Centre for Cyber Security',
        framework: 'CCCS ITSAP.40.006',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'ca-alg-1',
        category: 'Algorithm',
        requirement:
          'Align algorithm transitions with CCCS recommendations, which closely track NIST PQC selections',
        framework: 'CCCS PQC Guidance',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'ca-pol-1',
        category: 'Policy',
        requirement:
          'Update Protected B and Protected C data handling to include PQC for key establishment',
        framework: 'ITSP.40.111',
        commonGap: true,
        effort: 'Medium',
        deadline: 2030,
      },
    ],
  },
  {
    jurisdictionId: 'sg',
    jurisdictionLabel: 'Singapore',
    primaryFramework: 'MAS Technology Risk Management',
    secondaryFrameworks: ['IMDA PQC Guidance', 'CSA Singapore'],
    requirements: [
      {
        id: 'sg-inv-1',
        category: 'Inventory',
        requirement:
          'Conduct technology risk assessment covering quantum threats per MAS TRM Guidelines',
        framework: 'MAS TRM Guidelines',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'sg-alg-1',
        category: 'Algorithm',
        requirement:
          'Monitor MAS advisory on PQC algorithm adoption; align with NIST standards as they are finalized',
        framework: 'MAS Technology Risk Management',
        commonGap: false,
        effort: 'Medium',
      },
      {
        id: 'sg-pol-1',
        category: 'Policy',
        requirement:
          'Financial institutions must brief MAS on quantum risk exposure and provide migration timeline',
        framework: 'MAS TRM Guidelines',
        commonGap: true,
        effort: 'Low',
      },
    ],
  },
  {
    jurisdictionId: 'au',
    jurisdictionLabel: 'Australia',
    primaryFramework: 'ASD / ACSC Information Security Manual',
    secondaryFrameworks: ['ISM', 'PSPF'],
    requirements: [
      {
        id: 'au-inv-1',
        category: 'Inventory',
        requirement:
          'Identify and document quantum-vulnerable cryptographic assets per ASD ISM requirements',
        framework: 'ASD Information Security Manual',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'au-alg-1',
        category: 'Algorithm',
        requirement:
          'Transition to NIST PQC standards; ASD/ACSC tracks NIST SP 800-131A revision guidance',
        framework: 'ASD ISM',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'au-pol-1',
        category: 'Policy',
        requirement:
          'Government entities must comply with ISM cryptographic control requirements including PQC planning',
        framework: 'Australian Government ISM',
        commonGap: true,
        effort: 'Low',
      },
    ],
  },
  {
    jurisdictionId: 'de',
    jurisdictionLabel: 'Germany',
    primaryFramework: 'BSI TR-02102',
    secondaryFrameworks: ['BSI IT-Grundschutz', 'NIS2 (Germany)'],
    requirements: [
      {
        id: 'de-inv-1',
        category: 'Inventory',
        requirement:
          'Conduct cryptographic agility review per BSI IT-Grundschutz baseline protection requirements',
        framework: 'BSI IT-Grundschutz',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'de-alg-1',
        category: 'Algorithm',
        requirement:
          'Implement BSI TR-02102 recommended hybrid PQC transition: ML-KEM + X25519 for key agreement',
        framework: 'BSI TR-02102',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'de-cert-1',
        category: 'Certification',
        requirement:
          'Use BSI-approved PQC modules (BSZ scheme) for classified German government systems',
        framework: 'BSI Certification',
        commonGap: true,
        effort: 'High',
      },
    ],
  },
  {
    jurisdictionId: 'fr',
    jurisdictionLabel: 'France',
    primaryFramework: 'ANSSI PQC Recommendations',
    secondaryFrameworks: ['RGS (Référentiel Général de Sécurité)', 'NIS2 (France)'],
    requirements: [
      {
        id: 'fr-inv-1',
        category: 'Inventory',
        requirement:
          'Map cryptographic assets against ANSSI recommended algorithms and identify quantum vulnerabilities',
        framework: 'ANSSI Crypto Recommendations',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'fr-alg-1',
        category: 'Algorithm',
        requirement:
          'ANSSI recommends hybrid post-quantum schemes during transition; pure PQC adoption pending further analysis',
        framework: 'ANSSI PQC Position',
        commonGap: false,
        effort: 'High',
      },
      {
        id: 'fr-cert-1',
        category: 'Certification',
        requirement:
          'OIV/OSE critical infrastructure entities must apply ANSSI PQC guidance under LPM requirements',
        framework: 'ANSSI / LPM',
        commonGap: true,
        effort: 'Low',
      },
    ],
  },
  {
    jurisdictionId: 'jp',
    jurisdictionLabel: 'Japan',
    primaryFramework: 'CRYPTREC / NISC',
    secondaryFrameworks: ['MIC Cybersecurity Framework', 'NICT Guidelines'],
    requirements: [
      {
        id: 'jp-inv-1',
        category: 'Inventory',
        requirement:
          'Review CRYPTREC recommended cipher list and plan migration from algorithms scheduled for deprecation',
        framework: 'CRYPTREC Cipher List',
        commonGap: true,
        effort: 'Medium',
      },
      {
        id: 'jp-alg-1',
        category: 'Algorithm',
        requirement:
          'Adopt NIST PQC standards; CRYPTREC is evaluating and will issue updated algorithm recommendations',
        framework: 'CRYPTREC',
        commonGap: false,
        effort: 'High',
      },
    ],
  },
]

/** Look up a jurisdiction framework by ID. Returns undefined if not covered. */
export function getJurisdictionFramework(id: string): JurisdictionFramework | undefined {
  return JURISDICTION_FRAMEWORKS.find((jf) => jf.jurisdictionId === id)
}
