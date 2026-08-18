// SPDX-License-Identifier: GPL-3.0-only
//
// Guards that the composite profile picker actually changes what gets minted.
//
// This exists because of a bug caught during review on 2026-08-18: the picker
// was added and read correctly for DISPLAY, but generateFormat is a useCallback
// and the selected profile was captured in its closure without being listed as
// a dependency. The dropdown moved, the description text under it moved, the
// result label moved — and the certificate was still id-MLDSA65-ECDSA-P256-SHA512
// every time. Nothing about the UI looked wrong.
//
// So the assertion here is deliberately on the ARGUMENT the service receives,
// not on anything rendered: rendered text was exactly what stayed correct while
// the behaviour was broken.
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateCompositeCert = vi.fn()

vi.mock('../services/HybridCryptoService', () => ({
  hybridCryptoService: {
    generateCompositeCert: (...args: unknown[]) => generateCompositeCert(...args),
  },
}))

// The mocked hook MUST return a stable object across renders, exactly as the
// real one does. Returning a fresh literal each call changes `hsm`'s identity
// every render, which makes every useCallback that depends on it rebuild
// unconditionally — and that silently masks missing-dependency bugs, including
// the precise one this file was written to catch. Verified by removing
// `compositeOid` from generateFormat's dependency array: with a fresh object
// the tests still passed (useless), with this stable one they fail (correct).
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

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => HSM_STUB,
}))

vi.mock('@/components/OpenSSLStudio/store', () => ({
  useOpenSSLStore: () => ({ addFiles: vi.fn(), files: [] }),
}))

import { HybridCertFormats } from './HybridCertFormats'
import { COMPOSITE_PROFILE_CHOICES } from '../services/certBuilder'

describe('composite profile picker', () => {
  beforeEach(() => {
    generateCompositeCert.mockReset()
    generateCompositeCert.mockResolvedValue({
      pem: '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----',
      parsed: 'parsed',
      timingMs: 1,
    })
  })

  it('offers every implemented profile', () => {
    render(<HybridCertFormats />)
    const select = screen.getByLabelText(/Composite profile/i) as HTMLSelectElement
    const values = Array.from(select.options).map((o) => o.value)
    expect(values).toEqual(COMPOSITE_PROFILE_CHOICES.map((c) => c.profile.compositeOid))
  })

  it('defaults to the §10.4 general-use profile', () => {
    render(<HybridCertFormats />)
    const select = screen.getByLabelText(/Composite profile/i) as HTMLSelectElement
    expect(select.value).toBe('1.3.6.1.5.5.7.6.45')
  })

  it.each(COMPOSITE_PROFILE_CHOICES.map((c) => [c.profile.label, c.profile.compositeOid]))(
    'mints %s when selected — not the default',
    async (label, oid) => {
      render(<HybridCertFormats />)
      const select = screen.getByLabelText(/Composite profile/i)
      fireEvent.change(select, { target: { value: oid } })

      // The Generate button inside the composite card.
      const compositeCard = select.closest('div[class*="space-y"]')?.parentElement
      const button = Array.from(compositeCard?.querySelectorAll('button') ?? []).find((b) =>
        /generate/i.test(b.textContent ?? '')
      )
      expect(button, 'composite Generate button not found').toBeTruthy()
      fireEvent.click(button!)

      await waitFor(() => expect(generateCompositeCert).toHaveBeenCalled())

      // 5th argument is the profile. THIS is the assertion the stale closure
      // defeated — everything rendered was already correct.
      const profileArg = generateCompositeCert.mock.calls[0][4] as
        | { compositeOid: string }
        | undefined
      expect(profileArg?.compositeOid, `${label}: wrong profile reached the service`).toBe(oid)
    }
  )
})
