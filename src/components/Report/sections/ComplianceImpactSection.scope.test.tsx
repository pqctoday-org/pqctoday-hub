// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

const seen: unknown[] = []
vi.mock('../../applicability/ApplicabilityPanel', () => ({
  ApplicabilityPanel: (props: { profileOverride?: unknown }) => {
    seen.push(props.profileOverride)
    return null
  },
}))

import { ComplianceImpactSection } from './ComplianceImpactSection'

describe('ComplianceImpactSection applicability scope', () => {
  it("passes the report's own industry and country, so a sample report is not read against an empty store", () => {
    render(
      <MemoryRouter>
        <ComplianceImpactSection
          complianceImpacts={[]}
          industry="Finance & Banking"
          country="United States"
          defaultOpen
        />
      </MemoryRouter>
    )
    expect(seen.at(-1)).toEqual({ industry: 'Finance & Banking', country: 'United States' })
  })
})
