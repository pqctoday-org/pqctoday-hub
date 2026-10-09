// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Report's applicability panel no longer calls every framework from a body in
 * your country "Mandatory". Once frameworks have been reviewed it shows Binding,
 * Guidance and drafts, and Not yet classified. Until then (the data has no
 * binding_status yet) it looks exactly as before. The compliance file now carries
 * reviewed statuses, so every test starts from a clean slate (no framework
 * classified), sets the statuses it needs on real frameworks, and the original
 * values are put back afterwards.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ApplicabilityPanel } from './ApplicabilityPanel'
import { applicableFrameworks } from '@/utils/applicabilityEngine'
import type { BindingStatus } from '@/utils/bindingSplit'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'

const profile = { country: 'United States', industry: 'Finance & Insurance' }

function mandatory(): ComplianceFramework[] {
  return applicableFrameworks(profile)
    .filter((r) => r.tier === 'mandatory')
    .map((r) => r.item)
}

const touched: Array<[ComplianceFramework, BindingStatus | undefined]> = []
function mark(fw: ComplianceFramework, status: BindingStatus) {
  touched.push([fw, fw.bindingStatus])
  fw.bindingStatus = status
}
beforeEach(() => {
  for (const fw of complianceFrameworks) {
    if (fw.bindingStatus !== undefined) touched.push([fw, fw.bindingStatus])
    fw.bindingStatus = undefined
  }
})
afterEach(() => {
  while (touched.length) {
    const [fw, was] = touched.pop() as [ComplianceFramework, BindingStatus | undefined]
    fw.bindingStatus = was
  }
})

const renderPanel = (variant: 'report-section' | 'tab' = 'report-section') =>
  render(
    <MemoryRouter>
      <ApplicabilityPanel variant={variant} profileOverride={profile} />
    </MemoryRouter>
  )

describe('ApplicabilityPanel in the Report, with reviewed frameworks', () => {
  it('shows Binding, Guidance and drafts, and Not yet classified instead of Mandatory', () => {
    const [a, b, c, d] = mandatory()
    mark(a, 'binding')
    mark(b, 'mandatory_for_scope')
    mark(c, 'recommendation')
    mark(d, 'draft')
    renderPanel()

    const binding = screen.getByTestId('binding-group-binding')
    expect(within(binding).getByText(a.label)).toBeInTheDocument()
    expect(within(binding).getByText(b.label)).toBeInTheDocument()
    expect(within(binding).getByText('(2)')).toBeInTheDocument()

    const guidance = screen.getByTestId('binding-group-guidance')
    expect(within(guidance).getByText(c.label)).toBeInTheDocument()
    expect(within(guidance).getByText(d.label)).toBeInTheDocument()

    // The persona lens can cap how many of a tier's frameworks the panel lists, so
    // the count is checked against what the group shows, not against the engine.
    const unclassified = screen.getByTestId('binding-group-unclassified')
    const listed = within(unclassified).getAllByRole('listitem')
    expect(listed.length).toBeGreaterThan(0)
    expect(within(unclassified).getByText(`(${listed.length})`)).toBeInTheDocument()
    expect(within(unclassified).queryByText(a.label)).not.toBeInTheDocument()

    expect(screen.queryByText('Mandatory')).not.toBeInTheDocument()
  })

  it('never puts a framework in two groups', () => {
    const [a, b] = mandatory()
    mark(a, 'binding')
    mark(b, 'informational')
    renderPanel()
    for (const fw of [a, b]) {
      const where = ['binding', 'guidance', 'unclassified'].filter((id) =>
        within(screen.getByTestId(`binding-group-${id}`)).queryByText(fw.label)
      )
      expect(where, fw.label).toHaveLength(1)
    }
  })

  it("leaves the other pages' tiers alone: the For You tab still says Mandatory", () => {
    mark(mandatory()[0], 'binding')
    renderPanel('tab')
    expect(screen.queryByTestId('binding-group-binding')).not.toBeInTheDocument()
    expect(screen.getAllByText('Mandatory').length).toBeGreaterThan(0)
  })
})

describe('ApplicabilityPanel in the Report, before any framework is reviewed', () => {
  it('looks as before: one Mandatory group, no binding groups', () => {
    renderPanel()
    expect(screen.queryByTestId('binding-group-binding')).not.toBeInTheDocument()
    expect(screen.queryByTestId('binding-group-unclassified')).not.toBeInTheDocument()
    expect(screen.getAllByText('Mandatory').length).toBeGreaterThan(0)
  })
})
