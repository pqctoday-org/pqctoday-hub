// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { PKIIntroduction } from './PKIIntroduction'

function pageText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <PKIIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('PKI introduction: CNSA 2.0 and size comparison', () => {
  it('states the current CNSA 2.0 lifecycle for national security systems only', () => {
    const text = pageText()
    expect(text).toMatch(/national security systems only/)
    expect(text).toMatch(/new acquisitions from 1 January 2027/)
    expect(text).toMatch(/phased out by 31 December 2030 absent an exception/)
    expect(text).toMatch(/mandated by 31 December 2031 unless otherwise noted/)
    // the superseded "2033 for large PKI" schedule is only mentioned as the earlier advisory's view
    expect(text).not.toMatch(/exclusive PQC use in national security systems by 2033/)
    expect(text).toMatch(/earlier 2022 advisory anticipated a later 2033 date/)
  })

  it('gives signature and public-key sizes together for the classical and post-quantum rows', () => {
    const text = pageText()
    expect(text).toMatch(/RSA-2048 signature is 256 bytes/)
    expect(text).toMatch(/ECDSA P-256 signature is 64 bytes .* 65-byte uncompressed public key/)
    expect(text).toMatch(/3,309-byte signature and 1,952-byte public key/)
    expect(text).toMatch(/7,856-byte signature and 32-byte public key/)
    expect(text).not.toMatch(/Small signatures \(256-512 bytes\)/)
  })
})
