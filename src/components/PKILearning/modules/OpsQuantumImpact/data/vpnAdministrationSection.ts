// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const VPN_ADMINISTRATION_SECTION: SourcedSectionData = {
  id: 'vpn-device-administration',
  title: 'Administering Virtual Private Network Devices',
  lead: 'This section covers administering Virtual Private Network (VPN) devices for network operations and security administrators. It outlines policy and credential management, post-quantum key exchange, and transition considerations to support planning for interoperability and transition risks.',
  nice: [{ id: 'T1268', statement: 'Administer Virtual Private Network (VPN) devices' }],
  blocks: [
    {
      heading: 'VPN Policy and Credential Management',
      sentences: [
        {
          id: 'T1268-01',
          text: 'RFC 4301 states that IPsec protection is based on a security policy database established and maintained by a user or system administrator, who must be able to order entries to express an access control policy.',
          sourceId: 'RFC 4301',
          edition: 'Security Architecture for the Internet Protocol, 2005-12',
          locator: 'Section 3 System Overview; Section 4.4.1',
        },
        {
          id: 'T1268-02',
          text: 'NIST SP 800-77 Rev. 1 states that certificate-based authentication offloads much key administration to a central certificate server, while still requiring IPsec administrators to perform key management activities such as provisioning hosts with credentials.',
          sourceId: 'Guide-to-IPsec-VPNs',
          edition: 'Guide to IPsec VPNs, 2020-06',
          locator: 'Section 7.2.2.2, PDF p. 85',
        },
      ],
    },
    {
      heading: 'Post-Quantum Key Exchange in VPNs',
      bridge: 'Beyond policy and credentials, the next topic is post-quantum key exchange in VPNs.',
      sentences: [
        {
          id: 'T1268-05',
          text: 'RFC 9370 extends IKEv2 to perform one or more additional key exchanges in IKE_INTERMEDIATE exchanges before IKE_AUTH, accommodating post-quantum key exchange payloads larger than the standard MTU so keys remain secure if any exchange is secure.',
          sourceId: 'RFC 9370',
          edition: 'Multiple Key Exchanges in IKEv2, 2023-05',
          locator: 'Section 1.2 Proposed Extension',
        },
        {
          id: 'T1268-06',
          text: 'The IETF draft draft-ietf-ipsecme-ikev2-mlkem-09 specifies how to use ML-KEM in IKEv2 either alone or alongside a traditional key exchange, making IKEv2/IPsec tunnels resistant to harvest-now-decrypt-later attacks.',
          sourceId: 'draft-ietf-ipsecme-ikev2-mlkem-09',
          edition: 'ML-KEM in IKEv2 (draft-ietf-ipsecme-ikev2-mlkem-09), 2026-07',
          locator: 'Section 1 Introduction',
        },
        {
          id: 'T1268-08',
          text: 'In "Post-Quantum Transition of IPsec / IKEv2 (ANSSI-FT-117)", strongSwan implements the proposed fragmentation management and, in version 6.0, implements hybrid key exchange and integrates ML-KEM.',
          sourceId: 'ANSSI-PQC-IPsec-Transition',
          edition: 'Post-Quantum Transition of IPsec / IKEv2 (ANSSI-FT-117), 2026-02',
          locator: 'Section 3.2.1 Hybridation des échanges de clés, PDF p. 14',
        },
      ],
    },
    {
      heading: 'Transition Timelines, Interoperability, and Downgrade Risks',
      bridge: 'The final topic covers transition timelines, interoperability, and downgrade risks.',
      sentences: [
        {
          id: 'T1268-07',
          text: 'BSI TR-02102-3 recommends sole use of classic Table 6 key exchange mechanisms only until the end of 2031, and states BSI intends to recommend ML-KEM-768 and ML-KEM-1024 in hybrid use once the corresponding RFC is adopted.',
          sourceId: 'BSI TR-02102-3',
          edition: 'Cryptographic Mechanisms: Recommendations for IPsec, 2026-01',
          locator: 'Section 3.2.4 Key exchange methods, PDF p. 11',
        },
        {
          id: 'T1268-10',
          text: 'RFC 9370 specifies that unless both peers support and agree to use its additional key exchanges, they obtain the shared secret specified in RFC 7296, ensuring hybrid post-quantum and standard IKEv2 implementations are interoperable.',
          sourceId: 'RFC 9370',
          edition: 'Multiple Key Exchanges in IKEv2, 2023-05',
          locator: 'Section 1.2 Proposed Extension; Appendix B Design Criteria',
        },
        {
          id: 'T1268-11',
          text: 'The IETF draft draft-ietf-ipsecme-ikev2-downgrade-prevention states that during migration to quantum-resistant algorithms, an attacker able to break a traditional key exchange method can mount KCI or identity misbinding attacks to prevent peers from executing quantum-resistant key exchanges.',
          sourceId: 'draft-ietf-ipsecme-ikev2-downgrade-prevention',
          edition:
            'Downgrade Prevention for the Internet Key Exchange Protocol Version 2 (IKEv2), 2026-05',
          locator: 'Section 4 Downgrade Attacks Description',
        },
      ],
    },
  ],
}
