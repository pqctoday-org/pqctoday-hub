// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'
import { CryptoTamperExercise } from '@/components/shared/CryptoTamperExercise'
import { PolicyScopeExercise } from '@/components/shared/PolicyScopeExercise'
import { MODULE_CAPABILITY_CHECKLISTS } from '@/data/moduleCapabilityChecklists'
import { MODULE_DECISION_SCENARIOS, evaluatePolicyScope } from '@/data/moduleDecisionScenarios'
import { runTamperSample } from '@/utils/cryptoTamperVerifier'

const RECEIPT_OUTPUT_PATH = resolve(
  process.cwd(),
  '../backups/hub-4213/learn-decision-receipts-76.json'
)

describe('All 75 Learn Modules (+ Quiz) Tailored Failure, Recovery & Policy Decision Oracle', () => {
  const allModuleIds = MANIFESTS.map((m) => m.id).sort()

  it('covers all 76 Learn module manifests (75 workshop modules + quiz) with unique, domain-tailored scenarios and capability checklists', () => {
    expect(allModuleIds).toHaveLength(76)
    expect(allModuleIds).toContain('quiz')

    const seenTitles = new Set<string>()
    const seenPrompts = new Set<string>()
    const seenArtifacts = new Set<string>()

    for (const moduleId of allModuleIds) {
      const scenario = MODULE_DECISION_SCENARIOS[moduleId]
      expect(scenario, `Missing ModuleDecisionScenario for ${moduleId}`).toBeDefined()
      expect(scenario.moduleId).toBe(moduleId)
      expect(scenario.domainTitle.length).toBeGreaterThan(15)
      expect(scenario.roleDecisionPrompt.length).toBeGreaterThan(30)
      expect(scenario.artifactLabel.length).toBeGreaterThan(15)
      expect(scenario.validCaseExplanation.length).toBeGreaterThan(30)
      expect(scenario.adverseFailureExplanation.length).toBeGreaterThan(30)
      expect(scenario.recoveryActionExplanation.length).toBeGreaterThan(30)
      expect(scenario.transferQuestion.prompt.length).toBeGreaterThan(25)
      expect(scenario.transferQuestion.changedAssumptionOutcome.length).toBeGreaterThan(30)
      expect(scenario.productionToolCheck.length).toBeGreaterThan(25)

      seenTitles.add(scenario.domainTitle)
      seenPrompts.add(scenario.roleDecisionPrompt)
      seenArtifacts.add(scenario.artifactLabel)

      const checklist = MODULE_CAPABILITY_CHECKLISTS[moduleId]
      expect(checklist, `Missing ProductionCapabilityChecklist for ${moduleId}`).toBeDefined()
      expect(checklist.moduleId).toBe(moduleId)
      expect(checklist.productionCapabilities).toHaveLength(3)
      expect(checklist.evaluationMethod.length).toBeGreaterThan(20)
      expect(checklist.evidenceRequired.length).toBeGreaterThan(20)
      expect(checklist.educationalBoundary.length).toBeGreaterThan(20)
    }

    expect(seenTitles.size).toBe(76)
    expect(seenPrompts.size).toBe(76)
    expect(seenArtifacts.size).toBe(76)
  })

  it('renders tailored domain scenario copy in CryptoTamperExercise and PolicyScopeExercise without generic placeholder text', () => {
    const { unmount } = render(
      <div>
        <CryptoTamperExercise moduleId="tls-basics" />
        <PolicyScopeExercise moduleId="tls-basics" />
      </div>
    )
    expect(
      screen.getAllByText(/TLS 1\.3 X25519MLKEM768 KeyShare Encapsulation/i).length
    ).toBeGreaterThanOrEqual(2)
    expect(screen.queryByText(/Your workbench artifacts stay separate/i)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Check changed assumption' }))
    expect(screen.getAllByText(/Transfer question:/i)).toHaveLength(2)
    expect(screen.getByText(/Changed-assumption horizon check/i)).toBeInTheDocument()
    unmount()
  })

  it('executes real cryptographic tamper/recovery (runTamperSample) and scoped policy/horizon evaluation across all 76 modules and writes receipt JSON', async () => {
    const receipts: Record<string, unknown>[] = []

    for (const moduleId of allModuleIds) {
      const scenario = MODULE_DECISION_SCENARIOS[moduleId]
      const checklist = MODULE_CAPABILITY_CHECKLISTS[moduleId]
      const operation =
        scenario.algorithmVariant.operation === 'kem' ? 'encapsulation' : 'signature'

      const cryptoReceipt = await runTamperSample(operation, scenario.algorithmVariant.variant, 0)

      expect(cryptoReceipt.baselineValid).toBe(true)
      expect(cryptoReceipt.alteredAccepted).toBe(false)
      expect(cryptoReceipt.restoredValid).toBe(true)
      if (operation === 'encapsulation') {
        expect(cryptoReceipt.confirmationRejected).toBe(true)
      }

      const compliantPolicy = evaluatePolicyScope(moduleId, 'compliant')
      expect(compliantPolicy.findings).toHaveLength(0)

      const adversePolicy = evaluatePolicyScope(moduleId, 'adverse')
      const adverseKinds = adversePolicy.findings.map((f) => f.kind)
      expect(adverseKinds).toContain('mismatch')
      expect(adverseKinds).toContain('policy')
      expect(adverseKinds).toContain('scenario-risk')
      expect(adversePolicy.exposureYears).toBe(5)

      const transferPolicy = evaluatePolicyScope(moduleId, 'transfer')
      const transferKinds = transferPolicy.findings.map((f) => f.kind)
      expect(transferKinds).toContain('out-of-scope')
      expect(transferKinds).toContain('scenario-risk')
      expect(transferKinds).not.toContain('policy')

      receipts.push({
        moduleId,
        domainTitle: scenario.domainTitle,
        artifactLabel: scenario.artifactLabel,
        roleFocus: checklist.roleFocus,
        cryptoOracle: {
          algorithm: cryptoReceipt.algorithm,
          operation: cryptoReceipt.operation,
          byteIndex: cryptoReceipt.byteIndex,
          beforeHex: cryptoReceipt.before.toString(16).padStart(2, '0'),
          afterHex: cryptoReceipt.after.toString(16).padStart(2, '0'),
          baselineValid: cryptoReceipt.baselineValid,
          alteredAccepted: cryptoReceipt.alteredAccepted,
          restoredValid: cryptoReceipt.restoredValid,
          confirmationRejected: cryptoReceipt.confirmationRejected ?? null,
        },
        policyOracle: {
          compliantStatus:
            compliantPolicy.findings.length === 0 ? 'no-contradiction' : 'contradiction',
          adverseFindings: adverseKinds,
          adverseDecisionClass: 'violated-applicable-requirement',
          transferFindings: transferKinds,
          transferChangedAssumptionOutcome: scenario.transferQuestion.changedAssumptionOutcome,
        },
        productionToolCheck: scenario.productionToolCheck,
      })
    }

    expect(receipts).toHaveLength(76)

    if (existsSync(resolve(process.cwd(), '../backups'))) {
      mkdirSync(dirname(RECEIPT_OUTPUT_PATH), { recursive: true })
      writeFileSync(
        RECEIPT_OUTPUT_PATH,
        JSON.stringify(
          {
            version: '4.214.0',
            generatedAt: new Date().toISOString(),
            totalModulesVerified: receipts.length,
            allBaselineValid: receipts.every(
              (r) => (r.cryptoOracle as { baselineValid: boolean }).baselineValid === true
            ),
            allAlteredRejected: receipts.every(
              (r) => (r.cryptoOracle as { alteredAccepted: boolean }).alteredAccepted === false
            ),
            allRestoredValid: receipts.every(
              (r) => (r.cryptoOracle as { restoredValid: boolean }).restoredValid === true
            ),
            receipts,
          },
          null,
          2
        ),
        'utf8'
      )
    }
  }, 60000)
})
