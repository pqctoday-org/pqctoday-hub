// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test for the Command Builder result-chaining fix (see
// tpm-playground-audit-pkcs11-cacp-parity-gap-report-07232026.md /
// tpm-playground-remediation-plan-07232026.md, Phase 0 item 1). Before this
// fix, TPM2_Decapsulate was always sendable and always serialized a
// synthetic 0xCC-byte ciphertext, regardless of whether a real
// TPM2_Encapsulate had ever run — silently producing a "successful" but
// meaningless shared secret (ML-KEM's implicit rejection means a bogus
// ciphertext still returns TPM_RC_SUCCESS). This drives the actual
// component end-to-end: Decapsulate must be disabled with an explanatory
// notice until Encapsulate has been run with a matching algorithm, and must
// use the real captured ciphertext once it has.
//
// Venue: `*.local.test.ts` per the 2026-07-01 new-test-suite convention
// (vite.config.ts) — local gate only, not CI.
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { CommandBuilder } from './CommandBuilder'
import type { TpmObjectEntry } from './TpmPlayground'

const executeTpmCommand = vi.fn()
vi.mock('../../../wasm/tpmBridge', () => ({
  executeTpmCommand: (cmd: Uint8Array) => executeTpmCommand(cmd),
}))

/** A minimal, well-formed TPM2_Encapsulate NO_SESSIONS success response. */
function buildEncapResponse(ciphertext: Uint8Array): Uint8Array {
  const ssSize = 32
  const ss = new Uint8Array(ssSize).fill(0x11)
  const ctSize = ciphertext.length
  const total = 10 + 2 + ssSize + 2 + ctSize
  const buf = new Uint8Array(total)
  const dv = new DataView(buf.buffer)
  dv.setUint16(0, 0x8001, false) // TPM_ST_NO_SESSIONS
  dv.setUint32(2, total, false)
  dv.setUint32(6, 0, false) // rc = TPM_RC_SUCCESS
  dv.setUint16(10, ssSize, false)
  buf.set(ss, 12)
  dv.setUint16(12 + ssSize, ctSize, false)
  buf.set(ciphertext, 12 + ssSize + 2)
  return buf
}

const KEM_OBJECT: TpmObjectEntry = {
  handle: '0x81010060',
  description: 'PQC Endorsement Key (EK)',
  algorithm: 'MLKEM-768',
}

describe('CommandBuilder — Decapsulate result chaining', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('disables Send and shows the prerequisite notice before Encapsulate has run', async () => {
    render(
      <CommandBuilder
        disabled={false}
        onLogUpdate={vi.fn()}
        onObjectUpdate={vi.fn()}
        objects={[KEM_OBJECT]}
      />
    )

    fireEvent.change(screen.getByLabelText('Command'), { target: { value: 'TPM2_Decapsulate' } })

    const sendButton = await screen.findByRole('button', { name: /Send TPM2_Decapsulate/ })
    expect(sendButton).toBeDisabled()
    expect(screen.getByText(/Run TPM2_Encapsulate with this algorithm first/)).toBeInTheDocument()
  })

  it('enables Send and chains the real ciphertext once Encapsulate has run', async () => {
    const ciphertext = new Uint8Array(1088).fill(0xaa)
    executeTpmCommand.mockResolvedValueOnce(buildEncapResponse(ciphertext))

    render(
      <CommandBuilder
        disabled={false}
        onLogUpdate={vi.fn()}
        onObjectUpdate={vi.fn()}
        objects={[KEM_OBJECT]}
      />
    )

    // Run TPM2_Encapsulate first.
    fireEvent.change(screen.getByLabelText('Command'), { target: { value: 'TPM2_Encapsulate' } })
    fireEvent.click(await screen.findByRole('button', { name: /Send TPM2_Encapsulate/ }))
    await waitFor(() => expect(executeTpmCommand).toHaveBeenCalledTimes(1))

    // Switch to Decapsulate — should now be enabled and using the chained result.
    fireEvent.change(screen.getByLabelText('Command'), { target: { value: 'TPM2_Decapsulate' } })
    const sendButton = await screen.findByRole('button', { name: /Send TPM2_Decapsulate/ })
    await waitFor(() => expect(sendButton).not.toBeDisabled())
    expect(
      screen.getByText(/Using the real result captured from the prerequisite command above/)
    ).toBeInTheDocument()

    // The rendered hex preview must contain the real chained ciphertext
    // bytes (0xAA), not the old 0xCC placeholder run.
    const hexPreview = screen.getByText(/AA AA/i)
    expect(hexPreview).toBeInTheDocument()
  })
})
