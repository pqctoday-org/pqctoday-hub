// SPDX-License-Identifier: GPL-3.0-only
/**
 * The unit tests for `splitCitations` prove the parsing. These prove the
 * rendering, which is a separate question: the component falls back to plain
 * text outside a router, so a test that forgot the router would pass while
 * proving nothing about the links.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CitedText } from './CitedText'

describe('CitedText', () => {
  it('renders a resolvable citation as a link into the library', () => {
    render(
      <MemoryRouter>
        <CitedText>ML-KEM (FIPS 203) tested in representative environments.</CitedText>
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: 'FIPS 203' })
    expect(link.getAttribute('href')).toContain('/library?ref=')
  })

  it('links every document in a compound citation, not just the first', () => {
    render(
      <MemoryRouter>
        <CitedText>FIPS 203/204/205 algorithm compliance.</CitedText>
      </MemoryRouter>
    )
    // "204" and "205" are rendered as bare numbers next to the "/" separators,
    // which is how the source prose reads.
    expect(screen.getByRole('link', { name: 'FIPS 203' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '204' })).toBeTruthy()
    expect(screen.getByRole('link', { name: '205' })).toBeTruthy()
  })

  it('leaves prose without a resolvable citation completely untouched', () => {
    const prose = 'Archive all testing results for audit evidence.'
    render(
      <MemoryRouter>
        <CitedText>{prose}</CitedText>
      </MemoryRouter>
    )
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText(prose)).toBeTruthy()
  })

  it('renders as plain text outside a router instead of throwing', () => {
    const prose = 'Sanitize per NIST SP 800-88 before disposal.'
    render(<CitedText>{prose}</CitedText>)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText(prose)).toBeTruthy()
  })

  it('preserves the full sentence around the links', () => {
    const prose = 'ML-KEM (FIPS 203), ML-DSA (FIPS 204), and SLH-DSA (FIPS 205) tested.'
    const { container } = render(
      <MemoryRouter>
        <CitedText>{prose}</CitedText>
      </MemoryRouter>
    )
    expect(container.textContent).toBe(prose)
  })
})
