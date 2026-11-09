// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
      0: 'Subscribe to the NIST CMVP change-notice feed and NVD API for crypto CVEs. Create a weekly triage task.',
      1: 'Integrate CVE feeds into your ticketing system; add crypto library EoL dates to your CBOM.',
      2: 'Automate CMVP historical-cert detection; route alerts to the Assurance pillar owner.',
      3: 'Confirm automated patch-revalidate bind detection is in place (FIPS status tracked alongside CVE status).',
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
      0: 'Generate a CycloneDX SBOM for your top 5 critical applications using Syft or cdxgen.',
      1: 'Enrich SBOMs with crypto component metadata (FIPS status, ESV, PQC readiness); store in CMDB.',
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
      1: 'Write detection rules for deprecated cipher suites (TLS 1.0/1.1, RC4, 3DES) and historical FIPS certs.',
      2: 'Add ML-KEM/ML-DSA negotiation events as positive signals; set up weekly posture-trend reports.',
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
      3: 'Verify policy violations generate SIEM alerts; confirm PQC cipher suites are in the allow list.',
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
  }>('management-tools-audit')

  const [levels, setLevels] = useState<Record<string, CoverageLevel>>(
    () => savedInputs?.levels ?? initLevels()
  )
  const [sysPct, setSysPct] = useState<Record<string, number>>(
    () => savedInputs?.sysPct ?? initPct()
  )
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  const setLevel = (id: string, lvl: CoverageLevel) => setLevels((prev) => ({ ...prev, [id]: lvl }))
  const setPct = (id: string, val: number) => setSysPct((prev) => ({ ...prev, [id]: val }))

  // Weighted by each tool's declared `importance`. It was a flat unweighted
  // mean, so a missing crypto scanner (importance 3) and a missing
  // data-classification tool (importance 1) moved the headline identically —
  // even though `importance` was already trusted enough to order the gap list
  // directly below. (Audit 2026-08-10, W1-5.)
  const completeness = useMemo(() => computeMaturityScore(levels), [levels])

  const gaps = useMemo(
    () => TOOLS.filter((t) => levels[t.id] < 2).sort((a, b) => b.importance - a.importance),
    [levels]
  )

  /** Markdown serialization of the current audit state for Command Center export. */
  const exportMarkdown = useMemo(() => {
    const lines: string[] = []
    lines.push('# Management Tools Audit')
    lines.push('')
    lines.push(`**Hub tool-category rating:** ${completeness}%`)
    lines.push('')
    lines.push(
      'Reference reading: NIST CSWP.39 §5. The weights and display bands are Hub teaching heuristics, not NIST completeness thresholds.'
    )
    lines.push(
      'Selected category ratings are learner-entered sample assumptions, not tested capabilities. Systems-coverage percentages are recorded separately and do not contribute to this rating; even 100% does not establish inventory coverage or implemented controls.'
    )
    lines.push('')
    lines.push('## Coverage by tool category')
    lines.push('')
    lines.push('| Tool category | Coverage | Systems covered | CPM pillar | Reference |')
    lines.push('|---|---|---|---|---|')
    for (const t of TOOLS) {
      lines.push(
        `| ${t.name} | ${LEVEL_LABELS[levels[t.id]]} (${levels[t.id]}/3) | ${sysPct[t.id]}% | ${t.cpmPillar} | ${t.cswpRef} |`
      )
    }
    lines.push('')
    if (gaps.length > 0) {
      lines.push(`## Topics below Partial — Hub importance order (${gaps.length})`)
      lines.push('')
      for (const t of gaps) {
        const lvl = levels[t.id]
        lines.push(`### ${t.name} — currently ${LEVEL_LABELS[lvl]}`)
        lines.push('')
        lines.push(`> ${t.recommendations[lvl]}`)
        lines.push('')
      }
    } else {
      lines.push('## No selected ratings below Partial')
      lines.push('')
      lines.push(
        'All selected category ratings are Partial or Automated; this does not establish implemented capability or systems coverage.'
      )
    }
    return lines.join('\n')
  }, [levels, sysPct, completeness, gaps])

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
          const pct = sysPct[tool.id]
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
                    <div className="flex gap-1">
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
                  {/* Systems coverage slider */}
                  <div>
                    <div className="text-[10px] text-muted-foreground mb-1 font-medium">
                      Systems covered: <span className="text-foreground font-bold">{pct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={pct}
                      onChange={(e) => setPct(tool.id, Number(e.target.value))}
                      className="w-full h-1.5 accent-primary"
                      aria-label={`Systems covered by ${tool.name}`}
                    />
                  </div>
                </div>
              </div>

              {/* Recommendation for current level */}
              {lvl < 3 && (
                <div className="mt-3 flex items-start gap-2 bg-muted/30 rounded p-2">
                  <Info size={13} className="text-status-info mt-0.5 shrink-0" />
                  <p className="text-[11px] text-muted-foreground">{tool.recommendations[lvl]}</p>
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

        {/* Completeness bar */}
        <div className="w-full bg-muted/50 rounded-full h-2.5">
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
          reach. These percentages do not contribute to the headline rating: all categories set to
          Automated still score 100% with 0% systems coverage. Neither number verifies a capability.
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
                    {LEVEL_LABELS[lvl]} · {sysPct[t.id]}% systems
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
              Topics below Partial ({gaps.length})
            </div>
            <div className="space-y-2">
              {gaps.map((t) => (
                <div key={t.id} className="flex items-start gap-2">
                  <AlertCircle size={13} className="text-status-warning mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-foreground">{t.name}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      — currently {LEVEL_LABELS[levels[t.id]]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : completeness >= 75 ? (
          <div className="flex items-center gap-2 text-status-success text-sm font-medium">
            <CheckCircle2 size={16} />
            Selected ratings reach the Hub display band — implemented capabilities and inventory
            coverage are not assessed.
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
            moduleId: 'crypto-management-modernization',
            type: 'management-tools-audit',
            title: `Management Tools Audit — ${new Date().toLocaleDateString()}`,
            data: exportMarkdown,
            inputs: { levels, sysPct, completeness },
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
