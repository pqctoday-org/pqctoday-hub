// SPDX-License-Identifier: GPL-3.0-only
/**
 * cyclonedxCryptoRegistry — bundled copy of the CycloneDX v1.7 Cryptography
 * Registry (cyclonedx.org/registry/cryptography/), vendored at
 * `cyclonedxCryptoRegistry.json` so the Learn workshop tools can resolve
 * identifiers without a network fetch or a dependency on the gitignored
 * `public/library/` proof copy. Library entry: `CycloneDX-Cryptography-Registry`.
 */
import raw from './cyclonedxCryptoRegistry.json'

export interface AlgorithmStandardRef {
  name: string
  url: string
}

export interface AlgorithmVariant {
  pattern: string
  primitive: string
}

export interface AlgorithmFamily {
  family: string
  standard: AlgorithmStandardRef[]
  variant: AlgorithmVariant[]
}

export interface EllipticCurve {
  name: string
  description: string | null
  oid: string | null
  form: string | null
}

export interface CurveCategory {
  name: string
  description: string
  curves: EllipticCurve[]
}

interface RegistryFile {
  lastUpdated: string
  algorithms: AlgorithmFamily[]
  ellipticCurves: CurveCategory[]
}

const REGISTRY = raw as RegistryFile

export const REGISTRY_LAST_UPDATED = REGISTRY.lastUpdated
export const ALGORITHM_FAMILIES: AlgorithmFamily[] = REGISTRY.algorithms
export const CURVE_CATEGORIES: CurveCategory[] = REGISTRY.ellipticCurves

/** Total individual curves across every category (a category groups related curves). */
export const totalCurveCount = CURVE_CATEGORIES.reduce((sum, c) => sum + c.curves.length, 0)

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export interface AlgorithmMatch {
  family: AlgorithmFamily
  matchedOn: 'family-name' | 'variant-pattern' | 'alias'
}

// Families sorted longest-name-first so a substring scan matches the more
// specific family (e.g. "ML-DSA") before a shorter one it happens to contain
// ("DSA") — without this, "id-ml-dsa-65" would wrongly resolve to plain DSA.
const FAMILIES_BY_NAME_LENGTH = [...ALGORITHM_FAMILIES].sort(
  (a, b) => b.family.length - a.family.length
)

// Cross-notation identifiers the registry itself doesn't spell out (JOSE/JWT
// `alg` values are a separate IANA registry) but that this hub's own CBOM
// content already promises resolve to a registry family — e.g. "ES256 to a
// JWT" is presented as one more name for ECDSA-P256-SHA256 (see
// modules/Cbom/components/CbomIntroduction.tsx, "Codifying & normalizing").
const ALGORITHM_ALIASES: Record<string, string> = {
  es256: 'ECDSA',
  es384: 'ECDSA',
  es512: 'ECDSA',
  rs256: 'RSASSA-PKCS1',
  rs384: 'RSASSA-PKCS1',
  rs512: 'RSASSA-PKCS1',
  ps256: 'RSASSA-PSS',
  ps384: 'RSASSA-PSS',
  ps512: 'RSASSA-PSS',
}

/**
 * Resolve a messy real-world identifier (e.g. "aes_256_gcm",
 * "CKM_ECDSA_SHA256", "id-ml-dsa-65") to its canonical registry family.
 * Matching is separator/case-insensitive; checks, in order: exact/substring
 * family name (longest first, so "ML-DSA" wins over "DSA"), a small curated
 * alias table for cross-notation identifiers (JOSE `alg` values) the registry
 * doesn't spell out itself, then each variant's naming pattern (with its
 * `{placeholder}` / `[optional]` tokens stripped) for parameterized inputs.
 *
 * Deliberately returns null for under-specified inputs like "RSA2048" — the
 * registry has no bare "RSA" family (it splits signature vs encryption vs key
 * exchange), which is itself the lesson: a fully-qualified name is required.
 */
export function normalizeAlgorithmName(query: string): AlgorithmMatch | null {
  const q = normalize(query)
  if (!q) return null

  for (const family of FAMILIES_BY_NAME_LENGTH) {
    const famNorm = normalize(family.family)
    if (famNorm === q || q.includes(famNorm)) {
      return { family, matchedOn: 'family-name' }
    }
  }

  const aliasTarget = ALGORITHM_ALIASES[q]
  if (aliasTarget) {
    const family = ALGORITHM_FAMILIES.find((f) => f.family === aliasTarget)
    if (family) return { family, matchedOn: 'alias' }
  }

  for (const family of FAMILIES_BY_NAME_LENGTH) {
    for (const variant of family.variant) {
      const stem = variant.pattern
        .replace(/\[.*?\]/g, '')
        .replace(/\{.*?\}/g, '')
        .trim()
      const stemNorm = normalize(stem)
      if (stemNorm && (q.includes(stemNorm) || stemNorm.includes(q))) {
        return { family, matchedOn: 'variant-pattern' }
      }
    }
  }

  return null
}

export interface CurveMatch {
  category: CurveCategory
  curve: EllipticCurve
}

/**
 * Resolve a curve name, alias, or OID (e.g. "P-256", "secp256r1",
 * "1.2.840.10045.3.1.7") to its canonical registry entry. Name matching is
 * separator/case-insensitive; OID matching is exact.
 */
export function lookupCurve(query: string): CurveMatch | null {
  const q = query.trim()
  const qNorm = normalize(q)
  if (!qNorm) return null

  const isOidQuery = /^[0-9.]+$/.test(q)

  for (const category of CURVE_CATEGORIES) {
    for (const curve of category.curves) {
      if (isOidQuery) {
        if (curve.oid === q) return { category, curve }
        continue
      }
      if (normalize(curve.name) === qNorm) return { category, curve }
    }
  }

  // Fallback: common cross-references not literally present as a registry
  // `name` (unlike "secp256r1"/"prime256v1"/"secp256k1", which the registry
  // already lists verbatim in its SECG/X9.62 categories and so resolve above
  // via direct match). "X25519" is the IETF/TLS name for the Montgomery form
  // of Curve25519 used for key agreement — the registry only lists the curve
  // itself.
  const ALIASES: Record<string, string> = {
    x25519: 'Curve25519',
  }
  const aliasTarget = ALIASES[qNorm]
  if (aliasTarget) {
    const aliasNorm = normalize(aliasTarget)
    for (const category of CURVE_CATEGORIES) {
      for (const curve of category.curves) {
        if (normalize(curve.name) === aliasNorm) return { category, curve }
      }
    }
  }

  return null
}
