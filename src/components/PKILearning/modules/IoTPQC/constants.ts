// SPDX-License-Identifier: GPL-3.0-only
/**
 * IoT & Embedded Device PQC — the single source of every number the module
 * shows. Learn prose, the workshop steps and the exercises all read from here
 * (or from utils/sizing.ts, which derives from here), so a figure cannot drift
 * between the text and the tool. Rewritten 2026-10-01 for the IoT/OT split.
 *
 * Three kinds of number live here, and the UI labels them differently:
 *  - EXACT sizes (keys, ciphertexts, signatures) from FIPS 203 Table 3,
 *    FIPS 204 Table 2, RFC 8554 §4-6, RFC 8391 §4 and the Falcon v1.2 spec.
 *    No label: they are the standard. IoTPQC.sizes.test.ts pins them to the
 *    hub's algorithm registry.
 *  - BENCHMARKS (stack bytes, cycles, code size) measured on an Arm Cortex-M4
 *    by a named source at a named commit/date. Always shown with that source.
 *  - MODELS (fit verdicts, handshake/chain/airtime sizes) computed from the two
 *    above. Always labelled "Model estimate".
 */

// ── Benchmark sources ────────────────────────────────────────────────────────

export type BenchSourceId = 'pqm4-2025' | 'pqm4-2021' | 'eprint-2020-470' | 'emill-p256'

export interface BenchSource {
  id: BenchSourceId
  label: string
  detail: string
  url: string
}

export const BENCH_SOURCES: Record<BenchSourceId, BenchSource> = {
  'pqm4-2025': {
    id: 'pqm4-2025',
    label: 'Cortex-M4, pqm4 @90bfb63 (2025-05-22)',
    detail:
      'mupq/pqm4 benchmarks.md at commit 90bfb630 (2025-05-22): average cycles and stack bytes on an Arm Cortex-M4; code size is the full scheme (.text).',
    url: 'https://github.com/mupq/pqm4/blob/90bfb630e53603b4e273a131cd09a025e51540a5/benchmarks.md',
  },
  'pqm4-2021': {
    id: 'pqm4-2021',
    label: 'Cortex-M4, pqm4 @33de42d (2021-09-06)',
    detail:
      'mupq/pqm4 benchmarks.md at commit 33de42d9 (2021-09-06), the last pqm4 run that still carried FrodoKEM-640 (SHAKE, m4 implementation).',
    url: 'https://github.com/mupq/pqm4/blob/33de42d9e965/benchmarks.md',
  },
  'eprint-2020-470': {
    id: 'eprint-2020-470',
    label: 'Cortex-M4, Campos et al., IACR ePrint 2020/470',
    detail:
      'LMS vs XMSS on an STM32F4DISCOVERY (Cortex-M4), SHA-256, w = 16, h = 10, reference implementations (Tables 10 and 12). Stack excludes key, message and signature buffers. The authors attribute the LMS/XMSS gap to the reference code, not the schemes.',
    url: 'https://eprint.iacr.org/2020/470',
  },
  'emill-p256': {
    id: 'emill-p256',
    label: 'Cortex-M4, Emill/P256-Cortex-M4 README (nRF52840, 2021)',
    detail:
      'Constant-time P-256 assembly library measured on an nRF52840 (Cortex-M4F, GCC -O2). Stack "at most 2 kB"; full library ≈8.9 kB.',
    url: 'https://github.com/Emill/P256-Cortex-M4',
  },
}

/** Clock used to turn cycles into time in every step. A model input, not a measurement. */
export const MODEL_MCU_HZ = 64_000_000

// ── Device classes (RFC 7228 §3 + draft-ietf-iotops-7228bis-10 Table 1) ─────

export interface DeviceClass {
  id: string
  name: string
  /** what the standard says, verbatim range */
  ramSpec: string
  flashSpec: string
  /** representative value the fit model uses (bytes) */
  ramBytes: number
  flashBytes: number
  definedIn: 'RFC 7228' | 'draft-ietf-iotops-7228bis'
  example: string
  description: string
}

const KIB = 1024

