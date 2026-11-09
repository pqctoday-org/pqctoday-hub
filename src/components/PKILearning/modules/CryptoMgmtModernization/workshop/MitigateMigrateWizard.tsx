// SPDX-License-Identifier: AGPL-3.0-only
import React, { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowRight, CheckCircle2, GitFork, RefreshCw } from 'lucide-react'
import type { CbomExportItem } from '../data/workshopTypes'

interface MitigateMigrateWizardProps {
  cbomAssets: CbomExportItem[]
}

type Phase = 'select' | 'questions' | 'result'
type Answer = 'yes' | 'no' | null
type Recommendation = 'migrate' | 'mitigate'

interface Question {
  text: string
  context: string
  migrateIfYes: boolean
}

const QUESTIONS: Question[] = [
  {
    text: 'Is the source code available and actively maintained by your team?',
    context:
      'Source availability affects direct modification options. Check supported supplier upgrades or replacement paths before ruling out migration.',
    migrateIfYes: true,
  },
  {
    text: 'Can the cryptographic components be replaced without a full system rebuild?',
    context:
      'Embedded algorithms in compiled binaries with no abstraction layer typically require a full rebuild.',
    migrateIfYes: true,
  },
  {
    text: 'Does the system expose modular cryptographic APIs (PKCS#11, JCE, CNG, OpenSSL EVP)?',
    context:
      'A modular API can help isolate changes, but it does not establish algorithm, provider or protocol support. Check the intended integration.',
    migrateIfYes: true,
  },
  {
    text: 'Is this system scheduled for a technology refresh within 3 years?',
    context:
      'A scheduled refresh creates a natural migration window aligned to current CNSA 2.0 milestones — new NSS acquisitions from 2027, unsupported equipment and services phased out by 2030, and the algorithms mandated by 31 Dec 2031 unless otherwise noted.',
    migrateIfYes: true,
  },
  {
    text: 'Can the system tolerate a planned maintenance window for migration testing?',
    context:
      'Limited downtime motivates evaluating deployment alternatives; it does not establish that a live gateway is applicable or sufficient.',
    migrateIfYes: true,
  },
]

interface PlanningAsset {
  name: string
  description: string
  purpose?: 'certificate-trust' | 'artifact-signing' | 'transport'
}

const SAMPLE_ASSETS: PlanningAsset[] = [
  {
    name: 'Legacy PKI system (SHA-1 certs)',
    purpose: 'certificate-trust',
    description: '15-year-old PKI; source partially unavailable; team disbanded.',
  },
  {
    name: 'TLS Load Balancer (TLS 1.2 only)',
    purpose: 'transport',
    description: 'F5 BIG-IP; modular TLS config; vendor patch available.',
  },
  {
    name: 'Embedded IoT Gateway (ECDSA P-256)',
    description: 'ARM Cortex-M4; OTA-updatable firmware; no crypto abstraction layer.',
  },
  {
    name: 'Enterprise LDAP service (SHA-1 TLS)',
    purpose: 'transport',
    description: 'Legacy directory; configurable cipher suite; vendor patch available.',
  },
  {
    name: 'Code signing pipeline (RSA-2048)',
    purpose: 'artifact-signing',
    description: 'Jenkins + OpenSSL 1.1.1; can upgrade to 3.x with oqs-provider.',
  },
]

function deriveRecommendation(answers: Answer[]): Recommendation {
  const migrateCount = answers.filter((a, i) => {
    if (a === null) return false
    return QUESTIONS[i].migrateIfYes ? a === 'yes' : a === 'no'
  }).length
  const directPrerequisitesMet = answers[0] === 'yes' && answers[1] === 'yes'
  return directPrerequisitesMet && migrateCount >= 3 ? 'migrate' : 'mitigate'
}

const sunsetYear = new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).getFullYear()

