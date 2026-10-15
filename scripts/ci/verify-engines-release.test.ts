// SPDX-License-Identifier: GPL-3.0-only
// scripts/ci/verify-engines-release.ts: the pinned release holds exactly the locked files.
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import type { EnginesLock } from './verify-engines'
import { readTarGz, releaseUrl, verifyRelease, type Fetcher } from './verify-engines-release'

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex')

/** Minimal ustar writer for the tests (regular files only). */
function tarGz(files: Record<string, string>): Buffer {
  const blocks: Buffer[] = []
  for (const [name, text] of Object.entries(files)) {
    const data = Buffer.from(text)
    const h = Buffer.alloc(512)
    h.write(name, 0, 100, 'utf8')
    h.write('0000644\0', 100)
    h.write('0000000\0', 108)
    h.write('0000000\0', 116)
    h.write(data.length.toString(8).padStart(11, '0') + '\0', 124)
    h.write('00000000000\0', 136)
    h.write('        ', 148)
    h.write('0', 156)
    h.write('ustar\0', 257)
    h.write('00', 263)
    let sum = 0
    for (const b of h) sum += b
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148)
    blocks.push(h, data, Buffer.alloc((512 - (data.length % 512)) % 512))
  }
  blocks.push(Buffer.alloc(1024))
  return gzipSync(Buffer.concat(blocks))
}

const A = 'engine-bytes-a'
const B = 'loader-b'

function setup(contents: Record<string, string> = { 'public/wasm/a.wasm': A, 'src/wasm/a.js': B }) {
  const gz = tarGz(contents)
  const lock: EnginesLock = {
    version: 1,
    producer: 'org/hsm',
    bundles: {
      alpha: {
        hsmCommit: 'a'.repeat(40),
        release: { tag: 'engines-1', asset: 'alpha-aaaaaaaa.tar.gz', tarballSha256: sha(gz) },
        files: {
          'public/wasm/a.wasm': { sha256: sha(Buffer.from(A)), bytes: A.length },
          'src/wasm/a.js': { sha256: sha(Buffer.from(B)), bytes: B.length },
        },
      },
      unpinned: { hsmCommit: null, release: null, files: {} },
    },
  }
  const urls: string[] = []
  const fetcher: Fetcher = async (url) => {
    urls.push(url)
    return gz
  }
  return { gz, lock, fetcher, urls }
}

describe('readTarGz', () => {
  it('reads regular files and drops a leading ./', () => {
    const files = readTarGz(tarGz({ './x/y.txt': 'hello', 'z.bin': 'z' }))
    expect([...files.keys()]).toEqual(['x/y.txt', 'z.bin'])
    expect(files.get('x/y.txt')?.toString()).toBe('hello')
  })
})

describe('verifyRelease', () => {
  it('passes when the release holds exactly the locked files, and skips unpinned bundles', async () => {
    const { lock, fetcher, urls } = setup()
    expect(await verifyRelease(lock, fetcher)).toEqual([])
    expect(urls).toEqual([releaseUrl('org/hsm', 'engines-1', 'alpha-aaaaaaaa.tar.gz')])
  })

  it('flags a tarball whose checksum differs from the pin', async () => {
    const { lock } = setup()
    const other = tarGz({ 'public/wasm/a.wasm': 'tampered', 'src/wasm/a.js': B })
    expect(await verifyRelease(lock, async () => other)).toEqual([
      { bundle: 'alpha', file: 'alpha-aaaaaaaa.tar.gz', what: 'tarball differs' },
    ])
  })

  it('names a file that changed, is missing, or is extra in the release', async () => {
    const { lock, fetcher } = setup({ 'public/wasm/a.wasm': 'changed', 'extra.txt': 'x' })
    const problems = await verifyRelease(lock, fetcher)
    expect(problems).toContainEqual({
      bundle: 'alpha',
      file: 'public/wasm/a.wasm',
      what: 'changed in release',
    })
    expect(problems).toContainEqual({
      bundle: 'alpha',
      file: 'src/wasm/a.js',
      what: 'missing from release',
    })
    expect(problems).toContainEqual({ bundle: 'alpha', file: 'extra.txt', what: 'not in lock' })
  })

  it('reports a failed download without throwing', async () => {
    const { lock } = setup()
    const failing: Fetcher = async () => {
      throw new Error('offline')
    }
    expect(await verifyRelease(lock, failing)).toEqual([
      { bundle: 'alpha', file: 'alpha-aaaaaaaa.tar.gz', what: 'download failed' },
    ])
  })
})
