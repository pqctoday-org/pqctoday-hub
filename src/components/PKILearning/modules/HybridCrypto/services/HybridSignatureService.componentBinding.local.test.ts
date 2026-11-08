// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import {
  concat,
  concatenationKeygen,
  concatenationSign,
  concatenationVerify,
  nestingSign,
  nestingVerify,
  silithiumSign,
  silithiumVerify,
  silithiumRecombinationAttack,
  ecSchnorrSign,
  ecSchnorrVerify,
} from './HybridSignatureService'

const fixture = vi.hoisted(() => ({ rawVerify: vi.fn() }))
vi.mock('@noble/post-quantum/ml-dsa.js', async (original) => {
  const actual = await original<typeof import('@noble/post-quantum/ml-dsa.js')>()
  return { ...actual, ml_dsa65: { ...actual.ml_dsa65, verify: fixture.rawVerify } }
})
beforeEach(async () => {
  const actual = await vi.importActual<typeof import('@noble/post-quantum/ml-dsa.js')>(
    '@noble/post-quantum/ml-dsa.js'
  )
  fixture.rawVerify.mockReset().mockImplementation(actual.ml_dsa65.verify)
})
const message = new TextEncoder().encode('Fictional shared-binding sample')

describe('executed hybrid component checks', () => {
  it.each([
    {
      name: 'concatenation',
      sign: concatenationSign,
      verify: concatenationVerify,
      ecAlone: true,
      mlAlone: true,
    },
    { name: 'nesting', sign: nestingSign, verify: nestingVerify, ecAlone: true, mlAlone: false },
    {
      name: 'local shared-binding model',
      sign: silithiumSign,
      verify: silithiumVerify,
      ecAlone: false,
      mlAlone: false,
    },
  ])(
    'verifies actual $name outputs and rejects altered message/components',
    ({ sign, verify, ecAlone, mlAlone }) => {
      const keys = concatenationKeygen()
      const signature = sign(message, keys).signatureBytes
      expect(verify(message, signature, keys)).toMatchObject({
        valid: true,
        ecValid: true,
        mlValid: true,
        ecAloneValid: ecAlone,
        mlAloneValid: mlAlone,
      })
      const editedMessage = new Uint8Array(message)
      editedMessage[0] ^= 1
      expect(verify(editedMessage, signature, keys).valid).toBe(false)
      const editedEc = new Uint8Array(signature)
      editedEc[40] ^= 1
      expect(verify(message, editedEc, keys).valid).toBe(false)
      const editedMl = new Uint8Array(signature)
      editedMl[100] ^= 1
      expect(verify(message, editedMl, keys).valid).toBe(false)
    }
  )

  it('reflects the actual raw ML verifier result instead of assigning false', () => {
    const keys = concatenationKeygen()
    const signature = silithiumSign(message, keys).signatureBytes
    fixture.rawVerify.mockReturnValueOnce(true)
    const result = silithiumVerify(message, signature, keys)
    expect(result).toMatchObject({ valid: true, mlValid: true, mlAloneValid: true })
    expect(fixture.rawVerify).toHaveBeenCalledTimes(1)
    const call = fixture.rawVerify.mock.calls[0]
    expect(Array.from(call[0])).toEqual(Array.from(signature.slice(65)))
    expect(call[1]).toBe(message)
    expect(call[2]).toBe(keys.mlPk)
  })

  it('uses fresh EC commitments for repeated messages and changed ML contexts', () => {
    const keys = concatenationKeygen()
    const replacement = concatenationKeygen()
    const first = silithiumSign(message, keys).signatureBytes
    const repeated = silithiumSign(message, keys).signatureBytes
    const changedKeys = { ...replacement, ecSk: keys.ecSk, ecPk: keys.ecPk }
    const changed = silithiumSign(message, changedKeys).signatureBytes
    expect(Array.from(first.slice(0, 33))).not.toEqual(Array.from(repeated.slice(0, 33)))
    expect(Array.from(first.slice(0, 33))).not.toEqual(Array.from(changed.slice(0, 33)))
    expect(silithiumVerify(message, first, keys).valid).toBe(true)
    expect(silithiumVerify(message, repeated, keys).valid).toBe(true)
    expect(silithiumVerify(message, changed, changedKeys).valid).toBe(true)
    const ecFirst = ecSchnorrSign(message, keys.ecSk)
    const ecSecond = ecSchnorrSign(message, keys.ecSk)
    expect(Array.from(ecFirst.R)).not.toEqual(Array.from(ecSecond.R))
    expect(ecSchnorrVerify(message, keys.ecPk, ecFirst.R, ecFirst.s)).toBe(true)
    expect(ecSchnorrVerify(message, keys.ecPk, ecSecond.R, ecSecond.s)).toBe(true)
  })

  it('isolates replacement of the ML component with no EC-secret access', () => {
    const legitimate = concatenationKeygen()
    const attacker = concatenationKeygen()
    const signed = silithiumSign(message, legitimate).signatureBytes
    const original = new Uint8Array(signed)
    const replacement = {
      ecPk: legitimate.ecPk,
      mlPk: attacker.mlPk,
      mlSk: attacker.mlSk,
      get ecSk(): never {
        throw new Error('EC secret must not be read')
      },
    }
    expect(silithiumVerify(message, signed, legitimate).valid).toBe(true)
    expect(silithiumRecombinationAttack(message, signed, replacement)).toMatchObject({
      valid: false,
      ecValid: false,
      mlValid: true,
    })
    expect(Array.from(signed)).toEqual(Array.from(original))
    // A nonfused splice is a positive control with the same public-key choice.
    const rawEc = concatenationSign(message, legitimate).signatureBytes.slice(0, 65)
    const rawMl = ml_dsa65.sign(message, attacker.mlSk)
    expect(concatenationVerify(message, concat(rawEc, rawMl), replacement)).toMatchObject({
      valid: true,
      ecValid: true,
      mlValid: true,
    })
  })

  it('reports a provider error separately from an executed negative result', () => {
    const keys = concatenationKeygen()
    const signature = silithiumSign(message, keys).signatureBytes
    fixture.rawVerify.mockImplementationOnce(() => {
      throw new Error('Controlled verification error')
    })
    expect(silithiumVerify(message, signature, keys)).toMatchObject({
      valid: false,
      error: 'Controlled verification error',
    })
    expect(silithiumVerify(message, signature, keys)).toMatchObject({ valid: true })
  })
})
