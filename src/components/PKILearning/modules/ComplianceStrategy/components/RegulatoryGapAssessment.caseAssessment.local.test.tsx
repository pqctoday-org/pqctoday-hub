// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { RegulatoryGapAssessment } from './RegulatoryGapAssessment'
describe('Editable fictional regulatory-gap case', () => {
  it('loads, changes and clears actual case answers while catalogue stays unassessed', async () => {
    const user = userEvent.setup()
    render(<RegulatoryGapAssessment selectedJurisdictions={['us']} />)
    expect(screen.getByRole('status')).toHaveTextContent('0 gaps; 0 Met; 4 Unknown')
    await user.click(screen.getByRole('button', { name: 'Load fictional case' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 gaps; 1 Met; 0 Unknown; 1 Not applicable'
    )
    expect(screen.getByText('Catalogue implementation status: Not assessed')).toBeInTheDocument()
    const plan = screen.getByRole('region', { name: 'Migration plan' })
    expect(within(plan).getByText(/Case-question result:/)).toHaveTextContent(
      'Gap. Action: Next. Case effort: High'
    )
    await user.click(screen.getByRole('button', { name: 'Answer — Cryptographic inventory' }))
    await user.click(screen.getByRole('option', { name: 'Met' }))
    expect(within(plan).getByText(/Case-question result:/)).toHaveTextContent('Action: First')
    await user.click(screen.getByRole('button', { name: 'Answer — Cryptographic inventory' }))
    await user.click(screen.getByRole('option', { name: 'Unknown' }))
    expect(within(plan).getByText(/Wait for investigation/)).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', { name: 'Applicability — Module-validation record' })
    )
    await user.click(screen.getByRole('option', { name: 'Applies' }))
    expect(screen.getByRole('status')).toHaveTextContent('1 gaps; 1 Met; 2 Unknown')
    await user.click(screen.getByRole('button', { name: 'Clear case answers' }))
    expect(screen.getByRole('status')).toHaveTextContent('0 gaps; 0 Met; 4 Unknown')
  })
  it('leaves fresh country changes unknown and unsupported catalogue coverage explicit', () => {
    const { rerender } = render(<RegulatoryGapAssessment selectedJurisdictions={['us']} />)
    rerender(<RegulatoryGapAssessment selectedJurisdictions={['eu']} />)
    expect(screen.getByRole('status')).toHaveTextContent('0 gaps; 0 Met; 4 Unknown')
    rerender(<RegulatoryGapAssessment selectedJurisdictions={['fictional-unsupported']} />)
    expect(screen.getByText(/Framework data not yet available for/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('0 Met; 4 Unknown')
  })
  it('retains empty-jurisdiction guidance without silently loading case facts', () => {
    render(<RegulatoryGapAssessment selectedJurisdictions={[]} />)
    expect(screen.getByText('No jurisdictions selected')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
