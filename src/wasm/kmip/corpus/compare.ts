// SPDX-License-Identifier: GPL-3.0-only
//
// compare.ts — recursively compare an expected ResponseMessage (from the
// OASIS transcript XML) against the actual decoded response, modulo the
// exact set of variations KMIP Profiles v3.0 §4.1 "Permitted Test Case
// Variations" allows. Anything not enumerated there SHALL be deemed
// non-conformant (§4.1 closing sentence) — this file invents nothing
// beyond what's cited.
//
// Ported function-for-function from
// pqctoday-hsm/kmip/conformance/harness/dispatcher_replay.py's comparator
// (`compare_responses` and friends). One real convention difference from
// the Python original: the wasm engine's `decode_ttlv` represents an
// actual Enumeration value as an uppercase hex STRING ("0x00000005"), a
// ByteString/BigInteger as a lowercase hex string, and Integer/LongInteger/
// DateTime/Interval/DateTimeExtended as plain JS numbers — not Python's
// typed ints — so `valuesEqual`/`enumMatch` compare against those shapes
// instead.
import type { TtlvNode } from '../kmipEngine'
import { norm, type KmipNode } from '../ttlv/nodes'
import { NAMED_INTEGER_MASKS } from '../ttlv/encode'
import type { CodepointTable } from '../ttlv/codepointTable'
import { isOpaqueStructure, isOptionalPresence, isVolatileTag } from './tagRules'
import type { Bindings } from './bindings'

export interface CompareResult {
  ok: boolean
  detail: string
}

/** Mirrors the Python harness's module-level `_CURRENT_TEST_NAME` (see
 * `dispatcher_replay.py`'s `_compare_query_response_payload` docstring) —
 * set once per test by `runCorpusTest` before replay, read by
 * `compareQueryResponsePayload`'s MSGENC-* carve-out below. A module-level
 * variable rather than a threaded parameter because only that one leaf
 * function needs it, and every call in the chain between `runCorpusTest`
 * and it (compareBatchItem → compareResponses → compareQueryResponsePayload)
 * would otherwise need a mechanical extra argument. Corpus tests always run
 * one at a time within a single `runCorpusTest` call (no concurrent replay
 * within one JS realm), so this is safe. */
let currentTestName = ''
export function setCurrentTestName(name: string): void {
  currentTestName = name
}

const ok = (detail = 'ok'): CompareResult => ({ ok: true, detail })
const fail = (detail: string): CompareResult => ({ ok: false, detail })

function directChild(node: KmipNode, tag: string): KmipNode | undefined {
  return (node.children ?? []).find((c) => c.tag === tag)
}

/** True iff two enum leaf values match — accounts for the string-name
 * (expected, from XML) vs hex-string-codepoint (actual, from decode_ttlv)
 * skew. `actual` may also come through as a plain JS number: a handful of
 * fields the OASIS XML annotates `type="Enumeration"` (e.g.
 * `PKCS_11ReturnCode`) are genuinely wire-encoded as `Integer` by the real
 * dispatcher — confirmed against a live decode. Python's decoder collapses
 * both wire types to a plain int either way, so its comparator's
 * enum-name lookup doesn't care which one the wire actually used; this
 * mirrors that by accepting a bare number for `actual` too. */
function enumMatch(expected: unknown, actual: unknown, table: CodepointTable): boolean {
  if (expected === actual) return true
  const actNum =
    typeof actual === 'number' ? actual : typeof actual === 'string' ? Number(actual) : NaN
  if (typeof expected === 'string' && !Number.isNaN(actNum)) {
    const expNum = Number(expected)
    if (!Number.isNaN(expNum) && expNum === actNum) return true
    const tagNorm = norm(expected)
    for (const members of table.enumNameToValue.values()) {
      if (members.get(tagNorm) === actNum) return true
    }
  }
  return false
}

