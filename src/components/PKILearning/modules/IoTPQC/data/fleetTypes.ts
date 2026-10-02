// SPDX-License-Identifier: GPL-3.0-only
// Device-fleet key-management types (moved from the Energy & Utilities module
// and generalised from smart meters to any device fleet, 2026-10-01 split).

export type FleetProfile = 'smart-meter' | 'tracker' | 'building-sensor'
export type CommTechnology = 'nb-iot' | 'g3-plc' | 'wisun-fsk' | 'lte-m' | 'lorawan'
export type PQCAlgorithm = 'ml-kem-512' | 'ml-kem-768' | 'ml-kem-1024'
export type RotationFrequency = 'quarterly' | 'semi-annual' | 'annual'
export type HSMCapacity = 'standard' | 'high-throughput'
/** DLMS/COSEM security suites (IEC 62056-5-3 / DLMS UA Green Book). */
export type SecuritySuite = 'suite-0' | 'suite-1' | 'suite-2'

export interface FleetConfig {
  profile: FleetProfile
  fleetSize: number
  devicesPerCell: number
  commTechnology: CommTechnology
  securitySuite: SecuritySuite
  rotationFrequency: RotationFrequency
  hsmCapacity: HSMCapacity
  pqcAlgorithm: PQCAlgorithm
}

export const DEFAULT_FLEET: FleetConfig = {
  profile: 'smart-meter',
  fleetSize: 2_000_000,
  devicesPerCell: 1_000,
  commTechnology: 'g3-plc',
  securitySuite: 'suite-1',
  rotationFrequency: 'annual',
  hsmCapacity: 'standard',
  pqcAlgorithm: 'ml-kem-768',
}
