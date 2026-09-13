// SPDX-License-Identifier: GPL-3.0-only
//
// encode.ts — resolves a friendly `KmipNode` tree (tag/enum by NAME) into
// the wire-ready `TtlvNode` shape (`{tag: "0x...", type, value, children}`)
// the wasm `encode_ttlv` binding consumes — tag names → codepoints, enum
// names → numeric values, named Integer masks → OR'd bitmasks. Stops at the
// JSON tree; `KmipEngine.encodeTtlv` does the actual byte-packing in Rust.
//
// Ported from pqctoday-hsm/kmip/python-client/src/pqctoday_kmip/_ttlv.py's
// `_encode_value` — same per-type rules, same AttributeReference special
// case, same named-mask flag parsing. Output format matches `decode_ttlv`'s
// `frame_json` exactly (uppercase hex tag/enum, lowercase hex byte strings)
// so a decoded tree and a freshly-built one render identically in
// `WireTreeView.tsx`.

import type { TtlvNode } from '../kmipEngine'
import { norm, type KmipNode } from './nodes'
import type { CodepointTable } from './codepointTable'

// Named bit-flag tables for Integer-typed mask fields — mirrors _ttlv.py's
// `CRYPTOGRAPHIC_USAGE_MASK` / `PROTECTION_STORAGE_MASK` / `NAMED_INTEGER_MASKS`.
const CRYPTOGRAPHIC_USAGE_MASK: Record<string, number> = {
  Sign: 0x00000001,
  Verify: 0x00000002,
  Encrypt: 0x00000004,
  Decrypt: 0x00000008,
  WrapKey: 0x00000010,
  UnwrapKey: 0x00000020,
  Export: 0x00000040,
  MACGenerate: 0x00000080,
  MACVerify: 0x00000100,
  DeriveKey: 0x00000200,
  ContentCommitment: 0x00000400,
  KeyAgreement: 0x00000800,
  CertificateSign: 0x00001000,
  CRLSign: 0x00002000,
  Authenticate: 0x00004000,
  Unrestricted: 0x00008000,
  FPEEncrypt: 0x00010000,
  FPEDecrypt: 0x00020000,
  Encapsulate: 0x00040000,
  Decapsulate: 0x00080000,
}

const PROTECTION_STORAGE_MASK: Record<string, number> = {
  Software: 0x00000001,
  Hardware: 0x00000002,
  OnProcessor: 0x00000004,
  OnSystem: 0x00000008,
  OffSystem: 0x00000010,
  Hypervisor: 0x00000020,
  OperatingSystem: 0x00000040,
  Container: 0x00000080,
  OnPremises: 0x00000100,
  OffPremises: 0x00000200,
  SelfManaged: 0x00000400,
  Outsourced: 0x00000800,
  Validated: 0x00001000,
  SameJurisdiction: 0x00002000,
}

export const NAMED_INTEGER_MASKS: Record<string, Record<string, number>> = {
  CryptographicUsageMask: CRYPTOGRAPHIC_USAGE_MASK,
  ProtectionStorageMask: PROTECTION_STORAGE_MASK,
}

export class EncodeError extends Error {}

const isDigits = (s: string): boolean => /^-?\d+$/.test(s)
const isHexLiteral = (s: string): boolean => /^0x[0-9a-fA-F]+$/.test(s)

const tagHex = (code: number): string => `0x${code.toString(16).toUpperCase().padStart(6, '0')}`
const enumHex = (code: number): string =>
  `0x${(code >>> 0).toString(16).toUpperCase().padStart(8, '0')}`

function encodeInteger(tag: string, value: string | number): number {
  if (typeof value === 'number') return value
  const namedMaskKey = Object.keys(NAMED_INTEGER_MASKS).find((k) => norm(k) === norm(tag))
  if (namedMaskKey && !isDigits(value) && !isHexLiteral(value)) {
    const table = NAMED_INTEGER_MASKS[namedMaskKey]
    let acc = 0
    for (const flag of value.split(/\s+/).filter(Boolean)) {
      const bit = table[flag]
      if (bit === undefined) {
        throw new EncodeError(
          `unknown ${tag} flag '${flag}'; known: ${Object.keys(table).slice(0, 6).join(', ')}…`
        )
      }
      acc |= bit
    }
    return acc
  }
  return Number(value)
}

