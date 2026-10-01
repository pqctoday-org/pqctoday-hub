// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render test for the Talking About PQC Accurately module — asserts the header,
 * the in-page description and the standard six-tab set render, and that the
 * Claim Checker reveals its explanation after a choice.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { TalkingAboutPQCModule } from './index'
import { ChoiceDrill } from './workshop/ChoiceDrill'
import { CLAIMS, QUESTIONS } from './data'

describe('Talking About PQC Accurately module render', () => {
  it('renders the header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <TalkingAboutPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Talking About PQC Accurately' })
    ).toBeInTheDocument()
    expect(screen.getByText(/What is true today, which dates are real/)).toBeInTheDocument()
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })
})

describe('drill data', () => {
  it('gives every item exactly one accurate option and an explanation', () => {
    for (const item of [...CLAIMS, ...QUESTIONS]) {
      expect(item.options.filter((o) => o.correct)).toHaveLength(1)
      expect(item.why.length).toBeGreaterThan(0)
    }
  })

  it('reveals the explanation once an option is picked', () => {
    const [first] = CLAIMS
    render(<ChoiceDrill heading="Claim Checker" intro="intro" items={[first]} />)
    expect(screen.queryByText(first.why)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: first.options[0].text }))
    expect(screen.getByText(first.why)).toBeInTheDocument()
  })
})
