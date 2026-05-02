// SPDX-License-Identifier: GPL-3.0-only
import { X, ExternalLink, Shield, Zap, GitBranch, BookOpen, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { PatentItem, NistStatus } from '@/types/PatentTypes'
import { logExternalLink } from '@/utils/analytics'

interface Props {
  patent: PatentItem
  inCorpusIds: Set<string>
  onClose: () => void
  onNavigate: (patentNumber: string) => void
}

// ─── Color tokens ────────────────────────────────────────────────────────────
type TagVariant =
  | 'pqc'
  | 'classical'
  | 'quantum'
  | 'protocol'
  | 'info'
  | 'warning'
  | 'threat'
  | 'default'

const TAG_CLASSES: Record<TagVariant, string> = {
  pqc: 'border-success/40 text-success bg-success/10',
  classical: 'border-destructive/40 text-destructive bg-destructive/10',
  quantum: 'border-warning/40 text-warning bg-warning/10',
  protocol: 'border-primary/40 text-primary bg-primary/10',
  info: 'border-info/40 text-info bg-info/10',
  warning: 'border-warning/40 text-warning bg-warning/10',
  threat: 'border-destructive/40 text-destructive bg-destructive/10',
  default: 'border-border text-foreground bg-muted',
}

const NIST_STATUS_COLOR: Record<string, string> = {
  fips_203: 'text-status-success bg-status-success/10 border-status-success/30',
  fips_204: 'text-status-success bg-status-success/10 border-status-success/30',
  fips_205: 'text-status-success bg-status-success/10 border-status-success/30',
  round4_candidate: 'text-status-warning bg-status-warning/10 border-status-warning/30',
  withdrawn: 'text-status-error bg-status-error/10 border-status-error/30',
  stateful_hash_standard: 'text-primary bg-primary/10 border-primary/30',
  proprietary: 'text-muted-foreground bg-muted border-border',
  classical: 'text-muted-foreground bg-muted border-border',
}

const AGILITY_COLOR: Record<string, string> = {
  hybrid: 'text-status-warning',
  pqc_only: 'text-status-success',
  classical_only: 'text-status-error',
  negotiated: 'text-primary',
  unclear: 'text-muted-foreground',
}

const QUANTUM_RELEVANCE_COLOR: Record<string, string> = {
  core_invention: 'bg-primary/10 text-primary border-primary/30',
  dependent_claim_only: 'bg-status-warning/10 text-status-warning border-status-warning/30',
  background_only: 'bg-muted text-muted-foreground border-border',
  none: 'bg-muted text-muted-foreground border-border',
}

const IMPACT_COLOR: Record<string, string> = {
  High: 'text-status-error',
  Medium: 'text-status-warning',
  Low: 'text-status-success',
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function ColorTagList({ items, variant = 'default' }: { items: string[]; variant?: TagVariant }) {
  if (!items.length) return <span className="text-muted-foreground text-xs">—</span>
  const cls = TAG_CLASSES[variant]
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className={`inline-block rounded border px-1.5 py-0.5 text-xs ${cls}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

function GridCard({
  title,
  children,
  full = false,
}: {
  title: string
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={`glass-panel rounded p-2.5 space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </div>
      {children}
    </div>
  )
}

function NistBadge({ entry }: { entry: NistStatus }) {
  const colorClass =
    NIST_STATUS_COLOR[entry.status] ?? 'text-muted-foreground bg-muted border-border'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {entry.algorithm}
      <span className="opacity-70">· {entry.status.replace(/_/g, ' ')}</span>
    </span>
  )
}

function ImpactBar({ score }: { score: number }) {
  const pct = Math.min(score, 100)
  const color =
    pct >= 65 ? 'bg-status-error' : pct >= 35 ? 'bg-status-warning' : 'bg-status-success'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-foreground w-8 text-right">
        {score}
      </span>
    </div>
  )
}

// ─── Recursive claim tree ────────────────────────────────────────────────────

import type { ClaimDependency } from '@/types/PatentTypes'

