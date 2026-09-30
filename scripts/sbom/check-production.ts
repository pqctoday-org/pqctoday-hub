// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-production — compare the SBOM this checkout would publish with what
 * https://www.pqctoday.com is serving right now. Manual / release-time (it needs
 * the network, so it is not part of gate:local).
 *
 *   npx tsx scripts/sbom/check-production.ts [--base=https://www.pqctoday.com]
 *
 * Two questions, both about the deployed site:
 *   1. Does production serve byte-identical wasm to public/wasm? If yes, the
 *      binary scan the generator did is a scan of production.
 *   2. Does the deployed About chunk carry this build's SBOM data (the embedded
 *      OpenSSL / strongSwan / BUILDINFO versions and the build commits)? If not,
 *      the live page is older than the data — the state that hid every error
 *      found on 2026-09-29.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SBOM_BUILDS, SBOM_EMBEDDED_VERSIONS } from '../../src/data/sbomVersions.generated'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const BASE = (
  process.argv.find((a) => a.startsWith('--base='))?.slice('--base='.length) ??
  'https://www.pqctoday.com'
).replace(/\/$/, '')

const problems: string[] = []
const get = async (path: string) => {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

function wasmFiles(dir: string, out: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n)
    if (statSync(p).isDirectory()) wasmFiles(p, out)
    else if (n.endsWith('.wasm')) out.push(p)
  }
  return out
}

for (const f of wasmFiles(join(ROOT, 'public', 'wasm')).sort()) {
  const rel = relative(join(ROOT, 'public'), f)
  const local = createHash('sha256').update(readFileSync(f)).digest('hex')
  try {
    const live = createHash('sha256')
      .update(await get(`/${rel}`))
      .digest('hex')
    if (live !== local)
      problems.push(
        `${rel}: production sha256 ${live.slice(0, 12)}… != checkout ${local.slice(0, 12)}…`
      )
  } catch (e) {
    problems.push(`${rel}: ${(e as Error).message}`)
  }
}

// Find the deployed About chunk. It is lazy-loaded, so no single chunk names it
// reliably: walk the chunk graph from the entry (breadth-first, a few requests at a time).
async function findAboutChunk(entry: string): Promise<string | undefined> {
  const seen = new Set<string>([entry.replace('/assets/', '')])
  let frontier = [...seen]
  while (frontier.length) {
    const next: string[] = []
    for (let i = 0; i < frontier.length; i += 12) {
      const texts = await Promise.all(
        frontier.slice(i, i + 12).map(async (n) => (await get(`/assets/${n}`)).toString('latin1'))
      )
      for (const t of texts) {
        const about = /AboutView-[A-Za-z0-9_-]+\.js/.exec(t)?.[0]
        if (about) return about
        for (const m of t.matchAll(/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]{8}\.js/g))
          if (!seen.has(m[0])) {
            seen.add(m[0])
            next.push(m[0])
          }
      }
    }
    frontier = next
  }
  return undefined
}

try {
  const html = (await get('/')).toString('utf8')
  const entry = /\/assets\/index-[A-Za-z0-9_-]+\.js/.exec(html)?.[0]
  if (!entry) throw new Error('no entry chunk in index.html')
  const chunkName = await findAboutChunk(entry)
  if (!chunkName) throw new Error('no AboutView chunk reachable from the entry chunk')
  const about = (await get(`/assets/${chunkName}`)).toString('utf8')
  const needles = [
    ...Object.entries(SBOM_EMBEDDED_VERSIONS).map(([k, v]) => [`embedded ${k} ${v}`, v] as const),
    ...Object.entries(SBOM_BUILDS)
      .filter(([, b]) => b.commit)
      .map(([k, b]) => [`build commit for ${k}`, b.commit!.slice(0, 8)] as const),
  ]
  for (const [what, needle] of needles)
    if (!about.includes(needle))
      problems.push(`live About chunk (${chunkName}) does not carry ${what} ("${needle}")`)
} catch (e) {
  problems.push(`About chunk: ${(e as Error).message}`)
}

if (problems.length) {
  console.error(`✗ production differs from this checkout's SBOM (${problems.length}):`)
  for (const p of problems) console.error(`   ${p}`)
  process.exit(1)
}
console.log(`✓ ${BASE} serves the wasm and SBOM data this checkout describes`)
