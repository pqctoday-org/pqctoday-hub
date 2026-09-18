// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */ // keys are trusted (PERSONAS ids / path module ids)
import { describe, it, expect } from 'vitest'
import {
  PERSONAS,
  inferPersonaFromAssessment,
  essentialsQuizCategories,
  type PathItem,
} from './learningPersonas'
import { MANIFEST_BY_ID, MANIFESTS } from '@/components/PKILearning/manifest/registry'

const moduleIdsFromPathItems = (items: PathItem[]): string[] =>
  items
    .filter((p): p is Extract<PathItem, { type: 'module' }> => p.type === 'module')
    .map((p) => p.moduleId)

/** Parse a manifest `duration` string ("40 min") to minutes; 0 if unknown. */
const durationMinutes = (moduleId: string): number => {
  const raw = MANIFEST_BY_ID[moduleId]?.duration ?? ''
  const m = /(\d+)\s*min/.exec(raw)
  return m ? Number(m[1]) : 0
}

describe('learningPersonas — path consistency', () => {
  // The rendered learning path is driven by `pathItems`; `recommendedPath` is the flat
  // advertised list read by the "Continue to next module" CTA (NextModuleCTA), the
  // Dashboard module filter, and the Report/Library derivations. If the two disagree,
  // the CTA silently routes learners AROUND a module that the journey UI still shows
  // (the `cbom` / `verification-closure` skip bug). Enforce exact agreement — same
  // modules, same order — for EVERY persona so the two structures can never drift again.
  const personaIds = Object.keys(PERSONAS) as (keyof typeof PERSONAS)[]

  it.each(personaIds)(
    '%s: recommendedPath exactly equals the modules rendered in pathItems (order-sensitive)',
    (id) => {
      const persona = PERSONAS[id]
      expect(persona.recommendedPath).toEqual(moduleIdsFromPathItems(persona.pathItems))
    }
  )

  // `estimatedMinutes` is shown to learners as the time to complete the path (e.g.
  // RecommendedPathBanner). It must equal the real sum of the path's module durations
  // from the manifest registry — the declared totals had drifted ~8-10% low. Keeping the
  // field static (many synchronous consumers) but guarding it here forces an update
  // whenever a module duration or a path changes.
  it.each(personaIds)('%s: estimatedMinutes equals the sum of its module durations', (id) => {
    const persona = PERSONAS[id]
    const summed = persona.recommendedPath.reduce((total, mId) => total + durationMinutes(mId), 0)
    expect(persona.estimatedMinutes).toBe(summed)
  })
})

describe('learningPersonas — essentials (A1)', () => {
  const personaIds = Object.keys(PERSONAS) as (keyof typeof PERSONAS)[]

  it.each(personaIds)(
    '%s: essentials is a non-empty, duplicate-free subset of recommendedPath, excluding quiz',
    (id) => {
      const persona = PERSONAS[id]
      expect(persona.essentials.length).toBeGreaterThan(0)
      expect(persona.essentials.length).toBeLessThanOrEqual(10) // sanity: "essentials" stays short
      expect(persona.essentials).not.toContain('quiz') // the quiz IS the capstone, not an essential
      expect(new Set(persona.essentials).size).toBe(persona.essentials.length) // no dupes
      const recommended = new Set(persona.recommendedPath)
      expect(persona.essentials.filter((m) => !recommended.has(m))).toEqual([])
    }
  )

  it.each(personaIds)('%s: essentialsMinutes equals the sum of its essentials durations', (id) => {
    const persona = PERSONAS[id]
    const summed = persona.essentials.reduce((t, m) => t + durationMinutes(m), 0)
    expect(persona.essentialsMinutes).toBe(summed)
  })

  it.each(personaIds)('%s: the essentials track is shorter than the full track', (id) => {
    const persona = PERSONAS[id]
    expect(persona.essentialsMinutes).toBeLessThan(persona.estimatedMinutes)
  })

  // The capstone quiz is scoped to these categories so an Essentials-only learner is
  // never tested on unstudied modules. Must be non-empty and — unless the persona
  // opts into all categories (empty quizCategories, e.g. researcher) — a subset of them.
  it.each(personaIds)('%s: essentialsQuizCategories is a valid, non-empty scope', (id) => {
    const persona = PERSONAS[id]
    const cats = essentialsQuizCategories(id)
    expect(cats.length).toBeGreaterThan(0)
    expect(new Set(cats).size).toBe(cats.length) // no dupes
    if (persona.quizCategories.length > 0) {
      const allowed = new Set(persona.quizCategories)
      expect(cats.filter((c) => !allowed.has(c))).toEqual([])
    }
  })
})

