// SPDX-License-Identifier: GPL-3.0-only
//
// Optional per-module enrichments used by the persona-path view to surface:
//   - P2-1: "Try in /playground" affordance for ops persona, when a module
//           has an obvious hands-on counterpart in the Playground workshop
//           registry (src/components/Playground/workshopRegistry.tsx).
//   - P2-3: "Browse by algorithm / standard" secondary axis for researcher,
//           derived from a curated taxonomy that maps each Learn module to
//           the PQC algorithms it covers and the standards / RFCs / drafts
//           it references.
//
// Both maps are intentionally PARTIAL — they only cover modules where the
// mapping is unambiguous from the module's curriculum. Unknown modules return
// undefined / [] and the UI degrades to the same affordances as before.

import type { PersonaId } from '@/data/learningPersonas'

/**
 * Learn-module → Playground-tool mapping. The string value is a Playground
 * tool `id` (validated against workshopRegistry at runtime is overkill —
 * mismatches degrade to a dead link, not a crash).
 */
export const MODULE_PLAYGROUND_TOOL: Readonly<Record<string, string>> = {
  // Protocol simulators
  'tls-basics': 'tls-simulator',
  'vpn-ssh-pqc': 'vpn-sim',

  // PKI workbench
  'pki-workshop': 'pki-workshop',
  'pki-enrollment-protocols': 'pki-enrollment',
  'hybrid-crypto': 'hybrid-certs',
  'merkle-tree-certs': 'merkle-proof',

  // Identity & messaging
  'email-signing': 'email-signing',
  'mls-group-messaging': 'mls-group-messaging',
  'digital-id': 'digital-id',
  'api-security-jwt': 'api-security-jwt',

  // Code/firmware signing
  'code-signing': 'firmware-signing',
  'stateful-signatures': 'lms-hss',
  'slh-dsa': 'slh-dsa',

  // Randomness
  'entropy-randomness': 'entropy-test',

  // Industry workshops
  '5g-security': 'suci-flow',
  'digital-assets': 'bitcoin-flow',

  // KEM playgrounds
  'kms-pqc': 'envelope-encrypt',
}

/** Returns the matching Playground tool id, or undefined when no curated mapping exists. */
export function getPlaygroundToolForModule(moduleId: string): string | undefined {
  // eslint-disable-next-line security/detect-object-injection
  return MODULE_PLAYGROUND_TOOL[moduleId]
}

/**
 * Returns true when the active persona should see the "Try in /playground"
 * affordance for this module. Plan says ops persona only.
 */
export function shouldShowPlaygroundLink(
  personaId: PersonaId | null | undefined,
  moduleId: string
): boolean {
  if (personaId !== 'ops') return false
  return getPlaygroundToolForModule(moduleId) !== undefined
}

// ---------------------------------------------------------------------------
// P2-3: researcher taxonomy
// ---------------------------------------------------------------------------

/**
 * Algorithm tokens used by the researcher 2nd-axis filter. Kept short and
 * standardised so the chip row stays compact. ML-KEM / ML-DSA / SLH-DSA are
 * the three FIPS-finalised PQC primitives; the rest are protocol-relevant
 * classical algorithms or NIST 4th-round / draft candidates.
 */
export const ALGORITHM_TAXONOMY = [
  'ML-KEM',
  'ML-DSA',
  'SLH-DSA',
  'Falcon',
  'LMS/XMSS',
  'HQC',
  'RSA',
  'ECDSA',
  'ECDH',
  'X25519',
] as const

export type AlgorithmTaxon = (typeof ALGORITHM_TAXONOMY)[number]

/**
 * Standard / specification tokens. Short labels keep the chip row readable.
 * The values mirror the canonical doc-ID shapes used elsewhere
 * (`FIPS 203`, `RFC 9421`, `IETF draft-ietf-...`).
 */
