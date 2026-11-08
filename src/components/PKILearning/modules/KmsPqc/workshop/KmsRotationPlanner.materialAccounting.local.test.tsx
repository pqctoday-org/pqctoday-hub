// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { KmsRotationPlanner, rotationMaterial } from './KmsRotationPlanner'
import { ENTERPRISE_SCENARIO } from '../data/kmsConstants'
describe('rotation scenario material categories', () => {
  it('includes all five existing categories and the API-auth delta', () => {
    const a = rotationMaterial(
      ENTERPRISE_SCENARIO.currentAlgorithms,
      ENTERPRISE_SCENARIO.targetAlgorithms
    )!
    expect(a.rows).toHaveLength(5)
    expect(a.publicCount).toBe(400)
    expect(a.secretCount).toBe(100)
    expect(a.currentPublic).toBe(90005)
    expect(a.targetPublic).toBe(787500)
    expect(a.currentSecret).toBe(3200)
    expect(a.targetSecret).toBe(3200)
    expect(a.currentBytes).toBe(93205)
    expect(a.targetBytes).toBe(790700)
    expect(a.publicDelta).toBe(697495)
    const api = a.rows.find((r) => r.id === 'apiAuth')!
    expect(api.targetBytes - api.currentBytes).toBe(43645)
  })
  it('does not convert zero or missing input into a positive measured estimate', () => {
    const zero = Object.fromEntries(
      Object.entries(ENTERPRISE_SCENARIO.currentAlgorithms).map(([id, row]) => [
        id,
        { ...row, count: 0 },
      ])
    )
    expect(rotationMaterial(zero, {})).toEqual(
      expect.objectContaining({ currentBytes: 0, targetBytes: 0, publicDelta: 0, multiplier: null })
    )
    expect(rotationMaterial(ENTERPRISE_SCENARIO.currentAlgorithms, {})).toBeNull()
    const missing = { ...ENTERPRISE_SCENARIO.currentAlgorithms }
    delete (missing as Partial<typeof missing>).apiAuth
    expect(rotationMaterial(missing, ENTERPRISE_SCENARIO.targetAlgorithms)).toBeNull()
  })
  it('renders unknown rather than crashing when a required target profile is absent', () => {
    const targets = ENTERPRISE_SCENARIO.targetAlgorithms as Partial<
      typeof ENTERPRISE_SCENARIO.targetAlgorithms
    >
    const original = targets.apiAuth
    delete targets.apiAuth
    try {
      render(
        <MemoryRouter>
          <KmsRotationPlanner />
        </MemoryRouter>
      )
      expect(
        screen.getByText(/Not assessed — missing category or profile inputs/)
      ).toBeInTheDocument()
    } finally {
      targets.apiAuth = original
    }
  })
  it('preserves sample accounting across narrative phases without claiming certificate or wire totals', () => {
    render(
      <MemoryRouter>
        <KmsRotationPlanner />
      </MemoryRouter>
    )
    expect(screen.getByText('Sample material records')).toBeInTheDocument()
    expect(screen.getByText(/Public-material delta across all/)).toHaveTextContent('697,495 B')
    fireEvent.click(screen.getByRole('button', { name: 'Full PQC' }))
    expect(screen.getByText(/Public-material delta across all/)).toHaveTextContent('697,495 B')
    expect(
      screen.getByText(
        /Complete certificates \/ private-key storage \/ protected transfer bytes: Not assessed/
      )
    ).toBeInTheDocument()
    expect(screen.getByText(/fictional narrative statuses/)).toBeInTheDocument()
    expect(screen.queryByText('Total Certs')).not.toBeInTheDocument()
  })
})
