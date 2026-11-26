// SPDX-License-Identifier: AGPL-3.0-only
import {
  X,
  ExternalLink,
  Shield,
  Zap,
  GitBranch,
  BookOpen,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import type { PatentItem, NistStatus } from '@/types/PatentTypes'
import { logExternalLink } from '@/utils/analytics'
import { EndorseButton } from '@/components/ui/EndorseButton'
import { FlagButton } from '@/components/ui/FlagButton'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { buildEndorsementUrl, buildFlagUrl } from '@/utils/endorsement'
import { expandAlgorithmAliases } from '@/data/algorithmNameAliases'
import {
  filingJurisdictionLabel,
  PUBLICATION_KIND_HINT,
  USPTO_PUBLIC_SEARCH,
  publicationScope,
} from '@/data/patentFilters'
import { inventorLeadersFor } from './patentInventorLeaders'
import { findAlgorithmByRef, loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'
import { standardRefHref } from '@/utils/standardRef'

interface Props {
  patent: PatentItem
  inCorpusIds: Set<string>
  onClose: () => void
  onNavigate: (patentNumber: string) => void
  /** Prior-art citation click. Hosts that keep `?patent` in the URL push here so
   *  Back returns to the citing patent; defaults to onNavigate. */
  onOpenCitation?: (patentNumber: string) => void
  isExpanded?: boolean
  onToggleExpand?: () => void
  /** Makes profile tags clickable: filter Explore by (URL param, value). */
  onFilterTag?: (param: string, value: string) => void
}

const IETF_IPR_URL = 'https://datatracker.ietf.org/ipr/'

// ─── Color tokens ────────────────────────────────────────────────────────────
type TagVariant =
  'pqc' | 'classical' | 'quantum' | 'protocol' | 'info' | 'warning' | 'threat' | 'default'

const TAG_CLASSES: Record<TagVariant, string> = {
  pqc: 'border-success/40 text-success-legible bg-success/10',
  classical: 'border-destructive/40 text-destructive bg-destructive/10',
  quantum: 'border-warning/40 text-warning bg-warning/10',
  protocol: 'border-primary/40 text-primary bg-primary/10',
  info: 'border-info/40 text-info-legible bg-info/10',
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

const QUANTUM_SAFE_BASIS_LABEL: Record<string, string> = {
  symmetric_strength:
    'Quantum-safe by symmetric strength — 256-bit symmetric or SHA-2/3 primitives. Grover’s algorithm costs a square root, so AES-256 retains ~128-bit security; NIST treats 256-bit symmetric as post-quantum adequate. Not a NIST PQC algorithm.',
  lattice_fhe:
    'Quantum-safe by lattice assumption — homomorphic encryption (CKKS, BFV, BGV) rests on LWE/RLWE hardness, believed quantum-resistant, but is not a NIST PQC standard.',
  qkd: 'Quantum key distribution — security from physics rather than computational hardness. Not post-quantum cryptography, which is classical algorithms believed safe against quantum computers.',
}

const IMPACT_COLOR: Record<string, string> = {
  High: 'text-status-error',
  Medium: 'text-status-warning',
  Low: 'text-status-success',
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function ColorTagList({
  items,
  variant = 'default',
  onSelect,
  hrefFor,
  selectLabel = 'Show patents tagged',
}: {
  items: string[]
  variant?: TagVariant
  /** Tag click → filter (rendered as a button). */
  onSelect?: (item: string) => void
  /** Tag → page link (rendered as a link when it returns one). */
  hrefFor?: (item: string) => string | null
  selectLabel?: string
}) {
  if (!items.length) return <span className="text-muted-foreground text-xs">—</span>
  // eslint-disable-next-line security/detect-object-injection -- closed union key
  const cls = TAG_CLASSES[variant]
  const base = `inline-block rounded border px-1.5 py-0.5 text-xs ${cls}`
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => {
        const href = hrefFor?.(item) ?? null
        if (href)
          return (
            <Link
              key={item}
              to={href}
              className={`${base} hover:underline`}
              title={`Open ${item} in Library`}
            >
              {item}
            </Link>
          )
        if (onSelect)
          return (
            <Button
              key={item}
              type="button"
              variant="ghost"
              onClick={() => onSelect(item)}
              title={`${selectLabel} ${item}`}
              className={`${base} h-auto font-normal hover:underline`}
            >
              {item}
            </Button>
          )
        return (
          <span key={item} className={base}>
            {item}
          </span>
        )
      })}
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
    <div className={`glass-panel rounded-2xl p-2.5 space-y-1.5 ${full ? 'sm:col-span-2' : ''}`}>
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
    pct >= 72 ? 'bg-status-error' : pct >= 35 ? 'bg-status-warning' : 'bg-status-success'
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
        <span className="shrink-0 font-mono tabular-nums text-[10px] text-muted-foreground w-6 text-right">
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

export function PatentDetail({
  patent,
  inCorpusIds,
  onClose,
  onNavigate,
  onOpenCitation = onNavigate,
  isExpanded,
  onToggleExpand,
  onFilterTag,
}: Props) {
  const filterBy = (param: string) =>
    onFilterTag ? (value: string) => onFilterTag(param, value) : undefined
  const googlePatentsUrl = `https://patents.google.com/patent/${patent.patentNumber}/en`
  const dateParts = [
    patent.priorityDate && { label: 'Priority', term: 'Priority Date', value: patent.priorityDate },
    patent.filingDate && { label: 'Filed', term: 'Filing Date', value: patent.filingDate },
    patent.issueDate &&
      (patent.publicationKind === 'published_application'
        ? { label: 'Published', term: 'Publication', value: patent.issueDate }
        : { label: 'Granted', term: 'Issue Date', value: patent.issueDate }),
  ].filter((d): d is { label: string; term: string; value: string } => Boolean(d))

  // The patent corpus keeps filing-era algorithm names (Kyber, Dilithium,
  // SPHINCS+, Falcon) rather than rewriting history to their later FIPS
  // parameter-set names — but /algorithms' own data is keyed on the FIPS
  // names (ML-KEM, ML-DSA, SLH-DSA, FN-DSA). Expand through the same
  // legacy⇄FIPS alias table PatentSearchPanel already uses for search, so a
  // patent filed under "Kyber" still deep-links to a real highlighted row.
  const highlightedAlgorithms = patent.pqcAlgorithms.slice(0, 6)
  const algorithmsHighlightParam = [
    ...highlightedAlgorithms,
    ...expandAlgorithmAliases(highlightedAlgorithms),
  ].join(',')

  // A patent naming exactly one algorithm that /algorithms actually carries
  // (e.g. "Rainbow", "SABER") opens its detail drawer via `?algo=<id>`; the
  // family names most patents use ("Kyber", "XMSS") don't resolve to one row
  // and keep the multi-name highlight filter. Resolution is against the loaded
  // algorithm data, so an id is only emitted when the drawer will find it.
  const singleAlgorithm = patent.pqcAlgorithms.length === 1 ? patent.pqcAlgorithms[0] : null
  const [resolvedAlgo, setResolvedAlgo] = useState<{ ref: string; id: string | null } | null>(null)
  useEffect(() => {
    if (!singleAlgorithm) return
    let live = true
    loadPQCAlgorithmsData()
      .then((data) => {
        if (live)
          setResolvedAlgo({
            ref: singleAlgorithm,
            id: findAlgorithmByRef(data, singleAlgorithm)?.id ?? null,
          })
      })
      .catch(() => {
        /* keep the highlight fallback */
      })
    return () => {
      live = false
    }
  }, [singleAlgorithm])
  const singleAlgoId =
    singleAlgorithm && resolvedAlgo?.ref === singleAlgorithm ? resolvedAlgo.id : null
  const algorithmsHref = singleAlgoId
    ? `/algorithms?algo=${encodeURIComponent(singleAlgoId)}`
    : `/algorithms?highlight=${encodeURIComponent(algorithmsHighlightParam)}&tab=detailed`

  // Library: the first cited standard that resolves to a real library
  // reference_id opens that document (`?ref=`); a free-text search is only the
  // fallback when none of the citations resolve.
  const firstStandard = patent.standardsReferenced[0]
  const resolvedStandard = patent.standardsReferenced
    .map((ref) => ({ ref, href: standardRefHref(ref) }))
    .find((r) => r.href !== null)
  const libraryHref =
    resolvedStandard?.href ??
    (firstStandard ? `/library?q=${encodeURIComponent(firstStandard)}` : '/library')
  const libraryTitle = resolvedStandard
    ? `Open ${resolvedStandard.ref} in Library`
    : `Search for ${firstStandard} in Library`

  const inventorLeaders = patent.inventors ? inventorLeadersFor(patent) : null
  const leaderLinkClass = 'text-primary hover:underline'
  // `?leader=` takes the stable leader_id first, the display name as fallback.
  const leaderHref = (l: { leaderId?: string; name: string }) =>
    `/leaders?leader=${encodeURIComponent(l.leaderId || l.name)}`

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mb-1">
            <span className="font-mono whitespace-nowrap">{patent.patentNumber}</span>
            <span
              className="rounded border border-border px-1 text-[10px] uppercase tracking-wide"
              title={PUBLICATION_KIND_HINT}
            >
              {patent.publicationKind === 'published_application'
                ? 'Published application'
                : 'Granted patent'}
            </span>
            {dateParts.length > 0 && (
              <>
                <span>·</span>
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  {dateParts.map(({ label, term, value }, i) => (
                    <span key={term} className="inline-flex items-center gap-1 whitespace-nowrap">
                      {i > 0 && <span className="text-muted-foreground/50">/</span>}
                      {term === 'Publication' ? (
                        <span title={PUBLICATION_KIND_HINT}>{label}</span>
                      ) : (
                        <InlineTooltip term={term}>{label}</InlineTooltip>
                      )}{' '}
                      {value}
                    </span>
                  ))}
                </span>
              </>
            )}
            <a
              href={googlePatentsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => logExternalLink('Patents', googlePatentsUrl)}
              className="inline-flex items-center gap-0.5 whitespace-nowrap text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Google Patents
            </a>
          </div>
          <h2 className="text-sm font-semibold leading-snug font-display text-heading">
            {patent.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {publicationScope(patent)}{' '}
            <a
              href={USPTO_PUBLIC_SEARCH}
              className="text-primary underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Look up {patent.patentNumber} at USPTO
            </a>
            .
          </p>
          {patent.assignee ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{patent.assignee}</p>
          ) : (
            <p className="mt-0.5 text-xs italic text-muted-foreground">Assignee not available</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Filing office: {filingJurisdictionLabel(patent)}
            {filingJurisdictionLabel(patent) !== 'Unassigned' && (
              <>
                {' '}
                · Application {patent.filingJurisdictionApplication}{' '}
                <a
                  href={patent.filingJurisdictionSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Bibliographic source
                </a>
              </>
            )}
          </p>
          {patent.inventors && inventorLeaders && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate" title={patent.inventors}>
              <span className="text-muted-foreground">Inventor(s): </span>
              {/* Inventors who are Community leaders link to their card. */}
              {inventorLeaders.primary ? (
                <Link
                  to={leaderHref(inventorLeaders.primary)}
                  className={leaderLinkClass}
                  title={`Open ${inventorLeaders.primary.name} in Community`}
                >
                  {inventorLeaders.firstInventor}
                </Link>
              ) : (
                inventorLeaders.firstInventor
              )}
              {inventorLeaders.suffix}
              {inventorLeaders.others.map((l) => (
                <span key={l.id}>
                  {' · '}
                  <Link
                    to={leaderHref(l)}
                    className={leaderLinkClass}
                    title={`Open ${l.name} in Community`}
                  >
                    {l.name}
                  </Link>
                </span>
              ))}
            </p>
          )}
          {patent.cpcCodes && (
            <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed break-all">
              <span className="font-sans">
                <InlineTooltip term="CPC Code">CPC</InlineTooltip>:{' '}
              </span>
              <span className="font-mono">{patent.cpcCodes}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <EndorseButton
            endorseUrl={buildEndorsementUrl({
              category: 'patent-endorsement',
              title: `Endorse: ${patent.patentNumber} — ${patent.title}`,
              resourceType: 'Patent',
              resourceId: patent.patentNumber,
              resourceDetails: [
                `**Patent:** ${patent.patentNumber}`,
                `**Title:** ${patent.title}`,
                patent.assignee ? `**Assignee:** ${patent.assignee}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
              pageUrl: `/patents?patent=${encodeURIComponent(patent.patentNumber)}`,
            })}
            resourceLabel={`${patent.patentNumber} — ${patent.title}`}
            resourceType="Patent"
          />
          <FlagButton
            flagUrl={buildFlagUrl({
              category: 'patent-endorsement',
              title: `Flag: ${patent.patentNumber} — ${patent.title}`,
              resourceType: 'Patent',
              resourceId: patent.patentNumber,
              resourceDetails: [
                `**Patent:** ${patent.patentNumber}`,
                `**Title:** ${patent.title}`,
                patent.assignee ? `**Assignee:** ${patent.assignee}` : '',
              ]
                .filter(Boolean)
                .join('\n'),
              pageUrl: `/patents?patent=${encodeURIComponent(patent.patentNumber)}`,
            })}
            resourceLabel={`${patent.patentNumber} — ${patent.title}`}
            resourceType="Patent"
          />
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="hidden sm:inline-flex h-7 w-7"
              aria-label={isExpanded ? 'Collapse to half width' : 'Expand to full width'}
              title={isExpanded ? 'Collapse to half width' : 'Expand to full width'}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7"
            aria-label="Close detail panel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Impact score */}
        <div className="glass-panel rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Hub catalogue analysis score
            </span>
            <span className={`text-xs font-bold ${IMPACT_COLOR[patent.impactLevel]}`}>
              {patent.impactLevel}
            </span>
          </div>
          <ImpactBar score={patent.impactScore} />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <dt>From the record&rsquo;s facts</dt>
            <dd className="text-right tabular-nums text-foreground">{patent.impactFacts} / 50</dd>
            <dt>From the PQC migration score</dt>
            <dd className="text-right tabular-nums text-foreground">
              {patent.pqcMigrationScore == null
                ? 'not yet scored (facts counted twice)'
                : `${patent.impactMigration} / 50`}
            </dd>
          </dl>
          <p className="text-xs text-muted-foreground">
            Half of this Hub score comes from what the record names (FIPS 203/204/205 standards,
            protocols, hardware, application domains and data types protected), half from its
            1&ndash;10 PQC migration score. High is 72 or more, Medium 35&ndash;71. It is a reading
            aid for this catalogue: it does not establish patent validity, enforceability, licensing
            terms or IP value.
          </p>
          {patent.pqcMigrationScore != null && (
            <div className="rounded border border-border p-2 text-xs">
              <div className="font-semibold text-foreground">
                PQC migration score: {patent.pqcMigrationScore} / 10
              </div>
              {patent.pqcMigrationReason && (
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  {patent.pqcMigrationReason}
                </p>
              )}
            </div>
          )}
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
            <div className="uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
              Summary
            </div>
            <p className="text-sm text-foreground leading-relaxed">{patent.summary}</p>
          </div>
        )}

        {/* Primary inventive claim */}
        {patent.primaryInventiveClaim && (
          <div className="space-y-1">
            <div className="uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
              <InlineTooltip term="Independent Claim">Primary Inventive Claim</InlineTooltip>
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {patent.primaryInventiveClaim}
            </p>
          </div>
        )}

        {/* Quantum-safety basis — why this patent is quantum-safe when it
            names no NIST PQC algorithm. AES-256 gives ~128-bit security
            against Grover, which NIST treats as post-quantum adequate, and
            `pqcAlgorithms` has no way to say so. */}
        {patent.quantumSafeBasis && patent.quantumSafeBasis !== 'pqc_algorithm' && (
          <div className="space-y-1">
            <div className="uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
              Quantum-safe basis
            </div>
            <p className="text-sm text-foreground leading-relaxed">
              {QUANTUM_SAFE_BASIS_LABEL[patent.quantumSafeBasis]}
            </p>
          </div>
        )}

        {/* Quantum notes */}
        {patent.quantumNotes && patent.quantumNotes !== 'none' && (
          <div className="space-y-1">
            <div className="uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
              Quantum Notes
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{patent.quantumNotes}</p>
          </div>
        )}

        {/* Cryptographic profile — card grid */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center gap-1.5 uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
            <Shield className="h-3 w-3" /> Cryptographic Profile
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <GridCard title="PQC Algorithms">
              <ColorTagList items={patent.pqcAlgorithms} variant="pqc" onSelect={filterBy('pqc')} />
            </GridCard>
            <GridCard title="Classical Algorithms">
              <ColorTagList
                items={patent.classicalAlgorithms}
                variant="classical"
                onSelect={filterBy('classicalAlgorithm')}
              />
            </GridCard>
            <GridCard title="Quantum Technology">
              <ColorTagList
                items={patent.quantumTechnology.filter((t) => t !== 'none')}
                variant="quantum"
              />
            </GridCard>
            <GridCard title="Protocols">
              <ColorTagList
                items={patent.protocols}
                variant="protocol"
                onSelect={filterBy('protocol')}
              />
            </GridCard>
            <GridCard title="Primitive Types">
              <ColorTagList items={patent.primitiveTypes} variant="info" />
            </GridCard>
            <GridCard title="Hardware">
              <ColorTagList
                items={patent.hardwareComponents}
                variant="warning"
                onSelect={filterBy('hardwareComponent')}
              />
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
              <ColorTagList
                items={patent.threatModel}
                variant="threat"
                onSelect={filterBy('threatModel')}
              />
            </GridCard>
            <GridCard title="Application Domain" full>
              <ColorTagList
                items={patent.applicationDomain}
                variant="protocol"
                onSelect={filterBy('domain')}
              />
            </GridCard>
            <GridCard title="Performance Claims">
              <ColorTagList items={patent.performanceClaims} variant="info" />
            </GridCard>
            <GridCard title="Data Protected">
              <ColorTagList items={patent.dataTypesProtected} />
            </GridCard>
            <GridCard title="Standards Referenced">
              {/* Each standard the Library holds opens there; the rest filter. */}
              <ColorTagList
                items={patent.standardsReferenced}
                variant="warning"
                hrefFor={standardRefHref}
                onSelect={filterBy('standard')}
              />
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
            <div className="flex items-center gap-1.5 uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
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
            <div className="flex items-center gap-1.5 uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
              <GitBranch className="h-3 w-3" /> Claim Structure
            </div>
            <ClaimTree claims={patent.claimDependencies} />
          </div>
        )}

        {/* Citation graph */}
        {patent.citationGraph.length > 0 && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center gap-1.5 uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
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
                    onClick={() => onOpenCitation(num)}
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

        {/* Explore related — cross-links to Algorithms and Library. No onClose:
            leaving the page unmounts the drawer anyway, and closing first
            wrote a closed-drawer history entry, so Back lost the patent. */}
        {(patent.pqcAlgorithms.length > 0 || patent.standardsReferenced.length > 0) && (
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex items-center gap-1.5 uppercase text-[11px] font-extrabold tracking-[0.14em] text-heading">
              Explore Related
            </div>
            <div className="flex flex-wrap gap-2">
              {patent.pqcAlgorithms.length > 0 && (
                <Link
                  to={algorithmsHref}
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
                  to={libraryHref}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-muted/30 border border-border hover:bg-muted/60 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all"
                  title={libraryTitle}
                >
                  <BookOpen size={12} aria-hidden="true" />
                  Library ↗
                  <ArrowRight size={10} className="opacity-50" />
                </Link>
              )}
            </div>
          </div>
        )}

        {/* General questions only (owner decision 2026-11-14): the catalogue
            records no licence, pledge or assertion history, so nothing here
            says what applies to any one patent. */}
        <details className="border-t border-border pt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-semibold uppercase tracking-wide">
            Questions to take to your counsel
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-4 leading-relaxed">
            <li>What does the current official record say about this application or grant?</li>
            <li>
              Do the claims cover the standardised algorithm itself, or one implementation, protocol
              or hardware design that a product may or may not use?
            </li>
            <li>
              Has the holder filed an intellectual property rights declaration with the IETF for a
              specification you use? Declarations can be searched on the{' '}
              <a
                href={IETF_IPR_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => logExternalLink('Patents', IETF_IPR_URL)}
                className="text-primary hover:underline"
              >
                IETF IPR disclosures page
              </a>
              .
            </li>
            <li>Does your supplier contract include an intellectual property indemnity?</li>
          </ul>
        </details>

        {/* Disclaimer */}
        <p className="border-t border-border pt-4 text-xs text-muted-foreground leading-relaxed">
          Patent data sourced from USPTO public records. AI-generated enrichments are for research
          and educational purposes only and do not constitute legal, IP, or freedom-to-operate (FTO)
          advice.
        </p>
      </div>
    </div>
  )
}
