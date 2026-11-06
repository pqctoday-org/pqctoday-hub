// SPDX-License-Identifier: AGPL-3.0-only
//
// The composite certificate screen offers both signing ways and mints with the
// one that is selected:
//   before 3.3  generateCompositeCert        (M' built in the browser, two HSM signs)
//   after 3.3   generateCompositeCertOneCall (one combined key, one CKM_COMP_SIG call)
// As in the profile-picker test, the assertion is on WHICH service method
// receives the call and with WHICH profile: rendered text stayed correct in
// the bug that file guards against while the behaviour was wrong.
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const byHand = vi.fn()
const oneCall = vi.fn()

vi.mock('../services/HybridCryptoService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/HybridCryptoService')>()),
  hybridCryptoService: {
    generateCompositeCert: (...args: unknown[]) => byHand(...args),
    generateCompositeCertOneCall: (...args: unknown[]) => oneCall(...args),
  },
}))

// Stable across renders, like the real hook (see HybridCertFormats.profilePicker.test.tsx).
const HSM_STUB = {
  isReady: true,
  moduleRef: { current: {} as unknown },
  hSessionRef: { current: 1 },
  log: [],
  clearLog: vi.fn(),
  keys: [],
  addKey: vi.fn(),
  removeKey: vi.fn(),
}
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => HSM_STUB }))
vi.mock('@/components/OpenSSLStudio/store', () => ({
  useOpenSSLStore: () => ({ addFiles: vi.fn(), files: [] }),
}))

import { HybridCertFormats } from './HybridCertFormats'
import { COMPOSITE_PROFILE_CHOICES } from '../services/certBuilder'

const OK = {
  pem: '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----',
  parsed: 'parsed',
  timingMs: 1,
}

const generateComposite = () => {
  const select = screen.getByLabelText(/Composite profile/i)
  const card = select.closest('div[class*="space-y"]')?.parentElement
  const button = Array.from(card?.querySelectorAll('button') ?? []).find((b) =>
    /generate/i.test(b.textContent ?? '')
  )
  expect(button, 'composite Generate button not found').toBeTruthy()
  fireEvent.click(button!)
}

describe('composite certificate: before 3.3 and after 3.3 signing', () => {
  beforeEach(() => {
    byHand.mockReset().mockResolvedValue(OK)
    oneCall.mockReset().mockResolvedValue(OK)
  })

  it('labels the two ways by era', () => {
    render(<HybridCertFormats />)
    const text = (document.body.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toContain('Before 3.3 (standard, today)')
    expect(text).toContain('After 3.3 (working draft)')
    expect(screen.getByRole('button', { name: /Two HSM signs/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /One CKM_COMP_SIG call/ })).toBeInTheDocument()
  })

  it('mints the by-hand way by default', async () => {
    render(<HybridCertFormats />)
    generateComposite()
    await waitFor(() => expect(byHand).toHaveBeenCalled())
    expect(oneCall).not.toHaveBeenCalled()
  })

  it.each(
    COMPOSITE_PROFILE_CHOICES.slice(0, 3).map((c) => [c.profile.label, c.profile.compositeOid])
  )(
    'the one-call way receives the selected profile (%s) and the by-hand way is not used',
    async (_label, oid) => {
      render(<HybridCertFormats />)
      fireEvent.change(screen.getByLabelText(/Composite profile/i), { target: { value: oid } })
      fireEvent.click(screen.getByRole('button', { name: /One CKM_COMP_SIG call/ }))
      generateComposite()
      await waitFor(() => expect(oneCall).toHaveBeenCalled())
      expect(byHand).not.toHaveBeenCalled()
      expect((oneCall.mock.calls[0][4] as { compositeOid: string }).compositeOid).toBe(oid)
    }
  )

  it('shows the engine refusal as an error, never as a silent fallback to the by-hand way', async () => {
    oneCall.mockResolvedValue({
      pem: '',
      parsed: '',
      timingMs: 1,
      error: 'Composite key generation (one combined key): Not in this engine yet: CKP_COMP_SIG_X',
    })
    render(<HybridCertFormats />)
    fireEvent.click(screen.getByRole('button', { name: /One CKM_COMP_SIG call/ }))
    generateComposite()
    await waitFor(() => expect(oneCall).toHaveBeenCalled())
    await waitFor(() => expect(document.body.textContent).toContain('Not in this engine yet'))
    expect(byHand).not.toHaveBeenCalled()
  })
})
