// SPDX-License-Identifier: GPL-3.0-only
// scripts/ci/verify-engines.ts: the engine files match the lock, on any machine.
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildLock, verifyEngines, type ProvenanceBundle } from './verify-engines'

const SCRIPT = join(process.cwd(), 'scripts/ci/verify-engines.ts')
const COMMIT = 'a'.repeat(40)

let dir: string
const prov = (): ProvenanceBundle[] => [
  { name: 'alpha', files: ['public/wasm/a.wasm', 'src/wasm/a.js'], hsmCommit: COMMIT },
  { name: 'beta', files: ['public/wasm/b.wasm'], hsmCommit: null },
]

function put(rel: string, text: string) {
  const full = join(dir, rel)
  mkdirSync(join(full, '..'), { recursive: true })
  writeFileSync(full, text)
}

function run(...args: string[]) {
  return spawnSync(
    process.execPath,
    ['--experimental-strip-types', SCRIPT, '--root', dir, ...args],
    {
      encoding: 'utf8',
    }
  )
}

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'engines-'))
  put('public/wasm/a.wasm', 'AAAA')
  put('src/wasm/a.js', 'js-glue')
  put('public/wasm/b.wasm', 'BBBB')
})
afterEach(() => rmSync(dir, { recursive: true, force: true }))

describe('verifyEngines', () => {
  it('passes for an untouched tree', () => {
    const lock = buildLock(dir, prov(), 'org/hsm')
    expect(verifyEngines(dir, lock, prov())).toEqual([])
  })

  it('names a changed file', () => {
    const lock = buildLock(dir, prov(), 'org/hsm')
    put('public/wasm/a.wasm', 'AAAB')
    expect(verifyEngines(dir, lock, prov())).toEqual([
      { bundle: 'alpha', file: 'public/wasm/a.wasm', what: 'changed' },
    ])
  })

  it('names a missing file', () => {
    const lock = buildLock(dir, prov(), 'org/hsm')
    rmSync(join(dir, 'src/wasm/a.js'))
    expect(verifyEngines(dir, lock, prov())).toEqual([
      { bundle: 'alpha', file: 'src/wasm/a.js', what: 'missing' },
    ])
  })

  it('flags a declared file that is not in the lock, and a locked file no longer declared', () => {
    const lock = buildLock(dir, prov(), 'org/hsm')
    put('public/wasm/extra.wasm', 'X')
    const grown = prov()
    grown[1].files.push('public/wasm/extra.wasm')
    expect(verifyEngines(dir, lock, grown)).toContainEqual({
      bundle: 'beta',
      file: 'public/wasm/extra.wasm',
      what: 'unlocked',
    })
    const shrunk = prov()
    shrunk[0].files = ['public/wasm/a.wasm']
    expect(verifyEngines(dir, lock, shrunk)).toContainEqual({
      bundle: 'alpha',
      file: 'src/wasm/a.js',
      what: 'not declared',
    })
  })

  it('flags a commit that differs and a bundle missing on either side', () => {
    const lock = buildLock(dir, prov(), 'org/hsm')
    const moved = prov()
    moved[0].hsmCommit = 'b'.repeat(40)
    expect(verifyEngines(dir, lock, moved)).toContainEqual({
      bundle: 'alpha',
      file: '-',
      what: 'commit differs',
    })
    expect(verifyEngines(dir, lock, prov().slice(0, 1))).toContainEqual({
      bundle: 'beta',
      file: '-',
      what: 'bundle not in provenance',
    })
    delete lock.bundles.beta
    expect(verifyEngines(dir, lock, prov())).toContainEqual({
      bundle: 'beta',
      file: '-',
      what: 'bundle not in lock',
    })
  })

  it('rejects a folder entry, both when verifying and when writing the lock', () => {
    const lock = buildLock(dir, prov(), 'org/hsm')
    const withFolder = prov()
    withFolder[0].files.push('src/wasm/kmip/')
    expect(verifyEngines(dir, lock, withFolder)).toContainEqual({
      bundle: 'alpha',
      file: 'src/wasm/kmip/',
      what: 'folder entry',
    })
    expect(() => buildLock(dir, withFolder, 'org/hsm')).toThrow(/folder/)
  })

  it('keeps a pinned release when the lock is regenerated', () => {
    const first = buildLock(dir, prov(), 'org/hsm')
    first.bundles.alpha.release = {
      tag: 'engines-1',
      asset: 'alpha-aaaaaaaa.tar.gz',
      tarballSha256: 'f'.repeat(64),
    }
    put('public/wasm/a.wasm', 'AAAB')
    const second = buildLock(dir, prov(), 'org/hsm', first)
    expect(second.bundles.alpha.release?.tag).toBe('engines-1')
    expect(second.bundles.alpha.files['public/wasm/a.wasm'].sha256).not.toBe(
      first.bundles.alpha.files['public/wasm/a.wasm'].sha256
    )
  })
})

describe('command line', () => {
  it('writes a lock, passes, fails on a one-byte change with the file named, and exits 2 without a lock', () => {
    writeFileSync(
      join(dir, 'public/wasm/wasm-provenance.json'),
      JSON.stringify({ hsmRepo: 'org/hsm', bundles: prov() })
    )
    expect(run().status).toBe(2)
    expect(run('--write-lock').status).toBe(0)
    const lock = JSON.parse(readFileSync(join(dir, 'public/wasm/engines.lock.json'), 'utf8'))
    expect(Object.keys(lock.bundles)).toEqual(['alpha', 'beta'])
    expect(run().status).toBe(0)

    put('public/wasm/b.wasm', 'BBBC')
    const failed = run()
    expect(failed.status).toBe(1)
    expect(failed.stdout).toContain('beta: public/wasm/b.wasm changed')
    expect(failed.stdout + failed.stderr).not.toContain('BBBC')
  })
})
