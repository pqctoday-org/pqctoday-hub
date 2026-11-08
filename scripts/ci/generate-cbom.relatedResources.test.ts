// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

/** How a related resource reaches the post-quantum CBOM, generated for real from a tiny fixture catalogue. */

const ROOT = path.resolve(__dirname, '../..')
const TSX = path.join(ROOT, 'node_modules/.bin/tsx')
const GENERATOR = path.join(ROOT, 'scripts/generate-cbom.ts')

const PRODUCT_HEADER =
  'product_id,software_name,category_name,infrastructure_layer,pqc_support,' +
  'pqc_capability_description,fips_validated,latest_version,vendor_name_original,repository_url'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

interface Component {
  name: string
  purl?: string
  externalReferences?: Array<{ type: string; url: string; comment?: string }>
}

function generate(opts: { purlHeader: string; purlRows: string[]; repositoryUrl?: string }) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'cbom-related-'))
  dirs.push(cwd)
  const data = path.join(cwd, 'src/data')
  mkdirSync(data, { recursive: true })
  const csv = (header: string, lines: string[] = []) => [header, ...lines].join('\n') + '\n'
  writeFileSync(
    path.join(data, 'pqc_product_catalog_01012027.csv'),
    csv(PRODUCT_HEADER, [
      `p1,Fixture Product,Networking,Network,"Yes (ML-KEM)",,No,1.0,Vendor,${opts.repositoryUrl ?? ''}`,
    ])
  )
  writeFileSync(
    path.join(data, 'algo_product_xref_01012027.csv'),
    csv(
      'product_id,algorithm_name,implementation_name,implementation_type,implementation_url,verification_status,confidence_score'
    )
  )
  writeFileSync(
    path.join(data, 'migrate_purl_xref_01012027.csv'),
    csv(opts.purlHeader, opts.purlRows)
  )
  writeFileSync(
    path.join(data, 'migrate_cpe_xref_01012027.csv'),
    csv('product_id,software_name,cpe_uri,status')
  )
  const r = spawnSync(TSX, [GENERATOR], { cwd, encoding: 'utf8' })
  const out = path.join(cwd, 'public/data/pqctoday-cbom.json')
  let component: Component | undefined
  if (r.status === 0) {
    const cbom = JSON.parse(readFileSync(out, 'utf8')) as { components: Component[] }
    component = cbom.components[0]
  }
  return { code: r.status, log: `${r.stdout}${r.stderr}`, component }
}

const WITH_COLUMNS =
  'product_id,software_name,purl,status,related_resource_url,related_resource_kind'
const WITHOUT_COLUMNS = 'product_id,software_name,purl,status'

describe('generate-cbom related resources', () => {
  it('writes a source repository as a vcs reference and never as the purl', () => {
    const { code, log, component } = generate({
      purlHeader: WITH_COLUMNS,
      purlRows: ['p1,Fixture Product,,not_found,https://github.com/Intel/tdx,source_repository'],
    })
    expect(code, log).toBe(0)
    expect(component?.purl).toBeUndefined()
    expect(component?.externalReferences).toEqual([
      { type: 'vcs', url: 'https://github.com/Intel/tdx', comment: 'Source repository' },
    ])
  })

  it('writes an SDK and an issue tracker with their own reference types', () => {
    const sdk = generate({
      purlHeader: WITH_COLUMNS,
      purlRows: ['p1,Fixture Product,,not_found,https://github.com/Yubico/yubihsm-shell,sdk'],
    })
    expect(sdk.component?.externalReferences).toEqual([
      { type: 'other', url: 'https://github.com/Yubico/yubihsm-shell', comment: 'SDK' },
    ])
    const tracker = generate({
      purlHeader: WITH_COLUMNS,
      purlRows: [
        'p1,Fixture Product,,not_found,https://github.com/FusionAuth/fusionauth-issues,issue_tracker',
      ],
    })
    expect(tracker.component?.externalReferences?.[0]).toMatchObject({ type: 'issue-tracker' })
  })

  it('keeps a real purl as the purl, with the related resource beside it', () => {
    const { component } = generate({
      purlHeader: WITH_COLUMNS,
      purlRows: ['p1,Fixture Product,pkg:npm/fixture,matched,https://example.com/tests,test_suite'],
    })
    expect(component?.purl).toBe('pkg:npm/fixture')
    expect(component?.externalReferences?.map((r) => r.url)).toEqual(['https://example.com/tests'])
  })

  it('does not repeat the catalogue repository address as a second reference', () => {
    const { component } = generate({
      purlHeader: WITH_COLUMNS,
      purlRows: ['p1,Fixture Product,,not_found,https://github.com/Intel/tdx,source_repository'],
      repositoryUrl: 'https://github.com/Intel/tdx/',
    })
    expect(component?.externalReferences).toHaveLength(1)
  })

  it('skips a retired row when it comes to related resources', () => {
    const { code, log, component } = generate({
      purlHeader: WITH_COLUMNS + ',deprecated_at',
      purlRows: [
        'p1,Fixture Product,,not_found,https://github.com/Intel/tdx,source_repository,2026-11-01',
      ],
    })
    expect(code, log).toBe(0)
    expect(component?.externalReferences).toEqual([])
  })

  it('still exports a related resource from a live row that has an empty deprecated_at column', () => {
    const { component } = generate({
      purlHeader: WITH_COLUMNS + ',deprecated_at',
      purlRows: ['p1,Fixture Product,,not_found,https://github.com/Intel/tdx,source_repository,'],
    })
    expect(component?.externalReferences).toHaveLength(1)
  })

  it('works unchanged on a file without the columns, and with blank columns', () => {
    const without = generate({
      purlHeader: WITHOUT_COLUMNS,
      purlRows: ['p1,Fixture Product,pkg:npm/fixture,matched'],
    })
    expect(without.code, without.log).toBe(0)
    expect(without.component?.purl).toBe('pkg:npm/fixture')
    expect(without.component?.externalReferences).toEqual([])
    const blank = generate({
      purlHeader: WITH_COLUMNS,
      purlRows: ['p1,Fixture Product,pkg:npm/fixture,matched,,'],
    })
    expect(blank.component?.externalReferences).toEqual([])
  })
})
