// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const ADVERSARY_REPORTING_SECTION: SourcedSectionData = {
  id: 'adversary-capability-reporting',
  title: 'Reporting on Adversarial Capabilities and Quantum Threats',
  lead: 'This section introduces reporting on adversarial capabilities, analytical confidence, quantum decryption timelines, and cryptographic risk for security operations and threat-intelligence staff. It focuses on how these assessments are framed and communicated to decision makers.',
  nice: [{ id: 'S0966', statement: 'Skill in reporting on adversarial capabilities' }],
  blocks: [
    {
      heading: 'Describing Adversary Methods and Confidence',
      sentences: [
        {
          id: 'S0966-02',
          text: 'ENISA Threat Landscape 2025 explains that TTPs describe how adversaries operate, with tactics covering objectives, techniques documenting general methods, and procedures detailing specific steps or tools.',
          sourceId: 'ENISA-Threat-Landscape-2025',
          edition: 'ENISA Threat Landscape 2025, 2025-10',
          locator: 'Section 10.1 Observed Tactics, Techniques & Procedures (TTPs), PDF p. 57',
        },
        {
          id: 'S0966-03',
          text: 'ENISA Threat Landscape 2025 uses words of estimative probability to separate other sources from its own assessments and references primary sources in footnotes to substantiate its analysis.',
          sourceId: 'ENISA-Threat-Landscape-2025',
          edition: 'ENISA Threat Landscape 2025, 2025-10',
          locator: 'Section 2 Methodology, PDF p. 8',
        },
      ],
    },
    {
      heading: 'Quantum Cryptanalytic Capability Timelines',
      bridge: 'Next is quantum cryptanalytic capability timelines.',
      sentences: [
        {
          id: 'S0966-05',
          text: 'The EU NIS Cooperation Group roadmap cites expert estimates of a 19%-34% chance that a quantum computer could break RSA-2048 in 24 hours within the next decade, and notes that PQC is designed to be secure against quantum computers.',
          sourceId: 'EU-NIS-CG-Roadmap-v1.1',
          edition:
            'EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1, 2025-06',
          locator: 'Section 2 Introduction and motivation, PDF p. 4',
        },
        {
          id: 'S0966-07',
          text: 'The ETSI report states that researchers developing quantum computers and new mathematical analysis always seek to minimize Z (years to break current cryptography), putting increasing pressure on managing Y (years to replace the current system with a quantum-safe one).',
          sourceId: 'ETSI-GR-QSC-004',
          edition: 'Quantum-Safe Cryptography; Quantum-Safe Threat Assessment, 2017-03',
          locator:
            'Clause 4 Overview of approach to threat assessment, PDF p. 8; Clause 8 Summary, conclusions and recommendations, PDF p. 19',
        },
      ],
    },
    {
      heading: 'Communicating Risk to Decision Makers',
      bridge: 'The final topic is communicating risk to decision makers.',
      sentences: [
        {
          id: 'S0966-04',
          text: 'NIST SP 800-30 Rev. 1 notes that a risk assessment report states whether an assessment is initial or subsequent, describes the overall risk level, and explains the assessment purpose.',
          sourceId: 'NIST SP 800-30',
          edition: 'Guide for Conducting Risk Assessments (Rev. 1), 2012-09',
          locator: 'Appendix K, PDF p. 92',
        },
        {
          id: 'S0966-09',
          text: 'NIST SP 800-30 Rev. 1 states that organizations communicate risk assessment results to organizational decision makers through executive briefings, risk assessment reports, or dashboards to support risk responses.',
          sourceId: 'NIST SP 800-30',
          edition: 'Guide for Conducting Risk Assessments (Rev. 1), 2012-09',
          locator: 'Chapter 2, Step 3, Task 3-1, PDF p. 46',
        },
        {
          id: 'S0966-10',
          text: 'Member States should encourage public administrations and other critical infrastructures to include the quantum threat to cryptography in top-level risk management for board-level evaluation, and including it is highly recommended if they publish a national cybersecurity threat or risk report.',
          sourceId: 'EU-NIS-CG-Roadmap-v1.1',
          edition:
            'EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1, 2025-06',
          locator: 'Section 6.2 First Steps, PDF p. 12',
        },
        {
          id: 'S0966-11',
          text: "The G7 central banks' Quantum Technologies Working Group report (May 2026) proposes a shared analytical framework to inform future decisions through cooperation among central banks, public authorities, and financial stakeholders and common risk assessment frameworks.",
          sourceId: 'G7-CB-QT-Financial-2026',
          edition:
            'Preparing for Quantum Technologies: Key Considerations for Financial Sector Participants, 2026-05',
          locator: 'Structuring anticipation in an evolving landscape, online press release',
        },
      ],
    },
  ],
}
