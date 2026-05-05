// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useState } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useModuleStore } from '@/store/useModuleStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { LAYERS } from '@/components/Migrate/InfrastructureStack'
import type { SoftwareItem } from '@/types/MigrateTypes'
import {
  Info,
  CheckSquare,
  Package,
  CheckCircle,
  ShieldAlert,
  GitMerge,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExportableArtifact } from '../../../common/executive'

// CSWP.39 6 asset classes
type CSWP39AssetClass = 'Code' | 'Library' | 'Application' | 'File' | 'Protocol' | 'System'

function mapToAssetClass(item: SoftwareItem): CSWP39AssetClass {
  const cat = (item.categoryName || '').toLowerCase()
  if (
    cat.includes('cryptographic library') ||
    cat.includes('cryptographic sdk') ||
    cat.includes('jwt librar') ||
    cat.includes('cryptographic software/librar')
  )
    return 'Library'
  if (
    cat.includes('code signing') ||
    cat.includes('ci/cd') ||
    cat.includes('software integrity') ||
    cat.includes('artifact management')
  )
    return 'Code'
  if (
    cat.includes('database encryption') ||
    cat.includes('data storage') ||
    cat.includes('data security')
  )
    return 'File'
  if (
    cat.includes('gateway') ||
    cat.includes('tls') ||
    cat.includes('dns') ||
    cat.includes('cdn') ||
    cat.includes('edge security') ||
    cat.includes('telecom') ||
    cat.includes('5g') ||
    cat.includes('service mesh') ||
    cat.includes('vpn') ||
    cat.includes('networking')
  )
    return 'Protocol'
  if (
    cat.includes('application server') ||
    cat.includes('web software') ||
    cat.includes('collaboration') ||
    cat.includes('developer platform') ||
    cat.includes('digital signature software') ||
    cat.includes('ai/ml')
  )
    return 'Application'
  return 'System'
}

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
  const {
    vendorsByLayer,
    fipsValidatedCount,
    pqcReadyCount,
    totalProducts,
    industry,
    country,
    industryThreats,
  } = useExecutiveModuleData(myProducts.length > 0 ? myProducts : undefined)
  const { addExecutiveDocument } = useModuleStore()

  const selectedItems = useMemo(
    () => (myProducts.length > 0 ? resolveProductNames(myProducts) : []),
    [myProducts]
  )

  // CSWP.39 §5.2 educational extensions: CBOM by asset class + pipeline metadata.
  const [pipelineSources, setPipelineSources] = useState('')
  const [refreshCadence, setRefreshCadence] = useState('Quarterly')
  const [cmdbMapping, setCmdbMapping] = useState('')

  const cbomBuckets = useMemo(() => {
    const source: SoftwareItem[] =
      selectedItems.length > 0 ? selectedItems : Array.from(vendorsByLayer.values()).flat()
    const buckets: Record<CSWP39AssetClass, SoftwareItem[]> = {
      Code: [],
      Library: [],
      Application: [],
      File: [],
      Protocol: [],
      System: [],
    }
    for (const item of source) {
      buckets[mapToAssetClass(item)].push(item)
    }
    return buckets
  }, [selectedItems, vendorsByLayer])

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

    // CSWP.39 §5.2 — CBOM grouped by 6 asset classes.
    md += '## CBOM (CSWP.39 §5.2 — 6 asset classes)\n\n'
    const classOrder: CSWP39AssetClass[] = [
      'Code',
      'Library',
      'Application',
      'File',
      'Protocol',
      'System',
    ]
    for (const cls of classOrder) {
      const items = cbomBuckets[cls]
      md += `### ${cls} (${items.length})\n\n`
      if (items.length === 0) {
        md += '_No products mapped to this asset class._\n\n'
        continue
      }
      md += `| Product | Vendor | PQC Support | FIPS |\n|---|---|---|---|\n`
      for (const item of items) {
        md += `| ${item.softwareName} | ${item.vendorId ?? '—'} | ${item.pqcSupport || 'Unknown'} | ${item.fipsValidated || '—'} |\n`
      }
      md += '\n'
    }

    // CSWP.39 §5.2 — Pipeline + Refresh + CMDB metadata.
    md += '## Pipeline Sources (CSWP.39 §5.2)\n\n'
    md += pipelineSources.trim() || '_No upstream SBOM/CMDB sources documented yet._'
    md += '\n\n'

    md += '## Refresh Cadence\n\n'
    md += `**Target cadence:** ${refreshCadence || 'Not specified'}\n\n`

    md += '## CMDB → CBOM Mapping\n\n'
    md += cmdbMapping.trim() || '_No CMDB-to-CBOM mapping documented yet._'
    md += '\n\n'

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
    cbomBuckets,
    pipelineSources,
    refreshCadence,
    cmdbMapping,
  ])

  const cbomJson = useMemo(() => {
    // Minimal CycloneDX-shaped CBOM (educational, not spec-complete).
    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.6',
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        component: { type: 'application', name: 'PQC Today CBOM Export' },
        properties: [
          ...(industry ? [{ name: 'industry', value: industry }] : []),
          ...(country ? [{ name: 'country', value: country }] : []),
        ],
      },
      components: (Object.keys(cbomBuckets) as CSWP39AssetClass[]).flatMap((cls) =>
        cbomBuckets[cls].map((item) => ({
          type: 'cryptographic-asset',
          name: item.softwareName,
          publisher: item.vendorId ?? undefined,
          version: item.latestVersion || undefined,
          properties: [
            { name: 'cswp39:assetClass', value: cls },
            { name: 'cswp39:pqcSupport', value: item.pqcSupport || 'Unknown' },
            { name: 'cswp39:fipsValidated', value: item.fipsValidated || 'Unknown' },
            ...(item.infrastructureLayer
              ? [{ name: 'pqctoday:infrastructureLayer', value: item.infrastructureLayer }]
              : []),
            ...(item.categoryName
              ? [{ name: 'pqctoday:categoryName', value: item.categoryName }]
              : []),
          ],
        }))
      ),
    }
  }, [cbomBuckets, industry, country])

  const handleDownloadCbomJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(cbomJson, null, 2)], {
      type: 'application/vnd.cyclonedx+json',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cbom-${Date.now()}.cdx.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [cbomJson])

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

  // Filter industry threats to supply-chain–relevant ones. We keyword-match
  // the threat description and threatId for terms tied to the supply-chain
  // attack surface (vendor backdoors, third-party components, software
  // supply, CBOM gaps, etc.) so the banner count accurately reflects
  // what's surfaced — not a generic industry-threat tally.
  const supplyChainThreats = useMemo(() => {
    const KEYWORDS =
      /(supply[- ]?chain|vendor|third[- ]?party|sbom|cbom|component|backdoor|firmware|hsm|library)/i
    return industryThreats.filter(
      (t) =>
        KEYWORDS.test(t.description || '') ||
        KEYWORDS.test(t.threatId || '') ||
        KEYWORDS.test(t.cryptoAtRisk || '')
    )
  }, [industryThreats])

  const seedSources: string[] = []
  if (myProducts.length > 0)
    seedSources.push(
      `${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`
    )
  if (industry) seedSources.push(`industry (${industry})`)
  if (country) seedSources.push(`country (${country})`)
  if (supplyChainThreats.length > 0)
    seedSources.push(
      `${supplyChainThreats.length} supply-chain threat${supplyChainThreats.length !== 1 ? 's' : ''} from your industry`
    )

  return (
    <div className="space-y-6">
      {seedSources.length > 0 && (
        <PreFilledBanner
          summary={`Matrix derived from ${seedSources.join(' + ')}.`}
          onClear={() => {
            /* matrix recomputes from live catalog data; clear is informational */
          }}
        />
      )}
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

      {/* CSWP.39 §5.2 — CBOM by 6 asset classes */}
      <div className="glass-panel p-4">
        <h3 className="text-base font-semibold text-foreground mb-1">
          CBOM — CSWP.39 §5.2 (6 asset classes)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Auto-derived from{' '}
          {selectedItems.length > 0 ? 'your selected products' : 'the full catalog'}. Each product
          is bucketed into one of the six CSWP.39 asset classes (Code / Library / Application / File
          / Protocol / System) using its catalog category.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(['Code', 'Library', 'Application', 'File', 'Protocol', 'System'] as const).map(
            (cls) => (
              <div key={cls} className="rounded-md border border-border bg-muted/30 p-2">
                <div className="text-xs font-semibold text-foreground">{cls}</div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {cbomBuckets[cls].length}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {cbomBuckets[cls].length === 1 ? 'product' : 'products'}
                </div>
              </div>
            )
          )}
        </div>
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={handleDownloadCbomJson}>
            <Download size={14} className="mr-1" />
            Download CBOM JSON (CycloneDX-shaped)
          </Button>
        </div>
      </div>

      {/* CSWP.39 §5.2 — Pipeline + Refresh + CMDB metadata */}
      <div className="glass-panel p-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Inventory Pipeline (CSWP.39 §5.2)
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Document the upstream sources that should keep the CBOM fresh and the cadence at which
            they refresh it. Educational only — these notes export with the artifact below.
          </p>
        </div>
        <div>
          <label
            htmlFor="cswp39-pipeline-sources"
            className="text-xs font-medium text-foreground block mb-1"
          >
            Pipeline sources (SBOM / CMDB / scanners feeding the CBOM)
          </label>
          <textarea
            id="cswp39-pipeline-sources"
            className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[60px]"
            placeholder="e.g., CycloneDX SBOMs from CI; ServiceNow CMDB nightly export; Keyfactor AgileSec scan output"
            value={pipelineSources}
            onChange={(e) => setPipelineSources(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cswp39-refresh-cadence"
            className="text-xs font-medium text-foreground block mb-1"
          >
            Refresh cadence
          </label>
          <Input
            id="cswp39-refresh-cadence"
            type="text"
            placeholder="Daily / Weekly / Quarterly / Annually"
            value={refreshCadence}
            onChange={(e) => setRefreshCadence(e.target.value)}
          />
        </div>
        <div>
          <label
            htmlFor="cswp39-cmdb-mapping"
            className="text-xs font-medium text-foreground block mb-1"
          >
            CMDB → CBOM mapping notes
          </label>
          <textarea
            id="cswp39-cmdb-mapping"
            className="w-full text-sm rounded-md border border-input bg-background p-2 min-h-[60px]"
            placeholder="Which CMDB asset fields map to CBOM fields (asset class, criticality, FIPS status, ESV status)…"
            value={cmdbMapping}
            onChange={(e) => setCmdbMapping(e.target.value)}
          />
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
          Export the supply chain risk analysis as a shareable document. Includes CBOM by asset
          class, pipeline sources, refresh cadence, and CMDB mapping.
        </p>
      </ExportableArtifact>
    </div>
  )
}
