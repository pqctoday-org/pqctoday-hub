// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CRQC_ESTIMATES } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import { EstimateClaims, claimsForEstimates } from './EstimateClaims'

const APPROVED_SENTENCE =
  'Some published estimates are still unresolved, because they depend on technical assumptions and on machines that do not exist yet. Where credible sources differ, we show each one with its source and date, and say that the question is open, rather than pick a single answer.'

describe('claimsForEstimates', () => {
  it('shows the latest statement for each estimate, in the estimates’ order', () => {
    const { forEstimates } = claimsForEstimates(CRQC_ESTIMATES, false)
    expect(forEstimates.map((c) => c.id)).toEqual([
      'crqc-gri-2025-timeline',
      'crqc-nist-ir8547-dates',
      'crqc-nsa-cnsa2-faq-v21-dates',
      'crqc-anssi-faq-2025-buy-after-2030',
      'crqc-bsi-tr02102-2026-dates',
    ])
  })

  it('lists the other open questions, but not one already shown or one reached through an earlier statement', () => {
    const { otherOpen } = claimsForEstimates(CRQC_ESTIMATES, true)
    expect(otherOpen.map((c) => c.id)).toEqual([
      'crqc-rsa2048-physical-qubits-2025',
      'crqc-bsi-working-hypothesis-early-2030s',
    ])
    expect(otherOpen.every((c) => c.state === 'Open')).toBe(true)
  })

  it('shows nothing for an estimate that names no claim', () => {
    const bare = { ...CRQC_ESTIMATES[0], claimId: undefined }
    expect(claimsForEstimates([bare], true).forEstimates).toEqual([])
  })
})

describe('EstimateClaims', () => {
  it('shows the approved sentence and one card per claim, each as an article with its state', () => {
    render(<EstimateClaims estimates={CRQC_ESTIMATES} includeOtherOpenQuestions />)
    expect(screen.getByRole('note').textContent).toContain(APPROVED_SENTENCE)
    const cards = screen.getAllByTestId('claim-card')
    // seven headline cards (five estimates + two other open questions) plus any earlier statements inside them
    expect(cards.filter((c) => c.closest('details') === null)).toHaveLength(7)
    expect(screen.getByText('Other questions that are still open')).toBeInTheDocument()
  })

  it('puts the newer NSA and ANSSI statements first and keeps the older ones one link away', () => {
    render(<EstimateClaims estimates={CRQC_ESTIMATES} />)
    const nsa = screen
      .getAllByTestId('claim-card')
      .find((c) => c.getAttribute('data-claim-id') === 'crqc-nsa-cnsa2-faq-v21-dates')!
    expect(within(nsa).getByText('Updates an earlier statement.')).toBeInTheDocument()
    expect(within(nsa).getByTestId('claim-what-changed')).toBeInTheDocument()
  })

  it('never averages or merges the estimates into one figure', () => {
    render(<EstimateClaims estimates={CRQC_ESTIMATES} includeOtherOpenQuestions />)
    const text = screen.getByTestId('estimate-claims').textContent ?? ''
    expect(text).not.toMatch(/average|midpoint|consensus|combined estimate/i)
  })

  it('folds the cards into a keyboard-friendly control when collapsible, keeping the sentence visible', () => {
    render(<EstimateClaims estimates={CRQC_ESTIMATES.slice(0, 3)} headingLevel={5} collapsible />)
    expect(screen.getByRole('note')).toBeVisible()
    const summary = screen.getByText('What each source says, in its own words', {
      selector: 'summary',
    })
    expect(summary.tagName).toBe('SUMMARY')
    expect(summary.closest('details')).not.toHaveAttribute('open')
  })

  it('renders nothing when there is no claim to show', () => {
    const bare = CRQC_ESTIMATES.map((e) => ({ ...e, claimId: undefined }))
    const { container } = render(<EstimateClaims estimates={bare} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('in sentence mode shows only the second half of the approved sentence, never the note, and says it once', () => {
    const { container } = render(
      <EstimateClaims estimates={CRQC_ESTIMATES} collapsible intro="sentence" />
    )
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
    const text = container.textContent ?? ''
    expect(text).not.toContain('Some published estimates are still unresolved')
    expect(text.split('we show each one with its source and date').length - 1).toBe(1)
    expect(screen.getByTestId('claims-sentence')).toBeInTheDocument()
  })

  it('in the folded form a heading of its own keeps the outline in order for screen readers', () => {
    render(<EstimateClaims estimates={CRQC_ESTIMATES} headingLevel={3} collapsible />)
    const heading = screen.getByText('What each source says, in its own words', { selector: 'h2' })
    expect(heading).toHaveClass('sr-only')
  })
})
