// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Introduction } from './Introduction'

vi.mock('../../../common/roleGuide', () => ({
  RoleIntroduction: () => <h1>Existing operations introduction</h1>,
}))

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})
const open = () =>
  render(
    <MemoryRouter>
      <Introduction onNavigateToWorkshop={vi.fn()} />
    </MemoryRouter>
  )

describe('Actual operations worked-check consumer', () => {
  it('executes positive, failed, duplicate and unknown-item accounting in the rendered introduction', () => {
    open()
    expect(
      screen.getByRole('heading', { name: 'Existing operations introduction' })
    ).toBeInTheDocument()
    expect(screen.getByText('1 of 3 recorded at target version; 2 remaining.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Record A success' }))
    fireEvent.click(screen.getByRole('button', { name: 'Record B failure' }))
    expect(screen.getByText('2 of 3 recorded at target version; 1 remaining.')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Rewrap observation result' })).toHaveTextContent(
      'operation failed'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Record A success' }))
    expect(screen.getByRole('status', { name: 'Rewrap observation result' })).toHaveTextContent(
      'duplicate'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Try unknown item' }))
    expect(screen.getByRole('status', { name: 'Rewrap observation result' })).toHaveTextContent(
      'no completion credit'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Record B success' }))
    expect(screen.getByText('3 of 3 recorded at target version; 0 remaining.')).toBeInTheDocument()
  })

  it('executes custody refusal and a visibly modeled positive without claiming hardware failover', () => {
    open()
    const result = () => screen.getByRole('status', { name: 'Modeled key request result' })
    expect(result()).toHaveTextContent('Not run')
    fireEvent.click(screen.getByRole('button', { name: 'Model generation error' }))
    expect(result()).toHaveTextContent('pending: Generation failed')
    fireEvent.click(screen.getByRole('button', { name: 'Model software key with audit' }))
    expect(result()).toHaveTextContent('refused: A software key does not satisfy')
    fireEvent.click(screen.getByRole('button', { name: 'Model audit record only' }))
    expect(result()).toHaveTextContent('pending: No successful HSM key handle')
    fireEvent.click(screen.getByRole('button', { name: 'Model restored HSM response' }))
    expect(result()).toHaveTextContent('complete: Modeled new-key request complete')
    expect(result()).toHaveTextContent('does not recover an old key')
    expect(screen.getByText(/No Vault server or HSM operation runs here/)).toBeInTheDocument()
    expect(screen.getByText(/A handle alone does not prove hardware custody/)).toBeInTheDocument()
  })

  it('resets only local exercise state and leaves existing learner persistence untouched', () => {
    localStorage.setItem('pqc-assessment-form', '{"fictional":"unchanged"}')
    localStorage.setItem('pki-module-storage', '{"progress":"unchanged"}')
    const before = { ...localStorage }
    const write = vi.spyOn(Storage.prototype, 'setItem')
    const remove = vi.spyOn(Storage.prototype, 'removeItem')
    open()
    fireEvent.click(screen.getByRole('button', { name: 'Record A success' }))
    fireEvent.click(screen.getByRole('button', { name: 'Model restored HSM response' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reset worked checks' }))
    expect(screen.getByText('1 of 3 recorded at target version; 2 remaining.')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Modeled key request result' })).toHaveTextContent(
      'Not run'
    )
    expect(write).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
    expect({ ...localStorage }).toEqual(before)
  })

  it('links to the actual existing KMS runbook and software-token lesson routes', () => {
    open()
    expect(
      screen.getByRole('link', { name: 'Open the maintained KMS migration commands' })
    ).toHaveAttribute('href', '/learn/kms-pqc?tab=workshop&step=4')
    expect(
      screen.getByRole('link', { name: 'Open the PKCS#11 sample operations' })
    ).toHaveAttribute('href', '/learn/hsm-pqc?tab=workshop&step=0')
  })
})
