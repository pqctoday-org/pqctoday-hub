// SPDX-License-Identifier: GPL-3.0-only
/**
 * !!! TEST-ONLY FAKE — performs NO cryptography. !!!
 *
 * An AcvpEngine that "answers" each executable plan item by looking the value
 * up in a NIST expectedResults.json. It exists ONLY to test serialization,
 * dispatch bookkeeping, golden comparison and the UI's import → download flow
 * (including its no-network assertion) in jsdom, where the real WASM engines
 * cannot load. Real-engine evidence comes from acvp.engines.local.test.ts and
 * the CLI, never from this file. Never import it from production code.
 */
import type { JsonObject } from '../ir'
import type { AcvpEngine, EngineIdentity, EngineOutcome, PlanOperation } from '../dispatch'

export const FAKE_ENGINE_IDENTITY: EngineIdentity = {
  id: 'fake-expected-results',
  label: 'TEST-ONLY fake engine (answers from expectedResults.json, no crypto)',
  implementation: 'none — test double',
  softhsmProductVersion: null,
  provenanceBundle: null,
  hsmCommit: null,
  builtAt: null,
  artifactPath: null,
  artifactSha256: null,
  artifactSha256Note: 'test double: no engine artifact exists',
}

export interface FakeEngine extends AcvpEngine {
  calls: PlanOperation[]
}

/**
 * The fake maps each op back to its tgId/tcId through the op's own input
 * (ciphertext or signature), so it can only answer items the plan actually
 * dispatched. `overrides` (keyed "tgId/tcId") force an engine outcome.
 */
export const createExpectedResultsFakeEngine = (
  expectedResultsText: string,
  promptText: string,
  overrides: Partial<Record<string, EngineOutcome>> = {}
): FakeEngine => {
  const expected = JSON.parse(expectedResultsText) as JsonObject
  const prompt = JSON.parse(promptText) as JsonObject
  const exp = Array.isArray(expected) ? (expected[1] as JsonObject) : expected
  const pr = Array.isArray(prompt) ? (prompt[1] as JsonObject) : prompt
  const answers = new Map<string, JsonObject>()
  for (const g of exp.testGroups as JsonObject[]) {
    for (const t of g.tests as JsonObject[]) answers.set(`${g.tgId}/${t.tcId}`, t)
  }
  // Map an op's identifying inputs back to its tgId/tcId.
  const byInput = new Map<string, string>()
  for (const g of pr.testGroups as JsonObject[]) {
    for (const t of g.tests as JsonObject[]) {
      const sig = (t.c ?? t.signature) as string | undefined
      if (sig) byInput.set(sig, `${g.tgId}/${t.tcId}`)
    }
  }
  const calls: PlanOperation[] = []
  return {
    identity: FAKE_ENGINE_IDENTITY,
    calls,
    execute(op) {
      calls.push(op)
      const key = byInput.get(op.operation === 'ml-kem.decapsulate' ? op.c : op.signature)
      if (!key) return { status: 'error', reason: 'fake: unknown input' }
      const forced = overrides[key]
      if (forced) return forced
      const a = answers.get(key)
      if (!a) return { status: 'error', reason: 'fake: no expected result' }
      return op.operation === 'ml-kem.decapsulate'
        ? { status: 'ok', value: a.k as string }
        : { status: 'ok', value: a.testPassed as boolean }
    },
    close() {},
  }
}
