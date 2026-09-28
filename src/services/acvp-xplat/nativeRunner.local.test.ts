// SPDX-License-Identifier: GPL-3.0-only
// LOCAL-ONLY (needs Docker + an existing sandbox container; never in CI):
// the Python/ctypes native runner reproduces the Node CLI goldens on a real
// native PKCS#11 engine, writes schema-valid evidence + environment records,
// and refuses a tampered bundle.
//
//   npx vitest run --config vitest.local.config.ts src/services/acvp-xplat/nativeRunner.local.test.ts
//
// Defaults: container pqc-network, its C++ engine /usr/local/lib/softhsm/libsofthsmv3.so
// (amd64, emulated on Apple silicon). Override with ACVP_NATIVE_CONTAINER /
// ACVP_NATIVE_MODULE / ACVP_NATIVE_ENGINE. Skips when the container is not running.
// The container is only read from; everything is staged in a private /tmp dir
// inside it by tools/acvp-native/run-in-container.sh and removed afterwards.
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { validateEvidenceDocument } from '../acvp/schemas/evidenceSchemas'
import { canonicalJson, sha256Hex } from '../acvp/ir'
import { runCli } from '../acvp/node/cli'
import { FIXTURE_NAMES, fixturePath } from '../acvp/node/fixtures'
import { validateExecutionEnvironment } from '../../data/validation/executionEnvironment'
import goldens from '../acvp/__fixtures__/goldens/goldens.json'

const repo = process.cwd()
const CONTAINER = process.env.ACVP_NATIVE_CONTAINER ?? 'pqc-network'
const MODULE = process.env.ACVP_NATIVE_MODULE ?? '/usr/local/lib/softhsm/libsofthsmv3.so'
const ENGINE = process.env.ACVP_NATIVE_ENGINE ?? 'cpp'
const SCRIPT = path.join(repo, 'tools/acvp-native/run-in-container.sh')

const containerUp = (() => {
  try {
    execFileSync('docker', ['exec', CONTAINER, 'test', '-f', MODULE], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()

let tmp = ''

const runInContainer = (runDir: string, bundles: string) =>
  spawnSync(
    SCRIPT,
    [
      '--container',
      CONTAINER,
      '--module',
      MODULE,
      '--engine',
      ENGINE,
      '--target',
      'local-test',
      '--label',
      'local test',
      '--run',
      runDir,
      '--bundles',
      bundles,
      '--acceleration',
      'none',
    ],
    { encoding: 'utf8' }
  )

describe.skipIf(!containerUp)(`native runner in ${CONTAINER} (${ENGINE})`, () => {
  beforeAll(async () => {
    tmp = mkdtempSync(path.join(os.tmpdir(), 'acvp-native-test-'))
    for (const name of FIXTURE_NAMES) {
      await runCli(
        {
          prompt: fixturePath(repo, name, 'prompt.json'),
          engine: 'cpp',
          out: path.join(tmp, 'cli', name),
          expected: fixturePath(repo, name, 'expectedResults.json'),
          evidence: false,
          emitBundle: path.join(tmp, 'bundles', 'cpp', name),
        },
        repo
      )
    }
  }, 120_000)

  afterAll(() => {
    if (tmp) rmSync(tmp, { recursive: true, force: true })
  })

  it('reproduces the goldens byte-for-byte and writes valid evidence + environment records', async () => {
    const runDir = path.join(tmp, 'run')
    const r = runInContainer(runDir, path.join(tmp, 'bundles'))
    expect(r.status, r.stderr + r.stdout).toBe(0)
    for (const name of FIXTURE_NAMES) {
      const dir = path.join(runDir, 'targets', 'local-test', name)
      const text = readFileSync(path.join(dir, 'response.json'), 'utf8')
      const golden = goldens.fixtures[name]
      expect(text).toBe(
        readFileSync(
          path.join(repo, 'src/services/acvp/__fixtures__/goldens', golden.responseFile),
          'utf8'
        )
      )
      expect(await sha256Hex(canonicalJson(JSON.parse(text)))).toBe(golden.responseCanonicalSha256)

      const evidence = JSON.parse(readFileSync(path.join(dir, 'evidence.json'), 'utf8')) as {
        response: { sha256: string }
        summary: { answered: number; unsupported: number; error: number }
        goldenComparison: { mismatched: number; unexpected: number }
      }
      expect(validateEvidenceDocument(evidence)).toEqual([])
      expect((evidence as unknown as { generator: { codePath: string } }).generator.codePath).toBe(
        'native'
      )
      expect(evidence.response.sha256).toBe(await sha256Hex(text))
      expect(evidence.summary.answered).toBe(golden.counts.planExecute)
      expect(evidence.summary.unsupported).toBe(golden.counts.planUnsupported)
      expect(evidence.summary.error).toBe(0)
      expect(evidence.goldenComparison).toMatchObject({ mismatched: 0, unexpected: 0 })

      const env = await validateExecutionEnvironment(
        JSON.parse(readFileSync(path.join(dir, 'execution-environment.json'), 'utf8'))
      )
      expect(env.schemaDiagnostics).toEqual([])
      expect(env.envIdValid).toBe(true)
      // No --build-info here: the engine commit is unknown, so the run must be non-publishable.
      expect(env.unmetIdentity).toContain('engine.sourceCommit')
      expect(env.publishable).toBe(false)
    }
  }, 300_000)

  it('refuses a bundle whose plan.json was altered after emission', () => {
    const bundles = path.join(tmp, 'bundles-tampered')
    const src = path.join(tmp, 'bundles')
    execFileSync('cp', ['-R', src, bundles])
    const plan = path.join(bundles, 'cpp', FIXTURE_NAMES[0], 'plan.json')
    writeFileSync(plan, readFileSync(plan, 'utf8').replace('"tgId": 1', '"tgId": 1 '))
    const r = runInContainer(path.join(tmp, 'run-tampered'), bundles)
    expect(r.status).not.toBe(0)
    expect(r.stderr + r.stdout).toMatch(/SHA-256 mismatch — refusing to run/)
  }, 300_000)
})
