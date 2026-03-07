// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */

import type {
  PhysicalConsequence,
  EnvironmentalSeverity,
  EnvironmentalZone,
  AssetCriticality,
  SafetyRiskResult,
} from './energyConstants'

// ---------------------------------------------------------------------------
// Crypto attack vectors
// ---------------------------------------------------------------------------

export interface CryptoAttackVector {
  id: string
  name: string
  description: string
  currentVulnerability: string
  quantumThreat: 'HNDL' | 'real-time' | 'both'
  timeToExploit: string
}

// ---------------------------------------------------------------------------
// Energy asset scenarios
// ---------------------------------------------------------------------------

export interface EnergyAssetScenario {
  id: string
  name: string
  description: string
  assetType: string
  defaultPhysicalConsequence: PhysicalConsequence
  defaultEnvironmentalSeverity: EnvironmentalSeverity
  defaultEnvironmentalZone: EnvironmentalZone
  defaultPopulationExposure: number
  defaultAssetCriticality: AssetCriticality
  assetLifecycleYears: number
  currentCryptoPosture: string
  attackVectors: CryptoAttackVector[]
  consequenceChain: string[]
  nercCipRelevance: string[]
}

export const ENERGY_SCENARIOS: EnergyAssetScenario[] = [
  {
    id: 'transmission-scada',
    name: 'Transmission SCADA',
    description: 'SCADA system controlling 230kV+ transmission substations and inter-tie breakers.',
    assetType: 'Transmission Grid Control',
    defaultPhysicalConsequence: 'catastrophic',
    defaultEnvironmentalSeverity: 'significant',
    defaultEnvironmentalZone: 'suburban',
    defaultPopulationExposure: 5_000_000,
    defaultAssetCriticality: 'tier-1',
    assetLifecycleYears: 20,
    currentCryptoPosture: 'TLS 1.2 / IPsec IKEv2 with RSA-2048',
    attackVectors: [
      {
        id: 'iccp-hndl',
        name: 'ICCP Link Decryption',
        description: 'HNDL attack on ICCP/TASE.2 inter-control-center link to learn grid topology.',
        currentVulnerability: 'RSA-2048 TLS',
        quantumThreat: 'HNDL',
        timeToExploit: 'Years (harvest now, decrypt with future CRQC)',
      },
      {
        id: 'cmd-forgery',
        name: 'Control Command Forgery',
        description: 'Forge breaker open/close commands via compromised authentication keys.',
        currentVulnerability: 'DNP3-SA RSA key transport',
        quantumThreat: 'real-time',
        timeToExploit: 'Minutes (with CRQC)',
      },
    ],
    consequenceChain: [
      'Quantum attacker decrypts ICCP communications',
      'Learns grid topology and real-time state',
      'Crafts forged breaker-open commands',
      'Transmission line de-energized during peak load',
      'Cascading protection relay trips',
      'Wide-area blackout affecting millions',
    ],
    nercCipRelevance: ['CIP-005', 'CIP-007', 'CIP-012'],
  },
  {
    id: 'gas-pipeline',
    name: 'Gas Pipeline SCADA',
    description:
      'SCADA system controlling natural gas pipeline compressor stations and valve operations.',
    assetType: 'Gas Pipeline Control',
    defaultPhysicalConsequence: 'catastrophic',
    defaultEnvironmentalSeverity: 'severe',
    defaultEnvironmentalZone: 'rural',
    defaultPopulationExposure: 500_000,
    defaultAssetCriticality: 'tier-1',
    assetLifecycleYears: 25,
    currentCryptoPosture: 'DNP3-SA with RSA-2048 / VPN IPsec',
    attackVectors: [
      {
        id: 'valve-cmd',
        name: 'Valve Command Forgery',
        description: 'Forge valve close/open commands to cause overpressure conditions.',
        currentVulnerability: 'DNP3-SA RSA key transport',
        quantumThreat: 'real-time',
        timeToExploit: 'Minutes (with CRQC)',
      },
      {
        id: 'compressor-hndl',
        name: 'Compressor Station HNDL',
        description: 'Harvest encrypted telemetry to map pipeline operating parameters.',
        currentVulnerability: 'IPsec IKEv2 RSA',
        quantumThreat: 'HNDL',
        timeToExploit: 'Years (harvest now)',
      },
    ],
    consequenceChain: [
      'Quantum attacker compromises DNP3-SA key distribution',
      'Forges valve position commands to compressor station',
      'Pipeline segment overpressurized beyond safety limits',
      'Safety relief valve may fail to compensate',
      'Pipeline rupture releasing natural gas',
      'Explosion risk and environmental contamination',
    ],
    nercCipRelevance: ['CIP-005', 'CIP-007'],
  },
  {
    id: 'distribution-scada',
    name: 'Distribution SCADA',
    description:
      'SCADA system controlling medium-voltage distribution feeders and automated switches.',
    assetType: 'Distribution Grid Control',
    defaultPhysicalConsequence: 'major',
    defaultEnvironmentalSeverity: 'moderate',
    defaultEnvironmentalZone: 'urban',
    defaultPopulationExposure: 200_000,
    defaultAssetCriticality: 'tier-2',
    assetLifecycleYears: 15,
    currentCryptoPosture: 'TLS 1.2 / DNP3 (no SA)',
    attackVectors: [
      {
        id: 'feeder-manip',
        name: 'Feeder Switching Manipulation',
        description:
          'Forge automated switching commands to create overload on distribution feeders.',
        currentVulnerability: 'No DNP3-SA deployed (plain DNP3)',
        quantumThreat: 'real-time',
        timeToExploit: 'Immediate (no crypto to break — network access required)',
      },
    ],
    consequenceChain: [
      'Attacker gains network access to distribution SCADA',
      'Sends forged switching commands via unprotected DNP3',
      'Multiple feeders overloaded simultaneously',
      'Localized power outage (200K customers)',
      'Extended restoration due to equipment damage',
    ],
    nercCipRelevance: ['CIP-005', 'CIP-007'],
  },
  {
    id: 'water-treatment',
    name: 'Water Treatment SCADA',
    description: 'SCADA system controlling water treatment chemical dosing and pump operations.',
    assetType: 'Water Treatment Control',
    defaultPhysicalConsequence: 'critical',
    defaultEnvironmentalSeverity: 'significant',
    defaultEnvironmentalZone: 'urban',
    defaultPopulationExposure: 1_000_000,
    defaultAssetCriticality: 'tier-1',
    assetLifecycleYears: 20,
    currentCryptoPosture: 'Modbus TCP (no security) / VPN',
    attackVectors: [
      {
        id: 'chemical-dosing',
        name: 'Chemical Dosing Manipulation',
        description: 'Modify chlorine/fluoride dosing setpoints to unsafe levels.',
        currentVulnerability: 'Modbus TCP (no authentication)',
        quantumThreat: 'real-time',
        timeToExploit: 'Immediate (Modbus has no native crypto)',
      },
      {
        id: 'vpn-hndl',
        name: 'VPN Tunnel Decryption',
        description: 'HNDL on VPN protecting Modbus traffic to learn system operations.',
        currentVulnerability: 'VPN IPsec RSA-2048',
        quantumThreat: 'HNDL',
        timeToExploit: 'Years (harvest now)',
      },
    ],
    consequenceChain: [
      'Quantum attacker decrypts VPN tunnel protecting SCADA traffic',
      'Maps water treatment process control parameters',
      'Manipulates chemical dosing via unprotected Modbus commands',
      'Dangerous chemical levels in water supply',
      'Public health emergency',
    ],
    nercCipRelevance: [],
  },
  {
    id: 'der-aggregator',
    name: 'DER Aggregator',
    description:
      'Platform managing thousands of distributed solar inverters, battery systems, and EV chargers.',
    assetType: 'Distributed Energy Resource Management',
    defaultPhysicalConsequence: 'major',
    defaultEnvironmentalSeverity: 'moderate',
    defaultEnvironmentalZone: 'suburban',
    defaultPopulationExposure: 500_000,
    defaultAssetCriticality: 'tier-2',
    assetLifecycleYears: 15,
    currentCryptoPosture: 'TLS 1.2 / IEEE 2030.5 with ECDSA P-256',
    attackVectors: [
      {
        id: 'der-cert-forge',
        name: 'DER Certificate Forgery',
        description: 'Forge IEEE 2030.5 device certificates to impersonate legitimate DERs.',
        currentVulnerability: 'ECDSA P-256 device certificates',
        quantumThreat: 'real-time',
        timeToExploit: 'Hours (with CRQC)',
      },
    ],
    consequenceChain: [
      'Quantum attacker forges DER device certificates',
      'Impersonates thousands of solar inverters',
      'Sends coordinated curtailment/injection commands',
      'Grid frequency instability from sudden generation loss/gain',
      'Protection systems trip, localized blackout',
    ],
    nercCipRelevance: ['CIP-005'],
  },
  {
    id: 'smart-metering',
    name: 'Smart Metering',
    description:
      'Advanced metering infrastructure (AMI) with millions of smart meters using DLMS/COSEM.',
    assetType: 'Revenue Metering',
    defaultPhysicalConsequence: 'moderate',
    defaultEnvironmentalSeverity: 'minor',
    defaultEnvironmentalZone: 'urban',
    defaultPopulationExposure: 2_000_000,
    defaultAssetCriticality: 'tier-3',
    assetLifecycleYears: 18,
    currentCryptoPosture: 'DLMS/COSEM Suite 1 (AES-128 + ECDSA P-256)',
    attackVectors: [
      {
        id: 'meter-key-compromise',
        name: 'Meter Key Compromise',
        description: 'Break ECDH key agreement to derive meter encryption keys.',
        currentVulnerability: 'ECDH P-256',
        quantumThreat: 'HNDL',
        timeToExploit: 'Years (harvest encrypted meter data)',
      },
      {
        id: 'fw-sign-forge',
        name: 'Firmware Signature Forgery',
        description: 'Forge firmware update signatures to push malicious code to meter fleet.',
        currentVulnerability: 'ECDSA P-256 firmware signing',
        quantumThreat: 'real-time',
        timeToExploit: 'Hours (with CRQC)',
      },
    ],
    consequenceChain: [
      'Quantum attacker compromises meter encryption keys (HNDL)',
      'Reads all smart meter data (usage patterns, occupancy inference)',
      'Alternatively: forges firmware updates to meter fleet',
      'Malicious firmware causes mass disconnect or billing fraud',
      'Revenue loss and customer data exposure',
    ],
    nercCipRelevance: [],
  },
  {
    id: 'nuclear-instrumentation',
    name: 'Nuclear Safety Instrumentation',
    description:
      'Digital I&C (Instrumentation and Control) for nuclear power plant safety systems.',
    assetType: 'Nuclear Safety Systems',
    defaultPhysicalConsequence: 'catastrophic',
    defaultEnvironmentalSeverity: 'severe',
    defaultEnvironmentalZone: 'protected-ecosystem',
    defaultPopulationExposure: 3_000_000,
    defaultAssetCriticality: 'tier-1',
    assetLifecycleYears: 40,
    currentCryptoPosture: 'Air-gapped with physical controls / NRC-regulated',
    attackVectors: [
      {
        id: 'supply-chain',
        name: 'Supply Chain Compromise',
        description: 'Compromise firmware signing in I&C vendor supply chain.',
        currentVulnerability: 'Vendor code signing certificates (RSA/ECDSA)',
        quantumThreat: 'real-time',
        timeToExploit: 'Months (supply chain attack + CRQC)',
      },
    ],
    consequenceChain: [
      'Quantum attacker forges I&C vendor code signing certificate',
      'Compromised firmware deployed during scheduled maintenance',
      'Safety system logic altered',
      'Multiple safety barriers potentially bypassed',
      'NRC reportable event; public evacuation zone activated',
    ],
    nercCipRelevance: [],
  },
  {
    id: 'dam-control',
    name: 'Dam / Hydroelectric Control',
    description:
      'SCADA controlling spillway gates, turbine operations, and water level monitoring.',
    assetType: 'Hydroelectric Dam Control',
    defaultPhysicalConsequence: 'catastrophic',
    defaultEnvironmentalSeverity: 'severe',
    defaultEnvironmentalZone: 'rural',
    defaultPopulationExposure: 200_000,
    defaultAssetCriticality: 'tier-1',
    assetLifecycleYears: 30,
    currentCryptoPosture: 'DNP3-SA / VPN IPsec',
    attackVectors: [
      {
        id: 'spillway-cmd',
        name: 'Spillway Gate Command Forgery',
        description: 'Forge commands to open/close spillway gates during flood conditions.',
        currentVulnerability: 'DNP3-SA RSA key transport',
        quantumThreat: 'real-time',
        timeToExploit: 'Minutes (with CRQC)',
      },
    ],
    consequenceChain: [
      'Quantum attacker compromises DNP3-SA authentication',
      'Forges spillway gate commands during high water',
      'Uncontrolled water release downstream',
      'Flooding of downstream communities',
      'Dam structural stress; potential failure',
    ],
    nercCipRelevance: ['CIP-005', 'CIP-007'],
  },
]

