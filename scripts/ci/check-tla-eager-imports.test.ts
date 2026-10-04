// SPDX-License-Identifier: GPL-3.0-only
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

/**
 * The exit codes of the build gate, run for real on tiny fake builds: 0 clean, 1 a finding or nothing
 * to examine (a check that examines nothing looks exactly like a clean build), 2 no build output.
 */

const ROOT = path.resolve(__dirname, '../..')
const TSX = path.join(ROOT, 'node_modules/.bin/tsx')
const CLI = path.join(ROOT, 'scripts/ci/check-tla-eager-imports.ts')

const WRAPPED =
  'let h;\nlet __tla = Promise.all([]).then(async () => {\n  h = () => 1\n})\nexport { h as a, __tla }\n'
const PLAIN = 'const h = () => 1\nexport { h as a }\n'
const LATE_READER = 'import { a as p } from "./softhsm-0002.js"\nexport const f = () => p()\n'
const EAGER_READER = 'import { a as p } from "./softhsm-0002.js"\nexport const T = { k: p }\n'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** Writes dist/index.html and dist/assets/* in a temp folder and runs the gate there. */
function run(assets: Record<string, string> | null) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'tla-gate-'))
  dirs.push(cwd)
  if (assets) {
    mkdirSync(path.join(cwd, 'dist/assets'), { recursive: true })
    writeFileSync(
      path.join(cwd, 'dist/index.html'),
      '<script type="module" src="/assets/index-0001.js"></script>'
    )
    writeFileSync(path.join(cwd, 'dist/assets/index-0001.js'), 'export {}\n')
    for (const [file, text] of Object.entries(assets)) {
      writeFileSync(path.join(cwd, 'dist/assets', file), text)
    }
  }
  const r = spawnSync(TSX, [CLI], { cwd, encoding: 'utf8' })
  return { code: r.status, out: `${r.stdout}${r.stderr}` }
}

describe('check-tla-eager-imports: exit codes', () => {
  it('0 when nothing reads a late export too early', () => {
    const r = run({ 'softhsm-0002.js': WRAPPED, 'page-0003.js': LATE_READER })
    expect(r.code).toBe(0)
    expect(r.out).toContain('no chunk reads an export of a still-starting chunk')
  }, 60_000)

  it('1 when a chunk reads a late export while it starts up', () => {
    const r = run({ 'softhsm-0002.js': WRAPPED, 'page-0003.js': EAGER_READER })
    expect(r.code).toBe(1)
    expect(r.out).toContain('READ(S) OF AN EXPORT THAT IS NOT READY YET')
    expect(r.out).toContain('page-0003.js:2')
  }, 60_000)

  it('1 when the HSM engine chunk is gone, so the check would examine nothing', () => {
    const r = run({ 'other-0002.js': WRAPPED, 'page-0003.js': 'export {}\n' })
    expect(r.code).toBe(1)
    expect(r.out).toContain('HSM engine chunk')
  }, 60_000)

  it('1 when no wrapped chunk loads after start-up', () => {
    const r = run({ 'softhsm-0002.js': PLAIN, 'page-0003.js': 'export {}\n' })
    expect(r.code).toBe(1)
    expect(r.out).toContain('examined nothing')
  }, 60_000)

  it('2 when there is no build output', () => {
    const r = run(null)
    expect(r.code).toBe(2)
    expect(r.out).toContain('run `npm run build` first')
  }, 60_000)
})
