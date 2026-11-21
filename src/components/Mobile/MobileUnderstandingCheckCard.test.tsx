// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileUnderstandingCheckCard } from './MobileUnderstandingCheckCard'
import { quizCategories } from '@/data/quizDataLoader'

describe('MobileUnderstandingCheckCard', () => {
  it('renders the quiz handoff with question count for a module that is a quiz category', () => {
    const cat = quizCategories.find((c) => c.questionCount > 0)!
    render(
      <MemoryRouter>
        <MobileUnderstandingCheckCard moduleId={cat.id} moduleTitle="Sample Mobile Module" />
      </MemoryRouter>
    )
    expect(screen.getByTestId('understanding-check')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Take the quiz/ })).toHaveAttribute(
      'href',
      `/learn/quiz?category=${cat.id}`
    )
    expect(
      screen.getByText(new RegExp(`${cat.questionCount} questions? on Sample Mobile Module`))
    ).toBeInTheDocument()
  })

  it('resolves custody-threats-controls to the digital-assets quiz category', () => {
    const digitalAssetsCat = quizCategories.find((c) => c.id === 'digital-assets')!
    render(
      <MemoryRouter>
        <MobileUnderstandingCheckCard
          moduleId="custody-threats-controls"
          moduleTitle="Custody Key Threats & Controls"
        />
      </MemoryRouter>
    )
    expect(screen.getByTestId('understanding-check')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Take the quiz/ })).toHaveAttribute(
      'href',
      '/learn/quiz?category=digital-assets'
    )
    expect(
      screen.getByText(
        new RegExp(`${digitalAssetsCat.questionCount} questions? on Custody Key Threats & Controls`)
      )
    ).toBeInTheDocument()
  })

  it('renders nothing for a module with no quiz category', () => {
    const { container } = render(
      <MemoryRouter>
        <MobileUnderstandingCheckCard moduleId="not-a-category" moduleTitle="Unknown" />
      </MemoryRouter>
    )
    expect(container).toBeEmptyDOMElement()
  })
})
