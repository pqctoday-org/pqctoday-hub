// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DirectoryServicesAnalyzer } from './DirectoryServicesAnalyzer'

function openScenarios(tab: string): string {
  render(<DirectoryServicesAnalyzer />)
  fireEvent.click(screen.getByRole('button', { name: tab }))
  fireEvent.click(screen.getByRole('button', { name: 'Show Scenarios' }))
  return document.body.textContent ?? ''
}

function scenarioCard(title: string): string {
  const heading = screen.getByText(title)
  return heading.closest('div.space-y-3')?.textContent ?? ''
}

describe('DirectoryServicesAnalyzer scenarios', () => {
  it('teaches LDAP simple bind as a DN plus an unencoded password, not as Base64 user:pass', () => {
    openScenarios('OpenLDAP')
    const card = scenarioCard('Simple Bind Credential Exposure')
    // the bind carries a DN and a password value
    expect(card).toMatch(/distinguished name/i)
    expect(card).toMatch(/password/i)
    // no encoding hides it, and without TLS it is readable
    expect(card).toMatch(/readable on the network|Nothing encodes/i)
    // Base64 belongs to HTTP Basic and is not protection
    expect(card).toMatch(/HTTP Basic/)
    expect(card).toMatch(/not protection/i)
    expect(card).not.toMatch(/Base64-encoded username:password/)
  })

  it('does not tell learners a recovered PKINIT reply key gives domain compromise', () => {
    openScenarios('Active Directory')
    const card = scenarioCard('PKINIT RSA Decryption Attack')
    expect(card).toMatch(/Diffie-Hellman/)
    expect(card).toMatch(/RSA/)
    expect(card).toMatch(/one client/i)
    expect(card).toMatch(/KRBTGT/)
    expect(card).not.toMatch(/without any credentials/i)
    expect(card).not.toMatch(/full domain compromise/i)
  })

  it('treats the Golden Ticket as key theft, with no quantum decryption step added to a stolen key', () => {
    openScenarios('Active Directory')
    const card = scenarioCard('Golden Ticket via KRBTGT Key Theft')
    expect(card).toMatch(/classical/i)
    expect(card).toMatch(/adds no step|no step/i)
    expect(card).not.toMatch(/quantum-decrypted/i)
  })

  it('does not offer Continuous Access Evaluation as a defence against forged tokens', () => {
    openScenarios('Azure AD / Entra ID')
    const card = scenarioCard('JWT Token Forgery via RSA Key Recovery')
    const caeSentence = card.split(/(?<=\.)\s/).find((s) => /Continuous Access Evaluation/.test(s))
    expect(caeSentence).toBeDefined()
    expect(caeSentence).toMatch(/not a (signature check|defence)|not a defence/i)
  })
})
