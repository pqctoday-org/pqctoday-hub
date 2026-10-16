// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  NEXT_STEPS,
  PAGE_NEXT_STEP_ROUTES,
  PERSONA_HOME_FUNNEL,
  homeFunnelFor,
  nextStepFor,
} from './nextSteps'
import { PERSONA_IDS } from './personaIds'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'

/** Routed pages the B+ tracker scores; every one must declare an exit. */
const PAGE_ROUTES = [
  '/',
  '/assess',
  '/report',
  '/learn',
  '/playground',
  '/playground/cacp',
  '/playground/hsm',
  '/playground/interactive',
  '/openssl',
  '/algorithms',
  '/compliance',
  '/migrate',
  '/business',
  '/timeline',
  '/library',
  '/threats',
  '/simulation',
  '/patents',
  '/leaders',
  '/explore',
  '/revisions',
  '/changelog',
  '/faq',
  '/about',
  '/editorial-independence',
  '/sponsor',
  '/terms',
  '/embed',
  '/navigate',
]

const moduleRoutes = MANIFESTS.filter((m) => m.id !== 'quiz').map((m) => `/learn/${m.id}`)
const toolRoutes = WORKSHOP_TOOLS.filter((t) => !t.sandbox).map((t) => `/playground/${t.id}`)
const businessRoutes = BUSINESS_TOOLS.map((t) => `/business/tools/${t.id}`)
const known = new Set([
  ...moduleRoutes,
  ...toolRoutes,
  ...businessRoutes,
  ...PAGE_ROUTES,
  '/playground/cacp-kmip',
])

describe('NEXT_STEPS (round 9, wave 1.2)', () => {
  it('declares an exit for every module, playground tool, business tool and routed page', () => {
    const missing = [...moduleRoutes, ...toolRoutes, ...businessRoutes, ...PAGE_ROUTES].filter(
      (r) => !NEXT_STEPS[r]
    )
    expect(missing).toEqual([])
  })

  it('every target is a known route, never the item itself', () => {
    const bad = Object.entries(NEXT_STEPS)
      .filter(([route, s]) => !known.has(s.to) || s.to === route)
      .map(([route, s]) => `${route} -> ${s.to}`)
    expect(bad).toEqual([])
  })

  it('label and why are sentences a visitor can act on', () => {
    for (const [route, s] of Object.entries(NEXT_STEPS)) {
      expect(s.label.length, route).toBeGreaterThanOrEqual(8)
      expect(s.why.length, route).toBeGreaterThanOrEqual(40)
      expect(s.why, route).toMatch(/[.!?]$/)
    }
  })

  it('PAGE_NEXT_STEP_ROUTES is exactly the routed pages', () => {
    expect([...PAGE_NEXT_STEP_ROUTES].sort()).toEqual([...PAGE_ROUTES].sort())
  })

  it('has no entry for a route that does not exist', () => {
    const orphans = Object.keys(NEXT_STEPS).filter((r) => !known.has(r))
    expect(orphans).toEqual([])
  })
})

describe('persona Home funnel (researcher decision R1)', () => {
  it('the researcher Home next step and start CTA lead to the Library recent changes, not the assessment', () => {
    const step = nextStepFor('/', 'researcher')
    expect(step?.to).toBe('/library?qv=new&sort=newest')
    expect(step?.to).not.toBe('/assess')
    expect(homeFunnelFor('researcher')?.startCta.label).toBe('Browse the evidence')
    expect(homeFunnelFor('researcher')?.learningPathOptional).toBe(true)
  })

  it('every other persona, and no persona, keeps the default Home next step', () => {
    for (const p of PERSONA_IDS.filter((id) => !(id in PERSONA_HOME_FUNNEL))) {
      expect(nextStepFor('/', p), p).toBe(NEXT_STEPS['/'])
    }
    expect(nextStepFor('/', null)).toBe(NEXT_STEPS['/'])
  })

  it('an override only ever replaces the Home exit, never another route', () => {
    expect(nextStepFor('/library', 'researcher')).toBe(NEXT_STEPS['/library'])
  })

  it('override targets are known routes and read like the other exits', () => {
    for (const [p, f] of Object.entries(PERSONA_HOME_FUNNEL)) {
      for (const to of [f.nextStep.to, f.startCta.to]) {
        expect(known.has(to.split('?')[0]), `${p}: ${to}`).toBe(true)
      }
      expect(f.nextStep.why, p).toMatch(/[.!?]$/)
    }
  })
})
