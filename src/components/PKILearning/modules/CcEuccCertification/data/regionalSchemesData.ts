// SPDX-License-Identifier: GPL-3.0-only
// OWNER: CC/EU author
/**
 * Regional schemes built on Common Criteria (LM-068, sections
 * `cc-regional-schemes` and `cc-regional-reference`; user request 2026-09-27).
 *
 * Every row was read on 27 September 2026 from the scheme body, the CCRA
 * portal, EUR-Lex/ENISA or a national agency, and each one was checked a
 * second time against an independent tier-1 source by Codex (gpt-5.6-terra;
 * lineage log cx-20260927T205301Z-032749f1 Europe, cx-20260927T205504Z-3b2a6304
 * outside the CCRA, and cx-20260927T205837Z-253b5389 Americas/Asia-Pacific). Where no official
 * source states a post-quantum position, the row says so — nothing is
 * inferred. `libraryId` citations resolve through getStandard(); the rest link
 * the official page.
 */

export const REGIONAL_AS_OF = '2026-09-27'
export const REGIONAL_AS_OF_LABEL = '27 September 2026'

export interface SourceRef {
  label: string
  /** a library row (resolved and linked by getStandard) */
  libraryId?: string
  /** an official page with no library row yet */
  url?: string
}

export type Region = 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East & Africa'

/** CCRA role as the CC portal lists it, or CC-based outside the CCRA. */
export type Role = 'authorizing' | 'consuming' | 'outside'

export interface MapEntry {
  country: string
  region: Region
  role: Role
  /** EU member state: EUCC applies by law, whatever the CCRA role */
  eu?: boolean
  note?: string
}

const CCRA_MEMBERS: SourceRef = {
  label: 'CCRA members list (CC portal)',
  url: 'https://www.commoncriteriaportal.org/ccra/members/index.cfm',
}

/**
 * The coverage map. CCRA roles from the CC portal's members page (18
 * authorizing, 18 consuming, read 27 September 2026); CC-based schemes
 * outside the CCRA only where a national regulator or standards body confirms
 * the basis.
 */
export const COVERAGE_MAP: readonly MapEntry[] = [
  // Americas
  { country: 'United States', region: 'Americas', role: 'authorizing' },
  { country: 'Canada', region: 'Americas', role: 'authorizing' },
  // Europe — authorizing
  { country: 'France', region: 'Europe', role: 'authorizing', eu: true },
  { country: 'Germany', region: 'Europe', role: 'authorizing', eu: true },
  {
    country: 'Italy',
    region: 'Europe',
    role: 'authorizing',
    eu: true,
    note: 'OCSI now works only under EUCC; the portal still lists it as authorizing',
  },
  { country: 'Netherlands', region: 'Europe', role: 'authorizing', eu: true },
  { country: 'Poland', region: 'Europe', role: 'authorizing', eu: true },
  { country: 'Spain', region: 'Europe', role: 'authorizing', eu: true },
  {
    country: 'Sweden',
    region: 'Europe',
    role: 'authorizing',
    eu: true,
    note: 'CSEC no longer issues new SOG-IS/CCRA certificates; it oversees EUCC bodies',
  },
  { country: 'Norway', region: 'Europe', role: 'authorizing' },
  { country: 'Türkiye', region: 'Europe', role: 'authorizing' },
  // Europe — consuming
  { country: 'United Kingdom', region: 'Europe', role: 'consuming', note: 'consuming since 2019' },
  { country: 'Austria', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Belgium', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Cyprus', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Czech Republic', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Denmark', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Finland', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Greece', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Hungary', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Slovakia', region: 'Europe', role: 'consuming', eu: true },
  { country: 'Ukraine', region: 'Europe', role: 'consuming' },
  // Europe/Asia — outside the CCRA
  {
    country: 'Russia',
    region: 'Europe',
    role: 'outside',
    note: 'GOST R ISO/IEC 15408 (2009 edition); FSTEC certification',
  },
  {
    country: 'Kazakhstan',
    region: 'Asia-Pacific',
    role: 'outside',
    note: 'ST RK ISO/IEC 15408; certificates from accredited bodies',
  },
  // Asia-Pacific
  { country: 'Australia', region: 'Asia-Pacific', role: 'authorizing' },
  { country: 'India', region: 'Asia-Pacific', role: 'authorizing' },
  { country: 'Japan', region: 'Asia-Pacific', role: 'authorizing' },
  { country: 'Malaysia', region: 'Asia-Pacific', role: 'authorizing' },
  { country: 'Republic of Korea', region: 'Asia-Pacific', role: 'authorizing' },
  { country: 'Singapore', region: 'Asia-Pacific', role: 'authorizing' },
  { country: 'New Zealand', region: 'Asia-Pacific', role: 'consuming' },
  { country: 'Bangladesh', region: 'Asia-Pacific', role: 'consuming' },
  { country: 'Indonesia', region: 'Asia-Pacific', role: 'consuming' },
  { country: 'Pakistan', region: 'Asia-Pacific', role: 'consuming' },
  {
    country: 'China',
    region: 'Asia-Pacific',
    role: 'outside',
    note: 'GB/T 18336-2024 = ISO/IEC 15408:2022; CNITSEC evaluates',
  },
  // Middle East & Africa
  { country: 'Qatar', region: 'Middle East & Africa', role: 'authorizing' },
  { country: 'Israel', region: 'Middle East & Africa', role: 'consuming' },
  { country: 'Jordan', region: 'Middle East & Africa', role: 'consuming' },
  { country: 'Ethiopia', region: 'Middle East & Africa', role: 'consuming' },
]

