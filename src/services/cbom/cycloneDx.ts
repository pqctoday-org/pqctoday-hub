// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared CycloneDX 1.7 CBOM (Cryptographic Bill of Materials) emitter.
 *
 * Extracted from `components/Migrate/cbomExport.ts` so every CBOM-producing tool
 * (Migrate, the Library CBOM Builder, the Supply-Chain Risk Matrix) emits the
 * *same* schema-valid CycloneDX 1.7 document instead of bespoke, drift-prone JSON.
 *
 * Each source maps its rows to a neutral `CbomComponentInput`; `buildCbomDocument`
 * turns those into a CycloneDX envelope with `cryptographic-asset` child
 * components carrying `cryptoProperties`. No external dependency at runtime, no
 * network — pure + synchronous so it is unit-testable without the DOM.
 *
 * 07092026: bumped 1.6 → 1.7 and adopted the official Cryptography Registry
 * (vendored at `./registry/cryptography-defs.json`, schema at
 * `./schema/cryptography-defs.schema.json`) for algorithm-family names and
 * standard citations, instead of hardcoding them. Also added classical
 * (RSA/ECDSA/ECDH/EdDSA) crypto-asset detection — previously only PQC
 * algorithms were lifted into crypto-assets, classical crypto was invisible
 * to any CBOM consumer. See cbom-cyclonedx17-registry-report-section-plan-07092026.md.
 */
import cryptoDefs from './registry/cryptography-defs.json'

// ── Cryptography Registry lookup (family name → standard citations) ─────────
// The registry is a live, periodically-updated external document (vendored
// snapshot dated 07092026 — re-vendor deliberately, don't let it silently
// drift). A family absent from the registry (e.g. Falcon — FIPS 206 isn't
// published yet) simply returns no citations; this is intentional, not a bug.
interface RegistryStandard {
  name: string
  url: string
}
interface RegistryFamily {
  family: string
  standard?: RegistryStandard[]
}
const REGISTRY_BY_FAMILY = new Map(
  (cryptoDefs as { algorithms: RegistryFamily[] }).algorithms.map((f) => [f.family, f])
)

/** Standard citations for an algorithm family, or `[]` if the registry has none
 *  (e.g. not yet standardized). Never fabricates a citation. */
export function standardsFor(family: string): RegistryStandard[] {
  return REGISTRY_BY_FAMILY.get(family)?.standard ?? []
}

// ── Algorithm model ──────────────────────────────────────────────────────────

/** A PQC or classical algorithm lifted into a `cryptographic-asset` component. */
export interface CbomAlgorithm {
  /** The algorithm-family name — the STANDARD name where one is published
   *  (e.g. 'ML-KEM' even when the source text said 'Kyber'); otherwise the
   *  best-known pre-standardization name (e.g. 'Falcon'). This is what's
   *  emitted as both the crypto-asset's display name and `algorithmFamily`. */
  canonical: string
  /** CycloneDX 1.7 `algorithmProperties.primitive` enum value. */
  primitive: string
  /** Specific parameter set when named in the source, e.g. "ML-KEM-768" — lets
   *  a CBOM consumer tell ML-KEM-768 from ML-KEM-1024. */
  parameterSet?: string
  /** NIST PQC security category (1-5) implied by the parameter set, if known. */
  securityCategory?: number
  /** Elliptic curve (CycloneDX 1.7 `ellipticCurve`, NOT the deprecated `curve`
   *  field) for curve-based classical families (ECDSA/ECDH/EdDSA). */
  ellipticCurve?: string
  /** RSA (or other) key length in bits, when named in the source. */
  keyLength?: number
  /** True for classical algorithms — quantum-vulnerable by construction, as
   *  opposed to PQC algorithms which aren't (this is a detection-time fact,
   *  not a judgment about a specific deployment's hybrid/pure posture). */
  classical?: boolean
  /** Set on both halves of a detected hybrid/composite pairing (e.g.
   *  "X25519+ML-KEM-768") so a consumer can render them as one deployment
   *  instead of two unrelated crypto-assets. No CycloneDX spec mechanism for
   *  this exists yet (verified against the registry) — this is a house
   *  convention using the same `pqctoday:*` custom-property pattern already
   *  used elsewhere in this emitter. */
  hybridGroup?: string
  hybridRole?: 'classical' | 'post-quantum'
}

