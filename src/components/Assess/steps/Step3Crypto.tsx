import { useEffect, useState } from 'react'

import { AlertTriangle, ArrowLeftRight, Hash, Info, Pen, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import clsx from 'clsx'

import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { ALGORITHM_DB } from '../../../hooks/assessmentData'
import { isClassical, loadPQCAlgorithmsData } from '../../../data/pqcAlgorithmsData'
import type { AlgorithmDetail } from '../../../data/pqcAlgorithmsData'

import { PersonaHint } from './PersonaHint'

interface CryptoCategory {
  id: string
  label: string
  family: string
  icon: LucideIcon
  borderColor: string
  iconColor: string
}

const CRYPTO_CATEGORIES: CryptoCategory[] = [
  {
    id: 'Key Exchange',
    label: 'Key Exchange',
    family: 'Classical KEM',
    icon: ArrowLeftRight,
    borderColor: 'border-primary',
    iconColor: 'text-primary',
  },
  {
    id: 'Signatures',
    label: 'Signatures',
    family: 'Classical Sig',
    icon: Pen,
    borderColor: 'border-accent',
    iconColor: 'text-accent',
  },
  {
    id: 'Symmetric Encryption',
    label: 'Symmetric Encryption',
    family: 'Classical Symmetric',
    icon: ShieldCheck,
    borderColor: 'border-success',
    iconColor: 'text-success',
  },
  {
    id: 'Hash & MAC',
    label: 'Hash & MAC',
    family: 'Classical Hash',
    icon: Hash,
    borderColor: 'border-warning',
    iconColor: 'text-warning',
  },
]

const Step3Crypto = () => {
  const {
    currentCrypto,
    currentCryptoCategories,
    toggleCrypto,
    toggleCryptoCategory,
    cryptoUnknown,
    setCryptoUnknown,
  } = useAssessmentStore()

  const [algosByCategory, setAlgosByCategory] = useState<Record<string, AlgorithmDetail[]>>({})

  useEffect(() => {
    loadPQCAlgorithmsData().then((algos) => {
      const classical = algos.filter(isClassical)
      const grouped: Record<string, AlgorithmDetail[]> = {}
      for (const cat of CRYPTO_CATEGORIES) {
        grouped[cat.family] = classical.filter((a) => a.family === cat.family)
      }
      setAlgosByCategory(grouped)
    })
  }, [])

  const handleCategoryToggle = (cat: CryptoCategory) => {
    const alreadySelected = currentCryptoCategories.includes(cat.id)
    toggleCryptoCategory(cat.id)
    if (alreadySelected) {
      // Clear specific algos belonging to this category
      const algosInCat = algosByCategory[cat.family] ?? []
      algosInCat.forEach((a) => {
        if (currentCrypto.includes(a.name)) toggleCrypto(a.name)
      })
    }
  }

  const isDisabled = cryptoUnknown

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-foreground">What cryptography do you use today?</h3>
      <p className="text-sm text-muted-foreground">
        Select the algorithm categories your systems use. Optionally narrow to specific algorithms
        within each category.
      </p>

      <PersonaHint stepKey="crypto" />

      {/* I don't know escape hatch */}
      <button
        aria-pressed={cryptoUnknown}
        onClick={() => setCryptoUnknown(!cryptoUnknown)}
        className={clsx(
          'w-full p-3 rounded-lg border text-left text-sm font-medium transition-colors flex items-center gap-2',
          cryptoUnknown
            ? 'border-muted-foreground bg-muted/20 text-foreground'
            : 'border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground'
        )}
      >
        <Info size={14} className="shrink-0" />I don&apos;t know / Not sure what algorithms we use
      </button>

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
            <button
              key={cat.id}
              aria-pressed={isSelected}
              onClick={() => handleCategoryToggle(cat)}
              className={clsx(
                'p-3 rounded-lg border text-left text-sm font-medium transition-colors flex flex-col gap-1.5',
                isSelected
                  ? `${cat.borderColor} bg-primary/10 text-primary`
                  : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              )}
            >
              <span className={clsx('flex items-center gap-1.5', isSelected && cat.iconColor)}>
                <Icon size={15} />
                <span className="font-semibold text-xs">{cat.label}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Per-category specific algorithm chips */}
      {currentCryptoCategories.length > 0 && !isDisabled && (
        <div className="space-y-3 pt-2">
          {CRYPTO_CATEGORIES.filter((cat) => currentCryptoCategories.includes(cat.id)).map(
            (cat) => {
              const algos = algosByCategory[cat.family] ?? []
              if (algos.length === 0) return null
              return (
                <div key={cat.id} className="glass-panel p-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {cat.label} — specific algorithms
                    <span className="normal-case font-normal ml-1 text-muted-foreground/60">
                      (none selected = all included)
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {algos.map((algo) => {
                      const isActive = currentCrypto.includes(algo.name)
                      const isVulnerable = ALGORITHM_DB[algo.name]?.quantumVulnerable ?? false
                      return (
                        <button
                          key={algo.name}
                          type="button"
                          onClick={() => toggleCrypto(algo.name)}
                          className={clsx(
                            'text-xs px-2.5 py-1 rounded-full border transition-colors flex items-center gap-1',
                            isActive
                              ? 'bg-primary/10 text-primary border-primary/40 font-medium'
                              : 'bg-background/30 text-muted-foreground border-border/40 hover:border-border hover:text-foreground'
                          )}
                        >
                          {algo.name}
                          {isVulnerable && (
                            <AlertTriangle size={10} className="text-warning shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            }
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <AlertTriangle size={12} className="text-warning" />= Quantum-vulnerable algorithm
      </p>
    </div>
  )
}

export { Step3Crypto }
