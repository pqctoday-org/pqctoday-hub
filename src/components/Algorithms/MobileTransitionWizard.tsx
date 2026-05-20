// SPDX-License-Identifier: GPL-3.0-only
import { useState, useMemo } from 'react'
import { ArrowRight, ChevronLeft, FileSignature, Lock, Hash, Key } from 'lucide-react'
import clsx from 'clsx'
import type { AlgorithmTransition } from '../../data/algorithmsData'
import type { AlgorithmDetail } from '../../data/pqcAlgorithmsData'
import { Button } from '@/components/ui/button'
import { AlgorithmCheckButton } from './AlgorithmCheckButton'
import { AlgoCtaStrip } from './AlgoCtaStrip'

type Priority = 'speed' | 'keysize' | 'standardization'

interface MobileTransitionWizardProps {
  data: AlgorithmTransition[]
  pqcDetailMap: Map<string, AlgorithmDetail>
  onShowFullTable: () => void
}

const PRIORITY_OPTS: Array<{ id: Priority; label: string; description: string }> = [
  { id: 'speed', label: 'Speed', description: 'Fastest key gen & signing' },
  { id: 'keysize', label: 'Smaller keys', description: 'Lowest bandwidth overhead' },
  { id: 'standardization', label: 'Standardization', description: 'FIPS / NIST certified' },
]

function functionIcon(fn: AlgorithmTransition['function']) {
  if (fn.includes('Signature')) return <FileSignature size={18} />
  if (fn === 'Hash') return <Hash size={18} />
  if (fn === 'Symmetric') return <Key size={18} />
  return <Lock size={18} />
}

