// SPDX-License-Identifier: AGPL-3.0-only

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgType =
  'standards-body' | 'certification-body' | 'compliance-framework' | 'regulatory-agency'

export type OrgScope = 'global' | 'regional'
export type OrgAuthority = 'governmental' | 'non-governmental'

export interface OrgEntry {
  id: string
  name: string
  acronym: string
  type: OrgType
  scope: OrgScope
  authority: OrgAuthority
  region: string
  founded: string
  mission: string
  decisionMaking: string
  keyPqcOutputs: string[]
  libraryRefs: string[]
  websiteUrl: string
  glossaryTerm?: string
}

// ─── SC 27 membership ─────────────────────────────────────────────────────────

/**
 * ISO/IEC JTC 1/SC 27 membership as shown on the ISO committee page, participation view
 * (https://www.iso.org/committee/45306.html?view=participation): "Participating Members [56]" and
 * "Observing Members [38]". The count moves, so it is always printed with the date it was read.
 */
export const SC27_MEMBERS = {
  participating: 56,
  observing: 38,
  readOn: '25 October 2026',
  source: 'ISO committee page, participation view',
} as const

/**
 * ETSI membership as stated on its About page (https://www.etsi.org/about): "Uniting over 950
 * members across more than 60 countries". The count moves, so it is always printed with the date
 * it was read.
 */
export const ETSI_MEMBERS = {
  summary: 'over 950 members across more than 60 countries',
  readOn: '26 October 2026',
  source: 'etsi.org/about',
} as const

/**
 * ITU membership as stated on its About page (https://www.itu.int/en/about/Pages/default.aspx):
 * "made up of a membership of 194 Member States and more than 1000 companies, universities and
 * international and regional organizations".
 */
export const ITU_MEMBERS = {
  summary:
    '194 Member States and more than 1000 companies, universities and international and regional organizations',
  readOn: '26 October 2026',
  source: 'itu.int/en/about',
} as const

/**
 * 3GPP states no member count. Its Membership page (https://www.3gpp.org/about-us/membership):
 * "There is no direct membership to 3GPP, which is a Partnership project. The delegates come to
 * 3GPP via their organization's membership of one of the seven 3GPP Organizational Partners."
 */
export const THREEGPP_MEMBERSHIP = {
  summary: 'Through one of the seven Organizational Partners; no direct membership',
  readOn: '26 October 2026',
  source: '3gpp.org/about-us/membership',
} as const

// ─── Organization Data ────────────────────────────────────────────────────────

