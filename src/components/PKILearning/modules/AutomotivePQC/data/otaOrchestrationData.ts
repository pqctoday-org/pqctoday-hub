// SPDX-License-Identifier: GPL-3.0-only
import type { ASILLevel, UpdateStrategy } from './automotiveConstants'

// ---------------------------------------------------------------------------
// OTA Campaign ECU Targets
// ---------------------------------------------------------------------------

export interface OTACampaignTarget {
  ecuId: string
  ecuName: string
  zone: string
  firmwareSizeMB: number
  updateStrategy: UpdateStrategy
  dependencies: string[]
  asilLevel: ASILLevel
  rollbackSupported: boolean
  updateTimeMinutes: number
}

export const DEFAULT_CAMPAIGN_TARGETS: OTACampaignTarget[] = [
  {
    ecuId: 'gw',
    ecuName: 'Gateway ECU',
    zone: 'Connectivity',
    firmwareSizeMB: 32,
    updateStrategy: 'ab-partition',
    dependencies: [],
    asilLevel: 'B',
    rollbackSupported: true,
    updateTimeMinutes: 15,
  },
  {
    ecuId: 'tcu',
    ecuName: 'Telematics Control Unit',
    zone: 'Connectivity',
    firmwareSizeMB: 64,
    updateStrategy: 'ab-partition',
    dependencies: ['gw'],
    asilLevel: 'QM',
    rollbackSupported: true,
    updateTimeMinutes: 20,
  },
  {
    ecuId: 'adas-main',
    ecuName: 'ADAS Main Controller',
    zone: 'ADAS',
    firmwareSizeMB: 256,
    updateStrategy: 'ab-partition',
    dependencies: ['gw'],
    asilLevel: 'D',
    rollbackSupported: true,
    updateTimeMinutes: 45,
  },
  {
    ecuId: 'ivi',
    ecuName: 'Infotainment Head Unit',
    zone: 'Infotainment',
    firmwareSizeMB: 512,
    updateStrategy: 'ab-partition',
    dependencies: ['gw'],
    asilLevel: 'QM',
    rollbackSupported: true,
    updateTimeMinutes: 30,
  },
  {
    ecuId: 'bms',
    ecuName: 'Battery Management System',
    zone: 'Powertrain',
    firmwareSizeMB: 16,
    updateStrategy: 'differential',
    dependencies: ['gw'],
    asilLevel: 'C',
    rollbackSupported: true,
    updateTimeMinutes: 10,
  },
  {
    ecuId: 'bcm',
    ecuName: 'Body Control Module',
    zone: 'Body',
    firmwareSizeMB: 8,
    updateStrategy: 'full-image',
    dependencies: ['gw'],
    asilLevel: 'A',
    rollbackSupported: false,
    updateTimeMinutes: 8,
  },
]

// ---------------------------------------------------------------------------
// Signature Overhead Comparison
// ---------------------------------------------------------------------------

export interface SignatureOverhead {
  algorithm: string
  signatureBytes: number
  publicKeyBytes: number
  /** Number of signatures per firmware package (manifest + each block) */
  signaturesPerPackage: number
  totalOverheadKB: number
}

export const SIGNATURE_OVERHEADS: SignatureOverhead[] = [
  {
    algorithm: 'ECDSA P-256',
    signatureBytes: 64,
    publicKeyBytes: 33,
    signaturesPerPackage: 32,
    totalOverheadKB: 3.1,
  },
  {
    algorithm: 'RSA-2048',
    signatureBytes: 256,
    publicKeyBytes: 256,
    signaturesPerPackage: 32,
    totalOverheadKB: 16.4,
  },
  {
    algorithm: 'ML-DSA-44',
    signatureBytes: 2420,
    publicKeyBytes: 1312,
    signaturesPerPackage: 32,
    totalOverheadKB: 78.9,
  },
  {
    algorithm: 'ML-DSA-65',
    signatureBytes: 3309,
    publicKeyBytes: 1952,
    signaturesPerPackage: 32,
    totalOverheadKB: 107.8,
  },
  {
    algorithm: 'LMS (H10/W4)',
    signatureBytes: 2156,
    publicKeyBytes: 56,
    signaturesPerPackage: 32,
    totalOverheadKB: 69.8,
  },
  {
    algorithm: 'FN-DSA-512',
    signatureBytes: 666,
    publicKeyBytes: 897,
    signaturesPerPackage: 32,
    totalOverheadKB: 22.2,
  },
]

// ---------------------------------------------------------------------------
// Campaign Computation Helpers
// ---------------------------------------------------------------------------

export function computeCampaignMetrics(
  targets: OTACampaignTarget[],
  fleetSize: number,
  signatureAlgorithm: SignatureOverhead
): {
  totalFirmwareSizeMB: number
  signatureOverheadMB: number
  totalBandwidthGB: number
  maxDurationHours: number
  criticalPathMinutes: number
} {
  const totalFirmwareSizeMB = targets.reduce((sum, t) => sum + t.firmwareSizeMB, 0)
  const signatureOverheadMB = (signatureAlgorithm.totalOverheadKB * targets.length) / 1024

  // Total bandwidth = (firmware + sig overhead) * fleet size
  const totalBandwidthGB = ((totalFirmwareSizeMB + signatureOverheadMB) * fleetSize) / 1024

  // Assume 10 Gbps CDN capacity, 60% utilization
  const cdnCapacityGBps = (10 * 0.6) / 8 // ~0.75 GB/s
  const maxDurationHours = totalBandwidthGB / cdnCapacityGBps / 3600

  // Critical path: sum of sequential dependencies
  const criticalPathMinutes = computeCriticalPath(targets)

  return {
    totalFirmwareSizeMB,
    signatureOverheadMB,
    totalBandwidthGB,
    maxDurationHours,
    criticalPathMinutes,
  }
}

function computeCriticalPath(targets: OTACampaignTarget[]): number {
  const targetMap = new Map(targets.map((t) => [t.ecuId, t]))
  let maxPath = 0

  function dfs(ecuId: string): number {
    const target = targetMap.get(ecuId)
    if (!target) return 0
    let maxDep = 0
    for (const depId of target.dependencies) {
      maxDep = Math.max(maxDep, dfs(depId))
    }
    return maxDep + target.updateTimeMinutes
  }

  for (const target of targets) {
    maxPath = Math.max(maxPath, dfs(target.ecuId))
  }
  return maxPath
}
