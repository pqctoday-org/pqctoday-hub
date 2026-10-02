// SPDX-License-Identifier: GPL-3.0-only
/**
 * OT protocol native-security data (workshop Step 1 and the Learn
 * "OT protocol native security" section).
 *
 * Each protocol is broken into crypto layers. A layer's `threat` says what a
 * cryptographically relevant quantum computer (CRQC) would actually break:
 *
 *  - 'forgery'  — a public-key signature or certificate: a CRQC could forge
 *                 commands, firmware or identities. No harvesting needed; the
 *                 exposure starts the day a CRQC exists.
 *  - 'hndl'     — a public-key key exchange: traffic recorded today could be
 *                 decrypted later (harvest now, decrypt later).
 *  - 'both'     — a handshake that does both (TLS with certificates).
 *  - 'none'     — symmetric (HMAC, GMAC, AES key wrap): Shor's algorithm does
 *                 not apply; keep 256-bit keys for Grover margin.
 *  - 'no-crypto'— nothing to break: the layer is unprotected today. That is a
 *                 present-day gap fixed with classical controls, not a PQC
 *                 problem.
 *
 * Mechanism facts follow the plan audit (iot-ot-split-plan-10012026.md §3.2/§3.3):
 * DLMS/COSEM suites 0/1/2 carry NO RSA (E1); IEC 61850 GOOSE/SV group keys are
 * distributed by GDOI per IEC 62351-9 / RFC 8052, not by RSA certificates (E6);
 * DNP3 SAv5's default update-key change is symmetric (E10); PTP security is
 * IEEE 1588-2019 Annex P, not NTS (E21).
 */
import { getAlgorithm } from '@/data/algorithmProperties'

export type LayerThreat = 'forgery' | 'hndl' | 'both' | 'none' | 'no-crypto'

export type OTSector = 'energy' | 'water' | 'rail' | 'manufacturing' | 'building'

export interface ProtocolCryptoLayer {
  layerName: string
  mechanism: string
  threat: LayerThreat
  /** What to migrate to, or null when nothing needs to change. */
  pqcPath: string | null
  /** Bytes on the wire for the public-key element today / after migration
   *  (FIPS 203/204 sizes from the algorithm registry). Omitted for symmetric
   *  or absent layers. */
  classicalBytes?: number
  pqcBytes?: number
  /** What the byte figures measure, e.g. "key share" or "one signature". */
  sizeBasis?: string
  notes: string
}

export interface OTProtocol {
  id: string
  name: string
  standard: string
  sectors: OTSector[]
  transport: 'TCP' | 'UDP' | 'Serial' | 'Layer 2 multicast' | 'PLC/RF' | 'WebSocket/TLS'
  timingRequirement: string | null
  description: string
  cryptoLayers: ProtocolCryptoLayer[]
  /** Short "status of PQC in the standard itself". */
  standardStatus: string
}

const ML_KEM_768_CT = getAlgorithm('ML-KEM-768').signatureOrCiphertextBytes
const ML_DSA_65_SIG = getAlgorithm('ML-DSA-65').signatureOrCiphertextBytes
const ML_DSA_44_SIG = getAlgorithm('ML-DSA-44').signatureOrCiphertextBytes
const ECDSA_P256_SIG = getAlgorithm('ECDSA P-256').signatureOrCiphertextBytes
const ECDSA_P384_SIG = getAlgorithm('ECDSA P-384').signatureOrCiphertextBytes
const RSA_2048_SIG = getAlgorithm('RSA-2048').signatureOrCiphertextBytes
/** X25519 / P-256 compressed ECDH key share is 32–33 B; we use the X25519 32 B share. */
const X25519_SHARE = 32

export const SV_SAMPLE_RATES = [4000, 4800, 14400] as const

/** Sample interval in microseconds for an IEC 61869-9 SV rate. */
export function svSampleIntervalMicros(rate: number): number {
  return Math.round(1_000_000 / rate)
}

