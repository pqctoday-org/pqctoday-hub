// SPDX-License-Identifier: GPL-3.0-only
/** `?usecase=<useCaseId>` on the Industry Landscape tab. Real landscape data. */
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { useCases } = loadIndustryLandscape()
const uc = useCases.find((u) => u.useCaseId === 'cross-web-tls')!

function Probe() {
  return <span data-testid="url-search">{useLocation().search}</span>
}
const urlSearch = () => screen.getByTestId('url-search').textContent ?? ''
const renderAt = (search: string) =>
  render(
    <MemoryRouter initialEntries={[`/algorithms?tab=landscape${search}`]}>
      <IndustryLandscapeView />
      <Probe />
    </MemoryRouter>
  )
const card = (id: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  document.querySelector(`[data-deeplink-id="usecase-${id}"]`)

describe('IndustryLandscapeView — ?usecase', () => {
  it('opens the use case’s industry and renders its card', async () => {
    renderAt(`&usecase=${uc.useCaseId}`)
    await waitFor(() =>
      expect(urlSearch()).toContain(
        `industry=${encodeURIComponent(uc.industry).replace(/%20/g, '+')}`
      )
    )
    expect(card(uc.useCaseId)).not.toBeNull()
  })

  it('matches case-insensitively and replaces a different industry', async () => {
    const other = useCases.find((u) => u.industry !== uc.industry)!
    renderAt(
      `&industry=${encodeURIComponent(other.industry)}&usecase=${uc.useCaseId.toUpperCase()}`
    )
    await waitFor(() => expect(card(uc.useCaseId)).not.toBeNull())
  })

  it('keeps the mechanism lens when it already lists the use case', async () => {
    const mech = uc.classicalMechanisms[0]
    renderAt(`&mechanism=${encodeURIComponent(mech)}&usecase=${uc.useCaseId}`)
    expect(card(uc.useCaseId)).not.toBeNull()
    expect(urlSearch()).toContain('mechanism=')
    expect(urlSearch()).not.toContain('industry=')
  })

  it('picking another industry clears ?usecase', async () => {
    renderAt(`&usecase=${uc.useCaseId}`)
    await waitFor(() => expect(card(uc.useCaseId)).not.toBeNull())
    fireEvent.click(screen.getByRole('button', { name: /All industries/ }))
    await waitFor(() => expect(urlSearch()).not.toContain('usecase='))
    expect(urlSearch()).not.toContain('industry=')
  })

  it('an unknown use case says so; dismissing clears it', () => {
    renderAt('&usecase=no-such-use-case')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-use-case')
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(urlSearch()).not.toContain('usecase=')
  })
})
