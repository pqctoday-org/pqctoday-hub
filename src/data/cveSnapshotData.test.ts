// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { getCvesForProduct, hasCpeCoverage, __setCachedSnapshotForTests } from './cveSnapshotData'
import { cpeByProduct } from './cpeXrefData'
import type { CveSnapshot } from '@/types/CveTypes'

describe('cveSnapshotData', () => {
  beforeEach(() => {
    __setCachedSnapshotForTests(null)
  })

  it('returns the CVE list for a product whose CPE matches the snapshot', async () => {
    const matchedEntry = Array.from(cpeByProduct.values()).find(
      (x) => x.status === 'matched' && x.cpeUri
    )
    expect(matchedEntry, 'fixture: at least one matched CPE in xref').toBeTruthy()
    if (!matchedEntry) return

    const snapshot: CveSnapshot = {
      generatedAt: '2026-04-29T00:00:00Z',
      sourceCsv: 'migrate_cpe_xref_test.csv',
      byCpe: {
        [matchedEntry.cpeUri]: [
          {
            cveId: 'CVE-2014-0160',
            summary: 'Heartbleed.',
            severity: 'HIGH',
            cvssScore: 7.5,
            published: '2014-04-07',
            lastModified: '2024-02-12',
            refUrl: 'https://nvd.nist.gov/vuln/detail/CVE-2014-0160',
          },
        ],
      },
    }
    __setCachedSnapshotForTests(snapshot)

    const cves = await getCvesForProduct(matchedEntry.softwareName)
    expect(cves).toHaveLength(1)
    expect(cves[0].cveId).toBe('CVE-2014-0160')
  })

  it('returns [] for a product with no CPE mapping', async () => {
    __setCachedSnapshotForTests({
      generatedAt: '2026-04-29T00:00:00Z',
      sourceCsv: 'x.csv',
      byCpe: {},
    })
    const cves = await getCvesForProduct('__no-such-product__')
    expect(cves).toEqual([])
  })

  it('returns [] when the CPE has no entry in the snapshot', async () => {
    const matchedEntry = Array.from(cpeByProduct.values()).find(
      (x) => x.status === 'matched' && x.cpeUri
    )
    if (!matchedEntry) return
    __setCachedSnapshotForTests({
      generatedAt: '2026-04-29T00:00:00Z',
      sourceCsv: 'x.csv',
      byCpe: {},
    })
    const cves = await getCvesForProduct(matchedEntry.softwareName)
    expect(cves).toEqual([])
  })

  it('hasCpeCoverage true for matched/partial, false otherwise', () => {
    const matched = Array.from(cpeByProduct.values()).find(
      (x) => x.status === 'matched' && x.cpeUri
    )
    if (matched) expect(hasCpeCoverage(matched.softwareName)).toBe(true)
    expect(hasCpeCoverage('__no-such-product__')).toBe(false)
  })
})
