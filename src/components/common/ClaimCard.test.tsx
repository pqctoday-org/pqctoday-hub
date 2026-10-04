// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ClaimCard, ClaimList, ClaimStateMark } from './ClaimCard'
import {
  CLAIM_STATE_LABELS,
  CLAIM_STATES,
  OPEN_CLAIMS,
  getOpenClaim,
  type OpenClaim,
} from '@/data/openClaimsData'

const claim = (over: Partial<OpenClaim> & { id: string }): OpenClaim => ({
  claim: `Claim sentence ${over.id}`,
  madeBy: 'The Example Body',
  state: 'Settled',
  reason: 'The document says so.',
  lastChecked: '2026-10-03',
  sources: [
    {
      name: 'Example Report',
      url: 'https://example.org/report',
      states: 'It says X',
      quote: 'exact words of X',
    },
  ],
  ...over,
})

const CONFLICT = claim({
  id: 'conflict',
  state: 'Open',
  inConflict: true,
  claim: 'A machine of this kind will exist by some year.',
  reason: 'Credible sources give answers that cannot both be right.',
  sources: [
    {
      name: 'Source One (2025)',
      url: 'https://example.org/one',
      states: 'Around 2030',
      quote: 'we expect it around 2030',
    },
    {
      name: 'Source Two (2026)',
      url: 'https://example.org/two',
      states: 'Not before 2040',
      quote: 'not before 2040',
    },
  ],
})

describe('ClaimStateMark', () => {
  it('shows every state as words, so colour is never the only signal', () => {
    for (const state of CLAIM_STATES) {
      const { unmount } = render(<ClaimStateMark state={state} />)
      expect(screen.getByTestId('claim-state')).toHaveTextContent(CLAIM_STATE_LABELS[state])
      unmount()
    }
    expect(CLAIM_STATE_LABELS.Open).toBe('Open question')
  })
})

describe('ClaimCard', () => {
  it('shows the claim, who made it, when it was last checked, and why', () => {
    render(<ClaimCard claim={claim({ id: 'a' })} />)
    const card = screen.getByTestId('claim-card')
    expect(card).toHaveAttribute('data-state', 'Settled')
    expect(screen.getByRole('heading', { level: 3, name: 'Claim sentence a' })).toBeInTheDocument()
    expect(card).toHaveTextContent('Made by The Example Body')
    expect(card).toHaveTextContent('Last checked 3 October 2026')
    expect(card).toHaveTextContent('Why: The document says so.')
  })

  it('is a labelled article and honours the heading level', () => {
    render(<ClaimCard claim={claim({ id: 'a' })} headingLevel={4} />)
    expect(screen.getByRole('article', { name: 'Claim sentence a' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 4, name: 'Claim sentence a' })).toBeInTheDocument()
    // the card's own sections sit one level below the claim sentence
    expect(screen.getByRole('heading', { level: 5, name: 'The source' })).toBeInTheDocument()
  })

  it('shows each source with its link and its exact words, and links open safely', () => {
    render(<ClaimCard claim={claim({ id: 'a' })} />)
    const link = screen.getByRole('link', { name: /Example Report/ })
    expect(link).toHaveAttribute('href', 'https://example.org/report')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveAccessibleName(/opens in a new tab/)
    expect(screen.getByText('“exact words of X”')).toBeInTheDocument()
    expect(screen.getByText(/It says X/)).toBeInTheDocument()
    expect(screen.getByTestId('claim-sources')).toBeInTheDocument()
    expect(screen.queryByTestId('claim-sources-side-by-side')).not.toBeInTheDocument()
  })

  it('shows sources that disagree side by side, each with its own words, and picks no answer', () => {
    render(<ClaimCard claim={CONFLICT} />)
    expect(screen.getByTestId('claim-conflict')).toHaveTextContent('Sources disagree')
    const grid = screen.getByTestId('claim-sources-side-by-side')
    expect(grid.className).toContain('sm:grid-cols-2')
    const blocks = within(grid).getAllByTestId('claim-source')
    expect(blocks).toHaveLength(2)
    expect(blocks[0]).toHaveTextContent('Source One (2025)')
    expect(blocks[0]).toHaveTextContent('“we expect it around 2030”')
    expect(blocks[1]).toHaveTextContent('Source Two (2026)')
    expect(blocks[1]).toHaveTextContent('“not before 2040”')
    const text = screen.getByTestId('claim-card').textContent ?? ''
    expect(text).toMatch(/rather than pick a single answer/)
    // never an average, a midpoint or a combined figure
    expect(text).not.toMatch(/average|midpoint|mean|combined|consensus/i)
    expect(text).not.toMatch(/\b203[5-9]\b/)
  })

  it('does not show the disagreement mark on a claim whose sources agree', () => {
    render(<ClaimCard claim={claim({ id: 'a', state: 'Open' })} />)
    expect(screen.queryByTestId('claim-conflict')).not.toBeInTheDocument()
  })

  it('says when this site, not a source, worked a figure out', () => {
    render(
      <ClaimCard claim={claim({ id: 'a', state: 'Open', derivedBy: 'this site', sources: [] })} />
    )
    expect(screen.getByTestId('claim-card')).toHaveTextContent('Worked out by this site')
    expect(screen.queryByTestId('claim-sources')).not.toBeInTheDocument()
  })

  it('leaves out the date when there is none', () => {
    render(<ClaimCard claim={claim({ id: 'a', lastChecked: null })} />)
    expect(screen.getByTestId('claim-card')).not.toHaveTextContent('Last checked')
  })

  it('shows a Superseded claim as replaced, not as the answer', () => {
    render(<ClaimCard claim={claim({ id: 'old', state: 'Superseded', supersededBy: 'new' })} />)
    expect(screen.getByTestId('claim-state')).toHaveTextContent('Replaced by a newer statement')
  })
})