export const DEVICE_CLASSES: DeviceClass[] = [
  {
    id: 'class-0',
    name: 'Class 0',
    ramSpec: '≪ 10 KiB',
    flashSpec: '≪ 100 KiB',
    ramBytes: 2 * KIB,
    flashBytes: 32 * KIB,
    definedIn: 'RFC 7228',
    example: 'ATtiny-class sensor tags',
    description:
      'Too constrained to talk to the Internet securely on their own; they rely on a gateway or proxy. The model uses 2 KiB RAM / 32 KiB flash as a representative point inside "≪".',
  },
  {
    id: 'class-1',
    name: 'Class 1',
    ramSpec: '~ 10 KiB',
    flashSpec: '~ 100 KiB',
    ramBytes: 10 * KIB,
    flashBytes: 100 * KIB,
    definedIn: 'RFC 7228',
    example: 'STM32F103CB-class sensors, meters',
    description:
      'Can run a stack designed for constrained nodes (CoAP over UDP, OSCORE/EDHOC, DTLS) without a gateway, but must be frugal with RAM, code and energy.',
  },
  {
    id: 'class-2',
    name: 'Class 2',
    ramSpec: '~ 50 KiB',
    flashSpec: '~ 250 KiB',
    ramBytes: 50 * KIB,
    flashBytes: 250 * KIB,
    definedIn: 'RFC 7228',
    example: 'STM32F103RC-class gateways, controllers',
    description:
      'Fundamentally able to run most of the protocols a laptop uses, but still benefits from lightweight, energy-efficient protocols.',
  },
  {
    id: 'class-3',
    name: 'Class 3',
    ramSpec: '~ 100 KiB',
    flashSpec: '~ 500–1000 KiB',
    ramBytes: 100 * KIB,
    flashBytes: 500 * KIB,
    definedIn: 'draft-ietf-iotops-7228bis',
    example: 'STM32F103RG-class devices',
    description:
      'Added by the 7228bis draft (RFC 7228 stopped at Class 2). The model uses the lower end of the flash range.',
  },
  {
    id: 'class-4',
    name: 'Class 4',
    ramSpec: '~ 300–1000 KiB',
    flashSpec: '~ 1000–2000 KiB',
    ramBytes: 300 * KIB,
    flashBytes: 1000 * KIB,
    definedIn: 'draft-ietf-iotops-7228bis',
    example: 'STM32F745/767-class devices',
    description:
      'Added by the 7228bis draft: powerful enough to run interpreters and fuller network stacks. The model uses the lower end of both ranges.',
  },
]

// ── Algorithms: exact sizes + Cortex-M4 benchmarks ───────────────────────────

export type Op = 'keygen' | 'encaps' | 'decaps' | 'sign' | 'verify'
export type Build = 'stack' | 'speed'

export interface OpBench {
  /** stack bytes reported by the source (excludes caller-held buffers) */
  stackBytes: number
  /** average cycles reported by the source */
  cycles: number
}

export interface BuildBench {
  /** implementation name as the source reports it */
  impl: string
  source: BenchSourceId
  ops: Partial<Record<Op, OpBench>>
  /** full-scheme code size (bytes), when the source reports it */
  codeBytes?: number
  /** true when the source gives the figure as an upper bound or rounded value */
  approximate?: boolean
}

export interface ConstrainedAlgorithm {
  id: string
  name: string
  type: 'KEM' | 'Signature'
  status:
    'FIPS 203' | 'FIPS 204' | 'SP 800-208' | 'pre-standard' | 'classical' | 'not NIST-standard'
  nistLevel: number | null
  quantumSafe: boolean
  publicKeyBytes: number
  secretKeyBytes: number
  /** KEM ciphertext or signature bytes */
  outputBytes: number
  sizeSource: string
  builds: { stack: BuildBench; speed?: BuildBench }
  stateful?: boolean
  notes: string
}

