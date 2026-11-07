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
