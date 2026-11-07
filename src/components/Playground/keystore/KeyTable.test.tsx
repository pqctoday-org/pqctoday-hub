// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KeyTable } from './KeyTable'
import { KeyStoreView } from '../KeyStoreView'

describe('KeyTable with no keys', () => {
  it('points to the key-generation controls and not to a Settings page', () => {
    render(<KeyTable keyStore={[]} selectedKeyId={null} setSelectedKeyId={vi.fn()} />)
    // Desktop table and phone cards each render the empty state.
    const messages = screen.getAllByText(/No keys generated yet\./)
    expect(messages.length).toBeGreaterThan(0)
    for (const message of messages) {
      expect(message).toHaveTextContent('Generate New Keys')
      expect(message).not.toHaveTextContent(/Settings/)
    }
  })

  it('names a control that the Key Store tab shows above the empty table', () => {
    render(
      <KeyStoreView
        keyStore={[]}
        algorithm="ML-KEM-768"
        keySize="768"
        loading={false}
        onAlgorithmChange={vi.fn()}
        onKeySizeChange={vi.fn()}
        onGenerateKeys={vi.fn()}
        classicalAlgorithm="RSA"
        classicalLoading={false}
        onClassicalAlgorithmChange={vi.fn()}
        onGenerateClassicalKeys={vi.fn()}
        onClearKeys={vi.fn()}
        onBackupAllKeys={vi.fn()}
        onRestoreKeys={vi.fn()}
      />
    )
    const generate = screen.getByRole('heading', { name: 'Generate New Keys' })
    const message = screen.getAllByText(/No keys generated yet\./)[0]
    expect(generate).toBeInTheDocument()
    // "Above": the generation heading comes before the empty message in the page.
    expect(
      generate.compareDocumentPosition(message) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
