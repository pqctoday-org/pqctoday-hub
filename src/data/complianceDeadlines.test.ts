// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guards for the WP-1.2 structured-deadline migration (2026-07-31).
 *
 * Pins the two defects it fixed:
 *   1. 66% of active rows produced no year from their prose deadline, landed in
 *      one "Ongoing / no year" bucket, and were absent from the timeline. That
 *      bucket conflated "genuinely open-ended" with "nobody read the source".
 *   2. Phased frameworks collapsed to their earliest date, so filtering
 *      "Long-term" could never surface NIST IR 8547's 2035 disallow date.
 */
import { describe, it, expect } from 'vitest'
import { complianceFrameworks, deadlinePhasesFor } from './complianceData'

const byId = (id: string) => complianceFrameworks.find((f) => f.id === id)

describe('structured deadlines', () => {
  it('every active framework declares a deadline_kind', () => {
    const missing = complianceFrameworks.filter((f) => !f.deadlineKind)
    expect(missing.map((f) => f.id)).toEqual([])
  })

  it('separates genuinely-ongoing from nobody-has-read-this', () => {
    // The whole point of the column. If `unknown` ever silently absorbs the
    // `none`/`ongoing` rows again, the count of real gaps becomes unknowable.
    const kinds = new Set(complianceFrameworks.map((f) => f.deadlineKind))
    expect(kinds).toContain('ongoing')
    expect(kinds).toContain('none')
    // `unknown` is the honest "needs a human" bucket and should stay small.
    const unknown = complianceFrameworks.filter((f) => f.deadlineKind === 'unknown')
    expect(unknown.length).toBeLessThan(10)
  })

  it('keeps EVERY date on a phased framework, not just the earliest', () => {
    const ir8547 = byId('NIST-IR-8547')
    expect(ir8547).toBeDefined()
    const years = (ir8547!.deadlineDates ?? []).map((d) => d.year)
    // "2030 (deprecate), 2035 (disallow)" — the 2035 date used to be unreachable.
    expect(years).toContain(2030)
    expect(years).toContain(2035)
    expect(ir8547!.deadlineKind).toBe('phased')
  })

  it('makes a phased framework reachable from every bucket it belongs to', () => {
    const ir8547 = byId('NIST-IR-8547')!
    const phases = deadlinePhasesFor(ir8547)
    // Two distinct milestone years must yield more than one selectable phase.
    expect(phases.length).toBeGreaterThan(1)
  })

  it('does not turn a provenance year into a deadline', () => {
    // "Ongoing (2023 guidance)" states when the guidance was published, not a
    // deadline. Treating it as one would plant false dots on the timeline.
    const cryptrec = byId('CRYPTREC')
    if (cryptrec) {
      expect(cryptrec.deadlineKind).toBe('ongoing')
      expect(cryptrec.deadlineDates ?? []).toEqual([])
    }
  })

  it('keeps a real commencement date on an in-force regulation', () => {
    // "In force 2026-01-15" is a genuine date the source stated; the obligation
    // is still open-ended, so the kind stays `ongoing` while the date survives.
    const inForce = complianceFrameworks.filter(
      (f) => f.deadlineKind === 'ongoing' && (f.deadlineDates ?? []).length > 0
    )
    for (const fw of inForce) {
      expect(fw.deadlineDates![0].label).toBe('in force')
    }
  })

  it('every parsed deadline year is plausible', () => {
    for (const fw of complianceFrameworks) {
      for (const d of fw.deadlineDates ?? []) {
        expect(Number.isInteger(d.year)).toBe(true)
        expect(d.year).toBeGreaterThanOrEqual(2000)
        expect(d.year).toBeLessThanOrEqual(2100)
      }
    }
  })
})

describe('deadline date ordering', () => {
  it('stores every date sorted earliest → latest', () => {
    // Consumers index deadlineDates[0] as the start and the last entry as the
    // finish, so the ordering is an invariant, not a formatting nicety.
    for (const fw of complianceFrameworks) {
      const years = (fw.deadlineDates ?? []).map((d) => d.year)
      expect(years, `${fw.id} deadline dates out of order`).toEqual(
        [...years].sort((a, b) => a - b)
      )
    }
  })

  it('exposes start and finish as the two ends of that list', () => {
    for (const fw of complianceFrameworks) {
      const years = (fw.deadlineDates ?? []).map((d) => d.year)
      if (years.length === 0) {
        expect(fw.deadlineEnd).toBeUndefined()
        continue
      }
      expect(fw.deadlineStart).toBe(years[0])
      expect(fw.deadlineEnd).toBe(years[years.length - 1])
    }
  })

  it('gives a phased framework a finish LATER than its start', () => {
    const phased = complianceFrameworks.filter((f) => f.deadlineKind === 'phased')
    expect(phased.length).toBeGreaterThan(0)
    for (const fw of phased) {
      expect(fw.deadlineEnd!, `${fw.id}`).toBeGreaterThan(fw.deadlineStart!)
    }
  })

  it('surfaces the binding completion date for NIST IR 8547', () => {
    // The audit's example: 2030 deprecate, 2035 disallow. An organisation with
    // a long retention horizon is bound by the finish date, which the data
    // could not express at all before WP-1.2.
    const ir = complianceFrameworks.find((f) => f.id === 'NIST-IR-8547')!
    expect(ir.deadlineStart).toBe(2030)
    expect(ir.deadlineEnd).toBe(2035)
  })
})

describe('start vs finish are different questions', () => {
  it('ordering by finish differs from ordering by start', () => {
    // If these ever coincide the second sort option is dead weight; today 19
    // phased rows guarantee they do not.
    const dated = complianceFrameworks.filter((f) => f.deadlineStart && f.deadlineEnd)
    const byStart = [...dated].sort((a, b) => a.deadlineStart! - b.deadlineStart!).map((f) => f.id)
    const byFinish = [...dated].sort((a, b) => a.deadlineEnd! - b.deadlineEnd!).map((f) => f.id)
    expect(byStart).not.toEqual(byFinish)
  })

  it('a framework can start earlier but finish later than another', () => {
    // The case that makes "must finish first" worth offering: sorting by start
    // puts the wrong row first for someone asking "what must I complete soonest".
    const dated = complianceFrameworks.filter((f) => f.deadlineStart && f.deadlineEnd)
    const inverted = dated.some((a) =>
      dated.some((b) => a.deadlineStart! < b.deadlineStart! && a.deadlineEnd! > b.deadlineEnd!)
    )
    expect(inverted).toBe(true)
  })
})
