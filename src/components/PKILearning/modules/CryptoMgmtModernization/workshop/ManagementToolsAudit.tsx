// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { ExportableArtifact } from '@/components/PKILearning/common/executive/ExportableArtifact'
import { useModuleStore } from '@/store/useModuleStore'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'

export type CoverageLevel = 0 | 1 | 2 | 3

const LEVEL_LABELS: Record<CoverageLevel, string> = {
  0: 'None',
  1: 'Manual',
  2: 'Partial',
  3: 'Automated',
}

const LEVEL_COLORS: Record<CoverageLevel, string> = {
  0: 'bg-status-error/15 text-status-error border-status-error/30',
  1: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  2: 'bg-status-info/15 text-status-info border-status-info/30',
  3: 'bg-status-success/15 text-status-success border-status-success/30',
}

export interface ToolDef {
  id: string
  name: string
  description: string
  cpmPillar: string
  cswpRef: string
  importance: number
  recommendations: Record<CoverageLevel, string>
}

export const TOOLS: ToolDef[] = [
  {
    id: 'crypto-scanner',
    name: 'Crypto Scanners',
    description:
      'Detect algorithms, key lengths, cert details across source code and network traffic.',
    cpmPillar: 'Inventory + Observability',
    cswpRef: 'CSWP.39 §5 (Identify Gaps step)',
    importance: 3,
    recommendations: {
      0: 'Deploy a crypto scanner (e.g., Keyfactor Discovery, Venafi TLC, or open-source cryptoscan) in passive mode against at least one production network segment.',
      1: 'Automate scan scheduling; integrate output into CMDB or CBOM pipeline to eliminate manual upload.',
      2: 'Expand coverage to all network segments and CI/CD pipelines; set up alerts for newly detected deprecated algorithms.',
      3: 'Verify real-time drift detection is enabled and alerts are wired to your SIEM.',
    },
  },
  {
    id: 'vuln-management',
    name: 'Vulnerability Management',
    description: 'CVE feeds, crypto library EoL tracking, CMVP historical-cert alerts.',
    cpmPillar: 'Assurance',
    cswpRef: 'CSWP.39 §5 (Identify Gaps step)',
    importance: 3,
    recommendations: {
      0: 'Subscribe to the NIST CMVP change-notice feed (including FIPS 140-2 Historical transitions from September 2026) and NVD API for crypto CVEs. Create a weekly triage task.',
      1: 'Integrate CVE feeds into your ticketing system; add crypto library EoL dates to your CBOM.',
      2: 'Automate CMVP historical-cert detection; route alerts to the Assurance pillar owner.',
      3: 'Confirm automated patch-revalidate bind detection is in place (FIPS 140-3 status tracked alongside CVE status).',
    },
  },
  {
    id: 'asset-management',
    name: 'Asset Management (CMDB / SBOM pipeline)',
    description:
      'SBOM generation, CBOM enrichment, and CMDB feeds that keep the crypto asset inventory current.',
    cpmPillar: 'Inventory',
    cswpRef: 'CSWP.39 §5 (Inventory step)',
    importance: 3,
    recommendations: {
      0: 'Generate a CycloneDX 1.6/1.7 (ECMA-424) SBOM/CBOM for your top 5 critical applications using Syft or cdxgen.',
      1: 'Enrich SBOMs with crypto component metadata (FIPS 140-3 status, ESV, PQC readiness, CISA minimum CBOM elements due 19 March 2027 under EO 14412); store in CMDB.',
      2: 'Automate SBOM generation in CI/CD; set up a nightly CBOM freshness check.',
      3: 'Verify the pipeline updates the crypto asset inventory automatically; confirm completeness KPI is tracked.',
    },
  },
  {
    id: 'config-management',
    name: 'Configuration Management (Policy-as-Code / CLM)',
    description:
      'Crypto policy-as-code enforcement and certificate-lifecycle management — pushing approved algorithms and cert renewals to systems automatically.',
    cpmPillar: 'Configuration',
    cswpRef: 'CSWP.39 §5 (Identify Gaps step)',
    importance: 3,
    recommendations: {
      0: 'Adopt a certificate-lifecycle management (CLM) tool (e.g., Venafi, Keyfactor Command, HashiCorp Vault PKI) for at least one critical CA chain.',
      1: 'Codify your crypto policy baseline (approved algorithms, key sizes, cert lifetimes) as policy-as-code; apply it manually during deployments.',
      2: 'Automate policy-as-code enforcement in CI/CD and CLM-driven cert renewal across production systems.',
      3: 'Confirm cert renewal is fully automated (no manual CSR handling) and that policy drift triggers automatic remediation.',
    },
  },
  {
    id: 'log-siem',
    name: 'Log Management / SIEM',
    description:
      'Crypto-drift events, cipher-suite anomalies, protocol-version alerts in real time.',
    cpmPillar: 'Observability',
    cswpRef: 'CSWP.39 §5 (Identify Gaps step)',
    importance: 2,
    recommendations: {
      0: 'Configure TLS handshake logging on at least your public-facing load balancers; route to your SIEM.',
      1: 'Detect prohibited protocol versions, suites and module certificate status separately.',
      2: 'Record the observed TLS 1.3 key agreement group and CertificateVerify scheme as separate fields in the weekly posture report.',
      3: 'Confirm that drift alerts trigger automated tickets and feed back into the CBOM remediation loop.',
    },
  },
  {
    id: 'zero-trust',
    name: 'Zero-Trust Enforcement',
    description:
      'Policy engines that block disallowed cipher suites at the network layer; mTLS enforcement.',
    cpmPillar: 'Governance',
    cswpRef: 'CSWP.39 §4.3 (service mesh / zero-trust)',
    importance: 2,
    recommendations: {
      0: 'Define a crypto policy baseline (minimum TLS 1.2, approved cipher suites); document it in Governance.',
      1: 'Enforce policy on your service mesh or API gateway for internal east-west traffic.',
      2: 'Extend enforcement to all north-south egress; automate policy-as-code deployment via CI/CD.',
      3: 'Verify policy violations generate SIEM alerts. Check TLS 1.3 key agreement groups, certificate/signature policy and cipher suites separately.',
    },
  },
  {
    id: 'data-classification',
    name: 'Data Classification Scanners',
    description: 'Classify data assets by sensitivity to drive inventory prioritisation.',
    cpmPillar: 'Inventory',
    cswpRef: 'CSWP.39 §5 (Govern step)',
    importance: 1,
    recommendations: {
      0: 'Manually classify your top-10 data repositories by sensitivity (public / internal / confidential / restricted).',
      1: 'Map sensitivity classes to crypto requirements (e.g., restricted → AES-256 + FIPS validated library).',
      2: 'Automate classification with DLP tooling; feed labels into the CBOM risk scoring pipeline.',
      3: 'Verify sensitivity labels drive differential crypto requirements in the Risk Analysis Engine.',
    },
  },
]

