// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const SYSTEMS_ENGINEERING_PRACTICE_SECTION: SourcedSectionData = {
  id: 'systems-engineering-practice',
  title: 'Systems engineering principles and practices',
  lead: 'This section introduces systems engineering principles and practices across the system life cycle, covering requirements, architecture, dependencies, change control, maintenance, and retirement. It is intended for programme and systems engineers involved in cryptographic modernisation.',
  nice: [{ id: 'K0928', statement: 'Knowledge of systems engineering principles and practices' }],
  blocks: [
    {
      heading: 'Life cycle engineering and architecture',
      sentences: [
        {
          id: 'K0928-01',
          text: 'A NIST SP 800-53 discussion notes that a system development life cycle with state-of-the-practice software development, systems engineering, security and privacy engineering, and quality control processes helps reduce the number and severity of latent errors in systems, components, and services.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'PDF p. 280',
        },
        {
          id: 'K0928-02',
          text: 'NIST SP 800-37 states that defining clear, consistent, and unambiguous security and privacy requirements early in the system development life cycle, in collaboration with senior leaders, and integrating them into acquisition processes is important for executing the RMF.',
          sourceId: 'NIST SP 800-37',
          edition: 'Risk Management Framework for Information Systems and Organizations, 2018-12',
          locator: 'PDF p. 45',
        },
        {
          id: 'K0928-03',
          text: "NIST SP 800-37 states that controls are allocated consistently with the organisation's enterprise, security, and privacy architectures to help balance security and privacy protections with the system's mission-based function.",
          sourceId: 'NIST SP 800-37',
          edition: 'Risk Management Framework for Information Systems and Organizations, 2018-12',
          locator: 'PDF p. 72',
        },
        {
          id: 'K0928-04',
          text: 'NIST SP 800-53 notes that assessments can be conducted throughout the system development life cycle as part of systems engineering to verify that requirements are met and identify design and development weaknesses.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'PDF p. 111',
        },
      ],
    },
    {
      heading: 'Dependencies and migration design choices',
      bridge:
        'The next sources turn to asset dependencies and design choices during post-quantum migration.',
      sentences: [
        {
          id: 'K0928-05',
          text: 'ETSI TR 104 016 states that migrating an asset can cause a loss of interoperability with dependent assets, making an understanding of asset dependencies critical for developing a quantum-safe migration plan.',
          sourceId: 'ETSI-TR-104-016',
          edition: 'A Repeatable Framework for Quantum-Safe Migrations, 2024-10',
          locator: 'Section 6.3 Step 3: Dependency analysis, PDF p. 15',
        },
        {
          id: 'K0928-08',
          text: 'The PQC Migration Handbook states that asset dependencies should be clear from the inventory to decide migration order, and once both are established, planning should decide whether each cryptographic asset is replaced, redesigned, retired, or something else.',
          sourceId: 'NL-PQC-Migration-Handbook-2024',
          edition: 'The PQC Migration Handbook (2nd Edition), 2024-12',
          locator: 'Section 3.2.3 Technical Planning, PDF p. 50',
        },
        {
          id: 'K0928-06',
          text: 'NIST IR 8547 states that post-quantum migration may initially use hybrid solutions combining quantum-resistant and quantum-vulnerable algorithms, though they add implementation and architectural complexity that can increase security risks and costs.',
          sourceId: 'NIST IR 8547',
          edition: 'Transition to Post-Quantum Cryptography Standards, 2026-10',
          locator: 'Section 3.2 PQC-Classical Hybrid Protocols, PDF p. 17',
        },
      ],
    },
    {
      heading: 'Change control, maintenance, and retirement',
      bridge:
        'The final sources address configuration change control, system maintenance, and end-of-life planning.',
      sentences: [
        {
          id: 'K0928-09',
          text: "NIST SP 800-128 states that qualified staff conduct security impact analysis within the documented configuration change control process to determine how system changes affect the system's security posture.",
          sourceId: 'NIST-SP-800-128-Guide-for-Security-Focused-Configuration-Man',
          edition:
            'NIST SP 800-128 — Guide for Security-Focused Configuration Management of Information Systems, 2011-08',
          locator: 'Section 2.3.9 Security Impact Analysis, PDF p. 25',
        },
        {
          id: 'K0928-10',
          text: 'NIST SP 800-53 notes that controlling system maintenance applies to all component maintenance by local or nonlocal entities, and that organisations consider supply chain-related risks associated with replacement components.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'PDF p. 190',
        },
        {
          id: 'K0928-11',
          text: 'NIST CSWP 39 states that when systems reach end-of-life and their cryptographic components no longer comply with organisational cryptographic policies, the organisation implements defined mitigation strategies and begins the replacement process.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2026-06',
          locator: 'Section 5.3 Technology Supply Chains, PDF p. 30',
        },
      ],
    },
  ],
}
