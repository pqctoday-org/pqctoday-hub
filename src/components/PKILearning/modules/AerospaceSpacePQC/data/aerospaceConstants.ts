// SPDX-License-Identifier: GPL-3.0-only

// ── Enums & Literal Types ───────────────────────────────────────────────

export type OrbitType = 'leo' | 'meo' | 'geo' | 'heo' | 'sso'
export type FrequencyBand = 's-band' | 'x-band' | 'ka-band' | 'optical' | 'uhf' | 'l-band'
export type AircraftGeneration = 'legacy' | 'current' | 'next-gen'
export type SegmentType = 'ground' | 'airborne' | 'space'
export type DALevel = 'A' | 'B' | 'C' | 'D' | 'E'
export type ExportRegime = 'itar' | 'ear' | 'wassenaar' | 'national' | 'none'
export type ProtocolFeasibility = 'fits' | 'marginal' | 'infeasible'
export type PqcUpgradeFeasibility = 'native' | 'retrofit' | 'gateway-only' | 'impossible'
export type SolarActivity = 'minimum' | 'moderate' | 'maximum'

// ── Avionics Communication Protocol ─────────────────────────────────────

export interface AvionicsProtocol {
  id: string
  name: string
  description: string
  maxPayloadBytes: number
  dataRateKbps: number
  linkType: string
  currentCrypto: string
  bidirectional: boolean
  standardRef: string
  pqcOverhead: {
    mlkem768Bytes: number
    mldsa65Bytes: number
    mldsa44Bytes: number
    lmsBytes: number
    feasibility: ProtocolFeasibility
    notes: string
  }
}

// ── Satellite Orbit Profile ─────────────────────────────────────────────

export interface OrbitProfile {
  id: OrbitType
  name: string
  altitudeKm: [number, number]
  typicalRTTms: number
  seuRatePerBitDay: number
  seuRateSolarMax: number
  radiationEnvironment: string
  typicalLifetimeYears: number
  examples: string[]
}

// ── Rad-Hard Processor Profile ──────────────────────────────────────────

export interface RadHardProcessor {
  id: string
  name: string
  manufacturer: string
  architecture: string
  clockMhz: number
  ramMB: number
  flashMB: number
  tidKrad: number
  seuImmune: boolean
  pqcCapability: {
    mlkem512: boolean
    mlkem768: boolean
    mldsa44: boolean
    mldsa65: boolean
    lms: boolean
    xmss: boolean
  }
  notes: string
}

// ── Avionics System (for certification analyzer) ────────────────────────

export interface AvionicsSystem {
  id: string
  name: string
  acronym: string
  description: string
  dalLevel: DALevel
  typicalProcessor: string
  ramMB: number
  busType: string
  currentCrypto: string
  safetyCritical: boolean
  certCostRetrofitUsd: [number, number]
  certCostCleanSheetUsd: [number, number]
  certMonthsRetrofit: [number, number]
  certMonthsCleanSheet: [number, number]
  mcdcExplosionPct: number
  do254Required: boolean
  linesOfCodeEstimate: number
}

// ── Aircraft Type (for fleet interop) ───────────────────────────────────

export interface AircraftType {
  id: string
  name: string
  manufacturer: string
  generation: AircraftGeneration
  firstDeliveryYear: number
  expectedRetirementYear: number
  avionicsBus: string
  commCapabilities: string[]
  pqcUpgradeFeasibility: PqcUpgradeFeasibility
  fleetSizeEstimate: number
  notes: string
}

// ── Export Control Entry ─────────────────────────────────────────────────

export interface ExportControlEntry {
  id: string
  productType: string
  description: string
  regime: ExportRegime
  classification: string
  licenseRequired: boolean
  licenseException: string | null
  cfrCitation: string
}

export interface ExportDestination {
  id: string
  country: string
  alliance: string
  sovereignMandates: string[]
  licenseEase: 'streamlined' | 'standard' | 'restricted' | 'denied'
  notes: string
}

// ── Platform Profile (for lifecycle planner) ────────────────────────────

export type PlatformCategory =
  | 'commercial-aircraft'
  | 'military-aircraft'
  | 'geo-satellite'
  | 'leo-constellation'
  | 'uav'
  | 'launch-vehicle'

export interface PlatformProfile {
  id: string
  name: string
  category: PlatformCategory
  serviceLifeYears: number
  upgradeWindowsPerYear: number
  segment: SegmentType
  exportControlled: boolean
  certificationAuthority: string
}

// ── Segment Upgrade Cadence ─────────────────────────────────────────────

export interface SegmentUpgradeCadence {
  segment: SegmentType
  name: string
  typicalCycleMonths: number
  constraintDescription: string
  pqcReadinessYear: number
}

// ── Color Maps ──────────────────────────────────────────────────────────

export const FEASIBILITY_COLORS: Record<ProtocolFeasibility, string> = {
  fits: 'bg-status-success/15 text-status-success border-status-success/30',
  marginal: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  infeasible: 'bg-status-error/15 text-status-error border-status-error/30',
}

export const FEASIBILITY_LABELS: Record<ProtocolFeasibility, string> = {
  fits: 'Feasible',
  marginal: 'Marginal',
  infeasible: 'Infeasible',
}

export const DAL_COLORS: Record<DALevel, string> = {
  A: 'bg-status-error/15 text-status-error border-status-error/30',
  B: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  C: 'bg-status-info/15 text-status-info border-status-info/30',
  D: 'bg-primary/15 text-primary border-primary/30',
  E: 'bg-muted text-muted-foreground border-border',
}

export const GENERATION_COLORS: Record<AircraftGeneration, string> = {
  legacy: 'bg-status-error/15 text-status-error border-status-error/30',
  current: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  'next-gen': 'bg-status-success/15 text-status-success border-status-success/30',
}

export const LICENSE_EASE_COLORS: Record<ExportDestination['licenseEase'], string> = {
  streamlined: 'bg-status-success/15 text-status-success border-status-success/30',
  standard: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  restricted: 'bg-status-error/15 text-status-error border-status-error/30',
  denied: 'bg-destructive/15 text-destructive border-destructive/30',
}

export const SEGMENT_CADENCES: SegmentUpgradeCadence[] = [
  {
    segment: 'ground',
    name: 'Ground Segment',
    typicalCycleMonths: 6,
    constraintDescription:
      'Ground stations, ATC centers, and ops centers can be updated via standard IT change management. PQC migration is similar to enterprise IT.',
    pqcReadinessYear: 2028,
  },
  {
    segment: 'airborne',
    name: 'Airborne Segment',
    typicalCycleMonths: 36,
    constraintDescription:
      'Aircraft updates require maintenance windows (A/B/C/D checks). Avionics LRU changes need DO-178C recertification. Fleet-wide rollout takes 5-10 years.',
    pqcReadinessYear: 2033,
  },
  {
    segment: 'space',
    name: 'Space Segment',
    typicalCycleMonths: 0,
    constraintDescription:
      'Satellites cannot be physically accessed post-launch. Crypto must be provisioned pre-launch. Software-defined radios allow limited firmware updates but hardware crypto is fixed. Note: 2027 reflects ground-segment infrastructure readiness (PQC-secured uplinks, ground key management) for newly launched satellites — not a retrofit of existing satellite hardware.',
    pqcReadinessYear: 2027,
  },
]
