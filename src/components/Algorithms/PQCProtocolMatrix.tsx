// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  PROTOCOL_MATRIX,
  PROTOCOL_MATRIX_LAST_UPDATED,
  TRANSPORT_ISSUES,
  DRAFT_STAGE_LEVEL,
  DRAFT_STAGE_SHORT,
  type DeploymentPosture,
  type DimensionStatusValue,
  type LiveDeployment,
  type TestabilityValue,
  type ProtocolMatrixRow,
  type DimensionStatus,
  type DimensionRef,
  type OssLibrary,
  type PlaygroundTool,
} from '../../data/pqcProtocolMatrix'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ProtocolDetailModal } from './ProtocolDetailModal'
import { libraryData } from '../../data/libraryData'

/* Build a Set of library reference_ids once at module load. Used to decide
 * whether a matrix doc reference should route to /library?ref=<id> (opens
 * the LibraryDetailPopover overview) or fall back to its direct source URL.
 *
 * Walks nested `children` so docs under a parent (e.g. RFC versions, draft
 * iterations) are reachable too. */
const LIBRARY_REF_IDS: Set<string> = (() => {
  const ids = new Set<string>()
  const walk = (items: typeof libraryData) => {
    for (const item of items) {
      ids.add(item.referenceId)
      if (item.children) walk(item.children)
    }
  }
  walk(libraryData)
  return ids
})()

/* Normalize a matrix doc id (e.g. `RFC-4253`, `draft-ietf-tls-mlkem-07`)
 * to the library's `reference_id` convention (e.g. `RFC 4253`, drafts
 * pass through unchanged). Only RFCs need the dash→space swap; other
 * identifier families already match. */
const toLibraryRefId = (matrixId: string): string =>
  matrixId.startsWith('RFC-') ? `RFC ${matrixId.slice(4)}` : matrixId

/* Decide the click target for a matrix doc reference. Always routes to the
 * library detail pane (`/library?ref=<refId>`) so the user sees a doc
 * overview before clicking through to the source URL inside the pane. If
 * a matrix ref's library entry is missing, this is a data gap — fix by
 * adding the doc to library CSV rather than silently leaking the source
 * URL into a new tab. Dev-only console warning surfaces the gap. */
