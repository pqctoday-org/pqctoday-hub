// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AgilityReadinessAssessment } from './AgilityReadinessAssessment'

function openEverything(): string {
  render(<AgilityReadinessAssessment />)
  // dimension headers may be collapsed; open each one first
  for (const header of screen.queryAllByRole('button', { name: /agility|inventory/i })) {
    fireEvent.click(header)
  }
  for (const guidance of screen.queryAllByRole('button', { name: /guidance/i })) {
    fireEvent.click(guidance)
  }
  return document.body.textContent ?? ''
}

describe('AgilityReadinessAssessment TLS question', () => {
  it('asks about hybrid key-exchange groups, separately from the symmetric cipher suite', () => {
    const text = openEverything()
    expect(text).toMatch(/classical and hybrid key-exchange groups/)
    expect(text).toMatch(/X25519MLKEM768 alongside X25519/)
    expect(text).toMatch(/symmetric cipher suite .* is a separate setting/)
  })

  it('does not call a hybrid group a cipher suite', () => {
    const text = openEverything()
    expect(text).not.toMatch(/hybrid cipher suites?/i)
    expect(text).not.toMatch(/enable hybrid suites/i)
  })

  it('points learners at supported_groups and key_share negotiation', () => {
    const text = openEverything()
    expect(text).toMatch(/supported_groups and key_share/)
    expect(text).toMatch(/not the cipher suite list/)
  })
})
