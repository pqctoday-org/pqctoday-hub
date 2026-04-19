// SPDX-License-Identifier: GPL-3.0-only
/**
 * In-tool persona selector for Command Center KPI surfaces.
 *
 * The active persona normally comes from `usePersonaStore`, but CISOs and
 * architects often want to toggle into a peer view ("how would ops see this?")
 * without changing their global app persona. This component wires a scoped
 * override that falls back to the global persona when unset.
 */
import React from 'react'
import { Briefcase, ShieldCheck, Server, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KpiPersonaId } from '@/data/kpiCatalog'
import { KPI_PERSONAS } from '@/data/kpiCatalog'

const ICONS: Record<KpiPersonaId, React.ComponentType<{ size?: number; className?: string }>> = {
  executive: Briefcase,
  architect: ShieldCheck,
  ops: Server,
  researcher: GraduationCap,
}

const LABELS: Record<KpiPersonaId, string> = {
  executive: 'Executive',
  architect: 'Architect',
  ops: 'Ops',
  researcher: 'Researcher',
}

interface KpiPersonaSelectorProps {
  value: KpiPersonaId
  onChange: (persona: KpiPersonaId) => void
  disabled?: boolean
}

export const KpiPersonaSelector: React.FC<KpiPersonaSelectorProps> = ({
  value,
  onChange,
  disabled,
}) => {
  return (
    <div className="flex items-center gap-2" role="radiogroup" aria-label="KPI persona lens">
      <span className="text-xs text-muted-foreground">View as:</span>
      <div className="flex items-center rounded-md border border-border bg-background p-0.5">
        {KPI_PERSONAS.map((p) => {
          const Icon = ICONS[p]
          const active = p === value
          return (
            <Button
              key={p}
              type="button"
              variant={active ? 'default' : 'ghost'}
              size="sm"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(p)}
              className={`h-auto px-2.5 py-1 text-xs font-medium rounded ${
                active ? '' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`persona-tab-${p}`}
            >
              <Icon size={12} />
              <span className="ml-1">{LABELS[p]}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
