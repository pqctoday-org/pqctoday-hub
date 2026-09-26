import { describe, it, expect } from 'vitest'
import { parseSecondarySources, parseThreatsCSV, retiredThreats, threatsData } from './threatsData'

describe('threatsData', () => {
  it('loads without error', () => {
    expect(threatsData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of threatsData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of threatsData) {
      expect(item.threatId).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = threatsData.map((item) => item.threatId)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })
})

// A draft row is a not-yet-filled stub from the private add-row tool (how the
// blank CROS-008 reached the live page). It must never reach the page, the
// same as a retired row.
describe('parseThreatsCSV — row status', () => {
  const header =
    'industry,threat_id,threat_description,criticality,crypto_at_risk,pqc_replacement,main_source,source_url,status,deprecated_at,deprecated_reason'
  const csv = [
    header,
    'Finance & Banking,T-ACTIVE,Live row,High,RSA-2048,ML-KEM-768,Src,https://example.org,active,,',
    'Cross-Industry,T-DRAFT,Stub row,,,,Src,https://example.org,draft,,',
    'Cross-Industry,T-DRAFT-CAPS,Stub row,,,,Src,https://example.org, Draft ,,',
    'Insurance,T-RETIRED,Old row,Medium,RSA,ML-KEM,Src,https://example.org,deprecated,2026-05-10,Removed',
    'Insurance,T-OBSOLETE,Old row,Medium,RSA,ML-KEM,Src,https://example.org,obsolete,,',
  ].join('\n')

  it('keeps active rows and drops draft, deprecated and obsolete rows', () => {
    expect(parseThreatsCSV(csv).map((t) => t.threatId)).toEqual(['T-ACTIVE'])
  })

  it('the bundled data carries no draft or retired row', () => {
    const ids = new Set(threatsData.map((t) => t.threatId))
    expect(ids.has('T-DRAFT')).toBe(false)
    expect(threatsData.length).toBe(ids.size)
  })
})

describe('parseThreatsCSV — blank criticality and retired lookup', () => {
  const header =
    'industry,threat_id,threat_description,criticality,crypto_at_risk,pqc_replacement,main_source,source_url,status,deprecated_at,deprecated_reason'

  it('reads a blank criticality as Unrated, never Medium', () => {
    const csv = `${header}\nInsurance,T-1,Stub,,,,Src,https://example.org,active,,`
    expect(parseThreatsCSV(csv)[0].criticality).toBe('Unrated')
  })

  it('keeps a lookup of every retired id in the live snapshot, with its date', () => {
    for (const [id, r] of retiredThreats) {
      expect(r.threatId).toBe(id)
      expect(threatsData.some((t) => t.threatId === id)).toBe(false)
    }
    expect(retiredThreats.size).toBeGreaterThan(0)
  })
})

describe('second-source columns', () => {
  it('one source: plain column names belong to it', () => {
    expect(parseSecondarySources('RFC 7935', 'threat_description')).toEqual([
      { ref: 'RFC 7935', claims: ['threat_description'] },
    ])
  })

  it('several sources: column@ref pairs are split by source; an unknown ref is dropped', () => {
    expect(
      parseSecondarySources(
        'RFC 6605;draft-x-00',
        'crypto_at_risk@RFC 6605;pqc_replacement@draft-x-00;threat_description@RFC 9999'
      )
    ).toEqual([
      { ref: 'RFC 6605', claims: ['crypto_at_risk'] },
      { ref: 'draft-x-00', claims: ['pqc_replacement'] },
    ])
  })

  it('no ref, no sources', () => {
    expect(parseSecondarySources('', 'threat_description')).toEqual([])
    expect(parseSecondarySources(undefined, undefined)).toEqual([])
  })

  it('the bundled data carries the approved second sources', () => {
    const byId = new Map(threatsData.map((t) => [t.threatId, t]))
    expect(byId.get('CROSS-010')?.secondarySources).toEqual([
      { ref: 'RFC 7935', claims: ['threat_description'] },
    ])
    expect(byId.get('CROSS-009')?.secondarySources?.map((s) => s.ref)).toEqual([
      'RFC 6605',
      'draft-fregly-research-agenda-for-pqc-dnssec-00',
    ])
  })
})
