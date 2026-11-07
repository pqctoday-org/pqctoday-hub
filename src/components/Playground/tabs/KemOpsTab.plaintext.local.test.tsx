// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { KemOpsTab } from './KemOpsTab'
const operation = vi.fn(),
  writeRecovered = vi.fn()
let mode: 'wasm' | 'mock' = 'wasm'
let recovered = ''
vi.mock('../contexts/SettingsContext', () => ({
  useSettingsContext: () => ({ loading: false, executionMode: mode }),
}))
vi.mock('../contexts/KeyStoreContext', () => ({
  useKeyStoreContext: () => ({
    keyStore: [],
    selectedEncKeyId: '',
    selectedDecKeyId: '',
    setSelectedEncKeyId: vi.fn(),
    setSelectedDecKeyId: vi.fn(),
  }),
}))
vi.mock('../contexts/OperationsContext', () => ({
  useOperationsContext: () => ({
    runOperation: operation,
    sharedSecret: '',
    setSharedSecret: vi.fn(),
    ciphertext: '',
    setCiphertext: vi.fn(),
    encryptedData: '',
    setEncryptedData: vi.fn(),
    decryptedData: recovered,
    setDecryptedData: writeRecovered,
    dataToEncrypt: 'Untouched input sample',
    setDataToEncrypt: vi.fn(),
    kemDecapsulationResult: null,
    decapsulatedSecret: '',
    isHybridMode: false,
    setIsHybridMode: vi.fn(),
    secondaryEncKeyId: '',
    setSecondaryEncKeyId: vi.fn(),
    secondaryDecKeyId: '',
    setSecondaryDecKeyId: vi.fn(),
    hybridMethod: 'concat-hkdf',
    setHybridMethod: vi.fn(),
    pqcSharedSecret: '',
    classicalSharedSecret: '',
    pqcRecoveredSecret: '',
    classicalRecoveredSecret: '',
  }),
}))
vi.mock('../hsm/HsmContext', () => ({ useHsmContext: () => ({}) }))
vi.mock('../../../wasm/softhsm', () => ({
  hsm_generateMLKEMKeyPair: vi.fn(),
  hsm_encapsulate: vi.fn(),
  hsm_decapsulate: vi.fn(),
  hsm_extractKeyValue: vi.fn(),
  hsm_importMLKEMPublicKey: vi.fn(),
}))
beforeEach(() => {
  operation.mockClear()
  writeRecovered.mockClear()
  recovered = ''
})
describe('KEM recovered output is the returned decoded text, not hex bytes', () => {
  it.each(['wasm', 'mock'] as const)(
    'preserves literal returned text in %s presentation without invoking operations',
    (executionMode) => {
      mode = executionMode
      recovered = 'Hello; not hex'
      const view = render(<KemOpsTab />)
      const group = screen.getByRole('group', { name: 'Recovered text (decoded output)' })
      const output = screen.getByRole('textbox', { name: 'Recovered text (decoded output)' })
      expect(output).toHaveValue('Hello; not hex')
      expect(output).toHaveAttribute('readonly')
      expect(within(group).queryByRole('button', { name: 'HEX' })).not.toBeInTheDocument()
      expect(within(group).queryByRole('button', { name: 'ASCII' })).not.toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'HEX' }).length).toBeGreaterThan(0)
      recovered = 'Café 漢字 🔐\nComplete sample text, "unaltered"'
      view.rerender(<KemOpsTab />)
      expect(output).toHaveValue(recovered)
      expect(operation).not.toHaveBeenCalled()
      expect(writeRecovered).not.toHaveBeenCalled()
    }
  )
})
