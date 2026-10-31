// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Sources of figures for the board pack: one record per figure the pack exports,
 * saying what kind of figure it is and where it comes from.
 *
 * A figure a sponsor cannot trace is a figure they cannot defend. Every number,
 * date and ranked priority in the pack gets an id (C1, C2, …); the exported
 * files print that id next to the figure as "[Cn]", and `figure-sources.csv` /
 * `figure-sources.md` list the source, method, scope, as-of date and caveat for
 * each one.
 *
 * Kinds:
 * - fact            stated by a published source the ledger names
 * - estimate        computed or assumed here; a figure with no published source
 *                   is always an estimate and says so in its caveat
 * - scenario        depends on a planning assumption about the future (CRQC arrival)
 * - recommendation  a ranked action, not a measurement
 *
 * Pure data — reads only what the assessment result and the shipped catalog
 * data already hold. Nothing is hidden for lack of a source.
 */
import type { AssessmentResult, ComplianceImpact } from '@/hooks/assessmentTypes'
import type { CountryMilestone } from '@/components/Report/countryMilestone'
import { riskScoreWorking } from '@/components/Report/RiskScoreWorking'
import { Q_DAY_FRESHNESS } from '@/data/quantumTimeline'
import { generateCsv } from '@/utils/csvExport'
import {
  ASSUMED_COST_PER_PERSON_MONTH,
  ASSUMED_PARALLEL_WORKSTREAMS,
  SCOPE_BANDS_TEXT,
  computeProgramEffort,
  usd,
} from './programEffort'

export type ClaimKind = 'fact' | 'estimate' | 'scenario' | 'recommendation'

export interface FigureSource {
  id: string
  claim: string
  value: string
  kind: ClaimKind
  source?: { label: string; url?: string; ref?: string }
  method?: string
  scope?: string
  asOf?: string
  caveat?: string
}

export interface FigureSourcesInput {
  result: AssessmentResult
  profile: { industry: string; country: string; generatedAt: string }
  /** The country's next national milestone, when the pack states one. */
  countryMilestone?: CountryMilestone | null
}

/** Caveat carried by every figure that has no published source behind it. */
export const NO_PUBLISHED_SOURCE = 'no published source'

/**
 * Keys naming each figure the pack prints, so a file builder can look up the
 * id to print next to it. Compliance rows, priorities and key findings are
 * keyed by their index in the result.
 */
export type ClaimKey =
  | 'risk-score'
  | 'country-milestone'
  | 'crqc-horizon'
  | 'data-exposure-window'
  | 'credential-exposure-window'
  | 'narrative'
  | `priority-${number}`
  | `finding-${number}`
  | `compliance-${number}`
  | 'effort-person-months'
  | 'effort-calendar'
  | 'effort-cost'
  | 'effort-by-scope'
  | 'effort-assumptions'

export interface FigureSources {
  entries: FigureSource[]
  /** The id printed next to a figure, or undefined when the pack does not state it. */
  idOf: (key: ClaimKey) => string | undefined
}

const CATEGORY_WORDS: Record<string, string> = {
  immediate: 'immediate (do now)',
  'short-term': 'short-term (this quarter)',
  'long-term': 'long-term (plan it)',
}

const DEADLINE_KIND_WORDS: Record<string, string> = {
  fixed: 'a fixed date',
  phased: 'a phased date (several milestones; the last is when the move must be complete)',
  ongoing: 'an ongoing obligation with no end date',
  none: 'the source states no deadline',
  unknown: 'the date has not yet been read from the source',
}

function joinCaveats(...parts: Array<string | undefined>): string | undefined {
  const kept = parts.filter((p): p is string => Boolean(p))
  return kept.length > 0 ? kept.join('; ') : undefined
}

/** The quantum-threat planning year the pack's exposure windows are measured from. */
export function crqcHorizonYear(result: AssessmentResult): number | undefined {
  const w = result.hndlRiskWindow ?? result.tnflRiskWindow
  if (!w) return undefined
  return w.crqcEstimateYear ?? w.estimatedQuantumThreatYear
}

