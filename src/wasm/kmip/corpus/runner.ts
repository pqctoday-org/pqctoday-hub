// SPDX-License-Identifier: GPL-3.0-only
//
// runner.ts — replay one OASIS KMIP 3.0 conformance test transcript,
// hermetically, entirely in the browser: classify → parse → for each
// Request/Response pair, resolve placeholders → encode → submit → decode
// → harvest bindings → compare. Ported from
// pqctoday-hsm/kmip/conformance/harness/dispatcher_replay.py's `run_test`,
// minus the TLS/subprocess transport (replaced by the wasm engine's
// `submit`, which runs the identical decode→dispatch→encode path).
//
// `run_test` restarts the WHOLE SERVER PROCESS per test for hermetic
// isolation. A wasm module instance can't restart a process, but the
// underlying softhsmrustv3 PKCS#11 engine's token storage is a genuine
// `HashMap<u32, TokenState>` keyed by slot (`rust/src/state.rs`), not a
// single fixed slot — so booting each test's `KmipEngine` on its OWN,
// never-reused slot number gives the same hermetic-isolation guarantee the
// Python harness gets from a fresh process, without needing one. (Reusing
// slot 0 while an earlier instance's session on it is still open fails
// bootstrap — confirmed empirically, `CK_RV=0x000000b6` — which is why
// `KmipPlayground::new`/`KmipEngine.boot` took an optional `slot` param.)
import { KmipEngine, type TtlvNode } from '../kmipEngine'
import { toWireTree } from '../ttlv/encode'
import { annotateNames } from '../ttlv/decode'
import type { CodepointTable } from '../ttlv/codepointTable'
import { norm, type KmipNode } from '../ttlv/nodes'
import { parseTranscriptXml } from './xmlAst'
import { Bindings } from './bindings'
import { compareResponses } from './compare'
import { classifyByName, classifyByOps, operationsUsed } from './classify'

export type TestStatus =
  | 'PASS'
  | 'FAIL'
  | 'ERROR'
  | 'SKIP_OP'
  | 'SKIP_PARSE'
  | 'SKIP_DEPRECATED'
  | 'SKIP_PRECONDITION'
  | 'SKIP_POLICY_VARIANT'
  | 'SKIP_TRANSPORT'

export interface TestResult {
  name: string
  status: TestStatus
  detail: string
  opsUsed: string[]
  /** Every Request/Response pair this replay actually decoded (both trees),
   * in transcript order — even on a FAIL, whatever decoded before the
   * mismatch is included, so the UI can show real wire bytes for
   * inspection, not just a pass/fail verdict. */
  pairs: { requestTree: TtlvNode; responseTree: TtlvNode }[]
}

/** Replay one test, hermetically, on its own fresh `KmipEngine` bootstrapped
 * on `slot` — the caller (the "run all" orchestrator) is responsible for
 * handing out a distinct, never-reused slot per test within one page load
 * (e.g. a simple incrementing counter; slot 0 is reserved for the Agility/
 * Commands tabs' shared engine, so start numbering elsewhere). */
export async function runCorpusTest(
  name: string,
  xmlText: string,
  table: CodepointTable,
  slot: number
): Promise<TestResult> {
  const byName = classifyByName(name)
  if (byName) return { name, status: byName.status, detail: byName.detail, opsUsed: [], pairs: [] }

  let transcript: KmipNode[]
  try {
    transcript = parseTranscriptXml(xmlText)
  } catch (e) {
    return {
      name,
      status: 'SKIP_PARSE',
      detail: `XML parse: ${e instanceof Error ? e.message : String(e)}`,
      opsUsed: [],
      pairs: [],

  if (transcript.length % 2 !== 0) {
    return {
      name,
      status: 'SKIP_PARSE',
      detail: 'odd message count',
      opsUsed: Array.from(ops).sort(),
      pairs: [],
      }
    }

    let responseBytes: Uint8Array
    try {
      responseBytes = engine.submit(requestBytes)
    } catch (e) {
      return {
        name,
        status: 'ERROR',
        detail: `msg #${pairIndex}: submit: ${e instanceof Error ? e.message : String(e)}`,
        opsUsed,
        pairs,
      }
    }

    pairs.push({ requestTree, responseTree: rawResponseTree })

    bindings.harvestFromResponse(expectedRsp, actualRsp)
    const { ok, detail } = compareResponses(expectedRsp, actualRsp, bindings, table, undefined)
    if (!ok) {
      return {
        name,
        status: 'FAIL',
        detail: `msg #${pairIndex}: response mismatch: ${detail}`,
        opsUsed,
        pairs,
      }
    }
  }

  return { name, status: 'PASS', detail: '', opsUsed, pairs }
}
