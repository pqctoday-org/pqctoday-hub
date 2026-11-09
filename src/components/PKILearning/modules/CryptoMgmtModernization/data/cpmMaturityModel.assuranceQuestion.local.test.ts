// SPDX-License-Identifier: AGPL-3.0-only
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { PILLARS } from './cpmMaturityModel'
import { MaturityAssessment } from '../workshop/MaturityAssessment'

vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  Radar: () => null,
  RadarChart: () => null,
  PolarGrid: () => null,
  PolarAngleAxis: () => null,
  PolarRadiusAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
}))
vi.mock('@/components/Compliance/MaturityEvidenceGrid', () => ({
  MaturityEvidenceGrid: () => null,
}))

const assurance = PILLARS.find((p) => p.id === 'assurance')!

describe('applicable module assurance discussion', () => {
  it('asks about the applicable module boundary/configuration and status for intended use, not universal Active-only coverage', () => {
    expect(assurance.question).toContain('Where FIPS validation applies')
    for (const scope of [
      'module boundary',
      'Security Policy',
      'version',
      'operating environment',
      'approved mode',
      'current CMVP status',
      'intended use',
    ]) {
      expect(assurance.question).toContain(scope)
    }
    expect(assurance.question).not.toMatch(/every library|each library and HSM|Active certificate/)
    // A prompt must not turn either a historical certificate or an unresolved
    // dependency into an automatic pass/fail decision for all deployments.
    expect(assurance.question).not.toMatch(
      /historical.*(?:accepted|rejected)|unknown.*(?:validated|unvalidated)/i
    )
  })

  it('renders that question and preserves real self-rating changes without turning them into validation outcomes', () => {
    const output = vi.fn()
    render(createElement(MaturityAssessment, { onOutput: output }))
    const question = screen.getByText(assurance.question)
    expect(question).toHaveTextContent('Where FIPS validation applies')
    expect(question).toHaveTextContent('current CMVP status for the intended use')
    expect(screen.getByText('1.0 / 4.0')).toBeInTheDocument()
    // eslint-disable-next-line testing-library/no-node-access -- The existing pillar has no accessible group; scope actual controls to its question's card.
    const card = question.parentElement!.parentElement!
    expect(within(card).getAllByRole('button', { name: '4' })).toHaveLength(4)
    for (const button of within(card).getAllByRole('button', { name: '4' })) fireEvent.click(button)
    // Four of twenty existing ratings change from1 to4: (16*1+4*4)/20=1.6.
    expect(screen.getByText('1.6 / 4.0')).toBeInTheDocument()
    expect(output).toHaveBeenLastCalledWith(expect.objectContaining({ averageScore: 1.6 }))
    expect(
      screen.getByText(/ratings do not show that any requirement has been met/)
    ).toBeInTheDocument()
    for (const button of within(card).getAllByRole('button', { name: '1' })) fireEvent.click(button)
    expect(screen.getByText('1.0 / 4.0')).toBeInTheDocument()
    expect(output).toHaveBeenLastCalledWith(expect.objectContaining({ averageScore: 1 }))
    expect(
      within(card).getByText('Unknown whether modules are validated. No tracking.')
    ).toBeInTheDocument()
    expect(question).toHaveTextContent('assess its current CMVP status for the intended use')
    expect(screen.queryByText(/Your posture has reached/)).not.toBeInTheDocument()
  })
})
