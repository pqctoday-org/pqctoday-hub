// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The lessons data file (`src/data/learn_modules_*.csv`, read through
 * `learnModules.generated.ts`) is the one place every organising field of a
 * Learn lesson lives. These tests keep it that way:
 *  - one row per manifest and one manifest per row;
 *  - no manifest carries a field that now lives in the data file;
 *  - the generated file is current against the newest CSV;
 *  - every page-visible fact is identical to what the app showed before the move.
 */
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { LEARN_MODULES, LEARN_MODULE_BY_ID } from '@/data/generated/learnModules.generated'
import { MANIFESTS } from './registry'
import { TRACK_COLORS } from '../moduleData'
import golden from './__golden__/lessonFacts.beforeMove.golden.json'
import { captureLessonFacts } from './__fixtures__/lessonSnapshot'

const manifestSources = import.meta.glob<string>('../modules/*/manifest.ts', {
  eager: true,
  query: '?raw',
  import: 'default',
})

/** Fields that moved from the manifests into the data file. */
const MOVED_MANIFEST_FIELDS = [
  'lm_id',
  'title',
  'description',
  'duration',
  'difficulty',
  'workInProgress',
  'frameworkPhase',
  'track',
  'trackOrder',
  'playgroundTool',
  'taxonomy',
  'contentVersion',
] as const

describe('lessons data file: one row per manifest', () => {
  const manifestIds = Object.values(manifestSources).map((src) => {
    const m = /^ {2}id: '([^']+)'/m.exec(src)
    if (!m) throw new Error('manifest without an id')
    return m[1]
  })

  it('has exactly one row for every manifest and one manifest for every row', () => {
    const rowIds = LEARN_MODULES.map((row) => row.id)
    expect(new Set(rowIds).size).toBe(rowIds.length)
    expect(new Set(manifestIds).size).toBe(manifestIds.length)
    expect([...rowIds].sort()).toEqual([...manifestIds].sort())
    expect(MANIFESTS.map((m) => m.id).sort()).toEqual([...rowIds].sort())
  })

  it('leaves no moved field in any manifest file', () => {
    const offenders: string[] = []
    for (const [path, src] of Object.entries(manifestSources)) {
      for (const field of MOVED_MANIFEST_FIELDS) {
        if (new RegExp(`^ {2}${field}:`, 'm').test(src)) offenders.push(`${path}: ${field}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('resolves every manifest from its own row', () => {
    for (const manifest of MANIFESTS) {
      const row = LEARN_MODULE_BY_ID[manifest.id]
      expect(manifest.title).toBe(row.title)
      expect(manifest.description).toBe(row.description)
      expect(manifest.duration).toBe(`${row.durationMin} min`)
      expect(manifest.difficulty).toBe(row.difficulty)
      expect(manifest.track).toBe(row.track)
    }
  })
})

describe('lessons data file: generated records', () => {
  it('are current against the newest dated CSV', () => {
    const script = join(process.cwd(), 'scripts', 'ci', 'gen-learn-modules.mjs')
    expect(() =>
      execFileSync(process.execPath, [script, '--check'], { stdio: 'pipe' })
    ).not.toThrow()
  })

  it('give every track a badge colour, and every colour a track', () => {
    const tracks = new Set(LEARN_MODULES.map((row) => row.track).filter((t) => t !== undefined))
    expect([...Object.keys(TRACK_COLORS)].sort()).toEqual([...tracks].sort())
  })
})

describe('the move changed nothing a page shows', () => {
  // The route's structured data used to carry a hand-typed level that disagreed
  // with the level the lesson page itself shows. The page's value (the data file's)
  // is kept, so these nine routes are the deliberate corrections.
  const LEVEL_CORRECTIONS: Record<string, { was: string; now: string }> = {
    'pqc-governance': { was: 'Advanced', now: 'Beginner' },
    'compliance-strategy': { was: 'Advanced', now: 'Beginner' },
    'pqc-business-case': { was: 'Intermediate', now: 'Beginner' },
    'code-signing': { was: 'Advanced', now: 'Intermediate' },
    'migration-program': { was: 'Advanced', now: 'Intermediate' },
    'api-security-jwt': { was: 'Advanced', now: 'Intermediate' },
    'quantum-threats': { was: 'Intermediate', now: 'Beginner' },
    'vendor-risk': { was: 'Advanced', now: 'Intermediate' },
    'pqc-risk-management': { was: 'Intermediate', now: 'Beginner' },
  }

  const now = captureLessonFacts()
  const before = golden as unknown as Record<string, unknown>

  it.each([
    'catalog',
    'trackOrder',
    'lmIds',
    'taxonomy',
    'playgroundTools',
    'contentVersions',
    'learnOrder',
    'quizLabels',
    'relatedLessonLinks',
  ])('%s is identical to the pre-move snapshot', (key) => {
    expect(now[key]).toEqual(before[key])
  })

  // Owner decision (24 Nov 2026, "Tier to practitioner (Recommended)", three times): these three
  // industry lessons teach hands-on in their workshops, so their NICE tier moves from awareness
  // to practitioner. Their stage stays 4. Every other NICE field and lesson stays as before the move.
  const TIER_CHANGES: Record<string, { was: string; now: string }> = {
    'aerospace-pqc': { was: 'awareness', now: 'practitioner' },
    'ai-security-pqc': { was: 'awareness', now: 'practitioner' },
    'healthcare-pqc': { was: 'awareness', now: 'practitioner' },
  }

  it('nice is identical to the pre-move snapshot except the three tier changes', () => {
    const expected = structuredClone(before.nice) as { moduleId: string; tier: string }[]
    for (const [id, { was, now: changed }] of Object.entries(TIER_CHANGES)) {
      const entry = expected.find((e) => e.moduleId === id)
      expect(entry?.tier).toBe(was)
      entry!.tier = changed
    }
    expect(now.nice).toEqual(expected)
  })

  it('route meta is identical to the pre-move snapshot except the nine level corrections', () => {
    const expected = structuredClone(before.routeMeta) as Record<
      string,
      { structuredData?: { educationalLevel: string } }
    >
    for (const [id, { was, now: corrected }] of Object.entries(LEVEL_CORRECTIONS)) {
      const meta = expected[`/learn/${id}`]
      expect(meta.structuredData?.educationalLevel).toBe(was)
      meta.structuredData!.educationalLevel = corrected
    }
    expect(now.routeMeta).toEqual(expected)
  })

  it('route level and minutes come from the data file', () => {
    const routes = now.routeMeta as Record<
      string,
      { structuredData?: { educationalLevel: string; timeRequired: string } }
    >
    for (const row of LEARN_MODULES) {
      const sd = routes[`/learn/${row.id}`].structuredData
      if (!row.difficulty) {
        expect(sd).toBeUndefined()
        continue
      }
      expect(sd?.timeRequired).toBe(`PT${row.durationMin}M`)
      expect(sd?.educationalLevel.toLowerCase()).toBe(row.difficulty)
    }
  })
})
