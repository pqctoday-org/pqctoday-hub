// SPDX-License-Identifier: AGPL-3.0-only
import { useCallback, useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LiveHSMToggle } from './LiveHSMToggle'
import { useHSMMode } from '@/store/useHSMMode'
import type { UseHSMResult } from '@/hooks/useHSM'
const calls = { initialize: vi.fn(), finalize: vi.fn(), setEngine: vi.fn() }
function Harness({
  autoInit = true,
  locked = false,
  fail = false,
}: {
  autoInit?: boolean
  locked?: boolean
  fail?: boolean
}) {
  const [phase, setPhase] = useState<UseHSMResult['phase']>('idle')
  const initialize = useCallback(async () => {
    calls.initialize()
    setPhase('loading')
    await Promise.resolve()
    setPhase(fail ? 'error' : 'session_open')
  }, [fail])
  const finalize = useCallback(() => {
    calls.finalize()
    setPhase('idle')
  }, [])
  const hsm = {
    phase,
    initialize,
    finalize,
    engine: 'rust',
    setEngine: calls.setEngine,
    error: 'sample initialization error',
  } as unknown as UseHSMResult
  return (
    <LiveHSMToggle
      hsm={hsm}
      operations={['C_Sign']}
      autoInit={autoInit}
      preventDisable={locked}
      preventDisableReason="Sample key remains in use"
    />
  )
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  useHSMMode.setState({ liveHsmEnabled: true })
})
describe('Live HSM saved mode preference', () => {
  it('keeps the enabled default and automatically initializes', async () => {
    render(<Harness />)
    await screen.findByText('Live HSM Mode Active')
    expect(calls.initialize).toHaveBeenCalledTimes(1)
    expect(useHSMMode.getState().liveHsmEnabled).toBe(true)
  })
  it('honours Disable after finalize returns to idle', async () => {
    render(<Harness />)
    await screen.findByText('Live HSM Mode Active')
    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))
    expect(screen.getByRole('button', { name: 'Enable' })).toBeEnabled()
    await act(async () => {
      await Promise.resolve()
    })
    expect(calls.initialize).toHaveBeenCalledTimes(1)
    expect(calls.finalize).toHaveBeenCalledTimes(1)
    expect(useHSMMode.getState().liveHsmEnabled).toBe(false)
    expect(JSON.parse(localStorage.getItem('pqc-hsm-mode-storage')!).state.liveHsmEnabled).toBe(
      false
    )
  })
  it('does not start a newly mounted lesson while the preference is disabled', async () => {
    useHSMMode.getState().setLiveHsm(false)
    const view = render(<Harness />)
    expect(screen.getByRole('button', { name: 'Enable' })).toBeVisible()
    view.unmount()
    render(<Harness />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(calls.initialize).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Enable' })).toBeEnabled()
  })
  it('uses the existing persisted preference on rehydration', async () => {
    localStorage.setItem(
      'pqc-hsm-mode-storage',
      JSON.stringify({ version: 1, state: { liveHsmEnabled: false } })
    )
    await act(async () => {
      await useHSMMode.persist.rehydrate()
    })
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Enable' })).toBeVisible()
    expect(calls.initialize).not.toHaveBeenCalled()
  })
  it('explicit Enable restores enabled mode and initializes', async () => {
    useHSMMode.getState().setLiveHsm(false)
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
    await screen.findByText('Live HSM Mode Active')
    expect(useHSMMode.getState().liveHsmEnabled).toBe(true)
    expect(calls.initialize).toHaveBeenCalledTimes(1)
  })
  it('keeps manual-only consumers manual even with the enabled default', async () => {
    render(<Harness autoInit={false} />)
    expect(calls.initialize).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
    await screen.findByText('Live HSM Mode Active')
    expect(calls.initialize).toHaveBeenCalledTimes(1)
  })
  it('preserves the lock for keys still in use', async () => {
    render(<Harness locked />)
    await screen.findByText('Live HSM Mode Active')
    const button = screen.getByRole('button', { name: 'Disable' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('title', 'Sample key remains in use')
    fireEvent.click(button)
    expect(calls.finalize).not.toHaveBeenCalled()
    expect(useHSMMode.getState().liveHsmEnabled).toBe(true)
  })
  it('retains visible initialization failure and explicit retry', async () => {
    const view = render(<Harness fail />)
    await screen.findByText('HSM initialization failed')
    expect(calls.initialize).toHaveBeenCalledTimes(1)
    view.rerender(<Harness fail={false} />)
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    await screen.findByText('Live HSM Mode Active')
    expect(calls.initialize).toHaveBeenCalledTimes(2)
  })
})
