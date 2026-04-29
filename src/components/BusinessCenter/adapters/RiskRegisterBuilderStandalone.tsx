// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useMemo } from 'react'
import { RiskRegisterBuilder } from '@/components/PKILearning/modules/PQCRiskManagement/components/RiskRegisterBuilder'
import {
  useRiskRegisterStore,
  DEFAULT_RISK_ENTRIES,
  type RiskEntry,
} from '@/store/useRiskRegisterStore'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import { useAlgorithmTransitionsForAssessment } from '@/hooks/useAlgorithmTransitionsForAssessment'
import { PreFilledBanner } from '@/components/BusinessCenter/widgets/PreFilledBanner'

/**
 * Map a transition row's classical/key-size pair into a likely threat vector.
 * Encryption/KEM and Hybrid KEM map to HNDL (data harvested today, decrypted
 * by a future CRQC). Signature schemes map to "forgery" (signed artifacts can
 * be re-forged once the key is broken).
 */
function pickThreatVector(fnGroup: string): string {
  if (/Signature/i.test(fnGroup)) return 'forgery'
  if (/Symmetric|Hash/i.test(fnGroup)) return 'grover'
  return 'hndl'
}

/**
 * Likelihood + impact derived from assessment signals:
 *   likelihood: 5 if HNDL window open, 4 if reported algorithm with no migration,
 *               3 default
 *   impact: scales with `dataSensitivity` (highest of the user's selections)
 */
function pickLikelihood(hndlOpen: boolean, migrationStatus: string | undefined): number {
  if (hndlOpen) return 5
  if (migrationStatus === 'not-started') return 4
  if (migrationStatus === 'planning') return 3
  return 3
}

function pickImpact(sensitivities: string[]): number {
  const lc = sensitivities.map((s) => s.toLowerCase())
  if (lc.some((s) => s.includes('critical') || s.includes('classified'))) return 5
  if (lc.some((s) => s.includes('high') || s.includes('regulated'))) return 4
  if (lc.some((s) => s.includes('medium'))) return 3
  if (lc.some((s) => s.includes('low'))) return 2
  return 3
}

function buildAssessmentSeed(
  transitions: ReturnType<typeof useAlgorithmTransitionsForAssessment>,
  hndlOpen: boolean,
  migrationStatus: string | undefined,
  sensitivities: string[]
): RiskEntry[] {
  return transitions.map((t, i) => ({
    id: `assess-risk-${i + 1}`,
    assetName: `${t.classical}${t.keySize ? ` (${t.keySize})` : ''} usage — ${t.function}`,
    currentAlgorithm: t.storedKey,
    threatVector: pickThreatVector(t.function),
    likelihood: pickLikelihood(hndlOpen, migrationStatus),
    impact: pickImpact(sensitivities),
    mitigation: `Migrate to ${t.pqc}${t.deprecationDate ? ` before ${t.deprecationDate}` : ''} (${t.status}).`,
  }))
}

/**
 * Zero-prop wrapper around {@link RiskRegisterBuilder} for the Command Center
 * artifact drawer and the /business/tools/:id route. Entries are persisted in
 * {@link useRiskRegisterStore}. When the user has assessment data and the
 * store is empty, we seed entries derived from their reported algorithms so
 * the register opens with their context, not the generic demo defaults.
 */
export function RiskRegisterBuilderStandalone() {
  const riskEntries = useRiskRegisterStore((s) => s.riskEntries)
  const setRiskEntries = useRiskRegisterStore((s) => s.setRiskEntries)
  const { input, result } = useAssessmentSnapshot()
  const transitions = useAlgorithmTransitionsForAssessment()

  const assessmentSeed = useMemo(() => {
    if (transitions.length === 0) return null
    return buildAssessmentSeed(
      transitions,
      result?.hndlRiskWindow?.isAtRisk ?? false,
      input?.migrationStatus,
      input?.dataSensitivity ?? []
    )
  }, [
    transitions,
    result?.hndlRiskWindow?.isAtRisk,
    input?.migrationStatus,
    input?.dataSensitivity,
  ])

  // Derive whether the current entries originated from the assessment seeder
  // by inspecting the id prefix we set in buildAssessmentSeed.
  const seededFromAssessment =
    riskEntries.length > 0 && riskEntries[0]?.id?.startsWith('assess-risk-')

  useEffect(() => {
    // Only auto-seed when the register is empty AND we have assessment-derived
    // entries to offer. Otherwise let RiskRegisterBuilder's own defaults run.
    if (riskEntries.length === 0 && assessmentSeed && assessmentSeed.length > 0) {
      setRiskEntries(assessmentSeed)
    }
  }, [riskEntries.length, assessmentSeed, setRiskEntries])

  const handleClear = () => {
    setRiskEntries(DEFAULT_RISK_ENTRIES)
  }

  return (
    <div className="space-y-3">
      {seededFromAssessment && assessmentSeed && (
        <PreFilledBanner
          summary={`${assessmentSeed.length} risk entr${assessmentSeed.length !== 1 ? 'ies' : 'y'} from your reported algorithms, with likelihood and impact derived from your data sensitivity and HNDL window.`}
          onClear={handleClear}
        />
      )}
      <RiskRegisterBuilder riskEntries={riskEntries} onRiskEntriesChange={setRiskEntries} />
    </div>
  )
}

export default RiskRegisterBuilderStandalone
