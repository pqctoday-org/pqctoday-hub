// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Key } from '@/types'
import { classicalKemUnavailableReason, kemSelectionUnavailableReason } from './kemSelectionSupport'

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
const key = (
  id: string,
  algorithm: string,
  role: 'public' | 'private',
  data?: Key['data']
): Key => ({
  id,
  name: `${algorithm} ${role} sample`,
  algorithm,
  type: role,
  value: 'retained sample bytes',
  data,
  timestamp: 1,
})
const agreement = (
  algorithm: string,
  role: 'public' | 'private',
  options: { usages?: KeyUsage[]; extractable?: boolean; actual?: KeyAlgorithm } = {}
) =>
  key(
    `${algorithm}-${role}`,
    algorithm,
    role,
    new SampleCryptoKey(
      options.actual ??
        (algorithm === 'X25519'
          ? { name: 'X25519' }
          : ({ name: 'ECDH', namedCurve: algorithm } as EcKeyAlgorithm)),
      role,
      options.usages,
      options.extractable
    ) as unknown as CryptoKey
  )
const pqc = (role: 'public' | 'private', withData = true) =>
  key(`pqc-${role}`, 'ML-KEM-768', role, withData ? new Uint8Array([1, 2, 3]) : undefined)
const available = (
  primary: Key,
  extra: Partial<Parameters<typeof kemSelectionUnavailableReason>[0]> = {}
) =>
  kemSelectionUnavailableReason({
    keyStore: [primary],
    primaryId: primary.id,
    secondaryId: '',
    operation: primary.type === 'public' ? 'encapsulate' : 'decapsulate',
    isHybridMode: false,
    executionMode: 'wasm',
    wasmLoaded: true,
    ...extra,
  })

beforeEach(() => vi.stubGlobal('CryptoKey', SampleCryptoKey))
afterEach(() => vi.unstubAllGlobals())