function riskScoreMethod(result: AssessmentResult, industry: string): string {
  if (result.preBoostScore === undefined) {
    if (!result.additiveScore)
      return 'Calculation breakdown was not stored with this saved result; contextual category scores do not reconstruct its headline.'
    const { rows, total } = result.additiveScore
    return `Quick-assessment additive points: ${rows.map((row) => `${row.label} ${row.points}`).join(' + ')} = ${total}; limited to 0–100 gives ${result.riskScore}. Contextual category scores are not the quick-assessment formula.`
  }
  const working = riskScoreWorking(result, industry)
  const boosts = (result.boosts ?? [])
    .map((b) => `${b.label} (+${Math.round(b.delta * 100)}%)`)
    .join(', ')
  const boostText = boosts ? `; then raised by situational boosts: ${boosts}` : ''
  if (!working) {
    return `Weighted composite of the assessment's category scores${boostText}. The category breakdown was not recorded for this report.`
  }
  const weights =
    working.weightSource === 'industry' ? `weights for ${industry}` : 'default weights'
  const rows = working.rows
    .map(
      (r) =>
        `${r.label} ${r.score}${r.note ? ' (as the gap 100 − readiness)' : ''} × ${r.weight} = ${r.contribution.toFixed(1)}`
    )
    .join('; ')
  return `Weighted composite of four category scores (${weights}): ${rows}; base ${working.base.toFixed(1)}${boostText}; held to 0–100.`
}

function complianceEntry(c: ComplianceImpact): Omit<FigureSource, 'id'> {
  const pqc = c.requiresPQC === null ? 'unknown' : c.requiresPQC ? 'yes' : 'no'
  const value = `Deadline: ${c.deadline}; PQC required: ${pqc}`
  const scope = c.bindingStatus
    ? `Binding status: ${c.bindingStatus}${c.bindingBasis ? ` (${c.bindingBasis})` : ''}`
    : 'Binding status: not yet classified'
  const kindWords = c.deadlineKind ? DEADLINE_KIND_WORDS[c.deadlineKind] : undefined
  const deadlineCaveat = kindWords ? `Deadline type: ${kindWords}` : undefined
  const claim = `${c.framework}: deadline and PQC requirement`
  if (c.website) {
    return {
      claim,
      value,
      kind: 'fact',
      source: { label: c.framework, url: c.website },
      method: "Read from the framework's catalog entry",
      scope,
      asOf: c.lastVerified,
      caveat: joinCaveats(
        deadlineCaveat,
        c.lastVerified ? undefined : 'date last checked against the source not recorded'
      ),
    }
  }
  return {
    claim,
    value,
    kind: 'estimate',
    method:
      c.requiresPQC === null
        ? 'Framework not in the catalog; deadline and requirement unknown'
        : "Read from the framework's catalog entry",
    scope,
    asOf: c.lastVerified,
    caveat: joinCaveats(NO_PUBLISHED_SOURCE, deadlineCaveat, 'verify against the regulator'),
  }
}

/**
 * Build the ledger for one board pack. Ids run C1..Cn in the order the figures
 * appear in the pack: executive summary, key findings, compliance deadlines,
 * program effort.
 */