/** A FIPS/ACVP certification surfaced as component evidence. */
export interface CbomCertification {
  certType: string
  certId: string
  certLink?: string
}

/** CycloneDX 1.7 component types this emitter uses. */
export type CbomComponentType = 'library' | 'application' | 'device' | 'file' | 'platform'

export interface CbomProperty {
  name: string
  value: string
}

/** Neutral, per-source description of one CBOM component. */
export interface CbomComponentInput {
  type: CbomComponentType
  name: string
  bomRef: string
  version?: string
  description?: string
  publisher?: string
  cpe?: string
  purl?: string
  properties?: CbomProperty[]
  certifications?: CbomCertification[]
  /** PQC and/or classical algorithms this component provides → emitted as
   *  child crypto-asset components. */
  algorithms?: CbomAlgorithm[]
}

export interface CbomMetadata {
  /** Surfaced as `metadata.tools[0].name`. */
  toolName?: string
  /** Surfaced as `metadata.properties`. */
  properties?: CbomProperty[]
}

export interface CbomBuildResult {
  /** The CycloneDX JSON document (pretty-printed). */
  json: string
  /** Number of top-level (non-derived) components emitted. */
  componentCount: number
  /** Number of derived `cryptographic-asset` components emitted (PQC + classical). */
  cryptoAssetCount: number
}

/**
 * Known PQC algorithm tokens we can confidently lift into crypto-asset
 * components. Matched case-insensitively as plain substrings (no regex), so
 * detection stays linear and free of backtracking risk.
 *
 * `canonical` is the STANDARD name wherever the Cryptography Registry has one
 * for it — Kyber/Dilithium/SPHINCS+ are pre-standardization NIST round-3 code
 * names, remapped to their published FIPS successors (ML-KEM/ML-DSA/SLH-DSA)
 * at detection time, so the rest of the pipeline never sees the old name.
 * Falcon, BIKE, HQC and FrodoKEM keep their own name unchanged: none has a
 * published standard yet (verified against the registry 07092026 — Falcon/
 * FN-DSA is FIPS 206, not yet published; BIKE wasn't selected; HQC was
 * selected but has no FIPS number yet). `standardsFor()` naturally returns no
 * citation for these — nothing here needs to special-case "unpublished."
 */
const PQC_ALGO_TOKENS: { tokens: string[]; canonical: string; primitive: string }[] = [
  { tokens: ['ML-KEM', 'MLKEM', 'KYBER'], canonical: 'ML-KEM', primitive: 'kem' },
  { tokens: ['ML-DSA', 'MLDSA', 'DILITHIUM'], canonical: 'ML-DSA', primitive: 'signature' },
  { tokens: ['SLH-DSA', 'SLHDSA', 'SPHINCS'], canonical: 'SLH-DSA', primitive: 'signature' },
  { tokens: ['FALCON'], canonical: 'Falcon', primitive: 'signature' },
  { tokens: ['FRODOKEM'], canonical: 'FrodoKEM', primitive: 'kem' },
  { tokens: ['XMSS'], canonical: 'XMSS', primitive: 'signature' },
  { tokens: ['BIKE'], canonical: 'BIKE', primitive: 'kem' },
  { tokens: ['HQC'], canonical: 'HQC', primitive: 'kem' },
]

/** Extract the distinct PQC algorithms named anywhere in `text`. Legacy
 *  pre-standardization names (Kyber, Dilithium, SPHINCS+) are reported under
 *  their standard name — see PQC_ALGO_TOKENS. */
export function extractPqcAlgorithmsFromText(text: string): CbomAlgorithm[] {
  const haystack = (text || '').toUpperCase()
  const out: CbomAlgorithm[] = []
  for (const { tokens, canonical, primitive } of PQC_ALGO_TOKENS) {
    if (tokens.some((t) => haystack.includes(t)))
      out.push({ canonical, primitive, ...detectPqcParameterSet(canonical, haystack) })
  }
  return out
}

/** Infer the specific parameter set + NIST category for the lattice/hash
 *  standards when the source text names one (e.g. "ML-KEM-768"). Returns an
 *  empty object for families with no standardized numeric suffix detected. */
