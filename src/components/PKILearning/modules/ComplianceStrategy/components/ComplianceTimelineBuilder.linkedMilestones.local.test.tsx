// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import {
  ComplianceTimelineBuilder,
  type ComplianceTimelineSavedInputs,
} from './ComplianceTimelineBuilder'
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
const legacy: ComplianceTimelineSavedInputs = structuredClone(sample.saved)
beforeEach(() => {
  sample.add.mockClear()
  sample.saved = structuredClone(legacy)
})
describe('linked sample plan inputs and real serialized outputs', () => {
  it('links explicitly, requires actual completion timing, and saves/reopens exact keys and dates', () => {
    const view = render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    const group = screen.getByRole('group', {
      name: 'Explicit reference associations for Unrelated sample, certificate',
    })
    fireEvent.click(within(group).getByRole('checkbox'))
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    fireEvent.change(
      screen.getByLabelText('Recorded completion year for Unrelated sample, certificate'),
      { target: { value: '2025' } }
    )
    expect(screen.getByText('Recorded by reference year')).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: 'Fictional, obligation: 2030 — Recorded by reference year' })
    ).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('Sample scenario as-of year: 2026')
    const csv = Papa.parse<string[]>(screen.getByTestId('csv').textContent ?? '').data
    expect(csv).toContainEqual([
      '2025',
      'Unrelated sample, certificate',
      'Certification',
      'Yes',
      'sample-cert',
      '2025',
      '["fw-sample-2030"]',
    ])
    expect(csv).toContainEqual([
      'Fictional, obligation',
      '2030',
      'COMPLETED',
      'Recorded by reference year',
      expect.stringContaining('exact dated deadline'),
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Save sample timeline' }))
    const doc = sample.add.mock.calls[0][0]
    expect(doc.inputs.milestones[0]).toEqual({
      ...legacy.milestones![0],
      obligationKeys: ['fw-sample-2030'],
      completedYear: 2025,
    })
    expect(doc.inputs.scenarioAsOfYear).toBe(2026)
    expect(doc.data).toContain('Recorded by reference year')
    view.unmount()
    sample.saved = doc.inputs
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByRole('checkbox')).toBeChecked()
    expect(
      screen.getByLabelText('Recorded completion year for Unrelated sample, certificate')
    ).toHaveValue(2025)
    expect(screen.getByText('Recorded by reference year')).toBeInTheDocument()
  })
  it('keeps future completion unknown until the explicit scenario year permits it, then shows late records', () => {
    sample.saved = {
      ...legacy,
      milestones: [
        { ...legacy.milestones![0], obligationKeys: ['fw-sample-2030'], completedYear: 2031 },
      ],
    }
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('inconsistent future completion')
    fireEvent.change(screen.getByLabelText('Sample scenario as-of year'), {
      target: { value: '2031' },
    })
    expect(screen.getByText('Late plan/record')).toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('Late plan/record')
    expect(Papa.parse<string[]>(screen.getByTestId('csv').textContent ?? '').data).toContainEqual([
      'Sample scenario as-of year',
      '2031',
    ])
  })
  it('does not lose unknown or unselected keys or unrelated legacy fields when editing and saving', () => {
    const old = {
      ...legacy.milestones![0],
      obligationKeys: ['removed,key', 'fw-hidden-2030'],
      completedYear: 2025,
      quarter: 2 as const,
      oldField: 'keep me',
    }
    sample.saved = { ...legacy, milestones: [old] }
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByText(/Preserved reference key.*removed,key/)).toBeInTheDocument()
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Save sample timeline' }))
    expect(sample.add.mock.calls[0][0].inputs.milestones[0]).toEqual({
      ...old,
      obligationKeys: ['removed,key', 'fw-hidden-2030', 'fw-sample-2030'],
    })
    const rows = Papa.parse<string[]>(screen.getByTestId('csv').textContent ?? '').data
    expect(rows.some((r) => r[6] === '["removed,key","fw-hidden-2030","fw-sample-2030"]')).toBe(
      true
    )
  })
  it('adds unique identities even with the same label, then preserves every other record on removal', () => {
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    const input = screen.getByLabelText('Milestone')
    fireEvent.change(input, { target: { value: 'Duplicate' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.change(input, { target: { value: 'Duplicate' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save sample timeline' }))
    const records = sample.add.mock.calls[0][0].inputs.milestones
    expect(new Set(records.map((m: { id: string }) => m.id)).size).toBe(3)
    expect(records.filter((m: { label: string }) => m.label === 'Duplicate')).toHaveLength(2)
    fireEvent.click(screen.getAllByRole('button', { name: 'Remove Duplicate' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Save sample timeline' }))
    expect(sample.add.mock.calls[1][0].inputs.milestones).toHaveLength(2)
  })
  it('does not let one marked-done activity hide a second planned activity', () => {
    sample.saved = {
      ...legacy,
      milestones: [
        { ...legacy.milestones![0], obligationKeys: ['fw-sample-2030'], completedYear: 2025 },
        {
          id: 'second',
          label: 'Unfinished',
          year: 2029,
          obligationKeys: ['fw-sample-2030'],
          completed: false,
        },
      ],
    }
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByText('Planned by reference year')).toBeInTheDocument()
    expect(screen.queryByText('Recorded by reference year')).not.toBeInTheDocument()
    expect(screen.getByTestId('markdown')).toHaveTextContent('planned work is not delivered work')
  })
  it('preserves an explicitly blank scenario as unknown through save and reopen', () => {
    sample.saved = {
      ...legacy,
      milestones: [
        { ...legacy.milestones![0], obligationKeys: ['fw-sample-2030'], completedYear: 2025 },
      ],
    }
    const view = render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    fireEvent.change(screen.getByLabelText('Sample scenario as-of year'), { target: { value: '' } })
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Save sample timeline' }))
    expect(sample.add.mock.calls[0][0].inputs.scenarioAsOfYear).toBeNull()
    sample.saved = sample.add.mock.calls[0][0].inputs
    view.unmount()
    render(<ComplianceTimelineBuilder selectedJurisdictions={['us']} />)
    expect(screen.getByLabelText('Sample scenario as-of year')).toHaveValue(null)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })
})
