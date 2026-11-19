// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect, useMemo, useState } from 'react'
import { isExecutiveBankOverview } from '@/components/Simulation/autorun/autoRunFill'
import { bankRiskEntries, BANK_CASE_NOTE } from '@/components/Simulation/autorun/executiveBankCase'
import { useSimulationStore } from '@/store/useSimulationStore'
import {
  RiskRegisterBuilder,
  AUTOMATIC_RISK_RATING_SCOPE,
  RISK_REGISTER_INPUT_SCOPE,
  type SavedRiskRegisterInputs,
} from '@/components/PKILearning/modules/PQCRiskManagement/components/RiskRegisterBuilder'
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
import {
  useRiskRegisterStore,
  DEFAULT_RISK_ENTRIES,
  type RiskEntry,
} from '@/store/useRiskRegisterStore'
import { useAssessmentSnapshot } from '@/hooks/assessment/useAssessmentSnapshot'
import { useAlgorithmTransitionsForAssessment } from '@/hooks/useAlgorithmTransitionsForAssessment'
import { useExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { Button } from '@/components/ui/button'

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

// Acronyms are matched case-sensitively so ordinary words in product names and
// categories ("ca", "Lms" learning software, "ike") do not count; spelled-out
// terms are matched case-insensitively.
const CONFIDENTIALITY_ACRONYMS =
  /\b(ECDH|ECDHE|X25519|X448|DH|DHE|KEM|ML-KEM|TLS|IPsec|IKEv[12]|IKE|VPN|SSH|HNDL)\b/
const CONFIDENTIALITY_WORDS =
  /\b(Diffie|key exchange|key agreement|key establishment|key transport|encrypt\w*|harvest|confidential\w*|asymmetric|public[- ]key|key management)\b/i
const SIGNATURE_ALGORITHM_TEXT = /\b(ECDSA|EdDSA|Ed25519|Ed448|DSA|ML-DSA|SLH-DSA|LMS|XMSS)\b/
const SIGNATURE_USE_ACRONYMS = /\b(PKI|CA)\b/
const SIGNATURE_USE_WORDS =
  /\b(signature\w*|signing|signed|code[- ]sign\w*|certificate\w*|firmware|secure boot|forgery|authenticity|authentication)\b/i
const SYMMETRIC_ACRONYMS = /\b(AES-\d+|AES|3DES|SHA-?\d+|SHA|HMAC)\b/
const SYMMETRIC_WORDS = /\b(symmetric|hash\w*|Grover)\b/i
const RSA_TEXT = /\bRSA\b/

/**
 * Threat vector for a product or threat row, read from its own text (category,
 * name, crypto-at-risk, description). A row that names only signing primitives
 * or uses is a forgery risk; one that names only symmetric/hash primitives is a
 * Grover risk; anything that names key exchange or encryption — or is
 * ambiguous, like bare "RSA" with no signing use — stays HNDL.
 */
export function inferThreatVectorFromText(text: string): string {
  const conf = CONFIDENTIALITY_ACRONYMS.test(text) || CONFIDENTIALITY_WORDS.test(text)
  const sigUse = SIGNATURE_USE_ACRONYMS.test(text) || SIGNATURE_USE_WORDS.test(text)
  const sigAlg = SIGNATURE_ALGORITHM_TEXT.test(text)
  const rsa = RSA_TEXT.test(text)
  const symmetric = SYMMETRIC_ACRONYMS.test(text) || SYMMETRIC_WORDS.test(text)
  // Bare RSA (no signing use named) can be key transport, so it stays HNDL.
  if ((sigUse || sigAlg) && !conf && !(rsa && !sigUse)) return 'forgery'
  if (symmetric && !sigUse && !sigAlg && !conf && !rsa) return 'grover'
  return 'hndl'
}

/**
 * Likelihood + impact derived from assessment signals:
 *   likelihood: 5 for confidentiality rows if HNDL window open, 4 if reported algorithm with no migration,
 *               3 default
 *   impact: scales with `dataSensitivity` (highest of the user's selections)
 */
function pickLikelihood(
  threatVector: string,
  hndlOpen: boolean,
  migrationStatus: string | undefined
): number {
  if (threatVector === 'hndl' && hndlOpen) return 5
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
  return transitions.map((t, i) => {
    const impact = pickImpact(sensitivities)
    const threatVector = pickThreatVector(t.function)
    return {
      id: `assess-risk-${i + 1}`,
      assetName: `${t.classical}${t.keySize ? ` (${t.keySize})` : ''} usage — ${t.function}`,
      currentAlgorithm: t.storedKey,
      threatVector,
      likelihood: pickLikelihood(threatVector, hndlOpen, migrationStatus),
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
    threatVector: inferThreatVectorFromText(`${p.categoryName ?? ''} ${p.softwareName}`),
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
      threatVector: inferThreatVectorFromText(`${t.cryptoAtRisk ?? ''} ${t.description ?? ''}`),
      likelihood,
      impact: pickImpact(sensitivities),
      mitigation: t.pqcReplacement
        ? `Replace with ${t.pqcReplacement}; tie to PQC roadmap milestone.`
        : 'Document mitigation plan; tie to PQC roadmap milestone.',
    }
  })
}

/** Sample owner roles for the fictional bank walkthrough's three entries. */
const BANK_SAMPLE_OWNERS: Record<string, Pick<RiskEntry, 'ownerRole' | 'nextReview'>> = {
  'bank-portal': { ownerRole: 'Digital channels lead (sample role)', nextReview: '2027-03-31' },
  'bank-archive': { ownerRole: 'Records platform owner (sample role)', nextReview: '2027-03-31' },
  'bank-signing': { ownerRole: 'Release engineering lead (sample role)', nextReview: '2027-06-30' },
}
function bankRegisterEntries(): RiskEntry[] {
  return bankRiskEntries().map((e) => ({ ...BANK_SAMPLE_OWNERS[e.id], ...e }))
}

/**
 * Zero-prop wrapper around {@link RiskRegisterBuilder} for the Command Center
 * artifact drawer and the /business/tools/:id route. Entries are persisted in
 * {@link useRiskRegisterStore}. When the user has assessment data and the
 * store is empty, we seed entries derived from their reported algorithms so
 * the register opens with their context, not the generic demo defaults.
 */
export function RiskRegisterBuilderStandalone() {
  const sector = useSimulationStore((s) => s.sector)
  const sampleBank = isExecutiveBankOverview(sector)
  const [sampleEntries, setSampleEntries] = useState(bankRegisterEntries)
  const savedInputs = useSavedArtifactInputs<SavedRiskRegisterInputs>(
    'risk-register',
    RISK_REGISTER_INPUT_SCOPE
  )
  const savedEntries = useMemo(
    () => (Array.isArray(savedInputs?.entries) ? savedInputs.entries : []),
    [savedInputs]
  )
  const riskEntries = useRiskRegisterStore((s) => s.riskEntries)
  const setRiskEntries = useRiskRegisterStore((s) => s.setRiskEntries)
  const { input, result } = useAssessmentSnapshot()
  const transitions = useAlgorithmTransitionsForAssessment()
  const { myFrameworks, myProducts, myThreats } = useExecutiveModuleData()

  const sensitivities = useMemo(() => input?.dataSensitivity ?? [], [input?.dataSensitivity])
  const hasFrameworkPressure = myFrameworks.length > 0

  const fullSeed = useMemo(() => {
    const algoRows = transitions.length
      ? buildAssessmentSeed(
          transitions,
          result?.hndlRiskWindow?.isAtRisk ?? false,
          input?.migrationStatus,
          sensitivities
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
    myProducts,
    myThreats,
  ])

  // Derive whether the current entries originated from the assessment seeder
  // by inspecting the id prefix we set in buildAssessmentSeed.
  const seededFromAssessment =
    riskEntries.length > 0 && riskEntries[0]?.id?.startsWith('assess-risk-')

  // True when the register is showing the illustrative demo defaults (cold start,
  // no assessment data) — these must be labelled as examples, not the user's data.
  const showingExamples =
    !seededFromAssessment &&
    riskEntries.length > 0 &&
    riskEntries.every((e) => e.id.startsWith('default-'))

  useEffect(() => {
    // Only auto-seed when the register is empty. A saved register (its last
    // Save) wins over fresh seeding; otherwise seed from context when there is
    // at least one seed row, else let RiskRegisterBuilder's own defaults run.
    if (sampleBank || riskEntries.length > 0) return
    if (savedEntries.length > 0) setRiskEntries(savedEntries)
    else if (fullSeed.length > 0) setRiskEntries(fullSeed)
  }, [sampleBank, riskEntries.length, fullSeed, savedEntries, setRiskEntries])

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
  if (hasFrameworkPressure)
    sources.push(
      `${myFrameworks.length} starred framework reference${myFrameworks.length !== 1 ? 's' : ''}`
    )

  return (
    <div className="space-y-3">
      {sampleBank && (
        <p className="rounded-lg border border-primary/30 p-3 text-xs text-muted-foreground">
          {BANK_CASE_NOTE}
        </p>
      )}
      {!sampleBank && seededFromAssessment && fullSeed.length > 0 && (
        <div
          className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3"
          role="status"
        >
          <p className="flex-1 min-w-0 text-xs text-foreground">
            <strong>Stored worksheet context.</strong>{' '}
            {`${riskEntries.length} stored risk entr${riskEntries.length !== 1 ? 'ies' : 'y'}. Current available context: ${sources.join(' + ')}. Stored or edited entries may reflect earlier inputs; this is not a fresh assessment of these rows.`}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="shrink-0 h-7 px-2 text-xs"
          >
            Restore sample entries
          </Button>
        </div>
      )}
      {!sampleBank && showingExamples && (
        <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Example entries</span> — these are
          illustrative placeholders, not your data. Edit or replace them to build your own register
          (run an assessment to auto-seed from your reported algorithms).
        </div>
      )}
      {!sampleBank && (
        <details className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            How automatic starting ratings work
          </summary>
          <p className="mt-2">{AUTOMATIC_RISK_RATING_SCOPE}</p>
        </details>
      )}
      <RiskRegisterBuilder
        riskEntries={sampleBank ? sampleEntries : riskEntries}
        onRiskEntriesChange={sampleBank ? setSampleEntries : setRiskEntries}
        showExampleBanner={false}
      />
    </div>
  )
}

export default RiskRegisterBuilderStandalone