function detectPqcParameterSet(
  canonical: string,
  haystack: string
): { parameterSet?: string; securityCategory?: number } {
  if (canonical === 'ML-KEM') {
    const m = haystack.match(/ML-?KEM-?(512|768|1024)/)
    if (m) {
      const n = m[1]
      return {
        parameterSet: `ML-KEM-${n}`,
        securityCategory: n === '512' ? 1 : n === '768' ? 3 : 5,
      }
    }
  }
  if (canonical === 'ML-DSA') {
    const m = haystack.match(/ML-?DSA-?(44|65|87)/)
    if (m) {
      const n = m[1]
      return { parameterSet: `ML-DSA-${n}`, securityCategory: n === '44' ? 2 : n === '65' ? 3 : 5 }
    }
  }
  if (canonical === 'SLH-DSA') {
    const m = haystack.match(/SLH-?DSA[A-Z0-9-]*?(128|192|256)/)
    if (m) {
      const n = m[1]
      return { parameterSet: m[0], securityCategory: n === '128' ? 1 : n === '192' ? 3 : 5 }
    }
  }
  return {}
}

// ── Classical algorithms (07092026) ──────────────────────────────────────────

/** Curve-name aliases → the exact namespaced identifier the Cryptography
 *  Registry's `ellipticCurvesEnum` requires (verified against the vendored
 *  schema 07092026 — NOT bare "P-256"/"x25519": the enum is namespaced, e.g.
 *  "nist/P-256", "other/Curve25519", "other/Ed25519"). */
const CURVE_ALIASES: { tokens: string[]; curve: string }[] = [
  { tokens: ['P-256', 'P256', 'SECP256R1', 'PRIME256V1'], curve: 'nist/P-256' },
  { tokens: ['P-384', 'P384', 'SECP384R1'], curve: 'nist/P-384' },
  { tokens: ['P-521', 'P521', 'SECP521R1'], curve: 'nist/P-521' },
]

function detectCurve(haystack: string): string | undefined {
  for (const { tokens, curve } of CURVE_ALIASES) {
    if (tokens.some((t) => haystack.includes(t))) return curve
  }
  return undefined
}

/**
 * Classical (quantum-vulnerable) algorithm tokens. Families and primitives
 * verified against the vendored Cryptography Registry 07092026 — RSA is 4
 * distinct registry families (signing vs encryption, PKCS1 vs PSS/OAEP
 * padding), not one. Source text in this codebase (e.g. "RSA-2048") almost
 * never states the mode explicitly, so RSA mode is a documented best-effort
 * default, not a guarantee: PKCS1-signing unless the text names encryption/
 * key-exchange, matching the dominant real-world case (certificate signing)
 * in this product's domain. X25519/X448 are a variant of the ECDH family in
 * the registry, not their own family — matched separately here only because
 * they need no curve-name extraction, then folded into the ECDH primitive.
 */
export function extractClassicalAlgorithmsFromText(text: string): CbomAlgorithm[] {
  const haystack = (text || '').toUpperCase()
  const out: CbomAlgorithm[] = []

  if (haystack.includes('RSA')) {
    const keyLenMatch = haystack.match(/RSA[-\s]?(1024|2048|3072|4096)/)
    const keyLength = keyLenMatch ? Number(keyLenMatch[1]) : undefined
    const isEncryption = /ENCRYPT|KEY.?EXCHANGE|\bKEX\b|OAEP/.test(haystack)
    out.push({
      canonical: isEncryption ? 'RSAES-PKCS1' : 'RSASSA-PKCS1',
      primitive: isEncryption ? 'pke' : 'signature',
      classical: true,
      ...(keyLength ? { keyLength } : {}),
    })
  }
  if (haystack.includes('ECDSA')) {
    const curve = detectCurve(haystack)
    out.push({
      canonical: 'ECDSA',
      primitive: 'signature',
      classical: true,
      ...(curve ? { ellipticCurve: curve } : {}),
    })
  }
  if (haystack.includes('ECDH') || /\bX25519\b/.test(haystack) || /\bX448\b/.test(haystack)) {
    const curve = /\bX25519\b/.test(haystack)
      ? 'other/Curve25519'
      : /\bX448\b/.test(haystack)
        ? 'other/Curve448'
        : detectCurve(haystack)
    out.push({
      canonical: 'ECDH',
      primitive: 'key-agree',
      classical: true,
      ...(curve ? { ellipticCurve: curve } : {}),
    })
  }
  if (haystack.includes('EDDSA') || /\bED25519\b/.test(haystack) || /\bED448\b/.test(haystack)) {
    out.push({
      canonical: 'EdDSA',
      primitive: 'signature',
      classical: true,
      ellipticCurve: /\bED448\b/.test(haystack) ? 'other/Ed448' : 'other/Ed25519',
    })
  }
  return out
}

