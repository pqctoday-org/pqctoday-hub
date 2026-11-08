// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

/** Which catalogue rows reach the post-quantum CBOM, generated for real from a tiny fixture catalogue. */

const ROOT = path.resolve(__dirname, '../..')
const TSX = path.join(ROOT, 'node_modules/.bin/tsx')
const GENERATOR = path.join(ROOT, 'scripts/generate-cbom.ts')

const PRODUCT_HEADER =
  'product_id,software_name,category_name,infrastructure_layer,pqc_support,' +
  'pqc_capability_description,fips_validated,latest_version,vendor_name_original'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function generate(rows: Array<[id: string, name: string, pqcSupport: string]>) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'cbom-'))
  dirs.push(cwd)
  const data = path.join(cwd, 'src/data')
  mkdirSync(data, { recursive: true })
  const csv = (header: string, lines: string[] = []) => [header, ...lines].join('\n') + '\n'
  writeFileSync(
    path.join(data, 'pqc_product_catalog_01012027.csv'),
    csv(
      PRODUCT_HEADER,
      rows.map(
        ([id, name, support]) => `${id},${name},Networking,Network,"${support}",,No,1.0,Vendor`
      )
    )
  )
  writeFileSync(
    path.join(data, 'algo_product_xref_01012027.csv'),
    csv(
      'product_id,algorithm_name,implementation_name,implementation_type,implementation_url,verification_status,confidence_score'
    )
  )
  writeFileSync(
    path.join(data, 'migrate_purl_xref_01012027.csv'),
    csv('product_id,software_name,purl,status')
  )
  writeFileSync(
    path.join(data, 'migrate_cpe_xref_01012027.csv'),
    csv('product_id,software_name,cpe_uri,status')
  )
  const r = spawnSync(TSX, [GENERATOR], { cwd, encoding: 'utf8' })
  const out = path.join(cwd, 'public/data/pqctoday-cbom.json')
  let names: string[] = []
  if (r.status === 0) {
    const cbom = JSON.parse(readFileSync(out, 'utf8')) as { components: Array<{ name: string }> }
    names = cbom.components.map((c) => c.name)
  }
  return { code: r.status, log: `${r.stdout}${r.stderr}`, names }
}

describe('generate-cbom inclusion', () => {
  it('leaves a PSK row out of the CBOM and keeps a Partial row in', () => {
    const { code, log, names } = generate([
      ['p-psk', 'PskProduct', 'PSK (pre-shared key mixed in; ML-KEM planned)'],
      ['p-partial', 'PartialProduct', 'Partial (ML-KEM planned)'],
    ])
    expect(code, log).toBe(0)
    expect(names).toEqual(['PartialProduct'])
  })

  it('excludes every PSK spelling and No rows, and keeps the other values', () => {
    const { code, log, names } = generate([
      ['p1', 'Psk upper', 'PSK (pre-shared key)'],
      ['p2', 'Psk lower', 'psk (pre-shared key)'],
      ['p3', 'Psk bare', 'PSK'],
      ['p4', 'No plain', 'No'],
      ['p5', 'No note', 'No (classical RSA/EC only)'],
      ['p6', 'Yes row', 'Yes (ML-KEM)'],
      ['p7', 'Planned row', 'Planned (ML-DSA 2027)'],
      ['p8', 'Pending row', 'Pending Verification'],
    ])
    expect(code, log).toBe(0)
    expect(names).toEqual(['Yes row', 'Planned row', 'Pending row'])
  })
})
