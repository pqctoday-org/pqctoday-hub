// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sector Migration Roadmap data (workshop Step 5).
 *
 * Multi-sector replacement for the energy-only GridMigrationRoadmap. Every
 * input now changes the output (E24):
 *   - sector       → asset names per phase and the regimes listed
 *   - jurisdiction → which regulatory milestones appear
 *   - planningYear → flags phases that finish after your CRQC planning year
 *   - siteCount    → the site-rollout phase length (sites ÷ sites per year)
 *   - orgSize      → sites per year the programme can handle
 *   - budget       → pace (duration multiplier)
 * Dollar costs and FTE counts were removed: they had no source.
 *
 *   rolloutMonths = ceil(siteCount / (SITES_PER_YEAR[orgSize]) × 12 × budgetFactor)
 *
 * Everything here is a teaching model ("Model estimate").
 */
import type { OTSector } from './otProtocolData'

export type OrgSize = 'small' | 'medium' | 'large'
export type BudgetLevel = 'constrained' | 'normal' | 'accelerated'
export type Jurisdiction = 'us' | 'eu' | 'both' | 'other'

export interface RoadmapInputs {
  sector: OTSector
  orgSize: OrgSize
  budget: BudgetLevel
  jurisdiction: Jurisdiction
  planningYear: number
  siteCount: number
}

export const ROADMAP_START_YEAR = 2026

export const DEFAULT_ROADMAP: RoadmapInputs = {
  sector: 'energy',
  orgSize: 'medium',
  budget: 'normal',
  jurisdiction: 'us',
  planningYear: 2033,
  siteCount: 50,
}

export const BUDGET_FACTOR: Record<BudgetLevel, number> = {
  accelerated: 0.7,
  normal: 1,
  constrained: 1.4,
}

export const SITES_PER_YEAR: Record<OrgSize, number> = { small: 10, medium: 25, large: 60 }

export const SECTOR_LABEL: Record<OTSector, string> = {
  energy: 'Energy (power & pipelines)',
  water: 'Water & wastewater',
  rail: 'Rail & transit',
  manufacturing: 'Manufacturing & process',
  building: 'Building automation',
}

export const SITE_NOUN: Record<OTSector, string> = {
  energy: 'substations / stations',
  water: 'treatment plants / pump stations',
  rail: 'interlockings / stations',
  manufacturing: 'plants / production cells',
  building: 'buildings',
}

interface PhaseTemplate {
  id: string
  name: string
  startMonth: number
  /** null = computed from siteCount */
  baseMonths: number | null
  description: string
  assets: Record<OTSector, string>
  driver: 'forgery' | 'hndl' | 'both' | 'inventory'
}

const PHASES: PhaseTemplate[] = [
  {
    id: 'inventory',
    name: 'Inventory & CBOM',
    startMonth: 0,
    baseMonths: 6,
    description:
      'Crypto inventory per zone and conduit, vendor PQC roadmaps, signing-root register.',
    assets: {
      energy: 'IEDs, RTUs, SCADA, ICCP links, vendor signing keys',
      water: 'PLCs, HMIs, telemetry radios, vendor VPNs',
      rail: 'KMC, interlockings, on-board units, FRMCS endpoints',
      manufacturing: 'PLCs, DCS, OPC UA servers, CIP Security / PROFINET devices',
      building: 'BACnet/SC hubs and nodes, BMS servers, integrator access',
    },
    driver: 'inventory',
  },
  {
    id: 'boundary',
    name: 'Boundary & remote access',
    startMonth: 6,
    baseMonths: 12,
    description:
      'Hybrid ML-KEM on VPNs, jump hosts and inter-site links — the recorded-traffic exposure.',
    assets: {
      energy: 'ICCP / control-centre links, vendor remote access',
      water: 'Vendor and on-call VPNs, telemetry backhaul',
      rail: 'Control-centre WAN, maintenance access',
      manufacturing: 'Plant DMZ, vendor remote support',
      building: 'Integrator remote access, cloud BMS links',
    },
    driver: 'hndl',
  },
  {
    id: 'signing-roots',
    name: 'Signing roots',
    startMonth: 6,
    baseMonths: 18,
    description:
      'Firmware, project and certificate signing moved to LMS or ML-DSA in HSMs; vendor contracts updated.',
    assets: {
      energy: 'IED / RTU firmware signing, IEC 62351-9 PKI, settings signing',
      water: 'PLC firmware and project signing',
      rail: 'KMC keys, interlocking software signing',
      manufacturing: 'PLC / safety-PLC firmware and project signing, GSD file signing',
      building: 'Controller firmware, BACnet/SC CA',
    },
    driver: 'forgery',
  },
  {
    id: 'supervisory',
    name: 'Control centre & supervisory',
    startMonth: 18,
    baseMonths: 12,
    description: 'SCADA, historians and OPC UA / TLS servers move to PQC-capable stacks.',
    assets: {
      energy: 'EMS / SCADA, historians, MMS clients',
      water: 'SCADA, historians',
      rail: 'Traffic management, SCADA for traction power',
      manufacturing: 'MES, OPC UA servers, DCS servers',
      building: 'BMS head-ends, BACnet/SC hub',
    },
    driver: 'both',
  },
  {
    id: 'site-rollout',
    name: 'Site rollout',
    startMonth: 24,
    baseMonths: null,
    description:
      'Site by site: device firmware that accepts PQC signatures, PQC certificates, KDC / group-key channels.',
    assets: {
      energy: 'Substations: station bus, GDOI KDC, relays',
      water: 'Plants and pump stations',
      rail: 'Interlockings and trackside equipment',
      manufacturing: 'Production cells and lines',
      building: 'Buildings and floors',
    },
    driver: 'both',
  },
  {
    id: 'legacy',
    name: 'Legacy & brownfield',
    startMonth: 36,
    baseMonths: 24,
    description:
      'Bump-in-the-wire appliances and VPN overlays for devices that cannot be updated; replacement at end of life.',
    assets: {
      energy: 'Serial RTUs, legacy relays',
      water: 'Legacy PLCs, plain Modbus',
      rail: 'Pre-ETCS signalling interfaces',
      manufacturing: 'Legacy PLCs and fieldbus',
      building: 'BACnet/IP and MS/TP controllers',
    },
    driver: 'both',
  },
]

