// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  CheckCircle,
  Circle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from 'lucide-react'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import { PRIORITY_COLORS } from '../data/platformEngConstants'
import { Button } from '@/components/ui/button'

// ── Migration phase data ──────────────────────────────────────────────────────

interface MigrationPhase {
  id: string
  phase: number
  title: string
  description: string
  durationWeeks: number
  dependencies: string[]
  stageIds: string[]
  actions: string[]
  rollbackNote: string
  crqcUrgency: 'critical' | 'high' | 'medium' | 'low'
}

const MIGRATION_PHASES: MigrationPhase[] = [
  {
    id: 'phase-0',
    phase: 0,
    title: 'Inventory & Baseline',
    description:
      'Deploy x509-certificate-exporter and Prometheus alert rules. Run CBOM scanner across all pipeline stages. Document every classical crypto asset, its exposure window, and HNDL risk score.',
    durationWeeks: 2,
    dependencies: [],
    stageIds: ['source', 'build', 'sign', 'registry', 'deploy', 'runtime'],
    actions: [
      'Deploy x509-certificate-exporter to all namespaces',
      'Enable Vault audit log shipping to SIEM',
      'Run CBOM scanner (Syft + OCI manifest scan)',
      'Document crypto asset register (all 17 assets)',
      'Set Kyverno/OPA policies to Audit mode',
    ],
    rollbackNote: 'No production changes — inventory only. Zero rollback risk.',
    crqcUrgency: 'medium',
  },
  {
    id: 'phase-1',
    phase: 1,
    title: 'Root CA Migration',
    description:
      'Provision ML-DSA-65 root CA in Vault PKI or EJBCA. Issue hybrid (ML-DSA-65 + ECDSA P-256) intermediate CA. All new cert issuance uses hybrid intermediate.',
    durationWeeks: 4,
    dependencies: ['phase-0'],
    stageIds: ['deploy', 'runtime'],
    actions: [
      'Generate ML-DSA-65 root CA key (offline HSM)',
      'Create hybrid intermediate CA (cert-manager v1.17+)',
      'Update ClusterIssuer to use ML-DSA hybrid intermediate',
      'Verify certificate chain validation in test namespace',
      'Begin issuing hybrid certs to all cert-manager Certificates',
    ],
    rollbackNote:
      'Keep ECDSA root CA active in parallel for 90 days. Clients that cannot parse hybrid certs fall back to ECDSA chain. Remove ECDSA root only after 0% ECDSA-only client traffic confirmed.',
    crqcUrgency: 'critical',
  },
  {
    id: 'phase-2',
    phase: 2,
    title: 'TLS Key Exchange (X-Wing)',
    description:
      'Migrate ingress, Vault mTLS, and service mesh to X-Wing hybrid key exchange (ML-KEM-768 + X25519). This directly addresses HNDL — recorded sessions become undecryptable.',
    durationWeeks: 3,
    dependencies: ['phase-0'],
    stageIds: ['build', 'deploy', 'runtime'],
    actions: [
      'Upgrade nginx-ingress to OpenSSL 3.5 build with X-Wing support',
      'Set ssl-ecdh-curve: X25519MLKEM768:X25519:P-256 in Helm values',
      'Enable X-Wing on Vault API TLS listener',
      'Update Istio ProxyConfig for ML-KEM cipher groups',
      'Validate cipher negotiation with curl --curves X25519MLKEM768',
    ],
    rollbackNote:
      'X-Wing is a hybrid — X25519 fallback is automatic if clients do not support ML-KEM. No breaking change. Rollback: revert Helm values ssl-ecdh-curve to X25519:P-256.',
    crqcUrgency: 'critical',
  },
  {
    id: 'phase-3',
    phase: 3,
    title: 'Artifact Signing (ML-DSA)',
    description:
      'Migrate container image signing from ECDSA cosign to ML-DSA-65 via Notation or cosign v2 (when available). Re-sign existing artifacts in production registry. Update verification policies.',
    durationWeeks: 6,
    dependencies: ['phase-1'],
    stageIds: ['sign', 'registry'],
    actions: [
      'Generate ML-DSA-65 signing key (Notation + AWS Crypto plugin)',
      'Update CI pipelines to sign images with Notation ML-DSA',
      'Re-sign all production image tags (registry migration script)',
      'Update Kyverno image verification policy to require ML-DSA',
      'Publish ML-DSA public key to internal keyserver',
    ],
    rollbackNote:
      'Keep ECDSA cosign signatures on all images during transition (dual-sign). Verification policy accepts either ECDSA or ML-DSA until cut-over date. Remove ECDSA sigs 90 days post cut-over.',
    crqcUrgency: 'high',
  },
  {
    id: 'phase-4',
    phase: 4,
    title: 'Source Control & CI Identity',
    description:
      'Rotate Git commit signing keys to ML-DSA-44. Migrate CI/CD OIDC token signing to ML-DSA-65 JWT profile. Update deploy keys to ML-DSA SSH extensions.',
    durationWeeks: 4,
    dependencies: ['phase-1'],
    stageIds: ['source', 'build'],
    actions: [
      'Generate ML-DSA-44 Git commit signing keys (GPG v2.6+ / draft-ietf-openpgp-pqc)',
      'Distribute new signing keys via keyserver with old key cross-signature',
      'Migrate CI OIDC signing to ML-DSA-65 (GitHub issue #tracking)',
      'Rotate SSH deploy keys to ML-DSA-44 (pending IETF PQ SSH draft standardization)',
      'Update allowed_signers and SSHD configuration',
    ],
    rollbackNote:
      'Dual-sign commits with both ECDSA and ML-DSA keys during transition. Signers can verify against either key. Remove ECDSA keys from allowed_signers after all CI systems are updated.',
    crqcUrgency: 'high',
  },
  {
    id: 'phase-5',
    phase: 5,
    title: 'Policy Enforcement & Cut-Over',
    description:
      'Switch all Kyverno/OPA policies from Audit to Enforce mode. Remove ECDSA fallback certs from issuer chains. Terminate remaining classical TLS-only connections.',
    durationWeeks: 2,
    dependencies: ['phase-1', 'phase-2', 'phase-3', 'phase-4'],
    stageIds: ['source', 'build', 'sign', 'registry', 'deploy', 'runtime'],
    actions: [
      'Switch validationFailureAction: Enforce on all Kyverno policies',
      'Remove ECDSA root CA from trust bundle',
      'Set ssl-ecdh-curve to X25519MLKEM768 only (no X25519 fallback)',
      'Archive ECDSA signing keys (retain for audit, disable for signing)',
      'Run post-migration CBOM scan — verify 0 ECDSA/RSA findings',
    ],
    rollbackNote:
      'CAUTION: After this phase, rollback requires re-adding ECDSA fallback trust and is disruptive. Ensure 100% client compatibility is confirmed in phase 3-4 before proceeding.',
    crqcUrgency: 'medium',
  },
]

