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
function rate(id: string, desired: 'Yes' | 'Partial' | 'No') {
  const index = EXCEPTION_CRITERIA.findIndex((criterion) => criterion.id === id)
  const button = screen.getAllByRole('button', { name: /^(—|Yes|Partial|No)$/ }).at(index)
  if (index < 0 || !button) throw new Error('Missing expected criterion control')
  for (let count = 0; count < 4 && button.textContent !== desired; count++) fireEvent.click(button)
  expect(button).toHaveTextContent(desired)
  return button
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
  it('uses the correct mixed maximum while preserving raw availability answers', () => {
    openBuilder()
    answerAll()
    expect(screen.getByText('93')).toBeInTheDocument()
    rate('compensating-controls', 'No')
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('High Risk — Escalate to CISO')).toBeInTheDocument()
    expect(screen.queryByText('Not assessed')).not.toBeInTheDocument()
  })
  it('uses the correct mixed minimum and withdraws the score if a rating clears', () => {
    openBuilder()
    answerAll()
    for (const button of screen.getAllByRole('button', { name: 'Yes' })) fireEvent.click(button)
    for (const button of screen.getAllByRole('button', { name: 'Partial' })) fireEvent.click(button)
    expect(screen.getByText('7')).toBeInTheDocument()
    rate('compensating-controls', 'Yes')
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
  it('reduces only the availability contribution from No43 through Partial39 to Yes36', () => {
    openBuilder()
    for (const criterion of EXCEPTION_CRITERIA) rate(criterion.id, 'No')
    rate('technical-feasibility', 'Yes')
    rate('business-criticality', 'Yes')
    expect(screen.getByText('43')).toBeInTheDocument()
    expect(screen.getByText('Medium Risk — Program Manager Review')).toBeInTheDocument()
    expect(rate('compensating-controls', 'No')).toHaveClass('text-status-error')
    expect(rate('compensating-controls', 'Partial')).toHaveClass('text-status-warning')
    expect(screen.getByText('39')).toBeInTheDocument()
    expect(rate('compensating-controls', 'Yes')).toHaveClass('text-status-success')
    expect(screen.getByText('36')).toBeInTheDocument()
    expect(screen.getByText('Low Risk — Team Lead Approval')).toBeInTheDocument()
    // A different risk-increasing criterion retains its original direction.
    rate('compliance-window', 'Yes')
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('keeps selected proposals unscored and states the teaching-only limits', () => {
    openBuilder()
    for (const criterion of EXCEPTION_CRITERIA) rate(criterion.id, 'No')
    rate('compensating-controls', 'Yes')
    expect(screen.getByText('0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /^Network Isolation/ }))
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText(/1 compensating control selected/)).toBeInTheDocument()
    expect(
      screen.getByText(/This Hub score and review route are teaching illustrations/)
    ).toHaveTextContent(/not a production risk assessment or approval/)
    expect(
      screen.getByText(/This Hub score and review route are teaching illustrations/)
    ).toHaveTextContent(/does not establish that they are implemented or effective/)
    expect(screen.getByText('Illustrative review route')).toBeInTheDocument()
    expect(screen.getByText('Illustrative Exception Risk Score')).toBeInTheDocument()
  })
})
