// SPDX-License-Identifier: GPL-3.0-only
/**
 * CycloneDX CBOM (Cryptographic Bill of Materials) export.
 *
 * Migrate gap-closer row 1 (§2, p.64–67 of the framework backlog): emit the
 * currently-filtered product set as a CycloneDX 1.6 BOM that reuses the
 * CPE / PURL / FIPS-cert cross-references already held on each `SoftwareItem`.
 *
 * This is a *pragmatic* CBOM: each product is a `library` component carrying its
 * CPE (`cpe`) and Package-URL (`purl`) identity plus, where the product exposes
 * post-quantum algorithms, a child `cryptographic-asset` component per algorithm
 * (CycloneDX `components[].cryptoProperties`). FIPS 140-3 / ACVP certifications
 * surface as evidence on the parent component. The shape follows the CycloneDX
 * 1.6 cryptography model closely enough for downstream CBOM tooling to ingest,
 * while staying schema-light (no external dependency, no network).
 *
 * Additive: nothing here runs unless the user clicks "Export CBOM". When unused,
 * the Migrate page behaves exactly as before.
 */
import type { SoftwareItem, CertificationXref } from '../../types/MigrateTypes'
import { cpeByProduct } from '../../data/cpeXrefData'
import { purlByProduct } from '../../data/purlXrefData'
import { certsByProduct } from '../../data/certificationXrefData'

/**
 * Known PQC algorithm tokens we can confidently lift into crypto-asset
 * components. `tokens` are matched case-insensitively as plain substrings
 * (no regex) against the product + cert text, so detection stays linear and
 * free of backtracking risk.
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

/** Extract the distinct canonical PQC algorithms a product (and its certs) expose. */
export function extractPqcAlgorithms(
  item: SoftwareItem,
  certs: CertificationXref[]
): { canonical: string; primitive: string }[] {
  const haystack = [
    item.pqcSupport,
    item.pqcCapabilityDescription,
    ...certs.map((c) => c.pqcAlgorithms),
  ]
    .filter(Boolean)
    .join(' ')
    .toUpperCase()

  const out: { canonical: string; primitive: string }[] = []
  for (const { tokens, canonical, primitive } of PQC_ALGO_TOKENS) {
    if (tokens.some((t) => haystack.includes(t))) {
      out.push({ canonical, primitive })
    }
  }
  return out
}

/** A deterministic bom-ref slug for a product. */
function bomRef(item: SoftwareItem): string {
  return `pkg:${item.productId || item.softwareName.toLowerCase().replace(/\s+/g, '-')}`
}

interface CbomBuildResult {
  /** The CycloneDX JSON document (already pretty-printed). */
  json: string
  /** Number of product components emitted. */
  componentCount: number
  /** Number of distinct crypto-asset components emitted. */
  cryptoAssetCount: number
}

/**
 * Build a CycloneDX 1.6 CBOM document from the given product set.
 * Pure + synchronous — safe to unit-test without the DOM.
 */
export function buildCycloneDxCbom(items: SoftwareItem[]): CbomBuildResult {
  const now = new Date().toISOString()
  const components: Record<string, unknown>[] = []
  let cryptoAssetCount = 0

  for (const item of items) {
    const ref = bomRef(item)
    const cpe = cpeByProduct.get(item.softwareName)
    const purl = purlByProduct.get(item.softwareName)
    const certs = certsByProduct.get(item.softwareName) ?? []
    const algos = extractPqcAlgorithms(item, certs)

    const properties: { name: string; value: string }[] = [
      { name: 'pqctoday:infrastructureLayer', value: item.infrastructureLayer || '' },
      { name: 'pqctoday:cisaCategory', value: item.cisaCategory || '' },
      { name: 'pqctoday:pqcSupport', value: item.pqcSupport || '' },
      { name: 'pqctoday:migrationPriority', value: item.pqcMigrationPriority || '' },
    ].filter((p) => p.value)

    if (item.fipsValidated) {
      properties.push({ name: 'pqctoday:fipsValidated', value: item.fipsValidated })
    }

    const component: Record<string, unknown> = {
      type: 'library',
      'bom-ref': ref,
      name: item.softwareName,
      ...(item.latestVersion ? { version: item.latestVersion } : {}),
      ...(item.productBrief ? { description: item.productBrief } : {}),
      ...(cpe?.cpeUri ? { cpe: cpe.cpeUri } : {}),
      ...(purl?.purl ? { purl: purl.purl } : {}),
      properties,
    }

    // Certifications → component evidence (occurrences-style external refs).
    if (certs.length > 0) {
      component.evidence = {
        identity: certs.map((c) => ({
          field: 'cpe',
          confidence: 1,
          methods: [
            {
              technique: 'attestation',
              value: `${c.certType} ${c.certId}`.trim(),
            },
          ],
        })),
      }
      const certRefs = certs
        .filter((c) => c.certLink)
        .map((c) => ({ type: 'certification-report', url: c.certLink, comment: c.certType }))
      if (certRefs.length > 0) component.externalReferences = certRefs
    }

    components.push(component)

    // Child crypto-asset components for each PQC algorithm the product exposes.
    for (const algo of algos) {
      cryptoAssetCount++
      components.push({
        type: 'cryptographic-asset',
        'bom-ref': `${ref}#${algo.canonical}`,
        name: algo.canonical,
        cryptoProperties: {
          assetType: 'algorithm',
          algorithmProperties: {
            primitive: algo.primitive,
            executionEnvironment: 'software-plain-ram',
            cryptoFunctions:
              algo.primitive === 'kem' ? ['encapsulate', 'decapsulate'] : ['sign', 'verify'],
          },
        },
        properties: [{ name: 'pqctoday:providedBy', value: item.softwareName }],
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
      tools: [{ vendor: 'PQCToday', name: 'Migrate CBOM Export' }],
      properties: [
        { name: 'pqctoday:source', value: 'pqctoday-hub /migrate' },
        { name: 'pqctoday:productCount', value: String(items.length) },
      ],
    },
    components,
  }

  return {
    json: JSON.stringify(doc, null, 2),
    componentCount: items.length,
    cryptoAssetCount,
  }
}

/** RFC-4122 v4 UUID with a non-crypto fallback for non-secure contexts / tests. */
function cryptoRandomUuid(): string {
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

/** Trigger a browser download of the CBOM JSON for the given products. */
export function downloadCbom(items: SoftwareItem[]): CbomBuildResult {
  const result = buildCycloneDxCbom(items)
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([result.json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `pqc-cbom-cyclonedx-${date}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  return result
}
