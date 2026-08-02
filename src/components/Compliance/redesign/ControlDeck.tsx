// SPDX-License-Identifier: GPL-3.0-only
//
// Consolidated control deck. Surfaces the active jurisdiction/sector context
// and the trust-tier filter in a single card. Persona/role is set exclusively
// via the global top-bar role switcher (design program Phase 0.2 — no page
// may carry a second, page-local persona control) — this deck only reads
// selectedIndustries/selectedRegion, it never writes usePersonaStore.

import { Lightbulb } from 'lucide-react'
import { TrustTierFilter } from '@/components/common/TrustTierFilter'
import { usePersonaStore } from '@/store/usePersonaStore'
import { industryLabel } from '@/components/common/SectorFilter'

interface ControlDeckProps {
  /** Hide the URL-writing trust-tier filter in the sim embed. */
  simEmbed?: boolean
  /** "Showing N of M" — the active tab's result count, if available. */
  count?: { shown: number; total: number }
}

const REGION_LABEL: Record<string, string> = {
  americas: 'Americas',
  eu: 'European Union',
  mena: 'Middle East & Africa',
  apac: 'Asia-Pacific',
  global: 'Global',
}

export function ControlDeck({ simEmbed = false, count }: ControlDeckProps) {
  const industries = usePersonaStore((s) => s.selectedIndustries)
  const region = usePersonaStore((s) => s.selectedRegion)

  const sector = industries.length === 1 ? industryLabel(industries[0]) : null
  // eslint-disable-next-line security/detect-object-injection
  const regionName = (region && REGION_LABEL[region]) || 'Global'

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
        {count && (
          <span className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{count.shown}</span> of{' '}
            {count.total}
          </span>
        )}
        {!simEmbed && <TrustTierFilter />}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-primary/15 bg-primary/[0.04] px-3 py-2">
        <Lightbulb size={14} className="mt-0.5 shrink-0 text-primary" />
        <p className="text-[11.5px] leading-relaxed text-muted-foreground">
          {sector ? (
            <>
              Focused on <span className="font-semibold text-foreground">{sector}</span> ·{' '}
              <span className="font-semibold text-foreground">{regionName}</span>. Your{' '}
              <span className="font-semibold text-foreground">role</span> (top bar) tunes every tab
              — Landscape pillars, your mandates in For You, and which CSWP.39 steps you own.
            </>
          ) : (
            <>
              Set a sector and region on the assessment to personalise this page. Your{' '}
              <span className="font-semibold text-foreground">role</span> — set once in the top bar
              — tunes every tab consistently.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
