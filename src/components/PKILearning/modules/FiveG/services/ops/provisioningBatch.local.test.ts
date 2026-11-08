// SPDX-License-Identifier: AGPL-3.0-only
import { createCipheriv, createDecipheriv, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_OP, FiveGService, milenage } from '../FiveGService'
import { encryptTransport, importAtUDM } from './ProvisionOps'
import { PROVISIONING_AAD, PROVISIONING_IMSI, type ProvisioningEnvelope } from './provisioningBatch'
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))
const descriptor = Object.getOwnPropertyDescriptor(window, 'crypto')
const service = new FiveGService()
// K and the separate OP/OPc golden pair are reused from services/__tests__/audit_milenage.test.ts.
// The authored provisioning DEFAULT_OP is 55 repeated, not the golden pair's OP.
const K = '465b5ce8b199b49faa5f0a2ee238a6bc'
const EXPECTED_AAD = '["pqctoday-provisioning-batch",1,"AES-128-GCM"]'
const transportBytes = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex')
const ivBytes = Buffer.from('101112131415161718191a1b', 'hex')
const hex = (bytes: Uint8Array) => Buffer.from(bytes).toString('hex')
function independentOpc(k = K, op: Uint8Array = DEFAULT_OP) {
  const aes = createCipheriv('aes-128-ecb', Buffer.from(k, 'hex'), null)
  aes.setAutoPadding(false)
  const encrypted = Buffer.concat([aes.update(op), aes.final()])
  return hex(Uint8Array.from(encrypted, (byte, index) => byte ^ (op.at(index) ?? 0)))
}
async function transportKey(raw: Buffer = transportBytes): Promise<CryptoKey> {
  return window.crypto.subtle.importKey('raw', new Uint8Array(raw), 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ])
}
function nodeEnvelope(plaintext: string, aad = EXPECTED_AAD): ProvisioningEnvelope {
  const cipher = createCipheriv('aes-128-gcm', transportBytes, ivBytes)
  cipher.setAAD(Buffer.from(aad))
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
    cipher.getAuthTag(),
  ])
  return {
    format: 'pqctoday-provisioning-batch',
    version: 1,
    algorithm: 'AES-128-GCM',
    ivHex: ivBytes.toString('hex'),
    ciphertextHex: ciphertext.toString('hex'),
  }
}
const goodRecord = () => ({ imsi: '310260123456789', k: K, opc: independentOpc() })
beforeEach(() => Object.defineProperty(window, 'crypto', { configurable: true, value: webcrypto }))
afterEach(() => {
  vi.restoreAllMocks()
  if (descriptor) Object.defineProperty(window, 'crypto', descriptor)
})

