// SPDX-License-Identifier: GPL-3.0-only
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  PROTOCOL_MATRIX,
  PROTOCOL_MATRIX_LAST_UPDATED,
  TRANSPORT_ISSUES,
  DRAFT_STAGE_LEVEL,
  DRAFT_STAGE_SHORT,
  stageCollapseAt,
  granularityForPersona,
  type DeploymentPosture,
  type DimensionStatusValue,
  type LiveDeployment,
  type TestabilityValue,
  type ProtocolMatrixRow,
  type DimensionStatus,
  type DimensionRef,
  type OssLibrary,
  type PlaygroundTool,
  type PersonaStageGranularity,
} from '../../data/pqcProtocolMatrix'
import { usePersonaStore } from '../../store/usePersonaStore'
import { StageCollapseToggle } from './StageCollapseToggle'
import {
  ExternalLink,
  FlaskConical,
  AlertTriangle,
  FileText,
  LayoutGrid,
  Table2,
  Calendar,
  GitBranch,
  Rocket,
  Zap,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  Globe2,
  Star,
  ChevronRight,
  ArrowRight,
  History,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ProtocolDetailModal } from './ProtocolDetailModal'
import { WORKSHOP_TOOLS } from '@/components/Playground/workshopRegistry'
import { libraryHref } from './libraryRef'

// Resolve the canonical destination for a matrix PlaygroundTool cell.
// Priority: explicit per-cell `url` > registry `moduleLink` > playground fallback.
// Without this, every cell would hit `/playground/<toolId>`, which for several
// tools (e.g. pki-enrollment) is a minimal preview rather than the full workshop.
const WORKSHOP_TOOL_LINKS: Record<string, string> = Object.fromEntries(
  WORKSHOP_TOOLS.map((t) => [t.id, t.moduleLink])
)
function resolveToolLink(tool: PlaygroundTool): string {
  return tool.url ?? WORKSHOP_TOOL_LINKS[tool.toolId] ?? `/playground/${tool.toolId}`
}
type SortKey = 'matrix' | 'name' | 'maturity' | 'oss' | 'commercial' | 'deployments'
type SortDirection = 'asc' | 'desc'
type AvailabilityFilter =
  | 'all'
  | 'has-oss'
  | 'has-commercial'
  | 'has-playground'
  | 'has-deployment'
  | 'no-oss'
  | 'no-commercial'
  | 'no-deployment'

const DIMENSION_MATURITY: Record<DimensionStatusValue, number> = {
  rfc: 4,
  draft: 3,
  experimental: 2,
  none: 1,
  na: 0,
}

function rowDimensionValues(row: ProtocolMatrixRow): DimensionStatusValue[] {
  return [
    row.dimensions.pureKem.value,
    row.dimensions.hybridKem.value,
    row.dimensions.pureSig.value,
    row.dimensions.hybridSig.value,
  ]
}

function rowMaturity(row: ProtocolMatrixRow): number {
  return (
    DIMENSION_MATURITY[row.dimensions.pureKem.value] +
    DIMENSION_MATURITY[row.dimensions.hybridKem.value] +
    DIMENSION_MATURITY[row.dimensions.pureSig.value] +
    DIMENSION_MATURITY[row.dimensions.hybridSig.value]
  )
}

/** Max possible maturity score for this row — 4 points per dimension that
 *  actually applies (`na` dimensions don't count against the row). Prevents
 *  signature-only or KEM-only protocols (DNSSEC, Signal PQXDH, PKCS#11) from
 *  reading as structurally immature purely for having fewer applicable
 *  dimensions than a full 4-dimension protocol like TLS 1.3. */
function rowMaturityMax(row: ProtocolMatrixRow): number {
  return rowDimensionValues(row).filter((v) => v !== 'na').length * 4
}

/** Normalized 0..1 maturity ratio — 0 when no dimension applies at all. Use
 *  this (not the raw score) for sorting and percentage-bar width so rows with
 *  different applicable-dimension counts compare fairly. */
function rowMaturityRatio(row: ProtocolMatrixRow): number {
  const max = rowMaturityMax(row)
  return max === 0 ? 0 : rowMaturity(row) / max
}

type ViewMode = 'heatmap' | 'detailed'

interface DimensionBadgeProps {
  status: DimensionStatus
  /** When true, drop the per-cell ref chips + stage caption — chip tooltip + modal carry them. */
  compact?: boolean
  /** Transport-layer blocker names to surface in the compact tooltip (heatmap mode only). */
  blockerNames?: string[]
  /** Effective palette granularity — set at the table level from persona + any user override. */
  granularity?: PersonaStageGranularity
}

/** Short display label for a draft slug: drop the boilerplate prefix so the
 *  meaningful WG / topic stays visible in narrow heatmap cells. RFCs return
 *  unchanged. Exported for unit-test KATs. */
export function shortRefLabel(id: string): string {
  if (id.startsWith('draft-ietf-')) return id.slice('draft-ietf-'.length)
  if (id.startsWith('draft-')) return id.slice('draft-'.length)
  return id
}

function dimensionLabel(value: DimensionStatusValue): string {
  switch (value) {
    case 'rfc':
      return '✓ RFC'
    case 'draft':
      return '⊳ Draft'
    case 'experimental':
      return '⚠ Experimental'
    case 'none':
      return '✗ None'
    case 'na':
      return '— N/A'
  }
}

function dimensionTone(value: DimensionStatusValue): string {
  switch (value) {
    case 'rfc':
      return 'bg-status-success/15 text-status-success border-status-success/30'
    case 'draft':
      return 'bg-primary/15 text-primary border-primary/30'
    case 'experimental':
      return 'bg-status-warning/15 text-status-warning border-status-warning/30'
    case 'none':
      return 'bg-status-error/10 text-status-error border-status-error/30'
    case 'na':
      return 'bg-muted text-muted-foreground border-border'
  }
}

/**
 * Stage-aware graduated heatmap palette (0–7). When a DimensionStatus has a
 * `stage`, the matrix renders this finer gradient instead of the 5-bucket
 * coarse coloring. Uses semantic tokens only — no raw palette classes (see
 * CLAUDE.md UX rules).
 *
 * `granularity` collapses the 0..7 raw level into 2 / 3 / 8 tiers. Binary
 * personas (executive/ops/curious) only ever see tiers 0 and 7; ternary
 * (developer/architect) see {0, 1, 4, 7}; researcher / no-persona / explicit
 * "Full" override keeps the full graduated palette.
 */
