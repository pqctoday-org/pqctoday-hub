// SPDX-License-Identifier: AGPL-3.0-only
//
// Which sections the report's table of contents lists.
//
// The contents list must name only sections that are actually on the page, so it
// follows the same conditions ReportContent renders under: the persona's
// summary/full view, the `?phase=` filter, whether the result carries what a
// section needs, and whether the view is a shared snapshot. Each entry whose
// section would render nothing is dropped, so a link never points at a missing
// anchor. ReportContent.toc.test.tsx renders the page and checks the two agree.
import { getReportSectionConfig, type ReportSectionId } from '../../data/personaConfig'
import {
  REPORT_SECTION_ORDER,
  REPORT_SECTION_LABELS,
  REPORT_SECTION_TO_CSWP39,
} from '../../data/reportSectionToCswp39'
import type { PhaseId } from '../../data/frameworkPhases'
import type { PersonaId } from '../../data/learningPersonas'
import type { AssessmentResult } from '../../hooks/assessmentTypes'

export interface TocEntry {
  id: string
  label: string
}

interface TocExtra extends TocEntry {
  /** QRA and the NICE gap report both key off `getInput()` — the RECIPIENT's
   *  own live assessment input — so ReportContent skips rendering them
   *  entirely on a shared/example view (see the `shared` guards there) to
   *  avoid mixing the sender's result with the recipient's own inputs.
   *  Their TOC entries must be dropped too, or they'd point at an anchor
   *  that was never rendered. */
  hideWhenShared?: boolean
  /** The `?phase=` value that keeps this section on the page; absent = never phase-filtered. */
  phase?: PhaseId
}

/**
 * Sections that render outside the persona-config-gated REPORT_SECTION_ORDER
 * list (QRA, ROI, KPI trending, NICE workforce gap) — they render
 * unconditionally, not through `getReportSectionConfig`, so they were
 * previously unreachable from the TOC entirely. Each entry names the
 * REPORT_SECTION_ORDER id it renders immediately after, in true page order.
 *
 * ACCURACY-0708-2: these entries used to only appear in the TOC when their
 * anchor id's own base entry survived the persona hidden-state filter (e.g.
 * the ROI/KPI-trending entries were nested under `vendorRisk`) — but the
 * sections they name render unconditionally regardless of that anchor's
 * visibility, so they are appended independently of the anchor's own filtered
 * visibility.
 */
const EXTRA_TOC_AFTER: Partial<Record<ReportSectionId, TocExtra[]>> = {
  riskScore: [
    {
      id: 'report-section-qra',
      label: 'Quantum Readiness Assessment',
      hideWhenShared: true,
      phase: 'p3',
    },
  ],
  vendorRisk: [
    { id: 'report-section-roiCalculator', label: 'ROI & Financial Case' },
    { id: 'report-section-kpiTrending', label: 'Progress Over Time' },
  ],
}

/** Renders after every other section (including threatLandscape). */
const TOC_TRAILING: TocExtra[] = [
  { id: 'report-section-niceGap', label: 'NICE Workforce Gap Report', hideWhenShared: true },
]

export interface TocContext {
  result: AssessmentResult
  persona: PersonaId | null
  /** The reader switched the summary view to the full technical report. */
  showFullReport: boolean
  /** The `?phase=` filter, null when none is active. */
  activePhase: PhaseId | null
  /** A shared or example view (someone else's read-only snapshot). */
  shared: boolean
  /** The reader's own live answers exist (QRA and the NICE gap report read them). */
  hasOwnInput: boolean
}

function matchesPhase(activePhase: PhaseId | null, tag: PhaseId | PhaseId[]): boolean {
  if (activePhase === null) return true
  return Array.isArray(tag) ? tag.includes(activePhase) : tag === activePhase
}

/** Whether a REPORT_SECTION_ORDER section puts anything on the page for this result. */
function rendersBaseSection(id: ReportSectionId, ctx: TocContext): boolean {
  const { result } = ctx
  // eslint-disable-next-line security/detect-object-injection -- id is a ReportSectionId
  if (!matchesPhase(ctx.activePhase, REPORT_SECTION_TO_CSWP39[id].frameworkPhase)) return false
  // The risk score and the breakdown render for every role (the breakdown shows a
  // locked preview on a fast report); the role config only gates the other sections.
  const roleGated = id !== 'riskScore' && id !== 'riskBreakdown'
  if (roleGated && getReportSectionConfig(ctx.persona, id, ctx.showFullReport).state === 'hidden')
    return false
  switch (id) {
    case 'keyFindings':
      return (result.keyFindings?.length ?? 0) > 0
    case 'executiveSummary':
      return !!result.executiveSummary
    case 'assessmentProfile':
    case 'discovery':
    case 'vendorRisk':
      return !!result.assessmentProfile
    case 'hndlHnfl':
      return !!(result.hndlRiskWindow || result.tnflRiskWindow)
    case 'algorithmMigration':
      return result.algorithmMigrations.length > 0
    case 'complianceImpact':
      return result.complianceImpacts.length > 0 || (result.omittedCompliance?.length ?? 0) > 0
    default:
      return true
  }
}

function rendersExtra(extra: TocExtra, ctx: TocContext): boolean {
  if (extra.hideWhenShared && ctx.shared) return false
  if (extra.phase && !matchesPhase(ctx.activePhase, extra.phase)) return false
  // QRA and the NICE gap report need the reader's own live input.
  if (
    (extra.id === 'report-section-qra' || extra.id === 'report-section-niceGap') &&
    !ctx.hasOwnInput
  )
    return false
  return true
}

export function buildReportToc(ctx: TocContext): TocEntry[] {
  const entries: TocEntry[] = []
  for (const id of REPORT_SECTION_ORDER) {
    if (rendersBaseSection(id, ctx)) {
      // eslint-disable-next-line security/detect-object-injection -- id is a ReportSectionId
      entries.push({ id: `report-section-${id}`, label: REPORT_SECTION_LABELS[id] })
    }
    // eslint-disable-next-line security/detect-object-injection
    for (const extra of EXTRA_TOC_AFTER[id] ?? []) {
      if (rendersExtra(extra, ctx)) entries.push({ id: extra.id, label: extra.label })
    }
  }
  for (const extra of TOC_TRAILING) {
    if (rendersExtra(extra, ctx)) entries.push({ id: extra.id, label: extra.label })
  }
  return entries
}
