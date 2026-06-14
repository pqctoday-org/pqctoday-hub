// SPDX-License-Identifier: GPL-3.0-only
/**
 * simRelevance — filters the Simulation's resource lists to the SCENARIO:
 *  - industry verticals are shown only for the matching sector (a healthcare
 *    scenario should not surface payment / 5G / automotive modules);
 *  - persona-specific "quantum impact" modules are shown only for the seat.
 * Cross-industry / cross-persona resources are always shown.
 */

/** Industry-vertical resources (learn modules + playground tools) → the sim
 *  sectors they belong to. A resource listed here is hidden for other sectors. */
export const VERTICAL_BY_SECTOR: Record<string, string[]> = {
  // learn modules
  'healthcare-pqc': ['healthcare'],
  'emv-payment-pqc': ['financial', 'retail'],
  '5g-security': ['telecom'],
  'energy-utilities-pqc': ['energy'],
  'digital-assets': ['financial'],
  'automotive-pqc': [], // no sim sector → never relevant
  'aerospace-pqc': [],
  // playground tools
  'suci-flow': ['telecom'],
  'bitcoin-flow': ['financial'],
  'solana-flow': ['financial'],
  'hd-wallet': ['financial'],
}

/** Persona-specific modules → the seat (persona) they belong to. */
export const PERSONA_MODULE: Record<string, string> = {
  'exec-quantum-impact': 'executive',
  'dev-quantum-impact': 'developer',
  'arch-quantum-impact': 'architect',
  'ops-quantum-impact': 'ops',
  'research-quantum-impact': 'researcher',
}

/** Is this resource relevant to the scenario's sector + seat? */
export function relevantToScenario(id: string, sector: string, seat: string): boolean {
  const sectors = VERTICAL_BY_SECTOR[id]
  if (sectors && !sectors.includes(sector)) return false
  const persona = PERSONA_MODULE[id]
  if (persona && persona !== seat) return false
  return true
}
