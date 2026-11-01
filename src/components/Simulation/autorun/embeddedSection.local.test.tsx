// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbeddedLearnProvider } from '@/components/PKILearning/embeddedLearnContext'
import { useDeepLinkTarget } from '@/components/PKILearning/common/LearnSection'

function Target() {
  return <output aria-label="Selected section">{useDeepLinkTarget()}</output>
}

describe('embedded lesson section links', () => {
  it('uses the selected resource section instead of the surrounding Simulation URL', () => {
    render(
      <MemoryRouter initialEntries={['/simulation?section=other']}>
        <EmbeddedLearnProvider initialSection="management-tools">
          <Target />
        </EmbeddedLearnProvider>
      </MemoryRouter>
    )
    expect(screen.getByLabelText('Selected section')).toHaveTextContent('management-tools')
  })

  it.each(['/learn/example?section=capabilities', '/learn/example#capabilities'])(
    'preserves standalone section links: %s',
    (url) => {
      render(
        <MemoryRouter initialEntries={[url]}>
          <Target />
        </MemoryRouter>
      )
      expect(screen.getByLabelText('Selected section')).toHaveTextContent('capabilities')
    }
  )
})
