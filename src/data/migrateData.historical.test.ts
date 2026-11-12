// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { loadLatestCSV } from './csvUtils'
import { buildProductSnapshot } from './migrateData'

type Row = Parameters<typeof buildProductSnapshot>[0][number]
const modules = import.meta.glob('./pqc_product_catalog_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})
const rows = loadLatestCSV<Row, Row>(
  modules,
  /catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  (row) => row
).data
const id = 'Microsoft-Research-Post-Quantum-TLS'
const original = {
  ...rows.find((r) => r.product_id === id)!,
  status: 'active',
  deprecated_at: '',
  deprecated_reason: '',
}
const retired = {
  ...original,
  status: 'deprecated',
  deprecated_reason: 'Historical research prototype; upstream OpenSSL 1.1.1 fork discontinued.',
}

describe('Historical catalogue snapshots stay outside active consumers', () => {
  it('retains useful same-ID evidence without changing historical dates or claiming active availability', () => {
    const snapshot = buildProductSnapshot(rows.map((r) => (r.product_id === id ? retired : r)))
    expect(snapshot.active.some((r) => r.productId === id)).toBe(false)
    const record = snapshot.historical.get(id.toLowerCase())!
    expect(record.product.productId).toBe(id)
    expect(record.product.proofPublicationDate).toBe('2019-08-06')
    expect(record.product.latestVersion).toBe('OpenSSL 1.1.1')
    expect(record.product.proofUrl).toBe(original.proof_url)
    expect(record.product.pqcCapabilityDescription).toBe(original.pqc_capability_description)
    expect(record.lifecycle).toBe('deprecated')
    expect(record.product.status).toBeUndefined() // Dataset delta status is a different field.
    expect(record.deprecatedAt).toBeUndefined() // No invented archive/retirement date.
  })
  it('does not promote missing-proof, unexplained or unknown-lifecycle rows into public historical detail', () => {
    for (const row of [
      { ...retired, proof_url: '' },
      { ...retired, deprecated_reason: '' },
      { ...retired, status: 'draft' },
    ]) {
      const snapshot = buildProductSnapshot([row])
      expect(snapshot.active).toHaveLength(0)
      expect(snapshot.historical.size).toBe(0)
    }
  })
  it('projects each snapshot independently; a previous retirement cannot poison a current active record', () => {
    const before = buildProductSnapshot([retired])
    const current = buildProductSnapshot([original])
    expect(before.historical.size).toBe(1)
    expect(current.historical.size).toBe(0)
    expect(current.active.map((r) => r.productId)).toEqual([id])
    expect(buildProductSnapshot([retired]).historical.size).toBe(1)
    expect(original.status).toBe('active')
  })
  it('keeps existing duplicate/reissued references separate from historical lookup', () => {
    const duplicate = { ...retired, deprecated_reason: "re-issued as 'kept-product'" }
    const snapshot = buildProductSnapshot([duplicate])
    expect(snapshot.successors).toEqual([[id, 'kept-product']])
    expect(snapshot.active).toHaveLength(0)
  })
})
