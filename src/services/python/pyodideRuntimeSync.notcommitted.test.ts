// SPDX-License-Identifier: GPL-3.0-only
//
// public/pyodide/* is Pyodide's self-hosted runtime — 7 files, 12 MB, copied
// straight out of node_modules/pyodide by `npm run sync:pyodide-runtime`, which
// predev and prebuild both run. package-lock.json already pins the version, so
// the copy carries no information the lockfile does not.
//
// It must stay OUT of git, and this asserts that.
//
// History (2026-09-22, PR #709). It used to be committed, guarded by a test
// asserting the committed copy was byte-identical to the installed package. The
// guard was written for a real defect: a version-mismatched pyodide-lock.json
// crashes Pyodide's own PackageManager constructor on every KMIP/PKCS#11
// Developer-tab Run click — `TypeError: Cannot read properties of undefined
// (reading 'substring')`, caught and shown as a generic "Could not run" with no
// hint the runtime was at fault. But byte-identity against a COMMITTED snapshot
// is unsatisfiable for dependabot: it can bump the package and cannot run a
// `cp` or commit 12 MB of binaries, so every pyodide bump failed 6 of 7
// assertions by construction.
//
// Removing the snapshot removes the failure mode instead of papering over it.
// Nothing in the repo read those files except that guard, and both paths that
// serve them (`npm run dev`, `npm run build`) regenerate them first — so the
// deployed site has always carried the node_modules version, never a stale one.
//
// Do NOT "fix" a future failure here by adding `sync:pyodide-runtime` to CI and
// restoring a byte-identity check: after `npm ci` + sync, that assertion is a
// tautology that always passes and proves nothing. (That WAS the right fix for
// src/data/sbomVersions.generated.ts, which is generated-only with no
// second copy to drift against — the two cases look alike and are not.)
//
// The residual hazard is a build that skips npm lifecycle scripts entirely
// (`npx vite build` rather than `npm run build`), which would serve whatever
// public/pyodide/ happened to be left on disk. That is the same npx-bypass
// class that hid the SBOM drift, and it is not specific to pyodide.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('public/pyodide/ is generated, not committed', () => {
  it('has no files tracked by git', () => {
    // --error-unmatch would throw on a clean path, so list instead: an empty
    // result is the pass. Use -- to keep the pathspec unambiguous.
    const tracked = execFileSync('git', ['ls-files', '--', 'public/pyodide'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    }).trim()

    expect(
      tracked,
      'public/pyodide/* is back in git. It is a 12 MB copy of node_modules/pyodide ' +
        'that predev/prebuild regenerate (`npm run sync:pyodide-runtime`), and committing ' +
        'it is what made every dependabot pyodide bump fail — see the comment at the top ' +
        'of this file. Run `git rm --cached public/pyodide/*`; .gitignore already covers it.'
    ).toBe('')
  })

  it('is still produced by both predev and prebuild', () => {
    // The ignore rule above is only safe while something regenerates the files.
    // If either hook loses the sync step, the Python playground 404s in that
    // mode with nothing to catch it — so pin the wiring here, next to the
    // reason it matters, rather than trusting package.json to stay put.
    // Read the working tree, not `git show HEAD:package.json`: an uncommitted
    // edit that drops the hook is exactly what this should catch.
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      scripts: Record<string, string>
    }

    expect(pkg.scripts.predev).toContain('sync:pyodide-runtime')
    expect(pkg.scripts.prebuild).toContain('sync:pyodide-runtime')
  })
})
