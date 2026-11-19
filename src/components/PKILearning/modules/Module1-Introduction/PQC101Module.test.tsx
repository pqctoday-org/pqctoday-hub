// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PQC101Module } from './PQC101Module'
import { AlgorithmComparisonTable } from './AlgorithmComparisonTable'
import { PQC101Exercises } from './PQC101Exercises'

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

  it('distinguishes HQC as NIST Round 4 selection and lists final IR 8547 on the 2026 timeline milestone', () => {
    const { container } = renderModule()
    fireEvent.click(screen.getByText("What's Changing"))
    expect(flat(container)).toMatch(
      /HQC \(NIST Round 4 selection, IR 8545\); Classic McEliece \(Round 4 finalist, not selected by NIST\)/
    )
    fireEvent.click(screen.getByText('The Timeline'))
    expect(flat(container)).toMatch(/NIST finalizes IR 8547 \(October 2026\)/)
  })

  it('shows accurate classical and PQC roles, standards, and Exercise 6/7 callouts in AlgorithmComparisonTable', () => {
    const { container } = render(<AlgorithmComparisonTable />)
    const t = flat(container)
    expect(t).toMatch(/RSA-2048.*Key Transport \/ Sig.*FIPS 186-5 \/ SP 800-56B/)
    expect(t).toMatch(/ECC P-256.*Key Agreement \/ Sig.*FIPS 186-5 \/ SP 800-56A/)
    expect(t).toMatch(/SLH-DSA-SHA2-128s/)
    expect(t).toMatch(/Exercise 7 preview:/)
    expect(t).toMatch(/91 B when wrapped in an X\.509 SubjectPublicKeyInfo DER container/)
  })

  it('renders the 5 real-world decision scenarios in PQC101Exercises', () => {
    const { container } = render(
      <PQC101Exercises onNavigateToWorkshop={vi.fn()} onSetWorkshopConfig={vi.fn()} />
    )
    const t = flat(container)
    expect(t).toMatch(/Apply It: Real-World Decision Scenarios/)
    expect(t).toMatch(/Hospital Record Archive/)
    expect(t).toMatch(/Firmware Signing for IoT Devices/)
    expect(t).toMatch(/TLS Certificate Authority Migration/)
    expect(t).toMatch(/Classified Document Archive/)
    expect(t).toMatch(/Blockchain Wallet Key Management/)
  })
})
