// SPDX-License-Identifier: AGPL-3.0-only
/** Bounded display decoder for the command structures advertised by this workbench.
 * TPM 2.0 Library v1.85 Part 3 response framing; Part 2 TPM2B, TPMT_SIGNATURE
 * and selector-dependent TPMT_TK_VERIFIED. V2.7 EK provisioning is separate.
 * This reads received bytes; it does not authenticate them or validate a TPM.
 */
export interface ResponseFieldRange {
  offset: number
  size: number
  variable?: boolean
}
export interface DecodedResponse {
  fields: Map<string, ResponseFieldRange>
  parameterStart?: number
  parameterEnd?: number
  authStart?: number
  error?: string
}

class Cursor {
  readonly bytes: Uint8Array
  offset: number
  readonly end: number
  readonly fields: Map<string, ResponseFieldRange>
  constructor(
    bytes: Uint8Array,
    offset: number,
    end: number,
    fields: Map<string, ResponseFieldRange>
  ) {
    this.bytes = bytes
    this.offset = offset
    this.end = end
    this.fields = fields
  }
  take(size: number, name?: string, variable = false): number {
    if (!Number.isSafeInteger(size) || size < 0 || this.offset + size > this.end)
      throw new Error(`Truncated ${name ?? 'response field'} at byte ${this.offset}`)
    const start = this.offset
    if (name) this.fields.set(name, { offset: start, size, variable })
    this.offset += size
    return start
  }
  number(size: 1 | 2 | 4, name?: string): number {
    const off = this.take(size, name)
    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength)
    return size === 1 ? view.getUint8(off) : size === 2 ? view.getUint16(off) : view.getUint32(off)
  }
  sized(name: string): ResponseFieldRange {
    const size = this.number(2, `${name}.size`)
    const offset = this.take(size, `${name}.buffer`, true)
    const range = { offset, size, variable: true }
    this.fields.set(name, range)
    return range
  }
  finish() {
    if (this.offset !== this.end) throw new Error(`Unexpected parameter bytes at ${this.offset}`)
  }
}

function ticket(c: Cursor, prefix = 'validation', expectedTag?: number) {
  const tag = c.number(2, `${prefix}.tag`)
  c.number(4, `${prefix}.hierarchy`)
  if (expectedTag !== undefined) {
    if (tag !== expectedTag) throw new Error('Unsupported ticket selector')
  } else if (tag === 0x8027) c.number(2, `${prefix}.metadata.digestVerified`)
  else if (![0x8022, 0x8026].includes(tag))
    throw new Error('Unsupported verification ticket selector')
  c.sized(`${prefix}.${expectedTag !== undefined ? 'digest' : 'hmac'}`)
}

function signature(c: Cursor) {
  const start = c.offset
  const alg = c.number(2, 'signature.sigAlg')
  if (alg === 0x00a1) c.sized('signature.sig')
  else if (alg === 0x00a2) {
    c.number(2, 'signature.signature.hash')
    c.sized('signature.sig')
  } else if (alg === 0x0014 || alg === 0x0016) {
    c.number(2, 'signature.signature.hash')
    c.sized('signature.signature.sig')
  } else if (alg === 0x0018) {
    c.number(2, 'signature.signature.hash')
    c.sized('signature.signatureR')
    c.sized('signature.signatureS')
  } else throw new Error(`Unsupported signature selector 0x${alg.toString(16)}`)
  c.fields.set('signature', { offset: start, size: c.offset - start, variable: true })
}

function publicArea(c: Cursor) {
  const r = c.sized('outPublic')
  const p = new Cursor(c.bytes, r.offset, r.offset + r.size, c.fields)
  const type = p.number(2, 'outPublic.type')
  p.number(2, 'outPublic.nameAlg')
  p.number(4, 'outPublic.objectAttributes')
  p.sized('outPublic.authPolicy')
  const symmetric = () => {
    const alg = p.number(2)
    if (alg === 0x0006)
      p.take(4) // AES keyBits + mode
    else if (alg !== 0x0010) throw new Error('Unsupported public symmetric selector')
  }
  if (type === 0x00a0) {
    symmetric()
    p.take(2)
  } // ML-KEM parameterSet
  else if (type === 0x00a1)
    p.take(3) // ML-DSA parameterSet + allowExternalMu
  else if (type === 0x0001) {
    symmetric()
    const scheme = p.number(2)
    if ([0x0014, 0x0016, 0x0017].includes(scheme))
      p.take(2) // scheme hash
    else if (![0x0010, 0x0015].includes(scheme)) throw new Error('Unsupported RSA scheme selector')
    p.take(6) // keyBits + exponent
  } else {
    // The outer TPM2B is decoded; unimplemented public unions are never
    // interpreted with a PQC or RSA layout or a placeholder offset.
    return
  }
  p.sized('outPublic.unique')
  p.finish()
}

const HANDLE_COMMANDS = new Set([
  'TPM2_CreatePrimary',
  'TPM2_SignSequenceStart',
  'TPM2_VerifySequenceStart',
  'TPM2_HashSequenceStart',
])

