// SPDX-License-Identifier: GPL-3.0-only

// ---------------------------------------------------------------------------
// Core types shared across all workshop steps
// ---------------------------------------------------------------------------

export type SubstationType = 'transmission' | 'sub-transmission' | 'distribution' | 'generation'
export type Connectivity = 'fiber' | 'cellular' | 'serial' | 'air-gapped'
export type IEC62351Level = 'none' | 'part3' | 'part3-6' | 'full'
export type NERCCIPImpact = 'high' | 'medium' | 'low' | 'not-applicable'
export type UtilityType = 'iou' | 'municipal' | 'cooperative' | 'rto'
export type ServiceTerritory = 'small' | 'medium' | 'large' | 'very-large'
export type BudgetLevel = 'constrained' | 'normal' | 'accelerated'
export type Jurisdiction = 'nerc' | 'eu' | 'both' | 'other'
export type PhysicalConsequence = 'catastrophic' | 'critical' | 'major' | 'moderate' | 'minor'
export type EnvironmentalSeverity = 'severe' | 'significant' | 'moderate' | 'minor' | 'none'
export type EnvironmentalZone =
  | 'urban'
  | 'suburban'
  | 'rural'
  | 'protected-ecosystem'
  | 'industrial'
export type AssetCriticality = 'tier-1' | 'tier-2' | 'tier-3'
export type CommTechnology = 'nb-iot' | 'plc' | 'rf-mesh' | 'cellular'
export type PQCAlgorithm = 'ml-kem-512' | 'ml-kem-768' | 'ml-kem-1024'
export type RotationFrequency = 'quarterly' | 'semi-annual' | 'annual'
export type HSMCapacity = 'standard' | 'high-throughput'
export type SecuritySuite = 'suite-0' | 'suite-1' | 'suite-2'

// ---------------------------------------------------------------------------
// Substation profile (Step 2)
// ---------------------------------------------------------------------------

export interface SubstationProfile {
  type: SubstationType
  iedCount: number
  gooseGroups: number
  mmsConnections: number
  connectivity: Connectivity
  iec62351Level: IEC62351Level
  nercCipImpact: NERCCIPImpact
}

export const DEFAULT_SUBSTATION: SubstationProfile = {
  type: 'distribution',
  iedCount: 30,
  gooseGroups: 8,
  mmsConnections: 15,
  connectivity: 'cellular',
  iec62351Level: 'part3',
  nercCipImpact: 'medium',
}

// ---------------------------------------------------------------------------
// Smart meter fleet (Step 3)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Safety risk result (Step 4)
// ---------------------------------------------------------------------------

export interface SafetyRiskResult {
  scenarioId: string
  safetyScore: number
  environmentalScore: number
  hndlScore: number
  compliancePenalty: number
  compoundRiskScore: number
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  recommendedActions: string[]
}

// ---------------------------------------------------------------------------
// Utility profile (Step 5)
// ---------------------------------------------------------------------------

export interface UtilityProfile {
  utilityType: UtilityType
  serviceTerritory: ServiceTerritory
  budget: BudgetLevel
  crqcEstimate: number
  jurisdiction: Jurisdiction
  substationCount: number
  meterFleetSize: number
}

export const DEFAULT_UTILITY: UtilityProfile = {
  utilityType: 'iou',
  serviceTerritory: 'medium',
  budget: 'normal',
  crqcEstimate: 2033,
  jurisdiction: 'nerc',
  substationCount: 50,
  meterFleetSize: 2_000_000,
}

// ---------------------------------------------------------------------------
// Equipment lifecycle data
// ---------------------------------------------------------------------------

export interface EquipmentLifecycle {
  id: string
  name: string
  typicalLifeYears: [number, number]
  hndlExposureNote: string
}

