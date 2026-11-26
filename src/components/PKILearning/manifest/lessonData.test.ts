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

  // Deliberate post-move changes (26 Nov 2026): eleven lessons gained one sourced section each, so each
  // is longer and its content version is one higher. Each entry names the value before and after.
  const NEW_SECTION_LESSONS: Record<
    string,
    { minutes: [number, number]; version: [number, number] }
  > = {
    'government-defense-pqc': { minutes: [60, 65], version: [15, 16] },
    'arch-quantum-impact': { minutes: [30, 35], version: [20, 21] },
    'crypto-dev-apis': { minutes: [106, 111], version: [19, 20] },
    'crypto-mgmt-modernization': { minutes: [55, 60], version: [34, 35] },
    'data-asset-sensitivity': { minutes: [65, 70], version: [23, 24] },
    'platform-eng-pqc': { minutes: [90, 97], version: [22, 23] },
    'migration-program': { minutes: [30, 35], version: [27, 28] },
    'soc-implementation-pqc': { minutes: [60, 65], version: [9, 10] },
    'ops-quantum-impact': { minutes: [20, 25], version: [16, 17] },
    'hsm-pqc': { minutes: [60, 65], version: [30, 31] },
    'pqc-risk-management': { minutes: [30, 35], version: [20, 21] },
  }

  const now = captureLessonFacts()
  const before = golden as unknown as Record<string, unknown>
  const expectedFacts = (key: string): unknown => {
    const expected = structuredClone(before[key]) as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
    for (const [id, { minutes, version }] of Object.entries(NEW_SECTION_LESSONS)) {
      if (key === 'catalog') {
        expect(expected[id].duration).toBe(`${minutes[0]} min`)
        expected[id].duration = `${minutes[1]} min`
      }
      if (key === 'contentVersions') {
        expect(expected[id]).toBe(version[0])
        expected[id] = version[1]
      }
    }
    return expected
  }

  it.each([
    'catalog',
    'trackOrder',
    'lmIds',
    'taxonomy',
    'playgroundTools',
    'contentVersions',
    'quizLabels',
    'relatedLessonLinks',
  ])('%s is identical to the pre-move snapshot', (key) => {
    expect(now[key]).toEqual(expectedFacts(key))
  })

  // Deliberate post-move changes, each with the owner's answer (24 Nov 2026). Every other NICE
  // field, tier, stage and lesson stays exactly as before the move, so any other drift fails.
  //
  // Tier changes. "Tier to practitioner (Recommended)", three times: aerospace, AI security and
  // healthcare PQC teach hands-on in their workshops (stage stays 4). Then the answers to
  // "2: Research Quantum Impact", "3: Cert Quantum Impact" and "4: SBOM".
  const TIER_CHANGES: Record<string, { was: string; now: string }> = {
    'aerospace-pqc': { was: 'awareness', now: 'practitioner' },
    'ai-security-pqc': { was: 'awareness', now: 'practitioner' },
    'healthcare-pqc': { was: 'awareness', now: 'practitioner' },
    'research-quantum-impact': { was: 'expert', now: 'practitioner' },
    'cert-quantum-impact': { was: 'awareness', now: 'practitioner' },
    sbom: { was: 'practitioner', now: 'awareness' },
  }

  // Stage changes. "1: four lessons to stage 4" (tier stays expert) and "2: Research Quantum Impact"
  // (to stage 2, Core concepts).
  const STAGE_CHANGES: Record<string, { was: number; now: number; nowName: string }> = {
    'confidential-computing': { was: 3, now: 4, nowName: 'Specialist' },
    'homomorphic-encryption': { was: 3, now: 4, nowName: 'Specialist' },
    qkd: { was: 3, now: 4, nowName: 'Specialist' },
    'stateful-signatures': { was: 3, now: 4, nowName: 'Specialist' },
    'research-quantum-impact': { was: 3, now: 2, nowName: 'Core concepts' },
  }

  it('nice is identical to the pre-move snapshot except the six tier changes', () => {
    const expected = structuredClone(before.nice) as { moduleId: string; tier: string }[]
    for (const [id, { was, now: changed }] of Object.entries(TIER_CHANGES)) {
      const entry = expected.find((e) => e.moduleId === id)
      expect(entry?.tier).toBe(was)
      entry!.tier = changed
    }
    expect(now.nice).toEqual(expected)
  })

  it('learn order is identical to the pre-move snapshot except the five stage changes', () => {
    const expected = structuredClone(before.learnOrder) as Record<
      string,
      { stage: number; stageName: string }
    >
    for (const [id, { was, now: changed, nowName }] of Object.entries(STAGE_CHANGES)) {
      const entry = expected[id]
      expect(entry.stage).toBe(was)
      entry.stage = changed
      entry.stageName = nowName
    }
    expect(now.learnOrder).toEqual(expected)
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
    for (const [id, { minutes }] of Object.entries(NEW_SECTION_LESSONS)) {
      const meta = expected[`/learn/${id}`] as { structuredData?: { timeRequired?: string } }
      expect(meta.structuredData?.timeRequired).toBe(`PT${minutes[0]}M`)
      meta.structuredData!.timeRequired = `PT${minutes[1]}M`
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
