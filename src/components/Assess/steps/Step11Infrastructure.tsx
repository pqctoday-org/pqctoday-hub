// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Import, Info } from 'lucide-react'
import { Button } from '../../ui/button'
import clsx from 'clsx'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { useMigrateSelectionStore } from '../../../store/useMigrateSelectionStore'
import { InlineTooltip } from '../../ui/InlineTooltip'
import { getPersonaStepContent } from '../../../data/personaWizardHints'
import { PersonaHint } from './PersonaHint'
import { LAYERS } from '../../Migrate/InfrastructureStack'
import { softwareData } from '../../../data/migrateData'

const VENDOR_OPTIONS = [
  {
    value: 'heavy-vendor' as const,
    label: 'Heavy Vendor Dependency',
    description: 'We rely primarily on vendor-provided crypto (SaaS, SDK, managed services).',
  },
  {
    value: 'open-source' as const,
    label: 'Open Source Libraries',
    description: 'We use open-source crypto libraries that we control and can update.',
  },
  {
    value: 'mixed' as const,
    label: 'Mixed',
    description: 'Combination of vendor-provided and self-managed crypto libraries.',
  },
  {
    value: 'in-house' as const,
    label: 'In-House Implementations',
    description: 'We build and maintain our own cryptographic implementations.',
  },
]

