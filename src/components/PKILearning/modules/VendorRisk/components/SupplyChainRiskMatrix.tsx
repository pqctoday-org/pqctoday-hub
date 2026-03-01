// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { HeatmapGrid } from '../../../common/executive'
import type { HeatmapCell } from '../../../common/executive'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'

export const SupplyChainRiskMatrix: React.FC = () => {
  const { vendorsByLayer, fipsValidatedCount, pqcReadyCount, totalProducts } =
    useExecutiveModuleData()

  const { rows, cells, layerStats } = useMemo(() => {
    const layerEntries = Array.from(vendorsByLayer.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    )

    const rowLabels: string[] = []
    const cellData: HeatmapCell[][] = []
    const stats: {
      layer: string
      total: number
      pqcReady: number
      fipsValidated: number
      hybridSupport: number
    }[] = []

    for (const [layer, products] of layerEntries) {
      rowLabels.push(layer)
      const total = products.length

      const pqcReady = products.filter(
        (p) => p.pqcSupport && p.pqcSupport !== 'None' && p.pqcSupport !== 'No'
      ).length

      const fipsValid = products.filter(
        (p) => p.fipsValidated === 'Yes' || p.fipsValidated === 'Validated'
      ).length

      const hybrid = products.filter((p) => {
        const desc = (p.pqcCapabilityDescription || '').toLowerCase()
        const support = (p.pqcSupport || '').toLowerCase()
        return desc.includes('hybrid') || support.includes('hybrid')
      }).length

      const pqcPct = total > 0 ? Math.round((pqcReady / total) * 100) : 0
      const fipsPct = total > 0 ? Math.round((fipsValid / total) * 100) : 0
      const hybridPct = total > 0 ? Math.round((hybrid / total) * 100) : 0

      cellData.push([
        {
          value: pqcPct,
          label: `${pqcReady}/${total}`,
          tooltip: `${layer}: ${pqcReady} of ${total} products PQC-ready (${pqcPct}%)`,
        },
        {
          value: fipsPct,
          label: `${fipsValid}/${total}`,
          tooltip: `${layer}: ${fipsValid} of ${total} products FIPS validated (${fipsPct}%)`,
        },
        {
          value: hybridPct,
          label: `${hybrid}/${total}`,
          tooltip: `${layer}: ${hybrid} of ${total} products support hybrid mode (${hybridPct}%)`,
        },
        {
          value: Math.min(total * 10, 100),
          label: `${total}`,
          tooltip: `${layer}: ${total} total products tracked`,
        },
      ])

      stats.push({ layer, total, pqcReady, fipsValidated: fipsValid, hybridSupport: hybrid })
    }

    return { rows: rowLabels, cells: cellData, layerStats: stats }
  }, [vendorsByLayer])

  const columns = ['PQC Ready', 'FIPS Validated', 'Hybrid Support', 'Total Products']

  const overallPqcPct = totalProducts > 0 ? Math.round((pqcReadyCount / totalProducts) * 100) : 0
  const overallFipsPct =
    totalProducts > 0 ? Math.round((fipsValidatedCount / totalProducts) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-sm text-foreground/80">
          This matrix maps vendor product capabilities across your infrastructure layers using real
          data from the migration catalog. Cell colors reflect readiness levels — green indicates
          strong coverage, red highlights gaps requiring vendor engagement.
        </p>
      </div>

      <HeatmapGrid
        title="Supply Chain PQC Readiness by Infrastructure Layer"
        rows={rows}
        columns={columns}
        cells={cells}
        colorScale="readiness"
      />

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 text-center">
          <p className="text-sm text-muted-foreground mb-1">Total Products Tracked</p>
          <p className="text-3xl font-bold text-foreground">{totalProducts}</p>
          <p className="text-xs text-muted-foreground mt-1">
            across {rows.length} infrastructure layers
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

      {/* Layer Detail Table */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Layer Detail Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Layer</th>
                <th className="text-center p-2 text-muted-foreground font-medium">Products</th>
                <th className="text-center p-2 text-muted-foreground font-medium">PQC Ready</th>
                <th className="text-center p-2 text-muted-foreground font-medium">FIPS</th>
                <th className="text-center p-2 text-muted-foreground font-medium">Hybrid</th>
                <th className="text-center p-2 text-muted-foreground font-medium">Gap</th>
              </tr>
            </thead>
            <tbody>
              {layerStats.map((layer) => {
                const gapCount = layer.total - layer.pqcReady
                return (
                  <tr key={layer.layer} className="border-b border-border/50">
                    <td className="p-2 text-foreground font-medium">{layer.layer}</td>
                    <td className="p-2 text-center text-foreground">{layer.total}</td>
                    <td className="p-2 text-center">
                      <span
                        className={
                          layer.pqcReady > layer.total / 2
                            ? 'text-status-success'
                            : 'text-status-warning'
                        }
                      >
                        {layer.pqcReady}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={
                          layer.fipsValidated > layer.total / 2
                            ? 'text-status-success'
                            : 'text-status-warning'
                        }
                      >
                        {layer.fipsValidated}
                      </span>
                    </td>
                    <td className="p-2 text-center text-foreground">{layer.hybridSupport}</td>
                    <td className="p-2 text-center">
                      <span
                        className={
                          gapCount > 0 ? 'text-status-error font-medium' : 'text-status-success'
                        }
                      >
                        {gapCount > 0 ? gapCount : 'None'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
