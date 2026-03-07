// SPDX-License-Identifier: GPL-3.0-only
import type { AvionicsProtocol } from './aerospaceConstants'

export const AVIONICS_PROTOCOLS: AvionicsProtocol[] = [
  {
    id: 'acars',
    name: 'ACARS',
    description:
      'Aircraft Communications Addressing and Reporting System. Digital data link for operational messages, weather, and maintenance. Text-based, limited payload.',
    maxPayloadBytes: 220,
    dataRateKbps: 2.4,
    linkType: 'VHF / HF / SATCOM',
    currentCrypto: 'None (plaintext)',
    bidirectional: true,
    standardRef: 'ARINC 618 / ARINC 619',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'infeasible',
      notes:
        'ML-DSA-65 signature (3,309 B) requires 16 ACARS blocks per signed message. Even LMS (1,840 B) requires 9 blocks. Multi-block fragmentation increases VHF channel occupancy dramatically.',
    },
  },
  {
    id: 'cpdlc',
    name: 'CPDLC',
    description:
      'Controller-Pilot Data Link Communications. Safety-critical ATC text messages replacing voice. Strict latency requirements under FANS-1/A and ATN/CPDLC.',
    maxPayloadBytes: 1024,
    dataRateKbps: 10,
    linkType: 'SATCOM (Inmarsat/Iridium) / VDL Mode 2',
    currentCrypto: 'None (integrity via link layer)',
    bidirectional: true,
    standardRef: 'RTCA DO-258A / ED-100A (FANS 1/A) · DO-280B / ED-110B (ATN B1)',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'marginal',
      notes:
        'PQC signatures exceed single-message capacity but CPDLC supports multi-part. 20-second latency budget on GEO SATCOM (600 ms RTT) leaves margin for PQC handshake overhead.',
    },
  },
  {
    id: 'ads-b',
    name: 'ADS-B',
    description:
      'Automatic Dependent Surveillance-Broadcast. Unauthenticated 112-bit position broadcasts on 1090 MHz. No encryption by design. Mandated globally.',
    maxPayloadBytes: 14,
    dataRateKbps: 1000,
    linkType: '1090 MHz broadcast',
    currentCrypto: 'None (unauthenticated)',
    bidirectional: false,
    standardRef: 'RTCA DO-260C / ICAO Annex 10 Vol IV',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'infeasible',
      notes:
        '112-bit message format cannot carry any PQC signature. Authentication would require a new ICAO Annex 10 standard and receiver hardware upgrades across millions of installations worldwide.',
    },
  },
  {
    id: 'arinc-429',
    name: 'ARINC 429',
    description:
      'Legacy avionics data bus. Unidirectional 32-bit words at 100 kbps. Found in most aircraft built before 2010. No native security.',
    maxPayloadBytes: 4,
    dataRateKbps: 100,
    linkType: 'Twisted pair (serial)',
    currentCrypto: 'None',
    bidirectional: false,
    standardRef: 'ARINC Specification 429',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'infeasible',
      notes:
        '4-byte word size is far too small for any cryptographic overhead. Security must be provided at higher layers or via gateway appliances translating to/from secure channels.',
    },
  },
  {
    id: 'arinc-664',
    name: 'ARINC 664 / AFDX',
    description:
      'Avionics Full-Duplex Switched Ethernet. Deterministic Ethernet for modern avionics (A380, A350, B787). Supports IP/UDP with bandwidth allocation.',
    maxPayloadBytes: 1471,
    dataRateKbps: 100_000,
    linkType: 'Ethernet (switched, deterministic)',
    currentCrypto: 'MACsec / IPsec (optional)',
    bidirectional: true,
    standardRef: 'ARINC Specification 664 Part 7',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'fits',
      notes:
        'Ethernet frame capacity and high bandwidth make PQC feasible. ML-KEM-768 ciphertext fits in a single frame. ML-DSA-65 requires fragmentation but is manageable at 100 Mbps.',
    },
  },
  {
    id: 'mil-std-1553',
    name: 'MIL-STD-1553',
    description:
      'Military standard serial data bus. 1 Mbps shared bus with 16-bit data words. Used in fighters, bombers, helicopters, and military transports.',
    maxPayloadBytes: 64,
    dataRateKbps: 1000,
    linkType: 'Twisted pair (shared bus)',
    currentCrypto: 'Type 1 (classified)',
    bidirectional: true,
    standardRef: 'MIL-STD-1553B',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'infeasible',
      notes:
        '64-byte maximum message cannot carry PQC payloads. Gateway-mediated approach required: 1553 bus segment terminates at a PQC-capable gateway that bridges to secure Ethernet.',
    },
  },
  {
    id: 'link-16',
    name: 'Link 16',
    description:
      'Tactical data link for NATO forces. TDMA-based, frequency-hopping, 238 kbps per net. Carries situational awareness, targeting, and command data.',
    maxPayloadBytes: 75,
    dataRateKbps: 238,
    linkType: 'UHF (960-1215 MHz, frequency-hopping)',
    currentCrypto: 'KGV-127 / TACLANE (Type 1)',
    bidirectional: true,
    standardRef: 'MIL-STD-6016 / STANAG 5516',
    pqcOverhead: {
      mlkem768Bytes: 1088,
      mldsa65Bytes: 3309,
      mldsa44Bytes: 2420,
      lmsBytes: 1840,
      feasibility: 'infeasible',
      notes:
        '75-byte J-series message cannot fit PQC signatures. Link 16 relies on TRANSEC (transmission security) rather than COMSEC for over-the-air protection. PQC migration targets the key distribution infrastructure, not the data link itself.',
    },
  },
]

/** PQC algorithm reference sizes for comparison charts */
export const PQC_ALGORITHM_SIZES = {
  'ML-KEM-768': { publicKey: 1184, ciphertext: 1088, label: 'ML-KEM-768' },
  'ML-KEM-512': { publicKey: 800, ciphertext: 768, label: 'ML-KEM-512' },
  'ML-DSA-65': { publicKey: 1952, signature: 3309, label: 'ML-DSA-65' },
  'ML-DSA-44': { publicKey: 1312, signature: 2420, label: 'ML-DSA-44' },
  'LMS-SHA256-H10-W4': { publicKey: 56, signature: 1840, label: 'LMS (H10/W4)' },
  'XMSS-SHA2-10-256': { publicKey: 64, signature: 2500, label: 'XMSS (H10)' },
  X25519: { publicKey: 32, ciphertext: 32, label: 'X25519 (classical)' },
  'ECDSA-P256': { publicKey: 64, signature: 64, label: 'ECDSA P-256 (classical)' },
} as const