function sortByPriority(
  rows: AlgorithmTransition[],
  priority: Priority,
  detailMap: Map<string, AlgorithmDetail>
): AlgorithmTransition[] {
  return [...rows].sort((a, b) => {
    const cleanA = a.pqc.split(/\s*\(/)[0].trim().toLowerCase()
    const cleanB = b.pqc.split(/\s*\(/)[0].trim().toLowerCase()
    const da = detailMap.get(cleanA)
    const db = detailMap.get(cleanB)

    if (priority === 'speed') {
      // Lattice-based (ML-KEM, ML-DSA, Falcon) are fastest — proxy via cycleCount or family
      const latticeFamilies = ['ml-kem', 'ml-dsa', 'falcon', 'kyber', 'dilithium']
      const aLattice = latticeFamilies.some((f) => cleanA.includes(f))
      const bLattice = latticeFamilies.some((f) => cleanB.includes(f))
      if (aLattice !== bLattice) return aLattice ? -1 : 1
      return 0
    }

    if (priority === 'keysize') {
      const aPk = da?.publicKeySize ?? Infinity
      const bPk = db?.publicKeySize ?? Infinity
      return aPk - bPk
    }

    // standardization: non-Candidate, non-TBC first; then by securityLevel desc
    const statusScore = (row: AlgorithmTransition) => {
      if (row.status === 'Candidate' || row.status === 'To Be Checked') return 1
      return 0
    }
    const diff = statusScore(a) - statusScore(b)
    if (diff !== 0) return diff
    const aLevel = da?.securityLevel ?? 0
    const bLevel = db?.securityLevel ?? 0
    return bLevel - aLevel
  })
}

export function MobileTransitionWizard({
  data,
  pqcDetailMap,
  onShowFullTable,
}: MobileTransitionWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedClassical, setSelectedClassical] = useState<string | null>(null)
  const [priority, setPriority] = useState<Priority | null>(null)

  // Derive unique classical algos, grouped by function
  const classicalGroups = useMemo(() => {
    const seen = new Set<string>()
    const groups: Record<
      string,
      Array<{ classical: string; fn: AlgorithmTransition['function'] }>
    > = {}
    for (const row of data) {
      const key = `${row.classical}|${row.function}`
      if (seen.has(key)) continue
      seen.add(key)
      const group = row.function.includes('Signature')
        ? 'Signature'
        : row.function === 'Encryption/KEM' || row.function.includes('KEM')
          ? 'KEM'
          : 'Other'
      if (!groups[group]) groups[group] = []
      groups[group].push({ classical: row.classical, fn: row.function })
    }
    return groups
  }, [data])

  // Candidates for the selected classical algo
  const candidates = useMemo(() => {
    if (!selectedClassical || !priority) return []
    const matches = data.filter((r) => r.classical === selectedClassical)
    return sortByPriority(matches, priority, pqcDetailMap).slice(0, 2)
  }, [selectedClassical, priority, data, pqcDetailMap])

  const reset = () => {
    setStep(1)
    setSelectedClassical(null)
    setPriority(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5 px-1">
        {([1, 2, 3] as const).map((s) => (
          <div
            key={s}
            className={clsx(
              'h-1 flex-1 rounded-full transition-colors',
              s <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Step 1 — What are you replacing? */}
      {step === 1 && (
        <div className="glass-panel p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">What are you replacing?</p>
          {Object.entries(classicalGroups).map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                {group}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {items.map(({ classical, fn }) => (
                  <Button
                    key={classical}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedClassical(classical)
                      setStep(2)
                    }}
                    className="flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors h-auto"
                  >
                    <span className="text-muted-foreground">{functionIcon(fn)}</span>
                    {classical}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2 — What matters most? */}
      {step === 2 && (
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(1)}
              className="p-0.5 text-muted-foreground hover:text-foreground h-auto"
              aria-label="Back"
            >
              <ChevronLeft size={16} />
            </Button>
            <p className="text-sm font-medium text-foreground">
              What matters most for replacing{' '}
              <span className="text-primary">{selectedClassical}</span>?
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {PRIORITY_OPTS.map((opt) => (
              <Button
                key={opt.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPriority(opt.id)
                  setStep(3)
                }}
                className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3 hover:border-primary/30 hover:bg-primary/5 transition-colors text-left w-full h-auto justify-start"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground">{opt.description}</p>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Recommendations */}
      {step === 3 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep(2)}
              className="p-0.5 text-muted-foreground hover:text-foreground h-auto"
              aria-label="Back"
            >
              <ChevronLeft size={16} />
            </Button>
            <p className="text-xs text-muted-foreground">
              Top picks for <span className="font-medium text-foreground">{selectedClassical}</span>{' '}
              · {PRIORITY_OPTS.find((o) => o.id === priority)?.label}
            </p>
          </div>

          {candidates.length === 0 ? (
            <div className="glass-panel p-4 text-center text-sm text-muted-foreground">
              No matches found. Try a different priority.
            </div>
          ) : (
            candidates.map((row) => {
              const pqcName = row.pqc.split(/\s*\(/)[0].trim()
              const detail = pqcDetailMap.get(pqcName.toLowerCase())
              return (
                <div key={pqcName} className="glass-panel p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-status-success">{pqcName}</p>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                        <ArrowRight size={10} />
                        <span>replaces {row.classical}</span>
                      </div>
                    </div>
                    {detail && (
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {detail.securityLevel !== null && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">
                            L{detail.securityLevel}
                          </span>
                        )}
                        {row.status &&
                          row.status !== 'Candidate' &&
                          row.status !== 'To Be Checked' && (
                            <span className="text-[10px] px-1 py-0.5 rounded border bg-status-success/10 text-status-success border-status-success/20">
                              {row.status}
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                  <AlgoCtaStrip algoName={pqcName} />
                  {detail && <AlgorithmCheckButton algorithm={detail} />}
                </div>
              )
            })
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={reset}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1 h-auto"
          >
            ← Start over
          </Button>
        </div>
      )}

      {/* Escape hatch */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onShowFullTable}
        className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-1 h-auto"
      >
        Show full table →
      </Button>
    </div>
  )
}