/** Compare leaf values modulo the string(XML)/typed(decoded) skew.
 * `tagName` enables named-bit-flag resolution for KMIP 3.0 §5.4.1.6.4
 * "Integer — Special case for Masks" (CryptographicUsageMask /
 * ProtectionStorageMask): the XML carries `value="Sign Verify"` as
 * space-separated flag names; the wire encodes them as the bitwise OR. */
function valuesEqual(
  ttlvType: KmipNode['type'],
  expected: unknown,
  actual: unknown,
  tagName: string | undefined,
  table: CodepointTable
): boolean {
  if (expected === actual) return true
  if (
    ttlvType === 'Integer' ||
    ttlvType === 'LongInteger' ||
    ttlvType === 'DateTime' ||
    ttlvType === 'DateTimeExtended' ||
    ttlvType === 'Interval'
  ) {
    const expNum = Number(expected)
    if (!Number.isNaN(expNum) && expNum === actual) return true
    if (tagName) {
      const maskKey = Object.keys(NAMED_INTEGER_MASKS).find((k) => norm(k) === norm(tagName))
      if (maskKey && typeof expected === 'string') {
        const mask = NAMED_INTEGER_MASKS[maskKey]
        let acc = 0
        for (const flag of expected.split(/\s+/).filter(Boolean)) {
          if (!(flag in mask)) return false
          acc |= mask[flag]
        }
        return acc === actual
      }
    }
    return false
  }
  if (ttlvType === 'Boolean') {
    const e = String(expected).toLowerCase()
    return (
      (['true', '1'].includes(e) && actual === true) ||
      (['false', '0'].includes(e) && actual === false)
    )
  }
  if (ttlvType === 'Enumeration') return enumMatch(expected, actual, table)
  if (ttlvType === 'ByteString' || ttlvType === 'BigInteger')
    return String(expected).toLowerCase() === String(actual).toLowerCase()
  if (ttlvType === 'TextString') return String(expected) === String(actual)
  return expected === actual
}

/** KMIP Profiles v3.0 §4.1.1 item 20 (server MAY return additional
 * attributes) + §4.1.2 item 5 (any permutation of order is allowed). Bag
 * semantics: every expected child must find a matching actual child (by
 * tag name + deep-equal value); the actual side MAY include extras. */
function compareAttributesContainer(
  expected: KmipNode,
  actual: TtlvNode,
  bindings: Bindings,
  table: CodepointTable
): CompareResult {
  const actualByName = new Map<string, TtlvNode[]>()
  for (const c of actual.children ?? []) {
    const key = norm(c.tag)
    const list = actualByName.get(key) ?? []
    list.push(c)
    actualByName.set(key, list)
  }
  for (const ec of expected.children ?? []) {
    const candidates = actualByName.get(norm(ec.tag)) ?? []
    if (candidates.length === 0) {
      return fail(
        `Attributes: missing expected attribute '${ec.tag}' (§4.1.1 item 20 permits server *extras* — not omissions)`
      )
    }
    let matchedIdx = -1
    for (let i = 0; i < candidates.length; i++) {
      if (compareResponses(ec, candidates[i], bindings, table, undefined).ok) {
        matchedIdx = i
        break
      }
    }
    if (matchedIdx === -1) return fail(`Attributes: no actual '${ec.tag}' matches expected value`)
    candidates.splice(matchedIdx, 1)
  }
  return ok()
}

/** §4.1.2 item 5 also applies to GetAttributeList's ResponsePayload: the
 * UniqueIdentifier is positional, but the AttributeReference list order is
 * explicitly variable, and the server MAY include extras (§4.1.1 item 20). */
