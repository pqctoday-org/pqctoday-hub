// SPDX-License-Identifier: AGPL-3.0-only
import { beforeAll, describe, expect, it } from 'vitest'
import {
  loadPQCAlgorithmsData,
  loadedFileMetadata,
  findAlgorithmByRef,
  algorithmSizeBytes,
  type AlgorithmDetail,
} from './pqcAlgorithmsData'

let catalogue: AlgorithmDetail[]
beforeAll(async () => {
  catalogue = await loadPQCAlgorithmsData()
})
function row(id: string) {
  const value = findAlgorithmByRef(catalogue, id)
  expect(value, id).toBeDefined()
  return value!
}
const sizes = (value: AlgorithmDetail) => [
  value.publicKeySize,
  value.privateKeySize,
  value.signatureCiphertextSize,
  value.sharedSecretSize,
]

// Pinned source-table values: composite-sigs-19 Appendix A Table4,
// composite-kem-23 Appendix A Table3, RFC10024 §4 and FAESTv3 Table3.2.
// These expectations are independent of the maintenance sheet/applier.
const expected: [string, number, number | null, number, number | null][] = [
  ['id-mldsa44-ecdsa-p256-sha256', 1377, 83, 2492, null],
  ['id-mldsa44-ed25519-sha512', 1344, 64, 2484, null],
  ['id-mldsa44-rsa2048-pss-sha256', 1582, 1226, 2676, null],
  ['ml-kem-768-ecdh-p256', 1249, 115, 1153, 32],
  ['id-mlkem768-ecdh-p256-sha3-256', 1249, 115, 1153, 32],
  ['id-mlkem768-ecdh-p384-sha3-256', 1281, null, 1185, 32],
  ['id-mlkem768-ecdh-brainpoolp256r1-sha3-256', 1249, null, 1153, 32],
  ['id-mlkem1024-ecdh-p384-sha3-256', 1665, null, 1665, 32],
  ['id-mlkem1024-ecdh-p521-sha3-256', 1701, null, 1701, 32],
  ['id-mlkem1024-ecdh-brainpoolp384r1-sha3-256', 1665, null, 1665, 32],
  ['x25519mlkem768', 1216, null, 1120, 64],
  ['secp256r1mlkem768', 1249, null, 1153, 64],
  ['secp384r1mlkem1024', 1665, null, 1665, 80],
  ['faest', 32, 32, 5170, null],
]

// Minimal independent DER fixtures encode structural lengths only. No values
// here are claimed to be generated keys/signatures, and no crypto engine runs.
const concat = (...values: Uint8Array[]) => Uint8Array.from(values.flatMap((v) => [...v]))
function der(tag: number, payload: Uint8Array) {
  const length =
    payload.length < 128
      ? [payload.length]
      : payload.length < 256
        ? [0x81, payload.length]
        : [0x82, payload.length >> 8, payload.length & 255]
  return concat(Uint8Array.from([tag, ...length]), payload)
}
function integer(unsigned: Uint8Array) {
  let bytes = unsigned
  while (bytes.length > 1 && bytes[0] === 0) bytes = bytes.slice(1)
  if (bytes[0] & 0x80) bytes = concat(Uint8Array.of(0), bytes)
  return der(2, bytes)
}
const filled = (length: number, first = 0x80) => {
  const bytes = new Uint8Array(length)
  bytes[0] = first
  return bytes
}
const ecdsa = (first: number) =>
  der(0x30, concat(integer(filled(32, first)), integer(filled(32, first))))
function sec1Private(scalarBytes: number, oidBytes: number) {
  return der(
    0x30,
    concat(
      integer(Uint8Array.of(1)),
      der(4, filled(scalarBytes)),
      der(0xa0, der(6, new Uint8Array(oidBytes)))
    )
  )
}
function uncompressedPoint(point: Uint8Array, coordinateBytes: number) {
  if (point.length !== 1 + 2 * coordinateBytes || point[0] !== 4)
    throw new Error('Expected uncompressed ECPoint including 0x04')
  return point.length
}

