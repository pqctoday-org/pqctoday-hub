// SPDX-License-Identifier: AGPL-3.0-only
import { ml_dsa44 } from '@noble/post-quantum/ml-dsa.js'
import fixture from './signedMxFixture.json'

// RFC 4034 §3.1.8.1. One canonical MX RR and a directly trusted fixture DNSKEY.
// The workshop clock is fixed inside the published vector's 2015 validity window.
const inception = 1438207200
const expiration = 1440021600
const fixtureClock = 1438387200
const ttl = 3600
const u16 = (n: number) => [n >>> 8, n & 255]
const u32 = (n: number) => [...u16(n >>> 16), ...u16(n & 65535)]
const owner = [7, ...new TextEncoder().encode('example'), 3, ...new TextEncoder().encode('com'), 0]
const mxData = [...u16(10), 4, ...new TextEncoder().encode('mail'), ...owner]
const record = [...owner, ...u16(15), ...u16(1), ...u32(ttl), ...u16(mxData.length), ...mxData]
const sigHeader = [
  ...u16(15),
  18,
  2,
  ...u32(ttl),
  ...u32(expiration),
  ...u32(inception),
  ...u16(59829),
  ...owner,
]
const decode = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
const signature = decode(fixture.signature)
const key = decode(fixture.publicKey)
// Uncompressed answer with header, question, MX, RRSIG and an empty EDNS OPT.
const responseBytes =
  12 +
  owner.length +
  4 +
  record.length +
  owner.length +
  10 +
  sigHeader.length +
  signature.length +
  11

export function resolveSampleMx(transport: 'udp' | 'tcp', udpBudget: number, corrupt: boolean) {
  if (transport === 'udp' && responseBytes > udpBudget) {
    return { status: 'truncated', responseBytes } as const
  }
  const receivedSignature = signature.slice()
  if (corrupt) receivedSignature[0] ^= 1
  const valid =
    fixtureClock >= inception &&
    fixtureClock <= expiration &&
    ml_dsa44.verify(receivedSignature, Uint8Array.from([...sigHeader, ...record]), key)
  return { status: valid ? 'secure' : 'bogus', responseBytes } as const
}
