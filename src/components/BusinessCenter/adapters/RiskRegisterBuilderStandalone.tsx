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
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
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
  sensitivities: string[],
  hasFrameworkPressure: boolean
): RiskEntry[] {
  return transitions.map((t, i) => {
    // Framework deadline pressure bumps impact +1 (capped at 5).
    const baseImpact = pickImpact(sensitivities)
    const impact = hasFrameworkPressure ? Math.min(5, baseImpact + 1) : baseImpact
    return {
      id: `assess-risk-${i + 1}`,
      assetName: `${t.classical}${t.keySize ? ` (${t.keySize})` : ''} usage — ${t.function}`,
      currentAlgorithm: t.storedKey,
      threatVector: pickThreatVector(t.function),
      likelihood: pickLikelihood(hndlOpen, migrationStatus),
      impact,
      mitigation: `Migrate to ${t.pqc}${t.deprecationDate ? ` before ${t.deprecationDate}` : ''} (${t.status}).`,
    }
  })
}

/** Add one row per bookmarked product, marking each as an at-risk asset. */
function buildProductSeed(
  products: ReturnType<typeof useExecutiveModuleData>['myProducts'],
  sensitivities: string[]
): RiskEntry[] {
  return products.slice(0, 12).map((p, i) => ({
    id: `assess-risk-product-${i + 1}`,
    assetName: `${p.softwareName}${p.vendorId ? ` (${p.vendorId})` : ''}`,
    currentAlgorithm: p.pqcSupport && p.pqcSupport !== 'None' ? p.pqcSupport : 'Classical',
    threatVector: 'hndl',
    likelihood: 4,
    impact: pickImpact(sensitivities),
    mitigation: `Track vendor PQC roadmap; substitute or contain if no PQC support before deadline.`,
  }))
}

/** Add one row per bookmarked threat to surface industry-specific concerns. */
function buildThreatSeed(
  threats: ReturnType<typeof useExecutiveModuleData>['myThreats'],
  sensitivities: string[]
): RiskEntry[] {
  return threats.slice(0, 8).map((t, i) => {
    const crit = (t.criticality || '').toLowerCase()
    const likelihood = crit === 'critical' ? 5 : crit === 'high' ? 4 : 3
    const headline = (t.description || t.threatId).split(/[.;]/)[0]?.trim() || t.threatId
    return {
      id: `assess-risk-threat-${i + 1}`,
      assetName: `${t.industry}: ${headline}`,
      currentAlgorithm: t.cryptoAtRisk || 'Classical',
      threatVector: 'hndl',
      likelihood,
      impact: pickImpact(sensitivities),
      mitigation: t.pqcReplacement
        ? `Replace with ${t.pqcReplacement}; tie to PQC roadmap milestone.`
        : 'Document mitigation plan; tie to PQC roadmap milestone.',
    }
  })
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
  const { myFrameworks, myProducts, myThreats } = useExecutiveModuleData()

  const sensitivities = input?.dataSensitivity ?? []
  const hasFrameworkPressure = myFrameworks.length > 0

  const fullSeed = useMemo(() => {
    const algoRows = transitions.length
      ? buildAssessmentSeed(
          transitions,
          result?.hndlRiskWindow?.isAtRisk ?? false,
          input?.migrationStatus,
          sensitivities,
          hasFrameworkPressure
        )
      : []
    const productRows = myProducts.length ? buildProductSeed(myProducts, sensitivities) : []
    const threatRows = myThreats.length ? buildThreatSeed(myThreats, sensitivities) : []
    return [...algoRows, ...productRows, ...threatRows]
  }, [
    transitions,
    result?.hndlRiskWindow?.isAtRisk,
    input?.migrationStatus,
    sensitivities,
    hasFrameworkPressure,
    myProducts,
    myThreats,
  ])

  // Derive whether the current entries originated from the assessment seeder
  // by inspecting the id prefix we set in buildAssessmentSeed.
  const seededFromAssessment =
    riskEntries.length > 0 && riskEntries[0]?.id?.startsWith('assess-risk-')

  useEffect(() => {
    // Only auto-seed when the register is empty AND we have at least one
    // seed row. Otherwise let RiskRegisterBuilder's own defaults run.
    if (riskEntries.length === 0 && fullSeed.length > 0) {
      setRiskEntries(fullSeed)
    }
  }, [riskEntries.length, fullSeed, setRiskEntries])

  const handleClear = () => {
    setRiskEntries(DEFAULT_RISK_ENTRIES)
  }

  const sources: string[] = []
  if (transitions.length > 0)
    sources.push(`${transitions.length} reported algorithm${transitions.length !== 1 ? 's' : ''}`)
  if (myProducts.length > 0)
    sources.push(`${myProducts.length} product${myProducts.length !== 1 ? 's' : ''} from /migrate`)
  if (myThreats.length > 0)
    sources.push(`${myThreats.length} threat${myThreats.length !== 1 ? 's' : ''} from /threats`)
  if (hasFrameworkPressure) sources.push(`framework pressure from ${myFrameworks.length} starred`)

  return (
    <div className="space-y-3">
      {seededFromAssessment && fullSeed.length > 0 && (
        <PreFilledBanner
          summary={`${fullSeed.length} risk entr${fullSeed.length !== 1 ? 'ies' : 'y'} seeded from ${sources.join(' + ')}.`}
          onClear={handleClear}
        />
      )}
      <RiskRegisterBuilder riskEntries={riskEntries} onRiskEntriesChange={setRiskEntries} />
    </div>
  )
}

export default RiskRegisterBuilderStandalone
