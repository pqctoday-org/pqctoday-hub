// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TVLALeakageAnalyzer } from './TVLALeakageAnalyzer'

describe('TVLALeakageAnalyzer banner', () => {
  it('says the scores are typed in, with no recorded traces', () => {
    const { container } = render(<TVLALeakageAnalyzer />)
    const text = container.textContent ?? ''
    expect(text).toContain('Illustrative scores, not measurements:')
    expect(text).toContain('No power traces are recorded or analysed here.')
    expect(text).not.toMatch(/pre-recorded/i)
    expect(text).not.toContain('10,000 measurements')
    expect(text).not.toContain('Power Trace t-test Results')
    expect(screen.getByRole('heading', { name: /Illustrative t-test scores/ })).toBeInTheDocument()
  })
})
