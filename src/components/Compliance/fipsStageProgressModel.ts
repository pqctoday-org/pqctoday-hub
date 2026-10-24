// SPDX-License-Identifier: AGPL-3.0-only
/**
 * PQC progress along the FIPS 140-3 track, month by month (Product Records tab).
 *
 * The track has four stages (user decision, 2026-09-26):
 *   none         no PQC validation yet
 *   cavp         the PQC algorithms are CAVP-validated — the PREREQUISITE for
 *                FIPS 140-3, not a certificate
 *   in_progress  NIST lists the module as Modules In Process or Implementation
 *                Under Test — never inferred from CAVP
 *   certified    a certificate covers PQC
 *
 * Two views, because they answer different questions:
 *   products   — how many of OUR catalogue products sit at each stage each
 *                month, dated from each product's own evidence. A state count:
 *                a product moves up a band when it reaches the next stage.
 *   listings   — how many NIST LISTINGS appeared at each stage each month,
 *                industry-wide. An event count: it needs no linking of a CAVP
 *                record, an IUT entry and a certificate to one module — that
 *                name matching is exactly where false links come from.
 *
 * `referenceDate` is injected rather than read from the clock, as in
 * pqcCertificationTrendModel.ts, so ranges are deterministic for tests.
 */
import type { ComplianceRecord } from './types'
import type { CertificationXref, SoftwareItem } from '@/types/MigrateTypes'
import { isConfirmedPqcAlgorithm } from './pqcCertificationTrendModel'

export type FipsStage = 'none' | 'cavp' | 'in_progress' | 'certified'
export const FIPS_STAGES: readonly FipsStage[] = ['none', 'cavp', 'in_progress', 'certified']
const RANK: Record<FipsStage, number> = { none: 0, cavp: 1, in_progress: 2, certified: 3 }

/** The FIPS 140-3 track, in order (user decision, 2026-09-26). CAVP is the
 *  prerequisite, not a certificate; "in progress" only when NIST lists the
 *  module (Modules In Process / Implementation Under Test). Shared by the
 *  desktop chart's legend and the phone's one-line summary so the two can
 *  never name a stage differently. */
export const FIPS_STAGE_LABEL: Record<'products' | 'listings', Record<FipsStage, string>> = {
  products: {
    none: 'No PQC validation yet',
    cavp: 'Prerequisite met (CAVP)',
    in_progress: 'In progress (NIST IUT / MIP)',
    certified: 'Certified',
  },
  listings: {
    none: 'FIPS 140-3 certificate, no PQC',
    cavp: 'PQC CAVP validation',
    in_progress: 'IUT / MIP listing',
    certified: 'FIPS 140-3 certificate with PQC',
  },
}

export interface StagePoint {
  month: string // 'YYYY-MM'
  none: number
  cavp: number
  in_progress: number
  certified: number
}

/** One NIST in-process entry (public/data/fips-in-process.json). */
export interface InProcessEntry {
  module: string
  vendor: string
  standard: string
  /** MIP only — the CURRENT review stage and the date NIST gives for it. */
  stage?: string
  stageDate?: string | null
  /** IUT only — the date the module entered Implementation Under Test. */
  iutDate?: string | null
  firstSeen?: string
  leftListOn?: string
}

export interface InProcessData {
  mip: InProcessEntry[]
  iut: InProcessEntry[]
}

/** A catalogue product NIST lists (public/data/fips-in-process-matches.json). */
export interface InProcessMatch {
  product_id: string
  list: 'MIP' | 'IUT'
  module: string
  date: string | null
  firstSeen?: string | null
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
}

