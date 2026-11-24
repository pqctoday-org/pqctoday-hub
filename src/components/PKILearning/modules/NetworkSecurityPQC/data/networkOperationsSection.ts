// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const NETWORK_OPERATIONS_SECTION: SourcedSectionData = {
  id: 'network-operations-pqc',
  title: 'Network operations during the PQC transition',
  lead: 'This section examines traffic behavior, infrastructure boundaries, rollout scope, and contingency planning during the transition to post-quantum cryptography.',
  blocks: [
    {
      heading: 'Handshake size and packet fragmentation',
      sentences: [
        {
          id: 'NET-06',
          text: 'RFC 9954 notes that post-quantum public key and ciphertext sizes range from hundreds of bytes to over one hundred kilobytes, which can have a substantial impact and may produce TLS ClientHello messages larger than a single packet.',
          sourceId: 'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
          edition: 'RFC 9954 — Hybrid Key Exchange in TLS 1.3, 2026-07',
          locator: 'Section 1.4 Goals and Section 4 Discussion (RFC text)',
        },
        {
          id: 'NET-08',
          text: 'The IETF UTA working group draft on PQC recommendations for TLS-based applications warns that middleboxes failing to handle fragmented ClientHello messages properly may drop them, and may also mishandle fragmented IP/UDP packets in DTLS deployments.',
          sourceId: 'Post-Quantum-Cryptography-Recommendations-for-TLS-based-Appl',
          edition: 'Post-Quantum Cryptography Recommendations for TLS-Based Applications, 2026-07',
          locator:
            'Section 4.1 Optimizing ClientHello for Hybrid Key Exchange in TLS Handshake, page 8 (Internet-Draft text)',
        },
        {
          id: 'NET-07',
          text: 'RFC 9242 defines the IKE_INTERMEDIATE exchange for IKEv2 to avoid IP fragmentation when transferring large amounts of data, such as quantum-resistant key exchange methods, before IKE_AUTH by allowing IKE fragmentation when peers support and negotiate it.',
          sourceId: 'RFC-9242',
          edition: 'Intermediate Exchange in IKEv2, 2022-05',
          locator: 'Section 1 Introduction and Section 3.2 Using Intermediate Exchange (RFC text)',
        },
      ],
    },
    {
      heading: 'Service meshes and cryptographic gateways',
      bridge:
        'Beyond packet handling on the wire, operational teams also rely on proxies and gateways to manage cryptographic policies across applications and legacy systems.',
      sentences: [
        {
          id: 'NET-16',
          text: 'NIST SP 800-207A describes a service mesh as dedicated infrastructure with security controls; its proxies intercept application traffic, enabling the service mesh to act as a universal policy enforcement point.',
          sourceId: 'NIST-SP-800-207A-A-Zero-Trust-Architecture-Model-for-Access',
          edition:
            'NIST SP 800-207A — A Zero Trust Architecture Model for Access Control in Cloud-Native Applications in Multi-Location Environments, 2023-09',
          locator:
            'Section 4.2 Role of the Service Mesh in Policy Deployment, Enforcement, and Updates, PDF page 21; Section 4.5, PDF page 24',
        },
        {
          id: 'NET-17',
          text: "NIST SP 800-207A explains that edge gateways terminate external traffic, ingress gateways manage certificates, ports, and protocols for exposed cluster applications, and egress gateways can present credentials such as an mTLS certificate on an application's behalf.",
          sourceId: 'NIST-SP-800-207A-A-Zero-Trust-Architecture-Model-for-Access',
          edition:
            'NIST SP 800-207A — A Zero Trust Architecture Model for Access Control in Cloud-Native Applications in Multi-Location Environments, 2023-09',
          locator:
            'Section 4.5 Functional Roles of Application Infrastructure Elements in Enforcing Policies, PDF page 24',
        },
        {
          id: 'NET-18',
          text: 'NIST CSWP 39 describes a dedicated cryptographic gateway that performs cryptographic functions externally to legacy systems so organizations can enforce updated policies, rotate keys, and deploy new algorithms uniformly without modifying individual legacy components.',
          sourceId: 'NIST CSWP 39',
          edition: 'Considerations for Achieving Crypto Agility: Strategies and Practices, 2025-12',
          locator: 'Section 4.6 Using a Crypto Gateway for Legacy Systems, PDF pages 25-26',
        },
      ],
    },
    {
      heading: 'Segmentation and prioritized rollout',
      bridge:
        'To coordinate these changes across complex environments, guidance documents describe ways to isolate assets and sequence migration work.',
      sentences: [
        {
          id: 'NET-12',
          text: 'NIST SP 800-207 describes micro-segmentation as placing individual resources or groups of resources on a unique network segment protected by a gateway security component acting as a Policy Enforcement Point that shields resources from unauthorized access or discovery.',
          sourceId: 'NIST SP 800-207',
          edition: 'Zero Trust Architecture, 2020-08',
          locator: 'Section 3.1.2 ZTA Using Micro-Segmentation, PDF page 21',
        },
        {
          id: 'NET-15',
          text: 'ETSI TR 104 016 describes a repeatable divide-and-conquer framework that partitions an enterprise into discrete structural units, such as networks or physical geographies, to migrate information security assets to quantum-safe states in a prioritized order.',
          sourceId: 'ETSI-TR-104-016',
          edition: 'A Repeatable Framework for Quantum-Safe Migrations, 2024-10',
          locator:
            'Section 1 Scope, PDF page 8; Section 6.1 Step 1: Identify enterprise architecture, PDF page 13',
        },
        {
          id: 'NET-13',
          text: 'The CISA, NSA, and NIST Quantum-Readiness factsheet recommends feeding a quantum-vulnerable cryptographic inventory into risk assessment processes to prioritize post-quantum cryptography use, giving priority to high-impact systems and industrial control systems.',
          sourceId: 'CISA-Quantum-Readiness-Roadmap',
          edition:
            'CISA/NSA/NIST Quantum-Readiness — Migration to Post-Quantum Cryptography, 2023-08',
          locator:
            'Prepare a Cryptographic Inventory, PDF page 2; Supply Chain Quantum-Readiness, PDF page 3',
        },
        {
          id: 'NET-14',
          text: "CISA's Post-Quantum Considerations for Operational Technology states that strong OT network segmentation helps mitigate post-quantum cryptographic compromises by denying attackers access, and recommends prioritizing segmentation for legacy OT, end-of-life software, and slow-to-update platforms.",
          sourceId: 'US-CISA-PQC-OT-2024',
          edition: 'CISA Post-Quantum Considerations for Operational Technology, 2024-10',
          locator: 'Recommendations: Reduce Exposure to Quantum Threats, PDF pages 7-8',
        },
      ],
    },
    {
      heading: 'Contingency planning and fallback controls',
      bridge:
        'Because migration work can encounter unexpected failures or threats, published guidance also addresses recovery planning and fallback behavior.',
      sentences: [
        {
          id: 'NET-01',
          text: 'NIST SP 800-34 Rev. 1 defines Recovery Time Objective as the maximum time a system resource can remain unavailable before unacceptable impact, and Recovery Point Objective as the prior point in time to which process data can be recovered.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator: 'Section 3.2 Conduct the Business Impact Analysis (BIA), PDF page 31',
        },
        {
          id: 'NET-02',
          text: 'NIST SP 800-34 Rev. 1 states that an information system contingency plan contains detailed roles, responsibilities, teams, and procedures, and should be maintained in a state of readiness through personnel training, plan exercises, and component testing.',
          sourceId: 'NIST-SP-800-34-R1',
          edition: 'Contingency Planning Guide for Federal Information Systems, 2010-05',
          locator:
            'Section 3.5 Plan Testing, Training, and Exercises (TT&E), PDF page 41; Chapter 4 Information System Contingency Plan Development, PDF page 48',
        },
        {
          id: 'NET-03',
          text: 'The Netherlands PQC Migration Handbook advises organizations to prepare a backup plan for unforeseen developments, such as a quantum breakthrough or an attack on an established cryptographic standard, to establish business continuity and avoid downtime.',
          sourceId: 'NL-PQC-Migration-Handbook-2024',
          edition: 'The PQC Migration Handbook (2nd Edition), 2024-12',
          locator: 'Section 1.6 No-Regret Moves (Provide a Back Up Plan), PDF page 17',
        },
        {
          id: 'NET-05',
          text: 'The IETF UTA working group draft on PQC recommendations for TLS-based applications states that client fallback policies permitting traditional-only certification paths during migration should be explicit, because accepting a traditional-only path can silently downgrade authentication security.',
          sourceId: 'Post-Quantum-Cryptography-Recommendations-for-TLS-based-Appl',
          edition: 'Post-Quantum Cryptography Recommendations for TLS-Based Applications, 2026-07',
          locator:
            'Section 6.5 Trust Anchors for PQC Certificate Validation, page 13 (Internet-Draft text)',
        },
      ],
    },
  ],
}
