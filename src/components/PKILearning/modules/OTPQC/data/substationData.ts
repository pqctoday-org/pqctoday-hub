// SPDX-License-Identifier: GPL-3.0-only
/**
 * Substation Migration Planner data (workshop Step 3, the energy worked
 * example).
 *
 * Fixes from the plan audit:
 *  - E23: the old score ADDED points for migration complexity, so the process
 *    bus (symmetric GOOSE HMAC) out-ranked the station bus — the opposite of
 *    what the exercise said. Complexity now changes effort only; priority comes
 *    from each zone's actual quantum exposure.
 *  - E24: gooseGroups, mmsConnections and substation type were dead inputs.
 *    They now drive effort (groups, MMS connections) and the trip-time class.
 *  - E21: time sync is PTP with IEEE 1588-2019 Annex P, not NTS.
 *  - E6: GOOSE/SV keys come from a GDOI KDC (IEC 62351-9 / RFC 8052).
 *  - E26: one voltage-class vocabulary, used everywhere in this module.
 *
 *   base     = 100 × (0.7 × forgery + 0.3 × hndl × linkExposure)
 *   priority = round(impactWeight × base)
 *
 * linkExposure applies to the zones that leave the fence (WAN, remote
 * engineering). Every figure is a teaching model ("Model estimate").
 */

export type SubstationType = 'transmission' | 'sub-transmission' | 'distribution' | 'generation'
export type Connectivity = 'fiber' | 'cellular' | 'serial' | 'air-gapped'
export type IEC62351Level = 'none' | 'part3' | 'part3-6' | 'full'
export type NERCCIPImpact = 'high' | 'medium' | 'low' | 'not-applicable'

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

export const SUBSTATION_TYPE_LABELS: Record<SubstationType, string> = {
  transmission: 'Transmission (230 kV and above)',
  'sub-transmission': 'Sub-transmission (69–138 kV)',
  distribution: 'Distribution (below 69 kV)',
  generation: 'Generation plant switchyard',
}

/** IEC 61850-5 transfer-time class for trip messages, by substation type. */
export function tripTimeClass(type: SubstationType): { perfClass: string; budgetMs: number } {
  return type === 'distribution'
    ? { perfClass: 'P1 (TT5)', budgetMs: 10 }
    : { perfClass: 'P2/P3 (TT6)', budgetMs: 3 }
}

export const IMPACT_WEIGHT: Record<NERCCIPImpact, number> = {
  high: 1,
  medium: 0.8,
  low: 0.6,
  'not-applicable': 0.5,
}

export const LINK_EXPOSURE: Record<Connectivity, number> = {
  cellular: 1,
  fiber: 0.7,
  serial: 0.5,
  'air-gapped': 0.2,
}

export const CONNECTIVITY_EFFORT_FACTOR: Record<Connectivity, number> = {
  fiber: 1,
  cellular: 1,
  serial: 1.3,
  'air-gapped': 1.5,
}

export interface SubstationZone {
  id: string
  name: string
  description: string
  protocols: string[]
  currentCrypto: string
  pqcTarget: string
  /** 0–1 exposure to forged commands / firmware / identities */
  forgery: number
  /** 0–1 exposure of recorded traffic */
  hndl: number
  /** WAN / remote zones take the link exposure factor on hndl */
  leavesFence: boolean
  migrationComplexity: 'low' | 'medium' | 'high'
  requiresTruckRoll: boolean
  nercCip: string[]
}

export const SUBSTATION_ZONES: SubstationZone[] = [
  {
    id: 'wan-iccp',
    name: 'WAN / control-centre links',
    description: 'SCADA and ICCP traffic leaving the substation over the utility WAN.',
    protocols: ['IEC 60870-5-104', 'DNP3/TCP', 'ICCP/TASE.2', 'IPsec'],
    currentCrypto: 'TLS 1.2 / IKEv2 with ECDHE or RSA and X.509',
    pqcTarget: 'Hybrid ML-KEM TLS 1.3 / IKEv2; ML-DSA certificates later',
    forgery: 1,
    hndl: 1,
    leavesFence: true,
    migrationComplexity: 'medium',
    requiresTruckRoll: false,
    nercCip: ['CIP-005-7', 'CIP-012-2'],
  },
  {
    id: 'station-bus',
    name: 'Station bus (MMS)',
    description: 'Client/server control and polling of IEDs inside the fence.',
    protocols: ['IEC 61850 MMS', 'TCP/IP'],
    currentCrypto: 'TLS (IEC 62351-3) with X.509',
    pqcTarget: 'Hybrid ML-KEM TLS 1.3; ML-DSA certificates when IEC 62351 profiles them',
    forgery: 1,
    hndl: 0.6,
    leavesFence: false,
    migrationComplexity: 'medium',
    requiresTruckRoll: true,
    nercCip: ['CIP-005-7', 'CIP-010-4'],
  },
  {
    id: 'engineering',
    name: 'Engineering & remote access',
    description: 'Settings changes, file transfer and vendor access to IEDs.',
    protocols: ['SSH', 'VPN/IPsec', 'HTTPS'],
    currentCrypto: 'SSH / VPN with RSA or ECDSA and ECDHE',
    pqcTarget: 'PQC-hybrid SSH / VPN with MFA through a jump host',
    forgery: 1,
    hndl: 0.8,
    leavesFence: true,
    migrationComplexity: 'low',
    requiresTruckRoll: false,
    nercCip: ['CIP-005-7'],
  },
  {
    id: 'ied-firmware',
    name: 'IED firmware & settings signing',
    description: 'Vendor firmware images and signed settings files loaded into relays.',
    protocols: ['Vendor update tools'],
    currentCrypto: 'Vendor RSA / ECDSA code signing',
    pqcTarget: 'LMS or ML-DSA firmware signatures; relay bootloader accepts both during transition',
    forgery: 1,
    hndl: 0,
    leavesFence: false,
    migrationComplexity: 'high',
    requiresTruckRoll: true,
    nercCip: ['CIP-010-4', 'CIP-013-2'],
  },
  {
    id: 'process-bus',
    name: 'Process bus (GOOSE / SV)',
    description: 'Layer 2 multicast trips and samples between relays and merging units.',
    protocols: ['IEC 61850 GOOSE', 'IEC 61850 SV'],
    currentCrypto: 'HMAC-SHA256 / AES-GMAC (IEC 62351-6) with GDOI group keys (IEC 62351-9)',
    pqcTarget: 'Keep the symmetric MAC in the trip path; move the GDOI KDC channel to PQC',
    forgery: 0.4,
    hndl: 0.2,
    leavesFence: false,
    migrationComplexity: 'high',
    requiresTruckRoll: true,
    nercCip: ['CIP-005-7'],
  },
  {
    id: 'time-sync',
    name: 'Time synchronisation (PTP)',
    description: 'IEEE 1588 power profile (IEC 61850-9-3) for SV and protection timing.',
    protocols: ['IEEE 1588-2019', 'IEC 61850-9-3'],
    currentCrypto: 'Usually none; Annex P group-key authentication where enabled',
    pqcTarget: 'Annex P authentication with group keys from the PQC-migrated KDC',
    forgery: 0.3,
    hndl: 0,
    leavesFence: false,
    migrationComplexity: 'low',
    requiresTruckRoll: true,
    nercCip: [],
  },
]

