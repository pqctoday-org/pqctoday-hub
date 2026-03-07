// SPDX-License-Identifier: GPL-3.0-only

import type { CommTechnology, PQCAlgorithm, SmartMeterFleetConfig } from './energyConstants'

// ---------------------------------------------------------------------------
// Communication technology specifications
// ---------------------------------------------------------------------------

export interface CommTechnologySpec {
  id: CommTechnology
  name: string
  bandwidthKbps: number
  coverage: string
  reliability: string
  pqcFeasibility: 'good' | 'challenging' | 'problematic'
  notes: string
}

export const COMM_TECHNOLOGIES: CommTechnologySpec[] = [
  {
    id: 'nb-iot',
    name: 'NB-IoT',
    bandwidthKbps: 62.5,
    coverage: 'Wide (cellular)',
    reliability: 'High',
    pqcFeasibility: 'challenging',
    notes: 'Narrowband IoT. 62.5 kbps uplink. PQC key exchange feasible but slow at scale.',
  },
  {
    id: 'plc',
    name: 'Powerline Communication (PLC)',
    bandwidthKbps: 100,
    coverage: 'Utility lines',
    reliability: 'Medium (noise-sensitive)',
    pqcFeasibility: 'challenging',
    notes: 'Signal travels over power lines. 10-200 kbps. Noise from equipment affects throughput.',
  },
  {
    id: 'rf-mesh',
    name: 'RF Mesh',
    bandwidthKbps: 200,
    coverage: 'Medium (line-of-sight)',
    reliability: 'Medium',
    pqcFeasibility: 'challenging',
    notes: 'Multi-hop radio mesh. 100-250 kbps. Latency increases with hop count.',
  },
  {
    id: 'cellular',
    name: 'Cellular (4G/5G)',
    bandwidthKbps: 5000,
    coverage: 'Wide',
    reliability: 'High',
    pqcFeasibility: 'good',
    notes: 'Highest bandwidth. PQC key exchange overhead is negligible at cellular speeds.',
  },
]

// ---------------------------------------------------------------------------
// PQC algorithm key exchange sizes
// ---------------------------------------------------------------------------

export interface PQCKEMSpec {
  id: PQCAlgorithm
  name: string
  ciphertextBytes: number
  publicKeyBytes: number
  sharedSecretBytes: number
  nistLevel: number
}

export const PQC_KEM_SPECS: PQCKEMSpec[] = [
  {
    id: 'ml-kem-512',
    name: 'ML-KEM-512',
    ciphertextBytes: 768,
    publicKeyBytes: 800,
    sharedSecretBytes: 32,
    nistLevel: 1,
  },
  {
    id: 'ml-kem-768',
    name: 'ML-KEM-768',
    ciphertextBytes: 1088,
    publicKeyBytes: 1184,
    sharedSecretBytes: 32,
    nistLevel: 3,
  },
  {
    id: 'ml-kem-1024',
    name: 'ML-KEM-1024',
    ciphertextBytes: 1568,
    publicKeyBytes: 1568,
    sharedSecretBytes: 32,
    nistLevel: 5,
  },
]

// Classical comparison
export const CLASSICAL_ECDH_SIZE = 33 // ECDH P-256 compressed public key

// ---------------------------------------------------------------------------
// DLMS/COSEM key types
// ---------------------------------------------------------------------------

export interface DLMSKeyType {
  id: string
  name: string
  acronym: string
  description: string
  rotationFrequency: string
}

