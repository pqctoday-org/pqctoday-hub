// SPDX-License-Identifier: GPL-3.0-only
/**
 * The six screens of the Entropy Evidence Lab. Presentational only: state,
 * data loading and estimator runs live in EntropyEvidenceLab.tsx.
 */
import type { FC, ReactNode } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  FlaskConical,
  Loader2,
  Play,
  Server,
  Shuffle,
  Square,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ErrorAlert } from '@/components/ui/error-alert'
import type { Sp80090bResultRecord } from '@/wasm/entropy90b/resultRecord'
import { NIST_90B_TOOL_COMMIT } from '@/wasm/entropy90b/resultRecord'
import type { TestResult } from '../../utils/entropyTests'
import type { RunState } from './runState'
import {
  ESV_CERTIFICATES,
  d4Spec,
  type ComparisonOnlyRow,
  type DeviceDataset,
  type DeviceManifest,
  type LabCase,
  type LoadedData,
  type NativeReferenceEntry,
} from './evidenceLabData'
import {
  VERDICT_LABELS,
  fmt,
  type Conclusion,
  type EstimatorRow,
  type HealthCutoffs,
  type MinSelection,
  type ReferenceComparison,
  type RestartEvaluation,
  type Track,
  type Verdict,
  type VerdictCheck,
} from './evidenceLabLogic'

const secs = (ms: number) => `${(ms / 1000).toFixed(1)} s`
const short = (h: string) => `${h.slice(0, 16)}…`

// ── Small building blocks ────────────────────────────────────────────────────

const Field: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm text-foreground break-words">{children}</dd>
  </div>
)

const Mono: FC<{ children: ReactNode }> = ({ children }) => (
  <code className="font-mono text-xs break-all text-foreground">{children}</code>
)

