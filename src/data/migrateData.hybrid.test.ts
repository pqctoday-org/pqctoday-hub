// SPDX-License-Identifier: AGPL-3.0-only
// The catalog loader, run end to end over fixture CSVs: one carrying the
// hybrid_kem_support / hybrid_sig_support columns, one without them.
import { describe, it, expect, vi, beforeEach } from 'vitest'

const fixture = vi.hoisted(() => ({ csv: '' }))

vi.mock('./csvUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./csvUtils')>()
  return {
    ...actual,
    loadLatestCSV: ((modules, regex, transform, withPrevious, headers) =>
      regex.source.includes('catalog_')
        ? actual.loadLatestCSV(
            { './pqc_product_catalog_11012026.csv': fixture.csv },
            regex,
            transform,
            withPrevious,
            headers
          )
        : actual.loadLatestCSV(
            modules,
            regex,
            transform,
            withPrevious,
            headers
          )) as typeof actual.loadLatestCSV,
  }
})

const BASE =
  'product_id,software_name,category_id,category_name,infrastructure_layer,pqc_support,pqc_capability_description,verification_status,status'

async function load(csv: string) {
  fixture.csv = csv
  vi.resetModules()
  return (await import('./migrateData')).softwareData
}

describe('catalog loader — hybrid support columns', () => {
  beforeEach(() => {
    fixture.csv = ''
  })

  it('parses the columns when present, leaving blank cells unassessed', async () => {
    const rows = await load(
      [
        `${BASE},hybrid_kem_support,hybrid_sig_support`,
        'p-a,Lib A,CSC-001,TLS,AppServers,Yes,,Needs Verification,active,tls-default+api,api-experimental',
        'p-b,Lib B,CSC-001,TLS,AppServers,Yes,,Needs Verification,active,none,none',
        'p-c,Lib C,CSC-001,TLS,AppServers,No,,Needs Verification,active,,',
        'p-d,Lib D,CSC-001,TLS,AppServers,Yes,,Needs Verification,active,tls-optin+bogus,bogus',
      ].join('\n')
    )
    const by = new Map(rows.map((r) => [r.productId, r]))
    expect(by.get('p-a')?.hybridKemSupport).toEqual(['tls-default', 'api'])
    expect(by.get('p-a')?.hybridSigSupport).toBe('api-experimental')
    expect(by.get('p-b')?.hybridKemSupport).toEqual(['none'])
    expect(by.get('p-b')?.hybridSigSupport).toBe('none')
    expect(by.get('p-c')?.hybridKemSupport).toBeUndefined()
    expect(by.get('p-c')?.hybridSigSupport).toBeUndefined()
    expect(by.get('p-d')?.hybridKemSupport).toEqual(['tls-optin'])
    expect(by.get('p-d')?.hybridSigSupport).toBeUndefined()
  })

  it('loads a catalog without the columns, with every product unassessed', async () => {
    const rows = await load(
      `${BASE}\np-a,Lib A,CSC-001,TLS,AppServers,Yes,,Needs Verification,active`
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].hybridKemSupport).toBeUndefined()
    expect(rows[0].hybridSigSupport).toBeUndefined()
  })
})
