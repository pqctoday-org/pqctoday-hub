// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useCallback, useState } from 'react'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'
import { useModuleStore } from '@/store/useModuleStore'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import { useSelectedProductIds } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { vendorMap } from '@/data/vendorData'
import { LAYERS } from '@/components/Migrate/InfrastructureStack'
import { softwareItemToCbomInput } from '@/components/Migrate/cbomExport'
import { buildCbomDocument, downloadCbomJson } from '@/services/cbom/cycloneDx'
import { isPqcReady, isFips1403Validated } from '@/data/kpiCatalog'
import {
  HeatmapGrid,
  type HeatmapCell,
} from '@/components/PKILearning/common/executive/HeatmapGrid'
import type { SoftwareItem } from '@/types/MigrateTypes'
import type { ScorecardOutput } from './VendorScorecardBuilder'
import {
  Info,
  CheckSquare,
  Package,
  CheckCircle,
  ShieldAlert,
  GitMerge,
  Download,
  Link2,
  ChevronDown,
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

interface SavedSupplyChainInputs {
  pipelineSources?: string
  refreshCadence?: string
  cmdbMapping?: string
}

// --- Likelihood × Impact matrix (mirrors RiskHeatmapGenerator's grid pattern) ---

const MATRIX_LIKELIHOOD_LABELS = ['Almost Certain', 'Likely', 'Possible', 'Unlikely', 'Rare']
const MATRIX_IMPACT_LABELS = ['Negligible', 'Minor', 'Moderate', 'Major', 'Critical']

/** Bucket a 0..1 fraction into a 1 (lowest) – 5 (highest) matrix level. */
function toMatrixLevel(fraction: number): number {
  if (fraction <= 0) return 1
  return Math.min(5, Math.max(1, Math.ceil(fraction * 5)))
}

function isCriticalOrHighPriority(priority: string): boolean {
  const p = (priority || '').toLowerCase()
  return p === 'critical' || p === 'high'
}

function matrixRiskLevel(score: number): 'Critical' | 'High' | 'Medium' | 'Low' {
  if (score >= 20) return 'Critical'
  if (score >= 12) return 'High'
  if (score >= 6) return 'Medium'
  return 'Low'
}

function matrixBadgeClasses(score: number): string {
  if (score >= 20) return 'bg-status-error/10 text-status-error border-status-error/20'
  if (score >= 12) return 'bg-status-warning/10 text-status-warning border-status-warning/20'
  if (score >= 6) return 'bg-primary/10 text-primary border-primary/20'
  return 'bg-status-success/10 text-status-success border-status-success/20'
}

interface LayerMatrixEntry {
  layerId: string
  label: string
  likelihood: number
  impact: number
  score: number
}

/** Minimum name length before a provider's product name is used as a text-match
 *  signal — short names (e.g. "AES") would otherwise false-positive constantly. */
const DEPENDENCY_NAME_MIN_LENGTH = 5

interface DependencyRelation {
  provider: SoftwareItem
  dependents: SoftwareItem[]
}

/** Real (not fabricated) product-to-product dependency signal: a consumer product's
 *  own catalog description/brief mentioning a Library- or Hardware-layer product by
 *  name (e.g. "BoringSSL" mentioning "OpenSSL", "Thales payShield 10K" mentioning
 *  "Thales Luna HSM"). Grounded entirely in existing SoftwareItem text fields. */
function buildDependencyRelations(
  providers: SoftwareItem[],
  consumers: SoftwareItem[]
): DependencyRelation[] {
  const seenProviders = new Map<string, SoftwareItem>()
  for (const p of providers) {
    if (!seenProviders.has(p.productId)) seenProviders.set(p.productId, p)
  }

  const relations: DependencyRelation[] = []
  for (const provider of seenProviders.values()) {
    const name = (provider.softwareName || '').trim()
    if (name.length < DEPENDENCY_NAME_MIN_LENGTH) continue
    const needle = name.toLowerCase()
    const dependents = consumers.filter((c) => {
      if (c.productId === provider.productId) return false
      const haystack = `${c.pqcCapabilityDescription || ''} ${c.productBrief || ''}`.toLowerCase()
      return haystack.includes(needle)
    })
    if (dependents.length > 0) relations.push({ provider, dependents })
  }
  return relations.sort((a, b) => b.dependents.length - a.dependents.length)
}

function buildLayerEntriesMap(entries: LayerMatrixEntry[]): Map<string, LayerMatrixEntry[]> {
  const map = new Map<string, LayerMatrixEntry[]>()
  for (const e of entries) {
    const rowIdx = 5 - e.likelihood
    const colIdx = e.impact - 1
    const key = `${rowIdx}-${colIdx}`
    const existing = map.get(key)
    if (existing) existing.push(e)
    else map.set(key, [e])
  }
  return map
}

/** 5×5 likelihood × impact grid — plots infrastructure layers instead of
 *  individual risks, on top of the shared `HeatmapGrid` component (the same
 *  one `RiskHeatmapGenerator` is grounded in conceptually) rather than a
 *  hand-rolled table. */
function SupplyChainRiskGrid({ entriesMap }: { entriesMap: Map<string, LayerMatrixEntry[]> }) {
  const rows = MATRIX_LIKELIHOOD_LABELS.map((label, rowIdx) => `${5 - rowIdx} · ${label}`)
  const columns = MATRIX_IMPACT_LABELS.map((label, colIdx) => `${colIdx + 1} · ${label}`)
  const cells: HeatmapCell[][] = MATRIX_LIKELIHOOD_LABELS.map((_, rowIdx) => {
    const likelihood = 5 - rowIdx
    return MATRIX_IMPACT_LABELS.map((_, colIdx) => {
      const impact = colIdx + 1
      const score = likelihood * impact
      const cellEntries = entriesMap.get(`${rowIdx}-${colIdx}`) ?? []
      return {
        value: (score / 25) * 100,
        labels: cellEntries.map((e) => e.label),
        tooltip: `Score ${score} (${matrixRiskLevel(score)})`,
      }
    })
  })
  return <HeatmapGrid rows={rows} columns={columns} cells={cells} colorScale="risk" />
}

export const SupplyChainRiskMatrix: React.FC<{
  scorecardOutput?: ScorecardOutput | null
  /** 'glass' (default) matches this component's home in the Learn-module vendor-
   *  risk wizard. Migrate's asset-first workbench uses flat cards everywhere
   *  else, so it mounts this with 'flat' instead of a global restyle. */
  variant?: 'glass' | 'flat'
}> = ({ scorecardOutput, variant = 'glass' }) => {
  const cardClass = (extra = '') =>
    variant === 'flat'
      ? `rounded-xl border border-border bg-card ${extra}`.trim()
      : `glass-panel ${extra}`.trim()
  const [docsOpen, setDocsOpen] = useState(false)
  const myProducts = useSelectedProductIds()
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

  // CSWP.39 §5.3 educational extensions: CBOM by asset class + pipeline metadata.
  const savedInputs = useSavedArtifactInputs<SavedSupplyChainInputs>('supply-chain-matrix')
  const [pipelineSources, setPipelineSources] = useState(savedInputs?.pipelineSources ?? '')
  // No silent pre-fill — the input shows a placeholder of suggested cadences instead.
  const [refreshCadence, setRefreshCadence] = useState(savedInputs?.refreshCadence ?? '')
  const [cmdbMapping, setCmdbMapping] = useState(savedInputs?.cmdbMapping ?? '')

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
      criticalHigh: number
      /** 1 (lowest) – 5 (highest) chance the layer's un-migrated products are
       *  exploited before migration completes, from the share of the layer
       *  that isn't PQC-ready yet (the existing gap-count calc). */
      likelihood: number
      /** 1 (lowest) – 5 (highest) blast radius if that happens, from the share
       *  of the layer's products flagged Critical/High migration priority. */
      impact: number
      riskScore: number
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
      const pqcReady = products.filter((p) => isPqcReady(p.pqcSupport)).length
      const fipsValid = products.filter((p) => isFips1403Validated(p.fipsValidated)).length
      const hybrid = products.filter((p) => {
        const desc = (p.pqcCapabilityDescription || '').toLowerCase()
        const support = (p.pqcSupport || '').toLowerCase()
        return desc.includes('hybrid') || support.includes('hybrid')
      }).length
      const criticalHigh = products.filter((p) =>
        isCriticalOrHighPriority(p.pqcMigrationPriority)
      ).length

      const gapCount = total - pqcReady
      const likelihood = toMatrixLevel(total > 0 ? gapCount / total : 0)
      const impact = toMatrixLevel(total > 0 ? criticalHigh / total : 0)

      stats.push({
        layerId,
        products,
        total,
        pqcReady,
        fipsValidated: fipsValid,
        hybridSupport: hybrid,
        criticalHigh,
        likelihood,
        impact,
        riskScore: likelihood * impact,
      })
    }

    return stats
  }, [vendorsByLayer])

  const matrixEntries = useMemo<LayerMatrixEntry[]>(
    () =>
      layerStats.map((stat) => ({
        layerId: stat.layerId,
        label: LAYER_MAP.get(stat.layerId)?.label ?? stat.layerId,
        likelihood: stat.likelihood,
        impact: stat.impact,
        score: stat.riskScore,
      })),
    [layerStats]
  )
  const matrixEntriesMap = useMemo(() => buildLayerEntriesMap(matrixEntries), [matrixEntries])

  // Real product-to-product dependencies: Library/Hardware-layer products
  // ("providers") that other catalog products ("consumers") reference by name
  // in their own description/brief text.
  const dependencyRelations = useMemo(() => {
    const providers = [
      ...(vendorsByLayer.get('Libraries') ?? []),
      ...(vendorsByLayer.get('Hardware') ?? []),
    ]
    const consumers =
      selectedItems.length > 0 ? selectedItems : Array.from(vendorsByLayer.values()).flat()
    return buildDependencyRelations(providers, consumers)
  }, [vendorsByLayer, selectedItems])

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
      md += `| PQC Gap | ${gapCount} | ${stat.total > 0 ? Math.round((gapCount / stat.total) * 100) : 0}% |\n`
      md += `| Critical/High Priority | ${stat.criticalHigh} | ${stat.total > 0 ? Math.round((stat.criticalHigh / stat.total) * 100) : 0}% |\n`
      md += `| Likelihood × Impact | ${stat.likelihood} × ${stat.impact} | Score ${stat.riskScore} (${matrixRiskLevel(stat.riskScore)}) |\n\n`
    }

    md += '## Likelihood × Impact Risk Matrix\n\n'
    md +=
      '_Likelihood derives from the share of each layer not yet PQC-ready; impact derives from the share flagged Critical/High migration priority._\n\n'
    md += '| Layer | Likelihood (1-5) | Impact (1-5) | Score | Level |\n|---|---|---|---|---|\n'
    for (const entry of [...matrixEntries].sort((a, b) => b.score - a.score)) {
      md += `| ${entry.label} | ${entry.likelihood} | ${entry.impact} | ${entry.score} | ${matrixRiskLevel(entry.score)} |\n`
    }
    md += '\n'

    md += '## Product Dependencies\n\n'
    if (dependencyRelations.length === 0) {
      md +=
        '_No text-detected dependencies between catalog products in this view (a consumer product must reference a Library/Hardware-layer product by name in its own description)._\n\n'
    } else {
      md += '| Library / HSM | Depended on by |\n|---|---|\n'
      for (const rel of dependencyRelations) {
        md += `| ${rel.provider.softwareName} | ${rel.dependents.map((d) => d.softwareName).join(', ')} |\n`
      }
      md += '\n'
    }

    // CSWP.39 §5.3 — CBOM grouped by 6 asset classes.
    md += '## CBOM (CSWP.39 §5.3 — 6 asset classes)\n\n'
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
        const vendorName =
          (item.vendorId && vendorMap.get(item.vendorId)?.vendorName) || item.vendorId || '—'
        md += `| ${item.softwareName} | ${vendorName} | ${item.pqcSupport || 'Unknown'} | ${item.fipsValidated || '—'} |\n`
      }
      md += '\n'
    }

    // CSWP.39 §5.3 — Pipeline + Refresh + CMDB metadata.
    md += '## Pipeline Sources (CSWP.39 §5.3)\n\n'
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
    matrixEntries,
    dependencyRelations,
    cbomBuckets,
    pipelineSources,
    refreshCadence,
    cmdbMapping,
  ])

  // A real, schema-valid CycloneDX 1.6 CBOM (shared emitter). Each product maps
  // through the same SoftwareItem adapter the Migrate export uses, tagged with its
  // CSWP.39 asset class; PQC algorithms surface as `cryptographic-asset` children
  // carrying `cryptoProperties` (the part the old inline JSON was missing).
  const cbomResult = useMemo(() => {
    const inputs = (Object.keys(cbomBuckets) as CSWP39AssetClass[]).flatMap((cls) =>
      cbomBuckets[cls].map((item) =>
        softwareItemToCbomInput(item, [{ name: 'cswp39:assetClass', value: cls }])
      )
    )
    return buildCbomDocument(inputs, {
      toolName: 'PQC Today Supply-Chain CBOM',
      properties: [
        ...(industry ? [{ name: 'industry', value: industry }] : []),
        ...(country ? [{ name: 'country', value: country }] : []),
      ],
    })
  }, [cbomBuckets, industry, country])

  const handleDownloadCbomJson = useCallback(() => {
    downloadCbomJson(cbomResult.json, 'cbom-cyclonedx')
  }, [cbomResult])

  const handleExport = useCallback(() => {
    addExecutiveDocument({
      id: `supply-chain-matrix-${Date.now()}`,
      moduleId: 'vendor-risk',
      type: 'supply-chain-matrix',
      title: `Supply Chain Risk Matrix (${overallPqcPct}% PQC Ready)`,
      data: exportMarkdown,
      inputs: { pipelineSources, refreshCadence, cmdbMapping },
      createdAt: Date.now(),
    })
  }, [
    addExecutiveDocument,
    overallPqcPct,
    exportMarkdown,
    pipelineSources,
    refreshCadence,
    cmdbMapping,
  ])

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
        <PreFilledBanner summary={`Matrix derived from ${seedSources.join(' + ')}.`} />
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

      {/* Scorecard import summary from Step 2 — only ever reachable when a caller
          passes scorecardOutput (the Learn-module wizard); Migrate's workbench
          mounts this with none, so this whole block stays dead code there. */}
      {scorecardOutput && scorecardOutput.rows.length > 0 && (
        <div className={cardClass('p-4')}>
          <PreFilledBanner
            summary={`Vendor data imported from Step 2 scorecard — ${scorecardOutput.rows.length} vendor${scorecardOutput.rows.length !== 1 ? 's' : ''}.`}
          />
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-1.5 pr-3 font-medium">Vendor</th>
                  <th className="py-1.5 px-2 font-medium text-center">Products</th>
                  <th className="py-1.5 px-2 font-medium text-center">Readiness Score</th>
                  <th className="py-1.5 px-2 font-medium text-center">Level</th>
                </tr>
              </thead>
              <tbody>
                {scorecardOutput.rows.map((row) => {
                  const isLow = row.overall < 50
                  const scoreColor =
                    row.overall >= 75
                      ? 'text-status-success'
                      : row.overall >= 50
                        ? 'text-status-warning'
                        : 'text-status-error'
                  return (
                    <tr key={row.vendor} className="border-b border-border/50">
                      <td className="py-1.5 pr-3 text-foreground">{row.vendor}</td>
                      <td className="py-1.5 px-2 text-center text-muted-foreground">
                        {row.productCount}
                      </td>
                      <td className={`py-1.5 px-2 text-center font-bold ${scoreColor}`}>
                        {row.overall}/100
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                            isLow
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : row.overall >= 75
                                ? 'bg-status-success/10 text-status-success border-status-success/20'
                                : 'bg-status-warning/10 text-status-warning border-status-warning/20'
                          }`}
                        >
                          {isLow ? 'Low' : row.overall >= 75 ? 'High' : 'Medium'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Likelihood × Impact Risk Matrix */}
      <div className={cardClass('p-4')}>
        <h3 className="text-base font-semibold text-foreground mb-1">
          Supply Chain Risk Matrix (Likelihood × Impact)
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Each infrastructure layer plotted by <strong>likelihood</strong> (share of the layer not
          yet PQC-ready) × <strong>impact</strong> (share flagged Critical/High migration priority).
          Top-right is worst.
        </p>
        <div className="flex items-start gap-2">
          <div className="flex items-center justify-center w-5 shrink-0 self-center">
            <span
              className="text-[10px] font-bold text-muted-foreground whitespace-nowrap tracking-widest"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              LIKELIHOOD
            </span>
          </div>
          <div className="flex-1 space-y-1">
            <SupplyChainRiskGrid entriesMap={matrixEntriesMap} />
            <div className="text-center">
              <span className="text-[10px] font-bold text-muted-foreground tracking-widest">
                IMPACT
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Dependencies */}
      {dependencyRelations.length > 0 && (
        <div className={cardClass('p-4')}>
          <div className="flex items-center gap-2 mb-1">
            <Link2 size={16} className="text-primary" />
            <h3 className="text-base font-semibold text-foreground">Product Dependencies</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Library/HSM products referenced by name in another product&apos;s own catalog
            description — a real (if partial) dependency signal, not an asset-class grouping. A
            vulnerable library or HSM here is a single point of failure for every product listed.
          </p>
          <div className="space-y-2">
            {dependencyRelations.map((rel) => (
              <div
                key={rel.provider.productId}
                className="rounded-md border border-border bg-muted/30 p-2"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">
                    {rel.provider.softwareName}
                  </span>
                  {renderPqcBadge(rel.provider.pqcSupport)}
                  <span className="text-xs text-muted-foreground">
                    depended on by {rel.dependents.length}{' '}
                    {rel.dependents.length === 1 ? 'product' : 'products'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {rel.dependents.map((d) => (
                    <span
                      key={d.productId}
                      className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground"
                    >
                      {d.softwareName}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
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

          return (
            <div key={stat.layerId} className={cardClass('p-4')}>
              {/* Layer header — matches InfrastructureSelector pattern */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-muted/20 border ${borderColor} ${iconColor}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">{label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {stat.total} product{stat.total !== 1 ? 's' : ''}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border font-medium shrink-0 ${matrixBadgeClasses(stat.riskScore)}`}
                  title={`Likelihood ${stat.likelihood}/5 × Impact ${stat.impact}/5`}
                >
                  {matrixRiskLevel(stat.riskScore)} risk ({stat.riskScore})
                </span>
              </div>

              {/* Readiness stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatBadge label="PQC Ready" count={stat.pqcReady} total={stat.total} />
                <StatBadge label="FIPS Validated" count={stat.fipsValidated} total={stat.total} />
                <StatBadge label="Hybrid Support" count={stat.hybridSupport} total={stat.total} />
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
        <div className={cardClass('p-4 text-center')}>
          <p className="text-sm text-muted-foreground mb-1">Total Products Tracked</p>
          <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">
            across {layerStats.length} infrastructure layers
          </p>
        </div>
        <div className={cardClass('p-4 text-center')}>
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
        <div className={cardClass('p-4 text-center')}>
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

      {/* CSWP.39 §5.3 — CBOM by 6 asset classes */}
      <div className={cardClass('p-4')}>
        <h3 className="text-base font-semibold text-foreground mb-1">
          CBOM — CSWP.39 §5.3 (6 asset classes)
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
            Download CBOM JSON (CycloneDX 1.6)
          </Button>
        </div>
      </div>

      {/* CSWP.39 §5.3 — Pipeline + Refresh + CMDB metadata. Collapsed by default
          (fix #12) — optional documentation, not required to use the matrix. */}
      <div className={cardClass('p-4')}>
        <Button
          variant="ghost"
          onClick={() => setDocsOpen((v) => !v)}
          aria-expanded={docsOpen}
          className="flex h-auto w-full items-start justify-between gap-3 whitespace-normal p-0 text-left font-normal"
        >
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Document your pipeline (optional)
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Note the upstream sources that keep the CBOM fresh and the cadence at which they
              refresh it. Educational only — these notes export with the artifact below.
            </p>
          </div>
          <ChevronDown
            size={16}
            className={`mt-1 shrink-0 text-muted-foreground transition-transform ${docsOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </Button>
        {docsOpen && (
          <div className="mt-3 space-y-3">
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
        )}
      </div>

      {/* Export */}
      <ExportableArtifact
        title="Supply Chain Risk Matrix - Export"
        exportData={exportMarkdown}
        filename="supply-chain-risk-matrix"
        formats={['markdown', 'pdf']}
        onExport={handleExport}
        wideTable
      >
        <p className="text-sm text-muted-foreground">
          Export the supply chain risk analysis as a shareable document. Includes CBOM by asset
          class, pipeline sources, refresh cadence, and CMDB mapping.
        </p>
      </ExportableArtifact>
    </div>
  )
}
