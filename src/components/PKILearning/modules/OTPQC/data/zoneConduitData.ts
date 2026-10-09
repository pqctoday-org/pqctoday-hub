// SPDX-License-Identifier: GPL-3.0-only
/**
 * Zone & Conduit Planner data (workshop Step 2): the Purdue reference model
 * mapped onto IEC 62443 zones and conduits.
 *
 * Fix for plan finding I22: the old Purdue planner ranked layers by HNDL alone
 * and hard-coded Level 0–1 as "low". In OT the main quantum threat is
 * AUTHENTICITY — forged commands, firmware and project files — so every zone
 * is scored on two separate axes:
 *
 *   authFactor = max(factor(firmware / project signing), factor(command authentication))
 *   forgery = 100 × authFactor × (consequence / 5) × (0.5 + 0.5 × lifeFactor)
 *   hndl    = 100 × confFactor × exposure × min(1, dataLifeYears / 10)
 *   priority = max(forgery, hndl)          (the larger one is the "driver")
 *
 * lifeFactor = min(1, lifecycleYears / 25): an asset still in service when a
 * CRQC may exist carries its signing roots and keys into that window.
 *
 * "No crypto" postures are NOT scored as a quantum risk — they are flagged as
 * a present-day gap, because they are forgeable or readable today without any
 * quantum computer.
 *
 * Authentication has two settings per zone (owner decision 2026-10-09):
 * firmware / project signing, and command / message authentication. Installed
 * L0–L1 command traffic is mostly unauthenticated (CISA, "Barriers to Secure OT
 * Communication", 2026; NIST SP 800-82r3 §5.3.6), so those zones default to
 * command authentication "none" — flagged as a present-day gap — while their
 * firmware signing keeps its classical signature and drives the forgery score.
 * A certificate-based command channel (OPC UA, CIP Security) still counts.
 *
 * Conduits carry the attack path they belong to (it-ot / remote / close).
 *
 * All numbers here are a teaching model, not a measurement ("Model estimate").
 */

export type AuthPosture = 'none' | 'symmetric' | 'classical-signature' | 'pqc'
export type ConfPosture = 'none' | 'symmetric' | 'classical-kex' | 'pqc-hybrid'
export type SecurityLevel = 1 | 2 | 3 | 4

export const AUTH_POSTURES: { id: AuthPosture; label: string; factor: number }[] = [
  { id: 'none', label: 'None (unauthenticated)', factor: 0 },
  { id: 'symmetric', label: 'Symmetric (HMAC / PSK)', factor: 0.15 },
  { id: 'classical-signature', label: 'RSA / ECDSA signatures or certificates', factor: 1 },
  { id: 'pqc', label: 'ML-DSA / LMS (or hybrid)', factor: 0 },
]

export const CONF_POSTURES: { id: ConfPosture; label: string; factor: number }[] = [
  { id: 'none', label: 'None (plaintext)', factor: 0 },
  { id: 'symmetric', label: 'Symmetric (pre-shared keys)', factor: 0.1 },
  { id: 'classical-kex', label: 'RSA / ECDHE key exchange', factor: 1 },
  { id: 'pqc-hybrid', label: 'Hybrid ML-KEM key exchange', factor: 0 },
]

export interface OTZone {
  id: string
  /** Purdue level label */
  purdue: string
  name: string
  assets: string
  /** 1–5: physical consequence of a forged command / firmware in this zone */
  consequence: number
  lifecycleYears: number
  /** 0–1: how reachable this zone's traffic is for recording (harvest) */
  exposure: number
  /** years harvested data stays useful to an attacker */
  dataLifeYears: number
  slTarget: SecurityLevel
  /** firmware and project downloads */
  defaultFirmwareAuth: AuthPosture
  /** control commands and messages */
  defaultCommandAuth: AuthPosture
  defaultConf: ConfPosture
  /** What a signing root / authenticity anchor looks like here */
  authenticityAnchor: string
}