describe('inferPersonaFromAssessment — role targeting', () => {
  type Assessment = Parameters<typeof inferPersonaFromAssessment>[0]
  const complete = (over: Partial<Assessment> = {}): Assessment => ({
    assessmentStatus: 'complete',
    teamSize: '11-50',
    migrationStatus: 'planning',
    cryptoAgility: 'not-abstracted',
    currentCrypto: [],
    complianceRequirements: [],
    cryptoUseCases: [],
    infrastructure: [],
    ...over,
  })

  it('returns null when the assessment is not complete', () => {
    expect(inferPersonaFromAssessment(complete({ assessmentStatus: 'in-progress' }))).toBeNull()
  })

  // The regression this guards: a hands-on developer actively migrating on an
  // infra-heavy stack used to be captured by the ops branch (infraCount >= 3) before
  // the developer branch was ever reached. A small team is the IC discriminator.
  it('routes a small, hands-on, actively-migrating team to developer even with infraCount >= 3', () => {
    expect(
      inferPersonaFromAssessment(
        complete({
          teamSize: '1-10',
          migrationStatus: 'started',
          cryptoAgility: 'not-abstracted',
          infrastructure: ['cloud', 'on-prem', 'edge'],
        })
      )
    ).toBe('developer')
  })

  it('still routes a large, infra-heavy, actively-migrating org to ops (unchanged)', () => {
    expect(
      inferPersonaFromAssessment(
        complete({
          teamSize: '200-plus',
          migrationStatus: 'started',
          cryptoAgility: 'not-abstracted',
          infrastructure: ['cloud', 'on-prem', 'edge'],
        })
      )
    ).toBe('ops')
  })

  it('routes a fully-abstracted (design-first) profile to architect, even for a small team', () => {
    expect(
      inferPersonaFromAssessment(
        complete({
          teamSize: '1-10',
          migrationStatus: 'started',
          cryptoAgility: 'fully-abstracted',
          infrastructure: ['cloud', 'on-prem', 'edge'],
        })
      )
    ).toBe('architect')
  })

  it('routes broad multi-dimension coverage to researcher', () => {
    expect(
      inferPersonaFromAssessment(
        complete({
          currentCrypto: ['rsa', 'ecc', 'aes', 'sha2', 'x25519'],
          complianceRequirements: ['fips', 'cnsa', 'gdpr', 'pci'],
          cryptoUseCases: ['tls', 'vpn', 'code-signing', 'email'],
        })
      )
    ).toBe('researcher')
  })

  it('infers no persona for an early-stage, low-infra profile (2026-09-07 split: ambiguous between executive and grc, so neither is guessed)', () => {
    expect(
      inferPersonaFromAssessment(
        complete({
          teamSize: '51-200',
          migrationStatus: 'not-started',
          cryptoAgility: 'not-abstracted',
          infrastructure: ['cloud'],
        })
      )
    ).toBe(null)
  })
})

// B+ round 8, Wave B (2026-09-18) — WS17 task 7a. The 2026-08 census found a
// module (government-defense-pqc) that had shipped into no persona path at all;
// nothing failed, so nobody noticed until a discoverability regrade did. This
// makes that impossible: every real module is on at least one recommendedPath,
// or is listed here with the reason it is deliberately not.
const PATH_EXEMPT: Record<string, string> = {
  // (none today — add `'module-id': 'reason'` when a module is meant to be
  // reachable only from its track, never from a persona path)
}

describe('persona-path reach guard (WS17)', () => {
  const allPaths = new Set(Object.values(PERSONAS).flatMap((p) => p.recommendedPath))

  it('every module in the manifest registry is on at least one recommendedPath, or exempted with a reason', () => {
    const missing = MANIFESTS.filter((m) => !m.custom && m.track)
      .map((m) => m.id)
      .filter((id) => !allPaths.has(id) && !PATH_EXEMPT[id])
    expect(
      missing,
      `modules on no persona path and not in PATH_EXEMPT: ${missing.join(', ')}`
    ).toEqual([])
  })

  it('every PATH_EXEMPT entry names a real module that really is off every path', () => {
    for (const [id, reason] of Object.entries(PATH_EXEMPT)) {
      expect(MANIFEST_BY_ID[id], `PATH_EXEMPT names an unknown module: ${id}`).toBeDefined()
      expect(reason.length, `PATH_EXEMPT[${id}] needs a reason`).toBeGreaterThan(10)
      expect(allPaths.has(id), `${id} is exempted but sits on a path — drop the exemption`).toBe(
        false
      )
    }
  })

  // The two narrow-reach modules the round-8 census found (both on exactly one
  // path) were placed at a topical cluster position on 2026-09-18; keep them
  // from silently dropping back to one path.
  it.each([
    ['soc-implementation-pqc', ['ops', 'architect', 'grc']],
    ['automotive-pqc', ['architect', 'ops']],
  ])('%s stays on the paths it was placed on', (id, personas) => {
    for (const persona of personas) {
      expect(
        PERSONAS[persona as keyof typeof PERSONAS].recommendedPath,
        `${id} on ${persona}`
      ).toContain(id)
    }
  })
})
