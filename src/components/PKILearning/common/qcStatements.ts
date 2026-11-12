// SPDX-License-Identifier: AGPL-3.0-only
import { fromBER, ObjectIdentifier, Sequence } from 'asn1js'

/** Validate an explicit QCStatements payload, never infer legal qualification from its presence. */
export function normalizeQcStatements(value: string, critical: boolean): string {
  const [format, ...parts] = value.split(':')
  if (
    format.toUpperCase() !== 'DER' ||
    !parts.length ||
    parts.some((part) => part.length % 2 !== 0 || !/^[a-f0-9]+$/i.test(part))
  )
    throw new Error(
      'qcStatements needs a complete DER value; unresolved ASN.1 sections are not emitted'
    )
  const hex = parts.join('').toLowerCase()
  const bytes = Uint8Array.from(hex.match(/../g)!, (pair) => Number.parseInt(pair, 16))
  const parsed = fromBER(bytes.buffer)
  if (
    parsed.offset !== bytes.length ||
    parsed.result.error ||
    !(parsed.result instanceof Sequence) ||
    parsed.result.lenBlock.isIndefiniteForm
  )
    throw new Error(
      'qcStatements must contain one complete DER SEQUENCE, without truncation or trailing bytes'
    )
  const seenEtsi = new Set<string>()
  for (const statement of parsed.result.valueBlock.value) {
    if (!(statement instanceof Sequence) || statement.lenBlock.isIndefiniteForm)
      throw new Error('Each QCStatement must be a DER SEQUENCE')
    const [identifier, information, ...extra] = statement.valueBlock.value
    if (!(identifier instanceof ObjectIdentifier) || extra.length)
      throw new Error('Each QCStatement needs a statement OID and at most one information value')
    const oid = identifier.valueBlock.toString()
    if (oid.startsWith('0.4.0.1862.1.')) {
      if (critical) throw new Error('ETSI QCStatements must be non-critical')
      if (seenEtsi.has(oid))
        throw new Error('ETSI QCStatements must not repeat a statement identifier')
      seenEtsi.add(oid)
    }
    if (['0.4.0.1862.1.1', '0.4.0.1862.1.4'].includes(oid) && information)
      throw new Error('ETSI QcCompliance and QcSSCD do not carry statement information')
    if (oid === '0.4.0.1862.1.6') {
      if (
        !(information instanceof Sequence) ||
        information.lenBlock.isIndefiniteForm ||
        information.valueBlock.value.length !== 1 ||
        information.valueBlock.value.some((entry) => !(entry instanceof ObjectIdentifier))
      )
        throw new Error('ETSI QcType needs a SEQUENCE containing exactly one type OID')
    }
    // Other statement identifiers remain uninterpreted. A structurally valid
    // unknown statement is not assigned a known QC meaning or compliance status.
  }
  return `DER:${hex}`
}
