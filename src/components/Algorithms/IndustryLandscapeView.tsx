// SPDX-License-Identifier: GPL-3.0-only
//
// Industry Landscape tab — dual-mode explorer over the industry-landscape
// source (industry_landscape_* / industry_standards_* / industry_market_size_*
// CSVs). Two entry points, both URL-synced:
//   ?tab=landscape&industry=<label>    — pick an industry, see its use cases,
//                                        mechanisms, standards, market size
//   ?tab=landscape&mechanism=<family>  — pick a crypto mechanism, see every
//                                        industry/use case that relies on it
// Standard chips deep-link to the in-app Library entry via libraryRef.ts —
// the same resolver Protocol Support uses. Protocol chips deep-link into the
// Protocol Support tab.
//
// Picking an industry also opens a cross-reference rollup (2026-08-13): its
// Learn modules, its technical standards grouped by body, the Crypto Lab tools
// curated for its use cases, and a count + deep link into the regulatory
// register. Every lookup lives in industryCrossRefs.ts so this file stays a
// renderer. There is deliberately NO deadlines row — see that file's header for
// the measurement that killed it.

import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowLeft,
  BookMarked,
  Landmark as LandmarkIcon,
  GraduationCap as GraduationCapIcon,
  Lock,
  Globe,
  FlaskConical,
  Scale,
  Container,
  ArrowRight,
  Code,
  Clock,
} from 'lucide-react'
import {
  loadIndustryLandscape,
  getLandscapeMetadata,
  type IndustryUseCase,
  type IndustryStandard,
  type IndustryMarketSize,
  type PqcClaimBasis,
} from '../../data/industryLandscapeData'
import { evidenceLabelFor } from './evidenceLabels'
import {
  CLASSICAL_MECHANISM_FAMILIES,
  PQC_MECHANISM_FAMILIES,
  getMechanismFamily,
  CYCLONEDX_REGISTRY,
} from '../../data/cryptoMechanisms'
import { PROTOCOL_MATRIX } from '../../data/pqcProtocolMatrix'
import { INDUSTRY_ICONS, USE_CASE_ICONS } from './landscapeIcons'
import { Button } from '../ui/button'
import { libraryHref } from './libraryRef'
import { softwareData } from '../../data/migrateData'
import {
  learnModulesForIndustry,
  librarySectorHref,
  regulatoryFor,
  standardsForIndustry,
  toolsForIndustry,
  toolsForUseCase,
} from './industryCrossRefs'
import type { WorkshopTool } from '../Playground/workshopRegistry'

// ── Formatting helpers ───────────────────────────────────────────────────────

export function formatMarketSize(usd: number): string {
  if (usd >= 1e12) return `$${(usd / 1e12).toFixed(usd >= 1e13 ? 1 : 2)}T`
  if (usd >= 1e9) return `$${Math.round(usd / 1e9)}B`
  return `$${Math.round(usd / 1e6)}M`
}

const METRIC_LABEL: Record<string, string> = {
  value_added: 'value added',
  revenue: 'revenue',
  gdp_contribution: 'GDP contribution',
  expenditure: 'expenditure',
  payment_value: 'payment value',
  investment: 'investment',
  market_cap: 'market cap',
}

const STATUS_STYLE: Record<IndustryUseCase['migrationStatus'], string> = {
  production: 'bg-status-success/15 text-status-success',
  pilot: 'bg-status-info/15 text-status-info',
  draft: 'bg-status-warning/15 text-status-warning',
  none: 'bg-muted text-muted-foreground',
}

const STATUS_LABEL: Record<IndustryUseCase['migrationStatus'], string> = {
  production: 'PQC in production',
  pilot: 'PQC pilots',
  draft: 'PQC drafts',
  none: 'No PQC path yet',
}

const protocolNames = new Map(PROTOCOL_MATRIX.map((p) => [p.id, p.name]))

// ── Small pieces ─────────────────────────────────────────────────────────────

function MarketSizeBadge({ m }: { m: IndustryMarketSize }) {
  const metric = METRIC_LABEL[m.metricType] ?? m.metricType
  return (
    // WS8b: official statistics (BEA, Census, IMF, WHO) are cited as TEXT.
    // None of the 19 market-size sources is a library document and forcing
    // statistical tables into a PQC document library would distort what the
    // library is for — so attribution stays visible without an outbound link.
    <span
      title={`${m.figureAsStated} — ${m.mainSource} (${m.regionScope} ${metric}, ${m.marketSizeYear})`}
      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
    >
      {formatMarketSize(m.marketSizeUsd)}
      <span className="opacity-70">
        {m.regionScope} {metric} ({m.marketSizeYear}) · {m.mainSource}
      </span>
    </span>
  )
}