export const CONSTRAINED_ALGORITHMS: ConstrainedAlgorithm[] = [
  // ── KEMs ──
  {
    id: 'ecdh-p256',
    name: 'ECDH P-256',
    type: 'KEM',
    status: 'classical',
    nistLevel: null,
    quantumSafe: false,
    publicKeyBytes: 64,
    secretKeyBytes: 32,
    outputBytes: 64,
    sizeSource: 'SEC 1 (uncompressed point without the 0x04 prefix)',
    builds: {
      stack: {
        impl: 'P256-Cortex-M4',
        source: 'emill-p256',
        ops: {
          keygen: { stackBytes: 2048, cycles: 327_000 },
          decaps: { stackBytes: 2048, cycles: 906_000 },
        },
        codeBytes: 8_900,
        approximate: true,
      },
    },
    notes:
      'Classical baseline (the ECDH key agreement inside DTLS, EDHOC, BLE and Matter today). "decaps" here is the shared-secret computation. Broken by Shor’s algorithm.',
  },
  {
    id: 'ml-kem-512',
    name: 'ML-KEM-512',
    type: 'KEM',
    status: 'FIPS 203',
    nistLevel: 1,
    quantumSafe: true,
    publicKeyBytes: 800,
    secretKeyBytes: 1632,
    outputBytes: 768,
    sizeSource: 'FIPS 203 Table 3',
    builds: {
      stack: {
        impl: 'm4fstack',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 2_300, cycles: 392_224 },
          encaps: { stackBytes: 2_348, cycles: 392_864 },
          decaps: { stackBytes: 2_332, cycles: 430_202 },
        },
        codeBytes: 13_328,
      },
      speed: {
        impl: 'm4fspeed',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 4_372, cycles: 392_423 },
          encaps: { stackBytes: 5_436, cycles: 390_881 },
          decaps: { stackBytes: 5_412, cycles: 428_167 },
        },
        codeBytes: 15_848,
      },
    },
    notes: 'Smallest FIPS 203 parameter set (NIST category 1).',
  },
  {
    id: 'ml-kem-768',
    name: 'ML-KEM-768',
    type: 'KEM',
    status: 'FIPS 203',
    nistLevel: 3,
    quantumSafe: true,
    publicKeyBytes: 1184,
    secretKeyBytes: 2400,
    outputBytes: 1088,
    sizeSource: 'FIPS 203 Table 3',
    builds: {
      stack: {
        impl: 'm4fstack',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 2_820, cycles: 644_195 },
          encaps: { stackBytes: 2_860, cycles: 664_654 },
          decaps: { stackBytes: 2_844, cycles: 714_194 },
        },
        codeBytes: 13_320,
      },
      speed: {
        impl: 'm4fspeed',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 5_396, cycles: 642_096 },
          encaps: { stackBytes: 6_468, cycles: 658_754 },
          decaps: { stackBytes: 6_452, cycles: 707_827 },
        },
        codeBytes: 16_016,
      },
    },
    notes: 'The parameter set inside the X25519MLKEM768 hybrid most TLS stacks deploy.',
  },
  {
    id: 'ml-kem-1024',
    name: 'ML-KEM-1024',
    type: 'KEM',
    status: 'FIPS 203',
    nistLevel: 5,
    quantumSafe: true,
    publicKeyBytes: 1568,
    secretKeyBytes: 3168,
    outputBytes: 1568,
    sizeSource: 'FIPS 203 Table 3',
    builds: {
      stack: {
        impl: 'm4fstack',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 3_332, cycles: 1_020_202 },
          encaps: { stackBytes: 3_372, cycles: 1_037_953 },
          decaps: { stackBytes: 3_356, cycles: 1_100_982 },
        },
        codeBytes: 14_016,
      },
      speed: {
        impl: 'm4fspeed',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 6_436, cycles: 1_018_976 },
          encaps: { stackBytes: 7_500, cycles: 1_031_565 },
          decaps: { stackBytes: 7_484, cycles: 1_094_008 },
        },
        codeBytes: 16_916,
      },
    },
    notes: 'NIST category 5; the CNSA 2.0 key-establishment choice for national security systems.',
  },
  {
    id: 'frodokem-640',
    name: 'FrodoKEM-640',
    type: 'KEM',
    status: 'not NIST-standard',
    nistLevel: 1,
    quantumSafe: true,
    publicKeyBytes: 9616,
    secretKeyBytes: 19888,
    outputBytes: 9752,
    sizeSource: 'FrodoKEM specification (hub algorithm registry)',
    builds: {
      stack: {
        impl: 'frodokem640shake m4',
        source: 'pqm4-2021',
        ops: {
          keygen: { stackBytes: 26_408, cycles: 77_984_424 },
          encaps: { stackBytes: 51_784, cycles: 78_893_964 },
          decaps: { stackBytes: 72_408, cycles: 78_341_812 },
        },
        codeBytes: 8_644,
      },
    },
    notes:
      'Conservative unstructured-lattice KEM: not selected by NIST, but recommended by BSI and in ISO/IEC standardisation. Its ~10 KB keys and ciphertexts dominate any constrained link.',
  },
  // ── Signatures ──
  {
    id: 'ecdsa-p256',
    name: 'ECDSA P-256',
    type: 'Signature',
    status: 'classical',
    nistLevel: null,
    quantumSafe: false,
    publicKeyBytes: 64,
    secretKeyBytes: 32,
    outputBytes: 64,
    sizeSource: 'FIPS 186-5 / SEC 1',
    builds: {
      stack: {
        impl: 'P256-Cortex-M4',
        source: 'emill-p256',
        ops: {
          keygen: { stackBytes: 2048, cycles: 327_000 },
          sign: { stackBytes: 2048, cycles: 375_000 },
          verify: { stackBytes: 2048, cycles: 976_000 },
        },
        codeBytes: 8_900,
        approximate: true,
      },
    },
    notes:
      'Classical baseline for firmware, DTLS, Matter (DAC/CASE) and BLE. Broken by Shor’s algorithm.',
  },
  {
    id: 'lms-h10-w4',
    name: 'LMS (H10/W4)',
    type: 'Signature',
    status: 'SP 800-208',
    nistLevel: null,
    quantumSafe: true,
    publicKeyBytes: 60,
    secretKeyBytes: 64,
    outputBytes: 2512,
    sizeSource:
      'RFC 8554 §5-6: LMS 56 B key / 2,508 B signature; as HSS with L = 1 (what SP 800-208 and COSE carry) 60 B / 2,512 B',
    stateful: true,
    builds: {
      stack: {
        impl: 'cisco/hash-sigs reference, SHA-256',
        source: 'eprint-2020-470',
        ops: {
          keygen: { stackBytes: 3_780, cycles: 3_774_882_103 },
          sign: { stackBytes: 2_460, cycles: 3_791_157_911 },
          verify: { stackBytes: 1_044, cycles: 2_658_884 },
        },
      },
    },
    notes:
      'Stateful hash-based signature: the signer must never reuse a leaf (1,024 signatures for H10). Verification is only hashing. The reference signer in this benchmark regenerates the tree for each signature; production signers cache it.',
  },
  {
    id: 'xmss-h10',
    name: 'XMSS (SHA2_10_256)',
    type: 'Signature',
    status: 'SP 800-208',
    nistLevel: null,
    quantumSafe: true,
    publicKeyBytes: 68,
    secretKeyBytes: 132,
    outputBytes: 2500,
    sizeSource: 'RFC 8391 §4 (XMSS-SHA2_10_256: 68 B public key, 2,500 B signature)',
    stateful: true,
    builds: {
      stack: {
        impl: 'xmss-reference (RFC 8391, "robust"), SHA-256',
        source: 'eprint-2020-470',
        ops: {
          keygen: { stackBytes: 4_400, cycles: 23_631_706_453 },
          sign: { stackBytes: 4_288, cycles: 23_642_038_600 },
          verify: { stackBytes: 3_896, cycles: 13_071_813 },
        },
      },
    },
    notes:
      'Stateful like LMS. The RFC 8391 (robust) reference verifier is ~4.9× slower than LMS in this benchmark; an unstandardised "simple" variant narrows that to 1.3–1.6×. The private-key size shown is the compact form; working state is larger.',
  },
  {
    id: 'fn-dsa-512',
    name: 'FN-DSA-512 (Falcon-512)',
    type: 'Signature',
    status: 'pre-standard',
    nistLevel: 1,
    quantumSafe: true,
    publicKeyBytes: 897,
    secretKeyBytes: 1281,
    outputBytes: 666,
    sizeSource:
      'Falcon v1.2 specification, padded (fixed-length) signature format — FIPS 206 is not yet published',
    builds: {
      stack: {
        impl: 'fndsa_provisional-512 m4f',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 14_348, cycles: 67_693_338 },
          sign: { stackBytes: 41_952, cycles: 22_469_685 },
          verify: { stackBytes: 2_976, cycles: 396_949 },
        },
        codeBytes: 103_789,
      },
    },
    notes:
      'Smallest lattice signature and the fastest verifier here — but signing needs ~42 KB of stack and floating-point-heavy code (~104 KB for the full scheme). Verify on the device, sign elsewhere.',
  },
  {
    id: 'ml-dsa-44',
    name: 'ML-DSA-44',
    type: 'Signature',
    status: 'FIPS 204',
    nistLevel: 2,
    quantumSafe: true,
    publicKeyBytes: 1312,
    secretKeyBytes: 2560,
    outputBytes: 2420,
    sizeSource: 'FIPS 204 Table 2',
    builds: {
      stack: {
        impl: 'm4fstack',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 4_408, cycles: 1_799_062 },
          sign: { stackBytes: 5_080, cycles: 12_134_284 },
          verify: { stackBytes: 2_712, cycles: 3_242_333 },
        },
        codeBytes: 24_844,
      },
      speed: {
        impl: 'm4f',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 38_296, cycles: 1_426_025 },
          sign: { stackBytes: 44_816, cycles: 3_943_121 },
          verify: { stackBytes: 8_912, cycles: 1_421_623 },
        },
        codeBytes: 19_592,
      },
    },
    notes:
      'Stateless lattice signature. Signing time varies widely run to run (rejection sampling).',
  },
  {
    id: 'ml-dsa-65',
    name: 'ML-DSA-65',
    type: 'Signature',
    status: 'FIPS 204',
    nistLevel: 3,
    quantumSafe: true,
    publicKeyBytes: 1952,
    secretKeyBytes: 4032,
    outputBytes: 3309,
    sizeSource: 'FIPS 204 Table 2',
    builds: {
      stack: {
        impl: 'm4fstack',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 4_408, cycles: 3_412_622 },
          sign: { stackBytes: 6_616, cycles: 24_421_526 },
          verify: { stackBytes: 2_712, cycles: 5_732_397 },
        },
        codeBytes: 24_120,
      },
      speed: {
        impl: 'm4f',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 60_824, cycles: 2_516_006 },
          sign: { stackBytes: 68_872, cycles: 6_193_171 },
          verify: { stackBytes: 9_888, cycles: 2_415_944 },
        },
        codeBytes: 19_328,
      },
    },
    notes: 'NIST category 3.',
  },
  {
    id: 'ml-dsa-87',
    name: 'ML-DSA-87',
    type: 'Signature',
    status: 'FIPS 204',
    nistLevel: 5,
    quantumSafe: true,
    publicKeyBytes: 2592,
    secretKeyBytes: 4896,
    outputBytes: 4627,
    sizeSource: 'FIPS 204 Table 2',
    builds: {
      stack: {
        impl: 'm4fstack',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 4_408, cycles: 5_820_537 },
          sign: { stackBytes: 8_144, cycles: 33_357_899 },
          verify: { stackBytes: 2_720, cycles: 9_911_514 },
        },
        codeBytes: 24_516,
      },
      speed: {
        impl: 'm4f',
        source: 'pqm4-2025',
        ops: {
          keygen: { stackBytes: 97_688, cycles: 4_275_859 },
          sign: { stackBytes: 107_892, cycles: 7_947_380 },
          verify: { stackBytes: 12_060, cycles: 4_193_104 },
        },
        codeBytes: 19_500,
      },
    },
    notes:
      'NIST category 5 — the only ML-DSA parameter set CNSA 2.0 accepts for national security systems.',
  },
]

