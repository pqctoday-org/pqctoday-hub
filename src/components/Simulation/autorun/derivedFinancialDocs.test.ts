// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { deriveRoiDoc, deriveBreachDoc, deriveInactionDoc } from './derivedFinancialDocs'
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
      for (const doc of [deriveRoiDoc(s), deriveBreachDoc(s), deriveInactionDoc(s)]) {
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
})
