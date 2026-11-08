// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FIPSCompatibilityChecker } from './FIPSCompatibilityChecker'

function pageText(): string {
  return document.body.textContent ?? ''
}

function rowFor(osName: string): HTMLElement {
  const cell = screen
    .getAllByText(osName)
    .find((el) => el.tagName === 'TD' && el.closest('table') !== null)
  expect(cell).toBeDefined()
  return cell!.closest('tr') as HTMLElement
}

function expandCard(osName: string) {
  const title = screen.getAllByText(osName).find((el) => el.tagName === 'DIV')
  expect(title).toBeDefined()
  fireEvent.click(title!.closest('button') as HTMLButtonElement)
}

describe('FIPSCompatibilityChecker recommendation follows the certificate evidence', () => {
  it('does not recommend Windows Server 2025 for services that need both ML-KEM TLS and FIPS', () => {
    render(<FIPSCompatibilityChecker />)
    const text = pageText()
    expect(text).not.toMatch(/Deploy Windows Server 2025 for services where ML-KEM TLS is required/)
    expect(text).not.toMatch(/ML-KEM TLS is required AND FIPS compliance is needed simultaneously/)
    // The recommendation is conditional on module, approved algorithm and environment.
    expect(text).toMatch(/validated module/)
    expect(text).toMatch(/approved algorithms/)
    expect(text).toMatch(/negotiates/)
    expect(text).toMatch(/lists no ML-KEM/)
    expect(text).toMatch(/unresolved/)
  })

  it('shows the Windows SymCrypt row as not having ML-KEM or ML-DSA, matching certificate 5313', () => {
    render(<FIPSCompatibilityChecker />)
    const row = rowFor('Windows Server 2025')
    expect(row.textContent).toContain('Not in FIPS')
    expect(row.textContent).not.toContain('In FIPS Module')
    expect(row.textContent).not.toContain('Pending Cert')
  })

  it('replaces the claimed Windows success output with steps that check availability and the negotiated group', () => {
    render(<FIPSCompatibilityChecker />)
    expandCard('Windows Server 2025')
    const text = pageText()
    // old claim: enabling FIPS mode and then "X25519MLKEM768 still negotiated"
    expect(text).not.toMatch(/X25519MLKEM768 still negotiated/)
    expect(text).not.toMatch(/Verify ML-KEM in FIPS mode/)
    // steps to check what the build offers and what a real connection selected
    expect(text).toMatch(/Get-TlsEccCurve/)
    expect(text).toMatch(/ServerHello key_share/)
    expect(text).toMatch(/still does not make it\s+#\s+validated/)
  })

  it('keeps a platform with no cited module unresolved rather than unconstrained', () => {
    render(<FIPSCompatibilityChecker />)
    const row = rowFor('FreeBSD 14.x')
    expect(row.textContent).toContain('Not verified')
    expect(row.textContent).not.toContain('Not in FIPS')
    expandCard('FreeBSD 14.x')
    const text = pageText()
    expect(text).not.toMatch(/treats FIPS as not constraining/)
    expect(text).not.toMatch(/coexist freely/)
    expect(text).not.toMatch(/assumes no FIPS compatibility constraint/)
    expect(text).toMatch(/unresolved, not unconstrained/)
  })

  it('uses the FreeBSD port name that exists and no unverified build flag', () => {
    render(<FIPSCompatibilityChecker />)
    expandCard('FreeBSD 14.x')
    const text = pageText()
    expect(text).toMatch(/pkg install openssl-oqsprovider/)
    expect(text).not.toMatch(/pkg install openssl-quic/)
    expect(text).not.toMatch(/WITH_PQC=yes/)
    expect(text).not.toMatch(/ports\/security\/oqsprovider\b/)
  })

  it('does not attribute the Go module certificate to Linux platforms or claim Apple validation status', () => {
    render(<FIPSCompatibilityChecker />)
    const text = pageText()
    expect(text).not.toMatch(/Linux-based platforms build on/)
    expect(text).not.toMatch(/Apple corecrypto appears\s+only at the algorithm-validation/)
    expect(text).toMatch(/#5247/)
    expect(text).toMatch(/library for Go\s+applications rather than an operating system/)
  })
})