const resolveDocHref = (matrixId: string): string => {
  const libRefId = toLibraryRefId(matrixId)
  if (!LIBRARY_REF_IDS.has(libRefId) && import.meta.env.DEV) {
    console.warn(
      `[PQCProtocolMatrix] doc ref "${matrixId}" (normalized "${libRefId}") not in library — add it to the library CSV`
    )
  }
  return `/library?ref=${encodeURIComponent(libRefId)}`
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

function rowMaturity(row: ProtocolMatrixRow): number {
  return (
    DIMENSION_MATURITY[row.dimensions.pureKem.value] +
    DIMENSION_MATURITY[row.dimensions.hybridKem.value] +
    DIMENSION_MATURITY[row.dimensions.pureSig.value] +
    DIMENSION_MATURITY[row.dimensions.hybridSig.value]
  )
}

function rowDimensionValues(row: ProtocolMatrixRow): DimensionStatusValue[] {
  return [
    row.dimensions.pureKem.value,
    row.dimensions.hybridKem.value,
    row.dimensions.pureSig.value,
    row.dimensions.hybridSig.value,
  ]
}

type ViewMode = 'heatmap' | 'detailed'

interface DimensionBadgeProps {
  status: DimensionStatus
  /** When true, drop the per-cell ref chips + stage caption — chip tooltip + modal carry them. */
  compact?: boolean
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
 */
function dimensionStageTone(status: DimensionStatus): string {
  if (!status.stage) return dimensionTone(status.value)
  const level = DRAFT_STAGE_LEVEL[status.stage]
  switch (level) {
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
  const titleText = [
    cellRef.id !== display ? cellRef.id : null,
    cellRef.title,
    cellRef.publishedOn ? `(${cellRef.publishedOn})` : null,
  ]
    .filter(Boolean)
    .join(' — ')
  if (cellRef.url) {
    return (
      <a
        href={cellRef.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex max-w-full items-center gap-1 truncate rounded border px-1.5 py-0 text-[10px] font-medium transition-colors ${tone}`}
        title={titleText || cellRef.id}
      >
        <FileText size={9} className="shrink-0" />
        <span className="truncate">{display}</span>
      </a>
    )
  }
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 truncate rounded border px-1.5 py-0 text-[10px] font-medium ${tone}`}
      title={titleText || cellRef.id}
    >
      <FileText size={9} className="shrink-0" />
      <span className="truncate">{display}</span>
    </span>
  )
}

function DimensionBadge({ status, compact = false }: DimensionBadgeProps) {
  const useStage = Boolean(status.stage)
  const toneClass = useStage ? dimensionStageTone(status) : dimensionTone(status.value)
  const stageLabel = status.stage ? DRAFT_STAGE_SHORT[status.stage] : null
  const stageLevel = status.stage ? DRAFT_STAGE_LEVEL[status.stage] : null
  // Build a comprehensive tooltip so compact mode loses nothing — hover gives
  // the stageNote, plain note, and ref IDs at a glance.
  const tooltipParts = [
    status.stageNote,
    status.note,
    status.refs && status.refs.length > 0
      ? `Refs: ${status.refs.map((r) => r.id).join(', ')}`
      : null,
  ].filter(Boolean) as string[]
  const tooltip = tooltipParts.length > 0 ? tooltipParts.join(' · ') : undefined
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-1">
        <span
          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${toneClass}`}
          title={tooltip}
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
      to={`/migrate?software=${encodeURIComponent(lib.productId)}`}
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
        to={`/playground/${primary.toolId}`}
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
              to={`/playground/${s.toolId}`}
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

/** Horizontal compact chip flow for the row-level Latest Release / Latest Draft
 *  columns in the detailed view. Strips draft prefix in the visible label, full
 *  ID + title + date in tooltip. Caps at 3 visible chips with a "+N more"
 *  affordance that links into the row's detail modal. */
function DocList({
  docs,
  label,
  onMore,
}: {
  docs: ProtocolMatrixRow['latestRelease']
  label: string
  onMore?: () => void
}) {
  if (docs.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <AlertTriangle size={12} /> None
      </span>
    )
  }
  const visible = docs.slice(0, 3)
  const hiddenCount = docs.length - visible.length
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((d) => {
        const display = shortRefLabel(d.id)
        const tooltip = [d.id !== display ? d.id : null, d.title, d.date]
          .filter(Boolean)
          .join(' — ')
        return (
          <a
            key={d.id}
            href={resolveDocHref(d.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 truncate rounded border border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
            title={`${label}: ${tooltip}`}
          >
            <FileText size={9} className="shrink-0" />
            <span className="truncate">{display}</span>
          </a>
        )
      })}
      {hiddenCount > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onMore}
          className="h-auto rounded border border-border bg-muted/30 px-1.5 py-0 text-[10px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          title={`${hiddenCount} more — click to open details`}
        >
          +{hiddenCount} more
        </Button>
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

export function PQCProtocolMatrix() {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap')
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState<DimensionStatusValue[]>([])
  const [availabilityFilter, setAvailabilityFilter] = useState<AvailabilityFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('matrix')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolMatrixRow | null>(null)
  const isHeatmap = viewMode === 'heatmap'

  const filteredRows = useMemo(() => {
    const search = searchText.trim().toLowerCase()
    const filtered = PROTOCOL_MATRIX.filter((row) => {
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
          return (rowMaturity(a) - rowMaturity(b)) * dir
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
  }, [searchText, statusFilter, availabilityFilter, sortKey, sortDirection])

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
  }

  return (
    <div className="space-y-6">
      {/* WIP banner */}
      <div className="flex items-start gap-3 rounded-lg border border-status-warning/40 bg-status-warning/10 p-3">
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-status-warning" />
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="rounded bg-status-warning text-background px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              WIP
            </span>
            <span className="font-semibold text-foreground">
              Protocol Support Matrix — work in progress
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Data and schema are still being validated against the underlying enrichment dataset (66
            docs enriched 2026-05-15) and the live playground tools. Dimension flags, constraints,
            and library back-links may change. Use as a reference, not a compliance artifact.
          </p>
        </div>
      </div>

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
              onClick={() => setViewMode('heatmap')}
              className="gap-1.5"
              aria-pressed={isHeatmap}
            >
              <LayoutGrid size={14} />
              Heatmap
            </Button>
            <Button
              variant={!isHeatmap ? 'gradient' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('detailed')}
              className="gap-1.5"
              aria-pressed={!isHeatmap}
            >
              <Table2 size={14} />
              Detailed
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px]">
          <span className="text-muted-foreground">IETF stage</span>
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
              title="5 — Submitted to IESG"
            >
              5
            </span>
            <span
              className="bg-status-success/15 px-1.5 py-0.5 text-status-success"
              title="6 — IETF Last Call / RFC Editor queue"
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
            onChange={(e) => setSearchText(e.target.value)}
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
          onMultiSelect={(ids) => setStatusFilter(ids as DimensionStatusValue[])}
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
          onSelect={(id) => setAvailabilityFilter(id as AvailabilityFilter)}
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
            onSelect={(id) => setSortKey(id as SortKey)}
            defaultLabel="Sort"
            size="sm"
            variant="ghost"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
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

        <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredRows.length}</span>
          <span className="mx-1">/</span>
          <span className="font-semibold text-foreground">{PROTOCOL_MATRIX.length}</span> rows
        </span>
      </div>

      {/* Main matrix table */}
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Protocol
              </th>
              {!isHeatmap && (
                <>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Latest Release
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Latest Draft
                  </th>
                </>
              )}
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
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Open Source
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Commercial
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
                <td
                  colSpan={isHeatmap ? 9 : 11}
                  className="px-3 py-8 text-center text-sm text-muted-foreground"
                >
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
              return (
                <tr
                  key={p.id}
                  className={`border-b border-border/50 align-top transition-colors ${
                    isInheritance ? 'bg-muted/10 hover:bg-muted/30' : 'hover:bg-muted/20'
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
                          onClick={() => setSelectedProtocol(p)}
                          className={`h-auto p-0 font-semibold text-left no-underline hover:underline focus-visible:underline ${
                            isInheritance ? 'italic text-muted-foreground' : 'text-foreground'
                          }`}
                          aria-label={`Open details for ${p.name}`}
                        >
                          {p.name}
                        </Button>
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
                      {!isHeatmap && (
                        <span className="text-[10px] leading-tight text-muted-foreground line-clamp-2">
                          {p.description}
                        </span>
                      )}
                    </div>
                  </td>
                  {!isHeatmap && (
                    <>
                      <td className="px-3 py-3">
                        <DocList
                          docs={p.latestRelease}
                          label="Release"
                          onMore={() => setSelectedProtocol(p)}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <DocList
                          docs={p.latestDraft}
                          label="Draft"
                          onMore={() => setSelectedProtocol(p)}
                        />
                      </td>
                    </>
                  )}
                  <td className="px-3 py-3">
                    <DimensionBadge status={p.dimensions.pureKem} compact={isHeatmap} />
                  </td>
                  <td className="px-3 py-3">
                    <DimensionBadge status={p.dimensions.hybridKem} compact={isHeatmap} />
                  </td>
                  <td className="px-3 py-3">
                    <DimensionBadge status={p.dimensions.pureSig} compact={isHeatmap} />
                  </td>
                  <td className="px-3 py-3">
                    <DimensionBadge status={p.dimensions.hybridSig} compact={isHeatmap} />
                  </td>
                  <td className="px-3 py-3">
                    {isHeatmap ? (
                      <AvailabilityBadge count={p.ossLibraries.length} tone="oss" />
                    ) : p.ossLibraries.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.ossLibraries.map((lib) => (
                          <LibraryChip key={lib.productId} lib={lib} tone="oss" />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    {isHeatmap ? (
                      <AvailabilityBadge count={p.commercialLibraries.length} tone="commercial" />
                    ) : p.commercialLibraries.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {p.commercialLibraries.map((lib) => (
                          <LibraryChip key={lib.productId} lib={lib} tone="commercial" />
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
        onClose={() => setSelectedProtocol(null)}
        protocol={selectedProtocol}
      />
    </div>
  )
}
