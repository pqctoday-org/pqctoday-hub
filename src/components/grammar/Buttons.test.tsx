// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { RoleButton, ROLE_VARIANT } from './RoleButton'
import { FacetPill } from './FacetPill'

describe('RoleButton', () => {
  it('has three roles, secondary being the default outline', () => {
    expect(Object.keys(ROLE_VARIANT)).toEqual(['primary', 'secondary', 'quiet'])
    render(<RoleButton>Open</RoleButton>)
    const b = screen.getByRole('button', { name: 'Open' })
    expect(b).toHaveAttribute('type', 'button')
    expect(b.className).toContain('border-ink')
    expect(b.className).toContain('bg-card')
  })

  it.each([
    ['primary', 'bg-primary'],
    ['secondary', 'bg-card'],
    ['quiet', 'underline'],
  ] as const)('%s role looks like itself', (emphasis, token) => {
    render(<RoleButton emphasis={emphasis}>x</RoleButton>)
    expect(screen.getByRole('button').className).toContain(token)
  })

  it('is 44 px high and its label wraps; dense is 36 px', () => {
    const { rerender } = render(<RoleButton>A long label that wraps onto a second line</RoleButton>)
    let cls = screen.getByRole('button').className
    expect(cls).toContain('min-h-[44px]')
    expect(cls).toContain('whitespace-normal')
    expect(cls).not.toContain('whitespace-nowrap')
    expect(cls).toContain('h-auto')
    rerender(<RoleButton dense>Dense</RoleButton>)
    cls = screen.getByRole('button').className
    expect(cls).toContain('min-h-[36px]')
    expect(cls).not.toMatch(/(^| )min-h-\[44px\]/)
  })

  it('passes clicks and disabled through', () => {
    const onClick = vi.fn()
    const { rerender } = render(<RoleButton onClick={onClick}>Go</RoleButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(
      <RoleButton onClick={onClick} disabled>
        Go
      </RoleButton>
    )
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('FacetPill', () => {
  it('is a toggle with aria-pressed, not a plain button', () => {
    const onToggle = vi.fn()
    const { rerender } = render(
      <FacetPill label="High" pressed={false} onToggle={onToggle} count={12} />
    )
    const pill = screen.getByRole('button', { name: /High/ })
    expect(pill).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(pill)
    expect(onToggle).toHaveBeenCalledWith(true)
    rerender(<FacetPill label="High" pressed onToggle={onToggle} />)
    expect(screen.getByRole('button', { name: 'High' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'High' }))
    expect(onToggle).toHaveBeenLastCalledWith(false)
  })

  it('grows to 44 px on phones', () => {
    render(<FacetPill label="Low" pressed={false} onToggle={() => {}} />)
    expect(screen.getByRole('button').className).toContain('max-md:min-h-[44px]')
  })
})
