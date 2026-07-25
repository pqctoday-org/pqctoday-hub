// SPDX-License-Identifier: GPL-3.0-only
//
// decode.ts — annotate a decoded wire tree (from `KmipEngine.decodeTtlv`,
// whose `tag` is always the raw `"0x420028"`-style hex codepoint — the wasm
// `frame_json` never resolves names) with friendly tag names, so `find`/
// `findAll` can look a response up by name ("ResultStatus", "UniqueIdentifier",
// …) the same way they do on a friendly `KmipNode` request tree. Mirrors
// `_ttlv.py`'s `decode_one`, which resolves `tag_code_to_name` inline as part
// of decoding — the wasm decoder does this resolution as a separate pass
// instead, since `frame_json` is also reused by the raw "wire view" hex
// display (`WireTreeView.tsx`) that wants the codepoint, not the name.

import type { TtlvNode } from '../kmipEngine'
import type { CodepointTable } from './codepointTable'

/** Recursively replace each node's raw hex `tag` with its friendly name
 * (falling back to the hex string itself for a codepoint the table doesn't
 * know — a real client extension or a spec tag not yet patched in). */
export function annotateNames(node: TtlvNode, table: CodepointTable): TtlvNode {
  const code = parseInt(node.tag, 16)
  const tag = table.tagCodeToName.get(code) ?? node.tag
  return {
    ...node,
    tag,
    children: node.children?.map((c) => annotateNames(c, table)),
  }
}
