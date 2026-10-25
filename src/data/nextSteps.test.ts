// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  NEXT_STEPS,
  PAGE_NEXT_STEP_ROUTES,
  PERSONA_HOME_FUNNEL,
  PERSONA_NEXT_STEPS,
  homeFunnelFor,
  nextStepFor,
} from './nextSteps'
import { PERSONA_IDS } from './personaIds'
import { PERSONAS } from './learningPersonas'
import { PERSONA_FEATURED_PAGES } from '@/components/Playground/cryptoLabMeta'
import { resolveHsmLocation } from '@/components/Playground/HsmPlayground'
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

  it('every persona without a Home override, and no persona, keeps the default Home next step', () => {
    // eslint-disable-next-line security/detect-object-injection -- id is the typed PersonaId union
    for (const p of PERSONA_IDS.filter((id) => !PERSONA_NEXT_STEPS[id]?.['/'])) {
      expect(nextStepFor('/', p), p).toBe(NEXT_STEPS['/'])
    }
    expect(nextStepFor('/', null)).toBe(NEXT_STEPS['/'])
  })

  it('the researcher override replaces only the Home exit, never another route', () => {
    expect(nextStepFor('/library', 'researcher')).toBe(NEXT_STEPS['/library'])
  })

  it('override targets are known routes and read like the other exits', () => {
    for (const [p, steps] of Object.entries(PERSONA_NEXT_STEPS)) {
      for (const [route, step] of Object.entries(steps)) {
        expect(known.has(route), `${p}: ${route}`).toBe(true)
        expect(known.has(step.to.split('?')[0]), `${p}: ${step.to}`).toBe(true)
        expect(step.why, `${p}: ${route}`).toMatch(/[.!?]$/)
      }
    }
    for (const [p, f] of Object.entries(PERSONA_HOME_FUNNEL)) {
      expect(known.has(f.startCta.to.split('?')[0]), `${p}: ${f.startCta.to}`).toBe(true)
    }
  })

  it('a persona with its own Home start CTA also has its own Home next step', () => {
    for (const p of Object.keys(PERSONA_HOME_FUNNEL) as (keyof typeof PERSONA_NEXT_STEPS)[]) {
      // eslint-disable-next-line security/detect-object-injection -- p is a key of the typed map
      expect(PERSONA_NEXT_STEPS[p]?.['/'], p).toBeDefined()
    }
  })
})

describe('curious next steps (curious journey review, 16 Oct 2026)', () => {
  it('sends a curious reader from Home to Explore and from Explore to the TLS handshake', () => {
    expect(nextStepFor('/', 'curious')?.to).toBe('/explore')
    expect(nextStepFor('/explore', 'curious')?.to).toBe('/playground/tls-simulator')
  })

  it('leaves every other role on the shared exit', () => {
    expect(nextStepFor('/', 'executive')).toEqual(nextStepFor('/'))
    expect(nextStepFor('/explore', null)).toEqual(nextStepFor('/explore'))
  })
})

