// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Board Pack ZIP builder (P15-P1-03).
 *
 * Bundles the assessment result + a curated profile snapshot into a
 * downloadable ZIP an executive can drop into a board pack without
 * touching the in-app report. Produces:
 *
 *   board-pack/
 *     README.md                 — what's inside, how to use
 *     executive-summary.md      — riskScore + level + narrative + top-3 actions
 *     key-findings.md           — full key findings list
 *     recommended-actions.md    — every recommendation by priority + category
 *     compliance-deadlines.csv  — per-framework deadlines + PQC requirement
 *     profile.json              — assessment inputs (machine-readable replay)
 *     program-effort.md         — illustrative effort/timeline/cost rollup (override)
 *     figure-sources.csv / .md    — source, kind and caveat of every figure, by [Cn] id
 *
 * Pure data builder — no React, no DOM. Returns a Blob ready for download.
 */
import { buildZipBundle, downloadBlob, type BundleFile } from './exportBundle'
import {
  EDUCATION_NOTICE,
  withEducationNoticeCsv,
  withEducationNoticeMarkdown,
} from '@/data/educationNotice'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import { applicableFrameworks, TIER_ORDER, type UserProfile } from '@/utils/applicabilityEngine'
import {
  findCountryNextMilestone,
  type CountryMilestone,
} from '@/components/Report/countryMilestone'
import {
  buildFigureSourcesIndex,
  figureSourcesCsv,
  figureSourcesMarkdown,
  claimMarker,
  type FigureSources,
} from './figureSources'
import {
  ASSUMED_COST_PER_PERSON_MONTH,
  ASSUMED_PARALLEL_WORKSTREAMS,
  SCOPE_BANDS_TEXT,
  computeProgramEffort,
  usd,
} from './programEffort'

export interface BoardPackProfile {
  industry: string
  country: string
  region?: string
  generatedAt: string
  persona?: string | null
  /** Explicitly distinguish a fictional worked example from self-reported inputs. */
  sample?: boolean
  /** Program-level accountability (useReportOwnershipStore) — optional,
   *  since a user may not have filled these in yet. */
  programOwner?: string
  budgetOwner?: string
  accountableExecutive?: string
}

export interface BuildBoardPackInput {
  result: AssessmentResult
  profile: BoardPackProfile
  /** Optional UTM-style tag echoed into the README footer. */
  appVersion?: string
}