export const ORGANIZATIONS: OrgEntry[] = [
  {
    id: 'nist',
    name: 'National Institute of Standards and Technology',
    acronym: 'NIST',
    type: 'standards-body',
    scope: 'regional',
    authority: 'governmental',
    region: 'US',
    founded: '1901',
    mission:
      'US federal agency that develops and promotes measurement standards, including cryptographic standards that are widely adopted worldwide. NIST led the post-quantum algorithm competition, which opened with a call for proposals in December 2016, selected its first algorithms in July 2022, and published FIPS 203, 204, and 205 in August 2024.',
    decisionMaking:
      'Open competition → public comment period → FIPS publication. The PQC standardization began in 2016: 82 submissions (69 met the requirements) → 26 candidates in round 2 → 7 finalists and 8 alternates in round 3 → first algorithms selected July 2022 → FIPS 203/204/205 published August 2024 → fourth round for key establishment ended March 2025 with HQC selected. All draft standards undergo public comment (minimum 90 days).',
    keyPqcOutputs: [
      'FIPS 203 (ML-KEM, August 2024)',
      'FIPS 204 (ML-DSA, August 2024)',
      'FIPS 205 (SLH-DSA, August 2024)',
      'FIPS 206 (FN-DSA / Falcon — in development, not yet published)',
      'NIST IR 8547 (Transition to PQC, final October 2026)',
      'NIST SP 800-227 (KEM recommendations)',
      'FIPS 140-3 (cryptographic module standard)',
    ],
    libraryRefs: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'NIST IR 8547', 'NIST SP 800-227'],
    websiteUrl: 'https://csrc.nist.gov/projects/post-quantum-cryptography',
    glossaryTerm: 'NIST',
  },
  {
    id: 'iso-iec',
    name: 'ISO/IEC Joint Technical Committee 1, Subcommittee 27',
    acronym: 'ISO/IEC JTC 1/SC 27',
    type: 'standards-body',
    scope: 'global',
    authority: 'non-governmental',
    region: 'Global',
    founded: '1987',
    mission:
      'International standards body developing globally adopted information security standards through voting by national member bodies. SC 27 Working Group 2 (WG 2) handles cryptography and security mechanisms, producing ISO/IEC standards referenced by regulators worldwide.',
    decisionMaking: `5-stage process: Working Draft (WD) → Committee Draft (CD) → Draft International Standard (DIS) → Final DIS (FDIS) → International Standard (IS). The national member bodies (SC 27 has ${SC27_MEMBERS.participating} participating and ${SC27_MEMBERS.observing} observing members: ${SC27_MEMBERS.source}, read ${SC27_MEMBERS.readOn}) ballot the drafts. Full IS typically takes 3–5 years. PQC standards are developed in parallel with NIST and cross-reference FIPS.`,
    // Corrected 2026-07-31, verified against ISO's own catalogue pages. Two
    // entries here named standards that do not exist as described:
    //   - "ISO/IEC 18033-2/AMD1 (PQC addendum)" — Amendment 1:2017 is
    //     "FACE", a classical asymmetric cipher. The PQC content (FrodoKEM,
    //     Classic McEliece, ML-KEM) is Amendment 2:2026.
    //   - "ISO/IEC NP 29192-8 (Lightweight PQC)" — 29192-8:2022 is published
    //     "Authenticated encryption", not a PQC work item.
    keyPqcOutputs: [
      'ISO/IEC 14888-4:2024 (Digital signatures with appendix – Part 4: Stateful hash-based mechanisms, XMSS/LMS)',
      "ISO/IEC 18033-2:2006/Amd 2:2026 (Asymmetric ciphers amendment; covers Classic McEliece per a BSI note; FrodoKEM and ML-KEM not confirmed against the amendment's scope text)",
      'ISO/IEC 20085 (KEM reference, in development)',
    ],
    libraryRefs: [
      'ISO/IEC 14888-4:2024',
      'ISO-IEC-18033-2-2006-Amd-2-2026-Information-technology-Secur',
    ],
    websiteUrl: 'https://www.iso.org/committee/45306.html',
  },
  {
    id: 'etsi',
    name: 'European Telecommunications Standards Institute',
    acronym: 'ETSI',
    type: 'standards-body',
    scope: 'regional',
    authority: 'non-governmental',
    region: 'EU',
    founded: '1988',
    mission:
      'European SDO producing technical standards for telecommunications and ICT, with a strong PQC track record via TC CYBER (Technical Committee on Cybersecurity) and ISG QKD (Industry Specification Group on Quantum Key Distribution).',
    decisionMaking: `Industry membership (${ETSI_MEMBERS.summary}: ${ETSI_MEMBERS.source}, read ${ETSI_MEMBERS.readOn}) → Technical Committees (TC CYBER) → Technical Specification (TS, normative) or Technical Report (TR, informational). Chair of TC CYBER QSC WG: Matthew Campagna (AWS). ETSI TS documents contain "shall" requirements; TRs are guidance only.`,
    keyPqcOutputs: [
      'ETSI TS 103 744 (Quantum-safe hybrid key establishment – combines ECDH with ML-KEM)',
      'ETSI TR 103 619 (PQC Migration Guide)',
      'ETSI TR 103 616 (Quantum-Safe Signatures)',
      'ETSI ISG QKD standards (QKD protocols and infrastructure)',
    ],
    libraryRefs: ['ETSI TS 103 744', 'ETSI TR 103 619'],
    websiteUrl: 'https://www.etsi.org/technologies/quantum-safe-cryptography',
    glossaryTerm: 'ETSI',
  },
  {
    id: 'ietf',
    name: 'Internet Engineering Task Force',
    acronym: 'IETF',
    type: 'standards-body',
    scope: 'global',
    authority: 'non-governmental',
    region: 'Global',
    founded: '1986',
    mission:
      'Open standards body for Internet protocols, operating via rough consensus and running code. No membership fee — any individual can participate. Key home for integrating NIST PQC algorithms into Internet protocols (TLS, CMS, SSH, JOSE, COSE).',
    decisionMaking:
      'Working Groups (WGs) produce Internet-Drafts (I-D) → Proposed Standard (RFC, after IESG review) → Internet Standard. Key PQC WGs: PQUIP (post-quantum use in protocols, coordination), LAMPS (PKIX/CMS PQC), TLS (X25519MLKEM768), COSE (IoT), SSH (hybrid key exchange).',
    keyPqcOutputs: [
      'RFC 9629 (KEM Algorithms in CMS, LAMPS WG)',
      'RFC 9882 (ML-DSA in CMS)',
      'RFC 9814 (SLH-DSA in CMS)',
      'draft-ietf-pquip-pqc-engineers (PQC for engineers guide)',
      'RFC 9954 (hybrid design) and RFC 10024 (X25519MLKEM768)',
    ],
    libraryRefs: ['RFC 9629', 'draft-ietf-pquip-pqc-engineers-14'],
    websiteUrl: 'https://datatracker.ietf.org/wg/pquip/about/',
    glossaryTerm: 'IETF',
  },
  {
    id: 'bsi',
    name: 'Federal Office for Information Security',
    acronym: 'BSI',
    type: 'regulatory-agency',
    scope: 'regional',
    authority: 'governmental',
    region: 'Germany',
    founded: '1991',
    mission:
      "Germany's national cybersecurity authority. It publishes Technical Guidelines (TR); the TR-02102 series is reviewed annually and recommends cryptographic mechanisms and key lengths, including PQC. BSI presents these as recommendations: binding specifications exist only for certain applications, in other BSI documents.",
    decisionMaking:
      'Government agency (under Federal Ministry of the Interior). Publishes TR (Technical Guideline) and BSI Standards annually through internal expert review. TR-02102-1 is the primary cryptographic mechanisms guideline; sub-series covers TLS (-2), IPsec (-3), and SSH (-4).',
    keyPqcOutputs: [
      'BSI TR-02102-1 (Cryptographic Mechanisms – algorithm recommendations)',
      'BSI TR-02102-2 (TLS with PQC)',
      'BSI TR-02102-3 (IPsec/IKEv2 with PQC)',
      'BSI TR-02102-4 (SSH with PQC)',
    ],
    libraryRefs: ['BSI TR-02102-1', 'BSI TR-02102-2', 'BSI TR-02102-3', 'BSI TR-02102-4'],
    websiteUrl: 'https://www.bsi.bund.de/EN/Topics/Cryptography/cryptography_node.html',
    glossaryTerm: 'BSI',
  },
  {
    id: 'anssi',
    name: "Agence nationale de la sécurité des systèmes d'information",
    acronym: 'ANSSI',
    type: 'regulatory-agency',
    scope: 'regional',
    authority: 'governmental',
    region: 'France',
    founded: '2009',
    mission:
      'French national cybersecurity agency. It strongly recommends hybrid (classical + PQC) cryptography, and hybridisation is mandatory only inside the regulated perimeter: defence-classified and Diffusion Restreinte information, vital information systems, and products certified or qualified through ANSSI security visas. ANSSI published influential PQC position papers in 2022 and 2023 distinguishing hash-based algorithms (no systematic hybridisation recommended) from lattice-based algorithms (hybrid recommended).',
    decisionMaking:
      'Government agency (under Prime Minister). Issues position papers and technical notes through expert review. Three-phase roadmap (2022 position paper): Phase 1 (the situation in 2022) hybridation to add post-quantum defence-in-depth to pre-quantum assurance; Phase 2 (not earlier than 2025) hybridation to provide post-quantum security assurance; Phase 3 (probably not earlier than 2030) optional standalone post-quantum cryptography. The one exception to systematic hybridisation is hash-based signatures (SLH-DSA, XMSS, LMS): ANSSI considers them usable without hybridisation because of their well-studied underlying problem, while noting their limited range of application.',
    keyPqcOutputs: [
      'ANSSI PQC Position Paper (2022)',
      'ANSSI PQC Follow-up Paper (2023)',
      'Hybrid PQC position: strongly recommended for lattice-based schemes such as ML-DSA, mandatory inside the regulated perimeter',
      'Hash-based signatures (SLH-DSA, XMSS, LMS): systematic hybridisation not recommended',
    ],
    libraryRefs: ['ANSSI PQC Position Paper', 'ANSSI PQC Follow-up Paper'],
    websiteUrl:
      'https://cyber.gouv.fr/en/publications/anssi-views-post-quantum-cryptography-transition',
    glossaryTerm: 'ANSSI',
  },
  {
    id: 'enisa',
    name: 'European Union Agency for Cybersecurity',
    acronym: 'ENISA',
    type: 'regulatory-agency',
    scope: 'regional',
    authority: 'governmental',
    region: 'EU',
    founded: '2004',
    mission:
      'EU cybersecurity agency under the Cybersecurity Act. It supports the EU cybersecurity certification framework, including EUCC (the European Common Criteria-based scheme set up by Commission Implementing Regulation (EU) 2024/482), and publishes EUCC certificates, certification reports and supporting documents on the EU certification website. ENISA does not issue EUCC certificates: accredited certification bodies do. It supports the ECCG, whose Sub-group on Cryptography agrees the Agreed Cryptographic Mechanisms (ACM); ENISA receives ACM update requests. Together with the Commission, ENISA links the EU coordinated PQC migration roadmap (drawn up in the NIS Cooperation Group) to the ECCG work on recommendations for PQC mechanisms and their evaluation.',
    decisionMaking:
      'EU Agency under the Cybersecurity Act (2019). EUCC is set out in Commission Implementing Regulation (EU) 2024/482: certification bodies issue the certificates, national cybersecurity certification authorities supervise, and the European Cybersecurity Certification Group (ECCG) endorses state-of-the-art documents, which ENISA publishes. Issues technical reports and threat landscapes. Works with MSs (Member States) national cybersecurity authorities.',
    keyPqcOutputs: [
      'ECCG Agreed Cryptographic Mechanisms (ACM) v2.0 – cryptography guideline for EUCC developers and evaluators; lists ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS and FrodoKEM and says lattice-based schemes should be combined with a classical mechanism',
      'ENISA PQC Guidelines (2021)',
      'ENISA Post-Quantum Cryptography: Integration study (October 2022)',
      'EUCC (European Common Criteria-based cybersecurity certification scheme; Regulation (EU) 2024/482)',
    ],
    libraryRefs: ['EUCC v2.0 ACM'],
    websiteUrl: 'https://www.enisa.europa.eu/topics/cryptography/post-quantum-cryptography',
    glossaryTerm: 'ENISA',
  },
  {
    id: 'common-criteria',
    name: 'Common Criteria Recognition Arrangement',
    acronym: 'CC / CCRA',
    type: 'certification-body',
    scope: 'global',
    authority: 'governmental',
    region: 'Global',
    founded: '1994',
    mission:
      'Mutual recognition arrangement for IT security evaluations based on ISO/IEC 15408. Products are evaluated by accredited labs; certificates are issued by national Certification Bodies (e.g., BSI, ANSSI, NIAP).',
    decisionMaking:
      'Protection Profiles (PP) define security requirements for product categories (e.g., "PKI digital signatures"). Independent labs test products against PPs. EUCC is a separate EU scheme, set up by Commission Implementing Regulation (EU) 2024/482, that applies Common Criteria and the Common Evaluation Methodology under EU rules.',
    keyPqcOutputs: [
      'ISO/IEC 15408 (CC standard for evaluation methodology)',
      'PQC Protection Profiles (in development for HSMs, certificates, firewalls)',
      'EUCC (EU Common Criteria-based scheme, Regulation (EU) 2024/482 – certification bodies issue, national authorities supervise)',
    ],
    libraryRefs: [],
    websiteUrl: 'https://www.commoncriteriaportal.org/',
    glossaryTerm: 'Common Criteria',
  },
  {
    id: 'cmvp',
    name: 'Cryptographic Module Validation Program',
    acronym: 'CMVP',
    type: 'certification-body',
    scope: 'regional',
    authority: 'governmental',
    region: 'US',
    founded: '1995',
    mission:
      'NIST/CSE (Communications Security Establishment Canada) joint program validating cryptographic module implementations against FIPS 140-3. Required for US federal procurement (FISMA). Module certificates that list ML-KEM or ML-DSA as approved algorithms now exist (for example Level 3 HSM certificates #5282 and #5450, 2026).',
    decisionMaking:
      'NVLAP-accredited testing labs perform validation testing → CMVP issues official certificate. The Cryptographic Algorithm Validation Program (CAVP) validates the individual algorithm implementations (e.g., FIPS 203/204/205), testing them through NIST’s ACVTS over the ACVP protocol. CMVP validation time varies by module and queue; the public Modules in Process list shows the status of each submission, and the wait is a critical-path dependency.',
    keyPqcOutputs: [
      'FIPS 140-3 certificates for PQC-enabled modules',
      'FIPS 203/204/205 algorithm validation (CAVP, tested via ACVP) as a module prerequisite',
      'FIPS 140-3 Implementation Guidance (one document, last updated 19 August 2026), including its PQC self-test sections',
    ],
    libraryRefs: ['NIST-FIPS140-3-IG-PQC'],
    websiteUrl: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program',
    glossaryTerm: 'CMVP',
  },
  {
    id: 'ncsc-uk',
    name: 'National Cyber Security Centre (UK)',
    acronym: 'NCSC',
    type: 'regulatory-agency',
    scope: 'regional',
    authority: 'governmental',
    region: 'UK',
    founded: '2016',
    mission:
      'UK national cybersecurity authority (part of GCHQ), providing guidance on PQC migration via a three-phase roadmap: Discovery (2025–2028), Priority Migration (2028–2031), Full Migration (2031–2035). Works with Five Eyes partners on classified PQC guidance.',
    decisionMaking:
      'Government agency publishes whitepapers and migration timelines. Coordinates with DSIT (Dept. for Science, Innovation & Technology) and industry through the NCSC Industry 100 program. Aligned with NIST algorithm recommendations (FIPS 203/204/205).',
    keyPqcOutputs: [
      'UK PQC Migration Timelines (2025)',
      'Three-phase roadmap: Discovery (2025–2028), Priority (2028–2031), Full (2031–2035)',
      'NCSC whitepaper on preparing for quantum-safe cryptography',
    ],
    libraryRefs: [],
    websiteUrl: 'https://www.ncsc.gov.uk/collection/post-quantum-cryptography',
  },
  {
    id: 'nsa',
    name: 'National Security Agency',
    acronym: 'NSA',
    type: 'regulatory-agency',
    scope: 'regional',
    authority: 'governmental',
    region: 'US',
    founded: '1952',
    mission:
      'US signals intelligence and cybersecurity agency. Publishes CNSA (Commercial National Security Algorithm Suite) — the mandatory algorithm suite for National Security Systems (NSS). Current CNSA 2.0 FAQ version 2.2 requires compliant new acquisitions from 2027, phase-out of unsupported equipment and services by 2030, and CNSA 2.0 algorithms by 2031 unless otherwise noted.',
    decisionMaking:
      'Issues mandates via CNSSP (Committee on National Security Systems Policy). CNSA 2.0 issued September 2022 with phased deadlines. NSA CSfC (Commercial Solutions for Classified) program certifies commercial products for classified use.',
    keyPqcOutputs: [
      'CNSA 2.0 (September 2022) – specifies ML-KEM-1024 and ML-DSA-87, and approves LMS and XMSS for software/firmware signing',
      'NSA CNSA 2.0 FAQ',
      'NSA CSfC PQC Guidance Addendum',
    ],
    libraryRefs: ['NSA CNSA 2.0'],
    websiteUrl:
      'https://www.nsa.gov/Press-Room/News-Highlights/Article/Article/3198/nsa-releases-future-quantum-resistant-qr-algorithm-requirements-for-national-se/',
  },
  {
    id: 'kpqc',
    name: 'Korean Post-Quantum Cryptography Research Group (KpqC)',
    acronym: 'KpqC (NSR / NIS)',
    type: 'standards-body',
    scope: 'regional',
    authority: 'governmental',
    region: 'Asia-Pacific',
    founded: '2021',
    mission:
      "Research group set up in 2021 by the National Security Research Institute (NSR) and the National Intelligence Service (NIS), with experts from industry, academia, government and research institutes. It ran the KpqC national PQC competition (first round from November 2022; final algorithms announced 16 January 2025): HAETAE and AIMer (signatures), SMAUG-T and NTRU+ (KEMs). KISA, the Korea Internet & Security Agency, sits on its advisory committees. The July 2023 master plan of NIS and the Ministry of Science and ICT sets 2035 as the target for spreading post-quantum cryptography through Korea's cryptographic systems. In April 2026 the group reported that Korean Standard (KS) proposals for the two KEMs had been submitted and the two signature algorithms were under review; no standardization date is published.",
    decisionMaking:
      'Parallel to NIST — Korean algorithms are not the same as FIPS 203/204/205. Multinational organizations in Korea may need to support both Korean and NIST-standardized algorithms.',
    keyPqcOutputs: [
      'KpqC Competition (2022–2025)',
      'HAETAE (lattice signature) – competition winner',
      'AIMer (MPC-in-the-head signature) – competition winner',
      'SMAUG-T (lattice KEM) – competition winner',
      'NTRU+ (lattice KEM) – competition winner',
    ],
    libraryRefs: ['KpqC-Competition-Results'],
    websiteUrl: 'https://www.kpqc.or.kr/',
  },
]