export const OT_ZONES: OTZone[] = [
  {
    id: 'enterprise',
    purdue: 'L4–5',
    name: 'Enterprise zone',
    assets: 'ERP, email, corporate identity, cloud services',
    consequence: 2,
    lifecycleYears: 5,
    exposure: 1,
    dataLifeYears: 7,
    slTarget: 1,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'classical-signature',
    defaultConf: 'classical-kex',
    authenticityAnchor: 'Corporate PKI and identity provider',
  },
  {
    id: 'remote-access',
    purdue: 'L3.5',
    name: 'Remote & vendor access',
    assets: 'VPN concentrators, jump hosts, vendor access portals',
    consequence: 4,
    lifecycleYears: 5,
    exposure: 1,
    dataLifeYears: 10,
    slTarget: 3,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'classical-signature',
    defaultConf: 'classical-kex',
    authenticityAnchor: 'VPN / SSH certificates and MFA tokens that reach into control zones',
  },
  {
    id: 'dmz',
    purdue: 'L3.5',
    name: 'Industrial DMZ',
    assets: 'Historian replicas, patch servers, data diodes, file transfer',
    consequence: 3,
    lifecycleYears: 7,
    exposure: 1,
    dataLifeYears: 10,
    slTarget: 3,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'classical-signature',
    defaultConf: 'classical-kex',
    authenticityAnchor: 'Patch and update signatures that pass through to the plant',
  },
  {
    id: 'iiot-connectors',
    purdue: 'L3.5 (separate segment)',
    name: 'IIoT & cloud connectors',
    assets: 'IIoT platform and edge gateways, cloud historians, remote monitoring',
    consequence: 4,
    lifecycleYears: 7,
    exposure: 1,
    dataLifeYears: 10,
    slTarget: 3,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'classical-signature',
    defaultConf: 'classical-kex',
    authenticityAnchor:
      'Gateway and cloud-service certificates; routed through the DMZ border firewall (NIST SP 800-82r3 §5.4.2)',
  },
  {
    id: 'site-ops',
    purdue: 'L3',
    name: 'Site operations',
    assets: 'Engineering workstations, domain controllers, site historian',
    consequence: 3,
    lifecycleYears: 10,
    exposure: 0.5,
    dataLifeYears: 10,
    slTarget: 2,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'classical-signature',
    defaultConf: 'classical-kex',
    authenticityAnchor: 'Project-signing keys on engineering workstations',
  },
  {
    id: 'supervisory',
    purdue: 'L2',
    name: 'Supervisory control',
    assets: 'SCADA servers, HMIs, OPC UA servers',
    consequence: 4,
    lifecycleYears: 15,
    exposure: 0.4,
    dataLifeYears: 10,
    slTarget: 2,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'classical-signature',
    defaultConf: 'classical-kex',
    authenticityAnchor: 'OPC UA / TLS certificates that authorise control writes',
  },
  {
    id: 'control',
    purdue: 'L1',
    name: 'Basic control',
    assets: 'PLCs, RTUs, IEDs, DCS controllers',
    consequence: 5,
    lifecycleYears: 20,
    exposure: 0.3,
    dataLifeYears: 5,
    slTarget: 3,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'none',
    defaultConf: 'none',
    authenticityAnchor: 'Vendor firmware-signing keys and signed project downloads',
  },
  {
    id: 'sis',
    purdue: 'L1 (SIS)',
    name: 'Safety instrumented system',
    assets: 'Safety PLCs and logic solvers (IEC 61511)',
    consequence: 5,
    lifecycleYears: 20,
    exposure: 0.2,
    dataLifeYears: 5,
    slTarget: 3,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'none',
    defaultConf: 'none',
    authenticityAnchor: 'Safety-logic and firmware signatures — the last line before harm',
  },
  {
    id: 'process',
    purdue: 'L0',
    name: 'Process / field devices',
    assets: 'Smart transmitters, drives, actuators, merging units',
    consequence: 4,
    lifecycleYears: 25,
    exposure: 0.2,
    dataLifeYears: 5,
    slTarget: 2,
    defaultFirmwareAuth: 'classical-signature',
    defaultCommandAuth: 'none',
    defaultConf: 'none',
    authenticityAnchor: 'Signed device firmware; often no message authentication at all',
  },
]

