// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

/** The step that saves a page for each alias address, run for real on a tiny fake build. */

const ROOT = path.resolve(__dirname, '../..')
const TSX_LOADER = path.join(ROOT, 'node_modules/tsx/dist/loader.mjs')
const CLI = path.join(ROOT, 'scripts/ci/make-aliases.ts')

const CACP =
  '<!doctype html><html><head><title>Lab</title>' +
  '<link rel="canonical" href="https://www.pqctoday.com/playground/cacp">' +
  '<script type="module" src="/assets/index-0001.js"></script></head>' +
  '<body><div id="root"><main><h1>Lab</h1></main></div></body></html>'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

function run(cacpPage: string | null) {
  const cwd = mkdtempSync(path.join(tmpdir(), 'make-aliases-'))
  dirs.push(cwd)
  if (cacpPage !== null) {
    mkdirSync(path.join(cwd, 'dist/playground/cacp'), { recursive: true })
    writeFileSync(path.join(cwd, 'dist/playground/cacp/index.html'), cacpPage)
  }
  const r = spawnSync(process.execPath, ['--import', TSX_LOADER, CLI], {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
  })
  const read = (file: string) =>
    existsSync(path.join(cwd, file)) ? readFileSync(path.join(cwd, file), 'utf8') : null
  return {
    code: r.status,
    out: `${r.stdout ?? ''}${r.stderr ?? ''}${r.error?.message ?? ''}`,
    dir: read('dist/playground/cacp-kmip/index.html'),
    flat: read('dist/playground/cacp-kmip.html'),
  }
}

describe('make-aliases: exit codes', () => {
  it('0 and saves the cacp page under cacp-kmip, both as a folder page and as a flat page', () => {
    const r = run(CACP)
    expect(r.code).toBe(0)
    expect(r.dir).toBe(CACP)
    expect(r.flat).toBe(CACP)
  }, 60_000)

  it('1 and writes nothing when the target page names another canonical', () => {
    const r = run(CACP.replace('/playground/cacp"', '/playground/other"'))
    expect(r.code).toBe(1)
    expect(r.dir).toBeNull()
    expect(r.flat).toBeNull()
  }, 60_000)

  it('1 when the target page was not saved', () => {
    const r = run(null)
    expect(r.code).toBe(1)
    expect(r.out).toContain('run the prerender step first')
  }, 60_000)
})
