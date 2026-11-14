// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the Assess wizard collects has to reach the report: store -> getInput ->
 * computeAssessment -> result fields. Each block here follows one answer along
 * that path.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { useAssessmentFormStore } from './useAssessmentFormStore'
import { useAssessmentResultStore } from './useAssessmentResultStore'
import { useAssessmentStore } from './useAssessmentStore'
import { computeAssessment, computeAssessmentAsync } from '@/hooks/assessment/orchestrator'
import { summarizeAnswer, type AssessReviewState } from '@/components/Assess/redesign/reviewModel'

const form = () => useAssessmentFormStore.getState()

function answerRequired() {
  useAssessmentFormStore.setState({
    industry: 'Finance & Banking',
    country: 'United States',
    dataSensitivity: ['high'],
    migrationStatus: 'planning',
  })
}

beforeEach(() => {
  localStorage.clear()
  useAssessmentStore.getState().reset()
  useAssessmentResultStore.setState({ assessmentHistory: [], previousRiskScore: null })
})

describe('crypto families reach the report (Step 3)', () => {
  it('passes the ticked families through getInput', () => {
    answerRequired()
    form().toggleCryptoCategory('Key Exchange')
    form().toggleCryptoCategory('Signatures')
    expect(form().getInput()?.currentCryptoCategories).toEqual(['Key Exchange', 'Signatures'])
  })

  it('a family with no specific algorithm stands for its algorithms: listed, scored, not "None"', () => {
    answerRequired()
    form().toggleCryptoCategory('Key Exchange')
    form().toggleCryptoCategory('Signatures')
    const result = computeAssessment(form().getInput()!)
    const names = result.algorithmMigrations.map((m) => m.classical)
    expect(names).toEqual(expect.arrayContaining(['RSA-2048', 'ECDH P-256', 'ECDSA P-256']))
    expect(result.algorithmMigrations.every((m) => m.quantumVulnerable)).toBe(true)
    const profile = result.assessmentProfile!
    expect(profile.algorithmsSelected).toEqual([])
    expect(profile.algorithmCategories).toEqual(['Key Exchange', 'Signatures'])
    expect(profile.algorithmsImplied).toEqual(expect.arrayContaining(['RSA-2048', 'ECDH P-256']))
    // and it scores higher than the same answers with no crypto declared at all
    form().toggleCryptoCategory('Key Exchange')
    form().toggleCryptoCategory('Signatures')
    const none = computeAssessment(form().getInput()!)
    expect(none.algorithmMigrations).toEqual([])
    expect(result.riskScore).toBeGreaterThan(none.riskScore)
  })

  it('a family the visitor narrowed keeps only what they picked; the others expand', () => {
    answerRequired()
    form().toggleCryptoCategory('Key Exchange')
    form().toggleCryptoCategory('Signatures')
    form().toggleCryptoCategory('Symmetric Encryption')
    form().toggleCrypto('X25519')
    form().toggleCrypto('AES-256')
    const result = computeAssessment(form().getInput()!)
    const names = result.algorithmMigrations.map((m) => m.classical)
    expect(names).toContain('X25519')
    expect(names).not.toContain('ECDH P-256') // Key Exchange was narrowed to X25519
    expect(names).not.toContain('AES-128') // Symmetric was narrowed to AES-256
    expect(names).toContain('ECDSA P-256') // Signatures was not narrowed
    expect(result.assessmentProfile!.algorithmsSelected).toEqual(['X25519', 'AES-256'])
  })

  it('"I am not sure" about algorithms is not expanded', () => {
    answerRequired()
    useAssessmentFormStore.setState({
      cryptoUnknown: true,
      currentCryptoCategories: ['Key Exchange'],
    })
    const result = computeAssessment(form().getInput()!)
    expect(result.algorithmMigrations.map((m) => m.classical)).toEqual([
      'Unknown algorithms (inventory required)',
    ])
    expect(result.assessmentProfile!.algorithmsImplied).toEqual([])
  })

  it('the async report path lists the same algorithms as the synchronous one', async () => {
    answerRequired()
    form().toggleCryptoCategory('Signatures')
    const input = form().getInput()!
    const sync = computeAssessment(input)
    const async_ = await computeAssessmentAsync(input)
    expect(async_.algorithmMigrations).toEqual(sync.algorithmMigrations)
    expect(async_.assessmentProfile!.algorithmsImplied).toEqual(
      sync.assessmentProfile!.algorithmsImplied
    )
    expect(async_.riskScore).toBe(sync.riskScore)
  })
})

