// SPDX-License-Identifier: AGPL-3.0-only
import { ed25519, x25519 } from '@noble/curves/ed25519.js'
import { sha256 } from '@noble/hashes/sha2.js'
import fixtures from '../../VPNSSHModule/data/sshMeasuredSamples.json'
import {
  measureSshSample,
  type EncodedSshSample,
} from '../../VPNSSHModule/data/measuredSshHandshake'

export const sshSampleHex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
export const sshJoin = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0))
  let i = 0
  for (const p of parts) {
    out.set(p, i)
    i += p.length
  }
  return out
}
export function sshString(bytes: Uint8Array) {
  if (bytes.length > 0xffffffff) throw new Error('SSH string is too large')
  const length = new Uint8Array(4)
  new DataView(length.buffer).setUint32(0, bytes.length, false)
  return sshJoin(length, bytes)
}
/** RFC4251§5 positive mpint; RFC8731§3.1 interprets the shared output as unsigned big-endian (no reversal). */
export function sshPositiveMpint(bytes: Uint8Array) {
  let start = 0
  while (start < bytes.length && bytes.at(start) === 0) start++
  const value = bytes.slice(start)
  return sshString(value.length && value[0] & 0x80 ? sshJoin(new Uint8Array([0]), value) : value)
}
export interface SshHashFields {
  V_C: Uint8Array
  V_S: Uint8Array
  I_C: Uint8Array
  I_S: Uint8Array
  K_S: Uint8Array
  Q_C: Uint8Array
  Q_S: Uint8Array
  K: Uint8Array
}
const isBytes = (value: unknown): value is Uint8Array =>
  ArrayBuffer.isView(value) && Object.prototype.toString.call(value) === '[object Uint8Array]'
const fields = ['V_C', 'V_S', 'I_C', 'I_S', 'K_S', 'Q_C', 'Q_S', 'K'] as const
/** Exactly the existing curve25519-sha256 method's eight fields, not cookies or SSH packet framing. */
export function serializeSshExchangeHash(input: SshHashFields) {
  const encoded = fields.map((name) => {
    const value = new Map<string, Uint8Array>(Object.entries(input)).get(name)
    if (!isBytes(value) || value.length === 0) throw new Error(`Missing SSH field ${name}`)
    if ((name === 'Q_C' || name === 'Q_S' || name === 'K') && value.length !== 32)
      throw new Error(`Wrong Curve25519 ${name} length`)
    if (name === 'K' && value.every((b) => b === 0)) throw new Error('All-zero SSH shared secret')
    if (name === 'I_C' || name === 'I_S') validateSshKexInit(value)
    if (
      (name === 'V_C' || name === 'V_S') &&
      (!new TextDecoder().decode(value).startsWith('SSH-2.0-') ||
        value.some((b) => b === 10 || b === 13))
    )
      throw new Error('Invalid SSH identification field')
    if (
      name === 'K_S' &&
      (value.length !== 51 ||
        new DataView(value.buffer, value.byteOffset, 4).getUint32(0, false) !== 11 ||
        new TextDecoder().decode(value.slice(4, 15)) !== 'ssh-ed25519' ||
        new DataView(value.buffer, value.byteOffset + 15, 4).getUint32(0, false) !== 32)
    )
      throw new Error('Invalid ssh-ed25519 host-key blob')
    return { name, bytes: name === 'K' ? sshPositiveMpint(value) : sshString(value) }
  })
  return { encoded, bytes: sshJoin(...encoded.map((f) => f.bytes)) }
}
function retainedNegotiation(fixture: EncodedSshSample) {
  measureSshSample('classical', fixture)
  const payload = (direction: string, name: string) => {
    const m = fixture.messages.find((m) => m.direction === direction && m.name === name)
    if (!m) throw new Error('Missing retained negotiation message')
    const raw = Uint8Array.from(atob(m.base64), (c) => c.charCodeAt(0))
    if (name === 'Identification') return raw.slice(0, -2) // No CRLF in H.
    return raw.slice(5, raw.length - raw[4]) // Complete KEXINIT payload, including20 andcookie16.
  }
  const V_C = payload('client-to-server', 'Identification'),
    V_S = payload('server-to-client', 'Identification')
  const I_C = payload('client-to-server', 'KEXINIT'),
    I_S = payload('server-to-client', 'KEXINIT')
  return { V_C, V_S, I_C, I_S }
}
function validateSshKexInit(bytes: Uint8Array) {
  // Decode all ten length-prefixed name lists before accepting the retained method.
  if (bytes[0] !== 20) throw new Error('Not SSH_MSG_KEXINIT')
  let i = 17
  const names = []
  for (let n = 0; n < 10; n++) {
    if (i + 4 > bytes.length) throw new Error('Truncated KEXINIT name list')
    const size = new DataView(bytes.buffer, bytes.byteOffset + i, 4).getUint32(0, false)
    i += 4
    if (i + size > bytes.length) throw new Error('Truncated KEXINIT name list')
    names.push(new TextDecoder().decode(bytes.slice(i, i + size)).split(','))
    i += size
  }
  if (i + 5 !== bytes.length || bytes.at(i) !== 0 || bytes.slice(i + 1).some((b) => b !== 0))
    throw new Error('Unexpected KEXINIT flags/reserved bytes')
  for (const [n, name] of [
    [0, 'curve25519-sha256'],
    [1, 'ssh-ed25519'],
    [2, 'aes128-ctr'],
    [3, 'aes128-ctr'],
    [4, 'hmac-sha2-256'],
    [5, 'hmac-sha2-256'],
    [6, 'none'],
    [7, 'none'],
  ] as const)
    if (!names.at(n)?.includes(name)) throw new Error('Retained SSH profile mismatch')
}
export function assessSshExchange(
  fields: SshHashFields,
  signature: Uint8Array,
  hostPublic: Uint8Array,
  sessionId?: Uint8Array
) {
  if (sessionId && sessionId.length !== 32)
    throw new Error('Invalid first-exchange session identifier')
  const serialized = serializeSshExchangeHash(fields),
    hash = sha256(serialized.bytes)
  if (hostPublic.length !== 32 || signature.length !== 64)
    return { ...serialized, hash, sessionId: sessionId?.slice() ?? hash.slice(), verified: false }
  const blob = sshJoin(sshString(new TextEncoder().encode('ssh-ed25519')), sshString(hostPublic))
  const boundKey = blob.length === fields.K_S.length && blob.every((b, i) => b === fields.K_S.at(i))
  return {
    ...serialized,
    hash,
    sessionId: sessionId?.slice() ?? hash.slice(),
    verified: boundKey && ed25519.verify(signature, hash, hostPublic),
  }
}
/** Fresh disposable local keys in the already-selected conventional reference profile.
 * No retained private key/K is shipped, and no QKD bytes are injected into SSH.
 */
