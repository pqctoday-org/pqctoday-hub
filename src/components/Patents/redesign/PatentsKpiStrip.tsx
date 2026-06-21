// SPDX-License-Identifier: GPL-3.0-only
/**
 * PatentsKpiStrip — the redesign's "so what" up front: five headline KPIs over
 * the scoped corpus, each a one-click drill-down into a filtered Explore. Gives
 * the page a read before the charts. Replaces opening straight into a chart dump.
 */
import { ScrollText, AlertTriangle, Atom, BadgeCheck, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { InsightsFilter } from '@/types/PatentTypes'
import type { PatentKpis } from './usePatentKpis'

/** Drill payload: an InsightsFilter to apply, or 'clear' to reset filters. */
export type KpiDrill = InsightsFilter | 'clear'

interface PatentsKpiStripProps {
  kpis: PatentKpis
  onDrill: (drill: KpiDrill) => void
}

interface Card {
  id: string
  icon: typeof ScrollText
  label: string
  value: string
  sub: string
  tint: string
  drill: KpiDrill
}

export function PatentsKpiStrip({ kpis, onDrill }: PatentsKpiStripProps) {
  const cards: Card[] = [
    {
      id: 'scope',
      icon: ScrollText,
      label: 'Patents in scope',
      value: String(kpis.inScope),
      sub: 'click to clear filters',
      tint: 'text-primary',
      drill: 'clear',
    },
    {
      id: 'impact',
      icon: AlertTriangle,
      label: 'High migration impact',
      value: String(kpis.highImpact.count),
      sub: `${kpis.highImpact.pct}% of corpus`,
      tint: 'text-destructive',
      drill: { impact: 'High' },
    },
    {
      id: 'quantum',
      icon: Atom,
      label: 'Core-invention quantum',
      value: String(kpis.coreQuantum),
      sub: 'quantum is the invention',
      tint: 'text-info',
      drill: { quantumRelevance: 'core_invention' },
    },
    {
      id: 'fips',
      icon: BadgeCheck,
      label: 'Map to FIPS 203/4/5',
      value: String(kpis.fipsMapped),
      sub: 'standardised algorithms',
      tint: 'text-success',
      drill: { fips: '1' },
    },
    {
      id: 'assignee',
      icon: Building2,
      label: 'Top assignee',
      value: kpis.topAssignee?.name ?? '—',
      sub: kpis.topAssignee ? `${kpis.topAssignee.count} patents` : 'no data',
      tint: 'text-secondary',
      drill: kpis.topAssignee ? { assignee: kpis.topAssignee.name } : 'clear',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Button
            key={c.id}
            type="button"
            variant="ghost"
            onClick={() => onDrill(c.drill)}
            className="flex h-auto w-full flex-col items-start justify-start gap-1 rounded-xl border border-border bg-muted/40 p-3 text-left font-normal hover:border-primary/40 hover:bg-muted/60"
          >
            <span className={`flex items-center gap-1.5 ${c.tint}`}>
              <Icon size={14} aria-hidden="true" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                {c.label}
              </span>
            </span>
            <span className="max-w-full truncate text-[20px] font-bold leading-tight text-foreground">
              {c.value}
            </span>
            <span className="text-[11px] text-muted-foreground">{c.sub}</span>
          </Button>
        )
      })}
    </div>
  )
}
