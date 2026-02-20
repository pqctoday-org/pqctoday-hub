import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GuidedTour } from './GuidedTour'

const TOUR_STORAGE_KEY = 'pqc-tour-completed'

describe('GuidedTour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    // Mock window location search
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    })

    // Create dummy elements for all tour targets
    const dummyTargets = [
      'a[href="/assess"]',
      'a[href="/learn"]',
      'a[href="/timeline"]',
      'a[href="/threats"]',
      'a[href="/algorithms"]',
      'a[href="/library"]',
      'a[href="/migrate"]',
      'a[href="/playground"]',
      'a[href="/openssl"]',
      'a[href="/compliance"]',
      'a[href="/leaders"]',
      'button[aria-label="Open glossary"]',
    ]
    dummyTargets.forEach((selector) => {
      const el = selector.startsWith('button')
        ? document.createElement('button')
        : document.createElement('a')

      if (selector.startsWith('button')) {
        el.setAttribute('aria-label', 'Open glossary')
      } else {
        el.setAttribute('href', selector.match(/href="([^"]+)"/)?.[1] || '')
      }

      el.className = 'dummy-target'
      el.scrollIntoView = vi.fn()
      document.body.appendChild(el)
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('does not show if already completed', () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Risk Assessment')).not.toBeInTheDocument()
  })

  it('shows automatically if not completed', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(screen.queryAllByText('Risk Assessment').length).toBeGreaterThan(0)
  })

  it('forces show if ?tour query param is present', () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    window.location.search = '?tour=1'

    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(screen.queryAllByText('Risk Assessment').length).toBeGreaterThan(0)
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBeNull()
  })

  it('can navigate through steps using next/prev buttons', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    // Step 1: Risk Assessment
    expect(screen.queryAllByText('Risk Assessment').length).toBeGreaterThan(0)

    // Click next (select one of the next buttons, since there's desktop and mobile)
    const nextBtns = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns[0])

    // Step 2: Learning Modules
    expect(screen.queryAllByText('Learning Modules').length).toBeGreaterThan(0)

    // Click prev
    const prevBtns = screen.getAllByRole('button', { name: /Previous step/i })
    fireEvent.click(prevBtns[0])

    // Back to Step 1
    expect(screen.queryAllByText('Risk Assessment').length).toBeGreaterThan(0)
  })

  it('dismisses the tour and sets localStorage item', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    const dismissBtns = screen.getAllByRole('button', { name: /Dismiss tour/i })
    fireEvent.click(dismissBtns[0])

    expect(screen.queryByText('Risk Assessment')).not.toBeInTheDocument()
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
  })

  it('finishes the tour on the last step', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    // Navigate to the final step
    // There are 12 steps, so click next 11 times.
    for (let i = 0; i < 11; i++) {
      const nextBtns = screen.getAllByRole('button', { name: /Next/i })
      fireEvent.click(nextBtns[0])
    }

    // Step 12: Glossary
    expect(screen.queryAllByText('Glossary').length).toBeGreaterThan(0)

    const doneBtns = screen.getAllByRole('button', { name: /Done|Get Started/i })
    fireEvent.click(doneBtns[0])

    expect(screen.queryByText('Glossary')).not.toBeInTheDocument()
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
  })
})
