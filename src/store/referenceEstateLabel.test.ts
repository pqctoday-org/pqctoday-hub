// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The reference-estate label: saved with the answers, dropped on the first edit, and carried
 * into the report's profile so reloads, shared links and exports keep it.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useAssessmentFormStore } from './useAssessmentFormStore'
import { useAssessmentStore } from './useAssessmentStore'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { REFERENCE_ESTATES } from '@/data/assessmentScenarios'

const form = () => useAssessmentFormStore.getState()

beforeEach(() => {
  localStorage.clear()
  useAssessmentStore.getState().reset()
})

describe('reference-estate label (persistence, edits, report profile)', () => {
  const estate = REFERENCE_ESTATES[0]

  it('is persisted, and the persisted state is version 4', () => {
    form().loadReferenceEstate(estate.id)
    const saved = JSON.parse(localStorage.getItem('pqc-assessment-form')!)
    expect(saved.version).toBe(4)
    expect(saved.state.scenarioEstateId).toBe(estate.id)
  })

  it('a reload keeps the label', async () => {
    form().loadReferenceEstate(estate.id)
    const saved = localStorage.getItem('pqc-assessment-form')!
    form().reset()
    expect(form().scenarioEstateId).toBeNull()
    localStorage.setItem('pqc-assessment-form', saved)
    await useAssessmentFormStore.persist.rehydrate()
    expect(form().scenarioEstateId).toBe(estate.id)
    expect(form().industry).toBe(estate.answers.industry)
  })

  it('hydrates a version 2 saved state without losing anything', async () => {
    const v2 = {
      state: {
        currentStep: 4,
        assessmentMode: 'comprehensive',
        industry: 'Healthcare',
        country: 'Germany',
        currentCrypto: ['RSA-2048'],
        currentCryptoCategories: ['Key Exchange'],
        cryptoUnknown: false,
        dataSensitivity: ['high'],
        complianceRequirements: ['HIPAA'],
        migrationStatus: 'planning',
        cryptoUseCases: ['TLS/HTTPS'],
        infrastructure: ['Cloud'],
        infrastructureSubCategories: { Cloud: ['AWS KMS'] },
        cryptoLibraries: ['OpenSSL'],
        infraAutomation: ['Terraform'],
        vendorDependency: 'mixed',
        timelinePressure: 'within-1y',
        importComplianceSelection: false,
        assessmentStatus: 'in-progress',
        lastWizardUpdate: '2026-01-01T00:00:00.000Z',
      },
      version: 2,
    }
    localStorage.setItem('pqc-assessment-form', JSON.stringify(v2))
    await useAssessmentFormStore.persist.rehydrate()
    const s = form()
    expect(s.scenarioEstateId).toBeNull()
    expect(s.timelineMilestone).toBeNull()
    expect(s.industry).toBe('Healthcare')
    expect(s.country).toBe('Germany')
    expect(s.currentCrypto).toEqual(['RSA-2048'])
    expect(s.currentCryptoCategories).toEqual(['Key Exchange'])
    expect(s.complianceRequirements).toEqual(['HIPAA'])
    expect(s.infrastructureSubCategories).toEqual({ Cloud: ['AWS KMS'] })
    expect(s.cryptoLibraries).toEqual(['OpenSSL'])
    expect(s.infraAutomation).toEqual(['Terraform'])
    expect(s.vendorDependency).toBe('mixed')
    expect(s.timelinePressure).toBe('within-1y')
    expect(s.importComplianceSelection).toBe(false)
    expect(s.assessmentStatus).toBe('in-progress')
    expect(s.currentStep).toBe(4)
  })

  it('stays through steps and generating, and drops the first time an answer is changed', () => {
    form().loadReferenceEstate(estate.id)
    form().setStep(3)
    form().setAssessmentStatus('complete')
    expect(form().scenarioEstateId).toBe(estate.id)
    form().toggleCryptoCategory('Hash & MAC')
    expect(form().scenarioEstateId).toBeNull()
  })

  it('reaches the report profile (and so shared links and exports)', () => {
    form().loadReferenceEstate(estate.id)
    const result = computeAssessment(form().getInput()!)
    expect(result.assessmentProfile?.scenarioEstateId).toBe(estate.id)
    form().toggleCryptoCategory('Hash & MAC')
    expect(
      computeAssessment(form().getInput()!).assessmentProfile?.scenarioEstateId
    ).toBeUndefined()
  })
})

describe('a loaded reference estate keeps its own frameworks', () => {
  it("turns off importing the visitor's Compliance and Migrate selections", () => {
    useAssessmentFormStore.setState({
      importComplianceSelection: true,
      importProductSelection: true,
    })
    useAssessmentFormStore.getState().loadReferenceEstate(REFERENCE_ESTATES[0].id)
    const s = useAssessmentFormStore.getState()
    expect(s.importComplianceSelection).toBe(false)
    expect(s.importProductSelection).toBe(false)
    expect(s.complianceRequirements).toEqual(
      REFERENCE_ESTATES[0].answers.complianceRequirements ?? []
    )
  })
})