export const STANDARD_TAXONOMY = [
  'FIPS 203',
  'FIPS 204',
  'FIPS 205',
  'NIST SP 800-208',
  'RFC 9421',
  'RFC 9180',
  'RFC 9442',
  'RFC 9794',
  'X.509',
  'PKCS#11',
  'JOSE',
] as const

export type StandardTaxon = (typeof STANDARD_TAXONOMY)[number]

interface ModuleTaxonomyEntry {
  algorithms?: AlgorithmTaxon[]
  standards?: StandardTaxon[]
}

/**
 * Curated taxonomy for the researcher 2nd-axis filter. PARTIAL on purpose:
 * only modules with unambiguous algorithm / standard coverage are tagged.
 */
export const MODULE_TAXONOMY: Readonly<Record<string, ModuleTaxonomyEntry>> = {
  'pqc-101': { algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA'] },
  'pqc-candidates': { algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Falcon', 'HQC'] },
  'hybrid-crypto': { algorithms: ['ML-KEM', 'X25519', 'ECDH'], standards: ['RFC 9180'] },
  'tls-basics': {
    algorithms: ['ML-KEM', 'X25519', 'ECDSA', 'ML-DSA'],
    standards: ['RFC 9180', 'X.509'],
  },
  'vpn-ssh-pqc': { algorithms: ['ML-KEM', 'ECDH'], standards: ['RFC 9442'] },
  'pki-workshop': {
    algorithms: ['ML-DSA', 'ECDSA', 'RSA'],
    standards: ['X.509', 'FIPS 204'],
  },
  'hybrid-certs': {
    algorithms: ['ML-DSA', 'ECDSA'],
    standards: ['X.509', 'RFC 9794'],
  },
  'email-signing': { algorithms: ['ML-DSA'], standards: ['JOSE', 'X.509'] },
  'api-security-jwt': { algorithms: ['ML-DSA', 'SLH-DSA'], standards: ['JOSE', 'RFC 9421'] },
  'slh-dsa': { algorithms: ['SLH-DSA'], standards: ['FIPS 205'] },
  'stateful-signatures': { algorithms: ['LMS/XMSS'], standards: ['NIST SP 800-208'] },
  'code-signing': {
    algorithms: ['ML-DSA', 'LMS/XMSS'],
    standards: ['FIPS 204', 'NIST SP 800-208'],
  },
  'hsm-pqc': { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['PKCS#11'] },
  'kms-pqc': { algorithms: ['ML-KEM'], standards: ['FIPS 203'] },
  'merkle-tree-certs': { algorithms: ['LMS/XMSS'], standards: ['NIST SP 800-208'] },
  '5g-security': { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['X.509'] },
  'digital-id': { algorithms: ['ML-DSA'], standards: ['X.509'] },
  'mls-group-messaging': { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['JOSE'] },
}

export function getModuleAlgorithms(moduleId: string): readonly AlgorithmTaxon[] {
  // eslint-disable-next-line security/detect-object-injection
  return MODULE_TAXONOMY[moduleId]?.algorithms ?? []
}

export function getModuleStandards(moduleId: string): readonly StandardTaxon[] {
  // eslint-disable-next-line security/detect-object-injection
  return MODULE_TAXONOMY[moduleId]?.standards ?? []
}

/**
 * Returns the subset of module IDs whose taxonomy includes the given algorithm.
 * O(taxonomy-size) — kept linear since taxonomy is < 50 entries.
 */
export function modulesByAlgorithm(algorithm: AlgorithmTaxon): string[] {
  const ids: string[] = []
  for (const [moduleId, entry] of Object.entries(MODULE_TAXONOMY)) {
    if (entry.algorithms?.includes(algorithm)) ids.push(moduleId)
  }
  return ids
}

export function modulesByStandard(standard: StandardTaxon): string[] {
  const ids: string[] = []
  for (const [moduleId, entry] of Object.entries(MODULE_TAXONOMY)) {
    if (entry.standards?.includes(standard)) ids.push(moduleId)
  }
  return ids
}
