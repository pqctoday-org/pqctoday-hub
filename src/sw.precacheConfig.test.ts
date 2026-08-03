// SPDX-License-Identifier: GPL-3.0-only
/**
 * Keeps `vite.config.ts`'s `injectManifest.globIgnores` and `src/sw.ts`'s
 * `IGNORED_CHUNK_RE` in sync (WS3, 2026-08-02).
 *
 * These are two hand-maintained lists describing the same set of chunks. The
 * build uses the first to keep them OUT of the install-time precache; the worker
 * uses the second to route them into the CacheFirst `chunk-cache` instead. Add a
 * pattern to one only and nothing breaks loudly — the chunk still loads over the
 * network — but it silently stops being cached for repeat visits, which is a
 * performance regression no test and no user report would attribute to this.
 *
 * Both files carry a "keep in sync" comment. A comment is not a guard.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const viteConfig = fs.readFileSync(path.join(ROOT, 'vite.config.ts'), 'utf8')
const swSource = fs.readFileSync(path.join(ROOT, 'src', 'sw.ts'), 'utf8')

/** Chunk base names from `globIgnores: [...]` in vite.config.ts. */
function globIgnoreNames(): string[] {
  const block = /globIgnores:\s*\[([\s\S]*?)\]/.exec(viteConfig)
  expect(block, 'globIgnores array not found in vite.config.ts').not.toBeNull()
  return Array.from(block![1].matchAll(/'\*\*\/assets\/([A-Za-z0-9_]+)-\*\.js'/g)).map((m) => m[1])
}

/** Chunk base names from the alternation inside IGNORED_CHUNK_RE in sw.ts. */
function swRegexNames(): string[] {
  const decl = /IGNORED_CHUNK_RE\s*=\s*\n?\s*\/([\s\S]*?)\/\s*$/m.exec(swSource)
  expect(decl, 'IGNORED_CHUNK_RE not found in src/sw.ts').not.toBeNull()
  const group = /\(([A-Za-z0-9_|]+)\)/.exec(decl![1])
  expect(group, 'no alternation group found inside IGNORED_CHUNK_RE').not.toBeNull()
  return group![1].split('|')
}

describe('precache exclusion lists stay in sync', () => {
  it('parses a non-empty list from each side, so a silent parse failure cannot pass', () => {
    // Without this, a regex that stops matching would make both sets empty and
    // the equality assertion below would trivially succeed.
    expect(globIgnoreNames().length).toBeGreaterThan(0)
    expect(swRegexNames().length).toBeGreaterThan(0)
  })

  it('excludes exactly the same chunks in the build config and the worker', () => {
    const fromVite = [...globIgnoreNames()].sort()
    const fromSw = [...swRegexNames()].sort()
    const onlyInVite = fromVite.filter((n) => !fromSw.includes(n))
    const onlyInSw = fromSw.filter((n) => !fromVite.includes(n))
    expect(
      onlyInVite,
      `in vite.config.ts globIgnores but not in sw.ts IGNORED_CHUNK_RE: ${onlyInVite.join(', ')} — ` +
        `these chunks are excluded from the precache but never cached at runtime either`
    ).toEqual([])
    expect(
      onlyInSw,
      `in sw.ts IGNORED_CHUNK_RE but not in vite.config.ts globIgnores: ${onlyInSw.join(', ')} — ` +
        `the worker routes these to chunk-cache but the build still precaches them`
    ).toEqual([])
    expect(fromSw).toEqual(fromVite)
  })
})

describe('precache config invariants', () => {
  it('does not precache wasm, json or png at install', () => {
    // WS3's whole effect. `wasm` back in this glob would restore the 377 MB
    // first-visit download; `json` would restore the 19 MB RAG corpus.
    const glob = /globPatterns:\s*\[([^\]]*)\]/.exec(viteConfig)
    expect(glob).not.toBeNull()
    const patterns = glob![1]
    for (const ext of ['wasm', 'json', 'png']) {
      expect(
        patterns,
        `globPatterns must not precache .${ext} — see the WS3 note above it`
      ).not.toContain(ext)
    }
  })

  it('keeps the 48 MB ceiling, which is JS-bound not WASM-bound', () => {
    // Lowering this after taking WASM out of the glob fails the build on the app
    // chunk (~43 MB). Reducing it is a code-splitting task, not a caching one.
    expect(viteConfig).toContain('maximumFileSizeToCacheInBytes: 48 * 1024 * 1024')
  })

  it('still serves the data cache route the removed includeAssets relied on', () => {
    // rag-corpus.json and compliance-data.json were dropped from includeAssets
    // because this route already covers them. If the route goes, search and the
    // assistant lose their data on a cold visit.
    expect(swSource).toMatch(/\\\/\(data\|dist\)\\\/\.\+\\\.\(json\|csv\)\$/)
  })

  it('wraps every fetch-handler return path in withCOIHeaders', () => {
    // SharedArrayBuffer on GitHub Pages depends on this. A new branch that
    // returns a bare Response silently kills every threaded WASM lab.
    const handler = swSource.slice(swSource.indexOf("addEventListener('fetch'"))
    const returns = handler.match(/return\s+(?!withCOIHeaders)[a-zA-Z]/g) ?? []
    // The only permitted bare returns are the early guard and the 503 fallback.
    expect(
      returns.length,
      `found ${returns.length} return statements in the fetch handler not wrapped in withCOIHeaders`
    ).toBeLessThanOrEqual(2)
  })
})
