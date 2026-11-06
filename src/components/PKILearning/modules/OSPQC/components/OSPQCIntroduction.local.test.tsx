// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { OSPQCIntroduction } from './OSPQCIntroduction'
import summary from '../curious-summary.md?raw'

function introText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/os-pqc']}>
        <OSPQCIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  // The learn sections are accordions; open every one so the text is in the DOM.
  for (const btn of Array.from(document.querySelectorAll('button[aria-expanded="false"]'))) {
    fireEvent.click(btn)
  }
  return document.body.textContent ?? ''
}

describe('OSPQC introduction keeps SSH session privacy and server authentication apart', () => {
  it('does not present replacing the host key as a harvest-now-decrypt-later control', () => {
    const text = introText()
    expect(text).not.toMatch(
      /could authenticate as your server in the future once they\s+break the host key/
    )
    expect(text).not.toMatch(/prime target for\s*Harvest Now, Decrypt Later/)
    expect(text).not.toMatch(/ssh-mldsa65\s*eliminates this risk/)
    expect(text).toMatch(/replacing it is not an HNDL control/)
    expect(text).toMatch(/addresses that second exposure only/)
  })

  it('names the post-quantum key exchange as the control for session confidentiality', () => {
    const text = introText()
    expect(text).toMatch(/post-quantum key exchange is the control for it/)
    expect(text).toMatch(/control\s+for HNDL against session contents/)
    expect(text).toMatch(/no store now, decrypt later\s+exposure/)
  })

  it('does not say a hybrid TLS group eliminates the harvest-now-decrypt-later risk with one setting', () => {
    const text = introText()
    expect(text).not.toMatch(/eliminates this risk with a\s+single config change/)
    expect(text).toMatch(/protects the sessions that actually negotiate it/)
  })

  it('does not describe the Debian DEP-18 proposal as a signing plan', () => {
    const text = introText()
    expect(text).not.toMatch(/PQC path: DEP-18/)
    expect(text).not.toMatch(/Ubuntu 26\.04 LTS \(2026\) target/)
    expect(text).toMatch(/covers CI and merge-request workflow, not signatures/)
  })

  it('describes the RPM path from the RPM 6 and Red Hat statements', () => {
    const text = introText()
    expect(text).not.toMatch(/pluggable backend in RPM v4\.19/)
    expect(text).toMatch(/RPM 6\.0\.0 lists OpenPGP v6 and PQC signatures/)
  })
})

describe('OSPQC plain-language summary', () => {
  it('separates recorded-session decryption from later server impersonation', () => {
    expect(summary).not.toMatch(
      /break the SSH host key and authenticate as your server in the future/
    )
    expect(summary).toMatch(/would not decrypt sessions that were already recorded/)
    expect(summary).toMatch(/post-quantum key exchange is the control/)
  })

  it('does not call post-quantum package signing impossible now that Red Hat ships it', () => {
    expect(summary).not.toMatch(/incredibly hard/)
    expect(summary).toMatch(/RHEL 10\.1/)
  })
})
