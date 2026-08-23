// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard — no module can silently end up with an empty (or duplicated)
 * "Related modules" panel, and no module can silently lose its reverse tool
 * link.
 *
 * This is the guard for WS22 Stage 3's whole point. The panel is computed, so
 * the failure mode is not a crash: a module whose track shrank, or whose tags
 * were edited, would simply render a heading with nothing under it — which the
 * work order calls out explicitly as a failure, not a pass. Equally, a module
 * added to AUTHORED_INLINE_RELATED's list without an inline block (or one that
 * grew a block without being listed) would show two competing related panels.
 *
 * Follows the house pattern of toolSearchEntries.driftguard.test.ts and
 * workshopRequirements.driftguard.test.ts: assert against the real registry,
 * and re-derive the source-coupled facts from source rather than trusting a
 * hand-maintained list.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { MANIFESTS, MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import {
  AUTHORED_INLINE_RELATED,
  RELATED_MODULES_CAP,
  authoredRelations,
  moduleRelations,
  relatedModules,
} from './moduleRelations'
import { TOOL_BY_MODULE_ID, moduleIdFromToolLink, resolveModuleTool } from './moduleToolLinks'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'

/** Real, non-synthetic modules — the population the panel renders for. */
const realModules = MANIFESTS.filter((m) => !m.custom && m.track)

/** The minimum every module is guaranteed: the smallest track holds 4. */
const MIN_RELATED = 3

describe('module relations — the tags this engine derives from are populated', () => {
  it('every manifest carries frameworkPhase', () => {
    const missing = MANIFESTS.filter((m) => !m.frameworkPhase).map((m) => m.id)
    expect(missing, `manifests with no frameworkPhase: ${missing.join(', ')}`).toEqual([])
    expect(MANIFESTS.length).toBeGreaterThanOrEqual(65)
  })

  it('every manifest except the synthetic quiz entry carries a track', () => {
    const missing = MANIFESTS.filter((m) => !m.track && !m.custom).map((m) => m.id)
    expect(missing, `non-custom manifests with no track: ${missing.join(', ')}`).toEqual([])
  })

  it('no track is small enough to starve its members of candidates', () => {
    const sizes = new Map<string, number>()
    for (const m of realModules) sizes.set(m.track!, (sizes.get(m.track!) ?? 0) + 1)
    const starved = [...sizes.entries()].filter(([, n]) => n < MIN_RELATED + 1)
    expect(
      starved,
      `tracks too small to guarantee ${MIN_RELATED} same-track relations: ${starved
        .map(([t, n]) => `${t}=${n}`)
        .join(', ')}`
    ).toEqual([])
  })
})

describe('module relations — no module renders an empty panel', () => {
  it.each(realModules.map((m) => m.id))('%s resolves related modules', (id) => {
    const { origin, entries } = moduleRelations(id, MANIFESTS)
    if (origin === 'authored-inline') {
      // Suppressed on purpose: this module renders its own authored block.
      expect(entries).toEqual([])
      return
    }
    expect(
      entries.length,
      `${id} would render an empty "Related modules" panel (origin=${origin})`
    ).toBeGreaterThanOrEqual(MIN_RELATED)
    expect(entries.length).toBeLessThanOrEqual(RELATED_MODULES_CAP)
  })

  it('never links a module to itself and never to an unknown id', () => {
    for (const m of realModules) {
      const { entries } = moduleRelations(m.id, MANIFESTS)
      for (const e of entries) {
        expect(e.id, `${m.id} relates to itself`).not.toBe(m.id)
        expect(MANIFEST_BY_ID[e.id], `${m.id} → unknown module ${e.id}`).toBeDefined()
      }
      expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
    }
  })

  it('never proposes the synthetic quiz entry as a relation', () => {
    for (const m of realModules) {
      const ids = moduleRelations(m.id, MANIFESTS).entries.map((e) => e.id)
      expect(ids).not.toContain('quiz')
    }
  })

  it('gives every entry a stated reason', () => {
    for (const m of realModules) {
      for (const e of moduleRelations(m.id, MANIFESTS).entries) {
        expect(e.reason, `${m.id} → ${e.id} has no reason`).not.toBe('')
      }
    }
  })
})

describe('module relations — the output is topically plausible', () => {
  // WS12's own named example: same track, same framework phase.
  it('crypto-registry and cbom rank each other', () => {
    expect(relatedModules('crypto-registry', MANIFESTS).map((e) => e.id)).toContain('cbom')
    expect(relatedModules('cbom', MANIFESTS).map((e) => e.id)).toContain('crypto-registry')
  })

  it('scores a same-track + same-phase pair above a same-track-only pair', () => {
    const scored = relatedModules('crypto-registry', MANIFESTS)
    const cbom = scored.find((e) => e.id === 'cbom')!
    const sbom = scored.find((e) => e.id === 'sbom')!
    expect(cbom.score).toBeGreaterThan(sbom.score)
  })

  it('is ordered by descending score', () => {
    for (const m of realModules) {
      const scores = relatedModules(m.id, MANIFESTS).map((e) => e.score)
      expect([...scores].sort((a, b) => b - a)).toEqual(scores)
    }
  })
})

describe('module relations — the authored override replaces, never stacks', () => {
  const fixtures: ModuleManifest[] = [
    {
      id: 'a',
      title: 'A',
      description: '',
      duration: '1',
      frameworkPhase: 'p1',
      track: 'T',
      trackOrder: 1,
    },
    {
      id: 'b',
      title: 'B',
      description: '',
      duration: '1',
      frameworkPhase: 'p1',
      track: 'T',
      trackOrder: 2,
    },
    {
      id: 'c',
      title: 'C',
      description: '',
      duration: '1',
      frameworkPhase: 'p1',
      track: 'T',
      trackOrder: 3,
    },
    {
      id: 'z',
      title: 'Z',
      description: '',
      duration: '1',
      frameworkPhase: 'p7',
      track: 'OTHER',
      trackOrder: 1,
    },
  ]

  it('falls back to the computed set while no module authors a graph (all 65 today)', () => {
    const authored = MANIFESTS.filter(
      (m) => (m.prerequisiteIds?.length ?? 0) > 0 || (m.followOnIds?.length ?? 0) > 0
    )
    expect(authored.map((m) => m.id)).toEqual([])
    expect(moduleRelations('a', fixtures).origin).toBe('computed')
  })

  it('returns ONLY the authored set once a manifest declares one', () => {
    const withGraph = fixtures.map((m) =>
      m.id === 'a' ? { ...m, prerequisiteIds: ['z'], followOnIds: ['c'] } : m
    )
    const result = moduleRelations('a', withGraph)
    expect(result.origin).toBe('authored')
    // 'b' is the strongest computed candidate (same track, adjacent order) and
    // must NOT appear: authored overrides, it does not stack.
    expect(result.entries.map((e) => e.id)).toEqual(['z', 'c'])
    expect(result.entries.map((e) => e.reason)).toEqual(['Prerequisite', 'Continue with'])
  })

  it('drops authored ids that do not resolve to a real module', () => {
    const withGraph = fixtures.map((m) =>
      m.id === 'a' ? { ...m, followOnIds: ['does-not-exist', 'c'] } : m
    )
    expect(moduleRelations('a', withGraph).entries.map((e) => e.id)).toEqual(['c'])
  })

  it('authoredRelations returns null when neither array is populated', () => {
    expect(authoredRelations(fixtures[0]!, {})).toBeNull()
  })
})

describe('module relations — the inline-authored list matches the source', () => {
  const MODULES_DIR = path.join(process.cwd(), 'src', 'components', 'PKILearning', 'modules')

  /** Module directories whose component tree renders its own Related Modules block. */
  function deriveInlineDirs(): string[] {
    const hits = new Set<string>()
    const walk = (dir: string, top: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) walk(full, top)
        else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) {
          if (/Related Modules/.test(fs.readFileSync(full, 'utf-8'))) hits.add(top)
        }
      }
    }
    for (const entry of fs.readdirSync(MODULES_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(path.join(MODULES_DIR, entry.name), entry.name)
    }
    return [...hits].sort()
  }

  it('re-derives exactly the modules listed in AUTHORED_INLINE_RELATED', () => {
    const dirs = deriveInlineDirs()
    // Map each hit directory back to its manifest id.
    const ids = dirs
      .map((d) => {
        const src = fs.readFileSync(path.join(MODULES_DIR, d, 'manifest.ts'), 'utf-8')
        return /\bid:\s*'([^']+)'/.exec(src)?.[1] ?? d
      })
      .sort()
    expect(
      ids,
      `modules rendering their own "Related Modules" block: ${ids.join(', ')} — ` +
        `AUTHORED_INLINE_RELATED says ${[...AUTHORED_INLINE_RELATED].join(', ')}. ` +
        'A mismatch means a module either shows two competing panels or none.'
    ).toEqual([...AUTHORED_INLINE_RELATED].sort())
  })

  it('suppresses the computed panel for every inline-authored module', () => {
    for (const id of AUTHORED_INLINE_RELATED) {
      const result = moduleRelations(id, MANIFESTS)
      expect(result.origin).toBe('authored-inline')
      expect(result.entries).toEqual([])
    }
  })
})

