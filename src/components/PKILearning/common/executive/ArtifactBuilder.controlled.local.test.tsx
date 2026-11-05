// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArtifactBuilder, type ArtifactFormData, type ArtifactSection } from './ArtifactBuilder'
import { ARTIFACT_AUTOSAVE_DELAY_MS } from './ExportableArtifact'
import { Button } from '@/components/ui/button'

const sections: ArtifactSection[] = [
  {
    id: 'sample',
    title: 'Sample',
    fields: [
      {
        id: 'topics',
        label: 'Topics',
        type: 'checklist',
        options: [
          { value: 'a', label: 'Sample A' },
          { value: 'b', label: 'Sample B' },
        ],
        defaultValue: ['a'],
      },
      { id: 'notes', label: 'Sample note', type: 'textarea', defaultValue: 'Default note' },
    ],
  },
]
afterEach(() => vi.useRealTimers())

function Controlled({ save = vi.fn(), edits = vi.fn() }) {
  const [data, setData] = useState<ArtifactFormData>({
    sample: { topics: [], notes: 'Learner note' },
  })
  return (
    <>
      <Button
        onClick={() => setData((prev) => ({ ...prev, sample: { ...prev.sample, topics: [] } }))}
      >
        Clear topics
      </Button>
      <ArtifactBuilder
        title="Controlled sample"
        sections={sections}
        onExport={save}
        controlledForm={{
          value: data,
          onChange: (update, edit) => {
            edits(edit)
            setData(update)
          },
        }}
      />
    </>
  )
}

describe('ArtifactBuilder opt-in controlled draft', () => {
  it('uses caller values, reports only actual edits, and preserves notes through external clearing without remount', () => {
    const save = vi.fn(),
      edits = vi.fn()
    render(<Controlled save={save} edits={edits} />)
    expect(screen.getByRole('checkbox', { name: 'Sample A' })).not.toBeChecked()
    expect(screen.getByLabelText('Sample note')).toHaveValue('Learner note')
    expect(edits).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sample A' }))
    expect(edits).toHaveBeenLastCalledWith({
      sectionId: 'sample',
      fieldId: 'topics',
      optionValue: 'a',
    })
    fireEvent.change(screen.getByLabelText('Sample note'), {
      target: { value: 'Edited, "sample"\nnote' },
    })
    expect(edits).toHaveBeenLastCalledWith({ sectionId: 'sample', fieldId: 'notes' })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(save.mock.lastCall![0]).toEqual({
      sample: { topics: ['a'], notes: 'Edited, "sample"\nnote' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.queryByLabelText('Sample note')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear topics' }))
    expect(screen.queryByLabelText('Sample note')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('checkbox', { name: 'Sample A' })).not.toBeChecked()
    expect(screen.getByLabelText('Sample note')).toHaveValue('Edited, "sample"\nnote')
    fireEvent.click(screen.getByRole('button', { name: 'Saved · edited since' }))
    expect(save.mock.lastCall![0]).toEqual({
      sample: { topics: [], notes: 'Edited, "sample"\nnote' },
    })
    expect(edits).toHaveBeenCalledTimes(2)
  })
  it('applies batched updater edits to the latest caller state and autosaves final data', () => {
    vi.useFakeTimers()
    const save = vi.fn()
    render(<Controlled save={save} />)
    act(() => window.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    // eslint-disable-next-line testing-library/no-unnecessary-act -- Deliberately batch edits and clear before a render to exercise latest-state ownership updates.
    act(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sample A' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sample B' }))
      fireEvent.click(screen.getByRole('button', { name: 'Clear topics' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sample B' }))
    })
    act(() => vi.advanceTimersByTime(ARTIFACT_AUTOSAVE_DELAY_MS + 1))
    expect(save.mock.lastCall![0]).toEqual({ sample: { topics: ['b'], notes: 'Learner note' } })
  })
  it('keeps omitted controlledForm defaults and unchanged save deduplication', () => {
    const save = vi.fn()
    render(<ArtifactBuilder title="Uncontrolled neighbor" sections={sections} onExport={save} />)
    expect(screen.getByRole('checkbox', { name: 'Sample A' })).toBeChecked()
    expect(screen.getByLabelText('Sample note')).toHaveValue('Default note')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    fireEvent.click(screen.getByRole('button', { name: 'Saved' }))
    expect(save).toHaveBeenCalledTimes(1)
    expect(save.mock.lastCall![0]).toEqual({ sample: { topics: ['a'], notes: 'Default note' } })
  })
})
