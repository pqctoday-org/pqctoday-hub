// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { KeyGenerationSection } from './KeyGenerationSection'
import { getGoReference } from './goReference'
import { withEducationNoticeComment } from '@/data/educationNotice'
vi.mock('../algorithmPickerStatus', () => ({
  useAlgorithmStatusTiers: () => ({}),
  getPickerTier: () => undefined,
  PickerDraftBadge: () => null,
  PickerAdvisoryBadge: () => null,
}))
const writeText = vi.fn()
const props = {
  algorithm: 'ML-KEM',
  keySize: '768',
  loading: false,
  onAlgorithmChange: vi.fn(),
  onKeySizeChange: vi.fn(),
  onGenerateKeys: vi.fn(),
  classicalAlgorithm: 'RSA-2048',
  classicalLoading: false,
  onClassicalAlgorithmChange: vi.fn(),
  onGenerateClassicalKeys: vi.fn(),
}
describe('pinned liboqs Go reference carried through the actual pane and Copy', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  })
  it.each([
    ['ML-KEM', '512', true],
    ['ML-KEM', '768', true],
    ['ML-KEM', '1024', true],
    ['ML-DSA', '44', false],
    ['ML-DSA', '65', false],
    ['ML-DSA', '87', false],
  ] as const)(
    'copies the exact selected %s-%s program with its setup and notice',
    async (algorithm, keySize, isKEM) => {
      render(<KeyGenerationSection {...props} algorithm={algorithm} keySize={keySize} />)
      fireEvent.click(screen.getByRole('button', { name: 'Code Reference' }))
      fireEvent.click(screen.getByRole('button', { name: 'Go (liboqs-go)' }))
      const code = getGoReference(`${algorithm}-${keySize}`, isKEM)
      expect(screen.getByLabelText('Code reference source').textContent).toBe(code)
      expect(screen.getByText(/Pinned local reference: liboqs-go v0.16.0/)).toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Copy code snippet' }))
      await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
      expect(writeText).toHaveBeenCalledWith(withEducationNoticeComment(code, '//'))
      expect(code).toContain('d457f4e3d3f65fc220a98aed85725b11cd05858e')
      expect(code).toContain('5a1a854b0dc9f2141bdc771c555ee60c37950183')
      expect(code).not.toMatch(/NewKeyEncapsulation|NewSignature|, _ :=/)
      expect(code).toContain('os.Exit(1)')
      expect(code).toContain(
        isKEM
          ? 'if !bytes.Equal(sharedSecretEnc, sharedSecretDec)'
          : 'if !valid { return fmt.Errorf("signature verification returned false") }'
      )
    }
  )
  it.each(['FrodoKEM-640-AES', 'FN-DSA-512'])(
    'retains unavailable/experimental selected name %s without fallback',
    (algorithm) => {
      const code = getGoReference(algorithm, algorithm.startsWith('Frodo'))
      expect(code).toContain(`Init("${algorithm}", nil)`)
      expect(code).toContain('no replacement is made')
      expect(code).not.toMatch(/Init\("(?:ML-KEM|ML-DSA|Falcon)/)
    }
  )
  it('preserves existing CLI/Python pane contents when switching from Go', () => {
    render(<KeyGenerationSection {...props} />)
    fireEvent.click(screen.getByRole('button', { name: 'Code Reference' }))
    const cli = screen.getByLabelText('Code reference source').textContent
    fireEvent.click(screen.getByRole('button', { name: 'Python (liboqs)' }))
    const python = screen.getByLabelText('Code reference source').textContent
    fireEvent.click(screen.getByRole('button', { name: 'Go (liboqs-go)' }))
    fireEvent.click(screen.getByRole('button', { name: 'OpenSSL CLI' }))
    expect(screen.getByLabelText('Code reference source').textContent).toBe(cli)
    fireEvent.click(screen.getByRole('button', { name: 'Python (liboqs)' }))
    expect(screen.getByLabelText('Code reference source').textContent).toBe(python)
    expect(props.onGenerateKeys).not.toHaveBeenCalled()
  })
})