export function algorithmById(id: string): ConstrainedAlgorithm {
  const a = CONSTRAINED_ALGORITHMS.find((x) => x.id === id)
  if (!a) throw new Error(`IoTPQC: unknown algorithm id ${id}`)
  return a
}

// ── Constrained protocols (Learn: constrained-protocols) ─────────────────────

export interface IoTProtocol {
  name: string
  layer: string
  /** the size limit that actually matters for PQC on this protocol */
  sizeFact: string
  publicKeyCrypto: string
  pqcPath: string
  status: 'fragment' | 'carry' | 'symmetric' | 'spec-change'
}

export const IOT_PROTOCOLS: IoTProtocol[] = [
  {
    name: 'CoAP + DTLS 1.3 (RFC 7252, RFC 9147, RFC 7925 profile)',
    layer: 'UDP over 6LoWPAN / IPv6',
    sizeFact:
      'IPv6 minimum MTU 1,280 B; an IEEE 802.15.4 frame is 127 B with ~80 B left for payload once link security is on (7228bis S1).',
    publicKeyCrypto: 'ECDHE + ECDSA certificates or raw public keys (RFC 7250)',
    pqcPath: 'Hybrid or ML-KEM key share and ML-DSA certificates — every flight fragments.',
    status: 'fragment',
  },
  {
    name: 'EDHOC (RFC 9528) + OSCORE (RFC 8613)',
    layer: 'CoAP payload (no record layer)',
    sizeFact:
      'Three messages; credentials can be sent by reference (a key identifier) so no certificate crosses the air.',
    publicKeyCrypto: 'ECDH (X25519 / P-256) with signature or static-DH authentication',
    pqcPath:
      'draft-ietf-lake-pqsuites: ML-KEM key in message_1, ciphertext in message_2, ML-DSA signatures.',
    status: 'carry',
  },
  {
    name: 'MQTT 5.0 over TLS 1.3',
    layer: 'TCP',
    sizeFact:
      'Maximum packet size 268,435,455 B (variable-length integer); TCP segments any TLS flight.',
    publicKeyCrypto: 'TLS 1.3 (ECDHE + certificates)',
    pqcPath:
      'Same as web TLS: X25519MLKEM768 today, ML-DSA certificates later. Size is a bandwidth cost, not a limit.',
    status: 'carry',
  },
  {
    name: 'LwM2M 1.2 (OMA) over DTLS or OSCORE',
    layer: 'CoAP',
    sizeFact: 'Inherits CoAP/DTLS fragmentation; bootstrap can use EST-coaps (RFC 9148).',
    publicKeyCrypto: 'PSK, raw public key or certificate modes',
    pqcPath: 'Follows the DTLS 1.3 or EDHOC path underneath; PSK mode has no Shor exposure.',
    status: 'fragment',
  },
  {
    name: 'Matter (CSA)',
    layer: 'IPv6 over Thread / Wi-Fi; BLE for commissioning',
    sizeFact: 'Messages ride IPv6 (1,280 B minimum MTU); commissioning starts over BLE.',
    publicKeyCrypto:
      'PASE (SPAKE2+ on P-256, setup passcode) then CASE (Sigma with ECDSA P-256 + ECDH); DAC → PAI → PAA attestation chain',
    pqcPath:
      'Needs a specification revision: new CASE suites and PQC device-attestation certificates.',
    status: 'spec-change',
  },
  {
    name: 'Bluetooth Mesh (Mesh Protocol 1.1)',
    layer: 'BLE advertising (PB-ADV) or GATT',
    sizeFact:
      'A provisioning transaction is split into 20 B + 23 B segments, at most 64 segments (1,469 B).',
    publicKeyCrypto:
      'ECDH P-256 provisioning with OOB authentication; 1.1 adds certificate-based provisioning (X.509 device certificates)',
    pqcPath:
      'No PQC provisioning algorithm is defined; a FIPS 203 key would need tens of segments.',
    status: 'spec-change',
  },
  {
    name: 'LoRaWAN 1.1',
    layer: 'LoRa PHY (sub-GHz LPWAN)',
    sizeFact:
      'Application payload 51–222 B per uplink depending on data rate (EU868), with duty-cycle limits.',
    publicKeyCrypto:
      'None over the air: AES-128 root keys (AppKey/NwkKey) and AES-CMAC/CTR session keys',
    pqcPath:
      'The air interface is symmetric and not exposed to Shor. The quantum exposure is the backend: join-server and network-server TLS, and how root keys are provisioned.',
    status: 'symmetric',
  },
]