function ClaimNode({
  claim,
  allClaims,
  depth,
}: {
  claim: ClaimDependency
  allClaims: ClaimDependency[]
  depth: number
}) {
  const children = allClaims.filter((c) => c.depends_on.includes(claim.claim))
  return (
    <div style={{ marginLeft: depth * 14 }}>
      <div
        className={`flex items-baseline gap-1.5 py-0.5 text-xs ${depth === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
      >
        <span className="shrink-0 font-mono tabular-nums text-[10px] text-muted-foreground/60 w-6 text-right">
          {claim.claim}
        </span>
        <span>{claim.subject}</span>
      </div>
      {children.map((child) => (
        <ClaimNode key={child.claim} claim={child} allClaims={allClaims} depth={depth + 1} />
      ))}
    </div>
  )
}

function ClaimTree({ claims }: { claims: ClaimDependency[] }) {
  const roots = claims.filter((c) => c.depends_on.length === 0)
  return (
    <div className="space-y-1">
      {roots.map((root) => (
        <ClaimNode key={root.claim} claim={root} allClaims={claims} depth={0} />
      ))}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PatentDetail({ patent, inCorpusIds, onClose, onNavigate }: Props) {
  const googlePatentsUrl = `https://patents.google.com/patent/${patent.patentNumber}/en`

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-mono">{patent.patentNumber}</span>
            <span>·</span>
            <span>{patent.issueDate || patent.priorityDate}</span>
            <a
              href={googlePatentsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logExternalLink('Patents', googlePatentsUrl)}
              className="inline-flex items-center gap-0.5 text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              USPTO
            </a>
          </div>
          <h2 className="text-sm font-semibold text-foreground leading-snug">{patent.title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{patent.assignee}</p>
          {patent.inventors && (
            <p
              className="mt-0.5 text-xs text-muted-foreground/70 truncate"
              title={patent.inventors}
            >
              {patent.inventors}
            </p>
          )}
          {patent.cpcCodes && (
            <p className="mt-1 text-[10px] font-mono text-muted-foreground/60 leading-relaxed break-all">
              {patent.cpcCodes}
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 h-7 w-7">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Impact score */}
        <div className="glass-panel rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Migration Impact</span>
            <span className={`text-xs font-bold ${IMPACT_COLOR[patent.impactLevel]}`}>
              {patent.impactLevel}
            </span>
          </div>
          <ImpactBar score={patent.impactScore} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>
              Crypto agility:{' '}
              <span className={`font-medium ${AGILITY_COLOR[patent.cryptoAgilityMode]}`}>
                {patent.cryptoAgilityMode.replace(/_/g, ' ')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              Quantum:{' '}
              <span
                className={`inline-block rounded border px-1 py-px text-[10px] font-medium ${QUANTUM_RELEVANCE_COLOR[patent.quantumRelevance] ?? QUANTUM_RELEVANCE_COLOR.none}`}
              >
                {patent.quantumRelevance.replace(/_/g, ' ')}
              </span>
            </span>
          </div>
        </div>

        {/* Summary */}
        {patent.summary && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Summary
            </div>
            <p className="text-sm text-foreground leading-relaxed">{patent.summary}</p>
          </div>
        )}

        {/* Primary inventive claim */}
        {patent.primaryInventiveClaim && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Primary Inventive Claim
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {patent.primaryInventiveClaim}
            </p>
          </div>
        )}

        {/* Quantum notes */}
        {patent.quantumNotes && patent.quantumNotes !== 'none' && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Quantum Notes
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{patent.quantumNotes}</p>
          </div>
        )}

        {/* Cryptographic profile — card grid */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <Shield className="h-3 w-3" /> Cryptographic Profile
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <GridCard title="PQC Algorithms">
              <ColorTagList items={patent.pqcAlgorithms} variant="pqc" />
            </GridCard>
            <GridCard title="Classical Algorithms">
              <ColorTagList items={patent.classicalAlgorithms} variant="classical" />
            </GridCard>
            <GridCard title="Quantum Technology">
              <ColorTagList
                items={patent.quantumTechnology.filter((t) => t !== 'none')}
                variant="quantum"
              />
            </GridCard>
            <GridCard title="Protocols">
              <ColorTagList items={patent.protocols} variant="protocol" />
            </GridCard>
            <GridCard title="Primitive Types">
              <ColorTagList items={patent.primitiveTypes} variant="info" />
            </GridCard>
            <GridCard title="Hardware">
              <ColorTagList items={patent.hardwareComponents} variant="warning" />
            </GridCard>
            <GridCard title="Key Management">
              <ColorTagList items={patent.keyManagementOps} />
            </GridCard>
            <GridCard title="Auth Factors">
              <ColorTagList items={patent.authenticationFactors} />
            </GridCard>
            <GridCard title="Entropy Source">
              <ColorTagList
                items={patent.entropySource.filter((e) => e !== 'none')}
                variant="quantum"
              />
            </GridCard>
            <GridCard title="Threat Model">
              <ColorTagList items={patent.threatModel} variant="threat" />
            </GridCard>
            <GridCard title="Application Domain" full>
              <ColorTagList items={patent.applicationDomain} variant="protocol" />
            </GridCard>
            <GridCard title="Data Protected">
              <ColorTagList items={patent.dataTypesProtected} />
            </GridCard>
            <GridCard title="Standards Referenced">
              <ColorTagList items={patent.standardsReferenced} variant="warning" />
            </GridCard>
            <GridCard title="Compliance Targets">
              <ColorTagList items={patent.complianceTargets} variant="protocol" />
            </GridCard>
            <GridCard title="Migration Strategy" full>
              <span className="text-sm text-foreground">
                {patent.migrationStrategy.replace(/_/g, ' ')}
              </span>
            </GridCard>
          </div>
        </div>

        {/* NIST Round Status */}
        {patent.nistRoundStatus.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Zap className="h-3 w-3" /> NIST PQC Status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patent.nistRoundStatus.map((entry) => (
                <NistBadge key={entry.algorithm} entry={entry} />
              ))}
            </div>
          </div>
        )}

        {/* Claim structure */}
        {patent.claimDependencies.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <GitBranch className="h-3 w-3" /> Claim Structure
            </div>
            <ClaimTree claims={patent.claimDependencies} />
          </div>
        )}

        {/* Citation graph */}
        {patent.citationGraph.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <BookOpen className="h-3 w-3" /> Prior Art Citations ({patent.citationGraph.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {patent.citationGraph.map((num) => {
                const isInCorpus = inCorpusIds.has(num)
                return isInCorpus ? (
                  <Button
                    key={num}
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(num)}
                    className="h-auto rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-xs font-mono text-primary hover:bg-primary/20 transition-colors"
                  >
                    {num}
                  </Button>
                ) : (
                  <a
                    key={num}
                    href={`https://patents.google.com/patent/${num}/en`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() =>
                      logExternalLink('Patents', `https://patents.google.com/patent/${num}/en`)
                    }
                    className="rounded border border-border px-1.5 py-0.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {num}
                  </a>
                )
              })}
            </div>
          </div>
        )}

        {/* Explore related — cross-links to Algorithms and Library */}
        {(patent.pqcAlgorithms.length > 0 || patent.standardsReferenced.length > 0) && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Explore Related
            </div>
            <div className="flex flex-wrap gap-2">
              {patent.pqcAlgorithms.length > 0 && (
                <Link
                  to={`/algorithms?highlight=${encodeURIComponent(patent.pqcAlgorithms.slice(0, 6).join(','))}&tab=detailed`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                  title={`View ${patent.pqcAlgorithms.join(', ')} in Algorithms`}
                >
                  <Shield size={12} aria-hidden="true" />
                  Algorithms ↗
                  <ArrowRight size={10} className="opacity-50" />
                </Link>
              )}
              {patent.standardsReferenced.length > 0 && (
                <Link
                  to={`/library?q=${encodeURIComponent(patent.standardsReferenced[0])}`}
                  onClick={onClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                  title={`Search for ${patent.standardsReferenced[0]} in Library`}
                >
                  <BookOpen size={12} aria-hidden="true" />
                  Library ↗
                  <ArrowRight size={10} className="opacity-50" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="border-t border-border pt-4 text-xs text-muted-foreground leading-relaxed">
          Patent data sourced from USPTO public records. AI-generated enrichments are for research
          purposes only and do not constitute legal or IP advice.
        </p>
      </div>
    </div>
  )
}
