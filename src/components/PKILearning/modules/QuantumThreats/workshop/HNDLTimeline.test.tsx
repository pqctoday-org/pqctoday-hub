// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HNDLTimeline } from './HNDLTimeline'

describe('HNDL timeline forecast boundary', () => {
  it('labels the selected year as a planning scenario, not an arrival prediction', () => {
    const { container } = render(<HNDLTimeline />)
    const text = (container.textContent ?? '').replace(/\s+/g, ' ')
    expect(screen.getByLabelText('CRQC Planning Year (Scenario)')).toBeInTheDocument()
    expect(text).toMatch(/explore the Mosca planning calculation/)
    expect(text).toMatch(/not a prediction of when a CRQC will arrive/)
    expect(text).toMatch(/sessions that rely on quantum-vulnerable public-key key establishment/)
    expect(text).toMatch(/not a claim that every encrypted archive is exposed/)
    expect(text).not.toMatch(/Expected CRQC Arrival Year/)
  })
})
