// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { NetworkSecurityIntroduction } from './NetworkSecurityIntroduction'

function zeroTrustText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <NetworkSecurityIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  fireEvent.click(screen.getByRole('heading', { name: /Zero Trust Network Access with PQC/ }))
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Network security introduction: zero trust', () => {
  it('does not call classical authentication a harvest-now-decrypt-later exposure', () => {
    const t = zeroTrustText()
    expect(t).not.toMatch(
      /rely on classical PKI for authentication are vulnerable to harvest-now-decrypt-later/
    )
    expect(t).toMatch(/signatures are not vulnerable to HNDL/)
  })

  it('separates the confidentiality migration from the authentication and forgery risk, each with its evidence', () => {
    const t = zeroTrustText()
    expect(t).toMatch(
      /Confidentiality \(HNDL\)\. Traffic protected by a classical key exchange can be recorded now and decrypted later/
    )
    expect(t).toMatch(/Authentication \(forgery\)\./)
    expect(t).toMatch(/Evidence: which sessions carry data that must stay secret for how long/)
    expect(t).toMatch(/Evidence: which signature algorithms, certificates and trust anchors/)
    expect(t).toMatch(/still needs lead time/)
  })
})