export function createSshExchangeSample(
  options: {
    clientSecret?: Uint8Array
    serverSecret?: Uint8Array
    hostSecret?: Uint8Array
    sessionId?: Uint8Array
    fixture?: EncodedSshSample
  } = {}
) {
  const clientSecret = options.clientSecret ?? crypto.getRandomValues(new Uint8Array(32))
  const serverSecret = options.serverSecret ?? crypto.getRandomValues(new Uint8Array(32))
  const hostSecret = options.hostSecret ?? crypto.getRandomValues(new Uint8Array(32))
  const Q_C = x25519.getPublicKey(clientSecret),
    Q_S = x25519.getPublicKey(serverSecret)
  const K = x25519.getSharedSecret(clientSecret, Q_S),
    peerK = x25519.getSharedSecret(serverSecret, Q_C)
  if (K.every((b) => b === 0) || !K.every((b, i) => b === peerK.at(i)))
    throw new Error('SSH endpoint shared secrets disagree')
  const hostPublic = ed25519.getPublicKey(hostSecret)
  const K_S = sshJoin(sshString(new TextEncoder().encode('ssh-ed25519')), sshString(hostPublic))
  const fields = {
    ...retainedNegotiation(options.fixture ?? fixtures.profiles[0]),
    K_S,
    Q_C,
    Q_S,
    K,
  }
  const serialized = serializeSshExchangeHash(fields),
    hash = sha256(serialized.bytes),
    signature = ed25519.sign(hash, hostSecret)
  const assessment = assessSshExchange(fields, signature, hostPublic, options.sessionId)
  if (!assessment.verified) throw new Error('Sample SSH host signature did not verify')
  return {
    ...assessment,
    fields,
    signature,
    hostPublic,
    hostSecret,
    endpointSecretAgreement: true as const,
  }
}
