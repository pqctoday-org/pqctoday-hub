// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import Papa from 'papaparse'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { afterEach, describe, expect, it } from 'vitest'

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
  const bom = JSON.parse(readFileSync(path.join(cwd, 'public/data/pqctoday-cbom.json'), 'utf8'))
  const ajv = new Ajv({ strict: false, allErrors: true })
  addFormats(ajv)
  const schema = (name: string) =>
    JSON.parse(readFileSync(path.join(ROOT, 'src/services/cbom/schema', name), 'utf8'))
  for (const name of ['spdx.schema.json', 'jsf-0.82.schema.json', 'cryptography-defs.schema.json'])
    ajv.addSchema(schema(name))
  const validate = ajv.compile(schema('bom-1.7.schema.json'))
  expect(validate(bom), JSON.stringify(validate.errors)).toBe(true)
  return (bom as { components: Component[] }).components
}

const REVIEWED_BENCH_CAPABILITY =
  'The harness defines benchmark cases for ML-DSA, SLH-DSA, ML-KEM and classical signing, key-agreement and encryption mechanisms, with explicit mechanism identifiers and key-generation parameter templates. Its source labels composite KEM/signature entries as PKCS#11 v3.3 working-draft operations while the module reports Cryptoki 3.2; they are not TLS or SSH groups.'

const row = (id: string, desc: string) => ({
  product_id: id,
  software_name: id,
  pqc_support: 'Yes',
  pqc_capability_description: desc,
})
describe('generate-cbom mixed resolved primitive categories', () => {
  it('retains the reviewed benchmark family list without claiming one primitive or family', () => {
    const [component] = generate([row('benchmark-fixture', REVIEWED_BENCH_CAPABILITY)])
    const props = component.cryptoProperties.algorithmProperties!
    expect(props.primitive).toBe('other')
    expect(props.parameterSetIdentifier).toContain('ML-KEM')
    expect(props.parameterSetIdentifier).toContain('ML-DSA')
    expect(props.algorithmFamily).toBeUndefined()
  })
  it('retains pure KEM and signature classifications and distinguishes mixed algorithm scope', () => {
    const components = generate([
      row('kem', 'ML-KEM-768 implementation.'),
      row('signature', 'ML-DSA-65 implementation.'),
      row('mixed', 'ML-KEM and ML-DSA benchmarks.'),
    ])
    expect(components.map((c) => c.cryptoProperties.algorithmProperties?.primitive)).toEqual([
      'kem',
      'signature',
      'other',
    ])
    expect(components[2].cryptoProperties.algorithmProperties?.parameterSetIdentifier).toBe(
      'ML-KEM, ML-DSA'
    )
  })
  it('uses the structured algorithm list rather than adding prose families to it', () => {
    const [component] = generate(
      [row('structured', 'ML-KEM and ML-DSA benchmarks.')],
      [{ product_id: 'structured', algorithm_name: 'ML-KEM' }]
    )
    expect(component.cryptoProperties.algorithmProperties?.parameterSetIdentifier).toBe('ML-KEM')
    expect(component.cryptoProperties.algorithmProperties?.primitive).toBe('kem')
    expect(component.cryptoProperties.algorithmProperties?.algorithmFamily).toBe('ML-KEM')
  })
  it('recognizes mixed structured families even when prose omits their names', () => {
    const [component] = generate(
      [row('structured', 'Timing harness.')],
      [
        { product_id: 'structured', algorithm_name: 'ML-KEM' },
        { product_id: 'structured', algorithm_name: 'ML-DSA' },
      ]
    )
    expect(component.cryptoProperties.algorithmProperties?.primitive).toBe('other')
    expect(component.cryptoProperties.algorithmProperties?.parameterSetIdentifier).toBe(
      'ML-KEM, ML-DSA'
    )
  })
})
