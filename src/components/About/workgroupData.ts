// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Each description starts with what kind of body it is (industry initiative, standards-body
 * working group, government agency, guidance document, project, competition), because a
 * guidance document or a joint statement is not a standing group. Facts were read from the
 * organization's own pages on 5 November 2026; an entry says "not verified here" where the
 * page could not be read or did not state the fact. `founded` holds a year only when the
 * source states it, otherwise "date not verified" or "n/a" with the dated publication.
 * Individual names and member lists are not recorded unless the source lists them, because
 * membership changes.
 */
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
      'Industry open-source initiative hosted by the Linux Foundation. Its stated aim is producing high-assurance software implementations of standardized algorithms and supporting the development and standardization of new post-quantum algorithms with software for evaluation and prototyping. Projects listed on its site: CBOMkit, Longfellow, Open Quantum Safe and PQ Code Package.',
    url: 'https://pqca.org',
    focusAreas: ['Open Source', 'Algorithm Implementation', 'Evaluation and Prototyping'],
    founded: 'date not verified',
    keyMembers: 'Premier, General and Associate members; see the member list on pqca.org',
  },
  {
    name: 'Post-Quantum Cryptography Coalition (PQCC)',
    shortName: 'PQCC',
    region: 'United States',
    regionFlag: '\u{1F1FA}\u{1F1F8}',
    description:
      'Coalition. Not verified here (its site could not be read when checked); see pqcc.org for its own description, founding date and members.',
    url: 'https://pqcc.org',
    focusAreas: ['Post-Quantum Cryptography'],
    founded: 'date not verified',
    keyMembers: 'not verified here; see pqcc.org',
  },
  {
    name: 'PKI Consortium PQC Working Group',
    shortName: 'PKI Consortium',
    region: 'United States',
    regionFlag: '\u{1F1FA}\u{1F1F8}',
    description:
      'Industry consortium working group. The PKI Consortium, a 501(c)(6) non-profit registered in Utah, runs a Post-Quantum Cryptography Working Group that publishes a PQC Capabilities Matrix and a PQC Maturity Model with levels 0 (None) to 5 (Optimized).',
    url: 'https://pkic.org/wg/pqc/',
    focusAreas: ['PQC Capabilities Matrix', 'Maturity Model', 'Playbooks'],
    founded: 'consortium 2013 (as the CA Security Council); working-group date not verified',
    keyMembers: 'PKI Consortium member organizations; see its members page',
  },

  // European Union
  {
    name: 'ETSI Quantum-Safe Cryptography work',
    shortName: 'ETSI QSC',
    region: 'European Union',
    regionFlag: '\u{1F1EA}\u{1F1FA}',
    description:
      'Standards-body work area. ETSI states that it develops practical guidance for deployments of quantum-safe cryptography. The responsible working group, its chair and its participants change and were not verified here; see ETSI.',
    url: 'https://www.etsi.org/technologies/quantum-safe-cryptography',
    focusAreas: ['Quantum-Safe Cryptography', 'Deployment Guidance'],
    founded: 'date not verified',
    keyMembers: 'ETSI members; participants change, see ETSI',
  },
  {
    name: 'ENISA cryptography work',
    shortName: 'ENISA Crypto',
    region: 'European Union',
    regionFlag: '\u{1F1EA}\u{1F1FA}',
    description:
      'EU agency topic area, not a standing group. ENISA states that, in cooperation with the European Commission, Member States and other EU bodies, it engages with expert groups to promote good practices in cryptography, mainly for the advent of post-quantum cryptography, and that it has delivered reports on the state of the art and on mitigation techniques.',
    url: 'https://www.enisa.europa.eu/topics/cryptography',
    focusAreas: ['Post-Quantum Cryptography', 'Good Practices', 'Reports'],
    founded: 'n/a (agency topic area; no start date stated)',
    keyMembers:
      'ENISA with the European Commission, Member States and other EU bodies (as named on ENISA’s page)',
  },
  {
    name: 'EU NIS Cooperation Group PQC Workstream',
    shortName: 'NIS PQC',
    region: 'European Union',
    regionFlag: '\u{1F1EA}\u{1F1FA}',
    description:
      'Cooperation-group work stream. The European Commission’s Recommendation of 11 April 2024 proposed a work stream on post-quantum cryptography with the NIS Cooperation Group. EU Member States, supported by the Commission, published a Coordinated Implementation Roadmap for the transition on 23 June 2025.',
    url: 'https://digital-strategy.ec.europa.eu/en/library/coordinated-implementation-roadmap-transition-post-quantum-cryptography',
    focusAreas: ['Coordinated Roadmap', 'Member State Recommendations', 'Stakeholder Information'],
    founded: 'n/a (Recommendation 11 April 2024; roadmap 23 June 2025)',
    keyMembers: 'EU Member States, supported by the European Commission',
  },

  // United Kingdom
  {
    name: 'NCSC PQC migration timelines',
    shortName: 'NCSC PQC',
    region: 'United Kingdom',
    regionFlag: '\u{1F1EC}\u{1F1E7}',
    description:
      'Government guidance document, not a standing group. The UK National Cyber Security Centre guidance dated 20 March 2025 sets milestones: by 2028 define migration goals, complete a full discovery exercise and build an initial plan; by 2031 carry out the highest-priority migration activities; by 2035 complete migration. It follows an NCSC white paper of November 2023.',
    url: 'https://www.ncsc.gov.uk/guidance/pqc-migration-timelines',
    focusAreas: ['Migration Timelines', 'Discovery and Assessment', 'Prioritised Migration'],
    founded: 'n/a (guidance dated 20 March 2025)',
    keyMembers: 'Issued by the UK National Cyber Security Centre; no member organizations',
  },

  // Germany
  {
    name: 'BSI Quantum Technologies & Post-Quantum Cryptography',
    shortName: 'BSI PQC',
    region: 'Germany',
    regionFlag: '\u{1F1E9}\u{1F1EA}',
    description:
      'Government agency topic area. Germany’s Federal Office for Information Security (BSI) publishes algorithm recommendations in technical guideline TR-02102-1. Together with partners from 17 other European states, BSI published a joint statement in November 2024 urging industry, critical infrastructure providers and public administration to start the transition to post-quantum cryptography; partners from three more European states have since signed.',
    url: 'https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Quantentechnologien-und-Post-Quanten-Kryptografie/quantentechnologien-und-post-quanten-kryptografie_node.html',
    focusAreas: ['Algorithm Recommendations', 'Joint Statements'],
    founded: 'n/a (joint statement November 2024)',
    keyMembers:
      'BSI and partners from 17 other European states (November 2024), plus three more that signed later',
  },

  // France
  {
    name: 'RESQUE Consortium (RÉSilience QUantiquE)',
    shortName: 'RESQUE',
    region: 'France',
    regionFlag: '\u{1F1EB}\u{1F1F7}',
    description:
      'Industry consortium. Not verified here (the linked press release could not be read when checked); see the linked page for its description, start date and partners.',
    url: 'https://www.thalesgroup.com/en/worldwide/security/press_release/post-quantum-cryptography-six-french-cyber-players-join-forces',
    focusAreas: ['Post-Quantum Cryptography'],
    founded: 'date not verified',
    keyMembers: 'not verified here; see the linked press release',
  },
  {
    name: 'ANSSI PQC Transition Program',
    shortName: 'ANSSI PQC',
    region: 'France',
    regionFlag: '\u{1F1EB}\u{1F1F7}',
    description:
      'Government agency. ANSSI is France’s national cybersecurity agency. Its post-quantum recommendations and any related certification schemes were not verified here (the site could not be read when checked); see cyber.gouv.fr.',
    url: 'https://cyber.gouv.fr',
    focusAreas: ['Post-Quantum Cryptography'],
    founded: 'date not verified',
    keyMembers: 'ANSSI',
  },

  // Japan
  {
    name: 'CRYPTREC (Cryptography Research and Evaluation Committees)',
    shortName: 'CRYPTREC',
    region: 'Japan',
    regionFlag: '\u{1F1EF}\u{1F1F5}',
    description:
      'Government evaluation project. CRYPTREC began in fiscal year 2000 to evaluate and monitor the security of e-Government recommended ciphers; MIC and METI published the e-Government Recommended Ciphers List on 20 February 2003. It is run by an Advisory Board for Cryptographic Technology with an evaluation committee and a promotion committee. Its post-quantum activities were not verified here.',
    url: 'https://www.cryptrec.go.jp/en/',
    focusAreas: ['Algorithm Evaluation', 'Recommended Ciphers List', 'Cryptographic Modules'],
    founded: '2000',
    keyMembers:
      'Digital Agency, MIC and METI (Advisory Board); NICT and IPA (evaluation and promotion committees)',
  },
  {
    name: 'NEDO Cyber Research Consortium PQC Program',
    shortName: 'NEDO CRC',
    region: 'Japan',
    regionFlag: '\u{1F1EF}\u{1F1F5}',
    description:
      'Government research-funding program. Not verified here (the site could not be read when checked); see nedo.go.jp for the program, its start date and participants.',
    url: 'https://www.nedo.go.jp/',
    focusAreas: ['Post-Quantum Cryptography R&D'],
    founded: 'date not verified',
    keyMembers: 'not verified here; see nedo.go.jp',
  },

  // South Korea
  {
    name: 'KpqC (Korean Post-Quantum Cryptography) Competition',
    shortName: 'KpqC',
    region: 'South Korea',
    regionFlag: '\u{1F1F0}\u{1F1F7}',
    description:
      'Competition. The KpqC team ran Round 1 from November 2022 to November 2023 and Round 2 from April 2024 to November 2024, and announced the final algorithms on 16 January 2025: the signature schemes AIMer and HAETAE and the public-key encryption/KEM schemes NTRU+ and SMAUG-T.',
    url: 'https://kpqc.or.kr/competition_02.html',
    focusAreas: ['Algorithm Selection', 'Digital Signatures', 'PKE/KEM'],
    founded: 'n/a (Round 1 began November 2022)',
    keyMembers: 'KpqC team; organizers and supporters are named on the competition site',
  },
  {
    name: 'KISA PQC Initiative',
    shortName: 'KISA',
    region: 'South Korea',
    regionFlag: '\u{1F1F0}\u{1F1F7}',
    description:
      'Government agency. The Korea Internet & Security Agency’s role in post-quantum standardization was not verified here (its English site did not state it); see kisa.or.kr.',
    url: 'https://www.kisa.or.kr/eng/',
    focusAreas: ['Post-Quantum Cryptography'],
    founded: 'date not verified',
    keyMembers: 'not verified here; see kisa.or.kr',
  },

  // Australia
  {
    name: 'ASD/ACSC post-quantum planning guidance',
    shortName: 'ASD ACSC',
    region: 'Australia',
    regionFlag: '\u{1F1E6}\u{1F1FA}',
    description:
      'Government agency guidance. The Australian Signals Directorate’s Australian Cyber Security Centre publishes planning guidance for post-quantum cryptography at the linked page. The page could not be read when checked, so its framework, steps and dates were not verified here.',
    url: 'https://www.cyber.gov.au/resources-business-and-government/governance-and-user-education/governance/planning-post-quantum-cryptography',
    focusAreas: ['Post-Quantum Planning'],
    founded: 'date not verified',
    keyMembers: 'Australian Signals Directorate (Australian Cyber Security Centre)',
  },
  {
    name: 'OCSC PQCiP (Post-Quantum Crypto in the Indo-Pacific)',
    shortName: 'PQCiP',
    region: 'Australia',
    regionFlag: '\u{1F1E6}\u{1F1FA}',
    description:
      'Capacity-building program. Not verified here (its page could not be read when checked); see ocsc.com.au/pqcip for the program, its funders, partner countries and dates.',
    url: 'https://ocsc.com.au/pqcip/',
    focusAreas: ['Post-Quantum Cryptography Training'],
    founded: 'date not verified',
    keyMembers: 'not verified here; see ocsc.com.au/pqcip',
  },

  // Canada
  {
    name: 'Quantum Industry Canada (QIC)',
    shortName: 'QIC',
    region: 'Canada',
    regionFlag: '\u{1F1E8}\u{1F1E6}',
    description:
      'Industry consortium. QIC describes itself as the country’s business-led consortium for quantum technologies, covering computing, secure communications, sensing and post-quantum cryptography. It works to support industry growth, build commercial pathways and champion Canadian innovation.',
    url: 'https://www.quantumindustrycanada.ca/',
    focusAreas: ['Industry Growth', 'Commercial Pathways', 'Advocacy'],
    founded: 'date not verified',
    keyMembers: 'QIC members and affiliates; see the list on its site',
  },
  {
    name: 'CCCS PQC Migration Roadmap (ITSM.40.001)',
    shortName: 'CCCS',
    region: 'Canada',
    regionFlag: '\u{1F1E8}\u{1F1E6}',
    description:
      'Government guidance document, not a standing group. The Canadian Centre for Cyber Security’s recommended roadmap for Government of Canada departments to migrate non-classified IT systems to post-quantum cryptography (first release 23 June 2025): an initial departmental plan from April 2026, high-priority systems by the end of 2031 and remaining systems by the end of 2035.',
    url: 'https://www.cyber.gc.ca/en/guidance/roadmap-migration-post-quantum-cryptography-government-canada-itsm40001',
    focusAreas: ['Government Roadmap', 'Milestones', 'Departmental Planning'],
    founded: 'n/a (first release 23 June 2025)',
    keyMembers:
      'Cyber Centre, working with the Treasury Board of Canada Secretariat and Shared Services Canada; Government of Canada departments carry out the plan',
  },

  // Singapore
  {
    name: 'CSA Quantum-Safe Migration Program',
    shortName: 'CSA QS',
    region: 'Singapore',
    regionFlag: '\u{1F1F8}\u{1F1EC}',
    description:
      'Government agency program. Not verified here: the linked Cyber Security Agency of Singapore page was not available when checked on 5 November 2026. See csa.gov.sg for current quantum-safe guidance.',
    url: 'https://www.csa.gov.sg/Tips-Resource/publications/2024/quantum-safe-transition',
    focusAreas: ['Quantum-Safe Readiness'],
    founded: 'date not verified',
    keyMembers: 'Cyber Security Agency of Singapore',
  },
  {
    name: 'IMDA Quantum-Safe Network Initiative',
    shortName: 'IMDA QSN',
    region: 'Singapore',
    regionFlag: '\u{1F1F8}\u{1F1EC}',
    description:
      'Government agency program. The Infocomm Media Development Authority’s quantum-safe technologies page describes the National Quantum Safe Network Plus (NQSN+), announced at ATxSG 2023, which aims to deliver islandwide quantum-safe communications, alongside work on standardisation of quantum security technologies.',
    url: 'https://www.imda.gov.sg/about-imda/emerging-technologies-and-research/quantum-safe-technologies',
    focusAreas: ['National Quantum Safe Network Plus', 'Standardisation'],
    founded: 'n/a (NQSN+ announced 2023)',
    keyMembers: 'Infocomm Media Development Authority; participants not verified here',
  },
]