// ---------------------------------------------------------------------------
// Risk scoring engine
// ---------------------------------------------------------------------------

const PHYSICAL_SCORES: Record<PhysicalConsequence, number> = {
  catastrophic: 1000,
  critical: 100,
  major: 10,
  moderate: 1,
  minor: 0.1,
}

const ENVIRONMENTAL_SCORES: Record<EnvironmentalSeverity, number> = {
  severe: 100,
  significant: 50,
  moderate: 10,
  minor: 1,
  none: 0,
}

const ZONE_MULTIPLIERS: Record<EnvironmentalZone, number> = {
  'protected-ecosystem': 3.0,
  urban: 2.0,
  suburban: 1.5,
  rural: 1.0,
  industrial: 0.8,
}

const CRITICALITY_SCORES: Record<AssetCriticality, number> = {
  'tier-1': 3,
  'tier-2': 2,
  'tier-3': 1,
}

export function computeSafetyRisk(
  scenario: EnergyAssetScenario,
  overrides?: {
    physicalConsequence?: PhysicalConsequence
    environmentalSeverity?: EnvironmentalSeverity
    environmentalZone?: EnvironmentalZone
    populationExposure?: number
    assetCriticality?: AssetCriticality
  }
): SafetyRiskResult {
  const phys = overrides?.physicalConsequence ?? scenario.defaultPhysicalConsequence
  const envSev = overrides?.environmentalSeverity ?? scenario.defaultEnvironmentalSeverity
  const envZone = overrides?.environmentalZone ?? scenario.defaultEnvironmentalZone
  const pop = overrides?.populationExposure ?? scenario.defaultPopulationExposure
  const crit = overrides?.assetCriticality ?? scenario.defaultAssetCriticality

  // Normalize population to 0-100 scale (log10)
  const popNorm = Math.min(100, Math.log10(Math.max(1, pop)) * 15)

  // Safety score: physical severity * population * criticality
  const safetyScore = (PHYSICAL_SCORES[phys] / 1000) * popNorm * CRITICALITY_SCORES[crit]

  // Environmental score: severity * zone multiplier
  const environmentalScore = (ENVIRONMENTAL_SCORES[envSev] / 100) * ZONE_MULTIPLIERS[envZone] * 50

  // HNDL score: lifecycle years remaining / 10 * criticality
  const hndlScore = (scenario.assetLifecycleYears / 40) * CRITICALITY_SCORES[crit] * 33

  // Compliance penalty: NERC CIP relevance count * 5
  const compliancePenalty = scenario.nercCipRelevance.length * 5

  // Compound score (0-100)
  const raw =
    safetyScore * 0.4 + environmentalScore * 0.2 + hndlScore * 0.2 + compliancePenalty * 0.2
  const compoundRiskScore = Math.min(100, Math.round(raw))

  const riskLevel: SafetyRiskResult['riskLevel'] =
    compoundRiskScore >= 75
      ? 'critical'
      : compoundRiskScore >= 50
        ? 'high'
        : compoundRiskScore >= 25
          ? 'medium'
          : 'low'

  const recommendedActions: string[] = []
  if (compoundRiskScore >= 75) {
    recommendedActions.push('Immediate PQC hybrid deployment on all internet-facing links')
    recommendedActions.push('Engage vendor for PQC firmware roadmap')
  }
  if (compoundRiskScore >= 50) {
    recommendedActions.push('Complete cryptographic inventory (CBOM) within 6 months')
    recommendedActions.push('Begin PQC proof-of-concept for highest-risk protocols')
  }
  if (scenario.assetLifecycleYears >= 20) {
    recommendedActions.push('Factor HNDL window into all key management decisions')
  }
  if (scenario.nercCipRelevance.length > 0) {
    recommendedActions.push(
      `Ensure NERC CIP compliance for: ${scenario.nercCipRelevance.join(', ')}`
    )
  }

  return {
    scenarioId: scenario.id,
    safetyScore: Math.round(safetyScore * 10) / 10,
    environmentalScore: Math.round(environmentalScore * 10) / 10,
    hndlScore: Math.round(hndlScore * 10) / 10,
    compliancePenalty,
    compoundRiskScore,
    riskLevel,
    recommendedActions,
  }
}
