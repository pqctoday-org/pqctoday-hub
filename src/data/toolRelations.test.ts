// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { playgroundToolRelations, businessToolRelations } from './toolRelations'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'

const known = new Set([
  ...MANIFESTS.map((m) => `/learn/${m.id}`),
  ...WORKSHOP_TOOLS.map((t) => `/playground/${t.id}`),
  ...BUSINESS_TOOLS.map((t) => `/business/tools/${t.id}`),
])

describe('toolRelations (round 9, wave 1.1)', () => {
  it('every live playground tool has 2–5 related entries, all resolvable, never itself', () => {
    for (const t of WORKSHOP_TOOLS.filter((t) => !t.sandbox)) {
      const r = playgroundToolRelations(t.id)
      expect(r.length, t.id).toBeGreaterThanOrEqual(2)
      expect(r.length, t.id).toBeLessThanOrEqual(5)
      for (const e of r) {
        expect(known.has(e.to), `${t.id} -> ${e.to}`).toBe(true)
        expect(e.to).not.toBe(`/playground/${t.id}`)
        expect(e.reason.length).toBeGreaterThan(5)
      }
      expect(new Set(r.map((e) => e.to)).size).toBe(r.length)
    }
  })
  it('every business tool has 2–5 related entries, all resolvable, never itself', () => {
    for (const t of BUSINESS_TOOLS) {
      const r = businessToolRelations(t.id)
      expect(r.length, t.id).toBeGreaterThanOrEqual(2)
      expect(r.length, t.id).toBeLessThanOrEqual(5)
      for (const e of r) {
        expect(known.has(e.to), `${t.id} -> ${e.to}`).toBe(true)
        expect(e.to).not.toBe(`/business/tools/${t.id}`)
      }
      expect(new Set(r.map((e) => e.to)).size).toBe(r.length)
    }
  })
  it('a playground tool with a Learn module lists it first', () => {
    const t = WORKSHOP_TOOLS.find((t) => t.id === 'tee-channel')!
    expect(playgroundToolRelations(t.id)[0]).toMatchObject({ to: '/learn/confidential-computing' })
  })
  it('unknown ids return nothing', () => {
    expect(playgroundToolRelations('nope')).toEqual([])
    expect(businessToolRelations('nope')).toEqual([])
  })
})
