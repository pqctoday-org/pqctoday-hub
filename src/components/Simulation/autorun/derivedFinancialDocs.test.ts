// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  deriveRoiDoc,
  deriveBreachDoc,
  deriveInactionDoc,
  deriveBoardDeck,
} from './derivedFinancialDocs'
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

  it('board deck carries derived numbers (ask, breach exposure, cost of waiting)', () => {
    const doc = deriveBoardDeck('government')
    expect(doc.data).toMatch(/The ask:/)
    expect(doc.data).toMatch(/per event/) // derived breach exposure
    expect(doc.data).toMatch(/× migrate-now/) // derived delay ratio, not a hardcoded ~2×
    expect(doc.data).not.toMatch(/~2×/)
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
    expect(deck).toMatch(/NPV -/)
    expect(deck).toContain('negative NPV or payback beyond its evaluation horizon')
    expect(deck).toContain('do not justify automatic approval')
  })
})