function MechanismChip({
  family,
  onSelect,
  active,
}: {
  family: string
  onSelect?: (f: string) => void
  active?: boolean
}) {
  const def = getMechanismFamily(family)
  const classical = def?.classical ?? true
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onSelect ? () => onSelect(family) : undefined}
      className={`h-auto rounded-full border px-2 py-0.5 text-xs font-medium transition-colors ${
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : classical
            ? 'border-border bg-muted/60 text-foreground hover:border-primary/50'
            : 'border-status-success/40 bg-status-success/10 text-status-success hover:border-status-success'
      }`}
      title={def ? `${def.family} — ${def.kinds.join(', ')}` : family}
    >
      {family}
    </Button>
  )
}

/** How a non-standard evidence row is labelled. A research paper can prove
 *  which algorithms a use case relies on, but it is not a specification —
 *  the badge keeps that distinction visible wherever the chip renders. */
// EVIDENCE_LABEL / evidenceLabelFor moved to ./evidenceLabels (2026-08-15) so
// the driftguard can pin vocabulary↔renderer agreement without importing this
// component into a data test. See that module for why the guard exists.

/** Protocol chip. `target` marks the PQC migration destination (WS11). */
function ProtocolChip({ id, target }: { id: string; target?: boolean }) {
  const name = protocolNames.get(id) ?? id
  return (
    <Link
      to={`/algorithms?tab=support&protocol=${encodeURIComponent(id)}`}
      className={
        target
          ? 'rounded border border-status-success/40 bg-status-success/10 px-2 py-0.5 text-xs font-medium text-status-success hover:border-status-success'
          : 'rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground hover:border-primary/60 hover:text-primary'
      }
      title={
        target
          ? `${name} is where this use case's PQC migration lands. Open it in Protocol Support.`
          : `${name} is what this use case runs today. Open it in Protocol Support.`
      }
    >
      {name}
    </Link>
  )
}

/**
 * What a PQC claim rests on (WS10). Deliberately the same visual grammar as the
 * standards chips' evidence badge — a reader must never mistake a research
 * proposal for a deployed standard, and one badge language is easier to learn
 * than two.
 */
const CLAIM_BASIS_LABEL: Record<PqcClaimBasis, { label: string; tone: string; help: string }> = {
  adopted: {
    label: 'Adopted',
    tone: 'border-status-success/40 bg-status-success/10 text-status-success',
    help: 'Published standard, and this sector is running it in production.',
  },
  standardised: {
    label: 'Standardised',
    tone: 'border-primary/40 bg-primary/10 text-primary',
    help: 'A published standard exists, but this sector has not migrated yet.',
  },
  'in-progress': {
    label: 'In progress',
    tone: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
    help: 'An active draft is on the standards track — not yet final.',
  },
  proposed: {
    label: 'Proposed',
    tone: 'border-status-error/40 bg-status-error/10 text-status-error',
    help: 'A research paper or vendor proposal. No standards-track work — not a specification.',
  },
  none: { label: '', tone: '', help: '' },
}

function ClaimBasisBadge({ basis }: { basis: PqcClaimBasis }) {
  const d = CLAIM_BASIS_LABEL[basis]
  if (!d || !d.label) return null
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${d.tone}`}
      title={d.help}
    >
      {d.label}
    </span>
  )
}

/**
 * HSM / cryptographic-module certification requirements (added 2026-08-16).
 *
 * Renders nothing when the row has not been assessed — an empty verdict is NOT
 * the same as 'none', and showing "no certification required" for a use case
 * nobody has researched would be a fabricated negative.
 *
 * The `any-of` separator is the important part of this component. Every PCI
 * standard that imposes an HSM requirement joins FIPS validation and PCI
 * approval with "or", and the eIDAS implementing acts do the same across
 * CC / EUCC / FIPS. Two 'Required' chips side by side would read as "you need
 * both"; the explicit "or" between them is what keeps the tile honest.
 */
function CertBadge({
  scheme,
  verdict,
  detail,
}: {
  scheme: string
  verdict: string
  detail?: string
}) {
  if (!verdict || verdict === 'none') return null
  const mandated = verdict === 'mandated'
  return (
    <span
      className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        mandated
          ? 'border-status-warning/40 bg-status-warning/10 text-status-warning'
          : 'border-border bg-muted text-muted-foreground'
      }`}
      title={`${scheme}${detail ? ` — ${detail}` : ''}${
        mandated
          ? ' (required by the cited standard)'
          : ' (common industry practice; no mandating text found)'
      }`}
    >
      {scheme}
      {!mandated && ' (de facto)'}
    </span>
  )
}

