// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EMVPaymentExercises } from './EMVPaymentExercises'
import { content as emvPaymentContent } from '../content'

describe('payment network exercise follows the evidence available to the learner', () => {
  it('teaches a useful source comparison and opens the actual comparator, without unsupported ranking or at-risk arithmetic', () => {
    const configure = vi.fn()
    const navigate = vi.fn()
    render(
      <MemoryRouter>
        <EMVPaymentExercises onNavigateToWorkshop={navigate} onSetWorkshopConfig={configure} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Separate published research and guidance/)).toBeVisible()
    const answer = screen.getByText(/^Visa: Published near-term plan/)
    expect(answer).toHaveTextContent('stablecoin scope')
    expect(answer).toHaveTextContent(
      'not extend Visa’s stablecoin guidance into a card-network deployment claim'
    )
    expect(answer).toHaveTextContent('UnionPay has not published its own sequence')
    expect(answer).toHaveTextContent('possible multi-badging')
    expect(answer).toHaveTextContent('do not establish distinct vulnerable cards')
    expect(answer).toHaveTextContent('what evidence to request for the specific payment interface')
    expect(answer).not.toHaveTextContent(
      /quantum lab since 2022|pending GB\/T|single largest quantum-vulnerable/
    )
    expect(screen.queryByText(/Calculate the total cards at risk/)).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: 'Load & Run' })[0])
    expect(configure).toHaveBeenCalledExactlyOnceWith({ step: 0 })
    expect(navigate).toHaveBeenCalledExactlyOnceWith()
  })

  it('names the exact retained PCI DSS edition without a global nonexistence or access claim', () => {
    const standards = emvPaymentContent.narratives.relatedStandards
    expect(standards).toContain('PCI DSS v4.0.1, the edition retained in its standards library')
    expect(standards).toContain('PCI SSC Document Library')
    expect(standards).not.toMatch(
      /there is no v5\.0|only the Quick Reference Guide|v4\.0\.1 is current/
    )
  })
})
