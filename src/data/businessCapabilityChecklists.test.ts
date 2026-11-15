// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { BusinessCapabilityFooter } from '@/components/BusinessCenter/common/BusinessCapabilityFooter'
import {
  BUSINESS_CAPABILITY_CHECKLISTS,
  getBusinessCapabilityChecklist,
} from './businessCapabilityChecklists'

describe('Business Center Production-Tool Capability Checklists (37 Business Tools)', () => {
  it('covers all 37 Business Tools in BUSINESS_TOOLS with auditStressTest specs', () => {
    expect(BUSINESS_TOOLS).toHaveLength(37)

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

      const stress = spec!.auditStressTest
      expect(stress, `Missing auditStressTest in ${tool.id}`).toBeDefined()
      expect(stress.flawedArtifactSummary.length).toBeGreaterThan(30)
      expect(stress.detectedGapCode).toMatch(/^AUDIT_GAP_/)
      expect(stress.governanceRejectionReason.length).toBeGreaterThan(30)
      expect(stress.remediationAction.length).toBeGreaterThan(30)
    }
  })

  it('has exactly 37 entries in BUSINESS_CAPABILITY_CHECKLISTS with zero orphan keys', () => {
    const registryIds = new Set(BUSINESS_TOOLS.map((t) => t.id))
    const checklistIds = Object.keys(BUSINESS_CAPABILITY_CHECKLISTS)
    expect(checklistIds).toHaveLength(37)
    for (const id of checklistIds) {
      expect(registryIds.has(id), `Orphan business tool checklist key: ${id}`).toBe(true)
    }
  })

  it('renders interactive Audit Stress-Test button and refusal receipt in BusinessCapabilityFooter', () => {
    render(
      React.createElement(BusinessCapabilityFooter, {
        toolId: 'vendor-scorecard',
        defaultOpen: true,
      })
    )

    expect(screen.getByTestId('business-capability-footer')).toBeDefined()
    const stressBtn = screen.getByTestId('business-stress-test-btn')
    fireEvent.click(stressBtn)

    const receipt = screen.getByTestId('business-stress-test-receipt')
    expect(receipt.textContent).toContain('AUDIT_GAP_UNVERIFIED_VENDOR_MARKETING_CLAIM')
    expect(receipt.textContent).toContain('CAVP')
  })
})
