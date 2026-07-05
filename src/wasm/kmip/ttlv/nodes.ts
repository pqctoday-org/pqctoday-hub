// SPDX-License-Identifier: GPL-3.0-only
//
// nodes.ts — the "friendly" KMIP TTLV tree: tag/type/value by NAME (e.g.
// `leaf('CryptographicAlgorithm', 'Enumeration', 'AES')`), not by raw wire
// codepoint. Ported from pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/
// _ttlv.py's `TtlvNode` dataclass + `leaf()`/`struct()` constructors — the
// same shape `KmipClient`'s per-op methods (`kmip.py`) build requests with.
//
// This is the INPUT to `encode.ts`'s `toWireTree()`, which resolves names to
// codepoints and produces the `{tag: "0x...", type, value, children}` shape
// the wasm `encode_ttlv` binding consumes. Keeping the two trees distinct
// mirrors the Python split between `_ttlv.py`'s friendly `TtlvNode` (what
// callers build) and the raw wire bytes `encode_node` emits.

/** The 11 TTLV item types (KMIP 3.0 §9.1.1) — the same set `decode_ttlv`'s
 * JSON tree and `_ttlv.py`'s `TTLV_TYPE` both use. */
export type TtlvTypeName =
  | 'Structure'
  | 'Integer'
  | 'LongInteger'
  | 'BigInteger'
  | 'Enumeration'
  | 'Boolean'
  | 'TextString'
  | 'ByteString'
  | 'DateTime'
  | 'Interval'
  | 'DateTimeExtended'

/** One friendly TTLV node — tag/type by name, not by codepoint. `value` is
 * absent on a `Structure` (use `children` instead). */
export interface KmipNode {
  tag: string
  type: TtlvTypeName
  value?: string | number | boolean
  children?: KmipNode[]
}

/** Construct a leaf node. */
export const leaf = (tag: string, type: TtlvTypeName, value: string | number | boolean): KmipNode => ({
  tag,
  type,
  value,
})

/** Construct a Structure node. */
export const struct = (tag: string, ...children: KmipNode[]): KmipNode => ({
  tag,
  type: 'Structure',
  children,
})

/** Punctuation-insensitive normalization — "Cryptographic Algorithm" and
 * "cryptographicAlgorithm" key to the same lookup entry. Matches
 * `_ttlv.py`'s `_norm`. Shared by `encode.ts`'s codepoint/enum lookups and
 * by any BFS-by-tag-name traversal over a friendly or wire tree. */
export const norm = (name: string): string => Array.from(name).filter((c) => /[a-zA-Z0-9]/.test(c)).join('')

/** The minimal shape BFS traversal needs — satisfied by both `KmipNode`
 * (friendly, tag by name) and `kmipEngine.ts`'s `TtlvNode` (wire, tag as raw
 * hex) structurally, so `find`/`findAll` work on either without a cast. */
interface Tagged {
  tag: string
  children?: Tagged[]
}

/** First descendant (BFS) whose `tag` matches (punctuation-insensitive), or
 * `undefined`. Pass the friendly tag name for a `KmipNode` tree, the human
 * name `decode_ttlv` already resolved for a decoded wire tree. Mirrors
 * `_ttlv.py`'s `find`. */
export function find<T extends Tagged>(node: T, tag: string): T | undefined {
  const want = norm(tag)
  const queue: T[] = [node]
  while (queue.length) {
    const n = queue.shift() as T
    if (norm(n.tag) === want) return n
    if (n.children) queue.push(...(n.children as T[]))
  }
  return undefined
}

/** Every descendant (BFS) whose `tag` matches. Mirrors `_ttlv.py`'s `find_all`. */
export function findAll<T extends Tagged>(node: T, tag: string): T[] {
  const want = norm(tag)
  const result: T[] = []
  const queue: T[] = [node]
  while (queue.length) {
    const n = queue.shift() as T
    if (norm(n.tag) === want) result.push(n)
    if (n.children) queue.push(...(n.children as T[]))
  }
  return result
}