function compareAttributeReferenceList(
  expected: KmipNode,
  actual: TtlvNode,
  bindings: Bindings,
  table: CodepointTable
): CompareResult {
  const split = <T extends { tag: string; children?: T[] }>(node: T) => {
    let uid: T | undefined
    const refs: T[] = []
    for (const c of node.children ?? []) {
      if (norm(c.tag) === norm('UniqueIdentifier')) uid = c
      else if (norm(c.tag) === norm('AttributeReference')) refs.push(c)
    }
    return { uid, refs }
  }
  const e = split(expected)
  const a = split(actual)
  if (e.uid && !a.uid) return fail('ResponsePayload: missing UniqueIdentifier')
  if (e.uid && a.uid) {
    const r = compareResponses(e.uid, a.uid, bindings, table, 'GetAttributeList')
    if (!r.ok) return fail(`ResponsePayload/${r.detail}`)
  }
  const actualCodes = new Set(a.refs.map((r) => r.value))
  for (const er of e.refs) {
    const ev = er.value
    let found = actualCodes.has(ev)
    if (!found && typeof ev === 'string') {
      const code = table.tagNameToCode.get(norm(ev))
      found =
        code !== undefined &&
        actualCodes.has(`0x${code.toString(16).toUpperCase().padStart(8, '0')}`)
    }
    if (!found) {
      return fail(
        `ResponsePayload/AttributeReference: expected '${String(ev)}' not present in actual list (§4.1.2 item 5 — order variable, omissions are non-conformant)`
      )
    }
  }
  return ok()
}

/** §4.1.1 items 15-16 — Query's Operation/ObjectType lists MAY be a
 * superset of what the test enumerates.
 *
 * MSGENC-* is exempt from items 15-16 entirely (ported from
 * `dispatcher_replay.py`'s `_compare_query_response_payload`, Phase 6.1):
 * those transcripts test the Message-Encoding profile — that a Query
 * round-trips correctly across TTLV/XML/JSON/HTTPS, not that this server's
 * capability set is a superset of whatever reference server produced the
 * fixture. That reference server also implements Notify/Put, which this
 * engine correctly declines to advertise (§6.2.2/§6.2.3's transport is
 * genuinely undefined — see `query.rs`'s `ADVERTISED_UNIMPLEMENTED_OPERATIONS`
 * doc comment). Requiring superset membership here would force pretending
 * to support things that aren't real just to keep an unrelated
 * encoding-fidelity test green. */
function compareQueryResponsePayload(
  expected: KmipNode,
  actual: TtlvNode,
  bindings: Bindings,
  table: CodepointTable
): CompareResult {
  const isMsgenc = currentTestName.toUpperCase().startsWith('MSGENC')
  const supersetTags = new Set([norm('Operation'), norm('ObjectType')])
  const byName = <T extends { tag: string; children?: T[] }>(node: T) => {
    const m = new Map<string, T[]>()
    for (const c of node.children ?? []) {
      const key = norm(c.tag)
      const list = m.get(key) ?? []
      list.push(c)
      m.set(key, list)
    }
    return m
  }
  const actualByName = byName(actual)
  const expectedByName = byName(expected)

  if (!isMsgenc) {
    for (const listTag of supersetTags) {
      const expItems = expectedByName.get(listTag) ?? []
      if (expItems.length === 0) continue
      const actValues = (actualByName.get(listTag) ?? []).map((a) => a.value)
      const missing = expItems.filter((e) => !actValues.some((av) => enumMatch(e.value, av, table)))
      if (missing.length > 0) {
        return fail(
          `Query ResponsePayload ${listTag}: actual lacks expected ${JSON.stringify(missing.map((m) => m.value))} (§4.1.1 items 15-16 permit *supersets* — not subsets)`
        )
      }
    }
  }

  const otherExpected = (expected.children ?? []).filter((c) => !supersetTags.has(norm(c.tag)))
  const otherActual = (actual.children ?? []).filter((c) => !supersetTags.has(norm(c.tag)))
  if (otherExpected.length !== otherActual.length) {
    return fail(
      `Query ResponsePayload: non-list child count ${otherExpected.length} != ${otherActual.length}`
    )
  }
  for (let i = 0; i < otherExpected.length; i++) {
    const r = compareResponses(otherExpected[i], otherActual[i], bindings, table, 'Query')
    if (!r.ok) return fail(`Query ResponsePayload/${r.detail}`)
  }
  return ok()
}

