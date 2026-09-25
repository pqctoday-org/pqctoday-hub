// SPDX-License-Identifier: GPL-3.0-only
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
import { ChevronDown, ExternalLink, Grid3x3 } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorAlert } from '@/components/ui/error-alert'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ValidationDisclaimer } from '@/components/shared/ValidationDisclaimer'
import {
  ENGINES,
  ENGINE_LABEL,
  MATRIX_STATUSES,
  POLARITIES,
  expandMatrix,
  type CoverageMatrix,
  type CoverageMatrixFile,
  type EngineId,
  type MatrixStatus,
  type Polarity,
} from '@/data/validation/coverageModel'
import { groupByMechanismOperation, type CoverageGroup } from '@/data/validation/coverageExport'

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

interface CoverageMatrixViewProps {
  /** Injected in tests; defaults to fetching the public JSON. */
  loader?: () => Promise<CoverageMatrixFile>
}

export function CoverageMatrixView({ loader = loadCoverageMatrix }: CoverageMatrixViewProps = {}) {
  const [matrix, setMatrix] = useState<CoverageMatrix | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [engine, setEngine] = useState<EngineId>('cpp')
  const [polarity, setPolarity] = useState<Polarity>('positive')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [showAllGaps, setShowAllGaps] = useState(false)

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

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return groups.filter((g) => {
      const gp = g.engines[engine].polarity[polarity] // eslint-disable-line security/detect-object-injection
      if (statusFilter !== 'all' && gp.status !== statusFilter) return false
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

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const gaps = showAllGaps
    ? matrix.openGaps
    : matrix.openGaps.filter((g) => g.origin === 'curated' || !g.id.startsWith('untested:'))
  const hiddenGaps = matrix.openGaps.length - gaps.length

  return (
    <div className="space-y-4" data-testid="coverage-matrix-view">
      <ValidationDisclaimer />

      <div className="space-y-1">
        <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Grid3x3 size={16} className="text-primary" aria-hidden="true" />
          Capability coverage matrix
        </h3>
        <p className="text-xs text-muted-foreground">
          Every capability each shipped PKCS#11 engine advertises at runtime, joined to the
          registered tests that exercise it. A status names the strongest kind of registered
          evidence; it is not a pass. Recorded run results are shown separately. Exports:{' '}
          {(['html', 'md', 'json'] as const).map((ext, i) => (
            <span key={ext}>
              {i > 0 && ' · '}
              <a
                href={dataUrl(`coverage-matrix.${ext}`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-primary underline-offset-2 hover:underline"
              >
                {ext.toUpperCase()}
                <ExternalLink size={10} aria-hidden="true" />
              </a>
            </span>
          ))}
        </p>
      </div>

      {/* Totals — numerator / denominator per engine and polarity */}
      <div className="grid gap-3 md:grid-cols-2">
        {ENGINES.map((e) => {
          const t = matrix.totals.byEngine[e] // eslint-disable-line security/detect-object-injection
          const id = matrix.engines[e] // eslint-disable-line security/detect-object-injection
          return (
            <section key={e} className="glass-panel p-3" aria-label={`${ENGINE_LABEL[e]} totals`}>
              <h4 className="text-sm font-semibold text-foreground">
                {ENGINE_LABEL[e] /* eslint-disable-line security/detect-object-injection */} engine
              </h4>
              <p className="text-xs text-muted-foreground">
                {id.mechanismCount} mechanisms · {t.advertisedCells} advertised capability cells
                (denominator) · {t.unsupportedCells} unsupported cells shown separately
              </p>
              <div className="mt-2 overflow-x-auto">
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
            <dd className="text-muted-foreground">{matrix.rules.sampled}</dd>
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
          onSelect={(id) => setEngine(id as EngineId)}
          size="sm"
        />
        <FilterDropdown
          ariaLabel="Polarity"
          label="Polarity"
          items={POLARITIES.map((p) => ({ id: p, label: POLARITY_LABEL[p] }))} // eslint-disable-line security/detect-object-injection
          selectedId={polarity}
          onSelect={(id) => setPolarity(id as Polarity)}
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

      {/* Matrix */}
      <div className="glass-panel overflow-x-auto">
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
      <section className="glass-panel p-3" aria-label="Open gaps register">
        <h4 className="text-sm font-semibold text-foreground">
          Open gaps register ({matrix.openGaps.length})
        </h4>
        <p className="text-xs text-muted-foreground">
          Known unsupported and untested areas, each with an owner and status. They stay in the
          denominators above.
        </p>
        <ul className="mt-2 space-y-2">
          {gaps.map((g) => (
            <li key={g.id} className="rounded-md border border-border p-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-foreground">{g.title}</span>
                <span
                  className={clsx(
                    'rounded border px-1.5 py-0.5 text-[10px]',
                    g.status === 'accepted-limitation'
                      ? 'border-border bg-muted/40 text-muted-foreground'
                      : 'border-status-warning/30 bg-status-warning/10 text-status-warning'
                  )}
                >
                  {g.status}
                </span>
                <span className="text-muted-foreground">owner: {g.owner}</span>
                {g.planItem && <span className="text-muted-foreground">plan {g.planItem}</span>}
                {typeof g.cells === 'number' && (
                  <span className="text-muted-foreground">{g.cells} cells</span>
                )}
              </div>
              <p className="mt-1 text-muted-foreground">{g.detail}</p>
            </li>
          ))}
        </ul>
        {hiddenGaps > 0 && (
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setShowAllGaps(true)}>
            Show {hiddenGaps} per-mechanism untested entries
          </Button>
        )}
      </section>
    </div>
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
      <tr className="border-b border-border align-top">
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
