// SPDX-License-Identifier: AGPL-3.0-only
import { useMemo } from 'react'

import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Hash,
  Info,
  Pen,
  ShieldCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '../../ui/button'

import clsx from 'clsx'

import { Link } from 'react-router'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { ALGORITHM_DB } from '../../../hooks/assessmentData'
import { getPersonaStepContent } from '../../../data/personaWizardHints'

import { PersonaHint } from './PersonaHint'
import { useAlgorithmChipsByCategory } from '@/data/cryptoAlgorithmChips'

import type { EmbeddedStepProps } from '../redesign/assessFlowModel'
import { CbomImportPanel } from '../CbomImportPanel'

interface CryptoCategory {
  id: string
  label: string
  icon: LucideIcon
  borderColor: string
  iconColor: string
}

const CRYPTO_CATEGORIES: CryptoCategory[] = [
  {
    id: 'Key Exchange',
    label: 'Key Exchange',
    icon: ArrowLeftRight,
    borderColor: 'border-primary',
    iconColor: 'text-primary',
  },
  {
    id: 'Signatures',
    label: 'Signatures',
    icon: Pen,
    borderColor: 'border-accent',
    iconColor: 'text-accent',
  },
  {
    id: 'Symmetric Encryption',
    label: 'Symmetric Encryption',
    icon: ShieldCheck,
    borderColor: 'border-success',
    iconColor: 'text-success',
  },
  {
    id: 'Hash & MAC',
    label: 'Hash & MAC',
    icon: Hash,
    borderColor: 'border-warning',
    iconColor: 'text-warning',
  },
]

