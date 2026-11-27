// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import {
  DataSourceLine,
  EmptyState,
  Expander,
  NoticeLine,
  ProvenanceLine,
  provenanceText,
} from './FixedLines'
import { VERBS, verbIcon, verbLabel, type VerbKey } from './verbs'

describe('verb dictionary', () => {
  it('uses sentence case, never ALL CAPS, never an engine name', () => {
    for (const key of Object.keys(VERBS) as VerbKey[]) {
      const label =
        typeof VERBS[key].label === 'function' ? VERBS[key].label('x') : VERBS[key].label
      expect(label, key).not.toMatch(/^[A-Z][A-Z ]+$/)
      expect(label, key).not.toMatch(/Live WASM/i)
      expect(label.charAt(0), key).toBe(label.charAt(0).toUpperCase())
    }
  })
  it('has the words of handoff 2.3', () => {
    expect(verbLabel('open')).toBe('Open')
    expect(verbLabel('ask')).toBe('Ask Assistant')
    expect(verbLabel('copyLink')).toBe('Copy link')
    expect(verbLabel('showMore')).toBe('Show 25 more')
    expect(verbLabel('add', 'risk')).toBe('Add risk')
    expect(verbLabel('run', 'handshake')).toBe('Run handshake')
    expect(verbLabel('download')).toBe('Download ▾')
    expect(verbLabel('showPkcs11Calls')).toBe('Show PKCS#11 calls')
    expect(verbIcon('open')).toBeDefined()
    expect(verbIcon('tryIt')).toBeUndefined()
  })
})

describe('fixed lines', () => {
  it('provenance line: reviewed with a date, or "Not yet reviewed"', () => {
    expect(provenanceText({ reviewed: true, draftedByAi: true, verified: '2026-08-11' })).toBe(
      '✓ Reviewed · Drafted by AI · reviewed by PQC Today · verified 11 Aug 2026'
    )
    expect(provenanceText({ reviewed: true, verified: null })).toBe('Not yet reviewed')
    render(<ProvenanceLine reviewed verified="2026-08-11" sourceHref="https://example.org" />)
    expect(screen.getByRole('link', { name: 'Source ›' })).toBeInTheDocument()
  })
  it('notice line is one line with More', () => {
    const onMore = vi.fn()
    render(<NoticeLine notA="legal advice" onMore={onMore} />)
    expect(
      screen.getByText(/About this content: educational — not legal advice\./)
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'More ›' }))
    expect(onMore).toHaveBeenCalled()
  })
  it('empty state: No x yet, why, one action', () => {
    const onClick = vi.fn()
    render(
      <EmptyState
        thing="linked records"
        reason="not-recorded"
        action={{ label: 'Suggest a record', onClick }}
      />
    )
    expect(screen.getByText('No linked records yet.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Suggest a record' }))
    expect(onClick).toHaveBeenCalled()
  })
  it('expander is closed by default and toggles on the whole row', () => {
    render(
      <Expander title="Details">
        <p>Body</p>
      </Expander>
    )
    const b = screen.getByRole('button', { name: /Details/ })
    expect(b).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(b)
    expect(b).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Body')).toBeVisible()
  })
  it('data source line uses the shared date form', () => {
    render(<DataSourceLine name="quiz" updated="2026-11-22" />)
    expect(screen.getByText('Data source: quiz · updated 22 Nov 2026')).toBeInTheDocument()
  })
})
