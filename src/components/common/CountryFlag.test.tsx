// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CountryFlag } from './CountryFlag'

describe('CountryFlag', () => {
  it('renders the flag image with derived src, alt, and class props', () => {
    render(<CountryFlag code="US" className="custom-class" alt="United States" />)
    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', '/flags/us.svg')
    expect(img).toHaveAttribute('alt', 'United States')
    expect(img).toHaveClass('custom-class')
  })

  it('lowercases uppercase country codes in the src path', () => {
    render(<CountryFlag code="us" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', '/flags/us.svg')
  })

  it('returns null (empty DOM) when no code is provided', () => {
    const { container } = render(<CountryFlag code="" />)
    expect(container).toBeEmptyDOMElement()
  })
})