/**
 * Detect a hybrid/composite pairing between a classical and a PQC algorithm
 * named in the same text (e.g. "X25519+ML-KEM-768", "hybrid RSA+ML-DSA"), and
 * link the first classical + first PQC hit found via a shared `hybridGroup`.
 * No-op (returns the inputs unchanged) if there isn't exactly one clear
 * pairing signal — this is a v1 heuristic tuned to how this product's own
 * content writes hybrid combinations, not a general NLP parser.
 */
export function pairHybridAlgorithms(
  text: string,
  classicalAlgos: CbomAlgorithm[],
  pqcAlgos: CbomAlgorithm[]
): { classical: CbomAlgorithm[]; pqc: CbomAlgorithm[] } {
  if (classicalAlgos.length === 0 || pqcAlgos.length === 0)
    return { classical: classicalAlgos, pqc: pqcAlgos }
  const hasPlusJoin = /[a-z0-9]\s*\+\s*[a-z0-9]/i.test(text)
  const hasHybridWord = /\bhybrid\b/i.test(text)
  if (!hasPlusJoin && !hasHybridWord) return { classical: classicalAlgos, pqc: pqcAlgos }

  const groupId = `hybrid-${classicalAlgos[0].canonical}-${pqcAlgos[0].canonical}`.toLowerCase()
  const classical = classicalAlgos.map((a, i) =>
    i === 0 ? { ...a, hybridGroup: groupId, hybridRole: 'classical' as const } : a
  )
  const pqc = pqcAlgos.map((a, i) =>
    i === 0 ? { ...a, hybridGroup: groupId, hybridRole: 'post-quantum' as const } : a
  )
  return { classical, pqc }
}

/** Convenience: extract PQC + classical algorithms from the same text and
 *  link a hybrid pair if one is signaled. The combined, hybrid-aware entry
 *  point most callers should use. */
export function extractAllAlgorithmsFromText(text: string): CbomAlgorithm[] {
  const pqc = extractPqcAlgorithmsFromText(text)
  const classical = extractClassicalAlgorithmsFromText(text)
  const paired = pairHybridAlgorithms(text, classical, pqc)
  return [...paired.classical, ...paired.pqc]
}

/** A deterministic bom-ref slug. */
export function cbomBomRef(name: string, id?: string): string {
  return `pkg:${id || name.toLowerCase().replace(/\s+/g, '-')}`
}

/** RFC-4122 v4 UUID with a non-crypto fallback for non-secure contexts / tests. */
export function cryptoRandomUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fall through
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// Values must be members of the 1.7 schema's cryptoFunctions enum (verified
// 07092026 — no 'exchange' value exists; key-agreement is keygen + keyderive).
function cryptoFunctionsFor(primitive: string): string[] {
  if (primitive === 'kem') return ['encapsulate', 'decapsulate']
  if (primitive === 'key-agree') return ['keygen', 'keyderive']
  if (primitive === 'pke') return ['encrypt', 'decrypt']
  return ['sign', 'verify']
}

/**
 * Build a CycloneDX 1.7 CBOM document from neutral component inputs.
 * Pure + synchronous — safe to unit-test without the DOM.
 */