/** DateTime accepts either Unix-epoch seconds (a plain/negative integer
 * string or number — the codec self-test path uses `"0"`) or an ISO 8601
 * string with a timezone offset (real OASIS corpus fixtures use
 * `"2000-01-01T00:00:00+10:00"`) — mirrors `_encode_value`'s
 * `datetime.fromisoformat(sv)` fallback. */
function encodeDateTime(value: string | number | boolean): number {
  if (typeof value === 'number') return value
  const s = String(value)
  if (/^-?\d+$/.test(s)) return Number(s)
  const ms = Date.parse(s)
  if (Number.isNaN(ms)) throw new EncodeError(`invalid DateTime '${s}'`)
  return Math.floor(ms / 1000)
}

function encodeEnumeration(tag: string, value: string | number, table: CodepointTable): number {
  if (typeof value === 'number') return value
  const tagNorm = norm(tag)
  if (tagNorm === norm('AttributeReference')) {
    const code = table.tagNameToCode.get(norm(value))
    if (code === undefined) throw new EncodeError(`AttributeReference: unknown tag name '${value}'`)
    return code
  }
  if (isHexLiteral(value) || isDigits(value)) return Number(value)
  const enumMap = table.enumNameToValue.get(tagNorm)
  if (!enumMap) throw new EncodeError(`no enum definition for tag '${tag}' (value '${value}')`)
  const code = enumMap.get(norm(value))
  if (code === undefined) {
    throw new EncodeError(
      `unknown enum member '${value}' for '${tag}'; known: ${Array.from(enumMap.keys()).slice(0, 6).join(', ')}…`
    )
  }
  return code
}

/** Resolve one friendly node (and its subtree) into the wire-ready
 * `TtlvNode` shape. Throws `EncodeError` on an unknown tag/enum name — a
 * template-authoring bug, not a KMIP-protocol outcome. */
export function toWireTree(node: KmipNode, table: CodepointTable): TtlvNode {
  const code = table.tagNameToCode.get(norm(node.tag))
  if (code === undefined) throw new EncodeError(`unknown tag name '${node.tag}'`)
  const tag = tagHex(code)

  if (node.type === 'Structure') {
    return {
      tag,
      type: 'Structure',
      children: (node.children ?? []).map((c) => toWireTree(c, table)),
    }
  }

  const v = node.value
  if (v === undefined) throw new EncodeError(`'${node.tag}' (${node.type}) has no value`)

  switch (node.type) {
    case 'Integer':
      return { tag, type: 'Integer', value: encodeInteger(node.tag, v as string | number) }
    case 'LongInteger':
      return { tag, type: 'LongInteger', value: Number(v) }
    case 'Enumeration':
      return {
        tag,
        type: 'Enumeration',
        value: enumHex(encodeEnumeration(node.tag, v as string | number, table)),
      }
    case 'Boolean':
      // A string "false"/"0" (from XML-sourced data) must NOT become the JS
      // boolean `true` via a bare `Boolean(v)` truthiness check — mirrors
      // `_encode_value`'s `str(v).lower() in ("true", "1")` explicitly.
      return {
        tag,
        type: 'Boolean',
        value: typeof v === 'boolean' ? v : ['true', '1'].includes(String(v).toLowerCase()),
      }
    case 'TextString':
      return { tag, type: 'TextString', value: String(v) }
    case 'Identifier':
      return { tag, type: 'Identifier', value: String(v) }
    case 'Reference':
      return { tag, type: 'Reference', value: String(v) }
    case 'NameReference':
      return { tag, type: 'NameReference', value: String(v) }
    case 'ByteString':
      return { tag, type: 'ByteString', value: String(v).toLowerCase() }
    case 'DateTime':
      return { tag, type: 'DateTime', value: encodeDateTime(v) }
    case 'Interval':
      return { tag, type: 'Interval', value: Number(v) }
    case 'BigInteger':
      return { tag, type: 'BigInteger', value: String(v).toLowerCase() }
    case 'DateTimeExtended':
      return { tag, type: 'DateTimeExtended', value: Number(v) }
    default:
      throw new EncodeError(`unsupported TTLV type '${node.type as string}' on '${node.tag}'`)
  }
}
