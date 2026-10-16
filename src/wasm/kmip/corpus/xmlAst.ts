// SPDX-License-Identifier: AGPL-3.0-only
//
// xmlAst.ts — parse an OASIS KMIP 3.0 conformance test transcript (an XML
// file of alternating <RequestMessage>/<ResponseMessage> elements, each
// carrying TTLV-typed children) into the same friendly `KmipNode` tree
// shape `ttlv/nodes.ts` already uses — so the existing `toWireTree()` /
// `encodeTtlv` pipeline from Phase B can encode a transcript's requests
// without any new encoding logic.
//
// Ported from pqctoday-hsm/kmip/conformance/harness/oasis_codec.py's
// `parse_transcript_xml`/`parse_xml_element`, using the browser's native
// `DOMParser` instead of Python's `xml.etree.ElementTree`.
import type { KmipNode, TtlvTypeName } from '../ttlv/nodes'

/** OASIS XML uses semantic type aliases that resolve to one of the 14 TTLV
 * primitives at wire encode time — mirrors `oasis_codec.py`'s
 * `XML_TYPE_ALIASES`, which is now empty: `Identifier` (0x0C) / `Reference`
 * (0x0D) / `NameReference` (0x0E) are their own distinct KMIP 3.0 §11.25
 * item types, not TextString. This alias table used to collapse all three
 * to TextString — the exact bug the engine's own G1 remediation fixed on
 * the Rust/Python side (see kmip/docs/CONFORMANCE_REPORT.md §8 G1); this
 * hub port of the Python parser was never updated to match, so every
 * placeholder-bound UniqueIdentifier/Link this parser encoded was silently
 * downgraded to TextString and rejected by the now-strict engine (found
 * 2026-09-07 diagnosing AX-M-1-30's "child count 3 != 2": one of two
 * AddAttribute calls in the batch failed decode with exactly that error). */
const XML_TYPE_ALIASES: Record<string, TtlvTypeName> = {}

const TTLV_TYPES = new Set<string>([
  'Structure',
  'Integer',
  'LongInteger',
  'BigInteger',
  'Enumeration',
  'Boolean',
  'TextString',
  'ByteString',
  'DateTime',
  'Interval',
  'DateTimeExtended',
  'Identifier',
  'Reference',
  'NameReference',
])

function resolveType(raw: string | null): TtlvTypeName {
  if (raw === null || raw === 'Structure') return 'Structure'
  const aliased = XML_TYPE_ALIASES[raw] ?? raw
  if (!TTLV_TYPES.has(aliased)) {
    throw new Error(`unknown TTLV type '${raw}' in corpus XML`)
  }
  return aliased as TtlvTypeName
}

function parseElement(el: Element): KmipNode {
  const tag = el.tagName
  const typeAttr = el.getAttribute('type')
  const type = resolveType(typeAttr)

  if (type === 'Structure') {
    const children: KmipNode[] = []
    for (const child of Array.from(el.children)) children.push(parseElement(child))
    return { tag, type: 'Structure', children }
  }

  const value = el.getAttribute('value') ?? ''
  return { tag, type, value }
}

/** Parse a full OASIS test-case XML file into a flat list of top-level
 * `RequestMessage`/`ResponseMessage` nodes, in transcript order. Mirrors
 * `parse_transcript_xml`: strips `# <filename>`-style comment lines (the
 * PQC interop corpus prefixes each file with one; the published-3.0 corpus
 * has none, so this is a no-op there) and wraps bare message pairs in a
 * synthetic `<KMIP>` root since the files don't always include one. */
export function parseTranscriptXml(xmlText: string): KmipNode[] {
  let text = xmlText
  if (text.includes('#')) {
    text = text
      .split('\n')
      .filter((line) => !line.trimStart().startsWith('#'))
      .join('\n')
  }
  if (!text.includes('<KMIP>')) {
    text = `<KMIP>${text}</KMIP>`
  }
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const parseError = doc.querySelector('parsererror')
  if (parseError) throw new Error(`XML parse error: ${parseError.textContent ?? 'unknown'}`)
  const root = doc.documentElement
  return Array.from(root.children).map(parseElement)
}
