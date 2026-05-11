#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-cbom.ts — CycloneDX 1.6 Cryptography Bill of Materials (CBOM)
 *
 * Reads the latest pqc_product_catalog CSV and emits a CycloneDX 1.6 CBOM
 * at public/data/pqctoday-cbom.json.
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

async function main() {
  const files = await glob('pqc_product_catalog_*.csv', { cwd: DATA_DIR })
  files.sort()
  const latest = files.at(-1)
  if (!latest) {
    console.error('No product catalog CSV found')
    process.exit(1)
  }

  const raw = fs.readFileSync(path.join(DATA_DIR, latest), 'utf8')
  const parsed = Papa.parse<RawProduct>(raw, { header: true, skipEmptyLines: true })

  const pqcProducts = parsed.data.filter(
    (p) => p.pqc_support && p.pqc_support.trim().toLowerCase() !== 'none'
  )

  const components = pqcProducts.map((p) => {
    const algos = pqcAlgorithmsFromCapability(p.pqc_capability_description || '')
    const bom_ref = createHash('sha256')
      .update(`${p.product_id}:${p.software_name}:${p.latest_version || ''}`)
      .digest('hex')
      .slice(0, 16)

    return {
      type: 'cryptographic-asset',
      'bom-ref': bom_ref,
      name: p.software_name,
      version: p.latest_version || undefined,
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
