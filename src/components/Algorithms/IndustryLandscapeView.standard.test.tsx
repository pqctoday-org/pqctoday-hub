// SPDX-License-Identifier: GPL-3.0-only
/** `?standard=<standard_id>` on the Industry Landscape tab. Real landscape data. */
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import '@testing-library/jest-dom'
import { IndustryLandscapeView } from './IndustryLandscapeView'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'

const { standards, useCases } = loadIndustryLandscape()
const std = standards.find((s) => s.standardId === 'RFC-8446')!

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
const target = (id: string) =>
  // eslint-disable-next-line testing-library/no-node-access
  document.querySelectorAll(`[data-deeplink-id="standard-${id}"]`)
const industryParam = (industry: string) =>
  `industry=${encodeURIComponent(industry).replace(/%20/g, '+')}`

describe('IndustryLandscapeView — ?standard', () => {
  it('the fixture standard exists and every standard_id is unique', () => {
    expect(std).toBeDefined()
    const ids = standards.map((s) => s.standardId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('opens the standard’s industry and renders exactly one target for it', async () => {
    renderAt(`&standard=${std.standardId}`)
    await waitFor(() => expect(urlSearch()).toContain(industryParam(std.industry)))
    expect(target(std.standardId)).toHaveLength(1)
  })

  it('matches case-insensitively and replaces a different industry', async () => {
    const other = useCases.find((u) => u.industry !== std.industry)!
    renderAt(
      `&industry=${encodeURIComponent(other.industry)}&standard=${std.standardId.toLowerCase()}`
    )
    await waitFor(() => expect(urlSearch()).toContain(industryParam(std.industry)))
    expect(target(std.standardId)).toHaveLength(1)
  })

  it('keeps the mechanism lens when the lens lists the standard', () => {
    const mech = std.mechanismsReferenced[0]
    renderAt(`&mechanism=${encodeURIComponent(mech)}&standard=${std.standardId}`)
    expect(target(std.standardId)).toHaveLength(1)
    expect(urlSearch()).toContain('mechanism=')
    expect(urlSearch()).not.toContain('industry=')
  })

  it('picking another industry clears ?standard', async () => {
    renderAt(`&standard=${std.standardId}`)
    await waitFor(() => expect(target(std.standardId)).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: /All industries/ }))
    await waitFor(() => expect(urlSearch()).not.toContain('standard='))
    expect(urlSearch()).not.toContain('industry=')
  })

  it('an unknown standard says so; dismissing clears it', () => {
    renderAt('&standard=NO-SUCH-STANDARD')
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('NO-SUCH-STANDARD')
    fireEvent.click(screen.getByRole('button', { name: /dismiss notice/i }))
    expect(urlSearch()).not.toContain('standard=')
  })

  it('each standard shares its clean ?standard link, without the reader’s view', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderAt(`&industry=${encodeURIComponent(std.industry)}`)
    fireEvent.click(screen.getByRole('button', { name: `Share ${std.standardLabel} — PQC Today` }))
    fireEvent.click(await screen.findByRole('button', { name: /copy link/i }))
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        `${window.location.origin}/algorithms?tab=landscape&standard=${std.standardId}`
      )
    )
  })
})