function CertificationRow({ uc }: { uc: IndustryUseCase }) {
  const badges = [
    {
      key: 'fips',
      scheme: uc.fipsCertificationLevel
        ? `FIPS ${uc.fipsCertificationLevel}`
        : 'FIPS 140-3 validated',
      verdict: uc.fipsCertification,
      detail:
        uc.fipsCertificationLevel === 'not-specified'
          ? 'the mandate requires FIPS validation but names no security level'
          : undefined,
    },
    {
      key: 'cc',
      scheme: uc.ccScheme ? `Common Criteria (${uc.ccScheme})` : 'Common Criteria',
      verdict: uc.ccCertification,
      detail: uc.ccProtectionProfile || undefined,
    },
    {
      key: 'pci',
      scheme: uc.pciCertificationProgram || 'PCI',
      verdict: uc.pciCertification,
      detail: undefined,
    },
    {
      key: 'national',
      scheme: uc.nationalCertificationScheme || 'National scheme',
      verdict: uc.nationalCertification,
      detail: undefined,
    },
  ].filter((b) => b.verdict && b.verdict !== 'none')

  if (badges.length === 0) return null
  const anyOf = uc.certificationLogic === 'any-of' && badges.length > 1

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        className="text-[11px] uppercase tracking-wide text-muted-foreground"
        title="Certification the hardware protecting these keys must hold, per the cited standard."
      >
        HSM certification
      </span>
      {badges.map((b, i) => (
        <span key={b.key} className="flex items-center gap-1.5">
          {i > 0 && (
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              {anyOf ? 'or' : 'and'}
            </span>
          )}
          <CertBadge scheme={b.scheme} verdict={b.verdict} detail={b.detail} />
        </span>
      ))}
      {anyOf && (
        <span
          className="text-[10px] text-muted-foreground"
          title="The cited standard accepts any one of these certifications — they are alternative routes, not cumulative requirements."
        >
          (any one satisfies)
        </span>
      )}
    </div>
  )
}

/**
 * A dated, real, NOT-YET-BINDING certification change (added 2026-08-16).
 *
 * Deliberately styled nothing like CertificationRow's badges — dashed border,
 * a clock icon, and the word "Future" spelled out rather than implied. The
 * failure mode this guards against is a reader skimming the tile, seeing a
 * certification chip, and assuming it applies today. A 2030 deadline
 * rendered with the same solid amber badge as a binding-now requirement
 * would create exactly that false impression.
 */
function FutureCertificationNote({ uc }: { uc: IndustryUseCase }) {
  if (!uc.certificationFuture) return null
  return (
    <div className="mt-2 flex items-start gap-1.5 rounded border border-dashed border-border px-2 py-1.5 text-[11px] text-muted-foreground">
      <Clock size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-semibold uppercase tracking-wide text-muted-foreground">
          Future{uc.certificationFutureDate ? ` (${uc.certificationFutureDate})` : ''}:
        </span>{' '}
        {uc.certificationFuture}
      </span>
    </div>
  )
}

/** Standard chip: mechanisms it references + direct link to the Library page. */
function StandardChip({ std }: { std: IndustryStandard }) {
  const evidence = evidenceLabelFor(std.evidenceType)
  return (
    <Link
      to={libraryHref(std.libraryRef)}
      title={`${std.standardLabel} (${std.standardsBody})${
        evidence ? ` — ${evidence.toLowerCase()}, not a standard` : ''
      } — references: ${
        std.mechanismsReferenced.join(', ') || 'no specific mechanisms'
      }. Opens the Library entry.`}
      className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-xs text-foreground hover:border-primary/60 hover:text-primary"
    >
      <BookMarked size={11} className="opacity-60" />
      {std.standardLabel}
      {evidence && (
        <span className="rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground">
          {evidence}
        </span>
      )}
      {std.pqcReadiness === 'published' && (
        <span className="rounded bg-status-success/15 px-1 text-[10px] font-semibold text-status-success">
          PQC
        </span>
      )}
      {std.pqcReadiness === 'in-progress' && (
        <span className="rounded bg-status-warning/15 px-1 text-[10px] font-semibold text-status-warning">
          PQC WIP
        </span>
      )}
    </Link>
  )
}

/** Crypto Lab tool chip. Sandbox scenarios are badged: they need the
 *  access-gated Docker runtime and will not run in the browser. */
function ToolChip({ tool, title }: { tool: WorkshopTool; title?: string }) {
  return (
    <Link
      to={`/playground/${tool.id}`}
      title={title ?? `${tool.name} — ${tool.description}`}
      className="inline-flex items-center gap-1 rounded border border-border bg-card px-2 py-0.5 text-xs text-foreground hover:border-primary/60 hover:text-primary"
    >
      <FlaskConical size={11} className="opacity-60" />
      {tool.name}
      {tool.sandbox && (
        <span
          className="inline-flex items-center gap-0.5 rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground"
          title="Runs in the access-gated Docker sandbox, not in your browser"
        >
          <Container size={9} />
          sandbox
        </span>
      )}
    </Link>
  )
}

/** One labelled row of the industry rollup. */
function RollupRow({
  icon: Icon,
  label,
  count,
  children,
}: {
  icon: typeof BookMarked
  label: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border py-2 first:border-t-0 max-md:min-w-0">
      <span className="flex w-24 shrink-0 items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon size={12} className="opacity-70" />
        {label}
        {count !== undefined && count > 0 && <span className="opacity-60">({count})</span>}
      </span>
      {children}
    </div>
  )
}

