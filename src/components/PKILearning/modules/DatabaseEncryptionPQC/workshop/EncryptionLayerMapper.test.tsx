// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EncryptionLayerMapper } from './EncryptionLayerMapper'

describe('EncryptionLayerMapper FIPS row', () => {
  it('shows the scope of a FIPS claim, not a product-wide Yes badge', () => {
    render(<EncryptionLayerMapper />)
    const text = document.body.textContent ?? ''
    expect(text).not.toMatch(/FIPS Validated/)
    expect(text).toMatch(/FIPS 140 scope \(module, certificate, configuration\)/)
    // the default selection is Oracle, whose validation scope is not verified here
    expect(text).toMatch(/Unverified here: confirm the cryptographic module/)
  })
})