export const Notice: FC<{
  tone: 'warning' | 'info' | 'error' | 'success'
  children: ReactNode
}> = ({ tone, children }) => {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'error' ? XCircle : AlertTriangle
  const tones = {
    warning: ['bg-status-warning', 'text-status-warning'],
    info: ['bg-status-info', 'text-status-info'],
    error: ['bg-status-error', 'text-status-error'],
    success: ['bg-status-success', 'text-status-success'],
  } as const
  const [bg, fg] = tones[tone]
  return (
    <div className={`rounded-lg border ${bg} p-3 flex gap-2 items-start`}>
      <Icon size={16} className={`${fg} shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="text-sm text-foreground min-w-0">{children}</div>
    </div>
  )
}

function groupIcon(group: LabCase['group']) {
  if (group === 'device') return <Cpu size={16} className="text-primary" aria-hidden="true" />
  if (group === 'contrast') return <Server size={16} className="text-accent" aria-hidden="true" />
  return <FlaskConical size={16} className="text-secondary" aria-hidden="true" />
}

// ── Screen 1: dataset ────────────────────────────────────────────────────────

const GROUP_TITLES: Record<LabCase['group'], { title: string; note: string }> = {
  device: {
    title: 'Device raw noise (our own measurements)',
    note: 'CPU execution-time jitter recorded with jitterentropy v3.7.0 on the device itself.',
  },
  contrast: {
    title: 'Contrast: conditioned / DRBG output',
    note: 'Output of getrandom(): what an application sees — not a noise source.',
  },
  synthetic: {
    title: 'Synthetic failure and teaching data',
    note: 'Generated in your browser by a deterministic program. Never a device measurement.',
  },
}

export const DatasetScreen: FC<{
  cases: LabCase[]
  selectedId: string | null
  onSelect: (id: string) => void
}> = ({ cases, selectedId, onSelect }) => (
  <div className="space-y-5">
    {(['device', 'contrast', 'synthetic'] as const).map((g) => (
      <section key={g} aria-labelledby={`evl-group-${g}`} className="space-y-2">
        <h4
          id={`evl-group-${g}`}
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          {groupIcon(g)}
          {GROUP_TITLES[g].title}
        </h4>
        <p className="text-xs text-muted-foreground">{GROUP_TITLES[g].note}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {cases
            .filter((c) => c.group === g)
            .map((c) => {
              const selected = c.id === selectedId
              return (
                <Button
                  key={c.id}
                  variant={selected ? 'secondary' : 'outline'}
                  size="tile"
                  aria-pressed={selected}
                  onClick={() => onSelect(c.id)}
                  data-testid={`evl-case-${c.id}`}
                >
                  <span className="text-sm font-semibold">{c.title}</span>
                  <span
                    className={`text-xs ${selected ? 'text-secondary-foreground' : 'text-muted-foreground'}`}
                  >
                    {c.lesson}
                  </span>
                </Button>
              )
            })}
        </div>
      </section>
    ))}
  </div>
)

// ── Screen 2: sample unit, alphabet and conditions ───────────────────────────

function tempText(d: DeviceDataset): string {
  const t = d.temperatureBefore
  const t2 = d.temperatureAfter
  if (!t || t.valueC === null) return t?.note ?? 'not recorded'
  return `${t.valueC.toFixed(1)} °C before, ${t2?.valueC?.toFixed(1) ?? '?'} °C after (${t.sensor ?? 'sensor'})`
}

export const ConditionsScreen: FC<{
  labCase: LabCase
  manifest: DeviceManifest
  seqDataset: DeviceDataset | null
  restartDataset: DeviceDataset | null
  data: LoadedData | null
  dataError: string | null
  distinctSymbols: number | null
}> = ({ labCase, manifest, seqDataset, restartDataset, data, dataError, distinctSymbols }) => {
  const hashLine = data && (
    <Field label="SHA-256 of the samples the estimators will read">
      <Mono>{data.sha256}</Mono>{' '}
      {data.expectedSha256 === null ? (
        <span className="text-xs text-muted-foreground">(no pinned hash)</span>
      ) : data.expectedSha256 === data.sha256 ? (
        <span className="text-xs text-status-success">matches the manifest</span>
      ) : (
        <span className="text-xs text-status-error">does NOT match the manifest</span>
      )}
    </Field>
  )
  if (labCase.sequential.kind === 'synthetic') {
    const spec = d4Spec(labCase.sequential.d4Id)
    const rSpec = labCase.restart?.kind === 'synthetic' ? d4Spec(labCase.restart.d4Id) : null
    return (
      <div className="space-y-4">
        <Notice tone="warning">
          <strong>Synthetic.</strong> This dataset is generated by <Mono>{spec.generator}</Mono> in
          your browser. It is not a measurement of any device or noise source.
        </Notice>
        <dl className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Sample unit">one generated symbol per byte</Field>
          <Field label="Alphabet">
            {spec.bitsPerSymbol}-bit samples: at most {2 ** spec.bitsPerSymbol} symbols
            {distinctSymbols !== null && ` (${distinctSymbols} present)`}
          </Field>
          <Field label="Generator and parameters">
            <Mono>{spec.generator}</Mono> —{' '}
            {Object.entries(spec.parameters)
              .map(([k, v]) => `${k}=${v}`)
              .join(', ')}
            {spec.seed !== null && `, seed ${spec.seed}`}
          </Field>
          <Field label="Samples">{spec.parameters.samples ?? '1000000'}</Field>
          {rSpec && (
            <Field label="Restart matrix">
              {rSpec.id}: 1000 restarts × 1000 samples (<Mono>{rSpec.generator}</Mono>)
            </Field>
          )}
          <Field label="Teaching note">{spec.teachingNote}</Field>
          {hashLine}
        </dl>
        {dataError && <ErrorAlert message={dataError} />}
      </div>
    )
  }
  const d = seqDataset!
  const isContrast = d.provenance === 'conditioned-output-contrast'
  return (
    <div className="space-y-4">
      {isContrast && (
        <Notice tone="warning">
          <strong>Conditioned/DRBG output — not raw noise.</strong> Running SP 800-90B estimators on
          it is the mistake this dataset exists to show.
        </Notice>
      )}
      <dl className="glass-panel p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Sample unit">{d.sampleUnit}</Field>
        <Field label="Alphabet">
          {d.alphabet}
          {distinctSymbols !== null && ` (${distinctSymbols} present)`}
        </Field>
        <Field label="Reduction to ≤ 256 symbols">
          {d.reduction.description}{' '}
          {d.reduction.source && (
            <a
              href={d.reduction.source}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-0.5"
            >
              extractlsb.c <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </Field>
        <Field label="Samples">
          {d.sampleCount.toLocaleString('en-US')}
          {restartDataset?.matrix &&
            ` sequential; restart matrix ${restartDataset.matrix.restarts} × ${restartDataset.matrix.samplesPerRestart}`}
        </Field>
        <Field label="Device">
          {d.deviceDescription} — <em>{d.environmentKind}</em>
        </Field>
        <Field label="Operating environment">
          {[d.environmentSummary.os, d.environmentSummary.kernel, d.environmentSummary.cpu]
            .filter(Boolean)
            .join(' · ')}
        </Field>
        <Field label="Timer">{d.timer ?? d.environmentSummary.timer ?? 'not recorded'}</Field>
        <Field label="Condition">
          <strong>{d.conditionLabel}</strong>
          {d.conditionDetail && ` — ${d.conditionDetail}`}
        </Field>
        <Field label="Temperature">{tempText(d)}</Field>
        <Field label="Load average before / after">
          {d.loadBefore ?? '—'} / {d.loadAfter ?? '—'}
        </Field>
        <Field label="Collected (UTC)">
          {d.startUtc} → {d.endUtc} ({d.wallSeconds} s)
        </Field>
        <Field label="Recorder">
          {d.tool.repo ? (
            <>
              jitterentropy {d.tool.tag} commit <Mono>{d.tool.commit?.slice(0, 12)}</Mono>; binary
              sha256 <Mono>{short(d.tool.binary_sha256 ?? '')}</Mono>
            </>
          ) : (
            <>
              <Mono>{d.tool.binary}</Mono>
              {d.tool.binary_sha256 && (
                <>
                  {' '}
                  sha256 <Mono>{short(d.tool.binary_sha256)}</Mono>
                </>
              )}
            </>
          )}
        </Field>
        <Field label="Command">
          <Mono>{d.command}</Mono>
        </Field>
        <Field label="Source file → published file">
          <Mono>{short(d.sourceSha256)}</Mono> → <Mono>{short(d.sha256)}</Mono>
        </Field>
        {hashLine}
      </dl>
      {d.caveats.length > 0 && (
        <div className="glass-panel p-4">
          <p className="text-xs font-semibold text-foreground mb-1">
            Caveats recorded with the data
          </p>
          <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
            {[...d.caveats, ...(restartDataset?.caveats ?? [])].map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-muted-foreground">{manifest.truthBoundary}</p>
      {dataError && <ErrorAlert message={dataError} />}
    </div>
  )
}

// ── Screen 3: track ──────────────────────────────────────────────────────────

export const TrackScreen: FC<{
  labCase: LabCase
  track: Track | null
  onChoose: (t: Track) => void
}> = ({ labCase, track, onChoose }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Button
        variant={track === 'non-iid' ? 'secondary' : 'outline'}
        size="tile"
        aria-pressed={track === 'non-iid'}
        onClick={() => onChoose('non-iid')}
        data-testid="evl-track-non-iid"
      >
        <span className="text-sm font-semibold">Non-IID track (SP 800-90B §6.2)</span>
        <span
          className={`text-xs ${track === 'non-iid' ? 'text-secondary-foreground' : 'text-muted-foreground'}`}
        >
          Ten estimators on the samples and on the bit string; the minimum is the estimate. The
          default whenever an IID claim is not justified.
        </span>
      </Button>
      <Button
        variant={track === 'iid' ? 'secondary' : 'outline'}
        size="tile"
        aria-pressed={track === 'iid'}
        onClick={() => onChoose('iid')}
        data-testid="evl-track-iid"
      >
        <span className="text-sm font-semibold">IID track (SP 800-90B §6.1)</span>
        <span
          className={`text-xs ${track === 'iid' ? 'text-secondary-foreground' : 'text-muted-foreground'}`}
        >
          Only the Most Common Value estimate — allowed only when an IID claim is justified and the
          IID tests (incl. 10,000-round permutation testing, §5.1) do not reject it.
        </span>
      </Button>
    </div>
    <div className="glass-panel p-4 space-y-2 text-sm text-muted-foreground">
      <p>
        <strong className="text-foreground">Guidance.</strong> SP 800-90B §3.1.2 allows the IID
        track only when <em>all</em> of these hold: the submitter makes an IID claim with a
        rationale from the design; the sequential dataset passes the §5 IID tests; and the restart
        row and column datasets pass them too. Otherwise the non-IID track is required.
      </p>
      {labCase.provenance === 'device-raw-noise' && (
        <p>
          Jitter time deltas depend on caches, pipelines and scheduling, so there is no design
          rationale for independence here. Choose the IID track only to see the permutation test
          reject it — on data that is not IID it runs all 10,000 rounds and can take a very long
          time in a browser; you can cancel it.
        </p>
      )}
    </div>
  </div>
)

// ── Screen 4: run ────────────────────────────────────────────────────────────

const RunControls: FC<{
  run: RunState
  label: string
  disabled?: boolean
  onRun: () => void
  onCancel: () => void
  testId: string
}> = ({ run, label, disabled, onRun, onCancel, testId }) => {
  const busy = run.status === 'loading' || run.status === 'running'
  return (
    <div className="flex flex-wrap items-center gap-2">
      {busy ? (
        <Button variant="destructive" onClick={onCancel} data-testid={`${testId}-cancel`}>
          <Square size={14} className="mr-1" aria-hidden="true" /> Cancel
        </Button>
      ) : (
        <Button
          variant="gradient"
          onClick={onRun}
          disabled={disabled}
          data-testid={`${testId}-run`}
          className="whitespace-normal h-auto min-h-10"
        >
          <Play size={14} className="mr-1 shrink-0" aria-hidden="true" /> {label}
        </Button>
      )}
      <span className="text-xs text-muted-foreground" role="status" aria-live="polite">
        {run.status === 'loading' && 'Preparing the dataset…'}
        {run.status === 'running' && (
          <span className="inline-flex items-center gap-1">
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />
            {run.stage ?? 'Starting the NIST tool'} · {secs(run.elapsedMs)} · stage{' '}
            {run.stagesSeen.length}
          </span>
        )}
        {run.status === 'done' &&
          `Finished in ${secs(run.record?.execution.elapsedMs ?? run.elapsedMs)}`}
        {run.status === 'cancelled' && 'Cancelled.'}
      </span>
    </div>
  )
}

const RecordPanel: FC<{ record: Sp80090bResultRecord; onExport: () => void; testId: string }> = ({
  record,
  onExport,
  testId,
}) => (
  <div className="rounded-lg border border-border p-3 space-y-2" data-testid={testId}>
    <p className="text-xs font-semibold text-foreground">
      Result record (NIST SP800-90B_EntropyAssessment tool JSON, wrapped)
    </p>
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Field label="NIST tool">
        {record.tool.repo} commit <Mono>{record.tool.commit.slice(0, 12)}</Mono> (
        {record.tool.program}, version string {record.tool.versionString ?? '—'})
      </Field>
      <Field label="Runtime">
        {record.runtime.kind === 'wasm' ? (
          <>
            WebAssembly, sha256 <Mono>{short(record.runtime.wasmSha256)}</Mono>
          </>
        ) : (
          record.runtime.platform
        )}
      </Field>
      <Field label="Dataset sha256">
        <Mono>{short(record.dataset.sha256)}</Mono>{' '}
        {record.datasetHashConfirmedByTool ? (
          <span className="text-xs text-status-success">confirmed by the tool</span>
        ) : (
          <span className="text-xs text-status-error">NOT confirmed by the tool</span>
        )}
      </Field>
      <Field label="Command line">
        <Mono>{record.tool.argv.join(' ')}</Mono>
      </Field>
    </dl>
    <Button variant="outline" size="sm" onClick={onExport}>
      <Download size={14} className="mr-1" aria-hidden="true" /> Export record (JSON)
    </Button>
  </div>
)

const ReferenceBadge: FC<{ cmp: ReferenceComparison | null; note?: string }> = ({ cmp, note }) => {
  if (!cmp)
    return (
      <p className="text-xs text-muted-foreground" data-testid="evl-reference-none">
        No pinned native reference result for this dataset hash and track.
      </p>
    )
  return (
    <div data-testid="evl-reference">
      {cmp.matches ? (
        <Notice tone="success">
          <strong>Matches native reference</strong> — {cmp.identical}/{cmp.compared} fields
          bit-identical to the native Linux/arm64 build of the same NIST tool commit.
          {note && <span className="block text-xs text-muted-foreground mt-1">{note}</span>}
        </Notice>
      ) : (
        <Notice tone="error">
          <strong>Differs from the native reference</strong> in {cmp.diffs.length} of {cmp.compared}{' '}
          fields (first: {cmp.diffs[0]?.field}). Do not use this run as evidence.
        </Notice>
      )}
    </div>
  )
}

export const EstimatorTable: FC<{
  rows: EstimatorRow[]
  min: MinSelection | null
  bitsPerSymbol: number
}> = ({ rows, min, bitsPerSymbol }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-xs" data-testid="evl-estimator-table">
      <caption className="text-left text-xs text-muted-foreground mb-1">
        Min-entropy per {bitsPerSymbol}-bit sample. Bit-string results are per bit × {bitsPerSymbol}
        .
      </caption>
      <thead>
        <tr className="text-left text-muted-foreground border-b border-border">
          <th scope="col" className="py-1 pr-2 font-medium">
            Estimator
          </th>
          <th scope="col" className="py-1 pr-2 font-medium text-right">
            Samples
          </th>
          {bitsPerSymbol > 1 && (
            <th scope="col" className="py-1 font-medium text-right">
              Bit string × {bitsPerSymbol}
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const bindLit = min?.bindingEstimator === r.estimator && min.bindingKind === 'literal'
          const bindBit = min?.bindingEstimator === r.estimator && min.bindingKind === 'bitstring'
          return (
            <tr key={r.estimator} className="border-b border-border/50">
              <th scope="row" className="py-1 pr-2 font-normal text-foreground text-left">
                {r.estimator}
              </th>
              <td
                className={`py-1 pr-2 text-right font-mono ${bindLit ? 'text-primary font-bold' : 'text-foreground'}`}
              >
                {r.literal === null ? '—' : fmt(r.literal)}
              </td>
              {bitsPerSymbol > 1 && (
                <td
                  className={`py-1 text-right font-mono ${bindBit ? 'text-primary font-bold' : 'text-foreground'}`}
                >
                  {r.bitstringPerSample === null ? '—' : fmt(r.bitstringPerSample)}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  </div>
)

function comparisonValue(row: ComparisonOnlyRow, ref: NativeReferenceEntry | undefined): string {
  if (!ref) return 'no reference result'
  if (row.kind === 'restart' && ref.restart) {
    const v = ref.restart.values
    if (v.error) return `restart: ${String(v.error)} (H_I ${fmt(ref.restart.hI)})`
    return `restart passed: H_r ${fmt(Number(v['Overall / h_r']))}, H_c ${fmt(Number(v['Overall / h_c']))}, H_I ${fmt(ref.restart.hI)}`
  }
  const h = ref.nonIid?.values['Overall / hAssessed']
  return typeof h === 'number' ? `non-IID H_I ${fmt(h)}` : String(ref.nonIid?.values.error ?? '—')
}

export const ComparisonRows: FC<{ manifest: DeviceManifest; device: string }> = ({
  manifest,
  device,
}) => {
  const rows = manifest.comparisonOnly.filter((r) => r.device === device)
  if (!rows.length) return null
  return (
    <details className="glass-panel p-4">
      <summary className="text-sm font-semibold text-foreground cursor-pointer">
        Other conditions for this device — precomputed native results (data not shipped)
      </summary>
      <p className="text-xs text-muted-foreground mt-2">
        Native NIST tool ({manifest.nativeReference.platform}), parity run{' '}
        {manifest.nativeReference.parityRunAt.slice(0, 10)}. These datasets stay in the private
        evidence cache to keep the page small; the values are shown for comparison only.
      </p>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.parityId} className="text-xs">
            <span className="text-foreground font-medium">
              {r.kind} · {r.condition}
            </span>
            {r.source && <span className="text-muted-foreground"> · {r.source}</span>}
            <span className="block font-mono text-foreground">
              {comparisonValue(
                r,
                r.reducedSha256 ? manifest.nativeReference.bySha256[r.reducedSha256] : undefined
              )}
            </span>
            <span className="block text-muted-foreground">{r.note}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}

export const RunScreen: FC<{
  labCase: LabCase
  track: Track
  manifest: DeviceManifest
  seqRun: RunState
  restartRun: RunState
  seqRows: EstimatorRow[]
  seqMin: MinSelection | null
  seqH: number | null
  seqError: string | null
  seqReference: ReferenceComparison | null
  iidPassed: boolean | null
  restartEval: RestartEvaluation | null
  restartReference: ReferenceComparison | null
  restartRows: Array<{ estimator: string; hR: number | null; hC: number | null }>
  referenceRestart: { row: ComparisonOnlyRow; ref: NativeReferenceEntry | undefined } | null
  onRunSeq: () => void
  onCancelSeq: () => void
  onRunRestart: () => void
  onCancelRestart: () => void
  onExport: (which: 'sequential' | 'restart') => void
}> = (p) => {
  const trackLabel = p.track === 'iid' ? 'IID' : 'non-IID'
  const device =
    p.labCase.sequential.kind === 'device'
      ? p.manifest.datasets.find(
          (d) => p.labCase.sequential.kind === 'device' && d.id === p.labCase.sequential.datasetId
        )?.device
      : undefined
  return (
    <div className="space-y-5">
      <section className="glass-panel p-4 space-y-3" aria-labelledby="evl-seq-h">
        <h4 id="evl-seq-h" className="text-sm font-semibold text-foreground">
          Sequential dataset — {trackLabel} track
        </h4>
        <RunControls
          run={p.seqRun}
          label={`Run the ${trackLabel} estimators (NIST tool, WebAssembly)`}
          onRun={p.onRunSeq}
          onCancel={p.onCancelSeq}
          testId="evl-seq"
        />
        {p.seqRun.status === 'error' && p.seqRun.error && <ErrorAlert message={p.seqRun.error} />}
        {p.seqRun.status === 'done' && p.seqRun.record && (
          <div className="space-y-3" data-testid="evl-seq-result">
            {p.seqError ? (
              <Notice tone="error">
                <strong>No entropy awarded.</strong> The tool reported: {p.seqError}
              </Notice>
            ) : (
              <>
                <EstimatorTable
                  rows={p.seqRows}
                  min={p.seqMin}
                  bitsPerSymbol={p.labCase.bitsPerSymbol}
                />
                {p.seqMin && (
                  <p className="text-sm text-foreground" data-testid="evl-seq-min">
                    Most conservative estimate:{' '}
                    <strong className="font-mono">{fmt(p.seqMin.h)}</strong> bits per sample (
                    {p.seqMin.bindingEstimator},{' '}
                    {p.seqMin.bindingKind === 'literal' ? 'on the samples' : 'on the bit string'}
                    ).{' '}
                    {p.seqMin.agreesWithTool ? (
                      <span className="text-status-success">
                        Equals the tool&apos;s own H_assessed.
                      </span>
                    ) : (
                      <span className="text-status-error">
                        Differs from the tool&apos;s H_assessed ({p.seqMin.toolH ?? '—'}).
                      </span>
                    )}
                  </p>
                )}
                {p.track === 'iid' && (
                  <p className="text-sm" data-testid="evl-iid-verdict">
                    IID tests (chi-square, LRS, permutation):{' '}
                    {p.iidPassed ? (
                      <span className="text-status-success">did not reject the IID assumption</span>
                    ) : (
                      <span className="text-status-error">rejected the IID assumption</span>
                    )}
                    .
                  </p>
                )}
              </>
            )}
            <ReferenceBadge
              cmp={p.seqReference}
              note={
                p.track === 'iid'
                  ? 'IID: only the deterministic fields are compared; the permutation test is randomised by the tool.'
                  : undefined
              }
            />
            <RecordPanel
              record={p.seqRun.record}
              onExport={() => p.onExport('sequential')}
              testId="evl-seq-record"
            />
          </div>
        )}
      </section>

      {p.labCase.restart ? (
        <section className="glass-panel p-4 space-y-3" aria-labelledby="evl-restart-h">
          <h4
            id="evl-restart-h"
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <Shuffle size={16} className="text-primary" aria-hidden="true" /> Restart test (SP
            800-90B §3.1.4) — 1000 restarts × 1000 samples
          </h4>
          <p className="text-xs text-muted-foreground">
            Uses H_I from the sequential run. The sanity check compares the most common value in
            every row and column with what H_I predicts; then H_r and H_c must not fall below H_I /
            2.
          </p>
          <RunControls
            run={p.restartRun}
            label="Run the restart test"
            disabled={p.seqH === null}
            onRun={p.onRunRestart}
            onCancel={p.onCancelRestart}
            testId="evl-restart"
          />
          {p.seqH === null && (
            <p className="text-xs text-muted-foreground">
              Run the sequential estimators first; the restart test needs their H_I.
            </p>
          )}
          {p.restartRun.status === 'error' && p.restartRun.error && (
            <ErrorAlert message={p.restartRun.error} />
          )}
          {p.restartRun.status === 'done' && p.restartRun.record && p.restartEval && (
            <div className="space-y-3" data-testid="evl-restart-result">
              <Notice tone={p.restartEval.status === 'passed' ? 'success' : 'error'}>
                <strong>
                  {p.restartEval.status === 'passed'
                    ? 'Restart tests passed.'
                    : p.restartEval.status === 'sanity-check-failed'
                      ? 'Restart sanity check failed — no entropy estimate is awarded.'
                      : p.restartEval.status === 'validation-failed'
                        ? 'Restart validation failed — no entropy estimate is awarded.'
                        : 'The restart run did not complete.'}
                </strong>{' '}
                {p.restartEval.message}
              </Notice>
              {p.restartRows.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b border-border">
                        <th scope="col" className="py-1 pr-2 font-medium">
                          Estimator
                        </th>
                        <th scope="col" className="py-1 pr-2 font-medium text-right">
                          Rows (H_r)
                        </th>
                        <th scope="col" className="py-1 font-medium text-right">
                          Columns (H_c)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.restartRows.map((r) => (
                        <tr key={r.estimator} className="border-b border-border/50">
                          <th
                            scope="row"
                            className="py-1 pr-2 font-normal text-foreground text-left"
                          >
                            {r.estimator}
                          </th>
                          <td className="py-1 pr-2 text-right font-mono text-foreground">
                            {r.hR === null ? '—' : fmt(r.hR)}
                          </td>
                          <td className="py-1 text-right font-mono text-foreground">
                            {r.hC === null ? '—' : fmt(r.hC)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <ReferenceBadge
                cmp={p.restartReference}
                note="The sanity-check cutoff is a Monte-Carlo quantile the tool draws at random, so it is not part of the comparison."
              />
              <RecordPanel
                record={p.restartRun.record}
                onExport={() => p.onExport('restart')}
                testId="evl-restart-record"
              />
            </div>
          )}
        </section>
      ) : (
        p.labCase.provenance === 'device-raw-noise' && (
          <section className="glass-panel p-4 space-y-2" data-testid="evl-no-restart">
            <h4 className="text-sm font-semibold text-foreground">No restart matrix in the lab</h4>
            <p className="text-xs text-muted-foreground">
              The restart matrix for this device was recorded but not published here (size budget).
              Without a restart test, the sequential result is an initial estimate only.
            </p>
            {p.referenceRestart && (
              <p className="text-xs text-foreground">
                Precomputed native reference result for the unpublished matrix (comparison only):{' '}
                <span className="font-mono">
                  {comparisonValue(p.referenceRestart.row, p.referenceRestart.ref)}
                </span>
              </p>
            )}
          </section>
        )
      )}
      {device && <ComparisonRows manifest={p.manifest} device={device} />}
    </div>
  )
}

// ── Screen 5: health-test cutoffs ────────────────────────────────────────────

export const CutoffsScreen: FC<{
  cutoffs: HealthCutoffs | null
  basis: string
  applied: { rct: TestResult; apt: TestResult } | null
}> = ({ cutoffs, basis, applied }) => {
  if (!cutoffs)
    return (
      <Notice tone="info">
        No entropy estimate is available, so there are no cutoffs to derive. A cutoff for H = 0 is
        meaningless: a source with no assessed entropy has nothing to health-test against.
      </Notice>
    )
  const log2a = -Math.log2(cutoffs.alpha)
  return (
    <div className="space-y-4" data-testid="evl-cutoffs">
      <p className="text-sm text-muted-foreground">
        Based on <strong className="text-foreground">H = {fmt(cutoffs.h)}</strong> bits per sample (
        {basis}), with a false-positive probability α = 2<sup>−{log2a}</sup> per test, the
        probability SP 800-90B §4.4 uses in its examples.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Repetition Count Test (§4.4.1)</p>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="evl-rct">
            C = {cutoffs.rct}
          </p>
          <p className="text-xs text-muted-foreground">
            C = 1 + ⌈−log2(α) / H⌉ = 1 + ⌈{log2a} / {fmt(cutoffs.h)}⌉. A sample repeated C or more
            times in a row signals a failure.
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Adaptive Proportion Test (§4.4.2)</p>
          <p className="text-2xl font-bold text-foreground font-mono" data-testid="evl-apt">
            C = {cutoffs.apt}{' '}
            <span className="text-sm font-normal text-muted-foreground">
              in W = {cutoffs.aptWindow}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Smallest C with Pr(B ≥ C) ≤ α for B ~ Binomial(W, 2<sup>−H</sup>); W = 512 for a
            non-binary source, 1024 for a binary one.
          </p>
        </div>
      </div>
      {applied && (
        <div className="glass-panel p-4 space-y-1">
          <p className="text-xs font-semibold text-foreground">
            Applied offline to this dataset (not the device&apos;s own health test)
          </p>
          <p className="text-xs text-muted-foreground" data-testid="evl-applied-rct">
            RCT: longest run {applied.rct.value} vs C = {applied.rct.threshold} —{' '}
            {applied.rct.passed ? 'no failure signalled' : 'failure signalled'}.
          </p>
          <p className="text-xs text-muted-foreground" data-testid="evl-applied-apt">
            APT: worst window count {applied.apt.value} vs C = {applied.apt.threshold} —{' '}
            {applied.apt.passed ? 'no failure signalled' : 'failure signalled'}.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Screen 6: conclusion ─────────────────────────────────────────────────────

const VERDICT_ORDER: Verdict[] = [
  'estimate-for-dataset',
  'insufficient-evidence',
  'no-entropy-awarded',
  'not-noise-source-evidence',
]

export const ConclusionScreen: FC<{
  conclusion: Conclusion
  chosen: Verdict | null
  check: VerdictCheck | null
  note: string
  onChoose: (v: Verdict) => void
  onNote: (s: string) => void
  onDraft: () => void
  onExport: () => void
}> = ({ conclusion, chosen, check, note, onChoose, onNote, onDraft, onExport }) => (
  <div className="space-y-4">
    <fieldset className="glass-panel p-4 space-y-2">
      <legend className="text-sm font-semibold text-foreground px-1">
        Which conclusion does the evidence support?
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {VERDICT_ORDER.map((v) => (
          <Button
            key={v}
            variant={chosen === v ? 'secondary' : 'outline'}
            aria-pressed={chosen === v}
            onClick={() => onChoose(v)}
            className="whitespace-normal h-auto min-h-10 text-left justify-start"
            data-testid={`evl-verdict-${v}`}
          >
            {VERDICT_LABELS[v]}
          </Button>
        ))}
      </div>
      {check && (
        <Notice tone={check.ok ? 'success' : 'error'}>
          <span data-testid="evl-verdict-check">{check.message}</span>
        </Notice>
      )}
    </fieldset>

    {chosen && (
      <div className="glass-panel p-4 space-y-2" data-testid="evl-conclusion">
        <p className="text-xs text-muted-foreground">What the evidence in this lab supports</p>
        <p className="text-base font-semibold text-foreground" data-testid="evl-allowed-verdict">
          {VERDICT_LABELS[conclusion.verdict]}
          {conclusion.h !== null && ` — ${fmt(conclusion.h)} bits per sample`}
        </p>
        <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
          {conclusion.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {conclusion.limits.length > 0 && (
          <>
            <p className="text-xs font-semibold text-foreground pt-1">Limits</p>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
              {conclusion.limits.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
      </div>
    )}

    <div className="glass-panel p-4 space-y-2">
      <label htmlFor="evl-note" className="text-sm font-semibold text-foreground">
        Your evidence conclusion, with its limits
      </label>
      <Textarea
        id="evl-note"
        rows={5}
        value={note}
        onChange={(e) => onNote(e.target.value)}
        placeholder="e.g. For this dataset under the recorded conditions, the estimators give … This does not show …"
      />
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onDraft} disabled={!chosen}>
          Start from a draft
        </Button>
        <Button variant="gradient" size="sm" onClick={onExport} data-testid="evl-export-evidence">
          <Download size={14} className="mr-1" aria-hidden="true" /> Export evidence (JSON)
        </Button>
      </div>
    </div>

    <EsvReference />
  </div>
)

export const EsvReference: FC = () => (
  <section className="glass-panel p-4 space-y-3" aria-labelledby="evl-esv-h" data-testid="evl-esv">
    <h4 id="evl-esv-h" className="text-sm font-semibold text-foreground">
      Reference: public CMVP Entropy Validation Certificates for CPU-jitter noise sources
    </h4>
    <p className="text-xs text-muted-foreground">
      What a validated result looks like: a vendor analysis, an accredited lab&apos;s testing and a
      CMVP review, for the listed operating environments only. None of the devices in this lab is on
      these certificates, and nothing here is comparable to one.
    </p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {ESV_CERTIFICATES.map((c) => (
        <article key={c.number} className="rounded-lg border border-border p-3 space-y-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {c.number} · {c.implementation}
          </p>
          <p className="text-xs text-muted-foreground">
            {c.vendor} · version {c.version} · {c.standard}
          </p>
          <p className="text-xs text-foreground">
            Noise source classification: <strong>{c.noiseSourceClassification}</strong>
          </p>
          <p className="text-xs text-muted-foreground">Listed: {c.listedOutput}</p>
          <p className="text-xs text-muted-foreground">
            Validation dates: {c.validationDates.join(', ')} · Lab: {c.lab}
          </p>
          <p className="text-xs text-muted-foreground">
            {c.operatingEnvironments.length} operating environments listed, e.g.{' '}
            {c.operatingEnvironments[0]}
          </p>
          <p className="text-xs flex flex-wrap gap-x-3">
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-0.5"
            >
              Certificate <ExternalLink size={12} aria-hidden="true" />
            </a>
            <a
              href={c.publicUseDocument}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-0.5"
            >
              Public Use Document <ExternalLink size={12} aria-hidden="true" />
            </a>
          </p>
          <p className="text-xs text-muted-foreground">Page checked {c.checked}.</p>
        </article>
      ))}
    </div>
    <p className="text-xs text-muted-foreground">
      Estimator: NIST SP800-90B_EntropyAssessment commit{' '}
      <Mono>{NIST_90B_TOOL_COMMIT.slice(0, 12)}</Mono>.
    </p>
  </section>
)
