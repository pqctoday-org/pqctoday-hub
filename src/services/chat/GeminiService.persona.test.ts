import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from './GeminiService'
import type { PageContext } from '@/hooks/usePageContext'

/** Helper to build a minimal PageContext with required fields */
function makePageContext(overrides: Partial<PageContext> = {}): PageContext {
  return {
    page: 'Home',
    relevantSources: [],
    suggestedQuestions: [],
    ...overrides,
  }
}

describe('buildSystemPrompt — persona-specific instructions', () => {
  // P1: Executive persona includes "business impact", "timelines"
  it('executive persona includes "business impact" and "timelines"', () => {
    const ctx = makePageContext({ persona: 'executive' })
    const result = buildSystemPrompt([], ctx)
    expect(result).toContain('business impact')
    expect(result).toContain('timelines')
  })

  // P2: Developer persona includes "technical details", "code examples"
  it('developer persona includes "technical details" and "code examples"', () => {
    const ctx = makePageContext({ persona: 'developer' })
    const result = buildSystemPrompt([], ctx)
    expect(result).toContain('technical details')
    expect(result).toContain('code examples')
  })

  // P3: Architect persona includes "integration patterns", "architecture decisions"
  it('architect persona includes "integration patterns" and "architecture decisions"', () => {
    const ctx = makePageContext({ persona: 'architect' })
    const result = buildSystemPrompt([], ctx)
    expect(result).toContain('integration patterns')
    expect(result).toContain('architecture decisions')
  })

  // P4: Researcher persona includes "mathematical foundations"
  it('researcher persona includes "mathematical foundations"', () => {
    const ctx = makePageContext({ persona: 'researcher' })
    const result = buildSystemPrompt([], ctx)
    expect(result).toContain('mathematical foundations')
  })

  // P5: No persona (null) omits RESPONSE STYLE section
  it('no persona (null) omits RESPONSE STYLE section', () => {
    const ctxNull = makePageContext({ persona: null })
    expect(buildSystemPrompt([], ctxNull)).not.toContain('RESPONSE STYLE')

    // Also verify when no pageContext at all
    expect(buildSystemPrompt([])).not.toContain('RESPONSE STYLE')
  })

  // P6: All four personas produce different personaDepth text
  it('all four personas produce different personaDepth text', () => {
    const personas = ['executive', 'developer', 'architect', 'researcher'] as const
    const results = personas.map((p) => {
      const ctx = makePageContext({ persona: p })
      return buildSystemPrompt([], ctx)
    })

    // Extract the RESPONSE STYLE line from each result
    const responseStyles = results.map((r) => {
      const match = r.match(/RESPONSE STYLE: (.+)/)
      return match?.[1] ?? ''
    })

    // Each persona should produce a non-empty, unique RESPONSE STYLE value
    for (const style of responseStyles) {
      expect(style).not.toBe('')
    }

    // All four should be distinct from each other
    const uniqueStyles = new Set(responseStyles)
    expect(uniqueStyles.size).toBe(4)
  })

  // P7: Executive + Financial Services + eu combination includes all three
  it('executive + Financial Services + eu combination includes all three in prompt', () => {
    const ctx = makePageContext({
      persona: 'executive',
      industry: 'Financial Services',
      region: 'eu',
    })
    const result = buildSystemPrompt([], ctx)

    // Persona depth for executive
    expect(result).toContain('business impact')

    // Industry in user profile
    expect(result).toContain('Financial Services')

    // Region label for eu
    expect(result).toContain('Europe')
  })

  // P8: Developer + Technology + global combination includes all three
  it('developer + Technology + global combination includes all three in prompt', () => {
    const ctx = makePageContext({
      persona: 'developer',
      industry: 'Technology',
      region: 'global',
    })
    const result = buildSystemPrompt([], ctx)

    // Persona depth for developer
    expect(result).toContain('technical details')

    // Industry in user profile
    expect(result).toContain('Technology')

    // Region label for global
    expect(result).toContain('Global')
  })
})
