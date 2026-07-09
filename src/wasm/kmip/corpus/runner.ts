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
 * Commands tabs' shared engine, so start numbering elsewhere).
 *
 * `prereqs` — for `classify.ts`'s `CHAINED_TEST_GROUPS` tests (TL-M-3,
 * SASED-M-3), the prerequisite transcripts to fully replay FIRST on the
 * SAME engine, mirroring the Python harness's chained groups: the spec
 * sequences these transcripts within one profile run, so the state the
 * later test Locates genuinely exists. A prerequisite that itself fails
 * makes this test ERROR (never a silent half-run). */
export async function runCorpusTest(
  name: string,
  xmlText: string,
  table: CodepointTable,
  slot: number,
  prereqs: { name: string; xml: string }[] = []
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
    }
  }

  const ops = operationsUsed(transcript)
  const byOps = classifyByOps(ops)
  if (byOps)
    return {
      name,
      status: byOps.status,
      detail: byOps.detail,
      opsUsed: Array.from(ops).sort(),
      pairs: [],
    }

  if (transcript.length % 2 !== 0) {
    return {
      name,
      status: 'SKIP_PARSE',
      detail: 'odd message count',
      opsUsed: Array.from(ops).sort(),
      pairs: [],
    }
  }

  const engine = await KmipEngine.boot(slot)

  // Chained prerequisites — full replay (placeholders, comparison and all,
  // via each prerequisite's own Bindings) so the shared state is EXACTLY
  // what the earlier transcript produces, not a hand-approximation of it.
  for (const p of prereqs) {
    const r = await replayTranscriptOn(engine, p.name, p.xml, table)
    if (r !== null) {
      return {
        name,
        status: 'ERROR',
        detail: `chained prerequisite ${p.name} failed: ${r}`,
        opsUsed: Array.from(ops).sort(),
        pairs: [],
      }
    }
  }
  const opsUsed = Array.from(ops).sort()
  const pairs: TestResult['pairs'] = []

  const failure = replayPairs(engine, transcript, table, pairs)
  if (failure) return { name, status: failure.status, detail: failure.detail, opsUsed, pairs }

  return { name, status: 'PASS', detail: '', opsUsed, pairs }
}

/** Replay every Request/Response pair of one parsed transcript on `engine`,
 * with its own fresh `Bindings`. Appends each decoded pair to `pairs`.
 * Returns `null` on a clean full replay, or the first failure. */
function replayPairs(
  engine: KmipEngine,
  transcript: KmipNode[],
  table: CodepointTable,
  pairs: TestResult['pairs']
): { status: 'ERROR' | 'FAIL' | 'SKIP_PARSE'; detail: string } | null {
  const bindings = new Bindings()

  for (let i = 0; i < transcript.length; i += 2) {
    const req = transcript[i]
    const expectedRsp = transcript[i + 1]
    const pairIndex = i / 2
    if (
      norm(req.tag) !== norm('RequestMessage') ||
      norm(expectedRsp.tag) !== norm('ResponseMessage')
    ) {
      return {
        status: 'SKIP_PARSE',
        detail: `msg #${pairIndex}: not a Req/Resp pair (${req.tag}/${expectedRsp.tag})`,
      }
    }

    let requestTree: TtlvNode
    let requestBytes: Uint8Array
    try {
      const resolvedReq = bindings.resolveTree(req)
      requestTree = toWireTree(resolvedReq, table)
      requestBytes = engine.encodeTtlv(requestTree)
    } catch (e) {
      return {
        status: 'ERROR',
        detail: `msg #${pairIndex}: encode request: ${e instanceof Error ? e.message : String(e)}`,
      }
    }

    let responseBytes: Uint8Array
    try {
      responseBytes = engine.submit(requestBytes)
    } catch (e) {
      return {
        status: 'ERROR',
        detail: `msg #${pairIndex}: submit: ${e instanceof Error ? e.message : String(e)}`,
      }
    }
    if (!responseBytes || responseBytes.length === 0) {
      return { status: 'FAIL', detail: `msg #${pairIndex}: engine returned 0 bytes` }
    }

    // `rawResponseTree` keeps raw hex tags (0x42xxxx) — the shape
    // `WireTreeView.tsx`'s own `tagName()`/`ENUM_NAMES` resolution expects,
    // same as every other caller of this component. `actualRsp` is a
    // SEPARATE name-annotated copy (via this module's own `CodepointTable`,
    // not `kmipMeta.ts`'s dictionary) used only for the harvest/compare
    // logic below — never fed to `WireTreeView`, or its friendly tag
    // strings defeat `tagName()`'s hex lookup and enum values stop
    // resolving.
    let rawResponseTree: TtlvNode
    let actualRsp: TtlvNode
    try {
      rawResponseTree = engine.decodeTtlv(responseBytes)
      actualRsp = annotateNames(rawResponseTree, table)
    } catch (e) {
      return {
        status: 'FAIL',
        detail: `msg #${pairIndex}: decode response: ${e instanceof Error ? e.message : String(e)}`,
      }
    }

    pairs.push({ requestTree, responseTree: rawResponseTree })

    bindings.harvestFromResponse(expectedRsp, actualRsp)
    const { ok, detail } = compareResponses(expectedRsp, actualRsp, bindings, table, undefined)
    if (!ok) {
      return { status: 'FAIL', detail: `msg #${pairIndex}: response mismatch: ${detail}` }
    }
  }

  return null
}

/** Fully replay a chained PREREQUISITE transcript on an existing engine.
 * Returns an error detail string, or `null` on a clean pass. The decoded
 * pairs are discarded — only the resulting engine state matters to the
 * dependent test. */
async function replayTranscriptOn(
  engine: KmipEngine,
  name: string,
  xmlText: string,
  table: CodepointTable
): Promise<string | null> {
  let transcript: KmipNode[]
  try {
    transcript = parseTranscriptXml(xmlText)
  } catch (e) {
    return `${name}: XML parse: ${e instanceof Error ? e.message : String(e)}`
  }
  if (transcript.length % 2 !== 0) return `${name}: odd message count`
  const failure = replayPairs(engine, transcript, table, [])
  return failure ? `${name}: ${failure.detail}` : null
}
