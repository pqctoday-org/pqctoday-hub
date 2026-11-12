// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { OSPQCIntroduction } from './OSPQCIntroduction'

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

describe('OSPQC introduction: Red Hat crypto-policies row', () => {
  it('shows the documented DEFAULT:PQ policy instead of the FUTURE policy', () => {
    const text = introText()
    expect(text).toContain('update-crypto-policies --set DEFAULT:PQ')
    expect(text).toContain(
      'Red Hat documents the DEFAULT:PQ policy for RHEL 9.7; on RHEL 10.1 the DEFAULT policy is the documented route'
    )
    expect(text).not.toContain('update-crypto-policies --set FUTURE')
    expect(text).not.toContain('X25519MLKEM768 hybrid group systemwide')
  })
})

describe('OSPQC introduction: Ubuntu openssl.cnf row', () => {
  it('ties the x25519mlkem768 group to Ubuntu 26.04 LTS (OpenSSL 3.5.5), not to 24.04', () => {
    const text = introText()
    expect(text).toContain('Ubuntu 26.04 LTS (OpenSSL 3.5.5)')
    expect(text).toContain('Ubuntu 24.04 LTS ships OpenSSL 3.0.13, which has no ML-KEM.')
    expect(text).not.toMatch(/Ubuntu 24\.04 LTS\s*Groups = x25519mlkem768/)
  })
})

describe('OSPQC introduction: FreeBSD oqsprovider row', () => {
  it('uses the FreeBSD package name that exists (pkg install openssl-oqsprovider)', () => {
    const text = introText()
    expect(text).toContain('pkg install openssl-oqsprovider && configure openssl.cnf')
    expect(text).toContain('FreeBSD port security/openssl-oqsprovider')
    expect(text).not.toMatch(/pkg install oqsprovider/)
  })
})

describe('OSPQC introduction: FIPS + PQC hybrid strategy', () => {
  it('leaves the PQC provider and its coexistence with the FIPS provider to the assessor', () => {
    const text = introText()
    expect(text).toContain('one option, if your assessor agrees, is a dual approach')
    expect(text).toContain(
      'Where your assessor accepts PQC services outside the validated boundary'
    )
    expect(text).toContain('the default OpenSSL provider on OpenSSL 3.5 or later')
    expect(text).toContain(
      "Whether it may run next to the FIPS provider is the assessor's decision"
    )
    expect(text).not.toContain('New services use the default OpenSSL provider + oqsprovider')
  })
})

describe('OSPQC introduction: GnuTLS alias agrees with the subsystem row', () => {
  it('teaches a real local capability command and distinguishes negotiation', () => {
    const text = introText()
    expect(text).toContain('GnuTLS 3.8.8 introduced experimental final-ML-KEM hybrid groups')
    expect(text).toContain('3.8.9 added experimental ML-DSA library and certtool support')
    expect(text).toContain('3.8.10 added ML-DSA TLS handshake signatures')
    expect(text).toContain("gnutls-cli --priority 'SECURE128:+GROUP-X25519-MLKEM768' --list")
    expect(text).toContain('unsupported-group error means that this build cannot')
    expect(text).toContain('OpenSSL config change does not configure GnuTLS')
    expect(text).not.toMatch(/GnuTLS 3\.8\.3|SECURE128:\+X25519MLKEM768/)
  })
})
