// SPDX-License-Identifier: AGPL-3.0-only
import { SANDBOX_SCENARIOS, SANDBOX_TRACKS } from '@/data/sandboxScenarios'

/**
 * What /about says about the Sandbox, derived from the synced scenario list
 * (src/data/sandboxScenarios.ts) so the count and the track names follow the
 * Sandbox itself. The page once claimed "30+ scenarios" in "four tracks" and
 * named tools no scenario uses.
 */
export const SANDBOX_SCENARIO_COUNT = SANDBOX_SCENARIOS.length
export const SANDBOX_TRACK_LABELS = SANDBOX_TRACKS.map((t) => t.label)

/**
 * Tools named in the About copy. Each must be the tool of at least one
 * scenario (sandboxSummary.test.ts checks this against SANDBOX_SCENARIOS).
 */
export const SANDBOX_NAMED_TOOLS = [
  'strongSwan',
  'OpenSSH',
  'PostgreSQL',
  'Mosquitto',
  'Sigstore cosign',
  'Sequoia',
  'SOPS',
] as const

/** Use cases named in the About copy; each must match a scenario title (same test). */
export const SANDBOX_NAMED_USE_CASES = [
  { label: 'quantum-resistant VPNs', titleMatch: /VPN/ },
  { label: 'container supply-chain provenance', titleMatch: /Container Provenance/ },
  { label: 'firmware verification', titleMatch: /Firmware Verification/ },
  { label: 'CBOM compliance auditing', titleMatch: /CBOM Compliance Audit/ },
] as const

/** "a, b and c" */
export function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}
