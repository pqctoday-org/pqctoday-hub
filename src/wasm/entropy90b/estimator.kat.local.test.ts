// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * KAT: the WASM build of the NIST SP 800-90B tool must reproduce the pinned
 * NATIVE results bit-for-bit on two small fixtures (W1). Fast (< ~2 s): the
 * fixtures are 20,000 samples, and the IID fixture is IID so the permutation
 * test stops early. The full 1M-sample parity lives in
 * scripts/entropy-90b/parity.ts, not here.
 *
 * Reference = native linux/arm64 g++ build with -ffp-contract=off (see
 * __fixtures__/kat-native-results.json for why that build, and for the
 * upstream-flag builds' values, which differ in the last bits).
 */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it } from 'vitest'
import native from './__fixtures__/kat-native-results.json'
import { runEstimator, type EaModuleFactory, type EstimatorTool } from './runner'
import { KAT_FIXTURE, KAT_IID_FIXTURE } from './syntheticDatasets'
import { NIST_90B_TOOL_COMMIT } from './resultRecord'

const WASM_DIR = resolve(__dirname, '../../../public/wasm/entropy90b')

async function factory(tool: EstimatorTool): Promise<EaModuleFactory> {
  const url = pathToFileURL(resolve(WASM_DIR, `ea_${tool}.mjs`)).href
  return ((await import(/* @vite-ignore */ url)) as { default: EaModuleFactory }).default
}

/** Drop the fields that legitimately differ between runs/hosts. */
function stable(json: unknown): Record<string, unknown> {
  const j = { ...(json as Record<string, unknown>) }
  delete j.dateTimeStamp
  delete j.commandline
  delete j.filename
  return j
}

const sha256 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex')

describe('NIST SP 800-90B WASM vs pinned native (KAT)', () => {
  it('fixtures are pinned to the same NIST commit', () => {
    expect(native.nistCommit).toBe(NIST_90B_TOOL_COMMIT)
  })

  it('staged artefacts are byte-identical to the build (BUILDINFO.json sha256)', () => {
    const info = JSON.parse(readFileSync(resolve(WASM_DIR, 'BUILDINFO.json'), 'utf8')) as {
      nistCommit: string
      files: Record<string, { bytes: number; sha256: string }>
    }
    expect(info.nistCommit).toBe(NIST_90B_TOOL_COMMIT)
    for (const [name, meta] of Object.entries(info.files)) {
      const bytes = readFileSync(resolve(WASM_DIR, name))
      expect({ name, bytes: bytes.length, sha256: sha256(bytes) }).toEqual({ name, ...meta })
    }
  })

  it('ea_non_iid: every estimator equals the native reference exactly', async () => {
    const data = KAT_FIXTURE.build()
    expect(sha256(data)).toBe(native.nonIid.reference.sha256)
    const r = await runEstimator(await factory('non_iid'), {
      tool: 'non_iid',
      data,
      bitsPerSymbol: KAT_FIXTURE.bitsPerSymbol,
    })
    expect(r.exitCode).toBe(0)
    expect(stable(r.json)).toEqual(native.nonIid.reference)
  })

  it('ea_iid with a pinned /dev/urandom: verdicts AND permutation counters equal native', async () => {
    const data = KAT_IID_FIXTURE.build()
    expect(sha256(data)).toBe(native.iidSeeded.reference.sha256)
    const r = await runEstimator(await factory('iid'), {
      tool: 'iid',
      data,
      bitsPerSymbol: KAT_IID_FIXTURE.bitsPerSymbol,
      deterministicUrandom: Uint8Array.from(Buffer.from(native.iidSeeded.urandomSeedHex, 'hex')),
    })
    expect(r.exitCode).toBe(0)
    expect(stable(r.json)).toEqual(native.iidSeeded.reference)
  })

  it('ea_non_iid: upstream-flag native builds agree with WASM to 1e-12 (they differ only in the last bits)', async () => {
    const r = await runEstimator(await factory('non_iid'), {
      tool: 'non_iid',
      data: KAT_FIXTURE.build(),
      bitsPerSymbol: KAT_FIXTURE.bitsPerSymbol,
    })
    const cases = (r.json as { testCases: Array<Record<string, unknown>> }).testCases
    for (const up of Object.values(native.nonIid.upstream)) {
      up.testCases.forEach((tc: Record<string, unknown>, i: number) => {
        for (const [k, v] of Object.entries(tc)) {
          if (typeof v === 'number') expect(cases[i][k] as number).toBeCloseTo(v, 12)
          else expect(cases[i][k]).toEqual(v)
        }
      })
    }
  })
})
