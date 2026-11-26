// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'
import { UPDATE_RELOAD_KEY, UPDATED_MESSAGE } from '@/utils/updateReload'

let reloads = 0

beforeEach(() => {
  sessionStorage.clear()
  reloads = 0
  Object.defineProperty(window, 'location', {
    value: { ...window.location, reload: () => reloads++ },
    writable: true,
  })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

function Boom({ message }: { message: string }): never {
  throw new Error(message)
}

const MISSING = 'Failed to fetch dynamically imported module: https://x/assets/Host-abc.js'

describe('ErrorBoundary', () => {
  it('shows the update message and reloads once for a missing split file', () => {
    render(
      <ErrorBoundary>
        <Boom message={MISSING} />
      </ErrorBoundary>
    )
    expect(screen.getByRole('alert')).toBeTruthy()
    expect(screen.getByText(UPDATED_MESSAGE)).toBeTruthy()
    expect(screen.queryByText(/Something went wrong/)).toBeNull()
    // The boundary made the one allowed reload.
    expect(reloads).toBe(1)
    expect(sessionStorage.getItem(UPDATE_RELOAD_KEY)).not.toBeNull()
  })

  it('does not reload again when the failure comes back, and the button reloads the page', () => {
    sessionStorage.setItem(
      UPDATE_RELOAD_KEY,
      JSON.stringify({ url: '', build: '', at: Date.now() })
    )
    render(
      <ErrorBoundary>
        <Boom message={MISSING} />
      </ErrorBoundary>
    )
    expect(reloads).toBe(0)
    expect(screen.getByText(UPDATED_MESSAGE)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    // A real reload, not a retry of the same import.
    expect(reloads).toBe(1)
    expect(screen.getByText(UPDATED_MESSAGE)).toBeTruthy()
  })

  it('says so when the browser is offline', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    render(
      <ErrorBoundary>
        <Boom message={MISSING} />
      </ErrorBoundary>
    )
    expect(screen.getByText('You are offline')).toBeTruthy()
    expect(screen.queryByText(UPDATED_MESSAGE)).toBeNull()
    expect(reloads).toBe(0)
  })

  it('keeps Something went wrong, with Try again, for any other error', () => {
    let fail = true
    function Maybe() {
      if (fail) throw new Error('Cannot read properties of undefined')
      return <p>recovered</p>
    }
    render(
      <ErrorBoundary>
        <Maybe />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.getByText('Cannot read properties of undefined')).toBeTruthy()
    expect(reloads).toBe(0)
    fail = false
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(screen.getByText('recovered')).toBeTruthy()
  })

  it('does not call a failed data request a new version, and retries it with a page load', () => {
    render(
      <ErrorBoundary>
        <Boom message="Failed to fetch" />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeTruthy()
    expect(screen.queryByText(UPDATED_MESSAGE)).toBeNull()
    // No automatic reload for an ordinary network failure.
    expect(reloads).toBe(0)
    expect(sessionStorage.getItem(UPDATE_RELOAD_KEY)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(reloads).toBe(1)
  })

  it('renders children when nothing fails', () => {
    render(
      <ErrorBoundary>
        <p>fine</p>
      </ErrorBoundary>
    )
    expect(screen.getByText('fine')).toBeTruthy()
  })
})
