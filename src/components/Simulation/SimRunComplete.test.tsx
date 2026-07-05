// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SimRunComplete } from './SimRunComplete'
import { clearTrapTally, recordTrapPick } from './simTrapTally'

const objectives = [
  { id: 'governance', label: 'Governance in place', byYear: 2027, done: true },
  { id: 'critical', label: 'Critical assets protected', byYear: 2031, done: true },
  { id: 'migration', label: 'Migration completed', byYear: 2035, done: true },
]
const base = { objectives, maturity: 4, programEndYear: 2035, onClose: () => {} }

function renderCeremony(props: Partial<typeof base> = {}) {
  return render(
    <MemoryRouter>
      <SimRunComplete {...base} {...props} />
    </MemoryRouter>
  )
}

describe('SimRunComplete (run-end ceremony)', () => {
  beforeEach(() => clearTrapTally())

  it('celebrates the three objectives + maturity when all are met', () => {
    renderCeremony()
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
    renderCeremony({ objectives: withYears })
    expect(screen.getByText(/✓ 2026/)).toBeInTheDocument()
    expect(screen.getByText(/✓ 2031/)).toBeInTheDocument()
  })

  it('shows a "behind" note when an objective is unmet', () => {
    const partial = objectives.map((o) => (o.id === 'migration' ? { ...o, done: false } : o))
    renderCeremony({ objectives: partial, maturity: 3 })
    expect(screen.getByText(/some objectives finished behind/i)).toBeInTheDocument()
  })

  it('closes on Escape (a11y)', () => {
    const onClose = vi.fn()
    renderCeremony({ onClose })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  // W2-4 — the ceremony reflects the traps the player fell for and offers next
  // steps, so the full climb's ending isn't weaker than the walkthrough's.
  it('shows no reflection block when no traps were recorded', () => {
    renderCeremony()
    expect(screen.queryByText(/what you.d do differently/i)).not.toBeInTheDocument()
  })

  it('reflects the top traps fallen for, ranked, with a remediation link', () => {
    recordTrapPick('p1', 'Keep the inventory in a spreadsheet')
    recordTrapPick('p1', 'Keep the inventory in a spreadsheet')
    recordTrapPick('p0', 'Delegate the program to vendors')
    renderCeremony()
    expect(screen.getByText(/what you.d do differently/i)).toBeInTheDocument()
    expect(screen.getByText(/Keep the inventory in a spreadsheet/)).toBeInTheDocument()
    expect(screen.getByText(/fell for it 2×/)).toBeInTheDocument()
  })

  it('offers Command Center and deadlines next-step links', () => {
    renderCeremony()
    expect(screen.getByRole('link', { name: /Open the Command Center/i })).toHaveAttribute(
      'href',
      '/business'
    )
    expect(screen.getByRole('link', { name: /See your deadlines/i })).toHaveAttribute(
      'href',
      '/compliance'
    )
  })
})
