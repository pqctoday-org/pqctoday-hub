// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { ProductionCapabilityChecklist } from '@/components/PKILearning/common/ProductionCapabilityChecklist'
import {
  MODULE_CAPABILITY_CHECKLISTS,
  getModuleCapabilityChecklist,
} from './moduleCapabilityChecklists'

describe('Module production-tool capability checklists', () => {
  it('gives every module manifest a complete checklist', () => {
    expect(MANIFESTS.length).toBeGreaterThan(0)
    expect(MANIFESTS).toHaveLength(Object.keys(MODULE_CATALOG).length)

    for (const manifest of MANIFESTS) {
      const spec = getModuleCapabilityChecklist(manifest.id)
      expect(spec, `Missing capability checklist for module "${manifest.id}"`).toBeDefined()
      expect(spec!.moduleId).toBe(manifest.id)
      expect(spec!.roleFocus.length).toBeGreaterThan(5)
      expect(spec!.productionCapabilities).toHaveLength(3)
      for (const cap of spec!.productionCapabilities) {
        expect(cap.length, `Short capability text in ${manifest.id}`).toBeGreaterThan(25)
      }
      expect(spec!.evaluationMethod.length).toBeGreaterThan(25)
      expect(spec!.evidenceRequired.length).toBeGreaterThan(25)
      expect(spec!.educationalBoundary).toContain('does not test, validate, or certify')
    }
  })

  it('has one checklist per manifest and no orphan keys', () => {
    const manifestIds = new Set(MANIFESTS.map((m) => m.id))
    const checklistIds = Object.keys(MODULE_CAPABILITY_CHECKLISTS)
    expect(checklistIds).toHaveLength(manifestIds.size)
    for (const id of checklistIds) {
      expect(manifestIds.has(id), `Orphan module checklist key: ${id}`).toBe(true)
    }
  })

  it('shows no raw LaTeX in any checklist text', () => {
    for (const spec of Object.values(MODULE_CAPABILITY_CHECKLISTS)) {
      const text = [...spec.productionCapabilities, spec.evaluationMethod, spec.evidenceRequired]
      for (const t of text) {
        expect(t, `Raw LaTeX in ${spec.moduleId}`).not.toMatch(
          /\$[^$`]*\$|\\(le|ge|log|leftrightarrow)\b/
        )
      }
    }
  })

  it('renders collapsed by default and lists the capabilities when opened', () => {
    const { unmount } = render(
      React.createElement(ProductionCapabilityChecklist, { moduleId: 'pqc-101' })
    )
    expect((screen.getByTestId('production-capability-checklist') as HTMLDetailsElement).open).toBe(
      false
    )
    unmount()

    render(
      React.createElement(ProductionCapabilityChecklist, { moduleId: 'pqc-101', defaultOpen: true })
    )
    const panel = screen.getByTestId('production-capability-checklist') as HTMLDetailsElement
    expect(panel.open).toBe(true)
    const spec = getModuleCapabilityChecklist('pqc-101')!
    expect(screen.getAllByRole('listitem')).toHaveLength(spec.productionCapabilities.length)
    const summary = screen.getByText('Record evidence for your environment')
    expect(summary.closest('details')).not.toHaveAttribute('open')
    expect(screen.getByRole('button', { name: 'Download evidence worksheet' })).toBeInTheDocument()
  })
})
