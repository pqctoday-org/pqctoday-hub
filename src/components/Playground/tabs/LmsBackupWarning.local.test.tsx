// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SignVerifyTab } from './SignVerifyTab'
import { KeyStoreTab } from './KeyStoreTab'
import type { Key } from '@/types'

const state = vi.hoisted(() => ({
  keys: [] as Key[],
  selectedSignKeyId: '',
  runOperation: vi.fn(),
  backupAllKeys: vi.fn(async () => undefined),
  restoreKeys: vi.fn(async () => undefined),
}))
vi.mock('../contexts/SettingsContext', () => ({
  useSettingsContext: () => ({
    algorithm: 'LMS-SHA256-H10',
    keySize: '1024',
    loading: false,
    setAlgorithm: vi.fn(),
    setKeySize: vi.fn(),
    handleAlgorithmChange: vi.fn(),
    classicalAlgorithm: 'RSA-2048',
    setClassicalAlgorithm: vi.fn(),
  }),
}))
vi.mock('../contexts/KeyStoreContext', () => ({
  useKeyStoreContext: () => ({
    keyStore: state.keys,
    selectedSignKeyId: state.selectedSignKeyId,
    setSelectedSignKeyId: vi.fn(),
    selectedVerifyKeyId: '',
    setSelectedVerifyKeyId: vi.fn(),
    generateKeys: vi.fn(async () => undefined),
    classicalLoading: false,
    generateClassicalKeys: vi.fn(async () => undefined),
    clearKeys: vi.fn(),
    backupAllKeys: state.backupAllKeys,
    restoreKeys: state.restoreKeys,
  }),
}))
vi.mock('../contexts/OperationsContext', () => ({
  useOperationsContext: () => ({
    runOperation: state.runOperation,
    signature: '',
    setSignature: vi.fn(),
    dataToSign: 'Fictional warning-only sample',
    setDataToSign: vi.fn(),
    dataToSignBytes: undefined,
    setDataToSignBytes: vi.fn(),
    verificationResult: null,
    setVerificationResult: vi.fn(),
  }),
}))
vi.mock('@/utils/analytics', () => ({ logEvent: vi.fn() }))
// Keep the real KeyStoreView header, backup controls and import input. These unrelated
// children are isolated; none supplies or replaces the warnings under test.
vi.mock('../keystore/KeyGenerationSection', () => ({ KeyGenerationSection: () => null }))
vi.mock('../keystore/KeyTable', () => ({ KeyTable: () => null }))
vi.mock('../keystore/KeyDetails', () => ({ KeyDetails: () => null }))

function sampleKey(id: string, algorithm: string): Key {
  return {
    id,
    name: `${algorithm} fictional metadata fixture`,
    type: 'private',
    algorithm,
    value: '00',
    data: new Uint8Array([0]),
    dataType: 'binary',
    timestamp: 0,
  }
}
const lms = sampleKey('lms-example', 'LMS-SHA256-H10')
const dsa = sampleKey('dsa-example', 'ML-DSA-65')
beforeEach(() => {
  vi.clearAllMocks()
  state.keys = []
  state.selectedSignKeyId = ''
})

function expectNoSensitiveOperation() {
  expect(state.runOperation).not.toHaveBeenCalled()
  expect(state.backupAllKeys).not.toHaveBeenCalled()
  expect(state.restoreKeys).not.toHaveBeenCalled()
}

describe('owner-selected LMS rollback risk explanation', () => {
  it('warns at the selected LMS signing context without claiming protected backup or recovery', () => {
    state.keys = [lms, dsa]
    state.selectedSignKeyId = lms.id
    render(<SignVerifyTab />)
    const title = screen.getByText('Stateful signature — key updates after each sign')
    const warning = title.parentElement
    expect(warning).toHaveTextContent('LMS uses one-time signing leaves')
    expect(warning).toHaveTextContent('Reusing a leaf can break security')
    expect(warning).toHaveTextContent('saved or backup representations can lag')
    expect(warning).toHaveTextContent(
      'does not guarantee current-state backup, rollback prevention or safe recovery'
    )
    expect(warning).toHaveTextContent(
      'atomic state updates, exclusive signing and recovery controls'
    )
    expect(warning).toHaveTextContent(
      'an older backup alone cannot establish which leaves were used afterward'
    )
    expect(screen.getByRole('button', { name: 'Sign Message' })).toBeInTheDocument()
    expectNoSensitiveOperation()
  })

  it('does not attach the LMS signing warning to a selected stateless key, even when LMS is stored', () => {
    state.keys = [lms, dsa]
    state.selectedSignKeyId = dsa.id
    render(<SignVerifyTab />)
    expect(
      screen.queryByText('Stateful signature — key updates after each sign')
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Message' })).toBeInTheDocument()
    expectNoSensitiveOperation()
  })

  it('warns when an LMS key is present beside the actual backup and import controls', () => {
    state.keys = [lms]
    render(<KeyStoreTab />)
    const warning = screen.getByText(/LMS sample backup limitation:/)
    expect(warning).toHaveTextContent('saved key state may be stale')
    expect(warning).toHaveTextContent('Restoring an old state can reuse a one-time signing leaf')
    expect(warning).toHaveTextContent('does not prevent rollback or guarantee safe recovery')
    expect(warning).toHaveTextContent('evaluate those capabilities in your production tools')
    expect(screen.getByRole('button', { name: 'Backup All' })).toHaveAttribute(
      'title',
      'Backup all keys to ZIP'
    )
    expect(screen.getByRole('button', { name: 'Import ZIP' })).toBeInTheDocument()
    expectNoSensitiveOperation()
  })

  it('does not show an LMS-specific backup warning for stateless-only sample keys', () => {
    state.keys = [dsa]
    render(<KeyStoreTab />)
    expect(screen.queryByText(/LMS sample backup limitation:/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Backup All' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import ZIP' })).toBeInTheDocument()
    expectNoSensitiveOperation()
  })
})
