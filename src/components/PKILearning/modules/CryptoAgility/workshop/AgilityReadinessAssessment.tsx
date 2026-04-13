// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AssessmentQuestion {
  id: string
  text: string
  hint: string
}

interface DimensionDef {
  id: string
  label: string
  description: string
  questions: AssessmentQuestion[]
}

const DIMENSIONS: DimensionDef[] = [
  {
    id: 'algorithm',
    label: 'Algorithm Agility',
    description: 'Can you swap cryptographic algorithms via config, not code?',
    questions: [
      {
        id: 'alg-config',
        text: 'Algorithm choices are externalized — stored in config files, environment variables, or a feature flag system rather than hardcoded in application source code.',
        hint: 'Hardcoded imports like `import { rsaEncrypt }` score No. Config-driven provider selection scores Yes.',
      },
      {
        id: 'alg-multi',
        text: 'Your systems can run multiple algorithm variants simultaneously (e.g., RSA-2048 alongside ML-KEM-768) without code changes — useful for gradual rollout and rollback.',
        hint: 'Check if your key management system supports heterogeneous algorithm families in the same namespace.',
      },
      {
        id: 'alg-key-size',
        text: 'Key material storage and transmission buffers are not hard-capped to classical sizes (e.g., no VARCHAR(256) for public keys, no fixed 32-byte shared secret assumptions).',
        hint: 'PQC public keys range from 800 bytes (ML-KEM-512) to 64,000 bytes (Classic McEliece). Check DB schema, HSM slot config, and network MTU handling.',
      },
    ],
  },
  {
    id: 'protocol',
    label: 'Protocol Agility',
    description: 'Can your services negotiate and serve multiple protocol versions at once?',
    questions: [
      {
        id: 'proto-tls',
        text: 'TLS endpoints are configured to offer both classical and hybrid cipher suites (e.g., X25519MLKEM768 alongside X25519), letting clients negotiate based on capability.',
        hint: 'Check your TLS library version and cipher suite list. OpenSSL 3.x + OQS provider, BoringSSL, or AWS-LC enable hybrid suites.',
      },
      {
        id: 'proto-zero-downtime',
        text: 'Adding a new protocol version or cipher suite to production does not require service downtime — configuration reload or feature-flag toggle is sufficient.',
        hint: 'This tests your deployment agility as much as your crypto stack. Hot-reload nginx/envoy configs, or in-process provider hot-swapping.',
      },
      {
        id: 'proto-hybrid',
        text: 'Hybrid key exchange (classical + PQC in the same TLS handshake) has been tested in a non-production environment and a rollout plan exists.',
        hint: 'RFC 8446 + X25519MLKEM768 hybrid is the current IETF standard. Cloudflare and Chrome both shipped this in 2024.',
      },
    ],
  },
  {
    id: 'implementation',
    label: 'Implementation Agility',
    description: 'Can you swap the crypto library or provider without touching application code?',
    questions: [
      {
        id: 'impl-abstraction',
        text: 'A cryptographic abstraction layer is in place — applications call a unified internal API (e.g., cryptoService.encrypt()) and are not directly coupled to a specific library.',
        hint: 'JCA (Java), OpenSSL Providers, PKCS#11, or an internal crypto service are all valid abstraction patterns.',
      },
      {
        id: 'impl-swap',
        text: 'You have changed (or can change) the underlying crypto library — e.g., from legacy OpenSSL 1.x to OpenSSL 3.x, or from Java Sun provider to BouncyCastle — without modifying application code.',
        hint: 'This is the acid test for implementation agility. If changing the library required a code-level migration, your abstraction layer is incomplete.',
      },
      {
        id: 'impl-hsm',
        text: 'Your HSM or KMS vendor has committed to PQC support on your current hardware (or a hardware upgrade path is budgeted) — ensuring your crypto infrastructure is not the bottleneck.',
        hint: "Check your HSM vendor's PQC roadmap. FIPS 140-3 Level 3/4 devices with ML-KEM/ML-DSA are now available from Thales, Entrust, AWS CloudHSM, and others.",
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory & Visibility',
    description: 'Do you know every cryptographic asset in your organization?',
    questions: [
      {
        id: 'inv-cbom',
        text: 'Your organization maintains a CBOM (Cryptographic Bill of Materials) — a structured inventory of every algorithm, key size, certificate, and crypto library in use across all services.',
        hint: 'Tools: IBM Quantum Safe Explorer, Keyfactor CBOM Generator, InfoSec Global AgileSec, or CycloneDX CBOM format in your SBOM pipeline.',
      },
      {
        id: 'inv-discovery',
        text: 'You can enumerate within 24 hours all services using RSA or ECDH/ECDSA — i.e., the services most at risk from a quantum-capable adversary.',
        hint: 'If your answer is "we\'d have to grep logs or ask service owners", score Partial. Automated CBOM scoring scores Yes.',
      },
      {
        id: 'inv-certs',
        text: 'Certificate lifecycle management tooling tracks algorithm families and expiry dates, with automated alerts when a certificate approaching renewal uses a quantum-vulnerable algorithm.',
        hint: 'Most CLM tools (Venafi, Keyfactor, EJBCA) now have PQC-readiness dashboards. Check if yours does.',
      },
    ],
  },
]

type Answer = 'yes' | 'partial' | 'no' | null

const ANSWER_SCORES: Record<NonNullable<Answer>, number> = {
  yes: 2,
  partial: 1,
  no: 0,
}

const MAX_PER_DIMENSION = 6 // 3 questions × 2 pts each

interface MaturityBand {
  label: string
  minPct: number
  color: string
  bg: string
  advice: string
}

const MATURITY_BANDS: MaturityBand[] = [
  {
    label: 'Not Started',
    minPct: 0,
    color: 'text-status-error',
    bg: 'bg-status-error/10',
    advice:
      'Focus first on discovery: run a CBOM scan to identify all crypto assets. Without visibility, no migration plan can succeed.',
  },
  {
    label: 'Foundational',
    minPct: 25,
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
    advice:
      'Establish your abstraction layer and inventory. These investments pay dividends across every future migration.',
  },
  {
    label: 'Developing',
    minPct: 50,
    color: 'text-primary',
    bg: 'bg-primary/10',
    advice:
      'Good foundations. Prioritize the gaps in your weakest dimension and pilot hybrid TLS in a non-critical service.',
  },
  {
    label: 'Advanced',
    minPct: 75,
    color: 'text-status-success',
    bg: 'bg-status-success/10',
    advice:
      'Strong posture. Close the remaining gaps, complete your CBOM, and begin phased production hybrid deployment.',
  },
]

function getMaturity(pct: number): MaturityBand {
  return [...MATURITY_BANDS].reverse().find((b) => pct >= b.minPct) ?? MATURITY_BANDS[0]
}

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0
  const maturity = getMaturity(pct)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={maturity.color}>{maturity.label}</span>
        <span className="text-muted-foreground">
          {score}/{max} pts
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 75
                ? 'hsl(var(--success))'
                : pct >= 50
                  ? 'hsl(var(--primary))'
                  : pct >= 25
                    ? 'hsl(var(--warning))'
                    : 'hsl(var(--destructive))',
          }}
        />
      </div>
    </div>
  )
}

