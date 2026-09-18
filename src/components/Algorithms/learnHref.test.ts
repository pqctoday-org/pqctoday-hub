// SPDX-License-Identifier: GPL-3.0-only
//
// Driftguard for the industry → learn-path deep links (G7, 2026-09-17).
// learnHref() falls back to the module top when a path is missing, which is
// safe but silent: a renamed section would quietly degrade every Payment /
// Banking / Retail link to the top of a 110-minute module. This pins that
// every INDUSTRY_TO_PATH entry resolves to a declared path whose entry
// section exists as a real LearnSection id in the module's components.

import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { learnHref, INDUSTRY_TO_PATH } from './learnHref'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { useCases } = loadIndustryLandscape()

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.tsx?$/.test(name) && !/\.test\./.test(name)) out.push(p)
  }
  return out
}

function moduleSourceFor(moduleId: string): string {
  const manifest = MANIFEST_BY_ID[moduleId]
  if (!manifest) return ''
  // Manifests live at modules/<Dir>/manifest.ts; find the dir by scanning
  // for the manifest that declares this id rather than guessing the folder.
  const root = join(__dirname, '..', 'PKILearning', 'modules')
  for (const dir of readdirSync(root)) {
    const mf = join(root, dir, 'manifest.ts')
    try {
      if (readFileSync(mf, 'utf8').includes(`id: '${moduleId}'`)) {
        return walk(join(root, dir))
          .map((f) => readFileSync(f, 'utf8'))
          .join('\n')
      }
    } catch {
      /* no manifest in this dir */
    }
  }
  return ''
}

describe('learnHref', () => {
  it('every INDUSTRY_TO_PATH industry maps to a module that declares that path', () => {
    for (const [industry, pathId] of Object.entries(INDUSTRY_TO_PATH)) {
      const rows = useCases.filter((u) => u.industry === industry && u.learnModuleId)
      expect(
        rows.length,
        `${industry}: no landscape row carries a learn_module_id`
      ).toBeGreaterThan(0)
      for (const moduleId of new Set(rows.map((r) => r.learnModuleId))) {
        const path = MANIFEST_BY_ID[moduleId]?.learnPaths?.find((p) => p.id === pathId)
        // A module that serves this industry without declaring the path is
        // fine (falls back to module top) — but the module the industry was
        // DESIGNED to deep-link into must declare it.
        if (!MANIFEST_BY_ID[moduleId]?.learnPaths) continue
        expect(path, `${industry} → ${moduleId}: learnPaths has no "${pathId}"`).toBeDefined()
        expect(
          path!.sections,
          `${moduleId}/${pathId}: entrySection "${path!.entrySection}" is not in the path's sections`
        ).toContain(path!.entrySection)
        const src = moduleSourceFor(moduleId)
        for (const section of path!.sections) {
          const re = new RegExp(`(?:id|sectionId)\\s*[=:]\\s*\\{?["']${section}["']`)
          expect(
            re.test(src),
            `${moduleId}/${pathId}: section "${section}" has no LearnSection in the module`
          ).toBe(true)
        }
      }
    }
  })

  it('produces a path-scoped link for mapped industries and a plain link otherwise', () => {
    expect(learnHref('emv-payment-pqc', 'Finance & Banking')).toBe(
      '/learn/emv-payment-pqc?path=banking&section=interbank-rails'
    )
    expect(learnHref('healthcare-pqc', 'Healthcare / Pharmaceutical')).toBe('/learn/healthcare-pqc')
    // Industry mapped to a path the module does not declare → module top.
    expect(learnHref('healthcare-pqc', 'Finance & Banking')).toBe('/learn/healthcare-pqc')
  })
})
