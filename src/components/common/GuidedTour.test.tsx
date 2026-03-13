// SPDX-License-Identifier: GPL-3.0-only
import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GuidedTour } from './GuidedTour'
import { useDisclaimerStore, getAppMajorVersion } from '../../store/useDisclaimerStore'

// Mock framer-motion so AnimatePresence transitions are synchronous in tests.
// Without this, AnimatePresence mode="wait" holds exiting elements in the DOM
// until RAF-driven animations complete, which never happens in the jsdom environment.
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      className,
      onClick,
      style,
    }: {
      children?: React.ReactNode
      className?: string
      onClick?: React.MouseEventHandler
      style?: React.CSSProperties
      [key: string]: unknown
    }) => (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div className={className} onClick={onClick} style={style}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const TOUR_STORAGE_KEY = 'pqc-tour-completed'

/** Advance past the intro slides (3) and click through the knowledge gate */
function advancePastIntro(gateChoice: 'learning' | 'basics' | 'expert' = 'learning') {
  // 3 intro slides — click Next 3 times to reach the gate
  for (let i = 0; i < 3; i++) {
    const nextBtns = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns[0])
  }

  // Knowledge gate — click the appropriate choice
  const labels: Record<string, RegExp> = {
    learning: /I'm just learning/i,
    basics: /I know the basics/i,
    expert: /I'm an expert/i,
  }
  const choiceBtn = screen.getByText(labels[gateChoice])
  fireEvent.click(choiceBtn)
}

describe('GuidedTour', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    // Seed the disclaimer store as acknowledged so the tour's disclaimer gate
    // doesn't block activation (GuidedTour requires isDisclaimerDone = true)
    useDisclaimerStore.setState({ acknowledgedMajorVersion: getAppMajorVersion() })
    Object.defineProperty(window, 'location', {
      value: { search: '' },
      writable: true,
    })

    const dummyTargets = [
      'a[href="/assess"]',
      'a[href="/report"]',
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
    useDisclaimerStore.setState({ acknowledgedMajorVersion: null })
  })

  it('does not show if already completed', () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Everything runs on encryption')).not.toBeInTheDocument()
  })

  it('shows intro slides automatically if not completed', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    // First intro slide should be visible
    expect(screen.queryAllByText('Everything runs on encryption').length).toBeGreaterThan(0)
  })

  it('forces show if ?tour query param is present', () => {
    localStorage.setItem(TOUR_STORAGE_KEY, 'true')
    window.location.search = '?tour=1'

    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(screen.queryAllByText('Everything runs on encryption').length).toBeGreaterThan(0)
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBeNull()
  })

  it('navigates through intro slides to knowledge gate', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    // Intro slide 1
    expect(screen.queryAllByText('Everything runs on encryption').length).toBeGreaterThan(0)

    // Next → slide 2
    const nextBtns1 = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns1[0])
    expect(screen.queryAllByText('Quantum computers change everything').length).toBeGreaterThan(0)

    // Next → slide 3
    const nextBtns2 = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns2[0])
    expect(screen.queryAllByText(/The solution exists/).length).toBeGreaterThan(0)

    // Next → knowledge gate
    const nextBtns3 = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns3[0])
    expect(screen.queryAllByText(/How familiar are you/).length).toBeGreaterThan(0)
  })

  it('shows full feature tour after "I\'m just learning" gate choice', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    advancePastIntro('learning')

    // Should now show first feature step: Learning Modules
    expect(screen.queryAllByText('Learning Modules').length).toBeGreaterThan(0)
  })

  it('shows shortened tour after "I know the basics" gate choice', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    advancePastIntro('basics')

    // Should show Learning Modules (first essential slide)
    expect(screen.queryAllByText('Learning Modules').length).toBeGreaterThan(0)

    // Navigate through essential steps (6: learn, timeline, assess, report, assistant, glossary)
    const nextBtns1 = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns1[0])
    expect(screen.queryAllByText('Migration Timeline').length).toBeGreaterThan(0)
  })

  it('dismisses tour when "I\'m an expert" is chosen', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    advancePastIntro('expert')

    expect(screen.queryByText('Risk Assessment')).not.toBeInTheDocument()
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
  })

  it('can navigate through feature steps using next/prev buttons', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    advancePastIntro('learning')

    // Step 1: Learning Modules
    expect(screen.queryAllByText('Learning Modules').length).toBeGreaterThan(0)

    // Click next
    const nextBtns = screen.getAllByRole('button', { name: /Next/i })
    fireEvent.click(nextBtns[0])

    // Step 2: Migration Timeline
    expect(screen.queryAllByText('Migration Timeline').length).toBeGreaterThan(0)

    // Click prev
    const prevBtns = screen.getAllByRole('button', { name: /Previous/i })
    fireEvent.click(prevBtns[0])

    // Back to Step 1
    expect(screen.queryAllByText('Learning Modules').length).toBeGreaterThan(0)
  })

  it('dismisses the tour and sets localStorage item', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    const dismissBtns = screen.getAllByRole('button', { name: /Dismiss tour/i })
    fireEvent.click(dismissBtns[0])

    expect(screen.queryByText('Everything runs on encryption')).not.toBeInTheDocument()
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
  })

  it('finishes the full feature tour on the last step', () => {
    render(<GuidedTour />)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    advancePastIntro('learning')

    // Navigate to the final step — 14 feature steps, click next 13 times
    for (let i = 0; i < 13; i++) {
      const nextBtns = screen.getAllByRole('button', { name: /Next/i })
      fireEvent.click(nextBtns[0])
    }

    // Step 14: Glossary
    expect(screen.queryAllByText('Glossary').length).toBeGreaterThan(0)

    const doneBtns = screen.getAllByRole('button', { name: /Done|Get Started/i })
    fireEvent.click(doneBtns[0])

    expect(screen.queryByText('Glossary')).not.toBeInTheDocument()
    expect(localStorage.getItem(TOUR_STORAGE_KEY)).toBe('true')
  })
})