export function buildCbomDocument(
  inputs: CbomComponentInput[],
  meta: CbomMetadata = {}
): CbomBuildResult {
  const now = new Date().toISOString()
  const components: Record<string, unknown>[] = []
  let cryptoAssetCount = 0

  for (const input of inputs) {
    const component: Record<string, unknown> = {
      type: input.type,
      'bom-ref': input.bomRef,
      name: input.name,
      ...(input.version ? { version: input.version } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.publisher ? { publisher: input.publisher } : {}),
      ...(input.cpe ? { cpe: input.cpe } : {}),
      ...(input.purl ? { purl: input.purl } : {}),
      properties: input.properties ?? [],
    }

    const certs = input.certifications ?? []
    if (certs.length > 0) {
      component.evidence = {
        identity: certs.map((c) => ({
          field: 'cpe',
          confidence: 1,
          // CycloneDX requires method-level `confidence` alongside `technique`.
          methods: [
            { technique: 'attestation', confidence: 1, value: `${c.certType} ${c.certId}`.trim() },
          ],
        })),
      }
      const certRefs = certs
        .filter((c) => c.certLink)
        .map((c) => ({ type: 'certification-report', url: c.certLink, comment: c.certType }))
      if (certRefs.length > 0) component.externalReferences = certRefs
    }

    components.push(component)

    // Child crypto-asset components for each algorithm (PQC or classical)
    // this component exposes.
    for (const algo of input.algorithms ?? []) {
      cryptoAssetCount++
      // Prefer the specific parameter set as the asset name/ref so consumers can
      // distinguish ML-KEM-768 from ML-KEM-1024.
      const label = algo.parameterSet ?? algo.canonical
      const standards = standardsFor(algo.canonical)
      // Mutually exclusive in practice (parameterSet is PQC-only, keyLength is
      // RSA-only) — resolved once so neither can silently shadow the other.
      const parameterSetIdentifier =
        algo.parameterSet ?? (algo.keyLength ? String(algo.keyLength) : undefined)
      // `algorithmFamily` is a CONSTRAINED enum ($ref into the Cryptography
      // Registry schema) — verified 07092026 that Falcon/BIKE/HQC/FrodoKEM
      // aren't just "uncited," they're not valid enum members at all (not
      // standardized enough to be listed yet). Omit the field rather than emit
      // a value the schema — and by extension any real consumer — would reject.
      const algorithmFamily = REGISTRY_BY_FAMILY.has(algo.canonical) ? algo.canonical : undefined
      const props: CbomProperty[] = [{ name: 'pqctoday:providedBy', value: input.name }]
      if (algo.classical) props.push({ name: 'pqctoday:quantumVulnerable', value: 'true' })
      if (algo.hybridGroup) {
        props.push({ name: 'pqctoday:hybridGroup', value: algo.hybridGroup })
        props.push({ name: 'pqctoday:hybridRole', value: algo.hybridRole ?? 'unknown' })
      }
      components.push({
        type: 'cryptographic-asset',
        'bom-ref': `${input.bomRef}#${label}`,
        name: label,
        cryptoProperties: {
          assetType: 'algorithm',
          algorithmProperties: {
            primitive: algo.primitive,
            ...(algorithmFamily ? { algorithmFamily } : {}),
            executionEnvironment: 'software-plain-ram',
            ...(parameterSetIdentifier ? { parameterSetIdentifier } : {}),
            ...(algo.ellipticCurve ? { ellipticCurve: algo.ellipticCurve } : {}),
            ...(algo.securityCategory ? { nistQuantumSecurityLevel: algo.securityCategory } : {}),
            cryptoFunctions: cryptoFunctionsFor(algo.primitive),
          },
        },
        // 'citation' is the closest 1.7 externalReferences.type enum member —
        // 'standards-body' isn't a valid value (verified via schema validation).
        ...(standards.length > 0
          ? {
              externalReferences: standards.map((s) => ({
                type: 'citation',
                url: s.url,
                comment: s.name,
              })),
            }
          : {}),
        properties: props,
      })
    }
  }

  const doc = {
    bomFormat: 'CycloneDX',
    specVersion: '1.7',
    serialNumber: `urn:uuid:${cryptoRandomUuid()}`,
    version: 1,
    metadata: {
      timestamp: now,
      tools: [{ vendor: 'PQCToday', name: meta.toolName ?? 'PQC Today CBOM Export' }],
      properties: meta.properties ?? [],
    },
    components,
  }

  return {
    json: JSON.stringify(doc, null, 2),
    componentCount: inputs.length,
    cryptoAssetCount,
  }
}

/** Trigger a browser download of a CBOM JSON string. */
export function downloadCbomJson(json: string, filenamePrefix: string): void {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filenamePrefix}-${date}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
