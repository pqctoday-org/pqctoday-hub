// SPDX-License-Identifier: AGPL-3.0-only
import fixtures from './tlsMeasuredSamples.json'

export type TlsSampleMode = 'classical' | 'hybrid' | 'pure-pqc'
export interface EncodedTlsSample {
  name: string
  groupCode: number
  clientShareBytes: number
  serverShareBytes: number
  signatureScheme: number
  signatureBytes: number
  authentication: string
  certificateDerBytes: number[]
  totalBytes: number
  messages: { name: string; direction: string; bytes: number; base64: string }[]
}

class Reader {
  private offset = 0
  private readonly data: Uint8Array
  constructor(data: Uint8Array) {
    this.data = data
  }
  bytes(size: number): Uint8Array {
    if (!Number.isSafeInteger(size) || size < 0 || this.offset + size > this.data.length)
      throw new Error('Truncated TLS sample field')
    const value = this.data.slice(this.offset, this.offset + size)
    this.offset += size
    return value
  }
  uint(size: number): number {
    return this.bytes(size).reduce((value, byte) => value * 256 + byte, 0)
  }
  vector(size: number): Uint8Array {
    return this.bytes(this.uint(size))
  }
  get remaining(): number {
    return this.data.length - this.offset
  }
  end(): void {
    if (this.remaining !== 0) throw new Error('Trailing TLS sample bytes')
  }
}

function requireSample(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message)
}
function extensions(bytes: Uint8Array): Map<number, Uint8Array> {
  const reader = new Reader(bytes)
  const result = new Map<number, Uint8Array>()
  while (reader.remaining) {
    const type = reader.uint(2)
    requireSample(!result.has(type), 'Duplicate sample extension')
    result.set(type, reader.vector(2))
  }
  return result
}
function extension(map: Map<number, Uint8Array>, type: number): Uint8Array {
  const value = map.get(type)
  requireSample(value !== undefined, 'Required sample extension missing')
  return value
}

const PROFILES = {
  classical: {
    name: 'classical',
    group: 29,
    client: 32,
    server: 32,
    scheme: 0x0804,
    signature: 256,
    auth: 'RSA-2048',
  },
  hybrid: {
    name: 'hybrid',
    group: 0x11ec,
    client: 1216,
    server: 1120,
    scheme: 0x0804,
    signature: 256,
    auth: 'RSA-2048',
  },
  'pure-pqc': {
    name: 'pqc',
    group: 0x0201,
    client: 1184,
    server: 1088,
    scheme: 0x0905,
    signature: 3309,
    auth: 'ML-DSA-65',
  },
} as const
const MESSAGE_NAMES = [
  'ClientHello',
  'ServerHello',
  'EncryptedExtensions',
  'Certificate',
  'CertificateVerify',
  'Finished',
  'Finished',
] as const
const MESSAGE_TYPES = [1, 2, 8, 11, 15, 20, 20] as const

