// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const SYSTEMS_ENGINEERING_SECTION: SourcedSectionData = {
  id: 'systems-security-engineering',
  title: 'Systems security engineering and cryptographic agility',
  lead: 'This section introduces foundational security engineering concepts, architectural design principles, and transition-planning topics for system architects and security engineers.',
  nice: [
    {
      id: 'K0731',
      statement: 'Knowledge of systems security engineering (SSE) principles and practices',
    },
  ],
  blocks: [
    {
      heading: 'Security engineering and trustworthiness',
      sentences: [
        {
          id: 'K0731-01',
          text: 'NIST SP 800-53 states that integrating security and privacy considerations early in the system development life cycle is a foundational principle of systems security engineering and privacy engineering.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Chapter Three, SA-3 System Development Life Cycle, p. 277',
        },
        {
          id: 'K0731-02',
          text: 'According to NIST SP 800-53, systems security and privacy engineering principles are implemented throughout the system development life cycle to help organizations develop trustworthy, secure, and resilient systems.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Chapter Three, SA-8 Security and Privacy Engineering Principles, p. 284',
        },
        {
          id: 'K0731-03',
          text: 'NIST SP 800-53 defines trustworthiness as being worthy of trust to fulfill needed requirements, and states that effective trustworthiness measures are meaningful only when requirements are complete, well-defined, and accurately assessable.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Section 2.5 Trustworthiness and Assurance, p. 41',
        },
        {
          id: 'K0731-04',
          text: 'NIST SP 800-53 identifies functionality and assurance as two fundamental concepts affecting system trustworthiness, defining assurance as the measure of confidence that system functionality meets security and privacy requirements.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Section 2.5 Trustworthiness and Assurance, p. 41',
        },
      ],
    },
    {
      heading: 'Traceability, modularity, and trust boundaries',
      bridge:
        'Turning trustworthiness into a working architecture involves linking security goals to system structure and limiting exposure.',
      sentences: [
        {
          id: 'K0731-05',
          text: 'Common Criteria explains that tracing between security objectives and security problem definition elements shows that there are no spurious objectives and that the security problem definition is completely covered.',
          sourceId: 'COMMON-CRITERIA',
          edition:
            'Common Criteria for Information Technology Security Evaluation, CC:2022 Release 1, Part 1, 2022-11',
          locator: 'Clause 7.2.5 Tracing between security objectives and the SPD, p. 47',
        },
        {
          id: 'K0731-08',
          text: 'In NIST SP 800-53, the design principle of modularity isolates functions and related data structures into well-defined logical units, while layering clarifies their relationships and dependencies to avoid undesired complexity.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Chapter Three, SA-8(3) Modularity and Layering, p. 285',
        },
        {
          id: 'K0731-07',
          text: 'NIST SP 800-207 defines an implicit trust zone as an area where all entities are trusted to at least the level of the last policy gateway and states it must be as small as possible.',
          sourceId: 'NIST SP 800-207',
          edition: 'Zero Trust Architecture, 2020-08',
          locator: 'Section 2 Zero Trust Architecture Defined, p. 14',
        },
      ],
    },
    {
      heading: 'Planning for cryptographic transitions',
      bridge:
        'Applying these engineering principles to cryptography brings interface design, complexity control, parameter growth, and upgrade paths into focus.',
      sentences: [
        {
          id: 'K0731-09',
          text: 'NIST CSWP 39 states that system designers must introduce mechanisms that simplify replacing cryptographic algorithms in software, libraries, hardware, and firmware, while ensuring cryptographic interfaces are easy to use and well-documented.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2026-06',
          locator: 'Section 4 Crypto Agility in System Implementations, p. 21',
        },
        {
          id: 'K0731-10',
          text: 'NIST CSWP 39 says protocol designers should balance agility with simplicity, avoid gratuitous options, remove disallowed algorithms to reduce complexity, and periodically remove unused options to keep the attack surface small.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2026-06',
          locator: 'Section 3.4.2 Balancing Protocol Complexity, pp. 19-20',
        },
        {
          id: 'K0731-11',
          text: 'ANSSI guidance on crypto-agility states that crypto-agility requires planning in advance and designing for the worst case because key, ciphertext, or signature lengths will often grow when switching to another cryptosystem.',
          sourceId: 'ANSSI-s-views-on-crypto-agility',
          edition: 'ANSSI’s views on crypto-agility, 2026',
          locator: 'Section 2 Levels of crypto-agility capabilities, p. 3',
        },
        {
          id: 'K0731-12',
          text: 'CCCS guidance ITSAP.40.018 explains that cryptographic agility allows algorithms to be interchanged primarily through configuration, and states that agile products must have streamlined software and firmware upgrade capabilities when configuration options are exhausted.',
          sourceId: 'CCCS-ITSAP40018',
          edition: 'Guidance on Becoming Cryptographically Agile (ITSAP.40.018), 2022-05',
          locator: 'Guidance on becoming cryptographically agile (ITSAP.40.018), introduction',
        },
      ],
    },
  ],
}
