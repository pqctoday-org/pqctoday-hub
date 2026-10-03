// SPDX-License-Identifier: GPL-3.0-only
import React, { useEffect, useState } from 'react'
import { motion, MotionConfig } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  StepBack,
  StepForward,
  Info,
  Database,
  HardDrive,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DATA_STATE_LABELS,
  ENGINE_STATUS_LABELS,
  FHE_HSM_FLOWS,
  FLOW_STEP_META,
  LINK_LABELS,
  PHASE_LABELS,
  ZONE_LABELS,
  engineStatusOf,
  type DataState,
  type EngineStatus,
  type Phase,
  type TrustZone,
  type FheFlow,
  type FheFlowId,
  type FlowStep,
  type LinkKind,
  type StepVerdict,
} from '../data/fheHsmFlows'
import {
  FHE_STEP_COSTS,
  FHE_STEP_KEYS,
  KEY_SIZES,
  LINK_SIZES,
  RSA2048_PAIR_BYTES,
  SIZE_BASIS,
  type KeyId,
  type StepCost,
} from '../data/fheHsmCosts'
import { FHE_STEP_IO } from '../data/fheHsmStepIO'
import { EVIDENCE_MANIFEST, validationsFor } from '@/data/fhe/fheEvidence'
import { FheStepDetailModal } from './FheStepDetailModal'
import {
  HOLD_STATUS,
  exposedCount,
  holdingColumns,
  holdingsAt,
  maxHoldings,
  type HoldStatus,
} from './fheHoldings'

interface FheHsmFlowsProps {
  initialFlowId?: FheFlowId
}

const AUTOPLAY_MS = 2600