const Step11Infrastructure = () => {
  const {
    infrastructure,
    toggleInfrastructure,
    infrastructureUnknown,
    setInfrastructureUnknown,
    infrastructureSubCategories,
    setInfrastructureSubCategory,
    vendorDependency,
    setVendorDependency,
    vendorUnknown,
    setVendorUnknown,
    importProductSelection,
    setImportProductSelection,
  } = useAssessmentStore()

  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const stepContent = getPersonaStepContent(persona, 'infra', experienceLevel)

  const myProducts = useMigrateSelectionStore((s) => s.myProducts)

  // Build a lookup map once
  const itemMap = useMemo(() => new Map(softwareData.map((item) => [item.productId, item])), [])

  // Derive infrastructure layer IDs from migrate product selections
  const migrateInferredLayers = useMemo(() => {
    if (!importProductSelection || myProducts.length === 0) return []
    const validIds = new Set(LAYERS.map((l) => l.id))
    const layerIds = new Set<string>()
    myProducts.forEach((key) => {
      const item = itemMap.get(key)
      item?.infrastructureLayer
        .split(',')
        .map((l) => l.trim())
        .filter((l) => validIds.has(l))
        .forEach((l) => layerIds.add(l))
    })
    return Array.from(layerIds)
  }, [importProductSelection, myProducts, itemMap])

  // Deduce vendor dependency from product license types
  const inferredVendorDependency = useMemo(() => {
    if (!importProductSelection || myProducts.length === 0) return null
    const types = myProducts
      .map((key) => itemMap.get(key)?.licenseType?.toLowerCase() ?? '')
      .filter(Boolean)
    if (types.length === 0) return null
    const isOss = (t: string) =>
      ['open source', 'open-source', 'public domain', 'cc0', 'mit', 'apache', 'gpl', 'bsd'].some(
        (k) => t.includes(k)
      )
    const isCommercial = (t: string) =>
      ['commercial', 'proprietary', 'enterprise', 'subscription'].some((k) => t.includes(k))
    const isMixed = (t: string) => t.includes('mixed') || t.includes('dual') || t.includes('/')
    const hasOss = types.some(isOss)
    const hasCom = types.some(isCommercial)
    const hasMixed = types.some(isMixed)
    if (hasMixed || (hasOss && hasCom)) return 'mixed' as const
    if (hasOss) return 'open-source' as const
    if (hasCom) return 'heavy-vendor' as const
    return 'mixed' as const
  }, [importProductSelection, myProducts, itemMap])

  // Derive sub-categories per layer from selected products
  const migrateInferredSubCats = useMemo(() => {
    if (!importProductSelection || myProducts.length === 0) return {} as Record<string, string[]>
    const validLayerIds = new Set(LAYERS.map((l) => l.id))
    const result: Record<string, Set<string>> = {}
    myProducts.forEach((key) => {
      const item = itemMap.get(key)
      if (!item?.categoryName) return
      item.infrastructureLayer
        .split(',')
        .map((l) => l.trim())
        .filter((l) => validLayerIds.has(l))
        .forEach((layerId) => {
          if (!result[layerId]) result[layerId] = new Set()
          result[layerId].add(item.categoryName)
        })
    })
    return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, Array.from(v).sort()]))
  }, [importProductSelection, myProducts, itemMap])

  // Auto-populate infrastructure layers on mount if none selected yet
  const layersApplied = useRef(false)
  useEffect(() => {
    if (layersApplied.current || !importProductSelection || migrateInferredLayers.length === 0)
      return
    if (infrastructure.length > 0) return
    migrateInferredLayers.forEach((id) => toggleInfrastructure(id))
    layersApplied.current = true
    // intentional: only run when migration infer changes on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importProductSelection, migrateInferredLayers])

  // Auto-select sub-categories from product selections on first sync
  const subCatsApplied = useRef(false)
  useEffect(() => {
    if (
      subCatsApplied.current ||
      !importProductSelection ||
      Object.keys(migrateInferredSubCats).length === 0
    )
      return
    Object.entries(migrateInferredSubCats).forEach(([layerId, cats]) => {
      const existing = infrastructureSubCategories[layerId] ?? []
      if (existing.length === 0 && cats.length > 0) {
        setInfrastructureSubCategory(layerId, cats)
      }
    })
    subCatsApplied.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importProductSelection, migrateInferredSubCats])

  // Auto-set vendor dependency from inferred value (don't override user pick)
  useEffect(() => {
    if (!importProductSelection || !inferredVendorDependency) return
    if (vendorDependency) return
    setVendorDependency(inferredVendorDependency)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importProductSelection, inferredVendorDependency])

  // Resolved product list for display panel
  const productItems = useMemo(() => {
    if (!importProductSelection || myProducts.length === 0) return []
    return myProducts
      .map((key) => {
        const item = itemMap.get(key)
        if (item)
          return {
            key,
            name: item.softwareName,
            category: item.categoryName,
            layer: item.infrastructureLayer,
          }
        return { key, name: key, category: '', layer: '' }
      })
      .sort((a, b) => a.layer.localeCompare(b.layer) || a.name.localeCompare(b.name))
  }, [importProductSelection, myProducts, itemMap])

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
  const industry = useAssessmentStore((s) => s.industry)
  const isDisabled = false // smart defaults keep options interactive

  return (
    <div className="space-y-4">
      {/* Header with sync toggle */}
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">
          {stepContent.title ?? 'What infrastructure handles your cryptography?'}
        </h3>
        <Button
          variant="ghost"
          type="button"
          onClick={() => setImportProductSelection(!importProductSelection)}
          className={clsx(
            'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium whitespace-nowrap shrink-0',
            importProductSelection
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-primary/30'
          )}
          aria-pressed={importProductSelection}
          title={
            importProductSelection
              ? 'Syncing with your Migrate page product selections'
              : 'Product import from Migrate page is off'
          }
        >
          <Import size={12} />
          {importProductSelection ? 'Synced' : 'Import off'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {stepContent.description ??
          'Select the infrastructure layers that handle cryptography in your environment, then indicate how you manage crypto dependencies.'}
      </p>

      <PersonaHint stepKey="infra" />

      <div className="glass-panel p-4 border-l-4 border-l-warning">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <InlineTooltip term="HSM">HSMs</InlineTooltip> and on-premise infrastructure are
            typically the hardest to migrate to <InlineTooltip term="PQC">PQC</InlineTooltip>{' '}
            algorithms.
          </p>
        </div>
      </div>

      {/* Smart defaults escape hatch */}
      <Button
        variant="ghost"
        aria-pressed={infrastructureUnknown}
        onClick={() => setInfrastructureUnknown(!infrastructureUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          infrastructureUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {infrastructureUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}. You can adjust any selection.
        </p>
      )}

      {/* Layer cards — multi-select */}
      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 transition-opacity"
        role="group"
        aria-label="Infrastructure layer selection"
      >
        {LAYERS.map((layer) => {
          const Icon = layer.icon
          const isSelected = selectedLayers.includes(layer.id)
          const isInferred = migrateInferredLayers.includes(layer.id)
          return (
            <Button
              key={layer.id}
              variant="ghost"
              aria-pressed={isSelected}
              onClick={() => toggleInfrastructure(layer.id)}
              className={clsx(
                'h-auto p-3 flex-col items-start gap-1.5 border relative',
                isSelected
                  ? `${layer.borderColor} bg-primary/10 text-primary hover:bg-primary/10`
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
              )}
            >
              <span className={clsx('flex items-center gap-1.5', isSelected && layer.iconColor)}>
                <Icon size={15} />
                <span className="font-semibold text-xs">{layer.label}</span>
              </span>
              {isInferred && importProductSelection && !isDisabled && (
                <span className="text-[9px] text-primary/60 font-normal leading-tight">
                  from Migrate
                </span>
              )}
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
            const syncedMode = importProductSelection && myProducts.length > 0
            // In synced mode, only show sub-cats that selected products belong to
            const cats = syncedMode
              ? (migrateInferredSubCats[layerId] ?? [])
              : (subCatsByLayer[layerId] ?? [])
            if (cats.length === 0) return null
            const selectedCats = infrastructureSubCategories[layerId] ?? []
            return (
              <div key={layerId} className="glass-panel p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {layer.label} — sub-categories
                    {syncedMode ? (
                      <span className="normal-case font-normal ml-1 text-primary/60">
                        (from your products)
                      </span>
                    ) : (
                      <span className="normal-case font-normal ml-1 text-muted-foreground/60">
                        (none selected = all included)
                      </span>
                    )}
                  </p>
                  {syncedMode && (
                    <Link
                      to="/migrate"
                      className="text-[10px] text-primary hover:underline shrink-0"
                    >
                      Manage in Migrate
                    </Link>
                  )}
                </div>
                {syncedMode ? (
                  <div className="space-y-1.5">
                    {cats.map((cat) => {
                      const isActive = selectedCats.includes(cat)
                      const productsForCat = productItems.filter(
                        (p) =>
                          p.category === cat &&
                          p.layer
                            .split(',')
                            .map((l) => l.trim())
                            .includes(layerId)
                      )
                      return (
                        <div key={cat} className="flex items-center gap-2 min-w-0">
                          <Button
                            variant="ghost"
                            type="button"
                            onClick={() => {
                              const next = isActive
                                ? selectedCats.filter((c) => c !== cat)
                                : [...selectedCats, cat]
                              setInfrastructureSubCategory(layerId, next)
                            }}
                            className={clsx(
                              'h-auto text-xs px-2.5 py-1 rounded-full border gap-1 shrink-0',
                              isActive
                                ? 'bg-primary/10 text-primary border-primary/40 font-medium hover:bg-primary/10'
                                : 'bg-background/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground hover:bg-transparent'
                            )}
                          >
                            {cat}
                          </Button>
                          {productsForCat.length > 0 && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {productsForCat.map((p) => p.name).join(' · ')}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
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
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Vendor Dependency ─────────────────────────────────────────── */}
      <div className="border-t border-border pt-5 mt-2 space-y-3">
        <div>
          <h4 className="text-base font-bold text-foreground">
            How do you manage cryptographic dependencies?
          </h4>
          {inferredVendorDependency && importProductSelection && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Import size={11} />
              Auto-deduced from your product selections — adjust if needed.
            </p>
          )}
        </div>

        {/* Smart defaults escape hatch */}
        <Button
          variant="ghost"
          aria-pressed={vendorUnknown}
          onClick={() => setVendorUnknown(!vendorUnknown)}
          className={clsx(
            'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
            vendorUnknown
              ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
              : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
          )}
        >
          <Info size={14} className="shrink-0" />
          I&apos;m not sure — help me choose
        </Button>
        {vendorUnknown && (
          <p className="text-xs text-muted-foreground italic">
            Recommended for {industry || 'your industry'}. You can adjust any selection.
          </p>
        )}

        <div className="space-y-2" role="radiogroup" aria-label="Vendor dependency model">
          {VENDOR_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant="ghost"
              role="radio"
              aria-checked={vendorDependency === opt.value}
              onClick={() => {
                setVendorUnknown(false)
                setVendorDependency(opt.value)
              }}
              className={clsx(
                'w-full h-auto p-4 flex-col items-start whitespace-normal border',
                vendorDependency === opt.value
                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
              )}
            >
              <span className="font-bold text-sm flex items-center gap-2">
                {opt.label}
                {inferredVendorDependency === opt.value && importProductSelection && (
                  <span className="text-[9px] font-normal text-primary/60 flex items-center gap-0.5">
                    <Import size={9} />
                    suggested
                  </span>
                )}
              </span>
              <p className="text-xs mt-1 opacity-80">{opt.description}</p>
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}

export { Step11Infrastructure }
