// SPDX-License-Identifier: AGPL-3.0-only
// scripts/ci/verify-engines-release.ts: the pinned release holds exactly the locked files.
import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import type { EnginesLock } from './verify-engines'
import { readTarGz, releaseUrl, verifyRelease, type Fetcher } from './verify-engines-release'

const sha = (b: Buffer): string => createHash('sha256').update(b).digest('hex')

/** Minimal ustar writer for the tests (regular files; names over 100 bytes get a pax header). */
function tarGz(files: Record<string, string>): Buffer {
  const blocks: Buffer[] = []
  const entry = (name: string, data: Buffer, type: string): void => {
    const h = Buffer.alloc(512)
    h.write(name.slice(0, 100), 0, 100, 'utf8')
    h.write('0000644\0', 100)
    h.write('0000000\0', 108)
    h.write('0000000\0', 116)
    h.write(data.length.toString(8).padStart(11, '0') + '\0', 124)
    h.write('00000000000\0', 136)
    h.write('        ', 148)
    h.write(type, 156)
    h.write('ustar\0', 257)
    h.write('00', 263)
    let sum = 0
    for (const b of h) sum += b
    h.write(sum.toString(8).padStart(6, '0') + '\0 ', 148)
    blocks.push(h, data, Buffer.alloc((512 - (data.length % 512)) % 512))
  }
  for (const [name, text] of Object.entries(files)) {
    if (Buffer.byteLength(name) > 100) {
      const rec = ` path=${name}\n`
      let len = rec.length + 2
      while (`${len}${rec}`.length !== len) len = `${len}${rec}`.length
      entry('PaxHeader', Buffer.from(`${len}${rec}`), 'x')
    }
    entry(name, Buffer.from(text), '0')
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

  it('reads a path longer than 100 bytes from its pax header', () => {
    const long = `public/licenses/engines/alpha/LICENSES/crates/${'c'.repeat(80)}/LICENSE-APACHE`
    const files = readTarGz(tarGz({ [long]: 'text' }))
    expect([...files.keys()]).toEqual([long])
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

  it('accepts licence notices that match the committed copies, and names the others', async () => {
    const n = 'public/licenses/engines/alpha/THIRD-PARTY-NOTICES.txt'
    const m = 'public/licenses/engines/alpha/LICENSES/x/LICENSE'
    const { lock, fetcher } = setup({
      'public/wasm/a.wasm': A,
      'src/wasm/a.js': B,
      [n]: 'notices',
      [m]: 'licence',
    })
    const tree = (committed: Record<string, string>) => (f: string) =>
      f in committed ? Buffer.from(committed[f]) : undefined
    expect(await verifyRelease(lock, fetcher, tree({ [n]: 'notices', [m]: 'licence' }))).toEqual([])
    expect(await verifyRelease(lock, fetcher, tree({ [n]: 'edited' }))).toEqual([
      { bundle: 'alpha', file: n, what: 'notice differs' },
      { bundle: 'alpha', file: m, what: 'notice not committed' },
    ])
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
