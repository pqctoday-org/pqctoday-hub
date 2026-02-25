import { useMemo } from 'react'
import { Info } from 'lucide-react'
import clsx from 'clsx'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { InlineTooltip } from '../../ui/InlineTooltip'
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
        What infrastructure affects your cryptography?
      </h3>
      <p className="text-sm text-muted-foreground">
        Select the infrastructure layers that handle cryptography in your environment. Optionally
        narrow by sub-category within each layer.
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
      <button
        aria-pressed={isDisabled}
        onClick={() => setInfrastructureUnknown(!isDisabled)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          isDisabled
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />
        None of these / I don&apos;t know
      </button>

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
            <button
              key={layer.id}
              aria-pressed={isSelected}
              onClick={() => toggleInfrastructure(layer.id)}
              className={clsx(
                'p-3 rounded-lg border text-left text-sm font-medium transition-colors flex flex-col gap-1.5',
                isSelected
                  ? `${layer.borderColor} bg-primary/10 text-primary`
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span className={clsx('flex items-center gap-1.5', isSelected && layer.iconColor)}>
                <Icon size={15} />
                <span className="font-semibold text-xs">{layer.label}</span>
              </span>
            </button>
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
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const next = isActive
                            ? selectedCats.filter((c) => c !== cat)
                            : [...selectedCats, cat]
                          setInfrastructureSubCategory(layerId, next)
                        }}
                        className={clsx(
                          'text-xs px-2.5 py-1 rounded-full border transition-colors',
                          isActive
                            ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                            : 'bg-background/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground'
                        )}
                      >
                        {cat}
                      </button>
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