describe('module → tool reverse links', () => {
  it('parses a module id out of a tool moduleLink, query string and all', () => {
    expect(moduleIdFromToolLink('/learn/iam-pqc')).toBe('iam-pqc')
    expect(moduleIdFromToolLink('/learn/entropy-randomness?tab=workshop&step=3')).toBe(
      'entropy-randomness'
    )
    expect(moduleIdFromToolLink('/playground/tpm-playground')).toBeNull()
    expect(moduleIdFromToolLink('')).toBeNull()
  })

  it('closes the three modules that had an inbound tool link and rendered nothing', () => {
    // WS12 gap 3, confirmed 2026-08-21 by diffing the 19 modules tool
    // moduleLinks point at against the 17 that hand-declare playgroundTool.
    for (const id of ['confidential-computing', 'iam-pqc', 'secure-boot-pqc']) {
      const manifest = MANIFEST_BY_ID[id]!
      expect(manifest.playgroundTool, `${id} now declares one — update this guard`).toBeUndefined()
      expect(resolveModuleTool(manifest), `${id} has no derived tool link`).toBeTruthy()
    }
  })

  it('every derived link points at a real, browser-runnable tool', () => {
    const byId = new Map(WORKSHOP_TOOLS.map((t) => [t.id, t]))
    for (const [moduleId, toolId] of TOOL_BY_MODULE_ID) {
      const tool = byId.get(toolId)
      expect(tool, `${moduleId} → unknown tool ${toolId}`).toBeDefined()
      expect(tool!.sandbox, `${moduleId} → container-only tool ${toolId}`).toBeFalsy()
      expect(
        MANIFEST_BY_ID[moduleId],
        `unknown module ${moduleId} in tool moduleLink`
      ).toBeDefined()
    }
  })

  it('TOOL_BY_MODULE_ID is exactly what the registry implies', () => {
    // The map is a checked-in literal because a live import of WORKSHOP_TOOLS
    // from ModuleShell costs 2.11 MB of eager JS (see moduleToolLinks.ts). This
    // is the guard that makes the literal safe: it re-derives the same map from
    // the real registry, so a new or renamed tool moduleLink fails here instead
    // of silently leaving a module without its tool link.
    const derived = new Map<string, string>()
    for (const tool of WORKSHOP_TOOLS) {
      if (tool.sandbox) continue
      const moduleId = moduleIdFromToolLink(tool.moduleLink)
      if (moduleId && !derived.has(moduleId)) derived.set(moduleId, tool.id)
    }
    const fmt = (m: ReadonlyMap<string, string>) =>
      [...m.entries()].map(([k, v]) => `['${k}', '${v}'],`).sort()
    expect(
      fmt(TOOL_BY_MODULE_ID),
      'TOOL_BY_MODULE_ID drifted from workshopRegistry — paste the derived entries below ' +
        'into src/data/moduleToolLinks.ts (registry order preserved).'
    ).toEqual(fmt(derived))
  })

  it("a module's own declaration always wins over the derived one", () => {
    const declared = MANIFESTS.filter((m) => m.playgroundTool)
    expect(declared.length).toBeGreaterThan(0)
    for (const m of declared) expect(resolveModuleTool(m)).toBe(m.playgroundTool)
  })

  it('raises module→tool coverage above the 17 that self-declare', () => {
    const declared = MANIFESTS.filter((m) => m.playgroundTool).length
    const covered = MANIFESTS.filter((m) => resolveModuleTool(m)).length
    expect(covered).toBeGreaterThan(declared)
  })
})