/** Workshop step: step-through sequence diagrams of the four FHE × HSM usage patterns. */
export const FheHsmFlows: React.FC<FheHsmFlowsProps> = ({ initialFlowId }) => {
  const [idx, setIdx] = useState(() => {
    const found = FHE_HSM_FLOWS.findIndex((f) => f.id === initialFlowId)
    return found >= 0 ? found : 0
  })
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [overlay, setOverlay] = useState(true)
  const [pqcFixed, setPqcFixed] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [persisted, setPersisted] = useState(true)
  const [shared, setShared] = useState(false)

  const flow = FHE_HSM_FLOWS[idx] // eslint-disable-line security/detect-object-injection
  const last = flow.steps.length - 1
  const current = flow.steps[step] // eslint-disable-line security/detect-object-injection

  // Playback stops by itself on the last step — derived, not stored.
  const isPlaying = playing && step < last

  useEffect(() => {
    if (!isPlaying) return
    const t = setTimeout(() => setStep((s) => Math.min(last, s + 1)), AUTOPLAY_MS)
    return () => clearTimeout(t)
  }, [isPlaying, step, last])

  const selectFlow = (i: number) => {
    setIdx(i)
    setStep(0)
    setPlaying(false)
  }

  const exposed = flow.steps.filter((s) => s.link && LINK_LABELS[s.link].threat).length
  const canShare = flow.steps.some((s) => s.shareWith)
  const costs = FHE_STEP_COSTS[flow.id]
  const stepKeys = FHE_STEP_KEYS[flow.id][step] ?? [] // eslint-disable-line security/detect-object-injection
  const goTo = (i: number) => {
    setStep(i)
    setPlaying(false)
  }
  /** Clicking any step selects it and opens its Input → Computation → Output modal. */
  const openDetail = (i: number) => {
    goTo(i)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Scenario selector */}
      <div className="glass-panel p-3">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {FHE_HSM_FLOWS.map((f, i) => (
            <Button
              key={f.id}
              variant="ghost"
              size="tile"
              onClick={() => selectFlow(i)}
              className={`rounded-md border p-2 text-left transition-colors h-auto block ${
                i === idx
                  ? `${f.borderClass} ${f.bgClass}`
                  : 'border-border bg-card/40 hover:bg-card'
              }`}
            >
              <div
                className={`text-xs sm:text-sm font-bold ${i === idx ? f.colorClass : 'text-foreground'}`}
              >
                {f.label}
              </div>
              <div className="hidden sm:block text-[10px] text-muted-foreground mt-0.5 font-mono">
                {f.tileHint}
              </div>
            </Button>
          ))}
        </div>
      </div>

      <div className={`glass-panel p-3 sm:p-5 space-y-4 border ${flow.borderClass}`}>
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h3 className={`text-lg sm:text-xl font-bold ${flow.colorClass}`}>{flow.label}</h3>
          <span className="text-xs text-muted-foreground italic">{flow.tagline}</span>
        </div>

        {flow.scaling && (
          <div
            className={`rounded-lg border p-3 text-xs leading-relaxed flex gap-2 ${
              flow.scaling.verdict === 'scales'
                ? 'border-success/40 bg-success/10'
                : 'border-destructive/40 bg-destructive/10'
            }`}
          >
            {flow.scaling.verdict === 'scales' ? (
              <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert size={16} className="text-status-error shrink-0 mt-0.5" />
            )}
            <p className="text-foreground/85">
              <span
                className={`font-bold ${
                  flow.scaling.verdict === 'scales' ? 'text-status-success' : 'text-status-error'
                }`}
              >
                {flow.scaling.verdict === 'scales'
                  ? 'Scales on an HSM. '
                  : 'Does not scale on an HSM. '}
              </span>
              {flow.scaling.note}
            </p>
          </div>
        )}

        <BaselineBox flow={flow} />

        <LaymanPanel flow={flow} />

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep(0)
                setPlaying(false)
              }}
              aria-label="Restart"
            >
              <RotateCcw size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label="Previous step"
            >
              <StepBack size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (isPlaying) {
                  setPlaying(false)
                  return
                }
                if (step >= last) setStep(0)
                setPlaying(true)
              }}
              className="gap-1 sm:min-w-[84px]"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Play'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => Math.min(last, s + 1))}
              disabled={step === last}
              aria-label="Next step"
            >
              <StepForward size={14} />
            </Button>
            <span className="text-xs text-muted-foreground ml-1 sm:ml-2 font-mono">
              {step + 1}/{flow.steps.length}
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant={overlay ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setOverlay((o) => !o)}
              aria-pressed={overlay}
              className="gap-1 text-xs"
            >
              <ShieldAlert size={14} className={overlay ? 'text-status-error' : ''} />
              <span className="hidden sm:inline">Quantum overlay</span>
              <span className="sm:hidden">Quantum</span>
            </Button>
            <Button
              variant={pqcFixed ? 'outline' : 'ghost'}
              size="sm"
              onClick={() => setPqcFixed((f) => !f)}
              aria-pressed={pqcFixed}
              disabled={!overlay}
              className="gap-1 text-xs"
            >
              <ShieldCheck size={14} className={pqcFixed ? 'text-status-success' : ''} />
              <span className="hidden sm:inline">Apply PQC fixes</span>
              <span className="sm:hidden">PQC fix</span>
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 -mt-2">
          <span className="text-[11px] text-muted-foreground mr-1">Clear result goes to:</span>
          <Button
            variant={shared ? 'ghost' : 'outline'}
            size="sm"
            onClick={() => setShared(false)}
            aria-pressed={!shared}
            className="gap-1 text-xs h-7"
          >
            Data owner only
          </Button>
          <Button
            variant={shared ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setShared(true)}
            aria-pressed={shared}
            disabled={!canShare}
            title={
              canShare
                ? undefined
                : 'In this flow the data owner decrypts or fuses the result itself and decides what to share.'
            }
            className="gap-1 text-xs h-7"
          >
            <Share2 size={13} /> Owner + third party
          </Button>
          <Button
            variant={persisted ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setPersisted((v) => !v)}
            aria-pressed={persisted}
            className="gap-1 text-xs h-7 sm:ml-auto"
          >
            {persisted ? <Database size={13} /> : <HardDrive size={13} />}
            {persisted ? 'Third party stores at rest' : 'Third party keeps RAM only'}
          </Button>
        </div>
        {shared && canShare && (
          <p className="text-[11px] text-status-warning -mt-2">
            The data owner’s HSM policy also releases the clear result to the third party. It still
            never sees the data, but a result can leak inputs if the function is too revealing or
            queries are unlimited (e.g. averages over tiny groups), so the policy restricts what, to
            whom and how often.
          </p>
        )}

        {/* Sequence diagram */}
        <div className="rounded-lg border border-border bg-card/40 p-2 sm:p-3 overflow-hidden">
          {/* Swimlane diagram from md up; below that a compact step list so nothing shrinks
              into illegibility or scrolls sideways. */}
          <div className="hidden md:block">
            <SequenceDiagram
              flow={flow}
              costs={costs}
              step={step}
              overlay={overlay}
              pqcFixed={pqcFixed}
              persisted={persisted}
              shared={shared}
              onSelect={openDetail}
            />
          </div>
          <div className="md:hidden">
            <CompactStepList
              flow={flow}
              costs={costs}
              step={step}
              overlay={overlay}
              pqcFixed={pqcFixed}
              persisted={persisted}
              shared={shared}
              onSelect={openDetail}
            />
          </div>
          <HoldingsLegend />
          {overlay && (
            <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1 text-[10px] text-muted-foreground mt-2">
              <LegendSwatch className="bg-primary" label="FHE (lattice, no known quantum break)" />
              {flow.steps.some((s) => s.link === 'stream') && (
                <LegendSwatch
                  className="bg-muted-foreground"
                  label="Symmetric stream cipher (128-bit key)"
                />
              )}
              <LegendSwatch
                className={pqcFixed ? 'bg-success' : 'bg-destructive'}
                label={
                  pqcFixed ? 'Classical link replaced by PQC' : 'Classical link exposed to a CRQC'
                }
              />
              {flow.steps.some((s) => s.verdict === 'ok') && <span>✓ = fits in the HSM</span>}
              {flow.steps.some((s) => s.verdict === 'warn') && (
                <LegendSwatch className="bg-warning" label="Possible in the HSM, streamed" />
              )}
              {flow.steps.some((s) => s.verdict === 'no') && (
                <span>✗ dashed = does not fit in the HSM</span>
              )}
              <span className="w-full sm:w-auto sm:ml-auto font-medium">
                {pqcFixed
                  ? `All ${exposed} classical links migrated`
                  : `${exposed} of ${flow.steps.length} steps rely on quantum-vulnerable crypto`}
              </span>
            </div>
          )}
        </div>

        <StepCaption
          flow={flow}
          step={current}
          cost={costs[step]} // eslint-disable-line security/detect-object-injection
          index={step}
          overlay={overlay}
          pqcFixed={pqcFixed}
          onDetails={() => setDetailOpen(true)}
        />

        <FheStepDetailModal
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          flow={flow}
          index={step}
          io={FHE_STEP_IO[flow.id][step]} // eslint-disable-line security/detect-object-injection
          cost={costs[step]} // eslint-disable-line security/detect-object-injection
          keys={stepKeys}
          overlay={overlay}
          pqcFixed={pqcFixed}
          persisted={persisted}
          shared={shared}
          onNavigate={goTo}
        />

        <KeySizePanel highlighted={stepKeys} />

        <p className="text-[10px] text-muted-foreground leading-snug">
          {`Data, compute and FHE key sizes are order-of-magnitude estimates for ${SIZE_BASIS[flow.id]}. They shift by 10× with parameters, library and hardware. ML-KEM and ML-DSA sizes are exact (FIPS 203 / 204; the ML-KEM private key is counted as its 64 B seed, ML-DSA as the expanded 4,032 B key), as are AES sizes (FIPS 197); RSA sizes are typical DER encodings (RFC 8017).`}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
          <InfoCard title="What the HSM does" body={flow.hsmDoes} />
          <InfoCard title="What stays secret" body={flow.staysSecret} />
          <InfoCard title="Watch out" body={flow.watchOut} />
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => selectFlow(Math.max(0, idx - 1))}
          disabled={idx === 0}
          className="gap-2"
        >
          <ChevronLeft size={14} /> Previous scenario
        </Button>
        <Button
          variant="gradient"
          onClick={() => selectFlow(Math.min(FHE_HSM_FLOWS.length - 1, idx + 1))}
          disabled={idx === FHE_HSM_FLOWS.length - 1}
          className="gap-2"
        >
          Next scenario <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

const LaymanPanel: React.FC<{ flow: FheFlow }> = ({ flow }) => (
  <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 sm:p-4 space-y-2">
    <div className="flex items-center gap-2">
      <Lightbulb size={16} className="text-warning shrink-0" />
      <h4 className="text-sm font-bold text-warning">In plain English</h4>
    </div>
    <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">{flow.layman.analogy}</p>
    <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
      {flow.layman.whatsDifferent}
    </p>
    <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed">
      <span className="font-semibold text-foreground">The catch: </span>
      {flow.layman.catch}
    </p>
  </div>
)

const InfoCard: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <div className="rounded-md border border-border bg-card/40 p-3">
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">
      {title}
    </div>
    <p className="text-xs text-foreground/85 leading-snug">{body}</p>
  </div>
)

