// SPDX-License-Identifier: GPL-3.0-only
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react'
import type { InfraLayerCoverage } from '../hooks/useBusinessMetrics'

function LayerDot({ coverage }: { coverage: InfraLayerCoverage }) {
  const Icon =
    coverage.status === 'covered' ? CheckCircle2 : coverage.status === 'gap' ? AlertCircle : Circle

  const color =
    coverage.status === 'covered'
      ? 'text-status-success'
      : coverage.status === 'gap'
        ? 'text-status-warning'
        : 'text-muted-foreground/40'

  return (
    <div className="flex flex-col items-center gap-1">
      <Icon size={16} className={color} />
      <span className="text-xs text-muted-foreground truncate max-w-16 text-center">
        {coverage.layer}
      </span>
      {coverage.productCount > 0 && (
        <span className="text-xs font-medium text-foreground">{coverage.productCount}</span>
      )}
    </div>
  )
}

export interface InfraCoverageWidgetProps {
  layers: InfraLayerCoverage[]
}

export function InfraCoverageWidget({ layers }: InfraCoverageWidgetProps) {
  return (
    <div>
      <span className="text-xs text-muted-foreground mb-2 block">Infrastructure Coverage</span>
      <div className="flex items-start justify-between gap-2">
        {layers.map((lc) => (
          <LayerDot key={lc.layer} coverage={lc} />
        ))}
      </div>
      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CheckCircle2 size={10} className="text-status-success" /> Covered
        </span>
        <span className="flex items-center gap-1">
          <AlertCircle size={10} className="text-status-warning" /> Gap
        </span>
        <span className="flex items-center gap-1">
          <Circle size={10} className="text-muted-foreground/40" /> N/A
        </span>
      </div>
    </div>
  )
}
