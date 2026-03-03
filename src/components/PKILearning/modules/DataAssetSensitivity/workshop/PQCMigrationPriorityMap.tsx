// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  getPriorityBand,
  SENSITIVITY_TIERS,
  RETENTION_CONFIGS,
  ASSET_TYPES,
  RELATED_MODULE_MAP,
  scoreAsset,
  DEFAULT_SCORING_WEIGHTS,
  type DataAsset,
  type ScoredAsset,
} from '../data/sensitivityConstants'
import { COMPLIANCE_MANDATES, getEarliestDeadline } from '../data/industryComplianceData'

interface PQCMigrationPriorityMapProps {
  assets: DataAsset[]
  selectedMandates: string[]
  scoredAssets?: ScoredAsset[]
}

const MIGRATION_EFFORT_LABEL: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const MIGRATION_EFFORT_COLOR: Record<string, string> = {
  low: 'text-status-success',
  medium: 'text-status-warning',
  high: 'text-status-error',
}

function AssetPriorityRow({ scored, rank }: { scored: ScoredAsset; rank: number }) {
  const [expanded, setExpanded] = useState(false)
  const band = getPriorityBand(scored.compositeScore)
  const tierConfig = SENSITIVITY_TIERS.find((t) => t.id === scored.sensitivityTier)
  const typeConfig = ASSET_TYPES.find((t) => t.id === scored.assetType)
  const retConfig = RETENTION_CONFIGS.find((r) => r.id === scored.retentionPeriod)
  const relatedModule = RELATED_MODULE_MAP[scored.assetType]

  const primaryMandate =
    scored.complianceFlags.length > 0
      ? (COMPLIANCE_MANDATES.find((m) => m.id === scored.complianceFlags[0]) ?? null)
      : null

  const earliestDeadline = getEarliestDeadline(scored.complianceFlags)

  return (
    <div
      className={`border rounded-lg transition-colors ${expanded ? 'border-primary/30' : 'border-border'}`}
    >
      <div className="flex items-center gap-3 p-4">
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${band.bgClass} border ${
            band.label === 'Critical'
              ? 'border-status-error/40'
              : band.label === 'High'
                ? 'border-status-warning/40'
                : band.label === 'Medium'
                  ? 'border-status-info/40'
                  : 'border-status-success/40'
          } ${band.colorClass}`}
        >
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-sm font-bold text-foreground">{scored.name}</span>
            {tierConfig && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${tierConfig.colorClass} ${tierConfig.bgClass} ${tierConfig.borderClass}`}
              >
                {tierConfig.label}
              </span>
            )}
            <span className="text-[10px] px-1.5 py-0.5 rounded border bg-muted text-muted-foreground border-border">
              {typeConfig?.label ?? scored.assetType}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>Retention: {retConfig?.label}</span>
            {earliestDeadline.year && (
              <span
                className={
                  earliestDeadline.year <= 2027 ? 'text-status-error' : 'text-status-warning'
                }
              >
                Deadline: {earliestDeadline.year} ({earliestDeadline.name})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`w-14 text-center py-1.5 rounded-lg border font-bold text-base ${band.colorClass} ${band.bgClass}`}
          >
            {scored.compositeScore}
          </div>
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="p-1 h-auto text-muted-foreground"
            aria-label={expanded ? 'Collapse' : 'Expand details'}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 space-y-4">
          {/* PQC Recommendation */}
          <div>
            <h5 className="text-xs font-bold text-foreground mb-2">PQC Migration Path</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {scored.pqcRecommendation.kem && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                  <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">
                    Key Encapsulation
                  </p>
                  <p className="text-xs font-bold text-primary">{scored.pqcRecommendation.kem}</p>
                </div>
              )}
              {scored.pqcRecommendation.signature && (
                <div className="bg-secondary/5 rounded-lg p-3 border border-secondary/20">
                  <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">
                    Digital Signature
                  </p>
                  <p className="text-xs font-bold text-secondary">
                    {scored.pqcRecommendation.signature}
                  </p>
                </div>
              )}
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase tracking-wide">
                  Hybrid Transition
                </p>
                <p className="text-xs font-bold text-foreground">
                  {scored.pqcRecommendation.hybrid}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2 italic">
              {scored.pqcRecommendation.rationale}
            </p>
          </div>

          {/* Compliance + Effort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-bold text-foreground mb-1">Primary Mandate</h5>
              {primaryMandate ? (
                <div>
                  <p className="text-xs text-foreground font-medium">{primaryMandate.fullName}</p>
                  {primaryMandate.deadlineYear && (
                    <p className="text-xs text-muted-foreground">
                      Deadline: {primaryMandate.hardDeadline}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No specific mandate — follow NIST IR 8547 guidance
                </p>
              )}
            </div>
            <div>
              <h5 className="text-xs font-bold text-foreground mb-1">Migration Effort</h5>
              <span
                className={`text-sm font-bold ${MIGRATION_EFFORT_COLOR[scored.migrationEffort]}`}
              >
                {MIGRATION_EFFORT_LABEL[scored.migrationEffort]}
              </span>
              <p className="text-xs text-muted-foreground">
                {scored.migrationEffort === 'high'
                  ? 'Requires application-level changes and data re-encryption'
                  : scored.migrationEffort === 'medium'
                    ? 'Configuration and library updates needed'
                    : 'Pipeline update — low application impact'}
              </p>
            </div>
          </div>

          {/* Related module link */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Deep dive:</span>
            <Link
              to={`/learn/${relatedModule.id}`}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              {relatedModule.title} <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export const PQCMigrationPriorityMap: React.FC<PQCMigrationPriorityMapProps> = ({
  assets,
  selectedMandates,
  scoredAssets,
}) => {
  const scored = useMemo(() => {
    if (scoredAssets && scoredAssets.length > 0) return scoredAssets
    return [...assets]
      .map((a) =>
        scoreAsset(
          {
            ...a,
            complianceFlags: a.complianceFlags.length > 0 ? a.complianceFlags : selectedMandates,
          },
          DEFAULT_SCORING_WEIGHTS
        )
      )
      .sort((a, b) => b.compositeScore - a.compositeScore)
  }, [assets, selectedMandates, scoredAssets])

  const bandCounts = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    scored.forEach((s) => {
      const band = getPriorityBand(s.compositeScore).label as keyof typeof counts
      counts[band]++
    })
    return counts
  }, [scored])

  const handleExport = () => {
    const lines = [
      '# PQC Migration Priority Map',
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      '## Priority Summary',
      `- Critical (≥80): ${bandCounts.Critical} asset(s)`,
      `- High (60-79): ${bandCounts.High} asset(s)`,
      `- Medium (40-59): ${bandCounts.Medium} asset(s)`,
      `- Low (<40): ${bandCounts.Low} asset(s)`,
      '',
      '## Assets by PQC Urgency',
      '',
    ]

    scored.forEach((s, i) => {
      const band = getPriorityBand(s.compositeScore)
      lines.push(`### ${i + 1}. ${s.name} — Score: ${s.compositeScore} (${band.label})`)
      lines.push(`- **Sensitivity:** ${s.sensitivityTier} | **Retention:** ${s.retentionPeriod}`)
      lines.push(`- **Current encryption:** ${s.currentEncryption}`)
      if (s.pqcRecommendation.kem) lines.push(`- **PQC KEM:** ${s.pqcRecommendation.kem}`)
      if (s.pqcRecommendation.signature)
        lines.push(`- **PQC Signature:** ${s.pqcRecommendation.signature}`)
      lines.push(`- **Hybrid transition:** ${s.pqcRecommendation.hybrid}`)
      lines.push(`- **Migration effort:** ${s.migrationEffort}`)
      lines.push(`- **Rationale:** ${s.pqcRecommendation.rationale}`)
      lines.push('')
    })

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pqc-migration-priority.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Add assets in Step 1 to generate your PQC migration priority map.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Priority Band Summary */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Migration Priority Overview</h3>
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2 text-xs"
          >
            <Download size={14} /> Export Markdown
          </Button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {(
            [
              {
                band: 'Critical',
                range: '≥80',
                colorClass: 'text-status-error',
                bgClass: 'bg-status-error/10',
                borderClass: 'border-status-error/30',
              },
              {
                band: 'High',
                range: '60–79',
                colorClass: 'text-status-warning',
                bgClass: 'bg-status-warning/10',
                borderClass: 'border-status-warning/30',
              },
              {
                band: 'Medium',
                range: '40–59',
                colorClass: 'text-status-info',
                bgClass: 'bg-status-info/10',
                borderClass: 'border-status-info/30',
              },
              {
                band: 'Low',
                range: '<40',
                colorClass: 'text-status-success',
                bgClass: 'bg-status-success/10',
                borderClass: 'border-status-success/30',
              },
            ] as const
          ).map(({ band, range, colorClass, bgClass, borderClass }) => (
            <div
              key={band}
              className={`rounded-lg p-3 border ${bgClass} ${borderClass} text-center`}
            >
              <p className={`text-2xl font-bold ${colorClass}`}>
                {bandCounts[band as keyof typeof bandCounts]}
              </p>
              <p className={`text-xs font-bold ${colorClass}`}>{band}</p>
              <p className="text-[10px] text-muted-foreground">{range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Asset Priority List */}
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Expand each asset to see the recommended PQC migration path, compliance mandate, and
          migration effort estimate. Scores calculated from Step 4&apos;s Sensitivity Scoring
          Engine.
        </p>

        {scored.map((s, i) => (
          <AssetPriorityRow key={s.id} scored={s} rank={i + 1} />
        ))}
      </div>

      {/* Next steps */}
      <div className="glass-panel p-4 space-y-2">
        <h4 className="text-sm font-bold text-foreground">Recommended Next Steps</h4>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Start with Critical-band assets — initiate PQC migration project within 6 months</li>
          <li>
            Validate compliance deadlines on the{' '}
            <Link to="/compliance" className="text-primary hover:underline">
              Compliance page
            </Link>
          </li>
          <li>
            Run a full cryptographic inventory scan to discover unlisted assets (look for RSA/ECC in
            certificates, code signatures, and key material)
          </li>
          <li>
            Use the{' '}
            <Link to="/assess" className="text-primary hover:underline">
              Assessment Wizard
            </Link>{' '}
            to generate a full organizational risk report
          </li>
          <li>
            Explore PQC-capable tools for each asset type in the{' '}
            <Link to="/migrate" className="text-primary hover:underline">
              Migrate catalog
            </Link>
          </li>
        </ol>
      </div>
    </div>
  )
}
