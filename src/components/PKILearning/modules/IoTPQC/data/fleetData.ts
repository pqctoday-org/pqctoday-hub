// SPDX-License-Identifier: GPL-3.0-only
/**
 * Fleet key-rotation model for step 5 (Fleet Key Manager). Moved from the
 * Energy & Utilities module and generalised 2026-10-01.
 *
 * Fixes against the pre-split version:
 *  - The whole fleet was pushed through ONE shared channel, so a 2-million-meter
 *    rotation "took 38 days". Devices sit in many cells/collectors that run in
 *    parallel; the network time is per cell.
 *  - HSM ops/s were computed from the network duration (fleet ÷ duration), a
 *    circular number that could never show the HSM as the bottleneck. The HSM
 *    now has its own time (fleet × ops per device ÷ rating) and the rotation
 *    takes the longer of the two.
 *  - Security suite and rotation frequency were rendered but ignored. The suite
 *    now sets the classical baseline (and Suite 0 has no public-key exchange to
 *    migrate); the frequency sets the period the rotation must fit in.
 * Every output is a model estimate and is labelled so in the UI.
 */
import type {
  CommTechnology,
  FleetConfig,
  FleetProfile,
  HSMCapacity,
  PQCAlgorithm,
  RotationFrequency,
  SecuritySuite,
} from './fleetTypes'

export interface CommTechnologySpec {
  id: CommTechnology
  name: string
  /** rate the model uses for a key-update exchange (kbit/s) */
  modelKbps: number
  rateSource: string
  /** false when the link has no public-key key establishment at all */
  publicKeyCapable: boolean
  notes: string
}

export const COMM_TECHNOLOGIES: CommTechnologySpec[] = [
  {
    id: 'nb-iot',
    name: 'NB-IoT (Cat-NB1)',
    modelKbps: 26,
    rateSource: '3GPP TS 36.306 Cat-NB1 peak downlink ≈ 26 kbit/s (uplink up to 62.5 kbit/s)',
    publicKeyCapable: true,
    notes: 'The slower downlink carries the head-end’s ciphertext, so it sets the pace.',
  },
  {
    id: 'g3-plc',
    name: 'G3-PLC (CENELEC-A)',
    modelKbps: 34,
    rateSource: 'ITU-T G.9903 G3-PLC in the CENELEC-A band, ≈ 34 kbit/s peak PHY rate',
    publicKeyCapable: true,
    notes: 'Powerline: throughput falls with line noise and the number of repeaters.',
  },
  {
    id: 'wisun-fsk',
    name: 'Wi-SUN FAN 1.1 (FSK 150 kbit/s)',
    modelKbps: 150,
    rateSource: 'Wi-SUN FAN 1.1 FSK PHY modes span 50–300 kbit/s; OFDM modes reach 2.4 Mbit/s',
    publicKeyCapable: true,
    notes: 'Multi-hop mesh to a border router; each hop shares the channel.',
  },
  {
    id: 'lte-m',
    name: 'LTE-M (Cat-M1)',
    modelKbps: 1000,
    rateSource: '3GPP TS 36.306 Cat-M1 ≈ 1 Mbit/s peak',
    publicKeyCapable: true,
    notes: 'At this rate the KEM bytes stop mattering; the HSM becomes the limit.',
  },
  {
    id: 'lorawan',
    name: 'LoRaWAN 1.1',
    modelKbps: 5.47,
    rateSource: 'LoRa SF7/125 kHz ≈ 5.47 kbit/s',
    publicKeyCapable: false,
    notes:
      'No public-key key establishment over the air: LoRaWAN 1.1 derives session keys from AES-128 root keys at join. Rotation means re-join; a KEM would need several frames per exchange.',
  },
]

export interface PQCKEMSpec {
  id: PQCAlgorithm
  name: string
  ciphertextBytes: number
  publicKeyBytes: number
  nistLevel: number
}