const Step3Crypto = ({ hideHeading = false, hideHints = false }: EmbeddedStepProps = {}) => {
  const {
    currentCrypto,
    currentCryptoCategories,
    toggleCrypto,
    toggleCryptoCategory,
    cryptoUnknown,
    setCryptoUnknown,
  } = useAssessmentStore()
  const industry = useAssessmentStore((s) => s.industry)

  const persona = usePersonaStore((s) => s.selectedPersona)
  const experienceLevel = usePersonaStore((s) => s.experienceLevel)
  const stepContent = getPersonaStepContent(persona, 'crypto', experienceLevel, industry)

  const algosByCategory = useAlgorithmChipsByCategory()

  // The vocabulary a CBOM is matched against is this step's OWN option list,
  // flattened — so the importer can never offer an algorithm the wizard has no
  // chip for.
  const cbomOptions = useMemo(
    () => Object.values(algosByCategory).flatMap((chips) => chips.map((c) => c.storedKey)),
    [algosByCategory]
  )

  const handleCategoryToggle = (cat: CryptoCategory) => {
    const alreadySelected = currentCryptoCategories.includes(cat.id)
    toggleCryptoCategory(cat.id)
    if (alreadySelected) {
      // Clear specific algos belonging to this category
      const algosInCat = algosByCategory[cat.id] ?? []
      algosInCat.forEach((a) => {
        if (currentCrypto.includes(a.storedKey)) toggleCrypto(a.storedKey)
      })
    }
  }

  const isDisabled = false // smart defaults keep options interactive

  return (
    <div className="space-y-4">
      {!hideHeading && (
        <>
          <h3 className="text-xl font-bold text-foreground">
            {stepContent.title ?? 'What cryptography do you use today?'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {stepContent.description ??
              'Select the algorithm categories your systems use. Optionally narrow to specific algorithms within each category.'}
          </p>
        </>
      )}

      {!hideHints && <PersonaHint stepKey="crypto" />}

      {/* Smart defaults escape hatch */}
      <Button
        variant="ghost"
        aria-pressed={cryptoUnknown}
        onClick={() => setCryptoUnknown(!cryptoUnknown)}
        className={clsx(
          'w-full h-auto p-3 justify-start gap-2 whitespace-normal border',
          cryptoUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground hover:bg-muted/20'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground hover:bg-transparent'
        )}
        data-workshop-target="assess-not-sure"
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {cryptoUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Your inventory is recorded as unknown. The report uses conservative exposure assumptions
          and recommends identifying which algorithms your services and dependencies actually use.
        </p>
      )}

      {/* B+ remediation 4.4 (2026-08-10): a developer can usually produce this
          answer as a file, and the repo already emits the format. Offered to
          developers only — every other role is more likely to be describing an
          estate than exporting one, and an import control they cannot use is
          the kind of dead offer this programme has been removing. */}
      {persona === 'developer' && (
        <CbomImportPanel
          options={cbomOptions}
          selected={currentCrypto}
          onApply={(algorithms) => {
            // Selecting an algorithm requires its category to be open, or the
            // chip has nowhere to render — mirror what a click would have done.
            for (const algo of algorithms) {
              const cat = CRYPTO_CATEGORIES.find((c) =>
                (algosByCategory[c.id] ?? []).some((a) => a.storedKey === algo)
              )
              if (cat && !currentCryptoCategories.includes(cat.id)) toggleCryptoCategory(cat.id)
              if (!currentCrypto.includes(algo)) toggleCrypto(algo)
            }
          }}
        />
      )}

      {/* Category cards — multi-select */}
      <div
        className={clsx(
          'grid grid-cols-2 md:grid-cols-4 gap-2 transition-opacity',
          isDisabled && 'opacity-40 pointer-events-none'
        )}
        role="group"
        aria-label="Algorithm category selection"
        aria-disabled={isDisabled}
      >
        {CRYPTO_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isSelected = currentCryptoCategories.includes(cat.id)
          return (
            <Button
              key={cat.id}
              variant="ghost"
              aria-pressed={isSelected}
              onClick={() => handleCategoryToggle(cat)}
              className={clsx(
                'h-auto p-3 flex-col items-start gap-1.5 border',
                isSelected
                  ? `${cat.borderColor} bg-primary/10 text-primary hover:bg-primary/10`
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground hover:bg-transparent'
              )}
            >
              <span className={clsx('flex items-center gap-1.5', isSelected && cat.iconColor)}>
                <Icon size={15} />
                <span className="font-semibold text-xs">{cat.label}</span>
              </span>
            </Button>
          )
        })}
      </div>

      {/* Per-category specific algorithm chips */}
      {currentCryptoCategories.length > 0 && !isDisabled && (
        <div className="space-y-3 pt-2">
          {CRYPTO_CATEGORIES.filter((cat) => currentCryptoCategories.includes(cat.id)).map(
            (cat) => {
              const algos = algosByCategory[cat.id] ?? []
              if (algos.length === 0) return null
              return (
                <div key={cat.id} className="glass-panel p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {cat.label} — specific algorithms
                    <span className="normal-case font-normal ml-1 text-muted-foreground">
                      (none selected = all included)
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {algos.map((algo) => {
                      const isActive = currentCrypto.includes(algo.storedKey)
                      const isVulnerable = ALGORITHM_DB[algo.storedKey]?.quantumVulnerable ?? false
                      return (
                        <Button
                          key={algo.storedKey}
                          variant="ghost"
                          type="button"
                          onClick={() => toggleCrypto(algo.storedKey)}
                          className={clsx(
                            'h-auto text-xs px-2.5 py-1 rounded-full border gap-1',
                            isActive
                              ? 'bg-primary/10 text-primary border-primary/40 font-medium hover:bg-primary/10'
                              : 'bg-background/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground hover:bg-transparent'
                          )}
                        >
                          {algo.displayLabel}
                          {isVulnerable && (
                            <AlertTriangle size={10} className="text-warning shrink-0" />
                          )}
                        </Button>
                      )
                    })}
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <AlertTriangle size={12} className="text-warning" />= Quantum-vulnerable algorithm
        </p>
        <Link
          to="/algorithms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <ArrowRight size={12} />
          Compare algorithms
        </Link>
      </div>
    </div>
  )
}

export { Step3Crypto }
