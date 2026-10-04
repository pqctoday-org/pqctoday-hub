// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CrqcCapabilityStrip } from './CrqcCapabilityStrip'
import {
  CRQC_ESTIMATES,
  getCrqcForecast,
  getCrqcMigrationDeadlines,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import { UNRESOLVED_ESTIMATES_DETAIL } from '@/components/common/UnresolvedEstimatesNotice'
import { getOpenClaim } from '@/data/openClaimsData'
import { headStatement } from '@/data/openClaimsView'

/** Cards that stand on their own in the strip, not the ones opened inside an earlier statement. */
function topLevelCards(strip: HTMLElement): HTMLElement[] {
  return within(strip)
    .queryAllByTestId('claim-card')
    .filter((c) => c.parentElement?.closest('[data-testid="claim-earlier-statement"]') === null)
}

const ids = (cards: HTMLElement[]) => cards.map((c) => c.getAttribute('data-claim-id'))

describe('CrqcCapabilityStrip, expanded', () => {
  it('no longer publishes a range this site derived, and says what the Google paper estimates', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    expect(strip).not.toHaveTextContent(/Not in the window/)
    expect(strip).not.toHaveTextContent(/2029\s*[–-]\s*2036/)
    expect(strip).toHaveTextContent('Resource estimates, not arrival dates.')
    expect(strip).toHaveTextContent('at most 1,200 logical qubits')
    expect(strip).toHaveTextContent('No reliable estimate of when such a machine could exist')
    // The paper is now cited by the claim card, with its own title, in the claim's source list.
    const paper = within(screen.getByTestId('crqc-resource-estimates'))
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(paper).toContain(
      'https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf'
    )
  })

  it('keeps the expert forecast and the government sources list', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    expect(screen.getAllByText(/Global Risk Institute/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/BSI Germany/).length).toBeGreaterThan(0)
  })
})

describe('CrqcCapabilityStrip, claims behind the estimates', () => {
  it('shows a claim card, with its state, under every estimate that has a claim', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    const estimates = [...getCrqcForecast().sources, ...getCrqcMigrationDeadlines()]
    expect(estimates.length).toBeGreaterThan(0)
    const shown = ids(topLevelCards(strip))
    for (const e of estimates) {
      const claim = headStatement(e.claimId!)!
      expect(shown, e.source).toContain(claim.id)
      // the card sits in the same list item as the estimate's own line
      const card = within(strip)
        .getAllByTestId('claim-card')
        .find((c) => c.getAttribute('data-claim-id') === claim.id)!
      expect(card.closest('li'), e.source).toHaveTextContent(e.source)
      expect(card).toHaveAttribute('data-state', claim.state)
      expect(within(card).getAllByTestId('claim-state')[0]).toHaveTextContent(
        claim.state === 'Open' ? 'Open question' : claim.state
      )
    }
    // the expert forecast is an open question, a migration deadline is settled
    const gri = within(strip)
      .getAllByTestId('claim-card')
      .find((c) => c.getAttribute('data-claim-id') === 'crqc-gri-2025-timeline')!
    expect(gri).toHaveAttribute('data-state', 'Open')
  })

  it('shows the newest statement first and keeps the older one one step away', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    const top = ids(topLevelCards(strip))
    // NSA and ANSSI have newer statements that update their first ones: the newer is shown first
    expect(top).toContain('crqc-nsa-cnsa2-faq-v21-dates')
    expect(top).toContain('crqc-anssi-faq-2025-buy-after-2030')
    expect(top).not.toContain('crqc-nsa-cnsa2-dates')
    expect(top).not.toContain('crqc-anssi-phase3')

    for (const [newer, older] of [
      ['crqc-nsa-cnsa2-faq-v21-dates', 'crqc-nsa-cnsa2-dates'],
      ['crqc-anssi-faq-2025-buy-after-2030', 'crqc-anssi-phase3'],
    ] as const) {
      const card = topLevelCards(strip).find((c) => c.getAttribute('data-claim-id') === newer)!
      const earlier = within(card).getByTestId('claim-earlier-statement')
      expect(earlier.tagName).toBe('DETAILS')
      expect(within(earlier).getByText(/Read the earlier statement by/)).toBeInTheDocument()
      const nested = within(earlier).getByTestId('claim-card')
      expect(nested).toHaveAttribute('data-claim-id', older)
      // the older statement is the one the estimate's own claim id points at
      expect(getOpenClaim(older)?.newerStatements?.map((n) => n.claim)).toContain(newer)
    }
  })

  it('says what changed between the two statements, point by point, with both quotes', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const card = topLevelCards(screen.getByTestId('crqc-capability-strip')).find(
      (c) => c.getAttribute('data-claim-id') === 'crqc-nsa-cnsa2-faq-v21-dates'
    )!
    const changed = within(card).getAllByTestId('claim-what-changed')[0]
    expect(changed).toHaveTextContent(/What changed \(\d+ points?\)/)
    expect(changed).toHaveTextContent('Earlier')
    expect(changed).toHaveTextContent('Newer')
  })

  it('never averages the estimates or picks one as the answer', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const text = screen.getByTestId('crqc-capability-strip').textContent ?? ''
    expect(text).not.toMatch(/\b(averag\w*|mean|median|midpoint|consensus)\b/i)
    expect(text).not.toMatch(/\bthe (best|real|right) (estimate|answer)\b/i)
    // each source keeps its own figures: the survey's probabilities are shown as the survey gives them
    expect(text).toContain('28-49%')
    expect(text).toContain('51-70%')
    // no year or span other than a source's own is offered as "the" answer
    expect(text).not.toMatch(/most likely|best guess|expected year/i)
  })

  it('lists the open questions that have no estimate of their own, once each', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    const other = within(screen.getByTestId('crqc-other-open-questions'))
    expect(other.getByRole('heading', { name: 'Other open questions' }).tagName).toBe('H3')
    expect(ids(other.getAllByTestId('claim-card')).filter(Boolean)).toEqual(
      expect.arrayContaining([
        'crqc-rsa2048-physical-qubits-2025',
        'crqc-bsi-working-hypothesis-early-2030s',
      ])
    )
    // every card in that list is an open question, and none repeats a card shown with an estimate
    for (const card of other.getAllByTestId('claim-card')) {
      if (card.closest('[data-testid="claim-earlier-statement"]')) continue
      expect(card).toHaveAttribute('data-state', 'Open')
    }
    const top = ids(topLevelCards(strip))
    expect(new Set(top).size).toBe(top.length)
    expect(top.filter((i) => i === 'crqc-gri-2025-timeline')).toHaveLength(1)
  })

  it('shows the Google Quantum AI paper as its claim, with the caveat that it is not an arrival date', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const block = within(screen.getByTestId('crqc-resource-estimates'))
    expect(
      block.getByRole('heading', { name: 'Resource estimates, not arrival dates.' })
    ).toBeTruthy()
    const card = block.getByTestId('claim-card')
    expect(card).toHaveAttribute('data-claim-id', 'crqc-google-ef-secp256k1-resources')
    expect(card).toHaveAttribute('data-state', 'Settled')
    expect(card).toHaveTextContent('at most 1,200 logical qubits')
    expect(block.getByText(/No reliable estimate of when such a machine could exist/)).toBeTruthy()
  })
})

