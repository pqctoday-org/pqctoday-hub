// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { citationIndex, documentsFor, totalFor } from './requirementsModel'
import { buildObligations } from '../obligations/obligationsModel'
import { complianceFrameworks } from '@/data/complianceData'

const ROWS = buildObligations({
  country: 'France',
  industry: 'Finance & Insurance',
  region: 'eu',
})
const IN_SCOPE = ROWS.map((r) => r.framework)
const INDEX = citationIndex(IN_SCOPE)

function frameworkById(id: string) {
  const fw = complianceFrameworks.find((f) => f.id === id)
  if (!fw) throw new Error(`fixture row ${id} missing`)
  return fw
}

describe('documentsFor', () => {
  it('takes every citation that carries requirements, not just the first', () => {
    // ANSSI cites four of its own papers. The drawer resolved only the first,
    // under-reporting the row by more than half.
    const docs = documentsFor(frameworkById('ANSSI'))
    expect(docs.length).toBeGreaterThan(1)
    expect(totalFor(docs)).toBeGreaterThan(docs[0].total)
  })

  it('carries the extraction provenance on every document', () => {
    // The reason there is no percentage anywhere: these rows were extracted by
    // a model from a cited document, and the reader has to be able to see that.
    for (const doc of documentsFor(frameworkById('DORA'))) {
      expect(doc.extractionModel).not.toBe('')
      expect(doc.extractionDate).not.toBe('')
      expect(doc.confidence).toBeTruthy()
    }
  })

  it('groups by CSWP.39 pillar in a fixed order, dropping empty pillars', () => {
    const docs = documentsFor(frameworkById('ANSSI'))
    const order = ['governance', 'inventory', 'lifecycle', 'observability', 'assurance']
    for (const doc of docs) {
      const seen = doc.pillars.map((p) => p.pillar)
      expect(seen).toEqual(order.filter((p) => seen.includes(p as never)))
      expect(doc.pillars.every((p) => p.requirements.length > 0)).toBe(true)
    }
  })

  it('sorts a pillar by maturity level so L1 reads before L4', () => {
    for (const doc of documentsFor(frameworkById('ANSSI'))) {
      for (const group of doc.pillars) {
        const levels = group.requirements.map((r) => r.maturityLevel)
        expect(levels).toEqual([...levels].sort((a, b) => a - b))
      }
    }
  })

  it('omits citations that carry no extracted requirements', () => {
    const fw = { ...frameworkById('DORA'), libraryRefs: ['DORA', 'not-a-real-ref'] }
    expect(documentsFor(fw)).toEqual([])
  })

  it('returns nothing for an obligation whose citations resolve to nothing', () => {
    // Common Criteria's own row cites a document with no extracted rows. The
    // empty state has to be a real, renderable case rather than a crash.
    const cc = frameworkById('common-criteria-v3.1r5-part1')
    expect(documentsFor(cc)).toEqual([])
  })
})

describe('citationIndex + alsoCitedBy', () => {
  it('names the other obligations sharing a document', () => {
    // The fact the drawer hid: DORA's nine requirements are not DORA's alone.
    const docs = documentsFor(frameworkById('DORA'), INDEX)
    const enisa = docs.find((d) => d.refId === 'ENISA PQC Guidelines')
    expect(enisa).toBeDefined()
    expect(enisa!.alsoCitedBy.length).toBeGreaterThan(0)
    expect(enisa!.alsoCitedBy).toContain('GDPR')
  })

  it('never lists the obligation you are reading as its own sibling', () => {
    const docs = documentsFor(frameworkById('DORA'), INDEX)
    for (const doc of docs) {
      expect(doc.alsoCitedBy).not.toContain('DORA (EU Digital Operational Resilience)')
    }
  })

  it('finds both shared clusters in the reference scope', () => {
    const shared = [...INDEX.entries()].filter(([, labels]) => labels.length > 1)
    const refs = shared.map(([ref]) => ref)
    expect(refs).toContain('ENISA PQC Guidelines')
    expect(refs).toContain('ANSSI PQC Position Paper')
  })

  it('leaves siblings empty when no index is supplied', () => {
    for (const doc of documentsFor(frameworkById('DORA'))) {
      expect(doc.alsoCitedBy).toEqual([])
    }
  })
})