export interface ZoneResult {
  zone: SubstationZone
  priority: number
  effort: number
  /** zone has no crypto at this IEC 62351 level — fix classically first */
  noCryptoToday: boolean
}

/** Zones that carry no crypto at a given IEC 62351 deployment level. */
export function zonesWithoutCrypto(level: IEC62351Level): string[] {
  switch (level) {
    case 'none':
      return ['station-bus', 'process-bus', 'time-sync']
    case 'part3':
      return ['process-bus', 'time-sync']
    case 'part3-6':
    case 'full':
      return ['time-sync']
  }
}

export function computeZonePriority(zone: SubstationZone, profile: SubstationProfile): number {
  const hndl = zone.leavesFence ? zone.hndl * LINK_EXPOSURE[profile.connectivity] : zone.hndl
  const base = 100 * (0.7 * zone.forgery + 0.3 * hndl)
  return Math.round(IMPACT_WEIGHT[profile.nercCipImpact] * base)
}

export function estimateZoneEffort(zone: SubstationZone, profile: SubstationProfile): number {
  let hours: number
  switch (zone.id) {
    case 'station-bus':
      hours = 16 + 2 * Math.ceil(profile.iedCount / 10) + Math.ceil(profile.mmsConnections / 5)
      break
    case 'process-bus':
      hours = 12 + 2 * profile.gooseGroups
      break
    case 'ied-firmware':
      hours = Math.ceil(profile.iedCount * 0.5)
      break
    case 'wan-iccp':
      hours = 12
      break
    case 'engineering':
      hours = 8
      break
    default:
      hours = 6
  }
  return Math.ceil(hours * CONNECTIVITY_EFFORT_FACTOR[profile.connectivity])
}

export function planSubstation(profile: SubstationProfile): ZoneResult[] {
  const gaps = new Set(zonesWithoutCrypto(profile.iec62351Level))
  return SUBSTATION_ZONES.map((zone) => ({
    zone,
    priority: computeZonePriority(zone, profile),
    effort: estimateZoneEffort(zone, profile),
    noCryptoToday: gaps.has(zone.id),
  })).sort(
    (a, b) =>
      b.priority - a.priority || SUBSTATION_ZONES.indexOf(a.zone) - SUBSTATION_ZONES.indexOf(b.zone)
  )
}

// ---------------------------------------------------------------------------
// Equipment lifecycles — single source for every lifecycle figure in the
// module (E26).
// ---------------------------------------------------------------------------

export interface EquipmentLifecycle {
  id: string
  name: string
  typicalLifeYears: [number, number]
  note: string
}

export const EQUIPMENT_LIFECYCLES: EquipmentLifecycle[] = [
  {
    id: 'substation-primary',
    name: 'Substation primary plant (transformers, switchgear)',
    typicalLifeYears: [30, 50],
    note: 'No crypto itself, but outlives several generations of the IEDs that control it.',
  },
  {
    id: 'ied-relay',
    name: 'Protection relay / IED',
    typicalLifeYears: [15, 25],
    note: 'Safety-related; a firmware change can mean re-testing the protection scheme.',
  },
  {
    id: 'plc-dcs',
    name: 'PLC / DCS controller',
    typicalLifeYears: [15, 25],
    note: 'Firmware and project signing roots live as long as the controller does.',
  },
  {
    id: 'rtu',
    name: 'RTU / outstation',
    typicalLifeYears: [15, 20],
    note: 'Often on serial links; firmware updates may need a site visit.',
  },
  {
    id: 'sis',
    name: 'Safety instrumented system',
    typicalLifeYears: [15, 25],
    note: 'Changes go through the IEC 61511 management-of-change process.',
  },
  {
    id: 'rail-signalling',
    name: 'Rail signalling / interlocking',
    typicalLifeYears: [25, 40],
    note: 'Every crypto change touches a safety case.',
  },
  {
    id: 'scada-server',
    name: 'SCADA / HMI servers',
    typicalLifeYears: [7, 15],
    note: 'Shortest lifecycle; easiest place to start TLS migration.',
  },
]
