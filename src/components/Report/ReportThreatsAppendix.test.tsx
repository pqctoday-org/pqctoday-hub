// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ReportThreatsAppendix, ASSESS_TO_THREATS_INDUSTRY } from './ReportThreatsAppendix'
import { threatsData } from '@/data/threatsData'

// Real data: pick an assess industry that maps to at least one threat with a
// source URL, so both links are exercised.
const [industry, threat] = (() => {
  for (const [ind, names] of Object.entries(ASSESS_TO_THREATS_INDUSTRY)) {
    const t = threatsData.find((x) => names.includes(x.industry) && x.sourceUrl)
    if (t) return [ind, t] as const
  }
  throw new Error('fixture: no threat with a source URL in a mapped industry')
})()

describe('ReportThreatsAppendix links', () => {
  it('links each threat id to /threats?id= and keeps the external source link', () => {
    render(
      <MemoryRouter>
        <ReportThreatsAppendix industry={industry} hiddenThreatIds={[]} onHideThreat={() => {}} />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('link', { name: `Open ${threat.threatId} on the Threats page` })
    ).toHaveAttribute('href', `/threats?id=${encodeURIComponent(threat.threatId)}`)
    const source = screen.getByRole('link', { name: `Source for ${threat.threatId}` })
    expect(source).toHaveAttribute('href', threat.sourceUrl)
    expect(source).toHaveAttribute('target', '_blank')
  })
})
