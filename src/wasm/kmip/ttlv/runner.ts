// SPDX-License-Identifier: GPL-3.0-only
//
// runner.ts — the full pipeline from a friendly request tree to a decoded
// response tree: buildRequest → toWireTree → engine.encodeTtlv →
// engine.submit → engine.decodeTtlv. Shared by the Commands tab (one op at a
// time) and the OASIS corpus replay (one op per transcript step) — neither
// needs a Rust match arm per operation; both go through this one generic path.

import type { KmipEngine, TtlvNode } from '../kmipEngine'
import { buildRequest } from './request'
import { toWireTree } from './encode'
import { annotateNames } from './decode'
import type { CodepointTable } from './codepointTable'
import { find, type KmipNode } from './nodes'

export interface RunResult {
  requestTree: TtlvNode
  /** Raw decoded tree (hex tags) — same shape `decode_ttlv` always
   * produces, so it renders in `WireTreeView.tsx` exactly like any other
   * response on the Agility tab. */
  responseTree: TtlvNode
  /** The same tree with tags resolved to friendly names — for callers (the
   * Commands tab pulling a UID out of a CreateKeyPair response, the corpus
   * replay's comparator, …) that want to look a field up by name instead of
   * walking `responseTree`'s raw hex tags themselves. */
  namedResponseTree: TtlvNode
  /** Read off the decoded response's `ResultStatus` (0x00000000 = Success). */
  ok: boolean
  /** `ResultReason` wire codepoint (KMIP 3.0 §9.2), when the op failed. */
  resultReason?: string
  resultMessage?: string
}

const RESULT_STATUS_SUCCESS = '0x00000000'

/** Run one KMIP 3.0 operation end to end. `table` is a caller-supplied
 * `CodepointTable` (via `getCodepointTable()` in the browser, or built
 * directly from a locally-read spec JSON in a test) — kept as an explicit
 * parameter rather than fetched internally, so callers running many ops in
 * a row (the Commands tab, the corpus replay) fetch it once and reuse it,
 * and so this function has no hidden network dependency to mock in tests.
 * Throws only if the request tree itself is malformed (an op-template bug,
 * e.g. an unknown tag/enum name) — a real KMIP rejection
 * (`OperationNotSupported`, `PermissionDenied`, a lifecycle-state gate, …)
 * is never a throw, it's a normal decoded response with `ok: false` and a
 * `resultReason`. */
export function runOp(engine: KmipEngine, table: CodepointTable, operation: string, payload: KmipNode[]): RunResult {
  const requestTree = toWireTree(buildRequest(operation, ...payload), table)
  const requestBytes = engine.encodeTtlv(requestTree)
  const responseBytes = engine.submit(requestBytes)
  const responseTree = engine.decodeTtlv(responseBytes)

  // `decode_ttlv` never resolves tag codes to names (that's a UI-layer
  // concern — see `WireTreeView.tsx`), so look the well-known result fields
  // up on a NAME-annotated copy; `responseTree` itself stays raw-tag for
  // rendering.
  const named = annotateNames(responseTree, table)
  const status = find(named, 'ResultStatus')
  const reason = find(named, 'ResultReason')
  const message = find(named, 'ResultMessage')
  return {
    requestTree,
    responseTree,
    namedResponseTree: named,
    ok: status?.value === RESULT_STATUS_SUCCESS,
    resultReason: typeof reason?.value === 'string' ? reason.value : undefined,
    resultMessage: typeof message?.value === 'string' ? message.value : undefined,
  }
}
