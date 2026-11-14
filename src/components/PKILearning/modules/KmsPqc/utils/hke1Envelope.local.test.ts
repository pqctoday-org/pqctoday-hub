// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection -- fixed-length byte buffers and small enum tables indexed by validated integers */
//
// The HKE1 project sample format. Every size comes from serialized bytes, and every receiver below
// is built from its own key material and handed only the wire bytes: no sender object, secret,
// derived key or plaintext reaches it. Sample keys are fictional and local to this file.
//
//   npx vitest run --config vitest.local.config.ts \
//     src/components/PKILearning/modules/KmsPqc/utils/hke1Envelope.local.test.ts
import {
  constants,
  createCipheriv,
  createDecipheriv,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  privateDecrypt,
  publicEncrypt,
  type KeyObject,
} from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import {
  buildHke1,
  HKE1_FORMAT_LABEL,
  HKE1_HEADER_BYTES,
  HKE1_INFO,
  HKE1_SALT,
  hke1FieldLengths,
  hke1TotalBytes,
  packHke1,
  parseHke1,
  recoverHke1Dek,
  type Hke1Mode,
  type Hke1ReceiverPrimitives,
} from './hke1Envelope'

const utf8 = (text: string) => new TextEncoder().encode(text)
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
const kwWrap = (kek: Uint8Array, value: Uint8Array, decrypt = false) => {
  const cipher = (decrypt ? createDecipheriv : createCipheriv)(
    'id-aes256-wrap',
    kek,
    Buffer.alloc(8, 0xa6)
  )
  return bytes(Buffer.concat([cipher.update(value), cipher.final()]))
}
const hkdf = (secret: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number) =>
  bytes(Buffer.from(hkdfSync('sha256', secret, salt, info, length)))

const DEK = new Uint8Array(32).fill(0x33)

interface Receiver {
  mlKemSecretKey: Uint8Array
  x25519Private: KeyObject
  rsaPrivate: KeyObject
}
/** A receiver is nothing but its own keys plus the plain primitives. */
function receiverPrimitives(own: Receiver): Hke1ReceiverPrimitives {
  return {
    rsaOaepSha256Decrypt: (ct) =>
      bytes(
        privateDecrypt(
          { key: own.rsaPrivate, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING },
          ct
        )
      ),
    mlKem768Decapsulate: (ct) => ml_kem768.decapsulate(ct, own.mlKemSecretKey),
    x25519Derive: (peer) =>
      bytes(diffieHellman({ privateKey: own.x25519Private, publicKey: x25519Public(peer) })),
    hkdfSha256: hkdf,
    aesKwUnwrap: (kek, wrapped) => kwWrap(kek, wrapped, true),
  }
}

let own: Receiver
let rsaPublic: KeyObject
let x25519PublicKey: KeyObject
let mlKemPublicKey: Uint8Array
let wires: Record<Hke1Mode, Uint8Array>
let fields: Record<Hke1Mode, Uint8Array[]>

beforeAll(() => {
  const kem = ml_kem768.keygen(new Uint8Array(64).fill(7))
  const x = generateKeyPairSync('x25519')
  const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 })
  own = { mlKemSecretKey: kem.secretKey, x25519Private: x.privateKey, rsaPrivate: rsa.privateKey }
  rsaPublic = rsa.publicKey
  x25519PublicKey = x.publicKey
  mlKemPublicKey = kem.publicKey

  wires = {} as Record<Hke1Mode, Uint8Array>
  fields = {} as Record<Hke1Mode, Uint8Array[]>
  for (const mode of [1, 2, 3] as const) {
    let ephemeral = new Uint8Array(0)
    let kemCiphertext = new Uint8Array(0)
    let wrapped: Uint8Array
    if (mode === 1) {
      wrapped = bytes(
        publicEncrypt(
          { key: rsaPublic, oaepHash: 'sha256', padding: constants.RSA_PKCS1_OAEP_PADDING },
          DEK
        )
      )
    } else {
      const encapsulated = ml_kem768.encapsulate(mlKemPublicKey, new Uint8Array(32).fill(mode))
      kemCiphertext = encapsulated.cipherText
      let secret = encapsulated.sharedSecret
      if (mode === 3) {
        const ephemeralPair = generateKeyPairSync('x25519')
        ephemeral = rawX25519(ephemeralPair.publicKey)
        secret = concat(
          secret,
          bytes(diffieHellman({ privateKey: ephemeralPair.privateKey, publicKey: x25519PublicKey }))
        )
      }
      wrapped = kwWrap(hkdf(secret, utf8(HKE1_SALT), utf8(HKE1_INFO[mode]), 32), DEK)
    }
    wires[mode] = buildHke1(mode, {
      ephemeralPublicKey: ephemeral,
      kemCiphertext,
      wrappedDek: wrapped,
    })
    const parsed = parseHke1(wires[mode])
    fields[mode] = [
      parsed.keyId,
      parsed.salt,
      parsed.info,
      parsed.ephemeralPublicKey,
      parsed.kemCiphertext,
      parsed.wrappedDek,
    ].map((f) => new Uint8Array(f))
  }
})

