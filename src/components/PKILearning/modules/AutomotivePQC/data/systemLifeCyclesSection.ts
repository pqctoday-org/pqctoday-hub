// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const SYSTEM_LIFE_CYCLES_SECTION: SourcedSectionData = {
  id: 'system-life-cycles',
  title: 'System life cycles and long-lived systems',
  lead: 'This section looks at how system life cycles interact with the transition to post-quantum cryptography in long-lived environments. For engineers designing and maintaining systems expected to stay in service over extended periods, understanding life-cycle stages, risk timelines, and update or retirement paths helps frame where cryptographic changes fit.',
  nice: [{ id: 'K1225', statement: 'Knowledge of system life cycles' }],
  blocks: [
    {
      heading: 'Phases of the system life cycle',
      sentences: [
        {
          id: 'K1225-01',
          text: 'NIST SP 800-37 defines five phases in the system development life cycle: initiation, development and acquisition, implementation, operation and maintenance, and disposal.',
          sourceId: 'NIST SP 800-37',
          edition: 'Risk Management Framework for Information Systems and Organizations, 2018-12',
          locator: 'Appendix H (System Life Cycle Considerations), Footnote 166, page 181',
        },
        {
          id: 'K1225-03',
          text: 'NIST SP 800-37 states that security and privacy requirements are incorporated into the system development life cycle simultaneously with other requirements, and without early integration an organization may incur significant expense later.',
          sourceId: 'NIST SP 800-37',
          edition: 'Risk Management Framework for Information Systems and Organizations, 2018-12',
          locator: 'Appendix H (System Life Cycle Considerations), page 181',
        },
        {
          id: 'K1225-04',
          text: 'NIST SP 800-88 recommends identifying and developing media sanitization needs and methods before the disposal phase, and developing, documenting, and deploying sanitization controls when the initial system security plan is developed.',
          sourceId: 'NIST SP 800-88',
          edition: 'Guidelines for Media Sanitization (Rev. 2), 2025-09',
          locator: 'Section 4.3.1 (Information Decisions in the System Life Cycle), page 29',
        },
      ],
    },
    {
      heading: 'Long service lives and quantum timelines',
      bridge: 'This section considers long service lives alongside quantum timelines.',
      sentences: [
        {
          id: 'K1225-07',
          text: "In Michele Mosca's risk model, if the security shelf-life x plus the time y to deploy quantum-safe tools exceeds the collapse time z, there is a serious problem today.",
          sourceId: 'Cybersecurity-in-an-Era-with-Quantum-Computers-Will-We-Be-Re',
          edition: 'Cybersecurity in an Era with Quantum Computers: Will We Be Ready?',
          locator: 'Section 1 (The threat), page 1',
        },
        {
          id: 'K1225-08',
          text: 'CISA notes that operational technology platforms can have significantly extended lifetimes compared to IT, and extreme cases such as nuclear power generation may require operating decades-old compliant, validated systems to maintain safe operation.',
          sourceId: 'US-CISA-PQC-OT-2024',
          edition: 'CISA Post-Quantum Considerations for Operational Technology, 2024-10',
          locator: 'Additional Risk Considerations, page 6',
        },
      ],
    },
    {
      heading: 'Planning updates, recovery, and decommissioning',
      bridge:
        'This section examines updates, recovery, and decommissioning for long-lived platforms.',
      sentences: [
        {
          id: 'K1225-09',
          text: 'RFC 9019 requires firmware update manifest specifications to support different cryptographic algorithms and algorithm extensibility, and recommends post-quantum secure signature schemes such as hash-based signatures for unchangeable bootloader code in ROM.',
          sourceId: 'RFC 9019',
          edition: 'A Firmware Update Architecture for Internet of Things (SUIT), 2021-04',
          locator: 'Section 7 (Securing Firmware Updates), text document (no PDF page numbers)',
        },
        {
          id: 'K1225-10',
          text: 'UN Regulation No. 156 requires protecting the authenticity and integrity of software updates and requires vehicle manufacturers to ensure vehicles can restore previous versions or enter a safe state after a failed or interrupted update.',
          sourceId: 'UNECE-R156',
          edition:
            'UN Regulation No. 156 — Software Update and Software Update Management System, 2021-03',
          locator: 'Section 7.2.1.1 and Section 7.2.2.1.1 (Requirements for vehicle types), page 7',
        },
        {
          id: 'K1225-11',
          text: 'NIST IR 8547 states that NIST will deprecate quantum-vulnerable public-key cryptography after 2030 and disallow it after 2035, and recommends identifying and prioritizing systems that cannot support post-quantum cryptography for replacement or decommissioning.',
          sourceId: 'NIST IR 8547',
          edition: 'Transition to Post-Quantum Cryptography Standards, 2026-10',
          locator: 'Section 4 (PQC Standards Transition Timeline), page 20',
        },
      ],
    },
  ],
}
