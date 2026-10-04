// SPDX-License-Identifier: GPL-3.0-only
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as stateful from '@/wasm/softhsm/stateful'
import * as pqc from '@/wasm/softhsm/pqc'

/**
 * Loading the pqc module with import() makes the production bundler copy everything it re-exports
 * into a namespace object, as plain values taken at that moment. The four stateful-signature
 * functions pqc re-exports belong to the HSM engine chunk, which is still starting up when that
 * copy is made, so the copies could stay undefined for good. The visualizer therefore loads them
 * from the module that defines them. The build check (scripts/ci/check-tla-eager-imports.ts) fails
 * on any such copy; this test keeps the reason next to the code.
 */

const SOURCE = readFileSync(path.join(__dirname, 'StateManagementVisualizer.tsx'), 'utf8')
const FUNCTIONS = [
  'hsm_generateStatefulKeyPair',
  'hsm_statefulSignBytes',
  'hsm_statefulVerifyBytes',
  'hsm_getKeysRemaining',
] as const

describe('StateManagementVisualizer: where it loads the stateful-signature functions from', () => {
  it('does not load the pqc module with import()', () => {
    expect(SOURCE).not.toMatch(/import\(\s*['"][^'"]*softhsm\/pqc['"]\s*\)/)
  })

  it('loads each function it uses from the stateful module', () => {
    for (const name of [
      'hsm_generateStatefulKeyPair',
      'hsm_statefulSignBytes',
      'hsm_getKeysRemaining',
    ]) {
      expect(SOURCE).toMatch(
        new RegExp(
          `\\{\\s*${name}\\s*\\}\\s*=\\s*await import\\(\\s*['"]@/wasm/softhsm/stateful['"]\\s*\\)`
        )
      )
    }
  })

  it.each(FUNCTIONS)(
    '%s is a real export of the stateful module, and pqc forwards the same one',
    (name) => {
      expect(typeof stateful[name]).toBe('function')
      expect(pqc[name]).toBe(stateful[name])
    }
  )
})
