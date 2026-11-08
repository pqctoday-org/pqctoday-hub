// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Introduction } from './Introduction'
import curiousSummary from '../curious-summary.md?raw'

function introText(): string {
  const { container } = render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={() => undefined} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('assurance records: algorithm validation, module certificate and entropy validation', () => {
  it('keeps the three records apart instead of calling an algorithm certificate a CMVP submission', () => {
    const text = introText()
    expect(text).not.toMatch(/FIPS 140-3 algorithm certificate/)
    expect(text).toMatch(/An algorithm validation \(CAVP/)
    expect(text).toMatch(/A FIPS 140-3 module certificate \(CMVP/)
    expect(text).toMatch(/Entropy Source Validation certificate \(ESV/)
    expect(text).toMatch(/None of the three stands in for another/)
  })

  it('states randomness needs per operation instead of a general PQC rule', () => {
    const text = introText()
    expect(text).not.toMatch(/PQC algorithms \(ML-KEM, ML-DSA\) require higher-quality randomness/)
    expect(text).toMatch(
      /security strength is at least 128, 192 or 256 bits for ML-KEM-512, -768 and -1024/
    )
    expect(text).toMatch(/32-byte seed for ML-DSA key generation/)
    expect(text).toMatch(/at least 192 bits for ML-DSA-65 and 256 bits for ML-DSA-87/)
  })

  it('does not assume every infrastructure move is an entropy re-evaluation trigger', () => {
    const text = introText()
    expect(text).not.toMatch(/ESV re-evaluation triggers/)
    expect(text).not.toMatch(/silently degrade seed quality/)
    expect(text).toMatch(/operating environments it was tested on/)
    expect(text).toMatch(/does not assume that every migration triggers a new entropy assessment/)
  })

  it('does not let a module certificate stand in for entropy quality', () => {
    const text = introText()
    expect(text).toMatch(/No assurance of the minimum strength of generated SSPs/)
    expect(text).toMatch(/do not infer entropy quality from the module certificate alone/)
  })
})

describe('pre-deployment lab: named certificates and what a capture can show', () => {
  it('asks for a named module certificate instead of recommending products for PQC coverage', () => {
    const text = introText()
    expect(text).not.toMatch(/recommended for PQC boundary coverage/)
    expect(text).not.toMatch(/FIPS L4 boundary testing/)
    expect(text).toMatch(/names the exact module, firmware version, level and approved algorithms/)
    expect(text).toMatch(/non-validated lab use/)
    expect(text).toMatch(/record the certificate number, level and mode from its CMVP entry/)
  })

  it('separates passive capture from active enumeration and configured policy', () => {
    const text = introText()
    expect(text).not.toMatch(/passive TLS handshake capture for cipher-suite enumeration/)
    expect(text).toMatch(/Passive capture does not enumerate every suite a server supports/)
    expect(text).toMatch(/cannot show configured policy/)
    expect(text).toMatch(/later handshake messages, including the certificate, are encrypted/)
    expect(text).toMatch(/Use active enumeration against the lab stack/)
  })
})

describe('quick tour: certificates are for some modules, with status and scope', () => {
  it('does not say every library and HSM has a FIPS certificate', () => {
    expect(curiousSummary).not.toMatch(/Every crypto library and HSM has a FIPS 140-3/)
    expect(curiousSummary).toMatch(/many products hold none/)
  })

  it('teaches applicability, active and historical status, revocation and approved scope', () => {
    const text = curiousSummary.replace(/\s+/g, ' ')
    expect(text).toMatch(/covers one named module/)
    expect(text).toMatch(/its approved algorithms/)
    expect(text).toMatch(/for new systems only while its status is Active/)
    expect(text).toMatch(/Historical list or be revoked/)
    expect(text).toMatch(/exact build you run/)
  })
})