const flipLast = (wire: Uint8Array) => {
  const out = new Uint8Array(wire)
  out[out.length - 1] ^= 1
  return out
}

describe('HKE1 size accounting', () => {
  it('labels the format as a project sample, not a standard', () => {
    expect(HKE1_FORMAT_LABEL).toBe('Project sample format, not a standard')
  })

  it('counts 284 / 1,191 / 1,218 bytes from the layout', () => {
    expect([1, 2, 3].map((m) => hke1TotalBytes(m as Hke1Mode))).toEqual([284, 1191, 1218])
    expect(hke1FieldLengths(1)).toEqual([10, 0, 0, 0, 0, 256])
    expect(hke1FieldLengths(2)).toEqual([10, 20, 15, 0, 1088, 40])
    expect(hke1FieldLengths(3)).toEqual([10, 20, 10, 32, 1088, 40])
    expect(HKE1_HEADER_BYTES).toBe(18)
  })

  it('the serialized sample envelopes are exactly those sizes', () => {
    expect(wires[1].length).toBe(284)
    expect(wires[2].length).toBe(1191)
    expect(wires[3].length).toBe(1218)
  })

  it('does not equal the partial counts it replaces (1,128 and 1,120)', () => {
    expect(hke1TotalBytes(2)).not.toBe(1088 + 40)
    expect(hke1TotalBytes(3)).not.toBe(32 + 1088)
    // The difference is the header, key ID, salt, info (and for the hybrid the wrapped DEK).
    expect(hke1TotalBytes(2) - (1088 + 40)).toBe(18 + 10 + 20 + 15)
    expect(hke1TotalBytes(3) - (32 + 1088)).toBe(18 + 10 + 20 + 10 + 40)
  })
})

describe('HKE1 receiver recovers the DEK from the bytes alone', () => {
  it.each([1, 2, 3] as const)('mode %i: exact recovery', async (mode) => {
    const recovered = await recoverHke1Dek(wires[mode], receiverPrimitives(own))
    expect(hex(recovered)).toBe(hex(DEK))
  })

  it('a receiver with different keys cannot recover the DEK', async () => {
    const other: Receiver = {
      mlKemSecretKey: ml_kem768.keygen(new Uint8Array(64).fill(9)).secretKey,
      x25519Private: generateKeyPairSync('x25519').privateKey,
      rsaPrivate: generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey,
    }
    for (const mode of [1, 2, 3] as const)
      await expect(recoverHke1Dek(wires[mode], receiverPrimitives(other))).rejects.toThrow()
  })

  it('the demo module 32-byte zero-padded salt gives the same key as the 20-byte wire salt', () => {
    const padded = new Uint8Array(32)
    padded.set(utf8(HKE1_SALT))
    const secret = new Uint8Array(32).fill(0x11)
    expect(hex(hkdf(secret, padded, utf8(HKE1_INFO[2]), 32))).toBe(
      hex(hkdf(secret, utf8(HKE1_SALT), utf8(HKE1_INFO[2]), 32))
    )
  })
})

