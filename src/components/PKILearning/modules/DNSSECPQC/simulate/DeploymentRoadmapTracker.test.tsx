// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { DeploymentRoadmapTracker } from './DeploymentRoadmapTracker'

function pageText(): string {
  render(
    <MemoryRouter>
      <DeploymentRoadmapTracker />
    </MemoryRouter>
  )
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('DNSSEC deployment roadmap: root zone rollover', () => {
  it('does not present a realistic mid-2030s window as a Verisign estimate', () => {
    const t = pageText()
    expect(t).not.toMatch(/Verisign estimates the mid-2030s as the realistic window/)
    expect(t).not.toMatch(/realistic window/)
    expect(t).toMatch(/dated, conditional scenario/)
    expect(t).toMatch(/may well involve the incorporation of post-quantum cryptography/)
    expect(t).toMatch(/planning scenario from 2023, not an ICANN\/IANA plan and not a forecast/)
  })

  it('keeps the first (classical, ICANN/IANA) rollover apart from the second (possible post-quantum) one', () => {
    const t = pageText()
    expect(t).toMatch(/First rollover \(ICANN\/IANA plan, classical\)/)
    expect(t).toMatch(/new ECDSA Root KSK in 2027 and ends with retiring the RSA Root KSK in 2029/)
    expect(t).toMatch(/ICANN org said it will proceed with the rollover as proposed/)
    expect(t).toMatch(/this plan does not make the root post-quantum/)
    expect(t).toMatch(/Second rollover/)
  })
})
