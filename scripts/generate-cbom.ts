#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-cbom.ts — CycloneDX 1.6 Cryptography Bill of Materials (CBOM)
 *
 * Reads four CSVs from src/data/ and emits a CycloneDX 1.6 CBOM at
 * public/data/pqctoday-cbom.json. The inputs are the migrate /
 * product-catalogue family that ships from the same source-of-truth as
 * the /migrate route:
 *
 *   1. pqc_product_catalog_*.csv  — product entries; identity + crypto
 *      capability + CSWP 39 tags
 *   2. algo_product_xref_*.csv    — precise algorithm names per product,
 *      with confidence-scored implementation provenance (preferred over
 *      free-text parsing of pqc_capability_description)
 *   3. migrate_purl_xref_*.csv    — Package URL (pkg:…) identifiers per
 *      product, when a public-registry match exists
 *   4. migrate_cpe_xref_*.csv     — NVD CPE 2.3 URIs per product, when
 *      NVD has indexed the product
 *
 * Only products with pqc_support !== 'None' are included.
 *
 * Usage: npx tsx scripts/generate-cbom.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { glob } from 'glob'
import { createHash } from 'crypto'

const DATA_DIR = path.resolve(process.cwd(), 'src/data')
const OUT_PATH = path.resolve(process.cwd(), 'public/data/pqctoday-cbom.json')
const DRY_RUN = process.argv.includes('--dry-run')

interface RawProduct {
  product_id: string
  software_name: string
  category_name: string
  infrastructure_layer: string
  pqc_support: string
  pqc_capability_description: string
  fips_validated: string
  latest_version: string
  vendor_name_original?: string
  authoritative_source?: string
  repository_url?: string
  confidence_score?: string
  cswp39_tags?: string
}

interface RawAlgoXref {
  product_id: string
  algorithm_name: string
  implementation_name: string
  implementation_type: string
  implementation_url: string
  verification_status: string
  confidence_score: string
}

interface RawPurlXref {
  product_id: string
  software_name: string
  purl: string
  status: string
}

interface RawCpeXref {
  product_id: string
  software_name: string
  cpe_uri: string
  status: string
}

type CycloneDXAlgorithmType = 'KEM' | 'Signature' | 'Hash' | 'SymmetricEncryption' | 'Other'

function inferAlgorithmType(name: string, desc: string): CycloneDXAlgorithmType {
  const s = (name + ' ' + desc).toLowerCase()
  if (s.includes('ml-kem') || s.includes('kyber') || s.includes('kem')) return 'KEM'
  if (
    s.includes('ml-dsa') ||
    s.includes('dilithium') ||
    s.includes('slh-dsa') ||
    s.includes('signature')
  )
    return 'Signature'
  if (s.includes('sha') || s.includes('hash')) return 'Hash'
  if (s.includes('aes') || s.includes('symmetric')) return 'SymmetricEncryption'
  return 'Other'
}

function pqcAlgorithmsFromCapability(desc: string): string[] {
  const algorithms: string[] = []
  const text = desc.toUpperCase()
  if (text.includes('ML-KEM') || text.includes('KYBER')) algorithms.push('ML-KEM')
  if (text.includes('ML-DSA') || text.includes('DILITHIUM')) algorithms.push('ML-DSA')
  if (text.includes('SLH-DSA') || text.includes('SPHINCS')) algorithms.push('SLH-DSA')
  if (text.includes('FN-DSA') || text.includes('FALCON')) algorithms.push('FN-DSA')
  if (text.includes('HQC')) algorithms.push('HQC')
  if (text.includes('FRODOKEM') || text.includes('FRODO-KEM')) algorithms.push('FrodoKEM')
  if (text.includes('CLASSIC MCELIECE') || text.includes('CLASSIC-MCELIECE'))
    algorithms.push('Classic-McEliece')
  return algorithms
}

async function loadLatest<T extends object>(
  pattern: string
): Promise<{ filename: string; rows: T[] }> {
  const files = await glob(pattern, { cwd: DATA_DIR })
  files.sort()
  const latest = files.at(-1)
  if (!latest) throw new Error(`No CSV found for pattern ${pattern}`)
  const raw = fs.readFileSync(path.join(DATA_DIR, latest), 'utf8')
  const parsed = Papa.parse<T>(raw, { header: true, skipEmptyLines: true })
  return { filename: latest, rows: parsed.data }
}

