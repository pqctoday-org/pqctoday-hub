// SPDX-License-Identifier: GPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { usePersonaStore } from '@/store/usePersonaStore'
import { MobileRolePrompt } from './MobileRolePrompt'

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
  usePersonaStore.setState({ hasSkippedPersonalization: false, hasSeenPersonaPicker: false })
})

describe('MobileRolePrompt', () => {
  it('is one labelled line with a way to pick and a way to dismiss, and no heading', () => {
    render(<MobileRolePrompt onPick={vi.fn()} />)
    expect(screen.getByRole('region', { name: 'Choose your role' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pick your role' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('"Pick your role" calls onPick and changes nothing else', async () => {
    const onPick = vi.fn()
    render(<MobileRolePrompt onPick={onPick} />)
    await userEvent.click(screen.getByRole('button', { name: 'Pick your role' }))
    expect(onPick).toHaveBeenCalledOnce()
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(false)
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })

  it('dismissing skips personalisation and marks the picker seen, like Skip on the picker', async () => {
    render(<MobileRolePrompt onPick={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(usePersonaStore.getState().hasSkippedPersonalization).toBe(true)
    expect(usePersonaStore.getState().hasSeenPersonaPicker).toBe(true)
  })
})
