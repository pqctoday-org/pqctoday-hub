// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TransformationStatusPanel } from './TransformationStatusPanel'
import { transformationStatus, type StatusInput } from './transformationStatus'
import { getScenario } from './scenarioConfig'
import type { PlanningGroupId, PlanningGroupProgress } from '@/simulation/edgePlanningProgress'
vi.mock('../atoms', () => ({ Ring: () => <span>Maturity ring</span> }))
vi.mock('../RibbonTermTooltip', () => ({
  RibbonTermTooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

function status(planningGroups: StatusInput['planningGroups']) {
  return transformationStatus({
    scenario: getScenario('US'),
    programMaturity: 2,
    p0Level: 2,
    planningGroups,
    allAtTopBand: false,
    currentYear: 2030,
  })
}
describe('TransformationStatusPanel planning availability', () => {
  it('renders unavailable groups without percentage bars or green exposure', () => {
    render(<TransformationStatusPanel status={status({} as StatusInput['planningGroups'])} />)
    const exposure = screen.getByText('Sample HNDL exposure unavailable')
    expect(exposure).toHaveClass('text-muted-foreground')
    expect(exposure).not.toHaveClass('text-success')
    expect(screen.getAllByText('Planning unassessed')).toHaveLength(4)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
  it('renders assessed named counts, including real zero and partial progress', () => {
    const group = (id: PlanningGroupId): PlanningGroupProgress => ({
      requiredKeys: [`${id}-1`, `${id}-2`],
      completedKeys: id === 'hndl-critical' ? [`${id}-1`] : [],
      progress: id === 'hndl-critical' ? 0.5 : 0,
      done: false,
    })
    const groups: StatusInput['planningGroups'] = {
      'hndl-critical': group('hndl-critical'),
      'tnfl-critical': group('tnfl-critical'),
      'hndl-general': group('hndl-general'),
      'tnfl-general': group('tnfl-general'),
    }
    render(<TransformationStatusPanel status={status(groups)} />)
    expect(screen.getByText('1/2 sample planning links complete')).toBeInTheDocument()
    expect(screen.getAllByText('0/2 sample planning links complete')).toHaveLength(3)
    expect(
      screen.getByRole('progressbar', { name: 'HNDL critical sample planning' })
    ).toHaveAttribute('aria-valuenow', '50')
    expect(screen.getByText('Sample HNDL exposure 65%')).toBeInTheDocument()
  })
})
