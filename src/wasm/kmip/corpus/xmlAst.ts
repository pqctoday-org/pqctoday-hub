// SPDX-License-Identifier: GPL-3.0-only
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

/** OASIS XML uses semantic type aliases that resolve to one of the 11 TTLV
 * primitives at wire encode time — mirrors `oasis_codec.py`'s
 * `XML_TYPE_ALIASES`. `Identifier` / `Reference` / `NameReference` are all
 * UID-shaped TextStrings per KMIP 3.0 §9.1.1. */
const XML_TYPE_ALIASES: Record<string, TtlvTypeName> = {
  Identifier: 'TextString',
  Reference: 'TextString',
  NameReference: 'TextString',
}

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