export const EQUIPMENT_LIFECYCLES: EquipmentLifecycle[] = [
  {
    id: 'smart-meter',
    name: 'Smart Meter',
    typicalLifeYears: [15, 20],
    hndlExposureNote:
      'Deployed 2026 → operational until 2041-2046. HNDL window: 11-16 years post-CRQC (2030).',
  },
  {
    id: 'rtu',
    name: 'Remote Terminal Unit (RTU)',
    typicalLifeYears: [15, 20],
    hndlExposureNote: 'Often serial-connected, firmware updates require site visits.',
  },
  {
    id: 'ied-relay',
    name: 'IED / Protection Relay',
    typicalLifeYears: [20, 25],
    hndlExposureNote:
      'Deployed 2026 → operational until 2046-2051. Safety-critical; misoperation causes cascading failures.',
  },
  {
    id: 'scada-server',
    name: 'SCADA Server',
    typicalLifeYears: [10, 15],
    hndlExposureNote:
      'Shorter lifecycle but critical control path. TLS migration most feasible here.',
  },
  {
    id: 'substation-transformer',
    name: 'Substation Transformer',
    typicalLifeYears: [30, 40],
    hndlExposureNote:
      'Monitoring/control via IEDs. The transformer itself has no crypto, but its control chain does.',
  },
  {
    id: 'der-inverter',
    name: 'DER Inverter (Solar/Battery)',
    typicalLifeYears: [15, 25],
    hndlExposureNote: 'IEEE 2030.5 certificates for grid enrollment. Fleet scaling rapidly.',
  },
]

// ---------------------------------------------------------------------------
// Substation zones (Step 2 zones)
// ---------------------------------------------------------------------------

export interface SubstationZone {
  id: string
  name: string
  description: string
  protocols: string[]
  currentCrypto: string
  pqcTarget: string
  migrationComplexity: 'low' | 'medium' | 'high'
  baseEffortHours: number
  requiresTruckRoll: boolean
  nercCipRelevance: string[]
}

export const SUBSTATION_ZONES: SubstationZone[] = [
  {
    id: 'station-bus',
    name: 'Station Bus (MMS/TCP)',
    description:
      'Client/server SCADA polling via MMS over TCP. Primary control path for breaker status, measurements.',
    protocols: ['IEC 61850 MMS', 'TCP/IP'],
    currentCrypto: 'TLS 1.2 (IEC 62351-3)',
    pqcTarget: 'TLS 1.3 + ML-KEM hybrid',
    migrationComplexity: 'medium',
    baseEffortHours: 16,
    requiresTruckRoll: true,
    nercCipRelevance: ['CIP-005', 'CIP-007'],
  },
  {
    id: 'process-bus',
    name: 'Process Bus (GOOSE/SV)',
    description:
      'High-speed multicast for protection tripping (4ms). HMAC authentication with RSA key distribution.',
    protocols: ['IEC 61850 GOOSE', 'IEC 61850 SV'],
    currentCrypto: 'HMAC-SHA256 (IEC 62351-6) + RSA key distribution',
    pqcTarget: 'HMAC stays; key distribution → ML-KEM',
    migrationComplexity: 'high',
    baseEffortHours: 24,
    requiresTruckRoll: true,
    nercCipRelevance: ['CIP-007'],
  },
  {
    id: 'wan-iccp',
    name: 'WAN / ICCP Links',
    description:
      'Inter-control-center communications (ICCP/TASE.2). Internet-facing, highest exposure.',
    protocols: ['ICCP/TASE.2', 'TLS', 'IPsec'],
    currentCrypto: 'TLS 1.2 / IPsec IKEv2 with RSA-2048',
    pqcTarget: 'TLS 1.3 + ML-KEM / IPsec + ML-KEM hybrid',
    migrationComplexity: 'medium',
    baseEffortHours: 12,
    requiresTruckRoll: false,
    nercCipRelevance: ['CIP-005', 'CIP-012'],
  },
  {
    id: 'engineering',
    name: 'Engineering Access',
    description: 'Remote access and VPN for configuration, maintenance, and firmware updates.',
    protocols: ['SSH', 'VPN/IPsec', 'HTTPS'],
    currentCrypto: 'SSH RSA/ECDSA + VPN IKEv2',
    pqcTarget: 'SSH ML-KEM + VPN ML-KEM hybrid',
    migrationComplexity: 'low',
    baseEffortHours: 8,
    requiresTruckRoll: false,
    nercCipRelevance: ['CIP-005', 'CIP-007', 'CIP-010'],
  },
  {
    id: 'time-sync',
    name: 'Time Synchronization',
    description: 'PTP/IEEE 1588 for precise time synchronization across protection devices.',
    protocols: ['PTP (IEEE 1588)', 'NTP'],
    currentCrypto: 'NTS (Network Time Security) or none',
    pqcTarget: 'NTS with PQC authentication keys',
    migrationComplexity: 'low',
    baseEffortHours: 6,
    requiresTruckRoll: true,
    nercCipRelevance: ['CIP-007'],
  },
]