export const MitigateMigrateWizard: React.FC<MitigateMigrateWizardProps> = ({ cbomAssets }) => {
  const [phase, setPhase] = useState<Phase>('select')
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [answers, setAnswers] = useState<Answer[]>(Array(QUESTIONS.length).fill(null))
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)

  const assetOptions = useMemo<PlanningAsset[]>(
    () =>
      cbomAssets.length > 0
        ? cbomAssets.map((a) => ({ name: `${a.name} (${a.version})`, description: a.notes }))
        : SAMPLE_ASSETS,
    [cbomAssets]
  )

  const selectedPurpose = assetOptions.find((asset) => asset.name === selectedAsset)?.purpose
  const trustPathCase =
    selectedPurpose === 'certificate-trust' || selectedPurpose === 'artifact-signing'
  const usingLive = cbomAssets.length > 0

  const allAnswered = answers.every((a) => a !== null)

  const setAnswer = (idx: number, val: Answer) =>
    setAnswers((prev) => {
      const next = [...prev]
      next[idx] = val
      return next
    })

  const handleGetRecommendation = () => {
    setRecommendation(deriveRecommendation(answers))
    setPhase('result')
  }

  const handleReset = () => {
    setPhase('select')
    setSelectedAsset('')
    setAnswers(Array(QUESTIONS.length).fill(null))
    setRecommendation(null)
  }

  const migrateCount = answers.filter((a, i) => {
    if (a === null) return false
    return QUESTIONS[i].migrateIfYes ? a === 'yes' : a === 'no'
  }).length

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Use this Hub teaching decision tree to discuss <strong>Migration</strong> (algorithm
        replacement) and <strong>Mitigation</strong> (crypto gateway / bump-in-the-wire). These five
        questions are Hub guidance, not a NIST assessment. NIST CSWP.39 §4.6 is related reading on
        gateway architecture for legacy systems.
      </p>

      {/* Phase 1: Asset selection */}
      {phase === 'select' && (
        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-3">
            <div className="font-bold text-foreground text-sm">Select an asset to assess</div>
            {!usingLive && (
              <p className="text-xs text-muted-foreground">
                No mapped Step 3 rows are available — using illustrative sample assets, not findings
                from an empty or invalid draft.
              </p>
            )}
            {usingLive && (
              <p className="text-xs text-status-success">
                Using the last valid Step 3 components sample ({cbomAssets.length} rows available),
                not necessarily the current draft.
              </p>
            )}
            <div className="space-y-2">
              {assetOptions.map((opt) => (
                <Button
                  key={opt.name}
                  variant={selectedAsset === opt.name ? 'gradient' : 'outline'}
                  onClick={() => setSelectedAsset(opt.name)}
                  className="whitespace-normal w-full h-auto p-3 text-left flex-col items-start text-xs"
                >
                  <div className="font-bold">{opt.name}</div>
                  <div className="text-[11px] font-normal mt-0.5 opacity-80">{opt.description}</div>
                </Button>
              ))}
            </div>
          </div>

          <Button
            variant="gradient"
            disabled={!selectedAsset}
            onClick={() => setPhase('questions')}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            Start Assessment
            <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {/* Phase 2: Questions */}
      {phase === 'questions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GitFork size={16} className="text-primary" />
            Assessing: <span className="text-primary">{selectedAsset}</span>
          </div>

          <div className="space-y-3">
            {QUESTIONS.map((q, i) => (
              <div key={i} className="bg-muted/40 rounded-lg p-4 border border-border space-y-2">
                <div className="text-sm font-medium text-foreground">
                  Q{i + 1}. {q.text}
                </div>
                <p className="text-xs text-muted-foreground">{q.context}</p>
                <div className="flex gap-2">
                  <Button
                    variant={answers[i] === 'yes' ? 'gradient' : 'outline'}
                    onClick={() => setAnswer(i, 'yes')}
                    className="text-xs px-4"
                  >
                    Yes
                  </Button>
                  <Button
                    variant={answers[i] === 'no' ? 'gradient' : 'outline'}
                    onClick={() => setAnswer(i, 'no')}
                    className="text-xs px-4"
                  >
                    No
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Progress indicator */}
          <div className="text-xs text-muted-foreground">
            {answers.filter((a) => a !== null).length} / {QUESTIONS.length} questions answered
            {allAnswered && (
              <span className="text-status-success ml-2 font-medium">
                · {migrateCount} migration-favoring answers
              </span>
            )}
          </div>

          <Button
            variant="gradient"
            disabled={!allAnswered}
            onClick={handleGetRecommendation}
            className="w-full sm:w-auto flex items-center gap-2"
          >
            Show planning suggestion
            <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {/* Phase 3: Result */}
      {phase === 'result' && recommendation && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GitFork size={16} className="text-primary" />
            Illustrative planning suggestion for:{' '}
            <span className="text-primary">{selectedAsset}</span>
          </div>

          <p className="text-sm text-muted-foreground">
            The first two answers are prerequisites for this direct, own-team replacement path. Use
            production tools and supplier documentation to check supported software and algorithms,
            protocol/key-format interoperability, deployment constraints, testing and rollback
            before choosing a design. Where a scoped design supports them, the activities below are
            examples to evaluate.
          </p>
          {(answers[0] === 'no' || answers[1] === 'no') && (
            <div className="rounded-lg border border-status-warning/30 p-3 text-sm">
              <strong>Direct replacement prerequisites missing:</strong>
              <ul className="list-disc pl-5">
                {answers[0] === 'no' && <li>Source available and maintained by your team</li>}
                {answers[1] === 'no' && <li>Crypto replaceable without a full system rebuild</li>}
              </ul>
              <p>
                Other Yes answers cannot override these missing inputs. Supported supplier upgrades,
                full replacement and exit planning remain separate options to evaluate.
              </p>
            </div>
          )}
          {recommendation === 'migrate' ? (
            <div className="bg-status-success/10 rounded-lg p-5 border border-status-success/30 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-status-success" />
                <span className="text-lg font-bold text-status-success">
                  PLANNING SUGGESTION: EXPLORE MIGRATION
                </span>
              </div>
              <p className="text-sm text-foreground/80">
                {migrateCount} of 5 answers favour exploring direct algorithm replacement. Both
                direct prerequisites are present. This count is a planning prompt, not a finding
                that the system has sufficient crypto agility or that migration is feasible.
              </p>
              <div className="space-y-2 text-sm">
                <div className="font-bold text-foreground">
                  Illustrative algorithm examples to evaluate
                </div>
                <p className="text-xs text-muted-foreground">
                  These examples are not an implementation or protocol profile selected for this
                  asset.
                </p>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  <li>
                    · KEM / key exchange → <strong>ML-KEM-768</strong> (FIPS 203)
                  </li>
                  <li>
                    · Digital signatures → <strong>ML-DSA-65</strong> (FIPS 204)
                  </li>
                  <li>
                    · Hash-based signing (long-lived keys) → <strong>SLH-DSA-SHA2-128s</strong>{' '}
                    (FIPS 205)
                  </li>
                  <li>
                    · TLS cipher suite → <strong>TLS_AES_256_GCM_SHA384</strong> with ML-KEM for key
                    exchange
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-foreground text-sm">
                  Possible planning activities
                </div>
                <ol className="space-y-1.5 text-xs text-foreground/80 list-decimal list-inside">
                  <li>Upgrade cryptographic library to a PQC-capable, FIPS-validating version</li>
                  <li>Configure crypto agility layer (PKCS#11 / JCE / OpenSSL EVP abstraction)</li>
                  <li>Validate in the lab (ACVP run + cipher-suite scan)</li>
                  <li>Phased rollout with A/B traffic split; monitor for negotiation failures</li>
                  <li>Update CBOM to reflect new algorithm and FIPS validation status</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                <strong>Compliance target:</strong> CNSA 2.0 (NSS), NSA CNSA 2.0 FAQ version 2.2:
                new acquisitions from 1 January 2027; equipment that cannot support CNSA 2.0 phased
                out by 31 December 2030 (exceptions possible); algorithms mandated by 31 December
                2031 unless otherwise noted. CA/B Forum 47-day cadence for public TLS server certs:
                March 2029. CSWP.39 §3.2 + §5 (Implement step).
              </p>
            </div>
          ) : (
            <div className="bg-status-warning/10 rounded-lg p-5 border border-status-warning/30 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-status-warning" />
                <span className="text-lg font-bold text-status-warning">
                  PLANNING SUGGESTION: EXPLORE MITIGATION
                </span>
              </div>
              <p className="text-sm text-foreground/80">
                {migrateCount} of 5 answers favour direct replacement. Explore mitigation options
                alongside upgrade, replacement and exit planning. This count does not establish that
                a gateway is feasible or that it reduces this asset’s risk.
              </p>
              {trustPathCase ? (
                <div className="space-y-2 text-sm">
                  <div className="font-bold text-foreground">
                    Work through the remaining trust path
                  </div>
                  <p>
                    {selectedPurpose === 'certificate-trust'
                      ? 'In this authored PKI sample, the legacy issuer still signs SHA-1 certificates and relying parties still validate their certificate paths. A TLS gateway does not reissue those certificates or replace their trust anchors.'
                      : 'In this authored code-signing sample, the build pipeline still signs artifacts with RSA-2048 and consumers still trust its verification key. A TLS gateway does not replace those artifact signatures or update consumer trust.'}
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>
                      Map the issuer or signing key, signed objects, validators and trust anchors.
                    </li>
                    <li>
                      Compare a supported supplier upgrade or replacement with the relying parties’
                      algorithm and format support.
                    </li>
                    <li>
                      Test new sample certificates or signed artifacts with the intended validators,
                      including altered-object and untrusted-key rejection.
                    </li>
                    <li>
                      Plan distribution of new trust material, compatibility, rollback and
                      retirement of legacy trust.
                    </li>
                  </ol>
                  <p className="text-xs text-muted-foreground">
                    A separately scoped transport gateway can cover its connections only. Record
                    legacy signature and certificate risks separately; do not mark them mitigated
                    because a TLS connection changed.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="font-bold text-foreground">
                    Transport gateway example to evaluate
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {selectedPurpose === 'transport'
                      ? 'This authored sample identifies a transport connection. Confirm the actual endpoints, supported protocol and trust boundary before selecting a gateway.'
                      : 'The selected record does not establish its cryptographic purpose. First identify transport, storage, signing and certificate-validation operations; no gateway design is selected from its name or notes.'}
                  </p>
                  <ol className="space-y-1.5 list-decimal list-inside">
                    <li>
                      If the scoped operation is transport, compare a supported TLS gateway with
                      supplier upgrade or system replacement.
                    </li>
                    <li>
                      Test both external and internal legs, negotiated groups, peer authentication
                      and failure handling; a cipher-suite name alone does not establish PQC key
                      exchange.
                    </li>
                    <li>
                      Record covered connections and remaining legacy operations separately in the
                      sample inventory.
                    </li>
                    <li>
                      Plan rollout, rollback and a legacy-system exit; illustrative Hub sunset year{' '}
                      {sunsetYear}.
                    </li>
                  </ol>
                </div>
              )}
              <div className="bg-status-warning/20 rounded p-3 border border-status-warning/40 flex items-start gap-2">
                <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/80">
                  <strong>Plan for continued cryptographic change.</strong> A gateway can help
                  provide system-level crypto agility while leaving embedded legacy cryptography
                  unchanged. Review/exit planning is Hub guidance; §4.6 does not prescribe a sunset
                  date. Existing illustrative Hub sunset year: <strong>{sunsetYear}</strong>. This
                  is a planning example, not a NIST deadline or a feasibility assessment. The
                  gateway also needs an update strategy.
                </p>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                Related reading: NIST CSWP.39 §4.6 describes performing cryptographic functions
                externally when direct legacy-code changes are not feasible. This is a paraphrase,
                not a quotation or a source requirement for a sunset date.
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw size={13} />
            Explore another asset
          </Button>
        </div>
      )}
    </div>
  )
}
