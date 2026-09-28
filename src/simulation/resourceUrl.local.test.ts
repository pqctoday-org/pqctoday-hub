// SPDX-License-Identifier: GPL-3.0-only
/** 09-28 nav remediation (WP5) — the `?open=` codec + resolver. */
import { describe, expect, it } from 'vitest'
import { decodeOpen, encodeOpen, resolveOpen } from './resourceUrl'
import type { TreeStep } from './types'

const PHASES = ['p0', 'p1', 'p3']
const candidates: TreeStep[] = [
  { kind: 'reference', label: 'Library', to: '/library?topic=kem', refId: 'library' },
  { kind: 'workshop', label: 'TLS', to: '/playground/tls?step=2', workshopId: 'tls' },
]
const learn = {
  isEmbeddable: (id: string) => id === 'pqc-business-case',
  label: (id: string) => `Learn: ${id}`,
}

describe('encodeOpen / decodeOpen', () => {
  it('round-trips a step through the URL (with its query string intact)', () => {
    const v = encodeOpen('p3', candidates[0]!)
    const params = new URLSearchParams({ open: v, keep: 'me' })
    const back = decodeOpen(new URLSearchParams(params.toString()).get('open'), PHASES)
    expect(back).toEqual({ phase: 'p3', kind: 'reference', to: '/library?topic=kem' })
  })

  it.each([
    ['empty', ''],
    ['wrong version', '2~p0~learn~/learn/x'],
    ['unknown phase', '1~p9~learn~/learn/x'],
    ['bad kind', '1~p0~Learn!~/learn/x'],
    ['absolute URL', '1~p0~learn~https://evil.example/x'],
    ['protocol-relative', '1~p0~learn~//evil.example/x'],
    ['javascript:', '1~p0~learn~javascript:alert(1)'],
    ['backslash', '1~p0~learn~/\\evil'],
    ['too few parts', '1~p0~learn'],
  ])('rejects %s', (_l, v) => {
    expect(decodeOpen(v, PHASES)).toBeNull()
  })
})

describe('resolveOpen', () => {
  it('matches the phase’s own steps by kind + route', () => {
    const d = decodeOpen(encodeOpen('p1', candidates[1]!), PHASES)!
    expect(resolveOpen(d, candidates, learn)).toBe(candidates[1])
  })

  it('accepts an embeddable Learn module route', () => {
    const d = decodeOpen('1~p0~learn~/learn/pqc-business-case?tab=learn', PHASES)!
    expect(resolveOpen(d, [], learn)).toMatchObject({
      kind: 'learn',
      moduleId: 'pqc-business-case',
    })
  })

  it('rejects a well-formed value that is not one of the phase’s steps', () => {
    expect(resolveOpen(decodeOpen('1~p0~reference~/admin', PHASES)!, candidates, learn)).toBeNull()
    expect(
      resolveOpen(decodeOpen('1~p0~learn~/learn/not-embeddable', PHASES)!, candidates, learn)
    ).toBeNull()
  })
})
