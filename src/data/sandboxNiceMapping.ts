// SPDX-License-Identifier: GPL-3.0-only
// @reviewed 2026-09-01 by eram2207usa — full read + scenario-id cross-check
// against all 24 real SANDBOX_SCENARIOS; removed one dead/miskeyed override
/**
 * Maps sandbox scenarios (from sandboxScenarios.ts) to NICE Framework metadata.
 * Mirrors src/data/niceModuleMapping.ts but for sandbox tools, which don't have
 * a corresponding Learn moduleId.
 *
 * Strategy:
 *   1. Per-scenario override table for scenarios with a clear content fit.
 *   2. Track-based fallback for scenarios not in the override table.
 *   3. Tier derived from scenario difficulty.
 */
import type { NiceCompetencyAreaId, NiceProficiencyTier, NiceWorkRoleId } from './niceFramework'
import { SANDBOX_SCENARIOS, type SandboxTrackId } from './sandboxScenarios'

export interface SandboxNiceRef {
  scenarioId: string
  competencyAreas: NiceCompetencyAreaId[]
  tier: NiceProficiencyTier
  workRoles: NiceWorkRoleId[]
}

// Difficulty → tier
const TIER_FROM_DIFFICULTY: Record<'beginner' | 'intermediate' | 'advanced', NiceProficiencyTier> =
  {
    beginner: 'awareness',
    intermediate: 'practitioner',
    advanced: 'expert',
  }

// Default CAs per sandbox track (used when no override applies)
const TRACK_DEFAULT_CAS: Record<SandboxTrackId, NiceCompetencyAreaId[]> = {
  'protocol-simulation': ['CA-NETDEF', 'CA-CRYPTO'],
  infrastructure: ['CA-SYSARCH'],
  'supply-chain': ['CA-SECPROG', 'CA-GOVCOMP'],
  'secrets-kms': ['CA-DATASEC', 'CA-SYSARCH'],
  web: ['CA-NETDEF'],
  applications: ['CA-SECPROG'],
}

// Default work roles per sandbox track
const TRACK_DEFAULT_WORK_ROLES: Record<SandboxTrackId, NiceWorkRoleId[]> = {
  'protocol-simulation': ['security-architect', 'systems-security-analyst'],
  infrastructure: ['security-architect', 'security-developer'],
  'supply-chain': ['security-developer', 'is-security-manager'],
  'secrets-kms': ['security-architect', 'system-administrator'],
  web: ['security-architect', 'systems-security-analyst'],
  applications: ['security-developer', 'security-architect'],
}

