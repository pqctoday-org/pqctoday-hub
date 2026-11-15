// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { BusinessCapabilityFooter } from '@/components/BusinessCenter/common/BusinessCapabilityFooter'
import {
  BUSINESS_CAPABILITY_CHECKLISTS,
  getBusinessCapabilityChecklist,
} from './businessCapabilityChecklists'

describe('Business Center production-tool capability checklists', () => {
  it('gives every Business Tool in BUSINESS_TOOLS a complete checklist', () => {
    expect(BUSINESS_TOOLS.length).toBeGreaterThan(0)

    for (const tool of BUSINESS_TOOLS) {
      const spec = getBusinessCapabilityChecklist(tool.id)
      expect(spec, `Missing capability checklist for business tool "${tool.id}"`).toBeDefined()
      expect(spec!.toolId).toBe(tool.id)
      expect(spec!.productionToolCategory.length).toBeGreaterThan(10)
      expect(spec!.requiredCapabilities).toHaveLength(3)
      for (const cap of spec!.requiredCapabilities) {
        expect(cap.length, `Short capability in ${tool.id}`).toBeGreaterThan(25)
      }
      expect(spec!.evaluationCriteria.length).toBeGreaterThan(25)
      expect(spec!.sampleVsProductionBoundary).toContain(
        'does not collect production evidence or assess a deployed environment'
      )
    }
  })

  it('has one checklist per registry tool and no orphan keys', () => {
    const registryIds = new Set(BUSINESS_TOOLS.map((t) => t.id))
    const checklistIds = Object.keys(BUSINESS_CAPABILITY_CHECKLISTS)
    expect(checklistIds).toHaveLength(registryIds.size)
    for (const id of checklistIds) {
      expect(registryIds.has(id), `Orphan business tool checklist key: ${id}`).toBe(true)
    }
  })

  it('renders collapsed by default and lists the capabilities when opened', () => {
    const { unmount } = render(
      React.createElement(BusinessCapabilityFooter, { toolId: 'vendor-scorecard' })
    )
    const collapsed = screen.getByTestId('business-capability-footer') as HTMLDetailsElement
    expect(collapsed.open).toBe(false)
    unmount()

    render(
      React.createElement(BusinessCapabilityFooter, {
        toolId: 'vendor-scorecard',
        defaultOpen: true,
      })
    )
    const footer = screen.getByTestId('business-capability-footer') as HTMLDetailsElement
    expect(footer.open).toBe(true)
    const spec = getBusinessCapabilityChecklist('vendor-scorecard')!
    expect(screen.getAllByRole('listitem')).toHaveLength(spec.requiredCapabilities.length)
    expect(screen.queryByRole('button')).toBeNull()
  })
})
