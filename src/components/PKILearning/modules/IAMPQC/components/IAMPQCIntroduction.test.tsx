// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { IAMPQCIntroduction } from './IAMPQCIntroduction'

function directorySection(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/iam-pqc?section=directory-services']}>
        <IAMPQCIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('IAMPQCIntroduction Kerberos section', () => {
  it('draws the reply key, TGT session key and KRBTGT key as three different keys', () => {
    const text = directorySection()
    expect(text).toMatch(/AS reply key/)
    expect(text).toMatch(/TGT session key/)
    expect(text).toMatch(/KRBTGT long-term key/)
  })

  it('scopes a recovered reply key to one client and names the extra prerequisite for a Golden Ticket', () => {
    const text = directorySection()
    expect(text).toMatch(/that\s+client.s TGT session key/i)
    expect(text).toMatch(/Golden Ticket needs the KRBTGT long-term key/i)
    expect(text).not.toMatch(/domain-wide ticket forgery/i)
  })

  it('teaches both PKINIT key-delivery variants', () => {
    const text = directorySection()
    expect(text).toMatch(/Diffie-Hellman/)
    expect(text).toMatch(/RSA\s+encryption/)
  })
})
