// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IAMPQCExercises } from './IAMPQCExercises'

function exerciseText(): string {
  render(
    <MemoryRouter>
      <IAMPQCExercises onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  return document.body.textContent ?? ''
}

describe('IAMPQCExercises', () => {
  it('does not promise immediate quantum-safe coverage from hybrid TLS with zero application changes', () => {
    const text = exerciseText()
    expect(text).not.toMatch(/zero application changes/i)
    expect(text).not.toMatch(/immediate quantum-safe coverage/i)
  })

  it('states what hybrid TLS protects, what must be tested, and what stays classical', () => {
    const text = exerciseText()
    expect(text).toMatch(/confidentiality of a session/i)
    expect(text).toMatch(/every TLS-terminating proxy or load balancer/i)
    expect(text).toMatch(/certificates and signatures stay classical/i)
  })

  it('labels the exercise years as sample assumptions rather than current deadlines', () => {
    const text = exerciseText()
    expect(text).toMatch(/sample planning assumptions, not current deadlines/i)
    expect(text).not.toMatch(/begin planning before 2026/i)
  })

  it('keeps Golden Ticket key theft and AS-REP roasting out of the quantum exposure', () => {
    const text = exerciseText()
    expect(text).toMatch(/not the KRBTGT key a Golden Ticket needs/i)
    expect(text).toMatch(/classical weaknesses, not quantum threats/i)
  })
})
