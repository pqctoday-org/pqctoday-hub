// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The SC 27 member counts are ISO's, from the committee page (participation view): 56
 * participating and 38 observing members. They are printed with that source and the day they
 * were read, in the lesson, the organization data and the lesson summary.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { Introduction } from './components/Introduction'
import { CLASSIFY_CARDS, ORGANIZATIONS, SC27_MEMBERS } from './data'
import ragSummary from './rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')
const STAMP = 'ISO committee page, participation view, read 25 October 2026'

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

describe('StandardsBodies: SC 27 member counts carry a source and a date', () => {
  it('records the counts as read on the ISO committee page', () => {
    expect(SC27_MEMBERS.participating).toBe(56)
    expect(SC27_MEMBERS.observing).toBe(38)
    expect(`${SC27_MEMBERS.source}, read ${SC27_MEMBERS.readOn}`).toBe(STAMP)
  })

  it('the organization data and the classifier hint print the stamp next to the counts', () => {
    const iso = ORGANIZATIONS.find((o) => o.id === 'iso-iec')
    expect(iso?.decisionMaking).toContain(`56 participating and 38 observing members: ${STAMP}`)
    const card = CLASSIFY_CARDS.find((c) => c.id === 'iso-iec')
    expect(card?.hint).toContain(`56 participating, 38 observing in SC 27; ${STAMP}`)
  })

  it('the lesson prints the stamp wherever it gives a count', () => {
    const text = lessonText()
    expect(text).toContain(`56 participating national bodies, ${STAMP}`)
    expect(text).toContain(`56 participating and 38 observing national bodies (${STAMP})`)
    // no bare count left
    expect(text).not.toContain('56 participating national bodies)')
    expect(text).not.toMatch(/38 observing national bodies(?! \()/)
  })

  it('the lesson summary prints the stamp too', () => {
    const rag = flat(ragSummary)
    expect(rag).toContain(
      'National member bodies (56 participating and 38 observing in SC 27: ISO committee page, participation view, read 25 October 2026)'
    )
    expect(rag).toContain(
      '56 participating and 38 observing national bodies on the ISO committee page, read 25 October 2026'
    )
  })
})
