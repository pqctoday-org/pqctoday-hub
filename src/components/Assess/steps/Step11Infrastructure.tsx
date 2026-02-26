import { useMemo } from 'react'
import { Info } from 'lucide-react'
import { Button } from '../../ui/button'
import clsx from 'clsx'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { InlineTooltip } from '../../ui/InlineTooltip'
import { getPersonaStepContent } from '../../../data/personaWizardHints'
import { PersonaHint } from './PersonaHint'
import { LAYERS } from '../../Migrate/InfrastructureStack'
import { softwareData } from '../../../data/migrateData'

const Step11Infrastructure = () => {
  const {
    infrastructure,
    toggleInfrastructure,
    infrastructureUnknown,
    setInfrastructureUnknown,
    infrastructureSubCategories,
    setInfrastructureSubCategory,
  } = useAssessmentStore()

  const persona = usePersonaStore((s) => s.selectedPersona)
  const stepContent = getPersonaStepContent(persona, 'infra')

  // Compute sub-categories per layer from the live catalog
  const subCatsByLayer = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const layer of LAYERS) {
      const cats = new Set<string>()
      softwareData.forEach((item) => {
        const itemLayers = item.infrastructureLayer.split(',').map((l) => l.trim())
        if (itemLayers.includes(layer.id) && item.categoryName) cats.add(item.categoryName)
      })
      map[layer.id] = Array.from(cats).sort()
    }
    return map
  }, [])

  const selectedLayers = infrastructure
  const isDisabled = infrastructureUnknown

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">
        {stepContent.title ?? 'What infrastructure affects your cryptography?'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ??
          'Select the infrastructure layers that handle cryptography in your environment. Optionally narrow by sub-category within each layer.'}
      </p>

      <PersonaHint stepKey="infra" />

      <div className="glass-panel p-4 border-l-4 border-l-warning mb-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <InlineTooltip term="HSM">HSMs</InlineTooltip> and on-premise infrastructure are
            typically the hardest to migrate to <InlineTooltip term="PQC">PQC</InlineTooltip>{' '}
            algorithms.
          </p>
        </div>
      </div>

      {/* None / I don't know escape hatch */}
      <Button
        variant="ghost"
        aria-pressed={isDisabled}
        onClick={() => setInfrastructureUnknown(!isDisabled)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          isDisabled
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        None of these / I don&apos;t know
      </Button>

      {/* Layer cards — multi-select */}
      <div
        className={clsx(
          'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 transition-opacity',
          isDisabled && 'opacity-40 pointer-events-none'
        )}
        role="group"
        aria-label="Infrastructure layer selection"
        aria-disabled={isDisabled}
      >
        {LAYERS.map((layer) => {
          const Icon = layer.icon
          const isSelected = selectedLayers.includes(layer.id)
          return (
            <Button
              key={layer.id}
              variant="ghost"
              aria-pressed={isSelected}
              onClick={() => toggleInfrastructure(layer.id)}
              className={clsx(
                'h-auto p-3 flex-col items-start gap-1.5 border',
                isSelected
                  ? `${layer.borderColor} bg-primary/10 text-primary hover:bg-primary/10`
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
              )}
            >
              <span className={clsx('flex items-center gap-1.5', isSelected && layer.iconColor)}>
                <Icon size={15} />
                <span className="font-semibold text-xs">{layer.label}</span>
              </span>
            </Button>
          )
        })}
      </div>

      {/* Per-layer sub-category chips — only for selected layers */}
      {selectedLayers.length > 0 && !isDisabled && (
        <div className="space-y-3 pt-2">
          {selectedLayers.map((layerId) => {
            const layer = LAYERS.find((l) => l.id === layerId)
            if (!layer) return null
            const cats = subCatsByLayer[layerId] ?? []
            if (cats.length === 0) return null
            const selectedCats = infrastructureSubCategories[layerId] ?? []
            return (
              <div key={layerId} className="glass-panel p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {layer.label} — sub-categories
                  <span className="normal-case font-normal ml-1 text-muted-foreground/60">
                    (none selected = all included)
                  </span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {cats.map((cat) => {
                    const isActive = selectedCats.includes(cat)
                    return (
                      <Button
                        key={cat}
                        variant="ghost"
                        type="button"
                        onClick={() => {
                          const next = isActive
                            ? selectedCats.filter((c) => c !== cat)
                            : [...selectedCats, cat]
                          setInfrastructureSubCategory(layerId, next)
                        }}
                        className={clsx(
                          'h-auto text-xs px-2.5 py-1 rounded-full border gap-1',
                          isActive
                            ? 'bg-primary/10 text-primary border-primary/40 font-medium hover:bg-primary/10'
                            : 'bg-background/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground hover:bg-transparent'
                        )}
                      >
                        {cat}
                      </Button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export { Step11Infrastructure }
