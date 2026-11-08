// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import {
  ComplianceTimelineBuilder,
  type ComplianceTimelineSavedInputs,
} from './ComplianceTimelineBuilder'
import { ComplianceGantt } from './ComplianceGantt'
const sample = vi.hoisted(() => ({
  saved: {
    milestones: [
      {
        id: 'sample-cert',
        label: 'Unrelated sample, certificate',
        year: 2025,
        category: 'Certification',
        completed: true,
      },
    ],
    pinnedDeadlines: ['fw-sample-2030'],
    selectedJurisdictions: ['us'],
  } as ComplianceTimelineSavedInputs,
  add: vi.fn(),
}))
vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    frameworks: [
      {
        id: 'sample',
        label: 'Fictional, obligation',
        deadline: '2030',
        countries: ['United States'],
        enforcementBody: 'Fictional issuer',
        requiresPQC: false,
        libraryRefs: [],
      },
    ],
    countryDeadlines: [],
  }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => sample.saved }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ addExecutiveDocument: sample.add }),
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({
    exportData,
    csvData,
    onExport,
  }: {
    exportData: string
    csvData: string
    onExport: () => void
  }) => (
    <>
      <pre data-testid="markdown">{exportData}</pre>
      <pre data-testid="csv">{csvData}</pre>
      <Button onClick={onExport}>Save sample timeline</Button>
    </>
  ),
}))
beforeEach(() => sample.add.mockClear())
describe('unassociated milestone history remains planning data', () => {
  it('keeps unrelated completed certificates unknown in screen, real CSV and saved/reloaded drafts', () => {
    const before = structuredClone(sample.saved)
    const view = render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute(
      'title',
      'Learner-marked done — obligation satisfaction remains unassessed'
    )
    expect(screen.getByTestId('markdown')).toHaveTextContent('Unknown')
    expect(screen.getByTestId('markdown')).not.toHaveTextContent('Requirement met')
    const csv = Papa.parse<string[]>(screen.getByTestId('csv').textContent ?? '').data
    expect(csv).toContainEqual([
      '2025',
      'Unrelated sample, certificate',
      'Certification',
      'Yes',
      'sample-cert',
      '',
      '[]',
    ])
    expect(
      csv.some(
        (row) =>
          row[0] === 'Fictional, obligation' &&
          row[1] === '2030' &&
          row[2] === 'Unknown' &&
          row[3].includes('no milestone-to-obligation scope')
      )
    ).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save sample timeline' }))
    const doc = sample.add.mock.calls[0][0]
    expect(doc.inputs).toEqual({
      ...before,
      scenarioAsOfYear: 2026,
      milestones: [{ ...before.milestones![0], completed: false }],
    })
    expect(doc.data).toContain('Unknown')
    view.unmount()
    sample.saved = doc.inputs
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByRole('button', { name: 'Mark done' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(sample.saved.pinnedDeadlines).toEqual(['fw-sample-2030'])
  })
  it('renders a pinned unknown obligation marker with a neutral explicit label', () => {
    render(
      <ComplianceGantt
        rows={[]}
        milestones={[]}
        complianceDeadlines={[
          { key: 'sample', label: 'Fictional obligation', year: 2030, status: 'unknown' },
        ]}
        yearRange={[2029, 2031]}
        onPhaseClick={() => undefined}
      />
    )
    const marker = screen.getByRole('img', {
      name: 'Fictional obligation: 2030 — Obligation satisfaction not assessed',
    })
    expect(marker).toHaveAttribute(
      'title',
      'Fictional obligation: 2030 — Obligation satisfaction not assessed'
    )
    expect(marker).not.toHaveClass('text-status-success')
  })
})
