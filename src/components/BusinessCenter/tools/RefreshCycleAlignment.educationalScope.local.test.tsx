// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RefreshCycleAlignment, buildMarkdown } from './RefreshCycleAlignment'
describe('refresh timing educational scope', () => {
  it('keeps blank default rows unknown without inferring funding', () => {
    render(<RefreshCycleAlignment />)
    expect(screen.getAllByText('Timing unknown')).toHaveLength(7)
    const md = buildMarkdown(
      {
        planningHorizonYears: '3',
        rows: [{ id: 'a', programName: 'Sample', nextRefreshYear: '', pqcTaskToEmbed: '' }],
      },
      2029
    )
    expect(md).toContain('Timing unknown')
    expect(md).toContain('Blank dates remain unknown')
    expect(md).not.toMatch(/On budget|work can ride the existing budgets/)
  })
  it('describes the unchanged upper-bound comparison without a future or budget assurance', () => {
    const md = buildMarkdown(
      {
        planningHorizonYears: '3',
        rows: [
          { id: 'a', programName: 'Past', nextRefreshYear: '2000', pqcTaskToEmbed: '' },
          {
            id: 'b',
            programName: 'Future',
            nextRefreshYear: '2035',
            pqcTaskToEmbed: 'Sample task',
          },
        ],
      },
      2029
    )
    expect(md).toContain('| Past | 2000 | At/before horizon end |')
    expect(md).toContain('| Future | 2035 | After horizon')
    expect(md).toContain('Dates do not establish funded capacity')
    expect(md).not.toMatch(/On budget|those can't ride/)
  })
})
