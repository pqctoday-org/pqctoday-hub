// SPDX-License-Identifier: GPL-3.0-only
/**
 * AlgorithmTransitionEmbed (C5-full) — the Algorithms "Transition Guide" tab,
 * rendered headless inside the simulation. Now that AlgorithmsView's shared state
 * lives in `useAlgorithmExplorer`, the comparison tab can source its own
 * filtered-transition data + compare selection instead of being parent-controlled.
 *
 * URL isolation is via the hook's `urlSync: false` mode (filter/compare state
 * lives in local params), NOT a nested MemoryRouter — the sim already runs inside
 * the app Router and React forbids nesting one. The standalone /algorithms page
 * (urlSync defaults true) is untouched.
 *
 * The artifact-emitting "confirm your replacements" affordance (so the choice
 * counts toward the phase via a crypto-cbom doc) is the follow-up that wires this
 * into the sim's activity/maturity path.
 */
import { useMemo } from 'react'
import { Check } from 'lucide-react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { getAlgorithmDefaults } from '@/data/personaConfig'
import { useAlgorithmExplorer, MAX_COMPARE } from '@/components/Algorithms/useAlgorithmExplorer'
import { AlgorithmComparison } from '@/components/Algorithms/AlgorithmComparison'
import { AlgorithmCompareBar } from '@/components/Algorithms/AlgorithmCompareBar'
import { AlgorithmComparisonPanel } from '@/components/Algorithms/AlgorithmComparisonPanel'
import { Button } from '@/components/ui/button'

interface AlgorithmTransitionEmbedProps {
  /** Confirm the reviewed PQC replacements (the selected algorithm names) — the
   *  sim records a CBOM + marks the task done. Provided when mounted in the sim. */
  onConfirm?: (selected: string[]) => void
  /** True once this task has already been confirmed (shows a done state). */
  confirmed?: boolean
}

export function AlgorithmTransitionEmbed({ onConfirm, confirmed }: AlgorithmTransitionEmbedProps) {
  const persona = usePersonaStore((s) => s.selectedPersona)
  const personaDefaults = useMemo(() => getAlgorithmDefaults(persona), [persona])
  const x = useAlgorithmExplorer(personaDefaults, {
    urlSync: false,
    initialParams: 'tab=transition',
  })

  return (
    <div className="min-h-0 flex-1 overflow-auto p-4">
      {onConfirm && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Review the PQC replacements for your classical algorithms, select the ones you&rsquo;ll
            adopt, then confirm to record your replacement plan (a CBOM) for this phase.
          </p>
          <Button
            type="button"
            variant={confirmed ? 'outline' : 'gradient'}
            onClick={() => onConfirm(x.compareKeys)}
            className="flex shrink-0 items-center gap-1.5"
          >
            <Check size={15} />
            {confirmed ? 'Replacements confirmed' : 'Confirm my PQC replacements'}
          </Button>
        </div>
      )}
      <AlgorithmComparison
        highlightAlgorithms={undefined}
        filteredData={x.filteredTransitions}
        compareSet={x.compareSet}
        compareType={x.compareType}
        maxCompareReached={x.compareKeys.length >= MAX_COMPARE - 1}
        onToggleTransitionRow={x.handleToggleTransitionRow}
      />

      {x.showComparison && x.comparisonAlgos.length >= 2 && (
        <div className="mt-6">
          <AlgorithmComparisonPanel
            algorithms={x.comparisonAlgos}
            baseline={x.baselineAlgo}
            activeTab="transition"
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
    </div>
  )
}