export function buildFigureSourcesIndex(input: FigureSourcesInput): FigureSources {
  const { result, profile, countryMilestone } = input
  const entries: FigureSource[] = []
  const ids = new Map<string, string>()
  const add = (key: ClaimKey, entry: Omit<FigureSource, 'id'>) => {
    const id = `C${entries.length + 1}`
    entries.push({ id, ...entry })
    ids.set(key, id)
  }
  const reportDate = profile.generatedAt.slice(0, 10) || undefined

  // ── Executive summary ──────────────────────────────────────────────────
  add('risk-score', {
    claim: 'Educational PQC priority index',
    value: `${result.riskScore} / 100 (${result.riskLevel})`,
    kind: 'estimate',
    method: riskScoreMethod(result, profile.industry),
    scope: profile.industry ? `This organisation's answers (${profile.industry})` : undefined,
    asOf: reportDate,
    caveat: joinCaveats(NO_PUBLISHED_SOURCE, 'a model score from self-reported answers'),
  })

  if (countryMilestone) {
    const m = countryMilestone
    const claim = `${profile.country || 'Country'} next national milestone`
    const value = `${m.year}: ${m.title}`
    const scope = m.binding ? 'Binding mandate' : 'Published target (not binding)'
    add(
      'country-milestone',
      m.sourceUrl
        ? {
            claim,
            value,
            kind: 'fact',
            source: { label: `${profile.country} national timeline`, url: m.sourceUrl },
            scope,
            asOf: m.sourceDate,
          }
        : {
            claim,
            value,
            kind: 'estimate',
            scope,
            asOf: m.sourceDate,
            caveat: NO_PUBLISHED_SOURCE,
          }
    )
  }

  const horizon = crqcHorizonYear(result)
  if (horizon !== undefined) {
    add('crqc-horizon', {
      claim: 'Quantum-threat planning horizon (first cryptographically relevant quantum computer)',
      value: `~${horizon}`,
      kind: 'scenario',
      source: {
        label: 'Public CRQC arrival estimates, 2030–2040 range',
        url: Q_DAY_FRESHNESS.recheck,
      },
      method: 'A planning year inside the published research range, used to measure exposure',
      asOf: Q_DAY_FRESHNESS.asOf,
      caveat: 'nobody knows when such a machine will exist; treat as a planning assumption',
    })
  }

  const hndl = result.hndlRiskWindow
  if (hndl?.isAtRisk) {
    add('data-exposure-window', {
      claim: 'Data exposure window (harvest now, decrypt later)',
      value: `${hndl.riskWindowYears} years beyond ${hndl.estimatedQuantumThreatYear}`,
      kind: 'scenario',
      method: `Data retention (${hndl.dataRetentionYears} years from ${hndl.currentYear}) minus the years left before the act-by year`,
      caveat: joinCaveats(
        'depends on the quantum-threat planning horizon',
        hndl.isEstimated ? 'retention period is a default because none was given' : undefined
      ),
    })
  }

  const tnfl = result.tnflRiskWindow
  if (tnfl?.isAtRisk) {
    add('credential-exposure-window', {
      claim: 'Credential exposure window (harvest now, forge later)',
      value: `${tnfl.riskWindowYears} years beyond ${tnfl.estimatedQuantumThreatYear}`,
      kind: 'scenario',
      method: `Signing credential lifetime (${tnfl.credentialLifetimeYears} years from ${tnfl.currentYear}) minus the years left before the act-by year`,
      caveat: 'depends on the quantum-threat planning horizon',
    })
  }

  const narrative = (
    result.personaNarrative ||
    result.executiveSummary ||
    result.narrative ||
    ''
  ).trim()
  if (narrative) {
    add('narrative', {
      claim: 'Narrative summary',
      value: 'Restates figures from this assessment',
      kind: 'estimate',
      method:
        'Written from the same answers as the educational priority index; its counts are self-reported and its years are the disclosed planning anchor and selected-source dates',
      asOf: reportDate,
      caveat: NO_PUBLISHED_SOURCE,
    })
  }

  result.recommendedActions.slice(0, 3).forEach((a, i) => {
    add(`priority-${i}`, {
      claim: `Priority ${a.priority}: ${a.action}`,
      value: `${CATEGORY_WORDS[a.category] ?? a.category}${a.effort ? `, effort ${a.effort}` : ''}`,
      kind: 'recommendation',
      method: 'Ranked by the assessment from the answers given and the gaps they show',
    })
  })

  // ── Key findings ───────────────────────────────────────────────────────
  ;(result.keyFindings ?? []).forEach((f, i) => {
    add(`finding-${i}`, {
      claim: `Key finding ${i + 1}`,
      value: f,
      kind: 'estimate',
      method: 'Drawn from the answers given; any time window is measured from the planning horizon',
      asOf: reportDate,
      caveat: NO_PUBLISHED_SOURCE,
    })
  })

  // ── Compliance deadlines ───────────────────────────────────────────────
  result.complianceImpacts.forEach((c, i) => add(`compliance-${i}`, complianceEntry(c)))

  // ── Program effort ─────────────────────────────────────────────────────
  const effort = computeProgramEffort(result)
  if (effort) {
    const caveat = joinCaveats(NO_PUBLISHED_SOURCE, 'illustrative, not a quote')
    const rate = usd(ASSUMED_COST_PER_PERSON_MONTH)
    add('effort-person-months', {
      claim: 'Program effort',
      value: `~${effort.pmLow}–${effort.pmHigh} person-months across ${effort.migrations} algorithm migration(s)`,
      kind: 'estimate',
      method: `Sum of person-month bands per migration scope: ${SCOPE_BANDS_TEXT}`,
      caveat,
    })
    add('effort-calendar', {
      claim: 'Program calendar time',
      value: `~${effort.calLow}–${effort.calHigh} months`,
      kind: 'estimate',
      method: `Person-month band divided by ${ASSUMED_PARALLEL_WORKSTREAMS} parallel workstreams, rounded up, at least one month`,
      caveat,
    })
    add('effort-cost', {
      claim: 'Indicative program cost',
      value: `~${usd(effort.costLow)}–${usd(effort.costHigh)}`,
      kind: 'estimate',
      method: `Person-month band × ${rate} per person-month (blended, fully loaded)`,
      caveat: joinCaveats(caveat, 'replace the rate with your own'),
    })
    add('effort-by-scope', {
      claim: 'Person-months by migration scope',
      value: effort.byScope
        .map((r) => `${r.label}: ${r.count} algorithm(s), ${r.pmLow}–${r.pmHigh}`)
        .join('; '),
      kind: 'estimate',
      method: `Count of migrations per scope × that scope's band: ${SCOPE_BANDS_TEXT}`,
      caveat,
    })
    add('effort-assumptions', {
      claim: 'Program effort planning assumptions',
      value: `Bands ${SCOPE_BANDS_TEXT}; ${rate} per person-month; ${ASSUMED_PARALLEL_WORKSTREAMS} parallel workstreams`,
      kind: 'estimate',
      method: 'Illustrative planning assumptions chosen for this pack',
      caveat: joinCaveats(NO_PUBLISHED_SOURCE, 'replace with your own figures'),
    })
  }

  return { entries, idOf: (key) => ids.get(key) }
}

