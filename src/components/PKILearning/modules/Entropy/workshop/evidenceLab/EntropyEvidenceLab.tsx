// SPDX-License-Identifier: GPL-3.0-only
/**
 * Workshop step "Entropy Evidence Lab (SP 800-90B)" — plan §4, Slice 1.
 *
 * The learner picks a dataset (our own device recordings, a getrandom()
 * contrast set, or a synthetic failure case), reads its sample unit and
 * collection conditions, chooses the IID or non-IID track, runs the NIST
 * SP 800-90B tool (compiled to WebAssembly, in a Web Worker) including the
 * restart test, takes the most conservative estimate, derives the RCT/APT
 * cutoffs it implies, and writes a conclusion that may end in "insufficient
 * evidence". Every screen carries a "what this proves / does not prove" panel.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { ChevronLeft, ChevronRight, Microscope } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { runSp80090b } from '@/wasm/entropy90b/estimatorClient'
import type { DatasetProvenance } from '@/wasm/entropy90b/resultRecord'
import { adaptiveProportionTest, repetitionCountTest } from '../../utils/entropyTests'
import {
  buildLabCases,
  d4Spec,
  deviceDataset,
  loadData,
  loadDeviceManifest,
  type DataRef,
  type DeviceManifest,
  type LabCase,
  type LoadedData,
} from './evidenceLabData'
import {
  checkLearnerVerdict,
  compareWithReference,
  concludeEvidence,
  estimatorRows,
  evaluateRestart,
  flattenToolJson,
  fmt,
  healthCutoffs,
  iidTestsPassed,
  selectMinimum,
  toolAssessed,
  VERDICT_LABELS,
  type Track,
  type Verdict,
} from './evidenceLabLogic'
import {
  ConclusionScreen,
  ConditionsScreen,
  CutoffsScreen,
  DatasetScreen,
  Notice,
  RunScreen,
  TrackScreen,
} from './EvidenceLabScreens'
import { ProvesPanel } from './ProvesPanel'
import { IDLE_RUN, type RunState } from './runState'

const SCREENS: Array<{ title: string; proves: string[]; doesNotProve: string[] }> = [
  {
    title: 'Dataset',
    proves: [
      'Which kind of data you are about to assess: raw noise-source samples, generator output, or synthetic data.',
    ],
    doesNotProve: [
      'That any dataset is good or bad — nothing has been measured yet.',
      'That one recording stands for a device in general: each dataset is one recording under one condition.',
    ],
  },
  {
    title: 'Sample & conditions',
    proves: [
      'What was recorded, how, when and in which operating environment, and the SHA-256 that ties the published bytes to that recording.',
      'How each 64-bit time delta became one of at most 256 symbols (mask FF), so the unit of the estimate is clear.',
    ],
    doesNotProve: [
      "That one recorded condition covers the device's operating range.",
      'That the kept bits carry 8 bits of entropy: after reducing to m bits, at most m bits per sample can be credited (SP 800-90B §6.4).',
    ],
  },
  {
    title: 'Track',
    proves: [
      'Which estimator set applies, and that an IID claim needs a design rationale plus passing IID tests (SP 800-90B §3.1.2).',
    ],
    doesNotProve: [
      'That data is IID because it looks random. Not rejecting the IID assumption is not proof of independence.',
    ],
  },
  {
    title: 'Run estimators',
    proves: [
      'What the NIST SP 800-90B tool (pinned upstream commit, compiled to WebAssembly) outputs for exactly these bytes — and, where a native result is pinned, that the output is bit-identical to it.',
      'Whether the restart data behaves like the single long run (SP 800-90B §3.1.4).',
    ],
    doesNotProve: [
      'That a source is validated or certified. A tool run is not an ESV submission, a lab analysis or a CMVP review.',
      'Anything about a noise source when the input is conditioned/DRBG output or synthetic data.',
    ],
  },
  {
    title: 'Health-test cutoffs',
    proves: [
      'The RCT and APT cutoffs this estimate implies at α = 2⁻²⁰ (SP 800-90B §4.4.1, §4.4.2).',
    ],
    doesNotProve: [
      'That the device runs these health tests, or that they catch every failure — the RCT is designed for catastrophic failures only (§4.4.1).',
      "Applying the cutoffs to a stored file offline is not the device's continuous health test.",
    ],
  },
  {
    title: 'Conclusion',
    proves: [
      'The strongest statement this dataset supports under its recorded conditions — or that it supports none.',
    ],
    doesNotProve: [
      'A min-entropy claim about the device, other units, other conditions or other operating environments.',
      'Anything a certificate would: ESV, CSTL analysis, CMVP review and an Entropy Validation Certificate are separate steps.',
    ],
  },
]

function provenanceOf(c: LabCase): DatasetProvenance {
  return c.provenance === 'synthetic' ? 'synthetic' : c.provenance
}

function refId(ref: DataRef): string {
  return ref.kind === 'device' ? ref.datasetId : ref.d4Id
}

function downloadJson(name: string, obj: unknown) {
  if (typeof URL.createObjectURL !== 'function') return
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function distinct(bytes: Uint8Array): number {
  const seen = new Uint8Array(256)
  let n = 0
  for (let i = 0; i < bytes.length; i++) {
    if (!seen[bytes[i]]) {
      seen[bytes[i]] = 1
      n++
    }
  }
  return n
}

export const EntropyEvidenceLab: FC = () => {
  const [manifest, setManifest] = useState<DeviceManifest | null>(null)
  const [manifestError, setManifestError] = useState<string | null>(null)
  const [screen, setScreen] = useState(0)
  const [caseId, setCaseId] = useState<string | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [seqData, setSeqData] = useState<LoadedData | null>(null)
  const [dataError, setDataError] = useState<string | null>(null)
  const [seqRun, setSeqRun] = useState<RunState>(IDLE_RUN)
  const [restartRun, setRestartRun] = useState<RunState>(IDLE_RUN)
  const [chosen, setChosen] = useState<Verdict | null>(null)
  const [note, setNote] = useState('')
  const seqAbort = useRef<AbortController | null>(null)
  const restartAbort = useRef<AbortController | null>(null)
  const loadToken = useRef(0)

  useEffect(() => {
    let live = true
    loadDeviceManifest()
      .then((m) => live && setManifest(m))
      .catch((e: unknown) => live && setManifestError(e instanceof Error ? e.message : String(e)))
    return () => {
      live = false
      seqAbort.current?.abort()
      restartAbort.current?.abort()
    }
  }, [])

  const cases = useMemo(() => (manifest ? buildLabCases(manifest) : []), [manifest])
  const labCase = cases.find((c) => c.id === caseId) ?? null

  // Elapsed-time ticker for whichever run is in progress.
  const seqStart = useRef(0)
  const restartStart = useRef(0)
  const anyRunning = seqRun.status === 'running' || restartRun.status === 'running'
  useEffect(() => {
    if (!anyRunning) return
    const t = setInterval(() => {
      const now = performance.now()
      setSeqRun((r) => (r.status === 'running' ? { ...r, elapsedMs: now - seqStart.current } : r))
      setRestartRun((r) =>
        r.status === 'running' ? { ...r, elapsedMs: now - restartStart.current } : r
      )
    }, 250)
    return () => clearInterval(t)
  }, [anyRunning])

  const resetRuns = useCallback(() => {
    seqAbort.current?.abort()
    restartAbort.current?.abort()
    setSeqRun(IDLE_RUN)
    setRestartRun(IDLE_RUN)
    setChosen(null)
  }, [])

  const selectCase = useCallback(
    (id: string) => {
      if (id === caseId || !manifest) return
      resetRuns()
      setCaseId(id)
      setSeqData(null)
      setDataError(null)
      const c = buildLabCases(manifest).find((x) => x.id === id)
      if (!c) return
      const token = ++loadToken.current
      loadData(c.sequential, manifest)
        .then((d) => token === loadToken.current && setSeqData(d))
        .catch(
          (e: unknown) =>
            token === loadToken.current && setDataError(e instanceof Error ? e.message : String(e))
        )
    },
    [caseId, manifest, resetRuns]
  )

  const chooseTrack = useCallback(
    (t: Track) => {
      if (t === track) return
      resetRuns()
      setTrack(t)
    },
    [track, resetRuns]
  )

  const runSeq = useCallback(async () => {
    if (!labCase || !manifest || !track) return
    const ac = new AbortController()
    seqAbort.current = ac
    restartAbort.current?.abort()
    setRestartRun(IDLE_RUN)
    setChosen(null)
    setSeqRun({ ...IDLE_RUN, status: 'loading' })
    try {
      const data = seqData ?? (await loadData(labCase.sequential, manifest))
      if (!seqData) setSeqData(data)
      if (ac.signal.aborted) return
      seqStart.current = performance.now()
      setSeqRun({ ...IDLE_RUN, status: 'running' })
      const { record } = await runSp80090b(
        {
          tool: track === 'iid' ? 'iid' : 'non_iid',
          data: data.bytes,
          bitsPerSymbol: labCase.bitsPerSymbol,
          provenance: provenanceOf(labCase),
          manifestId: refId(labCase.sequential),
        },
        {
          signal: ac.signal,
          onProgress: (stage) =>
            setSeqRun((r) => ({
              ...r,
              stage,
              stagesSeen: r.stagesSeen.includes(stage) ? r.stagesSeen : [...r.stagesSeen, stage],
            })),
        }
      )
      setSeqRun((r) => ({
        ...r,
        status: 'done',
        record,
        elapsedMs: performance.now() - seqStart.current,
      }))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setSeqRun((r) => ({ ...r, status: 'cancelled' }))
        return
      }
      setSeqRun((r) => ({
        ...r,
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      }))
    }
  }, [labCase, manifest, track, seqData])

  // ── Derived: sequential ────────────────────────────────────────────────────
  const seqRecord = seqRun.status === 'done' ? seqRun.record : null
  const seqFlat = useMemo(() => flattenToolJson(seqRecord?.toolJson ?? null), [seqRecord])
  const seqError =
    seqRecord && (seqRecord.toolJson === null || seqRecord.toolJson.errorLevel !== 0)
      ? String(seqFlat.error ?? 'the tool wrote no result')
      : null
  const seqRows = useMemo(
    () => (labCase ? estimatorRows(seqFlat, labCase.bitsPerSymbol) : []),
    [seqFlat, labCase]
  )
  const seqMin = useMemo(
    () => (seqRecord && !seqError ? selectMinimum(seqRows, toolAssessed(seqFlat)) : null),
    [seqRecord, seqError, seqRows, seqFlat]
  )
  const seqH = seqMin?.h ?? null
  const iidPassed = track === 'iid' && seqRecord ? iidTestsPassed(seqFlat) : null
  const seqRefEntry =
    seqRecord && manifest ? manifest.nativeReference.bySha256[seqRecord.dataset.sha256] : undefined
  const seqRefValues = track === 'iid' ? seqRefEntry?.iid?.values : seqRefEntry?.nonIid?.values
  const seqReference = useMemo(
    () => (seqRecord && seqRefValues ? compareWithReference(seqFlat, seqRefValues) : null),
    [seqRecord, seqRefValues, seqFlat]
  )

  const runRestart = useCallback(async () => {
    if (!labCase?.restart || !manifest || !track || seqH === null) return
    const ac = new AbortController()
    restartAbort.current = ac
    setChosen(null)
    setRestartRun({ ...IDLE_RUN, status: 'loading' })
    try {
      const data = await loadData(labCase.restart, manifest)
      if (ac.signal.aborted) return
      if (data.expectedSha256 && data.expectedSha256 !== data.sha256)
        throw new Error('The restart matrix does not match its pinned SHA-256.')
      restartStart.current = performance.now()
      setRestartRun({ ...IDLE_RUN, status: 'running' })
      const { record } = await runSp80090b(
        {
          tool: 'restart',
          data: data.bytes,
          bitsPerSymbol: labCase.bitsPerSymbol,
          hI: seqH,
          trackFlag: track === 'iid' ? '-i' : '-n',
          provenance: provenanceOf(labCase),
          manifestId: refId(labCase.restart),
        },
        {
          signal: ac.signal,
          onProgress: (stage) =>
            setRestartRun((r) => ({
              ...r,
              stage,
              stagesSeen: r.stagesSeen.includes(stage) ? r.stagesSeen : [...r.stagesSeen, stage],
            })),
        }
      )
      setRestartRun((r) => ({
        ...r,
        status: 'done',
        record,
        elapsedMs: performance.now() - restartStart.current,
      }))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setRestartRun((r) => ({ ...r, status: 'cancelled' }))
        return
      }
      setRestartRun((r) => ({
        ...r,
        status: 'error',
        error: e instanceof Error ? e.message : String(e),
      }))
    }
  }, [labCase, manifest, track, seqH])

  // ── Derived: restart ───────────────────────────────────────────────────────
  const restartRecord = restartRun.status === 'done' ? restartRun.record : null
  const restartEval = useMemo(
    () => (restartRecord && seqH !== null ? evaluateRestart(restartRecord.toolJson, seqH) : null),
    [restartRecord, seqH]
  )
  const restartFlat = useMemo(
    () => flattenToolJson(restartRecord?.toolJson ?? null),
    [restartRecord]
  )
  const restartRows = useMemo(() => {
    const names: string[] = []
    for (const k of Object.keys(restartFlat)) {
      const m = /^(.*) \/ h_[rc]$/.exec(k)
      if (m && m[1] !== 'Overall' && !names.includes(m[1])) names.push(m[1])
    }
    const n = (v: unknown) => (typeof v === 'number' ? v : null)
    return names.map((e) => ({
      estimator: e,
      hR: n(restartFlat[`${e} / h_r`]),
      hC: n(restartFlat[`${e} / h_c`]),
    }))
  }, [restartFlat])
  const restartRefEntry =
    restartRecord && manifest
      ? manifest.nativeReference.bySha256[restartRecord.dataset.sha256]?.restart
      : undefined
  const restartReference = useMemo(
    () =>
      restartRecord && restartRefEntry && seqH !== null && Object.is(restartRefEntry.hI, seqH)
        ? compareWithReference(restartFlat, restartRefEntry.values)
        : null,
    [restartRecord, restartRefEntry, seqH, restartFlat]
  )
  const referenceRestart = useMemo(() => {
    if (!manifest || !labCase?.referenceRestartParityId) return null
    const row = manifest.comparisonOnly.find((r) => r.parityId === labCase.referenceRestartParityId)
    if (!row) return null
    return {
      row,
      ref: row.reducedSha256 ? manifest.nativeReference.bySha256[row.reducedSha256] : undefined,
    }
  }, [manifest, labCase])

  // ── Derived: conclusion and cutoffs ────────────────────────────────────────
  const conclusion = useMemo(
    () =>
      labCase
        ? concludeEvidence({
            provenance: labCase.provenance,
            syntheticConditioned: labCase.syntheticConditioned,
            track: track ?? 'non-iid',
            sequential: {
              status: !seqRecord ? 'not-run' : seqError ? 'error' : 'ok',
              h: seqH,
              errorMessage: seqError ?? undefined,
              hashConfirmed: !!seqRecord?.datasetHashConfirmedByTool,
              iidTestsPassed: iidPassed,
            },
            restartAvailable: !!labCase.restart,
            restart: restartEval,
          })
        : null,
    [labCase, track, seqRecord, seqError, seqH, iidPassed, restartEval]
  )

  const isOutputData =
    labCase?.provenance === 'conditioned-output-contrast' || !!labCase?.syntheticConditioned
  const cutoffBasis = useMemo(() => {
    if (conclusion?.verdict === 'estimate-for-dataset' && conclusion.h !== null)
      return { h: conclusion.h, basis: 'min(H_r, H_c, H_I) after the restart tests passed' }
    if (seqH === null || isOutputData) return null
    return {
      h: seqH,
      basis:
        labCase?.provenance === 'synthetic'
          ? 'the estimate for this synthetic file — a teaching figure, not a noise-source estimate'
          : 'the initial estimate H_I only — the restart tests have not passed, so no estimate stands yet',
    }
  }, [conclusion, seqH, isOutputData, labCase])
  const bits = labCase?.bitsPerSymbol ?? 8
  const cutoffs = useMemo(
    () => (cutoffBasis ? healthCutoffs(cutoffBasis.h, bits) : null),
    [cutoffBasis, bits]
  )
  const applied = useMemo(() => {
    if (!cutoffs || !seqData || !labCase) return null
    return {
      rct: repetitionCountTest(seqData.bytes, cutoffs.h, cutoffs.alpha),
      apt: adaptiveProportionTest(
        seqData.bytes,
        cutoffs.h,
        cutoffs.alpha,
        labCase.bitsPerSymbol === 1
      ),
    }
  }, [cutoffs, seqData, labCase])

  const verdictCheck = chosen && conclusion ? checkLearnerVerdict(chosen, conclusion.verdict) : null

  const exportRecord = (which: 'sequential' | 'restart') => {
    const rec = which === 'sequential' ? seqRecord : restartRecord
    if (rec) downloadJson(`sp800-90b-${which}-${rec.dataset.sha256.slice(0, 12)}.json`, rec)
  }

  const exportEvidence = () => {
    if (!labCase || !manifest) return
    const datasetInfo = (ref: DataRef | undefined) => {
      if (!ref) return null
      if (ref.kind === 'device') return deviceDataset(manifest, ref.datasetId)
      const spec = d4Spec(ref.d4Id)
      return {
        id: spec.id,
        kind: spec.kind,
        bitsPerSymbol: spec.bitsPerSymbol,
        provenance: spec.provenance,
        generator: spec.generator,
        seed: spec.seed,
        parameters: spec.parameters,
        teachingNote: spec.teachingNote,
      }
    }
    downloadJson(`entropy-evidence-${labCase.id}.json`, {
      schema: 'pqctoday.entropy.evidence-lab-export/1',
      notice:
        'Estimator output for this dataset under the recorded conditions. Not an ESV submission, lab analysis, CMVP review or certificate. The tool output is NIST SP800-90B_EntropyAssessment JSON, not an ESV format.',
      exportedAt: new Date().toISOString(),
      case: { id: labCase.id, title: labCase.title, provenance: labCase.provenance },
      datasets: {
        sequential: datasetInfo(labCase.sequential),
        restart: datasetInfo(labCase.restart),
      },
      track,
      sequential: seqRecord,
      estimatorMinimum: seqMin,
      nativeReferenceComparison: { sequential: seqReference, restart: restartReference },
      restart: restartRecord,
      restartEvaluation: restartEval,
      healthCutoffs: cutoffs ? { ...cutoffs, basis: cutoffBasis?.basis } : null,
      conclusion,
      learner: { verdict: chosen, check: verdictCheck, note },
    })
  }

  const draftNote = () => {
    if (!conclusion) return
    const head =
      conclusion.h !== null
        ? `For this dataset under its recorded conditions, the SP 800-90B estimators give ${fmt(conclusion.h)} bits per sample (${VERDICT_LABELS[conclusion.verdict]}).`
        : `${VERDICT_LABELS[conclusion.verdict]}.`
    setNote(
      [head, ...conclusion.reasons, ...conclusion.limits.map((l) => `Limit: ${l}`)].join('\n')
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  const canNext = screen === 0 ? !!labCase : screen === 2 ? !!track : true
  const canGo = (i: number) => i === 0 || (!!labCase && (i <= 2 || !!track))
  const s = SCREENS[screen]

  const seqDataset =
    labCase?.sequential.kind === 'device' && manifest
      ? deviceDataset(manifest, labCase.sequential.datasetId)
      : null
  const restartDataset =
    labCase?.restart?.kind === 'device' && manifest
      ? deviceDataset(manifest, labCase.restart.datasetId)
      : null

  return (
    <div className="space-y-5" data-testid="entropy-evidence-lab">
      <header className="space-y-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Microscope size={20} className="text-primary" aria-hidden="true" />
          Entropy Evidence Lab (SP 800-90B)
        </h3>
        <p className="text-sm text-muted-foreground">
          Assess real CPU-jitter recordings from a KV260, an i.MX 95 and a Mac with the NIST SP
          800-90B estimator tool, compiled to WebAssembly and run in your browser. Every result is
          estimator output for one dataset under its recorded conditions — nothing here validates or
          certifies a device.
        </p>
      </header>

      <nav aria-label="Evidence lab steps">
        <ol className="flex flex-wrap gap-1.5">
          {SCREENS.map((sc, i) => (
            <li key={sc.title}>
              <Button
                variant={i === screen ? 'secondary' : 'ghost'}
                size="sm"
                aria-current={i === screen ? 'step' : undefined}
                disabled={!canGo(i)}
                onClick={() => setScreen(i)}
                className="text-xs"
              >
                {i + 1}. {sc.title}
              </Button>
            </li>
          ))}
        </ol>
      </nav>

      {manifestError && <ErrorAlert message={manifestError} />}
      {!manifest && !manifestError && (
        <p className="text-sm text-muted-foreground" role="status">
          Loading the dataset manifest…
        </p>
      )}

      {manifest && (
        <section aria-labelledby="evl-screen-title" className="space-y-4">
          <h4 id="evl-screen-title" className="text-base font-semibold text-foreground">
            {screen + 1}. {s.title}
            {labCase && screen > 0 && (
              <span className="block text-xs font-normal text-muted-foreground">
                {labCase.title}
              </span>
            )}
          </h4>

          {screen === 0 && (
            <DatasetScreen cases={cases} selectedId={caseId} onSelect={selectCase} />
          )}
          {screen === 1 && labCase && (
            <ConditionsScreen
              labCase={labCase}
              manifest={manifest}
              seqDataset={seqDataset}
              restartDataset={restartDataset}
              data={seqData}
              dataError={dataError}
              distinctSymbols={seqData ? distinct(seqData.bytes) : null}
            />
          )}
          {screen === 2 && labCase && (
            <TrackScreen labCase={labCase} track={track} onChoose={chooseTrack} />
          )}
          {screen === 3 && labCase && track && (
            <RunScreen
              labCase={labCase}
              track={track}
              manifest={manifest}
              seqRun={seqRun}
              restartRun={restartRun}
              seqRows={seqRows}
              seqMin={seqMin}
              seqH={seqH}
              seqError={seqError}
              seqReference={seqReference}
              iidPassed={iidPassed}
              restartEval={restartEval}
              restartReference={restartReference}
              restartRows={restartRows}
              referenceRestart={referenceRestart}
              onRunSeq={runSeq}
              onCancelSeq={() => seqAbort.current?.abort()}
              onRunRestart={runRestart}
              onCancelRestart={() => restartAbort.current?.abort()}
              onExport={exportRecord}
            />
          )}
          {screen === 4 && labCase && (
            <>
              {isOutputData ? (
                <Notice tone="warning">
                  Health tests run on the raw noise-source samples (SP 800-90B §4.4). Cutoffs
                  derived from an estimate of conditioned output would be applied to the wrong
                  stream, so none are derived for this dataset.
                </Notice>
              ) : (
                <CutoffsScreen
                  cutoffs={cutoffs}
                  basis={cutoffBasis?.basis ?? ''}
                  applied={applied}
                />
              )}
            </>
          )}
          {screen === 5 && labCase && conclusion && (
            <ConclusionScreen
              conclusion={conclusion}
              chosen={chosen}
              check={verdictCheck}
              note={note}
              onChoose={setChosen}
              onNote={setNote}
              onDraft={draftNote}
              onExport={exportEvidence}
            />
          )}

          <ProvesPanel proves={s.proves} doesNotProve={s.doesNotProve} />

          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => setScreen((i) => Math.max(0, i - 1))}
              disabled={screen === 0}
            >
              <ChevronLeft size={16} className="mr-1" aria-hidden="true" /> Back
            </Button>
            {screen < SCREENS.length - 1 && (
              <Button
                variant="gradient"
                onClick={() => setScreen((i) => i + 1)}
                disabled={!canNext}
                data-testid="evl-next"
              >
                Next: {SCREENS[screen + 1].title}
                <ChevronRight size={16} className="ml-1" aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
