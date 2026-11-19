// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Autosave contract for the shared executive-artifact components (WS6).
 *
 * The defect these guard against is invisible to a render assertion: before
 * WS6 the only path to `onExport` was an export-adjacent click, so an
 * in-progress edit died on navigation. These tests pin the four properties
 * the fix has to hold — it fires after the debounce, it never fires without
 * `onExport`, it never fires twice for one edit, and an explicit Save cancels
 * the pending timer rather than racing it.
 */
import { render, screen, act, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ARTIFACT_AUTOSAVE_DELAY_MS, ExportableArtifact } from './ExportableArtifact'
import { ArtifactBuilder } from './ArtifactBuilder'
import type { ArtifactSection } from './ArtifactBuilder'
import * as clipboard from '@/utils/clipboard'
import * as pdfExport from '@/services/export/pdfExport'

/** The autosave only follows a real interaction, never the artifact's own
 *  data settling after mount — simulate the user touching the page. */
function userTouchesPage(): void {
  act(() => {
    window.dispatchEvent(new Event('pointerdown', { bubbles: true }))
  })
}

function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe('ExportableArtifact autosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('saves an edit after the debounce without any export click', () => {
    const onExport = vi.fn()
    const { rerender } = render(
      <ExportableArtifact title="T" exportData="v1" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    userTouchesPage()
    expect(onExport).not.toHaveBeenCalled()

    rerender(
      <ExportableArtifact title="T" exportData="v2" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    advance(ARTIFACT_AUTOSAVE_DELAY_MS - 1)
    expect(onExport).not.toHaveBeenCalled()

    advance(2)
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('does not save when the artifact re-computes after mount with no user interaction', () => {
    // Several tools recompute `exportData` shortly after mount as upstream
    // catalog/assessment data resolves. That is not an edit — saving on it
    // would record artifacts the user never touched.
    const onExport = vi.fn()
    const { rerender } = render(
      <ExportableArtifact title="T" exportData="v1" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    rerender(
      <ExportableArtifact title="T" exportData="v2-from-async-data" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    advance(ARTIFACT_AUTOSAVE_DELAY_MS * 3)
    expect(onExport).not.toHaveBeenCalled()
  })

  it('does not fire twice for content that has not changed since the last save', () => {
    const onExport = vi.fn()
    const { rerender } = render(
      <ExportableArtifact title="T" exportData="v1" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    userTouchesPage()
    rerender(
      <ExportableArtifact title="T" exportData="v2" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    advance(ARTIFACT_AUTOSAVE_DELAY_MS + 10)
    expect(onExport).toHaveBeenCalledTimes(1)

    // Re-render with identical content, then idle well past another interval.
    rerender(
      <ExportableArtifact title="T" exportData="v2" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    advance(ARTIFACT_AUTOSAVE_DELAY_MS * 3)
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('never fires when no onExport prop is passed', () => {
    // DataDrivenScorecard renders an ExportableArtifact with no onExport; the
    // autosave must stay inert there rather than throwing or scheduling work.
    const { rerender } = render(
      <ExportableArtifact title="T" exportData="v1">
        <p>body</p>
      </ExportableArtifact>
    )
    userTouchesPage()
    rerender(
      <ExportableArtifact title="T" exportData="v2">
        <p>body</p>
      </ExportableArtifact>
    )
    expect(() => advance(ARTIFACT_AUTOSAVE_DELAY_MS * 2)).not.toThrow()
    expect(screen.queryByRole('button', { name: /^Save/ })).toBeNull()
  })

  it('flushes a pending write when the artifact unmounts mid-debounce', () => {
    const onExport = vi.fn()
    const { rerender, unmount } = render(
      <ExportableArtifact title="T" exportData="v1" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    userTouchesPage()
    rerender(
      <ExportableArtifact title="T" exportData="v2" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    advance(100) // well inside the debounce window
    expect(onExport).not.toHaveBeenCalled()

    act(() => unmount())
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('an explicit Save cancels the pending timer instead of racing it', () => {
    const onExport = vi.fn()
    const { rerender } = render(
      <ExportableArtifact title="T" exportData="v1" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    userTouchesPage()
    rerender(
      <ExportableArtifact title="T" exportData="v2" onExport={onExport}>
        <p>body</p>
      </ExportableArtifact>
    )
    advance(100)
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    expect(onExport).toHaveBeenCalledTimes(1)

    advance(ARTIFACT_AUTOSAVE_DELAY_MS * 2)
    expect(onExport).toHaveBeenCalledTimes(1)
  })
})

describe('ExportableArtifact saves the current revision', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('ignores an older clipboard completion after saving a revised report', async () => {
    let finishCopy!: (ok: boolean) => void
    const copy = vi.spyOn(clipboard, 'copyToClipboard').mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishCopy = resolve
      })
    )
    const onExport = vi.fn()
    const report = (markdown: string) => (
      <ExportableArtifact title="T" exportData={markdown} onExport={() => onExport(markdown)}>
        <p>body</p>
      </ExportableArtifact>
    )
    const { rerender } = render(report('Original scope'))
    fireEvent.click(screen.getByRole('button', { name: /^Copy$/ }))
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('Original scope'))

    rerender(report('Revised scope'))
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    await act(async () => finishCopy(true))
    expect(onExport.mock.calls).toEqual([['Revised scope']])
    expect(screen.getByRole('button', { name: /^Copy$/ })).toBeInTheDocument()
  })

  it('never writes an old PDF export to the store after leaving its edit', async () => {
    let finishPdf!: () => void
    const download = vi.spyOn(pdfExport, 'markdownToPdf').mockReturnValue(
      new Promise<void>((resolve) => {
        finishPdf = resolve
      })
    )
    const onExport = vi.fn()
    const report = (markdown: string) => (
      <ExportableArtifact
        title="T"
        exportData={markdown}
        formats={['pdf']}
        onExport={() => onExport(markdown)}
      >
        <p>body</p>
      </ExportableArtifact>
    )
    const { rerender, unmount } = render(report('Original scope'))
    fireEvent.click(screen.getByRole('button', { name: /^\.pdf$/ }))
    expect(download.mock.calls[0][0]).toContain('Original scope')

    userTouchesPage()
    rerender(report('Revised scope'))
    unmount()
    await act(async () => finishPdf())
    expect(onExport.mock.calls).toEqual([['Revised scope']])
  })

  it('persists changes to structured CSV even when Markdown remains the same', () => {
    const onExport = vi.fn()
    const report = (csvData: string) => (
      <ExportableArtifact
        title="T"
        exportData="Same report title"
        csvData={csvData}
        onExport={() => onExport(csvData)}
      >
        <p>body</p>
      </ExportableArtifact>
    )
    const { rerender } = render(report('coverage,31'))
    fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
    userTouchesPage()
    rerender(report('coverage,32'))
    advance(ARTIFACT_AUTOSAVE_DELAY_MS + 1)
    expect(onExport.mock.calls).toEqual([['coverage,31'], ['coverage,32']])
  })
})

describe('ArtifactBuilder autosave (Edit mode)', () => {
  const SECTIONS: ArtifactSection[] = [
    {
      id: 'main',
      title: 'Main',
      fields: [{ id: 'owner', label: 'Owner', type: 'text' }],
    },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('saves a typed field after the debounce while still in Edit mode', () => {
    const onExport = vi.fn()
    render(<ArtifactBuilder title="T" sections={SECTIONS} onExport={onExport} />)

    fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'Ada' } })
    advance(ARTIFACT_AUTOSAVE_DELAY_MS - 1)
    expect(onExport).not.toHaveBeenCalled()

    advance(2)
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport.mock.calls[0][0]).toEqual({ main: { owner: 'Ada' } })
  })

  it('does not fire again while the form is untouched', () => {
    const onExport = vi.fn()
    render(<ArtifactBuilder title="T" sections={SECTIONS} onExport={onExport} />)
    fireEvent.change(screen.getByLabelText('Owner'), { target: { value: 'Ada' } })
    advance(ARTIFACT_AUTOSAVE_DELAY_MS + 10)
    advance(ARTIFACT_AUTOSAVE_DELAY_MS * 3)
    expect(onExport).toHaveBeenCalledTimes(1)
  })

  it('restores a previously saved snapshot through initialData', () => {
    render(
      <ArtifactBuilder
        title="T"
        sections={SECTIONS}
        onExport={vi.fn()}
        initialData={{ main: { owner: 'Restored' } }}
      />
    )
    expect(screen.getByLabelText('Owner')).toHaveValue('Restored')
  })
})
