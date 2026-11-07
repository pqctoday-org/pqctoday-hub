// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { QuantumThreatsExercises } from './QuantumThreatsExercises'

const text = () => {
  const { container } = render(
    <MemoryRouter>
      <QuantumThreatsExercises onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return (container.textContent ?? '').replace(/\s+/g, ' ')
}

describe('QuantumThreatsExercises: post-quantum resistance wording', () => {
  it('does not equate resistance with identical classical and quantum work or complete safety', () => {
    const t = text()
    expect(t).not.toMatch(/identical classical and quantum/i)
    expect(t).not.toMatch(/levels are identical/i)
    expect(t).not.toMatch(/fully safe/i)
    expect(t).not.toMatch(/no degradation under quantum attack/i)
  })

  it('teaches the absence of a known efficient quantum break, the category, and its limits', () => {
    const t = text()
    expect(t).toMatch(
      /no efficient quantum attack on their (underlying problems|lattice problems) is known/i
    )
    expect(t).toMatch(/security category 3/i)
    expect(t).toMatch(/not a proof/i)
    expect(t).toMatch(/not a measured attack cost/i)
    expect(t).toMatch(/implementation, protocol and key-management failures/i)
  })

  it('treats AES-256 as a policy or margin choice rather than an automatic AES-128 rejection', () => {
    const t = text()
    expect(t).toMatch(/policy or safety-margin choice/)
    expect(t).toMatch(/not a gate, time or cost estimate/)
  })
})