export const DLMS_KEY_TYPES: DLMSKeyType[] = [
  {
    id: 'gek',
    name: 'Global Encryption Key',
    acronym: 'GEK',
    description: 'Encrypts all application-layer data between meter and head-end.',
    rotationFrequency: 'Annually',
  },
  {
    id: 'gak',
    name: 'Global Authentication Key',
    acronym: 'GAK',
    description: 'Authenticates application-layer messages (GMAC tag generation).',
    rotationFrequency: 'Annually',
  },
  {
    id: 'kek',
    name: 'Key Encryption Key',
    acronym: 'KEK',
    description: 'Wraps GEK/GAK during key transport. Never transmitted in cleartext.',
    rotationFrequency: 'On provisioning or compromise',
  },
  {
    id: 'hls',
    name: 'HLS Secret',
    acronym: 'HLS',
    description: 'High-Level Security authentication secret for meter login.',
    rotationFrequency: 'On provisioning',
  },
]

// ---------------------------------------------------------------------------
// Rotation calculation helpers
// ---------------------------------------------------------------------------

export interface RotationZone {
  id: string
  name: string
  meterCount: number
  startDay: number
  endDay: number
  dataGB: number
}

export interface RotationResult {
  totalDataGB: number
  rotationDurationHours: number
  hsmOpsPerSecond: number
  classicalDataGB: number
  classicalDurationHours: number
  sizeMultiplier: string
  zones: RotationZone[]
}

export function computeRotationPlan(config: SmartMeterFleetConfig): RotationResult {
  const kemSpec = PQC_KEM_SPECS.find((k) => k.id === config.pqcAlgorithm)!
  const commSpec = COMM_TECHNOLOGIES.find((c) => c.id === config.commTechnology)!

  // Protocol overhead: ~200 bytes per DLMS/COSEM key exchange frame
  const protocolOverhead = 200

  // PQC key exchange data per meter (ciphertext + public key + overhead)
  const pqcBytesPerMeter = kemSpec.ciphertextBytes + kemSpec.publicKeyBytes + protocolOverhead
  const classicalBytesPerMeter = CLASSICAL_ECDH_SIZE * 2 + protocolOverhead // pub key + response

  const totalPQCBytes = config.fleetSize * pqcBytesPerMeter
  const totalClassicalBytes = config.fleetSize * classicalBytesPerMeter

  const totalDataGB = totalPQCBytes / (1024 * 1024 * 1024)
  const classicalDataGB = totalClassicalBytes / (1024 * 1024 * 1024)

  // Effective bandwidth: 60% utilization factor (retries, scheduling, contention)
  const effectiveBandwidthBps = commSpec.bandwidthKbps * 1000 * 0.6

  const rotationDurationHours = (totalPQCBytes * 8) / effectiveBandwidthBps / 3600
  const classicalDurationHours = (totalClassicalBytes * 8) / effectiveBandwidthBps / 3600

  // HSM operations per second needed to complete within rotation duration
  const rotationSeconds = rotationDurationHours * 3600
  const hsmOpsPerSecond = rotationSeconds > 0 ? Math.ceil(config.fleetSize / rotationSeconds) : 0

  const sizeMultiplier = (pqcBytesPerMeter / classicalBytesPerMeter).toFixed(1)

  // Generate 4 geographic zones for staggered rotation
  const zoneCount = 4
  const metersPerZone = Math.ceil(config.fleetSize / zoneCount)
  const daysTotal = Math.ceil(rotationDurationHours / 24)
  const daysPerZone = Math.ceil(daysTotal / zoneCount)

  const zones: RotationZone[] = Array.from({ length: zoneCount }, (_, i) => ({
    id: `zone-${i + 1}`,
    name: `Zone ${i + 1}${i === 0 ? ' (Urban Core)' : i === 1 ? ' (Suburban)' : i === 2 ? ' (Rural)' : ' (Remote)'}`,
    meterCount:
      i < zoneCount - 1 ? metersPerZone : config.fleetSize - metersPerZone * (zoneCount - 1),
    startDay: i * daysPerZone,
    endDay: (i + 1) * daysPerZone,
    dataGB: totalDataGB / zoneCount,
  }))

  return {
    totalDataGB,
    rotationDurationHours,
    hsmOpsPerSecond,
    classicalDataGB,
    classicalDurationHours,
    sizeMultiplier,
    zones,
  }
}
