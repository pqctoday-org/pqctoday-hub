// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useCallback } from 'react'
import { Info, Import, Package, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { useMigrateSelectionStore } from '../../../store/useMigrateSelectionStore'
import { softwareData } from '../../../data/migrateData'

import { InlineTooltip } from '../../ui/InlineTooltip'

import { Button } from '../../ui/button'

import { PersonaHint } from './PersonaHint'
import {
  getPersonaStepContent,
  getPersonaOptionDescriptions,
} from '../../../data/personaWizardHints'

const Step12VendorDependency = () => {
  const { vendorDependency, setVendorDependency, vendorUnknown, setVendorUnknown, industry } =
    useAssessmentStore()
  const importProductSelection = useAssessmentStore((s) => s.importProductSelection)
  const setImportProductSelection = useAssessmentStore((s) => s.setImportProductSelection)

  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const stepContent = getPersonaStepContent(persona, 'vendors', experienceLevel)
  const optionDescs = getPersonaOptionDescriptions(persona, 'vendors')

  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  const toggleMyProduct = useMigrateSelectionStore((s) => s.toggleMyProduct)

  // Resolve product keys to display info
  const productItems = useMemo(() => {
    if (!importProductSelection || myProducts.length === 0) return []
    const itemMap = new Map(
      softwareData.map((item) => [`${item.softwareName}::${item.categoryId}`, item])
    )
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
        // Fallback: parse the key directly
        const [name, category] = key.split('::')
        return { key, name: name ?? key, category: category ?? '', layer: '' }
      })
      .sort((a, b) => a.layer.localeCompare(b.layer) || a.name.localeCompare(b.name))
  }, [importProductSelection, myProducts])

  const handleRemoveProduct = useCallback(
    (key: string) => {
      toggleMyProduct(key)
    },
    [toggleMyProduct]
  )

  const options = [
    {
      value: 'heavy-vendor' as const,
      label: 'Heavy Vendor Dependency',
      description:
        optionDescs['heavy-vendor'] ??
        'We rely primarily on vendor-provided crypto (SaaS, SDK, managed services).',
    },
    {
      value: 'open-source' as const,
      label: 'Open Source Libraries',
      description:
        optionDescs['open-source'] ??
        'We use open-source crypto libraries that we control and can update.',
    },
    {
      value: 'mixed' as const,
      label: 'Mixed',
      description:
        optionDescs['mixed'] ?? 'Combination of vendor-provided and self-managed crypto libraries.',
    },
    {
      value: 'in-house' as const,
      label: 'In-House Implementations',
      description:
        optionDescs['in-house'] ?? 'We build and maintain our own cryptographic implementations.',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xl font-bold text-foreground">
          {stepContent.title ?? 'How do you manage cryptographic dependencies?'}
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
              ? 'Syncing with your migrate page product selections'
              : 'Product import from migrate page is off'
          }
        >
          <Import size={12} />
          {importProductSelection ? 'Synced' : 'Import off'}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ?? (
          <>
            Vendor dependencies affect your control over migration timelines. Heavy vendor reliance
            means you depend on their <InlineTooltip term="PQC">PQC</InlineTooltip> roadmap.
          </>
        )}
      </p>

      <PersonaHint stepKey="vendors" />

      {/* Imported products from migrate page */}
      {importProductSelection && (
        <div className="space-y-2">
          {productItems.length > 0 ? (
            <div className="glass-panel p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-secondary shrink-0" />
                  <span className="text-xs font-semibold text-foreground">
                    My Products ({productItems.length})
                  </span>
                </div>
                <Link to="/migrate" className="text-xs text-primary hover:underline">
                  Manage in Migrate
                </Link>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {productItems.map((item) => (
                  <span
                    key={item.key}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium"
                  >
                    {item.name}
                    {item.category && (
                      <span className="text-primary/60 font-normal">· {item.category}</span>
                    )}
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() => handleRemoveProduct(item.key)}
                      className="ml-0.5 hover:text-status-error transition-colors"
                      aria-label={`Remove ${item.name}`}
                    >
                      <X size={10} />
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass-panel p-3 border-l-4 border-l-muted-foreground/30">
              <div className="flex items-center gap-2">
                <Import size={14} className="text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  No products selected yet.{' '}
                  <Link to="/migrate" className="text-primary hover:underline">
                    Select products on the Migrate page
                  </Link>{' '}
                  and they&apos;ll appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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

      <div className="space-y-3" role="radiogroup" aria-label="Vendor dependency model">
        {options.map((opt) => (
          <Button
            key={opt.value}
            variant="ghost"
            role="radio"
            aria-checked={vendorDependency === opt.value}
            onClick={() => setVendorDependency(opt.value)}
            className={clsx(
              'w-full h-auto p-4 flex-col items-start whitespace-normal border',
              vendorDependency === opt.value
                ? 'border-primary bg-primary/10 text-primary hover:bg-primary/10'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:bg-transparent'
            )}
          >
            <span className="font-bold text-sm">{opt.label}</span>
            <p className="text-xs mt-1 opacity-80">{opt.description}</p>
          </Button>
        ))}
      </div>
    </div>
  )
}

export { Step12VendorDependency }
