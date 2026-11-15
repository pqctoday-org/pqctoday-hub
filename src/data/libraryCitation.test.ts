// The citation rule: a retired library id is accepted only when its successor chain ends at an active row.
import { describe, expect, it } from 'vitest'
import {
  CITATION_MAX_HOPS,
  citableReferenceIds,
  citationIndexFromRows,
  resolveCitation,
  type CitationRow,
} from './libraryCitation'

const row = (referenceId: string, status = 'active', supersededBy = ''): CitationRow => ({
  referenceId,
  status,
  supersededBy,
})
const index = (...rows: CitationRow[]) => citationIndexFromRows(rows)

describe('citation rule: accepted', () => {
  it('an active row', () => {
    const v = resolveCitation('RFC-8446', index(row('RFC-8446')))
    expect(v).toEqual({ ok: true, activeId: 'RFC-8446', chain: ['RFC-8446'] })
  })

  it('retired -> active', () => {
    const v = resolveCitation('OLD', index(row('OLD', 'deprecated', 'NEW'), row('NEW')))
    expect(v.ok && v.activeId).toBe('NEW')
  })

  it('retired -> retired -> active (multi-hop)', () => {
    const v = resolveCitation(
      'A',
      index(row('A', 'deprecated', 'B'), row('B', 'deprecated', 'C'), row('C'))
    )
    expect(v).toEqual({ ok: true, activeId: 'C', chain: ['A', 'B', 'C'] })
  })

  it('obsolete -> active', () => {
    expect(resolveCitation('OLD', index(row('OLD', 'obsolete', 'NEW'), row('NEW'))).ok).toBe(true)
  })

  it('follows the first id of a ;-separated successor', () => {
    const v = resolveCitation(
      'OLD',
      index(row('OLD', 'deprecated', 'NEW; OTHER'), row('NEW'), row('OTHER'))
    )
    expect(v.ok && v.activeId).toBe('NEW')
  })

  it('a chain may end at an active Internet-Draft (lifecycle is not a row status)', () => {
    const idx = index(
      row('draft-ietf-tls-mldsa-04', 'deprecated', 'draft-ietf-tls-mldsa-06'),
      row('draft-ietf-tls-mldsa-06')
    )
    expect(resolveCitation('draft-ietf-tls-mldsa-04', idx).ok).toBe(true)
  })
})

describe('citation rule: refused', () => {
  it('retired with a blank superseded_by', () => {
    const v = resolveCitation('OLD', index(row('OLD', 'deprecated', '')))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.reason).toContain('no superseded_by')
  })

  it('a broken chain (successor is not a library id)', () => {
    const v = resolveCitation('OLD', index(row('OLD', 'deprecated', 'MISSING')))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.reason).toContain('breaks')
  })

  it('a broken second hop', () => {
    expect(
      resolveCitation('A', index(row('A', 'deprecated', 'B'), row('B', 'deprecated', 'NOPE'))).ok
    ).toBe(false)
  })

  it('a two-cycle', () => {
    const v = resolveCitation('A', index(row('A', 'deprecated', 'B'), row('B', 'deprecated', 'A')))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.reason).toContain('cycle')
  })

  it('a self-cycle', () => {
    expect(resolveCitation('A', index(row('A', 'deprecated', 'A'))).ok).toBe(false)
  })

  it('a chain ending at a retired row', () => {
    expect(
      resolveCitation('A', index(row('A', 'deprecated', 'B'), row('B', 'deprecated', ''))).ok
    ).toBe(false)
  })

  it('a chain ending at an obsolete row', () => {
    expect(
      resolveCitation('A', index(row('A', 'deprecated', 'B'), row('B', 'obsolete', ''))).ok
    ).toBe(false)
  })

  it('a chain ending at a draft-status row', () => {
    const v = resolveCitation('A', index(row('A', 'deprecated', 'B'), row('B', 'draft')))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.reason).toContain('not an active row')
  })

  it('citing a draft-status row directly', () => {
    expect(resolveCitation('B', index(row('B', 'draft'))).ok).toBe(false)
  })

  it('an unknown id', () => {
    const v = resolveCitation('NOPE', index(row('A')))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.reason).toContain('not a library reference_id')
  })

  it('a chain longer than the hop cap', () => {
    const rows = Array.from({ length: CITATION_MAX_HOPS + 2 }, (_, i) =>
      row(`H${i}`, 'deprecated', `H${i + 1}`)
    )
    rows.push(row(`H${CITATION_MAX_HOPS + 2}`))
    const v = resolveCitation('H0', index(...rows))
    expect(v.ok).toBe(false)
    expect(!v.ok && v.reason).toContain('longer than')
  })
})

describe('citable id set', () => {
  it('keeps active ids and retired ids whose chain ends active, nothing else', () => {
    const ids = citableReferenceIds(
      index(row('A'), row('OLD', 'deprecated', 'A'), row('DEAD', 'deprecated'))
    )
    expect([...ids].sort()).toEqual(['A', 'OLD'])
  })
})

// The live wiring: the newest library CSV, through the accessors the checks call.
describe('citation rule on the newest library CSV', () => {
  it('a retired id whose chain ends at an active row resolves to that row', async () => {
    const { resolveLibraryCitation } = await import('./libraryData')
    // -04 -> -05 -> RFC 10024 (both drafts retired in 4.208): a two-hop chain.
    const v = resolveLibraryCitation('draft-ietf-tls-ecdhe-mlkem-04')
    expect(v.ok).toBe(true)
    expect(v.ok && v.activeId).toBe('RFC-10024')
  })

  it('a retired id with a blank successor is refused', async () => {
    const { resolveLibraryCitation } = await import('./libraryData')
    expect(resolveLibraryCitation('Algorand-PQC-Technical-Brief').ok).toBe(false)
  })

  it('an unknown id is refused', async () => {
    const { resolveLibraryCitation } = await import('./libraryData')
    expect(resolveLibraryCitation('NO-SUCH-LIBRARY-ROW-0000').ok).toBe(false)
  })

  it('the citable set holds active rows and accepted retired rows only', async () => {
    const { citableLibraryReferenceIds, libraryData } = await import('./libraryData')
    const citable = citableLibraryReferenceIds()
    for (const item of libraryData) expect(citable.has(item.referenceId)).toBe(true)
    expect(citable.has('draft-ietf-tls-ecdhe-mlkem-04')).toBe(true)
    expect(citable.has('Algorand-PQC-Technical-Brief')).toBe(false)
  })
})
