// SPDX-License-Identifier: AGPL-3.0-only
// Only buildDimensions' return-value input boundary is controlled. The actual
// Simulation score extraction and actual Markdown builder run unchanged.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ScorecardDimension } from '@/components/PKILearning/common/executive/DataDrivenScorecard'
import { REAL_DOC_GENERATORS } from './realToolDocs'
import { setAutoRunFill } from './autoRunFill'

const fixture = vi.hoisted(() => ({
  dimensions: null as ScorecardDimension[] | null,
}))
vi.mock('@/data/kpiCatalog', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/data/kpiCatalog')>()
  return {
    ...actual,
    buildDimensions: (...args: Parameters<typeof actual.buildDimensions>) =>
      fixture.dimensions ?? actual.buildDimensions(...args),
  }
})
function dimension(overrides: Partial<ScorecardDimension>): ScorecardDimension {
  return {
    id: 'sample-kpi',
    label: 'Controlled sample KPI',
    description: 'Fictional consumer-contract input',
    weight: 1,
    valueSource: 'calculated',
    ...overrides,
  }
}
function dashboard(sector: 'financial' | 'healthcare' = 'healthcare') {
  const generate = REAL_DOC_GENERATORS['kpi-dashboard']
  if (!generate) throw new Error('Actual Simulation KPI generator is unavailable')
  return generate(sector).data
}
function sampleRow(markdown: string) {
  const row = markdown.split('\n').find((line) => line.startsWith('| Controlled sample KPI |'))
  if (!row) throw new Error('Actual generated KPI row is missing')
  return row
}
const expectNoFabricatedFallback = (markdown: string) =>
  expect(markdown).not.toMatch(/\| (?:55|65|75)\/100(?:\s|\|)/)
beforeEach(() => {
  fixture.dimensions = null
  setAutoRunFill(false)
})

describe('Simulation actual KPI document score-state contract', () => {
  it('preserves a genuine calculated zero as zero, including its single-value overall score', () => {
    fixture.dimensions = [dimension({ autoScore: 0 })]
    const document = dashboard()
    expect(sampleRow(document)).toMatch(/\| Controlled sample KPI \| 0\/100 \|/)
    expect(sampleRow(document)).not.toContain('not assessed')
    expect(document).toContain('**Overall Score: 0/100**')
    expectNoFabricatedFallback(document)
  })
  it('preserves a positive calculated value rather than using a fallback', () => {
    fixture.dimensions = [dimension({ autoScore: 83 })]
    const document = dashboard()
    expect(sampleRow(document)).toMatch(/\| Controlled sample KPI \| 83\/100 \|/)
    expect(document).toContain('**Overall Score: 83/100**')
    expectNoFabricatedFallback(document)
  })
  it('leaves a missing numeric score unscored and withholds an overall score', () => {
    fixture.dimensions = [dimension({ autoScore: undefined })]
    const document = dashboard()
    expect(sampleRow(document)).toContain('_not yet scored_')
    expect(document).toContain('**Overall Score: not available')
    expectNoFabricatedFallback(document)
  })
  it('keeps an unavailable-input dimension locked instead of promoting its numeric placeholder', () => {
    // buildDimensions normalizes a null auto-calculation into disabled + zero.
    fixture.dimensions = [
      dimension({
        autoScore: 0,
        disabled: true,
        disabledReason: 'Required input unavailable',
      }),
    ]
    const document = dashboard()
    expect(sampleRow(document)).toContain('_locked_')
    expect(sampleRow(document)).toContain('Required inputs unavailable')
    expect(document).toContain('**Overall Score: not available')
    expectNoFabricatedFallback(document)
  })
  it('distinguishes an untouched manual zero placeholder from a genuine calculated zero', () => {
    fixture.dimensions = [dimension({ autoScore: 0, notYetScored: true, valueSource: 'manual' })]
    const document = dashboard()
    expect(sampleRow(document)).toContain('not assessed for current use')
    expect(sampleRow(document)).toContain('Manual sample input — not entered')
    expect(document).toContain('**Overall Score: not available')
    expect(document).not.toContain('**Overall Score: 0/100**')
    expectNoFabricatedFallback(document)
  })
  it.each(['missing', 'zero'] as const)(
    'an illustrative future-pack heading does not invent a value for %s input',
    (kind) => {
      setAutoRunFill(true, true)
      fixture.dimensions = [dimension({ autoScore: kind === 'zero' ? 0 : undefined })]
      const document = dashboard('financial')
      expect(document).toContain('# Illustrative future board reporting pack')
      expect(document).toContain(
        "not the organisation's current delivery progress, measured readiness or approved targets"
      )
      expect(sampleRow(document)).toContain(kind === 'zero' ? '| 0/100 |' : '_not yet scored_')
      expectNoFabricatedFallback(document)
      setAutoRunFill(false)
    }
  )
  it.each(['financial', 'healthcare'] as const)(
    'uses the actual fixed-sector %s dimension pipeline without invented manual scores',
    (sector) => {
      // null fixture means actual buildDimensions, actual catalogue inputs and report.
      fixture.dimensions = null
      const document = dashboard(sector)
      expect(document).toContain('# PQC Governance KPI Dashboard')
      expect(document).toContain('| Vendor Readiness | _locked_ |')
      expect(document).toContain('not assessed for current use')
      expect(document).toContain('**Overall Score: not available')
      expectNoFabricatedFallback(document)
    }
  )
})