async function main() {
  // ── Inputs ──────────────────────────────────────────────────────────────
  const products = await loadLatest<RawProduct>('pqc_product_catalog_*.csv')
  const algoXref = await loadLatest<RawAlgoXref>('algo_product_xref_*.csv')
  const purlXref = await loadLatest<RawPurlXref>('migrate_purl_xref_*.csv')
  const cpeXref = await loadLatest<RawCpeXref>('migrate_cpe_xref_*.csv')

  // ── Per-product xref indices ────────────────────────────────────────────
  // algo_product_xref has many rows per product (one per algorithm + impl);
  // collect each product's distinct algorithm names and the implementation
  // details for downstream use.
  const algosByProduct = new Map<string, RawAlgoXref[]>()
  for (const r of algoXref.rows) {
    if (!r.product_id) continue
    if (r.verification_status && r.verification_status.toLowerCase() === 'unverified') continue
    const list = algosByProduct.get(r.product_id) ?? []
    list.push(r)
    algosByProduct.set(r.product_id, list)
  }

  // PURL: most rows in migrate_purl_xref carry the join key in
  // `software_name` (product_id is populated only on a minority).
  // Index by both so the lookup below can try product_id first and fall
  // back to software_name. Keep only matched rows; the xref records
  // explicit "not_found" entries for SBOM-tooling completeness.
  const purlByProductId = new Map<string, string>()
  const purlBySoftwareName = new Map<string, string>()
  for (const r of purlXref.rows) {
    if (!r.purl || r.status !== 'matched') continue
    if (r.product_id) purlByProductId.set(r.product_id, r.purl)
    if (r.software_name) purlBySoftwareName.set(r.software_name, r.purl)
  }

  // CPE: product_id is the canonical join key (column 1, populated on
  // every row).
  const cpeByProductId = new Map<string, string>()
  for (const r of cpeXref.rows) {
    if (r.product_id && r.cpe_uri && r.status && r.status !== 'not_found') {
      cpeByProductId.set(r.product_id, r.cpe_uri)
    }
  }

  console.log(
    `Loaded: ${products.filename} (${products.rows.length} products), ` +
      `${algoXref.filename} (${algoXref.rows.length} algo-product rows; ` +
      `${algosByProduct.size} products with algorithms), ` +
      `${purlXref.filename} (${purlBySoftwareName.size} PURLs by software_name, ` +
      `${purlByProductId.size} by product_id), ` +
      `${cpeXref.filename} (${cpeByProductId.size} matched CPEs)`
  )

  const pqcProducts = products.rows.filter(
    (p) => p.pqc_support && p.pqc_support.trim().toLowerCase() !== 'none'
  )

  const components = pqcProducts.map((p) => {
    // Prefer the precise algorithm list from algo_product_xref. Fall back
    // to text-parsed inference from pqc_capability_description only when
    // the xref has no entry for this product — typically newer products
    // not yet exercised by the algo-xref maintainer.
    const xrefEntries = algosByProduct.get(p.product_id) ?? []
    const xrefAlgoNames = Array.from(
      new Set(xrefEntries.map((e) => e.algorithm_name).filter(Boolean))
    )
    const algos =
      xrefAlgoNames.length > 0
        ? xrefAlgoNames
        : pqcAlgorithmsFromCapability(p.pqc_capability_description || '')
    const algorithmSource =
      xrefAlgoNames.length > 0 ? 'algo_product_xref' : 'capability_description'

    // PURL: try product_id first, then software_name (most matched rows
    // in migrate_purl_xref carry only software_name as the join key).
    const purl = purlByProductId.get(p.product_id) ?? purlBySoftwareName.get(p.software_name)
    const cpe = cpeByProductId.get(p.product_id)

    const bom_ref = createHash('sha256')
      .update(`${p.product_id}:${p.software_name}:${p.latest_version || ''}`)
      .digest('hex')
      .slice(0, 16)

    return {
      type: 'cryptographic-asset',
      'bom-ref': bom_ref,
      name: p.software_name,
      version: p.latest_version || undefined,
      purl: purl || undefined,
      cpe: cpe || undefined,
      manufacturer: p.vendor_name_original ? { name: p.vendor_name_original } : undefined,
      cryptoProperties: {
        assetType: 'related-crypto-material',
        algorithmProperties:
          algos.length > 0
            ? {
                parameterSetIdentifier: algos.join(', '),
                primitive: inferAlgorithmType(p.software_name, p.pqc_capability_description || ''),
              }
            : undefined,
        oid: undefined,
      },
      description: p.pqc_capability_description || undefined,
      externalReferences: [
        ...(p.repository_url ? [{ type: 'vcs', url: p.repository_url }] : []),
        ...(p.authoritative_source ? [{ type: 'website', url: p.authoritative_source }] : []),
      ].filter(Boolean),
      properties: [
        { name: 'pqctoday:product_id', value: p.product_id },
        { name: 'pqctoday:category', value: p.category_name },
        { name: 'pqctoday:layer', value: p.infrastructure_layer },
        { name: 'pqctoday:fips_validated', value: p.fips_validated || 'false' },
        { name: 'pqctoday:algorithm_source', value: algorithmSource },
        ...(xrefEntries.length > 0
          ? [
              {
                name: 'pqctoday:algorithm_implementations',
                value: xrefEntries
                  .map((e) =>
                    e.implementation_name
                      ? `${e.algorithm_name} (${e.implementation_name})`
                      : e.algorithm_name
                  )
                  .join('; '),
              },
            ]
          : []),
        ...(p.confidence_score
          ? [{ name: 'pqctoday:confidence_score', value: p.confidence_score }]
          : []),
        ...(p.cswp39_tags ? [{ name: 'pqctoday:cswp39_tags', value: p.cswp39_tags }] : []),
      ],
    }
  })

  const cbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: `urn:uuid:pqctoday-cbom-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      tools: [{ name: 'pqctoday-hub', version: '1.0' }],
      component: {
        type: 'application',
        name: 'PQC Today Hub',
        description: 'PQC algorithm and product registry for post-quantum migration planning',
      },
    },
    components,
  }

  if (DRY_RUN) {
    console.log(`[dry-run] Would write ${components.length} components → ${OUT_PATH}`)
    console.log('Sample component:', JSON.stringify(components[0], null, 2))
  } else {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(cbom, null, 2), 'utf8')
    console.log(`Wrote ${components.length} components → ${OUT_PATH}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
