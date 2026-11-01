// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  deriveRoiDoc,
  deriveBreachDoc,
  deriveInactionDoc,
  deriveBoardDeck,
  deriveExplorerDoc,
} from './derivedFinancialDocs'
import { costingInputsForSector } from './financialScenario'
import { compareCostModels } from '@/utils/costModelSim'
import { docFor } from './simAutoRun'
import type { DemoSector } from './demoDocs'

const SECTORS: DemoSector[] = [
  'financial',
  'healthcare',
  'government',
  'energy',
  'telecom',
  'retail',
  'general',
]

describe('derived financial demo docs', () => {
  it('carries the bank costing scope and shared-model estimates into the saved comparison', () => {
    const inputs = costingInputsForSector('financial')
    expect(inputs).toEqual({
      systems: 250,
      itBudgetAnnual: 50_000_000,
      complexity: 1,
      horizonYears: 5,
    })
    const comparison = compareCostModels(inputs, { seed: 42 })
    const doc = deriveExplorerDoc('financial').data
    expect(doc).toContain('250 systems')
    expect(doc).toContain('$50.0M annual IT budget')
    expect(doc).toContain('5-year horizon')
    expect(doc).toContain('Currency: USD')
    expect(doc).toContain(`$${(comparison.parametric / 1_000_000).toFixed(1)}M`)
    expect(doc).toContain(`$${(comparison.bottomUp / 1_000_000).toFixed(1)}M`)
    expect(doc).toContain('not approved funding')
    expect(deriveExplorerDoc('healthcare').data).not.toContain('€')
  })

  it('opens with a discovery-only charter instead of a migration budget or completed pilots', () => {
    const charter = docFor('program-charter', 'financial')!.data
    expect(charter).toContain('Discovery and planning only')
    expect(charter).toContain('No migration budget approved yet')
    expect(charter).toContain('5 years')
    expect(charter).toContain('records archiving and retrieval service')
    expect(charter).not.toContain('two hybrid pilots (TLS, VPN) live')
  })

  it('records closure requirements as future work without fabricated completed tests or retirement', () => {
    const doc = docFor('migration-verification', 'financial')!.data
    expect(doc).toContain('Sample planning only')
    expect(doc).toContain('Incomplete evidence (0/5)')
    expect(doc).not.toContain('Program closed; posture management transitions to BAU')
    expect(doc).not.toContain('2026-06-15')
    expect(doc).not.toContain('negotiated on prod edge')
  })
  it('produces a titled markdown doc for every sector and type', () => {
    for (const s of SECTORS) {
      for (const doc of [
        deriveRoiDoc(s),
        deriveBreachDoc(s),
        deriveInactionDoc(s),
        deriveBoardDeck(s),
      ]) {
        expect(doc.title.length).toBeGreaterThan(0)
        expect(doc.data).toContain('#')
        expect(doc.data.length).toBeGreaterThan(50)
      }
    }
  })

  it('is deterministic', () => {
    expect(deriveRoiDoc('financial')).toEqual(deriveRoiDoc('financial'))
    expect(deriveBreachDoc('government')).toEqual(deriveBreachDoc('government'))
    expect(deriveInactionDoc('healthcare')).toEqual(deriveInactionDoc('healthcare'))
  })

  it('breach doc surfaces the quantum breach + HNDL amplification', () => {
    const doc = deriveBreachDoc('financial')
    expect(doc.data).toMatch(/Quantum-enabled breach/)
    expect(doc.data).toMatch(/HNDL amplification/)
    expect(doc.data).toMatch(/annual expected loss/i)
  })

  it('roi doc reports NPV, ROI, and payback', () => {
    const doc = deriveRoiDoc('healthcare')
    expect(doc.data).toMatch(/NPV/)
    expect(doc.data).toMatch(/ROI/)
    expect(doc.data).toMatch(/Payback/)
  })

  it('inaction doc reports the cost of inaction', () => {
    const doc = deriveInactionDoc('financial')
    expect(doc.data).toMatch(/Cost of inaction/)
    expect(doc.data).toMatch(/NPV/)
  })

  it('board proposal uses the shared costing scope without treating optional models as approval', () => {
    const doc = deriveBoardDeck('government')
    expect(doc.data).toMatch(/The ask:/)
    expect(doc.data).toContain('Cost Model Explorer')
    expect(doc.data).toContain('5-year planning horizon')
    expect(doc.data).toContain('No model output automatically becomes an approved budget')
  })
  it('does not attribute a regulatory penalty to a delay scenario that excludes it', () => {
    expect(deriveInactionDoc('financial').data).toContain(
      'No framework-derived fine or contract loss'
    )
    expect(deriveBoardDeck('financial').data).toContain(
      'No regulatory penalty or contract-loss cost is included'
    )
    expect(deriveBoardDeck('financial').data).not.toContain('regulatory penalty once past')
  })

  it('keeps federal deadline scope beside the private-bank example', () => {
    const deck = deriveBoardDeck('financial').data
    expect(deck).toContain('specified US federal-agency')
    expect(deck).toContain('excluding national-security systems')
    expect(deck).toContain('do not automatically apply to a private organisation')
  })

  it('asks the board to challenge negative NPV rather than implying approval', () => {
    const deck = deriveBoardDeck('financial').data
    expect(deck).toContain('negative NPV or payback beyond its evaluation horizon')
    expect(deck).toContain('do not justify automatic approval')
  })
})