/** The ledger entries C1..Cn for one board pack. */
export function buildFigureSources(input: FigureSourcesInput): FigureSource[] {
  return buildFigureSourcesIndex(input).entries
}

/** "[C3]" for a figure the ledger lists, "" otherwise. */
export function claimMarker(id: string | undefined): string {
  return id ? ` [${id}]` : ''
}

/** figure-sources.csv — one row per entry, RFC 4180 quoting. */
export function figureSourcesCsv(entries: FigureSource[]): string {
  return (
    generateCsv(entries, [
      { header: 'id', accessor: (e) => e.id },
      { header: 'claim', accessor: (e) => e.claim },
      { header: 'value', accessor: (e) => e.value },
      { header: 'kind', accessor: (e) => e.kind },
      { header: 'source', accessor: (e) => e.source?.label },
      { header: 'url', accessor: (e) => e.source?.url },
      { header: 'ref', accessor: (e) => e.source?.ref },
      { header: 'method', accessor: (e) => e.method },
      { header: 'scope', accessor: (e) => e.scope },
      { header: 'as_of', accessor: (e) => e.asOf },
      { header: 'caveat', accessor: (e) => e.caveat },
    ]) + '\n'
  )
}

function mdCell(value: string | undefined): string {
  return (value ?? '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

/** figure-sources.md — a short introduction and the ledger as a table. */
export function figureSourcesMarkdown(entries: FigureSource[]): string {
  const lines = [
    '# Sources of the figures in this pack',
    '',
    'Every figure in this pack is marked with an id such as [C1]. This table says what kind of figure each one is (fact, estimate, scenario or recommendation), where it comes from, and what to bear in mind before quoting it. A figure with no published source is listed as an estimate and says so.',
    '',
    '| Id | Claim | Value | Kind | Source | Method | Scope | As of | Caveat |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ]
  for (const e of entries) {
    const source = e.source
      ? e.source.url
        ? `[${mdCell(e.source.label)}](${e.source.url.replace(/\)/g, '%29').replace(/ /g, '%20')})`
        : mdCell(e.source.label)
      : ''
    lines.push(
      `| ${e.id} | ${mdCell(e.claim)} | ${mdCell(e.value)} | ${e.kind} | ${source} | ${mdCell(e.method)} | ${mdCell(e.scope)} | ${mdCell(e.asOf)} | ${mdCell(e.caveat)} |`
    )
  }
  lines.push('')
  return lines.join('\n')
}
