// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExecutionLog } from './ExecutionLog'
import { COMMAND_DEFS } from './tpmCommandDefs'
import { readField, readVariablePreview } from './tpmWireDecode'
import { toHex } from '../../../wasm/tpmSerializer'

vi.mock('../learnkit/Term', () => ({
  Term: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Controlled display fixture, not a captured engine result or protocol validation.
const sample = (rc = 0) => {
  const bytes = new Uint8Array(10 + 2 + 32 + 2 + 1088)
  const view = new DataView(bytes.buffer)
  view.setUint16(0, 0x8001)
  view.setUint32(2, bytes.length)
  view.setUint32(6, rc)
  view.setUint16(10, 32)
  bytes.fill(0xab, 12, 44)
  view.setUint16(44, 1088)
  bytes.fill(0xcd, 46)
  return bytes
}
const show = (
  commandType = 'TPM2_Encapsulate',
  response: Uint8Array | null = sample(),
  error?: string
) =>
  render(
    <ExecutionLog
      logs={[{ commandType, algorithm: 'ML-KEM-768', request: sample(), response, error }]}
    />
  )
const rowFor = (name: string) =>
  screen.getAllByText(name, { selector: 'td' }).at(-1)!.closest('tr')!
const unresolved = 'Not parsed — payload offset is not resolved in this view.'

describe('TPM response fields with unresolved payload locations', () => {
  it('does not read the response tag as a ciphertext size or payload preview', () => {
    show()
    expect(
      within(rowFor('tag')).getByText('0x8001 (TPM_ST_NO_SESSIONS)', { exact: true })
    ).toBeInTheDocument()
    for (const name of ['ciphertext.size', 'ciphertext.buffer']) {
      const row = within(rowFor(name))
      expect(row.getByText(unresolved)).toBeInTheDocument()
      expect(row.queryByText(/0x8001|32769|80 01/)).not.toBeInTheDocument()
    }
    expect(
      within(rowFor('sharedSecret.size')).getByText(readField(sample(), 10, 2))
    ).toBeInTheDocument()
    expect(
      within(rowFor('sharedSecret.buffer')).getByText(readVariablePreview(sample(), 12))
    ).toBeInTheDocument()
    expect(screen.getByText('TPM_RC_SUCCESS')).toBeInTheDocument()
  })

  const definitions = COMMAND_DEFS.filter((def) =>
    def.respFields('ML-KEM-768').some((field) => field.byteOffset === 0 && field.name !== 'tag')
  )
  it.each(definitions)(
    'qualifies every unresolved row of $key and preserves its description',
    (def) => {
      show(def.key)
      for (const field of def
        .respFields('ML-KEM-768')
        .filter((field) => field.byteOffset === 0 && field.name !== 'tag')) {
        const row = within(rowFor(field.name))
        expect(
          row.getByText(
            field.name === 'note' && field.tpmType === '—'
              ? 'Informational note — no decoded value'
              : unresolved
          )
        ).toBeInTheDocument()
        expect(row.getByText(field.description)).toBeInTheDocument()
      }
    }
  )

  it('keeps raw response and request Copy bytes unchanged', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    show()
    const panels = screen.getAllByRole('button', { name: /raw bytes/i })
    expect(panels).toHaveLength(2)
    for (const panel of panels) fireEvent.click(panel)
    expect(screen.getAllByText(toHex(sample()), { selector: 'pre' })).toHaveLength(2)
    for (const button of screen.getAllByTitle('Copy hex')) fireEvent.click(button)
    expect(writeText.mock.calls).toEqual([[toHex(sample())], [toHex(sample())]])
  })

  it('preserves error response and operational error displays', () => {
    show('TPM2_Encapsulate', sample(0x101), 'Controlled operation error')
    expect(screen.getByText('TPM_RC_FAILURE')).toBeInTheDocument()
    expect(screen.getByText(/Controlled operation error/)).toBeInTheDocument()
    expect(screen.queryByText(unresolved)).not.toBeInTheDocument()
  })
  it('preserves awaiting response and empty-log states', () => {
    const view = show('TPM2_Encapsulate', null)
    expect(screen.getByText('Awaiting response…')).toBeInTheDocument()
    view.rerender(<ExecutionLog logs={[]} />)
    expect(screen.getByText('No command executed yet.')).toBeInTheDocument()
  })
})
