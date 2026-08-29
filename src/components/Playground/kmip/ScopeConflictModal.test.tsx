// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ScopeConflictModal } from './ScopeConflictModal'

describe('ScopeConflictModal', () => {
  const conflict = {
    scope: 'encryption',
    incumbent: 'classical-encryption',
    attempted: 'pqc-encryption',
  }

  it('names the scope, the incumbent, and the attempted module', () => {
    render(
      <ScopeConflictModal conflict={conflict} onDeactivateIncumbent={vi.fn()} onCancel={vi.fn()} />
    )
    expect(screen.getByRole('dialog', { name: 'Scope conflict' })).toBeInTheDocument()
    expect(screen.getByText('classical-encryption')).toBeInTheDocument()
    expect(screen.getByText('encryption')).toBeInTheDocument()
    expect(screen.getByText('pqc-encryption')).toBeInTheDocument()
  })

  it('cancel calls onCancel, not onDeactivateIncumbent', () => {
    const onCancel = vi.fn()
    const onDeactivateIncumbent = vi.fn()
    render(
      <ScopeConflictModal
        conflict={conflict}
        onDeactivateIncumbent={onDeactivateIncumbent}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onDeactivateIncumbent).not.toHaveBeenCalled()
  })

  it('the deactivate-and-continue button calls onDeactivateIncumbent', () => {
    const onDeactivateIncumbent = vi.fn()
    render(
      <ScopeConflictModal
        conflict={conflict}
        onDeactivateIncumbent={onDeactivateIncumbent}
        onCancel={vi.fn()}
      />
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Deactivate classical-encryption and continue' })
    )
    expect(onDeactivateIncumbent).toHaveBeenCalledOnce()
  })
})
