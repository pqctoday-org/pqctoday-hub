// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useReportOwnershipStore } from './useReportOwnershipStore'

describe('useReportOwnershipStore', () => {
  beforeEach(() => {
    useReportOwnershipStore.setState({
      programOwner: '',
      budgetOwner: '',
      accountableExecutive: '',
    })
  })

  it('defaults to empty strings', () => {
    const s = useReportOwnershipStore.getState()
    expect(s.programOwner).toBe('')
    expect(s.budgetOwner).toBe('')
    expect(s.accountableExecutive).toBe('')
  })

  it('setters update only their own field', () => {
    useReportOwnershipStore.getState().setProgramOwner('Jane Doe')
    useReportOwnershipStore.getState().setBudgetOwner('John Smith')
    useReportOwnershipStore.getState().setAccountableExecutive('Alex Lee')
    const s = useReportOwnershipStore.getState()
    expect(s.programOwner).toBe('Jane Doe')
    expect(s.budgetOwner).toBe('John Smith')
    expect(s.accountableExecutive).toBe('Alex Lee')
  })

  it('persists to localStorage under its own key', () => {
    useReportOwnershipStore.getState().setProgramOwner('Jane Doe')
    const raw = localStorage.getItem('pqc-report-ownership')
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw!).state.programOwner).toBe('Jane Doe')
  })
})
