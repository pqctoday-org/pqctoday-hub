// SPDX-License-Identifier: GPL-3.0-only
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
      'If the code is lost, in escrow, or with a disbanded vendor — direct modification is impossible.',
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
      'Modular APIs allow algorithm swap without touching business logic — the hallmark of crypto agility.',
    migrateIfYes: true,
  },
  {
    text: 'Is this system scheduled for a technology refresh within 3 years?',
    context:
      'A scheduled refresh creates a natural migration window aligned to CNSA 2.0 deadlines (2030/2033).',
    migrateIfYes: true,
  },
  {
    text: 'Can the system tolerate a planned maintenance window for migration testing?',
    context:
      'Mission-critical systems that cannot be taken offline require a live gateway as a bridge strategy.',
    migrateIfYes: true,
  },
]

const SAMPLE_ASSETS: Array<{ name: string; description: string }> = [
  {
    name: 'Legacy PKI system (SHA-1 certs)',
    description: '15-year-old PKI; source partially unavailable; team disbanded.',
  },
  {
    name: 'TLS Load Balancer (TLS 1.2 only)',
    description: 'F5 BIG-IP; modular TLS config; vendor patch available.',
  },
  {
    name: 'Embedded IoT Gateway (ECDSA P-256)',
    description: 'ARM Cortex-M4; OTA-updatable firmware; no crypto abstraction layer.',
  },
  {
    name: 'Enterprise LDAP service (SHA-1 TLS)',
    description: 'Legacy directory; configurable cipher suite; vendor patch available.',
  },
  {
    name: 'Code signing pipeline (RSA-2048)',
    description: 'Jenkins + OpenSSL 1.1.1; can upgrade to 3.x with oqs-provider.',
  },
]

function deriveRecommendation(answers: Answer[]): Recommendation {
  const migrateCount = answers.filter((a, i) => {
    if (a === null) return false
    return QUESTIONS[i].migrateIfYes ? a === 'yes' : a === 'no'
  }).length
  return migrateCount >= 3 ? 'migrate' : 'mitigate'
}

const sunsetYear = new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).getFullYear()