// Per-scenario overrides for CAs (additive — TRACK_DEFAULT is NOT applied when an override exists).
// Order matters: primary CA first.
const SCENARIO_CA_OVERRIDES: Record<string, NiceCompetencyAreaId[]> = {
  // Identity / trust establishment
  pki: ['CA-IDENT', 'CA-CRYPTO'],
  stepca: ['CA-IDENT', 'CA-SECPROG'],
  'cert-validation': ['CA-IDENT', 'CA-CRYPTO'],
  'hybrid-certs': ['CA-IDENT', 'CA-CRYPTO'],
  // 'mtc' omitted: removed from pqctoday-sandbox in v0.7.0 (#50) — inert override.
  // Data-at-rest / secrets management
  // 'secrets-vault' omitted: removed from pqctoday-sandbox in v0.6.0 (see
  // workshopRegistry.tsx for why) — inert override.
  sops: ['CA-DATASEC', 'CA-SECPROG'],
  'pqctoday-kmip': ['CA-DATASEC', 'CA-SYSARCH'],
  'cloud-kms': ['CA-DATASEC', 'CA-SYSARCH'],
  'database-postgres': ['CA-DATASEC', 'CA-SECPROG'],
  // Network transport
  'iot-mqtt': ['CA-NETDEF', 'CA-SECPROG'],
  // 'wireguard' omitted: removed from pqctoday-sandbox in v0.9.0 — inert override.
  vpn: ['CA-NETDEF', 'CA-SYSARCH'],
  tls: ['CA-NETDEF', 'CA-CRYPTO'],
  ssh: ['CA-NETDEF', 'CA-IDENT'],
  // 'haproxy' omitted: never shipped in pqctoday-sandbox (dropped with the
  // track that never had an orchestrator) — inert override.
  'browser-tls': ['CA-NETDEF', 'CA-CRYPTO'],
  // 'pqcflow' omitted: same as 'haproxy' above — inert override.
  'ab-handshake-bench': ['CA-NETDEF', 'CA-RISK'],
  // Inventory / governance / risk
  'cbom-compliance': ['CA-GOVCOMP', 'CA-RISK'],
  'migration-impact': ['CA-RISK', 'CA-GOVCOMP'],
  // 'crypto-discovery' omitted: same as 'haproxy' above — inert override.
  // Code / firmware / supply-chain integrity
  osslsigncode: ['CA-SECPROG', 'CA-SYSARCH'],
  'supply-chain-signing': ['CA-SECPROG', 'CA-GOVCOMP'],
  'firmware-hss': ['CA-SECPROG', 'CA-SYSARCH'],
  'tpm-pqc-migration': ['CA-SYSARCH', 'CA-CRYPTO'],
  // 'tpm-playground' removed 2026-09-01: not a sandbox scenario id at all — it's
  // a separate static Playground tool (workshopRegistry.tsx). This key was
  // unreachable dead code (buildMaps() only indexes by real scenario.id), a
  // copy/paste mix-up with 'tpm-pqc-migration' above, which already carries
  // the correct override.
  // Application protocol
  'api-security-jwt': ['CA-SECPROG', 'CA-IDENT'],
  // Quantum-native crypto
  sequoia: ['CA-CRYPTO', 'CA-SECPROG'],
  // Email
  smime: ['CA-CRYPTO', 'CA-DATASEC'],
}

// Per-scenario work-role overrides (replaces TRACK_DEFAULT_WORK_ROLES when present).
const SCENARIO_WORK_ROLE_OVERRIDES: Record<string, NiceWorkRoleId[]> = {
  'cbom-compliance': ['is-security-manager', 'risk-manager', 'systems-security-analyst'],
  'migration-impact': ['risk-manager', 'security-architect', 'is-security-manager'],
  // 'crypto-discovery' / 'secrets-vault' omitted: never shipped / removed
  // from pqctoday-sandbox — see the competency-area table above for detail.
  'cloud-kms': ['security-architect', 'system-administrator'],
  'tpm-pqc-migration': ['security-architect', 'security-developer'],
  'supply-chain-signing': ['security-developer', 'is-security-manager'],
}

// Built lazily on first access. Module-top-level `.map()` on the imported
// SANDBOX_SCENARIOS array crashes in production when Vite's code-splitter
// places this module in a chunk that evaluates before sandboxScenarios.ts —
// the import binding is `undefined` at that point, and `.map()` throws.
let _cachedMap: SandboxNiceRef[] | null = null
let _byScenarioId: Map<string, SandboxNiceRef> | null = null

function buildMaps(): Map<string, SandboxNiceRef> {
  if (_byScenarioId !== null) return _byScenarioId
  _cachedMap = SANDBOX_SCENARIOS.map((scenario) => {
    const id = scenario.id
    const overrideCas = SCENARIO_CA_OVERRIDES[id] // eslint-disable-line security/detect-object-injection
    const competencyAreas = overrideCas ?? TRACK_DEFAULT_CAS[scenario.trackId]
    const overrideRoles = SCENARIO_WORK_ROLE_OVERRIDES[id] // eslint-disable-line security/detect-object-injection
    const workRoles = overrideRoles ?? TRACK_DEFAULT_WORK_ROLES[scenario.trackId]
    return {
      scenarioId: id,
      competencyAreas,
      tier: TIER_FROM_DIFFICULTY[scenario.difficulty],
      workRoles,
    }
  })
  _byScenarioId = new Map(_cachedMap.map((r) => [r.scenarioId, r]))
  return _byScenarioId
}

export function getSandboxNiceMap(): SandboxNiceRef[] {
  if (_cachedMap === null) buildMaps()
  return _cachedMap as SandboxNiceRef[]
}

export function getSandboxNiceMapping(scenarioId: string): SandboxNiceRef | undefined {
  return buildMaps().get(scenarioId)
}
