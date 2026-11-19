// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { QuantumThreatsIntroduction } from './QuantumThreatsIntroduction'

const renderIntro = () =>
  render(
    <MemoryRouter>
      <QuantumThreatsIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )

describe("QuantumThreatsIntroduction: Grover's bound on AES-128", () => {
  it('shows the 64-bit figure as an idealised query bound, not an unqualified rejection', () => {
    renderIntro()
    const row = screen.getByRole('row', { name: /^AES-128/ })
    expect(row).toHaveTextContent('64-bit')
    expect(row).not.toHaveTextContent(/insufficient|fail|broken|reject/i)
    expect(screen.getByRole('columnheader', { name: /query bound/i })).toBeInTheDocument()
  })

  it('separates query count from gates and hardware, and from authority policy', () => {
    const { container } = renderIntro()
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/Three separate questions/)
    expect(text).toMatch(/not a cost estimate/)
    expect(text).toMatch(/MAXDEPTH/)
    expect(text).toMatch(/CNSA 2\.0/)
    expect(text).toMatch(/not an automatic rejection of AES-128/)
    // The old blanket "fix" sentence must be gone.
    expect(text).not.toMatch(/The fix is simple: double the key size/)
  })
})

describe('QuantumThreatsIntroduction: HNFL and historical signatures', () => {
  it('distinguishes new forgeries from unchanged artifacts and links timestamp evidence', () => {
    const { container } = renderIntro()
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/create new signatures that verify under that key/)
    expect(text).toMatch(/This does not alter files that were signed earlier/)
    expect(text).toMatch(/Existing certificates are not changed/)
    expect(text).toMatch(/trusted timestamp and archive records/)
    expect(screen.getByRole('link', { name: 'RFC 3161' })).toHaveAttribute(
      'href',
      'https://www.rfc-editor.org/rfc/rfc3161.html'
    )
    expect(text).not.toMatch(/forges arbitrary signatures retroactively/i)
    expect(text).not.toMatch(/every certificate it ever signed becomes forgeable/i)
  })
})

describe('QuantumThreatsIntroduction: HNDL exposure scope', () => {
  it('limits future decryption to recorded sessions with vulnerable key establishment', () => {
    const { container } = renderIntro()
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(text).toMatch(/recorded encrypted traffic/)
    expect(text).toMatch(/key establishment is quantum-vulnerable/)
    expect(text).toMatch(/decrypt data protected only by that session/)
    expect(text).not.toMatch(/all data is decrypted/)
  })
})