const LegendSwatch: React.FC<{ className: string; label: string }> = ({ className, label }) => (
  <span className="inline-flex items-center gap-1">
    <span className={`inline-block w-3 h-1.5 rounded-sm ${className}`} />
    {label}
  </span>
)

const VERDICT_TEXT: Record<StepVerdict, { label: string; cls: string }> = {
  ok: {
    label: 'Fits in the HSM / right place',
    cls: 'text-status-success border-success/40',
  },
  warn: { label: 'Possible, with streaming', cls: 'text-status-warning border-warning/40' },
  no: { label: 'Does not fit', cls: 'text-status-error border-destructive/40' },
}

const StepCaption: React.FC<{
  flow: FheFlow
  step: FlowStep
  cost: StepCost | undefined
  index: number
  overlay: boolean
  pqcFixed: boolean
  onDetails: () => void
}> = ({ flow, step, cost, index, overlay, pqcFixed, onDetails }) => {
  const link = step.link ? LINK_LABELS[step.link] : null
  const wire = step.link ? LINK_SIZES[step.link] : null
  const exposed = overlay && link?.threat && !pqcFixed
  return (
    <div
      className="rounded-lg border border-border bg-muted/40 p-3 sm:p-4 space-y-2"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-mono text-primary font-bold">{index + 1}.</span>
        <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onDetails}
          className="ml-auto gap-1 text-xs h-7"
        >
          <Info size={13} /> Step details
        </Button>
        {step.verdict && (
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${VERDICT_TEXT[step.verdict].cls}`}
          >
            {VERDICT_TEXT[step.verdict].label}
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/85 leading-relaxed">{step.detail}</p>
      <StepRef step={step} />
      <EngineStatusLine flow={flow} step={step} />
      <EvidenceLine flow={flow} step={step} />
      {cost && (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-x-4 gap-y-1 items-start text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-muted-foreground">Data</span>
            <Meter level={cost.dataLevel} className="bg-primary" />
            <span className="font-bold text-foreground">{cost.dataShort}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-muted-foreground">Compute</span>
            <Meter level={cost.computeLevel} className="bg-warning" />
            <span className="font-bold text-foreground">{cost.computeShort}</span>
            <span className="text-muted-foreground">· {cost.where}</span>
          </span>
          <span className="text-muted-foreground sm:col-span-1">{cost.note}</span>
        </div>
      )}
      {overlay && wire && (
        <p className="text-[11px] text-muted-foreground">
          <span className="font-semibold text-foreground">Wire size: </span>
          {pqcFixed ? wire.pqc : wire.classical}
          {!pqcFixed && <> → after migration: {wire.pqc}</>}
        </p>
      )}
      {overlay && link && (
        <div
          className={`text-[11px] rounded border px-2 py-1 inline-flex flex-wrap gap-x-2 ${
            !link.threat
              ? 'border-primary/30 text-primary'
              : exposed
                ? 'border-destructive/40 text-status-error'
                : 'border-success/40 text-status-success'
          }`}
        >
          <span className="font-bold">{pqcFixed ? link.pqc : link.classical}</span>
          {!link.threat && <span>{link.safeNote}</span>}
          {exposed && (
            <span>
              {link.threat}. Fix: {link.pqc}
            </span>
          )}
          {link.threat && pqcFixed && <span>replaces {link.classical}</span>}
        </div>
      )}
    </div>
  )
}

// ── Public baseline + per-step references ────────────────────────────────

/** The implementation and paper every library step in this scenario traces to. */
const BaselineBox: React.FC<{ flow: FheFlow }> = ({ flow }) => (
  <div className="rounded-lg border border-border bg-card/40 p-3 text-[11px] leading-relaxed space-y-0.5">
    <div>
      <span className="font-bold text-foreground">Public baseline: </span>
      <a
        href={flow.baseline.codeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {flow.baseline.implementation}
      </a>
    </div>
    <div>
      <span className="font-bold text-foreground">Paper: </span>
      <a
        href={flow.baseline.paperUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary hover:underline"
      >
        {flow.baseline.paper}
      </a>
    </div>
    <div>
      <span className="font-bold text-foreground">Validation evidence: </span>
      <span className="text-muted-foreground">
        {(() => {
          const n = EVIDENCE_MANIFEST.records.filter((r) => r.scenarioId === flow.id).length
          return n
            ? `${n} signed record(s); each step shows what it covers.`
            : 'none yet. Planned lab runs: the data owner on a Mac (pqctoday-sandbox), the FHE server on a KV260 (pqctoday-fhe, untrusted compute) and the custodian as a software token on an MX95, with an MX95 Pro as backup and second threshold party (pqctoday-cacp); reference libraries in pqctoday-sandbox. None of it is hardware custody.'
        })()}
      </span>
    </div>
    <div>
      <span className="font-bold text-foreground">Validation target: </span>
      <span className="text-foreground/85">{flow.validation.target}</span>{' '}
      <span className="text-muted-foreground">Reference: {flow.validation.reference}.</span>
    </div>
    <div className="text-muted-foreground">
      Steps tagged “deployment choice” place a library call inside an HSM. That placement is ours,
      not part of the library or paper. pqctoday-hsm is a software token and browser emulator, not
      hardware custody; its certificates would use a test manufacturing CA and prove no hardware
      isolation. Each step also shows what pqctoday-hsm (PKCS#11 v3.2 plus vendor mechanisms) can do
      today: no FHE step runs in it yet; the ML-KEM, ML-DSA, HPKE and AES-GCM building blocks do.
    </div>
  </div>
)

const ENGINE_BADGE: Record<EngineStatus, string> = {
  engine: 'border-success/40 bg-success/10 text-status-success',
  planned: 'border-primary/30 bg-primary/5 text-primary',
  refused: 'border-destructive/40 bg-destructive/10 text-status-error',
  outside: 'border-border bg-muted/40 text-muted-foreground',
}

/** Small badge: what the engine can do for this step today. */
export const EngineBadge: React.FC<{ status: EngineStatus }> = ({ status }) => (
  <span
    title={ENGINE_STATUS_LABELS[status].long}
    className={`rounded border px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${ENGINE_BADGE[status]}`}
  >
    {ENGINE_STATUS_LABELS[status].short}
  </span>
)

/**
 * Validation evidence for one step: signed, hash-pinned records from pqctoday-sandbox,
 * pqctoday-fhe (KV260) or pqctoday-cacp (MX95, MX95 Pro). Shows nothing claimed until a
 * record exists; a board run is labelled "software token on <board>", never hardware custody.
 */
export const EvidenceLine: React.FC<{ flow: FheFlow; step: FlowStep }> = ({ flow, step }) => {
  const found = validationsFor(flow.id, step.id)
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-muted-foreground">Validated:</span>
      {found.length === 0 ? (
        <span className="text-muted-foreground">not yet (no signed evidence for this step)</span>
      ) : (
        found.map((v) => (
          <a
            key={v.record.id}
            href={v.record.artifacts[0].url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${v.record.producer} · ${v.record.library.name} ${v.record.library.version} · ${v.record.status} ${v.record.measuredAt} · sha256 ${v.record.artifacts[0].sha256.slice(0, 12)}…`}
            className="rounded border border-success/40 bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-status-success hover:underline"
          >
            {v.label}
          </a>
        ))
      )}
    </div>
  )
}

