// SPDX-License-Identifier: GPL-3.0-only

export interface Workgroup {
  name: string
  shortName: string
  region: string
  regionFlag: string
  description: string
  url: string
  focusAreas: string[]
  founded: string
  keyMembers: string
}

export const WORKGROUP_REGIONS = [
  'United States',
  'European Union',
  'United Kingdom',
  'Germany',
  'France',
  'Japan',
  'South Korea',
  'Australia',
  'Canada',
  'Singapore',
] as const

export const PQC_WORKGROUPS: Workgroup[] = [
  // United States
  {
    name: 'Post-Quantum Cryptography Alliance (PQCA)',
    shortName: 'PQCA',
    region: 'United States',
    regionFlag: '\u{1F1FA}\u{1F1F8}',
    description:
      'Open, collaborative initiative under the Linux Foundation driving advancement and adoption of PQC through high-assurance open-source software implementations of standardized algorithms.',
    url: 'https://pqca.org',
    focusAreas: ['Open Source', 'Algorithm Implementation', 'Standards Harmonization'],
    founded: '2024',
    keyMembers: 'AWS, Cisco, Google, IBM, NVIDIA, SandboxAQ, University of Waterloo',
  },
  {
    name: 'Post-Quantum Cryptography Coalition (PQCC)',
    shortName: 'PQCC',
    region: 'United States',
    regionFlag: '\u{1F1FA}\u{1F1F8}',
    description:
      'Volunteer, fee-free community of technologists, researchers, and practitioners driving broader understanding and public adoption of NIST PQC algorithms, including published migration roadmaps.',
    url: 'https://pqcc.org',
    focusAreas: ['Migration Roadmaps', 'Cryptographic Inventory', 'Public Adoption'],
    founded: '2023',
    keyMembers: 'IBM Quantum, Microsoft, MITRE, PQShield, SandboxAQ, University of Waterloo',
  },

  // European Union
  {
    name: 'ETSI TC CYBER Quantum Safe Cryptography Working Group',
    shortName: 'ETSI QSC WG',
    region: 'European Union',
    regionFlag: '\u{1F1EA}\u{1F1FA}',
    description:
      'ETSI working group assessing and recommending quantum-safe cryptographic primitives, protocols, and implementation considerations for EU telecommunications and industry.',
    url: 'https://www.etsi.org/technologies/quantum-safe-cryptography',
    focusAreas: ['Hybrid Cryptography', 'Migration Frameworks', 'QKD Standards'],
    founded: '2013',
    keyMembers: '30+ industry/government/academic participants, chaired by Matt Campagna (Amazon)',
  },
  {
    name: 'ENISA Cryptography Expert Group',
    shortName: 'ENISA Crypto',
    region: 'European Union',
    regionFlag: '\u{1F1EA}\u{1F1FA}',
    description:
      'EU Agency for Cybersecurity expert group promoting good cryptographic practices, coordinating PQC guidance across the European Commission, Member States, and EU bodies.',
    url: 'https://www.enisa.europa.eu/topics/cryptography',
    focusAreas: ['EU-wide Readiness', 'Policy Recommendations', 'EUCC Integration'],
    founded: '2021',
    keyMembers: 'European Commission, ECCG, Germany (BSI), France (ANSSI), Netherlands (NCSC-NL)',
  },

  // United Kingdom
  {
    name: 'NCSC Post-Quantum Cryptography Migration Program',
    shortName: 'NCSC PQC',
    region: 'United Kingdom',
    regionFlag: '\u{1F1EC}\u{1F1E7}',
    description:
      'UK National Cyber Security Centre program providing authoritative PQC migration guidance with a three-phase timeline: Discover by 2028, Prioritize & Pilot 2028\u201331, Complete by 2035.',
    url: 'https://www.ncsc.gov.uk/guidance/pqc-migration-timelines',
    focusAreas: ['Migration Timelines', 'Algorithm Recommendations', 'Industry Pilots'],
    founded: '2023',
    keyMembers: 'NCSC, Five Eyes partners, Arqit (pilot participant)',
  },
  {
    name: 'PKI Consortium PQC Working Group',
    shortName: 'PKI Consortium',
    region: 'United Kingdom',
    regionFlag: '\u{1F1EC}\u{1F1E7}',
    description:
      'Open platform for PKI practitioners, researchers, and algorithm experts discussing PQC implications, migration strategies, and ecosystem readiness through the PQC Capabilities Matrix and Maturity Model.',
    url: 'https://pkic.org/wg/pqc/',
    focusAreas: ['PQC Capabilities Matrix', 'Maturity Model', 'Best Practices'],
    founded: '2023',
    keyMembers: 'Global membership including Qrypt, Keyfactor, Entrust, DigiCert',
  },

  // Germany
  {
    name: 'BSI Quantum Technologies & Post-Quantum Cryptography',
    shortName: 'BSI PQC',
    region: 'Germany',
    regionFlag: '\u{1F1E9}\u{1F1EA}',
    description:
      'Germany\u2019s Federal Office for Information Security (BSI) publishes algorithm recommendations and leads the joint EU statement advocating mandatory PQC migration across 20 European partner states.',
    url: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Quantentechnologien-und-Post-Quanten-Kryptografie/quantentechnologien-und-post-quanten-kryptografie_node.html',
    focusAreas: ['Algorithm Recommendations', 'Hybrid PQC', 'EU Joint Statements'],
    founded: '2024',
    keyMembers: 'BSI, co-signed by France (ANSSI) and Netherlands + 17 EU member states',
  },
  {
    name: 'EU NIS Cooperation Group PQC Workstream',
    shortName: 'NIS PQC',
    region: 'Germany',
    regionFlag: '\u{1F1E9}\u{1F1EA}',
    description:
      'Cross-border EU workstream coordinating PQC pilot projects and migration roadmaps across Network and Information Systems member states, with Germany as a leading driver.',
    url: 'https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography',
    focusAreas: ['Cross-border Interoperability', 'National Roadmaps', 'Critical Sector Pilots'],
    founded: '2024',
    keyMembers: 'Germany (BSI), France (ANSSI), Netherlands (NCSC-NL), all 27 EU member states',
  },

  // France
  {
    name: 'RESQUE Consortium (R\u00C9Silience QUantiquE)',
    shortName: 'RESQUE',
    region: 'France',
    regionFlag: '\u{1F1EB}\u{1F1F7}',
    description:
      'French government-backed consortium developing post-quantum cryptography solutions to protect communications, infrastructure, and networks of businesses and local governments over a three-year program.',
    url: 'https://www.thalesgroup.com/en/worldwide/security/press_release/post-quantum-cryptography-six-french-cyber-players-join-forces',
    focusAreas: ['Secure Communications', 'VPN Protection', 'ANSSI Compliance'],
    founded: '2024',
    keyMembers:
      'Thales (coordinator), TheGreenBow, CryptoExperts, CryptoNext Security, ANSSI, Inria',
  },
  {
    name: 'ANSSI PQC Transition Program',
    shortName: 'ANSSI PQC',
    region: 'France',
    regionFlag: '\u{1F1EB}\u{1F1F7}',
    description:
      'France\u2019s national cybersecurity agency defining official PQC policy, recommending algorithms (ML-KEM, FrodoKEM), and issuing security visas for hybrid PQC products.',
    url: 'https://cyber.gouv.fr',
    focusAreas: ['Algorithm Recommendations', 'Security Visas', 'EU Joint Leadership'],
    founded: '2022',
    keyMembers: 'ANSSI, BSI (joint recommendations), Inria, RESQUE consortium',
  },

  // Japan
  {
    name: 'CRYPTREC (Cryptography Research and Evaluation Committees)',
    shortName: 'CRYPTREC',
    region: 'Japan',
    regionFlag: '\u{1F1EF}\u{1F1F5}',
    description:
      'Japan\u2019s official cryptographic evaluation body publishing transition guidelines, endorsing NIST PQC selections, and planning government system migration by 2035.',
    url: 'https://www.cryptrec.go.jp/en/',
    focusAreas: ['Algorithm Evaluation', 'Government Migration', 'Transition Guidelines'],
    founded: '2000',
    keyMembers: 'METI, MIC, NICT, National Cyber Security Bureau (NCSB)',
  },
  {
    name: 'NEDO Cyber Research Consortium PQC Program',
    shortName: 'NEDO CRC',
    region: 'Japan',
    regionFlag: '\u{1F1EF}\u{1F1F5}',
    description:
      'Japan\u2019s premier R&D funding body implementing post-quantum cryptography across the national technology supply chain through industry-academic consortium research.',
    url: 'https://www.nedo.go.jp/',
    focusAreas: ['Supply Chain PQC', 'Hardware IP', 'Quantum-safe Transport'],
    founded: '2024',
    keyMembers: 'PQShield, NTT Corporation, NTT Communications',
  },

  // South Korea
  {
    name: 'KpqC (Korean Post-Quantum Cryptography) Competition',
    shortName: 'KpqC',
    region: 'South Korea',
    regionFlag: '\u{1F1F0}\u{1F1F7}',
    description:
      'Multi-year national competition selecting homegrown PQC algorithms (NTRU+, SMAUG-T, HAETAE, AIMer) for Korean government standards, complementing NIST selections.',
    url: 'https://kpqc.cryptolab.co.kr/',
    focusAreas: ['Algorithm Selection', 'National Standards', 'Domestic Capability'],
    founded: '2021',
    keyMembers: 'NSR, NIS, Ministry of Science & ICT, Samsung SDS, CryptoLab, KAIST',
  },
  {
    name: 'KISA PQC Initiative',
    shortName: 'KISA',
    region: 'South Korea',
    regionFlag: '\u{1F1F0}\u{1F1F7}',
    description:
      'Korea Internet & Security Agency coordinating national PQC standardization, working with NIS on KpqC competition outcomes, and guiding industry migration to quantum-safe algorithms.',
    url: 'https://www.kisa.or.kr/eng/',
    focusAreas: ['National Standards', 'Industry Certification', 'Migration Guidance'],
    founded: '2021',
    keyMembers: 'NIS, NSR, Ministry of Science & ICT, KAIST',
  },

  // Australia
  {
    name: 'ASD/ACSC PQC Migration Program',
    shortName: 'ASD ACSC',
    region: 'Australia',
    regionFlag: '\u{1F1E6}\u{1F1FA}',
    description:
      'Australian Signals Directorate\u2019s Cyber Security Centre providing authoritative PQC transition guidance via the LATICE framework (Locate, Assess, Triage, Implement, Communicate, Educate).',
    url: 'https://www.cyber.gov.au/resources-business-and-government/governance-and-user-education/governance/planning-post-quantum-cryptography',
    focusAreas: ['LATICE Framework', 'Phased Transition', 'Five Eyes Alignment'],
    founded: '2022',
    keyMembers: 'ASD, Department of Home Affairs, Five Eyes partners',
  },
  {
    name: 'OCSC/Monash PQCiP (Post-Quantum Crypto in the Indo-Pacific)',
    shortName: 'PQCiP',
    region: 'Australia',
    regionFlag: '\u{1F1E6}\u{1F1FA}',
    description:
      'US-funded capacity-building program delivering PQC education and deployment training across 11 Indo-Pacific nations, run by Monash University and the Oceania Cyber Security Centre.',
    url: 'https://ocsc.com.au/pqcip/',
    focusAreas: ['Regional Capacity Building', 'NIST PQC Training', 'Government Readiness'],
    founded: '2023',
    keyMembers: 'Monash University, OCSC, US Department of State, 11 partner countries',
  },

  // Canada
  {
    name: 'Quantum Industry Canada (QIC)',
    shortName: 'QIC',
    region: 'Canada',
    regionFlag: '\u{1F1E8}\u{1F1E6}',
    description:
      'Business-led consortium uniting Canadian quantum technology companies to accelerate innovation and build a resilient quantum economy spanning computing, sensing, communications, and quantum-safe cryptography.',
    url: 'https://www.quantumindustrycanada.ca/',
    focusAreas: [
      'Industry Commercialization',
      'National Quantum Strategy',
      'Year of Quantum Security',
    ],
    founded: '2020',
    keyMembers: 'D-Wave, Xanadu, evolutionQ, BTQ Technologies, 20+ quantum companies',
  },
  {
    name: 'CCCS PQC Migration Roadmap (ITSM.40.001)',
    shortName: 'CCCS',
    region: 'Canada',
    regionFlag: '\u{1F1E8}\u{1F1E6}',
    description:
      'Canadian Centre for Cyber Security\u2019s official plan to transition all federal non-classified IT systems to PQC by 2035, mandating alignment with NIST standards.',
    url: 'https://www.cyber.gc.ca/en/guidance/roadmap-migration-post-quantum-cryptography-government-canada-itsm40001',
    focusAreas: ['Federal Mandate', 'NIST Alignment', 'Interagency Coordination'],
    founded: '2025',
    keyMembers: 'Shared Services Canada, Treasury Board, all federal departments',
  },

  // Singapore
  {
    name: 'CSA Quantum-Safe Migration Program',
    shortName: 'CSA QS',
    region: 'Singapore',
    regionFlag: '\u{1F1F8}\u{1F1EC}',
    description:
      'Cyber Security Agency of Singapore\u2019s program helping organizations build quantum-safe readiness through the Quantum Readiness Index (QRI), migration handbook, and CII owner guidance.',
    url: 'https://www.csa.gov.sg/Tips-Resource/publications/2024/quantum-safe-transition',
    focusAreas: ['Quantum Readiness Index', 'CII Migration', 'Risk-based Prioritization'],
    founded: '2024',
    keyMembers: 'CSA, GovTech, IMDA, technology companies',
  },
  {
    name: 'IMDA Quantum-Safe Network Initiative',
    shortName: 'IMDA QSN',
    region: 'Singapore',
    regionFlag: '\u{1F1F8}\u{1F1EC}',
    description:
      'Infocomm Media Development Authority partnering with telcos and technology vendors to test and deploy QKD and PQC hybrid solutions across Singapore\u2019s national network infrastructure.',
    url: 'https://www.imda.gov.sg/about-imda/emerging-technologies-and-research/quantum-safe-technologies',
    focusAreas: ['Network Trials', 'QKD/PQC Hybrid', 'Telco Partnerships'],
    founded: '2022',
    keyMembers: 'Singtel, StarHub, M1, government agencies',
  },
]
