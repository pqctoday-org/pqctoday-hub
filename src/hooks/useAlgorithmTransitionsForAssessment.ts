// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import { algorithmsData, type AlgorithmTransition } from '@/data/algorithmsData'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'

export interface AssessmentTransition {
  storedKey: string
  classical: string
  keySize?: string
  pqc: string
  function: AlgorithmTransition['function']
  deprecationDate: string
  standardizationDate: string
  region: string
  status: string
  statusUrl?: string
}

/**
 * Mirrors transitionToAlgoKey() in Step3Crypto so we can match the user's
 * stored crypto keys back to transition CSV rows.
 */
function transitionToAlgoKey(classical: string, keySize?: string): string {
  const base = classical
    .replace(/\s*\(([^)]+)\)/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim()
  if (keySize && keySize !== 'N/A') {
    const numeric = keySize.replace(/[^0-9]/g, '')
    if (numeric && !base.includes(numeric)) return `${base}-${numeric}`
  }
  return base
}

/**
 * Pure selector — exported for unit testing without the React hook wrapper.
 * Joins user's reported algorithms against the transitions CSV.
 */
export function selectTransitionsForCrypto(
  currentCrypto: string[],
  transitions: AlgorithmTransition[]
): AssessmentTransition[] {
  if (currentCrypto.length === 0) return []
  const wanted = new Set(currentCrypto)
  const seen = new Set<string>()
  const out: AssessmentTransition[] = []
  for (const t of transitions) {
    if (t.classical.startsWith('Any ')) continue
    const storedKey = transitionToAlgoKey(t.classical, t.keySize)
    if (!wanted.has(storedKey)) continue
    if (seen.has(storedKey)) continue
    seen.add(storedKey)
    out.push({ storedKey, ...t })
  }
  return out
}

/**
 * Hook variant — reads the user's currentCrypto from the assessment snapshot
 * and joins it against the loaded transitions CSV.
 */
export function useAlgorithmTransitionsForAssessment(): AssessmentTransition[] {
  const { input } = useAssessmentSnapshot()
  const currentCrypto = input?.currentCrypto ?? []
  return useMemo(() => selectTransitionsForCrypto(currentCrypto, algorithmsData), [currentCrypto])
}
