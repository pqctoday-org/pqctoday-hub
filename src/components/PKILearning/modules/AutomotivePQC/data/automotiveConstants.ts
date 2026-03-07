// SPDX-License-Identifier: GPL-3.0-only

// ---------------------------------------------------------------------------
// Vehicle & Architecture Types
// ---------------------------------------------------------------------------

export type VehicleType = 'sedan' | 'suv' | 'commercial-truck' | 'autonomous-shuttle'

export type ArchitectureStyle = 'domain-based' | 'zonal'

export type ECUZone = 'powertrain' | 'chassis' | 'adas' | 'body' | 'infotainment' | 'connectivity'

export type InVehicleBus = 'can' | 'can-fd' | 'lin' | 'flexray' | 'automotive-ethernet'

// ---------------------------------------------------------------------------
// Safety & Functional Types
// ---------------------------------------------------------------------------

export type ASILLevel = 'QM' | 'A' | 'B' | 'C' | 'D'

export type AutomotiveFunction =
  | 'braking'
  | 'steering'
  | 'airbag'
  | 'cruise-control'
  | 'lane-keeping'
  | 'parking-assist'
  | 'adaptive-headlights'
  | 'infotainment'

export type FailMode = 'fail-safe' | 'fail-operational'

// ---------------------------------------------------------------------------
// Digital Car Key Types
// ---------------------------------------------------------------------------

export type TransportType = 'nfc' | 'ble' | 'uwb'

export type CarKeyActor = 'device' | 'vehicle' | 'oem-server' | 'friend-device'

// ---------------------------------------------------------------------------
// OTA & Lifecycle Types
// ---------------------------------------------------------------------------

export type UpdateStrategy = 'ab-partition' | 'differential' | 'full-image'

export type VehicleLifecyclePhase = 'production' | 'road-life' | 'end-of-life'

export type RegulationRegion = 'eu' | 'us' | 'china' | 'japan' | 'korea'

// ---------------------------------------------------------------------------
// Sensor Types
// ---------------------------------------------------------------------------

export type SensorType = 'lidar' | 'radar' | 'camera' | 'ultrasonic' | 'gps-imu' | 'v2x'

// ---------------------------------------------------------------------------
// Crypto Comparison
// ---------------------------------------------------------------------------

export type CryptoMode = 'classical' | 'pqc'

export interface AlgorithmThroughput {
  algorithm: string
  signingTimeMs: number
  verificationTimeMs: number
  signatureBytes: number
  publicKeyBytes: number
}

// ---------------------------------------------------------------------------
// UI Constants — semantic tokens only
// ---------------------------------------------------------------------------

export const ASIL_COLORS: Record<ASILLevel, string> = {
  QM: 'bg-muted text-muted-foreground border-border',
  A: 'bg-status-info/20 text-status-info border-status-info/50',
  B: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  C: 'bg-status-error/20 text-status-error border-status-error/50',
  D: 'bg-status-error/30 text-status-error border-status-error/60',
}

export const ASIL_LABELS: Record<ASILLevel, string> = {
  QM: 'QM (No Safety)',
  A: 'ASIL A',
  B: 'ASIL B',
  C: 'ASIL C',
  D: 'ASIL D',
}

export const ZONE_COLORS: Record<ECUZone, string> = {
  powertrain: 'bg-status-error/20 text-status-error border-status-error/50',
  chassis: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  adas: 'bg-primary/20 text-primary border-primary/50',
  body: 'bg-status-info/20 text-status-info border-status-info/50',
  infotainment: 'bg-secondary/20 text-secondary border-secondary/50',
  connectivity: 'bg-status-success/20 text-status-success border-status-success/50',
}

export const ZONE_LABELS: Record<ECUZone, string> = {
  powertrain: 'Powertrain',
  chassis: 'Chassis',
  adas: 'ADAS',
  body: 'Body',
  infotainment: 'Infotainment',
  connectivity: 'Connectivity',
}

export const BUS_LABELS: Record<InVehicleBus, string> = {
  can: 'CAN 2.0',
  'can-fd': 'CAN FD',
  lin: 'LIN',
  flexray: 'FlexRay',
  'automotive-ethernet': 'Automotive Ethernet',
}

export const TRANSPORT_LABELS: Record<TransportType, string> = {
  nfc: 'NFC',
  ble: 'BLE',
  uwb: 'UWB',
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  sedan: 'Sedan',
  suv: 'SUV',
  'commercial-truck': 'Commercial Truck',
  'autonomous-shuttle': 'Autonomous Shuttle',
}

export const ARCHITECTURE_LABELS: Record<ArchitectureStyle, string> = {
  'domain-based': 'Domain-Based',
  zonal: 'Zonal',
}

export const REGION_LABELS: Record<RegulationRegion, string> = {
  eu: 'European Union',
  us: 'United States',
  china: 'China',
  japan: 'Japan',
  korea: 'South Korea',
}

export const UPDATE_STRATEGY_LABELS: Record<UpdateStrategy, string> = {
  'ab-partition': 'A/B Partition',
  differential: 'Differential',
  'full-image': 'Full Image',
}

export const FAIL_MODE_LABELS: Record<FailMode, string> = {
  'fail-safe': 'Fail-Safe',
  'fail-operational': 'Fail-Operational',
}

export const LIFECYCLE_PHASE_LABELS: Record<VehicleLifecyclePhase, string> = {
  production: 'Production',
  'road-life': 'Road Life',
  'end-of-life': 'End of Life',
}
