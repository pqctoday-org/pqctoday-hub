// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The workshop summary must count and name the steps the learner actually
 * gets: the steps the manifest declares are the steps the workshop renders, and
 * the narrative says that many, in that order.
 */
import { describe, it, expect } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCRiskManagementModule } from './index'
import manifest from './manifest'
import { content } from './content'

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six']

describe('PQCRiskManagement workshop step count', () => {
  const steps = manifest.workshopSteps ?? []
  const summary = content.narratives.workshopSummary

  it('renders one workshop step button for every step the manifest declares', () => {
    render(
      <EmbedProvider>
        <MemoryRouter initialEntries={['/learn/pqc-risk-management']}>
          <PQCRiskManagementModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Workshop' }))
    const rendered = screen.getAllByRole('button', { name: /^Step \d+:/ })
    expect(rendered).toHaveLength(steps.length)
    steps.forEach((step, i) => {
      expect(rendered[i]).toHaveAccessibleName(new RegExp(`^Step ${i + 1}: ${step.label}`))
    })
  })

  it('states the manifest step count, not a stale one', () => {
    expect(steps.length).toBeGreaterThan(0)
    const counted = summary.match(/has (\d+|[a-z]+) interactive steps/i)
    expect(counted).not.toBeNull()
    const stated = Number.isNaN(Number(counted![1]))
      ? NUMBER_WORDS.indexOf(counted![1].toLowerCase())
      : Number(counted![1])
    expect(stated).toBe(steps.length)
  })

  it('names every step in the order the workshop shows them', () => {
    let from = 0
    for (const step of steps) {
      const at = summary.indexOf(step.label, from)
      expect(at, `"${step.label}" should appear in order in the workshop summary`).toBeGreaterThan(
        -1
      )
      from = at + step.label.length
    }
  })
})
