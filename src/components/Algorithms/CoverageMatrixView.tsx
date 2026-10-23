// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable jsx-a11y/no-noninteractive-tabindex -- wide evidence tables use named, keyboard-focusable scroll viewports */
/**
 * CoverageMatrixView — the public capability coverage matrix and open-gaps
 * register (plan WS-C C-6, J-7; decision Q7: public on the Hub).
 *
 * Renders public/data/validation/coverage-matrix.json — the same generated
 * file the Markdown/HTML exports and the coverage-diff gate come from — so no
 * number on this page is hand-maintained. Fetched at runtime (public/data is
 * not precached), mounted lazily from the /algorithms Validation tab.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  Grid3x3,
} from 'lucide-react'
import clsx from 'clsx'
import { Link, useInRouterContext } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ValidationDisclaimer } from '@/components/shared/ValidationDisclaimer'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import {
  ENGINES,
  ENGINE_LABEL,
  DIMENSIONS,
  DIMENSION_LABEL,
  GAP_STATUSES,
  MATRIX_STATUSES,
  POLARITIES,
  expandMatrix,
  type CoverageMatrix,
  type CoverageMatrixFile,
  type EngineId,
  type GapStatus,
  type MatrixStatus,
  type OpenGap,
  type Polarity,
} from '@/data/validation/coverageModel'
import {
  groupByMechanismOperation,
  groupMatchesStatus,
  type CoverageGroup,
} from '@/data/validation/coverageExport'
import { gapSummary, plainGapView, plainRuleText } from './gapPlainText'
import { usePersonaStore } from '@/store/usePersonaStore'

const dataUrl = (file: string) =>
  `${(import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')}/data/validation/${file}`

export const loadCoverageMatrix = async (): Promise<CoverageMatrixFile> => {
  const resp = await fetch(dataUrl('coverage-matrix.json'))
  if (!resp.ok) throw new Error(`coverage-matrix.json fetch failed: ${resp.status}`)
  return (await resp.json()) as CoverageMatrixFile
}

const POLARITY_LABEL: Record<Polarity, string> = {
  positive: 'Positive',
  negative: 'Negative',
  boundary: 'Boundary',
  'state-error': 'State / error',
}

const STATUS_TONE: Record<MatrixStatus, string> = {
  'acvts-issued': 'border-primary/30 bg-primary/10 text-primary',
  'nist-reference': 'border-primary/30 bg-primary/10 text-primary',
  'standard-kat': 'border-status-info/30 bg-status-info/10 text-status-info',
  oracle: 'border-status-info/30 bg-status-info/10 text-status-info',
  differential: 'border-border bg-muted/40 text-foreground',
  'round-trip': 'border-border bg-muted/40 text-foreground',
  'behavior-only': 'border-status-warning/30 bg-status-warning/10 text-status-warning',
  untested: 'border-status-error/30 bg-status-error/10 text-status-error',
  unsupported: 'border-border bg-muted/20 text-muted-foreground',
}

const StatusBadge = ({ status }: { status: MatrixStatus }) => (
  <span
    data-status={status}
    className={clsx(
      'inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium',
      STATUS_TONE[status] // eslint-disable-line security/detect-object-injection
    )}
  >
    {status}
  </span>
)

const PAGE = 60

type GapView = 'overview' | 'evidence'

const gapStatusMeta = (status: GapStatus) => {
  switch (status) {
    case 'open':
      return {
        label: 'Open',
        tone: 'border-status-warning/40 bg-status-warning/10 text-status-warning',
        why: 'Evidence or support is incomplete. Do not interpret an untested or unreachable capability as working.',
        takeaway: 'A missing test is a limit on the claim, not evidence of a pass.',
      }
    case 'in-progress':
      return {
        label: 'In progress',
        tone: 'border-status-info/40 bg-status-info/10 text-status-info',
        why: 'Work is underway, but the current evidence boundary still applies until new results are reviewed.',
        takeaway: 'Planned remediation does not change the result already measured.',
      }
    case 'accepted-limitation':
      return {
        label: 'Accepted limitation',
        tone: 'border-border bg-muted/50 text-muted-foreground',
        why: 'The boundary is understood and intentionally retained. Any capability claim must exclude this scope.',
        takeaway:
          'A documented limitation narrows a claim; it does not become a supported capability.',
      }
  }
}

const gapEvidenceParagraphs = (detail: string) =>
  detail.split(
    /\s+(?=(?:UPDATE \d{4}-\d{2}-\d{2}|WHY OUR EVIDENCE|THE LESSON|CONSEQUENCE|Remedy:))/
  )

const DEFAULT_ENGINE: EngineId = 'cpp'
const toEngine = (v: string | null | undefined): EngineId =>
  (ENGINES as readonly string[]).includes(v ?? '') ? (v as EngineId) : DEFAULT_ENGINE

const DEFAULT_POLARITY: Polarity = 'positive'
/** `?polarity=` → a known polarity; anything else falls back to the default. */
const toPolarity = (v: string | null | undefined): Polarity =>
  (POLARITIES as readonly string[]).includes(v ?? '') ? (v as Polarity) : DEFAULT_POLARITY

