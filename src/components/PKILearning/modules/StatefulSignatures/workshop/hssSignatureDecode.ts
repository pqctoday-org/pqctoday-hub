// SPDX-License-Identifier: AGPL-3.0-only
/** RFC8554 §§4.3,5.3,5.4.1,6.2 and RFC9858 parameter tables.
 * Structural wire decoding only: no hashing, signature verification or key-state operations.
 */
export interface EncodedField {
  offset: number
  length: number
  hex: string
}
export interface LmotsType {
  id: number
  name: string
  n: number
  w: number
  p: number
}
export interface LmsType {
  id: number
  name: string
  m: number
  h: number
}
export interface DecodedLmsSignature {
  bytes: EncodedField
  q: number
  qField: EncodedField
  lmots: {
    type: LmotsType
    typeField: EncodedField
    bytes: EncodedField
    C: EncodedField
    y: EncodedField[]
    payload: EncodedField
  }
  lms: LmsType
  typeField: EncodedField
  authPath: EncodedField[]
  authPathBytes: EncodedField
}
export interface DecodedChildPublicKey {
  bytes: EncodedField
  lms: LmsType
  lmsTypeField: EncodedField
  lmots: LmotsType
  lmotsTypeField: EncodedField
  I: EncodedField
  root: EncodedField
}
export interface DecodedHssSignature {
  nspk: number
  prefix: EncodedField
  levels: number
  totalBytes: number
  signedPublicKeys: { signature: DecodedLmsSignature; publicKey: DecodedChildPublicKey }[]
  messageSignature: DecodedLmsSignature
}
const heights = [5, 10, 15, 20, 25] as const
const lmotsGroups = [
  { first: 1, hash: 'SHA256', n: 32, p: [265, 133, 67, 34] },
  { first: 5, hash: 'SHA256', n: 24, p: [200, 101, 51, 26] },
  { first: 9, hash: 'SHAKE', n: 32, p: [265, 133, 67, 34] },
  { first: 13, hash: 'SHAKE', n: 24, p: [200, 101, 51, 26] },
] as const
export function lmotsType(id: number): LmotsType {
  const group = lmotsGroups.find((g) => id >= g.first && id < g.first + 4)
  if (!group) throw new Error(`Unknown LMOTS type ${id}`)
  const index = id - group.first,
    w = [1, 2, 4, 8].at(index)!,
    p = group.p.at(index)!
  return { id, name: `LMOTS_${group.hash}_N${group.n}_W${w}`, n: group.n, w, p }
}
export function lmsType(id: number): LmsType {
  const groups = [
    { first: 5, hash: 'SHA256', m: 32 },
    { first: 10, hash: 'SHA256', m: 24 },
    { first: 15, hash: 'SHAKE', m: 32 },
    { first: 20, hash: 'SHAKE', m: 24 },
  ]
  const group = groups.find((g) => id >= g.first && id < g.first + 5)
  if (!group) throw new Error(`Unknown LMS type ${id}`)
  const h = heights.at(id - group.first)!
  return { id, name: `LMS_${group.hash}_M${group.m}_H${h}`, m: group.m, h }
}
/** All offsets are zero-based byte offsets into the original HSS signature. */
export function decodeHssSignature(input: Uint8Array): DecodedHssSignature {
  let cursor = 0
  const view = new DataView(input.buffer, input.byteOffset, input.byteLength)
  function fieldAt(offset: number, length: number): EncodedField {
    return {
      offset,
      length,
      hex: Array.from(input.subarray(offset, offset + length), (b) =>
        b.toString(16).padStart(2, '0')
      ).join(''),
    }
  }
  function take(length: number, label: string): EncodedField {
    if (length > input.length - cursor)
      throw new Error(
        `Truncated ${label} at byte ${cursor}: need ${length}, have ${input.length - cursor}`
      )
    const result = fieldAt(cursor, length)
    cursor += length
    return result
  }
  function u32(label: string) {
    const field = take(4, label)
    return { value: view.getUint32(field.offset, false), field }
  }
  function signature(): DecodedLmsSignature {
    const start = cursor,
      q = u32('LMS q'),
      otsStart = cursor,
      ots = u32('LMOTS type'),
      type = lmotsType(ots.value)
    const C = take(type.n, 'LMOTS C'),
      payloadStart = cursor
    const y = Array.from({ length: type.p }, (_, i) => take(type.n, `LMOTS y[${i}]`))
    const payload = fieldAt(payloadStart, type.p * type.n),
      lmotsBytes = fieldAt(otsStart, cursor - otsStart)
    const lt = u32('LMS type'),
      lms = lmsType(lt.value)
    if (q.value >= 2 ** lms.h) throw new Error(`LMS q ${q.value} is outside height-${lms.h} tree`)
    const authStart = cursor,
      authPath = Array.from({ length: lms.h }, (_, i) => take(lms.m, `authentication path[${i}]`))
    return {
      bytes: fieldAt(start, cursor - start),
      q: q.value,
      qField: q.field,
      lmots: { type, typeField: ots.field, bytes: lmotsBytes, C, y, payload },
      lms,
      typeField: lt.field,
      authPath,
      authPathBytes: fieldAt(authStart, cursor - authStart),
    }
  }
  function publicKey(): DecodedChildPublicKey {
    const start = cursor,
      lt = u32('child LMS type'),
      lms = lmsType(lt.value),
      ot = u32('child LMOTS type'),
      lmots = lmotsType(ot.value)
    const I = take(16, 'child identifier I'),
      root = take(lms.m, 'child root T[1]')
    return {
      bytes: fieldAt(start, cursor - start),
      lms,
      lmsTypeField: lt.field,
      lmots,
      lmotsTypeField: ot.field,
      I,
      root,
    }
  }
  const prefix = u32('HSS Nspk')
  if (prefix.value > 7) throw new Error(`HSS Nspk ${prefix.value} is outside RFC8554 levels 1–8`)
  const signedPublicKeys: DecodedHssSignature['signedPublicKeys'] = []
  let previous: DecodedChildPublicKey | undefined
  function checkedSignature() {
    const result = signature()
    if (
      previous &&
      (result.lms.id !== previous.lms.id || result.lmots.type.id !== previous.lmots.id)
    )
      throw new Error('Signature typecodes differ from the preceding child public key')
    return result
  }
  for (let i = 0; i < prefix.value; i++) {
    const sig = checkedSignature(),
      key = publicKey()
    signedPublicKeys.push({ signature: sig, publicKey: key })
    previous = key
  }
  const messageSignature = checkedSignature()
  if (cursor !== input.length)
    throw new Error(`Trailing signature bytes at byte ${cursor}: ${input.length - cursor} remain`)
  return {
    nspk: prefix.value,
    prefix: prefix.field,
    levels: prefix.value + 1,
    totalBytes: cursor,
    signedPublicKeys,
    messageSignature,
  }
}
