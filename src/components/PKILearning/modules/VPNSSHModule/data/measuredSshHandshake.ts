// SPDX-License-Identifier: AGPL-3.0-only
import fixtures from './sshMeasuredSamples.json'

type Mode = 'classical' | 'hybrid' | 'pure-pqc'
export type EncodedSshSample = (typeof fixtures.profiles)[number]
class Reader {
  private offset = 0
  private readonly bytes: Uint8Array
  constructor(bytes: Uint8Array) {
    this.bytes = bytes
  }
  take(size: number): Uint8Array {
    check(
      Number.isSafeInteger(size) && size >= 0 && size <= this.bytes.length - this.offset,
      'Truncated SSH sample'
    )
    const value = this.bytes.slice(this.offset, this.offset + size)
    this.offset += size
    return value
  }
  uint(size = 4): number {
    return this.take(size).reduce((n, b) => n * 256 + b, 0)
  }
  string(): Uint8Array {
    return this.take(this.uint())
  }
  text(): string {
    return new TextDecoder().decode(this.string())
  }
  end() {
    check(this.offset === this.bytes.length, 'Trailing SSH sample bytes')
  }
}
function check(ok: boolean, message: string): asserts ok {
  if (!ok) throw new Error(message)
}
const PROFILES = {
  classical: {
    name: 'classical',
    kex: 'curve25519-sha256',
    auth: 'ssh-ed25519',
    client: 32,
    server: 32,
    key: 32,
    signature: 64,
  },
  hybrid: {
    name: 'hybrid',
    kex: 'mlkem768x25519-sha256',
    auth: 'ssh-ed25519',
    client: 1216,
    server: 1120,
    key: 32,
    signature: 64,
  },
  'pure-pqc': {
    name: 'pqc',
    kex: 'mlkem768-sha256',
    auth: 'ssh-mldsa-65',
    client: 1184,
    server: 1088,
    key: 1952,
    signature: 3309,
  },
} as const

