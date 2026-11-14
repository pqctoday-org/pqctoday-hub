// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PROTOCOL_MATRIX, type DimensionRef, type ProtocolMatrixRow } from './pqcProtocolMatrix'

const DIMENSIONS = ['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const
const byId = new Map<string, ProtocolMatrixRow>(PROTOCOL_MATRIX.map((p) => [p.id, p]))

function refsOf(row: ProtocolMatrixRow, dim: (typeof DIMENSIONS)[number]): DimensionRef[] {
  return row.dimensions[dim].refs ?? []
}

describe('protocol matrix: rows that share a specification agree on it', () => {
  it('an inheriting row cites each shared reference with the same date and link as its parent', () => {
    const drift: string[] = []
    for (const child of PROTOCOL_MATRIX) {
      const parent = child.inheritsFromProtocolId ? byId.get(child.inheritsFromProtocolId) : null
      if (!parent) continue
      for (const dim of DIMENSIONS) {
        const parentRefs = new Map(refsOf(parent, dim).map((r) => [r.id, r]))
        for (const ref of refsOf(child, dim)) {
          const up = parentRefs.get(ref.id)
          if (!up) continue
          if (up.publishedOn !== ref.publishedOn || up.url !== ref.url) {
            drift.push(
              `${child.id}.${dim} ${ref.id}: ${ref.publishedOn} vs ${parent.id} ${up.publishedOn}`
            )
          }
        }
      }
    }
    expect(drift).toEqual([])
  })

  it.each(['draft-ietf-lamps-pq-composite-kem', 'draft-ietf-jose-pq-composite-sigs'])(
    '%s carries one date in every row that cites it',
    (draft) => {
      const dates = new Map<string, string[]>()
      for (const row of PROTOCOL_MATRIX) {
        for (const dim of DIMENSIONS) {
          for (const ref of refsOf(row, dim)) {
            if (ref.id !== draft || !ref.publishedOn) continue
            dates.set(ref.publishedOn, [...(dates.get(ref.publishedOn) ?? []), `${row.id}.${dim}`])
          }
        }
      }
      expect([...dates.keys()]).toHaveLength(1)
    }
  )

  it('latestDraft of est-cmp names the revision its cells cite for the composite KEM draft', () => {
    const est = byId.get('est-cmp')!
    const x509 = byId.get('x509')!
    const rev = (row: ProtocolMatrixRow) =>
      row.latestDraft.find((d) => d.id.startsWith('draft-ietf-lamps-pq-composite-kem-'))
    expect(rev(est)?.id).toBe(rev(x509)?.id)
    expect(rev(est)?.date).toBe(rev(x509)?.date)
  })

  it('every name in inheritedBy is a row name, except QUIC which has no row of its own', () => {
    const names = new Set(PROTOCOL_MATRIX.map((p) => p.name))
    const unknown = PROTOCOL_MATRIX.flatMap((p) =>
      (p.inheritedBy ?? []).filter((n) => !names.has(n) && n !== 'QUIC').map((n) => `${p.id}: ${n}`)
    )
    expect(unknown).toEqual([])
  })

  it('every inheritedBy name resolves back to a row that inherits from that parent', () => {
    const wrong: string[] = []
    for (const p of PROTOCOL_MATRIX) {
      for (const n of p.inheritedBy ?? []) {
        const child = PROTOCOL_MATRIX.find((r) => r.name === n)
        if (child && child.inheritsFromProtocolId !== p.id) wrong.push(`${p.id} -> ${n}`)
      }
    }
    expect(wrong).toEqual([])
  })
})

describe('protocol matrix: document placement and cell completeness', () => {
  it('a published RFC is not listed under latestDraft and a draft is not listed under latestRelease', () => {
    const misplaced: string[] = []
    for (const row of PROTOCOL_MATRIX) {
      for (const d of row.latestDraft)
        if (/^RFC[-\s]?\d/i.test(d.id)) misplaced.push(`${row.id}: ${d.id}`)
      for (const d of row.latestRelease)
        if (/^draft-/i.test(d.id)) misplaced.push(`${row.id}: ${d.id}`)
    }
    expect(misplaced).toEqual([])
  })

  it('RFC 9954 and RFC 10042 sit under latestRelease of the TLS 1.3 and SSH rows', () => {
    expect(byId.get('tls-1-3')!.latestRelease.map((d) => d.id)).toContain('RFC-9954')
    expect(byId.get('ssh')!.latestRelease.map((d) => d.id)).toContain('RFC-10042')
    expect(byId.get('ssh')!.latestDraft.map((d) => d.id)).not.toContain(
      'draft-ietf-sshm-mlkem-hybrid-kex-10'
    )
  })

  it('every applicable cell carries a stage', () => {
    const missing = PROTOCOL_MATRIX.flatMap((row) =>
      DIMENSIONS.filter(
        (dim) => row.dimensions[dim].value !== 'na' && !row.dimensions[dim].stage
      ).map((dim) => `${row.id}.${dim}`)
    )
    expect(missing).toEqual([])
  })

  it('a deprecated migration-source row states "none" as the stage of each of its cells', () => {
    for (const id of ['dtls-1-2', 'fido', 'tls-1-2']) {
      for (const dim of DIMENSIONS) {
        expect(byId.get(id)!.dimensions[dim].stage, `${id}.${dim}`).toBe('none')
      }
    }
  })

  it('an experimental cell cites the document behind it', () => {
    const bare = PROTOCOL_MATRIX.flatMap((row) =>
      DIMENSIONS.filter(
        (dim) => row.dimensions[dim].value === 'experimental' && refsOf(row, dim).length === 0
      ).map((dim) => `${row.id}.${dim}`)
    )
    expect(bare).toEqual([])
  })

  it('an inheriting row with no live deployment of its own says why', () => {
    for (const id of ['dtls-1-3', 'fido-2', 'macsec']) {
      const row = byId.get(id)!
      expect(row.liveDeployments ?? [], id).toEqual([])
      expect(row.noDeploymentReason, id).toBeTruthy()
    }
  })

  it('has no localFile path on any specification entry', () => {
    for (const row of PROTOCOL_MATRIX) {
      for (const doc of [...row.latestRelease, ...row.latestDraft]) {
        expect(Object.keys(doc), `${row.id} ${doc.id}`).not.toContain('localFile')
      }
    }
  })
})

describe('protocol matrix: playground testability', () => {
  // "N/A" means the dimension does not apply to the protocol; a tool that cannot
  // exercise an applicable dimension reads "No". These secondary tools still say
  // N/A for dimensions their protocol does define. What they can actually test
  // needs a tool-by-tool review, so each is listed here and nothing new may join.
  const REVIEW_PENDING = new Set([
    'tls-1-3/openssl-studio',
    'x509/openssl-studio',
    'tpm/firmware-signing',
  ])

  it('a tool says N/A only for a dimension its protocol also marks N/A', () => {
    const wrong: string[] = []
    for (const row of PROTOCOL_MATRIX) {
      for (const tool of row.playgrounds) {
        if (REVIEW_PENDING.has(`${row.id}/${tool.toolId}`)) continue
        for (const dim of DIMENSIONS) {
          if (tool.testability[dim] === 'na' && row.dimensions[dim].value !== 'na') {
            wrong.push(`${row.id}/${tool.toolId}.${dim}`)
          }
        }
      }
    }
    expect(wrong).toEqual([])
  })

  it('the review list names only tools that still say N/A for an applicable dimension', () => {
    for (const key of REVIEW_PENDING) {
      const [rowId, toolId] = key.split('/')
      const row = byId.get(rowId)!
      const tool = row.playgrounds.find((t) => t.toolId === toolId)
      expect(tool, key).toBeDefined()
      const stillNa = DIMENSIONS.some(
        (dim) => tool!.testability[dim] === 'na' && row.dimensions[dim].value !== 'na'
      )
      expect(stillNa, `${key} no longer needs review`).toBe(true)
    }
  })

  it('the PQC TPM Workshop reports no composite-signature support', () => {
    const tool = byId.get('tpm')!.playgrounds.find((t) => t.toolId === 'tpm-playground')!
    expect(tool.testability.hybridSig).toBe('none')
  })
})
