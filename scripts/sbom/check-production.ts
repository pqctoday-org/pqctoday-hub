// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-production — compare the SBOM this checkout would publish with what
 * https://www.pqctoday.com is serving right now.
 *
 *   npx tsx scripts/sbom/check-production.ts [--base=https://www.pqctoday.com] [--wait=12]
 *
 * By default one attempt. With --wait=<minutes> it retries every 30 s until the live site matches
 * or the time is up: GitHub's edge can serve the previous build for several minutes after a
 * deploy, so the post-deploy job in .github/workflows/deploy.yml waits.
 *
 * Three questions, all about the deployed site:
 *   1. Does production serve byte-identical wasm to public/wasm? If yes, the binary scan the
 *      generator did is a scan of production.
 *   2. Does it serve exactly the complete SBOM file this checkout generated
 *      (public/data/pqctoday-sbom.cdx.json)?
 *   3. Does the deployed About chunk carry this build's SBOM data (embedded versions and build
 *      commits)? If not, the live page is older than the data — the state that hid every error
 *      found on 2026-09-29.
 */
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SBOM_BUILDS, SBOM_EMBEDDED_VERSIONS } from '../../src/data/sbomVersions.generated'
import { findAboutChunk } from './chunk-graph'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const arg = (name: string) =>
  process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3)
const BASE = (arg('base') ?? 'https://www.pqctoday.com').replace(/\/$/, '')
const WAIT_MINUTES = Number(arg('wait') ?? 0)

const sha = (b: Buffer) => createHash('sha256').update(b).digest('hex')
const get = async (path: string) => {
  const res = await fetch(`${BASE}${path}`, { headers: { 'cache-control': 'no-cache' } })
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

// The About chunk is lazy-loaded, so no single chunk names it reliably: walk the chunk graph from
// the entry (see chunk-graph.ts for what counts as a chunk reference and how an unreachable
// candidate is handled). A chunk that cannot be fetched is only a problem if it stops the walk
// reaching About, in which case it is named in the failure.
async function findAbout(entry: string): Promise<string> {
  const { about, unreachable } = await findAboutChunk(entry, async (name) =>
    (await get(`/assets/${name}`)).toString('latin1')
  )
  if (about) return about
  const why = unreachable.length
    ? ` (${unreachable.length} referenced chunk(s) did not load: ${unreachable
        .slice(0, 5)
        .map((u) => u.reason)
        .join('; ')})`
    : ''
  throw new Error(`no AboutView chunk reachable from the entry chunk${why}`)
}

async function checkOnce(): Promise<string[]> {
  const problems: string[] = []

  for (const f of wasmFiles(join(ROOT, 'public', 'wasm')).sort()) {
    const rel = relative(join(ROOT, 'public'), f)
    try {
      const live = sha(await get(`/${rel}`))
      const local = sha(readFileSync(f))
      if (live !== local)
        problems.push(
          `${rel}: production sha256 ${live.slice(0, 12)}… != checkout ${local.slice(0, 12)}…`
        )
    } catch (e) {
      problems.push(`${rel}: ${(e as Error).message}`)
    }
  }

  try {
    const live = sha(await get('/data/pqctoday-sbom.cdx.json'))
    const local = sha(readFileSync(join(ROOT, 'public', 'data', 'pqctoday-sbom.cdx.json')))
    if (live !== local)
      problems.push(
        `data/pqctoday-sbom.cdx.json: production ${live.slice(0, 12)}… != checkout ${local.slice(0, 12)}…`
      )
  } catch (e) {
    problems.push(`data/pqctoday-sbom.cdx.json: ${(e as Error).message}`)
  }

  try {
    const html = (await get('/')).toString('utf8')
    const entry = /\/assets\/index-[A-Za-z0-9_-]+\.js/.exec(html)?.[0]
    if (!entry) throw new Error('no entry chunk in index.html')
    const chunkName = await findAbout(entry)
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
  return problems
}

const deadline = Date.now() + WAIT_MINUTES * 60_000
let problems = await checkOnce()
while (problems.length && Date.now() < deadline) {
  console.log(`… ${problems.length} difference(s); waiting for the deploy to propagate`)
  await new Promise((r) => setTimeout(r, 30_000))
  problems = await checkOnce()
}

if (problems.length) {
  console.error(`✗ production differs from this checkout's SBOM (${problems.length}):`)
  for (const p of problems) console.error(`   ${p}`)
  process.exit(1)
}
console.log(`✓ ${BASE} serves the wasm, complete SBOM file and About data this checkout describes`)
