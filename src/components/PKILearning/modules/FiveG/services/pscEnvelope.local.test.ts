// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- fixed-length byte buffers and small enum tables indexed by validated integers */
//
// The PSC1 project sample format for Profile C. The sender below builds each envelope with
// independent Node primitives; the receiver is constructed from its own private keys alone and is
// handed only the wire bytes, never a sender object, secret, derived key or plaintext. A receiver
// "match" is never inferred from sender state. Keys are fictional and local to this file.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/FiveG/services/pscEnvelope.local.test.ts
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import {
  assemblePsc1,
  bcdDecodeMsin,
  bcdEncodeMsin,
  buildPsc1MacInput,
  normalizeX25519Public,
  parsePsc1,
  PSC1_FORMAT_LABEL,
  psc1TotalBytes,
  Psc1Refusal,
  recoverPsc1,
  type Psc1Header,
  type Psc1Mode,
  type Psc1ReceiverPrimitives,
} from './pscEnvelope'

const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}
const bytes = (value: Uint8Array | Buffer) => new Uint8Array(value)
const hex = (value: Uint8Array) => Buffer.from(value).toString('hex')
const X25519_SPKI_PREFIX = Buffer.from('302a300506032b656e032100', 'hex')
const rawX25519 = (key: KeyObject) =>
  bytes(key.export({ format: 'der', type: 'spki' }).subarray(X25519_SPKI_PREFIX.length))
const x25519Public = (raw: Uint8Array) =>
  createPublicKey({ key: Buffer.concat([X25519_SPKI_PREFIX, raw]), format: 'der', type: 'spki' })
const sha256 = (data: Uint8Array) => bytes(createHash('sha256').update(data).digest())
const sha3 = (data: Uint8Array) => bytes(createHash('sha3-256').update(data).digest())
const counter = (n: number) => Uint8Array.of(0, 0, 0, n)
const ZERO_IV = Buffer.alloc(16)
const ctr = (key: Uint8Array, data: Uint8Array, decrypt = false) => {
  const cipher = (decrypt ? createDecipheriv : createCipheriv)('aes-256-ctr', key, ZERO_IV)
  return bytes(Buffer.concat([cipher.update(data), cipher.final()]))
}

// 9-digit MSIN, as the Hub flow uses: five BCD bytes.
const MSIN_DIGITS = '123456789'
const MSIN_BCD = bcdEncodeMsin(MSIN_DIGITS)
const HOME = { mcc: '310', mnc: '260', keyId: 1 }
const HEADER = (mode: Psc1Mode): Psc1Header => ({
  mode,
  mcc: HOME.mcc,
  mnc: HOME.mnc,
  routingIndicator: '0',
  keyId: HOME.keyId,
})

interface HomeNetworkKeys {
  mlKemSecretKey: Uint8Array
  x25519Private: KeyObject
}
function receiverFor(keys: HomeNetworkKeys): Psc1ReceiverPrimitives {
  return {
    mlKem768Decapsulate: (ct) => ml_kem768.decapsulate(ct, keys.mlKemSecretKey),
    x25519Derive: (peer) =>
      bytes(diffieHellman({ privateKey: keys.x25519Private, publicKey: x25519Public(peer) })),
    sha256,
    sha3_256: sha3,
    hmacSha3_256: (key, data) => bytes(createHmac('sha3-256', key).update(data).digest()),
    aes256CtrZeroIv: (key, data) => ctr(key, data, true),
  }
}

let home: HomeNetworkKeys
let wires: Record<Psc1Mode, Uint8Array>
const FIRST_COMPONENT_OFFSET = 15

beforeAll(() => {
  const kem = ml_kem768.keygen(new Uint8Array(64).fill(7))
  const x = generateKeyPairSync('x25519')
  home = { mlKemSecretKey: kem.secretKey, x25519Private: x.privateKey }
  wires = {} as Record<Psc1Mode, Uint8Array>
  for (const mode of [1, 2] as const) {
    const encapsulated = ml_kem768.encapsulate(kem.publicKey, new Uint8Array(32).fill(mode + 10))
    let z = encapsulated.sharedSecret
    let ephemeral = new Uint8Array(0)
    if (mode === 2) {
      const pair = generateKeyPairSync('x25519')
      ephemeral = rawX25519(pair.publicKey)
      z = sha256(
        concat(bytes(diffieHellman({ privateKey: pair.privateKey, publicKey: x.publicKey })), z)
      )
    }
    const kEnc = sha3(concat(z, counter(1), ephemeral))
    const kMac = sha3(concat(z, counter(2), ephemeral))
    const msinCiphertext = ctr(kEnc, MSIN_BCD)
    const macInput = buildPsc1MacInput(HEADER(mode), {
      ephemeralPublicKey: ephemeral,
      kemCiphertext: encapsulated.cipherText,
      msinCiphertext,
    })
    const tag = bytes(createHmac('sha3-256', kMac).update(macInput).digest()).slice(0, 8)
    wires[mode] = assemblePsc1(macInput, tag)
  }
})

