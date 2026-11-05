// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { EscalationFramework } from './EscalationFramework'
import { EXCEPTION_CRITERIA } from '../data/governanceTemplates'

function openBuilder() {
  render(<EscalationFramework />)
  fireEvent.click(screen.getByRole('button', { name: 'Exception Request Builder' }))
}
function answerAll() {
  for (const button of screen.getAllByRole('button', { name: '—' })) fireEvent.click(button)
}
describe('exception risk assessment requires explicit criterion ratings', () => {
  it('does not label an empty request low risk', () => {
    openBuilder()
    expect(screen.getByText('Not assessed')).toBeInTheDocument()
    expect(
      screen.getByText((text) =>
        text.startsWith(`${EXCEPTION_CRITERIA.length} unanswered criteria`)
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Low Risk/)).not.toBeInTheDocument()
  })
  it('keeps a partially answered request unassessed', () => {
    openBuilder()
    fireEvent.click(screen.getAllByRole('button', { name: '—' })[0])
    expect(screen.getByText('Not assessed')).toBeInTheDocument()
    expect(
      screen.getByText((text) =>
        text.startsWith(`${EXCEPTION_CRITERIA.length - 1} unanswered criteria`)
      )
    ).toBeInTheDocument()
  })
  it('preserves the fully answered high-risk result', () => {
    openBuilder()
    answerAll()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('High Risk — Escalate to CISO')).toBeInTheDocument()
    expect(screen.queryByText('Not assessed')).not.toBeInTheDocument()
  })
  it('preserves explicit no ratings as zero and withdraws the score if a rating clears', () => {
    openBuilder()
    answerAll()
    for (const button of screen.getAllByRole('button', { name: 'Yes' })) fireEvent.click(button)
    for (const button of screen.getAllByRole('button', { name: 'Partial' })) fireEvent.click(button)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('Low Risk — Team Lead Approval')).toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'No' })[0])
    expect(screen.getByText('Not assessed')).toBeInTheDocument()
    expect(screen.getByText(/1 unanswered criterion/)).toBeInTheDocument()
    expect(screen.queryByText(/Low Risk/)).not.toBeInTheDocument()
  })
  it('reset returns a completed assessment to unknown', () => {
    openBuilder()
    answerAll()
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByText('Not assessed')).toBeInTheDocument()
    expect(screen.queryByText('100')).not.toBeInTheDocument()
  })
})