// ---------------------------------------------------------------------------
// Migration phases (Step 5)
// ---------------------------------------------------------------------------

export interface MigrationPhase {
  id: string
  phase: number
  name: string
  description: string
  startMonthBase: number
  durationMonthsBase: number
  assets: string[]
  nercCipAddressed: string[]
  costMultiplier: { small: number; medium: number; large: number }
  staffingFTE: number
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  keyMilestones: string[]
}

export const MIGRATION_PHASES: MigrationPhase[] = [
  {
    id: 'inventory',
    phase: 0,
    name: 'Inventory & Assessment',
    description: 'Cryptographic inventory (CBOM), protocol audit, vendor PQC readiness survey.',
    startMonthBase: 0,
    durationMonthsBase: 6,
    assets: ['All crypto assets', 'Vendor contracts'],
    nercCipAddressed: ['CIP-010', 'CIP-013'],
    costMultiplier: { small: 80_000, medium: 200_000, large: 500_000 },
    staffingFTE: 2,
    riskLevel: 'low',
    keyMilestones: ['CBOM complete', 'Vendor readiness report', 'Gap analysis published'],
  },
  {
    id: 'perimeter',
    phase: 1,
    name: 'Internet-Facing Perimeter',
    description: 'WAN VPN/IPsec, ICCP TLS, remote access VPN, enterprise IT boundary.',
    startMonthBase: 6,
    durationMonthsBase: 12,
    assets: ['VPN gateways', 'ICCP links', 'Remote access servers'],
    nercCipAddressed: ['CIP-005', 'CIP-012'],
    costMultiplier: { small: 150_000, medium: 400_000, large: 1_000_000 },
    staffingFTE: 3,
    riskLevel: 'critical',
    keyMilestones: [
      'ICCP links upgraded to PQC hybrid',
      'VPN gateways migrated',
      'Perimeter pen-test passed',
    ],
  },
  {
    id: 'control-center',
    phase: 2,
    name: 'Control Center Systems',
    description: 'SCADA servers, EMS, historian, control center MMS connections.',
    startMonthBase: 12,
    durationMonthsBase: 12,
    assets: ['SCADA servers', 'EMS', 'Historian DB', 'MMS endpoints'],
    nercCipAddressed: ['CIP-005', 'CIP-007'],
    costMultiplier: { small: 200_000, medium: 600_000, large: 1_500_000 },
    staffingFTE: 4,
    riskLevel: 'high',
    keyMilestones: [
      'SCADA server TLS upgraded',
      'EMS PQC certificates issued',
      'Control center audit passed',
    ],
  },
  {
    id: 'substation',
    phase: 3,
    name: 'Substation Automation',
    description: 'Station bus TLS, engineering workstation access, IED firmware signing.',
    startMonthBase: 18,
    durationMonthsBase: 18,
    assets: ['IEDs', 'Station bus switches', 'Engineering workstations'],
    nercCipAddressed: ['CIP-005', 'CIP-007', 'CIP-010'],
    costMultiplier: { small: 300_000, medium: 900_000, large: 2_500_000 },
    staffingFTE: 5,
    riskLevel: 'high',
    keyMilestones: [
      'Pilot substation complete',
      '50% substations migrated',
      'All substations migrated',
    ],
  },
  {
    id: 'field-metering',
    phase: 4,
    name: 'Field Devices & Metering',
    description: 'Smart meter key rotation, DNP3-SA key transport, DER certificates.',
    startMonthBase: 24,
    durationMonthsBase: 24,
    assets: ['Smart meters', 'RTUs', 'DER inverters', 'DNP3 outstations'],
    nercCipAddressed: ['CIP-007', 'CIP-013'],
    costMultiplier: { small: 400_000, medium: 1_200_000, large: 4_000_000 },
    staffingFTE: 6,
    riskLevel: 'medium',
    keyMilestones: [
      'Head-end HSM upgraded',
      'Pilot zone key rotation',
      'Full fleet rotation complete',
    ],
  },
  {
    id: 'legacy',
    phase: 5,
    name: 'Legacy & Air-Gapped',
    description: 'Gateway-mediated PQC for unreachable devices, serial protocol proxies.',
    startMonthBase: 36,
    durationMonthsBase: 24,
    assets: ['Air-gapped substations', 'Serial RTUs', 'Legacy PLCs'],
    nercCipAddressed: ['CIP-005', 'CIP-007'],
    costMultiplier: { small: 150_000, medium: 500_000, large: 1_500_000 },
    staffingFTE: 3,
    riskLevel: 'medium',
    keyMilestones: [
      'Gateway architecture approved',
      'Pilot air-gapped site complete',
      'All legacy sites covered',
    ],
  },
]

