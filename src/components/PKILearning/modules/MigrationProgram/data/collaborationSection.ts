// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const COLLABORATION_SECTION: SourcedSectionData = {
  id: 'working-together',
  title: 'Collaborating Across Teams, Vendors, and Organizations',
  lead: 'This section covers how organizations coordinate post-quantum migration across internal teams, external vendors, and peer organizations. It looks at governance roles, external partner engagement, and stakeholder communication.',
  nice: [{ id: 'S0430', statement: 'Skill in collaborating with others' }],
  blocks: [
    {
      heading: 'Internal Governance and Cross-Functional Roles',
      sentences: [
        {
          id: 'S0430-01',
          text: 'OMB Memorandum M-26-15 states that agencies must establish or update an internal governance structure to oversee PQC migration, requiring defined roles and accountability across leadership teams beyond the CIO and CISO.',
          sourceId: 'OMB-M-26-15',
          edition:
            'OMB Memorandum M-26-15 — Execution of the Migration to Post-Quantum Cryptography, 2026-06',
          locator: 'Section 3.C.1 Agency-Wide Governance and Roles, PDF p. 2',
        },
        {
          id: 'S0430-02',
          text: 'To create a quantum-readiness roadmap, the authoring agencies encourage organizations to establish a project management team to plan and scope PQC migration, lead inventory creation, and include cybersecurity and privacy risk managers.',
          sourceId: 'CISA-Quantum-Readiness-Roadmap',
          edition:
            'CISA/NSA/NIST Quantum-Readiness — Migration to Post-Quantum Cryptography, 2023-08',
          locator: 'Establish a Quantum-Readiness Roadmap, PDF pp. 1-2',
        },
        {
          id: 'S0430-04',
          text: 'The PQCC PQC Migration Roadmap states that organizations should appoint a migration lead positioned to cut across different areas and interface actively with leadership and technical roles.',
          sourceId: 'PQCC-Migration-Roadmap-2025',
          edition: 'Post-Quantum Cryptography Coalition (PQCC) PQC Migration Roadmap, 2025-05',
          locator: 'Activity 1.2: Assign a Lead to Manage PQC Migration, PDF p. 7',
        },
        {
          id: 'S0430-03',
          text: 'The EU NIS Cooperation Group roadmap says involving important stakeholders early is essential, with CTO, CISO, and CIO functions and research representatives to consider, and notes the importance of involving supervisory bodies and cooperating with regional and local authorities and critical infrastructure providers.',
          sourceId: 'EU-NIS-CG-Roadmap-v1.1',
          edition:
            'EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1, 2025-06',
          locator: 'Section 6.2 First Steps, PDF p. 11',
        },
      ],
    },
    {
      heading: 'Vendor, Cloud, and Cross-Organizational Coordination',
      bridge:
        'The next block covers coordination with technology vendors, cloud service providers, and peer organizations.',
      sentences: [
        {
          id: 'S0430-05',
          text: 'The Australian Signals Directorate guidance on post-quantum vendor questions notes that engaging vendors early helps organizations understand vendor maturity, identify misalignments, and ensure vendor roadmaps support organizational transition plans.',
          sourceId: 'Post-quantum-questions-to-ask-your-vendors-Cyber-gov-au',
          edition: 'Post-quantum questions to ask your vendors | Cyber.gov.au, 2026-07',
          locator: 'Early engagement on post-quantum readiness',
        },
        {
          id: 'S0430-06',
          text: 'The CISA/NSA/NIST Quantum-Readiness Roadmap encourages organizations to engage technology vendors and cloud service providers to learn their quantum-readiness roadmaps, including timelines for testing and integrating PQC into products.',
          sourceId: 'CISA-Quantum-Readiness-Roadmap',
          edition:
            'CISA/NSA/NIST Quantum-Readiness — Migration to Post-Quantum Cryptography, 2023-08',
          locator:
            'Discuss Post-Quantum Roadmaps with Technology Vendors and Supply Chain Quantum-Readiness, PDF pp. 2-3',
        },
        {
          id: 'S0430-07',
          text: 'Under OMB Memorandum M-26-15, agencies should engage FedRAMP-authorized cloud service providers to delineate PQC migration responsibilities, while CISA and the Department of War, with GSA, lead migration for those providers and multi-agency SaaS, PaaS, and IaaS solutions.',
          sourceId: 'OMB-M-26-15',
          edition:
            'OMB Memorandum M-26-15 — Execution of the Migration to Post-Quantum Cryptography, 2026-06',
          locator: 'Section 3.C.4 Vendor and Third-Party Software, PDF p. 4',
        },
        {
          id: 'S0430-08',
          text: 'The PQC Migration Handbook (2nd Edition) states that organizations should tackle PQC migration collaboratively by sharing technical and organizational lessons learned and coordinating across organizations to maintain interoperability.',
          sourceId: 'NL-PQC-Migration-Handbook-2024',
          edition: 'The PQC Migration Handbook (2nd Edition), 2024-12',
          locator:
            'Section 1.6 Collaborate with Peers and Section 2.1 Interoperability During PQC Migration, PDF pp. 17, 28',
        },
      ],
    },
    {
      heading: 'Ongoing Stakeholder Communication and Alignment',
      bridge: 'The final block covers ongoing stakeholder communication and alignment.',
      sentences: [
        {
          id: 'S0430-10',
          text: "The GSA Post-Quantum Cryptography Buyer's Guide recommends developing a communication plan that seeks stakeholder input on the transition plan and provides talking points and answers to common questions for leadership.",
          sourceId: 'GSA-PQC-Buyers-Guide-2025',
          edition: "GSA Post-Quantum Cryptography Buyer's Guide, 2025-06",
          locator:
            'Section 6.3 Develop Plan for Transition and Post-Transition Maintenance, PDF p. 9',
        },
        {
          id: 'S0430-11',
          text: 'In the draft Quantum-Safe Migration Handbook, continuous monitoring and reviews ensure implementation progresses according to plan and systems remain secure and compliant, while stakeholder communication keeps business and technical teams informed about migration progress, operational impact, and PQC adoption value.',
          sourceId: 'Singapore-CSA-Quantum-Safe-Handbook',
          edition: 'Quantum-Safe Migration Handbook (Draft for Public Consultation), 2025-10',
          locator: 'Domain 3 / Continuous monitoring, PDF p. 39',
        },
      ],
    },
  ],
}