const flip = (wire: Uint8Array, offset: number) => {
  const out = new Uint8Array(wire)
  out[offset] ^= 1
  return out
}

describe('PSC1 size accounting', () => {
  it('labels the format as a project sample, not a standard', () => {
    expect(PSC1_FORMAT_LABEL).toBe('Project sample format, not a standard')
  })

  it('is 1,116 bytes pure and 1,148 bytes hybrid for a 9-digit MSIN', () => {
    expect(MSIN_BCD.length).toBe(5)
    expect(psc1TotalBytes(1, MSIN_BCD.length)).toBe(1116)
    expect(psc1TotalBytes(2, MSIN_BCD.length)).toBe(1148)
    expect(wires[1].length).toBe(1116)
    expect(wires[2].length).toBe(1148)
  })

  it('BCD packs two digits per byte, low nibble first, padded with 0xF', () => {
    expect(hex(MSIN_BCD)).toBe('21436587f9')
    expect(bcdDecodeMsin(MSIN_BCD)).toBe(MSIN_DIGITS)
    expect(bcdDecodeMsin(bcdEncodeMsin('1234'))).toBe('1234')
  })
})

describe('PSC1 receiver recovers the MSIN from the bytes alone', () => {
  it.each([1, 2] as const)(
    'mode %i: exact recovery, MAC verified over the whole message',
    async (mode) => {
      const recovery = await recoverPsc1(wires[mode], receiverFor(home), HOME)
      expect(hex(recovery.msinBcd)).toBe(hex(MSIN_BCD))
      expect(recovery.msinDigits).toBe(MSIN_DIGITS)
      expect(recovery.header.mode).toBe(mode)
      expect(hex(recovery.trace.recomputedTag)).toBe(hex(recovery.trace.receivedTag))
      expect(recovery.trace.ecdhSecret === null).toBe(mode === 1)
    }
  )

  it('the hybrid receiver needs the transmitted ephemeral key; the pure one carries none', () => {
    expect(parsePsc1(wires[2]).ephemeralPublicKey.length).toBe(32)
    expect(parsePsc1(wires[1]).ephemeralPublicKey.length).toBe(0)
  })

  it('a receiver holding different keys cannot recover the MSIN', async () => {
    const other: HomeNetworkKeys = {
      mlKemSecretKey: ml_kem768.keygen(new Uint8Array(64).fill(9)).secretKey,
      x25519Private: generateKeyPairSync('x25519').privateKey,
    }
    for (const mode of [1, 2] as const)
      await expect(recoverPsc1(wires[mode], receiverFor(other), HOME)).rejects.toBeInstanceOf(
        Psc1Refusal
      )
  })
})

describe('PSC1 receiver refuses altered, omitted, reordered, truncated and trailing data', () => {
  const attempts = (wire: Uint8Array) => recoverPsc1(wire, receiverFor(home))

  describe.each([1, 2] as const)('mode %i', (mode) => {
    it('altered header byte', async () => {
      await expect(attempts(flip(wires[mode], 5))).rejects.toThrow(/MAC refused/)
    })
    it('altered first component (ephemeral key or KEM ciphertext)', async () => {
      await expect(attempts(flip(wires[mode], FIRST_COMPONENT_OFFSET))).rejects.toThrow(
        /MAC refused/
      )
    })
    it('altered MSIN ciphertext', async () => {
      await expect(attempts(flip(wires[mode], wires[mode].length - 9))).rejects.toThrow(
        /MAC refused/
      )
    })
    it('altered tag', async () => {
      await expect(attempts(flip(wires[mode], wires[mode].length - 1))).rejects.toThrow(
        /MAC refused/
      )
    })
    it('truncated by one byte', async () => {
      await expect(attempts(wires[mode].subarray(0, -1))).rejects.toThrow(/length/)
    })
    it('one trailing byte', async () => {
      await expect(attempts(concat(wires[mode], Uint8Array.of(0)))).rejects.toThrow(/length/)
    })
  })

  it('hybrid: ephemeral key and KEM ciphertext in the wrong order', async () => {
    const w = wires[2]
    const reordered = concat(
      w.subarray(0, 15),
      w.subarray(47, 47 + 1088),
      w.subarray(15, 47),
      w.subarray(47 + 1088)
    )
    expect(reordered.length).toBe(1148)
    await expect(attempts(reordered)).rejects.toThrow(/MAC refused/)
  })

  it('hybrid: omitted ephemeral key', async () => {
    const w = wires[2]
    const missing = concat(w.subarray(0, 15), w.subarray(47))
    expect(missing.length).toBe(1116)
    await expect(attempts(missing)).rejects.toThrow(/length/)
  })

  it('a mode byte that disagrees with the carried fields is refused', async () => {
    const asPure = flip(wires[2], 4) // mode 2 -> 3
    const asHybrid = new Uint8Array(wires[1])
    asHybrid[4] = 2
    await expect(attempts(asPure)).rejects.toThrow(/unknown mode/)
    await expect(attempts(asHybrid)).rejects.toThrow(/length/)
  })

  it('unknown version and bad MSIN lengths are refused', async () => {
    const version = new Uint8Array(wires[1])
    version[3] = 0x32
    const zeroLength = new Uint8Array(wires[1])
    zeroLength[14] = 0
    const tooLong = new Uint8Array(wires[1])
    tooLong[14] = 9
    for (const wire of [version, zeroLength, tooLong])
      await expect(attempts(wire)).rejects.toThrow()
  })
})