describe('authenticated one-record provisioning batch', () => {
  it('checks the existing MILENAGE golden OPc and the authored provisioning OP against independent ECB', async () => {
    expect(PROVISIONING_AAD).toBe(EXPECTED_AAD)
    expect(PROVISIONING_IMSI).toBe('310260123456789')
    const goldenOp = Buffer.from('cdc202d5123e20f62b6d676ac72cb318', 'hex')
    expect(hex(await milenage.computeOPc(Buffer.from(K, 'hex'), goldenOp))).toBe(
      'cd63cb71954a9f4e48a5994e37a02baf'
    )
    expect(independentOpc(K, goldenOp)).toBe('cd63cb71954a9f4e48a5994e37a02baf')
    expect(await service.computeOPc(K)).toBe(independentOpc())
  })

  it('matches actual WebCrypto encryption/tag to independent Node and imports its exact record', async () => {
    const knownKey = await transportKey()
    // Fixed inputs are test fixtures only; the separate test below covers fresh real generation.
    vi.spyOn(window.crypto.subtle, 'generateKey').mockResolvedValueOnce(knownKey)
    vi.spyOn(window.crypto, 'getRandomValues').mockImplementationOnce((array) => {
      if (!(array instanceof Uint8Array)) throw new Error('expected nonce buffer')
      array.set(ivBytes)
      return array
    })
    const record = goodRecord()
    const encrypted = await service.encryptTransport(record.k, record.opc)
    expect(encrypted.envelope).toEqual(nodeEnvelope(JSON.stringify(record)))
    const raw = Buffer.from(encrypted.envelope.ciphertextHex, 'hex')
    const decipher = createDecipheriv('aes-128-gcm', transportBytes, ivBytes)
    decipher.setAAD(Buffer.from(EXPECTED_AAD))
    decipher.setAuthTag(raw.subarray(-16))
    expect(
      Buffer.concat([decipher.update(raw.subarray(0, -16)), decipher.final()]).toString()
    ).toBe(JSON.stringify(record))
    const imported = await service.importAtUDM(
      JSON.stringify(encrypted.envelope),
      encrypted.transportKey
    )
    expect(imported.record).toEqual(record)
    expect(imported.checks).toMatchObject({
      identity: expect.stringContaining('matches'),
      opcConsistency: expect.stringContaining('MILENAGE'),
      sampleStorage: expect.stringContaining('no USIM or subscriber database write'),
    })
  })

  it('creates fresh nonextractable128-bit transport keys and96-bit nonces without serializing keys', async () => {
    const record = goodRecord()
    const left = await encryptTransport(service, record.k, record.opc)
    const right = await encryptTransport(service, record.k, record.opc)
    expect(left.transportKey).not.toBe(right.transportKey)
    expect(left.envelope.ivHex).toHaveLength(24)
    expect(left.envelope.ivHex).not.toBe(right.envelope.ivHex)
    expect(left.envelope.ciphertextHex).not.toBe(right.envelope.ciphertextHex)
    expect(left.transportKey.algorithm).toMatchObject({ name: 'AES-GCM', length: 128 })
    expect(left.transportKey.extractable).toBe(false)
    expect(left.transportKey.usages).toEqual(['encrypt', 'decrypt'])
    await expect(window.crypto.subtle.exportKey('raw', left.transportKey)).rejects.toThrow()
    expect(Object.keys(left.envelope)).toEqual([
      'format',
      'version',
      'algorithm',
      'ivHex',
      'ciphertextHex',
    ])
    expect(
      (await importAtUDM(service, JSON.stringify(left.envelope), left.transportKey)).record
    ).toEqual(record)
  })

  it.each(['ciphertext', 'tag', 'nonce', 'aad', 'key'] as const)(
    'rejects changed %s before OPc validation or record publication',
    async (part) => {
      const envelope = nodeEnvelope(JSON.stringify(goodRecord()))
      let key = await transportKey()
      if (part === 'ciphertext')
        envelope.ciphertextHex =
          (envelope.ciphertextHex.startsWith('00') ? '01' : '00') + envelope.ciphertextHex.slice(2)
      if (part === 'tag')
        envelope.ciphertextHex =
          envelope.ciphertextHex.slice(0, -2) +
          (envelope.ciphertextHex.endsWith('00') ? '01' : '00')
      if (part === 'nonce') envelope.ivHex = 'ff' + envelope.ivHex.slice(2)
      if (part === 'aad')
        Object.assign(envelope, nodeEnvelope(JSON.stringify(goodRecord()), 'wrong-context'))
      if (part === 'key') key = await transportKey(Buffer.alloc(16, 77))
      const opcCheck = vi.spyOn(milenage, 'computeOPc')
      await expect(service.importAtUDM(JSON.stringify(envelope), key)).rejects.toThrow(
        /authentication\/decryption/
      )
      expect(opcCheck).not.toHaveBeenCalled()
    }
  )

  it.each([
    null,
    [],
    {},
    { format: 'other' },
    { version: 2 },
    { algorithm: 'AES-128-CBC' },
    { ivHex: '00'.repeat(11) },
    { ivHex: 'g0'.repeat(12) },
    { ciphertextHex: 'aa'.repeat(15) },
    { ciphertextHex: 'aaa' },
    { ciphertextHex: 'zz'.repeat(20) },
    { unexpected: 'field' },
  ])('rejects malformed/unsupported envelope %j before decrypting', async (patch) => {
    const envelope =
      patch === null || Array.isArray(patch)
        ? patch
        : { ...nodeEnvelope(JSON.stringify(goodRecord())), ...patch }
    if (patch && !Array.isArray(patch) && Object.keys(patch).length === 0) {
      // Explicit empty-object countercase, distinct from the valid envelope.
      const decrypt = vi.spyOn(window.crypto.subtle, 'decrypt')
      await expect(service.importAtUDM('{}', await transportKey())).rejects.toThrow()
      expect(decrypt).not.toHaveBeenCalled()
      return
    }
    const decrypt = vi.spyOn(window.crypto.subtle, 'decrypt')
    await expect(
      service.importAtUDM(JSON.stringify(envelope), await transportKey())
    ).rejects.toThrow()
    expect(decrypt).not.toHaveBeenCalled()
  })

  it.each([
    { imsi: '310260123456780' },
    { imsi: '31026' },
    { imsi: 310260123456789 },
    { k: 'aa'.repeat(15) },
    { k: 'zz'.repeat(16) },
    { opc: 'bb'.repeat(15) },
    { opc: '00'.repeat(16) },
    { extra: 'unexpected' },
  ])('rejects authenticated but invalid decoded record %j', async (patch) => {
    const envelope = nodeEnvelope(JSON.stringify({ ...goodRecord(), ...patch }))
    await expect(
      service.importAtUDM(JSON.stringify(envelope), await transportKey())
    ).rejects.toThrow()
  })

  it('rejects duplicates and malformed plaintext even when independently authenticated', async () => {
    const record = goodRecord(),
      valid = nodeEnvelope(JSON.stringify(record)),
      key = await transportKey()
    const duplicatedEnvelope = JSON.stringify(valid).replace(
      '"version":1',
      '"version":2,"version":1'
    )
    await expect(service.importAtUDM(duplicatedEnvelope, key)).rejects.toThrow(/duplicate/)
    for (const text of [
      'not-json',
      '[]',
      'null',
      JSON.stringify(record).replace('"k":', '"k":"00","k":'),
    ]) {
      await expect(service.importAtUDM(JSON.stringify(nodeEnvelope(text)), key)).rejects.toThrow()
    }
  })

  it('retains exact accepted hex casing and validates the explicit expected subscriber', async () => {
    const record = { ...goodRecord(), k: K.toUpperCase(), opc: independentOpc().toUpperCase() }
    const envelope = nodeEnvelope(JSON.stringify(record)),
      key = await transportKey()
    expect((await service.importAtUDM(JSON.stringify(envelope), key, record.imsi)).record).toEqual(
      record
    )
    await expect(
      service.importAtUDM(JSON.stringify(envelope), key, '310260123456780')
    ).rejects.toThrow(/identity/)
  })

  it('rejects malformed sender K/OPc before creating a transport key', async () => {
    const generate = vi.spyOn(window.crypto.subtle, 'generateKey')
    for (const [k, opc] of [
      ['bad', independentOpc()],
      [K, ''],
      [K, 'gg'.repeat(16)],
    ])
      await expect(service.encryptTransport(k, opc)).rejects.toThrow(/16 hexadecimal bytes/)
    expect(generate).not.toHaveBeenCalled()
  })

  it('exposes real operational failure and succeeds on a corrected retry without retained acceptance', async () => {
    const record = goodRecord(),
      envelope = nodeEnvelope(JSON.stringify(record)),
      key = await transportKey()
    vi.spyOn(window.crypto.subtle, 'decrypt').mockRejectedValueOnce(
      new Error('controlled unavailable backend')
    )
    await expect(service.importAtUDM(JSON.stringify(envelope), key)).rejects.toThrow(
      /no record was accepted/
    )
    expect((await service.importAtUDM(JSON.stringify(envelope), key)).record).toEqual(record)
    vi.spyOn(milenage, 'computeOPc').mockRejectedValueOnce(
      new Error('controlled OPc calculation failure')
    )
    await expect(service.importAtUDM(JSON.stringify(envelope), key)).rejects.toThrow(
      'controlled OPc calculation failure'
    )
    expect((await service.importAtUDM(JSON.stringify(envelope), key)).record).toEqual(record)
    vi.spyOn(window.crypto.subtle, 'encrypt').mockRejectedValueOnce(
      new Error('controlled encrypt failure')
    )
    await expect(service.encryptTransport(record.k, record.opc)).rejects.toThrow(
      'controlled encrypt failure'
    )
    const retried = await service.encryptTransport(record.k, record.opc)
    expect(
      (await service.importAtUDM(JSON.stringify(retried.envelope), retried.transportKey)).record
    ).toEqual(record)
  })
})
