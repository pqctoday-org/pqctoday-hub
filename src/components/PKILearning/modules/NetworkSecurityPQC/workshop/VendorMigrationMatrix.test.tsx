// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { VendorMigrationMatrix } from './VendorMigrationMatrix'
import { VENDOR_MIGRATION_DATA, PQC_STATUS_LABELS } from '../data/networkProviderData'

describe('VendorMigrationMatrix (round 9 walk, 2026-09-19)', () => {
  it('renders every vendor row, including those with an unsupported capability', () => {
    // Seven vendors carry mlKemStatus / mlDsaStatus 'not-supported'; the label
    // table only knew 'not-planned', so the step threw on first render and the
    // steps after it were unreachable for every visitor.
    expect(VENDOR_MIGRATION_DATA.some((v) => v.mlKemStatus === 'not-supported')).toBe(true)
    render(
      <MemoryRouter>
        <VendorMigrationMatrix />
      </MemoryRouter>
    )
    for (const v of VENDOR_MIGRATION_DATA)
      expect(screen.getAllByText(v.vendor).length).toBeGreaterThan(0)
    expect(PQC_STATUS_LABELS['not-supported'].label).toBe('Not Supported')
  })
})
