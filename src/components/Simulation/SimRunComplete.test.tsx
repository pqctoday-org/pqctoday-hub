// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SimRunComplete, type SimRunCompleteProps } from './SimRunComplete'
import { clearTrapTally, recordTrapPick } from './simTrapTally'

const objectives = [
  { id: 'governance', label: 'Governance in place', byYear: 2027, done: true },
  { id: 'critical', label: 'Critical assets protected', byYear: 2031, done: true },
  { id: 'migration', label: 'Migration completed', byYear: 2035, done: true },
]
const base = { objectives, maturity: 4, programEndYear: 2035, onClose: () => {} }

function renderCeremony(props: Partial<SimRunCompleteProps> = {}) {
  return render(
    <MemoryRouter>
      <SimRunComplete {...base} {...props} />
    </MemoryRouter>
  )
}

describe('SimRunComplete (run-end ceremony)', () => {
  beforeEach(() => clearTrapTally())

  it('claims full maturity ONLY when the framework is fully covered', () => {
    renderCeremony({ claimsFullFrameworkMaturity: true })
    expect(screen.getByText(/operating at full maturity through 2035/i)).toBeInTheDocument()
    expect(screen.queryByText(/not full framework maturity/i)).not.toBeInTheDocument()
  })

  it('celebrates the three objectives + maturity when all are met', () => {
    renderCeremony()
    expect(screen.getByRole('dialog', { name: /migration program complete/i })).toBeInTheDocument()
    expect(screen.getByText(/Program maturity 4 \/ 4/i)).toBeInTheDocument()
    expect(screen.getByText('Critical assets protected')).toBeInTheDocument()
    expect(screen.getByText('Migration completed')).toBeInTheDocument()
    // W2.3: finishing every exercise the simulation offers is SCENARIO
    // completion. While the simulation does not cover every framework
    // criterion, the ceremony must not claim full framework maturity.
    expect(screen.getByText(/not full framework maturity/i)).toBeInTheDocument()
    expect(screen.queryByText(/operating at full maturity through 2035/i)).not.toBeInTheDocument()
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

  // WP4.6 — the challenge affordance is opt-in via onCopyChallenge; omitting it
  // (older callers) hides the button entirely, same pattern as `score`.
  it('shows no challenge button when onCopyChallenge is omitted', () => {
    renderCeremony()
    expect(screen.queryByRole('button', { name: /challenge a colleague/i })).not.toBeInTheDocument()
  })

  it('calls onCopyChallenge when the challenge button is clicked', () => {
    const onCopyChallenge = vi.fn()
    renderCeremony({ onCopyChallenge })
    fireEvent.click(screen.getByRole('button', { name: /challenge a colleague/i }))
    expect(onCopyChallenge).toHaveBeenCalledTimes(1)
  })

  // WP4.2 — the grade card is opt-in via the `score` prop; omitting it (older
  // callers, or a scenario with no meaningful quarter count) hides it entirely.
  it('shows no grade card when score is omitted', () => {
    renderCeremony()
    expect(screen.queryByTestId('run-grade-card')).not.toBeInTheDocument()
  })

  it('shows the grade + full breakdown when score is provided', () => {
    renderCeremony({
      score: {
        grade: 'A',
        overall: 95,
        parQuarters: 20,
        paceScore: 100,
        trapScore: 90,
        alignmentScore: 100,
        scoredComponents: 4,
        onTimeScore: 90,
      },
    })
    const card = screen.getByTestId('run-grade-card')
    expect(card).toHaveTextContent('A')
    expect(card).toHaveTextContent('par 20q')
    expect(card).toHaveTextContent('100')
    expect(card).toHaveTextContent('90')
  })

  it('renders a D grade with its own tone (not silently coerced to a passing look)', () => {
    renderCeremony({
      score: {
        grade: 'D',
        overall: 40,
        parQuarters: 24,
        paceScore: 20,
        trapScore: 30,
        alignmentScore: 50,
        scoredComponents: 4,
        onTimeScore: 60,
      },
    })
    expect(screen.getByTestId('run-grade-card')).toHaveTextContent('D')
  })
})

describe('persona debriefs (W7.4)', () => {
  it('gives each seat its own next action and evidence obligation', () => {
    const seen = new Set<string>()
    for (const seat of [
      'executive',
      'grc',
      'architect',
      'developer',
      'ops',
      'researcher',
      'curious',
    ]) {
      const { unmount } = renderCeremony({ seat })
      expect(screen.getByText(new RegExp(`Your debrief · ${seat}`, 'i'))).toBeInTheDocument()
      expect(screen.getByText(/Next action:/i)).toBeInTheDocument()
      // read the whole paragraph, not just the bold label inside it
      const obligation = screen.getByText(/Evidence you owe:/i).closest('p')?.textContent ?? ''
      expect(obligation.length).toBeGreaterThan(40)
      seen.add(obligation)
      unmount()
    }
    // every seat gets DIFFERENT content — not one debrief relabelled.
    // GRC is deliberately distinct from executive: sponsorship vs assurance.
    expect(seen.size).toBe(7)
  })

  it('says plainly when a run was mostly watched rather than done', () => {
    renderCeremony({ seat: 'curious', learnerShare: 0 })
    expect(screen.getByText(/mostly a demonstration you watched/i)).toBeInTheDocument()
    expect(screen.getByText(/not a record that you carried one out/i)).toBeInTheDocument()
  })

  it('does not claim competence when the learner did the work themselves', () => {
    renderCeremony({ seat: 'developer', learnerShare: 1 })
    expect(screen.getByText(/evidence is work you did yourself/i)).toBeInTheDocument()
  })
})
