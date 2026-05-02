// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { WorkshopRegion } from '@/types/Workshop'
import { labelForRegion } from '@/utils/workshopRegion'

interface WorkshopPrereqListProps {
  pickedRegion: WorkshopRegion | null
  onPickRegion: (region: WorkshopRegion) => void
}

export const WorkshopPrereqList: React.FC<WorkshopPrereqListProps> = ({
  pickedRegion,
  onPickRegion,
}) => {
  const role = usePersonaStore((s) => s.selectedPersona)
  const proficiency = usePersonaStore((s) => s.experienceLevel)
  const industry = usePersonaStore((s) => s.selectedIndustry)

  const items = [
    {
      ok: role === 'executive',
      label: 'Role: Executive',
      hint: 'Open the persona switcher and choose Executive.',
    },
    {
      ok: proficiency === 'basics',
      label: 'Proficiency: Basics',
      hint: 'No prior PQC required. Set proficiency to Basics in the persona switcher.',
    },
    {
      ok: industry === 'Finance & Banking',
      label: 'Industry: Finance & Banking',
      hint: 'Set industry to Finance & Banking in the persona switcher.',
    },
    {
      ok: pickedRegion !== null,
      label: pickedRegion ? `Country: ${labelForRegion(pickedRegion)}` : 'Country: pick one below',
      hint: 'Choose United States, Canada, or Australia.',
    },
  ]

  return (
    <div className="space-y-2">
      <ul className="space-y-1.5">
        {items.map((it) => (
          <li key={it.label} className="flex items-start gap-2 text-sm">
            {it.ok ? (
              <CheckCircle2 size={16} className="mt-0.5 text-status-success shrink-0" />
            ) : (
              <Circle size={16} className="mt-0.5 text-muted-foreground shrink-0" />
            )}
            <div>
              <div className={it.ok ? 'text-foreground' : 'text-muted-foreground'}>{it.label}</div>
              {!it.ok && <div className="text-xs text-muted-foreground/80">{it.hint}</div>}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex gap-2 pt-2">
        {(['US', 'CA', 'AU'] as WorkshopRegion[]).map((r) => (
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
    </div>
  )
}
