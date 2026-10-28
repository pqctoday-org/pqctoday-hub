// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Membership figures and the Korea card in the Standards Bodies lesson.
 *  - ITU: "a membership of 194 Member States and more than 1000 companies, universities and
 *    international and regional organizations" (itu.int/en/about).
 *  - ETSI: "Uniting over 950 members across more than 60 countries" (etsi.org/about).
 *  - 3GPP states no member count: "There is no direct membership to 3GPP ... The delegates come
 *    to 3GPP via their organization's membership of one of the seven 3GPP Organizational
 *    Partners" (3gpp.org/about-us/membership).
 * Each figure is printed with its source and the day it was read. The Korea card reads as one
 * sentence about the July 2023 national master plan.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Introduction } from './components/Introduction'
import { ORGANIZATIONS } from './data'
import ragSummary from './rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

const lessonText = () => {
  // jsdom has no scrollIntoView; the stepper calls it when a step is opened
  Element.prototype.scrollIntoView = vi.fn()
  render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={vi.fn()} />
    </MemoryRouter>
  )
  let text = flat(document.body.textContent ?? '')
  for (const step of ['Gov vs Non-Gov', 'Global & Regional']) {
    fireEvent.click(screen.getByText(step))
    text += ' ' + flat(document.body.textContent ?? '')
  }
  return text
}

const ITU_STAMP =
  '194 Member States and more than 1000 companies, universities and international and regional organizations (itu.int/en/about, read 26 October 2026)'
const ETSI_STAMP =
  'over 950 members across more than 60 countries, etsi.org/about, read 26 October 2026'

describe('StandardsBodies: membership figures carry a source and a date', () => {
  it('prints the ITU, ETSI and 3GPP membership with source and read date, and none of the old figures', () => {
    const text = lessonText()
    expect(text).toContain(ITU_STAMP)
    expect(text).toContain(`European telecom standards (${ETSI_STAMP})`)
    expect(text).toContain(
      'Through one of the seven Organizational Partners; no direct membership (3gpp.org/about-us/membership, read 26 October 2026)'
    )
    expect(text).not.toContain('193 UN member states')
    expect(text).not.toContain('800+ member orgs')
    expect(text).not.toContain('700+ member companies')
  })

  it('the ETSI organization data and the lesson summary use the same sourced figure', () => {
    const etsi = ORGANIZATIONS.find((o) => o.id === 'etsi')
    expect(etsi?.decisionMaking).toContain(
      'Industry membership (over 950 members across more than 60 countries: etsi.org/about, read 26 October 2026)'
    )
    expect(etsi?.decisionMaking).not.toMatch(/800\+|68 countries/)
    const rag = flat(ragSummary)
    expect(rag).toContain(
      'ETSI is European (over 950 members across more than 60 countries on etsi.org/about, read 26 October 2026'
    )
    expect(rag).not.toContain('800+')
  })
})

describe('StandardsBodies: Korea card', () => {
  it('reads as one sentence about the July 2023 national master plan', () => {
    const text = lessonText()
    expect(text).toContain(
      'no standardization date is published. The July 2023 national master plan (NIS and the Ministry of Science and ICT) targets 2035 for spreading PQC.'
    )
    expect(text).not.toContain('The national The')
  })
})