export type TodayGap = 'unauthenticated-firmware' | 'unauthenticated-command' | 'plaintext'

export interface ZoneAssessment {
  zone: OTZone
  firmwareAuth: AuthPosture
  commandAuth: AuthPosture
  conf: ConfPosture
  forgery: number
  hndl: number
  priority: number
  driver: 'forgery' | 'hndl' | 'none'
  /** unauthenticated or plaintext today — a present-day gap */
  todayGaps: TodayGap[]
}

const authFactor = (a: AuthPosture) => AUTH_POSTURES.find((p) => p.id === a)?.factor ?? 0
const confFactor = (c: ConfPosture) => CONF_POSTURES.find((p) => p.id === c)?.factor ?? 0

export function assessZone(
  zone: OTZone,
  firmwareAuth: AuthPosture = zone.defaultFirmwareAuth,
  commandAuth: AuthPosture = zone.defaultCommandAuth,
  conf: ConfPosture = zone.defaultConf
): ZoneAssessment {
  const lifeFactor = Math.min(1, zone.lifecycleYears / 25)
  const factor = Math.max(authFactor(firmwareAuth), authFactor(commandAuth))
  const forgery = Math.round(100 * factor * (zone.consequence / 5) * (0.5 + 0.5 * lifeFactor))
  const hndl = Math.round(
    100 * confFactor(conf) * zone.exposure * Math.min(1, zone.dataLifeYears / 10)
  )
  const priority = Math.max(forgery, hndl)
  const driver: ZoneAssessment['driver'] =
    priority === 0 ? 'none' : forgery >= hndl ? 'forgery' : 'hndl'
  const todayGaps: TodayGap[] = []
  if (firmwareAuth === 'none') todayGaps.push('unauthenticated-firmware')
  if (commandAuth === 'none') todayGaps.push('unauthenticated-command')
  if (conf === 'none') todayGaps.push('plaintext')
  return { zone, firmwareAuth, commandAuth, conf, forgery, hndl, priority, driver, todayGaps }
}

/** Sort: priority desc, then forgery desc (authenticity breaks ties), then zone order. */
export function rankZones(assessments: ZoneAssessment[]): ZoneAssessment[] {
  return [...assessments].sort(
    (a, b) =>
      b.priority - a.priority ||
      b.forgery - a.forgery ||
      OT_ZONES.indexOf(a.zone) - OT_ZONES.indexOf(b.zone)
  )
}

export function defaultAssessments(): ZoneAssessment[] {
  return OT_ZONES.map((z) => assessZone(z))
}

export function recommendedAction(a: ZoneAssessment): string {
  if (a.todayGaps.includes('unauthenticated-firmware'))
    return 'Firmware and projects are unauthenticated today — add classical signing first; that is not a quantum problem.'
  const commandGap = a.todayGaps.includes('unauthenticated-command')
    ? 'Commands are unauthenticated today — fix that first with classical message authentication or an authenticating gateway. '
    : ''
  if (a.driver === 'forgery')
    return `${commandGap}Move the signing roots: firmware / project / certificate signing to LMS or ML-DSA in an HSM, then make devices accept the new signatures.`
  if (a.driver === 'hndl')
    return `${commandGap}Turn on hybrid ML-KEM key exchange on this boundary (TLS 1.3 / IKEv2) — recorded traffic is the exposure.`
  return `${commandGap}No quantum exposure in this posture.`
}

/** The three ways into OT that the attack-surface section teaches. */
export type AttackPath = 'it-ot' | 'remote' | 'close'

