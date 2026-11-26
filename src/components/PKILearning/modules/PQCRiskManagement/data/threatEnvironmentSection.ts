// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const THREAT_ENVIRONMENT_SECTION: SourcedSectionData = {
  id: 'threat-environment-assessment',
  title: "Assessing an Organization's Threat Environment",
  lead: "Security and risk teams evaluate an organization's threat environment to understand which adversaries, attack methods, and long-term risks apply to their systems. This section covers how organizations frame threat assessments, evaluate quantum-era data collection risks, and use shared threat intelligence.",
  nice: [{ id: 'S0804', statement: "Skill in assessing an organization's threat environment" }],
  blocks: [
    {
      heading: 'Framing Threat Assessments and Priorities',
      sentences: [
        {
          id: 'S0804-04',
          text: 'NIST CSF 2.0 states that organizations use Organizational Profiles to assess and prioritize cybersecurity outcomes based on their mission objectives, stakeholder expectations, threat landscape, and requirements.',
          sourceId: 'NIST-CSF-2.0',
          edition: 'NIST Cybersecurity Framework (CSF) 2.0, 2024-02',
          locator: 'Section 3.1 CSF Profiles, PDF p. 11',
        },
        {
          id: 'S0804-02',
          text: 'According to NIST SP 800-30, adversarial threat events are characterized by adversary tactics, techniques, and procedures, and knowing intent and targeting helps organizations narrow the most relevant threat events.',
          sourceId: 'NIST SP 800-30',
          edition: 'Guide for Conducting Risk Assessments (Rev. 1), 2012-09',
          locator: 'Chapter 2, Threats, PDF p. 17-18',
        },
      ],
    },
    {
      heading: 'Encrypted Data and Quantum Risk Assessment',
      bridge: 'The next topic is encrypted data in quantum risk assessment.',
      sentences: [
        {
          id: 'S0804-05',
          text: 'NIST IR 8547 states that encrypted data remains at risk from the “harvest now, decrypt later” threat, in which adversaries collect encrypted data now to decrypt it once quantum technology matures, so starting the transition to post-quantum cryptography now is critical.',
          sourceId: 'NIST IR 8547',
          edition: 'Transition to Post-Quantum Cryptography Standards, 2026-10',
          locator: 'Section 1 Introduction, PDF p. 8',
        },
        {
          id: 'S0804-07',
          text: 'The UK NCSC PQC Whitepaper notes that because storing vast data for decades is costly, harvest-and-decrypt attacks are mainly worthwhile for very high-value information, making a future CRQC a current threat for organizations needing long-term protection.',
          sourceId: 'UK-NCSC-PQC-Whitepaper-2024',
          edition:
            'NCSC White Paper — Next Steps in Preparing for Post-Quantum Cryptography, 2024-08',
          locator: 'Understanding the threat, PDF p. 2',
        },
        {
          id: 'S0804-08',
          text: 'The ENISA PQC Guidelines position paper notes that Advanced Persistent Threats and nation-state actors record encrypted internet traffic for retrospective decryption, so data needing confidentiality after quantum computers arrive needs alternative encryption.',
          sourceId: 'ENISA PQC Guidelines',
          edition: 'Post-Quantum Cryptography: Current State and Quantum Mitigation, 2021-05',
          locator: 'Section 1 Introduction, PDF p. 7',
        },
      ],
    },
    {
      heading: 'Using Shared Threat Intelligence',
      bridge: 'The final topic is shared threat intelligence.',
      sentences: [
        {
          id: 'S0804-09',
          text: 'NIST CSF 2.0 includes receiving cyber threat intelligence from information sharing forums and sources under Risk Assessment and integrating it with other contextual information into adverse event analysis.',
          sourceId: 'NIST-CSF-2.0',
          edition: 'NIST Cybersecurity Framework (CSF) 2.0, 2024-02',
          locator: 'ID.RA-02, PDF p. 24; DE.AE-07, PDF p. 26',
        },
        {
          id: 'S0804-10',
          text: 'The NIS2 Directive states that effective threat detection and prevention depend largely on regular threat and vulnerability intelligence sharing between entities, which increases threat awareness and enhances capacity to prevent incidents.',
          sourceId: 'NIS2-DIRECTIVE-2022-2555',
          edition: 'Network and Information Security Directive 2 (NIS2), 2022-12',
          locator: 'Recital (119), PDF p. 24',
        },
        {
          id: 'S0804-11',
          text: 'ENISA Threat Landscape 2025 reports analyzing 4 875 incidents from open sources, anonymized EU Member State data, and ENISA Cyber Partnership Programme members, while noting that voluntary and open-source reporting is incomplete.',
          sourceId: 'ENISA-Threat-Landscape-2025',
          edition: 'ENISA Threat Landscape 2025, 2025-10',
          locator: 'Section 2 Methodology, PDF p. 8',
        },
      ],
    },
  ],
}
