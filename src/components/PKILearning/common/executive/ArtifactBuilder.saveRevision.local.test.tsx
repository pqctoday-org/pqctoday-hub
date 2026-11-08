// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ArtifactBuilder, type ArtifactSection } from './ArtifactBuilder'
import { ARTIFACT_AUTOSAVE_DELAY_MS } from './ExportableArtifact'

afterEach(() => vi.useRealTimers())

const sections: ArtifactSection[] = [
  {
    id: 'sample',
    title: 'Sample',
    fields: [{ id: 'name', label: 'Name', type: 'text', defaultValue: 'Fictional draft' }],
  },
]

describe('ArtifactBuilder caller-owned save inputs', () => {
  it('autosaves an opted-in rules revision after a real interaction without changing form fields', () => {
    vi.useFakeTimers()
    const onExport = vi.fn()
    const view = render(
      <ArtifactBuilder
        title="Sample"
        sections={sections}
        onExport={onExport}
        saveRevision="rules-one"
      />
    )
    act(() => window.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    view.rerender(
      <ArtifactBuilder
        title="Sample"
        sections={sections}
        onExport={onExport}
        saveRevision="rules-two"
      />
    )
    act(() => vi.advanceTimersByTime(ARTIFACT_AUTOSAVE_DELAY_MS + 1))
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport.mock.lastCall?.[0]).toEqual({ sample: { name: 'Fictional draft' } })
  })

  it('saves a changed external revision with identical form fields and still deduplicates unchanged saves', () => {
    const onExport = vi.fn()
    const view = render(
      <ArtifactBuilder
        title="Sample"
        sections={sections}
        onExport={onExport}
        saveRevision="rules-one"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onExport).toHaveBeenCalledTimes(1)
    const payload = onExport.mock.lastCall?.[0]
    view.rerender(
      <ArtifactBuilder
        title="Sample"
        sections={sections}
        onExport={onExport}
        saveRevision="rules-two"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Saved · edited since' }))
    expect(onExport).toHaveBeenCalledTimes(2)
    expect(onExport.mock.lastCall?.[0]).toEqual(payload)
    fireEvent.click(screen.getByRole('button', { name: 'Saved' }))
    expect(onExport).toHaveBeenCalledTimes(2)
  })

  it('keeps existing form-only save identity when callers omit the optional revision', () => {
    const first = vi.fn(),
      second = vi.fn()
    const view = render(<ArtifactBuilder title="Sample" sections={sections} onExport={first} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    view.rerender(<ArtifactBuilder title="Sample" sections={sections} onExport={second} />)
    fireEvent.click(screen.getByRole('button', { name: 'Saved' }))
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()
  })
})
