// SPDX-License-Identifier: GPL-3.0-only
/**
 * UX batch 2 (B+ round 8, 2026-09-19) — CC-1 drift guard.
 *
 * A module's manifest.workshopSteps is what the shell, the sidebar progress
 * ("Workshop 0/5"), the search index and the workshop-flow audit read; its
 * index.tsx PARTS array is what actually renders. Ten modules had drifted
 * (nine under-declared a step; one listed two ids that no part had), so the
 * sidebar showed "0/5" beside a nine-step rail. This test reads both from
 * source and refuses any difference in ids or order.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MODULES = path.resolve(__dirname, '../modules')

function stepIdsFromManifest(src: string): string[] | null {
  const m = src.match(/^ {2}workshopSteps: \[([\s\S]*?)\n {2}\],\n/m)
  if (!m) return null
  return [...m[1].matchAll(/\{ id: '([^']+)'/g)].map((x) => x[1])
}

function stepIdsFromParts(dir: string): string[] | null {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.tsx') && !f.includes('.test.'))
  for (const f of ['index.tsx', ...files.filter((x) => x !== 'index.tsx')]) {
    const p = path.join(dir, f)
    if (!fs.existsSync(p)) continue
    const src = fs.readFileSync(p, 'utf8')
    const m = src.match(/const PARTS(?::\s*WorkshopPart\[\])?\s*=\s*\[([\s\S]*?)\n\]/)
    if (m) return [...m[1].matchAll(/\{\s*id: '([^']+)'/g)].map((x) => x[1])
  }
  return null
}

describe('module manifests — workshopSteps match the rendered PARTS', () => {
  const dirs = fs
    .readdirSync(MODULES)
    .filter((d) => fs.existsSync(path.join(MODULES, d, 'manifest.ts')))

  it('finds modules to check', () => {
    expect(dirs.length).toBeGreaterThan(50)
  })

  for (const d of dirs) {
    it(`${d}: manifest.workshopSteps ids equal PARTS ids, in order`, () => {
      const manifest = fs.readFileSync(path.join(MODULES, d, 'manifest.ts'), 'utf8')
      const declared = stepIdsFromManifest(manifest)
      const parts = stepIdsFromParts(path.join(MODULES, d))
      if (declared === null || parts === null) return // no workshop, or steps come from elsewhere
      expect(
        declared,
        `${d}: manifest declares ${declared.length}, PARTS renders ${parts.length}`
      ).toEqual(parts)
    })
  }
})
