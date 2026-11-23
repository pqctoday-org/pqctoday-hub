// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { prepareRuntimeAssets, type PrepareOptions } from './prepare-runtime-assets'

function sha256File(p: string): string {
  return createHash('sha256').update(readFileSync(p)).digest('hex')
}

describe('prepareRuntimeAssets', () => {
  const tempDirs: string[] = []

  function setupFixture(): { root: string; opts: PrepareOptions } {
    const root = mkdtempSync(path.join(tmpdir(), 'runtime-assets-'))
    tempDirs.push(root)
    const liboqsSourceDir = path.join(root, 'src-liboqs')
    const softhsmSourceDir = path.join(root, 'src-softhsm')
    const liboqsDestDir = path.join(root, 'public/dist')
    const wasmDestDir = path.join(root, 'public/wasm')

    mkdirSync(path.join(liboqsSourceDir, 'nested'), { recursive: true })
    mkdirSync(softhsmSourceDir, { recursive: true })
    writeFileSync(path.join(liboqsSourceDir, 'index.js'), 'export const oqs = 1;\n')
    writeFileSync(path.join(liboqsSourceDir, 'nested/kem.wasm'), Buffer.from([0, 97, 115, 109, 1]))
    writeFileSync(path.join(softhsmSourceDir, 'softhsm.js'), '// softhsm-loader-v1\n')
    writeFileSync(
      path.join(softhsmSourceDir, 'softhsm.wasm'),
      Buffer.from([0, 97, 115, 109, 2, 3, 4])
    )

    return {
      root,
      opts: { liboqsSourceDir, liboqsDestDir, softhsmSourceDir, wasmDestDir },
    }
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()
      if (dir) rmSync(dir, { recursive: true, force: true })
    }
  })

  it('populates an empty destination cleanly', () => {
    const { opts } = setupFixture()
    const res = prepareRuntimeAssets(opts)
    expect(res.softhsmUpdated).toBe(true)
    expect(res.liboqsFileCount).toBe(2)
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.js'))).toBe(
      res.softhsmDigests['softhsm.js']
    )
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.wasm'))).toBe(
      res.softhsmDigests['softhsm.wasm']
    )
    expect(existsSync(path.join(opts.liboqsDestDir, 'nested/kem.wasm'))).toBe(true)
  })

  it('repairs a loader-only destination (missing softhsm.wasm)', () => {
    const { opts } = setupFixture()
    mkdirSync(opts.wasmDestDir, { recursive: true })
    writeFileSync(path.join(opts.wasmDestDir, 'softhsm.js'), '// softhsm-loader-v1\n')

    const res = prepareRuntimeAssets(opts)
    expect(res.softhsmUpdated).toBe(true)
    expect(existsSync(path.join(opts.wasmDestDir, 'softhsm.wasm'))).toBe(true)
  })

  it('repairs a binary-only destination (missing softhsm.js) instead of skipping', () => {
    const { opts } = setupFixture()
    mkdirSync(opts.wasmDestDir, { recursive: true })
    writeFileSync(path.join(opts.wasmDestDir, 'softhsm.wasm'), Buffer.from([0, 97, 115, 109, 2, 3]))

    const res = prepareRuntimeAssets(opts)
    expect(res.softhsmUpdated).toBe(true)
    expect(existsSync(path.join(opts.wasmDestDir, 'softhsm.js'))).toBe(true)
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.js'))).toBe(
      res.softhsmDigests['softhsm.js']
    )
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.wasm'))).toBe(
      res.softhsmDigests['softhsm.wasm']
    )
  })

  it('replaces a stale pair while preserving unrelated files in public/wasm', () => {
    const { opts } = setupFixture()
    mkdirSync(opts.wasmDestDir, { recursive: true })
    writeFileSync(path.join(opts.wasmDestDir, 'softhsm.js'), '// stale-loader\n')
    writeFileSync(path.join(opts.wasmDestDir, 'softhsm.wasm'), Buffer.from([9, 9, 9]))
    writeFileSync(path.join(opts.wasmDestDir, 'engines.lock.json'), '{"locked":true}\n')

    const res = prepareRuntimeAssets(opts)
    expect(res.softhsmUpdated).toBe(true)
    expect(readFileSync(path.join(opts.wasmDestDir, 'engines.lock.json'), 'utf8')).toBe(
      '{"locked":true}\n'
    )
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.js'))).toBe(
      res.softhsmDigests['softhsm.js']
    )
  })

  it('is repeatable across two consecutive runs without nesting liboqs/dist', () => {
    const { opts } = setupFixture()
    const first = prepareRuntimeAssets(opts)
    const second = prepareRuntimeAssets(opts)

    expect(first.softhsmUpdated).toBe(true)
    expect(second.softhsmUpdated).toBe(false)
    expect(second.softhsmDigests).toEqual(first.softhsmDigests)
    expect(second.liboqsFileCount).toBe(2)
    expect(existsSync(path.join(opts.liboqsDestDir, 'dist'))).toBe(false)
  })

  it('fails naming the missing input BEFORE replacing an existing working pair', () => {
    const { opts } = setupFixture()
    prepareRuntimeAssets(opts)
    const workingJsHash = sha256File(path.join(opts.wasmDestDir, 'softhsm.js'))
    const workingWasmHash = sha256File(path.join(opts.wasmDestDir, 'softhsm.wasm'))

    // Remove the loader input; the working pair in public/wasm must stay intact.
    rmSync(path.join(opts.softhsmSourceDir, 'softhsm.js'))

    expect(() => prepareRuntimeAssets(opts)).toThrow(/softhsm\.js/)
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.js'))).toBe(workingJsHash)
    expect(sha256File(path.join(opts.wasmDestDir, 'softhsm.wasm'))).toBe(workingWasmHash)
  })
})
