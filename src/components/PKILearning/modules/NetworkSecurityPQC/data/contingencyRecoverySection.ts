// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const CONTINGENCY_RECOVERY_SECTION: SourcedSectionData = {
  id: 'network-contingency-recovery',
  title: 'Network contingency and recovery plans for a PQC cut-over',
  lead: 'This section introduces contingency planning, recovery targets, and operational readiness for a post-quantum cryptography cut-over.',
  nice: [
    {
      id: 'S0671',
      statement: 'Skill in implementing network infrastructure contingency and recovery plans',
    },
  ],
  blocks: [
    {
      heading: 'Contingency plans and recovery objectives',
      sentences: [
        {
          id: 'S0671-01',
          text: 'NIST SP 800-53 specifies that a system contingency plan identifies essential functions and contingency requirements, provides recovery objectives, restoration priorities, and metrics, addresses roles and contact information, and covers maintaining essential functions despite disruption.',
          sourceId: 'NIST SP 800-53',
          edition: 'NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0), 2020-09',
          locator: 'Section 3.6 Contingency Planning, CP-2 Contingency Plan, PDF p. 143',
        },
        {
          id: 'S0671-05',
          text: "According to NIST SP 800-34 Rev. 1, a business impact analysis helps identify and prioritize information systems and components critical to supporting an organization's mission and business processes.",
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Executive Summary, Step 2, PDF p. 13',
        },
        {
          id: 'S0671-06',
          text: 'NIST SP 800-34 Rev. 1 defines maximum tolerable downtime as the total acceptable outage time for a process, and recovery time objective as the maximum time a system resource can remain unavailable.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Section 3.2.1 Determine Business Processes and Recovery Criticality, PDF p. 31',
        },
        {
          id: 'S0671-07',
          text: 'NIST SP 800-34 Rev. 1 defines the recovery point objective as the pre-outage point to which process data can be recovered based on tolerable data loss, and states that the RTO must normally be shorter than the MTD.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Section 3.2.1 Determine Business Processes and Recovery Criticality, PDF p. 31',
        },
      ],
    },
    {
      heading: 'Team readiness and plan maintenance',
      bridge:
        'Beyond defining priorities and targets, contingency planning also covers how teams prepare for activation and keep plans current.',
      sentences: [
        {
          id: 'S0671-02',
          text: 'NIST SP 800-34 Rev. 1 states that after selecting and implementing backup and system recovery strategies, the ISCP Coordinator must designate appropriate teams, and each team should be trained and ready to respond.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Section 3.4.6 Roles and Responsibilities, PDF p. 40',
        },
        {
          id: 'S0671-03',
          text: 'According to NIST SP 800-34 Rev. 1, testing validates recovery capabilities, training prepares recovery personnel for plan activation, and exercising the plan identifies planning gaps to improve effectiveness and preparedness.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Executive Summary, Step 6, PDF p. 13',
        },
        {
          id: 'S0671-04',
          text: 'NIST SP 800-34 Rev. 1 states that to remain effective, a contingency plan must be maintained in a ready state that accurately reflects system requirements, procedures, organizational structure, and policies.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Section 3.6 Plan Maintenance, PDF p. 45',
        },
      ],
    },
    {
      heading: 'Protocol and rollback risks during a PQC cut-over',
      bridge:
        'During a post-quantum transition, network protocol behavior and fallback mechanisms introduce specific operational and security considerations.',
      sentences: [
        {
          id: 'S0671-12',
          text: 'The IETF draft Post-Quantum Cryptography Recommendations for TLS-based Applications notes that a hybrid key share may exceed the maximum transmission unit, fragmenting the ClientHello across packets and increasing latency and handshake delay risk.',
          sourceId: 'Post-Quantum-Cryptography-Recommendations-for-TLS-based-Appl',
          edition: 'Post-Quantum Cryptography Recommendations for TLS-Based Applications, 2026-07',
          locator: 'Section 4.1 Optimizing ClientHello for Hybrid Key Exchange in TLS Handshake',
        },
        {
          id: 'S0671-14',
          text: 'ETSI TR 103 966 observes that the initial IKEv2 key exchange size is limited to avoid packet fragmentation and that most post-quantum key exchanges have public keys too large to fit into the available space.',
          sourceId: 'ETSI-TR-103-966',
          edition: 'Deployment Considerations for Hybrid Schemes, 2024-10',
          locator: 'Section 5.3 Protocol constraints and validation, PDF p. 13',
        },
        {
          id: 'S0671-11',
          text: 'ETSI TR 103 966 notes that backwards-compatible hybrid schemes can be vulnerable to downgrade attacks exploiting an insecure component algorithm and can be less secure than a non-hybrid post-quantum algorithm.',
          sourceId: 'ETSI-TR-103-966',
          edition: 'Deployment Considerations for Hybrid Schemes, 2024-10',
          locator: 'Section 6.1.2 Hybrid interoperability, PDF p. 14',
        },
        {
          id: 'S0671-09',
          text: 'In draft-sheffer-tls-pqc-continuity, a cached PQC commitment protects returning clients from rollback to classical certificates within the validity period while allowing certificate holders to revert to traditional certificates if needed.',
          sourceId: 'draft-sheffer-tls-pqc-continuity',
          edition: 'PQC Continuity: Downgrade Protection for TLS, 2026-06',
          locator: 'Section 1 Introduction',
        },
      ],
    },
  ],
}
