// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { extractGlobPatterns, findUncovered } from './audit-merge-all-coverage'

const tmpDirs: string[] = []
afterEach(() => {
  for (const d of tmpDirs.splice(0)) fs.rmSync(d, { recursive: true, force: true })
})

/** Build a fake `<root>/src/data/...` tree plus a loader `.ts` file at
 *  `<root>/<loaderRelPath>`, mirroring the real repo's directory shape closely
 *  enough for findUncovered's path.join(rootDir, loaderFile) to resolve. */
function makeFixture(files: string[], loaderRelPath: string, loaderSource: string) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-all-coverage-test-'))
  const dataDir = path.join(root, 'src', 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  for (const f of files) {
    const full = path.join(dataDir, f)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, 'content\n')
  }
  const loaderFull = path.join(root, loaderRelPath)
  fs.mkdirSync(path.dirname(loaderFull), { recursive: true })
  fs.writeFileSync(loaderFull, loaderSource)
  return { root, dataDir }
}

describe('extractGlobPatterns', () => {
  it('pulls the string literal out of a plain import.meta.glob call', () => {
    const src = `const modules = import.meta.glob('./pqc_maturity_governance_requirements_*.csv', { eager: true })`
    expect(extractGlobPatterns(src)).toEqual(['./pqc_maturity_governance_requirements_*.csv'])
  })

  it('pulls every pattern out of a spread of multiple calls, generic or not', () => {
    const src = `
      const modules = {
        ...import.meta.glob('./doc-enrichments/timeline_doc_enrichments_*.md', { eager: true }),
        ...import.meta.glob<string>('./archive/timeline_doc_enrichments_*.md', { eager: true }),
      }
    `
    expect(extractGlobPatterns(src)).toEqual([
      './doc-enrichments/timeline_doc_enrichments_*.md',
      './archive/timeline_doc_enrichments_*.md',
    ])
  })

  it('returns empty for a file with no glob calls', () => {
    expect(extractGlobPatterns('export const x = 1')).toEqual([])
  })
})

describe('findUncovered', () => {
  const prefix = 'pqc_maturity_governance_requirements_'
  const sources = [
    { name: 'test maturity', prefix, ext: '.csv' as const, loaderFile: 'src/data/loader.ts' },
  ]

  it('is silent when the loader globs every directory a matching file lives in', () => {
    const { dataDir, root } = makeFixture(
      [`${prefix}07192026.csv`, `archive/${prefix}05152026.csv`],
      'src/data/loader.ts',
      `const modules = {
        ...import.meta.glob('./${prefix}*.csv', { eager: true }),
        ...import.meta.glob('./archive/${prefix}*.csv', { eager: true }),
      }`
    )
    tmpDirs.push(root)
    expect(findUncovered(dataDir, root, sources)).toEqual([])
  })

  it('flags an archived file the loader never globs — the 2026-07-26 regression, reproduced', () => {
    const { dataDir, root } = makeFixture(
      [`${prefix}07192026.csv`, `archive/${prefix}05152026.csv`],
      'src/data/loader.ts',
      // Only the top-level glob — archive/ was never added. This is exactly the
      // pre-fix state of maturityGovernanceData.ts.
      `const modules = import.meta.glob('./${prefix}*.csv', { eager: true })`
    )
    tmpDirs.push(root)
    const findings = findUncovered(dataDir, root, sources)
    expect(findings).toHaveLength(1)
    expect(findings[0].source).toBe('test maturity')
    expect(findings[0].uncovered).toEqual([`archive/${prefix}05152026.csv`])
  })

  it('is silent when there is nothing archived at all', () => {
    const { dataDir, root } = makeFixture(
      [`${prefix}07192026.csv`],
      'src/data/loader.ts',
      `const modules = import.meta.glob('./${prefix}*.csv', { eager: true })`
    )
    tmpDirs.push(root)
    expect(findUncovered(dataDir, root, sources)).toEqual([])
  })

  it('reports each registered source independently', () => {
    const twoSources = [
      { name: 'source A', prefix: 'aaa_', ext: '.csv' as const, loaderFile: 'src/data/loaderA.ts' },
      { name: 'source B', prefix: 'bbb_', ext: '.csv' as const, loaderFile: 'src/data/loaderB.ts' },
    ]
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'merge-all-coverage-test-'))
    tmpDirs.push(root)
    const dataDir = path.join(root, 'src', 'data')
    fs.mkdirSync(path.join(dataDir, 'archive'), { recursive: true })
    fs.writeFileSync(path.join(dataDir, 'aaa_07192026.csv'), 'x')
    fs.writeFileSync(path.join(dataDir, 'archive', 'aaa_05152026.csv'), 'x')
    fs.writeFileSync(path.join(dataDir, 'bbb_07192026.csv'), 'x')
    fs.writeFileSync(path.join(dataDir, 'archive', 'bbb_05152026.csv'), 'x')
    // A's loader is fixed, B's is not.
    fs.writeFileSync(
      path.join(root, 'src/data/loaderA.ts'),
      `const m = { ...import.meta.glob('./aaa_*.csv', { eager: true }), ...import.meta.glob('./archive/aaa_*.csv', { eager: true }) }`
    )
    fs.writeFileSync(
      path.join(root, 'src/data/loaderB.ts'),
      `const m = import.meta.glob('./bbb_*.csv', { eager: true })`
    )
    const findings = findUncovered(dataDir, root, twoSources)
    expect(findings).toHaveLength(1)
    expect(findings[0].source).toBe('source B')
  })
})