export const REGIONS: readonly Region[] = [
  'Americas',
  'Europe',
  'Asia-Pacific',
  'Middle East & Africa',
]

/** What a scheme adds on top of Common Criteria — the four kinds seen. */
export type AdditionKind = 'protection-profiles' | 'crypto' | 'method' | 'procurement'

export const ADDITION_KIND_LABEL: Record<AdditionKind, string> = {
  'protection-profiles': 'Own Protection Profiles or PP policy',
  crypto: 'Own cryptography rules or validation',
  method: 'Own lighter or national method',
  procurement: 'Procurement or legal mandate',
}

export interface RegionalScheme {
  id: string
  country: string
  region: Region
  scheme: string
  role: string
  /** what a certificate from this scheme is recognised for */
  recognition: string
  additions: { kind: AdditionKind; text: string }[]
  /** the published post-quantum position, or null when none was found */
  pqc: string | null
  sources: SourceRef[]
}

export const REGIONAL_SCHEMES: readonly RegionalScheme[] = [
  // ── Americas ──────────────────────────────────────────────────────────────
  {
    id: 'us-niap',
    country: 'United States',
    region: 'Americas',
    scheme: 'NIAP / CCEVS (run by NSA)',
    role: 'CCRA authorizing',
    recognition:
      'Evaluates only against NIAP-approved Protection Profiles — exact conformance, no EAL evaluations.',
    additions: [
      {
        kind: 'protection-profiles',
        text: 'PP-only policy; NIAP publishes "endorsement" technical decisions on collaborative PPs that are stricter than the cPP (e.g. CNSA-only algorithm selections).',
      },
      {
        kind: 'crypto',
        text: 'A NIST CAVP algorithm certificate is mandatory for the claimed cryptography (Policy #5).',
      },
      {
        kind: 'procurement',
        text: 'The Product Compliant List is what National Security Systems buy from.',
      },
    ],
    pqc: 'Policy #33 (31 August 2026, effective 1 January 2027): products — certified by NIAP or a CCRA partner — that do not meet CNSA 2.0 for every cryptographic function are not accepted into evaluation from 1 January 2028 and not posted to the Product Compliant List from 1 January 2029. CNSA 1.0 cut-offs: 1 January 2027 and 1 July 2027.',
    sources: [
      {
        label: 'NIAP Policy #33',
        url: 'https://www.niap-ccevs.org/',
      },
      { label: 'CNSA 2.0', libraryId: 'NSA CNSA 2.0' },
      { label: 'NIAP policy letters', libraryId: 'NIAP-CCEVS-POLICY' },
    ],
  },
  {
    id: 'ca-cccs',
    country: 'Canada',
    region: 'Americas',
    scheme: 'Canadian Common Criteria Program (Canadian Centre for Cyber Security)',
    role: 'CCRA authorizing',
    recognition: 'Collaborative PPs; EAL2, with EAL3/4 case by case.',
    additions: [
      {
        kind: 'crypto',
        text: 'A CAVP certificate is required for PP evaluations, and only Cyber Centre-approved cryptography (ITSP.40.111).',
      },
    ],
    pqc: 'Government of Canada roadmap (ITSM.40.001): high-priority systems migrated by end of 2031, all systems by end of 2035. No PQC rule specific to the CC scheme.',
    sources: [
      { label: 'ITSM.40.001', libraryId: 'Canada CSE PQC Guidance' },
      {
        label: 'Canadian Common Criteria Program',
        url: 'https://www.cyber.gc.ca/en/tools-services/common-criteria',
      },
    ],
  },
  // ── Europe ────────────────────────────────────────────────────────────────
  {
    id: 'eu-eucc',
    country: 'European Union',
    region: 'Europe',
    scheme: 'EUCC (Implementing Regulation (EU) 2024/482)',
    role: 'EU law; not a CCRA party',
    recognition:
      "Assurance level 'substantial' (AVA_VAN.1–2) or 'high' (AVA_VAN.3–5); AVA_VAN.4–5 only inside a technical domain or under a listed PP. Replaced the national schemes and SOG-IS, which stopped issuing on 27 February 2026.",
    additions: [
      {
        kind: 'procurement',
        text: 'Applies by regulation in every EU member state; no self-assessment.',
      },
      {
        kind: 'protection-profiles',
        text: 'Technical domains (smart cards and similar devices; hardware devices with security boxes) with their state-of-the-art documents, and certified PPs.',
      },
      {
        kind: 'crypto',
        text: 'ECCG Agreed Cryptographic Mechanisms — a guideline the evaluation relies on, not an annex of the regulation.',
      },
    ],
    pqc: 'ECCG ACM v2 (May 2025) agrees ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, LMS and XMSS; lattice-based schemes "shouldn\'t be used in a standalone way" — hybrid with a classical mechanism.',
    sources: [
      {
        label: 'Regulation (EU) 2024/482',
        libraryId: 'CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme',
      },
      { label: 'ECCG ACM v2', libraryId: 'EUCC v2.0 ACM' },
      { label: 'SOG-IS', url: 'https://www.sogis.eu/' },
    ],
  },
  {
    id: 'de-bsi',
    country: 'Germany',
    region: 'Europe',
    scheme: 'BSI certification body',
    role: 'CCRA authorizing; EU (EUCC)',
    recognition: 'CCRA and EUCC; formerly SOG-IS up to EAL7 in both technical domains.',
    additions: [
      {
        kind: 'method',
        text: 'AIS interpretations (e.g. AIS 20/31 for random number generators) and the BSZ fixed-time national certification.',
      },
      {
        kind: 'crypto',
        text: 'Cryptography per BSI TR-02102 and TR-03116.',
      },
    ],
    pqc: 'TR-02102-1: classical-only key agreement only until the end of 2031, classical signatures until the end of 2035; post-quantum mechanisms "should be used in \'hybrid\' form".',
    sources: [{ label: 'BSI TR-02102-1', libraryId: 'BSI TR-02102-1' }],
  },
  {
    id: 'fr-anssi',
    country: 'France',
    region: 'Europe',
    scheme: 'ANSSI certification centre',
    role: 'CCRA authorizing; EU (EUCC)',
    recognition: 'CCRA and EUCC; formerly SOG-IS up to EAL7 in both technical domains.',
    additions: [
      {
        kind: 'method',
        text: 'CSPN — a first-level, fixed-time national certification, mutually recognised with Germany’s BSZ.',
      },
      {
        kind: 'procurement',
        text: '“Qualification” for use by the French administration, on top of certification.',
      },
      { kind: 'crypto', text: 'ANSSI’s cryptographic mechanisms guide (PG-083 v3).' },
    ],
    pqc: 'Hybridisation is required in the cryptographic evaluation behind a security visa; PQC obligations enter product qualification from 2027. ANSSI issued a CC certificate for a PQC product on 29 September 2025.',
    sources: [
      { label: 'ANSSI PQC FAQ', libraryId: 'ANSSI-PQC-FAQ-2025' },
      { label: 'ANSSI PG-083 v3', libraryId: 'ANSSI-PG-083-v3-2026' },
    ],
  },
  {
    id: 'es-ccn',
    country: 'Spain',
    region: 'Europe',
    scheme: 'Organismo de Certificación (CCN)',
    role: 'CCRA authorizing; EU (EUCC)',
    recognition: 'CCRA and EUCC; formerly SOG-IS up to EAL7 in both technical domains.',
    additions: [
      {
        kind: 'method',
        text: 'LINCE, a national essential-security certification.',
      },
      {
        kind: 'procurement',
        text: 'The CPSTIC catalogue of products approved for systems under Spain’s National Security Framework (ENS).',
      },
      { kind: 'crypto', text: 'Authorised mechanisms in CCN-STIC 221.' },
    ],
    pqc: 'CCN-STIC 221 includes ML-KEM, FrodoKEM, ML-DSA and hybrid modes; CCN-TEC 009 sets a phased transition in which hybrids stay until about 2030 or later.',
    sources: [
      {
        label: 'CCN-STIC 221',
        libraryId: 'CCN-STIC-221-Spain-Guia-de-Mecanismos-Criptograficos-autoriz',
      },
      {
        label: 'CCN-TEC 009',
        libraryId: 'CCN-TEC-009-BP-37-Spain-Recomendaciones-para-una-transicion',
      },
    ],
  },
  {
    id: 'se-csec',
    country: 'Sweden',
    region: 'Europe',
    scheme: 'CSEC (FMV)',
    role: 'CCRA authorizing; EU (EUCC)',
    recognition:
      'No longer issues new SOG-IS or CCRA certificates; oversees private EUCC certification bodies, and can approve the CCRA mark on an EUCC certificate.',
    additions: [
      {
        kind: 'crypto',
        text: 'Scheme crypto policy SP-188, based on SOG-IS ACM.',
      },
    ],
    pqc: 'Sweden’s national recommendation: transition complete by the end of 2035 (certain cases by 2030). No CSEC-specific rule found.',
    sources: [
      {
        label: 'FMV — CSEC',
        url: 'https://www.fmv.se/english/suppliers-and-partnerships/supplier-information/csec/',
      },
    ],
  },
  {
    id: 'no-sertit',
    country: 'Norway',
    region: 'Europe',
    scheme: 'SERTIT (NSM)',
    role: 'CCRA authorizing; EEA, not EU',
    recognition: 'CCRA; formerly SOG-IS EAL1–4.',
    additions: [
      {
        kind: 'method',
        text: 'Evaluation labs are licensed only after a trial evaluation.',
      },
    ],
    pqc: 'NSM urges all organisations to address the quantum threat by 2030.',
    sources: [
      {
        label: 'NSM — quantum migration',
        url: 'https://nsm.no/fagomrader/digital-sikkerhet/kryptosikkerhet/kvantemigrasjon/',
      },
      { label: 'SERTIT', url: 'https://sertit.no/' },
    ],
  },
  {
    id: 'uk-ncsc',
    country: 'United Kingdom',
    region: 'Europe',
    scheme: 'NCSC',
    role: 'CCRA consuming since 2019',
    recognition: 'Recognises CCRA certificates; no longer issues them.',
    additions: [
      {
        kind: 'method',
        text: 'Its own assurance for high-grade products (CAPS) outside CC; contributes to collaborative PPs.',
      },
    ],
    pqc: 'NCSC migration timelines: discovery by 2028, priority migration by 2031, all systems by 2035.',
    sources: [
      { label: 'NCSC PQC migration timelines', libraryId: 'UK-NCSC-Migration-Timelines-2025' },
      {
        label: 'NCSC — Common Criteria',
        url: 'https://www.ncsc.gov.uk/information/common-criteria-0',
      },
    ],
  },
  {
    id: 'tr-tse',
    country: 'Türkiye',
    region: 'Europe',
    scheme: 'TSE Common Criteria certification',
    role: 'CCRA authorizing; not EU',
    recognition: 'CCRA.',
    additions: [],
    pqc: null,
    sources: [
      {
        label: 'TSE — CC certification',
        url: 'https://www.tse.org.tr/ortak-kriter-belgelendirme-hizmetleri/',
      },
    ],
  },
  // ── Asia-Pacific ──────────────────────────────────────────────────────────
  {
    id: 'jp-jisec',
    country: 'Japan',
    region: 'Asia-Pacific',
    scheme: 'JISEC (IPA)',
    role: 'CCRA authorizing',
    recognition: 'CCRA.',
    additions: [
      {
        kind: 'method',
        text: 'A Japan-only “ST confirmation” track, lighter than full certification.',
      },
      {
        kind: 'procurement',
        text: 'Government procurement lists ask for CC-certified products and ISO/IEC 19790 module validation (JCMVP; FIPS 140 accepted).',
      },
    ],
    pqc: 'Cabinet Secretariat interim report (November 2025): government migration to PQC “in principle” by 2035. No JISEC-specific rule found.',
    sources: [
      {
        label: 'Cabinet Secretariat PQC interim report',
        libraryId: 'Cabinet-Secretariat-Japan-PQC-Migration-Interim-Report-for-G',
      },
    ],
  },
  {
    id: 'kr-itscc',
    country: 'Republic of Korea',
    region: 'Asia-Pacific',
    scheme: 'IT Security Certification Center (NSR)',
    role: 'CCRA authorizing',
    recognition: 'Separate domestic and international certificate tracks.',
    additions: [
      {
        kind: 'protection-profiles',
        text: 'National-use Protection Profiles and security conformity verification for public bodies.',
      },
      {
        kind: 'crypto',
        text: 'KCMVP module validation mandatory for listed product types used by state and public bodies.',
      },
    ],
    pqc: 'The KpqC competition selected four Korean PQC algorithms (January 2025). A national migration year is not confirmed by an official source.',
    sources: [{ label: 'KpqC results', libraryId: 'KpqC-Competition-Results' }],
  },
  {
    id: 'au-aisep',
    country: 'Australia',
    region: 'Asia-Pacific',
    scheme: 'AISEP (Australian Certification Authority, ASD)',
    role: 'CCRA authorizing',
    recognition:
      'PP-based evaluations preferred; EAL-based ones capped at EAL2 where no PP exists.',
    additions: [
      {
        kind: 'procurement',
        text: 'The ISM requires CC evaluation against an ASD-endorsed PP for cryptographic equipment protecting sensitive government data.',
      },
    ],
    pqc: 'ISM: traditional asymmetric cryptography ceases by 2030; ML-KEM-1024 and ML-DSA-87 are the approved post-quantum parameter sets.',
    sources: [{ label: 'ISM — guidelines for cryptography', libraryId: 'AU-ASD-ISM-Crypto-2024' }],
  },
  {
    id: 'sg-sccs',
    country: 'Singapore',
    region: 'Asia-Pacific',
    scheme: 'Singapore Common Criteria Scheme (CSA)',
    role: 'CCRA authorizing',
    recognition: 'CCRA-recognised evaluations; other cases case by case.',
    additions: [
      {
        kind: 'protection-profiles',
        text: 'Prefers collaborative PPs, CSA national PPs or CSA-endorsed PPs. (Cybersecurity Labelling is a separate, non-CC scheme.)',
      },
    ],
    pqc: 'CSA Quantum-Safe Handbook (July 2026) — guidance, stated as not mandatory.',
    sources: [
      { label: 'CSA Quantum-Safe Handbook', libraryId: 'Singapore-CSA-Quantum-Safe-Handbook' },
    ],
  },
  {
    id: 'in-ic3s',
    country: 'India',
    region: 'Asia-Pacific',
    scheme: 'IC3S (STQC, MeitY)',
    role: 'CCRA authorizing',
    recognition:
      'Certifies EAL1–4 nationally; CCRA recognition follows the 2014 limits (a cPP, or EAL2 + ALC_FLR), whatever older scheme documents say.',
    additions: [
      {
        kind: 'crypto',
        text: 'STQC also runs ISO/IEC 19790 cryptographic-module validation.',
      },
    ],
    pqc: 'DST task force (February 2026, a recommendation): critical information infrastructure migrated by 2029, enterprises by 2033.',
    sources: [{ label: 'DST task force report', libraryId: 'India-DST-NQM-Roadmap' }],
  },
  {
    id: 'my-mycc',
    country: 'Malaysia',
    region: 'Asia-Pacific',
    scheme: 'MyCC (CyberSecurity Malaysia)',
    role: 'CCRA authorizing',
    recognition: 'CCRA.',
    additions: [
      {
        kind: 'crypto',
        text: 'MyCV module and algorithm validation, and the MySEAL national list of trusted algorithms.',
      },
    ],
    pqc: 'MyKriptografi Action Plan 2026–2030 includes PQC work; no dated mandate found.',
    sources: [{ label: 'MyKriptografi Action Plan', libraryId: 'Malaysia-NACSA-PQC-2025' }],
  },
  {
    id: 'nz-ncsc',
    country: 'New Zealand',
    region: 'Asia-Pacific',
    scheme: 'NCSC (GCSB)',
    role: 'CCRA consuming',
    recognition: 'Recognises CCRA certificates; agencies are directed to AISEP.',
    additions: [],
    pqc: 'NZISM v3.9: no post-quantum cryptographic systems are yet approved for use; agencies should prepare.',
    sources: [{ label: 'NZISM v3.9', libraryId: 'NZISM-V3-9' }],
  },
  // ── Middle East ───────────────────────────────────────────────────────────
  {
    id: 'qa-qccs',
    country: 'Qatar',
    region: 'Middle East & Africa',
    scheme: 'Qatar Common Criteria Scheme (NCSA)',
    role: 'CCRA authorizing (issuing since 2023)',
    recognition: 'CCRA.',
    additions: [],
    pqc: null,
    sources: [CCRA_MEMBERS],
  },
]