/** Decode the fixed captured sample sizes; this is not an SSH peer/signature verifier. */
export function measureSshSample(mode: Mode, fixture: EncodedSshSample) {
  const expected = PROFILES[mode]
  check(
    fixture.name === expected.name &&
      fixture.kex === expected.kex &&
      fixture.authentication === expected.auth,
    'Wrong SSH sample profile'
  )
  check(fixture.cipher === 'aes128-ctr' && fixture.mac === 'hmac-sha2-256', 'Wrong SSH cipher/MAC')
  check(fixture.messages.length === 8, 'Expected eight SSH sample units')
  const payloads: Uint8Array[] = []
  const names = [
    'Identification',
    'KEXINIT',
    'KEX_INIT',
    'NEWKEYS',
    'Identification',
    'KEXINIT',
    'KEX_REPLY',
    'NEWKEYS',
  ]
  const types = [0, 20, 30, 21, 0, 20, 31, 21]
  const messages = fixture.messages.map((message, index) => {
    const direction = index < 4 ? 'client-to-server' : 'server-to-client'
    check(
      message.direction === direction && message.name === names.at(index),
      'Wrong SSH message direction/order'
    )
    const raw = Uint8Array.from(atob(message.base64), (c) => c.charCodeAt(0))
    check(raw.length === message.bytes, 'Wrong SSH declared message size')
    let payload: Uint8Array = raw
    let framingBytes = 0
    if (index === 0 || index === 4) {
      const line = new TextDecoder().decode(raw)
      check(/^SSH-2\.0-[^\r\n]+\r\n$/.test(line), 'Invalid SSH identification')
    } else {
      const r = new Reader(raw),
        size = r.uint(),
        padding = r.uint(1)
      check(
        size + 4 === raw.length && raw.length % 8 === 0 && padding >= 4,
        'Wrong SSH packet length/padding'
      )
      payload = r.take(size - padding - 1)
      r.take(padding)
      r.end()
      check(payload.at(0) === types.at(index), 'Wrong SSH message type')
      framingBytes = 5 + padding
      check(
        payload.length === message.payloadBytes && framingBytes === message.framingBytes,
        'Wrong SSH payload/framing metadata'
      )
    }
    payloads.push(payload)
    return {
      name: message.name,
      direction,
      bytes: raw.length,
      payloadBytes: payload.length,
      framingBytes,
    }
  })
  for (const index of [1, 5]) {
    const r = new Reader(payloads.at(index)!)
    check(r.uint(1) === 20, 'Expected KEXINIT')
    r.take(16)
    const lists = Array.from({ length: 10 }, () => r.text().split(','))
    const kex = lists.at(0)!
    const suffix = index === 1 ? 'c' : 's'
    check(
      kex.at(0) === expected.kex &&
        new Set(kex).size === kex.length &&
        kex
          .slice(1)
          .every((x) => [`ext-info-${suffix}`, `kex-strict-${suffix}-v00@openssh.com`].includes(x)),
      'Wrong negotiated SSH exchange'
    )
    check(lists.at(1)?.join(',') === expected.auth, 'Wrong SSH host authentication')
    for (const i of [2, 3])
      check(lists.at(i)?.join(',') === 'aes128-ctr', 'Wrong advertised SSH cipher')
    for (const i of [4, 5])
      check(lists.at(i)?.join(',') === 'hmac-sha2-256', 'Wrong advertised SSH MAC')
    for (const i of [6, 7])
      check(
        lists.at(i)!.at(0) === 'none' &&
          lists.at(i)!.every((x) => ['none', 'zlib@openssh.com'].includes(x)),
        'Unexpected SSH compression offer'
      )
    check(lists.at(8)?.join(',') === '' && lists.at(9)?.join(',') === '', 'Unexpected SSH language')
    check(r.uint(1) === 0 && r.uint() === 0, 'Unexpected SSH optimistic exchange/flags')
    r.end()
  }
  const init = new Reader(payloads.at(2)!)
  init.uint(1)
  const clientShareBytes = init.string().length
  init.end()
  const reply = new Reader(payloads.at(6)!)
  reply.uint(1)
  const host = reply.string(),
    serverShareBytes = reply.string().length,
    signature = reply.string()
  reply.end()
  const key = new Reader(host)
  check(key.text() === expected.auth, 'Wrong SSH host key name')
  const rawPublicKeyBytes = key.string().length
  key.end()
  const sig = new Reader(signature)
  check(sig.text() === expected.auth, 'Wrong SSH signature name')
  const rawSignatureBytes = sig.string().length
  sig.end()
  check(
    clientShareBytes === expected.client &&
      serverShareBytes === expected.server &&
      rawPublicKeyBytes === expected.key &&
      rawSignatureBytes === expected.signature,
    'Wrong SSH share/key/signature size'
  )
  for (const index of [3, 7]) check(payloads.at(index)?.length === 1, 'Wrong SSH NEWKEYS payload')
  const totalBytes = messages.reduce((n, m) => n + m.bytes, 0)
  check(totalBytes === fixture.totalBytes, 'Wrong declared SSH total')
  return {
    messages,
    totalBytes,
    clientShareBytes,
    serverShareBytes,
    ciphertextBytes: mode === 'classical' ? 0 : serverShareBytes - (mode === 'hybrid' ? 32 : 0),
    rawPublicKeyBytes,
    hostKeyBlobBytes: host.length,
    rawSignatureBytes,
    signatureBlobBytes: signature.length,
  }
}
export const SSH_MEASURED_SAMPLES = {
  classical: measureSshSample(
    'classical',
    fixtures.profiles.find((p) => p.name === 'classical')!
  ),
  hybrid: measureSshSample(
    'hybrid',
    fixtures.profiles.find((p) => p.name === 'hybrid')!
  ),
  'pure-pqc': measureSshSample(
    'pure-pqc',
    fixtures.profiles.find((p) => p.name === 'pqc')!
  ),
}
export function sshSample(mode: Mode) {
  return SSH_MEASURED_SAMPLES[mode]
}
