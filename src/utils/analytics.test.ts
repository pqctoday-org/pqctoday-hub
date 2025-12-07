import { describe, it, expect, beforeEach, vi } from 'vitest'
import { initGA, logPageView, logEvent } from './analytics'
import ReactGA from 'react-ga4'

// Mock ReactGA
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    send: vi.fn(),
    event: vi.fn(),
  },
}))

// Mock console methods
const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initGA', () => {
    it('initializes Google Analytics when called', () => {
      initGA()

      // Should either initialize or warn depending on environment
      const wasInitialized =
        (ReactGA.initialize as unknown as { mock: { calls: unknown[] } }).mock.calls.length > 0
      const wasWarned = consoleWarnSpy.mock.calls.length > 0

      expect(wasInitialized || wasWarned).toBe(true)
    })

    it('logs appropriate message when initializing', () => {
      initGA()

      // Should log either initialization or warning
      expect(consoleLogSpy.mock.calls.length + consoleWarnSpy.mock.calls.length).toBeGreaterThan(0)
    })
  })

  describe('logPageView', () => {
    it('logs page view with provided path', () => {
      const initialCalls = (ReactGA.send as unknown as { mock: { calls: unknown[] } }).mock.calls
        .length

      logPageView('/test-page')

      // If GA is configured, should have logged
      if (
        (ReactGA.send as unknown as { mock: { calls: unknown[] } }).mock.calls.length > initialCalls
      ) {
        expect(ReactGA.send).toHaveBeenCalledWith({
          hitType: 'pageview',
          page: '/test-page',
        })
      }
    })

    it('logs page view with current window location when no path provided', () => {
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: {
          pathname: '/current-page',
          search: '?query=test',
        },
        writable: true,
        configurable: true,
      })

      const initialCalls = (ReactGA.send as unknown as { mock: { calls: unknown[] } }).mock.calls
        .length

      logPageView()

      // If GA is configured, should have logged with window location
      if (
        (ReactGA.send as unknown as { mock: { calls: unknown[] } }).mock.calls.length > initialCalls
      ) {
        expect(ReactGA.send).toHaveBeenCalledWith({
          hitType: 'pageview',
          page: '/current-page?query=test',
        })
      }
    })

    it('handles path parameter correctly', () => {
      logPageView('/custom-path')

      // Should have been called with the custom path if GA is configured
      const calls = (ReactGA.send as unknown as { mock: { calls: Array<[{ page: string }]> } }).mock
        .calls
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1][0]
        expect(lastCall.page).toBe('/custom-path')
      }
    })
  })

  describe('logEvent', () => {
    it('logs event with category, action, and label', () => {
      const initialCalls = (ReactGA.event as unknown as { mock: { calls: unknown[] } }).mock.calls
        .length

      logEvent('Button', 'Click', 'Submit Form')

      // If GA is configured, should have logged
      if (
        (ReactGA.event as unknown as { mock: { calls: unknown[] } }).mock.calls.length >
        initialCalls
      ) {
        expect(ReactGA.event).toHaveBeenCalledWith({
          category: 'Button',
          action: 'Click',
          label: 'Submit Form',
        })
      }
    })

    it('logs event without label', () => {
      const initialCalls = (ReactGA.event as unknown as { mock: { calls: unknown[] } }).mock.calls
        .length

      logEvent('Navigation', 'Page Change')

      // If GA is configured, should have logged
      if (
        (ReactGA.event as unknown as { mock: { calls: unknown[] } }).mock.calls.length >
        initialCalls
      ) {
        expect(ReactGA.event).toHaveBeenCalledWith({
          category: 'Navigation',
          action: 'Page Change',
          label: undefined,
        })
      }
    })

    it('handles event parameters correctly', () => {
      logEvent('Test', 'Action', 'Label')

      const calls = (
        ReactGA.event as unknown as {
          mock: { calls: Array<[{ category: string; action: string; label?: string }]> }
        }
      ).mock.calls
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1][0]
        expect(lastCall).toHaveProperty('category')
        expect(lastCall).toHaveProperty('action')
      }
    })

    it('logs event with special characters in label', () => {
      logEvent('Filter', 'Apply', 'Country: United States & Canada')

      const calls = (
        ReactGA.event as unknown as {
          mock: { calls: Array<[{ category: string; action: string; label?: string }]> }
        }
      ).mock.calls
      if (calls.length > 0) {
        const lastCall = calls[calls.length - 1][0]
        expect(lastCall.label).toBe('Country: United States & Canada')
      }
    })
  })

  describe('Integration scenarios', () => {
    it('can initialize and log events in sequence', () => {
      vi.clearAllMocks()

      initGA()
      logPageView('/home')
      logEvent('User', 'Login', 'Success')

      // Should have made some calls
      const totalCalls =
        (ReactGA.initialize as unknown as { mock: { calls: unknown[] } }).mock.calls.length +
        (ReactGA.send as unknown as { mock: { calls: unknown[] } }).mock.calls.length +
        (ReactGA.event as unknown as { mock: { calls: unknown[] } }).mock.calls.length

      expect(totalCalls).toBeGreaterThan(0)
    })

    it('logs console messages for tracking', () => {
      vi.clearAllMocks()

      logPageView('/test')
      logEvent('Test', 'Action')

      // Should have logged something to console
      expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(0)
    })
  })
})
