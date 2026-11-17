// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

/** The exit codes of the step that writes dist/404.html, run for real on a tiny fake build. */

const ROOT = path.resolve(__dirname, '../..')
const TSX_LOADER = path.join(ROOT, 'node_modules/tsx/dist/loader.mjs')
const CLI = path.join(ROOT, 'scripts/ci/make-404.ts')

const INDEX =
  '<!doctype html><html><head><title>Home</title><link rel="canonical" href="https://www.pqctoday.com/">' +
  '<script type="module" src="/assets/index-0001.js"></script></head>' +
  '<body><div id="root" data-prerender-state="ready"><h1>Home</h1></div></body></html>'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function run(index: string | null) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'make-404-'))
  dirs.push(cwd)
  if (index !== null) {
    mkdirSync(path.join(cwd, 'dist'))
    writeFileSync(path.join(cwd, 'dist/index.html'), index)
  }
  // Use the loader directly: the tsx CLI creates an IPC broker, which can
  // deadlock inside a synchronous child launched by a forked test worker.
  const r = spawnSync(process.execPath, ['--import', TSX_LOADER, CLI], {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
  })
  const out404 = path.join(cwd, 'dist/404.html')
  return {
    code: r.status,
    out: `${r.stdout ?? ''}${r.stderr ?? ''}${r.error?.message ?? ''}`,
    page: existsSync(out404) ? readFileSync(out404, 'utf8') : null,
    index: index !== null ? readFileSync(path.join(cwd, 'dist/index.html'), 'utf8') : null,
  }
}

describe('make-404: exit codes', () => {
  it('0 and writes a not-found page, leaving index.html alone', () => {
    const r = run(INDEX)
    expect(r.code).toBe(0)
    expect(r.page).toContain('Page not found')
    expect(r.page).toContain('noindex')
    expect(r.page).not.toContain('canonical')
    expect(r.index).toBe(INDEX)
  }, 60_000)

  it('1 and writes nothing when the result would not hold (no #root to start the app from)', () => {
    const r = run(INDEX.replace('id="root"', 'id="app"'))
    expect(r.code).toBe(1)
    expect(r.out).toContain('would not be a valid not-found page')
    expect(r.page).toBeNull()
  }, 60_000)

  it('2 when there is no build output', () => {
    const r = run(null)
    expect(r.code).toBe(2)
    expect(r.out).toContain('run `vite build` first')
  }, 60_000)
})
