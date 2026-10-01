import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { act, render, screen, fireEvent } from '@testing-library/react'
import { ShareButton } from './ShareButton'

vi.mock('../../embed/platform', () => ({ isNativeApp: () => false }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn() } }))

// Regression (30 Sep): the 2 s "Copied" reset timer was never cleared, so it fired
// after unmount and, in the test run, after jsdom teardown ("window is not
// defined", an unhandled error that failed a pr-test shard).
describe('ShareButton copied-reset timer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('clears the reset timer when the button unmounts after copying', async () => {
    const { unmount } = render(<ShareButton title="FIPS 203" url="/library?ref=FIPS%20203" />)
    fireEvent.click(screen.getByRole('button', { name: 'Share FIPS 203' }))
    const before = vi.getTimerCount()
    fireEvent.click(screen.getByRole('button', { name: /Copy link/ }))
    // flush the awaited clipboard write so the reset timer has been scheduled
    await act(async () => {
      await Promise.resolve()
    })
    expect(vi.getTimerCount()).toBeGreaterThan(before) // the reset timer is pending
    unmount()
    expect(vi.getTimerCount()).toBe(0) // cleared on unmount, nothing left to fire later
  })

  it('still resets the label after 2 s while mounted', async () => {
    render(<ShareButton title="FIPS 203" url="/library?ref=FIPS%20203" />)
    fireEvent.click(screen.getByRole('button', { name: 'Share FIPS 203' }))
    fireEvent.click(screen.getByRole('button', { name: /Copy link/ }))
    // flush the awaited clipboard write so the reset timer has been scheduled
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      vi.advanceTimersByTime(2100)
    })
    expect(vi.getTimerCount()).toBe(0)
  })
})