// ── Rollback Decision Tree ────────────────────────────────────────────────────

interface RollbackNode {
  id: string
  question: string
  yesId?: string
  noId?: string
  action?: string
  severity?: 'critical' | 'warning' | 'ok'
}

const ROLLBACK_TREE: Record<string, RollbackNode> = {
  start: {
    id: 'start',
    question: 'Are clients reporting TLS handshake failures?',
    yesId: 'tls-fail',
    noId: 'sig-fail',
  },
  'tls-fail': {
    id: 'tls-fail',
    question: 'Is the failure on key exchange (ML-KEM) or certificate validation?',
    yesId: 'kem-fail',
    noId: 'cert-fail',
  },
  'kem-fail': {
    id: 'kem-fail',
    question: 'Do affected clients support TLS 1.3 at all?',
    yesId: 'kem-revert',
    noId: 'client-old',
  },
  'kem-revert': {
    id: 'kem-revert',
    action:
      'Revert ssl-ecdh-curve to X25519:P-256. X-Wing is additive — removing it is non-breaking. File bug with client vendor for ML-KEM support.',
    severity: 'warning',
    question: '',
  },
  'client-old': {
    id: 'client-old',
    action:
      'Client does not support TLS 1.3 — this is a pre-existing issue unrelated to PQC migration. Upgrade client or add TLS 1.2 exception for legacy endpoint.',
    severity: 'critical',
    question: '',
  },
  'cert-fail': {
    id: 'cert-fail',
    question: 'Is the cert signed by the new ML-DSA hybrid intermediate CA?',
    yesId: 'hybrid-fail',
    noId: 'wrong-issuer',
  },
  'hybrid-fail': {
    id: 'hybrid-fail',
    action:
      'Client cannot parse hybrid X.509 certificate. Check client OpenSSL/BoringSSL version. Add ECDSA-only certificate exception for affected client until upgrade is possible.',
    severity: 'warning',
    question: '',
  },
  'wrong-issuer': {
    id: 'wrong-issuer',
    action:
      'Certificate was not re-issued by new CA. Force cert-manager renewal: kubectl annotate cert {name} cert-manager.io/issue-once=true',
    severity: 'ok',
    question: '',
  },
  'sig-fail': {
    id: 'sig-fail',
    question: 'Are image pull/admission policies blocking pods?',
    yesId: 'policy-block',
    noId: 'no-issue',
  },
  'policy-block': {
    id: 'policy-block',
    question: 'Is the failure "no valid signature" or "wrong algorithm"?',
    yesId: 'no-sig',
    noId: 'wrong-algo',
  },
  'no-sig': {
    id: 'no-sig',
    action:
      'Image was not re-signed with ML-DSA. Run the dual-sign script to add ML-DSA signature alongside existing ECDSA sig. Policy should accept both during transition.',
    severity: 'warning',
    question: '',
  },
  'wrong-algo': {
    id: 'wrong-algo',
    action:
      'Policy is in Enforce mode with too strict algorithm check. Switch Kyverno policy to Audit mode temporarily: kubectl patch clusterpolicy require-pqc-image-signature -p \'{"spec":{"validationFailureAction":"Audit"}}\'',
    severity: 'warning',
    question: '',
  },
  'no-issue': {
    id: 'no-issue',
    action:
      'No active failures detected. Check Prometheus alerts for non-PQC cert drift. Run x509-certificate-exporter scan for any missed certificates.',
    severity: 'ok',
    question: '',
  },
}