export const ATTACK_PATHS: { id: AttackPath; label: string; short: string }[] = [
  { id: 'it-ot', label: 'IT-to-OT lateral movement', short: 'A' },
  { id: 'remote', label: 'Remote access and connected devices', short: 'B' },
  { id: 'close', label: 'Physical or local access', short: 'C' },
]

export interface OTConduit {
  id: string
  from: string
  to: string
  carries: string
  pqcAction: string
  path: AttackPath
  /** a route that should not exist: shown to teach the anti-pattern */
  bypass?: boolean
}

export const OT_CONDUITS: OTConduit[] = [
  {
    id: 'c-ent-dmz',
    from: 'enterprise',
    to: 'dmz',
    carries: 'Historian replication, patch downloads, business reporting',
    pqcAction:
      'Hybrid ML-KEM TLS 1.3 / IKEv2 on the firewall pair; verify patch signatures before they cross',
    path: 'it-ot',
  },
  {
    id: 'c-remote-dmz',
    from: 'remote-access',
    to: 'dmz',
    carries: 'Vendor and staff interactive remote sessions (NERC CIP-005-7 R2/R3 in the US grid)',
    pqcAction: 'PQC-hybrid VPN or SSH with MFA; terminate at a jump host, never directly in L1',
    path: 'remote',
  },
  {
    id: 'c-ent-ops',
    from: 'enterprise',
    to: 'site-ops',
    carries:
      'Shared identity: Active Directory trust, corporate accounts reused in OT, single sign-on',
    pqcAction:
      'Separate OT identity from corporate accounts (NIST SP 800-82r3); move the certificates and tokens that remain on this trust to PQC-ready issuers',
    path: 'it-ot',
  },
  {
    id: 'c-iiot-dmz',
    from: 'iiot-connectors',
    to: 'dmz',
    carries: 'IIoT telemetry, cloud historian replication, remote monitoring APIs',
    pqcAction:
      'Route through the DMZ border firewall (NIST SP 800-82r3 §5.4.2); hybrid ML-KEM TLS on the cloud link, PQC-ready gateway certificates',
    path: 'remote',
  },
  {
    id: 'c-iiot-bypass',
    from: 'iiot-connectors',
    to: 'site-ops',
    carries: 'Cloud-to-plant connection that skips the DMZ (a DMZ bypass)',
    pqcAction:
      'Remove it, or put the DMZ in the path — a bypass exposes interfaces the zone model assumes are closed (NIST SP 800-82r3 §5.3.7)',
    path: 'remote',
    bypass: true,
  },
  {
    id: 'c-dmz-ops',
    from: 'dmz',
    to: 'site-ops',
    carries: 'Approved files, updates, one-way data out (often via data diode)',
    pqcAction:
      'A data diode has no key exchange to break; the files it passes still need PQC signature checks',
    path: 'it-ot',
  },
  {
    id: 'c-ops-control',
    from: 'site-ops',
    to: 'control',
    carries: 'Project downloads and firmware updates from engineering workstations',
    pqcAction: 'Signed projects and firmware (LMS / ML-DSA); controllers verify before accepting',
    path: 'it-ot',
  },
  {
    id: 'c-sup-control',
    from: 'supervisory',
    to: 'control',
    carries: 'SCADA polling and control commands (DNP3, IEC 104, OPC UA, CIP, Modbus)',
    pqcAction:
      'Keep symmetric MACs where they exist; migrate certificate-based channels to PQC policies',
    path: 'it-ot',
  },
  {
    id: 'c-control-process',
    from: 'control',
    to: 'process',
    carries: 'Fieldbus I/O, GOOSE / SV, PROFINET cyclic data',
    pqcAction:
      'Symmetric MACs only in the real-time path; PQC goes in key distribution and firmware signing',
    path: 'close',
  },
  {
    id: 'c-control-sis',
    from: 'control',
    to: 'sis',
    carries: 'Read-only status and permissives to the safety system',
    pqcAction: 'Keep the SIS independent; sign safety-logic changes with a PQC scheme',
    path: 'close',
  },
]
