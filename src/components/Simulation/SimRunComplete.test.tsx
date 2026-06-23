// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimRunComplete } from './SimRunComplete'

const objectives = [
  { id: 'governance', label: 'Governance in place', byYear: 2027, done: true },
  { id: 'critical', label: 'Critical assets protected', byYear: 2031, done: true },
  { id: 'migration', label: 'Migration completed', byYear: 2035, done: true },
]
const base = { objectives, maturity: 4, programEndYear: 2035, onClose: () => {} }

describe('SimRunComplete (run-end ceremony)', () => {
  it('celebrates the three objectives + maturity when all are met', () => {
    render(<SimRunComplete {...base} />)
    expect(screen.getByRole('dialog', { name: /migration program complete/i })).toBeInTheDocument()
    expect(screen.getByText(/Program maturity 4 \/ 4/i)).toBeInTheDocument()
    expect(screen.getByText('Critical assets protected')).toBeInTheDocument()
    expect(screen.getByText('Migration completed')).toBeInTheDocument()
    expect(screen.getByText(/operating at full maturity through 2035/i)).toBeInTheDocument()
  })

  it('shows the actual achievement year (on-time when achieved by the target)', () => {
    const withYears = [
      {
        id: 'governance',
        label: 'Governance in place',
        byYear: 2027,
        done: true,
        achievedYear: 2026,
      },
      {
        id: 'critical',
        label: 'Critical assets protected',
        byYear: 2031,
        done: true,
        achievedYear: 2031,
      },
    ]
    render(<SimRunComplete {...base} objectives={withYears} />)
    expect(screen.getByText(/✓ 2026/)).toBeInTheDocument()
    expect(screen.getByText(/✓ 2031/)).toBeInTheDocument()
  })

  it('shows a "behind" note when an objective is unmet', () => {
    const partial = objectives.map((o) => (o.id === 'migration' ? { ...o, done: false } : o))
    render(<SimRunComplete {...base} objectives={partial} maturity={3} />)
    expect(screen.getByText(/some objectives finished behind/i)).toBeInTheDocument()
  })

  it('closes on Escape (a11y)', () => {
    const onClose = vi.fn()
    render(<SimRunComplete {...base} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