// ─── Body Classifier Cards ────────────────────────────────────────────────────

export interface ClassifyCard {
  id: string
  name: string
  acronym: string
  hint: string
  correctType: OrgType
  correctScope: OrgScope
  correctAuthority: OrgAuthority
}

export const CLASSIFY_CARDS: ClassifyCard[] = [
  {
    id: 'nist',
    name: 'NIST',
    acronym: 'National Institute of Standards and Technology',
    hint: 'US federal agency (Dept of Commerce). FIPS = Federal Information Processing Standards — binding only for US federal use. Other countries adopt NIST standards voluntarily; NIST has no mandate authority outside the US.',
    correctType: 'standards-body',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'iso-iec',
    name: 'ISO/IEC JTC 1/SC 27',
    acronym: 'International standards body',
    hint: `National member bodies (${SC27_MEMBERS.participating} participating, ${SC27_MEMBERS.observing} observing in SC 27; ${SC27_MEMBERS.source}, read ${SC27_MEMBERS.readOn}) develop and ballot information security standards, including cryptography.`,
    correctType: 'standards-body',
    correctScope: 'global',
    correctAuthority: 'non-governmental',
  },
  {
    id: 'etsi',
    name: 'ETSI',
    acronym: 'European Telecommunications Standards Institute',
    hint: 'Published TS 103 744 (normative, quantum-safe hybrid key establishment) and TR 103 619 (migration guide) for quantum-safe cryptography.',
    correctType: 'standards-body',
    correctScope: 'regional',
    correctAuthority: 'non-governmental',
  },
  {
    id: 'ietf',
    name: 'IETF',
    acronym: 'Internet Engineering Task Force',
    hint: 'Operates by rough consensus and running code. No membership fee. Publishes RFCs.',
    correctType: 'standards-body',
    correctScope: 'global',
    correctAuthority: 'non-governmental',
  },
  {
    id: 'bsi',
    name: 'BSI',
    acronym: 'Federal Office for Information Security (Germany)',
    hint: 'Publishes the TR-02102 series of Technical Guidelines: recommendations on cryptographic mechanisms and key lengths, including PQC.',
    correctType: 'regulatory-agency',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'anssi',
    name: 'ANSSI',
    acronym: "Agence nationale de la sécurité des systèmes d'information (France)",
    hint: 'Strongly recommends hybrid PQC (classical + PQC); mandatory inside the French regulated perimeter. Hash-based signatures (SLH-DSA, XMSS, LMS) are the exception.',
    correctType: 'regulatory-agency',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'enisa',
    name: 'ENISA',
    acronym: 'EU Agency for Cybersecurity',
    hint: 'EU agency under the Cybersecurity Act. Supports the EUCC certification scheme and the ECCG, which agrees the Agreed Cryptographic Mechanisms (ACM), and publishes EUCC certificates. Accredited certification bodies issue them, not ENISA. It is an EU agency that supports and promotes the framework (Cybersecurity Act Art. 8), not a regulator and not a certification body (Art. 56: conformity assessment bodies issue certificates).',
    correctType: 'regulatory-agency',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'cmvp',
    name: 'CMVP',
    acronym: 'Cryptographic Module Validation Program (NIST/CSE)',
    hint: 'Joint NIST/Canada program that issues FIPS 140-3 certificates for cryptographic module implementations.',
    correctType: 'certification-body',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'fips-140-3',
    name: 'FIPS 140-3',
    acronym: 'Federal Information Processing Standard 140-3',
    hint: 'US standard defining security requirements for cryptographic modules. Required for federal procurement under FISMA.',
    correctType: 'compliance-framework',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'cnsa-2',
    name: 'CNSA 2.0',
    acronym: 'Commercial National Security Algorithm Suite 2.0',
    hint: 'NSA mandate (2022) requiring ML-KEM-1024 and ML-DSA-87 for US National Security Systems.',
    correctType: 'compliance-framework',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'nis2',
    name: 'NIS2 Directive',
    acronym: 'Network and Information Security Directive 2',
    hint: 'EU Directive (adopted by the European Parliament and the Council) requiring cybersecurity risk management for essential and important entities; Member States transpose it into national law.',
    correctType: 'compliance-framework',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'common-criteria',
    name: 'Common Criteria',
    acronym: 'CC / CCRA — based on ISO/IEC 15408',
    hint: '36-country mutual recognition arrangement for IT product security evaluations (18 issue certificates, 18 only recognise them). Recognition covers only collaborative Protection Profile or EAL1–2 + ALC_FLR certificates. Its participants are government organisations or government agencies (CCRA Art. 1), so it is governmental.',
    correctType: 'certification-body',
    correctScope: 'global',
    correctAuthority: 'governmental',
  },
]

