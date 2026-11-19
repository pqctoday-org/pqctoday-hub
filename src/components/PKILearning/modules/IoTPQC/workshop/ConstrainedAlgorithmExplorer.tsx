// SPDX-License-Identifier: AGPL-3.0-only
import React, { useId, useMemo, useState } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import {
  BENCH_SOURCES,
  CONSTRAINED_ALGORITHMS,
  DEVICE_CLASSES,
  MODEL_MCU_HZ,
  type Build,
  type ConstrainedAlgorithm,
} from '../constants'
import {
  ROLE_LABELS,
  TIGHT_FRACTION,
  assessFit,
  fitSummary,
  type DeviceRole,
  type FitResult,
} from '../utils/sizing'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export interface AlgorithmExplorerConfig {
  classIdx?: number
  role?: DeviceRole
  build?: Build
}

const fmtBytes = (b: number) =>
  b >= 1024 ? `${(b / 1024).toFixed(1)} KiB` : `${b.toLocaleString('en-US')} B`

const fmtMs = (ms: number) =>
  ms >= 1000
    ? `${(ms / 1000).toFixed(1)} s`
    : ms >= 10
      ? `${ms.toFixed(0)} ms`
      : `${ms.toFixed(1)} ms`

export const ConstrainedAlgorithmExplorer: React.FC<{ initial?: AlgorithmExplorerConfig }> = ({
  initial,
}) => {
  const [classIdx, setClassIdx] = useState(initial?.classIdx ?? 1)
  const [role, setRole] = useState<DeviceRole>(initial?.role ?? 'verify')
  const [build, setBuild] = useState<Build>(initial?.build ?? 'stack')
  const dc = DEVICE_CLASSES[classIdx] ?? DEVICE_CLASSES[1]
  const fieldId = useId()
  const [customRam, setCustomRam] = useState<string | null>(null)
  const ramBudget = customRam === null ? dc.ramBytes : Number(customRam)
  const validRam =
    customRam !== '' && Number.isInteger(ramBudget) && ramBudget >= 0 && ramBudget <= dc.ramBytes
  const availableRam = validRam ? ramBudget : undefined

  const rows = useMemo(
    () =>
      CONSTRAINED_ALGORITHMS.map((alg) => ({
        alg,
        fit: assessFit(alg, classIdx, role, build, availableRam),
      })).filter((r) => r.fit.applicable),
    [classIdx, role, build, availableRam]
  )
  const summary = useMemo(
    () => fitSummary(classIdx, role, build, availableRam),
    [classIdx, role, build, availableRam]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Pick a device class and what the device has to do. Each algorithm&apos;s peak RAM is its
        Cortex-M4 benchmark stack plus the keys, ciphertext or signature it must hold. Green fits in
        half the available RAM or less, amber uses more than {TIGHT_FRACTION * 100}% of it, red
        exceeds the RAM budget (or, when signing or running a KEM, the full-scheme code exceeds
        available flash).
      </p>

      {/* Device class */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">1. Device class</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DEVICE_CLASSES.map((c, idx) => (
            <Button
              variant="ghost"
              key={c.id}
              onClick={() => {
                setClassIdx(idx)
                setCustomRam(null)
              }}
              aria-pressed={idx === classIdx}
              className={`h-auto flex-col items-start whitespace-normal p-3 rounded-lg border text-left ${
                idx === classIdx
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
              }`}
            >
              <div className="text-sm font-bold">{c.name}</div>
              <div className="text-xs mt-1">
                {c.ramSpec} RAM · {c.flashSpec} flash
              </div>
              <div className="text-[10px] mt-1 text-muted-foreground">{c.definedIn}</div>
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          <span className="font-medium text-foreground">{dc.name}</span> ({dc.example}):{' '}
          {dc.description} Model uses {fmtBytes(dc.ramBytes)} RAM and {fmtBytes(dc.flashBytes)}{' '}
          flash.
        </p>
        <div className="mt-3 space-y-2">
          <label htmlFor={fieldId} className="block text-sm font-medium">
            Available RAM for cryptography (bytes)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id={fieldId}
              type="number"
              min={0}
              max={dc.ramBytes}
              step={1}
              value={customRam ?? dc.ramBytes}
              onChange={(event) => setCustomRam(event.target.value)}
              className="w-40"
              aria-invalid={!validRam}
              aria-describedby={`${fieldId}-help`}
            />
            <Button
              variant="outline"
              onClick={() => setCustomRam(null)}
              disabled={customRam === null}
            >
              Use class RAM
            </Button>
          </div>
          <p id={`${fieldId}-help`} className="text-xs text-muted-foreground">
            Enter the RAM left after reserving memory for the application and operating system.
          </p>
          {!validRam && (
            <p role="alert" className="text-xs text-status-error">
              Enter a whole number from 0 to {dc.ramBytes.toLocaleString('en-US')}.
            </p>
          )}
        </div>
      </div>

      {/* Role + build */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">2. What the device does</div>
          <div className="space-y-2">
            {(Object.keys(ROLE_LABELS) as DeviceRole[]).map((r) => (
              <Button
                variant="ghost"
                key={r}
                onClick={() => setRole(r)}
                aria-pressed={r === role}
                className={`w-full h-auto justify-start whitespace-normal text-left p-2 rounded-lg border text-xs ${
                  r === role
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground'
                }`}
              >
                {ROLE_LABELS[r]}
              </Button>
            ))}
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">3. Implementation build</div>
          <div className="space-y-2">
            {(
              [
                ['stack', 'Stack-optimised (pqm4 m4fstack, where available)'],
                ['speed', 'Speed-optimised (pqm4 m4fspeed / m4f, where available)'],
              ] as [Build, string][]
            ).map(([b, label]) => (
              <Button
                variant="ghost"
                key={b}
                onClick={() => setBuild(b)}
                aria-pressed={b === build}
                className={`w-full h-auto justify-start whitespace-normal text-left p-2 rounded-lg border text-xs ${
                  b === build
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'border-border bg-muted/30 text-muted-foreground'
                }`}
              >
                {label}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Algorithms benchmarked with one implementation only use it under both settings. Time is
            cycles at a {MODEL_MCU_HZ / 1e6} MHz clock (model input).
          </p>
        </div>
      </div>

      {validRam && (
        <>
          {/* Rows */}
          <div className="glass-panel p-4 space-y-3">
            <div className="text-sm font-bold text-foreground">
              {role === 'kem' ? 'Key establishment' : 'Signature'} algorithms on {dc.name}
            </div>
            {rows.map(({ alg, fit }) => (
              <AlgorithmRow key={alg.id} alg={alg} fit={fit} role={role} />
            ))}
          </div>

          {/* Generated summary */}
          <div
            className="bg-muted/50 rounded-lg p-4 border border-border"
            data-testid="fit-summary"
          >
            <div className="text-xs font-bold text-foreground mb-2">
              {dc.name} summary — model estimate
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>
                <span className="text-success font-medium">Fits:</span>{' '}
                {summary.fits.length ? summary.fits.join(', ') : 'none'}
              </li>
              <li>
                <span className="text-warning font-medium">Tight:</span>{' '}
                {summary.tight.length ? summary.tight.join(', ') : 'none'}
              </li>
              <li>
                <span className="text-destructive font-medium">Too large:</span>{' '}
                {summary.tooLarge.length ? summary.tooLarge.join(', ') : 'none'}
              </li>
            </ul>
            {classIdx === 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Class 0 devices are expected to reach the Internet through a gateway or proxy;
                secure them with pre-shared symmetric keys and let the gateway run the PQC (see the
                Hybrid section).
              </p>
            )}
          </div>
        </>
      )}

      <div className="text-[10px] text-muted-foreground flex items-start gap-1">
        <Info size={12} className="shrink-0 mt-0.5" />
        <span>
          Benchmarks vary by implementation, compiler and clock. Sources:{' '}
          {Object.values(BENCH_SOURCES).map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && ' · '}
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {s.label}
              </a>
            </React.Fragment>
          ))}
          .
        </span>
      </div>
    </div>
  )
}

const TONE = {
  success: { box: 'border-success/30 bg-success/5', text: 'text-success', bar: 'bg-success/60' },
  warning: { box: 'border-warning/30 bg-warning/5', text: 'text-warning', bar: 'bg-warning/60' },
  destructive: {
    box: 'border-destructive/30 bg-destructive/5',
    text: 'text-destructive',
    bar: 'bg-destructive/60',
  },
} as const

function AlgorithmRow({
  alg,
  fit,
  role,
}: {
  alg: ConstrainedAlgorithm
  fit: FitResult
  role: DeviceRole
}) {
  const tone =
    TONE[
      fit.verdict === 'too-large' ? 'destructive' : fit.verdict === 'tight' ? 'warning' : 'success'
    ]
  const Icon =
    fit.verdict === 'too-large' ? XCircle : fit.verdict === 'tight' ? AlertTriangle : CheckCircle
  const src = BENCH_SOURCES[fit.sourceId]
  return (
    <article aria-label={alg.name} className={`rounded-lg p-3 border ${tone.box}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon size={16} className={tone.text} />
          <span className="text-sm font-bold text-foreground">{alg.name}</span>
          <span
            className={`text-[10px] rounded px-1.5 py-0.5 ${
              alg.quantumSafe ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
            }`}
          >
            {alg.quantumSafe ? alg.status : 'Classical'}
          </span>
        </div>
        <span className={`text-xs font-bold ${tone.text}`}>
          {fit.verdict === 'too-large' ? 'Too large' : fit.verdict === 'tight' ? 'Tight' : 'Fits'}
        </span>
      </div>

      <div className="mt-2">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-muted-foreground">
            Peak RAM {fit.peakBytes.toLocaleString('en-US')} B = stack {fmtBytes(fit.stackBytes)}
            {fit.approximate ? ' (upper bound)' : ''} + buffers {fmtBytes(fit.bufferBytes)}
          </span>
          <span className="font-mono text-foreground">
            {Number.isFinite(fit.ramPct) ? `${fit.ramPct.toFixed(0)}%` : 'No free RAM'}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full ${tone.bar}`}
            style={{ width: `${Math.min(fit.ramPct, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] mt-2">
        <div>
          <span className="text-muted-foreground">Public key: </span>
          <span className="font-mono text-foreground">
            {alg.publicKeyBytes.toLocaleString('en-US')} B
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">
            {alg.type === 'KEM' ? 'Ciphertext' : 'Signature'}:{' '}
          </span>
          <span className="font-mono text-foreground">
            {alg.outputBytes.toLocaleString('en-US')} B
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">
            {role === 'kem' ? 'Keygen + decaps' : role === 'sign' ? 'Sign' : 'Verify'}:{' '}
          </span>
          <span className="font-mono text-foreground">
            {(fit.cycles / 1e6).toFixed(2)} M cycles ≈ {fmtMs(fit.ms)}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">Code (full scheme): </span>
          <span
            className={`font-mono ${fit.flashVerdict === 'too-large' ? 'text-destructive' : 'text-foreground'}`}
          >
            {fit.codeBytes !== undefined
              ? `${fit.approximate ? '≈' : ''}${fmtBytes(fit.codeBytes)}`
              : 'not reported'}
          </span>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{alg.notes}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 italic">
        Sizes: {alg.sizeSource}. Benchmark: {fit.impl} — {src.label}.
      </p>
    </article>
  )
}
