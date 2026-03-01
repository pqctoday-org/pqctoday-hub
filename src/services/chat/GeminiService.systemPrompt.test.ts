// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from './GeminiService'
import type { RAGChunk } from '@/types/ChatTypes'
import type { PageContext } from '@/hooks/usePageContext'

/** Minimal RAGChunk for tests that need context blocks */
const mockChunk: RAGChunk = {
  id: 'test-1',
  source: 'algorithms',
  title: 'ML-KEM Overview',
  content: 'ML-KEM is a lattice-based key encapsulation mechanism standardized in FIPS 203.',
  category: 'algorithms',
  metadata: { family: 'lattice' },
  deepLink: '/algorithms?highlight=ml-kem',
}

/** Helper to build a minimal PageContext with required fields */
function makePageContext(overrides: Partial<PageContext> = {}): PageContext {
  return {
    page: 'Algorithms',
    relevantSources: ['algorithms'],
    suggestedQuestions: ['What is ML-KEM?'],
    ...overrides,
  }
}

describe('buildSystemPrompt', () => {
  // ---------------------------------------------------------------------------
  // Core structure (5 tests)
  // ---------------------------------------------------------------------------
  describe('core structure', () => {
    it('includes "PQC Today Assistant" identity text', () => {
      const result = buildSystemPrompt([])
      expect(result).toContain('PQC Today Assistant')
    })

    it('includes knowledge boundary instruction', () => {
      const result = buildSystemPrompt([])
      expect(result).toContain('Answer based ONLY on the provided context')
    })

    it('includes followups instruction with the ```followups code fence format', () => {
      const result = buildSystemPrompt([])
      expect(result).toContain('```followups')
    })

    it('includes deep-link patterns', () => {
      const result = buildSystemPrompt([])
      expect(result).toContain('/algorithms?highlight=')
      expect(result).toContain('/timeline?country=')
    })

    it('includes "CONTEXT FROM PQC TODAY DATABASE" header before context blocks', () => {
      const result = buildSystemPrompt([mockChunk])
      const contextHeader = 'CONTEXT FROM PQC TODAY DATABASE:'
      expect(result).toContain(contextHeader)
      // The context block separator should appear after the header.
      // Use the full "--- Source:" marker — the bare title also appears in the entity
      // inventory section which is inserted before the context header.
      const headerIdx = result.indexOf(contextHeader)
      const chunkIdx = result.indexOf('--- Source: algorithms | ML-KEM Overview ---')
      expect(headerIdx).toBeLessThan(chunkIdx)
    })
  })

  // ---------------------------------------------------------------------------
  // Page context (4 tests)
  // ---------------------------------------------------------------------------
  describe('page context', () => {
    it('includes "viewing the Algorithms page" when pageContext.page is "Algorithms"', () => {
      const ctx = makePageContext({ page: 'Algorithms' })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('viewing the Algorithms page')
    })

    it('includes tab info like "(workshop tab, step 3)" for workshop tab with step', () => {
      const ctx = makePageContext({ page: 'Learn: PKI Workshop', tab: 'workshop', step: 2 })
      const result = buildSystemPrompt([], ctx)
      // step is 0-indexed, displayed as step+1 → step 2 becomes "step 3"
      expect(result).toContain('(workshop tab, step 3)')
    })

    it('omits tab info when tab is "learn" (default)', () => {
      const ctx = makePageContext({ page: 'Learn: PQC 101', tab: 'learn' })
      const result = buildSystemPrompt([], ctx)
      // Should include the page name but not any tab annotation
      expect(result).toContain('viewing the Learn: PQC 101 page')
      expect(result).not.toContain('(learn tab')
    })

    it('omits page note entirely when no pageContext provided', () => {
      const result = buildSystemPrompt([])
      expect(result).not.toContain('currently viewing')
    })
  })

  // ---------------------------------------------------------------------------
  // Persona depth (5 tests)
  // ---------------------------------------------------------------------------
  describe('persona depth', () => {
    it('executive persona: includes "Lead with business impact, timelines, and risk"', () => {
      const ctx = makePageContext({ persona: 'executive' })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('Lead with business impact, timelines, and risk')
    })

    it('developer persona: includes "Include technical details, code examples"', () => {
      const ctx = makePageContext({ persona: 'developer' })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('Include technical details, code examples')
    })

    it('architect persona: includes "Emphasize integration patterns, architecture decisions"', () => {
      const ctx = makePageContext({ persona: 'architect' })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('Emphasize integration patterns, architecture decisions')
    })

    it('researcher persona: includes "mathematical foundations, algorithm comparisons"', () => {
      const ctx = makePageContext({ persona: 'researcher' })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('mathematical foundations, algorithm comparisons')
    })

    it('no persona (null/undefined): omits "RESPONSE STYLE" section entirely', () => {
      const ctxNull = makePageContext({ persona: null })
      expect(buildSystemPrompt([], ctxNull)).not.toContain('RESPONSE STYLE')

      const ctxUndefined = makePageContext({ persona: undefined })
      expect(buildSystemPrompt([], ctxUndefined)).not.toContain('RESPONSE STYLE')

      // Also verify when no pageContext at all
      expect(buildSystemPrompt([])).not.toContain('RESPONSE STYLE')
    })
  })

  // ---------------------------------------------------------------------------
  // Assessment integration (4 tests)
  // ---------------------------------------------------------------------------
  describe('assessment integration', () => {
    it('includes "Risk Score: 75/100 (High)" when assessmentComplete=true, riskScore=75, riskLevel="High"', () => {
      const ctx = makePageContext({
        assessmentComplete: true,
        riskScore: 75,
        riskLevel: 'High',
      })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('Risk Score: 75/100 (High)')
    })

    it('includes compliance frameworks and infrastructure names in assessment note', () => {
      const ctx = makePageContext({
        assessmentComplete: true,
        riskScore: 60,
        riskLevel: 'Medium',
        complianceFrameworks: ['CNSA 2.0', 'ETSI'],
        infrastructure: ['HSMs', 'TLS Gateways'],
      })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('Compliance: CNSA 2.0, ETSI')
      expect(result).toContain('Infrastructure: HSMs, TLS Gateways')
    })

    it('omits assessment note when assessmentComplete is false/undefined', () => {
      const ctxFalse = makePageContext({ assessmentComplete: false, riskScore: 50 })
      expect(buildSystemPrompt([], ctxFalse)).not.toContain("User's PQC Assessment")

      const ctxUndefined = makePageContext({ riskScore: 50 })
      expect(buildSystemPrompt([], ctxUndefined)).not.toContain("User's PQC Assessment")

      // No pageContext at all
      expect(buildSystemPrompt([])).not.toContain("User's PQC Assessment")
    })

    it('handles missing optional fields (only riskScore, no compliance/infrastructure) without crash', () => {
      const ctx = makePageContext({
        assessmentComplete: true,
        riskScore: 42,
        riskLevel: 'Low',
        // Deliberately omit complianceFrameworks, infrastructure, migrationStatus, etc.
      })
      const result = buildSystemPrompt([], ctx)
      expect(result).toContain('Risk Score: 42/100 (Low)')
      expect(result).not.toContain('Compliance:')
      expect(result).not.toContain('Infrastructure:')
      expect(result).not.toContain('Migration Status:')
      expect(result).not.toContain('Timeline Pressure:')
      expect(result).not.toContain('Crypto Agility:')
    })
  })
})
