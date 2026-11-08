// SPDX-License-Identifier: AGPL-3.0-only
/**
 * MitigationWire — Command Center Fig 3 Mitigation zone data wire.
 *
 * Lists the user's bookmarked Playground tools as a general prototype list.
 * NIST CSWP 39 §4.6 describes a crypto gateway ("bump-in-the-wire") as an
 * architectural option for legacy systems whose embedded cryptography cannot
 * be changed directly. A bookmark says nothing about whether a tool can act as
 * such a gateway (a random-generator or signature demo cannot), so the list is
 * labelled as prototypes and does not promote any bookmark to a gateway
 * candidate.
 */
import React from 'react'
import { useNavigate } from 'react-router'
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
            No bookmarked playground tools yet — bookmark tools on
            <Button
              variant="link"
              size="sm"
              onClick={() => navigate('/playground')}
              className="h-auto p-0 text-xs"
            >
              /playground
            </Button>
            to list them here as prototypes.
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
            Bookmarked playground tools ({myPlaygroundTools.length}) — prototypes
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
        This is a general list of the playground tools you bookmarked, not a list of mitigation
        products. Each is a browser demonstration of a primitive or protocol; a bookmark does not
        make a tool a gateway. NIST CSWP 39-upd1 §4.6 describes a crypto gateway as an option for
        legacy systems whose embedded cryptography cannot be changed directly. A real gateway must
        support the specific protocols and services it sits in front of, so check those limits
        before treating any asset as a candidate. If you use one as an interim measure, record an
        exit condition and a review date on the Migration Roadmap (a planning suggestion, not a NIST
        requirement).
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