/** FIPS 203 Table 3. */
export const PQC_KEM_SPECS: PQCKEMSpec[] = [
  { id: 'ml-kem-512', name: 'ML-KEM-512', ciphertextBytes: 768, publicKeyBytes: 800, nistLevel: 1 },
  {
    id: 'ml-kem-768',
    name: 'ML-KEM-768',
    ciphertextBytes: 1088,
    publicKeyBytes: 1184,
    nistLevel: 3,
  },
  {
    id: 'ml-kem-1024',
    name: 'ML-KEM-1024',
    ciphertextBytes: 1568,
    publicKeyBytes: 1568,
    nistLevel: 5,
  },
]

export interface SecuritySuiteSpec {
  id: SecuritySuite
  label: string
  /** bytes of one ephemeral public key in the classical exchange (0 = no public-key exchange) */
  classicalKeyBytes: number
  description: string
}

/** DLMS/COSEM security suites (DLMS UA Green Book / IEC 62056-5-3). */
export const SECURITY_SUITES: SecuritySuiteSpec[] = [
  {
    id: 'suite-0',
    label: 'Symmetric only (DLMS Suite 0: AES-GCM-128, AES key wrap)',
    classicalKeyBytes: 0,
    description:
      'New keys travel wrapped under a key-encryption key. There is no public-key exchange for Shor’s algorithm to break; the exposure is how the KEK was provisioned.',
  },
  {
    id: 'suite-1',
    label: 'ECDH/ECDSA P-256 (DLMS Suite 1: AES-GCM-128)',
    classicalKeyBytes: 64,
    description:
      'Ephemeral ECDH P-256 key agreement and ECDSA P-256 signatures — quantum-vulnerable.',
  },
  {
    id: 'suite-2',
    label: 'ECDH/ECDSA P-384 (DLMS Suite 2: AES-GCM-256)',
    classicalKeyBytes: 96,
    description: 'Same structure on P-384 — still quantum-vulnerable.',
  },
]

export interface FleetProfileSpec {
  id: FleetProfile
  name: string
  defaults: Pick<FleetConfig, 'fleetSize' | 'devicesPerCell' | 'commTechnology' | 'securitySuite'>
  dataLifetime: string
}

export const FLEET_PROFILES: FleetProfileSpec[] = [
  {
    id: 'smart-meter',
    name: 'Smart meters (AMI)',
    defaults: {
      fleetSize: 2_000_000,
      devicesPerCell: 1_000,
      commTechnology: 'g3-plc',
      securitySuite: 'suite-1',
    },
    dataLifetime:
      'Interval consumption data reveals when a home is occupied; meters stay installed 15+ years, so data harvested today is still sensitive when a quantum computer arrives.',
  },
  {
    id: 'tracker',
    name: 'Asset trackers',
    defaults: {
      fleetSize: 500_000,
      devicesPerCell: 2_000,
      commTechnology: 'lte-m',
      securitySuite: 'suite-1',
    },
    dataLifetime: 'Location history is personal data long after the shipment ends.',
  },
  {
    id: 'building-sensor',
    name: 'Building sensors',
    defaults: {
      fleetSize: 100_000,
      devicesPerCell: 500,
      commTechnology: 'wisun-fsk',
      securitySuite: 'suite-0',
    },
    dataLifetime: 'Occupancy and access patterns are useful to an attacker for years.',
  },
]

export const ROTATION_PERIOD_DAYS: Record<RotationFrequency, number> = {
  quarterly: 365 / 4,
  'semi-annual': 365 / 2,
  annual: 365,
}

/** Illustrative HSM ratings for one KEM encapsulation or one signature. Not a vendor figure. */
export const HSM_OPS_PER_SEC: Record<HSMCapacity, number> = {
  standard: 1_000,
  'high-throughput': 10_000,
}

/** Head-end HSM operations per device per rotation: one encapsulation + one signature on the key-update message. */
export const HSM_OPS_PER_DEVICE = 2
/** DLMS/COSEM framing, wrapped keys and addressing around one key-update exchange. Model. */
export const PROTOCOL_OVERHEAD_BYTES = 200
/** Share of the link rate left after retries, scheduling and contention. Model. */
export const LINK_UTILISATION = 0.6

