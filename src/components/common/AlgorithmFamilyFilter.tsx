// SPDX-License-Identifier: GPL-3.0-only
import { Binary } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { FilterDropdown } from './FilterDropdown'
import type { FilterDropdownItem } from './FilterDropdown'

/**
 * AlgorithmFamilyFilter — multi-select facet over the cryptographic family of a
 * library document's `algorithmFamily` field.
 *
 * The raw field carries ~141 messy free-text values (e.g. "Lattice",
 * "Lattice-based (NTRU)", "ML-KEM (CRYSTALS-Kyber)"). A keyword normalizer
 * collapses them into a small canonical set so the facet stays usable instead
 * of exploding into a 141-row list. Vague / non-family tokens ("N/A",
 * "Protocol", "Various") map to `null` and simply match no family.
 *
 * URL state: `?algo=Lattice-based&algo=Hash-based` (repeated keys).
 */
export const ALGORITHM_FAMILIES = [
  'Lattice-based',
  'Hash-based',
  'Code-based',
  'Multivariate / MPCitH',
  'Isogeny-based',
  'Symmetric',
  'QKD / Quantum',
  'Hybrid PQ/Classical',
  'Classical (RSA/ECC)',
] as const

export type AlgorithmFamily = (typeof ALGORITHM_FAMILIES)[number]

const FAMILY_OPTIONS: FilterDropdownItem[] = ALGORITHM_FAMILIES.map((f) => ({ id: f, label: f }))

/**
 * Map one raw `algorithmFamily` token to a canonical family, or `null` when the
 * token names no recognizable family. Order matters: hybrid is checked first (a
 * hybrid token usually also contains a lattice keyword), then specific math
 * families, with broad "classical" last.
 */
export function canonicalAlgorithmFamily(raw: string): AlgorithmFamily | null {
  const s = raw.toLowerCase()
  if (/hybrid|pq\/t|pq-t|composite|combiner/.test(s)) return 'Hybrid PQ/Classical'
  if (
    /lattice|ml-kem|kyber|ml-dsa|dilithium|falcon|fn-dsa|frodo|ntru|\blwe\b|mlwe|mlwr|saber/.test(s)
  )
    return 'Lattice-based'
  if (/hash|slh-dsa|sphincs|xmss|\blms\b|stateful|stateless|merkle|\bmtl\b|\bmtc\b/.test(s))
    return 'Hash-based'
  if (/code-based|mceliece|\bhqc\b|\bbike\b|ldpc/.test(s)) return 'Code-based'
  if (
    /multivariate|\buov\b|rainbow|snova|mayo|mpc-in-the-head|mpcith|\bmqom?\b|\bvole\b|\bmpc\b/.test(
      s
    )
  )
    return 'Multivariate / MPCitH'
  if (/isogeny|csidh|sike|sidh/.test(s)) return 'Isogeny-based'
  if (/qkd|quantum key|information-theoretic/.test(s)) return 'QKD / Quantum'
  if (/symmetric|\baes\b|\bsha\b|hmac|ascon|\bkdf\b|permutation/.test(s)) return 'Symmetric'
  if (
    /\brsa\b|\becc\b|ecdsa|ecdh|x25519|x448|ed25519|elliptic|diffie|secp|brainpool|p-256|p-384|p-521|classical|\bdh\b|sm2/.test(
      s
    )
  )
    return 'Classical (RSA/ECC)'
  return null
}

interface AlgorithmFamilyFilterProps {
  className?: string
  /** Optional URL-param source override. The sim embed backs filter state with
   *  local state instead of the page URL; defaults to useSearchParams. */
  params?: URLSearchParams
  setParams?: ReturnType<typeof useSearchParams>[1]
}

export function AlgorithmFamilyFilter({
  className,
  params: paramsProp,
  setParams: setParamsProp,
}: AlgorithmFamilyFilterProps) {
  const [urlParams, setUrlParams] = useSearchParams()
  const searchParams = paramsProp ?? urlParams
  const setSearchParams = setParamsProp ?? setUrlParams
  const selected = searchParams.getAll('algo').filter(isAlgorithmFamily)

  function handleChange(families: string[]) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('algo')
        for (const f of families) if (isAlgorithmFamily(f)) next.append('algo', f)
        return next
      },
      { replace: true }
    )
  }

  return (
    <FilterDropdown
      items={FAMILY_OPTIONS}
      selectedId=""
      onSelect={() => {}}
      multiSelectedIds={selected}
      onMultiSelect={handleChange}
      defaultLabel="Algorithm family"
      defaultIcon={<Binary size={14} className="text-primary" />}
      searchable={FAMILY_OPTIONS.length > 8}
      className={className}
    />
  )
}

function isAlgorithmFamily(value: string): value is AlgorithmFamily {
  return (ALGORITHM_FAMILIES as readonly string[]).includes(value)
}

/** Read algorithm-family filter state — empty array when unset. Accepts an
 *  optional URLSearchParams override (for the sim embed). */
export function useAlgorithmFamilyFilter(paramsOverride?: URLSearchParams): string[] {
  const [urlParams] = useSearchParams()
  return (paramsOverride ?? urlParams).getAll('algo').filter(isAlgorithmFamily)
}

/**
 * True when any of the item's family tokens canonicalizes to one of the selected
 * families (or when no family filter is active).
 */
export function matchesAlgorithmFamilyFilter(selected: string[], values: string[]): boolean {
  if (selected.length === 0) return true
  return values.some((v) => {
    const fam = canonicalAlgorithmFamily(v)
    return fam !== null && selected.includes(fam)
  })
}
