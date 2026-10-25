// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Performance figures in the benchmarking and enterprise sections each carry a source: the 80-90%
 * session-resumption figure is VIAVI's (white paper, "Addressing Mitigation"), and the "<7% TLS
 * latency increase on LAN" claim had no source and was removed. The VIAVI box does not say its
 * figures are all missing, because the 48x figure just above it is given.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { PQCTestingIntroduction } from './PQCTestingIntroduction'
import ragSummary from '../rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

const openLesson = () => {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <PQCTestingIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    </EmbedProvider>
  )
  for (const title of [
    'PQC Performance Benchmarking Methodology',
    'Enterprise Reality: Hidden Performance Costs',
  ]) {
    fireEvent.click(screen.getByText(title))
  }
  return flat(document.body.textContent ?? '')
}

describe('PQC Network Testing & Validation: sourced performance figures', () => {
  it('no longer states an unsourced LAN latency figure', () => {
    const text = openLesson()
    expect(text).toContain('Test Hybrid Configuration First')
    expect(text).not.toMatch(/<\s*7\s*%/)
    expect(text).not.toContain('Most organizations see')
  })

  it('attributes the 80-90% session-resumption figure to the VIAVI white paper', () => {
    const text = openLesson()
    expect(text).toContain(
      "VIAVI's white paper says this eliminates 80-90% of the PQC performance impact for returning users."
    )
    expect(text).not.toContain('This eliminates 80-90%')
    expect(flat(ragSummary)).toContain(
      "VIAVI's white paper says this eliminates **80–90%** of the PQC performance impact for returning users."
    )
  })

  it('does not say the paper figures are all withheld right after giving the 48x figure', () => {
    const text = openLesson()
    expect(text).toContain('web pages loading 48× slower')
    expect(text).toContain('so its other figures are not reproduced here')
    expect(text).not.toContain('the exact figures are not reproduced here')
  })
})
