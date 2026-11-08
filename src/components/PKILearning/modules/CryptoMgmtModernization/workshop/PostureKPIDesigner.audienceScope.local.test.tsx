// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { PostureKPIDesigner } from './PostureKPIDesigner'
import { POSTURE_KPIS } from '../data/postureKPIs'

function preview() {
  return screen.getByText('CPM Posture Dashboard — Preview').parentElement!.parentElement!
    .parentElement!
}

describe('Audience emphasis preserves all selected KPI examples', () => {
  it('retains a Board-suggested selection through all five audience choices', () => {
    render(<PostureKPIDesigner />)
    const selectedBefore = screen
      .getAllByRole('checkbox')
      .filter((el) => (el as HTMLInputElement).checked)
    expect(selectedBefore).toHaveLength(6)
    const boardKpi = POSTURE_KPIS.find((k) => k.id === 'policy-drift-rate')!
    expect(boardKpi.audience).toContain('board')
    expect(boardKpi.audience).not.toContain('ops')
    for (const audience of ['Board', 'CIO', 'CISO', 'Architect', 'Ops']) {
      fireEvent.click(screen.getByRole('button', { name: audience }))
      expect(within(preview()).getByText(boardKpi.name)).toBeInTheDocument()
      expect(within(preview()).getByText(boardKpi.example)).toBeInTheDocument()
      expect(
        within(preview()).getByText(`All 6 selected KPIs retained · Emphasis: ${audience}`)
      ).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: boardKpi.name })).toBeChecked()
      expect(
        screen.getAllByRole('checkbox').filter((el) => (el as HTMLInputElement).checked)
      ).toEqual(selectedBefore)
    }
    expect(screen.getByText('Audience emphasis:')).toBeInTheDocument()
    expect(screen.queryByText(/Filtered for/)).not.toBeInTheDocument()
  })

  it('selection and Clear retain their existing count/value behavior', () => {
    render(<PostureKPIDesigner />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Policy-drift rate' }))
    expect(within(preview()).queryByText('Policy-drift rate')).not.toBeInTheDocument()
    expect(within(preview()).getByText(/All 5 selected KPIs retained/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText(/All 0 selected KPIs retained/)).toBeInTheDocument()
    expect(screen.getByText('Pick at least one KPI above.')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox').every((el) => !(el as HTMLInputElement).checked)).toBe(
      true
    )
  })
})
