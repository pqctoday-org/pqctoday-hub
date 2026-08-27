// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { CommandPalette } from './CommandPalette'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
})

function renderPalette() {
  return render(
    <MemoryRouter>
      <CommandPalette isOpen onClose={vi.fn()} />
    </MemoryRouter>
  )
}

describe('CommandPalette — mobile shell input font size (iOS Safari auto-zoom fix)', () => {
  it('desktop: keeps the existing 14px text-sm input (Rule 1 — zero desktop impact)', () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderPalette()
    const input = screen.getByRole('combobox', { name: 'Search' })
    expect(input.className).toContain('text-sm')
    expect(input.className).not.toContain('text-base')
  })

  it('mobile shell: bumps to 16px text-base so focusing the input does not trigger iOS Safari page-zoom', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderPalette()
    const input = screen.getByRole('combobox', { name: 'Search' })
    expect(input.className).toContain('text-base')
    expect(input.className).not.toContain('text-sm')
  })
})