// ─── Chain Scenarios (Step 3) ─────────────────────────────────────────────────

export interface ChainNode {
  id: string
  role: 'standard' | 'certification' | 'compliance'
  label: string
  body: string
  description: string
}

export interface ChainScenario {
  id: string
  title: string
  context: string
  nodes: [ChainNode, ChainNode, ChainNode]
}

export const CHAIN_SCENARIOS: ChainScenario[] = [
  {
    id: 'nist-cnsa',
    title: 'US National Security Systems',
    context:
      'A US government contractor must deploy PQC-capable HSMs for classified communications.',
    nodes: [
      {
        id: 'fips-203',
        role: 'standard',
        label: 'FIPS 203 (ML-KEM)',
        body: 'NIST',
        description:
          'NIST published FIPS 203 (ML-KEM) in August 2024 defining the algorithm specification and security levels (ML-KEM-512/768/1024). This is the technical standard that defines what ML-KEM is.',
      },
      {
        id: 'cmvp-cert',
        role: 'certification',
        label: 'CMVP Validation',
        body: 'NIST/CSE',
        description:
          'The CMVP (Cryptographic Module Validation Program) validates a defined module, such as an HSM, against FIPS 140-3. An NVLAP-accredited lab tests the module; CMVP issues the certificate. Correct ML-KEM behaviour is shown by a CAVP algorithm certificate for FIPS 203, which the module certificate then lists among its approved algorithms. Validation time varies by module and queue.',
      },
      {
        id: 'cnsa-2',
        role: 'compliance',
        label: 'CNSA 2.0 Mandate',
        body: 'NSA',
        description:
          'CNSA 2.0 (September 2022) mandates use of ML-KEM-1024 for key agreement in National Security Systems. US government contractors purchasing HSMs must select CMVP-validated modules that implement FIPS 203 at the ML-KEM-1024 level.',
      },
    ],
  },
  {
    id: 'etsi-eucc',
    title: 'EU Government Digital Services',
    context:
      'An EU member state government needs PQC-certified products for citizen-facing digital identity services.',
    nodes: [
      {
        id: 'etsi-ts-103744',
        role: 'standard',
        label: 'ETSI TS 103 744',
        body: 'ETSI TC CYBER',
        description:
          'ETSI TS 103 744 is a normative Technical Specification for quantum-safe hybrid key establishment. It specifies methods for deriving a key from several shared secrets: one from a traditional scheme such as elliptic-curve Diffie-Hellman and one from a quantum-safe key encapsulation mechanism (ML-KEM, FIPS 203). It fixes the combinations of key-derivation function, curve and ML-KEM size an implementation may use. It covers key establishment only; it is not a general list of approved algorithms or requirements.',
      },
      {
        id: 'eucc-eval',
        role: 'certification',
        label: 'EUCC Certification',
        body: 'Accredited certification bodies (supervised by national authorities)',
        description:
          "EUCC, the European Common Criteria-based cybersecurity certification scheme, is established by Commission Implementing Regulation (EU) 2024/482 under the Cybersecurity Act. Products are evaluated against Common Criteria and the Common Evaluation Methodology, and certification bodies issue EUCC certificates at assurance level 'substantial' or 'high' (Art. 4). National cybersecurity certification authorities supervise the certification bodies, evaluation labs and certificate holders; ENISA publishes the certificates, certification reports and supporting documents (Art. 42). The Regulation applies in every Member State and replaces the national schemes it covers (Art. 49).",
      },
      {
        id: 'eidas-2',
        role: 'compliance',
        label: 'eIDAS 2.0 Mandate',
        body: 'EU Regulation (Parliament and Council); Member State supervisory bodies',
        description:
          "eIDAS 2.0 is Regulation (EU) 910/2014 as amended by Regulation (EU) 2024/1183. It requires each Member State to provide at least one EUDI (European Digital Identity) Wallet (Art. 5a). It also requires qualified electronic signature creation devices to be certified by bodies the Member States designate (Art. 30), on the basis of a security evaluation against a standard in a Commission list or another process of comparable security level that is notified to the Commission; EUCC is one possible route, not a requirement for every case. Qualified trust service providers are audited separately (Art. 20). The ECCG's Agreed Cryptographic Mechanisms (ACM v2) are guidance for developers and evaluators, not a list of algorithms that eIDAS mandates.",
      },
    ],
  },
  {
    id: 'iso-cc-eu',
    title: 'EU Government IT Procurement',
    context:
      'A European government ministry procures a secure email gateway and requires CC-certified products.',
    nodes: [
      {
        id: 'iso-14888',
        role: 'standard',
        label: 'ISO/IEC 14888-4:2024',
        body: 'ISO/IEC JTC 1/SC 27',
        description:
          'ISO/IEC 14888-4:2024 (Hash-based Digital Signatures) is the international standard for XMSS and LMS.',
      },
      {
        id: 'cc-pp',
        role: 'certification',
        label: 'Common Criteria Evaluation',
        body: 'CCRA / BSI / ANSSI',
        description:
          '',
      },
      {
        id: 'eu-procurement',
        role: 'compliance',
        label: 'EU Procurement Requirement',
        body: 'Member States under NIS2 (national law)',
        description:
          "NIS2 (Directive (EU) 2022/2555, adopted by the European Parliament and the Council) does not itself require certified products. Article 24(1) lets Member States require essential and important entities to use ICT products certified under a European cybersecurity certification scheme, such as EUCC, to demonstrate compliance with particular risk-management requirements (Article 21), and Article 24(2) lets the Commission specify by delegated act which categories of entities must do so. Under the Cybersecurity Act, certification is voluntary unless Union or Member State law says otherwise (Article 56(2)). So a ministry's requirement for CC-certified products comes from national law or its own procurement specification, not from NIS2 alone.",
      },
    ],
  },
  {
    id: 'nist-fedramp',
    title: 'US Cloud Service Compliance',
    context:
      'A cloud service provider seeks FedRAMP authorization for a US federal agency customer.',
    nodes: [
      {
        id: 'nist-ir-8547',
        role: 'standard',
        label: 'NIST IR 8547',
        body: 'NIST',
        description:
          'NIST IR 8547 is the Transition to Post-Quantum Cryptography Standards roadmap (final, October 2026; it replaced the November 2024 draft). It deprecates quantum-vulnerable public-key algorithms after 2030 and disallows them under NIST standards and guidelines after 2035, with FIPS 203/204/205 as the replacements.',
      },
      {
        id: 'acvp-cert',
        role: 'certification',
        label: 'CAVP Algorithm Validation (via ACVP)',
        body: 'NIST CAVP',
        description:
          "The CAVP validates cryptographic algorithm implementations, and algorithm validation is a prerequisite of CMVP module validation. Testing runs through NIST's ACVTS, which speaks ACVP (the Automated Cryptographic Validation Protocol): the implementation receives FIPS 203/204/205 test vector sets as JSON and returns its answers. Only the ACVTS production environment, used by accredited labs, creates CAVP certificates.",
      },
      {
        id: 'fedramp-pqc',
        role: 'compliance',
        label: 'FedRAMP PQC Requirement',
        body: 'GSA / CISA',
        description:
          "FedRAMP (Federal Risk and Authorization Management Program) governs cloud service authorization for US federal agencies. NIST IR 8547 is final (October 2026). The module expects FedRAMP's cryptographic requirements to follow NIST's PQC standards, which would mean CAVP-validated algorithm implementations (tested through NIST's ACVP service) in cloud services; we found no FedRAMP publication that states this.",
      },
    ],
  },
]