describe('crypto toolchain reaches the report (Infrastructure step)', () => {
  function comprehensive() {
    answerRequired()
    useAssessmentFormStore.setState({
      assessmentMode: 'comprehensive',
      cryptoAgility: 'partially-abstracted',
    })
  }

  it('carries libraries and automation into the input and the profile', () => {
    comprehensive()
    form().toggleCryptoLibrary('OpenSSL')
    form().toggleInfraAutomation('cert-manager')
    const input = form().getInput()!
    expect(input.cryptoLibraries).toEqual(['OpenSSL'])
    expect(input.infraAutomation).toEqual(['cert-manager'])
    const profile = computeAssessment(input).assessmentProfile!
    expect(profile.cryptoLibraries).toEqual(['OpenSSL'])
    expect(profile.infraAutomation).toEqual(['cert-manager'])
  })

  it('a persona-recommended full track (mode not yet written to the store) keeps them', () => {
    answerRequired()
    useAssessmentFormStore.setState({ assessmentMode: null, cryptoAgility: 'hardcoded' })
    form().toggleCryptoLibrary('OpenSSL')
    form().toggleInfraAutomation('None')
    const input = form().getInput()!
    expect(input.cryptoLibraries).toEqual(['OpenSSL'])
    expect(input.infraAutomation).toEqual(['None'])
    const actions = computeAssessment(input).recommendedActions.map((a) => a.action)
    expect(actions.some((a) => a.includes('Upgrade OpenSSL to 3.5'))).toBe(true)
  })

  it('OpenSSL produces an upgrade action naming 3.5 and the native algorithms', () => {
    comprehensive()
    form().toggleCryptoLibrary('OpenSSL')
    const result = computeAssessment(form().getInput()!)
    const action = result.recommendedActions.find((a) =>
      a.drivers?.includes('cryptoLibraries:OpenSSL')
    )
    expect(action?.action).toMatch(/OpenSSL to 3\.5/)
    expect(action?.action).toMatch(/ML-KEM, ML-DSA and SLH-DSA/)
    expect(action?.relatedModule).toBe('/migrate')
  })

  it('other libraries are checked against the migration catalog by name', () => {
    comprehensive()
    form().toggleCryptoLibrary('BoringSSL')
    form().toggleCryptoLibrary('wolfSSL')
    const action = computeAssessment(form().getInput()!).recommendedActions.find((a) =>
      a.drivers?.includes('cryptoLibraries:BoringSSL,wolfSSL')
    )
    expect(action?.action).toMatch(/BoringSSL, wolfSSL/)
  })

  it('no automation produces an automation action; named tooling produces a different one', () => {
    comprehensive()
    form().toggleInfraAutomation('Manual / scripted')
    const manual = computeAssessment(form().getInput()!).recommendedActions.find((a) =>
      a.drivers?.some((d) => d.startsWith('infraAutomation:'))
    )
    expect(manual?.action).toMatch(/^Automate certificate issuance and rotation/)
    form().toggleInfraAutomation('Manual / scripted')
    form().toggleInfraAutomation('HashiCorp Vault')
    const tooled = computeAssessment(form().getInput()!).recommendedActions.find((a) =>
      a.drivers?.some((d) => d.startsWith('infraAutomation:'))
    )
    expect(tooled?.action).toMatch(/Confirm that HashiCorp Vault can request, deploy and rotate/)
  })

  it('a quick run never carries them, and switching to quick clears them', () => {
    comprehensive()
    form().toggleCryptoLibrary('OpenSSL')
    form().toggleInfraAutomation('None')
    form().setAssessmentMode('quick')
    expect(form().cryptoLibraries).toEqual([])
    expect(form().infraAutomation).toEqual([])
    useAssessmentFormStore.setState({ cryptoLibraries: ['OpenSSL'] })
    const input = form().getInput()!
    expect(input.cryptoLibraries).toBeUndefined()
  })

  it('the Review shows an infrastructure answer that is only libraries, automation or vendor model', () => {
    const base = useAssessmentStore.getState() as unknown as AssessReviewState
    const text = (over: Partial<AssessReviewState>) =>
      summarizeAnswer('infra', { ...base, ...over }).text
    expect(text({})).toBe('Skipped')
    expect(text({ cryptoLibraries: ['OpenSSL'] })).toBe('OpenSSL')
    expect(
      text({
        infrastructure: ['cloud', 'hsm', 'database'],
        vendorDependency: 'mixed',
        cryptoLibraries: ['OpenSSL', 'BoringSSL', 'wolfSSL'],
        infraAutomation: ['cert-manager'],
      })
    ).toBe('Cloud, Hsm +1 · Mixed · OpenSSL, BoringSSL +1 · cert-manager')
    expect(summarizeAnswer('infra', { ...base, infrastructureUnknown: true })).toEqual({
      text: 'Recommended default',
      isDefault: true,
    })
  })

  it('the Review names the exact timeline milestone the visitor picked', () => {
    const base = useAssessmentStore.getState() as unknown as AssessReviewState
    const pair = { id: 'Sample migration deadline', authority: 'Sample Authority', year: 2035 }
    const plain = summarizeAnswer('timeline', { ...base, timelinePressure: 'internal-deadline' })
    expect(plain.text).toBe('Own Target or Distant Deadline')
    const withPair = summarizeAnswer('timeline', {
      ...base,
      timelinePressure: 'internal-deadline',
      timelineMilestone: pair,
    })
    expect(withPair.text).toMatch(/^Distant external deadline: /)
    expect(withPair.text).toContain('Sample Authority')
  })
})
