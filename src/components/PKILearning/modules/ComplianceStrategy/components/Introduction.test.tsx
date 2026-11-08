// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { Introduction } from './Introduction'

beforeAll(() => {
  Element.prototype.scrollIntoView = () => {}
})

/** Text of one stepper step, collapsed to single spaces. */
function stepText(label: string): string {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <Introduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  const tab = screen.getAllByText(label)[0]
  fireEvent.click(tab)
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

describe('Compliance Strategy: CNSA 2.0 lifecycle', () => {
  it('separates acquisition, installed-system phase-out and algorithm adoption dates', () => {
    const text = stepText('Compliance Landscape')
    expect(text).toMatch(/new acquisitions must use CNSA 2\.0 algorithms from 1 January 2027/)
    expect(text).toMatch(/installed equipment and services.*phased out by 31 December 2030/)
    expect(text).toMatch(
      /use of CNSA 2\.0 algorithms is mandated by 31 December 2031 unless otherwise noted/
    )
    // the 2035 goal is not a CNSA 2.0 date, and the scope is NSS only
    expect(text).toMatch(
      /NSM-10.s 2035 goal is a separate government-wide goal, not a CNSA 2\.0 date/
    )
    expect(text).toMatch(/does not mandate requirements on any entity outside NSS/)
    // the old single-line schedule is gone
    expect(text).not.toMatch(/operating-system support by 2027/)
    expect(text).not.toMatch(/mandates PQC adoption for National Security Systems/)
  })

  it('states SLH-DSA and the NSS scope as the CNSA 2.0 documents do', () => {
    const text = stepText('Compliance Landscape')
    expect(text).toMatch(/SLH-DSA is not part of CNSA 2\.0 and is not approved for any use in NSS/)
    expect(text).not.toMatch(/as minimum security levels/)
  })
})

describe('Compliance Strategy: country table', () => {
  it('treats national security system status as an input and keeps the US clocks apart', () => {
    const text = stepText('Deadlines & Workshop')
    expect(text).toMatch(/whether a contract or system is an NSS is an input to check first/)
    expect(text).toMatch(/directs a proposed FAR rule that would require covered contractors/)
    expect(text).not.toMatch(/NSS transition complete by 2035 per NSM-10/)
  })

  it('gives Singapore distinct financial-sector and CII/general scopes with source dates', () => {
    const text = stepText('Deadlines & Workshop')
    expect(text).toMatch(/MAS\/TCRS\/2024\/01 \(20 February 2024\)/)
    expect(text).toMatch(/28 July 2026 MAS said it will issue supervisory expectations/)
    expect(text).toMatch(/draft Quantum-Safe Migration Handbook \(version 0\.1, 23 October 2025\)/)
    expect(text).toMatch(/voluntary and not prescriptive/)
    expect(text).not.toMatch(/No hard mandate yet/)
  })

  it('does not give the Czech Republic a 2027 deadline or a first-in-the-EU claim', () => {
    const text = stepText('Deadlines & Workshop')
    expect(text).not.toMatch(
      /First EU member state to set a specific encryption migration deadline/
    )
    expect(text).toMatch(/estimates the end of 2030 as the appropriate completion date/)
    expect(text).toMatch(/We found no 2027 migration deadline in either document/)
  })

  it('does not present a Taiwanese semiconductor 2027 target as established', () => {
    const text = stepText('Deadlines & Workshop')
    expect(text).not.toMatch(
      /PQC migration target for critical semiconductor and technology sectors/
    )
    expect(text).toMatch(/A 2027 semiconductor-sector target is not verified here/)
  })
})
