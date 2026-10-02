// SPDX-License-Identifier: GPL-3.0-only
// Device-fleet key-management types (moved from the Energy & Utilities module, 2026-10-01 split).

export type CommTechnology = 'nb-iot' | 'plc' | 'rf-mesh' | 'cellular'
export type PQCAlgorithm = 'ml-kem-512' | 'ml-kem-768' | 'ml-kem-1024'
export type RotationFrequency = 'quarterly' | 'semi-annual' | 'annual'
export type HSMCapacity = 'standard' | 'high-throughput'
export type SecuritySuite = 'suite-0' | 'suite-1' | 'suite-2'

export interface SmartMeterFleetConfig {
  fleetSize: number
  commTechnology: CommTechnology
  securitySuite: SecuritySuite
  rotationFrequency: RotationFrequency
  hsmCapacity: HSMCapacity
  pqcAlgorithm: PQCAlgorithm
}

export const DEFAULT_FLEET: SmartMeterFleetConfig = {
  fleetSize: 2_000_000,
  commTechnology: 'plc',
  securitySuite: 'suite-1',
  rotationFrequency: 'annual',
  hsmCapacity: 'standard',
  pqcAlgorithm: 'ml-kem-768',
}