function UseCaseCard({
  uc,
  standards,
  onPickMechanism,
  showIndustry,
}: {
  uc: IndustryUseCase
  standards: IndustryStandard[]
  onPickMechanism: (f: string) => void
  showIndustry?: boolean
}) {
  const Icon = USE_CASE_ICONS[uc.useCaseIcon] ?? Lock
  const tools = toolsForUseCase(uc)
  const workshopTools = tools.filter((t) => !t.sandbox)
  const sandboxTools = tools.filter((t) => t.sandbox)
  // Show the arrow only when the migration actually moves protocols —
  // x509 and ssh gained PQC in place, so target === current there.
  const migrates =
    uc.protocolsTarget.length > 0 && uc.protocolsTarget.join(';') !== uc.protocolsCurrent.join(';')
  const relevantStandards = standards.filter(
    (s) =>
      s.industry === uc.industry &&
      (uc.relatedStandards.includes(s.standardId) || s.useCaseIds.includes(uc.useCaseId))
  )
  return (
    <div className="rounded-lg border border-border bg-card p-4" data-use-case={uc.useCaseId}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon size={18} className="shrink-0 text-primary" />
          <h4 className="font-medium text-foreground">{uc.useCaseLabel}</h4>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[uc.migrationStatus]}`}
        >
          {STATUS_LABEL[uc.migrationStatus]}
        </span>
      </div>
      {showIndustry && <p className="mt-1 text-xs text-muted-foreground">{uc.industry}</p>}
      <p className="mt-2 text-sm text-muted-foreground">{uc.summary}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Classical</span>
        {uc.classicalMechanisms.map((m) => (
          <MechanismChip key={m} family={m} onSelect={onPickMechanism} />
        ))}
        {uc.pqcMechanisms.length > 0 && (
          <>
            <span className="ml-2 text-[11px] uppercase tracking-wide text-muted-foreground">
              PQC
            </span>
            {uc.pqcMechanisms.map((m) => (
              <MechanismChip key={m} family={m} onSelect={onPickMechanism} />
            ))}
            {/* WS10: says whether the PQC claim above is deployed, merely
                standardised, still a draft, or only a proposal. */}
            <ClaimBasisBadge basis={uc.pqcClaimBasis} />
          </>
        )}
      </div>

      {/* WS11: the protocol migration path. Current and target are shown
          separately — a row naming only TLS 1.2 has no PQC path at all, and
          merging the two columns hid exactly that on two rows. */}
      {uc.protocolsCurrent.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Runs today
          </span>
          {uc.protocolsCurrent.map((p) => (
            <ProtocolChip key={p} id={p} />
          ))}
          {migrates && (
            <>
              <ArrowRight size={12} className="text-muted-foreground" aria-hidden />
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                Migrates to
              </span>
              {uc.protocolsTarget.map((p) => (
                <ProtocolChip key={p} id={p} target />
              ))}
            </>
          )}
        </div>
      )}

      {uc.protocolsCurrent.length === 0 && uc.noProtocolReason && (
        <div className="mt-2 text-[11px] leading-snug text-muted-foreground">
          <span className="uppercase tracking-wide">No standardised protocol</span> —{' '}
          {uc.noProtocolReason}
        </div>
      )}

      {relevantStandards.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Standards
          </span>
          {relevantStandards.map((s) => (
            <StandardChip key={s.standardId} std={s} />
          ))}
        </div>
      )}

      <CertificationRow uc={uc} />
      <FutureCertificationNote uc={uc} />

      {/* T4/WS8d: workshop tools and sandbox scenarios are separate groups.
          They share the /playground/<id> route, but one runs in the browser and
          the other runs real binaries in an access-gated container — a
          different expectation, so a different label rather than one
          undifferentiated "Try it" row. */}
      {workshopTools.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Workshop tools
          </span>
          {workshopTools.map((t) => (
            <ToolChip key={t.id} tool={t} />
          ))}
        </div>
      )}

      {sandboxTools.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Sandbox scenarios
          </span>
          {sandboxTools.map((t) => (
            <ToolChip key={t.id} tool={t} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground max-md:min-w-0">
        {/* WS8a: hub-only routing. The cited document when the Library holds
            it, otherwise the sector's threats evidence — these citations ARE
            threats-corpus rows. Never an outbound link. */}
        <span className="inline-flex max-w-[75%] min-w-0 items-center gap-1">
          <Link
            to={
              uc.sourceLibraryRef
                ? libraryHref(uc.sourceLibraryRef)
                : `/threats?industry=${encodeURIComponent(uc.industry)}`
            }
            className="inline-flex min-w-0 items-center gap-1 truncate hover:text-primary"
            title={
              uc.sourceLibraryRef
                ? `${uc.mainSource} — open the Library entry`
                : `${uc.mainSource} — not yet a Library entry; opens this sector's threat evidence`
            }
          >
            <BookMarked size={10} className="shrink-0 opacity-60" />
            <span className="truncate">{uc.mainSource}</span>
          </Link>
          {/* 2026-08-15: "if there is no specific crypto requirements, mention
              it" — this document does not itself name the row's mechanisms;
              the proof is a different document in mechanismRefs. Same role as
              the standards table's evidence badge: never let a governance
              citation read as if it were the technical spec. */}
          {uc.sourceCitationType === 'driver' && (
            <span
              className="shrink-0 rounded bg-muted px-1 text-[10px] font-semibold text-muted-foreground"
              title="This document does not itself specify a cryptographic mechanism — it is cited as the regulatory/institutional driver. The mechanism claim above is proven by a different document."
            >
              driver, not spec
            </span>
          )}
        </span>
        {uc.migrateProductRefs.length > 0 && (
          <Link
            to={`/migrate?productIds=${uc.migrateProductRefs.map(encodeURIComponent).join(',')}`}
            className="inline-flex shrink-0 items-center gap-1 hover:text-primary"
            title={`Open in the migrate catalog: ${uc.migrateProductRefs
              .map((id) => softwareData.find((p) => p.productId === id)?.softwareName ?? id)
              .join(', ')}`}
          >
            <Code size={10} className="shrink-0 opacity-60" />
            Implementation
          </Link>
        )}
        <span title="Last verified">{uc.lastVerified}</span>
      </div>
    </div>
  )
}

