// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'

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

import { Link } from 'react-router-dom'
import { useAssessmentStore } from '../../../store/useAssessmentStore'
import { usePersonaStore } from '../../../store/usePersonaStore'
import { ALGORITHM_DB } from '../../../hooks/assessmentData'
import { loadAlgorithmsData } from '../../../data/algorithmsData'
import type { AlgorithmTransition } from '../../../data/algorithmsData'
import { getPersonaStepContent } from '../../../data/personaWizardHints'

import { PersonaHint } from './PersonaHint'

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

/** Maps transition CSV `function` values to category IDs */
const FUNCTION_TO_CATEGORY: Record<AlgorithmTransition['function'], string> = {
  'Encryption/KEM': 'Key Exchange',
  'Hybrid KEM': 'Key Exchange',
  'Composite KEM': 'Key Exchange',
  'Hybrid KEM (HPKE)': 'Key Exchange',
  'Hybrid KEM with Access Control': 'Key Exchange',
  Signature: 'Signatures',
  'Composite Signature': 'Signatures',
  Symmetric: 'Symmetric Encryption',
  Hash: 'Hash & MAC',
}

interface TransitionChip {
  /** Label shown on the button — e.g. "RSA (2048-bit)", "ECDH (P-256)" */
  displayLabel: string
  /** Key stored in currentCrypto and used for ALGORITHM_DB lookup — e.g. "RSA-2048", "ECDH P-256" */
  storedKey: string
}

/**
 * Convert a transition CSV (classical, keySize) pair to an ALGORITHM_DB-compatible key.
 * "RSA" + "2048-bit"  → "RSA-2048"
 * "ECDH (P-256)"      → "ECDH P-256"   (paren stripped; "256" already in name, no suffix)
 * "Ed25519"           → "Ed25519"       (exact match, no change)
 */
function transitionToAlgoKey(classical: string, keySize?: string): string {
  // Strip "(X)" groups: "ECDH (P-256)" → "ECDH P-256"
  const base = classical
    .replace(/\s*\(([^)]+)\)/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
  if (keySize && keySize !== 'N/A') {
    const numeric = keySize.replace(/[^0-9]/g, '')
    // Only append key-size suffix when it is not already encoded in the base name
    if (numeric && !base.includes(numeric)) return `${base}-${numeric}`
  }
  return base
}

/**
 * Build the chip display label.
 * Appends key size in parens only when it adds information not already in the classical name.
 * "RSA" + "2048-bit" → "RSA (2048-bit)"
 * "ECDH (P-256)"     → "ECDH (P-256)"   (256 already present — skip)
 */
function makeDisplayLabel(classical: string, keySize?: string): string {
  if (!keySize || keySize === 'N/A') return classical
  const numeric = keySize.replace(/[^0-9]/g, '')
  if (numeric && classical.includes(numeric)) return classical
  return `${classical} (${keySize})`
}

const Step3Crypto = () => {
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

  const [algosByCategory, setAlgosByCategory] = useState<Record<string, TransitionChip[]>>({})

  useEffect(() => {
    loadAlgorithmsData().then((transitions) => {
      const grouped: Record<string, TransitionChip[]> = {}
      for (const cat of CRYPTO_CATEGORIES) grouped[cat.id] = []

      const seen = new Set<string>()
      for (const t of transitions) {
        // Skip generic placeholder rows ("Any (Stateless)", "Any (Firmware Signing)")
        if (t.classical.startsWith('Any ')) continue
        const catId = FUNCTION_TO_CATEGORY[t.function]
        if (!catId) continue
        const storedKey = transitionToAlgoKey(t.classical, t.keySize)
        if (seen.has(storedKey)) continue
        seen.add(storedKey)
        grouped[catId].push({
          displayLabel: makeDisplayLabel(t.classical, t.keySize),
          storedKey,
        })
      }
      setAlgosByCategory(grouped)
    })
  }, [])

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
      <h3 className="text-xl font-bold text-foreground">
        {stepContent.title ?? 'What cryptography do you use today?'}
      </h3>
      <p className="text-sm text-muted-foreground">
        {stepContent.description ??
          'Select the algorithm categories your systems use. Optionally narrow to specific algorithms within each category.'}
      </p>

      <PersonaHint stepKey="crypto" />

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
      >
        <Info size={14} className="shrink-0" />
        I&apos;m not sure — help me choose
      </Button>
      {cryptoUnknown && (
        <p className="text-xs text-muted-foreground italic">
          Recommended for {industry || 'your industry'}. You can adjust any selection.
        </p>
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
                    <span className="normal-case font-normal ml-1 text-muted-foreground/60">
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
