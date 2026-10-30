// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildFigureSources,
  buildFigureSourcesIndex,
  figureSourcesCsv,
  figureSourcesMarkdown,
  NO_PUBLISHED_SOURCE,
} from './figureSources'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '@/data/exampleReport'

const result: AssessmentResult = {
  riskScore: 71,
  preBoostScore: 69,
  riskLevel: 'high',
  algorithmMigrations: [],
  complianceImpacts: [
    {
      framework: 'Sourced Framework',
      requiresPQC: true,
      deadline: '2030',
      notes: 'n',
      website: 'https://example.org/framework',
      lastVerified: '2026-09-01',
      bindingStatus: 'binding',
      bindingBasis: 'Act 12, Article 3',
      deadlineKind: 'phased',
    },
    { framework: 'Unsourced Framework', requiresPQC: false, deadline: 'Ongoing', notes: 'n' },
    { framework: 'Unknown Framework', requiresPQC: null, deadline: 'Unknown', notes: 'n' },
  ],
  recommendedActions: [
    { priority: 1, action: 'Inventory', category: 'immediate', relatedModule: 'cbom' },
    { priority: 2, action: 'Pilot', category: 'short-term', relatedModule: 'x', effort: 'low' },
  ],
  narrative: 'Narrative with 3 algorithms.',
  generatedAt: '2026-10-16T00:00:00Z',
  categoryScores: {
    quantumExposure: 80,
    migrationComplexity: 60,
    regulatoryPressure: 70,
    organizationalReadiness: 40,
  },
  hndlRiskWindow: {
    dataRetentionYears: 15,
    estimatedQuantumThreatYear: 2035,
    crqcEstimateYear: 2035,
    currentYear: 2026,
    isAtRisk: true,
    riskWindowYears: 6,
  },
  migrationEffort: [
    {
      algorithm: 'RSA-2048',
      complexity: 'medium',
      estimatedScope: 'moderate',
      rationale: 'r',
    },
  ],
  keyFindings: ['Finding with 2 numbers 5'],
}

const profile = {
  industry: 'Finance & Banking',
  country: 'United States',
  generatedAt: '2026-10-16T00:00:00Z',
}

describe('buildFigureSources', () => {
  const entries = buildFigureSources({
    result,
    profile,
    countryMilestone: {
      year: 2030,
      title: 'Key establishment',
      binding: true,
      sourceUrl: 'https://example.gov/eo',
      sourceDate: '2026-06-01',
    },
  })

  it('numbers entries C1..Cn in order', () => {
    expect(entries.map((e) => e.id)).toEqual(entries.map((_, i) => `C${i + 1}`))
  })

  it('reaches every kind', () => {
    const kinds = new Set(entries.map((e) => e.kind))
    expect([...kinds].sort()).toEqual(['estimate', 'fact', 'recommendation', 'scenario'])
  })

  it('makes the risk score an estimate with the weighted working as its method', () => {
    const risk = entries[0]
    expect(risk.claim).toBe('Educational PQC priority index')
    expect(risk.value).toBe('71 / 100 (high)')
    expect(risk.kind).toBe('estimate')
    expect(risk.method).toMatch(/Weighted composite of four category scores/)
    expect(risk.caveat).toContain(NO_PUBLISHED_SOURCE)
  })

  it('exports the actual quick-example additive calculation rather than the contextual weights', () => {
    const quick = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    const exported = buildFigureSources({ result: quick, profile })[0]
    expect(exported.value).toContain('65 / 100')
    expect(exported.method).toContain('Quick-assessment additive points')
    expect(exported.method).toContain('= 65')
    expect(exported.method).not.toContain('base 53.7')
  })

  it('makes a sourced framework a fact carrying its binding status, basis and check date', () => {
    const e = entries.find((x) => x.claim.startsWith('Sourced Framework'))
    expect(e?.kind).toBe('fact')
    expect(e?.source?.url).toBe('https://example.org/framework')
    expect(e?.scope).toBe('Binding status: binding (Act 12, Article 3)')
    expect(e?.asOf).toBe('2026-09-01')
    expect(e?.caveat).toMatch(/phased/)
  })

  it('shows a framework without a source as an estimate with the no-source caveat', () => {
    for (const name of ['Unsourced Framework', 'Unknown Framework']) {
      const e = entries.find((x) => x.claim.startsWith(name))
      expect(e?.kind).toBe('estimate')
      expect(e?.source).toBeUndefined()
      expect(e?.caveat).toContain(NO_PUBLISHED_SOURCE)
    }
  })

  it('makes the country milestone a fact when sourced, an estimate when not', () => {
    expect(entries.find((e) => e.claim.includes('next national milestone'))?.kind).toBe('fact')
    const unsourced = buildFigureSources({
      result,
      profile,
      countryMilestone: { year: 2031, title: 'Target', binding: false },
    }).find((e) => e.claim.includes('next national milestone'))
    expect(unsourced?.kind).toBe('estimate')
    expect(unsourced?.scope).toBe('Published target (not binding)')
    expect(unsourced?.caveat).toBe(NO_PUBLISHED_SOURCE)
  })

  it('makes the CRQC horizon and exposure window scenarios with a dated basis', () => {
    const horizon = entries.find((e) => e.claim.startsWith('Quantum-threat planning horizon'))
    expect(horizon?.kind).toBe('scenario')
    expect(horizon?.value).toBe('~2035')
    expect(horizon?.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(entries.find((e) => e.claim.startsWith('Data exposure window'))?.kind).toBe('scenario')
  })

  it('lists program effort, calendar and cost bands as estimates with their assumptions', () => {
    const cost = entries.find((e) => e.claim === 'Indicative program cost')
    expect(cost?.kind).toBe('estimate')
    expect(cost?.value).toBe('~$18k–$36k')
    expect(cost?.method).toMatch(/\$18k per person-month/)
    expect(entries.find((e) => e.claim === 'Program calendar time')?.value).toBe('~1–1 months')
  })

  it('makes the top priorities recommendations', () => {
    const recs = entries.filter((e) => e.kind === 'recommendation')
    expect(recs.map((r) => r.claim)).toEqual(['Priority 1: Inventory', 'Priority 2: Pilot'])
  })

  it('omits figures the pack does not state', () => {
    const bare = buildFigureSourcesIndex({
      result: {
        ...result,
        hndlRiskWindow: undefined,
        migrationEffort: [],
        keyFindings: [],
        complianceImpacts: [],
      },
      profile,
    })
    expect(bare.idOf('crqc-horizon')).toBeUndefined()
    expect(bare.idOf('country-milestone')).toBeUndefined()
    expect(bare.idOf('effort-cost')).toBeUndefined()
    expect(bare.idOf('risk-score')).toBe('C1')
  })
})

describe('ledger files', () => {
  const entries = buildFigureSources({ result, profile })

  it('writes the CSV with the ledger columns and RFC 4180 quoting', () => {
    const csv = figureSourcesCsv(entries)
    const [header] = csv.split('\n')
    expect(header).toBe('id,claim,value,kind,source,url,ref,method,scope,as_of,caveat')
    expect(csv).toContain('"Binding status: binding (Act 12, Article 3)"')
    expect(csv.trim().split('\n').length).toBeGreaterThan(entries.length)
  })

  it('writes the markdown as an introduction and one table row per entry', () => {
    const md = figureSourcesMarkdown(entries)
    expect(md).toContain('# Sources of the figures in this pack')
    for (const e of entries) expect(md).toContain(`| ${e.id} |`)
  })
})
