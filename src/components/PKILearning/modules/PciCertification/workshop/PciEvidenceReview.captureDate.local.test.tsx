// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { PciEvidenceReview } from './PciEvidenceReview'
import { pciListingFixture } from '../data/pciListingFixture'

const originalAsOf = pciListingFixture.asOf
const renderReader = () => {
  render(
    <MemoryRouter>
      <PciEvidenceReview />
    </MemoryRouter>
  )
  return screen.getByRole('region', { name: 'Part A — Read a real PTS HSM listing' })
}

afterEach(() => {
  pciListingFixture.asOf = originalAsOf
})

describe('PCI listing historical capture attribution', () => {
  it('uses the recorded capture in both aliases, separately from the later subset recheck', () => {
    const view = renderReader()
    expect(view).toHaveTextContent('Historical fixture capture: 24 September 2026.')
    expect(view).toHaveTextContent('fixture captured 24 September 2026')
    expect(view).toHaveTextContent(
      'listings 4-40266 and 4-70041 were checked again on 22 October 2026'
    )
    expect(view).not.toHaveTextContent('30 October 2026')
    expect(within(view).getByRole('link', { name: 'PCI SSC listing 4-40266' })).toHaveAttribute(
      'href',
      pciListingFixture.entries[0].sourceUrl
    )
  })

  it.each(['', '2026-02-30', 'not-a-date'])('does not invent a capture date for %j', (value) => {
    pciListingFixture.asOf = value
    const view = renderReader()
    expect(view).toHaveTextContent('Historical fixture capture: Not recorded.')
    expect(view).toHaveTextContent('fixture captured Not recorded')
    expect(view).not.toHaveTextContent('fixture captured 30 October 2026')
  })
})
