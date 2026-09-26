// SPDX-License-Identifier: GPL-3.0-only
// Historical replay of the wasm staleness check against REAL pqctoday-hsm
// commits (local tier: needs a sibling ../pqctoday-hsm with full history).
//
// Each case is one commit C, judged over C^..C for one bundle: would the check
// have called that bundle stale? The expected verdicts were measured on
// 2026-09-26 by reading what each commit actually touched, and the OLD verdicts
// (hand-written `sourceDirs`) are asserted too, so this proves the change in
// behaviour rather than only the new behaviour.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DOC_ONLY_EXCLUDES,
  cargoBundlePaths,
  commitsTouching,
  deriveCargoInputs,
  gitCargoIo,
} from './wasm-build-inputs'

const ROOT = path.resolve(__dirname, '../..')
const HSM = process.env.HSM_REPO_PATH ?? path.resolve(ROOT, '..', 'pqctoday-hsm')
const hasHsm = existsSync(path.join(HSM, '.git'))

// This file runs inside .husky/pre-push (test:local), where git exports GIT_DIR
// and friends to the hook — and those override `-C`, silently pointing every
// command at the HUB repo (the same trap check-wasm-provenance.ts documents).
// Strip them so the replay really reads hsm.
const env = { ...process.env }
for (const k of Object.keys(env)) if (k.startsWith('GIT_')) delete env[k]
const git = (...a: string[]) =>
  execFileSync('git', ['-C', HSM, ...a], { encoding: 'utf8', maxBuffer: 1 << 28, env }).trim()

type B = {
  name: string
  sourceDirs: string[]
  cargoManifest?: string
  buildScript?: string
  extraInputs?: string[]
}
const bundles = (
  JSON.parse(readFileSync(path.join(ROOT, 'public/wasm/wasm-provenance.json'), 'utf8')) as {
    bundles: B[]
  }
).bundles
const bundle = (n: string) => bundles.find((b) => b.name === n)!

const oldVerdict = (c: string, b: B) =>
  git('rev-list', `${c}^..${c}`, '--', ...b.sourceDirs, ...DOC_ONLY_EXCLUDES)
    .split('\n')
    .filter(Boolean).length > 0
const newVerdict = (c: string, b: B) => {
  const d = deriveCargoInputs(b.cargoManifest!, gitCargoIo(git, c))
  return commitsTouching(git, `${c}^`, c, cargoBundlePaths(b, d), d.includes).size > 0
}

describe.skipIf(!hasHsm)('wasm staleness — replayed against real hsm history', () => {
  const cases: { commit: string; bundle: string; old: boolean; now: boolean; why: string }[] = [
    {
      commit: '88b1dfb1',
      bundle: 'cacp-kmip',
      old: false,
      now: true,
      why: 'THE MISS: the HPKE C_DeriveKey fix touched only rust/src/ffi.rs, which wasm/Cargo.toml links through ../rust — the KMIP bundle shipped the old engine while reporting current',
    },
    {
      commit: 'dcf1b0c02',
      bundle: 'cacp-kmip',
      old: true,
      now: false,
      why: 'false alarm: a release commit touching only reports, a changelog, committed wasm output and a test script',
    },
    {
      commit: 'dc9c0a838',
      bundle: 'softhsmrustv3-engine',
      old: true,
      now: false,
      why: 'false alarm: committing the built rust/pkg_bundler wasm back to hsm is output, not input',
    },
    {
      commit: 'ca2a43ee',
      bundle: 'softhsmrustv3-engine',
      old: true,
      now: false,
      why: 'false alarm: rust/bench-harness is a workspace member no bundle links',
    },
    {
      commit: '88b1dfb1',
      bundle: 'softhsmrustv3-engine',
      old: true,
      now: true,
      why: 'positive control: a real engine source change is still stale for the engine bundle',
    },
    {
      commit: '131188c3',
      bundle: 'cacp-kmip',
      old: false,
      now: false,
      why: 'docs-only (kmip/docs/*.md): already current under the doc-only excludes, and still current',
    },
  ]
  for (const c of cases) {
    it(`${c.commit} × ${c.bundle}: old ${c.old ? 'STALE' : 'current'} -> now ${c.now ? 'STALE' : 'current'} — ${c.why}`, () => {
      const b = bundle(c.bundle)
      expect(oldVerdict(c.commit, b)).toBe(c.old)
      expect(newVerdict(c.commit, b)).toBe(c.now)
    })
  }
})