// ─── Coverage Grid Data ───────────────────────────────────────────────────────

export interface CoverageCell {
  orgs: string[]
  note?: string
}

export type RegionKey = 'global' | 'us' | 'eu' | 'uk' | 'asia-pacific'
export type OrgTypeKey =
  'standards-body' | 'certification-body' | 'compliance-framework' | 'regulatory-agency'

export const COVERAGE_GRID: Record<RegionKey, Record<OrgTypeKey, CoverageCell>> = {
  global: {
    'standards-body': {
      orgs: ['ISO/IEC JTC 1/SC 27', 'IETF', 'ITU-T SG17', '3GPP SA3', 'OASIS'],
      note: 'Globally recognized; no single country controls these bodies',
    },
    'certification-body': {
      orgs: ['CCRA (Common Criteria)'],
      note: '36 participating countries (18 issue certificates, 18 only recognise them); recognition covers only collaborative Protection Profile or EAL1–2 + ALC_FLR certificates',
    },
    'compliance-framework': {
      orgs: ['—'],
      note: 'No truly global binding compliance framework exists; closest is CCRA mutual recognition',
    },
    'regulatory-agency': {
      orgs: ['ITU-T (treaty body)', 'G7 Cyber Expert Group'],
      note: 'Coordination bodies — recommendations only, no enforcement authority',
    },
  },
  us: {
    'standards-body': {
      orgs: ['NIST'],
      note: 'FIPS 203/204/205 — globally influential despite being US-origin',
    },
    'certification-body': {
      orgs: ['CMVP (NIST/CSE)', 'CAVP (NIST/CSE)', 'NIAP (Common Criteria)'],
      note: 'CMVP validation required for US federal procurement (FISMA)',
    },
    'compliance-framework': {
      orgs: ['FIPS 140-3', 'CNSA 2.0', 'FedRAMP', 'CMMC', 'FISMA'],
      note: 'CNSA 2.0 binding for NSS; FIPS 140-3 binding for federal procurement',
    },
    'regulatory-agency': {
      orgs: ['NSA', 'CISA', 'NIST (dual role)'],
      note: 'NSA issues NSS mandates; CISA issues procurement guidance',
    },
  },
  eu: {
    'standards-body': {
      orgs: ['ETSI (TC CYBER)', 'CEN/CENELEC'],
      note: 'ETSI TS 103 744 covers hybrid key establishment (ECDH combined with ML-KEM), not quantum-safe cryptography in general',
    },
    'certification-body': {
      orgs: [
        'EUCC certification bodies',
        'National authorities (e.g., BSI, ANSSI)',
        'ENISA (publishes)',
      ],
      note: 'EUCC is one EU-wide scheme (Regulation (EU) 2024/482): certification bodies issue certificates, national authorities supervise, ENISA publishes them',
    },
    'compliance-framework': {
      orgs: ['NIS2 Directive', 'eIDAS 2.0', 'DORA', 'EU Cyber Resilience Act'],
      note: 'NIS2 is a Directive that Member States transpose into national law; eIDAS 2.0, DORA and the Cyber Resilience Act are Regulations that apply directly in every Member State',
    },
    'regulatory-agency': {
      orgs: ['European Commission (EC)', 'ENISA (dual role)'],
      note: 'The Commission adopts implementing acts such as EUCC; ENISA does not issue EUCC certificates',
    },
  },
  uk: {
    'standards-body': {
      orgs: ['BSI (British Standards Institution)'],
      note: 'Post-Brexit, UK maintains its own standards track aligned with ISO and ETSI',
    },
    'certification-body': {
      orgs: ['NCSC (CAPS — Commercial Product Assurance)', 'UKAS-accredited labs'],
      note: 'UK CC certificates no longer automatically recognized in EU post-Brexit',
    },
    'compliance-framework': {
      orgs: ['UK Gov PQC Roadmap (2025)', 'NCSC Cyber Essentials'],
      note: 'Three-phase roadmap: Discovery (2025–2028), Priority (2028–2031), Full (2031–2035)',
    },
    'regulatory-agency': {
      orgs: ['NCSC (part of GCHQ)', 'DSIT'],
      note: 'NCSC aligned with NIST algorithm recommendations (FIPS 203/204/205)',
    },
  },
  'asia-pacific': {
    'standards-body': {
      orgs: ['KpqC research group (Korea)', 'AIST (Japan)', 'Chinese Academy of Sciences'],
      note: 'Korea KpqC and China OSCCA run parallel national algorithm tracks',
    },
    'certification-body': {
      orgs: ['NISC (Japan)', 'OSCCA/NGCC (China)', 'MAS (Singapore — oversight)'],
      note: 'China OSCCA manages SM algorithm certification (non-NIST compatible)',
    },
    'compliance-framework': {
      orgs: ['Korea K-PQC master plan (2035 target)', 'China SM algorithm mandate', 'MAS TRM'],
      note: 'China mandates OSCCA-approved SM algorithms in regulated sectors',
    },
    'regulatory-agency': {
      orgs: ['NIS / MSIT (Korea)', 'OSCCA/NGCC (China)', 'NISC (Japan)', 'MAS (Singapore)'],
      note: 'National regulators; algorithms may diverge from NIST (especially China SM*)',
    },
  },
}

export const REGION_LABELS: Record<RegionKey, string> = {
  global: 'Global',
  us: 'United States',
  eu: 'European Union',
  uk: 'United Kingdom',
  'asia-pacific': 'Asia-Pacific',
}

export const ORG_TYPE_LABELS: Record<OrgTypeKey, string> = {
  'standards-body': 'Standards Body',
  'certification-body': 'Certification Body',
  'compliance-framework': 'Compliance Framework',
  'regulatory-agency': 'Government Agency',
}

// ─── Scenario Challenge (Step 5) ──────────────────────────────────────────────

export type { ScenarioOption, WorkshopScenario } from './data/workshopScenarios'
export { WORKSHOP_SCENARIOS } from './data/workshopScenarios'
