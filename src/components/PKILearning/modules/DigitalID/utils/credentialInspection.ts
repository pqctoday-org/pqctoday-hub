// SPDX-License-Identifier: AGPL-3.0-only
import { decode } from 'cborg'
import type { VerifiableCredential } from '../types'

export interface RecordedTime {
  label: string
  raw: unknown
  milliseconds?: number
  iso?: string
  issue?: string
  expiration: boolean
}
export interface CredentialInspection {
  ok: boolean
  error?: string
  encoded?: string
  encodedLabel?: string
  decoded?: unknown
  times: RecordedTime[]
}
const object = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const bytesToUrl = (bytes: Uint8Array) =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
export function decodeSampleBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length % 4 === 1)
    throw new Error('Malformed sample base64url')
  const base = value.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(base.padEnd(Math.ceil(base.length / 4) * 4, '=')), (c) =>
    c.charCodeAt(0)
  )
  if (bytesToUrl(bytes) !== value) throw new Error('Noncanonical sample base64url')
  return bytes
}
function jsonPart(value: string): { text: string; value: unknown } {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(decodeSampleBase64Url(value))
  return { text, value: JSON.parse(text) as unknown }
}
/** Existing stored UTC/offset ISO values only; missing/invalid fields never gain a duration. */
export function recordedIsoTime(label: string, raw: unknown, expiration = false): RecordedTime {
  const result: RecordedTime = { label, raw, expiration }
  if (raw === undefined || raw === null || raw === '')
    return { ...result, issue: 'Field not recorded' }
  if (typeof raw !== 'string') return { ...result, issue: 'Expected an ISO date string' }
  const match = raw.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/
  )
  if (!match) return { ...result, issue: 'Invalid or timezone-free ISO date' }
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number)
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const zone = match[7]
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > monthDays[month - 1] ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    (zone !== 'Z' && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59))
  )
    return { ...result, issue: 'Invalid calendar date or timezone' }
  const milliseconds = Date.parse(raw)
  return Number.isFinite(milliseconds)
    ? { ...result, milliseconds, iso: new Date(milliseconds).toISOString() }
    : { ...result, issue: 'Date is outside the supported range' }
}
function numericTime(label: string, raw: unknown, expiration = false): RecordedTime {
  const result: RecordedTime = { label, raw, expiration }
  if (raw === undefined || raw === null) return { ...result, issue: 'Field not recorded' }
  if (typeof raw !== 'number' || !Number.isFinite(raw))
    return { ...result, issue: 'Expected a finite NumericDate in seconds' }
  const milliseconds = raw * 1000
  if (!Number.isFinite(new Date(milliseconds).getTime()))
    return { ...result, issue: 'Date is outside the supported range' }
  return { ...result, milliseconds, iso: new Date(milliseconds).toISOString() }
}
const cbor = (bytes: Uint8Array): unknown =>
  decode(bytes, {
    useMaps: true,
    rejectDuplicateMapKeys: true,
    allowIndefinite: false,
    allowUndefined: false,
    allowNaN: false,
    allowInfinity: false,
  })