/** Engine badge plus the step's note on which building blocks exist today. */
export const EngineStatusLine: React.FC<{ flow: FheFlow; step: FlowStep }> = ({ flow, step }) => {
  const status = engineStatusOf(flow, step)
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="text-muted-foreground">pqctoday-hsm:</span>
      <EngineBadge status={status} />
      <span className="text-muted-foreground">
        {step.engineNote ?? ENGINE_STATUS_LABELS[status].long}
      </span>
    </div>
  )
}

/** Library call this step maps to, and whether its HSM placement is a deployment choice. */
export const StepRef: React.FC<{ step: FlowStep }> = ({ step }) =>
  step.api || step.deployment ? (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      {step.api && (
        <code className="rounded border border-border bg-muted/60 px-1.5 py-0.5 font-mono text-foreground">
          {step.api}
        </code>
      )}
      {step.deployment && (
        <span className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-status-warning font-medium">
          deployment choice
        </span>
      )}
    </div>
  ) : null

// ── Cost meters, compact step list, key sizes ─────────────────────────────

/** Four-segment log-scale meter (level 0–4). */
const Meter: React.FC<{ level: number; className: string }> = ({ level, className }) => (
  <span className="inline-flex gap-0.5" aria-hidden="true">
    {[1, 2, 3, 4].map((n) => (
      <span
        key={n}
        className={`inline-block w-1.5 h-2.5 rounded-[1px] ${n <= level ? className : 'bg-muted'}`}
      />
    ))}
  </span>
)

const TONE_ROW: Record<Tone, string> = {
  primary: 'border-l-primary',
  error: 'border-l-destructive',
  success: 'border-l-success',
  warning: 'border-l-warning',
  muted: 'border-l-border',
}
const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary',
  error: 'text-status-error',
  success: 'text-status-success',
  warning: 'text-status-warning',
  muted: 'text-muted-foreground',
}

const STATE_CHIP: Record<DataState, string> = {
  keys: 'border-border bg-muted/40 text-muted-foreground',
  clear: 'border-warning/40 bg-warning/10 text-status-warning',
  encrypting: 'border-primary/40 bg-primary/5 text-primary',
  encrypted: 'border-primary/50 bg-primary/15 text-primary',
  decrypting: 'border-success/40 bg-success/10 text-status-success',
  result: 'border-warning/40 bg-warning/10 text-status-warning',
}

const PHASE_TEXT: Record<Phase, string> = {
  setup: 'text-muted-foreground',
  encrypt: 'text-primary',
  compute: 'text-status-warning',
  decrypt: 'text-status-success',
  backup: 'text-muted-foreground',
}

const ZONE_CHIP: Record<TrustZone, string> = {
  owner: 'border-success/40 bg-success/5 text-status-success',
  third: 'border-destructive/40 bg-destructive/5 text-status-error',
  party: 'border-primary/40 bg-primary/5 text-primary',
}

/** Who holds what at one step, as chips per column: the key map, inline. */
export const HoldingsList: React.FC<{
  flow: FheFlow
  step: number
  persisted: boolean
  shared: boolean
  overlay: boolean
  pqcFixed: boolean
}> = ({ flow, step, persisted, shared, overlay, pqcFixed }) => {
  const holdings = holdingsAt(flow, step, { persisted, shared, overlay, pqcFixed })
  const exposedNow = exposedCount(holdings)
  return (
    <div className="space-y-1">
      <p
        className={`text-[10px] font-medium ${exposedNow ? 'text-status-error' : 'text-status-success'}`}
      >
        {exposedNow
          ? `${exposedNow} secret item(s) are outside an HSM or the data owner’s device.`
          : 'No secret is outside an HSM or the data owner’s device.'}
      </p>
      {holdingColumns(flow).map((c) => {
        const list = holdings[c.id] ?? []
        if (!list.length) return null
        return (
          <div key={c.id} className="flex flex-wrap items-center gap-1 text-[10px]">
            <span className="text-muted-foreground">{c.label}:</span>
            {list.map((h) => (
              <span
                key={h.item}
                title={`${h.label} · ${h.mode}`}
                className={`rounded border px-1 py-px whitespace-nowrap ${HOLD_STATUS[h.status].chip}`}
              >
                {h.isNew ? '● ' : ''}
                {h.short}
                {h.status === 'exposed' || h.status === 'released'
                  ? ` · ${HOLD_STATUS[h.status].tag}`
                  : ''}
              </span>
            ))}
          </div>
        )
      })}
    </div>
  )
}

/** Legend for trust zones and the holding chips. */
const HoldingsLegend: React.FC = () => (
  <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-muted-foreground mt-2">
    {(Object.keys(ZONE_LABELS) as TrustZone[]).map((z) => (
      <span key={z} className={`rounded border px-1 ${ZONE_CHIP[z]}`}>
        {ZONE_LABELS[z]}
      </span>
    ))}
    <span>· chips:</span>
    {(['protected', 'owner', 'exposed', 'public', 'safe', 'released'] as HoldStatus[]).map((st) => (
      <span key={st} className={`rounded border px-1 ${HOLD_STATUS[st].chip}`}>
        {HOLD_STATUS[st].tag}
      </span>
    ))}
    <span>· ● new at this step</span>
  </div>
)

