// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'

const row = (id: string) => {
  const r = PROTOCOL_MATRIX.find((x) => x.id === id)
  if (!r) throw new Error(`missing row ${id}`)
  return r
}
const draftIds = (id: string) => (row(id).latestDraft ?? []).map((d) => d.id)

describe('protocol matrix: HPKE-family drafts (November 2026)', () => {
  it('JOSE row tracks the post-quantum registrations at -02 and a non-blocked HPKE-with-JWE draft', () => {
    expect(draftIds('jose')).toContain('draft-ietf-jose-hpke-pq-pqt-02')
    expect(draftIds('jose')).not.toContain('draft-ietf-jose-hpke-pq-pqt-01')
    const blob = JSON.stringify(row('jose'))
    expect(blob).not.toMatch(/blocked on a normative reference/)
    expect(blob).toContain('editing in progress')
  })

  it('COSE lists HPKE draft -27 as waiting for an Area Director go-ahead', () => {
    const cose = PROTOCOL_MATRIX.flatMap((r) => r.latestDraft ?? []).find(
      (d) => d.id === 'draft-ietf-cose-hpke-27'
    )
    expect(cose?.title).toContain('Waiting for AD Go-Ahead')
    expect(cose?.date).toBe('2026-09-12')
  })

  it('MLS row names -07 and -11, and dates the publication request to 2026-10-19', () => {
    expect(draftIds('mls')).toEqual(
      expect.arrayContaining(['draft-ietf-mls-pq-ciphersuites-07', 'draft-ietf-mls-extensions-11'])
    )
    const mls = row('mls')
    for (const dim of ['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const) {
      expect(mls.dimensions[dim].stageNote, dim).toContain('2026-10-19')
      expect(mls.dimensions[dim].stageNote, dim).not.toMatch(/\(draft-07, 2026-11-01\)/)
    }
    expect(mls.noDeploymentReason).toContain('requested from the IESG on 2026-10-19')
  })

  it('TLS 1.3 pure-signature cell is a pilot (Chrome private PKI), not a public deployment', () => {
    const cell = row('tls-1-3').dimensions.pureSig
    expect(cell.deploymentPosture).toBe('pilot')
    expect(cell.deploymentNote).toContain('Chrome Root Store is unchanged')
  })
})
