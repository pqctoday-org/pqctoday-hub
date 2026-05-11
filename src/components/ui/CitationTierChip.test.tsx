// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CitationTierChip } from './CitationTierChip'

describe('CitationTierChip', () => {
  it('renders nothing when tier is undefined', () => {
    const { container } = render(<CitationTierChip tier={undefined} />)
    expect(container.firstChild).toBeNull()
  })

  it.each([
    ['Authoritative', 'A'],
    ['High', 'H'],
    ['Moderate', 'M'],
    ['Low', 'L'],
  ] as const)('tier=%s → renders "%s" glyph with matching aria-label', (tier, glyph) => {
    render(<CitationTierChip tier={tier} />)
    const chip = screen.getByLabelText(`Trust tier: ${tier}`)
    expect(chip.textContent).toBe(glyph)
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
