// SPDX-License-Identifier: AGPL-3.0-only
//
// Stock OpenSSL (3.6, and 4.1 — neither registers a composite algorithm) prints
// a bare OID and "Unable to load Public Key" for the two composite formats. A
// visitor who downloads the PEM and runs `openssl x509 -text` sees an error
// where the algorithm should be, and reads it as a broken certificate. The
// card must say, next to the PEM, that this is OpenSSL and not the certificate.
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const generateCompositeCert = vi.fn()
const generateCompositeKEMCert = vi.fn()

vi.mock('../services/HybridCryptoService', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/HybridCryptoService')>()),
  hybridCryptoService: {
    generateCompositeCert: (...args: unknown[]) => generateCompositeCert(...args),
    generateCompositeKEMCert: (...args: unknown[]) => generateCompositeKEMCert(...args),
  },
}))

// The mint is mocked, so the PEM is a placeholder; the verdict must not depend on it.
vi.mock('../services/compositeVerifier', () => ({
  verifyCompositeCert: vi.fn().mockResolvedValue({
    valid: true,
    recognized: true,
    errors: [],
    mldsa: { algorithm: 'ML-DSA-65', verified: true },
    classical: { algorithm: 'ECDSA P-256', verified: true },
  }),
}))

// Stable across renders, as the real hook is (see the profile picker test).
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
// After a successful mint the card pushes the PEMs into the OpenSSL Studio file
// store through `useOpenSSLStore.getState()`, so the mock needs both call forms.
vi.mock('@/components/OpenSSLStudio/store', () => {
  const state = { addFile: vi.fn(), files: [] }
  return { useOpenSSLStore: Object.assign(() => state, { getState: () => state }) }
})

import { HybridCertFormats } from './HybridCertFormats'

const PEM = '-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----'

/** The innermost card (no nested glass-panel) whose text contains `label`. */
function cardFor(container: HTMLElement, label: string): HTMLElement {
  const card = Array.from(container.querySelectorAll<HTMLElement>('.glass-panel')).find(
    (el) => el.querySelector('.glass-panel') === null && el.textContent?.includes(label)
  )
  expect(card, `card containing "${label}" not found`).toBeTruthy()
  return card!
}

function clickGenerate(card: HTMLElement) {
  fireEvent.click(within(card).getByRole('button', { name: /generate/i }))
}

describe('stock OpenSSL note on the composite cards', () => {
  beforeEach(() => {
    generateCompositeCert.mockReset()
    generateCompositeKEMCert.mockReset()
    generateCompositeCert.mockResolvedValue({ pem: PEM, parsed: 'parsed', timingMs: 1 })
    generateCompositeKEMCert.mockResolvedValue({
      certs: [
        { label: 'Workshop CA', pem: PEM, parsed: 'p', type: 'pqc', role: 'ca' },
        { label: 'Composite KEM end entity', pem: PEM, parsed: 'p', type: 'pqc', role: 'subject' },
      ],
      checks: [],
      timingMs: 1,
    })
  })

  it('shows nothing before a certificate exists', () => {
    render(<HybridCertFormats />)
    expect(screen.queryByTestId('stock-openssl-note')).toBeNull()
  })

  it('explains the OpenSSL output on the composite signature certificate', async () => {
    render(<HybridCertFormats />)
    const select = screen.getByLabelText(/Composite profile/i)
    const card = select.closest<HTMLElement>('.glass-panel')!
    clickGenerate(card)

    const note = await within(card).findByTestId('stock-openssl-note')
    expect(note.textContent).toMatch(/Stock OpenSSL cannot read this certificate/)
    expect(note.textContent).toMatch(/3\.6 and 4\.1/)
    expect(note.textContent).toMatch(/Unable to load Public Key/)
    expect(note.textContent).toMatch(/asn1parse/)
    expect(note.textContent).toMatch(/Bouncy Castle/)
    // Only the composite card carries it.
    expect(screen.getAllByTestId('stock-openssl-note')).toHaveLength(1)
  })

  it('says it is the end-entity certificate that OpenSSL cannot read on the composite KEM card', async () => {
    const { container } = render(<HybridCertFormats />)
    const card = cardFor(container, 'Composite KEM (ML-KEM-768 + X25519)')
    clickGenerate(card)

    const note = await within(card).findByTestId('stock-openssl-note')
    await waitFor(() => expect(generateCompositeKEMCert).toHaveBeenCalled())
    expect(note.textContent).toMatch(/Stock OpenSSL cannot read the end-entity certificate/)
    expect(note.textContent).toMatch(/Bouncy Castle/)
    expect(note.textContent).toMatch(/asn1parse/)
  })
})
