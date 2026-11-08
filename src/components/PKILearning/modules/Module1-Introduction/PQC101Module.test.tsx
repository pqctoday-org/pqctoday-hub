// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PQC101Module } from './PQC101Module'

const renderModule = () =>
  render(
    <MemoryRouter>
      <PQC101Module />
    </MemoryRouter>
  )
const flat = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('PQC101Module: signature risk and the healthcare example', () => {
  it('teaches new-artifact forgery and verification lifetime without requiring captured artifacts or automatic retroactive forgery', () => {
    const { container } = renderModule()
    const t = flat(container)
    expect(t).toMatch(/a signature attack needs nothing captured/)
    expect(t).toMatch(/sign new firmware images, certificates, or documents as that signer/)
    expect(t).toMatch(/Future impersonation/)
    expect(t).toMatch(/Verification lifetime of old signatures/)
    expect(t).toMatch(/old signatures do not all become forgeable or repudiable automatically/)
    expect(t).not.toMatch(/Adversaries capture signed artifacts today/)
    expect(t).not.toMatch(/forge or repudiate those signatures retroactively/)
  })

  it('labels the healthcare sensitivity as an illustration and removes the future HIPAA algorithm mandate', () => {
    const { container } = renderModule()
    fireEvent.click(screen.getByText('Who Needs to Act'))
    const t = flat(container)
    expect(t).toMatch(/Healthcare/)
    expect(t).toMatch(
      /this lesson assumes a long-lived sensitivity as an illustration, not a retention rule/
    )
    expect(t).toMatch(/HIPAA sets no medical-record retention period/)
    expect(t).not.toMatch(/HIPAA compliance will require PQC/)
    expect(t).not.toMatch(/50\+ years/)
  })
})