function dimensionStageTone(status: DimensionStatus, granularity: PersonaStageGranularity): string {
  if (!status.stage) return dimensionTone(status.value)
  const tier = stageCollapseAt(status.stage, granularity)
  switch (tier) {
    case 0:
      return 'bg-muted text-muted-foreground border-border'
    case 1:
      return 'bg-status-error/15 text-status-error border-status-error/30'
    case 2:
      return 'bg-status-warning/10 text-status-warning border-status-warning/30'
    case 3:
      return 'bg-status-warning/20 text-status-warning border-status-warning/40'
    case 4:
      return 'bg-primary/10 text-primary border-primary/30'
    case 5:
      return 'bg-primary/20 text-primary border-primary/40'
    case 6:
      return 'bg-status-success/15 text-status-success border-status-success/30'
    case 7:
      return 'bg-status-success/30 text-status-success border-status-success/50'
    default:
      return dimensionTone(status.value)
  }
}

function deploymentPostureClass(posture: DeploymentPosture): string {
  switch (posture) {
    case 'production':
      return 'bg-status-success/20 text-status-success border-status-success/40'
    case 'pilot':
      return 'bg-status-warning/20 text-status-warning border-status-warning/40'
    case 'experimental':
      return 'bg-muted text-muted-foreground border-border'
  }
}

function deploymentPostureLabel(posture: DeploymentPosture): string {
  switch (posture) {
    case 'production':
      return 'Production'
    case 'pilot':
      return 'Pilot'
    case 'experimental':
      return 'Experimental'
  }
}

function DeploymentBadge({ status }: { status: DimensionStatus }) {
  if (!status.deploymentPosture) return null
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0 text-[10px] font-medium ${deploymentPostureClass(
        status.deploymentPosture
      )}`}
      title={
        status.deploymentNote ??
        `Deployment posture: ${deploymentPostureLabel(status.deploymentPosture)}`
      }
    >
      <Rocket size={9} />
      {deploymentPostureLabel(status.deploymentPosture)}
    </span>
  )
}

/** Compact chip for a per-cell RFC/draft reference. Single line; full id + title in tooltip.
 *  Draft slugs strip the `draft-`/`draft-ietf-` prefix in the visible label to keep cells narrow. */
function DimensionRefChip({ cellRef }: { cellRef: DimensionRef }) {
  const tone =
    cellRef.kind === 'rfc'
      ? 'bg-status-success/10 text-status-success border-status-success/30 hover:bg-status-success/20'
      : cellRef.kind === 'spec'
        ? 'bg-accent/10 text-accent border-accent/30 hover:bg-accent/20'
        : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
  const display = shortRefLabel(cellRef.id)
  const chipCls = `inline-flex max-w-full items-center gap-1 truncate rounded border px-1.5 py-0 text-[10px] font-medium transition-colors ${tone}`
  // Always link in-app to the Library; the external spec URL lives in the entry.
  return (
    <Link
      to={libraryHref(cellRef.id)}
      className={chipCls}
      title={`Open ${cellRef.id} in the Library`}
    >
      <FileText size={9} className="shrink-0" />
      <span className="truncate">{display}</span>
    </Link>
  )
}

function DimensionBadge({
  status,
  compact = false,
  blockerNames,
  granularity = 'full',
}: DimensionBadgeProps) {
  const useStage = Boolean(status.stage)
  const toneClass = useStage ? dimensionStageTone(status, granularity) : dimensionTone(status.value)
  const stageLabel = status.stage ? DRAFT_STAGE_SHORT[status.stage] : null
  const stageLevel = status.stage ? DRAFT_STAGE_LEVEL[status.stage] : null
  // Persona-collapsed tier — exposed via data-attr so E2E can assert palette
  // count without scraping Tailwind class strings (see plan §Risks #2).
  const stageTier = status.stage ? stageCollapseAt(status.stage, granularity) : null
  // Build a comprehensive tooltip so compact mode loses nothing — hover gives
  // the stageNote, plain note, ref IDs, and any transport-layer blockers at a glance.
  const tooltipParts = [
    status.stageNote,
    status.note,
    status.refs && status.refs.length > 0
      ? `Refs: ${status.refs.map((r) => r.id).join(', ')}`
      : null,
    blockerNames && blockerNames.length > 0
      ? `⚠ Blockers: ${blockerNames.slice(0, 2).join(', ')}`
      : null,
  ].filter(Boolean) as string[]
  const tooltip = tooltipParts.length > 0 ? tooltipParts.join(' · ') : undefined
  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${toneClass}`}
          title={tooltip}
          data-stage-tier={stageTier ?? undefined}
        >
          {stageLabel ? (
            <>
              <span className="font-semibold tabular-nums">{stageLevel}</span>
              <span className="opacity-50">·</span>
              <span>{stageLabel}</span>
            </>
          ) : (
            dimensionLabel(status.value)
          )}
        </span>
        <DeploymentBadge status={status} />
      </div>
      {!compact && status.refs && status.refs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {status.refs.map((r) => (
            <DimensionRefChip key={r.id} cellRef={r} />
          ))}
        </div>
      )}
      {!compact && status.stageNote && useStage && (
        <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
          {status.stageNote}
        </span>
      )}
    </div>
  )
}

function testabilityLabel(value: TestabilityValue): string {
  switch (value) {
    case 'full':
      return 'Full'
    case 'partial':
      return 'Partial'
    case 'none':
      return 'No'
    case 'na':
      return 'N/A'
  }
}

function testabilityTone(value: TestabilityValue): string {
  switch (value) {
    case 'full':
      return 'text-status-success'
    case 'partial':
      return 'text-status-warning'
    case 'none':
      return 'text-status-error'
    case 'na':
      return 'text-muted-foreground'
  }
}

