// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CuriousSummaryBanner } from './CuriousSummaryBanner'

const imageSources = () =>
  screen
    .getAllByRole('img')
    .map((image) => image.getAttribute('src'))
    .filter((src) => src?.startsWith('/images/infographics/'))
const view = (moduleId: string) => (
  <MemoryRouter>
    <CuriousSummaryBanner moduleId={moduleId} isFullPage />
  </MemoryRouter>
)

describe('corrected AI infographic cache identity', () => {
  it('uses the corrected image revision in both layouts and the zoom overlay', () => {
    render(view('ai-security-pqc'))
    const corrected = '/images/infographics/pqcstd_ai-security-pqc.png?v=65181ab040311ff4'
    expect(imageSources()).toEqual([corrected, corrected])
    expect(corrected).not.toBe('/images/infographics/pqcstd_ai-security-pqc.png?v=pqcstd_v4')
    fireEvent.click(screen.getAllByRole('button', { name: 'View infographic full size' })[0])
    expect(imageSources()).toEqual([corrected, corrected, corrected])
    fireEvent.click(screen.getAllByRole('button', { name: 'Close infographic' }).at(-1)!)
    expect(imageSources()).toEqual([corrected, corrected])
  })

  it('preserves other modules and resets the URL when the module changes', () => {
    const { rerender } = render(view('hybrid-crypto'))
    expect(imageSources()).toEqual(
      Array(2).fill('/images/infographics/pqcstd_hybrid-crypto.png?v=pqcstd_v4')
    )
    rerender(view('ai-security-pqc'))
    expect(imageSources()).toEqual(
      Array(2).fill('/images/infographics/pqcstd_ai-security-pqc.png?v=65181ab040311ff4')
    )
    rerender(view('hybrid-crypto'))
    expect(imageSources()).toEqual(
      Array(2).fill('/images/infographics/pqcstd_hybrid-crypto.png?v=pqcstd_v4')
    )
  })
})

describe('corrected MTC authentication-component infographic cache identity', () => {
  it('uses the actual corrected bitmap identity in both layouts and the zoom overlay', () => {
    const revision = createHash('sha256')
      .update(readFileSync('public/images/infographics/pqcstd_merkle-tree-certs.png'))
      .digest('hex')
      .slice(0, 16)
    const corrected = `/images/infographics/pqcstd_merkle-tree-certs.png?v=${revision}`
    render(view('merkle-tree-certs'))
    expect(imageSources()).toEqual([corrected, corrected])
    expect(imageSources()).not.toContain(
      '/images/infographics/pqcstd_merkle-tree-certs.png?v=pqcstd_v4'
    )
    fireEvent.click(screen.getAllByRole('button', { name: 'View infographic full size' })[0])
    expect(imageSources()).toEqual([corrected, corrected, corrected])
    fireEvent.click(screen.getAllByRole('button', { name: 'Close infographic' }).at(-1)!)
    expect(imageSources()).toEqual([corrected, corrected])
  })
})
