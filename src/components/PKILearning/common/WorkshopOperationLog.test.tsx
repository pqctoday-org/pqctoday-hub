// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkshopOperationLog, type LogEntry } from './WorkshopOperationLog'

describe('WorkshopOperationLog', () => {
  it('renders nothing when entries is empty', () => {
    const { container } = render(<WorkshopOperationLog entries={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('has role="log" and aria-live="polite"', () => {
    const entries: LogEntry[] = [{ status: 'success', message: 'Done' }]
    render(<WorkshopOperationLog entries={entries} />)
    const log = screen.getByRole('log')
    expect(log).toHaveAttribute('aria-live', 'polite')
  })

  it('renders all entry messages', () => {
    const entries: LogEntry[] = [
      { status: 'pending', message: 'Generating key...' },
      { status: 'success', message: 'Key generated' },
      { status: 'error', message: 'Sign failed' },
    ]
    render(<WorkshopOperationLog entries={entries} />)
    expect(screen.getByText('Generating key...')).toBeInTheDocument()
    expect(screen.getByText('Key generated')).toBeInTheDocument()
    expect(screen.getByText('Sign failed')).toBeInTheDocument()
  })

  it('renders duration when provided', () => {
    const entries: LogEntry[] = [{ status: 'success', message: 'Signed', durationMs: 432 }]
    render(<WorkshopOperationLog entries={entries} />)
    expect(screen.getByText('[432ms]')).toBeInTheDocument()
  })

  it('shows the indeterminate progress bar when any entry is pending', () => {
    const entries: LogEntry[] = [
      { status: 'success', message: 'Generated key', durationMs: 12 },
      { status: 'pending', message: 'Signing...' },
    ]
    render(<WorkshopOperationLog entries={entries} />)
    const bar = screen.getByRole('progressbar', { name: 'Operation in progress' })
    expect(bar).toBeInTheDocument()
    // Indeterminate — no aria-valuenow set.
    expect(bar).not.toHaveAttribute('aria-valuenow')
    // Log container reports busy state to assistive tech.
    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'true')
  })

  it('hides the progress bar when no entries are pending', () => {
    const entries: LogEntry[] = [
      { status: 'success', message: 'Generated key', durationMs: 12 },
      { status: 'success', message: 'Signed', durationMs: 87 },
    ]
    render(<WorkshopOperationLog entries={entries} />)
    expect(screen.queryByRole('progressbar', { name: 'Operation in progress' })).toBeNull()
    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'false')
  })
})
