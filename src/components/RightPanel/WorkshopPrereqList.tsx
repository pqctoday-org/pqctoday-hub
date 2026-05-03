// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, AlertCircle, Circle, UserCog, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { FlowMatch, WorkshopRegion } from '@/types/Workshop'
import { labelForRegion } from '@/utils/workshopRegion'
import { PersonaSwitchModal } from '@/components/Persona/PersonaSwitchModal'

interface WorkshopPrereqListProps {
  pickedRegion: WorkshopRegion | null
  onPickRegion: (region: WorkshopRegion) => void
  /** When provided, side-by-side prereqs render the flow's required values. */
  flowMatch?: FlowMatch
  /** Optional: jump to Browse-all when the user wants a different flow. */
  onPickAnotherFlow?: () => void
}

interface AxisRow {
  axis: 'role' | 'proficiency' | 'industry' | 'region'
  label: string
  yours: string
  needs: string
  ok: boolean
  blocked: boolean
}

const REGIONS: WorkshopRegion[] = ['US', 'CA', 'AU']

export const WorkshopPrereqList: React.FC<WorkshopPrereqListProps> = ({
  pickedRegion,
  onPickRegion,
  flowMatch,
  onPickAnotherFlow,
}) => {
  const role = usePersonaStore((s) => s.selectedPersona)
  const proficiency = usePersonaStore((s) => s.experienceLevel)
  const industry = usePersonaStore((s) => s.selectedIndustry)
  const [personaModalOpen, setPersonaModalOpen] = useState(false)

  const rows: AxisRow[] = [
    buildRow('role', 'Role', role, flowMatch?.roles),
    buildRow('proficiency', 'Proficiency', proficiency, flowMatch?.proficiencies),
    buildRow('industry', 'Industry', industry, flowMatch?.industries),
    buildRegionRow(pickedRegion, flowMatch?.regions),
  ]

  const hasBlocker = rows.some((r) => r.blocked)

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.axis} className="flex items-start gap-2 text-sm">
            {row.ok ? (
              <CheckCircle2 size={16} className="mt-0.5 text-status-success shrink-0" />
            ) : row.blocked ? (
              <AlertCircle size={16} className="mt-0.5 text-status-warning shrink-0" />
            ) : (
              <Circle size={16} className="mt-0.5 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
                <span className="font-medium text-foreground uppercase tracking-wider text-[10px]">
                  {row.label}
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs mt-0.5">
                <span className="text-muted-foreground">Your:</span>
                <span className={row.ok ? 'text-foreground' : 'text-muted-foreground'}>
                  {row.yours}
                </span>
                <span className="text-muted-foreground">Needs:</span>
                <span
                  className={
                    row.blocked ? 'text-status-warning font-medium' : 'text-muted-foreground'
                  }
                >
                  {row.needs}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Region picker — always shown so the user can choose without switching persona */}
      <div className="flex gap-2 pt-1">
        {REGIONS.map((r) => (
          <Button
            key={r}
            variant={pickedRegion === r ? 'gradient' : 'outline'}
            size="sm"
            className="flex-1"
            onClick={() => onPickRegion(r)}
            aria-pressed={pickedRegion === r}
          >
            {labelForRegion(r)}
          </Button>
        ))}
      </div>

      {hasBlocker && (
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[140px]"
            onClick={() => setPersonaModalOpen(true)}
          >
            <UserCog size={14} className="mr-1.5" />
            Switch your persona
          </Button>
          {onPickAnotherFlow && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[140px]"
              onClick={onPickAnotherFlow}
            >
              <ListFilter size={14} className="mr-1.5" />
              Pick another flow
            </Button>
          )}
        </div>
      )}

      {personaModalOpen && <PersonaSwitchModal onClose={() => setPersonaModalOpen(false)} />}
    </div>
  )
}

function buildRow(
  axis: AxisRow['axis'],
  label: string,
  value: string | null,
  allowed: readonly string[] | '*' | undefined
): AxisRow {
  const yours = value ?? '—'
  const needs = formatAllowed(allowed)
  if (allowed === '*' || allowed === undefined) {
    return { axis, label, yours, needs, ok: value !== null, blocked: false }
  }
  if (value === null) {
    return { axis, label, yours, needs, ok: false, blocked: true }
  }
  const ok = (allowed as readonly string[]).includes(value)
  return { axis, label, yours, needs, ok, blocked: !ok }
}

function buildRegionRow(
  pickedRegion: WorkshopRegion | null,
  allowed: readonly WorkshopRegion[] | '*' | undefined
): AxisRow {
  const yours = pickedRegion ? labelForRegion(pickedRegion) : 'pick one below'
  const needs =
    allowed === '*' || allowed === undefined
      ? formatAllowed(allowed)
      : formatAllowed(allowed.map((r) => labelForRegion(r)))
  if (allowed === '*' || allowed === undefined) {
    return {
      axis: 'region',
      label: 'Region',
      yours,
      needs,
      ok: pickedRegion !== null,
      blocked: false,
    }
  }
  if (pickedRegion === null) {
    return {
      axis: 'region',
      label: 'Region',
      yours,
      needs,
      ok: false,
      blocked: false, // pickable inline — not a "switch persona" blocker
    }
  }
  const ok = (allowed as readonly WorkshopRegion[]).includes(pickedRegion)
  return {
    axis: 'region',
    label: 'Region',
    yours,
    needs,
    ok,
    blocked: !ok,
  }
}

function formatAllowed(allowed: readonly string[] | '*' | undefined): string {
  if (allowed === '*' || allowed === undefined) return 'any'
  if (allowed.length === 0) return 'any'
  return allowed.join(' · ')
}
