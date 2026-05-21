// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PersonaChip } from './PersonaChip'
import { usePersonaStore } from '@/store/usePersonaStore'

vi.mock('@/utils/analytics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/analytics')>()
  return {
    ...actual,
    logPersonaSwitchClicked: vi.fn(),
    logPersonaSelected: vi.fn(),
  }
})

describe('PersonaChip', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: null })
    vi.clearAllMocks()
  })

  it('renders nothing when no persona is selected', () => {
    const { container } = render(<PersonaChip />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the active persona label when one is set', () => {
    usePersonaStore.setState({ selectedPersona: 'executive' })
    render(<PersonaChip />)
    expect(screen.getByRole('button')).toHaveAccessibleName(/current role/i)
    expect(screen.getByText('Executive')).toBeInTheDocument()
  })

  it('logs Persona Switch Clicked with source="nav" on click', async () => {
    const { logPersonaSwitchClicked } = await import('@/utils/analytics')
    usePersonaStore.setState({ selectedPersona: 'developer' })
    render(<PersonaChip />)
    fireEvent.click(screen.getByRole('button'))
    expect(logPersonaSwitchClicked).toHaveBeenCalledWith('nav')
  })
})
