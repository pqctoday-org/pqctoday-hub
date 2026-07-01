// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */ // keys are trusted (PERSONAS ids / path module ids)
import { describe, it, expect } from 'vitest'
import { PERSONAS, inferPersonaFromAssessment, type PathItem } from './learningPersonas'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'

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

  it('routes an early-stage, low-infra profile to executive', () => {
    expect(
      inferPersonaFromAssessment(
        complete({
          teamSize: '51-200',
          migrationStatus: 'not-started',
          cryptoAgility: 'not-abstracted',
          infrastructure: ['cloud'],
        })
      )
    ).toBe('executive')
  })
})