// ── Main component ────────────────────────────────────────────────────────────

export const PlatformMigrationPlanner: React.FC = () => {
  const [completedPhases, setCompletedPhases] = useState<Set<string>>(new Set())
  const [expandedPhase, setExpandedPhase] = useState<string | null>('phase-0')
  const [showRollback, setShowRollback] = useState(false)
  const [rollbackNode, setRollbackNode] = useState<string>('start')

  const togglePhaseComplete = (id: string) => {
    setCompletedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleExpand = (id: string) => setExpandedPhase((prev) => (prev === id ? null : id))

  const progress = useMemo(
    () => Math.round((completedPhases.size / MIGRATION_PHASES.length) * 100),
    [completedPhases]
  )

  const stageLabel = (id: string) => PIPELINE_STAGES.find((s) => s.id === id)?.label ?? id

  const currentNode = ROLLBACK_TREE[rollbackNode]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Platform Migration Planner</h3>
        <p className="text-sm text-muted-foreground">
          Six-phase migration runway covering the entire software delivery pipeline — from crypto
          asset inventory through root CA replacement, TLS key exchange, artifact signing, and
          policy enforcement cut-over. Includes a rollback decision tree for each phase.
        </p>
      </div>

      {/* Progress */}
      <div className="glass-panel p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">Migration Progress</span>
          <span className="font-bold text-foreground">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            {completedPhases.size} of {MIGRATION_PHASES.length} phases complete
          </span>
          <span>
            ~
            {MIGRATION_PHASES.filter((p) => !completedPhases.has(p.id)).reduce(
              (acc, p) => acc + p.durationWeeks,
              0
            )}{' '}
            weeks remaining
          </span>
        </div>
      </div>

      {/* Phase cards */}
      <div className="space-y-2">
        {MIGRATION_PHASES.map((phase) => {
          const isComplete = completedPhases.has(phase.id)
          const isExpanded = expandedPhase === phase.id
          const depsComplete = phase.dependencies.every((dep) => completedPhases.has(dep))
          const isLocked = !depsComplete && !isComplete

          return (
            <div
              key={phase.id}
              className={`glass-panel overflow-hidden ${isLocked ? 'opacity-60' : ''}`}
            >
              <div className="p-4 flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => !isLocked && togglePhaseComplete(phase.id)}
                  disabled={isLocked}
                  className="shrink-0"
                >
                  {isComplete ? (
                    <CheckCircle size={20} className="text-status-success" />
                  ) : (
                    <Circle
                      size={20}
                      className={isLocked ? 'text-muted-foreground' : 'text-primary'}
                    />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => !isLocked && toggleExpand(phase.id)}
                  className="flex-1 min-w-0 text-left"
                  disabled={isLocked}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-muted-foreground">
                      Phase {phase.phase}
                    </span>
                    <span className="text-sm font-bold text-foreground">{phase.title}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PRIORITY_COLORS[phase.crqcUrgency]}`}
                    >
                      {phase.crqcUrgency.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      ~{phase.durationWeeks}w
                    </span>
                    {isLocked && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-bold">
                        Locked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{phase.description}</p>
                </Button>

                {!isLocked && (
                  <Button
                    variant="ghost"
                    onClick={() => toggleExpand(phase.id)}
                    className="shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </Button>
                )}
              </div>

              {isExpanded && !isLocked && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-fade-in">
                  {/* Affected pipeline stages */}
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">
                      Affected Pipeline Stages
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {phase.stageIds.map((sid) => (
                        <span
                          key={sid}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary font-medium"
                        >
                          {stageLabel(sid)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action checklist */}
                  <div>
                    <span className="text-xs font-bold text-muted-foreground">Actions</span>
                    <ul className="mt-2 space-y-1.5">
                      {phase.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <ArrowRight size={12} className="text-primary shrink-0 mt-0.5" />
                          <span className="text-foreground">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Rollback note */}
                  <div className="bg-status-warning/10 rounded-lg p-3 border border-status-warning/20">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle size={12} className="text-status-warning" />
                      <span className="text-xs font-bold text-foreground">Rollback Strategy</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{phase.rollbackNote}</p>
                  </div>

                  {/* Dependencies */}
                  {phase.dependencies.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium">Requires:</span>
                      {phase.dependencies.map((dep) => {
                        const depPhase = MIGRATION_PHASES.find((p) => p.id === dep)
                        return (
                          <span
                            key={dep}
                            className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${
                              completedPhases.has(dep)
                                ? 'bg-status-success/10 text-status-success border-status-success/30'
                                : 'bg-status-error/10 text-status-error border-status-error/30'
                            }`}
                          >
                            Phase {depPhase?.phase}: {depPhase?.title}
                          </span>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rollback Decision Tree */}
      <div className="glass-panel overflow-hidden">
        <Button
          variant="ghost"
          onClick={() => {
            setShowRollback((prev) => !prev)
            setRollbackNode('start')
          }}
          className="w-full text-left p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-status-warning" />
            <span className="text-sm font-bold text-foreground">Rollback Decision Tree</span>
          </div>
          {showRollback ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </Button>

        {showRollback && (
          <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Use this decision tree when a post-migration incident occurs. Follow the questions to
              identify the root cause and the correct rollback action.
            </p>

            <div className="glass-panel p-4 space-y-4">
              {currentNode && (
                <>
                  {currentNode.question ? (
                    <>
                      <p className="text-sm font-medium text-foreground">{currentNode.question}</p>
                      <div className="flex gap-3">
                        {currentNode.yesId && (
                          <Button
                            variant="ghost"
                            onClick={() => setRollbackNode(currentNode.yesId!)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold border bg-status-error/10 text-status-error border-status-error/30 hover:bg-status-error/20 transition-colors"
                          >
                            Yes
                          </Button>
                        )}
                        {currentNode.noId && (
                          <Button
                            variant="ghost"
                            onClick={() => setRollbackNode(currentNode.noId!)}
                            className="flex-1 py-2 rounded-lg text-xs font-bold border bg-muted text-foreground border-border hover:border-primary/50 transition-colors"
                          >
                            No
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div
                      className={`rounded-lg p-3 border ${
                        currentNode.severity === 'critical'
                          ? 'bg-status-error/10 border-status-error/20'
                          : currentNode.severity === 'warning'
                            ? 'bg-status-warning/10 border-status-warning/20'
                            : 'bg-status-success/10 border-status-success/20'
                      }`}
                    >
                      <p className="text-xs text-foreground">{currentNode.action}</p>
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => setRollbackNode('start')}
                    className="text-xs text-primary underline underline-offset-2 hover:opacity-80"
                  >
                    Start over
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Timeline guidance:</strong> Phases 1 and 2 (Root CA + TLS Key Exchange) address
          the most critical HNDL exposure and should be completed first, regardless of CRQC timeline
          uncertainty. Phases 3–5 have a 2-year runway for most organisations but should begin in
          parallel with Phase 1 to avoid bottlenecks at the artifact signing step.
        </p>
      </div>
    </div>
  )
}