/**
 * Maturity score (0–100), weighted by each tool's declared `importance`.
 *
 * Was a flat unweighted mean — `sum(levels) / (3 × TOOLS.length)` — so a
 * missing crypto scanner (importance 3) and a missing data-classification
 * tool (importance 1) moved the headline number identically, even though
 * `importance` was already trusted to order the gap list. Exported so the
 * weighting is testable without rendering. (Audit 2026-08-10, W1-5.)
 */
export function computeMaturityScore(
  levels: Record<string, CoverageLevel>,
  tools: ToolDef[] = TOOLS
): number {
  const weighted = tools.reduce((acc, t) => acc + (levels[t.id] ?? 0) * t.importance, 0)
  const maxWeighted = tools.reduce((acc, t) => acc + 3 * t.importance, 0)
  return maxWeighted > 0 ? Math.round((weighted / maxWeighted) * 100) : 0
}

/** Below this share of systems covered, a category is listed as a gap even at Partial or Automated. */
export const LOW_COVERAGE_PCT = 50

/**
 * Coverage-adjusted readiness: each category's rating (level / 3) is scaled by the
 * share of systems it reaches (sysPct / 100), then importance-weighted like the
 * category rating. An Automated scanner that reaches 30% of systems contributes
 * 30% of its weight, not 100%.
 */
export function computeCoverageAdjustedScore(
  levels: Record<string, CoverageLevel>,
  sysPct: Record<string, number>,
  tools: ToolDef[] = TOOLS
): number {
  const weighted = tools.reduce((acc, t) => {
    const pct = Math.min(100, Math.max(0, sysPct[t.id] ?? 0))
    return acc + ((levels[t.id] ?? 0) / 3) * (pct / 100) * t.importance
  }, 0)
  const maxWeighted = tools.reduce((acc, t) => acc + t.importance, 0)
  return maxWeighted > 0 ? Math.round((weighted / maxWeighted) * 100) : 0
}