describe('HKE1 receiver refuses altered, omitted, reordered, truncated and trailing data', () => {
  it.each([1, 2, 3] as const)('mode %i: altered wrapped DEK is refused', async (mode) => {
    await expect(recoverHke1Dek(flipLast(wires[mode]), receiverPrimitives(own))).rejects.toThrow()
  })

  it.each([1, 2, 3] as const)('mode %i: truncated envelope is refused', async (mode) => {
    await expect(
      recoverHke1Dek(wires[mode].subarray(0, -1), receiverPrimitives(own))
    ).rejects.toThrow(/truncated|length/)
  })

  it.each([1, 2, 3] as const)('mode %i: trailing byte is refused', async (mode) => {
    await expect(
      recoverHke1Dek(concat(wires[mode], new Uint8Array([0])), receiverPrimitives(own))
    ).rejects.toThrow(/trailing/)
  })

  it('hybrid: ephemeral key and KEM ciphertext in the wrong order are refused', async () => {
    const [keyId, salt, info, ephemeral, kemCiphertext, wrapped] = fields[3]
    const reordered = packHke1(3, [keyId, salt, info, kemCiphertext, ephemeral, wrapped])
    expect(reordered.length).toBe(1218)
    await expect(recoverHke1Dek(reordered, receiverPrimitives(own))).rejects.toThrow(/length/)
  })

  it('hybrid: omitted ephemeral key is refused', async () => {
    const [keyId, salt, info, , kemCiphertext, wrapped] = fields[3]
    const missing = packHke1(3, [keyId, salt, info, new Uint8Array(0), kemCiphertext, wrapped])
    expect(missing.length).toBe(1186)
    await expect(recoverHke1Dek(missing, receiverPrimitives(own))).rejects.toThrow(/Ephemeral/)
  })

  it('unknown version, unknown mode and a suite that disagrees with the mode are refused', async () => {
    const badMagic = new Uint8Array(wires[2])
    badMagic[3] = 0x32
    const badMode = new Uint8Array(wires[2])
    badMode[4] = 9
    const badSuite = new Uint8Array(wires[2])
    badSuite[5] = 3
    for (const wire of [badMagic, badMode, badSuite])
      await expect(recoverHke1Dek(wire, receiverPrimitives(own))).rejects.toThrow()
  })

  it('a wrong key ID, salt or info is refused before any key operation', async () => {
    let calls = 0
    const counting: Hke1ReceiverPrimitives = {
      ...receiverPrimitives(own),
      mlKem768Decapsulate: (ct) => {
        calls++
        return ml_kem768.decapsulate(ct, own.mlKemSecretKey)
      },
    }
    const [keyId, salt, info, ephemeral, kemCiphertext, wrapped] = fields[2]
    const wrongKey = packHke1(2, [
      utf8('demo-kek-9'),
      salt,
      info,
      ephemeral,
      kemCiphertext,
      wrapped,
    ])
    const wrongSalt = packHke1(2, [
      keyId,
      utf8('kms-envelope-salt-v2'),
      info,
      ephemeral,
      kemCiphertext,
      wrapped,
    ])
    const wrongInfo = packHke1(2, [
      keyId,
      salt,
      utf8('kms-envelope-v2'),
      ephemeral,
      kemCiphertext,
      wrapped,
    ])
    for (const wire of [wrongKey, wrongSalt, wrongInfo])
      await expect(recoverHke1Dek(wire, counting)).rejects.toThrow()
    expect(calls).toBe(0)
  })

  it('a field whose declared length lies is refused', async () => {
    const lie = new Uint8Array(wires[2])
    lie[6 + 2 * 5 + 1] = 41 // wrapped DEK declared 41 bytes
    await expect(recoverHke1Dek(lie, receiverPrimitives(own))).rejects.toThrow(/length/)
  })

  it('an altered KEM ciphertext never yields the DEK (implicit rejection, caught at unwrap)', async () => {
    const parsed = parseHke1(wires[2])
    const altered = new Uint8Array(parsed.kemCiphertext)
    altered[0] ^= 1
    const wire = packHke1(2, [
      parsed.keyId,
      parsed.salt,
      parsed.info,
      parsed.ephemeralPublicKey,
      altered,
      parsed.wrappedDek,
    ])
    await expect(recoverHke1Dek(wire, receiverPrimitives(own))).rejects.toThrow()
  })
})
