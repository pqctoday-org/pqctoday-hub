// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Key } from '@/types'
import { useKemOperations, mockKemSecret } from './useKemOperations'
import * as WebCrypto from '../../../utils/webCrypto'
import * as MLKEM from '../../../wasm/liboqs_kem'
vi.mock('../../../utils/webCrypto', () => ({
  generateX25519KeyPair: vi.fn(),
  generateECDHKeyPair: vi.fn(),
  deriveSharedSecret: vi.fn(),
  hkdfExtract: vi.fn(),
}))
vi.mock('../../../wasm/liboqs_kem', () => ({ encapsulateBits: vi.fn(), decapsulateBits: vi.fn() }))
class SampleCryptoKey {
  algorithm: KeyAlgorithm
  type: 'public' | 'private'
  usages: KeyUsage[]
  extractable: boolean
  constructor(
    algorithm: KeyAlgorithm,
    type: 'public' | 'private',
    usages: KeyUsage[] = type === 'private' ? ['deriveBits'] : [],
    extractable = false
  ) {
    this.algorithm = algorithm
    this.type = type
    this.usages = usages
    this.extractable = extractable
  }
}
const record = (
  algorithm: string,
  type: 'public' | 'private',
  id = `${type === 'public' ? 'pk' : 'sk'}-sample`
): Key => ({
  id,
  name: `${algorithm} ${type}`,
  type,
  algorithm,
  timestamp: 1,
  value: 'retained sample',
  data: new SampleCryptoKey(
    algorithm === 'X25519'
      ? { name: algorithm }
      : ({ name: 'ECDH', namedCurve: algorithm } as EcKeyAlgorithm),
    type
  ) as unknown as CryptoKey,
})
const pqc = (type: 'public' | 'private'): Key => ({
  ...record('ML-KEM-768', type),
  data: new Uint8Array([3, 4]),
})
const setup = (overrides: Partial<Parameters<typeof useKemOperations>[0]> = {}) =>
  ({
    keyStore: [] as Key[],
    selectedEncKeyId: 'pk-sample',
    selectedDecKeyId: 'sk-sample',
    secondaryEncKeyId: 'pk-secondary',
    secondaryDecKeyId: 'sk-secondary',
    isHybridMode: false,
    executionMode: 'wasm' as const,
    wasmLoaded: true,
    keySize: '768',
    sharedSecret: '',
    ciphertext: '',
    hybridMethod: 'concat' as const,
    ...Object.fromEntries(
      [
        'setSharedSecret',
        'setCiphertext',
        'setKemDecapsulationResult',
        'setDecapsulatedSecret',
        'addLog',
        'setLoading',
        'setError',
        'setPqcSharedSecret',
        'setClassicalSharedSecret',
        'setPqcRecoveredSecret',
        'setClassicalRecoveredSecret',
      ].map((name) => [name, vi.fn()])
    ),
    ...overrides,
  }) as Parameters<typeof useKemOperations>[0]
let importKey: ReturnType<typeof vi.fn>
const ephemeral = {
  privateKey: { fixture: 'ephemeral-private' } as unknown as CryptoKey,
  publicKeyHex: '0908',
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('CryptoKey', SampleCryptoKey)
  importKey = vi.fn().mockResolvedValue({ fixture: 'imported-ephemeral' })
  vi.stubGlobal('crypto', { subtle: { importKey } })
  vi.mocked(WebCrypto.generateX25519KeyPair).mockResolvedValue(
    ephemeral as Awaited<ReturnType<typeof WebCrypto.generateX25519KeyPair>>
  )
  vi.mocked(WebCrypto.generateECDHKeyPair).mockResolvedValue(
    ephemeral as Awaited<ReturnType<typeof WebCrypto.generateECDHKeyPair>>
  )
  vi.mocked(WebCrypto.deriveSharedSecret).mockResolvedValue(new Uint8Array([1, 2]))
  vi.mocked(WebCrypto.hkdfExtract).mockImplementation(async (_salt, value) => value)
  vi.mocked(MLKEM.encapsulateBits).mockResolvedValue({
    ciphertext: new Uint8Array([5, 6]),
    sharedKey: new Uint8Array([3, 4]),
  })
  vi.mocked(MLKEM.decapsulateBits).mockResolvedValue(new Uint8Array([3, 4]))
})
afterEach(() => vi.unstubAllGlobals())

