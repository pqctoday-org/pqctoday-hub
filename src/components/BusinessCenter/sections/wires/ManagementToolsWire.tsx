// SPDX-License-Identifier: GPL-3.0-only
/**
 * ManagementToolsWire — Command Center Fig 3 Management Tools zone data wire.
 *
 * CSWP.39 §4.3 + §5.2 — automated discovery, assessment, configuration, and
 * enforcement tooling. The user-facing "is my tool stack covered?" question is
 * answered by aggregating signals from elsewhere in the app:
 *   - bookmarked products on /migrate (vendor-managed crypto stack)
 *   - bookmarked playground tools on /playground (prototype tooling)
 *   - infrastructure layer coverage from the assessment
 *   - FIPS-validated count from the migrate catalog
 *
 * The zone has no dedicated artifacts of its own (CBOM and vulnerability-watch
 * moved to the Assets zone). This wire is the only content for the zone.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wrench, Boxes, ShieldCheck, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'
import { useBookmarkStore } from '@/store/useBookmarkStore'

export interface ManagementToolsWireProps {
  metrics: BusinessMetrics
}

interface StatTile {
  label: string
  value: string | number
  hint: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  href: string
}

export const ManagementToolsWire: React.FC<ManagementToolsWireProps> = ({ metrics }) => {
  const navigate = useNavigate()
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)
  const assessedLayers = metrics.infraLayerCoverage.filter((l) => l.assessed).length
  const totalLayers = metrics.infraLayerCoverage.length

  const tiles: StatTile[] = [
    {
      label: 'Products in CBOM scope',
      value: metrics.bookmarkedProducts.length,
      hint:
        metrics.bookmarkedProducts.length === 0
          ? 'Bookmark products on /migrate to track their crypto'
          : 'Bookmarked on /migrate',
      icon: Boxes,
      href: '/migrate',
    },
    {
      label: 'Playground tools tracked',
      value: myPlaygroundTools.length,
      hint:
        myPlaygroundTools.length === 0
          ? 'Bookmark prototype tools on /playground'
          : 'Bookmarked on /playground',
      icon: Wrench,
      href: '/playground',
    },
    {
      label: 'Infrastructure layers covered',
      value: `${assessedLayers}/${totalLayers}`,
      hint:
        assessedLayers === 0
          ? 'Complete the assessment to enumerate layers'
          : 'From your assessment',
      icon: Layers,
      href: '/assess',
    },
    {
      label: 'FIPS-validated products',
      value: metrics.fipsBreakdown.validated,
      hint: 'From the migrate catalog (validated CMVP)',
      icon: ShieldCheck,
      href: '/migrate',
    },
  ]

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tiles.map((tile) => (
          <Button
            key={tile.label}
            variant="ghost"
            onClick={() => navigate(tile.href)}
            className="h-auto rounded-md border border-border bg-card hover:border-primary/30 hover:bg-muted/30 transition-colors p-3 text-left flex flex-col items-start gap-0"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <tile.icon size={12} className="text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {tile.label}
              </span>
            </div>
            <div className="text-lg font-bold text-foreground">{tile.value}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{tile.hint}</p>
          </Button>
        ))}
      </div>

      <p className="text-[11px] text-muted-foreground italic">
        Per NIST CSWP.39 §4.3 + §5.2, the management-tools layer automates discovery and enforcement
        so the Information Repository stays current. The signals above are the user-side of that
        loop — bookmark products, playground prototypes, and infrastructure layers to keep them
        visible here.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/migrate')}
          className="h-7 text-xs gap-1"
        >
          Open Migrate <ArrowRight size={12} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/playground')}
          className="h-7 text-xs gap-1"
        >
          Open Playground <ArrowRight size={12} />
        </Button>
      </div>
    </div>
  )
}