function AnswerButton({
  value,
  selected,
  onSelect,
}: {
  value: NonNullable<Answer>
  selected: boolean
  onSelect: () => void
}) {
  const config = {
    yes: {
      label: 'Yes',
      icon: CheckCircle2,
      active: 'border-status-success bg-status-success/10 text-status-success',
      idle: 'border-border text-muted-foreground hover:border-status-success/50',
    },
    partial: {
      label: 'Partial',
      icon: AlertCircle,
      active: 'border-warning bg-warning/10 text-warning',
      idle: 'border-border text-muted-foreground hover:border-warning/50',
    },
    no: {
      label: 'No',
      icon: XCircle,
      active: 'border-status-error bg-status-error/10 text-status-error',
      idle: 'border-border text-muted-foreground hover:border-status-error/50',
    },
  }
  const { label, icon: Icon, active, idle } = config[value]
  return (
    <Button
      variant="ghost"
      onClick={onSelect}
      className={`flex items-center gap-1.5 px-3 py-1.5 h-auto rounded-lg border text-xs font-medium transition-colors ${selected ? active : idle}`}
    >
      <Icon size={14} />
      {label}
    </Button>
  )
}

export const AgilityReadinessAssessment: React.FC = () => {
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [expandedHints, setExpandedHints] = useState<Record<string, boolean>>({})

  const setAnswer = (qId: string, value: Answer) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const toggleHint = (qId: string) => {
    setExpandedHints((prev) => ({ ...prev, [qId]: !prev[qId] }))
  }

  const allQIds = useMemo(() => DIMENSIONS.flatMap((d) => d.questions.map((q) => q.id)), [])
  const answeredCount = allQIds.filter(
    (id) => answers[id] !== undefined && answers[id] !== null
  ).length
  const totalQuestions = allQIds.length
  const isComplete = answeredCount === totalQuestions

  const dimensionScores = useMemo(() => {
    return DIMENSIONS.map((dim) => {
      const score = dim.questions.reduce((sum, q) => {
        const a = answers[q.id]
        return sum + (a != null ? ANSWER_SCORES[a] : 0)
      }, 0)
      const answered = dim.questions.filter((q) => answers[q.id] != null).length
      return { id: dim.id, score, answered, total: MAX_PER_DIMENSION }
    })
  }, [answers])

  const overallScore = dimensionScores.reduce((s, d) => s + d.score, 0)
  const overallMax = DIMENSIONS.length * MAX_PER_DIMENSION
  const overallPct = overallMax > 0 ? Math.round((overallScore / overallMax) * 100) : 0
  const overallMaturity = getMaturity(overallPct)

  const handleReset = () => {
    setAnswers({})
    setExpandedHints({})
  }

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">Agility Readiness Assessment</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {answeredCount}/{totalQuestions} questions answered
          </div>
        </div>
        {answeredCount > 0 && (
          <Button variant="ghost" onClick={handleReset} className="text-xs text-muted-foreground">
            Reset
          </Button>
        )}
      </div>

      {/* Dimensions */}
      {DIMENSIONS.map((dim) => {
        const ds = dimensionScores.find((d) => d.id === dim.id)!
        return (
          <section key={dim.id} className="glass-panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-foreground">{dim.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{dim.description}</p>
              </div>
              <div className="sm:w-48 shrink-0">
                <ScoreBar score={ds.score} max={ds.total} />
              </div>
            </div>

            <div className="space-y-4">
              {dim.questions.map((q) => (
                <div key={q.id} className="bg-muted/40 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-foreground leading-snug">{q.text}</p>

                  <div className="flex flex-wrap gap-2">
                    {(['yes', 'partial', 'no'] as const).map((v) => (
                      <AnswerButton
                        key={v}
                        value={v}
                        selected={answers[q.id] === v}
                        onSelect={() => setAnswer(q.id, v)}
                      />
                    ))}
                    <Button
                      variant="ghost"
                      onClick={() => toggleHint(q.id)}
                      className="flex items-center gap-1 h-auto px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
                    >
                      {expandedHints[q.id] ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      Guidance
                    </Button>
                  </div>

                  {expandedHints[q.id] && (
                    <div className="text-xs text-muted-foreground bg-background/60 rounded p-3 border border-border">
                      {q.hint}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {/* Results panel — always visible once at least one answer given */}
      {answeredCount > 0 && (
        <section className={`glass-panel p-5 space-y-4 border ${overallMaturity.bg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Overall Readiness</h3>
              <div className={`text-sm font-semibold mt-1 ${overallMaturity.color}`}>
                {overallMaturity.label}
                {!isComplete && (
                  <span className="text-xs text-muted-foreground font-normal ml-2">
                    (partial — {totalQuestions - answeredCount} questions remaining)
                  </span>
                )}
              </div>
            </div>
            <div className="sm:w-56 shrink-0">
              <ScoreBar score={overallScore} max={overallMax} />
            </div>
          </div>

          {/* Per-dimension summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DIMENSIONS.map((dim) => {
              const ds = dimensionScores.find((d) => d.id === dim.id)!
              const pct = Math.round((ds.score / ds.total) * 100)
              const m = getMaturity(pct)
              return (
                <div key={dim.id} className="bg-background/60 rounded-lg p-3 text-center">
                  <div className="text-xs font-semibold text-foreground mb-1">{dim.label}</div>
                  <div className={`text-xs ${m.color}`}>{m.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {ds.score}/{ds.total} pts
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-sm text-foreground/80 bg-background/60 rounded-lg p-3 border border-border">
            <span className="font-semibold">Next step: </span>
            {overallMaturity.advice}
          </div>

          {/* Weakest dimension callout */}
          {isComplete &&
            (() => {
              const weakest = dimensionScores.reduce((a, b) => (a.score < b.score ? a : b))
              const weakDim = DIMENSIONS.find((d) => d.id === weakest.id)!
              return (
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Focus area: </span>
                  {weakDim.label} scored lowest ({weakest.score}/{weakest.total} pts). Start your
                  improvement plan there.
                </div>
              )
            })()}
        </section>
      )}
    </div>
  )
}
