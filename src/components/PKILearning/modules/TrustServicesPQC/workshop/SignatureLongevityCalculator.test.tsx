// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SignatureLongevityCalculator } from './SignatureLongevityCalculator'

const text = () => (document.body.textContent ?? '').replace(/\s+/g, ' ')

describe('Signature Longevity Calculator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('labels itself an illustrative scenario and shows the assumed dates and algorithm', () => {
    render(<SignatureLongevityCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /30y/ }))
    const t = text()
    expect(t).toMatch(/Illustrative scenario, not a prediction/)
    expect(t).toMatch(/signed in 2026 with RSA-2048 or ECDSA P-256, needed until 2056/)
    expect(t).toMatch(/one policy cutoff, 2035 \(NIST IR 8547/)
    expect(t).toMatch(/runs past the assumed policy cutoff/)
  })

  it('makes renewal precede the earliest weakness, invalid certificate or policy cutoff', () => {
    render(<SignatureLongevityCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /30y/ }))
    expect(text()).toMatch(
      /before the earliest of: a weakness in the signing algorithm, the signing certificate becoming invalid, and a policy cutoff such as 2035/
    )
    // the old fixed-date promise is gone
    expect(text()).not.toMatch(/before roughly 2035/)
  })

  it('does not promise survival when the horizon ends no later than the assumed cutoff', () => {
    render(<SignatureLongevityCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /7y/ }))
    const t = text()
    expect(t).toMatch(/ends no later than the assumed policy cutoff/)
    expect(t).not.toMatch(/runs past the assumed policy cutoff/)
    expect(t).toMatch(/does not prove the signature survives its window/)
    expect(t).not.toMatch(/survives its window without an algorithm migration/)
  })

  it('decides by the end year, not by the retention length alone', () => {
    // a 7-year retention started in 2030 would end past the cutoff
    vi.setSystemTime(new Date('2030-03-01T12:00:00Z'))
    render(<SignatureLongevityCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /7y/ }))
    expect(text()).toMatch(/needed until 2037/)
    expect(text()).toMatch(/runs past the assumed policy cutoff/)
  })

  it('does not say the horizon ends before the cutoff when it ends in the cutoff year itself', () => {
    // 7 years from 2028 ends in 2035, the assumed cutoff year: not past it, but not before it either
    vi.setSystemTime(new Date('2028-03-01T12:00:00Z'))
    render(<SignatureLongevityCalculator />)
    fireEvent.click(screen.getByRole('button', { name: /7y/ }))
    const t = text()
    expect(t).toMatch(/needed until 2035/)
    expect(t).toMatch(/ends no later than the assumed policy cutoff/)
    expect(t).toMatch(/Ending by 2035 does not prove/)
    expect(t).not.toMatch(/ends before the assumed policy cutoff/)
    expect(t).not.toMatch(/Ending before 2035/)
  })
})
