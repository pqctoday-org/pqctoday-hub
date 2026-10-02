// SPDX-License-Identifier: GPL-3.0-only
/**
 * Safety & Consequence Scorer data (workshop Step 4).
 *
 * Generalised from the old energy-only SafetyRiskScorer to all five OT
 * sectors. Changes from the plan audit:
 *  - The "Minutes (with CRQC)" time-to-exploit claims are gone: they assumed
 *    DNP3 SAv5 uses RSA key transport, which is only the optional method
 *    (E10). Each attack path now states its PRECONDITION instead.
 *  - Scoring is framed the way a process-safety engineer would read it
 *    (IEC 61511): consequence severity, and whether an independent safety
 *    layer still stops the hazard if the control path is forged.
 *
 *   consequence = severityWeight × (0.6 + 0.4 × min(1, log10(population) / 7))
 *   exposure    = max(commandExposure, firmwareExposure)
 *   compound    = round(consequence × exposure × safetyLayerFactor × lifeFactor)
 *   lifeFactor  = 0.5 + 0.5 × min(1, lifecycleYears / 25)
 *
 * Thresholds: ≥ 60 critical, ≥ 40 high, ≥ 20 medium, otherwise low.
 * This is a teaching model, not a SIL determination ("Model estimate").
 */
import type { OTSector } from './otProtocolData'

export type Severity = 'catastrophic' | 'critical' | 'major' | 'moderate' | 'minor'
export type CommandAuth = 'none' | 'symmetric' | 'classical-pk' | 'pqc'
export type FirmwareSigning = 'none' | 'classical' | 'pqc'
export type SafetyLayer = 'independent' | 'networked' | 'none'

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  catastrophic: 100,
  critical: 70,
  major: 45,
  moderate: 25,
  minor: 10,
}

export const COMMAND_EXPOSURE: Record<CommandAuth, number> = {
  none: 1,
  symmetric: 0.2,
  'classical-pk': 1,
  pqc: 0,
}

export const FIRMWARE_EXPOSURE: Record<FirmwareSigning, number> = {
  none: 1,
  classical: 1,
  pqc: 0,
}

export const SAFETY_LAYER_FACTOR: Record<SafetyLayer, number> = {
  independent: 0.5,
  networked: 0.8,
  none: 1,
}

export const SAFETY_LAYER_LABEL: Record<SafetyLayer, string> = {
  independent: 'Independent SIS / mechanical protection (not reachable from the control network)',
  networked: 'SIS present but networked (its own firmware and logic signing matter)',
  none: 'No independent safety layer',
}

export interface AttackPath {
  name: string
  precondition: string
  threat: 'forgery' | 'hndl' | 'today'
}

export interface ConsequenceScenario {
  id: string
  sector: OTSector
  name: string
  description: string
  severity: Severity
  population: number
  commandAuth: CommandAuth
  firmwareSigning: FirmwareSigning
  safetyLayer: SafetyLayer
  lifecycleYears: number
  attackPaths: AttackPath[]
  consequenceChain: string[]
  regimes: string[]
}

