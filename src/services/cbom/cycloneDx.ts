// SPDX-License-Identifier: GPL-3.0-only
/**
 * Shared CycloneDX 1.6 CBOM (Cryptographic Bill of Materials) emitter.
 *
 * Extracted from `components/Migrate/cbomExport.ts` so every CBOM-producing tool
 * (Migrate, the Library CBOM Builder, the Supply-Chain Risk Matrix) emits the
 * *same* schema-valid CycloneDX 1.6 document instead of bespoke, drift-prone JSON.
 *
 * Each source maps its rows to a neutral `CbomComponentInput`; `buildCbomDocument`
 * turns those into a CycloneDX envelope with `cryptographic-asset` child
 * components carrying `cryptoProperties` (the part the previous "CycloneDX-shaped"
 * emitters were missing). No external dependency, no network — pure + synchronous
 * so it is unit-testable without the DOM.
 */

/** A canonical PQC algorithm lifted into a `cryptographic-asset` component. */
export interface CbomAlgorithm {
  canonical: string
  primitive: string
  /** Specific parameter set when named in the source, e.g. "ML-KEM-768" — lets
   *  a CBOM consumer tell ML-KEM-768 from ML-KEM-1024. */
  parameterSet?: string
  /** NIST PQC security category (1-5) implied by the parameter set, if known. */
  securityCategory?: number
}

/** A FIPS/ACVP certification surfaced as component evidence. */
export interface CbomCertification {
  certType: string
  certId: string
  certLink?: string
}

/** CycloneDX 1.6 component types this emitter uses. */
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
  /** PQC algorithms this component provides → emitted as child crypto-assets. */
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
  /** Number of derived `cryptographic-asset` components emitted. */
  cryptoAssetCount: number
}

/**
 * Known PQC algorithm tokens we can confidently lift into crypto-asset
 * components. Matched case-insensitively as plain substrings (no regex), so
 * detection stays linear and free of backtracking risk.
 */
const PQC_ALGO_TOKENS: { tokens: string[]; canonical: string; primitive: string }[] = [
  { tokens: ['ML-KEM', 'MLKEM'], canonical: 'ML-KEM', primitive: 'kem' },
  { tokens: ['ML-DSA', 'MLDSA'], canonical: 'ML-DSA', primitive: 'signature' },
  { tokens: ['SLH-DSA', 'SLHDSA'], canonical: 'SLH-DSA', primitive: 'signature' },
  { tokens: ['KYBER'], canonical: 'Kyber', primitive: 'kem' },
  { tokens: ['DILITHIUM'], canonical: 'Dilithium', primitive: 'signature' },
  { tokens: ['FALCON'], canonical: 'Falcon', primitive: 'signature' },
  { tokens: ['SPHINCS'], canonical: 'SPHINCS+', primitive: 'signature' },
  { tokens: ['FRODOKEM'], canonical: 'FrodoKEM', primitive: 'kem' },
  { tokens: ['XMSS'], canonical: 'XMSS', primitive: 'signature' },
  { tokens: ['BIKE'], canonical: 'BIKE', primitive: 'kem' },
  { tokens: ['HQC'], canonical: 'HQC', primitive: 'kem' },
]

/** Extract the distinct canonical PQC algorithms named anywhere in `text`. */
export function extractPqcAlgorithmsFromText(text: string): CbomAlgorithm[] {
  const haystack = (text || '').toUpperCase()
  const out: CbomAlgorithm[] = []
  for (const { tokens, canonical, primitive } of PQC_ALGO_TOKENS) {
    if (tokens.some((t) => haystack.includes(t)))
      out.push({ canonical, primitive, ...detectParameterSet(canonical, haystack) })
  }
  return out
}

/** Infer the specific parameter set + NIST category for the lattice/hash
 *  standards when the source text names one (e.g. "ML-KEM-768"). Returns an
 *  empty object for families with no standardized numeric suffix detected. */
function detectParameterSet(
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

/**
 * Build a CycloneDX 1.6 CBOM document from neutral component inputs.
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
          // CycloneDX 1.6 requires method-level `confidence` alongside `technique`.
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

    // Child crypto-asset components for each PQC algorithm the component exposes.
    for (const algo of input.algorithms ?? []) {
      cryptoAssetCount++
      // Prefer the specific parameter set as the asset name/ref so consumers can
      // distinguish ML-KEM-768 from ML-KEM-1024.
      const label = algo.parameterSet ?? algo.canonical
      components.push({
        type: 'cryptographic-asset',
        'bom-ref': `${input.bomRef}#${label}`,
        name: label,
        cryptoProperties: {
          assetType: 'algorithm',
          algorithmProperties: {
            primitive: algo.primitive,
            executionEnvironment: 'software-plain-ram',
            ...(algo.parameterSet ? { parameterSetIdentifier: algo.parameterSet } : {}),
            ...(algo.securityCategory ? { nistQuantumSecurityLevel: algo.securityCategory } : {}),
            cryptoFunctions:
              algo.primitive === 'kem' ? ['encapsulate', 'decapsulate'] : ['sign', 'verify'],
          },
        },
        properties: [{ name: 'pqctoday:providedBy', value: input.name }],
      })
    }
  }

  const doc = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
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
