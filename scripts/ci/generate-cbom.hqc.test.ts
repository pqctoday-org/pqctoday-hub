// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Papa from 'papaparse'
import { afterEach, describe, expect, it } from 'vitest'
import { DATA_FILENAMES } from '../../src/data/generated/dataFilenames.generated'

const ROOT = path.resolve(__dirname, '../..')
const dirs: string[] = []
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
})

interface Component {
  name: string
  cryptoProperties: {
    algorithmProperties?: {
      primitive: string
      algorithmFamily?: string
      parameterSetIdentifier?: string
    }
  }
}

function generate(rows: Record<string, string>[], xrefRows: Record<string, string>[] = []) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'cbom-hqc-'))
  dirs.push(cwd)
  const data = path.join(cwd, 'src/data')
  mkdirSync(data, { recursive: true })
  writeFileSync(path.join(data, 'pqc_product_catalog_01012027.csv'), Papa.unparse(rows))
  for (const [name, header] of [
    [
      'algo_product_xref',
      'product_id,algorithm_name,implementation_name,implementation_type,implementation_url,verification_status,confidence_score',
    ],
    ['migrate_purl_xref', 'product_id,software_name,purl,status'],
    ['migrate_cpe_xref', 'product_id,software_name,cpe_uri,status'],
  ])
    writeFileSync(path.join(data, `${name}_01012027.csv`), `${header}\n`)
  if (xrefRows.length)
    writeFileSync(path.join(data, 'algo_product_xref_01012027.csv'), Papa.unparse(xrefRows))
  const result = spawnSync(
    process.execPath,
    [
      '--import',
      path.join(ROOT, 'node_modules/tsx/dist/loader.mjs'),
      path.join(ROOT, 'scripts/generate-cbom.ts'),
    ],
    { cwd, encoding: 'utf8' }
  )
  expect(result.status, `${result.stdout}${result.stderr}`).toBe(0)
  return (
    JSON.parse(readFileSync(path.join(cwd, 'public/data/pqctoday-cbom.json'), 'utf8')) as {
      components: Component[]
    }
  ).components
}

describe('generate-cbom HQC primitive', () => {
  it('keeps the actual current HQC implementation a KEM without requiring a description keyword', () => {
    expect(DATA_FILENAMES.migrate).toBeTruthy()
    const records = Papa.parse<Record<string, string>>(
      readFileSync(path.join(ROOT, 'src/data', DATA_FILENAMES.migrate!), 'utf8'),
      { header: true, skipEmptyLines: true }
    ).data
    const hqc = records.filter((r) => r.product_id === 'hqc-reference-implementation')
    expect(hqc).toHaveLength(1)
    // The shipped source describes implementations/test scope; the family name
    // itself identifies the primitive and must survive prose changes.
    const components = generate(hqc)
    expect(components).toHaveLength(1)
    expect(components[0].cryptoProperties.algorithmProperties?.primitive).toBe('kem')
    expect(components[0].cryptoProperties.algorithmProperties?.algorithmFamily).toBeUndefined()
  })

  it('recognizes HQC parameter tokens case-insensitively without matching longer unrelated words', () => {
    const names = ['HQC', 'hqc-3', 'AHQC', 'HQCtools']
    const components = generate(
      names.map((name, i) => ({
        product_id: `p${i}`,
        software_name: name,
        pqc_support: 'Yes',
        pqc_capability_description: `${name} implementation and API tests.`,
      }))
    )
    expect(
      components.map((c) => [c.name, c.cryptoProperties.algorithmProperties?.primitive])
    ).toEqual([
      ['HQC', 'kem'],
      ['hqc-3', 'kem'],
      ['AHQC', 'other'],
      ['HQCtools', 'other'],
    ])
  })

  it('keeps the actual KpqClean comparison collection mixed without discarding its algorithm list', () => {
    const records = Papa.parse<Record<string, string>>(
      readFileSync(path.join(ROOT, 'src/data', DATA_FILENAMES.migrate!), 'utf8'),
      { header: true, skipEmptyLines: true }
    ).data
    const kpq = records.filter((r) => r.product_id === 'kpqclean-korean-reference')
    expect(kpq).toHaveLength(1)
    // Preserve the actual cross-reference input list during classification.
    const xrefs = Papa.parse<Record<string, string>>(
      readFileSync(path.join(ROOT, 'src/data/algo_product_xref_09252026.csv'), 'utf8'),
      { header: true, skipEmptyLines: true }
    ).data.filter((r) => r.product_id === 'kpqclean-korean-reference')
    expect(xrefs.length).toBeGreaterThan(0)
    const components = generate(kpq, xrefs)
    expect(components).toHaveLength(1)
    expect(components[0].cryptoProperties.algorithmProperties?.primitive).toBe('other')
    expect(components[0].cryptoProperties.algorithmProperties?.parameterSetIdentifier).toBe(
      [...new Set(xrefs.map((r) => r.algorithm_name))].join(', ')
    )
  })

  it('classifies the explicit mixed comparison scope while retaining single-primitive priority', () => {
    const descriptions = [
      'ML-KEM key encapsulation.',
      'ML-DSA signatures.',
      'ML-KEM and ML-DSA: KEM/PKE and signature comparisons.',
    ]
    const components = generate(
      descriptions.map((desc, i) => ({
        product_id: `mixed${i}`,
        software_name: `Fixture ${i}`,
        pqc_support: 'Yes',
        pqc_capability_description: desc,
      }))
    )
    expect(components.map((c) => c.cryptoProperties.algorithmProperties?.primitive)).toEqual([
      'kem',
      'signature',
      'other',
    ])
  })
})