/** Phone layout: one tappable row per step, grouped by phase, instead of the swimlane diagram. */
const CompactStepList: React.FC<{
  flow: FheFlow
  costs: StepCost[]
  step: number
  overlay: boolean
  pqcFixed: boolean
  persisted: boolean
  shared: boolean
  onSelect: (i: number) => void
}> = ({ flow, costs, step, overlay, pqcFixed, persisted, shared, onSelect }) => {
  const name = (id: string) => flow.actors.find((a) => a.id === id)?.label ?? id
  const meta = FLOW_STEP_META[flow.id]
  let phaseNo = 0
  return (
    <ol className="space-y-1" aria-label={`${flow.label} steps`}>
      {flow.steps.map((s, i) => {
        const tone = toneFor(s, overlay, pqcFixed)
        const cost = costs[i] // eslint-disable-line security/detect-object-injection
        const phase = meta.phase[i] // eslint-disable-line security/detect-object-injection
        const st = meta.data[i] // eslint-disable-line security/detect-object-injection
        const newPhase = i === 0 || phase !== meta.phase[i - 1]
        if (newPhase) phaseNo++
        const linkText =
          overlay && s.link
            ? pqcFixed
              ? LINK_LABELS[s.link].pqc
              : LINK_LABELS[s.link].classical
            : null
        const third = shared && s.shareWith ? name(s.shareWith) : null
        return (
          <li key={`${flow.id}-${i}`}>
            {newPhase && (
              <div
                className={`text-[10px] font-bold uppercase tracking-wide pt-1 ${PHASE_TEXT[phase]}`}
              >
                {phaseNo}. {PHASE_LABELS[phase]}
              </div>
            )}
            <Button
              variant="ghost"
              size="tile"
              onClick={() => onSelect(i)}
              aria-current={i === step ? 'step' : undefined}
              className={`w-full h-auto min-h-0 gap-0 block text-left font-normal rounded-md border border-l-4 !px-2 !py-1 transition-opacity ${TONE_ROW[tone]} ${
                i === step
                  ? 'bg-card border-border shadow-sm'
                  : i < step
                    ? 'bg-card/40 border-border/60 opacity-80'
                    : 'bg-card/20 border-border/40 opacity-45'
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className={`font-mono font-bold ${TONE_TEXT[tone]}`}>{i + 1}</span>
                <span className="truncate">
                  {s.from === s.to
                    ? `${name(s.from)} · internal`
                    : `${name(s.from)} → ${name(s.to)}${third ? ` + ${third}` : ''}`}
                </span>
                <span className={`ml-auto shrink-0 rounded border px-1 ${STATE_CHIP[st]}`}>
                  {st === 'encrypted' ? '🔒 ' : ''}
                  {DATA_STATE_LABELS[st]}
                </span>
              </div>
              <div className="text-xs font-semibold text-foreground leading-tight">
                {s.verdict === 'no' ? '✗ ' : s.verdict === 'ok' ? '✓ ' : ''}
                {s.label}
                {s.deployment && (
                  <span className="ml-1.5 text-[9px] font-medium text-status-warning">
                    deployment
                  </span>
                )}
                <span className="ml-1.5 text-[9px] font-medium text-muted-foreground">
                  · {ENGINE_STATUS_LABELS[engineStatusOf(flow, s)].short}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-0.5">
                {cost && (
                  <>
                    <span className="inline-flex items-center gap-1">
                      <Meter level={cost.dataLevel} className="bg-primary" />
                      {cost.dataShort}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Meter level={cost.computeLevel} className="bg-warning" />
                      {cost.computeShort}
                    </span>
                  </>
                )}
                {linkText && (
                  <span className={`ml-auto shrink-0 font-medium ${TONE_TEXT[tone]}`}>
                    {linkText}
                  </span>
                )}
              </div>
            </Button>
            {i === step && (
              <div className="ml-3 mt-1 mb-1 border-l-2 border-primary/40 pl-2">
                <HoldingsList
                  flow={flow}
                  step={step}
                  persisted={persisted}
                  shared={shared}
                  overlay={overlay}
                  pqcFixed={pqcFixed}
                />
              </div>
            )}
          </li>
        )
      })}
    </ol>
  )
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

function ratioLabel(bytes: number): string {
  const r = bytes / RSA2048_PAIR_BYTES
  if (r < 0.1) return `×${r.toFixed(2)}`
  if (r < 10) return `×${r.toFixed(1)}`
  return `×${compact.format(r)}`
}

/** "If an RSA-2048 key pair were 1 cm long …" — turns the ratio into a distance. */
function asDistance(bytes: number): string {
  const cm = bytes / RSA2048_PAIR_BYTES
  if (cm >= 100_000) return `${Math.round(cm / 100_000)} km`
  if (cm >= 100) return `${Math.round(cm / 100)} m`
  return `${cm < 1 ? cm.toFixed(2) : Math.round(cm)} cm`
}

// Log-scale axis for the bars: 10 B … 10 GB.
const LOG_MIN = 1
const LOG_MAX = 10
const barPct = (bytes: number) =>
  Math.max(2, ((Math.log10(Math.max(bytes, 10)) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * 100)

const KeySizePanel: React.FC<{ highlighted: KeyId[] }> = ({ highlighted }) => {
  const rows = [...KEY_SIZES].sort((a, b) => a.bytes - b.bytes)
  const biggest = rows[rows.length - 1]
  const refPct = barPct(RSA2048_PAIR_BYTES)
  return (
    <div className="rounded-lg border border-border bg-card/40 p-3 space-y-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <h4 className="text-sm font-bold text-foreground">Key sizes, in RSA-2048 key pairs</h4>
        <span className="text-[10px] text-muted-foreground">
          log scale · highlighted = used in this step
        </span>
      </div>
      <ul className="space-y-1">
        {rows.map((k) => {
          const on = highlighted.includes(k.id)
          const isRef = k.id === 'rsa2048'
          return (
            <li
              key={k.id}
              title={k.note}
              className={`grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)_auto] items-center gap-x-2 rounded px-1.5 py-0.5 text-[11px] ${
                on ? 'bg-primary/10 ring-1 ring-primary/40' : ''
              }`}
            >
              <span
                className={`truncate col-span-2 sm:col-span-1 ${on || isRef ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              >
                {k.secret ? '🔒 ' : ''}
                {k.label}
              </span>
              <span className="relative h-2 rounded-sm bg-muted row-start-2 sm:row-start-auto">
                <span
                  className={`absolute inset-y-0 left-0 rounded-sm ${
                    isRef ? 'bg-foreground/70' : k.secret ? 'bg-success' : 'bg-primary'
                  } ${on || isRef ? '' : 'opacity-50'}`}
                  style={{ width: `${barPct(k.bytes)}%` }}
                />
                <span
                  className="absolute -inset-y-0.5 w-px bg-foreground/60"
                  style={{ left: `${refPct}%` }}
                  aria-hidden="true"
                />
              </span>
              <span className="text-right font-mono whitespace-nowrap row-start-2 col-start-2 sm:row-start-auto sm:col-start-auto">
                <span
                  className={on || isRef ? 'text-foreground font-bold' : 'text-muted-foreground'}
                >
                  {isRef ? '1 unit' : ratioLabel(k.bytes)}
                </span>
                <span className="text-muted-foreground"> · {k.size}</span>
                {!k.exact && <span className="text-muted-foreground"> est.</span>}
              </span>
            </li>
          )
        })}
      </ul>
      <p className="text-[10px] text-muted-foreground leading-snug">
        The thin line marks one RSA-2048 key pair (~1.5 KB). If that key pair were 1 cm long, the{' '}
        {biggest.label.toLowerCase()} would be about {asDistance(biggest.bytes)} long. The secret
        the HSM must protect is the 32-byte seed, smaller than the RSA key it replaces.
      </p>
    </div>
  )
}

