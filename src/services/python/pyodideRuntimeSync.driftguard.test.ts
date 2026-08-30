// SPDX-License-Identifier: GPL-3.0-only
//
// public/pyodide/* is a manual snapshot of node_modules/pyodide's runtime
// files — `npm run sync:pyodide-runtime` copies them, wired into
// predev/prebuild. There is no mechanism forcing that copy to happen (an
// `npm update` that bumps the pyodide package, or a predev skipped for
// speed, leaves it stale silently). A stale copy is not cosmetic: this
// session found live that a version-mismatched pyodide-lock.json crashes
// Pyodide's own PackageManager constructor on every KMIP/PKCS#11 Developer
// tab Run click — `TypeError: Cannot read properties of undefined (reading
// 'substring')`, caught, and shown as a generic "Could not run" with no
// hint the runtime itself was the problem. This asserts byte-identity so
// that drift fails the build instead of a learner's script.
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '../../..')

// Exactly the file list `sync:pyodide-runtime` copies (package.json).
const RUNTIME_FILES = [
  'ffi.d.ts',
  'pyodide-lock.json',
  'pyodide.asm.js',
  'pyodide.asm.wasm',
  'pyodide.d.ts',
  'pyodide.mjs',
  'python_stdlib.zip',
]

const hash = (path: string): string => createHash('sha256').update(readFileSync(path)).digest('hex')

describe('public/pyodide/* matches the pinned node_modules/pyodide package', () => {
  for (const file of RUNTIME_FILES) {
    it(`${file} is byte-identical to node_modules/pyodide/${file}`, () => {
      const pinned = join(REPO_ROOT, 'node_modules/pyodide', file)
      const served = join(REPO_ROOT, 'public/pyodide', file)
      expect(
        hash(served),
        `public/pyodide/${file} does not match node_modules/pyodide/${file} — ` +
          `run \`npm run sync:pyodide-runtime\` (this is what makes Run silently ` +
          `crash on the KMIP/PKCS#11 Developer tabs when it drifts)`
      ).toBe(hash(pinned))
    })
  }
})