function monthsBetween(startMonth: string, referenceDate: Date): string[] {
  const end = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}`
  const out: string[] = []
  for (let ym = startMonth; ym <= end; ym = nextMonth(ym)) out.push(ym)
  return out
}

function earliest(dates: (string | null | undefined)[]): string | null {
  const ok = dates.filter((d): d is string => !!d && /^\d{4}-\d{2}/.test(d)).sort()
  return ok[0] ?? null
}

/** The stage a catalogue product's `pqcCertified` verdict names. */
export function currentStage(pqcCertified: SoftwareItem['pqcCertified']): FipsStage {
  if (pqcCertified === 'yes') return 'certified'
  if (pqcCertified === 'in_progress') return 'in_progress'
  if (pqcCertified === 'cavp') return 'cavp'
  return 'none'
}

/** Products that ship PQC — the universe for the products view. A product that
 *  does not ship PQC cannot be on a PQC validation track at all; measured
 *  2026-09-26, none of them holds a PQC validation. */
export function shipsPqc(p: SoftwareItem): boolean {
  return p.pqcStatusCanonical === 'available' || p.pqcStatusCanonical === 'partial'
}

export interface ProductStageTimeline {
  points: StagePoint[]
  /** Products whose CURRENT stage has no date in our data — they are drawn at
   *  the highest stage we CAN date, and counted here so the gap is visible. */
  undated: number
  universe: number
}

/**
 * Monthly count of catalogue products at each stage. For each product the
 * stage in a month is the highest stage, up to its current verdict, whose
 * evidence is dated on or before that month's end:
 *   cavp        earliest PQC CAVP validation linked to it
 *   in_progress earliest NIST listing matched to it (IUT date; for MIP, the
 *               earlier of NIST's stage date and our first sighting)
 *   certified   earliest non-CAVP certificate covering PQC linked to it
 */
export function buildProductStageTimeline(
  products: SoftwareItem[],
  certsByProduct: Map<string, CertificationXref[]>,
  matches: InProcessMatch[],
  referenceDate: Date,
  startMonth = '2024-01'
): ProductStageTimeline {
  const months = monthsBetween(startMonth, referenceDate)
  const points: StagePoint[] = months.map((month) => ({
    month,
    none: 0,
    cavp: 0,
    in_progress: 0,
    certified: 0,
  }))
  const matchesBy = new Map<string, InProcessMatch[]>()
  for (const m of matches) matchesBy.set(m.product_id, [...(matchesBy.get(m.product_id) ?? []), m])

  const universe = products.filter(shipsPqc)
  let undated = 0
  for (const p of universe) {
    const target = currentStage(p.pqcCertified)
    // productId first — the identity that survives a rename — then the name,
    // as certificationXrefData.ts documents for legacy rows.
    const certs = certsByProduct.get(p.productId) ?? certsByProduct.get(p.softwareName) ?? []
    // A classical-only certificate is a real certificate but never PQC progress.
    const pqcCerts = certs.filter(
      (c) => !c.classicalOnly && isConfirmedPqcAlgorithm(c.pqcAlgorithms)
    )
    const dates: Partial<Record<FipsStage, string | null>> = {
      cavp: earliest(pqcCerts.filter((c) => c.certType === 'ACVP').map((c) => c.certDate)),
      in_progress: earliest(
        (matchesBy.get(p.productId) ?? []).map((m) =>
          m.list === 'MIP' ? earliest([m.date, m.firstSeen]) : m.date
        )
      ),
      certified: earliest(
        pqcCerts.filter((c) => c.certType === 'FIPS 140-3').map((c) => c.certDate)
      ),
    }
    if (target !== 'none' && !dates[target]) undated += 1
    for (const pt of points) {
      const monthEnd = `${pt.month}-31`
      let stage: FipsStage = 'none'
      for (const s of FIPS_STAGES) {
        if (RANK[s] > RANK[target] || s === 'none') continue
        const d = dates[s]
        if (d && d <= monthEnd && RANK[s] > RANK[stage]) stage = s
      }
      pt[stage] += 1
    }
  }
  return { points, undated, universe: universe.length }
}

/**
 * One line for the phone: the Products view's latest month — the counts the
 * desktop chart prints beside its legend — as "FIPS 140-3 track: prerequisite
 * met (CAVP) 61 · in progress (NIST IUT / MIP) 5 · certified 20." The stage
 * names are the chart's own (`FIPS_STAGE_LABEL.products`); 'none' is left out
 * (it is the ~89% not yet on the track). Null when the timeline has no month.
 */
export function fipsTrackLine(timeline: ProductStageTimeline | null): string | null {
  const latest = timeline?.points[timeline.points.length - 1]
  if (!latest) return null
  const label = FIPS_STAGE_LABEL.products
  const part = (name: string, count: number) =>
    `${name.charAt(0).toLowerCase()}${name.slice(1)} ${count.toLocaleString()}`
  return `FIPS 140-3 track: ${[
    part(label.cavp, latest.cavp),
    part(label.in_progress, latest.in_progress),
    part(label.certified, latest.certified),
  ].join(' · ')}.`
}

export interface ListingStageTrend {
  points: StagePoint[]
  /** NIST withholds some Modules In Process entries by vendor request. */
  inProcessNotDisplayed: number | null
}

/**
 * Monthly count of NIST LISTINGS at each stage, industry-wide:
 *   none        FIPS 140-3 certificates that cover no PQC
 *   cavp        CAVP validations covering PQC
 *   in_progress IUT entries by IUT date, and Modules In Process entries by the
 *               date of their CURRENT stage (NIST publishes no entry date)
 *   certified   FIPS 140-3 certificates covering PQC
 * CC / EUCC / CSPN are left out: the stages are the FIPS 140-3 track.
 */
export function buildListingStageTrend(
  records: ComplianceRecord[],
  inProcess: InProcessData | null,
  referenceDate: Date,
  startMonth = '2024-01',
  inProcessNotDisplayed: number | null = null
): ListingStageTrend {
  const points = new Map<string, StagePoint>(
    monthsBetween(startMonth, referenceDate).map((month) => [
      month,
      { month, none: 0, cavp: 0, in_progress: 0, certified: 0 },
    ])
  )
  const bump = (date: string | null | undefined, stage: FipsStage) => {
    if (!date) return
    const pt = points.get(date.slice(0, 7))
    if (pt) pt[stage] += 1
  }
  for (const r of records) {
    const pqc = isConfirmedPqcAlgorithm(r.pqcCoverage)
    if (r.type === 'ACVP') {
      if (pqc) bump(r.date, 'cavp')
    } else if (r.type === 'FIPS 140-3') {
      bump(r.date, pqc ? 'certified' : 'none')
    }
  }
  for (const e of inProcess?.iut ?? []) bump(e.iutDate, 'in_progress')
  for (const e of inProcess?.mip ?? []) bump(e.stageDate, 'in_progress')
  return { points: [...points.values()], inProcessNotDisplayed }
}
