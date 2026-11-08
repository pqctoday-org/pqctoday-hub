// SPDX-License-Identifier: AGPL-3.0-only
import { fromBER, Sequence, Set, Constructed, ObjectIdentifier, OctetString } from 'asn1js'
import { AsnConvert } from '@peculiar/asn1-schema'
import { ContentInfo } from '@peculiar/asn1-cms'

const AUTH = '1.2.840.113549.1.9.16.1.23'
const ENV = '1.2.840.113549.1.7.3'
const oid = (value: unknown): string => {
  if (!(value instanceof ObjectIdentifier)) throw new Error('Expected CMS algorithm identifier')
  return value.valueBlock.toString()
}
const seq = (value: unknown) => {
  if (!(value instanceof Sequence)) throw new Error('Unsupported CMS structure')
  return value.valueBlock.value
}
const algorithm = (value: unknown) => oid(seq(value)[0])
export interface CmsEnvelopeInspection {
  contentType: 'AuthEnvelopedData' | 'EnvelopedData'
  contentTypeOid: string
  cipherOid: string
  recipient: string
  recipientOid: string
  oaepHashOid?: string
  mgfHashOid?: string
  oaepLabelHex?: string
  kdfOid?: string
  wrapOid?: string
}

/** Inspect this exercise's single-recipient outputs, not general CMS conformance. */
export function inspectCmsEnvelope(bytes: Uint8Array): CmsEnvelopeInspection {
  const input = bytes.slice().buffer
  const decoded = fromBER(input)
  if (decoded.offset !== bytes.length) throw new Error('Malformed or trailing CMS data')
  const ci = AsnConvert.parse(input, ContentInfo)
  if (ci.contentType !== AUTH && ci.contentType !== ENV)
    throw new Error('Unsupported CMS content type')
  const body = seq(fromBER(ci.content).result)
  // Optional originatorInfo is absent in this sample. Do not misread another layout.
  if (!(body[1] instanceof Set) || body[1].valueBlock.value.length !== 1) {
    throw new Error('Unsupported CMS recipient layout')
  }
  const ri = body[1].valueBlock.value[0]
  const eci = seq(body[2])
  const result: CmsEnvelopeInspection = {
    contentType: ci.contentType === AUTH ? 'AuthEnvelopedData' : 'EnvelopedData',
    contentTypeOid: ci.contentType,
    cipherOid: algorithm(eci[1]),
    recipient: '',
    recipientOid: '',
  }
  if (ri instanceof Sequence) {
    const keyAlgorithm = seq(ri.valueBlock.value[2])
    result.recipientOid = oid(keyAlgorithm[0])
    result.recipient = result.recipientOid === '1.2.840.113549.1.1.7' ? 'RSA-OAEP' : 'RSA transport'
    if (result.recipient === 'RSA-OAEP') {
      // RFC 8017 defaults are SHA-1 if omitted; never report SHA-256 from a label.
      result.oaepHashOid = result.mgfHashOid = '1.3.14.3.2.26'
      result.oaepLabelHex = ''
      for (const param of seq(keyAlgorithm[1])) {
        if (!(param instanceof Constructed)) throw new Error('Unsupported OAEP parameters')
        if (param.idBlock.tagNumber === 0) result.oaepHashOid = algorithm(param.valueBlock.value[0])
        if (param.idBlock.tagNumber === 2) {
          const source = seq(param.valueBlock.value[0])
          if (oid(source[0]) !== '1.2.840.113549.1.1.9' || !(source[1] instanceof OctetString)) {
            throw new Error('Unsupported OAEP label parameters')
          }
          result.oaepLabelHex = Array.from(source[1].valueBlock.valueHexView, (b) =>
            b.toString(16).padStart(2, '0')
          ).join('')
        }
        if (param.idBlock.tagNumber === 1) {
          const mgf = seq(param.valueBlock.value[0])
          if (oid(mgf[0]) !== '1.2.840.113549.1.1.8')
            throw new Error('Unsupported OAEP mask function')
          result.mgfHashOid = algorithm(mgf[1])
        }
      }
    }
  } else if (ri instanceof Constructed && ri.idBlock.tagNumber === 4) {
    if (oid(ri.valueBlock.value[0]) !== '1.2.840.113549.1.9.16.13.3')
      throw new Error('Unsupported CMS other recipient')
    const kem = seq(ri.valueBlock.value[1])
    result.recipient = 'KEMRecipientInfo (RFC 9629; ML-KEM profile RFC 9936)'
    result.recipientOid = algorithm(kem[2])
    result.kdfOid = algorithm(kem[4])
    const wrapIndex = kem[6] instanceof Constructed && kem[6].idBlock.tagClass === 3 ? 7 : 6
    result.wrapOid = algorithm(kem[wrapIndex])
  } else throw new Error('Recipient format unavailable in this sample inspector')
  return result
}
