// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  readdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { MANIFEST_NAME, retainLiveAssets } from './retain-live-boot-assets'

/**
 * The previous-release retention step, run against a fake "live" site on 127.0.0.1.
 * Names follow the real shape `<name>-<8 chars>.<ext>` so the reference crawl can
 * find them.
 */

const A = 'assets/Alpha-aaaaaaaa.js'
const B = 'assets/Beta-bbbbbbbb.js'
const C = 'assets/Gamma-cccccccc.js'
const D = 'assets/Delta-dddddddd.js'
const E = 'assets/Eps-eeeeeeee.js'

interface Reply {
  status?: number
  type?: string
  body: string | Buffer
}

const dirs: string[] = []
const servers: Server[] = []

afterEach(async () => {
  for (const s of servers.splice(0)) await new Promise((r) => s.close(r))
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function tmp(): string {
  const d = mkdtempSync(path.join(tmpdir(), 'retain-assets-'))
  dirs.push(d)
  return d
}

/** A static "live" site: URL path (no query) -> reply. Unknown paths get GitHub Pages' HTML 404. */
async function liveSite(files: Record<string, Reply>): Promise<{ url: string; hits: string[] }> {
  const hits: string[] = []
  const server = createServer((req, res) => {
    const p = (req.url ?? '/').split('?')[0]!
    hits.push(p)
    const f = files[p]
    if (!f) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' })
      res.end('<!doctype html><html><body>404 File not found</body></html>')
      return
    }
    res.writeHead(f.status ?? 200, { 'content-type': f.type ?? 'application/javascript' })
    res.end(f.body)
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  servers.push(server)
  return { url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, hits }
}

/** A built dist/ with the given files under assets/. */
function makeDist(names: string[], content: (n: string) => string = (n) => `// ${n}\n`): string {
  const dist = tmp()
  mkdirSync(path.join(dist, 'assets'), { recursive: true })
  writeFileSync(path.join(dist, 'index.html'), '<!doctype html><html></html>')
  for (const n of names) writeFileSync(path.join(dist, n), content(n))
  return dist
}

const quiet = () => {}
const js = (n: string) => `// ${n}\n`

/** A live site that serves a given dist as it would be deployed. */
async function serveDist(dist: string, extra: Record<string, Reply> = {}) {
  const files: Record<string, Reply> = { ...extra }
  const walk = (dir: string, rel: string) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) walk(path.join(dir, e.name), r)
      else {
        const type = e.name.endsWith('.json')
          ? 'application/json'
          : e.name.endsWith('.html')
            ? 'text/html'
            : 'application/javascript'
        files[`/${r}`] = { type, body: readFileSync(path.join(dir, e.name)) }
      }
    }
  }
  walk(dist, '')
  return liveSite(files)
}

const swFor = (names: string[]) =>
  `precacheAndRoute([${names.map((n) => `{url:"/${n}",revision:null}`).join(',')}])`

