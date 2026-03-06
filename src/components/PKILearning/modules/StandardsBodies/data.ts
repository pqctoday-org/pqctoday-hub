// SPDX-License-Identifier: GPL-3.0-only

// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgType =
  | 'standards-body'
  | 'certification-body'
  | 'compliance-framework'
  | 'regulatory-agency'

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
      'US federal agency that develops and promotes measurement standards, including cryptographic standards that are widely adopted worldwide. NIST led the 6-year PQC algorithm competition (2016–2024) culminating in FIPS 203, 204, and 205.',
    decisionMaking:
      'Open competition → public comment period → FIPS publication. The PQC standardization ran from 2016–2024: 69 submissions → 4 rounds of evaluation → 4 finalists → FIPS 203/204/205 published August 2024. All draft standards undergo public comment (minimum 90 days).',
    keyPqcOutputs: [
      'FIPS 203 (ML-KEM, August 2024)',
      'FIPS 204 (ML-DSA, August 2024)',
      'FIPS 205 (SLH-DSA, August 2024)',
      'FIPS 206 (FN-DSA / Falcon, August 2024)',
      'NIST IR 8547 (Transition to PQC, initial public draft Nov 2024)',
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
    decisionMaking:
      '5-stage process: Working Draft (WD) → Committee Draft (CD) → Draft International Standard (DIS) → Final DIS (FDIS) → International Standard (IS). National bodies from 170+ countries vote at each stage. Full IS typically takes 3–5 years. PQC standards are developed in parallel with NIST and cross-reference FIPS.',
    keyPqcOutputs: [
      'ISO/IEC 14888-4:2024 (Hash-based Digital Signatures – XMSS, LMS)',
      'ISO/IEC 18033-2/AMD1 (Asymmetric Ciphers – PQC addendum)',
      'ISO/IEC NP 29192-8 (Lightweight PQC, in development)',
      'ISO/IEC 20085 (KEM reference, in development)',
    ],
    libraryRefs: ['ISO/IEC 14888-4:2024', 'ISO/IEC 18033-2:2006/AMD1:2017'],
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
    decisionMaking:
      'Industry membership (800+ organizations from 68 countries) → Technical Committees (TC CYBER) → Technical Specification (TS, normative) or Technical Report (TR, informational). Chair of TC CYBER QSC WG: Matthew Campagna (AWS). ETSI TS documents contain "shall" requirements; TRs are guidance only.',
    keyPqcOutputs: [
      'ETSI TS 103 744 (Quantum-Safe Cryptography – normative requirements)',
      'ETSI TR 103 619 (PQC Migration Guide)',
      'ETSI TR 103 616 (Attribute-Based Encryption)',
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
      'draft-ietf-tls-hybrid-design (X25519MLKEM768)',
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
      "Germany's national cybersecurity authority, issuing Technical Guidelines (TR) binding for German government and critical infrastructure. BSI TR-02102 series is updated annually and specifies approved cryptographic mechanisms including PQC.",
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
      'French national cybersecurity agency, uniquely requiring hybrid (classical + PQC) cryptography for sensitive systems. ANSSI published influential PQC position papers in 2022 and 2023 distinguishing hash-based (approved standalone) from lattice-based algorithms (hybrid mandatory).',
    decisionMaking:
      'Government agency (under Prime Minister). Issues position papers and technical notes through expert review. Three-phase PQC roadmap: Phase 1 (2022–2025, classical preferred) → Phase 2 (2025–2030, hybrid preferred) → Phase 3 (2030+, PQC preferred). Unique stance: permits standalone SLH-DSA due to hash-only security assumption.',
    keyPqcOutputs: [
      'ANSSI PQC Position Paper (2022)',
      'ANSSI PQC Follow-up Paper (2023)',
      'Hybrid requirement for sensitive systems (ML-DSA must be paired with classical)',
      'SLH-DSA standalone approved (hash-based, distinct security assumption)',
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
    type: 'certification-body',
    scope: 'regional',
    authority: 'governmental',
    region: 'EU',
    founded: '2004',
    mission:
      "EU cybersecurity agency responsible for the European Cybersecurity Certification Framework (EUCC — the EU's adaptation of Common Criteria). ENISA also advises on PQC policy for eIDAS 2.0, NIS2, and DORA. Manages the Agreed Cryptographic Mechanisms (ACM) list.",
    decisionMaking:
      'EU Agency under the Cybersecurity Act (2019). EUCC certification scheme developed through ECCG (European Cybersecurity Certification Group) with industry input. Issues technical reports and threat landscapes. Works with MSs (Member States) national cybersecurity authorities.',
    keyPqcOutputs: [
      'EUCC v2.0 Agreed Cryptographic Mechanisms (ACM) – lists approved PQC algorithms',
      'ENISA PQC Guidelines (2021)',
      'eIDAS 2.0 cryptographic recommendations',
      'EUCC (EU Cybersecurity Certification Scheme for CC-based evaluations)',
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
    authority: 'non-governmental',
    region: 'Global',
    founded: '1994',
    mission:
      "Mutual recognition arrangement for IT security evaluations based on ISO/IEC 15408. 31 member nations accept each other's CC certificates. Products are evaluated by accredited labs; certificates issued by national Certification Bodies (e.g., BSI, ANSSI, NCSC, NIAP).",
    decisionMaking:
      'Protection Profiles (PP) define security requirements for product categories (e.g., "PKI digital signatures"). Independent labs test products against PPs. CCRA Technical Community maintains the framework. EUCC is the EU-specific adaptation managed by ENISA with a stricter, harmonized approach.',
    keyPqcOutputs: [
      'ISO/IEC 15408 (CC standard for evaluation methodology)',
      'PQC Protection Profiles (in development for HSMs, certificates, firewalls)',
      'EUCC (EU Cybersecurity Certification Scheme – CC-based, ENISA-managed)',
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
      'NIST/CSE (Communications Security Establishment Canada) joint program validating cryptographic module implementations against FIPS 140-3. Required for US federal procurement (FISMA). PQC-first FIPS 140-3 certificates began appearing in late 2024.',
    decisionMaking:
      'NVLAP-accredited testing labs perform validation testing → CMVP issues official certificate. ACVP (Cryptographic Algorithm Validation Program) handles individual algorithm testing (e.g., FIPS 203/204/205 test vectors). CMVP validation typically takes 18–36 months, creating a critical path dependency.',
    keyPqcOutputs: [
      'FIPS 140-3 certificates for PQC-enabled modules',
      'FIPS 203/204/205 ACVP algorithm test vectors',
      'FIPS 140-3 Implementation Guidance for PQC (Sep 2025)',
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
      'US signals intelligence and cybersecurity agency. Publishes CNSA (Commercial National Security Algorithm Suite) — the mandatory algorithm suite for National Security Systems (NSS). CNSA 2.0 (September 2022) mandates exclusive use of ML-KEM-1024 and ML-DSA-87 by 2030–2033.',
    decisionMaking:
      'Issues mandates via CNSSP (Committee on National Security Systems Policy). CNSA 2.0 issued September 2022 with phased deadlines. NSA CSfC (Commercial Solutions for Classified) program certifies commercial products for classified use.',
    keyPqcOutputs: [
      'CNSA 2.0 (September 2022) – mandates ML-KEM-1024, ML-DSA-87, LMS and XMSS (software/firmware signing)',
      'NSA CNSA 2.0 FAQ',
      'NSA CSfC PQC Guidance Addendum',
    ],
    libraryRefs: ['NSA CNSA 2.0'],
    websiteUrl:
      'https://www.nsa.gov/Press-Room/News-Highlights/Article/Article/3198/nsa-releases-future-quantum-resistant-qr-algorithm-requirements-for-national-se/',
  },
  {
    id: 'kisa',
    name: 'Korea Internet & Security Agency',
    acronym: 'KISA',
    type: 'regulatory-agency',
    scope: 'regional',
    authority: 'governmental',
    region: 'Asia-Pacific',
    founded: '2009',
    mission:
      'Korean government agency (Ministry of Science & ICT) that ran the KpqC national PQC competition (2022–2025). Selected HAETAE and AIMer (signatures), SMAUG-T and NTRU+ (KEMs) as Korean national algorithms. Target standardization by 2029, migration by 2035.',
    decisionMaking:
      'National competition with independent academic evaluation committee. Parallel to NIST — Korean algorithms are not the same as FIPS 203/204/205. Multinational organizations in Korea may need to support both Korean and NIST-standardized algorithms.',
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
    hint: '170+ national member bodies vote on information security standards including cryptography.',
    correctType: 'standards-body',
    correctScope: 'global',
    correctAuthority: 'non-governmental',
  },
  {
    id: 'etsi',
    name: 'ETSI',
    acronym: 'European Telecommunications Standards Institute',
    hint: 'Published TS 103 744 (normative) and TR 103 619 (migration guide) for quantum-safe cryptography.',
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
    hint: 'Publishes TR-02102 series — binding Technical Guidelines for German government and critical infrastructure.',
    correctType: 'regulatory-agency',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'anssi',
    name: 'ANSSI',
    acronym: "Agence nationale de la sécurité des systèmes d'information (France)",
    hint: 'Requires hybrid PQC (classical + PQC) for sensitive French systems. Unique position on SLH-DSA.',
    correctType: 'regulatory-agency',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'enisa',
    name: 'ENISA',
    acronym: 'EU Agency for Cybersecurity',
    hint: 'Manages the EUCC certification scheme and the Agreed Cryptographic Mechanisms (ACM) list for the EU.',
    correctType: 'certification-body',
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
    hint: 'EU regulation requiring cybersecurity risk management for essential and important entities across member states.',
    correctType: 'compliance-framework',
    correctScope: 'regional',
    correctAuthority: 'governmental',
  },
  {
    id: 'common-criteria',
    name: 'Common Criteria',
    acronym: 'CC / CCRA — based on ISO/IEC 15408',
    hint: '31-nation mutual recognition arrangement for IT product security evaluations. Certificates recognized across member states.',
    correctType: 'certification-body',
    correctScope: 'global',
    correctAuthority: 'non-governmental',
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
          'The CMVP (Cryptographic Module Validation Program) certifies that a specific HSM implementation correctly implements FIPS 203. An NVLAP-accredited lab tests the module; CMVP issues the certificate. Validation typically takes 18–36 months.',
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
          'ETSI TS 103 744 is a normative Technical Specification defining quantum-safe cryptography requirements for European industry. It specifies algorithm selection, parameter sets, and interoperability guidance harmonized with NIST and ISO/IEC standards.',
      },
      {
        id: 'eucc-eval',
        role: 'certification',
        label: 'EUCC Evaluation',
        body: 'ENISA / National CAs',
        description:
          "EUCC (EU Cybersecurity Certification Scheme) is ENISA's adaptation of Common Criteria for EU markets. Products are evaluated by accredited CABs (Conformity Assessment Bodies); certificates are valid across all EU member states, eliminating need for per-country certification.",
      },
      {
        id: 'eidas-2',
        role: 'compliance',
        label: 'eIDAS 2.0 Mandate',
        body: 'European Commission',
        description:
          "eIDAS 2.0 requires EU member states to provide EUDI (European Digital Identity) Wallets. The European Commission's implementing acts reference EUCC certification for qualified trust service providers, and ENISA's ACM list specifies the approved PQC algorithms.",
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
          'ISO/IEC 14888-4:2024 (Hash-based Digital Signatures) is the international standard for XMSS and LMS. As an IS (International Standard), it provides the global normative reference for hash-based PQC signature schemes recognized across 170+ ISO member countries.',
      },
      {
        id: 'cc-pp',
        role: 'certification',
        label: 'Common Criteria Evaluation',
        body: 'CCRA / BSI / ANSSI',
        description:
          'The product is evaluated against a CC Protection Profile (PP) that references ISO/IEC 14888-4 for signature verification. BSI (Germany) or ANSSI (France) acts as the Certification Body; an accredited IT Security Evaluation Facility (ITSEF) performs the testing.',
      },
      {
        id: 'eu-procurement',
        role: 'compliance',
        label: 'EU Procurement Requirement',
        body: 'European Commission / NIS2',
        description:
          "NIS2 Directive requires essential entities to use certified security products. EU procurement rules increasingly reference CC/EUCC certification as a requirement for government IT purchases, especially after the EU Cybersecurity Act's European Cybersecurity Certification Framework became operational.",
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
          'NIST IR 8547 is the Transition to Post-Quantum Cryptography Standards roadmap (initial public draft, November 2024; comment period closed January 2025). When finalized, it will specify which classical algorithms are deprecated (by 2030) and disallowed (by 2035), and require services to migrate to FIPS 203/204/205.',
      },
      {
        id: 'acvp-cert',
        role: 'certification',
        label: 'ACVP Algorithm Validation',
        body: 'NIST CAVP',
        description:
          "ACVP (Automated Cryptographic Validation Protocol) is NIST's cloud-based system for testing cryptographic algorithm implementations. Before a module gets CMVP validation, its individual algorithms must pass ACVP testing with NIST's official FIPS 203/204/205 test vectors.",
      },
      {
        id: 'fedramp-pqc',
        role: 'compliance',
        label: 'FedRAMP PQC Requirement',
        body: 'GSA / CISA',
        description:
          "FedRAMP (Federal Risk and Authorization Management Program) governs cloud service authorization for US federal agencies. Once NIST IR 8547 is finalized (currently in initial public draft as of November 2024), FedRAMP's cryptographic requirements will reference FIPS 203/204/205 — requiring ACVP-validated algorithm implementations in cloud services.",
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
  | 'standards-body'
  | 'certification-body'
  | 'compliance-framework'
  | 'regulatory-agency'

export const COVERAGE_GRID: Record<RegionKey, Record<OrgTypeKey, CoverageCell>> = {
  global: {
    'standards-body': {
      orgs: ['ISO/IEC JTC 1/SC 27', 'IETF', 'ITU-T SG17', '3GPP SA3', 'OASIS'],
      note: 'Globally recognized; no single country controls these bodies',
    },
    'certification-body': {
      orgs: ['CCRA (Common Criteria)'],
      note: '31-nation mutual recognition; certificates valid across member states',
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
      orgs: ['CMVP (NIST/CSE)', 'ACVP', 'NIAP (Common Criteria)'],
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
      note: 'ETSI TS 103 744 provides EU interoperability baseline for quantum-safe cryptography',
    },
    'certification-body': {
      orgs: ['ENISA (EUCC)', 'National CAs (BSI, ANSSI, NCSC-NL)'],
      note: "EUCC is EU-wide; national CAs accept each other's EUCC certificates",
    },
    'compliance-framework': {
      orgs: ['NIS2 Directive', 'eIDAS 2.0', 'DORA', 'EU Cyber Resilience Act'],
      note: 'NIS2 and eIDAS 2.0 are legally binding EU regulations',
    },
    'regulatory-agency': {
      orgs: ['European Commission (EC)', 'ENISA (dual role)'],
      note: 'EC legislates (NIS2, CRA); ENISA advises and manages certification schemes',
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
      orgs: ['KISA/KpqC (Korea)', 'AIST (Japan)', 'Chinese Academy of Sciences'],
      note: 'Korea KpqC and China OSCCA run parallel national algorithm tracks',
    },
    'certification-body': {
      orgs: ['NISC (Japan)', 'OSCCA/NGCC (China)', 'MAS (Singapore — oversight)'],
      note: 'China OSCCA manages SM algorithm certification (non-NIST compatible)',
    },
    'compliance-framework': {
      orgs: ['Korea KpqC adoption (target 2029)', 'China SM algorithm mandate', 'MAS TRM'],
      note: 'China mandates OSCCA-approved SM algorithms in regulated sectors',
    },
    'regulatory-agency': {
      orgs: ['KISA (Korea)', 'OSCCA/NGCC (China)', 'NISC (Japan)', 'MAS (Singapore)'],
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
  'regulatory-agency': 'Regulatory Agency',
}

// ─── Scenario Challenge (Step 5) ──────────────────────────────────────────────

export interface ScenarioOption {
  id: string
  label: string
}

export interface WorkshopScenario {
  id: string
  situation: string
  question: string
  bodyTypeOptions: ScenarioOption[]
  orgOptions: ScenarioOption[]
  standardOptions: ScenarioOption[]
  correctBodyType: string
  correctOrg: string
  correctStandard: string
  briefFeedback: string
  detailedExplanation: string
}

export const WORKSHOP_SCENARIOS: WorkshopScenario[] = [
  {
    id: 'us-hsm',
    situation:
      'Your US federal agency is procuring a new HSM to store ML-KEM keys for classified communications. A vendor claims their product "supports FIPS 140-3". You need to verify this claim before signing the purchase order.',
    question: 'Which program certifies that an HSM correctly implements FIPS 140-3?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body' },
      { id: 'certification-body', label: 'Certification Body' },
      { id: 'compliance-framework', label: 'Compliance Framework' },
      { id: 'regulatory-agency', label: 'Regulatory Agency' },
    ],
    orgOptions: [
      { id: 'nist', label: 'NIST' },
      { id: 'cmvp', label: 'CMVP (Cryptographic Module Validation Program)' },
      { id: 'enisa', label: 'ENISA' },
      { id: 'nsa', label: 'NSA' },
    ],
    standardOptions: [
      { id: 'fips-140-3', label: 'FIPS 140-3' },
      { id: 'cnsa-2', label: 'CNSA 2.0' },
      { id: 'etsi-103744', label: 'ETSI TS 103 744' },
      { id: 'common-criteria', label: 'Common Criteria ISO/IEC 15408' },
    ],
    correctBodyType: 'certification-body',
    correctOrg: 'cmvp',
    correctStandard: 'fips-140-3',
    briefFeedback:
      'CMVP is the certification body. FIPS 140-3 is the standard being validated. NIST wrote FIPS 140-3 (standards body), but CMVP administers the validation program.',
    detailedExplanation:
      'FIPS 140-3 is the NIST standard that defines security requirements for cryptographic modules — it specifies what a module must do. The CMVP (jointly run by NIST and Canada\'s CSE) is the certification body that validates whether a specific product actually meets those requirements through NVLAP-accredited testing labs. Always verify CMVP status on the official NIST CMVP database (csrc.nist.gov/projects/cmvp) using the exact certificate number, as vendors sometimes claim "FIPS compliance" without having an actual CMVP certificate. For US federal procurement under FISMA, you need a current CMVP certificate, not just a vendor claim.',
  },
  {
    id: 'france-bank',
    situation:
      "Your multinational bank's French subsidiary must deploy PQC for customer authentication. A colleague says you need ANSSI approval for your cryptographic choices. You need to understand what ANSSI requires and what type of organization it is.",
    question: 'What type of body is ANSSI, and what is its primary requirement for PQC?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body (creates technical standards)' },
      { id: 'certification-body', label: 'Certification Body (certifies products)' },
      { id: 'regulatory-agency', label: 'Regulatory Agency (issues government mandates)' },
      { id: 'compliance-framework', label: 'Compliance Framework (a set of rules)' },
    ],
    orgOptions: [
      { id: 'anssi', label: 'ANSSI (France)' },
      { id: 'etsi', label: 'ETSI (EU)' },
      { id: 'enisa', label: 'ENISA (EU)' },
      { id: 'bsi', label: 'BSI (Germany)' },
    ],
    standardOptions: [
      { id: 'hybrid-pqc', label: 'Hybrid PQC (classical + PQC required for sensitive systems)' },
      { id: 'fips-203', label: 'FIPS 203 standalone (ML-KEM only)' },
      { id: 'etsi-ts', label: 'ETSI TS 103 744 (mandatory)' },
      { id: 'iso-27001', label: 'ISO 27001 (information security management)' },
    ],
    correctBodyType: 'regulatory-agency',
    correctOrg: 'anssi',
    correctStandard: 'hybrid-pqc',
    briefFeedback:
      'ANSSI is a governmental regulatory agency. Its key PQC requirement is hybrid cryptography — for sensitive systems, classical and PQC algorithms must be used together (not PQC standalone).',
    detailedExplanation:
      "ANSSI (Agence nationale de la sécurité des systèmes d'information) is France's national cybersecurity authority — a governmental regulatory agency whose guidance is binding for regulated French entities. Unlike ISO or IETF, ANSSI has government authority. ANSSI's distinctive PQC position (2022/2023 papers) requires hybrid cryptography for sensitive systems: you must combine a classical algorithm (e.g., ECDH) with a PQC algorithm (e.g., ML-KEM-768) in parallel, not replace classical cryptography outright. This is more conservative than NIST's approach. The rationale: if a PQC algorithm is broken, the classical component still provides protection. ANSSI does permit standalone SLH-DSA (hash-based signatures) because its security relies solely on hash function assumptions, which differ from lattice assumptions underlying ML-DSA.",
  },
  {
    id: 'eu-cc',
    situation:
      'Your software company wants to sell a secure communication product to an EU government ministry. The procurement specification requires a Common Criteria certification. You need to understand which EU body manages this certification and under which scheme.',
    question:
      'Which EU agency manages the EUCC (the EU version of Common Criteria), and under which framework?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body' },
      { id: 'certification-body', label: 'Certification Body' },
      { id: 'regulatory-agency', label: 'Regulatory Agency' },
      { id: 'compliance-framework', label: 'Compliance Framework' },
    ],
    orgOptions: [
      { id: 'etsi', label: 'ETSI' },
      { id: 'enisa', label: 'ENISA' },
      { id: 'bsi', label: 'BSI (Germany only)' },
      { id: 'common-criteria', label: 'CCRA (international scheme)' },
    ],
    standardOptions: [
      { id: 'eucc', label: 'EUCC (EU Cybersecurity Certification Scheme)' },
      { id: 'nist-fips', label: 'NIST FIPS 140-3' },
      { id: 'etsi-ts', label: 'ETSI TS 103 744 certification' },
      { id: 'iso-15408', label: 'ISO/IEC 15408 (global CC, no EU-specific recognition)' },
    ],
    correctBodyType: 'certification-body',
    correctOrg: 'enisa',
    correctStandard: 'eucc',
    briefFeedback:
      'ENISA manages the EUCC (EU Cybersecurity Certification Scheme). The EUCC is the EU-specific adaptation of Common Criteria, valid across all EU member states.',
    detailedExplanation:
      "The EUCC (EU Cybersecurity Certification Scheme for CC-based evaluations) was established under the EU Cybersecurity Act (2019) and is managed by ENISA. It's an EU-wide adaptation of Common Criteria (ISO/IEC 15408) that creates a harmonized certification valid across all 27 EU member states, eliminating the previous need for separate national certifications in each country. ENISA maintains the scheme rules and the Agreed Cryptographic Mechanisms (ACM) list, which specifies which PQC algorithms are approved for products seeking EUCC certification. National Certification Authorities (e.g., BSI in Germany, ANSSI in France) can issue EUCC certificates, and these are mutually recognized across the EU. For your product, you'd work with an accredited lab (ITSEF) to evaluate it against a Protection Profile, then a National CA would issue the EUCC certificate.",
  },
  {
    id: 'tls-ietf',
    situation:
      "Your engineering team is adding PQC to your TLS 1.3 library for ML-KEM key exchange. They find references to both 'FIPS 203' (NIST) and 'X25519MLKEM768' (IETF draft). They ask: are these from the same organization? Which body do they follow for the TLS integration?",
    question:
      'Which body standardizes the hybrid X25519MLKEM768 key exchange for TLS 1.3, and what working group?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body' },
      { id: 'certification-body', label: 'Certification Body' },
      { id: 'regulatory-agency', label: 'Regulatory Agency' },
      { id: 'compliance-framework', label: 'Compliance Framework' },
    ],
    orgOptions: [
      { id: 'nist', label: 'NIST (same body as FIPS 203)' },
      { id: 'ietf', label: 'IETF (TLS Working Group)' },
      { id: 'etsi', label: 'ETSI TC CYBER' },
      { id: 'iso-iec', label: 'ISO/IEC JTC 1/SC 27' },
    ],
    standardOptions: [
      { id: 'fips-203', label: 'FIPS 203 (ML-KEM algorithm spec)' },
      { id: 'tls-hybrid', label: 'draft-ietf-tls-hybrid-design (X25519MLKEM768)' },
      { id: 'cnsa-2', label: 'CNSA 2.0 (NSA mandate)' },
      { id: 'etsi-ts', label: 'ETSI TS 103 744 (TLS profile)' },
    ],
    correctBodyType: 'standards-body',
    correctOrg: 'ietf',
    correctStandard: 'tls-hybrid',
    briefFeedback:
      'IETF TLS WG standardizes X25519MLKEM768. NIST defined the ML-KEM algorithm (FIPS 203); IETF defines how to use it in TLS. These are complementary, not competing.',
    detailedExplanation:
      'FIPS 203 and X25519MLKEM768 come from different but complementary organizations. NIST (a standards body) published FIPS 203 defining the ML-KEM algorithm — what the math is, what the security levels are, how encapsulation/decapsulation work. The IETF TLS Working Group (also a standards body, but protocol-focused) published the hybrid key exchange draft defining how to combine X25519 (classical ECDH) with ML-KEM-768 in a TLS 1.3 handshake — specifically the NamedGroup identifier, the key_exchange format, and the key derivation. The IETF consumes NIST algorithm standards and integrates them into protocol standards. For your TLS library: implement ML-KEM per FIPS 203, then implement the hybrid key exchange per the IETF draft. Chrome and Firefox already ship X25519MLKEM768 in production.',
  },
  {
    id: 'dod-cnsa',
    situation:
      "Your company won a DoD contract requiring PQC for data at rest. The contract references 'CNSA 2.0 compliance' with a 2030 deadline for exclusive PQC use. You need to identify who authored CNSA 2.0 and what underlying algorithm standard it mandates.",
    question:
      'Who authored CNSA 2.0, and which NIST standard defines the required ML-KEM algorithm?',
    bodyTypeOptions: [
      { id: 'standards-body', label: 'Standards Body (created the algorithm spec)' },
      { id: 'regulatory-agency', label: 'Regulatory Agency (issued the mandate)' },
      { id: 'certification-body', label: 'Certification Body (certifies compliance)' },
      { id: 'compliance-framework', label: 'Compliance Framework (a ruleset)' },
    ],
    orgOptions: [
      { id: 'nist', label: 'NIST — authors of both CNSA 2.0 and FIPS 203' },
      { id: 'nsa', label: 'NSA — author of CNSA 2.0 (references NIST FIPS 203)' },
      { id: 'cisa', label: 'CISA — issues DoD procurement guidance' },
      { id: 'dod', label: 'DoD directly (no intermediary)' },
    ],
    standardOptions: [
      { id: 'fips-203-mlkem', label: 'FIPS 203 (ML-KEM-1024 required by CNSA 2.0)' },
      { id: 'fips-204', label: 'FIPS 204 (ML-DSA — for signatures)' },
      { id: 'cnsa-1', label: 'CNSA 1.0 (the previous version, classical algorithms)' },
      { id: 'nist-sp-800', label: 'NIST SP 800-227 (KEM guidance document)' },
    ],
    correctBodyType: 'regulatory-agency',
    correctOrg: 'nsa',
    correctStandard: 'fips-203-mlkem',
    briefFeedback:
      'NSA authored CNSA 2.0 (regulatory agency). It mandates ML-KEM-1024 from FIPS 203 (NIST standard). CNSA 2.0 is a mandate that references NIST standards — two different bodies, complementary roles.',
    detailedExplanation:
      'CNSA 2.0 (Commercial National Security Algorithm Suite 2.0) was published by the NSA in September 2022. NSA is a governmental regulatory agency whose mandates are binding for US National Security Systems (NSS) — all government systems that process classified or sensitive national security information. CNSA 2.0 mandates specific parameter sets: ML-KEM-1024 (not 512 or 768) for key establishment, ML-DSA-87 for signatures, and XMSS or LMS (stateful hash-based) for software/firmware signing. Note: SLH-DSA is not part of CNSA 2.0 — the NSA chose stateful hash-based schemes (LMS/XMSS) instead. The underlying algorithm definitions come from NIST (a different standards body): FIPS 203 defines ML-KEM, FIPS 204 defines ML-DSA, FIPS 205 defines SLH-DSA. DoD contractors must implement CMVP-validated modules (CMVP is the certification body) that implement these NIST algorithms at the specific parameter levels CNSA 2.0 requires. This chain — NIST standard → CMVP certification → NSA/CNSA mandate — is the full compliance picture.',
  },
]
