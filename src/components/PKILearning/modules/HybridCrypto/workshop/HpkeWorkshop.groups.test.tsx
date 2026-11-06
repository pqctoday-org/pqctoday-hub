// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The HPKE workshop shows three labelled groups, and never presents the
 * PQCToday single-call mechanism as a v3.3 item:
 *  - "Before 3.3": PKCS#11 v3.2, the standard pieces;
 *  - "Not part of any standard": the PQCToday CKM_HPKE proposal;
 *  - "After 3.3": the v3.3 working draft's CKM_COMP_KEM.
 * The v3.3 draft has no HPKE mechanism, so no label may suggest it does.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  // no WebAssembly engine in the unit tier
  getSoftHSMRustModule: vi.fn().mockRejectedValue(new Error('no engine in tests')),
}))

import { HpkeWorkshop } from './HpkeWorkshop'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('HPKE workshop: three groups, before 3.3 / no standard / after 3.3', () => {
  it('captions the three groups and labels each button by what it is', () => {
    render(<HpkeWorkshop />)
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain('Before 3.3 (standard, today)')
    expect(text).toContain('Not part of any standard')
    expect(text).toContain('After 3.3 (working draft)')
    expect(
      screen.getByRole('button', { name: /PKCS#11 v3\.2 \(composed from standard pieces\)/ })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /PQCToday proposal — CKM_HPKE/ })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /PKCS#11 v3\.3 draft — CKM_COMP_KEM/ })
    ).toBeInTheDocument()
  })

  it('does not present the single-call mechanism as a vNext or v3.3 item', () => {
    render(<HpkeWorkshop />)
    expect(flat(document.body.textContent ?? '')).not.toMatch(/vNext/i)
    fireEvent.click(screen.getByRole('button', { name: /PQCToday proposal — CKM_HPKE/ }))
    const text = flat(document.body.textContent ?? '')
    expect(text).toContain('part of no standard')
    expect(text).toContain('Neither PKCS#11 v3.2 nor the v3.3 draft has an HPKE mechanism')
    expect(screen.getByRole('link', { name: 'open request' })).toHaveAttribute(
      'href',
      'https://github.com/oasis-tcs/pkcs11/issues/121'
    )
  })

  it('says plainly that the composite KEM is not HPKE', () => {
    render(<HpkeWorkshop />)
    expect(flat(document.body.textContent ?? '')).toContain('the v3.3 draft has none either')
  })

  it('explains why SHAKE256 is missing outside the single-call group', () => {
    render(<HpkeWorkshop />)
    expect(flat(document.body.textContent ?? '')).toContain(
      'The SHAKE256 key derivation (draft-ietf-hpke-pq) is offered only in the PQCToday proposal sequence'
    )
  })
})