// These advertised commands authorize a handle and return a session response
// on success (the command tables in tpmCommandDefs document each auth index).
const SESSION_COMMANDS = new Set([
  'TPM2_CreatePrimary',
  'TPM2_Decapsulate',
  'TPM2_SignDigest',
  'TPM2_SignSequenceComplete',
  'TPM2_SequenceUpdate',
  'TPM2_VerifySequenceComplete',
  'TPM2_Quote',
  'TPM2_Certify',
  'TPM2_NV_Certify',
  'TPM2_NV_Read',
  'TPM2_Sign',
  'TPM2_RSA_Decrypt',
  'TPM2_SequenceComplete',
])

/** Ranges always point inside the received buffer's declared parameter area.
 * On malformed/unsupported payloads, only bounded header reads survive; the
 * error identifies the framing or payload failure.
 */
export function decodeTpmResponse(command: string, bytes: Uint8Array): DecodedResponse {
  const header = new Map<string, ResponseFieldRange>()
  try {
    const h = new Cursor(bytes, 0, bytes.length, header)
    const tag = h.number(2, 'tag')
    const size = h.number(4, 'responseSize')
    header.set('size', { offset: 2, size: 4 })
    const rc = h.number(4, 'responseCode')
    if (![0x8001, 0x8002].includes(tag)) throw new Error('Unsupported TPM response tag')
    if (size !== bytes.length) throw new Error('Response size does not match received bytes')
    if (rc !== 0) {
      if (tag !== 0x8001 || size !== 10) throw new Error('Invalid TPM error-response framing')
      return { fields: header }
    }
    if (SESSION_COMMANDS.has(command) && tag !== 0x8002)
      throw new Error('This command requires a session response on success')
    const fields = new Map(header)
    const frame = new Cursor(bytes, 10, bytes.length, fields)
    if (HANDLE_COMMANDS.has(command))
      frame.number(4, command === 'TPM2_CreatePrimary' ? 'objectHandle' : 'sequenceHandle')
    let parameterEnd = bytes.length
    if (tag === 0x8002) {
      const parameterSize = frame.number(4, 'paramSize')
      parameterEnd = frame.offset + parameterSize
      if (parameterEnd > bytes.length) throw new Error('Parameter area exceeds response size')
      // TPMS_AUTH_RESPONSE: nonce TPM2B, attributes BYTE, hmac TPM2B.
      const auth = new Cursor(bytes, parameterEnd, bytes.length, new Map())
      let sessions = 0
      while (auth.offset < auth.end) {
        auth.sized('nonce')
        auth.take(1)
        auth.sized('hmac')
        sessions++
        if (sessions > 3) throw new Error('Too many response authorization sessions')
      }
      if (sessions === 0) throw new Error('Missing response authorization area')
    }
    const parameterStart = frame.offset
    const c = new Cursor(bytes, parameterStart, parameterEnd, fields)
    switch (command) {
      case 'TPM2_Startup':
      case 'TPM2_SelfTest':
      case 'TPM2_SequenceUpdate':
      case 'TPM2_SignSequenceStart':
      case 'TPM2_VerifySequenceStart':
      case 'TPM2_HashSequenceStart':
        break
      case 'TPM2_GetCapability': {
        c.number(1, 'moreData')
        if (c.number(4, 'capabilityData.capability') !== 0)
          throw new Error('Unsupported capability union (only algorithms advertised here)')
        const count = c.number(4, 'data.algorithms.count')
        if (count > Math.floor((c.end - c.offset) / 6))
          throw new Error('Truncated algorithm capability list')
        for (let i = 0; i < count; i++) {
          c.number(2, `data.algorithms[${i}].alg`)
          c.take(4)
        }
        break
      }
      case 'TPM2_GetRandom':
        c.sized('randomBytes')
        break
      case 'TPM2_Encapsulate':
        c.sized('sharedSecret')
        c.sized('ciphertext')
        break
      case 'TPM2_Decapsulate':
        c.sized('sharedSecret')
        break
      case 'TPM2_ReadPublic':
        c.sized('outPublic')
        c.sized('name')
        c.sized('qualifiedName')
        break
      case 'TPM2_NV_ReadPublic':
        c.sized('nvPublic')
        c.sized('nvName')
        break
      case 'TPM2_NV_Read':
        c.sized('data')
        break
      case 'TPM2_Quote':
        c.sized('quoted')
        signature(c)
        break
      case 'TPM2_Certify':
      case 'TPM2_NV_Certify':
        c.sized('certifyInfo')
        signature(c)
        break
      case 'TPM2_Sign':
      case 'TPM2_SignDigest':
      case 'TPM2_SignSequenceComplete':
        signature(c)
        break
      case 'TPM2_VerifySignature':
      case 'TPM2_VerifyDigestSignature':
      case 'TPM2_VerifySequenceComplete':
        ticket(c)
        break
      case 'TPM2_RSA_Encrypt':
        c.sized('outData')
        break
      case 'TPM2_RSA_Decrypt':
        c.sized('message')
        break
      case 'TPM2_SequenceComplete':
        c.sized('result')
        ticket(c, 'validation', 0x8024)
        break
      case 'TPM2_CreatePrimary':
        publicArea(c)
        c.sized('creationData')
        c.sized('creationHash')
        ticket(c, 'creationTicket', 0x8021)
        c.sized('name')
        break
      default:
        throw new Error('No supported wire response structure for this command')
    }
    c.finish()
    return {
      fields,
      parameterStart,
      parameterEnd,
      ...(tag === 0x8002 ? { authStart: parameterEnd } : {}),
    }
  } catch (error) {
    return { fields: header, error: error instanceof Error ? error.message : String(error) }
  }
}
