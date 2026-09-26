// SPDX-License-Identifier: GPL-3.0-only
/**
 * ZERO-MATCH POSITIONAL FILTER MUST FAIL — proven against the real CLI.
 *
 * WHY
 * ---
 * Several npm scripts hand vitest POSITIONAL path filters:
 *   • `gate:pkcs11`  -> `npm run test -- <6 paths>` && `npm run test:local -- <2 paths>`
 *   • `test:local:cacp` -> `vitest run --config vitest.local.config.ts <2 paths>`
 * `vitest.local.config.ts` includes ONLY `**\/*.local.test.{ts,tsx}`, so a plain
 * `*.test.ts` path handed to `test:local` resolves to NOTHING. If that exits 0,
 * the command reports an honest-looking "0 failures" for a file it never loaded.
 * That shape produced two false "0 failures" readings on 2026-09-26.
 *
 * MEASURED, not assumed: on the vitest version pinned today (5.0.1) `vitest run`
 * ALREADY exits 1 on a zero-match filter ("No test files found, exiting with
 * code 1") — verified by hand before writing this. So the behaviour is currently
 * correct and this file is a REGRESSION guard, not a bug fix: the guarantee rests
 * entirely on a default (`passWithNoTests`) that a config edit or a version bump
 * could flip without anyone noticing, and the two configs did not state it. Note
 * `vitest list --filesOnly` exits 0 on a zero match either way — it is a
 * different tool and is not a safe stand-in for this check.
 *
 * WHAT IS PINNED
 * --------------
 * vitest's own mechanism, inverted: `passWithNoTests: false` (its default, now
 * written down explicitly in BOTH configs so it cannot be inherited away).
 * A config assertion alone would be circular, so the CLI is actually spawned
 * here, in both directions:
 *   direction 1 — a filter matching nothing         => exit != 0
 *   direction 2 — a filter matching a real file     => exit 0 and it really ran
 * Direction 2 is not decoration: an "everything fails" misconfiguration would
 * satisfy direction 1 on its own, which is exactly the vacuous-green failure
 * mode this file exists to rule out.
 *
 * Venue: a plain `*.test.ts` under the DEFAULT vitest include with no positional
 * filter in front of it, so `ci:test` (and `gate:local`'s `npm run test`) run it.
 */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

// Read as TEXT, not imported: `import baseConfig from '../../vite.config'`
// pulls esbuild into the jsdom test environment, where it hard-fails on its own
// `new TextEncoder().encode('') instanceof Uint8Array` invariant. The real
// behavioural proof is the two CLI spawns below; these are the fast tripwire
// that the guarantee is still written down where a reader will find it.
function configText(file: string): string {
  return readFileSync(path.join(ROOT, file), 'utf8')
}

/** A path no test file can live under — the zero-match probe. */
const NO_MATCH_FILTER = 'src/__zero_match_probe__/nothing-lives-here'
/** A real, cheap `*.local.test.ts` — the positive control. */
const MATCHING_FILTER = 'src/data/libraryCategoryVocabulary.local.test.ts'

/** vitest's reporter emits dim/reset SGR codes even under FORCE_COLOR=0, and they
 *  land INSIDE the summary lines ("Test Files\x1b[2m  \x1b[22m1 passed"), so a
 *  naive regex over the raw output silently never matches. Strip them first. */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex -- stripping SGR escape sequences is the point
  return s.replace(/\u001b\[[0-9;]*m/g, '')
}

function runVitest(args: string[]): { status: number | null; output: string } {
  const res = spawnSync('npx', ['vitest', 'run', ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1', CI: '' },
  })
  return { status: res.status, output: stripAnsi(`${res.stdout ?? ''}${res.stderr ?? ''}`) }
}

// Spawning the real CLI twice costs a few seconds; the whole point is that this
// is not re-implemented filter semantics.
const SPAWN_TIMEOUT = 120_000

describe('vitest configs pin the zero-match guarantee', () => {
  it('vitest.local.config.ts sets passWithNoTests: false', () => {
    expect(configText('vitest.local.config.ts')).toMatch(/passWithNoTests:\s*false/)
  })

  it('vite.config.ts (the default config) sets passWithNoTests: false', () => {
    expect(configText('vite.config.ts')).toMatch(/passWithNoTests:\s*false/)
  })

  it('neither config ever opts back IN to passing with no tests', () => {
    for (const file of ['vite.config.ts', 'vitest.local.config.ts']) {
      expect(configText(file), `${file} must not set passWithNoTests: true`).not.toMatch(
        /passWithNoTests:\s*true/
      )
    }
  })

  it('vitest.local.config.ts still only includes the *.local.test.* tier', () => {
    // The premise of the trap. If this ever widens, the note in the configs
    // about WHY the guarantee matters needs revisiting rather than deleting.
    expect(configText('vitest.local.config.ts')).toMatch(
      /include:\s*\['\*\*\/\*\.local\.test\.\{ts,tsx\}'\]/
    )
  })
})

describe('test:local — the real CLI, both directions', () => {
  it(
    'FAILS (non-zero) when its positional filter resolves zero files',
    () => {
      const { status, output } = runVitest(['--config', 'vitest.local.config.ts', NO_MATCH_FILTER])
      expect(status, `expected a non-zero exit; got ${status}. Output:\n${output}`).not.toBe(0)
      expect(output).toMatch(/No test files found/i)
    },
    SPAWN_TIMEOUT
  )

  it(
    'still PASSES (zero) when its positional filter resolves a real file, and really runs it',
    () => {
      const { status, output } = runVitest(['--config', 'vitest.local.config.ts', MATCHING_FILTER])
      expect(status, `expected exit 0; got ${status}. Output:\n${output}`).toBe(0)
      // Not just "exit 0": tests were actually executed. Otherwise a broken
      // filter that resolved nothing AND exited 0 would slip through here.
      expect(output).toMatch(/Test Files\s+1 passed/i)
    },
    SPAWN_TIMEOUT
  )
})
