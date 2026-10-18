// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Canonical identities for source organizations used by the Compliance Hub.
 *
 * A display name is not an identifier. The compliance catalogue contains short
 * names, full names, organizational units, and joint-publisher strings. Keeping
 * the aliases here lets applicability code answer the narrow provenance
 * question (domestic / foreign / international) without pretending that every
 * publisher is a regulator.
 *
 * This registry starts with the organizations whose aliases affect visible
 * jurisdiction claims. Unknown organizations deliberately remain unclassified;
 * the UI must never infer "foreign" from a failed string match.
 */

export type SourceOrganizationKind =
  | 'government_agency'
  | 'regulator'
  | 'standards_body'
  | 'certification_scheme'
  | 'professional_body'
  | 'industry_consortium'
  | 'international_arrangement'

export interface SourceOrganization {
  id: string
  name: string
  aliases: readonly string[]
  kind: SourceOrganizationKind
  /** Empty for international or multijurisdictional organizations. */
  domiciles: readonly string[]
  scope: 'national' | 'regional' | 'international'
  parentId?: string
  sourceUrl: string
  verifiedAt: string
  /** Explicitly prevents a domicile inference when the source itself is unnamed or unresolved. */
  relationshipOverride?: 'unclassified'
}

import { CATALOGUE_SOURCE_ORGANIZATIONS } from './sourceOrganizations.catalogue'

const VERIFIED_AT = '2026-10-17'

