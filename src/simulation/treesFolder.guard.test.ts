// SPDX-License-Identifier: AGPL-3.0-only
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// src/simulation/index.ts loads every `./trees/simTree.*.ts` file eagerly in the browser.
// A test file in that folder would be bundled and import the test runner at page load,
// so the simulation page would never start. Keep tests next to index.ts instead.
describe('simulation trees folder', () => {
  it('holds only tree data files, no test files', () => {
    const dir = path.resolve(process.cwd(), 'src/simulation/trees')
    const tests = readdirSync(dir).filter((name) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(name))
    expect(tests).toEqual([])
  })
})