// ── Sequence diagram ───────────────────────────────────────────────────────

// Lanes take the left part of the viewBox; two narrow cost columns sit on the right.
const LANES_W = 640
const COL_W = 72
const COL_GAP = 10
const VB_W = LANES_W + 3 * COL_W + 4 * COL_GAP
const STATE_X = LANES_W + COL_GAP
const DATA_X = STATE_X + COL_W + COL_GAP
const COMPUTE_X = DATA_X + COL_W + COL_GAP
const ZONE_Y = 2
const HEAD_Y = 18
const HEAD_H = 38
const HOLD_Y = HEAD_Y + HEAD_H + 6
const HOLD_TITLE = 12
const CHIP_H = 12
const CHIP_GAP = 2
const PHASE_H = 16
const ROW_H = 32
const MARGIN_X = 70

type Tone = 'primary' | 'error' | 'success' | 'warning' | 'muted'

const STROKE: Record<Tone, string> = {
  primary: 'stroke-primary',
  error: 'stroke-destructive',
  success: 'stroke-success',
  warning: 'stroke-warning',
  muted: 'stroke-muted-foreground',
}
const FILL: Record<Tone, string> = {
  primary: 'fill-primary',
  error: 'fill-destructive',
  success: 'fill-success',
  warning: 'fill-warning',
  muted: 'fill-muted-foreground',
}

const ZONE_STYLE: Record<TrustZone, { box: string; text: string }> = {
  owner: { box: 'fill-success/5 stroke-success/30', text: 'fill-success' },
  third: { box: 'fill-destructive/5 stroke-destructive/30', text: 'fill-destructive' },
  party: { box: 'fill-primary/5 stroke-primary/30', text: 'fill-primary' },
}

const ZONE_SHORT: Record<TrustZone, string> = {
  owner: 'Data owner',
  third: 'Third party',
  party: 'Key holders',
}

const PHASE_TONE: Record<Phase, Tone> = {
  setup: 'muted',
  encrypt: 'primary',
  compute: 'warning',
  decrypt: 'success',
  backup: 'muted',
}

const STATE_STYLE: Record<DataState, { box: string; text: string }> = {
  keys: { box: 'fill-muted/50 stroke-border', text: 'fill-muted-foreground' },
  clear: { box: 'fill-warning/10 stroke-warning/50', text: 'fill-warning' },
  encrypting: { box: 'fill-primary/5 stroke-primary/50', text: 'fill-primary' },
  encrypted: { box: 'fill-primary/15 stroke-primary/60', text: 'fill-primary' },
  decrypting: { box: 'fill-success/10 stroke-success/50', text: 'fill-success' },
  result: { box: 'fill-warning/10 stroke-warning/50', text: 'fill-warning' },
}

function toneFor(s: FlowStep, overlay: boolean, pqcFixed: boolean): Tone {
  if (s.verdict === 'no') return 'error'
  if (s.verdict === 'warn') return 'warning'
  if (!overlay || !s.link) return s.verdict === 'ok' ? 'success' : 'primary'
  const threat = LINK_LABELS[s.link as LinkKind].threat
  if (s.link === 'stream') return 'muted'
  if (!threat) return 'primary'
  return pqcFixed ? 'success' : 'error'
}

/** Vertical layout: one row per step, plus a header band where each new phase starts. */
function rowLayout(flow: FheFlow, holdH: number) {
  const phases = FLOW_STEP_META[flow.id].phase
  const starts = phases.map((p, i) => i === 0 || p !== phases[i - 1])
  const row0 = HOLD_Y + holdH + PHASE_H + ROW_H / 2
  const ys: number[] = []
  let bands = 0
  phases.forEach((_, i) => {
    if (starts[i]) bands++ // eslint-disable-line security/detect-object-injection
    ys.push(row0 + i * ROW_H + (bands - 1) * PHASE_H)
  })
  return { phases, starts, ys, height: (ys[ys.length - 1] ?? row0) + ROW_H / 2 + 6 }
}

