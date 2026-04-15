// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { useModuleStore } from '@/store/useModuleStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { LAYERS } from '@/components/Migrate/InfrastructureStack'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { Info, CheckSquare, Package, CheckCircle, ShieldAlert, GitMerge } from 'lucide-react'
import { ExportableArtifact } from '../../../common/executive'

function resolveProductNames(keys: string[]): SoftwareItem[] {
  const keySet = new Set(keys)
  return softwareData.filter((s) => keySet.has(s.productId))
}

function renderPqcBadge(support: string) {
  const lower = (support || '').toLowerCase()
  let badgeClass: string
  if (lower.startsWith('yes')) {
    badgeClass = 'bg-status-success text-status-success'
  } else if (lower.startsWith('partial') || lower.startsWith('limited')) {
    badgeClass = 'bg-status-warning text-status-warning'
  } else if (lower.startsWith('planned') || lower.startsWith('in progress')) {
    badgeClass = 'bg-primary/10 text-primary border-primary/20'
  } else {
    badgeClass = 'bg-destructive/10 text-destructive border-destructive/20'
  }
  return (
    <span
      className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full border ${badgeClass}`}
    >
      {support || 'Unknown'}
    </span>
  )
}

function renderFipsBadge(status: string) {
  const lower = (status || '').toLowerCase()
  const isFipsCertified =
    lower.startsWith('yes') ||
    lower === 'validated' ||
    (lower.includes('fips 140') && !lower.startsWith('no'))
  const isPartial = !isFipsCertified && lower.includes('partial')

  if (isFipsCertified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-status-success text-status-success">
        <CheckCircle size={9} /> FIPS
      </span>
    )
  }
  if (isPartial) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-status-warning text-status-warning">
        <ShieldAlert size={9} /> Partial
      </span>
    )
  }
  return null
}

function isHybridProduct(item: SoftwareItem): boolean {
  const desc = (item.pqcCapabilityDescription || '').toLowerCase()
  const support = (item.pqcSupport || '').toLowerCase()
  return desc.includes('hybrid') || support.includes('hybrid')
}

function getStatColor(count: number, total: number): string {
  if (total === 0) return 'text-muted-foreground'
  const pct = (count / total) * 100
  if (pct >= 75) return 'text-status-success'
  if (pct >= 50) return 'text-status-warning'
  return 'text-status-error'
}

function getBarColor(count: number, total: number): string {
  if (total === 0) return 'bg-muted'
  const pct = (count / total) * 100
  if (pct >= 75) return 'bg-status-success'
  if (pct >= 50) return 'bg-status-warning'
  return 'bg-status-error'
}

interface StatBadgeProps {
  label: string
  count: number
  total: number
  isGap?: boolean
}

const StatBadge: React.FC<StatBadgeProps> = ({ label, count, total, isGap }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const colorClass = isGap
    ? count === 0
      ? 'text-status-success'
      : 'text-status-error'
    : getStatColor(count, total)
  const barClass = isGap
    ? count === 0
      ? 'bg-status-success'
      : 'bg-status-error'
    : getBarColor(count, total)
  const barWidth = isGap ? (total > 0 ? Math.round((count / total) * 100) : 0) : pct

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className={`text-sm font-semibold tabular-nums ${colorClass}`}>
          {isGap ? (count > 0 ? count : 'None') : `${count}/${total}`}
        </span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barClass}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  )
}

// Lookup map for LAYERS by id
const LAYER_MAP = new Map(LAYERS.map((l) => [l.id, l]))

export const SupplyChainRiskMatrix: React.FC = () => {
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const { vendorsByLayer, fipsValidatedCount, pqcReadyCount, totalProducts, industry, country } =
    useExecutiveModuleData(myProducts.length > 0 ? myProducts : undefined)
  const { addExecutiveDocument } = useModuleStore()

  const selectedItems = useMemo(
    () => (myProducts.length > 0 ? resolveProductNames(myProducts) : []),
    [myProducts]
  )

  const layerStats = useMemo(() => {
    const stats: {
      layerId: string
      products: SoftwareItem[]
      total: number
      pqcReady: number
      fipsValidated: number
      hybridSupport: number
    }[] = []

    // Ordered layers from LAYERS constant first
    const orderedIds = LAYERS.map((l) => l.id)
    // Add any extra layer IDs not in LAYERS
    const extraIds = Array.from(vendorsByLayer.keys())
      .filter((id) => !LAYER_MAP.has(id))
      .sort()
    const allIds = [...orderedIds, ...extraIds]

    for (const layerId of allIds) {
      const products = vendorsByLayer.get(layerId)
      if (!products || products.length === 0) continue

      const total = products.length
      const pqcReady = products.filter(
        (p) => p.pqcSupport && p.pqcSupport !== 'None' && p.pqcSupport !== 'No'
      ).length
      const fipsValid = products.filter((p) => {
        const s = (p.fipsValidated || '').toLowerCase()
        return (
          s.startsWith('yes') ||
          s === 'validated' ||
          (s.includes('fips 140') && !s.startsWith('no'))
        )
      }).length
      const hybrid = products.filter((p) => {
        const desc = (p.pqcCapabilityDescription || '').toLowerCase()
        const support = (p.pqcSupport || '').toLowerCase()
        return desc.includes('hybrid') || support.includes('hybrid')
      }).length

      stats.push({
        layerId,
        products,
        total,
        pqcReady,
        fipsValidated: fipsValid,
        hybridSupport: hybrid,
      })
    }

    return stats
  }, [vendorsByLayer])

  const overallPqcPct = totalProducts > 0 ? Math.round((pqcReadyCount / totalProducts) * 100) : 0
  const overallFipsPct =
    totalProducts > 0 ? Math.round((fipsValidatedCount / totalProducts) * 100) : 0

  const exportMarkdown = useMemo(() => {
    let md = '# Supply Chain PQC Risk Matrix\n\n'
    md += `**Generated:** ${new Date().toLocaleDateString()}\n`
    if (industry) md += `**Industry:** ${industry}\n`
    if (country) md += `**Country:** ${country}\n`
    md += `**Products Analyzed:** ${totalProducts}\n\n`

    md += '## Summary\n\n'
    md += `| Metric | Value |\n|--------|-------|\n`
    md += `| PQC Ready | ${overallPqcPct}% (${pqcReadyCount}/${totalProducts}) |\n`
    md += `| FIPS Validated | ${overallFipsPct}% (${fipsValidatedCount}/${totalProducts}) |\n`
    md += `| Infrastructure Layers | ${layerStats.length} |\n\n`

    md += '## Layer Breakdown\n\n'
    for (const stat of layerStats) {
      const layerDef = LAYER_MAP.get(stat.layerId)
      const label = layerDef?.label ?? stat.layerId
      const gapCount = stat.total - stat.pqcReady
      md += `### ${label} (${stat.total} products)\n\n`
      md += `| Metric | Count | % |\n|--------|-------|---|\n`
      md += `| PQC Ready | ${stat.pqcReady} | ${stat.total > 0 ? Math.round((stat.pqcReady / stat.total) * 100) : 0}% |\n`
      md += `| FIPS Validated | ${stat.fipsValidated} | ${stat.total > 0 ? Math.round((stat.fipsValidated / stat.total) * 100) : 0}% |\n`
      md += `| Hybrid Support | ${stat.hybridSupport} | ${stat.total > 0 ? Math.round((stat.hybridSupport / stat.total) * 100) : 0}% |\n`
      md += `| PQC Gap | ${gapCount} | ${stat.total > 0 ? Math.round((gapCount / stat.total) * 100) : 0}% |\n\n`
    }

    return md
  }, [
    industry,
    country,
    totalProducts,
    overallPqcPct,
    pqcReadyCount,
    overallFipsPct,
    fipsValidatedCount,
    layerStats,
  ])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `supply-chain-matrix-${Date.now()}`,
      moduleId: 'vendor-risk',
      type: 'supply-chain-matrix',
      title: `Supply Chain Risk Matrix (${overallPqcPct}% PQC Ready)`,
      data: exportMarkdown,
      createdAt: Date.now(),
    })
  }, [addExecutiveDocument, overallPqcPct, exportMarkdown])

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-foreground/80">
          This view maps {myProducts.length > 0 ? 'your selected' : ''} product capabilities across
          infrastructure layers using real data from the migration catalog. Each layer card shows
          PQC readiness, FIPS validation status, hybrid support, and gaps requiring vendor
          engagement.
        </p>
      </div>

      {selectedItems.length > 0 ? (
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare size={14} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              Mapping {selectedItems.length} selected product
              {selectedItems.length !== 1 ? 's' : ''} across your infrastructure
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedItems.map((item) => (
              <span
                key={item.productId}
                className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground"
              >
                {item.softwareName}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3 border border-border">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>
            Showing all catalog products. Select your infrastructure in Step 1 for personalized
            results.
          </span>
        </div>
      )}

      {/* Layer cards */}
      <div className="space-y-4">
        {layerStats.map((stat) => {
          const layerDef = LAYER_MAP.get(stat.layerId)
          const Icon = layerDef?.icon ?? Package
          const borderColor = layerDef?.borderColor ?? 'border-border'
          const iconColor = layerDef?.iconColor ?? 'text-muted-foreground'
          const label = layerDef?.label ?? stat.layerId
          const gapCount = stat.total - stat.pqcReady

          return (
            <div key={stat.layerId} className="glass-panel p-4">
              {/* Layer header — matches InfrastructureSelector pattern */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-muted/20 border ${borderColor} ${iconColor}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground">{label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {stat.total} product{stat.total !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Readiness stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatBadge label="PQC Ready" count={stat.pqcReady} total={stat.total} />
                <StatBadge label="FIPS Validated" count={stat.fipsValidated} total={stat.total} />
                <StatBadge label="Hybrid Support" count={stat.hybridSupport} total={stat.total} />
                <StatBadge label="Gap" count={gapCount} total={stat.total} isGap />
              </div>

              {/* Per-product detail */}
              <div className="space-y-1 mt-3 pt-3 border-t border-border/50">
                {stat.products.map((item) => (
                  <div key={item.productId} className="flex items-center gap-2 py-1.5 px-2 rounded">
                    <span className="text-sm text-foreground truncate min-w-0">
                      {item.softwareName}
                    </span>
                    {renderPqcBadge(item.pqcSupport)}
                    {renderFipsBadge(item.fipsValidated)}
                    {isHybridProduct(item) && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        <GitMerge size={9} /> Hybrid
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Products Tracked</p>
          <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">
            across {layerStats.length} infrastructure layers
          </p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">PQC Ready</p>
          <p
            className={`text-3xl font-bold ${overallPqcPct >= 50 ? 'text-status-success' : 'text-status-warning'}`}
          >
            {overallPqcPct}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {pqcReadyCount} of {totalProducts} products
          </p>
        </div>
        <div className="glass-panel p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">FIPS Validated</p>
          <p
            className={`text-3xl font-bold ${overallFipsPct >= 50 ? 'text-status-success' : 'text-status-warning'}`}
          >
            {overallFipsPct}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {fipsValidatedCount} of {totalProducts} products
          </p>
        </div>
      </div>

      {/* Export */}
      <ExportableArtifact
        title="Supply Chain Risk Matrix — Export"
        exportData={exportMarkdown}
        filename="supply-chain-risk-matrix"
        formats={['markdown']}
        onExport={handleExport}
      >
        <p className="text-sm text-muted-foreground">
          Export the supply chain risk analysis as a shareable document.
        </p>
      </ExportableArtifact>
    </div>
  )
}