export const OT_PROTOCOLS: OTProtocol[] = [
  {
    id: 'iec61850-goose',
    name: 'IEC 61850 GOOSE',
    standard: 'IEC 61850-8-1 · security: IEC 62351-6 (2020), keys: IEC 62351-9 / RFC 8052',
    sectors: ['energy'],
    transport: 'Layer 2 multicast',
    timingRequirement:
      'Type 1A trip: class P1 = TT6 (3 ms or less); class P2 = TT5 (10 ms or less)',
    description:
      'Generic Object Oriented Substation Event — Layer 2 multicast for protection trips, interlocks and status. Repeats on change, so it cannot wait for a handshake.',
    standardStatus:
      'IEC 62351-6:2020 profiles include HMAC-SHA256 and AES-GMAC message authentication. No PQC work item is public.',
    cryptoLayers: [
      {
        layerName: 'Per-message authentication',
        mechanism: 'HMAC-SHA256 or AES-GMAC with a group key (IEC 62351-6:2020)',
        threat: 'none',
        pqcPath: null,
        notes:
          'Symmetric. A CRQC does not help forge it. This stays in the trip path unchanged — no PQC signature belongs here.',
      },
      {
        layerName: 'Group key management',
        mechanism:
          'GDOI key distribution centre (IEC 62351-9 / RFC 8052); registration authenticated with certificates or pre-shared keys',
        threat: 'both',
        pqcPath: 'PQC or hybrid authentication and key exchange for the KDC registration channel',
        notes:
          'Runs out of band and infrequently. With certificate authentication this is classical public-key crypto: a CRQC could impersonate the KDC and hand out group keys. Fix it here, not in the GOOSE frame.',
      },
    ],
  },
  {
    id: 'iec61850-sv',
    name: 'IEC 61850 Sampled Values',
    standard: 'IEC 61850-9-2 / IEC 61869-9 · security: IEC 62351-6, keys: IEC 62351-9',
    sectors: ['energy'],
    transport: 'Layer 2 multicast',
    timingRequirement: '4,000 / 4,800 / 14,400 samples/s (IEC 61869-9): 250 / 208 / 69 µs apart',
    description:
      'Streams of current and voltage samples from merging units to protection relays. Every sample is a frame, so per-message crypto must cost microseconds.',
    standardStatus:
      'Same IEC 62351-6 symmetric profiles and IEC 62351-9 group keys as GOOSE. No PQC work item is public.',
    cryptoLayers: [
      {
        layerName: 'Per-message authentication',
        mechanism: 'HMAC-SHA256 or AES-GMAC with a group key (IEC 62351-6:2020)',
        threat: 'none',
        pqcPath: null,
        notes:
          'Symmetric and fast enough for 14,400 frames per second. A 2,420-byte ML-DSA-44 signature would not even fit in a 1,500-byte Ethernet payload.',
      },
      {
        layerName: 'Group key management',
        mechanism: 'GDOI (IEC 62351-9 / RFC 8052), shared with GOOSE',
        threat: 'both',
        pqcPath: 'Migrate together with the GOOSE KDC channel',
        notes: 'One KDC migration covers both GOOSE and SV.',
      },
    ],
  },
  {
    id: 'iec61850-mms',
    name: 'IEC 61850 MMS',
    standard: 'IEC 61850-8-1 / ISO 9506 · security: IEC 62351-3 (TLS) and -4',
    sectors: ['energy'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Client/server protocol for SCADA polling, control and configuration of IEDs over the station bus.',
    standardStatus:
      'IEC 62351-3:2023 adds a TLS 1.3 profile and now lists the mandatory TLS 1.2 cipher suites itself; it profiles conventional TLS cipher suites and does not specify PQC key-exchange or signature algorithms.',
    cryptoLayers: [
      {
        layerName: 'TLS key exchange',
        mechanism: 'TLS 1.2 ECDHE/RSA, or TLS 1.3 ECDHE (IEC 62351-3)',
        threat: 'hndl',
        pqcPath: 'Hybrid ML-KEM-768 key exchange in TLS 1.3',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'server key share (X25519 → ML-KEM-768 ciphertext)',
        notes:
          'TCP carries the larger handshake without trouble; the IED firmware must support TLS 1.3.',
      },
      {
        layerName: 'Certificate authentication',
        mechanism: 'X.509 with RSA-2048 or ECDSA P-256 (IEC 62351-3 / -9)',
        threat: 'forgery',
        pqcPath: 'ML-DSA certificates once IEC 62351 profiles them',
        classicalBytes: ECDSA_P256_SIG,
        pqcBytes: ML_DSA_65_SIG,
        sizeBasis: 'one signature (ECDSA P-256 → ML-DSA-65)',
        notes:
          'A forged IED or client certificate lets an attacker issue MMS controls as a trusted peer.',
      },
    ],
  },
  {
    id: 'dnp3-sav5',
    name: 'DNP3 Secure Authentication v5',
    standard: 'IEEE Std 1815-2012 · IEC 62351-5',
    sectors: ['energy', 'water'],
    transport: 'Serial',
    timingRequirement: null,
    description:
      'The dominant North American SCADA protocol for RTUs and outstations, over serial or TCP. SAv5 authenticates critical requests with a challenge-response MAC.',
    standardStatus:
      'IEEE moved 1815-2012 to inactive status in 2023; the P1815 revision runs to 2027. "SAv6" has not been published.',
    cryptoLayers: [
      {
        layerName: 'Challenge-response authentication',
        mechanism: 'HMAC-SHA256 over the challenged request with session keys',
        threat: 'none',
        pqcPath: null,
        notes: 'Symmetric. Quantum-safe as is.',
      },
      {
        layerName: 'Session key distribution',
        mechanism: 'Session keys wrapped with AES Key Wrap (RFC 3394) under the Update Key',
        threat: 'none',
        pqcPath: 'Prefer AES-256 key wrap for Grover margin',
        notes: 'Symmetric. The KAT panel below checks the RFC 3394 AES-256 wrap vector.',
      },
      {
        layerName: 'Update key change — symmetric (default)',
        mechanism:
          'New Update Key encrypted under the Authority key (AES Key Wrap); both sides confirm with an HMAC keyed with the new Update Key',
        threat: 'none',
        pqcPath: null,
        notes:
          'This is the default method, and it has no public-key step. A utility using it has no Shor exposure in SAv5 at all.',
      },
      {
        layerName: 'Update key change — asymmetric (optional)',
        mechanism:
          'Update Key encrypted to the outstation with RSAES-OAEP; user credentials signed with DSA',
        threat: 'both',
        pqcPath: 'Switch to the symmetric method, or wait for a revised standard with PQC options',
        classicalBytes: RSA_2048_SIG,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'key transport (RSA-2048 → ML-KEM-768 ciphertext)',
        notes:
          'Only deployments that chose the optional asymmetric method are exposed. No published DNP3 revision defines a PQC replacement yet.',
      },
    ],
  },
  {
    id: 'iec60870-5-104',
    name: 'IEC 60870-5-104',
    standard: 'IEC 60870-5-104 · IEC 62351-3 (TLS) and IEC 62351-5 (application auth)',
    sectors: ['energy'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Telecontrol over TCP/IP, widely used in European grids between control centres and substations.',
    standardStatus: 'Inherits IEC 62351-3 TLS and IEC 62351-5 authentication; no PQC profile yet.',
    cryptoLayers: [
      {
        layerName: 'TLS (IEC 62351-3)',
        mechanism: 'TLS with ECDHE/RSA key exchange and X.509 certificates',
        threat: 'both',
        pqcPath: 'Hybrid ML-KEM TLS 1.3; ML-DSA certificates when profiled',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'server key share',
        notes: 'Same migration as MMS — one TLS stack update can cover both.',
      },
      {
        layerName: 'Application-layer authentication (IEC 62351-5)',
        mechanism: 'HMAC challenge-response, same family as DNP3 SAv5',
        threat: 'none',
        pqcPath: null,
        notes: 'Symmetric. An optional asymmetric update-key change has the same exposure as DNP3.',
      },
    ],
  },
  {
    id: 'iccp-tase2',
    name: 'ICCP / TASE.2',
    standard: 'IEC 60870-6 · IEC 62351-3 / -4',
    sectors: ['energy'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Inter-control-centre data exchange between utilities, ISOs and RTOs — usually over WAN links.',
    standardStatus:
      'TLS per IEC 62351-3; inter-control-centre links are in scope of NERC CIP-012-2.',
    cryptoLayers: [
      {
        layerName: 'TLS / IPsec key exchange',
        mechanism: 'TLS or IKEv2 with ECDHE/RSA',
        threat: 'hndl',
        pqcPath: 'Hybrid ML-KEM TLS 1.3 or IKEv2 with ML-KEM (RFC 9370 additional key exchanges)',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'key share',
        notes:
          'WAN traffic is the easiest to record, so this is the clearest HNDL target in a utility.',
      },
      {
        layerName: 'Peer authentication',
        mechanism: 'X.509 certificates (RSA/ECDSA)',
        threat: 'forgery',
        pqcPath: 'ML-DSA certificates',
        classicalBytes: RSA_2048_SIG,
        pqcBytes: ML_DSA_65_SIG,
        sizeBasis: 'one signature (RSA-2048 → ML-DSA-65)',
        notes:
          'A forged peer could inject false real-time data into a neighbouring control centre.',
      },
    ],
  },
  {
    id: 'opc-ua',
    name: 'OPC UA',
    standard: 'OPC 10000-2 (Security Model) · OPC 10000-7 (Profiles)',
    sectors: ['manufacturing', 'energy', 'water', 'building'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Platform-neutral client/server and pub/sub protocol used from PLCs to MES. Security is negotiated per SecureChannel through SecurityPolicies.',
    standardStatus:
      'SecurityPolicies use RSA (e.g. Basic256Sha256, Aes256_Sha256_RsaPss) or ECC (nistP256, nistP384, brainpool, curve25519). No PQC policy is published; one would arrive through the Part 7 profiles.',
    cryptoLayers: [
      {
        layerName: 'SecureChannel key establishment',
        mechanism: 'RSA-OAEP encrypted nonces (RSA policies) or ECDH (ECC policies)',
        threat: 'hndl',
        pqcPath: 'A future ML-KEM SecurityPolicy',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'ephemeral key (ECC policy → ML-KEM-768 ciphertext)',
        notes:
          'Client and server must both support the new policy; keep the old one only as long as needed.',
      },
      {
        layerName: 'Application instance certificates',
        mechanism: 'X.509 with RSA or ECDSA signatures',
        threat: 'forgery',
        pqcPath: 'ML-DSA application certificates (future policy)',
        classicalBytes: ECDSA_P256_SIG,
        pqcBytes: ML_DSA_65_SIG,
        sizeBasis: 'one signature',
        notes:
          'Certificates authenticate every client and server, including engineering tools that write to PLCs.',
      },
      {
        layerName: 'Message protection',
        mechanism: 'Symmetric signing/encryption keys derived per channel (HMAC-SHA256, AES)',
        threat: 'none',
        pqcPath: null,
        notes: 'Safe once the channel keys are established with a PQC policy.',
      },
    ],
  },
  {
    id: 'cip-security',
    name: 'CIP Security (EtherNet/IP)',
    standard: 'ODVA CIP Security (PUB00319)',
    sectors: ['manufacturing'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Security extension for EtherNet/IP: TLS for explicit messaging and DTLS for implicit (I/O) messaging, with X.509 certificates or pre-shared keys.',
    standardStatus:
      'Five profiles (EtherNet/IP Confidentiality, CIP User Authentication, Resource-Constrained, Pull Model, Device-Based Firewall). No PQC profile yet.',
    cryptoLayers: [
      {
        layerName: 'TLS/DTLS handshake with certificates',
        mechanism: 'ECDHE key exchange and X.509 device certificates',
        threat: 'both',
        pqcPath: 'Hybrid ML-KEM (D)TLS and ML-DSA device certificates',
        classicalBytes: ECDSA_P256_SIG,
        pqcBytes: ML_DSA_44_SIG,
        sizeBasis: 'one device signature (ECDSA P-256 → ML-DSA-44)',
        notes:
          'Implicit I/O over DTLS means larger handshakes cross UDP — fragmentation matters for controllers.',
      },
      {
        layerName: 'Pre-shared key mode',
        mechanism: 'TLS/DTLS PSK cipher suites',
        threat: 'none',
        pqcPath: null,
        notes:
          'Symmetric; quantum-safe, but PSK provisioning is a key-management job at fleet scale.',
      },
      {
        layerName: 'Integrity-only I/O',
        mechanism: 'HMAC on implicit messages (integrity without encryption)',
        threat: 'none',
        pqcPath: null,
        notes: 'Symmetric once the session is up.',
      },
    ],
  },
  {
    id: 'profinet-security',
    name: 'PROFINET Security Classes',
    standard: 'PI PROFINET Security Whitepaper V1.05 (2019), aligned with IEC 62443',
    sectors: ['manufacturing'],
    transport: 'Layer 2 multicast',
    timingRequirement: 'Cyclic real-time I/O (cycle times down to sub-millisecond)',
    description:
      'Class 1 robustness (e.g. signed GSD device-description files); Class 2 integrity and authenticity of cyclic and acyclic traffic; Class 3 adds confidentiality.',
    standardStatus:
      'Class 2/3 use device certificates for start-up key negotiation and a MAC over cyclic frames (HMAC-SHA256 was the best performer, not finally selected).',
    cryptoLayers: [
      {
        layerName: 'Signed GSD files (Class 1)',
        mechanism: 'Digital signature over the device description file',
        threat: 'forgery',
        pqcPath: 'ML-DSA or LMS signatures on GSD files',
        notes: 'A forged GSD file misdescribes a device to the engineering tool.',
      },
      {
        layerName: 'Start-up key negotiation (Class 2/3)',
        mechanism: 'Device certificates authenticate a key exchange at connection set-up',
        threat: 'both',
        pqcPath: 'PQC certificates and KEM in the start-up exchange',
        notes: 'Happens once per connection, outside the cyclic real-time path.',
      },
      {
        layerName: 'Cyclic frame MAC (Class 2/3)',
        mechanism: 'Symmetric MAC per cyclic frame',
        threat: 'none',
        pqcPath: null,
        notes: 'Symmetric, so the real-time path needs no PQC change.',
      },
    ],
  },
  {
    id: 'modbus-tcp-security',
    name: 'Modbus/TCP Security',
    standard: 'Modbus Organization Modbus/TCP Security (2018), TCP port 802',
    sectors: ['manufacturing', 'water', 'energy', 'building'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Wraps Modbus in mutually authenticated TLS, with the user role carried in an X.509 extension. Plain Modbus (port 502) has no security at all.',
    standardStatus: 'TLS 1.2 or later with X.509; no PQC profile.',
    cryptoLayers: [
      {
        layerName: 'Mutual TLS',
        mechanism: 'TLS with ECDHE/RSA and X.509 role certificates',
        threat: 'both',
        pqcPath: 'Hybrid ML-KEM TLS 1.3 and ML-DSA certificates',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'key share',
        notes: 'Only where the Security variant is deployed — most installed Modbus is not.',
      },
      {
        layerName: 'Legacy Modbus (port 502)',
        mechanism: 'None',
        threat: 'no-crypto',
        pqcPath: 'Segment, or wrap in a PQC-ready tunnel / gateway',
        notes:
          'Forgeable today without any quantum computer. A present-day gap, not a PQC problem.',
      },
    ],
  },
  {
    id: 'bacnet-sc',
    name: 'BACnet Secure Connect',
    standard: 'ANSI/ASHRAE 135-2016 Addendum bj (BACnet/SC)',
    sectors: ['building'],
    transport: 'WebSocket/TLS',
    timingRequirement: null,
    description:
      'Building-automation datalink over TLS 1.3 WebSockets in a hub-and-spoke topology; every node holds a CA-signed operational certificate.',
    standardStatus:
      'TLS 1.3 with elliptic-curve cryptography only (128- or 256-bit security). No PQC option yet.',
    cryptoLayers: [
      {
        layerName: 'TLS 1.3 key exchange',
        mechanism: 'ECDHE',
        threat: 'hndl',
        pqcPath: 'Hybrid ML-KEM key exchange (X25519MLKEM768-style group)',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'key share',
        notes:
          'BACnet/SC already runs TLS 1.3, so a hybrid group is a stack update, not a protocol redesign.',
      },
      {
        layerName: 'Operational certificates',
        mechanism: 'X.509 with ECDSA',
        threat: 'forgery',
        pqcPath: 'ML-DSA operational certificates',
        classicalBytes: ECDSA_P256_SIG,
        pqcBytes: ML_DSA_44_SIG,
        sizeBasis: 'one signature',
        notes: 'A forged node certificate joins the hub as a trusted controller.',
      },
    ],
  },
  {
    id: 'dlms-cosem',
    name: 'DLMS/COSEM (suites 0/1/2)',
    standard: 'IEC 62056-5-3 · DLMS UA Blue Book',
    sectors: ['energy', 'water'],
    transport: 'PLC/RF',
    timingRequirement: null,
    description:
      'Metering application protocol. Suite 0: AES-GCM-128 only. Suite 1: ECDH/ECDSA P-256 + AES-GCM-128 + AES key wrap. Suite 2: P-384 + AES-GCM-256. None of the suites uses RSA. Fleet-scale meter key management is taught in the IoT module.',
    standardStatus: 'No PQC suite defined.',
    cryptoLayers: [
      {
        layerName: 'Data protection (all suites)',
        mechanism: 'AES-GCM-128 (suites 0/1) or AES-GCM-256 (suite 2)',
        threat: 'none',
        pqcPath: 'Prefer AES-256 for long-lived data',
        notes: 'Symmetric.',
      },
      {
        layerName: 'Key agreement (suites 1/2)',
        mechanism: 'ECDH P-256 (suite 1) or P-384 (suite 2); suite 0 has none',
        threat: 'hndl',
        pqcPath: 'ML-KEM once a suite defines it',
        classicalBytes: 33,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'compressed P-256 point → ML-KEM-768 ciphertext',
        notes: 'Suite 0 deployments have no public-key exposure at all.',
      },
      {
        layerName: 'Signatures (suites 1/2)',
        mechanism: 'ECDSA P-256 / P-384',
        threat: 'forgery',
        pqcPath: 'ML-DSA once a suite defines it',
        classicalBytes: ECDSA_P384_SIG,
        pqcBytes: ML_DSA_65_SIG,
        sizeBasis: 'one signature (ECDSA P-384 → ML-DSA-65)',
        notes: 'Used for authentication and signed data such as firmware images.',
      },
    ],
  },
  {
    id: 'ieee-2030-5',
    name: 'IEEE 2030.5 (DER)',
    standard: 'IEEE 2030.5 (Smart Energy Profile 2.0)',
    sectors: ['energy'],
    transport: 'TCP',
    timingRequirement: null,
    description:
      'Utility-to-DER protocol for inverters, batteries and EV chargers, with mandatory TLS and device certificates.',
    standardStatus:
      'TLS 1.2 with ECDHE-ECDSA P-256. Device certificates chain to the SERCA root through a manufacturer CA (not a utility CA).',
    cryptoLayers: [
      {
        layerName: 'TLS key exchange',
        mechanism: 'ECDHE P-256',
        threat: 'hndl',
        pqcPath: 'Hybrid ML-KEM TLS 1.3',
        classicalBytes: X25519_SHARE,
        pqcBytes: ML_KEM_768_CT,
        sizeBasis: 'key share',
        notes: 'Needs TLS 1.3 support first.',
      },
      {
        layerName: 'Device certificates (SERCA → manufacturer CA → device)',
        mechanism: 'ECDSA P-256',
        threat: 'forgery',
        pqcPath: 'PQC SERCA and manufacturer CAs, then device re-enrolment',
        classicalBytes: ECDSA_P256_SIG,
        pqcBytes: ML_DSA_44_SIG,
        sizeBasis: 'one signature',
        notes:
          'Device certificates are long-lived; a forged one impersonates an inverter to the utility.',
      },
    ],
  },
  {
    id: 'ptp-1588',
    name: 'IEEE 1588 PTP (power profile)',
    standard: 'IEEE 1588-2019 Annex P · IEC 61850-9-3',
    sectors: ['energy', 'manufacturing'],
    transport: 'Layer 2 multicast',
    timingRequirement: 'Sub-microsecond time alignment for SV and phasors',
    description:
      'Precision time for merging units and protection. Not NTS: NTS secures NTP, while PTP security is IEEE 1588-2019 Annex P.',
    standardStatus:
      'Annex P: (A) integrated authentication TLV with a shared group key or delayed (TESLA) keys, (B) external transport security such as MACsec or IPsec, (C) architecture guidance, (D) monitoring.',
    cryptoLayers: [
      {
        layerName: 'Integrated message authentication (Annex P prong A)',
        mechanism: 'Authentication TLV with a symmetric group key',
        threat: 'none',
        pqcPath: null,
        notes: 'Symmetric. Most installed PTP has no authentication at all — a present-day gap.',
      },
      {
        layerName: 'Group key distribution',
        mechanism: 'Out of band (e.g. GDOI or a management protocol)',
        threat: 'both',
        pqcPath: 'Same PQC fix as the GOOSE/SV KDC',
        notes:
          'The quantum exposure is wherever the group key is distributed with public-key crypto.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export const isQuantumExposed = (l: ProtocolCryptoLayer): boolean =>
  l.threat === 'forgery' || l.threat === 'hndl' || l.threat === 'both'

export const isForgeryExposed = (l: ProtocolCryptoLayer): boolean =>
  l.threat === 'forgery' || l.threat === 'both'

export const isHndlExposed = (l: ProtocolCryptoLayer): boolean =>
  l.threat === 'hndl' || l.threat === 'both'

export interface ProtocolExposureSummary {
  symmetricSafe: number
  forgery: number
  hndl: number
  noCrypto: number
}

export function summarizeProtocol(p: OTProtocol): ProtocolExposureSummary {
  return {
    symmetricSafe: p.cryptoLayers.filter((l) => l.threat === 'none').length,
    forgery: p.cryptoLayers.filter(isForgeryExposed).length,
    hndl: p.cryptoLayers.filter(isHndlExposed).length,
    noCrypto: p.cryptoLayers.filter((l) => l.threat === 'no-crypto').length,
  }
}

/** Does a protocol's real-time message path need any PQC change? */
export function realTimePathNeedsPqc(p: OTProtocol): boolean {
  return p.cryptoLayers.some(
    (l) => /per-message|cyclic frame|challenge-response/i.test(l.layerName) && isQuantumExposed(l)
  )
}