describe('CrqcCapabilityStrip, the notice and the headline', () => {
  it('uses the approved sentence for pages that show each claim, not the interim one', () => {
    render(<CrqcCapabilityStrip />)
    const note = screen.getByTestId('unresolved-estimates-notice')
    expect(note).toHaveTextContent(UNRESOLVED_ESTIMATES_DETAIL.claimsShown)
    expect(note).not.toHaveTextContent(UNRESOLVED_ESTIMATES_DETAIL.sourcesListed)
    expect(note).toHaveTextContent(
      'we show each one with its source and date, and say that the question is open, rather than pick a single answer'
    )
  })

  it('flags at a glance only what is not settled, as words with an icon, before anything is opened', () => {
    render(<CrqcCapabilityStrip />)
    const strip = screen.getByTestId('crqc-capability-strip')
    expect(within(strip).queryByTestId('claim-card')).not.toBeInTheDocument()
    const marks = within(strip).getAllByTestId('claim-state')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('Open question')
    expect(marks[0].querySelector('svg')).not.toBeNull()
    // the settled migration deadlines carry no mark in the headline
    const deadlines = within(strip).getByText('Migration deadlines (not forecasts)').parentElement!
    expect(within(deadlines).queryByTestId('claim-state')).not.toBeInTheDocument()
  })

  it('keeps every estimate in the list it was in, with its years, link and kind', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    for (const e of CRQC_ESTIMATES) {
      const link = within(strip)
        .getAllByRole('link')
        .find((a) => a.getAttribute('href') === e.url && a.textContent === e.source)
      expect(link, e.source).toBeDefined()
    }
  })

  it('opens the claim cards from the Sources button, which a keyboard reader can reach', () => {
    render(<CrqcCapabilityStrip />)
    const button = screen.getByRole('button', { name: /Sources/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryAllByTestId('claim-card')).toHaveLength(0)
    button.focus()
    expect(button).toHaveFocus()
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-controls', 'crqc-strip-body')
    expect(document.getElementById('crqc-strip-body')).toContainElement(
      screen.getAllByTestId('claim-card')[0]
    )
  })

  it('keeps the page outline: group titles at level 3, claim sentences at level 4, never above', () => {
    render(<CrqcCapabilityStrip defaultExpanded />)
    const strip = screen.getByTestId('crqc-capability-strip')
    expect(within(strip).getAllByRole('heading', { level: 2 })).toHaveLength(1)
    for (const card of topLevelCards(strip)) {
      expect(card.querySelector('h1, h2, h3'), card.getAttribute('data-claim-id')!).toBeNull()
      expect(card.querySelector('h4')).not.toBeNull()
    }
    const groupTitles = within(strip)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(groupTitles).toEqual(
      expect.arrayContaining([
        'CRQC arrival forecast — the window above',
        'Resource estimates, not arrival dates.',
        'Other open questions',
      ])
    )
  })
})