export const CONSEQUENCE_SCENARIOS: ConsequenceScenario[] = [
  {
    id: 'transmission-scada',
    sector: 'energy',
    name: 'Transmission SCADA',
    description:
      'Control-centre SCADA operating high-voltage breakers over IEC 104 / DNP3 with TLS.',
    severity: 'catastrophic',
    population: 5_000_000,
    commandAuth: 'classical-pk',
    firmwareSigning: 'classical',
    safetyLayer: 'independent',
    lifecycleYears: 20,
    attackPaths: [
      {
        name: 'Forged control-centre certificate',
        precondition:
          'A CRQC derives the private key behind a SCADA peer certificate; attacker reaches the WAN',
        threat: 'forgery',
      },
      {
        name: 'Recorded ICCP / SCADA traffic',
        precondition:
          'Traffic recorded now, decrypted once a CRQC exists — reveals topology and settings',
        threat: 'hndl',
      },
    ],
    consequenceChain: [
      'Attacker presents a forged but valid-looking SCADA certificate',
      'Issues breaker-open commands during peak load',
      'Protection relays (independent of SCADA) trip to protect equipment',
      'Load shed across a region; restoration takes hours',
    ],
    regimes: ['NERC CIP-005-7', 'NERC CIP-012-2', 'IEC 62351'],
  },
  {
    id: 'gas-pipeline',
    sector: 'energy',
    name: 'Gas pipeline compressor station',
    description:
      'Pipeline SCADA operating compressors and block valves over DNP3 SAv5 (symmetric).',
    severity: 'catastrophic',
    population: 500_000,
    commandAuth: 'symmetric',
    firmwareSigning: 'classical',
    safetyLayer: 'independent',
    lifecycleYears: 25,
    attackPaths: [
      {
        name: 'Forged PLC / RTU firmware',
        precondition:
          "A CRQC forges the vendor's ECDSA firmware-signing key; attacker needs a delivery path (engineering workstation or update server)",
        threat: 'forgery',
      },
      {
        name: 'DNP3 SAv5 command forgery',
        precondition:
          'Needs the symmetric session or update keys — a quantum computer does not help (default symmetric key change)',
        threat: 'today',
      },
    ],
    consequenceChain: [
      'Malicious firmware accepted by a station controller',
      'Controller hides true pressure and drives a compressor past limits',
      'Mechanical relief and an independent shutdown system limit the event',
      'Pipeline outage; regulator investigation',
    ],
    regimes: ['TSA SD Pipeline-2021-02G', 'IEC 62443'],
  },
  {
    id: 'water-treatment',
    sector: 'water',
    name: 'Water treatment chemical dosing',
    description: 'Treatment-plant PLCs and HMI on plain Modbus/TCP behind a vendor VPN.',
    severity: 'critical',
    population: 1_000_000,
    commandAuth: 'none',
    firmwareSigning: 'classical',
    safetyLayer: 'none',
    lifecycleYears: 20,
    attackPaths: [
      {
        name: 'Unauthenticated Modbus write',
        precondition: 'Network access only — exploitable today, no quantum computer involved',
        threat: 'today',
      },
      {
        name: 'Recorded vendor-VPN traffic',
        precondition:
          'VPN with classical key exchange recorded now, decrypted later; exposes credentials and process data',
        threat: 'hndl',
      },
    ],
    consequenceChain: [
      'Attacker reaches the plant network through a compromised remote-access path',
      'Writes a new chemical-dosing setpoint over Modbus',
      'Analysers alarm; operators must catch it before treated water leaves the plant',
      'Boil-water notice or contamination event',
    ],
    regimes: ['EPA / AWIA §2013 risk assessment', 'IEC 62443'],
  },
  {
    id: 'rail-etcs',
    sector: 'rail',
    name: 'Rail signalling (ETCS key management)',
    description:
      'ERTMS/ETCS trackside and on-board units keyed by a Key Management Centre (UNISIG SUBSET-137).',
    severity: 'catastrophic',
    population: 200_000,
    commandAuth: 'classical-pk',
    firmwareSigning: 'classical',
    safetyLayer: 'networked',
    lifecycleYears: 30,
    attackPaths: [
      {
        name: 'Forged KMC identity',
        precondition:
          'A CRQC breaks the RSA / ECDH used by the KMC; attacker can then distribute keys to ETCS entities',
        threat: 'forgery',
      },
    ],
    consequenceChain: [
      'Forged key-management messages reach trackside equipment',
      'Authenticated movement authorities can no longer be trusted',
      'Lines fall back to degraded operation under safety rules',
      'Network-wide disruption; safety case re-assessment',
    ],
    regimes: ['UNISIG SUBSET-137', 'NIS2'],
  },
  {
    id: 'chemical-sis',
    sector: 'manufacturing',
    name: 'Chemical process with networked SIS',
    description:
      'Batch reactor with a DCS and a safety PLC that is engineered over the plant network.',
    severity: 'catastrophic',
    population: 50_000,
    commandAuth: 'classical-pk',
    firmwareSigning: 'classical',
    safetyLayer: 'networked',
    lifecycleYears: 20,
    attackPaths: [
      {
        name: 'Forged safety-logic download',
        precondition:
          'A CRQC forges the engineering-tool signing key; attacker reaches the safety engineering workstation',
        threat: 'forgery',
      },
    ],
    consequenceChain: [
      'Modified safety logic accepted by the safety PLC',
      'A trip that should close a feed valve no longer fires',
      'DCS fault drives the reactor out of its safe envelope',
      'Loss of containment',
    ],
    regimes: ['IEC 61511 Ed.2 §8.2.4', 'IEC 62443'],
  },
  {
    id: 'discrete-line',
    sector: 'manufacturing',
    name: 'Automotive assembly line',
    description: 'PLC-controlled line with EtherNet/IP and CIP Security device certificates.',
    severity: 'major',
    population: 2_000,
    commandAuth: 'classical-pk',
    firmwareSigning: 'classical',
    safetyLayer: 'independent',
    lifecycleYears: 15,
    attackPaths: [
      {
        name: 'Forged CIP Security device certificate',
        precondition: 'A CRQC forges a device certificate; attacker on the cell network',
        threat: 'forgery',
      },
    ],
    consequenceChain: [
      'Rogue device accepted as a trusted controller',
      'Production commands altered',
      'Hard-wired machine safety stops people getting hurt',
      'Days of lost production and scrapped parts',
    ],
    regimes: ['IEC 62443', 'NIS2'],
  },
  {
    id: 'hospital-bas',
    sector: 'building',
    name: 'Hospital building automation',
    description: 'BACnet/SC network running HVAC and pressure control for operating theatres.',
    severity: 'major',
    population: 5_000,
    commandAuth: 'classical-pk',
    firmwareSigning: 'classical',
    safetyLayer: 'none',
    lifecycleYears: 20,
    attackPaths: [
      {
        name: 'Forged BACnet/SC node certificate',
        precondition:
          'A CRQC forges an ECDSA operational certificate; attacker reaches the BACnet/SC hub',
        threat: 'forgery',
      },
    ],
    consequenceChain: [
      'Rogue node joins the BACnet/SC hub',
      'Room-pressure and air-change setpoints changed',
      'Theatres lose positive pressure; surgeries postponed',
    ],
    regimes: ['NIS2 (health sector)', 'IEC 62443'],
  },
  {
    id: 'hydro-spillway',
    sector: 'energy',
    name: 'Hydro dam spillway gates',
    description: 'Gate control PLCs reached from the control room over a radio link with TLS.',
    severity: 'catastrophic',
    population: 200_000,
    commandAuth: 'classical-pk',
    firmwareSigning: 'classical',
    safetyLayer: 'none',
    lifecycleYears: 30,
    attackPaths: [
      {
        name: 'Forged control-room certificate',
        precondition:
          'A CRQC forges the TLS certificate of the control room; attacker reaches the radio link',
        threat: 'forgery',
      },
    ],
    consequenceChain: [
      'Gate-open command accepted from a forged peer',
      'Uncontrolled release downstream during high water',
      'Flooding; emergency response',
    ],
    regimes: ['FERC hydropower security program', 'NERC CIP (if BES)'],
  },
]

