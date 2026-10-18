// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Industry Landscape: focus follows the reader's pick (the pressed tile
 * unmounts), and the scope note shows on every viewport. Real landscape data.
 */
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { useCases } = loadIndustryLandscape()
const industry = useCases[0].industry

const renderAt = (search = '') =>
  render(
    <MemoryRouter initialEntries={[`/algorithms?tab=landscape${search}`]}>
      <IndustryLandscapeView />
    </MemoryRouter>
  )

describe('IndustryLandscapeView — focus and scope note', () => {
  it('moves focus to the industry heading after picking an industry', async () => {
    renderAt()
    // eslint-disable-next-line testing-library/no-node-access
    const tile = document.querySelector<HTMLElement>(`[data-industry="${industry}"]`)!
    fireEvent.click(tile)
    const heading = await screen.findByRole('heading', { name: industry })
    await waitFor(() => expect(heading).toHaveFocus())
  })

  it('returns focus to the tile of the industry just left after "All industries"', async () => {
    renderAt()
    // eslint-disable-next-line testing-library/no-node-access
    fireEvent.click(document.querySelector<HTMLElement>(`[data-industry="${industry}"]`)!)
    fireEvent.click(await screen.findByRole('button', { name: /All industries/ }))
    await waitFor(() =>
      // eslint-disable-next-line testing-library/no-node-access
      expect(document.querySelector(`[data-industry="${industry}"]`)).toHaveFocus()
    )
  })

  it('does not steal focus on a deep link', () => {
    renderAt(`&industry=${encodeURIComponent(industry)}`)
    expect(screen.getByRole('heading', { name: industry })).not.toHaveFocus()
  })

  it('shows the context-not-conclusions scope note on the desktop view', () => {
    renderAt()
    expect(screen.getByTestId('landscape-scope-note')).toHaveTextContent(
      /not recommendations or compliance conclusions/
    )
  })

  it('does not present certification badges as a regulatory determination', () => {
    renderAt(`&industry=${encodeURIComponent(industry)}`)
    expect(screen.queryByText(/any one satisfies/)).not.toBeInTheDocument()
    expect(screen.queryByText(/No PQC path yet/)).not.toBeInTheDocument()
  })
})
