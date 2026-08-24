// SPDX-License-Identifier: GPL-3.0-only
/**
 * LibraryPurposeDoors — the coarse "why are you here" pre-filter that sits above
 * the facet rail + results. Four doors (Everything / Learn / Reference / Plan
 * migration) map to LibraryPurpose; picking one narrows the whole working set
 * before the topical category rail refines within it. Purpose is a heuristic over
 * manual_category (see `detectPurpose`) — no CSV column backs it yet.
 */
import { Button } from '@/components/ui/button'
import { LIBRARY_DOORS as DOORS, type LibraryPurposeSelection } from '@/data/libraryPurposeDoors'

export type { LibraryPurposeSelection }

interface LibraryPurposeDoorsProps {
  active: LibraryPurposeSelection
  counts: Record<LibraryPurposeSelection, number>
  onSelect: (p: LibraryPurposeSelection) => void
}

export function LibraryPurposeDoors({ active, counts, onSelect }: LibraryPurposeDoorsProps) {
  return (
    <div
      role="group"
      aria-label="What are you here to do?"
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
    >
      {DOORS.map(({ id, label, hint, icon: Icon }) => {
        const isActive = active === id
        return (
          <Button
            key={id}
            type="button"
            variant="ghost"
            onClick={() => onSelect(id)}
            aria-pressed={isActive}
            className={`flex h-auto flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${
              isActive
                ? 'border-primary/40 bg-primary/10'
                : 'border-border/60 bg-muted/20 hover:border-primary/20 hover:bg-muted/40'
            }`}
          >
            <div className="flex w-full items-center gap-2">
              <Icon
                size={16}
                aria-hidden="true"
                className={`shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
              <span
                className={`text-[13.5px] font-semibold ${
                  isActive ? 'text-primary' : 'text-foreground'
                }`}
              >
                {label}
              </span>
              <span
                className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[11px] ${
                  isActive ? 'bg-primary/20 text-foreground' : 'bg-muted/60 text-muted-foreground'
                }`}
              >
                {/* eslint-disable-next-line security/detect-object-injection */}
                {counts[id]}
              </span>
            </div>
            <span className="text-[11.5px] font-normal text-muted-foreground">{hint}</span>
          </Button>
        )
      })}
    </div>
  )
}