describe('actual loaded serialized algorithm examples', () => {
  it('loads the maintained November11 snapshot rather than stale cells', () => {
    expect(loadedFileMetadata?.filename).toMatch(
      /pqc_complete_algorithm_reference_11112026(?:_r\d+)?\.csv$/
    )
  })
  it.each(expected)(
    '%s retains its pinned public/private/signature-or-ciphertext/secret byte scope',
    (id, pk, sk, sig, secret) => {
      expect(sizes(row(id))).toEqual([pk, sk, sig, secret])
      if (sk === null) expect(algorithmSizeBytes(row(id), 'privateKey')).toBeNull()
    }
  )
  it('keeps legacy and formal composite KEM aliases equal while distinguishing the TLS group', () => {
    const legacy = row('ml-kem-768-ecdh-p256'),
      formal = row('id-mlkem768-ecdh-p256-sha3-256')
    expect(sizes(legacy)).toEqual(sizes(formal))
    expect(legacy.useCaseNotes).toMatch(/legacy catalogue alias/i)
    expect(formal.useCaseNotes).toContain('legacy alias')
    for (const value of [legacy, formal]) {
      expect(value.useCaseNotes).toContain('draft-ietf-lamps-pq-composite-kem-23')
      expect(value.useCaseNotes).toContain('64-byte ML-KEM seed')
      expect(value.useCaseNotes).toContain('51-byte DER ECPrivateKey')
      expect(value.useCaseNotes).toMatch(/not (?:the TLS named group )?SecP256r1MLKEM768/)
    }
    expect(row('secp256r1mlkem768').sharedSecretSize).toBe(64)
    expect(formal.sharedSecretSize).toBe(32)
  })

  it('accounts for DER positive sign prefixes and variable ECDSA signature length', () => {
    const high = ecdsa(0x80),
      low = ecdsa(0x7f)
    expect([...high.slice(0, 5)]).toEqual([0x30, 70, 2, 33, 0])
    expect(high.length).toBe(72)
    expect(low.length).toBe(70)
    const value = row('id-mldsa44-ecdsa-p256-sha256')
    expect(2420 + high.length).toBe(value.signatureCiphertextSize)
    expect(2420 + low.length).toBe(2490)
    expect(value.useCaseNotes).toContain('at most 2492')
    expect(value.useCaseNotes).toContain('72-byte ECDSA maximum')
    expect(value.useCaseNotes).toContain('not an exact 2484-byte fixed-width signature')
    expect(1312 + 1 + 32 + 32).toBe(value.publicKeySize)
    expect(sec1Private(32, 8).length).toBe(51)
    expect(32 + sec1Private(32, 8).length).toBe(value.privateKeySize)
    expect(row('id-mldsa44-ed25519-sha512').useCaseNotes).toContain('2484 bytes, exact')
  })

  it('includes the 0x04 point byte for every EC composite KEM and refuses a coordinates-only counterexample', () => {
    const point = concat(Uint8Array.of(4), new Uint8Array(64))
    expect(uncompressedPoint(point, 32)).toBe(65)
    expect(() => uncompressedPoint(point.slice(1), 32)).toThrow('0x04')
    expect(() => uncompressedPoint(concat(Uint8Array.of(2), point.slice(1)), 32)).toThrow('0x04')
    expect(1184 + point.length).toBe(row('id-mlkem768-ecdh-p256-sha3-256').publicKeySize)
    expect(1088 + point.length).toBe(row('id-mlkem768-ecdh-p256-sha3-256').signatureCiphertextSize)
    for (const [id, mlPk, mlCt, coordinate] of [
      ['id-mlkem768-ecdh-p256-sha3-256', 1184, 1088, 32],
      ['id-mlkem768-ecdh-p384-sha3-256', 1184, 1088, 48],
      ['id-mlkem768-ecdh-brainpoolp256r1-sha3-256', 1184, 1088, 32],
      ['id-mlkem1024-ecdh-p384-sha3-256', 1568, 1568, 48],
      ['id-mlkem1024-ecdh-p521-sha3-256', 1568, 1568, 66],
      ['id-mlkem1024-ecdh-brainpoolp384r1-sha3-256', 1568, 1568, 48],
    ] as const) {
      const value = row(id)
      expect(value.publicKeySize).toBe(mlPk + 1 + 2 * coordinate)
      expect(value.signatureCiphertextSize).toBe(mlCt + 1 + 2 * coordinate)
      expect(value.useCaseNotes).toContain('leading 0x04')
      expect(value.useCaseNotes).toContain('excluding enclosing SPKI/PKCS#8/CMS')
    }
    expect(64 + sec1Private(32, 8).length).toBe(row('ml-kem-768-ecdh-p256').privateKeySize)
  })

  it('does not replace raw TLS concatenated group secrets with a 32-byte derived key', () => {
    for (const [id, left] of [
      ['x25519mlkem768', 32],
      ['secp256r1mlkem768', 32],
      ['secp384r1mlkem1024', 48],
    ] as const) {
      const value = row(id)
      expect(value.sharedSecretSize).toBe(left + 32)
      expect(value.sharedSecretSize).not.toBe(32)
      expect(value.useCaseNotes).toContain('before the TLS HKDF key schedule')
      expect(value.useCaseNotes).toContain('not one component or a derived traffic/application key')
    }
    // The composite KEM's 32-byte output and TLS group's raw 64-byte input
    // have distinct profile identities despite identical public/ct lengths.
    expect(row('id-mlkem768-ecdh-p256-sha3-256').sharedSecretSize).toBe(32)
    expect(row('id-mlkem768-ecdh-p256-sha3-256').sharedSecretSize).not.toBe(
      row('secp256r1mlkem768').sharedSecretSize
    )
  })

  it('bounds the RSA DER table example under e65537 rather than every possible exponent', () => {
    const modulus = integer(filled(256)),
      exponent = integer(Uint8Array.of(1, 0, 1))
    const publicKey = der(0x30, concat(modulus, exponent))
    const privateKey = der(
      0x30,
      concat(
        integer(Uint8Array.of(0)),
        modulus,
        exponent,
        integer(filled(256)),
        ...Array.from({ length: 5 }, () => integer(filled(128)))
      )
    )
    expect(publicKey.length).toBe(270)
    expect(privateKey.length).toBe(1194)
    const value = row('id-mldsa44-rsa2048-pss-sha256')
    expect(1312 + publicKey.length).toBe(value.publicKeySize)
    expect(32 + privateKey.length).toBe(value.privateKeySize)
    expect(2420 + 256).toBe(value.signatureCiphertextSize)
    const largerExponent = integer(Uint8Array.of(0x80, 0, 0, 1))
    expect(der(0x30, concat(modulus, largerExponent)).length).toBeGreaterThan(270)
    expect(value.useCaseNotes).toContain('e = 65537')
    expect(value.useCaseNotes).toContain('not universal maxima for arbitrary exponents')
    expect(value.useCaseNotes).toContain('DER integer lengths may vary')
  })

  it('keeps FAEST version, parameter set and serialized private key distinct from an AES secret', () => {
    const value = row('faest')
    expect(value.useCaseNotes).toContain('FAEST v3.0, FAEST-128f')
    expect(value.useCaseNotes).toContain('Table 3.2')
    expect(value.useCaseNotes).toContain('sk = x || k')
    expect(value.useCaseNotes).toContain('not just the abstract 16-byte AES key')
    expect(value.useCaseNotes).toContain('not an all-candidate minimum')
    expect(16 + 16).toBe(value.privateKeySize)
    expect(value.publicKeySize! + value.signatureCiphertextSize!).toBe(5202)
    for (const reference of [
      'FAEST-128s signature 4066',
      'FAEST-192f 11738',
      'FAEST-256f 20856',
      'https://faest.info/faest-spec-v3.0.pdf',
    ])
      expect(value.useCaseNotes).toContain(reference)
  })
})
