// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CitationTierChip } from './CitationTierChip'

describe('CitationTierChip', () => {
  it('renders nothing when tier is undefined', () => {
    const { container } = render(<CitationTierChip tier={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an "A" glyph for Authoritative', () => {
    render(<CitationTierChip tier="Authoritative" />)
    const chip = screen.getByLabelText(/Authoritative/i)
    expect(chip).toBeInTheDocument()
    expect(chip.textContent).toBe('A')
  })

  it('renders an "H" glyph for High', () => {
    render(<CitationTierChip tier="High" />)
    expect(screen.getByLabelText(/High/i).textContent).toBe('H')
  })

  it('renders an "M" glyph for Moderate', () => {
    render(<CitationTierChip tier="Moderate" />)
    expect(screen.getByLabelText(/Moderate/i).textContent).toBe('M')
  })

  it('renders an "L" glyph for Low', () => {
    render(<CitationTierChip tier="Low" />)
    expect(screen.getByLabelText(/Low/i).textContent).toBe('L')
  })

  it('exposes accessible aria-label', () => {
    render(<CitationTierChip tier="Authoritative" />)
    expect(screen.getByLabelText('Trust tier: Authoritative')).toBeInTheDocument()
  })

  it('passes through additional className', () => {
    const { container } = render(<CitationTierChip tier="High" className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
  })

  it('uses semantic-token color classes (no raw palette)', () => {
    const { container } = render(<CitationTierChip tier="Authoritative" />)
    const cls = (container.firstChild as HTMLElement).className
    expect(cls).toMatch(/text-status-success/)
    expect(cls).not.toMatch(/text-green-/)
    expect(cls).not.toMatch(/bg-blue-/)
  })
})