describe('ClaimCard on the published claims', () => {
  it('shows what changed, point by point, each side with its own words', () => {
    const newer = getOpenClaim('crqc-nsa-cnsa2-faq-v21-dates')!
    render(<ClaimCard claim={newer} />)
    const block = screen.getByTestId('claim-what-changed')
    const points = newer.earlier![0].changes!
    expect(block.querySelector('summary')).toHaveTextContent(
      `What changed (${points.length} points)`
    )
    for (const c of points) {
      expect(block).toHaveTextContent(c.point)
      expect(block).toHaveTextContent(c.before.text)
      expect(block).toHaveTextContent(`“${c.before.quote}”`)
      expect(block).toHaveTextContent(c.after.text)
      expect(block).toHaveTextContent(`“${c.after.quote}”`)
    }
    expect(block.querySelector('.sm\\:grid-cols-2')).not.toBeNull()
  })

  it('keeps the earlier statement one step away, with how the newer one relates to it', () => {
    const newer = getOpenClaim('crqc-nsa-cnsa2-faq-v21-dates')!
    render(<ClaimCard claim={newer} headingLevel={3} />)
    const earlier = screen.getByTestId('claim-earlier')
    expect(earlier).toHaveTextContent('Updates an earlier statement.')
    const toggle = within(earlier).getByTestId('claim-earlier-statement')
    expect(toggle.querySelector('summary')).toHaveTextContent('Read the earlier statement by')
    const older = within(toggle).getByTestId('claim-card')
    expect(older).toHaveAttribute('data-claim-id', 'crqc-nsa-cnsa2-dates')
    // the older statement sits two heading levels down (its own sections sit below that)
    expect(
      within(older).getByRole('heading', {
        hidden: true, // the earlier statement is inside a closed <details>
        level: 5,
        name: getOpenClaim('crqc-nsa-cnsa2-dates')!.claim,
      })
    ).toBeInTheDocument()
  })

  it('uses real <summary> controls, which take the keyboard natively', () => {
    render(<ClaimCard claim={getOpenClaim('crqc-nsa-cnsa2-faq-v21-dates')!} />)
    for (const summary of document.querySelectorAll('summary')) {
      expect(summary.tagName).toBe('SUMMARY')
      expect(summary).not.toHaveAttribute('tabindex', '-1')
    }
    expect(document.querySelectorAll('summary').length).toBeGreaterThanOrEqual(2)
  })

  it('renders every published claim with a state, a heading and its sources linked', () => {
    for (const c of OPEN_CLAIMS) {
      const { unmount } = render(<ClaimCard claim={c} />)
      const card = screen.getAllByTestId('claim-card')[0]
      expect(within(card).getAllByTestId('claim-state')[0], c.id).toHaveTextContent(
        CLAIM_STATE_LABELS[c.state]
      )
      expect(within(card).getAllByRole('heading', { level: 3 })[0], c.id).toHaveTextContent(c.claim)
      const links = screen.getAllByRole('link').map((a) => a.getAttribute('href'))
      for (const s of c.sources) expect(links, c.id).toContain(s.url)
      unmount()
    }
  })
})

describe('ClaimCard cannot loop', () => {
  it('stops when two claims point at each other as earlier statements', () => {
    const a = claim({
      id: 'a',
      earlier: [
        { claim: 'b', relation: 'updates', detail: 'a updates b', madeBy: 'B Body', url: null },
      ],
    })
    const b = claim({
      id: 'b',
      earlier: [
        { claim: 'a', relation: 'updates', detail: 'b updates a', madeBy: 'A Body', url: null },
      ],
    })
    const lookup = (id: string) => [a, b].find((c) => c.id === id)
    render(<ClaimCard claim={a} lookup={lookup} />)
    expect(screen.getAllByTestId('claim-card')).toHaveLength(2)
  })
})

describe('ClaimList', () => {
  it('renders one card per claim and nothing for an empty list', () => {
    const { rerender } = render(<ClaimList claims={[claim({ id: 'a' }), claim({ id: 'b' })]} />)
    expect(screen.getAllByTestId('claim-card')).toHaveLength(2)
    rerender(<ClaimList claims={[]} />)
    expect(screen.queryByTestId('claim-list')).not.toBeInTheDocument()
  })
})
