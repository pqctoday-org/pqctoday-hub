// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { useSymmetricOperations } from './useSymmetricOperations'

const senderSecret = '11'.repeat(32)
const receiverSecret = '22'.repeat(32)
const props = () => ({
  keyStore: [],
  selectedSymKeyId: '',
  executionMode: 'wasm' as const,
  symData: '',
  symOutput: '',
  sharedSecret: senderSecret,
  decapsulatedSecret: senderSecret,
  dataToEncrypt: 'Sample message',
  encryptedData: '',
  setSymData: vi.fn(),
  setSymOutput: vi.fn(),
  setEncryptedData: vi.fn(),
  setDecryptedData: vi.fn(),
  addLog: vi.fn(),
  setLoading: vi.fn(),
  setError: vi.fn(),
})

describe('KEM receiver message decryption', () => {
  it('decrypts with the receiver secret and rejects a wrong recovered secret', async () => {
    const p = props()
    await useSymmetricOperations(p).runSymmetricOperation('encrypt')
    const encryptedData = p.setEncryptedData.mock.calls[0][0]
    await useSymmetricOperations({ ...p, encryptedData }).runSymmetricOperation('decrypt')
    expect(p.setDecryptedData).toHaveBeenLastCalledWith('Sample message')
    p.setDecryptedData.mockClear()
    p.addLog.mockClear()
    await useSymmetricOperations({
      ...p,
      encryptedData,
      decapsulatedSecret: receiverSecret,
    }).runSymmetricOperation('decrypt')
    expect(p.setDecryptedData.mock.calls).toEqual([['']])
    expect(p.setError).toHaveBeenLastCalledWith(expect.any(String))
    expect(p.addLog).not.toHaveBeenCalled()
  })
  it('requires a recovered secret even if the sender secret is available', async () => {
    const p = props()
    await useSymmetricOperations({
      ...p,
      decapsulatedSecret: '',
      encryptedData: '00'.repeat(40),
    }).runSymmetricOperation('decrypt')
    expect(p.setError).toHaveBeenLastCalledWith(expect.stringContaining('Run Decapsulate'))
    expect(p.setDecryptedData.mock.calls).toEqual([['']])
  })
  it('rejects altered authenticated ciphertext and clears previous plaintext', async () => {
    const p = props()
    await useSymmetricOperations(p).runSymmetricOperation('encrypt')
    const original = p.setEncryptedData.mock.calls[0][0] as string
    const altered = original.slice(0, -2) + (original.endsWith('00') ? '01' : '00')
    await useSymmetricOperations({ ...p, encryptedData: altered }).runSymmetricOperation('decrypt')
    expect(p.setDecryptedData.mock.calls).toEqual([[''], ['']])
    expect(p.setError).toHaveBeenLastCalledWith(expect.any(String))
  })
})