export interface RoadmapPhase {
  id: string
  name: string
  description: string
  assets: string
  driver: PhaseTemplate['driver']
  startMonth: number
  durationMonths: number
  endMonth: number
  finishYear: number
  afterPlanningYear: boolean
}

/** Calendar year in which programme month `m` ends (month 1–12 = 2026). */
export function monthToYear(m: number): number {
  return ROADMAP_START_YEAR + Math.max(0, Math.ceil(m / 12) - 1)
}

export function siteRolloutMonths(inputs: RoadmapInputs): number {
  return Math.ceil(
    (Math.max(1, inputs.siteCount) / SITES_PER_YEAR[inputs.orgSize]) *
      12 *
      BUDGET_FACTOR[inputs.budget]
  )
}

export function buildRoadmap(inputs: RoadmapInputs): RoadmapPhase[] {
  const f = BUDGET_FACTOR[inputs.budget]
  return PHASES.map((p) => {
    const durationMonths =
      p.baseMonths === null ? siteRolloutMonths(inputs) : Math.ceil(p.baseMonths * f)
    const endMonth = p.startMonth + durationMonths
    const finishYear = monthToYear(endMonth)
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      assets: p.assets[inputs.sector],
      driver: p.driver,
      startMonth: p.startMonth,
      durationMonths,
      endMonth,
      finishYear,
      afterPlanningYear: finishYear > inputs.planningYear,
    }
  })
}

export function roadmapSummary(inputs: RoadmapInputs) {
  const phases = buildRoadmap(inputs)
  const totalMonths = Math.max(...phases.map((p) => p.endMonth))
  return {
    phases,
    totalMonths,
    finishYear: monthToYear(totalMonths),
    lateCount: phases.filter((p) => p.afterPlanningYear).length,
    signingRootsFinish: phases.find((p) => p.id === 'signing-roots')!.finishYear,
  }
}

export interface Milestone {
  year: number
  label: string
  regime: string
}

/** Regulatory milestones shown for the chosen sector and jurisdiction. */
export function milestonesFor(inputs: RoadmapInputs): Milestone[] {
  const us = inputs.jurisdiction === 'us' || inputs.jurisdiction === 'both'
  const eu = inputs.jurisdiction === 'eu' || inputs.jurisdiction === 'both'
  const m: Milestone[] = []
  if (us) {
    m.push({
      year: 2025,
      label: 'CNSA 2.0: prefer PQC for software/firmware signing (NSS suppliers)',
      regime: 'NSA CNSA 2.0',
    })
    m.push({
      year: 2030,
      label: 'CNSA 2.0: PQC-only firmware signing and networking equipment (NSS)',
      regime: 'NSA CNSA 2.0',
    })
    if (inputs.sector === 'energy') {
      m.push({
        year: 2026,
        label:
          'CIP-012-2 effective (1 July) — confidentiality, integrity and availability of Control Center links',
        regime: 'NERC CIP',
      })
      m.push({
        year: 2026,
        label: 'TSA SD Pipeline-2021-02G in force (to 2 May 2027) for designated pipelines',
        regime: 'TSA',
      })
    }
  }
  if (eu) {
    m.push({
      year: 2026,
      label: 'EU coordinated PQC roadmap: start the transition by end of 2026',
      regime: 'EU NIS-CG roadmap',
    })
    m.push({
      year: 2030,
      label: 'EU coordinated PQC roadmap: high-risk use cases migrated by end of 2030',
      regime: 'EU NIS-CG roadmap',
    })
    m.push({
      year: 2035,
      label: 'EU coordinated PQC roadmap: as many systems as feasible by 2035',
      regime: 'EU NIS-CG roadmap',
    })
  }
  return m.sort((a, b) => a.year - b.year)
}
