// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TestStrategyBuilder } from './TestStrategyBuilder'

const flat = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ')

describe('TestStrategyBuilder: the milestone control is a planning tag with its own scope', () => {
  it('labels the control as a planning tag and says it does not change the generated sequence', () => {
    const { container } = render(<TestStrategyBuilder />)
    const t = flat(container)
    expect(t).toMatch(/planning tag/)
    expect(t).toMatch(/does not change the generated sequence/)
  })

  it('does not present the EU roadmap milestone as a NIS2 obligation', () => {
    const { container } = render(<TestStrategyBuilder />)
    expect(flat(container)).not.toMatch(/Crypto Inventory \(NIS2\)/)
    fireEvent.click(screen.getByText('EU roadmap milestone, end of 2026'))
    const t = flat(container)
    expect(t).toMatch(/recommended timeline addressed to EU Member States/)
    expect(t).toMatch(/guidance, not a legal deadline for a company/)
  })

  it('scopes the NIST milestones to NIST standards and guidelines', () => {
    const { container } = render(<TestStrategyBuilder />)
    expect(flat(container)).toMatch(/under NIST standards and guidelines/)
    fireEvent.click(screen.getByText('NIST IR 8547: disallowed after 2035'))
    expect(flat(container)).toMatch(/Whether it binds you depends on the policy that adopts it/)
  })

  it('the generated sequence is identical for every milestone (so it is only a tag)', () => {
    render(<TestStrategyBuilder />)
    const seq = () => flat(screen.getByText(/Generated Test Sequence/).parentElement!)
    fireEvent.click(screen.getByText('EU roadmap milestone, end of 2026'))
    const a = seq()
    fireEvent.click(screen.getByText('NIST IR 8547: disallowed after 2035'))
    expect(seq()).toBe(a)
  })
})