/**
 * `?case=` → the (mechanism × operation) groups it names. The full group key
 * `<mechanism>|<operation>` (e.g. `CKM_ML_KEM|encapsulate`) names one row; a
 * bare mechanism names every operation row of it. Case-insensitive.
 */
export function coverageGroupsForCase(groups: CoverageGroup[], raw: string | null | undefined) {
  const q = raw?.trim().toLowerCase()
  if (!q) return []
  const exact = groups.filter((g) => g.key.toLowerCase() === q)
  if (exact.length > 0) return exact
  return groups.filter((g) => (g.mechanism ?? '').toLowerCase() === q)
}

interface CoverageMatrixViewProps {
  /** Injected in tests; defaults to fetching the public JSON. */
  loader?: () => Promise<CoverageMatrixFile>
  /** `?engine=` (cpp | rust) and `?case=` (group key or mechanism) from the URL. */
  engineParam?: string | null
  caseParam?: string | null
  /** `?polarity=` (positive | negative | boundary | state-error); default omitted. */
  polarityParam?: string | null
  /** URL writer (replace). Omitted → engine/expansion stay local state. */
  onUpdateParams?: (updates: Record<string, string | null>) => void
}

export function CoverageMatrixView({
  loader = loadCoverageMatrix,
  engineParam,
  caseParam,
  polarityParam,
  onUpdateParams,
}: CoverageMatrixViewProps = {}) {
  // Unit tests and embeds render this view outside a router: fall back to a plain link.
  const inRouter = useInRouterContext()
  const [matrix, setMatrix] = useState<CoverageMatrix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [engine, setEngine] = useState<EngineId>(() => toEngine(engineParam))
  const [polarity, setPolarity] = useState<Polarity>(() => toPolarity(polarityParam))
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [showAllGaps, setShowAllGaps] = useState(false)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const [gapView, setGapView] = useState<GapView>(() =>
    selectedPersona === 'cert-engineer' ? 'evidence' : 'overview'
  )
  const [gapQuery, setGapQuery] = useState('')
  const [gapStatus, setGapStatus] = useState<GapStatus | 'all'>('all')
  const [expandedGapDetails, setExpandedGapDetails] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setGapView(selectedPersona === 'cert-engineer' ? 'evidence' : 'overview')
  }, [selectedPersona])

  const fetchMatrix = useCallback(
    () =>
      loader()
        .then((f) => setMatrix(expandMatrix(f)))
        .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e))),
    [loader]
  )

  useEffect(() => {
    void fetchMatrix()
  }, [fetchMatrix])

  const retry = () => {
    setError(null)
    void fetchMatrix()
  }

  const groups = useMemo(() => (matrix ? groupByMechanismOperation(matrix) : []), [matrix])

  // ?engine: re-read on same-route navigation.
  useEffect(() => {
    setEngine(toEngine(engineParam))
  }, [engineParam])

  // ?polarity: re-read on same-route navigation.
  useEffect(() => {
    setPolarity(toPolarity(polarityParam))
  }, [polarityParam])

  // ?case: expand the named row(s) once the matrix is in, page far enough to
  // show them, and scroll to the first. A key that names no row says so.
  const caseGroups = useMemo(() => coverageGroupsForCase(groups, caseParam), [groups, caseParam])
  const caseKeys = caseGroups.map((g) => g.key).join('\n')
  useEffect(() => {
    if (!caseKeys) return
    const keys = caseKeys.split('\n')

    setExpanded((prev) => new Set([...prev, ...keys]))
    const lastIndex = Math.max(...keys.map((k) => groups.findIndex((g) => g.key === k)))
    setLimit((l) => Math.max(l, Math.ceil((lastIndex + 1) / PAGE) * PAGE))
  }, [caseKeys, groups])
  const caseTarget = caseGroups[0] ? `coverage-${caseGroups[0].key}` : null
  useScrollToDeepLinkTarget(caseTarget, caseTarget ? deepLinkSelector(caseTarget) : null)
  const caseNotFound = !!matrix && !!caseParam && caseGroups.length === 0

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups.filter((g) => {
      if (!groupMatchesStatus(g, engine, polarity, statusFilter as MatrixStatus | 'all'))
        return false
      if (!q) return true
      return (
        (g.mechanism ?? '').toLowerCase().includes(q) ||
        g.algorithm.toLowerCase().includes(q) ||
        g.operation.toLowerCase().includes(q)
      )
    })
  }, [groups, engine, polarity, statusFilter, query])

  if (error) return <ErrorAlert message={error} onRetry={retry} />
  if (!matrix) {
    return (
      <div className="space-y-3" aria-busy="true">
        <ValidationDisclaimer />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const toggle = (key: string) => {
    const opening = !expanded.has(key)
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    // ?case follows the row last expanded; collapsing a linked row clears it.
    if (opening) onUpdateParams?.({ case: key })
    else if (caseGroups.some((g) => g.key === key)) onUpdateParams?.({ case: null })
  }

  const baseGaps = showAllGaps
    ? matrix.openGaps
    : matrix.openGaps.filter((g) => g.origin === 'curated' || !g.id.startsWith('untested:'))
  const gaps = baseGaps.filter((gap) => {
    if (gapStatus !== 'all' && gap.status !== gapStatus) return false
    const q = gapQuery.trim().toLowerCase()
    if (!q) return true
    const fields = [gap.title, gap.detail, gap.scope]
    if (gapView === 'evidence') fields.push(gap.owner, gap.planItem ?? '')
    return fields.some((value) => value.toLowerCase().includes(q))
  })
  const hiddenGaps = matrix.openGaps.length - baseGaps.length

  const toggleGapDetails = (id: string) => {
    setExpandedGapDetails((previous) => {
      const next = new Set(previous)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="min-w-0 max-w-full space-y-4" data-testid="coverage-matrix-view">
      <ValidationDisclaimer />
      {caseNotFound && (
        <DeepLinkNotice
          kind="not-found"
          message={`No coverage row matches "${caseParam}".`}
          onDismiss={() => onUpdateParams?.({ case: null })}
        />
      )}

      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Grid3x3 size={16} className="text-primary" aria-hidden="true" />
          Capability coverage matrix
        </h3>
        <p className="text-xs text-muted-foreground">
          Every capability each PQC Today PKCS#11 engine advertises at runtime, joined to this
          project&apos;s registered tests that exercise it. A status names the strongest kind of
          registered evidence; it is not a pass, general algorithm coverage, or evidence about
          another product. Recorded run results are shown separately. Exports:{' '}
          {(['html', 'md', 'json'] as const).map((ext, i) => (
            <span key={ext}>
              {i > 0 && ' · '}
              <a
                href={dataUrl(`coverage-matrix.${ext}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2"
              >
                {ext.toUpperCase()}
                <ExternalLink size={10} aria-hidden="true" />
              </a>
            </span>
          ))}
        </p>
        <p className="text-xs text-muted-foreground" data-testid="coverage-lab-comparison">
          <span className="font-medium text-foreground">How this compares to a lab.</span> An ACVP
          registration declares the capabilities of an implementation, and NIST&apos;s test service
          generates test vectors to match them. This matrix keeps the same capability-by-capability
          accounting for PQC Today&apos;s engines, but against this project&apos;s own registered
          tests, so it is not a CAVP result.{' '}
          {inRouter ? (
            <Link
              to="/learn/acvp-lab-workflow"
              className="text-primary underline underline-offset-2"
            >
              The ACVP Lab Workflow module
            </Link>
          ) : (
            <a
              href="/learn/acvp-lab-workflow"
              className="text-primary underline underline-offset-2"
            >
              The ACVP Lab Workflow module
            </a>
          )}{' '}
          walks through the real process.
        </p>
      </div>

      {/* Totals — numerator / denominator per engine and polarity */}
      <div className="grid min-w-0 max-w-full gap-3 md:grid-cols-2">
        {ENGINES.map((e) => {
          const t = matrix.totals.byEngine[e] // eslint-disable-line security/detect-object-injection
          const id = matrix.engines[e] // eslint-disable-line security/detect-object-injection
          return (
            <section
              key={e}
              className="glass-panel min-w-0 max-w-full p-3"
              aria-label={`${ENGINE_LABEL[e]} totals`}
            >
              <h4 className="text-sm font-semibold text-foreground">
                {ENGINE_LABEL[e] /* eslint-disable-line security/detect-object-injection */} engine
              </h4>
              <p className="text-xs text-muted-foreground">
                {id.mechanismCount} mechanisms · {t.advertisedCells} advertised capability cells
                (denominator) · {t.unsupportedCells} unsupported cells shown separately
              </p>
              <div
                className="mt-2 w-full min-w-0 max-w-full overflow-x-auto"
                role="region"
                aria-label={`${ENGINE_LABEL[e]} coverage totals; scroll horizontally for all columns`}
                tabIndex={0}
              >
                <table className="w-full text-xs">
                  <caption className="sr-only">
                    {
                      `${ENGINE_LABEL[e]}: covered, sampled and untested cells per polarity out of ${t.advertisedCells}` /* eslint-disable-line security/detect-object-injection */
                    }
                  </caption>
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th scope="col" className="py-1 pr-2 font-medium">
                        Polarity
                      </th>
                      <th scope="col" className="py-1 pr-2 font-medium">
                        Covered
                      </th>
                      <th scope="col" className="py-1 pr-2 font-medium">
                        Sampled
                      </th>
                      <th scope="col" className="py-1 font-medium">
                        Untested
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {POLARITIES.map((p) => {
                      const b = t.byPolarity[p] // eslint-disable-line security/detect-object-injection
                      return (
                        <tr key={p} className="border-t border-border">
                          <th scope="row" className="py-1 pr-2 font-normal text-foreground">
                            {POLARITY_LABEL[p]}
                          </th>
                          <td className="py-1 pr-2 text-foreground">
                            {b.covered} / {t.advertisedCells}
                          </td>
                          <td className="py-1 pr-2 text-foreground">
                            {b.sampled} / {t.advertisedCells}
                          </td>
                          <td className="py-1 text-foreground">
                            {b.untested} / {t.advertisedCells}
                          </td>
                        </tr>
                      )
                    })}
                    {DIMENSIONS.map((d) => {
                      const b = t.byDimension?.[d] // eslint-disable-line security/detect-object-injection
                      if (!b) return null
                      return (
                        <tr key={d} className="border-t border-border">
                          <th scope="row" className="py-1 pr-2 font-normal text-foreground">
                            {DIMENSION_LABEL[d]}
                          </th>
                          <td className="py-1 pr-2 text-foreground">
                            {b.covered} / {t.advertisedCells}
                          </td>
                          <td className="py-1 pr-2 text-foreground">
                            {b.sampled} / {t.advertisedCells}
                          </td>
                          <td className="py-1 text-foreground">
                            {b.untested} / {t.advertisedCells}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">
                WebAssembly: {t.byArtifact.wasm.passedCells} cells with a recorded pass,{' '}
                {t.byArtifact.wasm.failedCells} with a recorded fail,{' '}
                {t.byArtifact.wasm.skippedCells ?? 0} with a recorded skip (not run — never a pass)
                · native: not run · hardware: not run
              </p>
            </section>
          )
        })}
      </div>

      {/* Definitions — always visible */}
      <section className="glass-panel p-3" aria-label="Definitions">
        <h4 className="text-sm font-semibold text-foreground">How these numbers are computed</h4>
        <dl className="mt-1 space-y-1.5 text-xs">
          <div>
            <dt className="font-medium text-foreground">Denominator</dt>
            <dd className="text-muted-foreground">{matrix.definitions.denominator}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Numerators</dt>
            <dd className="text-muted-foreground">{matrix.definitions.numerator}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Covered</dt>
            <dd className="text-muted-foreground">{matrix.rules.covered}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Sampled</dt>
            <dd className="text-muted-foreground">{plainRuleText(matrix.rules.sampled)}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Status</dt>
            <dd className="text-muted-foreground">{matrix.rules.status}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Parity</dt>
            <dd className="text-muted-foreground">{matrix.rules.parity}</dd>
          </div>
          <div>
            <dt className="font-medium text-foreground">Artifacts</dt>
            <dd className="text-muted-foreground">{matrix.rules.artifacts}</dd>
          </div>
        </dl>
      </section>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-2">
        <FilterDropdown
          ariaLabel="Engine"
          label="Engine"
          items={ENGINES.map((e) => ({ id: e, label: ENGINE_LABEL[e] }))} // eslint-disable-line security/detect-object-injection
          selectedId={engine}
          onSelect={(id) => {
            setEngine(id as EngineId)
            onUpdateParams?.({ engine: id === DEFAULT_ENGINE ? null : id })
          }}
          size="sm"
        />
        <FilterDropdown
          ariaLabel="Polarity"
          label="Polarity"
          items={POLARITIES.map((p) => ({ id: p, label: POLARITY_LABEL[p] }))} // eslint-disable-line security/detect-object-injection
          selectedId={polarity}
          onSelect={(id) => {
            // The dropdown's own "All" row is not a polarity — it means the default.
            const next = toPolarity(id)
            setPolarity(next)
            onUpdateParams?.({ polarity: next === DEFAULT_POLARITY ? null : next })
          }}
          size="sm"
        />
        <FilterDropdown
          ariaLabel="Status"
          label="Status"
          items={[
            { id: 'all', label: 'All statuses' },
            ...MATRIX_STATUSES.map((s) => ({ id: s, label: s })),
          ]}
          selectedId={statusFilter}
          onSelect={setStatusFilter}
          size="sm"
        />
        <div className="w-full sm:w-64">
          <Input
            aria-label="Search mechanism, algorithm or operation"
            placeholder="Search mechanism, algorithm, operation"
            value={query}
            onChange={(ev) => {
              setQuery(ev.target.value)
              setLimit(PAGE)
            }}
          />
        </div>
      </div>

      {statusFilter === 'untested' && (
        <p className="text-xs text-muted-foreground" data-testid="untested-filter-note">
          &ldquo;untested&rdquo; lists every group with at least one untested cell, so a group can
          appear here while its status column shows the strongest evidence among its other cells.
        </p>
      )}

      {/* Matrix */}
      <div
        className="glass-panel w-full min-w-0 max-w-full overflow-x-auto"
        role="region"
        aria-label="Capability coverage matrix; scroll horizontally for all columns"
        tabIndex={0}
      >
        <table className="w-full text-xs">
          <caption className="px-3 py-2 text-left text-muted-foreground">
            {`${visible.length} mechanism × operation groups — ${ENGINE_LABEL[engine]}, ${POLARITY_LABEL[polarity]} polarity`}
          </caption>
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th scope="col" className="px-3 py-2 font-medium">
                Mechanism
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Operation
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Status
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Covered / sampled / untested
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Recorded runs
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                <span className="sr-only">Details</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, limit).map((g) => (
              <GroupRows
                key={g.key}
                group={g}
                engine={engine}
                polarity={polarity}
                open={expanded.has(g.key)}
                onToggle={() => toggle(g.key)}
              />
            ))}
          </tbody>
        </table>
        {visible.length > limit && (
          <div className="border-t border-border p-2 text-center">
            <Button variant="ghost" size="sm" onClick={() => setLimit((l) => l + PAGE)}>
              Show {Math.min(PAGE, visible.length - limit)} more ({visible.length - limit} hidden)
            </Button>
          </div>
        )}
      </div>

      {/* Open gaps register (J-7) */}
      <section className="glass-panel overflow-hidden" aria-label="Open gaps register">
        <div className="border-b border-border bg-muted/20 p-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
            <div className="max-w-3xl space-y-1">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ClipboardList size={16} className="text-primary" aria-hidden="true" />
                Open gaps register
                <span className="font-normal text-muted-foreground" data-testid="gap-total">
                  ({baseGaps.length})
                </span>
              </h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                These are known limits in test coverage, interface reachability, or engine behavior.
                A gap stays in the coverage denominator so that missing evidence cannot look like a
                pass.
              </p>
            </div>
            <div
              role="group"
              className="flex max-w-full min-w-0 flex-wrap gap-1 self-start rounded-lg border border-border bg-background p-1"
              aria-label="Gap register reading level"
            >
              <Button
                variant={gapView === 'overview' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-auto min-h-7 gap-1.5 whitespace-normal px-2.5 py-1 text-xs"
                aria-pressed={gapView === 'overview'}
                onClick={() => setGapView('overview')}
              >
                <BookOpen size={13} aria-hidden="true" />
                Guided overview
              </Button>
              <Button
                variant={gapView === 'evidence' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-auto min-h-7 gap-1.5 whitespace-normal px-2.5 py-1 text-xs"
                aria-pressed={gapView === 'evidence'}
                onClick={() => setGapView('evidence')}
              >
                <FileText size={13} aria-hidden="true" />
                Evidence detail
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3" aria-label="Gap status definitions">
            {GAP_STATUSES.map((status) => {
              // Counted over the entries the list can show, so a chip never promises more than it lists.
              const count = baseGaps.filter((gap) => gap.status === status).length
              const statusMeta = gapStatusMeta(status)
              return (
                <Button
                  variant="ghost"
                  size="sm"
                  key={status}
                  aria-pressed={gapStatus === status}
                  onClick={() => setGapStatus((current) => (current === status ? 'all' : status))}
                  className={clsx(
                    'h-auto min-h-14 justify-start whitespace-normal rounded-lg border p-2 text-left transition-colors',
                    gapStatus === status
                      ? 'border-primary/50 bg-primary/10'
                      : 'border-border bg-background/60 hover:border-primary/30'
                  )}
                >
                  <span className="block w-full">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-foreground">
                        {statusMeta.label}
                      </span>
                      <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                      {statusMeta.takeaway}
                    </span>
                  </span>
                </Button>
              )
            })}
          </div>

          {hiddenGaps > 0 && (
            <p className="mt-2 text-[11px] text-muted-foreground" data-testid="gap-hidden-note">
              {matrix.openGaps.length} gaps in total. {hiddenGaps} generated entries &mdash; one per
              mechanism with no registered test &mdash; are folded away and not included in the
              counts above; show them at the end of the list.
            </p>
          )}

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              aria-label="Search open gaps"
              placeholder={
                gapView === 'evidence'
                  ? 'Search finding, engine, standard, owner, or tracking reference'
                  : 'Search finding, engine, or standard'
              }
              value={gapQuery}
              onChange={(event) => setGapQuery(event.target.value)}
              className="sm:max-w-md"
            />
            {(gapQuery || gapStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                className="w-fit"
                onClick={() => {
                  setGapQuery('')
                  setGapStatus('all')
                }}
              >
                Clear gap filters
              </Button>
            )}
            <span className="text-xs text-muted-foreground sm:ml-auto">
              Showing {gaps.length} of {baseGaps.length}
            </span>
          </div>
        </div>

        {gaps.length > 0 ? (
          <ul className="divide-y divide-border">
            {gaps.map((gap) => (
              <OpenGapCard
                key={gap.id}
                gap={gap}
                view={gapView}
                detailsOpen={expandedGapDetails.has(gap.id)}
                onToggleDetails={() => toggleGapDetails(gap.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No gaps match the current filters.
          </div>
        )}
        {hiddenGaps > 0 && (
          <div className="border-t border-border p-3 text-center">
            <Button variant="ghost" size="sm" onClick={() => setShowAllGaps(true)}>
              Show {hiddenGaps} generated per-mechanism entries
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}

function OpenGapCard({
  gap,
  view,
  detailsOpen,
  onToggleDetails,
}: {
  gap: OpenGap
  view: GapView
  detailsOpen: boolean
  onToggleDetails: () => void
}) {
  const statusMeta = gapStatusMeta(gap.status)
  const evidenceId = `gap-evidence-${gap.id.replace(/[^A-Za-z0-9_-]/g, '_')}`
  // Plain wording for entries whose own text carries internal labels; the
  // original stays under "Show technical evidence" and the tracking reference
  // in Evidence detail.
  const plain = plainGapView(gap)

  return (
    <li className="p-4" data-gap-status={gap.status}>
      <article aria-labelledby={`gap-title-${gap.id}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={clsx(
                  'rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  statusMeta.tone
                )}
              >
                {statusMeta.label}
              </span>
              <span className="text-[11px] text-muted-foreground">{plain.scope}</span>
            </div>
            <h5
              id={`gap-title-${gap.id}`}
              className="text-sm font-semibold leading-snug text-foreground"
            >
              {plain.title}
            </h5>
          </div>
          <div className="flex shrink-0 flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {/* Owner and tracking reference are maintenance detail — evidence view only */}
            {view === 'evidence' && (
              <>
                <span>Owner: {gap.owner === 'unassigned' ? 'not yet assigned' : gap.owner}</span>
                {gap.planItem && <span>Tracking reference {gap.planItem}</span>}
              </>
            )}
            {typeof gap.cells === 'number' && <span>{gap.cells} capability cells</span>}
          </div>
        </div>

        <div
          className={clsx(
            'mt-3 grid gap-3',
            view === 'evidence' && 'lg:grid-cols-[minmax(0,1.15fr)_minmax(16rem,0.85fr)]'
          )}
        >
          <div className="rounded-lg border border-border bg-background/50 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              What this means
            </p>
            <p className="mt-1 text-xs leading-relaxed text-foreground">
              {plain.summary ?? gapSummary(gap.detail)}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Why it matters
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{statusMeta.why}</p>
          </div>

          {view === 'evidence' && (
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] content-start gap-x-3 gap-y-1.5 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <dt className="font-medium text-foreground">Claim boundary</dt>
              <dd className="text-muted-foreground">{statusMeta.takeaway}</dd>
              <dt className="font-medium text-foreground">Applies to</dt>
              <dd className="break-words text-muted-foreground">{plain.scope}</dd>
              <dt className="font-medium text-foreground">Disposition</dt>
              <dd className="text-muted-foreground">{statusMeta.label}</dd>
              <dt className="font-medium text-foreground">Evidence class</dt>
              <dd className="text-muted-foreground">
                {gap.origin === 'generated'
                  ? 'Generated coverage finding'
                  : 'Reviewed curated finding'}
              </dd>
            </dl>
          )}
        </div>

        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-1.5 text-xs"
            aria-expanded={detailsOpen}
            aria-controls={evidenceId}
            onClick={onToggleDetails}
          >
            {detailsOpen ? (
              <ChevronDown size={13} aria-hidden="true" />
            ) : (
              <ChevronRight size={13} aria-hidden="true" />
            )}
            {detailsOpen ? 'Hide technical evidence' : 'Show technical evidence'}
          </Button>
        </div>

        {detailsOpen && (
          <div
            id={evidenceId}
            className="mt-2 max-w-5xl rounded-lg border border-border bg-muted/20 p-3"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Technical evidence and investigation history
            </p>
            <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {gapEvidenceParagraphs(gap.detail).map((paragraph, index) => (
                <p key={`${gap.id}-evidence-${index}`} className="break-words">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}
      </article>
    </li>
  )
}

function GroupRows({
  group,
  engine,
  polarity,
  open,
  onToggle,
}: {
  group: CoverageGroup
  engine: EngineId
  polarity: Polarity
  open: boolean
  onToggle: () => void
}) {
  const ge = group.engines[engine] // eslint-disable-line security/detect-object-injection
  const gp = ge.polarity[polarity] // eslint-disable-line security/detect-object-injection
  const run = group.rows.reduce(
    (acc, r) => {
      const c = r.engines[engine] // eslint-disable-line security/detect-object-injection
      return { pass: acc.pass + (c.run?.pass ?? 0), fail: acc.fail + (c.run?.fail ?? 0) }
    },
    { pass: 0, fail: 0 }
  )
  const detailId = `coverage-detail-${group.key.replace(/[^A-Za-z0-9_-]/g, '_')}`
  return (
    <>
      <tr className="border-b border-border align-top" data-deeplink-id={`coverage-${group.key}`}>
        <th scope="row" className="px-3 py-2 text-left font-normal">
          <span className="font-mono text-[11px] text-foreground">
            {group.mechanism ?? '(no PKCS#11 mechanism)'}
          </span>
          <span className="block text-[11px] text-muted-foreground">
            {group.algorithm}
            {group.section ? ` · PKCS#11 v3.2 ${group.section}` : ''}
          </span>
        </th>
        <td className="px-3 py-2 text-foreground">{group.operation}</td>
        <td className="px-3 py-2">
          <StatusBadge status={gp.status} />
        </td>
        <td className="px-3 py-2 text-foreground">
          {gp.status === 'unsupported'
            ? `0 of ${ge.unsupportedCells} (unsupported)`
            : `${gp.covered} / ${gp.sampled} / ${gp.untested} of ${ge.advertisedCells}`}
        </td>
        <td className="px-3 py-2">
          {run.pass + run.fail === 0 ? (
            <span className="text-muted-foreground">none recorded</span>
          ) : (
            <span className={run.fail ? 'text-status-error' : 'text-status-success'}>
              {run.pass} pass{run.fail ? ` · ${run.fail} FAIL` : ''}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-right">
          <Button
            variant="ghost"
            size="sm"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={onToggle}
            aria-label={`${open ? 'Hide' : 'Show'} cells for ${group.mechanism ?? group.algorithm} ${group.operation}`}
          >
            <ChevronDown
              size={14}
              className={clsx('transition-transform', open && 'rotate-180')}
              aria-hidden="true"
            />
          </Button>
        </td>
      </tr>
      {open && (
        <tr id={detailId} className="border-b border-border bg-muted/20">
          <td colSpan={6} className="px-3 py-2">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th scope="col" className="pr-2 font-medium">
                    Parameter set
                  </th>
                  <th scope="col" className="pr-2 font-medium">
                    Variant
                  </th>
                  {POLARITIES.map((p) => (
                    <th key={p} scope="col" className="pr-2 font-medium">
                      {POLARITY_LABEL[p] /* eslint-disable-line security/detect-object-injection */}
                    </th>
                  ))}
                  <th scope="col" className="pr-2 font-medium">
                    Parity
                  </th>
                  <th scope="col" className="font-medium">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((r) => {
                  const c = r.engines[engine] // eslint-disable-line security/detect-object-injection
                  return (
                    <tr key={r.key} className="border-t border-border/60">
                      <td className="pr-2 text-foreground">{r.parameterSet}</td>
                      <td className="pr-2 text-foreground">{r.variant}</td>
                      {POLARITIES.map((p) => (
                        <td key={p} className="pr-2">
                          <StatusBadge status={c.polarity[p].status} />{' '}
                          <span className="text-muted-foreground">{c.polarity[p].level}</span>
                        </td>
                      ))}
                      <td className="pr-2 text-muted-foreground">{r.parity.positive}</td>
                      <td className="text-muted-foreground">
                        {!c.advertised
                          ? c.reason
                          : c.run?.fail
                            ? `recorded FAIL (${c.run.fail})`
                            : c.run?.skip
                              ? `recorded SKIP (${c.run.skip}) — not run`
                              : c.waiver
                                ? `waiver ${c.waiver}`
                                : ''}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  )
}
