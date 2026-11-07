// SPDX-License-Identifier: AGPL-3.0-only
// The command-line runner's golden summary and exit policy, with the engine
// replaced by the TEST-ONLY fake that answers from expectedResults.json (no
// crypto). Real-engine runs are proven in acvp.engines.local.test.ts; this file
// pins only how the comparison is reported and when the exit code is non-zero.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { GoldenComparisonError } from '../compare'
import { createExpectedResultsFakeEngine } from '../testing/expectedResultsFakeEngine'
import { fixturePath, readFixture, type FixtureName } from './fixtures'

const engineState = vi.hoisted(() => ({ make: null as null | (() => unknown) }))
vi.mock('./loadEngines', () => ({
  loadEngineNode: vi.fn(async () => ({ module: {}, identity: { id: 'fake-expected-results' } })),
}))
vi.mock('../engine', () => ({ createPkcs11Engine: () => engineState.make?.() }))

import { runCli, type CliArgs } from './cli'

const repo = process.cwd()
const KEM: FixtureName = 'ML-KEM-encapDecap-FIPS203'
let tmp = ''

beforeEach(() => {
  tmp = mkdtempSync(path.join(os.tmpdir(), 'acvp-cli-'))
})
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true })
  engineState.make = null
})

const run = (over: Partial<CliArgs>, name: FixtureName = KEM, overrides = {}) => {
  engineState.make = () =>
    createExpectedResultsFakeEngine(
      readFixture(repo, name, 'expectedResults.json'),
      readFixture(repo, name, 'prompt.json'),
      overrides
    )
  return runCli(
    {
      prompt: fixturePath(repo, name, 'prompt.json'),
      engine: 'cpp',
      out: path.join(tmp, 'out'),
      expected: fixturePath(repo, name, 'expectedResults.json'),
      evidence: true,
      ...over,
    },
    repo
  )
}

describe('acvp-respond golden summary', () => {
  it('a deliberately partial supported run stays partial: unanswered cases are reported, exit 0', async () => {
    const r = await run({ profile: 'bounded' })
    expect(r.exitCode).toBe(0)
    expect(r.summary).toContain('30 answered, 135 unsupported, 0 error')
    expect(r.summary).toContain(
      'golden vs expectedResults: 30/30 matched, 0 field differences in 0 cases, 135 unanswered, 0 unexpected'
    )
  })

  it('a complete extended run matches every expected case', async () => {
    const r = await run({ profile: 'extended' })
    expect(r.exitCode).toBe(0)
    expect(r.summary).toContain(
      '165/165 matched, 0 field differences in 0 cases, 0 unanswered, 0 unexpected'
    )
  })

  it('a wrong answer from the engine fails the run and is counted as one field in one case', async () => {
    const r = await run(
      { profile: 'bounded' },
      KEM,
      // the first decapsulation case of the sample: tgId 4, tcId 76
      { '4/76': { status: 'ok', value: '00'.repeat(32) } }
    )
    expect(r.exitCode).toBe(1)
    expect(r.summary).toContain('29/30 matched, 1 field difference in 1 case, 135 unanswered')
  })

  it('field differences are not cases: one encapsulation case with a wrong c and a wrong k is two differences in one case', async () => {
    const r = await run(
      { profile: 'extended' },
      KEM,
      // the first encapsulation case of the sample: tgId 1, tcId 1
      { '1/1': { status: 'ok', value: '00'.repeat(32), extra: { c: '00' } } }
    )
    expect(r.exitCode).toBe(1)
    expect(r.summary).toContain('164/165 matched, 2 field differences in 1 case, 0 unanswered')
  })

  it('an expected-results file that cannot be used is refused, not reported as a match', async () => {
    const bad = path.join(tmp, 'expected.json')
    writeFileSync(
      bad,
      JSON.stringify({ vsId: 42, testGroups: [{ tgId: 1, tests: [{ tcId: 1 }] }] })
    )
    await expect(run({ expected: bad, profile: 'bounded' })).rejects.toBeInstanceOf(
      GoldenComparisonError
    )
  })
})