/**
 * The cross-reference rollup under an industry header: Learn, Standards, Crypto
 * Lab tools, and a pointer at the regulatory register.
 *
 * The regulatory row is a COUNT AND A LINK, never a list. Rendering the
 * register here would be a second, degraded copy of /compliance, which already
 * does it with country filters, tiers, trust paths and a detail drawer. The
 * count answers "is there anything here for me"; the link hands off the rest,
 * carrying the same industry and the same `requires_pqc` narrowing so the
 * destination agrees with the number shown.
 */
function IndustryCrossRefs({
  industry,
  cases,
  standards,
}: {
  industry: string
  cases: IndustryUseCase[]
  standards: IndustryStandard[]
}) {
  const modules = useMemo(() => learnModulesForIndustry(industry, cases), [industry, cases])
  const stdGroups = useMemo(() => standardsForIndustry(industry, standards), [industry, standards])
  const tools = useMemo(() => toolsForIndustry(industry, cases), [industry, cases])
  // Sector-only, no country: the link doesn't carry one, so folding the
  // reader's country into the number would make the tile and its destination
  // disagree — and make a shared URL show different counts to different people.
  const regulatory = useMemo(() => regulatoryFor(industry), [industry])
  const sectorHref = librarySectorHref(industry)

  return (
    <div className="mb-4 rounded-lg border border-border bg-card px-4 py-1">
      <RollupRow icon={GraduationCapIcon} label="Learn">
        {modules.length > 0 ? (
          modules.map(({ manifest, href }) => (
            <Link
              key={manifest.id}
              to={href}
              className="inline-flex items-center gap-1 rounded border border-border bg-muted/40 px-2 py-0.5 text-xs text-foreground hover:border-primary/60 hover:text-primary"
              title={manifest.description}
            >
              {manifest.title}
              <span className="opacity-60">
                {manifest.duration}
                {manifest.difficulty ? ` · ${manifest.difficulty}` : ''}
              </span>
            </Link>
          ))
        ) : (
          // Real, reportable content gap — Cross-Industry and Media/DRM have no
          // Industries-track module. Say so rather than rendering nothing.
          <span className="text-xs text-muted-foreground">No Industries-track module yet</span>
        )}
      </RollupRow>

      <RollupRow
        icon={BookMarked}
        label="Standards"
        count={stdGroups.reduce((n, g) => n + g.standards.length, 0)}
      >
        {stdGroups.length > 0 ? (
          stdGroups.map((g) => (
            <span key={g.body} className="inline-flex flex-wrap items-center gap-1">
              <span className="text-[11px] text-muted-foreground">{g.body}</span>
              {g.standards.map((s) => (
                <StandardChip key={s.standardId} std={s} />
              ))}
            </span>
          ))
        ) : (
          // 10 of 22 industries have no rows. Decision 2026-08-13: do NOT
          // inherit the cross-industry set — an empty block is the honest
          // signal, and the Library link keeps the reader moving.
          <span className="text-xs text-muted-foreground">
            No sector-specific technical standards on record yet.{' '}
            {sectorHref && (
              <Link to={sectorHref} className="underline hover:text-primary">
                Browse the Library for this sector →
              </Link>
            )}
          </span>
        )}
      </RollupRow>

      <RollupRow icon={FlaskConical} label="Try it" count={tools.length}>
        {tools.map(({ tool, useCases }) => (
          <ToolChip
            key={tool.id}
            tool={tool}
            title={`${tool.name} — ${tool.description}. Used by: ${useCases
              .map((u) => u.useCaseLabel)
              .join(', ')}`}
          />
        ))}
      </RollupRow>

      <RollupRow icon={Scale} label="Regulatory">
        {regulatory.count > 0 ? (
          <Link
            to={regulatory.href}
            className="inline-flex items-center gap-1 text-xs text-foreground hover:text-primary"
          >
            <span className="font-medium">{regulatory.count}</span> PQC-relevant mandate
            {regulatory.count === 1 ? '' : 's'} for this sector
            <ArrowRight size={11} className="opacity-60" />
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">
            No PQC-specific mandates on record for this sector.
          </span>
        )}
      </RollupRow>
    </div>
  )
}