/** Countries that build on CC outside the CCRA — no international recognition. */
export interface OutsideCcra {
  country: string
  standard: string
  body: string
  additions: string
  pqc: string | null
  sources: SourceRef[]
}

export const OUTSIDE_CCRA: readonly OutsideCcra[] = [
  {
    country: 'China',
    standard:
      'GB/T 18336-2024 and GB/T 30270-2024 — identical adoptions of ISO/IEC 15408:2022 and 18045:2022',
    body: 'China Information Technology Security Evaluation Center (CNITSEC)',
    additions:
      'Listed network products need a certificate before sale (Cybersecurity Law; GB 42250-2022); commercial cryptography is governed separately by the Cryptography Law, with testing mandatory only for listed products.',
    pqc: 'A national call for next-generation (post-quantum) public-key algorithms opened in February 2025. No national PQC standard is published yet.',
    sources: [
      { label: 'Cryptography Law', libraryId: 'China-Cryptography-Law-2019-NPC' },
      {
        label: 'GB/T 18336 (national standards catalogue)',
        url: 'https://std.samr.gov.cn/',
      },
    ],
  },
  {
    country: 'Russia',
    standard: 'GOST R ISO/IEC 15408 — identical to the 2009 edition of ISO/IEC 15408',
    body: 'FSTEC (certification of information-protection means); cryptography under the FSB',
    additions:
      'FSTEC certifies against its own six-level “trust level” scale; cryptography is regulated separately, by the FSB, with GOST algorithms from technical committee TC 26.',
    pqc: 'Technical committee TC 26 has published a code-based candidate mechanism (2024); no post-quantum GOST standard yet.',
    sources: [
      { label: 'TC 26 — post-quantum mechanism', libraryId: 'tc26-Kodieum-Kryptonit-PQ-Mechanism' },
    ],
  },
  {
    country: 'Kazakhstan',
    standard: 'ST RK ISO/IEC 15408 (national adoption)',
    body: 'Accredited conformity-assessment bodies',
    additions:
      'Government rules require a certificate of conformity to ST RK ISO/IEC 15408-3 at a stated minimum trust level for listed products.',
    pqc: null,
    sources: [
      {
        label: 'Gov.kz rules (ST RK ISO/IEC 15408-3)',
        url: 'https://www.gov.kz/uploads/2020/5/11/de7cf6224248f8238a6caf42e87b21b4_original.72067.pdf',
      },
    ],
  },
]

/** The CCRA baseline itself (Arrangement of 2 July 2014). */
export const CCRA_SOURCE: SourceRef = {
  label: 'CCRA (2 July 2014)',
  url: 'https://www.commoncriteriaportal.org/files/CCRA%20-%20July%202,%202014%20-%20Ratified%20September%208%202014.pdf',
}
export const CCRA_MEMBERS_SOURCE = CCRA_MEMBERS
