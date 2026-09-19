// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { UnderstandingCheckCard } from './UnderstandingCheckCard'
import { quizCategories } from '@/data/quizDataLoader'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'

describe('UnderstandingCheckCard (round 9, wave 2)', () => {
  it('renders the quiz handoff with the question count for a module that is a quiz category', () => {
    const cat = quizCategories.find((c) => c.questionCount > 0)!
    render(
      <MemoryRouter>
        <UnderstandingCheckCard moduleId={cat.id} moduleTitle="Sample" />
      </MemoryRouter>
    )
    expect(screen.getByTestId('understanding-check')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Take the quiz/ })).toHaveAttribute(
      'href',
      `/learn/quiz?category=${cat.id}`
    )
    expect(
      screen.getByText(new RegExp(`${cat.questionCount} questions? on Sample`))
    ).toBeInTheDocument()
  })
  it('renders nothing for a module with no quiz category', () => {
    const { container } = render(
      <MemoryRouter>
        <UnderstandingCheckCard moduleId="not-a-category" moduleTitle="X" />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
  it('covers most modules: at least 55 module ids are quiz categories with questions', () => {
    const ids = new Set(
      quizCategories.filter((c) => c.questionCount > 0).map((c) => c.id as string)
    )
    const covered = MANIFESTS.filter((m) => m.id !== 'quiz' && ids.has(m.id)).length
    expect(covered).toBeGreaterThanOrEqual(55)
  })
})
