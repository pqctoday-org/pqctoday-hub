// SPDX-License-Identifier: AGPL-3.0-only
// Tree mode of scripts/ci/leak-guard.ts: whole-tree scan against a frozen
// baseline. Fixtures are assembled from fragments so this file contains no
// literal match itself.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { baselineKey, compareToBaseline, countText, ratchet, scanTree } from './leak-guard'

const PRIVATE_REPO = ['pqctoday', 'priv'].join('-')
const HOME = ['', 'Users', 'alice', 'x'].join('/')
const SCRIPT = join(process.cwd(), 'scripts/ci/leak-guard.ts')

let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'leak-tree-'))
})
afterEach(() => {
  rmSync(dir, { recursive: true, force: true })
})

function put(rel: string, content: string | Buffer) {
  const full = join(dir, rel)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, content)
}

function run(...args: string[]) {
  return spawnSync(process.execPath, ['--experimental-strip-types', SCRIPT, ...args], {
    cwd: dir,
    encoding: 'utf8',
  })
}

describe('countText', () => {
  it('counts matching lines per rule', () => {
    const text = [`see ${PRIVATE_REPO}`, 'clean', `again ${PRIVATE_REPO}`, `at ${HOME}/f`].join(
      '\n'
    )
    expect(countText(text)).toEqual({ 'private-repo': 2, 'home-path': 1 })
  })
})

describe('baselineKey', () => {
  it('replaces bundler hashes and dated-copy stamps, and nothing else', () => {
    expect(baselineKey('assets/index-D3FGcMe6.js')).toBe('assets/index-#.js')
    expect(baselineKey('assets/App-D-HblFRk.js')).toBe('assets/App-#.js')
    expect(baselineKey('assets/pqc_ref_09202026-B18KuhTe.js')).toBe('assets/pqc_ref_#-#.js')
    expect(baselineKey('src/data/leaders_09302026.csv')).toBe('src/data/leaders_#.csv')
    expect(baselineKey('src/data/threats_10012026_r2.csv')).toBe('src/data/threats_#.csv')
    expect(baselineKey('data/rag-corpus.json')).toBe('data/rag-corpus.json')
    expect(baselineKey('scripts/ci/leak-guard.ts')).toBe('scripts/ci/leak-guard.ts')
  })
})

describe('scanTree', () => {
  it('treats a rotated dated copy as one family and keeps the highest count', () => {
    put('data/rows_09302026.csv', `${PRIVATE_REPO}\n${PRIVATE_REPO}\n`)
    put('data/rows_10112026.csv', `${PRIVATE_REPO}\n${PRIVATE_REPO}\n${PRIVATE_REPO}\n`)
    expect(scanTree(dir).counts).toEqual({ 'data/rows_#.csv': { 'private-repo': 3 } })
  })

  it('counts text files, ignores binaries, dependencies, baselines and the git folder', () => {
    put('a.txt', `x ${PRIVATE_REPO}\n`)
    put('b.txt', 'clean\n')
    put('c.dat', Buffer.concat([Buffer.from([0, 1, 2]), Buffer.from(PRIVATE_REPO)]))
    put('d.wasm', PRIVATE_REPO)
    put('node_modules/p/i.js', PRIVATE_REPO)
    put('.git/config', PRIVATE_REPO)
    put('scripts/ci/leak-baseline-source.json', PRIVATE_REPO)
    const { counts, notScanned } = scanTree(dir)
    expect(counts).toEqual({ 'a.txt': { 'private-repo': 1 } })
    expect(notScanned).toEqual([])
  })
})

describe('compareToBaseline and ratchet', () => {
  const base = { 'a.txt': { 'private-repo': 2 }, 'gone.txt': { 'home-path': 1 } }

  it('flags new files, new rules and higher counts', () => {
    const now = {
      'a.txt': { 'private-repo': 3, 'home-path': 1 },
      'new.txt': { 'run-id': 1 },
    }
    const { regressions } = compareToBaseline(now, base)
    expect(regressions.map((r) => `${r.file}/${r.rule}/${r.was}->${r.now}`).sort()).toEqual([
      'a.txt/home-path/0->1',
      'a.txt/private-repo/2->3',
      'new.txt/run-id/0->1',
    ])
  })

  it('reports entries that fell', () => {
    const { regressions, improved } = compareToBaseline({ 'a.txt': { 'private-repo': 1 } }, base)
    expect(regressions).toEqual([])
    expect(improved.map((r) => `${r.file}/${r.rule}`).sort()).toEqual([
      'a.txt/private-repo',
      'gone.txt/home-path',
    ])
  })

  it('ratchet keeps the lower count, never raises, drops zeros', () => {
    const now = { 'a.txt': { 'private-repo': 5 }, 'other.txt': { 'run-id': 9 } }
    expect(ratchet(now, base)).toEqual({ 'a.txt': { 'private-repo': 2 } })
    expect(ratchet({ 'a.txt': { 'private-repo': 1 } }, base)).toEqual({
      'a.txt': { 'private-repo': 1 },
    })
  })
})

describe('command line', () => {
  it('creates a baseline, passes, fails on a new finding with redacted output, and only ratchets down', () => {
    put('a.txt', `x ${PRIVATE_REPO}\ny ${PRIVATE_REPO}\n`)
    const b = ['--tree', '.', '--baseline', 'base.json']

    // no baseline yet: refuse without --allow-increase
    expect(run(...b, '--update-baseline').status).toBe(2)
    expect(run(...b, '--update-baseline', '--allow-increase').status).toBe(0)
    const written = JSON.parse(readFileSync(join(dir, 'base.json'), 'utf8'))
    expect(written.files).toEqual({ 'a.txt': { 'private-repo': 2 } })
    // the baseline file itself is stored without any matched text
    expect(readFileSync(join(dir, 'base.json'), 'utf8')).not.toContain(PRIVATE_REPO)

    // unchanged tree passes in enforce mode
    expect(run(...b, '--mode', 'enforce').status).toBe(0)

    // a new finding fails in enforce mode, passes (exit 0) in report mode, and is redacted
    put('b.txt', `leak ${HOME}/f\n`)
    const enforced = run(...b, '--mode', 'enforce')
    expect(enforced.status).toBe(1)
    expect(enforced.stdout).toContain('home-path @ b.txt: 0 -> 1')
    expect(enforced.stdout + enforced.stderr).not.toContain('alice')
    expect(run(...b).status).toBe(0)

    // the baseline cannot be raised
    expect(run(...b, '--update-baseline').status).toBe(1)

    // fixing findings lets the baseline shrink
    rmSync(join(dir, 'b.txt'))
    put('a.txt', `x ${PRIVATE_REPO}\n`)
    expect(run(...b, '--update-baseline').status).toBe(0)
    expect(JSON.parse(readFileSync(join(dir, 'base.json'), 'utf8')).files).toEqual({
      'a.txt': { 'private-repo': 1 },
    })
  })

  it('exits 2 when the baseline is missing', () => {
    expect(run('--tree', '.', '--baseline', 'nope.json').status).toBe(2)
  })
})