function LibraryChip({ lib, tone }: { lib: OssLibrary; tone: 'oss' | 'commercial' }) {
  const toneClass =
    tone === 'oss'
      ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
      : 'bg-accent/10 text-accent border-accent/20 hover:bg-accent/20'
  return (
    <Link
      to={`/migrate?productIds=${encodeURIComponent(lib.productId)}`}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] transition-colors ${toneClass}`}
      title={lib.versionNote ? `${lib.name} — ${lib.versionNote}` : lib.name}
    >
      {lib.name}
    </Link>
  )
}

function TestabilityChip({
  label,
  value,
  note,
}: {
  label: string
  value: TestabilityValue
  note?: string
}) {
  return (
    <span title={note} className={note ? 'cursor-help' : undefined}>
      {label}:{' '}
      <span className={testabilityTone(value)}>
        {testabilityLabel(value)}
        {note ? <span className="ml-0.5 text-muted-foreground">ⓘ</span> : null}
      </span>
    </span>
  )
}

function PlaygroundCell({
  tools,
  compact = false,
}: {
  tools: PlaygroundTool[]
  compact?: boolean
}) {
  if (tools.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <AlertTriangle size={12} /> No tool
      </span>
    )
  }
  const [primary, ...secondary] = tools
  return (
    <div className="flex flex-col gap-1">
      <Link
        to={resolveToolLink(primary)}
        className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
      >
        <FlaskConical size={12} />
        {primary.toolName}
      </Link>
      {!compact && (
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] leading-tight">
          <TestabilityChip
            label="pKEM"
            value={primary.testability.pureKem}
            note={primary.pureKemNote}
          />
          <TestabilityChip
            label="hKEM"
            value={primary.testability.hybridKem}
            note={primary.hybridKemNote}
          />
          <TestabilityChip
            label="pSig"
            value={primary.testability.pureSig}
            note={primary.pureSigNote}
          />
          <TestabilityChip
            label="hSig"
            value={primary.testability.hybridSig}
            note={primary.hybridSigNote}
          />
        </div>
      )}
      {secondary.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {secondary.map((s) => (
            <Link
              key={s.toolId}
              to={resolveToolLink(s)}
              className="inline-flex items-center gap-1 rounded-md border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-[10px] text-accent transition-colors hover:bg-accent/15"
              title={s.toolName}
            >
              <FlaskConical size={10} />
              {s.toolName}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

function DeploymentCountBadge({
  deployments,
  noDeploymentReason,
}: {
  deployments: LiveDeployment[]
  noDeploymentReason?: string
}) {
  if (deployments.length === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-status-error/30 bg-status-error/10 px-2 py-0.5 text-xs font-medium text-status-error"
        title={noDeploymentReason ?? 'No known production deployment'}
      >
        ✗ No deployment
      </span>
    )
  }
  const toneClass =
    deployments.length >= 3
      ? 'border-status-success/30 bg-status-success/15 text-status-success'
      : 'border-status-warning/30 bg-status-warning/15 text-status-warning'
  const titleText = deployments.map((d) => `${d.provider} — ${d.what}`).join('\n')
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${toneClass}`}
      title={titleText}
    >
      <Globe2 size={11} />
      {deployments.length} live
    </span>
  )
}

