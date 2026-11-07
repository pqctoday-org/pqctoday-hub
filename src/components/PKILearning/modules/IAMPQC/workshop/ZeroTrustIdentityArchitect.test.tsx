// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ZeroTrustIdentityArchitect } from './ZeroTrustIdentityArchitect'

function pageTextWithRoadmap(): string {
  render(<ZeroTrustIdentityArchitect />)
  fireEvent.click(screen.getByRole('button', { name: /Generate Roadmap/ }))
  return document.body.textContent ?? ''
}

describe('ZeroTrustIdentityArchitect', () => {
  it('presents the migration years as sample planning assumptions, not deadlines', () => {
    const text = pageTextWithRoadmap()
    expect(text).toMatch(/sample planning assumptions/i)
    expect(text).toMatch(/not deadlines/i)
  })

  it('teaches Continuous Access Evaluation as a session control, not a check of the cryptographic pillars', () => {
    const text = pageTextWithRoadmap()
    const principle = text.slice(text.indexOf('For each pillar'))
    expect(principle).toMatch(/interoperability/i)
    expect(principle).toMatch(/certificate-chain/i)
    expect(principle).toMatch(/key custody/i)
    expect(principle).toMatch(/integrity/i)
    expect(principle).toMatch(/Continuous Access Evaluation/)
    expect(principle).toMatch(/does not validate/i)
    expect(text).not.toMatch(/Validate each pillar with Continuous Access Evaluation/)
  })

  it('counts the plan in relative years, not calendar years that have already passed', () => {
    const text = pageTextWithRoadmap()
    for (const year of ['Year 1', 'Year 2', 'Year 3', 'Year 4']) expect(text).toContain(year)
    expect(text).not.toMatch(/\b202[5-8]\b/)
  })

  it('does not present hybrid TLS as needing no application or intermediary changes', () => {
    const text = pageTextWithRoadmap()
    expect(text).not.toMatch(/with no app changes/i)
    expect(text).toMatch(/every TLS-terminating proxy or load balancer/i)
  })

  it('does not set an invented pure-PQC date or a start date already in the past', () => {
    const text = pageTextWithRoadmap()
    expect(text).not.toMatch(/pure PQC\s+after 2028/i)
    expect(text).not.toMatch(/plan\s+before 2026/i)
  })
})
