// WS-G G-6 sabotage test: `import:native-conformance:check` must FAIL when a
// copy of the committed generated file is edited — a hand-changed count, a
// flipped case status, or a changed engine commit — and pass on an unedited
// copy. The committed file itself is never touched (the check is pointed at
// a temp copy with --file). Needs the sibling pqctoday-hsm checkout holding
// the pinned commit; skipped otherwise (e.g. CI, which clones only the hub).
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'

const ROOT = process.cwd()
const HSM = process.env.HSM_REPO_PATH ?? resolve(ROOT, '..', 'pqctoday-hsm')
const SCRIPT = join(ROOT, 'scripts/import-native-conformance.ts')
const COMMITTED = join(ROOT, 'src/data/validation/native-conformance.generated.json')
const PIN = /PINNED_HSM_COMMIT = '([0-9a-f]{40})'/.exec(readFileSync(SCRIPT, 'utf8'))![1]

const hsmHasPin = (() => {
  try {
    execFileSync('git', ['-C', HSM, 'cat-file', '-e', `${PIN}^{commit}`], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

const dir = mkdtempSync(join(tmpdir(), 'native-conformance-sabotage-'))
afterAll(() => rmSync(dir, { recursive: true, force: true }))

const runCheck = (file: string): { code: number; out: string } => {
  try {
    const out = execFileSync(
      join(ROOT, 'node_modules/.bin/tsx'),
      [SCRIPT, '--check', '--file', file],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    )
    return { code: 0, out }
  } catch (e) {
    const err = e as { status: number; stdout: string; stderr: string }
    return { code: err.status, out: `${err.stdout}${err.stderr}` }
  }
}

const sabotaged = (name: string, edit: (text: string) => string): string => {
  const p = join(dir, name)
  copyFileSync(COMMITTED, p)
  const before = readFileSync(p, 'utf8')
  const after = edit(before)
  expect(after, `${name}: the sabotage edit must change the copy`).not.toBe(before)
  writeFileSync(p, after)
  return p
}

describe.skipIf(!hsmHasPin)('import:native-conformance:check (sabotage)', () => {
  it('passes on an unedited copy of the committed file', () => {
    const p = join(dir, 'clean.json')
    copyFileSync(COMMITTED, p)
    const r = runCheck(p)
    expect(r.code, r.out).toBe(0)
  }, 60_000)

  it('fails when a suite count is hand-edited', () => {
    const r = runCheck(
      sabotaged('count.json', (t) =>
        t.replace(/"pass": (\d+)/, (_m, n: string) => `"pass": ${Number(n) + 1}`)
      )
    )
    expect(r.code, r.out).toBe(1)
    expect(r.out).toMatch(/STALE or hand-edited/)
  }, 60_000)

  it('fails when one case status is flipped', () => {
    const r = runCheck(
      sabotaged('case.json', (t) => t.replace(/(\["[^"]+", )"pass"\]/, '$1"fail"]'))
    )
    expect(r.code, r.out).toBe(1)
  }, 60_000)

  it('fails when an engine commit is changed', () => {
    const r = runCheck(
      sabotaged('commit.json', (t) =>
        t.replace(/"engineCommit": "([0-9a-f])/, (_m, c: string) =>
          `"engineCommit": "${c === '0' ? '1' : '0'}`
        )
      )
    )
    expect(r.code, r.out).toBe(1)
  }, 60_000)
})