const CORE_SOURCE_ORGANIZATIONS: readonly SourceOrganization[] = [
  {
    id: 'us-nist',
    name: 'National Institute of Standards and Technology (NIST)',
    aliases: ['NIST', 'National Institute of Standards and Technology'],
    kind: 'government_agency',
    domiciles: ['United States'],
    scope: 'national',
    sourceUrl: 'https://www.nist.gov/about-nist',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'us-nist-nccoe',
    name: 'NIST National Cybersecurity Center of Excellence (NCCoE)',
    aliases: ['NIST NCCoE', 'National Cybersecurity Center of Excellence (NCCoE)'],
    kind: 'government_agency',
    domiciles: ['United States'],
    scope: 'national',
    parentId: 'us-nist',
    sourceUrl: 'https://www.nccoe.nist.gov/our-approach/about-center',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'us-cisa',
    name: 'Cybersecurity and Infrastructure Security Agency (CISA)',
    aliases: ['CISA', 'Cybersecurity and Infrastructure Security Agency (CISA)'],
    kind: 'government_agency',
    domiciles: ['United States'],
    scope: 'national',
    sourceUrl: 'https://www.cisa.gov/about',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'us-niap',
    name: 'National Information Assurance Partnership (NIAP)',
    aliases: ['NIAP', 'National Information Assurance Partnership (NIAP), NSA'],
    kind: 'certification_scheme',
    domiciles: ['United States'],
    scope: 'national',
    sourceUrl: 'https://www.niap-ccevs.org/about/',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'us-aicpa',
    name: 'American Institute of Certified Public Accountants (AICPA)',
    aliases: ['AICPA'],
    kind: 'professional_body',
    domiciles: ['United States'],
    scope: 'national',
    sourceUrl: 'https://www.aicpa-cima.com/resources/landing/faqs',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'us-qed-c',
    name: 'Quantum Economic Development Consortium (QED-C)',
    aliases: ['QED-C', 'NIST; SRI International'],
    kind: 'industry_consortium',
    domiciles: ['United States'],
    scope: 'national',
    sourceUrl: 'https://quantumconsortium.org/about/',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'ccra',
    name: 'Common Criteria Recognition Arrangement (CCRA)',
    aliases: [
      'CC Recognition Arrangement',
      'Common Criteria Recognition Arrangement',
      'Common Criteria Recognition Arrangement (CCRA) members including ASD, CSE, ANSSI, BSI, IPA, NCCSA, GCSB, NSRI, MAP/CCN, FMV, NCSC, NSA/NIST',
    ],
    kind: 'international_arrangement',
    domiciles: [],
    scope: 'international',
    sourceUrl: 'https://www.commoncriteriaportal.org/ccra/index.cfm',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'us-nsa',
    name: 'National Security Agency (NSA)',
    aliases: ['NSA'],
    kind: 'government_agency',
    domiciles: ['United States'],
    scope: 'national',
    sourceUrl: 'https://www.nsa.gov/about/',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fr-anssi',
    name: 'Agence nationale de la securite des systemes d’information (ANSSI)',
    aliases: ['ANSSI', 'Agence nationale de la securite des systemes d’information (ANSSI)'],
    kind: 'government_agency',
    domiciles: ['France'],
    scope: 'national',
    sourceUrl: 'https://cyber.gouv.fr/en/about-anssi',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'de-bsi',
    name: 'Federal Office for Information Security (BSI)',
    aliases: [
      'BSI',
      'BSI (Bundesamt für Sicherheit in der Informationstechnik)',
      'Bundesamt fur Sicherheit in der Informationstechnik (BSI)',
      'Federal Office for Information Security (BSI)',
    ],
    kind: 'government_agency',
    domiciles: ['Germany'],
    scope: 'national',
    sourceUrl: 'https://www.bsi.bund.de/EN/Das-BSI/Auftrag/auftrag_node.html',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'ca-cccs',
    name: 'Canadian Centre for Cyber Security (CCCS)',
    aliases: [
      'CCCS',
      'Canadian Centre for Cyber Security (CCCS)',
      'Communications Security Establishment Canada (CSE) / Canadian Centre for Cyber Security',
    ],
    kind: 'government_agency',
    domiciles: ['Canada'],
    scope: 'national',
    sourceUrl: 'https://www.cyber.gc.ca/en/about-cyber-centre',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'au-asd',
    name: 'Australian Signals Directorate (ASD)',
    aliases: ['ASD', 'Australian Signals Directorate'],
    kind: 'government_agency',
    domiciles: ['Australia'],
    scope: 'national',
    sourceUrl: 'https://www.asd.gov.au/about',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'uk-ncsc',
    name: 'UK National Cyber Security Centre (NCSC)',
    aliases: ['NCSC', 'UK DSIT / NCSC'],
    kind: 'government_agency',
    domiciles: ['United Kingdom'],
    scope: 'national',
    sourceUrl: 'https://www.ncsc.gov.uk/section/about-ncsc/what-we-do',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fr-acpr',
    name: 'Autorite de controle prudentiel et de resolution (ACPR)',
    aliases: ['ACPR'],
    kind: 'regulator',
    domiciles: ['France'],
    scope: 'national',
    sourceUrl: 'https://acpr.banque-france.fr/en',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'fr-amf',
    name: 'Autorite des marches financiers (AMF)',
    aliases: ['AMF'],
    kind: 'regulator',
    domiciles: ['France'],
    scope: 'national',
    sourceUrl: 'https://www.amf-france.org/en/amf/presentation-amf/amf-glance',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'ietf',
    name: 'Internet Engineering Task Force (IETF)',
    aliases: ['IETF'],
    kind: 'standards_body',
    domiciles: [],
    scope: 'international',
    sourceUrl: 'https://www.ietf.org/about/',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'iso-iec',
    name: 'ISO/IEC',
    aliases: ['ISO/IEC', 'ISO/IEC JTC 1/SC 27'],
    kind: 'standards_body',
    domiciles: [],
    scope: 'international',
    sourceUrl: 'https://www.iso.org/about',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'etsi',
    name: 'European Telecommunications Standards Institute (ETSI)',
    aliases: ['ETSI', 'ETSI ISG QKD'],
    kind: 'standards_body',
    domiciles: [],
    scope: 'international',
    sourceUrl: 'https://www.etsi.org/about',
    verifiedAt: VERIFIED_AT,
  },
  {
    id: 'eu-enisa',
    name: 'European Union Agency for Cybersecurity (ENISA)',
    aliases: ['ENISA', 'ECCG/ENISA', 'ENISA/EU Member States'],
    kind: 'government_agency',
    domiciles: [],
    scope: 'regional',
    sourceUrl: 'https://www.enisa.europa.eu/about-enisa/who-we-are',
    verifiedAt: VERIFIED_AT,
  },
] as const

export const SOURCE_ORGANIZATIONS: readonly SourceOrganization[] = [
  ...CORE_SOURCE_ORGANIZATIONS,
  ...CATALOGUE_SOURCE_ORGANIZATIONS,
]

function normalizeOrganizationName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('en-US')
}

const BY_ALIAS = new Map<string, SourceOrganization>()
for (const organization of SOURCE_ORGANIZATIONS) {
  for (const alias of [organization.name, ...organization.aliases]) {
    const key = normalizeOrganizationName(alias)
    const existing = BY_ALIAS.get(key)
    if (existing && existing.id !== organization.id) {
      throw new Error(`Duplicate source-organization alias: ${alias}`)
    }
    BY_ALIAS.set(key, organization)
  }
}

export function sourceOrganizationFor(value: string | null | undefined): SourceOrganization | null {
  const key = normalizeOrganizationName(value ?? '')
  return key ? (BY_ALIAS.get(key) ?? null) : null
}
