// SPDX-License-Identifier: AGPL-3.0-only
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { CodeSigningIntroduction } from './CodeSigningIntroduction'

const text = () => {
  const { container } = render(
    <MemoryRouter>
      <CodeSigningIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Code signing introduction keeps each threat and date in its own category', () => {
  it('scopes the CNSA 2.0 signing dates to software and firmware signing', () => {
    const t = text()
    expect(t).toMatch(/Software and firmware signing: exclusively use CNSA 2\.0/)
    expect(t).not.toMatch(/All deployed NSS must use CNSA 2\.0 signatures/)
    expect(t).not.toMatch(/Full quantum-resistant enforcement/)
    expect(t).not.toMatch(/2033.{0,3}35/)
    // General dates are given separately, labelled as not specific to signing.
    expect(t).toMatch(/not specific to signing/)
    expect(t).toMatch(/31 December 2031/)
  })

  it('calls signature forgery a future-forgery risk and reserves HNDL for encrypted data', () => {
    const t = text()
    expect(t).not.toMatch(/HNDL Applied to Signed Artifacts/)
    expect(t).not.toMatch(/adversaries collect signed artifacts/)
    expect(t).not.toMatch(/harvests firmware update signatures/)
    expect(t).toMatch(/future signature forgery/)
    expect(t).toMatch(/reserved for encrypted data/)
  })

  it('separates publisher leaf keys from issuing CA keys and does not claim all keys fall at once', () => {
    const t = text()
    expect(t).not.toMatch(/stolen intermediate key \(scoped to one publisher\)/)
    expect(t).not.toMatch(/every publisher simultaneously/)
    expect(t).not.toMatch(/derive any publisher.s private key/)
    expect(t).toMatch(/issuing CA key is scoped to everything the CA issues/)
    expect(t).toMatch(/does not mean one event recovers all private keys/)
    expect(t).toMatch(/build-system or identity compromise as well as key theft/)
  })

  it('does not say upgrading Fulcio and Rekor migrates downstream signatures automatically', () => {
    const t = text()
    expect(t).not.toMatch(/automatically provides PQC protection/)
    expect(t).not.toMatch(/only the Sigstore infrastructure needs to upgrade/)
    expect(t).toMatch(/signing clients/)
    expect(t).toMatch(/verifiers/)
    expect(t).toMatch(/Upgrading Fulcio and Rekor does not change signatures already made/)
  })
})
