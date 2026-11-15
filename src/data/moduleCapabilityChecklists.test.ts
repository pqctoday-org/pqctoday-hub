// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { ProductionCapabilityChecklist } from '@/components/PKILearning/common/ProductionCapabilityChecklist'
import {
  MODULE_CAPABILITY_CHECKLISTS,
  getModuleCapabilityChecklist,
} from './moduleCapabilityChecklists'

describe('Module Production-Tool Capability Checklists (76 Modules)', () => {
  it('covers all 76 module manifests (75 non-quiz catalog modules + quiz) including adversarialChallenge specs', () => {
    expect(MANIFESTS).toHaveLength(76)
    expect(Object.keys(MODULE_CATALOG)).toHaveLength(76)

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

      const adv = spec!.adversarialChallenge
      expect(adv, `Missing adversarialChallenge in ${manifest.id}`).toBeDefined()
      expect(adv.scenarioTitle.length).toBeGreaterThan(15)
      expect(adv.positiveCase.label.length).toBeGreaterThan(10)
      expect(adv.positiveCase.inputSummary.length).toBeGreaterThan(20)
      expect(adv.positiveCase.expectedResult).toContain('PASS')
      expect(adv.positiveCase.telemetryCode.length).toBeGreaterThan(5)

      expect(adv.adversarialCase.label.length).toBeGreaterThan(10)
      expect(adv.adversarialCase.faultInjected.length).toBeGreaterThan(20)
      expect(adv.adversarialCase.expectedRefusal).toContain('REFUSED')
      expect(adv.adversarialCase.telemetryCode.length).toBeGreaterThan(5)
      expect(adv.adversarialCase.productionLesson.length).toBeGreaterThan(25)
    }
  })

  it('has bespoke domain-specific adversarial challenges for flagship modules', () => {
    const flagshipIds = [
      'pqc-101',
      'tls-basics',
      'hybrid-crypto',
      'pki-workshop',
      'pki-enrollment-protocols',
      'stateful-signatures',
      'slh-dsa',
      'hsm-pqc',
      'kms-pqc',
      'code-signing',
      'vpn-ssh-pqc',
      'merkle-tree-certs',
      'email-signing',
      'api-security-jwt',
      'acvp-lab-workflow',
      'pqc-testing-validation',
      'exec-quantum-impact',
      'pqc-business-case',
    ]
    for (const id of flagshipIds) {
      const spec = getModuleCapabilityChecklist(id)
      expect(spec).toBeDefined()
      expect(spec!.adversarialChallenge.positiveCase.telemetryCode).not.toContain('VERIFY_OK_')
    }
  })

  it('has exactly 76 entries in MODULE_CAPABILITY_CHECKLISTS with zero orphan keys', () => {
    const manifestIds = new Set(MANIFESTS.map((m) => m.id))
    const checklistIds = Object.keys(MODULE_CAPABILITY_CHECKLISTS)
    expect(checklistIds).toHaveLength(76)
    for (const id of checklistIds) {
      expect(manifestIds.has(id), `Orphan module checklist key: ${id}`).toBe(true)
    }
  })

  it('renders interactive Break & Verify lab buttons and deterministic receipts in ProductionCapabilityChecklist', () => {
    render(
      React.createElement(ProductionCapabilityChecklist, {
        moduleId: 'pqc-101',
        defaultOpen: true,
      })
    )

    expect(screen.getByTestId('production-capability-checklist')).toBeDefined()
    const posBtn = screen.getByTestId('module-verify-positive-btn')
    const advBtn = screen.getByTestId('module-verify-adversarial-btn')

    fireEvent.click(posBtn)
    const posReceipt = screen.getByTestId('module-verify-receipt')
    expect(posReceipt.textContent).toContain('PASS')
    expect(posReceipt.textContent).toContain('PQC_BASELINE_OK_FIPS203_204')

    fireEvent.click(advBtn)
    const advReceipt = screen.getByTestId('module-verify-receipt')
    expect(advReceipt.textContent).toContain('REFUSED / TAMPER DETECTED')
    expect(advReceipt.textContent).toContain('ERR_FIPS203_IMPLICIT_REJECT_AND_POLICY_BLOCK')
  })
})
