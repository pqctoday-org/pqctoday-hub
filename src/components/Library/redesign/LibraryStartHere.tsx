// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryStartHere — the always-present "Start here — picked for {persona}" block.
 * Three entry-document cards; click opens the detail drawer. Replaces the live
 * PersonaPicksPanel + the curious "minimum-viable" mode (the full grid is always
 * one scroll below).
 */
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { libraryData } from '@/data/libraryData'
import { getLibraryStartPicks } from '@/data/libraryStartPicks'
import { LIBRARY_PERSONAS } from '@/data/libraryPersonaConfig'
import { lifecycleLabel, lifecyclePillClass } from './libraryPills'
import type { PersonaId } from '@/data/learningPersonas'

interface LibraryStartHereProps {
  persona: PersonaId | null
  onOpen: (referenceId: string) => void
}

export function LibraryStartHere({ persona, onOpen }: LibraryStartHereProps) {
  if (!persona) return null
  const picks = getLibraryStartPicks(persona)
  if (picks.length === 0) return null
  const personaLabel = LIBRARY_PERSONAS.find((p) => p.id === persona)?.label ?? persona

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] to-secondary/[0.05] p-3.5">
      <div className="mb-2.5 flex items-center gap-1.5">
        <Star size={15} className="text-primary" aria-hidden="true" />
        <span className="text-[13px] font-bold text-foreground">
          Start here — picked for {personaLabel}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {picks.map((pick) => {
          const item = libraryData.find((i) => i.referenceId === pick.referenceId)
          return (
            <Button
              key={pick.referenceId}
              type="button"
              variant="ghost"
              onClick={() => onOpen(pick.referenceId)}
              className="flex h-auto w-full flex-col items-start justify-start gap-1.5 rounded-xl border border-border bg-card/50 p-2.5 text-left font-normal hover:border-primary/40 hover:bg-card"
            >
              <span className="flex w-full items-center gap-1.5">
                <span className="font-mono text-[11px] font-semibold text-primary">
                  {pick.referenceId}
                </span>
                {item && (
                  <span
                    className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold ${lifecyclePillClass(
                      item.documentStatusBucket
                    )}`}
                  >
                    {lifecycleLabel(item.documentStatusBucket)}
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-[12.5px] font-semibold text-foreground">
                {item?.documentTitle ?? pick.label}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
