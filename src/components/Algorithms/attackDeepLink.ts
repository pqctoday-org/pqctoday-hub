// SPDX-License-Identifier: GPL-3.0-only
/**
 * `?attack=` resolution for the Validation tab's Implementation Attacks
 * profiles. Profiles are keyed by display strings that name several schemes
 * at once ('ML-KEM / Kyber', 'LMS / XMSS (Stateful Hash-Based)'), while links
 * name one algorithm — by display name, `algorithm_id` ('ml-kem-768') or the
 * profile's own id ('ml-kem-kyber'). Pure logic, no JSX.
 */
import { ATTACK_PROFILES, type AlgorithmAttackProfile } from '@/data/implementationAttackProfiles'

/** Lowercase alphanumerics only — 'ML-KEM-768' and 'ml-kem-768' compare equal. */
const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Stable anchor id for a profile: kebab slug of its display name. */
export function attackProfileId(profile: { algorithm: string }): string {
  return profile.algorithm
    .toLowerCase()
    .replace(/\+/g, '-plus-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** The scheme names a profile covers: 'ML-KEM / Kyber' → ['ML-KEM', 'Kyber']. */
function aliases(profile: { algorithm: string }): string[] {
  return profile.algorithm
    .replace(/\([^)]*\)/g, '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * The profile a `?attack=` value names, or null. Exact matches win (profile
 * id, full name, or one of its scheme names); otherwise a parameter-set name
 * resolves to the profile of its scheme by longest prefix
 * ('ML-KEM-768' → 'ML-KEM / Kyber', 'SLH-DSA-SHA2-128s' → 'SLH-DSA / SPHINCS+').
 */
export function matchAttackProfile(
  raw: string | null | undefined,
  profiles: readonly AlgorithmAttackProfile[] = ATTACK_PROFILES
): AlgorithmAttackProfile | null {
  const q = squash(raw ?? '')
  if (!q) return null
  const exact = profiles.find(
    (p) =>
      squash(attackProfileId(p)) === q ||
      squash(p.algorithm) === q ||
      aliases(p).some((a) => squash(a) === q)
  )
  if (exact) return exact
  let best: { profile: AlgorithmAttackProfile; len: number } | null = null
  for (const p of profiles) {
    for (const a of aliases(p)) {
      const s = squash(a)
      if (s.length >= 3 && q.startsWith(s) && (!best || s.length > best.len)) {
        best = { profile: p, len: s.length }
      }
    }
  }
  return best?.profile ?? null
}