function DeploymentChip({ deployment }: { deployment: LiveDeployment }) {
  return (
    <a
      href={deployment.referenceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-status-success/30 bg-status-success/10 px-1.5 py-0.5 text-[11px] text-status-success transition-colors hover:bg-status-success/20"
      title={`${deployment.what}${deployment.since ? ` (since ${deployment.since})` : ''} — opens reference`}
    >
      <Globe2 size={10} />
      {deployment.provider}
    </a>
  )
}

function AvailabilityBadge({ count, tone }: { count: number; tone: 'oss' | 'commercial' }) {
  const longLabel = tone === 'oss' ? 'open-source' : 'commercial'
  if (count === 0) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md border border-status-error/30 bg-status-error/10 px-2 py-0.5 text-xs font-medium text-status-error"
        title={`No ${longLabel} implementation chipped`}
      >
        ✗ 0
      </span>
    )
  }
  const toneClass =
    count >= 3
      ? 'border-status-success/30 bg-status-success/15 text-status-success'
      : 'border-status-warning/30 bg-status-warning/15 text-status-warning'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium tabular-nums ${toneClass}`}
      title={`${count} ${longLabel} implementation${count === 1 ? '' : 's'}`}
    >
      ✓ {count}
    </span>
  )
}

function getRowBlockerNames(protocolId: string): string[] {
  return TRANSPORT_ISSUES.filter((issue) => issue.affectedProtocolIds.includes(protocolId)).map(
    (issue) => issue.name
  )
}

const DIMENSION_CARD_LABELS: Array<{
  key: 'pureKem' | 'hybridKem' | 'pureSig' | 'hybridSig'
  label: string
}> = [
  { key: 'pureKem', label: 'Pure KEM' },
  { key: 'hybridKem', label: 'Hybrid KEM' },
  { key: 'pureSig', label: 'Pure Sig' },
  { key: 'hybridSig', label: 'Hybrid Sig' },
]

/** Small labelled section wrapper used inside an expanded protocol card. */
function CardSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}

/**
 * Detailed-mode protocol card (progressive disclosure). Collapsed: name +
 * recommended star + inheritance chip + OSS/commercial/live summary + a
 * maturity meter (score normalized over applicable dimensions only, so
 * signature-only/KEM-only protocols aren't penalized for `na` cells).
 * Always-visible 4-dimension status strip. On
 * expand: specifications, implementations, live deployments, playground links,
 * and any transport-layer blockers. Replaces the old 8-column-wide table row.
 */
function ProtocolCard({
  p,
  expanded,
  onToggle,
  onOpenDetail,
  granularity,
  parent,
}: {
  p: ProtocolMatrixRow
  expanded: boolean
  onToggle: () => void
  onOpenDetail: () => void
  granularity: PersonaStageGranularity
  parent?: ProtocolMatrixRow
}) {
  const oss = p.ossLibraries.length
  const com = p.commercialLibraries.length
  const live = p.liveDeployments?.length ?? 0
  const maturity = rowMaturity(p)
  const maturityMax = rowMaturityMax(p)
  const blockers = getRowBlockerNames(p.id)
  const specs = [...p.latestRelease, ...p.latestDraft]

  return (
    <div
      className={`glass-panel overflow-hidden transition-colors ${
        expanded ? 'border-primary/40' : ''
      } ${p.recommended ? 'ring-1 ring-inset ring-status-warning/20' : ''}`}
    >
      {/* Collapsed header */}
      <div className="flex items-center gap-2 p-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? `Collapse ${p.name}` : `Expand ${p.name}`}
          className="h-7 w-7 shrink-0 p-0"
        >
          <ChevronRight
            size={16}
            className={`text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </Button>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {parent && <GitBranch size={12} className="shrink-0 text-muted-foreground" />}
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onOpenDetail}
              className="h-auto p-0 text-left font-semibold text-foreground no-underline hover:underline"
              aria-label={`Open details for ${p.name}`}
            >
              {p.name}
            </Button>
            {p.recommended && (
              <span
                className="inline-flex items-center gap-0.5 rounded border border-status-warning/30 bg-status-warning/10 px-1 py-0 text-[9px] font-medium text-status-warning"
                title={p.recommendedReason ?? 'Recommended for production use'}
              >
                <Star size={8} />
                Rec
              </span>
            )}
            {parent && (
              <span className="inline-flex items-center gap-1 rounded-md border border-muted-foreground/30 bg-muted/30 px-1.5 py-0 text-[10px] text-muted-foreground">
                inherits {parent.name}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight text-muted-foreground line-clamp-1">
            {p.description}
          </span>
        </div>

        {/* Summary + maturity meter */}
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <span className="text-[10px] text-muted-foreground">
            {oss} OSS · {com} commercial · {live} live
          </span>
          <div
            className="flex items-center gap-1.5"
            title={
              maturityMax === 0
                ? 'No dimension applies to this protocol'
                : `Maturity ${maturity} / ${maturityMax} (of dimensions that apply)`
            }
          >
            <div className="h-1.5 w-20 rounded-full bg-border/60">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${maturityMax === 0 ? 0 : (maturity / maturityMax) * 100}%` }}
              />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {maturityMax === 0 ? 'N/A' : `${maturity}/${maturityMax}`}
            </span>
          </div>
        </div>
      </div>

      {/* Always-visible 4-dimension strip */}
      <div className="grid grid-cols-2 gap-2 border-t border-border/50 px-3 py-2 lg:grid-cols-4">
        {DIMENSION_CARD_LABELS.map(({ key, label }) => (
          <div key={key} className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <DimensionBadge status={p.dimensions[key]} granularity={granularity} />
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="space-y-3 border-t border-border/50 p-3">
          {specs.length > 0 && (
            <CardSection label="Specifications">
              {specs.map((d) => (
                <Link
                  key={d.id}
                  to={libraryHref(d.id)}
                  title={`Open ${d.id} in the Library`}
                  className="inline-flex items-center gap-1 rounded border border-border bg-muted/30 px-1.5 py-0.5 text-[10px] text-foreground hover:border-primary/50 hover:text-primary"
                >
                  <FileText size={10} />
                  {d.id}
                </Link>
              ))}
            </CardSection>
          )}

          {oss + com > 0 && (
            <CardSection label="Implementations">
              {p.ossLibraries.map((lib) => (
                <LibraryChip key={`oss-${lib.productId}`} lib={lib} tone="oss" />
              ))}
              {p.commercialLibraries.map((lib) => (
                <LibraryChip key={`com-${lib.productId}`} lib={lib} tone="commercial" />
              ))}
            </CardSection>
          )}

          {live > 0 && p.liveDeployments && (
            <CardSection label="Live deployments">
              {p.liveDeployments.map((d, idx) => (
                <DeploymentChip key={`${d.provider}-${idx}`} deployment={d} />
              ))}
            </CardSection>
          )}

          <CardSection label="Try it">
            <PlaygroundCell tools={p.playgrounds} />
          </CardSection>

          {blockers.length > 0 && (
            <div className="flex items-start gap-1.5 rounded-md border border-status-warning/30 bg-status-warning/5 px-2 py-1.5 text-[11px] text-status-warning">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>Transport-layer blockers: {blockers.join(', ')}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onOpenDetail}
              className="h-auto gap-1 p-0 text-xs text-primary"
            >
              Full details
              <ExternalLink size={11} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const RECOMMENDED_ROWS = PROTOCOL_MATRIX.filter((r) => r.recommended)
/** Deprecated migration-source rows (WS12) — hidden unless explicitly shown. */
const HISTORICAL_COUNT = PROTOCOL_MATRIX.filter((r) => r.historical).length

const VALID_STATUS_VALUES: DimensionStatusValue[] = ['rfc', 'draft', 'experimental', 'none', 'na']
const VALID_AVAILABILITY_FILTERS: AvailabilityFilter[] = [
  'all',
  'has-oss',
  'has-commercial',
  'has-playground',
  'has-deployment',
  'no-oss',
  'no-commercial',
  'no-deployment',
]
const VALID_SORT_KEYS: SortKey[] = [
  'matrix',
  'name',
  'maturity',
  'oss',
  'commercial',
  'deployments',
]

/** Serializes sort state to `?matrixSort=key:direction`; omitted at the default (matrix:asc). */
function matrixSortParam(key: SortKey, direction: SortDirection): string | null {
  if (key === 'matrix' && direction === 'asc') return null
  return `${key}:${direction}`
}

function parseMatrixSortParam(raw: string | null): { key: SortKey; direction: SortDirection } {
  const [rawKey, rawDir] = (raw ?? '').split(':')
  const key = VALID_SORT_KEYS.includes(rawKey as SortKey) ? (rawKey as SortKey) : 'matrix'
  const direction: SortDirection = rawDir === 'desc' ? 'desc' : 'asc'
  return { key, direction }
}

export function PQCProtocolMatrix() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const personaGranularity = granularityForPersona(selectedPersona)
  // User-side override; null means "follow persona default". Researcher / no
  // persona never sees the toggle so the override stays null for them.
  const [granularityOverride, setGranularityOverride] = useState<PersonaStageGranularity | null>(
    null
  )
  const effectiveGranularity: PersonaStageGranularity = granularityOverride ?? personaGranularity
  // View/filter/sort state below is seeded from — and mirrored back to — the
  // URL (?matrixView/matrixQ/matrixStatus/matrixAvailability/matrixSort) so a
  // deep link or a refresh reproduces the exact same table. Values are
  // validated against the known-good sets so a malformed/hallucinated link
  // degrades to the default instead of crashing.
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    searchParams.get('matrixView') === 'detailed' ? 'detailed' : 'heatmap'
  )
  const [searchText, setSearchText] = useState(() => searchParams.get('matrixQ') ?? '')
  const [statusFilter, setStatusFilter] = useState<DimensionStatusValue[]>(() => {
    const raw = searchParams.get('matrixStatus')
    if (!raw) return []
    return raw
      .split(',')
      .filter((s): s is DimensionStatusValue =>
        VALID_STATUS_VALUES.includes(s as DimensionStatusValue)
      )
  })
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>(() => {
    const raw = searchParams.get('matrixAvailability')
    return raw && VALID_AVAILABILITY_FILTERS.includes(raw as AvailabilityFilter)
      ? (raw as AvailabilityFilter)
      : 'all'
  })
  const [sortKey, setSortKey] = useState<SortKey>(
    () => parseMatrixSortParam(searchParams.get('matrixSort')).key
  )
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    () => parseMatrixSortParam(searchParams.get('matrixSort')).direction
  )
  const [showStageHelp, setShowStageHelp] = useState(false)
  // ?protocol=<id> preselects that row's detail modal (powers the
  // "Related: Protocol Matrix" breadcrumb from sandbox scenarios). Resolved
  // once via a lazy initializer so it needs no setState-in-effect.
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolMatrixRow | null>(() => {
    const p = searchParams.get('protocol')
    return p ? (PROTOCOL_MATRIX.find((r) => r.id === p) ?? null) : null
  })
  const firstRecommendedRef = useRef<HTMLTableRowElement | null>(null)
  // Single-open accordion for the detailed-mode protocol cards.
  const [expandedProtocolId, setExpandedProtocolId] = useState<string | null>(null)
  // WS12: deprecated migration-source rows, off by default. Not a URL param —
  // it is a view preference, not a shareable filter state.
  const [showHistorical, setShowHistorical] = useState(false)
  const isHeatmap = viewMode === 'heatmap'

  // Mirrors view/filter/sort changes to the URL in place (replace, not push —
  // these are filters, not "opening an item"; matches the house rule used
  // elsewhere on this page for family/fn/level/etc).
  const updateMatrixParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (sp) => {
          const next = new URLSearchParams(sp)
          for (const [key, value] of Object.entries(updates)) {
            if (value === null || value === '') next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true }
      )
    },
    [setSearchParams]
  )

  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode)
      updateMatrixParams({ matrixView: mode === 'heatmap' ? null : mode })
    },
    [updateMatrixParams]
  )

  const handleSearchTextChange = useCallback(
    (value: string) => {
      setSearchText(value)
      updateMatrixParams({ matrixQ: value || null })
    },
    [updateMatrixParams]
  )

  const handleStatusFilterChange = useCallback(
    (values: DimensionStatusValue[]) => {
      setStatusFilter(values)
      updateMatrixParams({ matrixStatus: values.length > 0 ? values.join(',') : null })
    },
    [updateMatrixParams]
  )

  const handleAvailabilityFilterChange = useCallback(
    (value: AvailabilityFilter) => {
      setAvailabilityFilter(value)
      updateMatrixParams({ matrixAvailability: value === 'all' ? null : value })
    },
    [updateMatrixParams]
  )

  const handleSortKeyChange = useCallback(
    (key: SortKey) => {
      setSortKey(key)
      updateMatrixParams({ matrixSort: matrixSortParam(key, sortDirection) })
    },
    [updateMatrixParams, sortDirection]
  )

  const handleToggleSortDirection = useCallback(() => {
    setSortDirection((prev) => {
      const next: SortDirection = prev === 'asc' ? 'desc' : 'asc'
      updateMatrixParams({ matrixSort: matrixSortParam(sortKey, next) })
      return next
    })
  }, [updateMatrixParams, sortKey])

  // Open/close the protocol detail and mirror it to ?protocol=<id> so a specific
  // protocol's detail is a shareable/bookmarkable deep link. Opening pushes a
  // history entry (Back closes the modal); closing strips the param in place.
  const openProtocol = useCallback(
    (row: ProtocolMatrixRow) => {
      setSelectedProtocol(row)
      setSearchParams(
        (sp) => {
          const params = new URLSearchParams(sp)
          params.set('protocol', row.id)
          return params
        },
        { replace: false }
      )
    },
    [setSearchParams]
  )
  const closeProtocol = useCallback(() => {
    setSelectedProtocol(null)
    setSearchParams(
      (sp) => {
        const params = new URLSearchParams(sp)
        params.delete('protocol')
        return params
      },
      { replace: true }
    )
  }, [setSearchParams])

  // Reconcile the open modal with ?protocol= on back/forward / external nav.
  const protocolParam = searchParams.get('protocol')
  useEffect(() => {
    const row = protocolParam ? (PROTOCOL_MATRIX.find((r) => r.id === protocolParam) ?? null) : null
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL→state sync
    setSelectedProtocol((prev) => (prev?.id === row?.id ? prev : row))
  }, [protocolParam])

  // ?highlight=recommended — scroll to first recommended row on mount
  const highlightRecommended = searchParams.get('highlight') === 'recommended'
  useEffect(() => {
    if (!highlightRecommended) return
    const frame = requestAnimationFrame(() => {
      firstRecommendedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => cancelAnimationFrame(frame)
  }, [highlightRecommended])

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    const filtered = PROTOCOL_MATRIX.filter((row) => {
      // Historical rows (WS12) are migration SOURCES — deprecated protocols
      // that will never gain a PQC dimension. Hidden by default: they are all
      // `na`, so leaving them in would turn a fifth of the readiness heatmap
      // grey and bury the rows that actually have a posture to compare.
      if (row.historical && !showHistorical) return false
      if (
        search &&
        !row.name.toLowerCase().includes(search) &&
        !row.description.toLowerCase().includes(search)
      ) {
        return false
      }
      if (statusFilter.length > 0) {
        const rowValues = rowDimensionValues(row)
        if (!statusFilter.some((s) => rowValues.includes(s))) return false
      }
      if (availabilityFilter === 'has-oss' && row.ossLibraries.length === 0) return false
      if (availabilityFilter === 'no-oss' && row.ossLibraries.length > 0) return false
      if (availabilityFilter === 'has-commercial' && row.commercialLibraries.length === 0)
        return false
      if (availabilityFilter === 'no-commercial' && row.commercialLibraries.length > 0) return false
      if (availabilityFilter === 'has-playground' && row.playgrounds.length === 0) return false
      if (availabilityFilter === 'has-deployment' && (row.liveDeployments?.length ?? 0) === 0)
        return false
      if (availabilityFilter === 'no-deployment' && (row.liveDeployments?.length ?? 0) > 0)
        return false
      return true
    })

    if (sortKey === 'matrix') return filtered

    const dir = sortDirection === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'maturity':
          return (rowMaturityRatio(a) - rowMaturityRatio(b)) * dir
        case 'oss':
          return (a.ossLibraries.length - b.ossLibraries.length) * dir
        case 'commercial':
          return (a.commercialLibraries.length - b.commercialLibraries.length) * dir
        case 'deployments':
          return ((a.liveDeployments?.length ?? 0) - (b.liveDeployments?.length ?? 0)) * dir
        default:
          return 0
      }
    })
  }, [searchText, statusFilter, availabilityFilter, sortKey, sortDirection, showHistorical])

  const hasActiveFilters =
    searchText.length > 0 ||
    statusFilter.length > 0 ||
    availabilityFilter !== 'all' ||
    sortKey !== 'matrix'

  const clearFilters = () => {
    setSearchText('')
    setStatusFilter([])
    setAvailabilityFilter('all')
    setSortKey('matrix')
    setSortDirection('asc')
    updateMatrixParams({
      matrixQ: null,
      matrixStatus: null,
      matrixAvailability: null,
      matrixSort: null,
    })
  }

  return (
    <div className="space-y-6">
      {/* Recommended for production — detailed view only */}
      {!isHeatmap && RECOMMENDED_ROWS.length > 0 && (
        <div className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Star size={15} className="text-status-warning shrink-0" />
            <h3 className="text-sm font-semibold text-foreground">
              Recommended for production use today
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {RECOMMENDED_ROWS.map((row) => (
              <div
                key={row.id}
                className="rounded-md border border-status-warning/25 bg-status-warning/5 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openProtocol(row)}
                    className="text-sm font-semibold text-foreground hover:underline text-left p-0 h-auto"
                  >
                    {row.name}
                  </Button>
                  <span className="inline-flex items-center gap-1 rounded border border-status-warning/30 bg-status-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-status-warning shrink-0">
                    <Star size={9} />
                    Recommended
                  </span>
                </div>
                {row.recommendedReason && (
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {row.recommendedReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Intro panel + view toggle */}
      <div className="glass-panel space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-lg font-semibold text-foreground">PQC Protocol Support Matrix</h3>
              <span
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground"
                title={`Snapshot date — last manual update to the matrix data file (${PROTOCOL_MATRIX_LAST_UPDATED})`}
              >
                <Calendar size={11} />
                Last updated {PROTOCOL_MATRIX_LAST_UPDATED}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {isHeatmap
                ? 'Heatmap view — standardization status (4 PQC dimensions) and availability of open-source and commercial implementations across protocol families.'
                : 'Detailed view — latest stable release, latest active draft, the 4 PQC dimensions, open-source and commercial implementations, and which dimensions our in-browser playground can exercise.'}
            </p>
          </div>
          <div className="inline-flex shrink-0 rounded-md border border-border bg-card p-0.5">
            <Button
              variant={isHeatmap ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('heatmap')}
              className="gap-1.5"
              aria-pressed={isHeatmap}
            >
              <LayoutGrid size={14} />
              Heatmap
            </Button>
            <Button
              variant={!isHeatmap ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('detailed')}
              className="gap-1.5"
              aria-pressed={!isHeatmap}
            >
              <Table2 size={14} />
              Detailed
            </Button>
          </div>
        </div>
        {personaGranularity !== 'full' && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
            <StageCollapseToggle
              persona={selectedPersona}
              value={effectiveGranularity}
              onChange={(next) => setGranularityOverride(next === personaGranularity ? null : next)}
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowStageHelp((v) => !v)}
            aria-expanded={showStageHelp}
            className="h-auto gap-1 px-1 py-0 text-[11px] font-normal text-muted-foreground hover:text-foreground"
            title="What do the IETF stages mean?"
          >
            IETF stage
            <span className="rounded-full border border-current px-1 text-[9px] font-bold leading-none">
              i
            </span>
          </Button>
          <div className="inline-flex overflow-hidden rounded-md border border-border text-[10px] tabular-nums">
            <span className="bg-muted px-1.5 py-0.5 text-muted-foreground" title="0 — no PQC track">
              0
            </span>
            <span
              className="bg-status-error/15 px-1.5 py-0.5 text-status-error"
              title="1 — problem identified, no WG draft"
            >
              1
            </span>
            <span
              className="bg-status-warning/10 px-1.5 py-0.5 text-status-warning"
              title="2 — experimental / non-IETF"
            >
              2
            </span>
            <span
              className="bg-status-warning/20 px-1.5 py-0.5 text-status-warning"
              title="3 — Individual Internet-Draft"
            >
              3
            </span>
            <span
              className="bg-primary/10 px-1.5 py-0.5 text-primary"
              title="4 — WG document / WG Last Call"
            >
              4
            </span>
            <span
              className="bg-primary/20 px-1.5 py-0.5 text-primary"
              title="5 — IETF Last Call (whole-IETF community review)"
            >
              5
            </span>
            <span
              className="bg-status-success/15 px-1.5 py-0.5 text-status-success"
              title="6 — IESG review (telechat) / approved · RFC Editor queue"
            >
              6
            </span>
            <span
              className="bg-status-success/30 px-1.5 py-0.5 text-status-success"
              title="7 — RFC published / final spec"
            >
              7
            </span>
          </div>
          <span className="text-muted-foreground">0 None → 7 RFC</span>
          <span className="ml-2 text-muted-foreground">Coarse fallback</span>
          <span className="rounded border border-status-success/30 bg-status-success/15 px-1.5 py-0.5 text-status-success">
            ✓ RFC
          </span>
          <span className="rounded border border-primary/30 bg-primary/15 px-1.5 py-0.5 text-primary">
            ⊳ Draft
          </span>
          <span className="rounded border border-status-warning/30 bg-status-warning/15 px-1.5 py-0.5 text-status-warning">
            ⚠ Exp
          </span>
          <span className="rounded border border-status-error/30 bg-status-error/10 px-1.5 py-0.5 text-status-error">
            ✗ None
          </span>
          <span className="rounded border border-border bg-muted px-1.5 py-0.5 text-muted-foreground">
            — N/A
          </span>
        </div>
        {showStageHelp && (
          <div className="mt-1 space-y-1.5 rounded-lg border border-border bg-card p-3 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground">
              How an IETF spec progresses — official order, earliest → latest
            </p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>
                <span className="text-foreground">Individual draft</span> — one author’s
                Internet-Draft <span className="tabular-nums">(stage 3)</span>.
              </li>
              <li>
                <span className="text-foreground">Working group adopts it</span> — the WG takes
                ownership <span className="tabular-nums">(stage 4)</span>.
              </li>
              <li>
                <span className="text-foreground">WG Last Call</span> — the WG agrees it looks done{' '}
                <span className="tabular-nums">(stage 4)</span>.
              </li>
              <li>
                <span className="text-foreground">IETF Last Call</span> — the whole IETF community
                gets ~2 weeks to object <span className="tabular-nums">(stage 5)</span>.
              </li>
              <li>
                <span className="text-foreground">IESG review</span> — the steering group / Area
                Directors vote, usually on a scheduled “telechat”{' '}
                <span className="tabular-nums">(stage 6)</span>.
              </li>
              <li>
                <span className="text-foreground">Approved → RFC Editor queue</span> — copyedit and
                final checks <span className="tabular-nums">(stage 6)</span>.
              </li>
              <li>
                <span className="text-foreground">Published as an RFC</span> — the final spec{' '}
                <span className="tabular-nums">(stage 7)</span>.
              </li>
            </ol>
            <p>
              The 0–7 colours track exactly this order (IESG review correctly outranks IETF Last
              Call). Non-IETF rows — OASIS PKCS#11 / KMIP, Signal, Sigstore — sit off this ladder
              and use the coarse RFC / Draft / Exp colours instead.
            </p>
          </div>
        )}
      </div>

      {/* Filter & sort toolbar — single row, no inline labels (dropdowns self-describe) */}
      <div className="glass-panel flex flex-wrap items-center gap-2 p-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="search"
            value={searchText}
            onChange={(e) => handleSearchTextChange(e.target.value)}
            placeholder="Search protocols…"
            className="pl-8 h-9"
            aria-label="Search protocols"
          />
        </div>

        <FilterDropdown
          items={[
            { id: 'rfc', label: '✓ RFC (published)' },
            { id: 'draft', label: '⊳ Draft' },
            { id: 'experimental', label: '⚠ Experimental' },
            { id: 'none', label: '✗ None' },
            { id: 'na', label: '— N/A' },
          ]}
          selectedId=""
          onSelect={() => undefined}
          multiSelectedIds={statusFilter}
          onMultiSelect={(ids) => handleStatusFilterChange(ids as DimensionStatusValue[])}
          defaultLabel="Status"
          size="sm"
        />

        <FilterDropdown
          items={[
            { id: 'all', label: 'All rows' },
            { id: 'has-oss', label: 'Has OSS' },
            { id: 'no-oss', label: 'No OSS' },
            { id: 'has-commercial', label: 'Has commercial' },
            { id: 'no-commercial', label: 'No commercial' },
            { id: 'has-playground', label: 'Has playground' },
            { id: 'has-deployment', label: 'Has live deployment' },
            { id: 'no-deployment', label: 'No live deployment' },
          ]}
          selectedId={availabilityFilter}
          onSelect={(id) => handleAvailabilityFilterChange(id as AvailabilityFilter)}
          defaultLabel="Filter"
          size="sm"
        />

        <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card">
          <FilterDropdown
            items={[
              { id: 'matrix', label: 'Matrix order' },
              { id: 'name', label: 'Name' },
              { id: 'maturity', label: 'Maturity score' },
              { id: 'oss', label: 'OSS count' },
              { id: 'commercial', label: 'Commercial count' },
              { id: 'deployments', label: 'Live deployments' },
            ]}
            selectedId={sortKey}
            onSelect={(id) => handleSortKeyChange(id as SortKey)}
            defaultLabel="Sort"
            size="sm"
            variant="ghost"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleToggleSortDirection}
            className="h-7 w-7"
            aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'} — click to reverse`}
            title={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          >
            {sortDirection === 'asc' ? (
              <ArrowUp size={12} className="text-primary" />
            ) : (
              <ArrowDown size={12} className="text-primary" />
            )}
          </Button>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 gap-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear all filters"
            title="Clear all filters"
          >
            <X size={12} />
            Clear
          </Button>
        )}

        {/* WS12: deprecated migration sources, off by default. They have no PQC
            dimension by definition, so showing them unasked would grey out a
            fifth of the readiness heatmap. */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHistorical((v) => !v)}
          className={`h-9 gap-1 ${showHistorical ? 'border-primary/40 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          aria-pressed={showHistorical}
          title={
            showHistorical
              ? 'Hide deprecated protocols (TLS 1.0/1.1, SSL 3.0, DTLS 1.0, IKEv1)'
              : `Show the ${HISTORICAL_COUNT} deprecated protocols kept as migration sources — each links to the PQC-capable protocol that replaces it`
          }
        >
          <History size={12} />
          {showHistorical ? 'Hide' : 'Show'} deprecated ({HISTORICAL_COUNT})
        </Button>

        <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredRows.length}</span>
          <span className="mx-1">/</span>
          <span className="font-semibold text-foreground">
            {showHistorical ? PROTOCOL_MATRIX.length : PROTOCOL_MATRIX.length - HISTORICAL_COUNT}
          </span>{' '}
          rows
        </span>
      </div>

      {/* Heatmap mode — compact protocol × dimension grid */}
      {isHeatmap && (
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Protocol
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pure KEM
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hybrid KEM
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pure Sig
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Hybrid Sig
                </th>
                <th
                  className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  title="Libraries — open-source (blue) and commercial (accent)"
                >
                  Libraries
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Live Deployments
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Playground
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                    No protocols match the current filters.{' '}
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={clearFilters}
                      className="h-auto p-0 text-primary"
                    >
                      Clear filters
                    </Button>
                  </td>
                </tr>
              )}
              {filteredRows.map((p) => {
                const parent = p.inheritsFromProtocolId
                  ? PROTOCOL_MATRIX.find((r) => r.id === p.inheritsFromProtocolId)
                  : undefined
                const isInheritance = Boolean(parent)
                const successor = p.supersededByProtocolId
                  ? PROTOCOL_MATRIX.find((r) => r.id === p.supersededByProtocolId)
                  : undefined
                const rowBlockerNames = isHeatmap ? getRowBlockerNames(p.id) : []
                const isRecommended = Boolean(p.recommended)
                const isFirstRecommended =
                  isRecommended && RECOMMENDED_ROWS.findIndex((r) => r.id === p.id) === 0
                return (
                  <tr
                    key={p.id}
                    ref={isFirstRecommended ? firstRecommendedRef : undefined}
                    className={`border-b border-border/50 align-top transition-colors ${
                      isRecommended && highlightRecommended
                        ? 'bg-status-warning/5 ring-1 ring-inset ring-status-warning/20'
                        : isInheritance
                          ? 'bg-muted/10 hover:bg-muted/30'
                          : 'hover:bg-muted/20'
                    }`}
                  >
                    <td className="sticky left-0 z-10 bg-card px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          {isInheritance && (
                            <GitBranch size={12} className="shrink-0 text-muted-foreground" />
                          )}
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => openProtocol(p)}
                            className={`h-auto p-0 font-semibold text-left no-underline hover:underline focus-visible:underline ${
                              isInheritance ? 'italic text-muted-foreground' : 'text-foreground'
                            }`}
                            aria-label={`Open details for ${p.name}`}
                          >
                            {p.name}
                          </Button>
                          {isRecommended && (
                            <span
                              className="inline-flex items-center gap-0.5 rounded border border-status-warning/30 bg-status-warning/10 px-1 py-0 text-[9px] font-medium text-status-warning shrink-0"
                              title={p.recommendedReason ?? 'Recommended for production use'}
                            >
                              <Star size={8} />
                              Rec
                            </span>
                          )}
                        </div>
                        {isInheritance && parent && (
                          <span className="text-[10px] leading-tight text-muted-foreground">
                            inherits from{' '}
                            <span className="font-medium text-foreground">{parent.name}</span>
                          </span>
                        )}
                        {!isInheritance && p.inheritedBy && p.inheritedBy.length > 0 && (
                          <span
                            className="inline-flex w-fit items-center gap-1 rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0 text-[10px] text-accent"
                            title={`Same PQC posture also covers: ${p.inheritedBy.join(', ')}`}
                          >
                            <GitBranch size={9} />
                            inherits: {p.inheritedBy.join(', ')}
                          </span>
                        )}
                        {/* WS12: the dead end and its way out. Without this a row
                            of four `na` cells reads as "not applicable" rather
                            than "no PQC path exists — go here instead". */}
                        {successor && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProtocol(successor)}
                            className="inline-flex h-auto w-fit items-center gap-1 rounded-md border border-status-warning/40 bg-status-warning/10 px-1.5 py-0 text-[10px] font-medium text-status-warning hover:bg-status-warning/20 hover:text-status-warning"
                            title={`${p.name} has no post-quantum path of its own. ${successor.name} is where the migration goes — open it.`}
                          >
                            <ArrowRight size={9} />
                            no PQC path → {successor.name}
                          </Button>
                        )}
                        {p.supersedes && p.supersedes.length > 0 && (
                          <span
                            className="w-fit text-[10px] leading-tight text-muted-foreground"
                            title={`This protocol is the post-quantum migration target for: ${p.supersedes
                              .map((id) => PROTOCOL_MATRIX.find((r) => r.id === id)?.name ?? id)
                              .join(', ')}`}
                          >
                            replaces{' '}
                            {p.supersedes
                              .map((id) => PROTOCOL_MATRIX.find((r) => r.id === id)?.name ?? id)
                              .join(', ')}
                          </span>
                        )}
                        {!isHeatmap && (
                          <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                            {p.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-3 align-top w-[180px] max-w-[180px]">
                      <DimensionBadge
                        status={p.dimensions.pureKem}
                        compact={isHeatmap}
                        blockerNames={rowBlockerNames}
                        granularity={effectiveGranularity}
                      />
                    </td>
                    <td className="px-2 py-3 align-top w-[180px] max-w-[180px]">
                      <DimensionBadge
                        status={p.dimensions.hybridKem}
                        compact={isHeatmap}
                        blockerNames={rowBlockerNames}
                        granularity={effectiveGranularity}
                      />
                    </td>
                    <td className="px-2 py-3 align-top w-[180px] max-w-[180px]">
                      <DimensionBadge
                        status={p.dimensions.pureSig}
                        compact={isHeatmap}
                        blockerNames={rowBlockerNames}
                        granularity={effectiveGranularity}
                      />
                    </td>
                    <td className="px-2 py-3 align-top w-[180px] max-w-[180px]">
                      <DimensionBadge
                        status={p.dimensions.hybridSig}
                        compact={isHeatmap}
                        blockerNames={rowBlockerNames}
                        granularity={effectiveGranularity}
                      />
                    </td>
                    <td className="px-3 py-3">
                      {isHeatmap ? (
                        <div className="flex flex-wrap gap-1">
                          <AvailabilityBadge count={p.ossLibraries.length} tone="oss" />
                          <AvailabilityBadge
                            count={p.commercialLibraries.length}
                            tone="commercial"
                          />
                        </div>
                      ) : p.ossLibraries.length === 0 && p.commercialLibraries.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.ossLibraries.map((lib) => (
                            <LibraryChip key={`oss-${lib.productId}`} lib={lib} tone="oss" />
                          ))}
                          {p.commercialLibraries.map((lib) => (
                            <LibraryChip key={`com-${lib.productId}`} lib={lib} tone="commercial" />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {isHeatmap ? (
                        <DeploymentCountBadge
                          deployments={p.liveDeployments ?? []}
                          noDeploymentReason={p.noDeploymentReason}
                        />
                      ) : !p.liveDeployments || p.liveDeployments.length === 0 ? (
                        <span
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground"
                          title="No known production deployment"
                        >
                          <Globe2 size={11} className="opacity-50" /> None
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {p.liveDeployments.map((d, idx) => (
                            <DeploymentChip key={`${d.provider}-${idx}`} deployment={d} />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <PlaygroundCell tools={p.playgrounds} compact={isHeatmap} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detailed mode — expandable card per protocol */}
      {!isHeatmap && (
        <div className="space-y-2">
          {filteredRows.length === 0 ? (
            <div className="glass-panel px-3 py-8 text-center text-sm text-muted-foreground">
              No protocols match the current filters.{' '}
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={clearFilters}
                className="h-auto p-0 text-primary"
              >
                Clear filters
              </Button>
            </div>
          ) : (
            filteredRows.map((p) => (
              <ProtocolCard
                key={p.id}
                p={p}
                expanded={expandedProtocolId === p.id}
                onToggle={() => setExpandedProtocolId((cur) => (cur === p.id ? null : p.id))}
                onOpenDetail={() => openProtocol(p)}
                granularity={effectiveGranularity}
                parent={
                  p.inheritsFromProtocolId
                    ? PROTOCOL_MATRIX.find((r) => r.id === p.inheritsFromProtocolId)
                    : undefined
                }
              />
            ))
          )}
        </div>
      )}

      {/* Transport-layer blockers panel (detailed view only) */}
      {!isHeatmap && TRANSPORT_ISSUES.length > 0 && (
        <div className="glass-panel space-y-3 p-4">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Zap size={18} className="text-status-warning" />
              Transport-Layer Blockers ({TRANSPORT_ISSUES.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Cross-cutting issues that affect PQC handshake performance
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {TRANSPORT_ISSUES.map((issue) => {
              const affected = issue.affectedProtocolIds
                .map((pid) => PROTOCOL_MATRIX.find((p) => p.id === pid)?.name ?? pid)
                .join(', ')
              return (
                <div
                  key={issue.id}
                  className="rounded-md border border-status-warning/30 bg-status-warning/5 p-3"
                >
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">{issue.name}</span>
                    {issue.referenceUrl && (
                      <a
                        href={issue.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-primary hover:text-primary/80"
                        title="Authoritative reference"
                      >
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">{issue.description}</p>
                  <div className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">Affects:</span> {affected}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Protocol detail modal */}
      <ProtocolDetailModal
        isOpen={selectedProtocol !== null}
        onClose={closeProtocol}
        protocol={selectedProtocol}
      />
    </div>
  )
}