function base64(value: string): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value) || !value)
    throw new Error('Malformed issuerAuth base64')
  const binary = atob(value)
  if (btoa(binary) !== value) throw new Error('Noncanonical issuerAuth base64')
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}
/** Inspect this Hub's existing stored samples. No signature, trust, status or complete profile check. */
export function inspectStoredCredential(
  credential: Pick<VerifiableCredential, 'format' | 'raw'>
): CredentialInspection {
  try {
    const stored = credential.raw
    if (!stored) throw new Error('Stored raw sample is missing')
    const wrapper: unknown = stored.trimStart().startsWith('{') ? JSON.parse(stored) : undefined
    if (credential.format === 'dc+sd-jwt') {
      if (wrapper !== undefined && (!object(wrapper) || typeof wrapper.raw !== 'string'))
        throw new Error('Stored SD-JWT wrapper has no encoded raw token')
      const encoded = object(wrapper) ? (wrapper.raw as string) : stored
      const parts = encoded.split('~')
      if (parts.length < 2 || parts.at(-1) !== '')
        throw new Error('Expected the issued sample SD-JWT with a trailing disclosure separator')
      const jwt = parts[0].split('.')
      if (jwt.length !== 3 || jwt.some((p) => !p)) throw new Error('Malformed issuer JWT structure')
      const header = jsonPart(jwt[0]).value,
        payload = jsonPart(jwt[1]).value
      if (!object(header) || !object(payload))
        throw new Error('Issuer JWT header and payload must be JSON objects')
      const width =
        header.alg === 'ES256' || header.alg === 'EdDSA' ? 64 : header.alg === 'ES384' ? 96 : 0
      if (header.typ !== 'dc+sd-jwt' || !width)
        throw new Error('Unsupported stored issuer JWT sample profile')
      if (decodeSampleBase64Url(jwt[2]).length !== width)
        throw new Error('Issuer JWT signature encoding has the wrong selected-profile width')
      const encodedDisclosures = parts.slice(1, -1)
      if (new Set(encodedDisclosures).size !== encodedDisclosures.length)
        throw new Error('Duplicate sample disclosure')
      const disclosures = encodedDisclosures.map((part) => {
        const parsed = jsonPart(part)
        if (
          !Array.isArray(parsed.value) ||
          parsed.value.length !== 3 ||
          typeof parsed.value[0] !== 'string' ||
          !parsed.value[0] ||
          typeof parsed.value[1] !== 'string' ||
          !parsed.value[1]
        )
          throw new Error('Malformed named sample disclosure')
        return parsed
      })
      if (object(wrapper)) {
        if (
          wrapper.issuerJwt !== parts[0] ||
          !Array.isArray(wrapper.disclosures) ||
          wrapper.disclosures.length !== encodedDisclosures.length
        )
          throw new Error('Stored wrapper does not match its encoded issuer JWT/disclosure list')
        for (let i = 0; i < disclosures.length; i++) {
          const mirror: unknown = wrapper.disclosures[i],
            actual = disclosures[i].value as unknown[]
          if (
            !object(mirror) ||
            mirror.encoded !== encodedDisclosures[i] ||
            mirror.raw !== disclosures[i].text ||
            mirror.salt !== actual[0] ||
            mirror.key !== actual[1] ||
            JSON.stringify(mirror.value) !== JSON.stringify(actual[2])
          )
            throw new Error('Stored disclosure wrapper does not match its encoded disclosure')
        }
      }
      return {
        ok: true,
        encoded,
        encodedLabel: 'Encoded SD-JWT issuer token and disclosures',
        decoded: { header, payload, disclosures: disclosures.map((d) => d.value) },
        times: [
          numericTime('Encoded issuer iat', payload.iat),
          numericTime('Encoded issuer exp', payload.exp, true),
        ],
      }
    }
    if (credential.format === 'mso_mdoc') {
      if (!object(wrapper) || typeof wrapper.issuerSignature !== 'string')
        throw new Error('Stored mdoc wrapper has no encoded issuerSignature block')
      const encoded = wrapper.issuerSignature,
        cose = cbor(base64(encoded))
      if (
        !Array.isArray(cose) ||
        cose.length !== 4 ||
        !(cose[0] instanceof Uint8Array) ||
        !(cose[1] instanceof Map) ||
        !(cose[2] instanceof Uint8Array) ||
        !(cose[3] instanceof Uint8Array)
      )
        throw new Error('Expected the sample COSE_Sign1 four-item structure with embedded payload')
      const protectedHeader = cbor(cose[0]),
        payload = cbor(cose[2])
      if (!(protectedHeader instanceof Map) || !(payload instanceof Map))
        throw new Error('Expected CBOR maps for protected header and MSO payload')
      const algorithm = protectedHeader.get(1),
        width = algorithm === -7 ? 64 : algorithm === -35 ? 96 : 0
      if (!width || cose[3].length !== width)
        throw new Error('Unsupported or incompatible sample COSE signature encoding')
      if (typeof payload.get('docType') !== 'string' || wrapper.docType !== payload.get('docType'))
        throw new Error('Stored wrapper docType does not match the encoded MSO')
      const validity: unknown = payload.get('validityInfo')
      const field = (name: string) => (validity instanceof Map ? validity.get(name) : undefined)
      const times = [
        recordedIsoTime('Encoded MSO signed', field('signed')),
        recordedIsoTime('Encoded MSO validFrom', field('validFrom')),
        recordedIsoTime('Encoded MSO validUntil', field('validUntil'), true),
      ]
      if (
        times[1].milliseconds !== undefined &&
        times[2].milliseconds !== undefined &&
        times[1].milliseconds > times[2].milliseconds
      )
        throw new Error('Encoded validFrom is later than validUntil')
      return {
        ok: true,
        encoded,
        encodedLabel: 'Encoded COSE_Sign1 issuerAuth block (base64)',
        decoded: {
          protectedHeader,
          unprotectedHeader: cose[1],
          mobileSecurityObject: payload,
          signatureBytes: cose[3].length,
        },
        times,
      }
    }
    throw new Error('No encoded inspector is provided for this stored sample format')
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error), times: [] }
  }
}
/** Preserve CBOR map key types and byte strings in the display, not a lossy JSON mirror. */
export function inspectedJson(value: unknown): string {
  return (
    JSON.stringify(
      value,
      (_key, item: unknown) =>
        item instanceof Map
          ? { cborMapEntries: [...item.entries()] }
          : item instanceof Uint8Array
            ? { bytesHex: Array.from(item, (b) => b.toString(16).padStart(2, '0')).join('') }
            : typeof item === 'bigint'
              ? { integer: item.toString() }
              : item,
      2
    ) ?? 'null'
  )
}
