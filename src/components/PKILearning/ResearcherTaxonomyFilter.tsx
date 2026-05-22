// SPDX-License-Identifier: GPL-3.0-only
//
// P2-3: secondary axis for researcher mode — browse modules by the PQC
// algorithm they cover or the standard they reference. Renders as two chip
// rows above the stack. Selecting a chip filters via the existing
// filteredModuleIds Set in Dashboard.tsx, so this component is purely a
// presentational chip group that publishes a selection up.

import { useState } from 'react'
import clsx from 'clsx'
import { ALGORITHM_TAXONOMY, STANDARD_TAXONOMY } from './moduleEnrichment'
import type { AlgorithmTaxon, StandardTaxon } from './moduleEnrichment'
import { Button } from '../ui/button'

export interface TaxonomySelection {
  algorithm: AlgorithmTaxon | null
  standard: StandardTaxon | null
}

interface ResearcherTaxonomyFilterProps {
  selection: TaxonomySelection
  onChange: (next: TaxonomySelection) => void
}

export const ResearcherTaxonomyFilter = ({
  selection,
  onChange,
}: ResearcherTaxonomyFilterProps) => {
  const [open, setOpen] = useState<'algorithm' | 'standard' | null>(null)

  const setAlgorithm = (algorithm: AlgorithmTaxon | null) => {
    onChange({ algorithm, standard: null })
  }
  const setStandard = (standard: StandardTaxon | null) => {
    onChange({ algorithm: null, standard })
  }

  const activeLabel = selection.algorithm ?? selection.standard ?? null

  return (
    <section
      aria-label="Researcher: browse modules by algorithm or standard"
      className="space-y-2"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Browse by
        </span>
        <Button
          variant={open === 'algorithm' ? 'gradient' : 'outline'}
          size="sm"
          onClick={() => setOpen(open === 'algorithm' ? null : 'algorithm')}
          className="text-xs h-7"
          aria-expanded={open === 'algorithm'}
        >
          Algorithm
          {selection.algorithm && (
            <span className="ml-1.5 text-[10px] opacity-80">· {selection.algorithm}</span>
          )}
        </Button>
        <Button
          variant={open === 'standard' ? 'gradient' : 'outline'}
          size="sm"
          onClick={() => setOpen(open === 'standard' ? null : 'standard')}
          className="text-xs h-7"
          aria-expanded={open === 'standard'}
        >
          Standard
          {selection.standard && (
            <span className="ml-1.5 text-[10px] opacity-80">· {selection.standard}</span>
          )}
        </Button>
        {activeLabel && (
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setAlgorithm(null)
              setStandard(null)
              setOpen(null)
            }}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {open === 'algorithm' && (
        <div
          role="listbox"
          aria-label="Algorithms"
          className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-muted/30"
        >
          {ALGORITHM_TAXONOMY.map((alg) => {
            const isSelected = selection.algorithm === alg
            return (
              <Button
                key={alg}
                variant="ghost"
                size="sm"
                role="option"
                aria-selected={isSelected}
                onClick={() => setAlgorithm(isSelected ? null : alg)}
                className={clsx(
                  'text-[11px] h-6 px-2 rounded-full border',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {alg}
              </Button>
            )
          })}
        </div>
      )}

      {open === 'standard' && (
        <div
          role="listbox"
          aria-label="Standards"
          className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-border bg-muted/30"
        >
          {STANDARD_TAXONOMY.map((std) => {
            const isSelected = selection.standard === std
            return (
              <Button
                key={std}
                variant="ghost"
                size="sm"
                role="option"
                aria-selected={isSelected}
                onClick={() => setStandard(isSelected ? null : std)}
                className={clsx(
                  'text-[11px] h-6 px-2 rounded-full border',
                  isSelected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {std}
              </Button>
            )
          })}
        </div>
      )}
    </section>
  )
}