// ── Device types used by the firmware step ───────────────────────────────────

export interface IoTDeviceType {
  id: string
  name: string
  deviceClassIdx: number
  firmwareKB: number
  link: string
  /** downlink rate used for the firmware-delivery estimate (kbit/s) */
  downlinkKbps: number
  linkSource: string
}

export const IOT_DEVICE_TYPES: IoTDeviceType[] = [
  {
    id: 'smart-meter',
    name: 'Smart meter',
    deviceClassIdx: 2,
    firmwareKB: 256,
    link: 'NB-IoT (Cat-NB1)',
    downlinkKbps: 26,
    linkSource: '3GPP TS 36.306 Cat-NB1 peak downlink (~26 kbit/s)',
  },
  {
    id: 'env-sensor',
    name: 'Environmental sensor',
    deviceClassIdx: 1,
    firmwareKB: 96,
    link: 'Wi-SUN FAN 1.1 FSK',
    downlinkKbps: 150,
    linkSource: 'Wi-SUN FAN 1.1 FSK PHY mode (50–300 kbit/s); 150 kbit/s chosen',
  },
  {
    id: 'medical-wearable',
    name: 'Medical wearable',
    deviceClassIdx: 2,
    firmwareKB: 192,
    link: 'BLE 1M PHY',
    downlinkKbps: 1000,
    linkSource: 'Bluetooth LE 1M PHY symbol rate (1 Mbit/s); real throughput is lower',
  },
  {
    id: 'edge-gateway',
    name: 'Edge gateway',
    deviceClassIdx: 4,
    firmwareKB: 8192,
    link: 'Ethernet',
    downlinkKbps: 100_000,
    linkSource: '100 Mbit/s Ethernet',
  },
]

