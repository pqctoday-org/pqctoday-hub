// SPDX-License-Identifier: GPL-3.0-only
/**
 * A tour that ends on a 404 is worse than no tour — it teaches the reader that
 * the guidance is not maintained. Every route a tour step sends someone to is
 * checked against the router's own route set here.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PERSONA_TOURS } from './personaTours'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'

/** Top-level route paths declared in App.tsx, normalised to '/x' form. */
function routesFromApp(): Set<string> {
  const src = readFileSync(join(process.cwd(), 'src/App.tsx'), 'utf8')
  const paths = new Set<string>(['/'])
  for (const m of src.matchAll(/path="([^"]+)"/g)) {
    const p = m[1].replace(/^\//, '')
    paths.add(`/${p}`)
  }
  return paths
}

describe('PERSONA_TOURS — B+ remediation 4.2', () => {
  const routes = routesFromApp()
  const toolIds = new Set(WORKSHOP_TOOLS.map((t) => t.id))
  const moduleIds = new Set(MANIFESTS.map((m) => m.id))

  it('covers exactly the roles that had no tour of their own', () => {
    // executive has EXEC_TOUR_STAGES; curious has CuriousGuide. Giving either a
    // second tour here would be two onboarding flows fighting each other. grc
    // is new as of the 2026-09-07 Executive/GRC split and had no tour at all.
    // cert-engineer is new as of 2026-09-29 and gets its own from the start.
    expect(Object.keys(PERSONA_TOURS).sort()).toEqual([
      'architect',
      'cert-engineer',
      'developer',
      'grc',
      'ops',
      'researcher',
    ])
  })

  it('stays short — a tour nobody finishes teaches nothing', () => {
    for (const [persona, tour] of Object.entries(PERSONA_TOURS)) {
      expect(tour!.steps.length, persona).toBeLessThanOrEqual(5)
      expect(tour!.steps.length, persona).toBeGreaterThanOrEqual(3)
      expect(tour!.promise.length, persona).toBeGreaterThan(20)
    }
  })

  it('every step lands on a real route', () => {
    for (const [persona, tour] of Object.entries(PERSONA_TOURS)) {
      for (const step of tour!.steps) {
        const base = step.route.split(/[?#]/)[0]
        const playgroundTool = base.startsWith('/playground/')
          ? base.slice('/playground/'.length)
          : null
        const learnModule = base.startsWith('/learn/') ? base.slice('/learn/'.length) : null
        if (learnModule) {
          // /learn/:moduleId resolves through the module manifests, the same way
          // /playground/:toolId resolves through the workshop registry.
          expect(moduleIds.has(learnModule), `${persona}: module "${learnModule}"`).toBe(true)
          continue
        }
        if (playgroundTool) {
          // /playground/:toolId resolves through the workshop registry, so the
          // tool id itself is what has to exist.
          // The full playgrounds (hsm, cacp, interactive, docker) are nested
          // <Route path="…"> children of "playground" rather than registry
          // tools; routesFromApp flattens them to "/hsm" etc., so check that too.
          expect(
            toolIds.has(playgroundTool) || routes.has(`/${playgroundTool}`),
            `${persona}: tool "${playgroundTool}"`
          ).toBe(true)
          continue
        }
        expect(routes.has(base), `${persona}: route "${base}"`).toBe(true)
      }
    }
  })

  it('never sends a role to the bare /openssl door', () => {
    // The canonical door is the Playground card (RAIL_HIDDEN_PATHS) — a tour
    // pointing at /openssl would reintroduce the two-front-doors contradiction
    // the rest of this programme closed.
    for (const tour of Object.values(PERSONA_TOURS)) {
      for (const step of tour!.steps) {
        expect(step.route.split(/[?#]/)[0]).not.toBe('/openssl')
      }
    }
  })
})