/** Why a category is a gap: rating below Partial, or rated Partial+ but reaching under half the systems. */
export function gapReason(
  level: CoverageLevel,
  pct: number
): 'rating-below-partial' | 'low-systems-coverage' | null {
  if (level < 2) return 'rating-below-partial'
  if ((pct ?? 0) < LOW_COVERAGE_PCT) return 'low-systems-coverage'
  return null
}

type InventoryCounts = { active: boolean; inScope: string; covered: string }
const EMPTY_COUNTS: InventoryCounts = { active: false, inScope: '', covered: '' }

export function inventoryCoveragePct(
  counts: Pick<InventoryCounts, 'inScope' | 'covered'>
): number | null {
  if (!/^\d+$/.test(counts.inScope) || !/^\d+$/.test(counts.covered)) return null
  const scoped = Number(counts.inScope)
  const covered = Number(counts.covered)
  return Number.isSafeInteger(scoped) &&
    Number.isSafeInteger(covered) &&
    scoped > 0 &&
    covered <= scoped
    ? (covered / scoped) * 100
    : null
}

const coverageNumberFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 2 })

function formatCoverage(pct: number): string {
  if (pct < LOW_COVERAGE_PCT && pct >= LOW_COVERAGE_PCT - 0.005) return `<${LOW_COVERAGE_PCT}%`
  return coverageNumberFormat.format(pct) + '%'
}

function describeGap(level: CoverageLevel, pct: number): string {
  return gapReason(level, pct) === 'low-systems-coverage'
    ? `${LEVEL_LABELS[level]}, but only ${formatCoverage(pct)} of systems covered`
    : `currently ${LEVEL_LABELS[level]}`
}

function gapRecommendation(tool: ToolDef, level: CoverageLevel): string {
  return level === 3
    ? 'Find the systems outside the reported coverage and verify which can use the same automated control.'
    : tool.recommendations[level]
}