describe('certification engineer next steps follow the role path', () => {
  const overrides = PERSONA_NEXT_STEPS['cert-engineer'] ?? {}
  const pathLessons = PERSONAS['cert-engineer'].recommendedPath.filter((id) => id !== 'quiz')
  const lessonRoute = (id: string) => `/learn/${id}`

  /**
   * Intentional destinations that are not "the next lesson in the path order". Each entry pins
   * the exact target, so changing one without updating this list turns the test red.
   */
  const NON_PATH_DESTINATIONS: Record<string, string> = {
    // Home footer: the board's own secondary button.
    '/': '/playground/hsm?tab=build&dtab=acvp',
    // The path opens with optional orientation; the first essential lesson is the real start.
    '/learn': '/learn/crypto-product-certification',
    // Tools that practise Entropy & Randomness hand on to the lesson after it.
    '/playground/entropy-test': '/learn/hsm-pqc',
    '/playground/drbg-demo': '/learn/hsm-pqc',
    // Tools the later lessons lead to hand on to the lesson after the one they practise.
    '/playground/slh-dsa': '/learn/hybrid-crypto',
    '/playground/hybrid-certs': '/learn/secure-boot-pqc',
    '/playground/firmware-signing': '/learn/pci-certification',
  }

  it('every override names an existing route, and a Build tab that exists', () => {
    for (const [route, step] of Object.entries(overrides)) {
      expect(known.has(route), `source ${route}`).toBe(true)
      const [path, query = ''] = step.to.split('?')
      expect(known.has(path), `target ${step.to}`).toBe(true)
      if (path === '/playground/hsm') {
        const q = new URLSearchParams(query)
        const loc = resolveHsmLocation({ tab: q.get('tab'), dtab: q.get('dtab') })
        expect(loc.tab, step.to).toBe(q.get('tab'))
        expect(loc.dtab, step.to).toBe(q.get('dtab'))
      }
    }
  })

  it('every override is the next lesson in the role path order, or a pinned non-path destination', () => {
    for (const [route, step] of Object.entries(overrides)) {
      const lesson = pathLessons.findIndex((id) => lessonRoute(id) === route)
      if (lesson === -1) {
        expect(NON_PATH_DESTINATIONS[route], `${route} is not a path lesson`).toBe(step.to)
      } else {
        const next = pathLessons[lesson + 1]
        expect(next, `${route} is the last path lesson`).toBeDefined()
        expect(step.to, route).toBe(lessonRoute(next))
      }
    }
    for (const route of Object.keys(NON_PATH_DESTINATIONS)) {
      expect(overrides[route], `${route} is on the allowlist but has no override`).toBeDefined()
    }
  })

  /**
   * The lesson after `id` on the role path, or undefined for the last lesson. The quiz that closes
   * the path is not a lesson, so the last lesson has no successor to point at.
   */
  const successorOf = (id: string): string | undefined => pathLessons[pathLessons.indexOf(id) + 1]

  it('every lesson on the path leads to the next lesson on the path, straight away or through its own tool', () => {
    for (const id of pathLessons) {
      const next = successorOf(id)
      if (next === undefined) continue
      const card = nextStepFor(lessonRoute(id), 'cert-engineer')
      expect(card, `${id} has no next-step card`).toBeDefined()
      if (card?.to === lessonRoute(next)) continue
      // Otherwise the card is the lesson's own practice tool, and that tool's card must go on to the
      // next lesson on the path, so the role is never sent off its path.
      expect(card?.to.startsWith('/playground/'), `${id} -> ${card?.to}`).toBe(true)
      const tool = nextStepFor((card?.to ?? '').split('?')[0], 'cert-engineer')
      expect(tool?.to, `${id} -> ${card?.to} -> ${tool?.to}`).toBe(lessonRoute(next))
    }
  })

  it('the lesson that closes the path is the only one without a successor, and the quiz follows it', () => {
    const withoutNext = pathLessons.filter((id) => successorOf(id) === undefined)
    expect(withoutNext).toEqual(['pci-certification'])
    const full = PERSONAS['cert-engineer'].recommendedPath
    expect(full[full.indexOf('pci-certification') + 1]).toBe('quiz')
  })

  it('every override that hands on to a path lesson reads "Next on your path: ..."', () => {
    for (const [route, step] of Object.entries(overrides)) {
      // Home and the Learn index have their own wording (pinned above).
      if (route === '/' || route === '/learn') continue
      if (!pathLessons.includes(step.to.replace('/learn/', ''))) continue
      expect(step.label, route).toMatch(/^Next on your path: /)
    }
  })

  it('names the missing exits: HSM, Common Criteria and the SLH-DSA tool', () => {
    expect(nextStepFor('/learn/hsm-pqc', 'cert-engineer')?.to).toBe('/learn/pqc-testing-validation')
    expect(nextStepFor('/learn/cc-eucc-certification', 'cert-engineer')?.to).toBe(
      '/learn/stateful-signatures'
    )
    expect(nextStepFor('/playground/slh-dsa', 'cert-engineer')?.to).toBe('/learn/hybrid-crypto')
    // Other roles keep the shared exits.
    expect(nextStepFor('/learn/hsm-pqc', 'executive')).toEqual(nextStepFor('/learn/hsm-pqc'))
    expect(nextStepFor('/playground/slh-dsa', null)?.to).toBe('/learn/soc-implementation-pqc')
  })

  it('the path order used here is the persona path (guards the test itself)', () => {
    expect(pathLessons.indexOf('pqc-testing-validation')).toBeGreaterThan(
      pathLessons.indexOf('hsm-pqc')
    )
    expect(pathLessons[pathLessons.indexOf('pqc-testing-validation') + 1]).toBe(
      'cc-eucc-certification'
    )
  })

  it('the Home footer opens the validation workbench with the workbench card text', () => {
    const card = PERSONA_FEATURED_PAGES['cert-engineer']?.find(
      (c) => c.to === '/playground/hsm?tab=build&dtab=acvp'
    )
    expect(card).toBeDefined()
    const step = nextStepFor('/', 'cert-engineer')
    expect(step?.to).toBe(card?.to)
    expect(step?.label).toBe('Open the validation workbench')
    expect(step?.why).toBe(card?.description)
    expect(nextStepFor('/', 'executive')).toBe(NEXT_STEPS['/'])
  })

  it('Testing & Validation leads to Common Criteria, EUCC & eIDAS, not back to FIPS 140-3', () => {
    const step = nextStepFor('/learn/pqc-testing-validation', 'cert-engineer')
    expect(step?.to).toBe('/learn/cc-eucc-certification')
    expect(step?.label).toBe('Next on your path: Common Criteria, EUCC & eIDAS Certification')
    expect(nextStepFor('/learn/pqc-testing-validation', 'executive')).toEqual(
      nextStepFor('/learn/pqc-testing-validation')
    )
  })
})
