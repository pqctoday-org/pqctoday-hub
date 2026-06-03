// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useRef, useEffect } from 'react'
import { SlidersHorizontal, X, Wrench } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CATEGORIES, type ToolDifficulty } from './workshopRegistry'

export type WipFilter = 'all' | 'only' | 'hide'

interface PersonaItem {
  id: string
  label: string
}

interface DesktopPlaygroundFilterPopoverProps {
  activeFilterCount: number
  // Persona
  personaFilterItems: PersonaItem[]
  selectedPersonaFilter: string
  onPersonaChange: (id: string) => void
  // Category
  selectedCategory: string
  onCategoryChange: (id: string) => void
  // Difficulty
  selectedDifficulty: string
  onDifficultyChange: (id: string) => void
  // WIP
  wipFilter: WipFilter
  onWipChange: (v: WipFilter) => void
  wipCount: number
  // Clear
  onClear: () => void
}

const DIFFICULTY_ITEMS: { id: string; label: string }[] = [
  { id: 'All', label: 'All Levels' },
  ...(['beginner', 'intermediate', 'advanced'] as ToolDifficulty[]).map((d) => ({
    id: d,
    label: d.charAt(0).toUpperCase() + d.slice(1),
  })),
]

const CATEGORY_ITEMS = [
  { id: 'All', label: 'All Categories' },
  ...CATEGORIES.map((c) => ({ id: c, label: c })),
]

export const DesktopPlaygroundFilterPopover: React.FC<DesktopPlaygroundFilterPopoverProps> = ({
  activeFilterCount,
  personaFilterItems,
  selectedPersonaFilter,
  onPersonaChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  wipFilter,
  onWipChange,
  wipCount,
  onClear,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors',
          activeFilterCount > 0
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground'
        )}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        Filters
        {activeFilterCount > 0 && (
          <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-popover border border-border rounded-lg shadow-xl z-50 p-4 space-y-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Role / Persona
            </span>
            <FilterDropdown
              items={personaFilterItems}
              selectedId={selectedPersonaFilter}
              onSelect={onPersonaChange}
              defaultLabel="All Roles"
              noContainer
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Category
            </span>
            <FilterDropdown
              items={CATEGORY_ITEMS}
              selectedId={selectedCategory}
              onSelect={onCategoryChange}
              defaultLabel="All Categories"
              noContainer
            />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Difficulty
            </span>
            <FilterDropdown
              items={DIFFICULTY_ITEMS}
              selectedId={selectedDifficulty}
              onSelect={onDifficultyChange}
              defaultLabel="All Levels"
              noContainer
            />
          </div>

          <div className="space-y-1.5 pt-3 border-t border-border/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Wrench size={11} aria-hidden="true" />
              WIP Tools
            </span>
            <div className="flex rounded-md overflow-hidden border border-border">
              {(['all', 'only', 'hide'] as WipFilter[]).map((v) => (
                <Button
                  key={v}
                  variant="ghost"
                  onClick={() => onWipChange(v)}
                  className={clsx(
                    'flex-1 h-7 text-[11px] rounded-none border-r border-border last:border-r-0',
                    wipFilter === v
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v === 'all' ? `All (${wipCount})` : v === 'only' ? 'WIP only' : 'Hide WIP'}
                </Button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                onClear()
                setIsOpen(false)
              }}
              className="w-full h-8 text-xs text-muted-foreground hover:text-destructive border border-border/50 rounded-md"
            >
              <X size={11} className="mr-1" />
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
