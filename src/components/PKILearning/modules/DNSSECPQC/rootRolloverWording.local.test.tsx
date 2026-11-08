// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { DNSSECIntroduction } from './components/DNSSECIntroduction'
import { DNSSECExercises } from './components/DNSSECExercises'
import { content } from './content'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')
const OLD_ESTIMATE = /Verisign estimates|broader estimate of (the )?mid-2030s|rollover estimate/

function pageText(node: React.ReactElement): string {
  render(<MemoryRouter>{node}</MemoryRouter>)
  return flat(document.body.textContent ?? '')
}

describe('DNS root zone rollover wording', () => {
  it('the introduction separates the classical ICANN/IANA first rollover from a conditional scenario', () => {
    const t = pageText(<DNSSECIntroduction onNavigateToSimulate={vi.fn()} />)
    expect(t).toMatch(/new ECDSA Root KSK in 2027 and the RSA Root KSK retired in 2029/)
    expect(t).toMatch(/may well involve the incorporation of post-quantum cryptography/)
    expect(t).toMatch(/dated, conditional scenario rather than an ICANN\/IANA plan or a forecast/)
    expect(t).not.toMatch(OLD_ESTIMATE)
  })

  it('the exercise describes the two rollovers instead of one estimate', () => {
    const t = pageText(<DNSSECExercises onNavigateToSimulate={vi.fn()} />)
    expect(t).toMatch(/ICANN\/IANA first rollover is classical/)
    expect(t).toMatch(/a conditional scenario, not an ICANN\/IANA plan or a forecast/)
    expect(t).not.toMatch(OLD_ESTIMATE)
  })

  it('the module narrative and both summaries carry the same wording', () => {
    const narrative = String(content.narratives?.rootZoneRollover ?? '')
    expect(narrative).toMatch(/conditional scenario rather than an ICANN\/IANA plan or a forecast/)
    expect(narrative).not.toMatch(/Verisign estimate/)
    expect(flat(ragSummary)).toMatch(
      /a dated, conditional scenario rather than an ICANN\/IANA plan/
    )
    expect(flat(ragSummary)).not.toMatch(OLD_ESTIMATE)
    expect(flat(curiousSummary)).toMatch(/a conditional scenario rather than a plan or a forecast/)
    expect(flat(curiousSummary)).not.toMatch(OLD_ESTIMATE)
  })
})
