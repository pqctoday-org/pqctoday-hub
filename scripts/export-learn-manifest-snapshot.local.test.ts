// SPDX-License-Identifier: GPL-3.0-only
/**
 * Local-gate suite for the learn-manifest snapshot's component-text scope.
 *
 * `.local.test.ts` by directive (2026-07-01): new suites run on the local gate,
 * never in GitHub CI. Run via `npm run test:local`.
 *
 * WHY THIS EXISTS. `componentFiles` is not a convenience — it is exactly the
 * text pqctoday-priv's accuracy_spotcheck.py fact-checks against each module's
 * cited evidence. Anything outside it is prose a learner reads that nothing
 * ever verifies.
 *
 * Until 2026-08-22 the collection was `index.tsx` + `components/` + `workshop/`,
 * so modules that put their main interactive surface at the module ROOT or in a
 * sibling directory were invisible to it. Measured over all 65 modules: 943 KB
 * of 8,255 KB (11%) out of scope, concentrated in five modules. The worst case
 * was Module1-Introduction, where the checker read 2,033 characters while
 * 107 KB of module-root .tsx sat unexamined — an introduction module being
 * fact-checked on almost none of its content.
 *
 * The suite runs the real exporter rather than importing its helpers: the
 * script calls main() at import time, and the property worth protecting is the
 * end-to-end snapshot content, not a private function's return value.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const REPO_ROOT = path.resolve(__dirname, '..')

interface ComponentFileEntry {
  path: string
  chars: number
  text: string
}
interface ModuleSnapshot {
  dir: string
  id: string
  componentFiles: ComponentFileEntry[]
}

let modules: ModuleSnapshot[]

beforeAll(() => {
  const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'learn-snap-')), 'snap.json')
  execFileSync('npx', ['tsx', 'scripts/export-learn-manifest-snapshot.ts', '--out', out], {
    cwd: REPO_ROOT,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  modules = JSON.parse(fs.readFileSync(out, 'utf-8')).modules
}, 300_000)

const byDir = (dir: string): ModuleSnapshot => {
  const m = modules.find((x) => x.dir === dir)
  if (!m) throw new Error(`module ${dir} not in snapshot`)
  return m
}
const paths = (m: ModuleSnapshot): string[] => m.componentFiles.map((c) => c.path)

describe('snapshot component-text scope', () => {
  it('collects every module, so the assertions below measure something', () => {
    expect(modules.length).toBeGreaterThanOrEqual(60)
  })

  it('includes module-root .tsx, not only index.tsx', () => {
    // FiveG's teaching surface is SuciFlow/AuthFlow/ProvisioningFlow at the
    // module root. Before 2026-08-22 none of the three was fact-checked.
    const p = paths(byDir('FiveG'))
    expect(p.some((x) => x.endsWith('/FiveG/SuciFlow.tsx'))).toBe(true)
    expect(p.some((x) => x.endsWith('/FiveG/index.tsx'))).toBe(true)
  })

  it('includes sibling content directories (flows/)', () => {
    const p = paths(byDir('DigitalAssets'))
    expect(p.some((x) => x.includes('/DigitalAssets/flows/'))).toBe(true)
  })

  it('gives Module1-Introduction real content to check', () => {
    // The regression case, stated as the number that made it obvious: 1
    // componentFile and ~2k chars before, because everything lived at the root.
    const m = byDir('Module1-Introduction')
    expect(m.componentFiles.length).toBeGreaterThan(1)
    const chars = m.componentFiles.reduce((n, c) => n + c.chars, 0)
    expect(chars).toBeGreaterThan(8000)
  })

  it('excludes tests and implementation directories', () => {
    // services/utils/hooks are implementation: extractComponentText would
    // return identifier noise, and a fact-checker cannot fact-check a helper.
    // Tests are excluded by listTsxFiles/listModuleRootTsx directly.
    const all = modules.flatMap(paths)
    expect(all.filter((p) => p.endsWith('.test.tsx'))).toEqual([])
    expect(all.filter((p) => p.endsWith('.spec.tsx'))).toEqual([])
    for (const dir of ['/services/', '/utils/', '/hooks/']) {
      expect(all.filter((p) => p.includes(dir))).toEqual([])
    }
  })

  it('appends the new paths AFTER components/workshop', () => {
    // Load-bearing ordering, not style. accuracy_spotcheck truncates assembled
    // text at 24,000 chars and 20 of 65 modules were already at that cap;
    // appending last means a capped module keeps byte-identical text while the
    // under-cap modules absorb the addition. Verified when this landed: the
    // three capped modules whose file list grew (CryptoMgmtModernization,
    // PQCBusinessCase, TLSBasics) had identical text hashes before and after.
    // NB: match '/FiveG/components/', not '/components/' — every path here
    // starts with 'src/components/PKILearning/...', so the bare substring
    // matches the repo prefix on EVERY entry and silently compares an index
    // with itself. (Caught by this test failing 12 > 12 when first written.)
    const p = paths(byDir('FiveG'))
    const lastComponentsIdx = p.map((x) => x.includes('/FiveG/components/')).lastIndexOf(true)
    const rootIdx = p.findIndex((x) => x.endsWith('/FiveG/SuciFlow.tsx'))
    expect(lastComponentsIdx).toBeGreaterThanOrEqual(0)
    expect(rootIdx).toBeGreaterThan(lastComponentsIdx)
  })
})