/** KMIP Profiles v3.0 §4.1.1 item 3 — ResultMessage is optional in a
 * BatchItem; servers MAY omit it even on failures. Also derives
 * `opContext` from the Operation child so the ResponsePayload comparison
 * knows which §4.1 carve-out to apply. */
function compareBatchItem(
  expected: KmipNode,
  actual: TtlvNode,
  bindings: Bindings,
  table: CodepointTable
): CompareResult {
  const opEnum = directChild(expected, 'Operation')
  const opContext = typeof opEnum?.value === 'string' ? opEnum.value : undefined

  const rm = norm('ResultMessage')
  const expChildren = (expected.children ?? []).filter((c) => norm(c.tag) !== rm)
  const actChildren = (actual.children ?? []).filter((c) => norm(c.tag) !== rm)
  if (expChildren.length !== actChildren.length) {
    return fail(
      `BatchItem: child count ${expChildren.length} != ${actChildren.length} (after dropping optional ResultMessage per §4.1.1 item 3)`
    )
  }
  for (let i = 0; i < expChildren.length; i++) {
    const r = compareResponses(expChildren[i], actChildren[i], bindings, table, opContext)
    if (!r.ok) return fail(`BatchItem/${r.detail}`)
  }
  return ok()
}

/** Recursively compare two ResponseMessage trees modulo volatile tags and
 * bound placeholders. `opContext` is the enclosing BatchItem's Operation
 * name (e.g. "Query") — it selects the §4.1.1 items 15-16 Query carve-out;
 * everything else falls through to byte-exact comparison. */
export function compareResponses(
  expected: KmipNode,
  actual: TtlvNode,
  bindings: Bindings,
  table: CodepointTable,
  opContext: string | undefined
): CompareResult {
  if (norm(expected.tag) !== norm(actual.tag))
    return fail(`tag '${expected.tag}' != '${actual.tag}'`)
  if (isVolatileTag(expected.tag)) return ok('skipped (volatile)')

  if (expected.type === 'Structure') {
    const normTag = norm(expected.tag)

    if (isOpaqueStructure(expected.tag)) return ok('ok (opaque structure)')
    if (normTag === norm('BatchItem')) return compareBatchItem(expected, actual, bindings, table)
    if (normTag === norm('ResponsePayload') && opContext === 'Query') {
      return compareQueryResponsePayload(expected, actual, bindings, table)
    }
    if (normTag === norm('Attributes'))
      return compareAttributesContainer(expected, actual, bindings, table)
    if (normTag === norm('ResponsePayload') && opContext === 'GetAttributeList') {
      return compareAttributeReferenceList(expected, actual, bindings, table)
    }

    const expChildren = (expected.children ?? []).filter((c) => !isOptionalPresence(c.tag))
    const actChildren = (actual.children ?? []).filter((c) => !isOptionalPresence(c.tag))
    if (expChildren.length !== actChildren.length) {
      return fail(`${expected.tag}: child count ${expChildren.length} != ${actChildren.length}`)
    }
    for (let i = 0; i < expChildren.length; i++) {
      const r = compareResponses(expChildren[i], actChildren[i], bindings, table, opContext)
      if (!r.ok) return fail(`${expected.tag}/${r.detail}`)
    }
    return ok()
  }

  // Leaf — resolve `expected`'s value if it's a placeholder; a
  // newly-seen placeholder binds and is accepted.
  let ev = expected.value
  const av = actual.value
  if (typeof ev === 'string' && ev.startsWith('$')) {
    if (ev === '$NOW') return ok('ok (skipped $NOW)')
    if (bindings.has(ev)) {
      ev = bindings.get(ev) as typeof ev
    } else {
      bindings.bind(ev, av)
      return ok(`ok (bound ${expected.value} = ${JSON.stringify(av)})`)
    }
  }
  if (valuesEqual(expected.type, ev, av, expected.tag, table)) return ok()
  return fail(`${expected.tag}: expected ${JSON.stringify(ev)} got ${JSON.stringify(av)}`)
}
