// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RefreshCycleAlignment, buildMarkdown, refreshAlignment } from './RefreshCycleAlignment'
import { useModuleStore } from '@/store/useModuleStore'
import { Button } from '@/components/ui/button'

vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport?: () => void }) => (
    <section aria-label="Current sample export">
      <pre>{exportData}</pre>
      <Button onClick={onExport}>Save sample alignment</Button>
    </section>
  ),
}))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  useModuleStore.setState({
    artifacts: { ...useModuleStore.getState().artifacts, executiveDocuments: [] },
  })
})
afterEach(() => vi.useRealTimers())

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

  it('separates past schedule review from a future date beyond the horizon', () => {
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
    expect(md).toContain('| Past | 2000 | Past date — review schedule |')
    expect(md).toContain('| Future | 2035 | After horizon')
    expect(md).toContain('Dates do not establish funded capacity')
    expect(md).toContain('Completion is not recorded')
    expect(md).not.toMatch(/On budget|those can't ride|overdue|completed/)
  })

  it('classifies complete calendar years at both inclusive window boundaries', () => {
    expect(refreshAlignment('2025', 2029)).toBe('past')
    expect(refreshAlignment('2026', 2029)).toBe('aligned')
    expect(refreshAlignment('2029', 2029)).toBe('aligned')
    expect(refreshAlignment('2030', 2029)).toBe('misaligned')
    for (const invalid of ['', ' ', 'banana', '2028later', '2028.5', '-2028', '0000']) {
      expect(refreshAlignment(invalid, 2029)).toBe('unknown')
    }
    expect(refreshAlignment(' 2028 ', 2029)).toBe('aligned')
    expect(refreshAlignment('2028', Number.NaN)).toBe('unknown')
  })

  it('keeps raw entries and the same classifications in the current export and saved reload', () => {
    const view = render(<RefreshCycleAlignment />)
    const fields = screen.getAllByRole('textbox', { name: 'Next refresh year' })
    fireEvent.change(fields[0], { target: { value: ' 2025 ' } })
    fireEvent.change(fields[1], { target: { value: '2026' } })
    fireEvent.change(fields[2], { target: { value: '2029' } })
    fireEvent.change(fields[3], { target: { value: '2030' } })
    fireEvent.change(fields[4], { target: { value: '20xx' } })
    expect(screen.getByText('Past date — review schedule')).toBeInTheDocument()
    expect(screen.getAllByText('Within planning window')).toHaveLength(2)
    expect(screen.getByText('After horizon')).toBeInTheDocument()
    expect(screen.getAllByText('Timing unknown')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Save sample alignment' }))
    const saved = useModuleStore.getState().artifacts.executiveDocuments?.[0]
    expect(saved).toBeDefined()
    expect(saved?.inputs).toMatchObject({
      planningHorizonYears: '3',
      rows: [
        { nextRefreshYear: ' 2025 ' },
        { nextRefreshYear: '2026' },
        { nextRefreshYear: '2029' },
        { nextRefreshYear: '2030' },
        { nextRefreshYear: '20xx' },
        { nextRefreshYear: '' },
        { nextRefreshYear: '' },
      ],
      misalignedCount: 1,
    })
    expect(saved?.data).toContain('| Data center hardware | 2025 | Past date — review schedule |')
    expect(saved?.data).toContain('| SD-WAN / network | 2026 | Within planning window |')
    expect(saved?.data).toContain('| PKI / certificate platform | 2030 | After horizon')
    expect(saved?.data).toContain('| HSM replacement | 20xx | Timing unknown |')
    expect(saved?.data).not.toMatch(/On budget|overdue|completed/)
    view.unmount()
    render(<RefreshCycleAlignment />)
    expect(screen.getAllByRole('textbox', { name: 'Next refresh year' })[0]).toHaveValue(' 2025 ')
    expect(screen.getByText('Past date — review schedule')).toBeInTheDocument()
    expect(screen.getAllByText('Within planning window')).toHaveLength(2)
  })

  it('updates the calendar origin and horizon together across New Year on rerender', () => {
    vi.setSystemTime(new Date('2026-12-31T12:00:00Z'))
    const view = render(<RefreshCycleAlignment />)
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Next refresh year' })[0], {
      target: { value: '2026' },
    })
    expect(screen.getByText('Within planning window')).toBeInTheDocument()
    vi.setSystemTime(new Date('2027-01-01T12:00:00Z'))
    view.rerender(<RefreshCycleAlignment />)
    expect(screen.getByText('Past date — review schedule')).toBeInTheDocument()
    expect(screen.getByLabelText('Current sample export').textContent).toContain('through 2030')
    expect(screen.getByLabelText('Current sample export').textContent).toContain(
      'Completion is not recorded'
    )
  })

  it('preserves an explicitly blank horizon through saving without inventing a zero-year window', () => {
    const view = render(<RefreshCycleAlignment />)
    fireEvent.change(screen.getByRole('textbox', { name: /Planning horizon/ }), {
      target: { value: '' },
    })
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Next refresh year' })[0], {
      target: { value: '2026' },
    })
    expect(screen.getAllByText('Timing unknown')).toHaveLength(7)
    expect(screen.getByLabelText('Current sample export').textContent).toContain('through _(TBD)_')
    expect(screen.getByLabelText('Current sample export').textContent).toContain(
      'Planning horizon is not assessed.'
    )
    expect(screen.getByLabelText('Current sample export').textContent).not.toContain(
      'No entered refresh year is after the horizon end.'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save sample alignment' }))
    const saved = useModuleStore.getState().artifacts.executiveDocuments?.[0]
    expect(saved).toBeDefined()
    expect(saved?.inputs).toMatchObject({
      planningHorizonYears: '',
    })
    view.unmount()
    render(<RefreshCycleAlignment />)
    expect(screen.getByRole('textbox', { name: /Planning horizon/ })).toHaveValue('')
    expect(screen.getAllByText('Timing unknown')).toHaveLength(7)
  })
})