const CATEGORY_LABEL: Record<string, string> = {
  immediate: 'Immediate · do now',
  'short-term': 'Short-term · this quarter',
  'long-term': 'Long-term · plan it',
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function buildReadme(profile: BoardPackProfile, appVersion?: string): string {
  const parts = [
    '# PQC Board Pack',
    '',
    `Generated ${profile.generatedAt} from the PQC Today Risk Assessment.`,
    profile.sample
      ? "Fictional worked example — this pack does not describe the viewer's organization."
      : 'Planning inputs are self-reported and are not independently verified.',
    '',
    "## What's inside",
    '',
    'This is an assessment report pack. Saved programme charters, board proposals and delivery roadmaps are separate Command Center documents; review and export them individually for a programme funding submission.',
    '',
    '- `executive-summary.md` — educational priority index, model band, and top-3 prompts in one page.',
    '- `key-findings.md` — the 3-5 most material insights from the assessment.',
    '- `recommended-actions.md` — every recommendation grouped by category and priority.',
    '- `compliance-deadlines.csv` — selected/profile-filtered sources, recorded target text, and PQC-required flag; applicability is not established.',
    '- `profile.json` — the answers that produced this report, in machine-readable form.',
    '- `program-effort.md` — an illustrative effort, calendar and cost range (not a quote).',
    '- `figure-sources.csv` and `figure-sources.md` — every figure in this pack, by its [C1], [C2] … marker: whether it is a fact, an estimate, a scenario or a recommendation, its source, how it was worked out, its date, and what to bear in mind before quoting it.',
    '',
    '## How to use',
    '',
    'Review and replace assumptions before adapting these educational files for internal discussion. The CSV opens in Excel; the markdown files render in common document tools. Do not present the pack as an audit, compliance decision, certification result, or approved business case.',
    '',
    '## Profile',
    '',
    `- **Industry:** ${profile.industry || 'unspecified'}`,
    `- **Country:** ${profile.country || 'unspecified'}`,
    profile.region ? `- **Region:** ${profile.region}` : '',
    profile.persona ? `- **Active persona:** ${profile.persona}` : '',
    profile.programOwner ? `- **Program Owner:** ${profile.programOwner}` : '',
    profile.budgetOwner ? `- **Budget Owner:** ${profile.budgetOwner}` : '',
    profile.accountableExecutive
      ? `- **Accountable Executive:** ${profile.accountableExecutive}`
      : '',
    '',
  ].filter(Boolean)
  if (appVersion) {
    parts.push('---', '', `Generated by pqctoday.org · ${appVersion}`)
  }
  return parts.join('\n')
}

function buildExecutiveSummary(
  result: AssessmentResult,
  profile: BoardPackProfile,
  ledger: FigureSources,
  milestone: CountryMilestone | null
): string {
  const top3 = result.recommendedActions.slice(0, 3)
  const mark = (key: Parameters<FigureSources['idOf']>[0]) => claimMarker(ledger.idOf(key))
  const narrative = (
    result.personaNarrative ||
    result.executiveSummary ||
    result.narrative ||
    ''
  ).trim()
  const dates: string[] = []
  if (milestone) {
    dates.push(
      `- **Next national milestone (${profile.country}):** ${milestone.year} — ${milestone.title} (${milestone.binding ? 'binding mandate' : 'published target'})${mark('country-milestone')}`
    )
  }
  const hndl = result.hndlRiskWindow
  const tnfl = result.tnflRiskWindow
  const horizon = ledger.idOf('crqc-horizon') ? (hndl ?? tnfl) : undefined
  if (horizon) {
    dates.push(
      `- **Quantum-threat planning horizon:** ~${horizon.crqcEstimateYear ?? horizon.estimatedQuantumThreatYear} (a planning assumption, not a forecast)${mark('crqc-horizon')}`
    )
  }
  if (hndl?.isAtRisk) {
    dates.push(
      `- **Data exposure window:** data kept ${hndl.riskWindowYears} years beyond ${hndl.estimatedQuantumThreatYear}${mark('data-exposure-window')}`
    )
  }
  if (tnfl?.isAtRisk) {
    dates.push(
      `- **Credential exposure window:** signing credentials trusted ${tnfl.riskWindowYears} years beyond ${tnfl.estimatedQuantumThreatYear}${mark('credential-exposure-window')}`
    )
  }
  const lines = [
    '# Executive Summary',
    '',
    `**Risk score:** ${result.riskScore} / 100 (${result.riskLevel})${mark('risk-score')}`,
    `**Generated:** ${profile.generatedAt}`,
    profile.industry ? `**Industry:** ${profile.industry}` : '',
    profile.country ? `**Country:** ${profile.country}` : '',
    '',
    'Each figure is marked [Cn]; `figure-sources.md` gives its source and caveats.',
    '',
    ...(dates.length > 0 ? ['## Key dates', '', ...dates, ''] : []),
    '## Narrative',
    '',
    // Marker on every line, so a reader quoting any sentence keeps its trace.
    narrative
      .split('\n')
      .map((l) => (l.trim() ? `${l}${mark('narrative')}` : l))
      .join('\n'),
    '',
    '## Top priorities',
    '',
  ].filter(Boolean)
  top3.forEach((a, i) => {
    lines.push(`### ${a.priority}. ${a.action}${mark(`priority-${i}`)}`)
    lines.push('')
    lines.push(
      `*${CATEGORY_LABEL[a.category] ?? a.category}${a.effort ? ` · effort: ${a.effort}` : ''}*`
    )
    lines.push('')
  })
  return lines.join('\n')
}

function buildKeyFindings(result: AssessmentResult, ledger: FigureSources): string {
  const findings = result.keyFindings ?? []
  if (findings.length === 0) {
    return '# Key Findings\n\n_No findings recorded for this assessment._\n'
  }
  const lines = ['# Key Findings', '']
  findings.forEach((f, i) => lines.push(`- ${f}${claimMarker(ledger.idOf(`finding-${i}`))}`))
  lines.push('')
  return lines.join('\n')
}

function buildRecommendedActions(result: AssessmentResult): string {
  const byCategory: Record<string, typeof result.recommendedActions> = {
    immediate: [],
    'short-term': [],
    'long-term': [],
  }
  for (const a of result.recommendedActions) {
    ;(byCategory[a.category] ?? (byCategory[a.category] = [])).push(a)
  }
  const lines = ['# Recommended Actions', '']
  for (const cat of ['immediate', 'short-term', 'long-term'] as const) {
    // eslint-disable-next-line security/detect-object-injection
    const items = byCategory[cat]
    if (!items || items.length === 0) continue
    lines.push(`## ${CATEGORY_LABEL[cat]}`, '')
    for (const a of items.sort((x, y) => x.priority - y.priority)) {
      lines.push(`- **${a.action}**${a.effort ? ` _(effort: ${a.effort})_` : ''}`)
      if (a.relatedModule) {
        lines.push(`  - Related learn module: \`${a.relatedModule}\``)
      }
    }
    lines.push('')
  }
  return lines.join('\n')
}

function buildComplianceCsv(result: AssessmentResult, ledger: FigureSources): string {
  const header = ['framework', 'requires_pqc', 'deadline', 'notes', 'claim_id'].join(',')
  const rows = result.complianceImpacts.map((c, i) =>
    [
      escapeCsv(c.framework),
      c.requiresPQC === null ? 'unknown' : c.requiresPQC ? 'yes' : 'no',
      escapeCsv(c.deadline),
      escapeCsv(c.notes),
      ledger.idOf(`compliance-${i}`) ?? '',
    ].join(',')
  )
  return [header, ...rows].join('\n') + '\n'
}

/**
 * GRC's applicability register: every framework the applicability engine puts in
 * scope for the profile's country and sector, strongest tier first, with why it
 * applies, its reviewed binding status, whether it requires PQC, the cited basis
 * and the source. Unlike compliance-deadlines.csv (the frameworks the reader
 * selected), this is what the engine says applies — the starting point of a
 * control-to-evidence workflow.
 */
export function buildApplicabilityRegisterCsv(profile: BoardPackProfile): string {
  const header = [
    'framework_id',
    'framework',
    'tier',
    'why_it_applies',
    'binding_status',
    'requires_pqc',
    'binding_basis',
    'deadline',
    'publisher_relationship',
    'publisher_type',
    'source',
  ].join(',')
  const results = applicableFrameworks({
    industry: profile.industry || null,
    country: profile.country || null,
    region: (profile.region as UserProfile['region']) ?? null,
  }).sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
  const rows = results.map(({ item: fw, tier, reason, sourceContext }) =>
    [
      escapeCsv(fw.id),
      escapeCsv(fw.label),
      tier,
      escapeCsv(reason),
      escapeCsv(fw.bindingStatus ?? 'not yet classified'),
      escapeCsv(fw.pqcRequirement),
      escapeCsv(fw.bindingBasis ?? ''),
      escapeCsv(fw.deadline),
      escapeCsv(sourceContext?.relationship ?? 'not classified'),
      escapeCsv(sourceContext?.organizationKind ?? 'not classified'),
      escapeCsv(fw.website ?? ''),
    ].join(',')
  )
  return [header, ...rows].join('\n') + '\n'
}

/** GRC readers get a compliance pack: the board pack plus the applicability register. */
export function isCompliancePack(profile: BoardPackProfile): boolean {
  return profile.persona === 'grc'
}

function buildProfileJson(result: AssessmentResult, profile: BoardPackProfile): string {
  return JSON.stringify(
    {
      notice: EDUCATION_NOTICE,
      profile,
      score: {
        risk: result.riskScore,
        riskLevel: result.riskLevel,
        preBoost: result.preBoostScore,
        boosts: result.boosts ?? [],
      },
      assessmentProfile: result.assessmentProfile ?? null,
    },
    null,
    2
  )
}

/**
 * Program effort & timeline rollup. Aggregates the per-algorithm migration scopes
 * into person-month + calendar bands, plus an optional cost band the reader is
 * explicitly told to override. Never presented as a quote. Figures come from
 * `computeProgramEffort`, the same rollup the sources of figures describes.
 */
function buildProgramEffort(result: AssessmentResult, ledger: FigureSources): string {
  const effort = computeProgramEffort(result)
  const out: string[] = ['# Program Effort & Timeline (Illustrative)', '']
  if (!effort) {
    out.push(
      'No per-algorithm migration effort was computed for this assessment (no',
      'quantum-vulnerable algorithms in scope, or quick-assessment mode was used).'
    )
    return out.join('\n')
  }
  const mark = (key: Parameters<FigureSources['idOf']>[0]) => claimMarker(ledger.idOf(key))
  const rate = usd(ASSUMED_COST_PER_PERSON_MONTH)

  out.push(
    '> Illustrative planning estimate derived from the per-algorithm migration',
    '> complexity in this assessment. It is NOT a quote — replace the assumed rate',
    '> and team capacity below with your own figures.',
    '',
    '## Headline',
    `- **Effort:** ~${effort.pmLow}–${effort.pmHigh} person-months across ${effort.migrations} algorithm migration(s)${mark('effort-person-months')}`,
    `- **Calendar time:** ~${effort.calLow}–${effort.calHigh} months (assuming ${ASSUMED_PARALLEL_WORKSTREAMS} parallel workstreams)${mark('effort-calendar')}`,
    `- **Indicative cost:** ~${usd(effort.costLow)}–${usd(effort.costHigh)} (at ${rate}/person-month, fully loaded — OVERRIDE)${mark('effort-cost')}`,
    '',
    '## By migration scope',
    '| Scope | Algorithms | Person-months (band) |',
    '| --- | ---: | ---: |'
  )
  for (const row of effort.byScope) {
    out.push(
      `| ${row.label} | ${row.count} | ${row.pmLow}–${row.pmHigh}${mark('effort-by-scope')} |`
    )
  }
  out.push(
    '',
    '## Assumptions (override these)',
    `- Person-month bands per scope: ${SCOPE_BANDS_TEXT}.${mark('effort-assumptions')}`,
    `- Blended fully-loaded cost: ${rate}/person-month.${mark('effort-assumptions')}`,
    `- ${ASSUMED_PARALLEL_WORKSTREAMS} parallel workstreams for the calendar band.${mark('effort-assumptions')}`,
    '- Excludes procurement, test infrastructure, training, and contingency.'
  )
  return out.join('\n')
}

/**
 * Build the Board Pack as a single Blob.
 */
export async function buildBoardPackBlob(input: BuildBoardPackInput): Promise<Blob> {
  const { result, profile, appVersion } = input
  const milestone = profile.country ? findCountryNextMilestone(profile.country) : null
  const ledger = buildFigureSourcesIndex({ result, profile, countryMilestone: milestone })
  // A board pack is read, forwarded and quoted by people who never opened this
  // app, so the notice is in the archive AND in every file inside it — a reader
  // who opens only `key-findings.md` still meets it (education-notice
  // remediation 2026-09-26).
  const files: BundleFile[] = [
    {
      path: 'NOTICE.md',
      content: `# Status notice\n\n${EDUCATION_NOTICE}\n\nEvery figure, finding, deadline and recommendation in this pack was produced\nby an educational and demonstration platform from self-reported inputs. None\nof it is an assessment, an audit, a certification, or legal or compliance\nadvice, and none of it may be relied upon as such.\n`,
    },
    { path: 'README.md', content: withEducationNoticeMarkdown(buildReadme(profile, appVersion)) },
    {
      path: 'executive-summary.md',
      content: withEducationNoticeMarkdown(
        buildExecutiveSummary(result, profile, ledger, milestone)
      ),
    },
    {
      path: 'key-findings.md',
      content: withEducationNoticeMarkdown(buildKeyFindings(result, ledger)),
    },
    {
      path: 'recommended-actions.md',
      content: withEducationNoticeMarkdown(buildRecommendedActions(result)),
    },
    {
      path: 'compliance-deadlines.csv',
      content: withEducationNoticeCsv(buildComplianceCsv(result, ledger)),
    },
    { path: 'profile.json', content: buildProfileJson(result, profile) },
    {
      path: 'program-effort.md',
      content: withEducationNoticeMarkdown(buildProgramEffort(result, ledger)),
    },
    {
      path: 'figure-sources.csv',
      content: withEducationNoticeCsv(figureSourcesCsv(ledger.entries)),
    },
    {
      path: 'figure-sources.md',
      content: withEducationNoticeMarkdown(figureSourcesMarkdown(ledger.entries)),
    },
  ]
  if (isCompliancePack(profile)) {
    files.push({
      path: 'applicability-register.csv',
      content: withEducationNoticeCsv(buildApplicabilityRegisterCsv(profile)),
    })
  }
  const folder = isCompliancePack(profile) ? 'compliance-pack' : 'board-pack'
  return buildZipBundle(files.map((f) => ({ ...f, path: `${folder}/${f.path}` })))
}

/**
 * Build the Board Pack and trigger a browser download. No-ops in non-browser
 * environments (server / test) — caller is expected to gate via `if (typeof
 * window !== 'undefined')`.
 */
export async function downloadBoardPack(input: BuildBoardPackInput): Promise<void> {
  const blob = await buildBoardPackBlob(input)
  const kind = isCompliancePack(input.profile) ? 'compliance-pack' : 'board-pack'
  downloadBlob(blob, `pqc-${kind}-${profileSlug(input.profile)}.zip`)
}

function profileSlug(profile: BoardPackProfile): string {
  const date = profile.generatedAt.slice(0, 10) || new Date().toISOString().slice(0, 10)
  const industry = (profile.industry || 'unspec').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return `${date}-${industry}`
}
