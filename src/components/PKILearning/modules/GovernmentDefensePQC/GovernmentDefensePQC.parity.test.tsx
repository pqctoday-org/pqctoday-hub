// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render + grounding checks for the Government & Defense module.
 *
 * The CNSA dates are the reason this module exists, and they are the kind of
 * fact that rots silently: NSA revised them once already (the 2022 advisory
 * carried a vaguer "2025–2030 depending on equipment type" before CNSSP 15 set
 * hard dates). Pinning them here means a future edit that drifts from the
 * cached FAQ fails a test rather than quietly teaching the wrong deadline.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { GovernmentDefensePQCModule } from './index'
import manifest from './manifest'
import { CNSA_MILESTONES, SUITE_COMPARISON } from './data/cnsaData'

describe('GovernmentDefensePQC', () => {
  it('renders the module header and the standard tab set', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <GovernmentDefensePQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'Government & Defense PQC' })).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('government-defense-pqc')
  })

  it('carries the CNSSP 15 dates exactly as the cached FAQ states them', () => {
    const dates = CNSA_MILESTONES.map((m) => m.date)
    expect(dates).toEqual(['1 January 2027', '31 December 2030', '31 December 2031', '2035'])
  })

  it('keeps the symmetric suite lines unchanged across CNSA 1.0 → 2.0', () => {
    // The asymmetry is the module's central teaching point: replacing "all
    // cryptography" is the wrong budget model, because AES and SHA survive.
    const symmetric = SUITE_COMPARISON.filter((r) => /Symmetric|Hashing/.test(r.purpose))
    expect(symmetric.length).toBeGreaterThan(0)
    for (const row of symmetric) {
      expect(row.cnsa2, row.purpose).toContain(row.cnsa1.split(' ')[0])
    }
  })

  it('replaces every public-key suite line', () => {
    const asymmetric = SUITE_COMPARISON.filter((r) => !/Symmetric|Hashing/.test(r.purpose))
    for (const row of asymmetric) {
      expect(row.cnsa1, row.purpose).not.toBe(row.cnsa2)
    }
  })
})