/** Byte accounting for these fixed, independently checked captures, not a TLS peer verifier. */
export function measureTlsSample(mode: TlsSampleMode, fixture: EncodedTlsSample) {
  const expected = PROFILES[mode]
  requireSample(fixture.name === expected.name, 'Wrong sample profile')
  requireSample(fixture.messages.length === 7, 'Expected seven sample handshake messages')
  const bodies: Uint8Array[] = []
  const messages = fixture.messages.map((message, index) => {
    const raw = Uint8Array.from(atob(message.base64), (character) => character.charCodeAt(0))
    const reader = new Reader(raw)
    requireSample(reader.uint(1) === MESSAGE_TYPES.at(index), 'Wrong handshake message type')
    bodies.push(reader.vector(3))
    reader.end()
    requireSample(message.name === MESSAGE_NAMES.at(index), 'Wrong handshake message name')
    requireSample(message.bytes === raw.length, 'Declared message size differs from capture')
    const direction = index === 0 || index === 6 ? 'client-to-server' : 'server-to-client'
    requireSample(message.direction === direction, 'Wrong handshake direction')
    return { name: message.name, direction, bytes: raw.length }
  })
  const body = (index: number) => new Reader(bodies.at(index)!)
  const client = body(0)
  requireSample(client.uint(2) === 0x0303, 'Unexpected ClientHello legacy version')
  client.bytes(32)
  requireSample(client.vector(1).length === 0, 'Sample session ID must be empty')
  const suites = new Reader(client.vector(2))
  requireSample(suites.uint(2) === 0x1301, 'Wrong sample cipher suite')
  suites.end()
  const compression = new Reader(client.vector(1))
  requireSample(compression.uint(1) === 0, 'Wrong legacy compression')
  compression.end()
  const ce = extensions(client.vector(2))
  client.end()
  const supportedGroups = new Reader(extension(ce, 10))
  const groups = new Reader(supportedGroups.vector(2))
  supportedGroups.end()
  requireSample(groups.uint(2) === expected.group, 'Wrong offered group')
  groups.end()
  const versions = new Reader(extension(ce, 43))
  const versionList = new Reader(versions.vector(1))
  versions.end()
  requireSample(versionList.uint(2) === 0x0304, 'Wrong offered TLS version')
  versionList.end()
  const sni = new Reader(extension(ce, 0))
  const names = new Reader(sni.vector(2))
  sni.end()
  requireSample(
    names.uint(1) === 0 && new TextDecoder().decode(names.vector(2)) === fixtures.hostname,
    'Wrong fictional hostname'
  )
  names.end()
  const clientShares = new Reader(extension(ce, 51))
  const clientShare = new Reader(clientShares.vector(2))
  clientShares.end()
  requireSample(clientShare.uint(2) === expected.group, 'Wrong client-share group')
  const clientShareBytes = clientShare.vector(2).length
  clientShare.end()
  const server = body(1)
  requireSample(server.uint(2) === 0x0303, 'Unexpected ServerHello legacy version')
  server.bytes(32)
  requireSample(
    server.vector(1).length === 0 && server.uint(2) === 0x1301 && server.uint(1) === 0,
    'Wrong ServerHello profile'
  )
  const se = extensions(server.vector(2))
  server.end()
  const serverVersion = new Reader(extension(se, 43))
  requireSample(serverVersion.uint(2) === 0x0304, 'Wrong negotiated TLS version')
  serverVersion.end()
  const serverShare = new Reader(extension(se, 51))
  requireSample(serverShare.uint(2) === expected.group, 'Wrong negotiated group')
  const serverShareBytes = serverShare.vector(2).length
  serverShare.end()
  requireSample(
    clientShareBytes === expected.client && serverShareBytes === expected.server,
    'Wrong sample key-share sizes'
  )
  const ee = body(2)
  requireSample(ee.vector(2).length === 0, 'Unexpected encrypted extension')
  ee.end()
  const certificate = body(3)
  requireSample(certificate.vector(1).length === 0, 'Unexpected certificate request context')
  const certs = new Reader(certificate.vector(3))
  certificate.end()
  const certificateDerBytes: number[] = []
  while (certs.remaining) {
    const der = certs.vector(3)
    requireSample(der.at(0) === 0x30, 'Expected DER certificate')
    certificateDerBytes.push(der.length)
    requireSample(certs.vector(2).length === 0, 'Unexpected certificate entry extension')
  }
  requireSample(certificateDerBytes.length === 2, 'Expected leaf and intermediate only')
  requireSample(
    fixture.certificateDerBytes.length === 2 &&
      certificateDerBytes.every((size, i) => size === fixture.certificateDerBytes.at(i)),
    'Wrong declared certificate sizes/order'
  )
  const verify = body(4)
  requireSample(verify.uint(2) === expected.scheme, 'Wrong CertificateVerify scheme')
  const signatureBytes = verify.vector(2).length
  verify.end()
  requireSample(signatureBytes === expected.signature, 'Wrong signature size')
  requireSample(
    bodies.at(5)!.length === 32 && bodies.at(6)!.length === 32,
    'Wrong SHA-256 Finished sizes'
  )
  const totalBytes = messages.reduce((total, message) => total + message.bytes, 0)
  requireSample(
    totalBytes === fixture.totalBytes,
    'Declared handshake total differs from captured messages'
  )
  requireSample(
    fixture.groupCode === expected.group &&
      fixture.signatureScheme === expected.scheme &&
      fixture.signatureBytes === signatureBytes &&
      fixture.authentication === expected.auth,
    'Wrong sample metadata'
  )
  requireSample(
    fixture.clientShareBytes === clientShareBytes && fixture.serverShareBytes === serverShareBytes,
    'Wrong share metadata'
  )
  return {
    mode,
    totalBytes,
    messages,
    clientShareBytes,
    serverShareBytes,
    signatureBytes,
    ciphertextBytes:
      mode === 'classical' ? 0 : mode === 'hybrid' ? serverShareBytes - 32 : serverShareBytes,
    certificateDerBytes,
    authenticationBytes: messages.at(3)!.bytes + messages.at(4)!.bytes,
    clientExtensionTypes: Array.from(ce.keys()),
    authentication: expected.auth,
  }
}

export const TLS_MEASURED_SAMPLES = (['classical', 'hybrid', 'pure-pqc'] as const).map((mode) => {
  const fixture = fixtures.profiles.find((profile) => profile.name === PROFILES[mode].name)
  requireSample(fixture !== undefined, 'Measured TLS fixture missing')
  return measureTlsSample(mode, fixture)
})
export function tlsSample(mode: TlsSampleMode) {
  const sample = TLS_MEASURED_SAMPLES.find((entry) => entry.mode === mode)
  requireSample(sample !== undefined, 'Measured TLS profile missing')
  return sample
}
