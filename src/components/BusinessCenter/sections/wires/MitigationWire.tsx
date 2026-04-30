// SPDX-License-Identifier: GPL-3.0-only
/**
 * MitigationWire — Command Center Fig 3 Mitigation zone data wire.
 *
 * Surfaces the user's bookmarked Playground tools as candidate "bump-in-the-
 * wire" gateway / proxy / re-encryption tools. CSWP.39 §4.6 frames Mitigation
 * as the temporary path for assets that cannot be migrated directly; the
 * playground is where users prototype those tools, so a bookmark there is a
 * strong signal that the tool belongs in this zone.
 */
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBookmarkStore } from '@/store/useBookmarkStore'
import type { BusinessMetrics } from '../../hooks/useBusinessMetrics'

export interface MitigationWireProps {
  metrics: BusinessMetrics
}

export const MitigationWire: React.FC<MitigationWireProps> = () => {
  const navigate = useNavigate()
  const myPlaygroundTools = useBookmarkStore((s) => s.myPlaygroundTools)

  if (myPlaygroundTools.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/10 p-3">
        <div className="flex items-start gap-2">
          <Wrench size={16} className="text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1 flex-wrap">
            No mitigation candidates yet — bookmark gateway / proxy tools on
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/playground')}
              className="h-auto p-0 text-xs"
            >
              /playground
            </Button>
            to surface them here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Bookmarked playground tools ({myPlaygroundTools.length})
          </span>
        </div>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate('/playground')}
          className="h-auto p-0 text-xs"
        >
          Open Playground <ArrowRight size={12} className="ml-0.5" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Per NIST CSWP.39 §4.6, mitigation gateways are temporary — every entry below should pair
        with a sunset date on the Migration Roadmap.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {myPlaygroundTools.slice(0, 12).map((id) => (
          <Button
            key={id}
            variant="outline"
            size="sm"
            className="h-7 px-2 text-[11px] font-mono"
            onClick={() => navigate(`/playground/${id}`)}
          >
            {id}
          </Button>
        ))}
        {myPlaygroundTools.length > 12 && (
          <span className="text-[10px] text-muted-foreground self-center">
            +{myPlaygroundTools.length - 12} more
          </span>
        )}
      </div>
    </div>
  )
}