/**
 * Estimated cybersecurity-opportunity $ range, from
 * pqctoday-priv/maintenance/INDUSTRY-CYBER-OPPORTUNITY-RANKING-REPORT-08172026.md
 * — baseline market size x a compound cyber-spend-%-of-revenue ratio (mostly
 * ENISA NIS Investments 2025 sector data; see basis/confidence per row).
 * NOT an official-statistics figure like MarketSizeBadge's number — mixes
 * official (ENISA) and lower-rigor semi-official sources (CoSN, MS-ISAC),
 * self-computed compounds, and is a private research artifact never held to
 * this app's official-only sourcing bar. Shown here, clearly labeled as an
 * estimate with its confidence tier, rather than presented as equivalent to
 * the market-size figure it sits next to. The 4 industries the report
 * flagged "insufficient signal" (Crypto, Media, Payment Card, Insurance) and
 * the 3 fully exempt from market-size (Cross-Industry, HSM, IoT) have no
 * entry — omit the badge for those rather than guess a number.
 */
const CYBER_OPPORTUNITY: Record<
  string,
  { lo: number; hi: number; confidence: 'High' | 'Moderate' | 'Low'; basis: string }
> = {
  'Healthcare / Pharmaceutical': {
    lo: 23.85e9,
    hi: 27.01e9,
    confidence: 'Moderate',
    basis: 'ENISA Health sector (parent-level) x US CMS NHE baseline',
  },
  'Finance & Banking': {
    lo: 14.0e9,
    hi: 14.46e9,
    confidence: 'High',
    basis: 'ENISA Banking sector',
  },
  'Government & Defense': {
    lo: 10.56e9,
    hi: 11.43e9,
    confidence: 'Moderate',
    basis: 'ENISA Public Administration sector',
  },
  'Retail & E-Commerce': {
    lo: 7.03e9,
    hi: 9.25e9,
    confidence: 'Moderate',
    basis: 'RH-ISAC/IANS CISO Benchmark 2026, direct %-of-revenue',
  },
  'Cloud Computing / Data Centers': {
    lo: 6.27e9,
    hi: 6.97e9,
    confidence: 'High',
    basis: 'ENISA Digital Infrastructure (Cloud + Datacentre services, averaged)',
  },
  'IT Industry / Software': {
    lo: 6.26e9,
    hi: 6.56e9,
    confidence: 'Moderate',
    basis: 'ENISA ICT service management (B2B) — MSP/MSSP proxy',
  },
  'Critical Infrastructure / Energy': {
    lo: 5.3e9,
    hi: 6.9e9,
    confidence: 'High',
    basis: 'ENISA Energy sector — baseline is capex, not revenue',
  },
  Telecommunications: {
    lo: 5.19e9,
    hi: 5.66e9,
    confidence: 'High',
    basis: 'ENISA Digital Infrastructure (Telecoms)',
  },
  'Education / Research': {
    lo: 2.75e9,
    hi: 6.3e9,
    confidence: 'Low',
    basis: 'CoSN 2024 IT-budget survey x MS-ISAC/CIS NCSR — widest, least rigorous range',
  },
  'Legal / Notary / eSignature': {
    lo: 3.77e9,
    hi: 4.61e9,
    confidence: 'Low',
    basis: 'ENISA Digital Infrastructure (Trust services) — weak proxy, not law firms',
  },
  'Supply Chain / Logistics': {
    lo: 2.69e9,
    hi: 3.07e9,
    confidence: 'Moderate',
    basis: 'ENISA Transport sector (parent)',
  },
  'Water / Wastewater': {
    lo: 509.2e6,
    hi: 562.8e6,
    confidence: 'Moderate',
    basis: 'ENISA Drinking water + Waste water sectors, averaged',
  },
  'Automotive / Connected Vehicles': {
    lo: 0.48e9,
    hi: 0.55e9,
    confidence: 'Low',
    basis: 'ENISA Transport > Road transport — proxy only',
  },
  'Aerospace / Aviation': {
    lo: 0.47e9,
    hi: 0.53e9,
    confidence: 'High',
    basis: 'ENISA Transport > Aviation',
  },
  'Rail / Transit': {
    lo: 0.13e9,
    hi: 0.15e9,
    confidence: 'High',
    basis: 'ENISA Transport > Railway',
  },
}