// ── Firmware-signing algorithms (step 2) ─────────────────────────────────────

export type FirmwareExecution = 'live-mldsa' | 'live-hss' | 'size-only'

export interface FirmwareAlgorithm {
  id: string
  /** id in CONSTRAINED_ALGORITHMS for sizes and verify benchmark */
  algId: string
  execution: FirmwareExecution
  mldsaVariant?: 44 | 65 | 87
  /** COSE algorithm identifier, or null when none is registered */
  coseAlg: number | null
  coseSource: string
  /** CNSA 2.0 acceptability for national-security-system firmware signing */
  cnsa2: 'allowed' | 'not-allowed'
  simulatedLabel?: string
}

export const FIRMWARE_ALGORITHMS: FirmwareAlgorithm[] = [
  {
    id: 'lms',
    algId: 'lms-h10-w4',
    execution: 'live-hss',
    coseAlg: -46,
    coseSource: 'RFC 8778 (HSS-LMS)',
    cnsa2: 'allowed',
  },
  {
    id: 'xmss',
    algId: 'xmss-h10',
    execution: 'size-only',
    coseAlg: null,
    coseSource: 'no COSE algorithm registered in this module’s sources',
    cnsa2: 'allowed',
    simulatedLabel: 'Simulated — sizes per RFC 8391, no signature computed',
  },
  {
    id: 'ml-dsa-44',
    algId: 'ml-dsa-44',
    execution: 'live-mldsa',
    mldsaVariant: 44,
    coseAlg: -48,
    coseSource: 'RFC 9964 (ML-DSA for JOSE and COSE)',
    cnsa2: 'not-allowed',
  },
  {
    id: 'ml-dsa-65',
    algId: 'ml-dsa-65',
    execution: 'live-mldsa',
    mldsaVariant: 65,
    coseAlg: -49,
    coseSource: 'RFC 9964 (ML-DSA for JOSE and COSE)',
    cnsa2: 'not-allowed',
  },
  {
    id: 'ml-dsa-87',
    algId: 'ml-dsa-87',
    execution: 'live-mldsa',
    mldsaVariant: 87,
    coseAlg: -50,
    coseSource: 'RFC 9964 (ML-DSA for JOSE and COSE)',
    cnsa2: 'allowed',
  },
  {
    id: 'fn-dsa-512',
    algId: 'fn-dsa-512',
    execution: 'size-only',
    coseAlg: null,
    coseSource: 'draft-ietf-cose-falcon (value not yet assigned)',
    cnsa2: 'not-allowed',
    simulatedLabel: 'Simulated — sizes per Falcon v1.2 (FIPS 206 not final), no signature computed',
  },
  {
    id: 'ecdsa-p256',
    algId: 'ecdsa-p256',
    execution: 'size-only',
    coseAlg: -7,
    coseSource: 'RFC 9053 (ES256)',
    cnsa2: 'not-allowed',
    simulatedLabel: 'Classical baseline — sizes only, no signature computed',
  },
]

/** Bytes the SUIT envelope + COSE_Sign1 add on top of the signature itself. Model estimate. */
export const SUIT_COSE_OVERHEAD_BYTES = 56

/** RFC 8554 H10: one LMS key signs at most 2^10 firmware images. */
export const LMS_H10_SIGNATURES = 1 << 10