describe('PSC1 checks beyond the byte contract', () => {
  it('the MAC covers the header: an altered PLMN fails on the MAC when the home network is not pinned', async () => {
    const alteredPlmn = flip(wires[1], 7) // MCC digit
    await expect(recoverPsc1(alteredPlmn, receiverFor(home))).rejects.toThrow(/MAC refused/)
  })

  it('a pinned home network refuses a foreign PLMN or key ID before any key operation', async () => {
    let calls = 0
    const counting: Psc1ReceiverPrimitives = {
      ...receiverFor(home),
      mlKem768Decapsulate: (ct) => {
        calls++
        return ml_kem768.decapsulate(ct, home.mlKemSecretKey)
      },
    }
    await expect(recoverPsc1(wires[1], counting, { ...HOME, mnc: '999' })).rejects.toThrow(/PLMN/)
    await expect(recoverPsc1(wires[1], counting, { ...HOME, keyId: 2 })).rejects.toThrow(/key ID/)
    expect(calls).toBe(0)
  })

  it('a refused MAC exposes the values the receiver computed but never decrypts', async () => {
    let decrypted = 0
    const watching: Psc1ReceiverPrimitives = {
      ...receiverFor(home),
      aes256CtrZeroIv: (key, data) => {
        decrypted++
        return ctr(key, data, true)
      },
    }
    await expect(recoverPsc1(flip(wires[1], wires[1].length - 1), watching)).rejects.toThrow()
    expect(decrypted).toBe(0)
  })

  it('normalizes X25519 keys strictly: raw 32 bytes or the exact 44-byte SPKI only', () => {
    const raw = new Uint8Array(32).fill(0x42)
    expect(hex(normalizeX25519Public(raw))).toBe(hex(raw))
    expect(hex(normalizeX25519Public(concat(bytes(X25519_SPKI_PREFIX), raw)))).toBe(hex(raw))
    // Ed25519 SPKI: same length, different OID
    const ed25519 = Buffer.from('302a300506032b6570032100', 'hex')
    expect(() => normalizeX25519Public(concat(bytes(ed25519), raw))).toThrow(/not an X25519/)
    expect(() => normalizeX25519Public(raw.subarray(1))).toThrow(/32 raw bytes/)
    expect(() => normalizeX25519Public(concat(raw, Uint8Array.of(0)))).toThrow()
    expect(() => normalizeX25519Public(new Uint8Array(91))).toThrow()
  })

  it('building refuses a pure envelope with an ephemeral key and a hybrid one without', () => {
    const kemCiphertext = new Uint8Array(1088)
    const msinCiphertext = new Uint8Array(5)
    expect(() =>
      buildPsc1MacInput(HEADER(1), {
        ephemeralPublicKey: new Uint8Array(32),
        kemCiphertext,
        msinCiphertext,
      })
    ).toThrow(/pure mode/)
    expect(() => buildPsc1MacInput(HEADER(2), { kemCiphertext, msinCiphertext })).toThrow()
    expect(() =>
      buildPsc1MacInput(HEADER(1), { kemCiphertext: new Uint8Array(32), msinCiphertext })
    ).toThrow(/1,088/)
  })
})
