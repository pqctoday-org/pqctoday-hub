// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useState } from 'react'
import { loadAlgorithmsData } from './algorithmsData'
import type { AlgorithmTransition } from './algorithmsData'

/** The four algorithm categories the crypto step offers, in display order. */
export const CRYPTO_CATEGORY_IDS = [
  'Key Exchange',
  'Signatures',
  'Symmetric Encryption',
  'Hash & MAC',
] as const

/** Maps transition CSV `function` values to category IDs */
const FUNCTION_TO_CATEGORY: Record<AlgorithmTransition['function'], string> = {
  'Encryption/KEM': 'Key Exchange',
  // Regional key-agreement guidance rows ("ECDHE (classical only)") are not
  // inventory choices; an empty id keeps them out of the chips, as before.
  'Key Agreement': '',
  'Hybrid KEM': 'Key Exchange',
  'Composite KEM': 'Key Exchange',
  'Hybrid KEM (HPKE)': 'Key Exchange',
  'Hybrid KEM with Access Control': 'Key Exchange',
  Signature: 'Signatures',
  'Composite Signature': 'Signatures',
  Symmetric: 'Symmetric Encryption',
  Hash: 'Hash & MAC',
}

export interface TransitionChip {
  /** Label shown on the button — e.g. "RSA (2048-bit)", "ECDH (P-256)" */
  displayLabel: string
  /** Key stored in currentCrypto and used for ALGORITHM_DB lookup — e.g. "RSA-2048", "ECDH P-256" */
  storedKey: string
}

/**
 * Convert a transition CSV (classical, keySize) pair to an ALGORITHM_DB-compatible key.
 * "RSA" + "2048-bit"  → "RSA-2048"
 * "ECDH (P-256)"      → "ECDH P-256"   (paren stripped; "256" already in name, no suffix)
 * "Ed25519"           → "Ed25519"       (exact match, no change)
 */
function transitionToAlgoKey(classical: string, keySize?: string): string {
  // Strip "(X)" groups: "ECDH (P-256)" → "ECDH P-256"
  const base = classical
    .replace(/\s*\(([^)]+)\)/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
  if (keySize && keySize !== 'N/A') {
    const numeric = keySize.replace(/[^0-9]/g, '')
    // Only append key-size suffix when it is not already encoded in the base name
    if (numeric && !base.includes(numeric)) return `${base}-${numeric}`
  }
  return base
}

/**
 * Build the chip display label.
 * Appends key size in parens only when it adds information not already in the classical name.
 * "RSA" + "2048-bit" → "RSA (2048-bit)"
 * "ECDH (P-256)"     → "ECDH (P-256)"   (256 already present — skip)
 */
function makeDisplayLabel(classical: string, keySize?: string): string {
  if (!keySize || keySize === 'N/A') return classical
  const numeric = keySize.replace(/[^0-9]/g, '')
  if (numeric && classical.includes(numeric)) return classical
  return `${classical} (${keySize})`
}

/** Group the algorithm transition rows into per-category chips (deduplicated by stored key). */
export function groupTransitionsIntoChips(
  transitions: AlgorithmTransition[]
): Record<string, TransitionChip[]> {
  const grouped: Record<string, TransitionChip[]> = {}
  for (const id of CRYPTO_CATEGORY_IDS) grouped[id] = []

  const seen = new Set<string>()
  for (const t of transitions) {
    // Skip generic placeholder rows ("Any (Stateless)", "Any (Firmware Signing)")
    if (t.classical.startsWith('Any ')) continue
    const catId = FUNCTION_TO_CATEGORY[t.function]
    if (!catId) continue
    const storedKey = transitionToAlgoKey(t.classical, t.keySize)
    if (seen.has(storedKey)) continue
    seen.add(storedKey)
    grouped[catId].push({
      displayLabel: makeDisplayLabel(t.classical, t.keySize),
      storedKey,
    })
  }
  return grouped
}

/** Loads the algorithm data once on mount and returns the per-category chips. */
export function useAlgorithmChipsByCategory(): Record<string, TransitionChip[]> {
  const [algosByCategory, setAlgosByCategory] = useState<Record<string, TransitionChip[]>>({})
  useEffect(() => {
    let cancelled = false
    loadAlgorithmsData().then((transitions) => {
      if (!cancelled) setAlgosByCategory(groupTransitionsIntoChips(transitions))
    })
    return () => {
      cancelled = true
    }
  }, [])
  return algosByCategory
}