export interface RotationResult {
  pqcBytesPerDevice: number
  classicalBytesPerDevice: number
  sizeMultiplier: number | null
  networkHoursPerCell: number
  classicalNetworkHoursPerCell: number
  hsmHours: number
  rotationHours: number
  bottleneck: 'network' | 'hsm'
  periodDays: number
  /** rotation time as a share of the rotation period */
  periodShare: number
  annualFleetGB: number
  cells: number
  publicKeyCapable: boolean
  suiteHasPublicKey: boolean
}

export function computeRotationPlan(config: FleetConfig): RotationResult {
  const kem = PQC_KEM_SPECS.find((k) => k.id === config.pqcAlgorithm) ?? PQC_KEM_SPECS[1]
  const comm = COMM_TECHNOLOGIES.find((c) => c.id === config.commTechnology) ?? COMM_TECHNOLOGIES[0]
  const suite = SECURITY_SUITES.find((s) => s.id === config.securitySuite) ?? SECURITY_SUITES[1]

  // device sends a fresh KEM public key, head-end returns the ciphertext
  const pqcBytesPerDevice = kem.publicKeyBytes + kem.ciphertextBytes + PROTOCOL_OVERHEAD_BYTES
  // ECDH: one ephemeral key each way; Suite 0: one AES-wrapped 128-bit key (24 B)
  const classicalBytesPerDevice =
    suite.classicalKeyBytes > 0
      ? 2 * suite.classicalKeyBytes + PROTOCOL_OVERHEAD_BYTES
      : 24 + PROTOCOL_OVERHEAD_BYTES

  const devicesPerCell = Math.max(1, Math.min(config.devicesPerCell, config.fleetSize))
  const cells = Math.ceil(config.fleetSize / devicesPerCell)
  const bps = comm.modelKbps * 1000 * LINK_UTILISATION
  const networkHoursPerCell = (devicesPerCell * pqcBytesPerDevice * 8) / bps / 3600
  const classicalNetworkHoursPerCell = (devicesPerCell * classicalBytesPerDevice * 8) / bps / 3600

  const hsmHours =
    (config.fleetSize * HSM_OPS_PER_DEVICE) / HSM_OPS_PER_SEC[config.hsmCapacity] / 3600
  const rotationHours = Math.max(networkHoursPerCell, hsmHours)
  const periodDays = ROTATION_PERIOD_DAYS[config.rotationFrequency]
  const rotationsPerYear = 365 / periodDays

  return {
    pqcBytesPerDevice,
    classicalBytesPerDevice,
    sizeMultiplier:
      suite.classicalKeyBytes > 0 ? pqcBytesPerDevice / classicalBytesPerDevice : null,
    networkHoursPerCell,
    classicalNetworkHoursPerCell,
    hsmHours,
    rotationHours,
    bottleneck: hsmHours > networkHoursPerCell ? 'hsm' : 'network',
    periodDays,
    periodShare: rotationHours / 24 / periodDays,
    annualFleetGB: (config.fleetSize * pqcBytesPerDevice * rotationsPerYear) / 1e9,
    cells,
    publicKeyCapable: comm.publicKeyCapable,
    suiteHasPublicKey: suite.classicalKeyBytes > 0,
  }
}

// ── DLMS/COSEM key types (reference table) ───────────────────────────────────

export interface DLMSKeyType {
  id: string
  name: string
  acronym: string
  description: string
}

export const DLMS_KEY_TYPES: DLMSKeyType[] = [
  {
    id: 'guek',
    name: 'Global Unicast Encryption Key',
    acronym: 'GUEK',
    description: 'AES-GCM key protecting application data between one meter and the head-end.',
  },
  {
    id: 'gak',
    name: 'Global Authentication Key',
    acronym: 'GAK',
    description: 'Enters the GCM authentication (additional data) of protected APDUs.',
  },
  {
    id: 'kek',
    name: 'Master Key (Key Encryption Key)',
    acronym: 'KEK',
    description:
      'Wraps the global keys when they are replaced (AES key wrap). Never sent in clear; its provisioning is the root of a Suite 0 system.',
  },
  {
    id: 'ecdsa',
    name: 'Signing and key-agreement key pairs',
    acronym: 'ECC',
    description:
      'Suite 1/2 only: ECDSA keys for signing and ECDH keys for key agreement, bound to certificates — the part a PQC migration replaces.',
  },
]
