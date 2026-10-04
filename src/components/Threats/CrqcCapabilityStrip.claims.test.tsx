// SPDX-License-Identifier: GPL-3.0-only
/**
 * The capability strip when the published claims differ from today's file: no file at all, an
 * estimate whose claim is missing, sources that disagree, a claim that did not hold. The real
 * file is covered in CrqcCapabilityStrip.test.tsx.
 */
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { OpenClaim } from '@/data/openClaimsData'

const mock = vi.hoisted(() => ({
  noClaims: false,
  override: undefined as
    undefined | ((id: string, real: OpenClaim | undefined) => OpenClaim | undefined),
}))

vi.mock('@/data/openClaimsData', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/data/openClaimsData')>()
  return {
    ...real,
    getOpenClaim: (id: string) => {
      if (mock.noClaims) return undefined
      const found = real.getOpenClaim(id)
      return mock.override ? mock.override(id, found) : found
    },
    openQuestions: () => (mock.noClaims ? [] : real.openQuestions()),
  }
})

import { CrqcCapabilityStrip } from './CrqcCapabilityStrip'
import {
  CRQC_ESTIMATES,
  getCrqcMigrationDeadlines,
} from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import { UNRESOLVED_ESTIMATES_DETAIL } from '@/components/common/UnresolvedEstimatesNotice'

afterEach(() => {
  mock.noClaims = false
  mock.override = undefined
})

const strip = () => screen.getByTestId('crqc-capability-strip')

describe('CrqcCapabilityStrip without the published claims', () => {
  it('reads as it did before: the interim notice, the plain lists and the Google paragraph', () => {
    mock.noClaims = true
    render(<CrqcCapabilityStrip defaultExpanded />)
    expect(screen.getByTestId('unresolved-estimates-notice')).toHaveTextContent(
      UNRESOLVED_ESTIMATES_DETAIL.sourcesListed
    )
    expect(screen.getByTestId('unresolved-estimates-notice')).not.toHaveTextContent(
      UNRESOLVED_ESTIMATES_DETAIL.claimsShown
    )
    expect(screen.queryByTestId('claim-card')).not.toBeInTheDocument()
    expect(screen.queryByTestId('claim-state')).not.toBeInTheDocument()
    expect(screen.queryByTestId('crqc-other-open-questions')).not.toBeInTheDocument()
    for (const e of CRQC_ESTIMATES) {
      expect(within(strip()).getByRole('link', { name: e.source })).toHaveAttribute('href', e.url)
    }
    expect(strip()).toHaveTextContent('Resource estimates, not arrival dates.')
    expect(strip()).toHaveTextContent('at most 1,200 logical qubits')
    expect(screen.getByRole('link', { name: 'The paper' })).toHaveAttribute(
      'href',
      'https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf'
    )
  })
})

describe('CrqcCapabilityStrip, an estimate without a claim', () => {
  it('keeps what it showed before, while the others show their claim', () => {
    const nist = CRQC_ESTIMATES.find((e) => e.source.startsWith('NIST IR 8547'))!
    mock.override = (id, real) => (id === nist.claimId ? undefined : real)
    render(<CrqcCapabilityStrip defaultExpanded />)

    // NIST: its line is there, with its link and kind, and no card
    const line = within(strip()).getByRole('link', { name: nist.source }).closest('li')!
    expect(line).toHaveTextContent('Migration deadline')
    expect(line).toHaveTextContent(nist.confidence)
    expect(within(line).queryByTestId('claim-card')).not.toBeInTheDocument()

    // the others still have theirs
    const withCard = within(strip())
      .getAllByTestId('claim-card')
      .map((c) => c.getAttribute('data-claim-id'))
    expect(withCard).toContain('crqc-gri-2025-timeline')
    expect(withCard).toContain('crqc-bsi-tr02102-2026-dates')
    expect(withCard).not.toContain(nist.claimId)
    // and the notice still speaks of claims, because the page still shows some
    expect(screen.getByTestId('unresolved-estimates-notice')).toHaveTextContent(
      UNRESOLVED_ESTIMATES_DETAIL.claimsShown
    )
  })
})

describe('CrqcCapabilityStrip, sources that disagree', () => {
  it('shows each source side by side, with its own words, and no combined figure', () => {
    mock.override = (id, real) =>
      id === 'crqc-gri-2025-timeline' && real
        ? {
            ...real,
            inConflict: true,
            sources: [
              {
                name: 'Survey A',
                url: 'https://example.org/a',
                states: 'Arrival within 10 years: 28-49%.',
                quote: 'quite possible (28-49%) within the next 10 years',
              },
              {
                name: 'Report B',
                url: 'https://example.org/b',
                states: 'Arrival after 2040.',
                quote: 'unlikely before 2040',
              },
            ],
          }
        : real
    render(<CrqcCapabilityStrip defaultExpanded />)
    const card = within(strip())
      .getAllByTestId('claim-card')
      .find((c) => c.getAttribute('data-claim-id') === 'crqc-gri-2025-timeline')!
    const side = within(card).getByTestId('claim-sources-side-by-side')
    const items = within(side).getAllByTestId('claim-source')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent('Survey A')
    expect(items[0]).toHaveTextContent('quite possible (28-49%) within the next 10 years')
    expect(items[1]).toHaveTextContent('Report B')
    expect(items[1]).toHaveTextContent('unlikely before 2040')
    expect(within(card).getByTestId('claim-conflict')).toHaveTextContent('Sources disagree')
    expect(card).toHaveTextContent('rather than pick a single answer')
    expect(card.textContent).not.toMatch(/\b(averag\w*|mean|median|midpoint)\b/i)
  })
})

describe('CrqcCapabilityStrip, a settled-looking line that did not hold', () => {
  it('flags it in the headline in words, and everything else stays unflagged', () => {
    const [first] = getCrqcMigrationDeadlines()
    mock.override = (id, real) =>
      id === first.claimId && real ? { ...real, state: 'Broken' } : real
    render(<CrqcCapabilityStrip />)
    const deadlines = within(strip()).getByText(
      'Migration deadlines (not forecasts)'
    ).parentElement!
    const marks = within(deadlines).getAllByTestId('claim-state')
    expect(marks).toHaveLength(1)
    expect(marks[0]).toHaveTextContent('Did not hold')
    expect(marks[0].closest('li')).toHaveTextContent(first.source)
  })
})

describe('CrqcCapabilityStrip, other open questions', () => {
  it('does not list a question again when a card above already reaches it as an earlier statement', () => {
    mock.override = (id, real) =>
      id === 'crqc-gri-2025-timeline' && real
        ? {
            ...real,
            earlier: [
              {
                claim: 'crqc-rsa2048-physical-qubits-2025',
                relation: 'adds-to',
                detail: 'An example link for this test.',
                madeBy: 'Example',
                url: null,
              },
            ],
          }
        : real
    render(<CrqcCapabilityStrip defaultExpanded />)
    const other = within(screen.getByTestId('crqc-other-open-questions'))
    const listed = other.getAllByTestId('claim-card').map((c) => c.getAttribute('data-claim-id'))
    expect(listed).toContain('crqc-bsi-working-hypothesis-early-2030s')
    expect(listed).not.toContain('crqc-rsa2048-physical-qubits-2025')
  })
})
