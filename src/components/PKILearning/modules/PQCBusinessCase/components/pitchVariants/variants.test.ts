// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { getPitchVariant, isSupportedPitchPersona } from './index'

function makeData(overrides: Partial<ExecutiveModuleData> = {}): ExecutiveModuleData {
  return {
    threatsByIndustry: new Map(),
    criticalThreatCount: 3,
    totalThreatCount: 10,
    industryThreats: [],
    vendorsByLayer: new Map(),
    fipsValidatedCount: 1,
    pqcReadyCount: 2,
    vendorReadinessWeighted: 0.1,
    vendorReadinessByLayer: new Map(),
    totalProducts: 15,
    frameworks: [],
    frameworksByIndustry: [],
    countryDeadlines: [],
    userCountryData: null,
    assessmentResult: null,
    riskScore: null,
    industry: 'Technology',
    country: 'United States',
    complianceSelections: [],
    preBoostScore: null,
    boosts: [],
    hndlRiskWindow: null,
    hnflRiskWindow: null,
    categoryScores: null,
    categoryDrivers: null,
    migrationEffort: [],
    algorithmMigrations: [],
    keyFindings: [],
    assessmentProfile: null,
    myFrameworks: [],
    myProductIds: [],
    myProducts: [],
    myThreatIds: [],
    myThreats: [],
    myTimelineCountries: [],
    myTimelineCountryData: [],
    isAssessmentComplete: false,
    migrationDeadlineYear: null,
    ...overrides,
  }
}

describe('isSupportedPitchPersona', () => {
  it('accepts supported personas, rejects others', () => {
    expect(isSupportedPitchPersona('executive')).toBe(true)
    expect(isSupportedPitchPersona('developer')).toBe(true)
    expect(isSupportedPitchPersona('architect')).toBe(true)
    expect(isSupportedPitchPersona('ops')).toBe(true)
    expect(isSupportedPitchPersona('researcher')).toBe(false)
    expect(isSupportedPitchPersona('curious')).toBe(false)
    expect(isSupportedPitchPersona(null)).toBe(false)
  })
})

describe('getPitchVariant', () => {
  const data = makeData()

  it('returns executive variant for null / researcher / curious', () => {
    expect(getPitchVariant(null, data).filename).toBe('pqc-board-pitch')
    expect(getPitchVariant('researcher', data).filename).toBe('pqc-board-pitch')
    expect(getPitchVariant('curious', data).filename).toBe('pqc-board-pitch')
  })

  it('returns distinct filenames and titles for each supported persona', () => {
    const exec = getPitchVariant('executive', data)
    const dev = getPitchVariant('developer', data)
    const arch = getPitchVariant('architect', data)
    const ops = getPitchVariant('ops', data)
    const filenames = new Set([exec.filename, dev.filename, arch.filename, ops.filename])
    expect(filenames.size).toBe(4)
    const titles = new Set([exec.title, dev.title, arch.title, ops.title])
    expect(titles.size).toBe(4)
  })

  it('each variant ships with non-empty sections + defaults on every field', () => {
    const personas = ['executive', 'developer', 'architect', 'ops'] as const
    for (const p of personas) {
      const v = getPitchVariant(p, data)
      expect(v.sections.length).toBeGreaterThan(5)
      for (const section of v.sections) {
        for (const field of section.fields) {
          // Every field has a default so the user is never greeted with an empty form.
          expect(field.defaultValue).toBeDefined()
          if (typeof field.defaultValue === 'string') {
            expect(field.defaultValue.length).toBeGreaterThan(0)
          }
        }
      }
    }
  })

  it('executive variant includes the board-specific sections', () => {
    const v = getPitchVariant('executive', data)
    const ids = v.sections.map((s) => s.id)
    expect(ids).toContain('cost-benefit')
    expect(ids).toContain('budget')
    expect(ids).toContain('governance')
    expect(ids).toContain('peer-benchmark')
    expect(ids).toContain('quantum-urgency')
  })

  it('developer variant includes algorithm + effort sections, skips cost/budget', () => {
    const v = getPitchVariant('developer', data)
    const ids = v.sections.map((s) => s.id)
    expect(ids).toContain('algorithm-migrations')
    expect(ids).toContain('migration-effort')
    expect(ids).toContain('category-drivers')
    expect(ids).not.toContain('cost-benefit')
    expect(ids).not.toContain('budget')
  })

  it('architect variant includes category drivers + governance + peer benchmark', () => {
    const v = getPitchVariant('architect', data)
    const ids = v.sections.map((s) => s.id)
    expect(ids).toContain('category-drivers')
    expect(ids).toContain('governance')
    expect(ids).toContain('peer-benchmark')
    expect(ids).toContain('algorithm-migrations')
  })

  it('ops variant includes governance/runbook and effort, skips peer benchmark', () => {
    const v = getPitchVariant('ops', data)
    const ids = v.sections.map((s) => s.id)
    expect(ids).toContain('governance')
    expect(ids).toContain('migration-effort')
    expect(ids).toContain('algorithm-migrations')
    expect(ids).not.toContain('peer-benchmark')
    expect(ids).not.toContain('cost-benefit')
  })

  it('renderPreview emits H1 + H2 structure (pptx-compatible)', () => {
    const v = getPitchVariant('executive', data)
    const emptyFormData: Record<string, Record<string, string | string[]>> = {}
    for (const section of v.sections) {
      emptyFormData[section.id] = {}
      for (const field of section.fields) {
        emptyFormData[section.id][field.id] = field.defaultValue ?? ''
      }
    }
    const view = v.renderPreview(emptyFormData, data)
    expect(view).toMatch(/^# /m)
    expect((view.match(/^## /gm) ?? []).length).toBeGreaterThan(4)
  })
})