export const ManagementToolsAudit: React.FC = () => {
  const { myProducts } = useExecutiveModuleData()
  // A catalogue selection identifies a product to investigate, not an installed
  // capability, operating mode or measured coverage. Start each fresh rating at
  // None; learners enter each category's sample rating independently.
  const initLevels = () => Object.fromEntries(TOOLS.map((t) => [t.id, 0 as CoverageLevel]))
  const initPct = () => Object.fromEntries(TOOLS.map((t) => [t.id, 0]))

  // Restore the last-saved audit so it round-trips instead of resetting to
  // a fresh unrated state on every visit.
  const savedInputs = useSavedArtifactInputs<{
    levels: Record<string, CoverageLevel>
    sysPct: Record<string, number>
    inventoryCounts?: Record<string, InventoryCounts>
  }>('management-tools-audit')

  const [levels, setLevels] = useState<Record<string, CoverageLevel>>(() => ({
    ...initLevels(),
    ...savedInputs?.levels,
  }))
  const [estimatedPct, setEstimatedPct] = useState<Record<string, number>>(() => ({
    ...initPct(),
    ...savedInputs?.sysPct,
  }))
  const [inventoryCounts, setInventoryCounts] = useState<Record<string, InventoryCounts>>(
    () => savedInputs?.inventoryCounts ?? {}
  )
  const { sysPct, missingCoverage } = useMemo(() => {
    const sysPct: Record<string, number> = {}
    const missingCoverage = new Set<string>()
    for (const tool of TOOLS) {
      const counts = inventoryCounts[tool.id]
      const pct = counts?.active ? inventoryCoveragePct(counts) : (estimatedPct[tool.id] ?? 0)
      if (pct === null) missingCoverage.add(tool.id)
      else sysPct[tool.id] = pct
    }
    return { sysPct, missingCoverage }
  }, [estimatedPct, inventoryCounts])
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  const setLevel = (id: string, lvl: CoverageLevel) => setLevels((prev) => ({ ...prev, [id]: lvl }))
  const setPct = (id: string, val: number) => setEstimatedPct((prev) => ({ ...prev, [id]: val }))
  const updateCounts = (id: string, patch: Partial<InventoryCounts>) =>
    setInventoryCounts((previous) => ({
      ...previous,
      [id]: { ...(previous[id] ?? EMPTY_COUNTS), ...patch },
    }))

  // Weighted by each tool's declared `importance`. It was a flat unweighted
  // mean, so a missing crypto scanner (importance 3) and a missing
  // data-classification tool (importance 1) moved the headline identically —
  // even though `importance` was already trusted enough to order the gap list
  // directly below. (Audit 2026-08-10, W1-5.)
  const completeness = useMemo(() => computeMaturityScore(levels), [levels])

  const coverageAdjusted = useMemo(
    () => (missingCoverage.size > 0 ? null : computeCoverageAdjustedScore(levels, sysPct)),
    [levels, sysPct, missingCoverage]
  )

  // A category is a gap when its rating is below Partial, or when it is rated
  // Partial/Automated but reaches under half of the systems.
  const gaps = useMemo(
    () =>
      TOOLS.filter(
        (t) => !missingCoverage.has(t.id) && gapReason(levels[t.id], sysPct[t.id]) !== null
      ).sort((a, b) => b.importance - a.importance),
    [levels, sysPct, missingCoverage]
  )
  const gapLabel = (t: ToolDef) => describeGap(levels[t.id], sysPct[t.id])

  /** Markdown serialization of the current audit state for Command Center export. */
  const exportMarkdown = useMemo(() => {
    const lines: string[] = []
    lines.push('# Management Tools Audit')
    lines.push('')
    lines.push(`**Hub tool-category rating:** ${completeness}%`)
    const readiness = coverageAdjusted === null ? 'Unavailable' : `${coverageAdjusted}%`
    lines.push(`**Coverage-adjusted readiness:** ${readiness}`)
    lines.push('')
    lines.push(
      'Reference reading: NIST CSWP.39 §5. The weights and display bands are Hub teaching heuristics, not NIST completeness thresholds.'
    )
    lines.push(
      'Selected category ratings are learner-entered sample assumptions, not tested capabilities. The category rating ignores systems coverage; the coverage-adjusted readiness scales each rating by the sample share of systems covered. Even 100% on either does not establish inventory coverage or implemented controls.'
    )
    lines.push('')
    lines.push('## Coverage by tool category')
    lines.push('')
    lines.push(
      '| Tool category | Coverage | Systems covered | Input basis | CPM pillar | Reference |'
    )
    lines.push('|---|---|---|---|---|---|')
    for (const t of TOOLS) {
      const counts = inventoryCounts[t.id]
      const invalid = missingCoverage.has(t.id)
      const coverage = invalid ? 'Unavailable' : formatCoverage(sysPct[t.id])
      const basis = counts?.active
        ? invalid
          ? 'Correct the inventory counts'
          : `${counts.covered} of ${counts.inScope} systems, entered inventory counts`
        : 'Entered estimate'
      lines.push(
        `| ${t.name} | ${LEVEL_LABELS[levels[t.id]]} (${levels[t.id]}/3) | ${coverage} | ${basis} | ${t.cpmPillar} | ${t.cswpRef} |`
      )
    }
    lines.push('')
    if (gaps.length > 0) {
      lines.push(
        `## Gaps: rating below Partial or under ${LOW_COVERAGE_PCT}% of systems covered — Hub importance order (${gaps.length})`
      )
      lines.push('')
      for (const t of gaps) {
        const lvl = levels[t.id]
        lines.push(`### ${t.name} — ${describeGap(lvl, sysPct[t.id])}`)
        lines.push('')
        lines.push(`> ${gapRecommendation(t, lvl)}`)
        lines.push('')
      }
    } else if (missingCoverage.size === 0) {
      lines.push('## No gaps in the sample ratings')
      lines.push('')
      lines.push(
        `All selected category ratings are Partial or Automated and reach at least ${LOW_COVERAGE_PCT}% of systems; this does not establish implemented capability or systems coverage.`
      )
    }
    if (missingCoverage.size > 0) {
      lines.push('## Incomplete coverage inputs', '')
      for (const tool of TOOLS) {
        if (missingCoverage.has(tool.id))
          lines.push(`- ${tool.name}: correct the inventory counts.`)
      }
    }
    return lines.join('\n')
  }, [levels, sysPct, inventoryCounts, missingCoverage, completeness, coverageAdjusted, gaps])

  return (
    <div className="space-y-6">
      {savedInputs && (
        <p role="status" className="text-sm text-foreground">
          Restored your last saved audit — adjust the controls below to update it.
        </p>
      )}
      {!savedInputs && myProducts.length > 0 && (
        <p role="status" className="text-sm text-foreground">
          {myProducts.length} selected catalogue product{myProducts.length === 1 ? '' : 's'}{' '}
          available for your review. No implementation ratings or systems coverage inferred.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Explore discovery, assessment, configuration and enforcement tool capabilities using sample
        ratings. Catalogue selections do not preselect implementation ratings. Fresh categories
        start at None with 0% systems coverage; enter each sample rating and coverage independently.
        Evaluate actual coverage, integration and test results with your production tools; this
        exercise does not assess implemented controls or data completeness.
      </p>

      {/* Tool coverage cards */}
      <div className="space-y-4">
        {TOOLS.map((tool) => {
          const lvl = levels[tool.id]
          const counts = inventoryCounts[tool.id] ?? EMPTY_COUNTS
          const invalid = missingCoverage.has(tool.id)
          const pct = invalid ? 'Unavailable' : formatCoverage(sysPct[tool.id])
          return (
            <div
              key={tool.id}
              role="group"
              aria-label={tool.name}
              className="bg-muted/40 rounded-lg p-4 border border-border"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-foreground text-sm">{tool.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${LEVEL_COLORS[lvl]}`}
                    >
                      {LEVEL_LABELS[lvl]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{tool.description}</p>
                  <div className="text-[10px] text-muted-foreground">
                    CPM: <span className="text-primary font-medium">{tool.cpmPillar}</span>
                    &ensp;·&ensp;{tool.cswpRef}
                  </div>
                </div>

                <div className="shrink-0 space-y-3 sm:w-56">
                  {/* Level selector */}
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                      Selected category rating
                    </div>
                    <div
                      className="flex gap-1"
                      role="group"
                      aria-label={`Category rating for ${tool.name}`}
                    >
                      {([0, 1, 2, 3] as CoverageLevel[]).map((l) => (
                        <Button
                          key={l}
                          variant={lvl === l ? 'gradient' : 'outline'}
                          aria-pressed={lvl === l}
                          onClick={() => setLevel(tool.id, l)}
                          className="flex-1 py-0.5 text-[10px] font-bold h-7 min-w-0"
                        >
                          {LEVEL_LABELS[l]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1 font-medium">
                      Systems covered: <span className="text-foreground font-bold">{pct}</span>
                    </div>
                    {counts.active ? (
                      <div className="space-y-2">
                        <label htmlFor={`tool-in-scope-${tool.id}`} className="block text-xs">
                          Systems in scope
                          <Input
                            id={`tool-in-scope-${tool.id}`}
                            inputMode="numeric"
                            value={counts.inScope}
                            maxLength={16}
                            aria-invalid={invalid || undefined}
                            onChange={(event) =>
                              updateCounts(tool.id, { inScope: event.target.value })
                            }
                          />
                        </label>
                        <label htmlFor={`tool-covered-${tool.id}`} className="block text-xs">
                          Observed covered systems
                          <Input
                            id={`tool-covered-${tool.id}`}
                            inputMode="numeric"
                            value={counts.covered}
                            maxLength={16}
                            aria-invalid={invalid || undefined}
                            onChange={(event) =>
                              updateCounts(tool.id, { covered: event.target.value })
                            }
                          />
                        </label>
                        {invalid && (
                          <p role="status" className="text-xs text-status-warning">
                            Enter a positive whole number in scope and a covered count between zero
                            and that number.
                          </p>
                        )}
                      </div>
                    ) : (
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={estimatedPct[tool.id] ?? 0}
                        onChange={(event) => setPct(tool.id, Number(event.target.value))}
                        className="w-full h-1.5 accent-primary"
                        aria-label={`Systems covered by ${tool.name}`}
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 min-h-11 max-w-full whitespace-normal text-left"
                      onClick={() => updateCounts(tool.id, { active: !counts.active })}
                    >
                      {counts.active ? 'Use estimate slider' : 'Enter inventory counts'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Recommendation for current level */}
              {(lvl < 3 || (!invalid && sysPct[tool.id] < LOW_COVERAGE_PCT)) && (
                <div className="mt-3 flex items-start gap-2 bg-muted/30 rounded p-2">
                  <Info size={13} className="text-status-info mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">
                    {gapRecommendation(tool, lvl)}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Gap Summary */}
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20 space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-bold text-foreground">Hub Tool-Category Rating</div>
          <div className="text-xl font-bold text-primary">{completeness}%</div>
        </div>
        <div className="flex justify-between items-center">
          <div className="font-bold text-foreground">Coverage-Adjusted Readiness</div>
          <div className="text-xl font-bold text-primary" data-testid="coverage-adjusted">
            {coverageAdjusted === null ? 'Unavailable' : `${coverageAdjusted}%`}
          </div>
        </div>

        {missingCoverage.size > 0 && (
          <p className="text-xs text-status-warning">
            Correct inventory counts for{' '}
            {TOOLS.filter((tool) => missingCoverage.has(tool.id))
              .map((tool) => tool.name)
              .join(', ')}
            .
          </p>
        )}

        {/* Completeness bar */}
        <div
          className="w-full bg-muted/50 rounded-full h-2.5"
          role="progressbar"
          aria-valuenow={completeness}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Hub tool-category rating"
        >
          <div
            className={`h-2.5 rounded-full transition-all ${completeness >= 75 ? 'bg-status-success' : completeness >= 40 ? 'bg-status-warning' : 'bg-status-error'}`}
            style={{ width: `${completeness}%` }}
          />
        </div>

        {/* The headline is importance-weighted as of 2026-08-10; before that a
            missing crypto scanner and a missing data-classification tool moved
            it identically. Say so, rather than leaving a bare percentage. */}
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground/80">How this is scored:</strong> each tool&apos;s
          selected category rating (None 0 → Automated 3) is multiplied by its importance to a PQC
          migration, summed, and divided by the maximum possible weighted total. It is a weighted
          average, not a plain one — the four foundational tools (crypto scanners, vulnerability
          management, asset management, configuration management) each count three times as much as
          data classification. Systems-coverage percentages are yours to enter; nothing seeds them,
          because a count of detected products says nothing about how much of your estate they
          reach. The category rating ignores them: all categories set to Automated still score 100%
          with 0% systems coverage. The coverage-adjusted readiness multiplies each rating by its
          share of systems covered, so the same audit reads 0% there, and any category under{' '}
          {LOW_COVERAGE_PCT}% of systems stays on the gap list. Inventory counts can replace each
          slider estimate. Count each system once in the chosen inventory scope.
        </p>

        {/* Selected category rating heatmap */}
        <div>
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
            Coverage heatmap
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TOOLS.map((t) => {
              const lvl = levels[t.id]
              return (
                <div
                  key={t.id}
                  className={`rounded p-2 border text-[10px] font-medium ${LEVEL_COLORS[lvl]}`}
                >
                  <div className="font-bold truncate">{t.name.split(' (')[0]}</div>
                  <div>
                    {LEVEL_LABELS[lvl]} ·{' '}
                    {missingCoverage.has(t.id)
                      ? 'Coverage unavailable'
                      : `${formatCoverage(sysPct[t.id])} systems`}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gaps list */}
        {gaps.length > 0 ? (
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">
              Gaps: rating below Partial or under {LOW_COVERAGE_PCT}% of systems covered (
              {gaps.length})
            </div>
            <div className="space-y-2">
              {gaps.map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <AlertCircle size={13} className="text-status-warning mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-foreground">{t.name}</span>
                    <span className="text-muted-foreground"> — {gapLabel(t)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : missingCoverage.size > 0 ? null : completeness >= 75 ? (
          <div className="flex items-center gap-2 text-status-success text-sm font-medium">
            <CheckCircle2 size={16} />
            Selected ratings and systems coverage reach the Hub display band — implemented
            capabilities and inventory coverage are not assessed.
          </div>
        ) : (
          <div className="flex items-center gap-2 text-status-warning text-sm font-medium">
            <AlertCircle size={16} />
            Selected category ratings total {completeness}%. This display band is a teaching
            heuristic, not a criterion for relying on a risk assessment.
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t border-border pt-3 mt-1">
          <strong className="text-foreground">Teaching-model limit:</strong> the 75% display cutoff
          and category weights are Hub assumptions, not NIST requirements or a data-completeness
          test. Investigate coverage, quality and uncertainty separately.
        </div>
      </div>

      {/* Save to Command Center / export */}
      <ExportableArtifact
        title="Management Tools Audit — Export"
        exportData={exportMarkdown}
        filename="management-tools-audit"
        formats={['markdown', 'pdf', 'docx']}
        wideTable
        onExport={() => {
          addExecutiveDocument({
            id: `management-tools-audit-${Date.now()}`,
            moduleId: 'crypto-mgmt-modernization',
            type: 'management-tools-audit',
            title: `Management Tools Audit — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: {
              levels,
              sysPct: estimatedPct,
              inventoryCounts,
              completeness,
              coverageAdjusted,
            },
            createdAt: Date.now(),
          })
        }}
      >
        <p className="text-sm text-muted-foreground">
          Save this audit to your Command Center under the Management Tools zone, or export as
          markdown / PDF / DOCX for sharing.
        </p>
      </ExportableArtifact>
    </div>
  )
}