// ---------------------------------------------------------------------------
// Helper: priority score for substation zone
// ---------------------------------------------------------------------------

export function computeZonePriority(zone: SubstationZone, profile: SubstationProfile): number {
  let score = 0

  // BES impact classification
  const impactScores: Record<NERCCIPImpact, number> = {
    high: 40,
    medium: 25,
    low: 10,
    'not-applicable': 0,
  }
  score += impactScores[profile.nercCipImpact]

  // Internet-facing exposure
  if (zone.id === 'wan-iccp' || zone.id === 'engineering') score += 25

  // Current crypto posture gap
  const cryptoScores: Record<IEC62351Level, number> = {
    none: 20,
    part3: 10,
    'part3-6': 5,
    full: 0,
  }
  score += cryptoScores[profile.iec62351Level]

  // Migration complexity penalty
  if (zone.migrationComplexity === 'high') score += 10
  if (zone.migrationComplexity === 'medium') score += 5

  return score
}

// ---------------------------------------------------------------------------
// Helper: estimate effort hours for a zone given profile
// ---------------------------------------------------------------------------

export function estimateZoneEffort(zone: SubstationZone, profile: SubstationProfile): number {
  let hours = zone.baseEffortHours

  // Scale by IED count for bus zones
  if (zone.id === 'station-bus' || zone.id === 'process-bus') {
    hours += Math.ceil(profile.iedCount / 10) * 2
  }

  // Air-gapped adds 50% overhead (manual configuration)
  if (profile.connectivity === 'air-gapped') {
    hours = Math.ceil(hours * 1.5)
  }

  // Serial adds 30% overhead
  if (profile.connectivity === 'serial') {
    hours = Math.ceil(hours * 1.3)
  }

  return hours
}

// ---------------------------------------------------------------------------
// Helper: compute migration phase timeline adjustments
// ---------------------------------------------------------------------------

export function adjustPhaseTimeline(
  phase: MigrationPhase,
  utility: UtilityProfile
): { startMonth: number; durationMonths: number; estimatedCost: number } {
  const budgetMultiplier: Record<BudgetLevel, number> = {
    accelerated: 0.7,
    normal: 1.0,
    constrained: 1.4,
  }

  const sizeKey = utility.serviceTerritory === 'very-large' ? 'large' : utility.serviceTerritory
  const baseCost =
    phase.costMultiplier[sizeKey as keyof typeof phase.costMultiplier] ??
    phase.costMultiplier.medium

  // Very-large utilities get 2x cost
  const sizeCostMultiplier = utility.serviceTerritory === 'very-large' ? 2.0 : 1.0

  const durationMonths = Math.ceil(phase.durationMonthsBase * budgetMultiplier[utility.budget])

  return {
    startMonth: phase.startMonthBase,
    durationMonths,
    estimatedCost: Math.round(baseCost * sizeCostMultiplier),
  }
}