function CyberOpportunityBadge({ industry }: { industry: string }) {
  const est = CYBER_OPPORTUNITY[industry]
  if (!est) return null
  return (
    <span
      title={`Estimated cybersecurity-opportunity range — ${est.confidence} confidence. Basis: ${est.basis}. Not an official statistic: mixes ENISA sector data with lower-rigor semi-official surveys, self-computed. See INDUSTRY-CYBER-OPPORTUNITY-RANKING-REPORT-08172026.md.`}
      className="inline-flex items-center gap-1 rounded-full bg-status-info/10 px-2 py-0.5 text-xs font-medium text-status-info"
    >
      Est. cyber opportunity: {formatMarketSize(est.lo)}–{formatMarketSize(est.hi)}
      <span className="opacity-70">({est.confidence} confidence)</span>
    </span>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export function IndustryLandscapeView() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { useCases, standards, marketSizes } = loadIndustryLandscape()
  const meta = getLandscapeMetadata()

  const selectedIndustry = searchParams.get('industry')
  const selectedMechanism = searchParams.get('mechanism')
  const mode: 'industry' | 'mechanism' = selectedMechanism ? 'mechanism' : 'industry'

  const marketByIndustry = useMemo(
    () => new Map(marketSizes.map((m) => [m.industry, m])),
    [marketSizes]
  )
  // Tile order (2026-08-17): descending by the market-size badge shown on
  // each tile, since that's the only ranking number the reader can actually
  // see — an earlier version sorted by a separate, unlabeled cyber-opportunity
  // estimate and it read as broken once market-size badges landed (e.g.
  // Energy's $3.40T badge outranking Financial Services' $2.44T while sitting
  // below it in the list). What you see is what determines the order now.
  // The 3 industries exempt from market-size entirely (Cross-Industry, HSM,
  // IoT) have no badge to sort by, so they fall back to alphabetical, always
  // after every industry that has one.
  const industries = useMemo(
    () =>
      Array.from(new Set(useCases.map((u) => u.industry))).sort((a, b) => {
        const sizeA = marketByIndustry.get(a)?.marketSizeUsd
        const sizeB = marketByIndustry.get(b)?.marketSizeUsd
        if (sizeA !== undefined && sizeB !== undefined) return sizeB - sizeA
        if (sizeA !== undefined) return -1
        if (sizeB !== undefined) return 1
        return a.localeCompare(b)
      }),
    [useCases, marketByIndustry]
  )
  const useCasesByIndustry = useMemo(() => {
    const map = new Map<string, IndustryUseCase[]>()
    for (const uc of useCases) {
      const list = map.get(uc.industry) ?? []
      list.push(uc)
      map.set(uc.industry, list)
    }
    return map
  }, [useCases])

  const update = (updates: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const [k, v] of Object.entries(updates)) {
          if (v === null) next.delete(k)
          else next.set(k, v)
        }
        return next
      },
      { replace: true }
    )
  }

  const pickIndustry = (industry: string | null) => update({ industry, mechanism: null })
  const pickMechanism = (mechanism: string | null) => update({ mechanism, industry: null })

  const mechanismDef = selectedMechanism ? getMechanismFamily(selectedMechanism) : undefined
  const mechanismHits = useMemo(() => {
    if (!selectedMechanism) return []
    return useCases.filter(
      (u) =>
        u.classicalMechanisms.includes(selectedMechanism) ||
        u.pqcMechanisms.includes(selectedMechanism)
    )
  }, [useCases, selectedMechanism])
  const standardsForMechanism = useMemo(() => {
    if (!selectedMechanism) return []
    return standards.filter((s) => s.mechanismsReferenced.includes(selectedMechanism))
  }, [standards, selectedMechanism])

  return (
    <div data-workshop-target="section-algorithm-industry-landscape">
      {/* Mode toggle */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Explore by</span>
        <div className="inline-flex overflow-hidden rounded-md border border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={() => update({ mechanism: null })}
            className={`h-auto rounded-none px-3 py-1.5 text-sm ${mode === 'industry' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-card text-foreground hover:bg-muted'}`}
          >
            Industry
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              if (mode !== 'mechanism') pickMechanism('RSA')
            }}
            className={`h-auto rounded-none px-3 py-1.5 text-sm ${mode === 'mechanism' ? 'bg-primary text-primary-foreground hover:bg-primary' : 'bg-card text-foreground hover:bg-muted'}`}
          >
            Mechanism
          </Button>
        </div>
        {meta.landscape && (
          <span className="ml-auto text-xs text-muted-foreground">
            Data: {meta.landscape.filename}
          </span>
        )}
      </div>

      {mode === 'mechanism' && (
        <>
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-[11px] uppercase tracking-wide text-muted-foreground">
                Classical
              </span>
              {CLASSICAL_MECHANISM_FAMILIES.map((m) => (
                <MechanismChip
                  key={m.family}
                  family={m.family}
                  active={m.family === selectedMechanism}
                  onSelect={pickMechanism}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="w-16 text-[11px] uppercase tracking-wide text-muted-foreground">
                PQC
              </span>
              {PQC_MECHANISM_FAMILIES.map((m) => (
                <MechanismChip
                  key={m.family}
                  family={m.family}
                  active={m.family === selectedMechanism}
                  onSelect={pickMechanism}
                />
              ))}
            </div>
          </div>

          {mechanismDef && (
            <div className="mb-4 rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{mechanismDef.family}</span>
                <span className="text-xs text-muted-foreground">
                  {mechanismDef.classical ? 'classical' : 'post-quantum'} ·{' '}
                  {mechanismDef.kinds.join(', ')} · {mechanismDef.registryMembers.length} parameter
                  set{mechanismDef.registryMembers.length === 1 ? '' : 's'}
                </span>
                {mechanismDef.cycloneDxFamilies.length > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    title={`CycloneDX ${CYCLONEDX_REGISTRY.specVersion} cryptography registry algorithmFamily (registry data ${CYCLONEDX_REGISTRY.verifiedAgainst})`}
                  >
                    CycloneDX: {mechanismDef.cycloneDxFamilies.join(', ')}
                  </span>
                ) : (
                  <span
                    className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    title="No entry in the CycloneDX 1.7 cryptography registry"
                  >
                    No CycloneDX registry entry
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Used in {mechanismHits.length} use case{mechanismHits.length === 1 ? '' : 's'}{' '}
                across {new Set(mechanismHits.map((u) => u.industry)).size} industries
                {standardsForMechanism.length > 0 &&
                  ` · referenced by ${standardsForMechanism.length} standard${standardsForMechanism.length === 1 ? '' : 's'}`}
                .
              </p>
              {standardsForMechanism.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Referenced by
                  </span>
                  {standardsForMechanism.map((s) => (
                    <StandardChip key={`${s.industry}-${s.standardId}`} std={s} />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-6">
            {industries
              .filter((ind) => mechanismHits.some((u) => u.industry === ind))
              .map((ind) => {
                const IndIcon = INDUSTRY_ICONS[ind] ?? Globe
                const hits = mechanismHits.filter((u) => u.industry === ind)
                const market = marketByIndustry.get(ind)
                return (
                  <div key={ind}>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => pickIndustry(ind)}
                      className="mb-2 flex h-auto min-w-0 flex-wrap items-center gap-2 whitespace-normal p-0 text-left hover:bg-transparent"
                      title={`Open ${ind} in industry view`}
                    >
                      <IndIcon size={18} className="text-primary" />
                      <span className="font-medium text-foreground hover:text-primary">{ind}</span>
                      {market && <MarketSizeBadge m={market} />}
                    </Button>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {hits.map((uc) => (
                        <UseCaseCard
                          key={uc.useCaseId}
                          uc={uc}
                          standards={standards}
                          onPickMechanism={pickMechanism}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
          </div>
        </>
      )}

      {mode === 'industry' && !selectedIndustry && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {industries.map((ind) => {
            const IndIcon = INDUSTRY_ICONS[ind] ?? Globe
            const market = marketByIndustry.get(ind)
            const count = useCasesByIndustry.get(ind)?.length ?? 0
            return (
              <Button
                key={ind}
                type="button"
                variant="ghost"
                onClick={() => pickIndustry(ind)}
                className="flex h-auto flex-col items-start gap-2 whitespace-normal rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/60 hover:bg-card"
                data-industry={ind}
              >
                <IndIcon size={22} className="text-primary" />
                <span className="text-sm font-medium leading-tight text-foreground">{ind}</span>
                <span className="text-xs text-muted-foreground">
                  {count} use case{count === 1 ? '' : 's'}
                </span>
                {market && <MarketSizeBadge m={market} />}
                <CyberOpportunityBadge industry={ind} />
              </Button>
            )
          })}
        </div>
      )}

      {mode === 'industry' && selectedIndustry && (
        <div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => pickIndustry(null)}
            className="mb-3 inline-flex h-auto items-center gap-1 p-0 text-sm text-muted-foreground hover:bg-transparent hover:text-primary"
          >
            <ArrowLeft size={14} /> All industries
          </Button>
          {(() => {
            const IndIcon = INDUSTRY_ICONS[selectedIndustry] ?? Globe
            const market = marketByIndustry.get(selectedIndustry)
            const cases = useCasesByIndustry.get(selectedIndustry) ?? []
            if (cases.length === 0) {
              return (
                <p className="text-sm text-muted-foreground">
                  No use cases recorded for “{selectedIndustry}”.{' '}
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto p-0 underline hover:bg-transparent hover:text-primary"
                    onClick={() => pickIndustry(null)}
                  >
                    Back to all industries.
                  </Button>
                </p>
              )
            }
            return (
              <>
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <IndIcon size={26} className="text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{selectedIndustry}</h3>
                  {market ? (
                    <MarketSizeBadge m={market} />
                  ) : (
                    <span
                      className="text-xs text-muted-foreground"
                      title="No official-statistics market size on record for this category"
                    >
                      No official market-size figure
                    </span>
                  )}
                  <CyberOpportunityBadge industry={selectedIndustry} />
                  <Link
                    to={`/threats?industry=${encodeURIComponent(selectedIndustry)}`}
                    className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                  >
                    <LandmarkIcon size={12} /> Quantum threats for this industry
                  </Link>
                </div>

                <IndustryCrossRefs
                  industry={selectedIndustry}
                  cases={cases}
                  standards={standards}
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {cases.map((uc) => (
                    <UseCaseCard
                      key={uc.useCaseId}
                      uc={uc}
                      standards={standards}
                      onPickMechanism={pickMechanism}
                    />
                  ))}
                </div>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
