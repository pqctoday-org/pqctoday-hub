// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Review screen shows each answer with the label its own question shows. The label tables
 * in reviewModel.ts are copies, so this test reads the real options off the real steps: it
 * clicks every option of a step, takes the answer the store now holds, and requires the
 * review's text for that answer to be the option's own label. A label edited in a step, or a
 * table entry that drifts, fails here.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { summarizeAnswer, type AssessReviewState } from './reviewModel'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { Step6Migration } from '../steps/Step6Migration'
import { Step10CryptoAgility } from '../steps/Step10CryptoAgility'
import { Step9OrgScale } from '../steps/Step9OrgScale'
import { Step13TimelinePressure } from '../steps/Step13TimelinePressure'
import { StepCredentialLifetime } from '../steps/StepCredentialLifetime'
import type { AssessStepKey } from './assessFlowModel'

const state = () => useAssessmentStore.getState() as unknown as AssessReviewState

/** The label an option shows: its bold title when it has one, else its whole text. */
const optionLabel = (radio: HTMLElement) =>
  (radio.querySelector('span.font-bold')?.textContent ?? radio.textContent ?? '').trim()

/**
 * Click each radio of the named group in turn on a fresh render; return what the review says
 * for the answer that click stored, next to the label the option showed.
 */
function reviewForEachOption(
  Step: React.ComponentType,
  key: AssessStepKey,
  group: string | RegExp
): Array<{ label: string; reviewText: string }> {
  const count = (() => {
    useAssessmentStore.getState().reset()
    const view = render(
      <MemoryRouter>
        <Step />
      </MemoryRouter>
    )
    const n = screen
      .getByRole('radiogroup', { name: group })
      .querySelectorAll('[role="radio"]').length
    view.unmount()
    return n
  })()
  const out: Array<{ label: string; reviewText: string }> = []
  for (let i = 0; i < count; i++) {
    useAssessmentStore.getState().reset()
    const view = render(
      <MemoryRouter>
        <Step />
      </MemoryRouter>
    )
    const radio = screen
      .getByRole('radiogroup', { name: group })
      .querySelectorAll<HTMLElement>('[role="radio"]')[i]
    const label = optionLabel(radio)
    fireEvent.click(radio)
    out.push({ label, reviewText: summarizeAnswer(key, state()).text })
    view.unmount()
  }
  return out
}

describe('the review shows each answer with its own question label', () => {
  beforeEach(() => {
    useAssessmentStore.getState().reset()
  })

  it('migration status: "Already Started", "Planning to Start", "Not Started"', () => {
    const rows = reviewForEachOption(Step6Migration, 'migration', 'Migration status')
    expect(rows.map((r) => r.label)).toEqual([
      'Already Started',
      'Planning to Start',
      'Not Started',
    ])
    for (const r of rows) expect(r.reviewText).toBe(r.label)
  })

  it('crypto agility: "Fully Abstracted", "Partially Abstracted", "Hardcoded Throughout"', () => {
    const rows = reviewForEachOption(Step10CryptoAgility, 'agility', /agility/i)
    expect(rows.map((r) => r.label)).toEqual([
      'Fully Abstracted',
      'Partially Abstracted',
      'Hardcoded Throughout',
    ])
    for (const r of rows) expect(r.reviewText).toBe(r.label)
  })

  it('systems and team size', () => {
    const systems = reviewForEachOption(Step9OrgScale, 'scale', 'Number of systems')
    expect(systems).toHaveLength(4)
    for (const r of systems) expect(r.reviewText).toContain(r.label)
    const teams = reviewForEachOption(Step9OrgScale, 'scale', 'Team size')
    expect(teams).toHaveLength(4)
    for (const r of teams) expect(r.reviewText).toContain(r.label)
  })

  it('timeline pressure, when the country has no dated milestones of its own', () => {
    const rows = reviewForEachOption(Step13TimelinePressure, 'timeline', /deadline|timeline/i)
    expect(rows.length).toBeGreaterThanOrEqual(4)
    for (const r of rows) expect(r.reviewText).toBe(r.label)
  })

  it('credential lifetime', () => {
    useAssessmentStore.getState().reset()
    const view = render(
      <MemoryRouter>
        <StepCredentialLifetime />
      </MemoryRouter>
    )
    const radios = screen
      .getByRole('group', { name: 'Credential lifetime selection' })
      .querySelectorAll<HTMLElement>('[role="radio"]')
    const labels = Array.from(radios).map(optionLabel)
    view.unmount()
    expect(labels.length).toBeGreaterThan(0)
    labels.forEach((label, i) => {
      useAssessmentStore.getState().reset()
      const view = render(
        <MemoryRouter>
          <StepCredentialLifetime />
        </MemoryRouter>
      )
      const radio = screen
        .getByRole('group', { name: 'Credential lifetime selection' })
        .querySelectorAll<HTMLElement>('[role="radio"]')[i]
      fireEvent.click(radio)
      expect(summarizeAnswer('credential-lifetime', state()).text, label).toBe(label)
      view.unmount()
    })
  })
})