describe('retain-live-boot-assets: one release back', () => {
  it('carries the previous release files the new build lacks, and writes the list', async () => {
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, B, C], carried: [] }),
      },
      '/sw.js': { body: swFor([B]) },
      [`/${A}`]: { body: js(A) },
      [`/${B}`]: { body: js(B) },
      [`/${C}`]: { body: js(C) },
    })
    const dist = makeDist([B, D])

    const r = await retainLiveAssets({ site: live.url, dist, log: quiet })

    expect(r.source).toBe('manifest')
    expect(r.carried).toEqual([A, C])
    expect(readFileSync(path.join(dist, A), 'utf8')).toBe(js(A))
    expect(readFileSync(path.join(dist, C), 'utf8')).toBe(js(C))
    // B is in the new build already: it is neither fetched nor listed as carried.
    expect(live.hits).not.toContain(`/${B}`)
    const manifest = JSON.parse(readFileSync(path.join(dist, MANIFEST_NAME), 'utf8'))
    expect(manifest).toEqual({ schema: 1, built: [B, D], carried: [A, C] })
  })

  it('drops files that are two releases old on the next round', async () => {
    // Round 1: live has A, B, C. New build has B, D -> carries A and C.
    const live1 = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, B, C], carried: [] }),
      },
      [`/${A}`]: { body: js(A) },
      [`/${B}`]: { body: js(B) },
      [`/${C}`]: { body: js(C) },
    })
    const dist1 = makeDist([B, D])
    await retainLiveAssets({ site: live1.url, dist: dist1, log: quiet })
    expect(existsSync(path.join(dist1, A))).toBe(true)

    // Round 2: the live site is now dist1 (B, D built; A, C carried). The next build has D, E.
    const live2 = await serveDist(dist1)
    const dist2 = makeDist([D, E])
    const r2 = await retainLiveAssets({ site: live2.url, dist: dist2, log: quiet })

    expect(r2.carried).toEqual([B]) // the previous release's own file
    expect(existsSync(path.join(dist2, A))).toBe(false) // carried last time, now dropped
    expect(existsSync(path.join(dist2, C))).toBe(false)
    expect(live2.hits).not.toContain(`/${A}`)
    const manifest = JSON.parse(readFileSync(path.join(dist2, MANIFEST_NAME), 'utf8'))
    expect(manifest).toEqual({ schema: 1, built: [D, E], carried: [B] })
  })

  it('is idempotent: a second run on the same dist keeps built and carried apart', async () => {
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, B], carried: [] }),
      },
      [`/${A}`]: { body: js(A) },
      [`/${B}`]: { body: js(B) },
    })
    const dist = makeDist([B, D])
    await retainLiveAssets({ site: live.url, dist, log: quiet })
    await retainLiveAssets({ site: live.url, dist, log: quiet })
    const manifest = JSON.parse(readFileSync(path.join(dist, MANIFEST_NAME), 'utf8'))
    expect(manifest.built).toEqual([B, D])
    expect(manifest.carried).toEqual([A])
  })

  it('first run: finds the previous release by following references from the live page', async () => {
    const entry = 'assets/index-11111111.js'
    const lazy = 'assets/Lazy-22222222.js'
    const deep = 'assets/Deep-33333333.js'
    const sheet = 'assets/index-44444444.css'
    const font = 'assets/font-55555555.woff2'
    const orphan = 'assets/Orphan-66666666.js'
    const live = await liveSite({
      '/': {
        type: 'text/html',
        body: `<!doctype html><html><head><script type="module" src="/${entry}"></script><link rel="stylesheet" href="/${sheet}"></head></html>`,
      },
      '/sw.js': { body: swFor([entry]) },
      [`/${entry}`]: {
        body: `const m=["${lazy}","${sheet}"];import("./${deep}")`,
      },
      [`/${lazy}`]: { body: 'export default 1' },
      [`/${deep}`]: { body: 'export default 2' },
      [`/${sheet}`]: { type: 'text/css', body: `@font-face{src:url(/${font})}` },
      [`/${font}`]: { type: 'font/woff2', body: Buffer.from([0, 1, 2, 3]) },
      [`/${orphan}`]: { body: 'never referenced' },
    })
    // The new build kept `lazy` (same name, same bytes) and has a new entry.
    const dist = makeDist(['assets/index-77777777.js', lazy], (n) =>
      n === lazy ? 'export default 1' : '// new'
    )

    const r = await retainLiveAssets({ site: live.url, dist, log: quiet })

    expect(r.source).toBe('crawl')
    expect([...r.carried].sort()).toEqual([deep, entry, font, sheet].sort())
    expect(existsSync(path.join(dist, orphan))).toBe(false)
    expect(live.hits).not.toContain(`/${lazy}`) // kept by the new build: scanned locally
    expect(readFileSync(path.join(dist, font))).toEqual(Buffer.from([0, 1, 2, 3]))
  })

  it('does not write anything in a dry run, and reports what it would carry', async () => {
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, B], carried: [] }),
      },
      [`/${A}`]: { body: js(A) },
    })
    const dist = makeDist([B])
    const r = await retainLiveAssets({ site: live.url, dist, dryRun: true, log: quiet })
    expect(r.carried).toEqual([A])
    expect(r.carriedBytes).toBe(js(A).length)
    expect(existsSync(path.join(dist, A))).toBe(false)
    expect(existsSync(path.join(dist, MANIFEST_NAME))).toBe(false)
  })
})