export interface ScenarioInputs {
  severity: Severity
  population: number
  commandAuth: CommandAuth
  firmwareSigning: FirmwareSigning
  safetyLayer: SafetyLayer
}

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low'

export interface ConsequenceResult {
  scenarioId: string
  consequence: number
  exposure: number
  safetyLayerFactor: number
  lifeFactor: number
  compound: number
  riskLevel: RiskLevel
  exploitableToday: boolean
  driver: 'command' | 'firmware' | 'both' | 'none'
  actions: string[]
}

export function defaultInputs(s: ConsequenceScenario): ScenarioInputs {
  return {
    severity: s.severity,
    population: s.population,
    commandAuth: s.commandAuth,
    firmwareSigning: s.firmwareSigning,
    safetyLayer: s.safetyLayer,
  }
}

export function riskLevelFor(score: number): RiskLevel {
  return score >= 60 ? 'critical' : score >= 40 ? 'high' : score >= 20 ? 'medium' : 'low'
}

export function scoreScenario(
  s: ConsequenceScenario,
  inputs: ScenarioInputs = defaultInputs(s)
): ConsequenceResult {
  const popFactor = 0.6 + 0.4 * Math.min(1, Math.log10(Math.max(1, inputs.population)) / 7)
  const consequence = SEVERITY_WEIGHT[inputs.severity] * popFactor
  const cmd = COMMAND_EXPOSURE[inputs.commandAuth]
  const fw = FIRMWARE_EXPOSURE[inputs.firmwareSigning]
  const exposure = Math.max(cmd, fw)
  const safetyLayerFactor = SAFETY_LAYER_FACTOR[inputs.safetyLayer]
  const lifeFactor = 0.5 + 0.5 * Math.min(1, s.lifecycleYears / 25)
  const compound = Math.round(consequence * exposure * safetyLayerFactor * lifeFactor)
  const exploitableToday = inputs.commandAuth === 'none' || inputs.firmwareSigning === 'none'
  const driver: ConsequenceResult['driver'] =
    exposure === 0 ? 'none' : cmd > fw ? 'command' : fw > cmd ? 'firmware' : 'both'

  const actions: string[] = []
  if (exploitableToday)
    actions.push(
      'Close the present-day gap first: authenticate commands / sign firmware with any sound classical scheme or an authenticated overlay.'
    )
  if (inputs.firmwareSigning === 'classical')
    actions.push(
      'Ask vendors for LMS or ML-DSA firmware signing and dual-signature transition support (see Step 6).'
    )
  if (inputs.commandAuth === 'classical-pk')
    actions.push(
      'Plan PQC certificates for the command path; keep symmetric MACs where the protocol already uses them.'
    )
  if (inputs.safetyLayer === 'networked')
    actions.push(
      'IEC 61511 Ed.2 §8.2.4: include the SIS in the security risk assessment and sign safety-logic changes with a PQC scheme.'
    )
  if (inputs.safetyLayer === 'none' && riskLevelFor(compound) !== 'low')
    actions.push(
      'Consider an independent, non-programmable protection layer — it bounds the harm whatever the crypto.'
    )
  if (actions.length === 0)
    actions.push('No quantum-driven action: this posture is already PQC-ready.')

  return {
    scenarioId: s.id,
    consequence: Math.round(consequence * 10) / 10,
    exposure,
    safetyLayerFactor,
    lifeFactor: Math.round(lifeFactor * 100) / 100,
    compound,
    riskLevel: riskLevelFor(compound),
    exploitableToday,
    driver,
    actions,
  }
}