describe('KEM guards preserve existing operation routing, not cryptographic conformance', () => {
  const blocked = ['X448', 'P-384', 'P-521', 'DH-2048'].flatMap((algorithm) =>
    (['encapsulate', 'decapsulate'] as const).flatMap((operation) =>
      [false, true].flatMap((isHybridMode) =>
        (['wasm', 'mock'] as const).map((executionMode) => ({
          algorithm,
          operation,
          isHybridMode,
          executionMode,
        }))
      )
    )
  )
  it.each(blocked)(
    'blocks unsupported $algorithm $operation hybrid=$isHybridMode mode=$executionMode before calls',
    async ({ algorithm, operation, isHybridMode, executionMode }) => {
      const role = operation === 'encapsulate' ? 'public' : 'private'
      const unsupported = record(
        algorithm,
        role,
        `${role === 'public' ? 'pk' : 'sk'}-${isHybridMode ? 'secondary' : 'sample'}`
      )
      const props = setup({
        keyStore: isHybridMode ? [pqc(role), unsupported] : [unsupported],
        isHybridMode,
        executionMode,
        ciphertext: '0506|0908',
        sharedSecret: '01020304',
      })
      await useKemOperations(props).runKemOperation(operation)
      expect(props.setError).toHaveBeenLastCalledWith(
        expect.stringContaining(`${algorithm} is not implemented`)
      )
      expect(props.setKemDecapsulationResult).toHaveBeenCalledWith(null)
      expect(props.setDecapsulatedSecret).toHaveBeenCalledWith('')
      expect(props.setLoading).toHaveBeenLastCalledWith(false)
      expect(props.addLog).not.toHaveBeenCalled()
      expect(WebCrypto.generateECDHKeyPair).not.toHaveBeenCalled()
      expect(WebCrypto.generateX25519KeyPair).not.toHaveBeenCalled()
      expect(WebCrypto.deriveSharedSecret).not.toHaveBeenCalled()
      expect(importKey).not.toHaveBeenCalled()
      expect(MLKEM.encapsulateBits).not.toHaveBeenCalled()
      expect(MLKEM.decapsulateBits).not.toHaveBeenCalled()
    }
  )

  it.each(
    ['X25519', 'P-256'].flatMap((algorithm) =>
      (['wasm', 'mock'] as const).map((executionMode) => ({ algorithm, executionMode }))
    )
  )(
    'retains $algorithm WebCrypto calls in $executionMode without the PQC library gate',
    async ({ algorithm, executionMode }) => {
      const pub = record(algorithm, 'public'),
        priv = record(algorithm, 'private')
      const props = setup({ keyStore: [pub, priv], executionMode, wasmLoaded: false })
      await useKemOperations(props).runKemOperation('encapsulate')
      expect(
        algorithm === 'X25519' ? WebCrypto.generateX25519KeyPair : WebCrypto.generateECDHKeyPair
      ).toHaveBeenCalledWith()
      expect(WebCrypto.deriveSharedSecret).toHaveBeenCalledWith(ephemeral.privateKey, pub.data)
      expect(props.setSharedSecret).toHaveBeenLastCalledWith('0102')
      expect(props.setCiphertext).toHaveBeenLastCalledWith('0908')
      await useKemOperations({
        ...props,
        sharedSecret: '0102',
        ciphertext: '0908',
      }).runKemOperation('decapsulate')
      expect(importKey).toHaveBeenCalledWith(
        'raw',
        new Uint8Array([9, 8]),
        algorithm === 'X25519' ? { name: 'X25519' } : { name: 'ECDH', namedCurve: 'P-256' },
        true,
        []
      )
      expect(WebCrypto.deriveSharedSecret).toHaveBeenLastCalledWith(
        priv.data,
        await importKey.mock.results[0].value
      )
      expect(props.setKemDecapsulationResult).toHaveBeenLastCalledWith(true)
      expect(MLKEM.encapsulateBits).not.toHaveBeenCalled()
    }
  )

  it.each(['X25519', 'P-256'])(
    'retains hybrid %s call order/bytes and existing decapsulation readiness',
    async (algorithm) => {
      const pub = pqc('public'),
        priv = pqc('private'),
        secondaryPub = record(algorithm, 'public', 'pk-secondary'),
        secondaryPriv = record(algorithm, 'private', 'sk-secondary')
      const props = setup({
        keyStore: [pub, priv, secondaryPub, secondaryPriv],
        isHybridMode: true,
        executionMode: 'mock',
      })
      await useKemOperations(props).runKemOperation('encapsulate')
      expect(MLKEM.encapsulateBits).toHaveBeenCalledWith({ name: 'ML-KEM-768' }, pub.data)
      expect(props.setSharedSecret).toHaveBeenLastCalledWith('01020304')
      expect(props.setCiphertext).toHaveBeenLastCalledWith('0506|0908')
      await useKemOperations({
        ...props,
        wasmLoaded: false,
        ciphertext: '0506|0908',
        sharedSecret: '01020304',
      }).runKemOperation('decapsulate')
      expect(MLKEM.decapsulateBits).toHaveBeenCalledWith(
        { name: 'ML-KEM-768' },
        priv.data,
        new Uint8Array([5, 6])
      )
      expect(props.setKemDecapsulationResult).toHaveBeenLastCalledWith(true)
    }
  )

  it('does not substitute a solo operation for a retained classical hybrid primary', async () => {
    const props = setup({ keyStore: [record('X25519', 'public')], isHybridMode: true })
    await useKemOperations(props).runKemOperation('encapsulate')
    expect(props.setError).toHaveBeenLastCalledWith(
      expect.stringContaining('Hybrid Mode needs a PQC')
    )
    expect(WebCrypto.generateX25519KeyPair).not.toHaveBeenCalled()
  })

  it('preserves the value-only solo mock pair demonstration and wrong-pair rejection', async () => {
    const pub = { ...pqc('public'), data: undefined },
      priv = { ...pqc('private'), data: undefined }
    const props = setup({ keyStore: [pub, priv], executionMode: 'mock', wasmLoaded: false })
    await useKemOperations(props).runKemOperation('encapsulate')
    const ciphertext = `mockct-sample-${mockKemSecret(pub.id).slice(0, 16)}`
    expect(props.setCiphertext).toHaveBeenLastCalledWith(ciphertext)
    await useKemOperations({ ...props, ciphertext }).runKemOperation('decapsulate')
    expect(props.setKemDecapsulationResult).toHaveBeenLastCalledWith(true)
    await useKemOperations({
      ...props,
      ciphertext,
      selectedDecKeyId: 'sk-other',
      keyStore: [{ ...priv, id: 'sk-other' }],
    }).runKemOperation('decapsulate')
    expect(props.setKemDecapsulationResult).toHaveBeenLastCalledWith(false)
    expect(MLKEM.decapsulateBits).not.toHaveBeenCalled()
  })
})
