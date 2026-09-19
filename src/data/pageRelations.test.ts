// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PAGE_RELATIONS } from './pageRelations'
import { PAGE_NEXT_STEP_ROUTES } from './nextSteps'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

const known = new Set([
  ...PAGE_NEXT_STEP_ROUTES,
  '/learn/quiz',
  ...MANIFESTS.map((m) => `/learn/${m.id}`),
  ...WORKSHOP_TOOLS.filter((t) => !t.sandbox).map((t) => `/playground/${t.id}`),
  ...BUSINESS_TOOLS.map((t) => `/business/tools/${t.id}`),
])

describe('PAGE_RELATIONS (round 9, wave 1.1)', () => {
  it('every routed page has 2–4 related entries', () => {
    for (const r of PAGE_NEXT_STEP_ROUTES) {
      const e = PAGE_RELATIONS[r]
      expect(e, r).toBeDefined()
      expect(e.length, r).toBeGreaterThanOrEqual(2)
      expect(e.length, r).toBeLessThanOrEqual(4)
    }
  })
  it('every target resolves, is not the page itself, and appears once', () => {
    for (const [r, es] of Object.entries(PAGE_RELATIONS)) {
      expect(PAGE_NEXT_STEP_ROUTES.has(r), r).toBe(true)
      for (const e of es) {
        expect(known.has(e.to), `${r} -> ${e.to}`).toBe(true)
        expect(e.to).not.toBe(r)
        expect(e.reason.length, `${r} -> ${e.to}`).toBeGreaterThan(12)
      }
      expect(new Set(es.map((e) => e.to)).size).toBe(es.length)
    }
  })
})
