// SPDX-License-Identifier: GPL-3.0-only
/**
 * AlgorithmDetailedEmbed (C5-full Phase 5) — the Algorithms "Detailed Comparison"
 * tab, embedded in the sim. Same shape as AlgorithmTransitionEmbed: sources its
 * state from useAlgorithmExplorer in urlSync:false mode (local params, no nested
 * <Router>), composes the detailed comparison body + the compare bar/panel.
 *
 * "Confirm my architecture choices" is the choice-that-counts: the sim records a
 * crypto-ARCHITECTURE document (distinct sim provenance) + marks the task done.
 * The standalone /algorithms page is untouched.
 */
import { useMemo, useState } from 'react'
import { Check } from 'lucide-react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getAlgorithmDefaults } from '@/data/personaConfig'
import { useAlgorithmExplorer, MAX_COMPARE } from '@/components/Algorithms/useAlgorithmExplorer'
import { AlgorithmDetailedComparison } from '@/components/Algorithms/AlgorithmDetailedComparison'
import { AlgorithmCompareBar } from '@/components/Algorithms/AlgorithmCompareBar'
import { AlgorithmComparisonPanel } from '@/components/Algorithms/AlgorithmComparisonPanel'
import { AlgorithmInfoModal } from '@/components/Algorithms/AlgorithmInfoModal'
import { Button } from '@/components/ui/button'

interface AlgorithmDetailedEmbedProps {
  /** Confirm the reviewed architecture choices (selected algorithm names) — the
   *  sim records a crypto-architecture doc + marks the task done. */
  onConfirm?: (selected: string[]) => void
  /** True once this task has already been confirmed (shows a done state). */
  confirmed?: boolean
}

export function AlgorithmDetailedEmbed({ onConfirm, confirmed }: AlgorithmDetailedEmbedProps) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const personaDefaults = useMemo(() => getAlgorithmDefaults(persona), [persona])
  const x = useAlgorithmExplorer(personaDefaults, { urlSync: false, initialParams: 'tab=detailed' })
  const [infoOpen, setInfoOpen] = useState(false)

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      {onConfirm && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Compare the PQC candidates in detail, select the ones that fit your architecture, then
            confirm to record your crypto-architecture decision for this phase.
          </p>
          <Button
            type="button"
            variant={confirmed ? 'outline' : 'gradient'}
            onClick={() => onConfirm(x.compareKeys)}
            className="flex shrink-0 items-center gap-1.5"
          >
            <Check size={15} />
            {confirmed ? 'Architecture confirmed' : 'Confirm my architecture choices'}
          </Button>
        </div>
      )}

      <AlgorithmDetailedComparison
        highlightAlgorithms={undefined}
        onInfoOpen={() => setInfoOpen(true)}
        filteredAlgorithms={x.filteredAlgorithms}
        compareSet={x.compareSet}
        compareType={x.compareType}
        maxCompareReached={x.compareKeys.length >= MAX_COMPARE}
        onToggleCompare={x.handleToggleCompare}
      />

      {x.showComparison && x.comparisonAlgos.length >= 2 && (
        <div className="mt-6">
          <AlgorithmComparisonPanel
            algorithms={x.comparisonAlgos}
            baseline={x.baselineAlgo}
            activeTab="detailed"
            onClose={() => x.setShowComparison(false)}
          />
        </div>
      )}

      <AlgorithmCompareBar
        compareKeys={x.compareKeys}
        baselineName={x.baselineName}
        onRemove={(key) => x.handleToggleCompare(key)}
        onClearAll={x.handleClearCompare}
        onCompare={x.handleOpenComparison}
      />

      <AlgorithmInfoModal isOpen={infoOpen} onClose={() => setInfoOpen(false)} />
    </div>
  )
}