export const MitigateMigrateWizard: React.FC<MitigateMigrateWizardProps> = ({ cbomAssets }) => {
  const [phase, setPhase] = useState<Phase>('select')
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [answers, setAnswers] = useState<Answer[]>(Array(QUESTIONS.length).fill(null))
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)

  const assetOptions = useMemo(
    () =>
      cbomAssets.length > 0
        ? cbomAssets.map((a) => ({ name: `${a.name} (${a.version})`, description: a.notes }))
        : SAMPLE_ASSETS,
    [cbomAssets]
  )

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
        CSWP.39 §5 step 5 + §4.6 — the Implement step requires deciding between{' '}
        <strong>Migration</strong> (algorithm replacement) and <strong>Mitigation</strong> (crypto
        gateway / bump-in-the-wire). Answer 5 crypto-agility questions about a specific asset to get
        a CSWP.39-grounded recommendation.
      </p>

      {/* Phase 1: Asset selection */}
      {phase === 'select' && (
        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-4 border border-border space-y-3">
            <div className="font-bold text-foreground text-sm">Select an asset to assess</div>
            {!usingLive && (
              <p className="text-xs text-muted-foreground">
                No CBOM loaded from Step 3 — using sample assets. Complete Step 3 to assess your own
                inventory.
              </p>
            )}
            {usingLive && (
              <p className="text-xs text-status-success">
                Using CBOM from Step 3 ({cbomAssets.length} assets available).
              </p>
            )}
            <div className="space-y-2">
              {assetOptions.map((opt) => (
                <Button
                  key={opt.name}
                  variant={selectedAsset === opt.name ? 'gradient' : 'outline'}
                  onClick={() => setSelectedAsset(opt.name)}
                  className="w-full h-auto p-3 text-left flex-col items-start text-xs"
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
            Get Recommendation
            <ArrowRight size={14} />
          </Button>
        </div>
      )}

      {/* Phase 3: Result */}
      {phase === 'result' && recommendation && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GitFork size={16} className="text-primary" />
            Assessment result for: <span className="text-primary">{selectedAsset}</span>
          </div>

          {recommendation === 'migrate' ? (
            <div className="bg-status-success/10 rounded-lg p-5 border border-status-success/30 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-status-success" />
                <span className="text-lg font-bold text-status-success">
                  RECOMMENDATION: MIGRATE
                </span>
              </div>
              <p className="text-sm text-foreground/80">
                This system has sufficient crypto agility for direct algorithm replacement.{' '}
                {migrateCount} of 5 assessment criteria favour migration.
              </p>
              <div className="space-y-2 text-sm">
                <div className="font-bold text-foreground">Algorithm recommendations</div>
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
                <div className="font-bold text-foreground text-sm">Next steps</div>
                <ol className="space-y-1.5 text-xs text-foreground/80 list-decimal list-inside">
                  <li>Upgrade cryptographic library to a PQC-capable, FIPS-validating version</li>
                  <li>Configure crypto agility layer (PKCS#11 / JCE / OpenSSL EVP abstraction)</li>
                  <li>Validate in the lab (ACVP run + cipher-suite scan)</li>
                  <li>Phased rollout with A/B traffic split; monitor for negotiation failures</li>
                  <li>Update CBOM to reflect new algorithm and FIPS validation status</li>
                </ol>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                <strong>Compliance target:</strong> CNSA 2.0 preferred 2030, exclusive 2033 (NSS).
                CA/B Forum 47-day TLS cadence: March 2029. CSWP.39 §3.2 + §5 (Implement step).
              </p>
            </div>
          ) : (
            <div className="bg-status-warning/10 rounded-lg p-5 border border-status-warning/30 space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-status-warning" />
                <span className="text-lg font-bold text-status-warning">
                  RECOMMENDATION: MITIGATE (CRYPTO GATEWAY)
                </span>
              </div>
              <p className="text-sm text-foreground/80">
                Direct migration is not feasible at this time — only {migrateCount} of 5 criteria
                favour migration. Deploy a crypto gateway as a compensating control while planning
                system decommission.
              </p>
              <div className="space-y-2 text-sm">
                <div className="font-bold text-foreground">Gateway specification</div>
                <ul className="space-y-1.5 text-sm text-foreground/80">
                  <li>· Deploy a TLS termination proxy in front of the legacy system</li>
                  <li>· Configure approved cipher suites on the gateway (TLS 1.3 minimum)</li>
                  <li>
                    · Internal traffic from gateway to legacy system may remain on existing protocol
                  </li>
                  <li>· The gateway itself must use PQC-capable libraries — track in CBOM</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="font-bold text-foreground text-sm">Next steps</div>
                <ol className="space-y-1.5 text-xs text-foreground/80 list-decimal list-inside">
                  <li>
                    Select and deploy a crypto gateway product (Nginx, HAProxy, or dedicated
                    appliance)
                  </li>
                  <li>Configure approved cipher suites and TLS 1.3; validate with testssl.sh</li>
                  <li>Add the legacy system + gateway to CBOM under "mitigated" status</li>
                  <li>
                    Create a decommission ticket for the legacy system — target sunset {sunsetYear}
                  </li>
                  <li>
                    Schedule annual review: if the system becomes modifiable, run this wizard again
                  </li>
                </ol>
              </div>
              <div className="bg-status-warning/20 rounded p-3 border border-status-warning/40 flex items-start gap-2">
                <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/80">
                  <strong>This is not a permanent solution.</strong> The gateway buys time — it does
                  not confer crypto agility on the legacy system. CSWP.39 §4.6 requires a sunset
                  date paired with every mitigate decision. Suggested sunset:{' '}
                  <strong>{sunsetYear}</strong>. The gateway itself must also be planned for
                  algorithm migration.
                </p>
              </div>
              <p className="text-xs text-muted-foreground border-t border-border pt-3">
                Reference: NIST CSWP.39 §4.6 — &ldquo;Crypto gateway / bump-in-the-wire for systems
                where direct modification is infeasible.&rdquo;
              </p>
            </div>
          )}

          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2 text-xs"
          >
            <RefreshCw size={13} />
            Assess another asset
          </Button>
        </div>
      )}
    </div>
  )
}
