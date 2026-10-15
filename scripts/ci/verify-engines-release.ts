#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/ci/verify-engines-release.ts — the engine files this site ships are
 * the ones published in the engine release each bundle is pinned to.
 *
 * WHY (owner decision 2026-10-14, repository cleanup Step 3, Phase C). The
 * offline check (`verify-engines.ts`) proves the committed files match
 * `public/wasm/engines.lock.json`. This check closes the loop to the producer:
 * for every bundle with a pinned `release`, it downloads the release tarball
 * from the producer's GitHub release, checks the tarball's SHA-256 against the
 * pin, unpacks it, and checks that it holds exactly the locked files with the
 * locked hashes.
 *
 * It needs the network, so it is not part of every PR. It runs in
 * `gate:release` (before a Hub release) and weekly in
 * `.github/workflows/engines-release-weekly.yml`.
 *
 * Output names the bundle and the file, never file contents.
 *
 * Usage:
 *   tsx scripts/ci/verify-engines-release.ts            # check every pinned bundle
 *   --root <dir> --lock <file>                           # override locations
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gunzipSync } from 'node:zlib'
import type { EnginesLock } from './verify-engines'

export interface ReleaseProblem {
  bundle: string
  file: string
  what:
    | 'download failed'
    | 'tarball differs'
    | 'missing from release'
    | 'not in lock'
    | 'changed in release'
    | 'unreadable tarball'
}

const sha256 = (buf: Buffer): string => createHash('sha256').update(buf).digest('hex')

/** Read the regular files of a gzip'd ustar archive. Paths lose a leading "./". */
export function readTarGz(gz: Buffer): Map<string, Buffer> {
  const tar = gunzipSync(gz)
  const files = new Map<string, Buffer>()
  let off = 0
  const field = (start: number, len: number): string =>
    tar
      .subarray(off + start, off + start + len)
      .toString('utf8')
      .replace(/\0.*$/s, '')
  while (off + 512 <= tar.length) {
    if (tar.subarray(off, off + 512).every((b) => b === 0)) break
    const name = field(0, 100)
    const size = parseInt(field(124, 12).trim() || '0', 8)
    const type = field(156, 1)
    const prefix = field(345, 155)
    if (Number.isNaN(size)) throw new Error('bad tar header')
    const path = (prefix ? `${prefix}/${name}` : name).replace(/^\.\//, '')
    const start = off + 512
    if (type === '0' || type === '') files.set(path, Buffer.from(tar.subarray(start, start + size)))
    off = start + Math.ceil(size / 512) * 512
  }
  return files
}

export type Fetcher = (url: string) => Promise<Buffer>

export function releaseUrl(repo: string, tag: string, asset: string): string {
  return `https://github.com/${repo}/releases/download/${tag}/${asset}`
}

export async function verifyRelease(
  lock: EnginesLock,
  fetcher: Fetcher
): Promise<ReleaseProblem[]> {
  const problems: ReleaseProblem[] = []
  for (const [name, b] of Object.entries(lock.bundles)) {
    if (!b.release) continue
    let gz: Buffer
    try {
      gz = await fetcher(releaseUrl(lock.producer, b.release.tag, b.release.asset))
    } catch {
      problems.push({ bundle: name, file: b.release.asset, what: 'download failed' })
      continue
    }
    if (sha256(gz) !== b.release.tarballSha256) {
      problems.push({ bundle: name, file: b.release.asset, what: 'tarball differs' })
      continue
    }
    let files: Map<string, Buffer>
    try {
      files = readTarGz(gz)
    } catch {
      problems.push({ bundle: name, file: b.release.asset, what: 'unreadable tarball' })
      continue
    }
    for (const [f, meta] of Object.entries(b.files)) {
      const data = files.get(f)
      if (!data) problems.push({ bundle: name, file: f, what: 'missing from release' })
      else if (data.length !== meta.bytes || sha256(data) !== meta.sha256)
        problems.push({ bundle: name, file: f, what: 'changed in release' })
    }
    for (const f of files.keys()) {
      if (!(f in b.files)) problems.push({ bundle: name, file: f, what: 'not in lock' })
    }
  }
  return problems
}

const httpFetcher: Fetcher = async (url) => {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

async function main(argv: string[]): Promise<number> {
  const arg = (n: string): string | undefined => {
    const i = argv.indexOf(n)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const root = arg('--root') ?? process.cwd()
  const lockPath = arg('--lock') ?? join(root, 'public/wasm/engines.lock.json')
  const lock = JSON.parse(readFileSync(lockPath, 'utf8')) as EnginesLock
  const pinned = Object.entries(lock.bundles).filter(([, b]) => b.release)
  if (pinned.length === 0) {
    console.error('engines-release: no bundle is pinned to a release')
    return 2
  }
  const problems = await verifyRelease(lock, httpFetcher)
  if (problems.length === 0) {
    const tags = [...new Set(pinned.map(([, b]) => b.release?.tag))].join(', ')
    console.log(`engines-release: ${pinned.length} pinned bundles match ${tags}`)
    return 0
  }
  console.log(`engines-release: ${problems.length} problem(s)`)
  for (const p of problems) console.log(`  ${p.bundle}: ${p.file} ${p.what}`)
  return 1
}

if (process.argv[1] && /verify-engines-release\.ts$/.test(process.argv[1])) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