describe('retain-live-boot-assets: failure paths (fail open)', () => {
  it('does not throw when the live site is unreachable, and still writes the build list', async () => {
    const dist = makeDist([B, D])
    // A port nothing listens on.
    const r = await retainLiveAssets({ site: 'http://127.0.0.1:9', dist, log: quiet })
    expect(r.carried).toEqual([])
    const manifest = JSON.parse(readFileSync(path.join(dist, MANIFEST_NAME), 'utf8'))
    expect(manifest).toEqual({ schema: 1, built: [B, D], carried: [] })
  })

  it('skips a file the live site answers 404 for and still carries the others', async () => {
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, C], carried: [] }),
      },
      [`/${C}`]: { body: js(C) }, // A is missing: GitHub Pages' HTML 404
    })
    const dist = makeDist([B])
    const r = await retainLiveAssets({ site: live.url, dist, log: quiet })
    expect(r.carried).toEqual([C])
    expect(r.skipped).toEqual([A])
    expect(existsSync(path.join(dist, A))).toBe(false)
  })

  it('rejects HTML served where a script is expected (by content type and by body)', async () => {
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, B, C], carried: [] }),
      },
      // 200 with an HTML content type (a captive portal or an SPA fallback)
      [`/${A}`]: { type: 'text/html; charset=utf-8', body: '<!doctype html><html></html>' },
      // 200 with a script content type but an HTML body
      [`/${B}`]: { type: 'application/javascript', body: '  <!DOCTYPE html><html>oops</html>' },
      // an empty answer
      [`/${C}`]: { body: '' },
    })
    const dist = makeDist([D])
    const r = await retainLiveAssets({ site: live.url, dist, log: quiet })
    expect(r.carried).toEqual([])
    expect(r.skipped.sort()).toEqual([A, B, C])
    for (const n of [A, B, C]) expect(existsSync(path.join(dist, n))).toBe(false)
  })

  it('ignores listed names that are not plain files under assets/', async () => {
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({
          schema: 1,
          built: [
            '../outside.js',
            'assets/../up-aaaaaaaa.js',
            'assets/sub/x-aaaaaaaa.js',
            'index.html',
            A,
          ],
          carried: [],
        }),
      },
      [`/${A}`]: { body: js(A) },
    })
    const dist = makeDist([B])
    const r = await retainLiveAssets({ site: live.url, dist, log: quiet })
    expect(r.carried).toEqual([A])
    expect(live.hits.filter((h) => h.includes('..') || h.includes('sub/'))).toEqual([])
  })

  it('falls back to the references when the live list is not valid JSON', async () => {
    const entry = 'assets/index-11111111.js'
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: { type: 'application/json', body: '{not json' },
      '/': {
        type: 'text/html',
        body: `<!doctype html><html><script type="module" src="/${entry}"></script></html>`,
      },
      [`/${entry}`]: { body: 'export {}' },
    })
    const dist = makeDist([B])
    const r = await retainLiveAssets({ site: live.url, dist, log: quiet })
    expect(r.source).toBe('crawl')
    expect(r.carried).toEqual([entry])
  })
})

describe('retain-live-boot-assets: transient errors', () => {
  it('retries once after a 503 and carries the file', async () => {
    let calls = 0
    const server = createServer((req, res) => {
      const p = (req.url ?? '/').split('?')[0]!
      if (p === `/${MANIFEST_NAME}`) {
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ schema: 1, built: [A], carried: [] }))
      } else if (p === `/${A}`) {
        calls++
        if (calls === 1) {
          res.writeHead(503, { 'content-type': 'text/html' })
          res.end('<html>busy</html>')
        } else {
          res.writeHead(200, { 'content-type': 'application/javascript' })
          res.end(js(A))
        }
      } else {
        res.writeHead(404, { 'content-type': 'text/html' })
        res.end('<!doctype html><html></html>')
      }
    })
    await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
    servers.push(server)
    const dist = makeDist([B])
    const r = await retainLiveAssets({
      site: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
      dist,
      log: quiet,
    })
    expect(r.carried).toEqual([A])
    expect(calls).toBe(2)
  })
})

describe('retain-live-boot-assets: size bound', () => {
  it('stops at the limit, keeping the boot chunks first', async () => {
    const big = (n: string) => n + 'x'.repeat(1000)
    const live = await liveSite({
      [`/${MANIFEST_NAME}`]: {
        type: 'application/json',
        body: JSON.stringify({ schema: 1, built: [A, B, C], carried: [] }),
      },
      '/sw.js': { body: swFor([C]) }, // C is the boot chunk
      [`/${A}`]: { body: big(A) },
      [`/${B}`]: { body: big(B) },
      [`/${C}`]: { body: big(C) },
    })
    const dist = makeDist([D])
    const r = await retainLiveAssets({
      site: live.url,
      dist,
      maxBytes: 1500, // room for one file
      log: quiet,
    })
    expect(r.stoppedAtLimit).toBe(true)
    expect(r.carried).toEqual([C])
    expect(r.carriedBytes).toBeLessThanOrEqual(1500)
    expect(existsSync(path.join(dist, A))).toBe(false)
  })
})
