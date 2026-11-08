// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SigstoreFlow } from './SigstoreFlow'

const flat = (el: HTMLElement) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('Sigstore verification walkthrough', () => {
  it('teaches expected identity and issuer, trust-root distribution and timestamp validity', () => {
    const { container } = render(<SigstoreFlow />)
    fireEvent.click(screen.getByRole('button', { name: /^Step 7:/ }))
    const t = flat(container)
    expect(t).not.toMatch(/No public keys need to be distributed/)
    expect(t).toMatch(/identity and OIDC issuer match the identity and issuer the verifier expects/)
    expect(t).toMatch(/--certificate-identity/)
    expect(t).toMatch(/--certificate-oidc-issuer/)
    expect(t).toMatch(/trust root that verifiers must obtain and keep current/)
    expect(t).toMatch(/inclusion proof and a signed timestamp/)
    expect(t).toMatch(/does not remove trust-root distribution or the need for an identity policy/)
  })

  it('does not call a Fulcio and Rekor upgrade a complete migration', () => {
    const { container } = render(<SigstoreFlow />)
    const t = flat(container)
    expect(t).not.toMatch(/Only Fulcio \(CA\) and Rekor \(log\) need to upgrade/)
    expect(t).not.toMatch(/zero configuration changes needed/)
    expect(t).toMatch(/Migration is still not automatic/)
    expect(t).toMatch(
      /verifiers must support it and obtain updated trust roots and an identity policy/
    )
  })

  it('gives the short-lived certificate validity as 10 minutes in the step detail', () => {
    render(<SigstoreFlow />)
    fireEvent.click(screen.getByRole('button', { name: /^Step 3:/ }))
    const detail = screen.getByText(/Fulcio issues a certificate binding the OIDC identity/)
    expect(detail.textContent).toMatch(/valid for 10 minutes/)
    expect(detail.textContent).not.toMatch(/20 min/)
  })
})
