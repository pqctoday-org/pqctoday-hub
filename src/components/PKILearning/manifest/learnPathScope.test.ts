// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-0 (2026-09-24) — learn-path scope rules, EMV regression, and a
 * manifest-wide guard so a new multi-path module cannot ship a path tag,
 * entry section or optional flag that the rules would silently ignore.
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from './registry'
import {
  filterByLearnPath,
  isInLearnPath,
  isLearnSectionInPath,
  requiredLearnSectionIds,
  requiredWorkshopStepIds,
  visibleWorkshopStepIds,
  validLearnPathId,
} from './learnPathScope'
import { PATH_FIXTURE as F } from './__fixtures__/learnPathFixture'
import emv from '../modules/EMVPaymentPQC/manifest'

describe('learnPathScope — rules (fixture)', () => {
  it('no path: every non-optional section and step is required, everything visible', () => {
    expect(requiredLearnSectionIds(F, undefined)).toEqual(['core-1', 'core-2', 'a-1', 'b-1'])
    expect(requiredWorkshopStepIds(F, undefined)).toEqual(['w-core', 'w-a', 'w-b'])
    expect(visibleWorkshopStepIds(F, undefined)).toEqual(['w-core', 'w-a', 'w-b', 'w-ref'])
    for (const s of F.learnSections!) expect(isLearnSectionInPath(F, s.id, undefined)).toBe(true)
  })

  it('a stale/unknown path id behaves as no path', () => {
    expect(validLearnPathId(F, 'gone')).toBeUndefined()
    expect(requiredLearnSectionIds(F, 'gone')).toEqual(requiredLearnSectionIds(F, undefined))
    expect(requiredWorkshopStepIds(F, 'gone')).toEqual(requiredWorkshopStepIds(F, undefined))
  })

  it('path A requires its non-optional sections and shows its own + shared references', () => {
    expect(requiredLearnSectionIds(F, 'a')).toEqual(['core-1', 'core-2', 'a-1'])
    expect(isLearnSectionInPath(F, 'a-ref', 'a')).toBe(true) // path-specific reference
    expect(isLearnSectionInPath(F, 'shared-ref', 'a')).toBe(true) // module-wide reference
    expect(isLearnSectionInPath(F, 'b-1', 'a')).toBe(false)
  })

  it("path B does not see path A's reference but does see the shared one", () => {
    expect(requiredLearnSectionIds(F, 'b')).toEqual(['core-1', 'core-2', 'b-1'])
    expect(isLearnSectionInPath(F, 'a-ref', 'b')).toBe(false)
    expect(isLearnSectionInPath(F, 'shared-ref', 'b')).toBe(true)
  })

  it('workshop: tagged steps scope to their path, shared and optional steps stay visible', () => {
    expect(visibleWorkshopStepIds(F, 'a')).toEqual(['w-core', 'w-a', 'w-ref'])
    expect(requiredWorkshopStepIds(F, 'a')).toEqual(['w-core', 'w-a'])
    expect(visibleWorkshopStepIds(F, 'b')).toEqual(['w-core', 'w-b', 'w-ref'])
    expect(requiredWorkshopStepIds(F, 'b')).toEqual(['w-core', 'w-b'])
  })

  it('generic items (exercises): untagged = shared; empty tag list = shared', () => {
    const items = [
      { id: 1 },
      { id: 2, paths: ['a'] },
      { id: 3, paths: ['b'] },
      { id: 4, paths: [] },
    ]
    expect(filterByLearnPath(items, 'a').map((i) => i.id)).toEqual([1, 2, 4])
    expect(filterByLearnPath(items, undefined).map((i) => i.id)).toEqual([1, 2, 3, 4])
    expect(isInLearnPath(undefined, 'a')).toBe(true)
  })

  it('a path whose sections are all unknown/optional falls back to all (never completes on nothing)', () => {
    const broken = {
      ...F,
      learnPaths: [{ ...F.learnPaths![0], id: 'x', sections: ['typo', 'a-ref'] }],
    }
    expect(requiredLearnSectionIds(broken, 'x')).toEqual(requiredLearnSectionIds(F, undefined))
  })
})

describe('learnPathScope — EMV (emv-payment-pqc) behaviour unchanged', () => {
  const allSections = emv.learnSections!.map((s) => s.id)
  const allSteps = emv.workshopSteps!.map((s) => s.id)

  it('declares no optional sections, no tagged steps and the default off-path mode', () => {
    expect(emv.learnSections!.some((s) => s.optional)).toBe(false)
    expect(emv.workshopSteps!.some((s) => s.paths || s.optional)).toBe(false)
    expect(emv.offPathSections).toBeUndefined()
  })

  it('no path: all 12 sections required (pre-WS-0 rule)', () => {
    expect(allSections).toHaveLength(12)
    expect(requiredLearnSectionIds(emv, undefined)).toEqual(allSections)
    expect(requiredLearnSectionIds(emv, 'not-a-path')).toEqual(allSections)
  })

  it("each path requires exactly that path's sections (pre-WS-0 rule)", () => {
    for (const p of emv.learnPaths!) {
      expect(requiredLearnSectionIds(emv, p.id), p.id).toEqual(p.sections)
    }
  })

  it('every workshop step is visible and required on every path', () => {
    for (const p of [undefined, ...emv.learnPaths!.map((x) => x.id)]) {
      expect(visibleWorkshopStepIds(emv, p), String(p)).toEqual(allSteps)
      expect(requiredWorkshopStepIds(emv, p), String(p)).toEqual(allSteps)
    }
  })
})

describe('learnPathScope — every real manifest is consistent', () => {
  for (const m of MANIFESTS) {
    const sectionIds = new Set((m.learnSections ?? []).map((s) => s.id))
    const optional = new Set((m.learnSections ?? []).filter((s) => s.optional).map((s) => s.id))
    const pathIds = (m.learnPaths ?? []).map((p) => p.id)

    it(`${m.id}: learn paths are well-formed`, () => {
      expect(new Set(pathIds).size, 'unique path ids').toBe(pathIds.length)
      for (const p of m.learnPaths ?? []) {
        expect(p.duration, `${p.id}: duration`).toMatch(/^\d+ min$/)
        expect(sectionIds, `${p.id}: entrySection`).toContain(p.entrySection)
        expect(p.sections, `${p.id}: entry is on the path`).toContain(p.entrySection)
        expect(optional.has(p.entrySection), `${p.id}: entry is not optional`).toBe(false)
        for (const s of p.sections) expect(sectionIds, `${p.id}: ${s}`).toContain(s)
        expect(
          p.sections.filter((s) => !optional.has(s)).length,
          `${p.id}: requires at least one section`
        ).toBeGreaterThan(0)
      }
      if (m.offPathSections)
        expect(pathIds.length, 'offPathSections needs learnPaths').toBeGreaterThan(0)
    })

    it(`${m.id}: workshop path tags name real paths`, () => {
      for (const st of m.workshopSteps ?? []) {
        for (const tag of st.paths ?? []) expect(pathIds, `${st.id}: ${tag}`).toContain(tag)
      }
      for (const p of pathIds) {
        const steps = m.workshopSteps ?? []
        if (steps.length === 0) continue
        expect(visibleWorkshopStepIds(m, p).length, `${p}: has a visible step`).toBeGreaterThan(0)
      }
    })
  }
})