describe('KEM selection input/path availability, not an operation verdict', () => {
  const matrix = ['X25519', 'P-256', 'X448', 'P-384', 'P-521', 'DH-2048'].flatMap((algorithm) =>
    (['public', 'private'] as const).flatMap((role) =>
      (['solo', 'hybrid-secondary'] as const).flatMap((position) =>
        (['wasm', 'mock'] as const).map((executionMode) => ({
          algorithm,
          role,
          position,
          executionMode,
        }))
      )
    )
  )
  it.each(matrix)(
    '$algorithm $role $position in $executionMode',
    ({ algorithm, role, position, executionMode }) => {
      const classical = ['X448', 'DH-2048'].includes(algorithm)
        ? key(
            `${algorithm}-${role}`,
            algorithm,
            role,
            new TextEncoder().encode('sample PEM file bytes')
          )
        : agreement(algorithm, role)
      const primary = position === 'solo' ? classical : pqc(role)
      const records = [primary, classical]
      const snapshot = JSON.stringify(records)
      const reason = available(primary, {
        keyStore: records,
        isHybridMode: position !== 'solo',
        secondaryId: classical.id,
        executionMode,
      })
      if (['X25519', 'P-256'].includes(algorithm)) expect(reason).toBeNull()
      else expect(reason).toContain(`${algorithm} is not implemented`)
      expect(JSON.stringify(records)).toBe(snapshot)
    }
  )

  it.each(['X25519', 'P-256'])(
    'does not require public-key deriveBits, extractability or optional dataType: %s',
    (algorithm) => {
      const publicKey = agreement(algorithm, 'public', { usages: [], extractable: false })
      expect(publicKey.dataType).toBeUndefined()
      expect(available(publicKey, { wasmLoaded: false })).toBeNull()
      expect(
        available(agreement(algorithm, 'private', { usages: ['deriveBits'], extractable: false }), {
          executionMode: 'mock',
          wasmLoaded: false,
        })
      ).toBeNull()
    }
  )

  it('requires only the private deriveBits permission actually used by the existing consumer', () => {
    expect(available(agreement('P-256', 'private', { usages: ['deriveKey'] }))).toContain(
      'does not allow the deriveBits'
    )
  })

  it.each([undefined, new Uint8Array([0, 255])])(
    'does not turn missing/stored bytes into an imported agreement key',
    (data) => {
      expect(available(key('record', 'X25519', 'public', data))).toContain('no usable CryptoKey')
    }
  )

  it('rejects wrong actual algorithm, curve and key role without decoding or substituting', () => {
    expect(
      available(
        agreement('P-256', 'public', {
          actual: { name: 'ECDSA', namedCurve: 'P-256' } as EcKeyAlgorithm,
        })
      )
    ).toContain('does not match')
    expect(
      available(
        agreement('P-256', 'public', {
          actual: { name: 'ECDH', namedCurve: 'P-384' } as EcKeyAlgorithm,
        })
      )
    ).toContain('does not match')
    const wrongRole = agreement('X25519', 'public')
    wrongRole.data = agreement('X25519', 'private').data
    expect(available(wrongRole)).toContain('wrong public/private role')
    expect(available(agreement('X25519', 'private'), { operation: 'encapsulate' })).toContain(
      'different role'
    )
  })

  it('explains missing and deleted selections instead of choosing a different key', () => {
    const selected = agreement('P-256', 'public')
    expect(available(selected, { primaryId: '' })).toContain('Select a public key')
    expect(available(selected, { primaryId: 'deleted' })).toContain('no longer available')
    const primary = pqc('private')
    expect(available(primary, { isHybridMode: true, secondaryId: '' })).toContain(
      'secondary classical private key'
    )
    expect(available(primary, { isHybridMode: true, secondaryId: 'deleted' })).toContain(
      'secondary private key is no longer available'
    )
  })

  it('does not silently run a retained classical primary as a hybrid operation', () => {
    const primary = agreement('X25519', 'public'),
      secondary = agreement('P-256', 'public')
    expect(
      available(primary, {
        keyStore: [primary, secondary],
        secondaryId: secondary.id,
        isHybridMode: true,
      })
    ).toContain('Hybrid Mode needs a PQC public key as primary')
    expect(
      available(primary, {
        keyStore: [primary, secondary],
        secondaryId: secondary.id,
        isHybridMode: false,
      })
    ).toBeNull()
  })

  it('preserves the existing asymmetric hybrid readiness predicates', () => {
    for (const executionMode of ['wasm', 'mock'] as const) {
      const pub = pqc('public'),
        secondaryPub = agreement('X25519', 'public')
      expect(
        available(pub, {
          keyStore: [pub, secondaryPub],
          secondaryId: secondaryPub.id,
          isHybridMode: true,
          wasmLoaded: false,
          executionMode,
        })
      ).toContain('before hybrid encapsulation')
      const priv = pqc('private'),
        secondaryPriv = agreement('X25519', 'private')
      expect(
        available(priv, {
          keyStore: [priv, secondaryPriv],
          secondaryId: secondaryPriv.id,
          isHybridMode: true,
          wasmLoaded: false,
          executionMode,
        })
      ).toBeNull()
    }
  })

  it('keeps mock PQC stand-ins usable only in their existing solo demonstration path', () => {
    const primary = pqc('public', false),
      secondary = agreement('P-256', 'public')
    expect(available(primary, { executionMode: 'mock', wasmLoaded: false })).toBeNull()
    expect(available(primary, { executionMode: 'wasm' })).toContain('needs byte material')
    expect(
      available(primary, {
        keyStore: [primary, secondary],
        isHybridMode: true,
        secondaryId: secondary.id,
        executionMode: 'mock',
      })
    ).toContain('mock/value-only record is not enough')
  })

  it('does not invent a supported path for a nonclassical hybrid secondary or non-KEM record', () => {
    const primary = pqc('public'),
      secondary = { ...pqc('public'), id: 'other' }
    expect(
      available(primary, {
        keyStore: [primary, secondary],
        isHybridMode: true,
        secondaryId: secondary.id,
      })
    ).toContain('classical public key')
    expect(available(key('signer', 'ML-DSA-65', 'public', new Uint8Array([1])))).toContain(
      'not a key candidate'
    )
    expect(classicalKemUnavailableReason(secondary, 'public')).toContain('classical public key')
  })
})