const SequenceDiagram: React.FC<{
  flow: FheFlow
  costs: StepCost[]
  step: number
  overlay: boolean
  pqcFixed: boolean
  persisted: boolean
  shared: boolean
  onSelect: (i: number) => void
}> = ({ flow, costs, step, overlay, pqcFixed, persisted, shared, onSelect }) => {
  const cols = holdingColumns(flow)
  const n = cols.length
  const spacing = (LANES_W - 2 * MARGIN_X) / Math.max(1, n - 1)
  const xs = cols.map((_, i) => MARGIN_X + i * spacing)
  const xOf = (id: string) => xs[cols.findIndex((c) => c.id === id)] ?? MARGIN_X
  const headW = Math.min(112, spacing - 8)
  const chipW = Math.min(112, spacing - 6)
  const holdH = HOLD_TITLE + maxHoldings(flow) * (CHIP_H + CHIP_GAP) + 4
  const { phases, starts, ys, height } = rowLayout(flow, holdH)
  const holdings = holdingsAt(flow, step, { persisted, shared, overlay, pqcFixed })
  const exposedNow = exposedCount(holdings)
  const data = FLOW_STEP_META[flow.id].data

  // Contiguous trust-zone groups across the actor lanes (the data-center lane has no zone).
  const zones: { zone: TrustZone; first: number; last: number }[] = []
  flow.actors.forEach((a, i) => {
    const prev = zones[zones.length - 1]
    if (prev && prev.zone === a.zone && prev.last === i - 1) prev.last = i
    else zones.push({ zone: a.zone, first: i, last: i })
  })
  let phaseNo = 0

  return (
    <MotionConfig reducedMotion="user">
      <svg
        viewBox={`0 0 ${VB_W} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`${flow.label} sequence diagram, step ${step + 1} of ${flow.steps.length}`}
      >
        <defs>
          {(Object.keys(FILL) as Tone[]).map((t) => (
            <marker
              key={t}
              id={`fhehsm-arrow-${t}`}
              markerWidth={8}
              markerHeight={8}
              refX={7}
              refY={4}
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" className={FILL[t]} />
            </marker>
          ))}
        </defs>

        {/* Trust zones */}
        {zones.map((z) => {
          const x1 = xs[z.first] - spacing / 2 + 3
          const x2 = xs[z.last] + spacing / 2 - 3
          return (
            <g key={`zone-${z.zone}-${z.first}`}>
              <rect
                x={x1}
                y={ZONE_Y}
                width={x2 - x1}
                height={height - ZONE_Y - 2}
                rx={8}
                className={ZONE_STYLE[z.zone].box}
              />
              <text
                x={x1 + 6}
                y={ZONE_Y + 11}
                className={`${ZONE_STYLE[z.zone].text} text-[9px] font-bold`}
              >
                {ZONE_LABELS[z.zone].length * 5.2 + 12 < x2 - x1
                  ? ZONE_LABELS[z.zone]
                  : ZONE_SHORT[z.zone]}
              </text>
            </g>
          )
        })}

        {/* Lane heads + lifelines */}
        {cols.map((c, i) => {
          const x = xs[i] // eslint-disable-line security/detect-object-injection
          const actor = flow.actors.find((a) => a.id === c.id)
          return (
            <g key={c.id}>
              <line
                x1={x}
                y1={HEAD_Y + HEAD_H}
                x2={x}
                y2={height - 4}
                className="stroke-border"
                strokeDasharray="3 4"
              />
              <rect
                x={x - headW / 2}
                y={HEAD_Y}
                width={headW}
                height={HEAD_H}
                rx={6}
                className={
                  c.kind === 'hsm'
                    ? 'fill-card stroke-success'
                    : c.kind === 'datacenter'
                      ? 'fill-card stroke-muted-foreground'
                      : c.kind === 'gpu'
                        ? 'fill-card stroke-warning'
                        : 'fill-card stroke-border'
                }
                strokeWidth={1.5}
                strokeDasharray={c.kind === 'datacenter' ? '4 3' : undefined}
              />
              <text
                x={x}
                y={HEAD_Y + 16}
                textAnchor="middle"
                className="fill-foreground text-[11px] font-bold"
              >
                {actor?.holdsSecret ? '🔒 ' : ''}
                {c.label}
              </text>
              <text
                x={x}
                y={HEAD_Y + 29}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {c.sub}
              </text>
            </g>
          )
        })}

        {/* What each lane holds right now: the key map, merged into the flow */}
        <text x={6} y={HOLD_Y + 9} className="fill-foreground text-[9px] font-bold">
          {`Holding at step ${step + 1}`}
        </text>
        <text
          x={LANES_W - 4}
          y={HOLD_Y + 9}
          textAnchor="end"
          className={`${exposedNow ? 'fill-destructive' : 'fill-success'} text-[9px] font-semibold`}
        >
          {exposedNow
            ? `${exposedNow} secret item(s) exposed`
            : 'No secret outside an HSM or the owner'}
        </text>
        {cols.map((c, i) =>
          (holdings[c.id] ?? []).map((h, k) => {
            const x = xs[i] - chipW / 2 // eslint-disable-line security/detect-object-injection
            const y = HOLD_Y + HOLD_TITLE + k * (CHIP_H + CHIP_GAP)
            return (
              <motion.g
                key={`hold-${c.id}-${h.item}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <title>{`${h.label} · ${h.mode} · ${HOLD_STATUS[h.status].tag}`}</title>
                <rect
                  x={x}
                  y={y}
                  width={chipW}
                  height={CHIP_H}
                  rx={3}
                  className={HOLD_STATUS[h.status].svg}
                  strokeWidth={h.isNew ? 1.6 : 0.8}
                />
                <text x={x + 4} y={y + 9} className="fill-foreground text-[8px]">
                  {h.isNew ? '● ' : ''}
                  {h.short}
                  {h.status === 'exposed'
                    ? ' · EXPOSED'
                    : h.status === 'released'
                      ? ' · released'
                      : ''}
                </text>
              </motion.g>
            )
          })
        )}

        {/* Phase bands */}
        {phases.map((p, i) => {
          if (!starts[i]) return null // eslint-disable-line security/detect-object-injection
          phaseNo++
          const y = ys[i] - ROW_H / 2 - 4 // eslint-disable-line security/detect-object-injection
          return (
            <g key={`phase-${i}`}>
              <line
                x1={4}
                y1={y + 3}
                x2={VB_W - 4}
                y2={y + 3}
                className="stroke-border"
                strokeDasharray="2 3"
              />
              <text x={6} y={y} className={`${FILL[PHASE_TONE[p]]} text-[9px] font-bold uppercase`}>
                {`${phaseNo}. ${PHASE_LABELS[p]}`}
              </text>
            </g>
          )
        })}

        {/* Steps */}
        {flow.steps.map((s, i) => {
          // Future steps stay faintly visible so any step can be clicked.
          const y = ys[i] // eslint-disable-line security/detect-object-injection
          const isCurrent = i === step
          const tone = toneFor(s, overlay, pqcFixed)
          const opacity = isCurrent ? 1 : i < step ? 0.45 : 0.15
          const linkText =
            overlay && s.link
              ? pqcFixed
                ? LINK_LABELS[s.link].pqc
                : LINK_LABELS[s.link].classical
              : null
          // eslint-disable-next-line security/detect-object-injection
          const onCipher = phases[i] === 'compute' && s.from === s.to

          if (s.from === s.to) {
            const label = `${s.verdict === 'no' ? '✗ ' : s.verdict === 'ok' ? '✓ ' : ''}${onCipher ? '🔒 ' : ''}${s.label}`
            const w = Math.max(70, label.length * 5.6 + 18)
            const x = Math.min(Math.max(xOf(s.from), w / 2 + 22), LANES_W - w / 2 - 4)
            return (
              <motion.g
                key={`${flow.id}-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity, scale: 1 }}
                transition={{ duration: 0.35 }}
                style={{ transformOrigin: `${x}px ${y}px` }}
              >
                <rect
                  x={x - w / 2}
                  y={y - 11}
                  width={w}
                  height={22}
                  rx={5}
                  className={`${onCipher ? 'fill-warning/10' : 'fill-card'} ${STROKE[tone]}`}
                  strokeWidth={isCurrent ? 2 : 1.2}
                  strokeDasharray={onCipher ? '4 2' : undefined}
                />
                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  className="fill-foreground text-[10px] font-semibold"
                >
                  {label}
                </text>
                {onCipher && (
                  <text x={x} y={y + 19} textAnchor="middle" className="fill-warning text-[8px]">
                    on encrypted data · never sees plaintext
                  </text>
                )}
                <StepNumber x={x - w / 2 - 10} y={y} n={i + 1} tone={tone} />
              </motion.g>
            )
          }

          const x1 = xOf(s.from)
          const x2 = xOf(s.to)
          const dir = x2 > x1 ? 1 : -1
          const mid = (x1 + x2) / 2
          const third = shared && s.shareWith ? xOf(s.shareWith) : null
          return (
            <motion.g
              key={`${flow.id}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ duration: 0.25 }}
            >
              <motion.line
                x1={x1 + dir * 4}
                y1={y}
                x2={x2 - dir * 4}
                y2={y}
                className={STROKE[tone]}
                strokeWidth={isCurrent ? 2.2 : 1.4}
                strokeDasharray={s.verdict === 'no' ? '5 4' : undefined}
                markerEnd={`url(#fhehsm-arrow-${tone})`}
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5 }}
              />
              <text
                x={mid}
                y={y - 5}
                textAnchor="middle"
                className="fill-foreground text-[10px] font-semibold"
              >
                {s.verdict === 'no' ? '✗ ' : ''}
                {s.label}
              </text>
              {linkText && (
                <text x={mid} y={y + 11} textAnchor="middle" className={`${FILL[tone]} text-[8px]`}>
                  {linkText}
                </text>
              )}
              {third !== null && (
                <g>
                  <line
                    x1={x1 + (third > x1 ? 4 : -4)}
                    y1={y + 7}
                    x2={third - (third > x1 ? 4 : -4)}
                    y2={y + 7}
                    className={STROKE.warning}
                    strokeWidth={1.4}
                    strokeDasharray="4 3"
                    markerEnd="url(#fhehsm-arrow-warning)"
                  />
                  <text
                    x={third + (third > x1 ? -6 : 6)}
                    y={y + 4}
                    textAnchor={third > x1 ? 'end' : 'start'}
                    className="fill-warning text-[8px] font-semibold"
                  >
                    also to third party (policy)
                  </text>
                </g>
              )}
              <StepNumber x={Math.min(x1, x2) - 12} y={y} n={i + 1} tone={tone} />
            </motion.g>
          )
        })}

        {/* Side columns: data state, data volume, compute */}
        <line
          x1={LANES_W + 2}
          y1={HEAD_Y}
          x2={LANES_W + 2}
          y2={height - 4}
          className="stroke-border"
        />
        {[
          { x: STATE_X, title: 'Data is', sub: 'at this step' },
          { x: DATA_X, title: 'Data', sub: 'moved / held · log' },
          { x: COMPUTE_X, title: 'Compute', sub: 'per step · log' },
        ].map((h) => (
          <g key={h.title}>
            <text
              x={h.x + COL_W / 2}
              y={HEAD_Y + 16}
              textAnchor="middle"
              className="fill-foreground text-[11px] font-bold"
            >
              {h.title}
            </text>
            <text
              x={h.x + COL_W / 2}
              y={HEAD_Y + 29}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {h.sub}
            </text>
          </g>
        ))}
        {flow.steps.map((_, i) => {
          const y = ys[i] // eslint-disable-line security/detect-object-injection
          const st = data[i] // eslint-disable-line security/detect-object-injection
          const opacity = i === step ? 1 : i < step ? 0.45 : 0.15
          return (
            <motion.g
              key={`state-${flow.id}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ duration: 0.3 }}
            >
              <rect
                x={STATE_X}
                y={y - 8}
                width={COL_W}
                height={15}
                rx={4}
                className={STATE_STYLE[st].box}
              />
              <text
                x={STATE_X + COL_W / 2}
                y={y + 3}
                textAnchor="middle"
                className={`${STATE_STYLE[st].text} text-[8px] font-semibold`}
              >
                {st === 'encrypted' ? '🔒 ' : ''}
                {DATA_STATE_LABELS[st]}
              </text>
            </motion.g>
          )
        })}
        {costs.map((cst, i) => {
          const y = ys[i] // eslint-disable-line security/detect-object-injection
          const opacity = i === step ? 1 : i < step ? 0.45 : 0.15
          return (
            <motion.g
              key={`cost-${flow.id}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ duration: 0.3 }}
            >
              {[
                { x: DATA_X, level: cst.dataLevel, text: cst.dataShort, fill: 'fill-primary' },
                {
                  x: COMPUTE_X,
                  level: cst.computeLevel,
                  text: cst.computeShort,
                  fill: 'fill-warning',
                },
              ].map((col) => (
                <g key={col.x}>
                  <rect
                    x={col.x}
                    y={y - 10}
                    width={COL_W}
                    height={6}
                    rx={2}
                    className="fill-muted"
                  />
                  <motion.rect
                    x={col.x}
                    y={y - 10}
                    height={6}
                    rx={2}
                    className={col.fill}
                    initial={{ width: 0 }}
                    animate={{ width: (COL_W * col.level) / 4 }}
                    transition={{ duration: 0.5 }}
                  />
                  <text x={col.x} y={y + 7} className="fill-foreground text-[9px] font-medium">
                    {col.text}
                  </text>
                </g>
              ))}
            </motion.g>
          )
        })}
        {/* Click / keyboard targets: one full-width row per step */}
        {flow.steps.map((s, i) => (
          <rect
            key={`hit-${flow.id}-${i}`}
            x={0}
            y={ys[i] - ROW_H / 2} // eslint-disable-line security/detect-object-injection
            width={VB_W}
            height={ROW_H}
            rx={4}
            role="button"
            tabIndex={0}
            aria-label={`Step ${i + 1}: ${s.title}. Open details`}
            className="fill-transparent hover:fill-primary/5 focus-visible:fill-primary/10 cursor-pointer outline-none"
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(i)
              }
            }}
          />
        ))}
      </svg>
    </MotionConfig>
  )
}

const StepNumber: React.FC<{ x: number; y: number; n: number; tone: Tone }> = ({
  x,
  y,
  n,
  tone,
}) => (
  <g>
    <circle cx={x} cy={y} r={7} className={`fill-card ${STROKE[tone]}`} strokeWidth={1} />
    <text x={x} y={y + 3} textAnchor="middle" className={`${FILL[tone]} text-[8px] font-bold`}>
      {n}
    </text>
  </g>
)
