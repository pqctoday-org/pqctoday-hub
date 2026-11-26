// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const SYSTEM_DESIGN_STANDARDS_SECTION: SourcedSectionData = {
  id: 'system-design-standards',
  title: 'System Design Standards and Best Practices',
  lead: 'This section introduces system design standards and best practices for enterprise and security architects. It focuses on lifecycle assurance, remote attestation, and cryptographic agility.',
  nice: [{ id: 'K0769', statement: 'Knowledge of system design standards and best practices' }],
  blocks: [
    {
      heading: 'Lifecycle Security and Assurance',
      bridge: 'This first part looks at security practices across development and evaluation.',
      sentences: [
        {
          id: 'K0769-01',
          text: 'NIST SP 800-53 states that procedural rigor helps ensure security functional and assurance requirements are satisfied and supports a better-informed determination of trustworthiness and risk posture.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator:
            'Chapter Three, Security and Privacy Engineering Principles (30) Procedural Rigor, PDF p. 297',
        },
        {
          id: 'K0769-04',
          text: 'CISA/FBI Product Security Bad Practices (Updated — PQC Recommendation) provides non-binding guidance recommending that software manufacturers make security a core consideration from the onset of software development and throughout the development lifecycle.',
          sourceId: 'CISA-Bad-Practices-PQC-2025',
          edition:
            'CISA/FBI Product Security Bad Practices (Updated — PQC Recommendation), 2025-01',
          locator: 'Overview',
        },
        {
          id: 'K0769-03',
          text: 'Common Criteria (CC:2022 Release 1) defines a multi-assurance evaluation paradigm that applies different assurance requirements to different parts of the TSF while enforcing a global set of SARs for the entire TOE.',
          sourceId: 'COMMON-CRITERIA',
          edition:
            'Common Criteria for Information Technology Security Evaluation, CC:2022 Release 1, Part 1, 2022-11',
          locator: 'Section 6.3.4.3 Multi-assurance evaluation, PDF p. 42',
        },
      ],
    },
    {
      heading: 'Remote Attestation and Trust',
      bridge: 'The next part turns to remote attestation and post-quantum transitions.',
      sentences: [
        {
          id: 'K0769-07',
          text: 'RFC 9334 defines remote attestation roles in which an attester produces evidence about itself, a verifier appraises that evidence against appraisal policies to create attestation results, and a relying party uses those results to decide trustworthiness.',
          sourceId: 'RFC 9334',
          edition: 'Remote ATtestation procedureS (RATS) Architecture, 2023-01',
          locator: 'Section 1 Introduction',
        },
        {
          id: 'K0769-08',
          text: "The IETF Internet-Draft draft-elekula-rats-pqc-attestation-00 states that negotiating post-quantum or hybrid key establishment for TLS does not make RATS artifacts post-quantum authenticated, and a channel's cipher suite must not be treated as evidence of equivalent artifact protection.",
          sourceId: 'draft-elekula-rats-pqc-attestation-00',
          edition:
            'Post-Quantum Cryptographic Considerations for RATS Evidence and Attestation Results, 2026-11',
          locator:
            'Section 1 Introduction and Section 2.2 Key Establishment Versus Artifact Authentication',
        },
      ],
    },
    {
      heading: 'Cryptographic Agility in System Design',
      bridge: 'The final part looks at cryptographic agility in system interfaces and protocols.',
      sentences: [
        {
          id: 'K0769-09',
          text: 'NIST CSWP 39 states that cryptographic agility requires a UI and API supporting varying key and parameter sizes for cryptographic libraries and hardware accelerators, and recommends avoiding algorithm-specific assumptions so buffers, memory, and storage handle diverse data.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2026-06',
          locator: 'Section 6.2 Agility-Aware Design, PDF p. 33',
        },
        {
          id: 'K0769-11',
          text: 'ETSI TR 103 619 notes that the ease of using end-entity certificates containing Quantum Safe public keys depends on whether the application allows negotiating cryptographic algorithms, such as through the Signature Algorithms extension in TLS 1.3.',
          sourceId: 'ETSI TR 103 619',
          edition: 'Migration Strategies and Recommendations for Quantum-Safe Schemes, 2020-07',
          locator: 'Section 6.4 Key management during migration, PDF p. 14',
        },
      ],
    },
  ],
}
