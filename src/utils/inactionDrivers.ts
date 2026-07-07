// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sourced regulatory deadline (mandate) and penalty derivation for the Cost of
 * Inaction Analyzer — replaces the hand-invented per-industry hardDeadline /
 * regulatoryPenaltyUSD constants with figures traced to complianceData.ts
 * (framework requirements) and the timeline CSV (country deadlines), the same
 * sources Assess/Report/Timeline already treat as single-source-of-truth.
 */
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import {
  TIMELINE_COUNTRY_DEADLINE_BY_NAME,
  TIMELINE_COUNTRY_DEADLINE_MANDATE,
} from '@/data/timelineFacts.generated'
import { FRAMEWORK_PENALTY_BASELINES, DEFAULT_FRAMEWORK_PENALTY } from '@/data/roiBaselines'

export type InactionMandateType = 'HARD' | 'SOFT' | 'NONE'

export interface IndustryMandate {
  deadlineYear: number
  mandateType: InactionMandateType
  driverName: string
  driverSource: 'compliance-framework' | 'country-timeline' | 'planning-anchor'
}

export interface IndustryPenalty {
  /** Recurring annual statutory fine, if any qualifying framework has one. */
  annualFineUSD: number
  annualFineDriver: string | null
  /** One-time contract/certification loss from going out of compliance, if any. */
  cliffLossUSD: number
  cliffLossDriver: string | null
}

/**
 * NIST IR 8547 is still an initial public draft (csrc.nist.gov/pubs/ir/8547/ipd)
 * recommending deprecation by 2030 and disallowance by 2035 — a citable planning
 * anchor, not a binding mandate, used only when no framework or country deadline
 * applies to the selected industry.
 */
const NIST_IR_8547_DISALLOW_YEAR = 2035

/**
 * A handful of broad, cross-cutting standards (NIST IR 8547, FIPS 140-3,
 * CNSA 2.0, ASD ISM, UK NCSC PQC Guidance, ...) have NAICS 2-digit codes typed
 * into the CSV's `industries` text column instead of names (naicsCodes ends up
 * identical to industries for these rows) — a pre-existing data-entry
 * inconsistency, not something this module can fix. Matching only on
 * industries would silently drop exactly the frameworks with the most
 * citable, real deadlines, so naicsCodes is checked as a fallback via this
 * conservative code->industry map (only codes with a clean 1:1 fit).
 */
const NAICS_TO_INDUSTRY: Record<string, string[]> = {
  '92': ['Government & Defense'],
  '52': ['Finance & Banking'],
  '62': ['Healthcare'],
  '22': ['Energy & Utilities'],
  '61': ['Education'],
  '44': ['Retail & E-Commerce'],
  '51': ['Technology', 'Telecommunications'],
  '54': ['Technology'],
}

function frameworkAppliesToIndustry(f: ComplianceFramework, industry: string): boolean {
  const industryLc = industry.toLowerCase()
  if (f.industries.length === 0) return true
  if (f.industries.some((ind) => ind.toLowerCase().includes(industryLc))) return true
  return (f.naicsCodes ?? []).some((code) => NAICS_TO_INDUSTRY[code]?.includes(industry))
}

function frameworksForIndustry(industry: string): ComplianceFramework[] {
  return complianceFrameworks.filter((f) => frameworkAppliesToIndustry(f, industry))
}

const PLANNING_ANCHOR_FALLBACK: IndustryMandate = {
  deadlineYear: NIST_IR_8547_DISALLOW_YEAR,
  mandateType: 'NONE',
  driverName: 'NIST IR 8547 (draft) disallow-by guidance',
  driverSource: 'planning-anchor',
}

/**
 * Pick the earliest HARD candidate if any exist; else the earliest SOFT
 * candidate; else the planning-anchor fallback. Pure — no data lookups — so
 * the resolution rule can be tested independently of live CSV/timeline content.
 */
export function resolveMandate(candidates: IndustryMandate[]): IndustryMandate {
  const bySoonest = (a: IndustryMandate, b: IndustryMandate) => a.deadlineYear - b.deadlineYear
  const hard = candidates.filter((c) => c.mandateType === 'HARD').sort(bySoonest)
  if (hard.length > 0) return hard[0]

  const soft = candidates.filter((c) => c.mandateType === 'SOFT').sort(bySoonest)
  if (soft.length > 0) return soft[0]

  return PLANNING_ANCHOR_FALLBACK
}

/**
 * Resolve the industry's real regulatory deadline: the earliest HARD mandate
 * (a framework with pqcRequirement 'yes', or a country tagged HARD in the
 * timeline CSV) if one applies; else the earliest SOFT guidance/target; else a
 * labeled planning anchor (NIST IR 8547, explicitly marked draft/non-binding).
 */
export function deriveIndustryMandate(industry: string, country?: string): IndustryMandate {
  const candidates: IndustryMandate[] = []

  for (const f of frameworksForIndustry(industry)) {
    if (typeof f.deadlineYear !== 'number') continue
    if (f.pqcRequirement === 'yes') {
      candidates.push({
        deadlineYear: f.deadlineYear,
        mandateType: 'HARD',
        driverName: f.label,
        driverSource: 'compliance-framework',
      })
    } else if (
      f.pqcRequirement === 'guidance' ||
      f.pqcRequirement === 'expected' ||
      f.pqcRequirement === 'partial'
    ) {
      candidates.push({
        deadlineYear: f.deadlineYear,
        mandateType: 'SOFT',
        driverName: f.label,
        driverSource: 'compliance-framework',
      })
    }
  }

  if (country) {
    const year = TIMELINE_COUNTRY_DEADLINE_BY_NAME[country]
    const mandate = TIMELINE_COUNTRY_DEADLINE_MANDATE[country]
    if (typeof year === 'number' && (mandate === 'HARD' || mandate === 'SOFT')) {
      candidates.push({
        deadlineYear: year,
        mandateType: mandate,
        driverName: `${country} government PQC deadline`,
        driverSource: 'country-timeline',
      })
    }
  }

  return resolveMandate(candidates)
}

/**
 * Regulatory penalty exposure for an industry, split by mechanism: recurring
 * annual fines accrue every year spent unmigrated past the mandate; one-time
 * cliff losses (contract/certification revocation) hit once, the first year
 * past the mandate. Only frameworks with pqcRequirement 'yes' contribute —
 * guidance-level frameworks carry no priced penalty.
 */
export function deriveIndustryPenalty(industry: string): IndustryPenalty {
  let annualFineUSD = 0
  let annualFineDriver: string | null = null
  let cliffLossUSD = 0
  let cliffLossDriver: string | null = null

  for (const f of frameworksForIndustry(industry)) {
    if (f.pqcRequirement !== 'yes') continue
    const baseline = FRAMEWORK_PENALTY_BASELINES[f.label]
    const amount = baseline?.annualPenalty ?? DEFAULT_FRAMEWORK_PENALTY
    const penaltyType = baseline?.penaltyType ?? 'fine'
    if (penaltyType === 'fine') {
      if (amount > annualFineUSD) {
        annualFineUSD = amount
        annualFineDriver = f.label
      }
    } else if (amount > cliffLossUSD) {
      cliffLossUSD = amount
      cliffLossDriver = f.label
    }
  }

  return { annualFineUSD, annualFineDriver, cliffLossUSD, cliffLossDriver }
}
