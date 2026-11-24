// SPDX-License-Identifier: AGPL-3.0-only
import type { SourcedSectionData } from '@/components/PKILearning/common/SourcedSection'

/** Every sentence reports what the named Library document says, at the place given. */
export const TERMINATION_POINT_SECTION: SourcedSectionData = {
  id: 'pq-tls-termination-point',
  title: 'Post-quantum TLS at the termination point: configuration, cost and compatibility',
  lead: 'This section examines configuration, server load, and compatibility considerations for rolling out post-quantum key exchange.',
  nice: [{ id: 'K1375', statement: 'Knowledge of load balancing tools and techniques' }],
  blocks: [
    {
      heading: 'Configuration and compute impact at TLS termination',
      sentences: [
        {
          id: 'K1375-04',
          text: 'The IETF draft "Post-Quantum Cryptography Recommendations for TLS-Based Applications" states that upgrading to a TLS 1.3 library with PQC extensions may not be sufficient, and applications configuring protocol versions or cipher suites explicitly must update those settings to enable hybrid or pure PQC key exchange groups.',
          sourceId: 'Post-Quantum-Cryptography-Recommendations-for-TLS-based-Appl',
          edition: 'Post-Quantum Cryptography Recommendations for TLS-Based Applications, 2026-07',
          locator: 'Section 4 Data Confidentiality, page 7',
        },
        {
          id: 'K1375-03',
          text: 'In the paper "Layered Performance Analysis of TLS 1.3 Handshakes", hybrid key exchange (x25519_MLKEM768) increased server CPU from 14.61% to 15.46% (+5.8% relative), and workloads closer to saturation would see proportionally larger absolute increases.',
          sourceId: 'Layered-Performance-Analysis-of-TLS-1-3-Handshakes-Classical',
          edition:
            'Layered Performance Analysis of TLS 1.3 Handshakes: Classical, Hybrid, and Pure Post-Quantum Key Exchange',
          locator: 'Section 4.8 CPU and Network Utilization, pages 20-21',
        },
      ],
    },
    {
      heading: 'Planning a gradual, compatible transition',
      bridge:
        'Beyond configuration and server load, published guidance also addresses how rollout interacts with existing infrastructure.',
      sentences: [
        {
          id: 'K1375-05',
          text: 'The IETF draft "Post-Quantum Cryptography Recommendations for TLS-Based Applications" describes PQC adoption as a gradual transition rather than a simple binary decision, where application providers will need to assess algorithm selection, performance impact, interoperability, and security requirements for their specific use cases.',
          sourceId: 'Post-Quantum-Cryptography-Recommendations-for-TLS-based-Appl',
          edition: 'Post-Quantum Cryptography Recommendations for TLS-Based Applications, 2026-07',
          locator: 'Section 9 Operational Considerations, page 19',
        },
        {
          id: 'K1375-07',
          text: 'RFC 9954 states that hybrid-aware clients and servers should remain compatible with non-hybrid-aware endpoints and middleboxes, and a hybrid-aware server should establish a non-hybrid shared secret with a non-hybrid-aware client if willing to downgrade.',
          sourceId: 'RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3',
          edition: 'RFC 9954 — Hybrid Key Exchange in TLS 1.3, 2026-07',
          locator: 'Section 1.4 Goals',
        },
      ],
    },
  ],
}
