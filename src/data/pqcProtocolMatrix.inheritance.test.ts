// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PROTOCOL_MATRIX, DRAFT_STAGE_LEVEL, type ProtocolMatrixRow } from './pqcProtocolMatrix'

const DIMENSIONS = ['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const
const byId = new Map<string, ProtocolMatrixRow>(PROTOCOL_MATRIX.map((p) => [p.id, p]))

describe('protocol matrix: inherited maturity', () => {
  it('an inherited dimension never shows a more mature stage than the parent it inherits from', () => {
    const violations: string[] = []
    for (const child of PROTOCOL_MATRIX) {
      const parent = child.inheritsFromProtocolId
        ? byId.get(child.inheritsFromProtocolId)
        : undefined
      if (!parent) continue
      for (const dim of DIMENSIONS) {
        const c = child.dimensions[dim]
        const p = parent.dimensions[dim]
        if (!c?.stage || !p?.stage) continue
        if (!/^Inherits/i.test(c.note ?? '')) continue
        if (DRAFT_STAGE_LEVEL[c.stage] > DRAFT_STAGE_LEVEL[p.stage]) {
          violations.push(`${child.id}.${dim}: ${c.stage} > ${parent.id} ${p.stage}`)
        }
      }
    }
    expect(violations).toEqual([])
  })

  it('DTLS 1.3 composite signatures are capped at the TLS 1.3 binding and do not count X.509 OID reuse as DTLS support', () => {
    const dtls = byId.get('dtls-1-3')!.dimensions.hybridSig
    const tls = byId.get('tls-1-3')!.dimensions.hybridSig
    expect(dtls.stage).toBe(tls.stage)
    expect(dtls.stageNote).toMatch(/no DTLS-specific composite binding/i)
    expect(dtls.stageNote).toMatch(/not DTLS support by itself/i)
    expect(dtls.note).toMatch(/not a specified DTLS profile/i)
    // The application binding is tracked next to the X.509 dependency.
    const ids = (dtls.refs ?? []).map((r) => r.id)
    expect(ids).toContain('draft-ietf-tls-composite-mldsa')
    expect(ids).toContain('draft-ietf-lamps-pq-composite-sigs')
  })

  it('MACsec composite signatures follow the same cap through the EAP-TLS bootstrap', () => {
    const macsec = byId.get('macsec')!.dimensions.hybridSig
    const tls = byId.get('tls-1-3')!.dimensions.hybridSig
    expect(macsec.stage).toBe(tls.stage)
    expect(macsec.stageNote).toMatch(/no MACsec-specific composite binding/i)
  })

  it('keeps the parent contrast: DTLS 1.3 hybrid KEM stays published because RFC 10024 is published for the TLS 1.3 row', () => {
    expect(byId.get('dtls-1-3')!.dimensions.hybridKem.stage).toBe('rfc-published')
    expect(byId.get('tls-1-3')!.dimensions.hybridKem.stage).toBe('rfc-published')
  })
})
