// SPDX-License-Identifier: GPL-3.0-only
/**
 * Legacy ⇄ FIPS algorithm name aliases for the Patents search index.
 *
 * The patent corpus's `pqc_algorithms` / `classical_algorithms` values stay
 * historically accurate to the filing-era name the patent actually used
 * (e.g. "Kyber", "Dilithium", "SPHINCS+") — those names predate NIST's
 * FIPS 203/204/205 standardization and renaming. Searching for the modern
 * FIPS name should still surface filing-era patents, and vice versa, so this
 * is a search-time-only lookup layer — it never rewrites the underlying data.
 */
export const ALGORITHM_NAME_ALIASES: Record<string, string[]> = {
  kyber: ['ML-KEM'],
  'ml-kem': ['Kyber'],
  dilithium: ['ML-DSA'],
  'ml-dsa': ['Dilithium'],
  'sphincs+': ['SLH-DSA'],
  'slh-dsa': ['SPHINCS+'],
}

/**
 * Given a list of algorithm names as they appear in the patent corpus, return
 * the additional alias terms that should be indexed alongside them so a
 * search for either naming era finds the patent.
 */
export function expandAlgorithmAliases(names: string[]): string[] {
  const aliases = new Set<string>()
  for (const name of names) {
    const key = name.trim().toLowerCase()
    for (const alias of ALGORITHM_NAME_ALIASES[key] ?? []) {
      aliases.add(alias)
    }
  }
  return [...aliases]
}
