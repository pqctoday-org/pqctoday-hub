// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ReportToc } from './ReportToc'

const SECTIONS = [
  { id: 'report-section-a', label: 'Section A' },
  { id: 'report-section-b', label: 'Section B' },
]

let capturedCallback: IntersectionObserverCallback | null = null

class MockIntersectionObserver {
  constructor(cb: IntersectionObserverCallback) {
    capturedCallback = cb
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

describe('ReportToc — mobile dropdown tracks scroll position', () => {
  beforeEach(() => {
    capturedCallback = null
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('mobile select defaults to the placeholder before any section intersects', () => {
    render(<ReportToc sections={SECTIONS} onExpandAll={vi.fn()} onCollapseAll={vi.fn()} />)
    const select = screen.getByLabelText('Jump to section') as HTMLSelectElement
    expect(select.value).toBe('')
  })

  it('mobile select value updates to match the section the IntersectionObserver reports active', () => {
    render(<ReportToc sections={SECTIONS} onExpandAll={vi.fn()} onCollapseAll={vi.fn()} />)
    const select = screen.getByLabelText('Jump to section') as HTMLSelectElement

    expect(capturedCallback).not.toBeNull()
    act(() => {
      capturedCallback!(
        [{ isIntersecting: true, target: { id: 'report-section-b' } } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    })

    expect(select.value).toBe('report-section-b')
  })

  it('desktop rail highlights the same active section as the mobile select', () => {
    render(<ReportToc sections={SECTIONS} onExpandAll={vi.fn()} onCollapseAll={vi.fn()} />)
    act(() => {
      capturedCallback!(
        [{ isIntersecting: true, target: { id: 'report-section-a' } } as IntersectionObserverEntry],
        {} as IntersectionObserver
      )
    })
    // Desktop rail button for the active section carries the active styling class.
    const activeButtons = screen.getAllByText('Section A')
    expect(
      activeButtons.some((el) => el.closest('button')?.className.includes('text-primary'))
    ).toBe(true)
  })
})
