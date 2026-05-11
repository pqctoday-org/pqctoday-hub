// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { Gauge } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { MaturityEvidenceGrid } from '@/components/Compliance/MaturityEvidenceGrid'
import { maturityRequirements } from '@/data/maturityGovernanceData'

/**
 * `/agility` — Cryptographic-Agility Maturity Dashboard (Plan 07).
 *
 * Renders the CSWP 39 4×5 maturity grid (4 levels × 5 pillars) over the
 * shared `MaturityEvidenceGrid` component. Filters the maturity corpus to
 * NIST CSWP 39 records — the canonical agility maturity model — and shows
 * a small KPI bar above the grid for coverage % and mean confidence so
 * the user can see at a glance how complete the extraction is.
 */
export function AgilityView() {
  const cswpRequirements = useMemo(
    () =>
      maturityRequirements.filter(
        (r) => /CSWP\s*39/i.test(r.sourceName) || /CSWP\s*39/i.test(r.refId)
      ),
    []
  )

  const kpi = useMemo(() => {
    // 4 levels × 5 pillars = 20 cells per asset-class. Coverage is the
    // share of those 20 cells that have at least one requirement.
    const populated = new Set(cswpRequirements.map((r) => `${r.maturityLevel}:${r.pillar}`)).size
    const confidenceMap = { low: 25, medium: 60, high: 95 } as const
    const confidenceSum = cswpRequirements.reduce(
      (sum, r) => sum + (confidenceMap[r.confidence] ?? 0),
      0
    )
    const meanConfidence = cswpRequirements.length
      ? Math.round(confidenceSum / cswpRequirements.length)
      : 0
    return {
      populated,
      total: 20,
      coverage: Math.round((populated / 20) * 100),
      meanConfidence,
      recordCount: cswpRequirements.length,
    }
  }, [cswpRequirements])

  return (
    <div>
      <PageHeader
        icon={Gauge}
        title="Cryptographic-Agility Maturity"
        description="NIST CSWP 39 — Cryptographic Agility Maturity Model across five pillars (inventory, governance, lifecycle, observability, assurance) and four maturity levels (Partial → Adaptive)."
        dataSource={`pqc_maturity_governance_requirements.csv • ${kpi.recordCount} CSWP 39 requirements`}
        shareTitle="PQC Today — Cryptographic-Agility Maturity Dashboard"
        shareText="CSWP 39 cryptographic-agility maturity grid: where your organization sits on the path from Partial to Adaptive."
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI bar */}
        <div className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCell
            label="Grid coverage"
            value={`${kpi.coverage}%`}
            sub={`${kpi.populated}/${kpi.total} cells populated`}
          />
          <KpiCell
            label="Mean confidence"
            value={`${kpi.meanConfidence}/100`}
            sub={
              kpi.recordCount > 0
                ? 'across extracted requirements'
                : 'no requirements extracted yet'
            }
          />
          <KpiCell
            label="Source records"
            value={String(kpi.recordCount)}
            sub="rows in the CSWP 39 slice"
          />
        </div>

        {cswpRequirements.length === 0 ? (
          <EmptyState />
        ) : (
          <MaturityEvidenceGrid requirements={cswpRequirements} />
        )}
      </div>
    </div>
  )
}

function KpiCell({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground mt-1">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
      No CSWP 39 maturity requirements have been extracted yet. Run{' '}
      <code className="text-foreground">scripts/enrich-compliance-fwks-ollama.py</code> filtered to
      “NIST CSWP 39” to populate this grid.
    </div>
  )
}

export default AgilityView
