// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExecutionLog } from './ExecutionLog'
import { COMMAND_DEFS } from './tpmCommandDefs'
import { readField, readVariablePreview } from './tpmWireDecode'
import captures from './__fixtures__/response-captures.json'
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
  screen
    .getAllByRole('row')
    .filter((row) => within(row).queryByRole('cell', { name }))
    .at(-1)!
const unresolved = 'Not decoded — response structure could not be read safely.'

describe('TPM response display uses received field boundaries', () => {
  it('does not read the response tag as a ciphertext size or payload preview', () => {
    show()
    expect(
      within(rowFor('tag')).getByText('0x8001 (TPM_ST_NO_SESSIONS)', { exact: true })
    ).toBeInTheDocument()
    expect(within(rowFor('ciphertext.size')).getByText('0x0440')).toBeInTheDocument()
    expect(within(rowFor('ciphertext.buffer')).getByText(/^1088 B · CD CD/)).toBeInTheDocument()
    expect(
      within(rowFor('sharedSecret.size')).getByText(readField(sample(), 10, 2))
    ).toBeInTheDocument()
    expect(
      within(rowFor('sharedSecret.buffer')).getByText(`32 B · ${readVariablePreview(sample(), 12)}`)
    ).toBeInTheDocument()
    expect(screen.getByText('TPM_RC_SUCCESS')).toBeInTheDocument()
  })

  const definitions = COMMAND_DEFS.filter((def) =>
    def.respFields('ML-KEM-768').some((field) => field.byteOffset === 0 && field.name !== 'tag')
  )
  it.each(definitions)(
    'decodes the advertised $key fields or preserves a non-wire informational note',
    (def) => {
      const isNote = def.key.includes('LabeledKEM')
      // NV_Certify has the same outer TPM2B_ATTEST+TPMT_SIGNATURE layout as Certify.
      // This alias uses a controlled body, not a claim of fresh NV_Certify execution.
      const capturedName = def.key === 'TPM2_NV_Certify' ? 'TPM2_Certify' : def.key
      const fixture = captures.records.find((r) => r.name === capturedName && r.rc === 0)
      const response = fixture ? Uint8Array.from(Buffer.from(fixture.response, 'hex')) : sample()
      show(def.key, response)
      for (const field of def
        .respFields('ML-KEM-768')
        .filter((f) => f.byteOffset === 0 && f.name !== 'tag')) {
        const row = within(rowFor(field.name))
        if (isNote)
          expect(row.getByText('Informational note — no decoded value')).toBeInTheDocument()
        else {
          expect(fixture).toBeDefined()
          expect(row.queryByText(/Not decoded|Not present|Not parsed/)).not.toBeInTheDocument()
        }
        expect(row.getByText(field.description)).toBeInTheDocument()
      }
    }
  )

  it('does not interpret the existing hybrid textual summary as a TPM response header', () => {
    show(
      'TPM2_LabeledKEM_Hybrid_Encap',
      new TextEncoder().encode('Hybrid Labeled-KEM Encap OK (educational, not TCG v1.85)')
    )
    expect(screen.getByText('Informational note — no decoded value')).toBeInTheDocument()
    expect(screen.queryByText('TPM_RC_SUCCESS')).not.toBeInTheDocument()
    expect(screen.queryByText(/RC =/)).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

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
