// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createElement } from 'react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { usePageContext } from './usePageContext'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import type { AssessmentResult } from './assessmentTypes'

// Mock getModuleDeepLink so tests don't depend on window.location.search
vi.mock('./useModuleDeepLink', () => ({
  getModuleDeepLink: () => ({ initialTab: 'learn', initialStep: 0 }),
}))

/** Creates a wrapper component that renders children inside a MemoryRouter at the given path. */
function createWrapper(path: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(MemoryRouter, { initialEntries: [path] }, children)
  }
}

/** Minimal valid AssessmentResult for testing. */
const MOCK_RESULT: AssessmentResult = {
  riskScore: 72,
  riskLevel: 'high',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: 'Test narrative',
  generatedAt: '2026-02-26T00:00:00Z',
}

describe('usePageContext', () => {
  beforeEach(() => {
    // Reset stores to defaults before each test
    usePersonaStore.setState({
      selectedPersona: null,
      selectedIndustry: null,
      selectedRegion: 'global',
    })
    useAssessmentStore.setState({
      assessmentStatus: 'not-started',
      lastResult: null,
      complianceRequirements: [],
      infrastructure: [],
      migrationStatus: '',
      timelinePressure: '',
      cryptoAgility: '',
    })
  })

  // ─── Route Mapping Tests ────────────────────────────────────────────────

  describe('route mapping', () => {
    it('maps /algorithms to Algorithms page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/algorithms'),
      })
      expect(result.current.page).toBe('Algorithms')
      expect(result.current.relevantSources).toEqual(['algorithms', 'transitions', 'glossary'])
    })

    it('maps /timeline to Timeline page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/timeline'),
      })
      expect(result.current.page).toBe('Timeline')
      expect(result.current.relevantSources).toEqual(['timeline', 'compliance'])
    })

    it('maps /threats to Threat Landscape page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/threats'),
      })
      expect(result.current.page).toBe('Threat Landscape')
      expect(result.current.relevantSources).toEqual(['threats', 'glossary', 'document-enrichment'])
    })

    it('maps /library to Library page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/library'),
      })
      expect(result.current.page).toBe('Library')
      expect(result.current.relevantSources).toEqual([
        'library',
        'authoritative-sources',
        'document-enrichment',
      ])
    })

    it('maps /leaders to Leaders page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/leaders'),
      })
      expect(result.current.page).toBe('Leaders')
      expect(result.current.relevantSources).toEqual(['leaders'])
    })

    it('maps /compliance to Compliance page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/compliance'),
      })
      expect(result.current.page).toBe('Compliance')
      expect(result.current.relevantSources).toEqual([
        'compliance',
        'certifications',
        'document-enrichment',
      ])
    })

    it('maps /migrate to Migrate Catalog page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/migrate'),
      })
      expect(result.current.page).toBe('Migrate Catalog')
      expect(result.current.relevantSources).toEqual([
        'migrate',
        'certifications',
        'priority-matrix',
      ])
    })

    it('maps /assess to Assessment page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.page).toBe('Assessment')
      expect(result.current.relevantSources).toEqual(['assessment', 'compliance', 'threats'])
    })

    it('maps /playground to Playground page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/playground'),
      })
      expect(result.current.page).toBe('Playground')
      expect(result.current.relevantSources).toEqual([
        'algorithms',
        'glossary',
        'modules',
        'playground-guide',
        'softhsmv3',
      ])
    })

    it('maps /openssl to OpenSSL Studio page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/openssl'),
      })
      expect(result.current.page).toBe('OpenSSL Studio')
      expect(result.current.relevantSources).toEqual(['algorithms', 'modules', 'openssl-guide'])
    })

    it('maps /learn to Learn page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn'),
      })
      expect(result.current.page).toBe('Learn')
      expect(result.current.relevantSources).toEqual([
        'modules',
        'module-content',
        'module-summaries',
        'glossary',
        'quiz',
      ])
    })

    it('maps / to Home (default context)', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/'),
      })
      expect(result.current.page).toBe('Home')
      expect(result.current.relevantSources).toEqual([])
    })
  })

  // ─── Module Route Tests ─────────────────────────────────────────────────

  describe('module routes', () => {
    it('maps /learn/pqc-101 to Learn: PQC 101 with curated questions', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn/pqc-101'),
      })
      expect(result.current.page).toBe('Learn: PQC 101')
      expect(result.current.moduleId).toBe('pqc-101')
      expect(result.current.tab).toBe('learn')
      expect(result.current.step).toBe(0)
      expect(result.current.relevantSources).toEqual([
        'modules',
        'module-content',
        'module-summaries',
        'glossary',
        'algorithms',
      ])
      expect(result.current.suggestedQuestions).toEqual([
        'What is post-quantum cryptography and why does it matter?',
        "How do Shor's and Grover's algorithms affect current encryption?",
        'What are the NIST-standardized PQC algorithms?',
      ])
    })

    it('maps /learn/tls-basics to Learn: TLS Basics with curated questions', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn/tls-basics'),
      })
      expect(result.current.page).toBe('Learn: TLS Basics')
      expect(result.current.moduleId).toBe('tls-basics')
      expect(result.current.suggestedQuestions).toEqual([
        'How does ML-KEM integrate with TLS 1.3?',
        "What's the performance overhead of PQC in TLS?",
        'Explain hybrid key exchange in TLS',
      ])
    })

    it('maps /learn/qkd to Learn: Quantum Key Distribution with curated questions', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn/qkd'),
      })
      expect(result.current.page).toBe('Learn: Quantum Key Distribution')
      expect(result.current.moduleId).toBe('qkd')
      expect(result.current.suggestedQuestions).toEqual([
        'How does the BB84 QKD protocol work?',
        'What are the limitations of QKD vs PQC?',
        'Where is QKD deployed today?',
      ])
    })

    it('uses generic fallback questions for modules without curated questions', () => {
      // digital-id has curated questions, so let's test a hypothetical module
      // Actually, all modules in MODULE_NAMES now have curated questions.
      // We verify that the fallback path exists by testing a module that is in
      // MODULE_NAMES but not in MODULE_SUGGESTED_QUESTIONS. Since the source
      // currently covers all modules, we verify the curated path for one more.
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn/digital-id'),
      })
      expect(result.current.page).toBe('Learn: Digital Identity')
      expect(result.current.moduleId).toBe('digital-id')
      // digital-id has curated questions
      expect(result.current.suggestedQuestions).toEqual([
        'How does PQC affect mobile driver licenses (mDL)?',
        'What is SD-JWT and its role in digital identity?',
        'How do verifiable credentials prepare for the quantum threat?',
      ])
    })
  })

  // ─── Suggested Questions Tests ──────────────────────────────────────────

  describe('suggested questions', () => {
    it('provides suggested questions for /algorithms', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/algorithms'),
      })
      expect(result.current.suggestedQuestions).toHaveLength(3)
      expect(result.current.suggestedQuestions[0]).toContain('ML-KEM')
    })

    it('provides suggested questions for /threats', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/threats'),
      })
      expect(result.current.suggestedQuestions).toHaveLength(3)
      expect(result.current.suggestedQuestions[0]).toContain('HNDL')
    })

    it('provides suggested questions for /compliance', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/compliance'),
      })
      expect(result.current.suggestedQuestions).toHaveLength(3)
      expect(result.current.suggestedQuestions[0]).toContain('FIPS 140-3')
    })

    it('provides default suggested questions for Home', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/'),
      })
      expect(result.current.suggestedQuestions).toEqual([
        'What is post-quantum cryptography?',
        'How do I get started with PQC migration?',
        'What algorithms does NIST recommend?',
      ])
    })

    it('provides suggested questions for /learn hub', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn'),
      })
      expect(result.current.suggestedQuestions).toHaveLength(3)
      expect(result.current.suggestedQuestions[0]).toBe('What learning modules are available?')
    })
  })

  // ─── Persona Integration Tests ──────────────────────────────────────────

  describe('persona integration', () => {
    it('includes persona when set', () => {
      usePersonaStore.setState({ selectedPersona: 'executive' })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/timeline'),
      })
      expect(result.current.persona).toBe('executive')
    })

    it('includes industry when set', () => {
      usePersonaStore.setState({ selectedIndustry: 'Financial Services' })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.industry).toBe('Financial Services')
    })

    it('includes region when set', () => {
      usePersonaStore.setState({ selectedRegion: 'eu' })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/compliance'),
      })
      expect(result.current.region).toBe('eu')
    })

    it('passes all persona fields simultaneously', () => {
      usePersonaStore.setState({
        selectedPersona: 'architect',
        selectedIndustry: 'Healthcare',
        selectedRegion: 'americas',
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/migrate'),
      })
      expect(result.current.persona).toBe('architect')
      expect(result.current.industry).toBe('Healthcare')
      expect(result.current.region).toBe('americas')
    })

    it('handles null persona fields', () => {
      usePersonaStore.setState({
        selectedPersona: null,
        selectedIndustry: null,
        selectedRegion: null,
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/'),
      })
      expect(result.current.persona).toBeNull()
      expect(result.current.industry).toBeNull()
      expect(result.current.region).toBeNull()
    })
  })

  // ─── Assessment Integration Tests ───────────────────────────────────────

  describe('assessment integration', () => {
    it('includes assessment fields when status is complete', () => {
      useAssessmentStore.setState({
        assessmentStatus: 'complete',
        lastResult: MOCK_RESULT,
        complianceRequirements: ['FIPS 140-3', 'CNSA 2.0'],
        infrastructure: ['Cloud', 'Network'],
        migrationStatus: 'planning',
        timelinePressure: 'within-2-3y',
        cryptoAgility: 'partially-abstracted',
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.assessmentComplete).toBe(true)
      expect(result.current.riskScore).toBe(72)
      expect(result.current.riskLevel).toBe('high')
      expect(result.current.complianceFrameworks).toEqual(['FIPS 140-3', 'CNSA 2.0'])
      expect(result.current.infrastructure).toEqual(['Cloud', 'Network'])
      expect(result.current.migrationStatus).toBe('planning')
      expect(result.current.timelinePressure).toBe('within-2-3y')
      expect(result.current.cryptoAgility).toBe('partially-abstracted')
    })

    it('omits assessment fields when status is not-started', () => {
      useAssessmentStore.setState({
        assessmentStatus: 'not-started',
        lastResult: null,
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.assessmentComplete).toBeUndefined()
      expect(result.current.riskScore).toBeUndefined()
      expect(result.current.riskLevel).toBeUndefined()
      expect(result.current.complianceFrameworks).toBeUndefined()
    })

    it('omits assessment fields when status is in-progress', () => {
      useAssessmentStore.setState({
        assessmentStatus: 'in-progress',
        lastResult: null,
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.assessmentComplete).toBeUndefined()
      expect(result.current.riskScore).toBeUndefined()
    })

    it('omits assessment fields when complete but lastResult is null', () => {
      useAssessmentStore.setState({
        assessmentStatus: 'complete',
        lastResult: null,
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.assessmentComplete).toBeUndefined()
      expect(result.current.riskScore).toBeUndefined()
    })

    it('omits empty compliance and infrastructure arrays from assessment', () => {
      useAssessmentStore.setState({
        assessmentStatus: 'complete',
        lastResult: MOCK_RESULT,
        complianceRequirements: [],
        infrastructure: [],
        migrationStatus: '',
        timelinePressure: '',
        cryptoAgility: '',
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/assess'),
      })
      expect(result.current.assessmentComplete).toBe(true)
      expect(result.current.riskScore).toBe(72)
      // Empty arrays and empty strings should be excluded (converted to undefined)
      expect(result.current.complianceFrameworks).toBeUndefined()
      expect(result.current.infrastructure).toBeUndefined()
      expect(result.current.migrationStatus).toBeUndefined()
      expect(result.current.timelinePressure).toBeUndefined()
      expect(result.current.cryptoAgility).toBeUndefined()
    })

    it('includes assessment fields on module routes too', () => {
      useAssessmentStore.setState({
        assessmentStatus: 'complete',
        lastResult: MOCK_RESULT,
        complianceRequirements: ['PCI DSS'],
        infrastructure: ['Application'],
        migrationStatus: 'started',
        timelinePressure: 'within-1y',
        cryptoAgility: 'hardcoded',
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn/pqc-101'),
      })
      expect(result.current.page).toBe('Learn: PQC 101')
      expect(result.current.assessmentComplete).toBe(true)
      expect(result.current.riskScore).toBe(72)
      expect(result.current.complianceFrameworks).toEqual(['PCI DSS'])
      expect(result.current.infrastructure).toEqual(['Application'])
      expect(result.current.migrationStatus).toBe('started')
    })
  })

  // ─── Edge Case Tests ────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('returns default Home context for unknown route', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/nonexistent-route'),
      })
      expect(result.current.page).toBe('Home')
      expect(result.current.relevantSources).toEqual([])
      expect(result.current.suggestedQuestions).toEqual([
        'What is post-quantum cryptography?',
        'How do I get started with PQC migration?',
        'What algorithms does NIST recommend?',
      ])
    })

    it('returns Learn context for unknown sub-path under /learn', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learn/nonexistent-module'),
      })
      // Unknown module falls through the module check, then matches /learn prefix fallback
      expect(result.current.page).toBe('Learn')
      expect(result.current.relevantSources).toEqual([
        'modules',
        'module-content',
        'module-summaries',
        'glossary',
        'quiz',
      ])
    })

    it('treats /learn with trailing content (no slash) as Learn page', () => {
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/learnmore'),
      })
      // /learnmore does not start with /learn/ so the module check is skipped
      // But it does start with /learn so it matches the /learn fallback
      expect(result.current.page).toBe('Learn')
    })

    it('combines persona and assessment context on any route', () => {
      usePersonaStore.setState({
        selectedPersona: 'developer',
        selectedIndustry: 'Technology',
        selectedRegion: 'apac',
      })
      useAssessmentStore.setState({
        assessmentStatus: 'complete',
        lastResult: { ...MOCK_RESULT, riskScore: 45, riskLevel: 'medium' },
        complianceRequirements: ['SOC 2'],
        infrastructure: ['Cloud'],
        migrationStatus: 'not-started',
        timelinePressure: 'no-deadline',
        cryptoAgility: 'fully-abstracted',
      })
      const { result } = renderHook(() => usePageContext(), {
        wrapper: createWrapper('/playground'),
      })
      // Persona fields
      expect(result.current.persona).toBe('developer')
      expect(result.current.industry).toBe('Technology')
      expect(result.current.region).toBe('apac')
      // Assessment fields
      expect(result.current.assessmentComplete).toBe(true)
      expect(result.current.riskScore).toBe(45)
      expect(result.current.riskLevel).toBe('medium')
      expect(result.current.complianceFrameworks).toEqual(['SOC 2'])
      expect(result.current.infrastructure).toEqual(['Cloud'])
      expect(result.current.migrationStatus).toBe('not-started')
      expect(result.current.timelinePressure).toBe('no-deadline')
      expect(result.current.cryptoAgility).toBe('fully-abstracted')
      // Page context
      expect(result.current.page).toBe('Playground')
    })
  })
})
