// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const CYBER_RESILIENCY_SECTION: SourcedSectionData = {
  id: 'cyber-resiliency-goals',
  title: 'Cyber Resiliency Goals and Objectives',
  lead: 'This section explores cyber resiliency goals and objectives. Understanding these concepts helps risk, resilience, and security staff approach resiliency planning for critical assets.',
  nice: [{ id: 'K1277', statement: 'Knowledge of cyber resiliency goals and objectives' }],
  blocks: [
    {
      heading: 'Defining Cyber Resiliency Goals',
      sentences: [
        {
          id: 'K1277-01',
          text: 'NIST SP 800-193 defines cyber resiliency as the ability to anticipate, withstand, recover from, and adapt to adverse conditions, stresses, attacks, or compromises on systems that include cyber resources.',
          sourceId: 'NIST-SP-800-193',
          edition: 'NIST SP 800-193 — Platform Firmware Resiliency Guidelines, 2018-05',
          locator: 'Section 1 Introduction, PDF p. 9',
        },
        {
          id: 'K1277-02',
          text: 'According to NIST SP 800-34 Rev. 1, a resilient organization aims to continue mission essential functions during any disruption and continually adapts to changes and risks affecting critical functions.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Section 2.1 Contingency Planning and Resilience, PDF p. 19',
        },
        {
          id: 'K1277-04',
          text: 'Under Technology Infrastructure Resilience in NIST CSF 2.0, organizations manage security architectures to protect asset confidentiality, integrity, availability, and organizational resilience, and implement mechanisms to achieve resilience requirements in normal and adverse situations.',
          sourceId: 'NIST-CSF-2.0',
          edition: 'NIST Cybersecurity Framework (CSF) 2.0, 2024-02',
          locator:
            'Appendix A, Technology Infrastructure Resilience (PR.IR) and PR.IR-03, PDF pp. 25-26',
        },
      ],
    },
    {
      heading: 'Setting Recovery Objectives and Testing Plans',
      bridge: 'The next part turns to setting recovery objectives and testing plans.',
      sentences: [
        {
          id: 'K1277-08',
          text: 'The NIS2 Directive requires cybersecurity risk-management measures to follow an all-hazards approach and include business continuity, backup management, disaster recovery, crisis management, and supply chain security between an entity and its direct suppliers or service providers.',
          sourceId: 'NIS2-DIRECTIVE-2022-2555',
          edition: 'Network and Information Security Directive 2 (NIS2), 2022-12',
          locator: 'Paragraphs 2(c) and 2(d), PDF p. 48',
        },
        {
          id: 'K1277-05',
          text: 'Under the Digital Operational Resilience Act (DORA), financial entities determining recovery time and recovery point objectives for each function must consider whether it is critical or important and the potential impact on market efficiency, ensuring agreed service levels are met in extreme scenarios.',
          sourceId: 'DORA-REG-2022-2554',
          edition: 'Digital Operational Resilience Act (DORA) — Regulation EU 2022/2554, 2022-12',
          locator: 'Chapter II, Article 12(6)',
        },
        {
          id: 'K1277-06',
          text: 'Regulation (EU) 2022/2554 (DORA) requires financial entities to test their ICT business continuity, response, and recovery plans for systems supporting all functions at least yearly and upon substantive changes to systems supporting critical or important functions.',
          sourceId: 'DORA-REG-2022-2554',
          edition: 'Digital Operational Resilience Act (DORA) — Regulation EU 2022/2554, 2022-12',
          locator: 'Chapter II, Article 11(6)(a)',
        },
      ],
    },
    {
      heading: 'Planning Resiliency for Cryptographic Transitions',
      bridge: 'The next part turns to resiliency planning for cryptographic transitions.',
      sentences: [
        {
          id: 'K1277-10',
          text: 'The CISA, NSA, and NIST Quantum-Readiness Roadmap states that early planning is necessary against harvest now, decrypt later threats to long-lived data, and recommends feeding a quantum-vulnerable inventory into risk assessments to prioritize PQC adoption.',
          sourceId: 'CISA-Quantum-Readiness-Roadmap',
          edition:
            'CISA/NSA/NIST Quantum-Readiness — Migration to Post-Quantum Cryptography, 2023-08',
          locator: 'Why Prepare Now? and Prepare a Cryptographic Inventory, PDF pp. 1-2',
        },
        {
          id: 'K1277-09',
          text: 'ETSI guidance states that systems requiring cryptographic protection must be crypto-agile so that business processes relying on cryptographic security can manage changing keys and algorithms.',
          sourceId: 'ETSI-EG-203-310',
          edition:
            'Quantum Computing Impact on Security of ICT Systems; Recommendations on Business Continuity and Algorithm Selection, 2016-06',
          locator: 'Section 5.3 Algorithm change, PDF p. 9',
        },
        {
          id: 'K1277-11',
          text: 'ETSI TR 104 016 notes that purely migrating one asset to a quantum-safe state can break interoperability and disrupt business operations, whereas a parallel migration approach keeps legacy cryptography available for dependent assets.',
          sourceId: 'ETSI-TR-104-016',
          edition: 'A Repeatable Framework for Quantum-Safe Migrations, 2024-10',
          locator: 'Section 6.4, Parallel Migration Approaches, PDF p. 21',
        },
      ],
    },
  ],
}
