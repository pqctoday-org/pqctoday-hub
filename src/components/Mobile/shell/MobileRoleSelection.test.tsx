// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MobileRoleSelection } from './MobileRoleSelection'

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
  usePersonaStore.setState({ hasSkippedPersonalization: false, hasSeenPersonaPicker: false })
})

describe('MobileRoleSelection — first run', () => {
  it('renders full-screen (no dialog role) with all six persona cards from RoleHomeView', () => {
    render(<MobileRoleSelection variant="firstRun" />)
    expect(screen.getByText("Who's asking?")).toBeInTheDocument()
    for (const label of [
      'Executive / GRC',
      'Developer / Engineer',
      'Security Architect',
      'IT Ops / DevOps',
      'Researcher / Academic',
      'Curious Explorer',
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
  })

  it('picking a role sets the persona and marks the picker seen', () => {
    render(<MobileRoleSelection variant="firstRun" />)
    fireEvent.click(screen.getByRole('button', { name: /Executive \/ GRC/ }))
    expect(usePersonaStore.getState().selectedPersona).toBe('executive')
    expect(usePersonaStore.getState().hasSeenPersonaPicker).toBe(true)
  })

  it('skipping sets hasSkippedPersonalization without picking a persona', () => {
    render(<MobileRoleSelection variant="firstRun" />)
    fireEvent.click(screen.getByRole('button', { name: 'Show me everything' }))
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(true)
  })
})

describe('MobileRoleSelection — later switching', () => {
  it('renders nothing when closed', () => {
    render(<MobileRoleSelection variant="switch" open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders as a dismissible sheet with the same cards when open', () => {
    render(<MobileRoleSelection variant="switch" open onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Change role')).toBeInTheDocument()
    expect(screen.getByText('Executive / GRC')).toBeInTheDocument()
  })

  it('picking a role sets the persona and closes the sheet', () => {
    const onClose = vi.fn()
    render(<MobileRoleSelection variant="switch" open onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /Developer/ }))
    expect(usePersonaStore.getState().selectedPersona).toBe('developer')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
