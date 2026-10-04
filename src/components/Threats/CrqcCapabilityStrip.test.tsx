// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CrqcCapabilityStrip } from './CrqcCapabilityStrip'

describe('CrqcCapabilityStrip, expanded', () => {
  it('no longer publishes a range this site derived, and says what the Google paper estimates', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    expect(strip).not.toHaveTextContent(/Not in the window/)
    expect(strip).not.toHaveTextContent(/2029\s*[–-]\s*2036/)
    expect(strip).toHaveTextContent('Resource estimates, not arrival dates.')
    expect(strip).toHaveTextContent('at most 1,200 logical qubits')
    expect(strip).toHaveTextContent('No reliable estimate of when such a machine could exist')
    expect(screen.getByRole('link', { name: 'The paper' })).toHaveAttribute(
      'href',
      'https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf'
    )
  })

  it('keeps the expert forecast and the government sources list', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    expect(screen.getAllByText(/Global Risk Institute/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BSI Germany/).length).toBeGreaterThan(0)
  })
})
