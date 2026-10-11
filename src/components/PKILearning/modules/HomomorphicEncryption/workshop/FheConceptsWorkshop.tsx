// SPDX-License-Identifier: GPL-3.0-only
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  BatteryMedium,
  Ruler,
  GitBranch,
  Layers,
  RefreshCw,
  Users,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EvidenceCite } from '../components/FheEvidenceCite'
import {
  BOOTSTRAP_MEASURED,
  CALLS_BY_LIMBS,
  KEY_COUNT,
  KEYSET_BYTES,
  LIMB_BYTES,
  LIMB_CHOICES,
  PROGRAMS,
  RELEASE_PRECISION_MEASURED,
  STREAM_DEVICES,
  TFHE_RS_U64_MS,
  type LimbChoice,
  type ProgramId,
  type StreamDevice,
} from './fheConceptsData'
import { RotationView, SharedDecryptView } from './FheRotationSharedViews'

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                     */
/* ------------------------------------------------------------------ */

export type CardId = 'noise' | 'encode' | 'circuit' | 'stream' | 'rotation' | 'shared'

interface ConceptSectionProps {
  id: CardId
  title: string
  subtitle: string
  borderColor: string
  icon: React.ElementType
  isExpanded: boolean
  onToggle: () => void
  isCompleted: boolean
  children: React.ReactNode
}

const ConceptSection: React.FC<ConceptSectionProps> = ({
  id,
  title,
  subtitle,
  borderColor,
  icon: Icon,
  isExpanded,
  onToggle,
  isCompleted,
  children,
}) => {
  const reduced = usePrefersReducedMotion()
  return (
    <div className={`glass-panel border-l-4 ${borderColor} overflow-hidden`}>
      <Button
        variant="ghost"
        onClick={onToggle}
        className="w-full h-auto flex items-center justify-between gap-3 p-5 text-left whitespace-normal hover:bg-muted/30 transition-colors"
        aria-expanded={isExpanded}
        aria-controls={`fhe-concept-${id}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full border-2 border-border flex items-center justify-center bg-background">
            <Icon size={18} className="text-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {title}
              {isCompleted && (
                <motion.span initial={{ scale: reduced ? 1 : 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={18} className="text-success" aria-label="explored" />
                </motion.span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp size={20} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown size={20} className="shrink-0 text-muted-foreground" />
        )}
      </Button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={`fhe-concept-${id}`}
            initial={{ height: reduced ? 'auto' : 0, opacity: reduced ? 1 : 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: reduced ? 'auto' : 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 sm:px-5 pb-5 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const WhatYouSee: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-muted-foreground leading-relaxed">
    <strong className="text-foreground">What you&apos;ll see: </strong>
    {children}
  </p>
)

const IllustrationLabel: React.FC = () => (
  <p className="inline-block rounded-full border border-warning/50 bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
    Illustration (simplified, not real encryption)
  </p>
)

const Sources: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <div className="border-t border-border pt-3">
    <p className="text-xs font-semibold text-muted-foreground mb-1">Sources</p>
    <ol className="list-decimal pl-5 space-y-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ol>
  </div>
)

const Bar: React.FC<{ pct: number; tone: 'ok' | 'warn' | 'bad'; label: string }> = ({
  pct,
  tone,
  label,
}) => {
  const reduced = usePrefersReducedMotion()
  const color = tone === 'ok' ? 'bg-success' : tone === 'warn' ? 'bg-warning' : 'bg-destructive'
  return (
    <div
      className="h-3 w-full rounded-full bg-muted overflow-hidden"
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
    >
      <motion.div
        className={`h-full ${color}`}
        initial={false}
        animate={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
        transition={{ duration: reduced ? 0 : 0.3 }}
      />
    </div>
  )
}

const fmtInt = (n: number) => n.toLocaleString('en-US')

/* ------------------------------------------------------------------ */
/*  Card 1: noise budget and bootstrapping                             */
/* ------------------------------------------------------------------ */

const CKKS_FRESH_LEVELS = 6
const CKKS_AFTER_BOOT_LEVELS = 4
const TFHE_FRESH_NOISE = 10
const TFHE_ADD_NOISE = 22
const REFUSAL = 'Decryption would fail — bootstrap first'

const NoiseBudgetDemo: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [levels, setLevels] = useState(CKKS_FRESH_LEVELS)
  const [ckksBoots, setCkksBoots] = useState(0)
  const [ckksRefused, setCkksRefused] = useState(false)
  const [ckksLog, setCkksLog] = useState<string[]>([])
  const [noise, setNoise] = useState(TFHE_FRESH_NOISE)
  const [pbs, setPbs] = useState(0)
  const [tfheRefused, setTfheRefused] = useState(false)
  const [tfheLog, setTfheLog] = useState<string[]>([])

  const push = (set: React.Dispatch<React.SetStateAction<string[]>>, s: string) =>
    set((l) => [s, ...l].slice(0, 4))

  const doAdd = () => {
    onInteract()
    setCkksRefused(false)
    push(setCkksLog, 'Add: no level used')
    if (noise + TFHE_ADD_NOISE > 100) {
      setTfheRefused(true)
      push(setTfheLog, 'Add refused: noise would overflow')
    } else {
      setTfheRefused(false)
      setNoise((n) => n + TFHE_ADD_NOISE)
      push(setTfheLog, 'Add (leveled): noise grows')
    }
  }
  const doMultiply = () => {
    onInteract()
    if (levels <= 0) {
      setCkksRefused(true)
      push(setCkksLog, 'Multiply refused: no levels left')
    } else {
      setCkksRefused(false)
      setLevels((l) => l - 1)
      push(setCkksLog, 'Multiply + rescale: one level used')
    }
    // TFHE: a non-linear operation runs as a programmable bootstrap with a lookup table
    setTfheRefused(false)
    setNoise(TFHE_FRESH_NOISE)
    setPbs((p) => p + 1)
    push(setTfheLog, 'Multiply (non-linear): bootstrap with a lookup table, noise reset')
  }
  const doBootstrap = () => {
    onInteract()
    setCkksRefused(false)
    setLevels(CKKS_AFTER_BOOT_LEVELS)
    setCkksBoots((b) => b + 1)
    push(setCkksLog, 'Bootstrap: levels restored, small extra error')
    setTfheRefused(false)
    setNoise(TFHE_FRESH_NOISE)
    setPbs((p) => p + 1)
    push(setTfheLog, 'Bootstrap (identity table): noise reset')
  }
  const doReset = () => {
    onInteract()
    setLevels(CKKS_FRESH_LEVELS)
    setCkksBoots(0)
    setCkksRefused(false)
    setCkksLog([])
    setNoise(TFHE_FRESH_NOISE)
    setPbs(0)
    setTfheRefused(false)
    setTfheLog([])
  }

  const levelPct = (levels / CKKS_FRESH_LEVELS) * 100
  return (
    <div className="space-y-4">
      <WhatYouSee>
        The same operations applied to a CKKS and a TFHE ciphertext. CKKS spends a level on every
        multiplication and must bootstrap when the levels run out; TFHE lets noise grow on cheap
        operations and bootstraps on every non-linear one.
      </WhatYouSee>
      <IllustrationLabel />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Homomorphic operations">
        <Button size="sm" variant="outline" onClick={doAdd}>
          Add
        </Button>
        <Button size="sm" variant="outline" onClick={doMultiply}>
          Multiply
        </Button>
        <Button size="sm" onClick={doBootstrap}>
          Bootstrap
        </Button>
        <Button size="sm" variant="ghost" onClick={doReset}>
          <RotateCcw size={14} className="mr-1" />
          Reset
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="glass-panel p-3 space-y-2">
          <p className="text-sm font-semibold text-foreground">CKKS: levels left</p>
          <Bar
            pct={levelPct}
            tone={levels === 0 ? 'bad' : levels <= 2 ? 'warn' : 'ok'}
            label="CKKS levels remaining"
          />
          <p className="text-xs text-muted-foreground">
            <span className="font-mono text-foreground">
              {levels} / {CKKS_FRESH_LEVELS}
            </span>{' '}
            levels · bootstraps: <span className="font-mono text-foreground">{ckksBoots}</span>
            {ckksBoots > 0 && <> · each adds a small approximation error</>}
          </p>
          {ckksRefused && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {REFUSAL}
            </p>
          )}
          <ul className="text-xs text-muted-foreground space-y-0.5" aria-label="CKKS log">
            {ckksLog.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
        <div className="glass-panel p-3 space-y-2">
          <p className="text-sm font-semibold text-foreground">TFHE: noise</p>
          <Bar
            pct={noise}
            tone={noise > 75 ? 'bad' : noise > 50 ? 'warn' : 'ok'}
            label="TFHE noise level"
          />
          <p className="text-xs text-muted-foreground">
            noise <span className="font-mono text-foreground">{noise}%</span> of the decryption
            margin · programmable bootstraps:{' '}
            <span className="font-mono text-foreground">{pbs}</span>
          </p>
          {tfheRefused && (
            <p role="alert" className="text-sm font-semibold text-destructive">
              {REFUSAL}
            </p>
          )}
          <ul className="text-xs text-muted-foreground space-y-0.5" aria-label="TFHE log">
            {tfheLog.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="glass-panel p-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Measured:</strong> one CKKS bootstrap at N = 2¹⁶ took{' '}
          {BOOTSTRAP_MEASURED.map((b, i) => (
            <React.Fragment key={b.evidence}>
              {i > 0 && ' and '}
              <EvidenceCite of={b.evidence}>{b.seconds.toFixed(1)} s</EvidenceCite>
            </React.Fragment>
          ))}{' '}
          on an Apple M5 Max in our runs (Lattigo v6.2.0, keys streamed from the MX95 and MX95 Pro
          tokens). A TFHE bootstrap is far cheaper per operation but happens on every non-linear
          step.
        </p>
        <p>
          Bootstrapping itself uses levels, so a bootstrapped CKKS ciphertext has fewer levels than
          a fresh one (here 4 of 6; the numbers are illustrative).
        </p>
      </div>
      <Sources
        items={[
          <>
            Cheon, Kim, Kim, Song, &ldquo;Homomorphic Encryption for Arithmetic of Approximate
            Numbers&rdquo;, ASIACRYPT 2017: &ldquo;the bit size of ciphertext modulus grows linearly
            with the depth of the circuit&rdquo;.
          </>,
          <>
            Microsoft SEAL examples (CKKS basics): rescale &ldquo;removes the last of the primes
            from coeff_modulus&rdquo;.
          </>,
          <>
            TFHE-rs documentation: &ldquo;Leveled operations, which increase the noise &hellip;
            Bootstrapped operations, which reduce the noise&rdquo;.
          </>,
          <>Bootstrap times: our evidence records, linked on the numbers above.</>,
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card 2: encode / decode and rounding                               */
/* ------------------------------------------------------------------ */

const DEFAULT_VALUES = ['3.14159265', '-0.5', '1.25', '0.001']
const MAX_ABS = 1000

const TOY_BITS = 16
const MSG_SHIFT = 11 // message in bits 14..11, padding bit 15, noise in bits 10..0

const TfheBitDemo: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [msg, setMsg] = useState(9)
  const [err, setErr] = useState(300)
  const word = ((msg << MSG_SHIFT) + err) & 0xffff
  const roundedStep = (word + (1 << (MSG_SHIFT - 1))) >> MSG_SHIFT
  const decoded = roundedStep & 0xf
  const carryIntoPadding = (roundedStep & 0x10) !== 0
  const ok = decoded === msg && !carryIntoPadding
  const bits = Array.from({ length: TOY_BITS }, (_, i) => (word >> (TOY_BITS - 1 - i)) & 1)
  const regionOf = (i: number) => (i === 0 ? 'padding' : i <= 4 ? 'message' : 'noise')
  return (
    <div className="glass-panel p-3 space-y-3">
      <p className="text-sm font-semibold text-foreground">TFHE: message in the top bits</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-xs text-muted-foreground space-y-1">
          <span>
            4-bit message m = <span className="font-mono text-foreground">{msg}</span>
          </span>
          <input
            type="range"
            min={0}
            max={15}
            value={msg}
            onChange={(e) => {
              setMsg(Number(e.target.value))
              onInteract()
            }}
            className="w-full accent-primary"
            aria-label="TFHE 4-bit message"
          />
        </label>
        <label className="text-xs text-muted-foreground space-y-1">
          <span>
            noise e = <span className="font-mono text-foreground">{err}</span> (step is 2,048)
          </span>
          <input
            type="range"
            min={0}
            max={3000}
            value={err}
            onChange={(e) => {
              setErr(Number(e.target.value))
              onInteract()
            }}
            className="w-full accent-primary"
            aria-label="TFHE noise"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-0.5" aria-label={`16-bit word ${word.toString(2)}`}>
        {bits.map((b, i) => {
          const r = regionOf(i)
          const cls =
            r === 'padding'
              ? 'border-warning/60 bg-warning/10'
              : r === 'message'
                ? 'border-primary/60 bg-primary/10'
                : 'border-border bg-muted'
          return (
            <span
              key={i}
              className={`w-6 h-7 rounded border text-xs font-mono flex items-center justify-center text-foreground ${cls}`}
              title={r}
            >
              {b}
            </span>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        <span className="text-warning">padding bit</span> ·{' '}
        <span className="text-primary">message bits</span> · noise bits. Decryption rounds to the
        nearest multiple of 2,048 and reads the message bits.
      </p>
      <p className={`text-sm font-semibold ${ok ? 'text-success' : 'text-destructive'}`}>
        Decrypted message: <span className="font-mono">{decoded}</span>{' '}
        {ok
          ? '— the noise was rounded away'
          : carryIntoPadding
            ? '— the noise carried into the padding bit and the message is wrong'
            : '— the noise passed half a step and flipped the message'}
      </p>
    </div>
  )
}

const EncodeDecodeDemo: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [values, setValues] = useState<string[]>(DEFAULT_VALUES)
  const [logDelta, setLogDelta] = useState(40)
  const [noiseBits, setNoiseBits] = useState(0)
  const [precision, setPrecision] = useState(20)

  const delta = 2 ** logDelta
  const error = noiseBits === 0 ? 0 : 2 ** noiseBits
  const rows = useMemo(
    () =>
      values.map((raw) => {
        const x = Number(raw)
        if (raw.trim() === '' || !Number.isFinite(x) || Math.abs(x) > MAX_ABS) {
          return { raw, valid: false as const }
        }
        const encoded = Math.round(x * delta)
        const noisy = encoded + error
        const decoded = noisy / delta
        const releasedInt = Math.round(decoded * 2 ** precision)
        const released = releasedInt / 2 ** precision
        return { raw, valid: true as const, x, encoded, noisy, decoded, releasedInt, released }
      }),
    [values, delta, error, precision]
  )

  return (
    <div className="space-y-4">
      <WhatYouSee>
        How CKKS turns real numbers into integers with a scale Δ, why noise only disturbs the low
        bits, and how a release rounded to p bits hides them. Then how TFHE keeps a small message in
        the top bits so decryption can round the noise away.
      </WhatYouSee>
      <IllustrationLabel />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {values.map((v, i) => (
          <Input
            key={i}
            value={v}
            inputMode="decimal"
            aria-label={`Value ${i + 1}`}
            onChange={(e) => {
              const next = [...values]
              next[i] = e.target.value
              setValues(next)
              onInteract()
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs text-muted-foreground space-y-1">
          <span>
            scale Δ = 2<sup>{logDelta}</sup>
          </span>
          <input
            type="range"
            min={10}
            max={40}
            value={logDelta}
            onChange={(e) => {
              setLogDelta(Number(e.target.value))
              onInteract()
            }}
            className="w-full accent-primary"
            aria-label="Scale Delta exponent"
          />
        </label>
        <label className="text-xs text-muted-foreground space-y-1">
          <span>noise e = {noiseBits === 0 ? '0' : <>2^{noiseBits}</>} (illustrative)</span>
          <input
            type="range"
            min={0}
            max={30}
            value={noiseBits}
            onChange={(e) => {
              setNoiseBits(Number(e.target.value))
              onInteract()
            }}
            className="w-full accent-primary"
            aria-label="Illustrative noise exponent"
          />
        </label>
        <label className="text-xs text-muted-foreground space-y-1">
          <span>release precision p = {precision} bits</span>
          <input
            type="range"
            min={4}
            max={30}
            value={precision}
            onChange={(e) => {
              setPrecision(Number(e.target.value))
              onInteract()
            }}
            className="w-full accent-primary"
            aria-label="Release precision bits"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="py-1 pr-3 font-sans font-medium">x</th>
              <th className="py-1 pr-3 font-sans font-medium">encoded round(x·Δ)</th>
              <th className="py-1 pr-3 font-sans font-medium">decoded (x·Δ+e)/Δ</th>
              <th className="py-1 pr-3 font-sans font-medium">released round(v·2^p)</th>
              <th className="py-1 font-sans font-medium">released value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) =>
              r.valid ? (
                <tr key={i} className="border-b border-border/50 text-foreground">
                  <td className="py-1 pr-3">{r.raw}</td>
                  <td className="py-1 pr-3 break-all">{fmtInt(r.encoded)}</td>
                  <td className="py-1 pr-3">{r.decoded.toPrecision(12)}</td>
                  <td className="py-1 pr-3" data-testid={`released-int-${i}`}>
                    {fmtInt(r.releasedInt)}
                  </td>
                  <td className="py-1">{r.released.toPrecision(10)}</td>
                </tr>
              ) : (
                <tr key={i} className="border-b border-border/50 text-muted-foreground">
                  <td className="py-1 pr-3">{r.raw || '—'}</td>
                  <td className="py-1 font-sans" colSpan={4}>
                    enter a number between −{MAX_ABS} and {MAX_ABS}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Roughly log₂Δ − log₂e bits survive the noise. When the noise reaches the 2<sup>−p</sup>{' '}
        rounding step, the released integer changes; below it, the release hides the noise. Our HSM
        decryption policy v2 releases exactly this rounded integer to the data owner.
      </p>
      <div className="glass-panel p-3 bg-muted/30 text-xs text-muted-foreground">
        <strong className="text-foreground">Measured:</strong> our HSM owner releases at
        precisionBits 20 kept{' '}
        {RELEASE_PRECISION_MEASURED.map((m, i) => (
          <React.Fragment key={m.evidence}>
            {i > 0 && ' and '}
            <EvidenceCite of={m.evidence}>{m.bits.toFixed(1)} bits</EvidenceCite>
          </React.Fragment>
        ))}{' '}
        of precision after a bootstrap (MX95 and MX95 Pro tokens, 32,768 slots, scale 2⁴⁰).
      </div>
      <TfheBitDemo onInteract={onInteract} />
      <p className="text-xs text-muted-foreground">
        The toy word has 16 bits; TFHE-rs uses 64-bit words and larger messages are split into
        blocks, but the layout is the same idea.
      </p>
      <Sources
        items={[
          <>
            Microsoft SEAL examples (CKKS basics): &ldquo;The floating-point coefficients &hellip;
            will be scaled up by the parameter scale&rdquo;; &ldquo;think of the scale as
            determining the bit-precision of the encoding&rdquo;.
          </>,
          <>
            TFHE-rs documentation: &ldquo;encode it as a plaintext by shifting the message to the
            most significant bits&rdquo;; the encryption &ldquo;encodes the noise in the least
            significant bits&rdquo;; the padding bit is consumed by a carry.
          </>,
          <>Release precision: our evidence records, linked on the numbers above.</>,
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card 3: program to FHE circuit                                     */
/* ------------------------------------------------------------------ */

const CircuitDemo: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const [pid, setPid] = useState<ProgramId>('branch')
  const p = PROGRAMS.find((x) => x.id === pid)!
  return (
    <div className="space-y-4">
      <WhatYouSee>
        An ordinary program rewritten so that nothing depends on secret data: both branches are
        computed and a select picks the result, loops with known bounds are unrolled, and CKKS
        replaces comparisons with polynomial approximations.
      </WhatYouSee>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a program">
        {PROGRAMS.map((x) => (
          <Button
            key={x.id}
            size="sm"
            variant={x.id === pid ? 'default' : 'outline'}
            aria-pressed={x.id === pid}
            onClick={() => {
              setPid(x.id)
              onInteract()
            }}
            className="font-mono text-xs h-auto whitespace-normal"
          >
            {x.label}
          </Button>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {[
          { title: 'Ordinary code', code: p.plain },
          { title: 'TFHE (data-oblivious)', code: p.tfhe },
          { title: 'CKKS (add and multiply only)', code: p.ckks },
        ].map((c) => (
          <div key={c.title} className="glass-panel p-3 min-w-0">
            <p className="text-sm font-semibold text-foreground mb-2">{c.title}</p>
            <pre className="text-xs font-mono text-foreground bg-muted rounded p-2 overflow-x-auto whitespace-pre">
              {c.code}
            </pre>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="glass-panel p-3 space-y-1">
          <p className="text-sm font-semibold text-foreground">TFHE</p>
          <p className="text-muted-foreground">
            Operations: <span className="text-foreground">{p.tfheOps}</span>
          </p>
          {p.tfheMs !== null && (
            <p className="text-muted-foreground">
              Vendor CPU figures for 64-bit integers add up to about{' '}
              <span className="font-mono text-foreground">{p.tfheMs.toFixed(1)} ms</span>{' '}
              (sequential sum of the per-operation times).
            </p>
          )}
          <p className="text-muted-foreground">{p.tfheNote}</p>
        </div>
        <div className="glass-panel p-3 space-y-1">
          <p className="text-sm font-semibold text-foreground">CKKS</p>
          <p className="text-muted-foreground">
            Operations: <span className="text-foreground">{p.ckksOps}</span>
          </p>
          <p className="text-muted-foreground">
            Multiplicative depth: <span className="text-foreground">{p.ckksDepth}</span>
          </p>
          <p className="text-muted-foreground">{p.ckksNote}</p>
        </div>
      </div>
      <div className="glass-panel p-3 bg-muted/30 text-xs text-muted-foreground">
        TFHE-rs CPU benchmark, FheUint64 (vendor figures, AWS hpc8a.96xlarge): add{' '}
        {TFHE_RS_U64_MS.add} ms, compare {TFHE_RS_U64_MS.compare} ms, select {TFHE_RS_U64_MS.select}{' '}
        ms, multiply {TFHE_RS_U64_MS.mul} ms, divide {(TFHE_RS_U64_MS.div / 1000).toFixed(2)} s.
        Compilers automate this rewriting: Concrete, HEIR (preprint), EVA (PLDI 2020), CHET (PLDI
        2019) and HECO (USENIX Security 2023).
      </div>
      <Sources
        items={[
          <>
            Viand et al., &ldquo;SoK: Fully Homomorphic Encryption Compilers&rdquo;, IEEE S&amp;P
            2021: &ldquo;FHE computations are, by definition, data-independent&rdquo;; compilers
            &ldquo;emulate, e.g., if/else branches by calculating the result for both branches and
            performing a multiplexing selection afterward&rdquo;.
          </>,
          <>
            TFHE-rs documentation, encrypted conditional: &ldquo;encrypted_condition.select(...)
            &rdquo;; TFHE-rs CPU integer benchmarks (FheUint64).
          </>,
          <>
            Malik et al., &ldquo;Coyote&rdquo;, ASPLOS 2023: &ldquo;any loop with known (plaintext)
            bounds can be fully unrolled&rdquo;.
          </>,
          <>
            Cheon, Kim, Kim, &ldquo;Efficient Homomorphic Comparison Methods with Optimal
            Complexity&rdquo;, ASIACRYPT 2020: composite polynomials approximating sign.
          </>,
        ]}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Card 4: key streaming and chunk size                               */
/* ------------------------------------------------------------------ */

const fmtSeconds = (s: number) => (s >= 100 ? `${s.toFixed(0)} s` : `${s.toFixed(1)} s`)
const fmtMiB = (kib: number) => `${(kib / 1024).toFixed(1)} MiB`
const ANIMATION_TICKS = 120

const StreamDemo: React.FC<{ onInteract: () => void }> = ({ onInteract }) => {
  const reduced = usePrefersReducedMotion()
  const [limbs, setLimbs] = useState<LimbChoice>(8)
  const [device, setDevice] = useState<StreamDevice>('m4pro')
  const [progress, setProgress] = useState(0) // 0..1
  const [playing, setPlaying] = useState(false)

  const calls = CALLS_BY_LIMBS[limbs]
  const dev = STREAM_DEVICES.find((d) => d.id === device)!
  const m = dev.measured[limbs]
  const estimate = dev.fit ? dev.fit.workSeconds + (dev.fit.perCallMs / 1000) * calls : null
  const chunkBytes = limbs * LIMB_BYTES

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      setProgress((p) => {
        const next = p + 1 / ANIMATION_TICKS
        if (next >= 1) {
          setPlaying(false)
          return 1
        }
        return next
      })
    }, 50)
    return () => clearInterval(t)
  }, [playing])

  const play = () => {
    onInteract()
    if (reduced) {
      setProgress(1)
      return
    }
    if (progress >= 1) setProgress(0)
    setPlaying((p) => !p)
  }

  const doneCalls = Math.round(progress * calls)
  const keysDone = Math.floor(progress * KEY_COUNT)

  return (
    <div className="space-y-4">
      <WhatYouSee>
        The token producing the 51 evaluation keys a bounded chunk at a time and streaming each
        chunk out, and what the chunk size does to time and token memory on our devices, before and
        after the token learned to cache work between calls, from our measurements.
      </WhatYouSee>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Limbs per call (one limb = 512 KB at N = 2¹⁶)
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Limbs per call">
          {LIMB_CHOICES.map((l) => (
            <Button
              key={l}
              size="sm"
              variant={l === limbs ? 'default' : 'outline'}
              aria-pressed={l === limbs}
              onClick={() => {
                setLimbs(l)
                setProgress(0)
                setPlaying(false)
                onInteract()
              }}
            >
              {l}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Device running the token</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Device">
          {STREAM_DEVICES.map((d) => (
            <Button
              key={d.id}
              size="sm"
              variant={d.id === device ? 'default' : 'outline'}
              aria-pressed={d.id === device}
              onClick={() => {
                setDevice(d.id)
                onInteract()
              }}
              className="h-auto whitespace-normal"
            >
              {d.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-3 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">
            Token → network → FHE server, {fmtInt(calls)} calls of {limbs} limb
            {limbs > 1 ? 's' : ''} ({(chunkBytes / 1_048_576).toFixed(1)} MiB each)
          </p>
          <Button size="sm" variant="outline" onClick={play} aria-label="Play the key stream">
            {playing ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
            {playing ? 'Pause' : progress >= 1 ? 'Replay' : 'Play'}
          </Button>
        </div>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: 'repeat(17, minmax(0, 1fr))' }}
          aria-label={`${keysDone} of ${KEY_COUNT} keys streamed`}
          role="img"
        >
          {Array.from({ length: KEY_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-3 rounded-sm border ${
                i < keysDone ? 'bg-primary border-primary' : 'bg-muted border-border'
              }`}
            />
          ))}
        </div>
        <Bar pct={progress * 100} tone="ok" label="Calls completed" />
        <p className="text-xs text-muted-foreground font-mono">
          call {fmtInt(doneCalls)} / {fmtInt(calls)} · {keysDone} / {KEY_COUNT} keys ·{' '}
          {((progress * KEYSET_BYTES) / 1e9).toFixed(2)} / {(KEYSET_BYTES / 1e9).toFixed(2)} GB
        </p>
        <p className="text-xs text-muted-foreground">
          Each key is up to 5 RNS digits × 30 limbs; the token never holds more than one chunk.
        </p>
      </div>

      <div className="glass-panel p-3 space-y-1 text-sm" aria-live="polite">
        <p className="font-semibold text-foreground">
          {dev.label}, {limbs} limb{limbs > 1 ? 's' : ''} per call
        </p>
        <p className="text-muted-foreground">
          Calls: <span className="font-mono text-foreground">{fmtInt(calls)}</span>
        </p>
        {m ? (
          <>
            <p className="text-muted-foreground">
              Measured generation time:{' '}
              <span className="font-mono text-foreground" data-testid="stream-seconds">
                {fmtSeconds(m.seconds)}
              </span>{' '}
              · token peak memory:{' '}
              <span className="font-mono text-foreground">{fmtMiB(m.peakKiB)}</span>{' '}
              <EvidenceCite of={m.evidence}>(evidence)</EvidenceCite>
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground" data-testid="stream-seconds">
              Not measured
            </span>{' '}
            at this chunk size on this device.
          </p>
        )}
        {dev.fit && estimate !== null ? (
          <p className="text-xs text-muted-foreground">
            Estimate from the fitted model (not a measurement): {dev.fit.workSeconds} s of work +{' '}
            {dev.fit.perCallMs} ms per call × {fmtInt(calls)} calls ≈ {fmtSeconds(estimate)}{' '}
            <EvidenceCite of={dev.fit.evidence}>(fit published with the sweep)</EvidenceCite>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No fitted model for this device: it was measured at 8 and 30 limbs per call only, and
            with the cached generator chunk size barely changes the time.
          </p>
        )}
      </div>

      <div className="glass-panel p-3 bg-muted/30 text-xs text-muted-foreground space-y-1">
        <p>
          <strong className="text-foreground">Trade-off:</strong> smaller chunks need less token
          memory but more calls. In the first version every call paid a fixed cost (the token
          regenerated the secret and the digit&apos;s error polynomial each time); larger chunks cut
          the calls and grow memory by about 1 MiB per extra limb.
        </p>
        <p>
          <strong className="text-foreground">Cached generator:</strong> the token now keeps its
          expanded secret and the NTT tables between calls and can use all six cores. The bytes do
          not change; time drops (one MX95 core <EvidenceCite of="cachedMx95">214 s</EvidenceCite>,
          six MX95 Pro cores <EvidenceCite of="cachedMx95pro">84 s</EvidenceCite> at 8 limbs per
          call) and token memory rises to 65–124 MiB. Setting the cache to 0 keeps the token at
          about 16 MiB at about twice the time.
        </p>
        <p>
          <strong className="text-foreground">
            On the board the CPU is the limit, not the 1 GbE link:
          </strong>{' '}
          on the MX95 the first version generated the set in{' '}
          <EvidenceCite of="mx95">473 s</EvidenceCite> with the output discarded, and streamed it to
          the Mac in <EvidenceCite of="mx95">498 s</EvidenceCite>. At 1 Gb/s line rate the 3.94 GB
          would take about 32 s. The fastest board run, six MX95 Pro cores at 30 limbs per call,
          takes <EvidenceCite of="cachedMx95pro">72.4 s</EvidenceCite> (54 MB/s), about half of the
          link.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

const CARD_IDS: CardId[] = ['noise', 'encode', 'circuit', 'stream', 'rotation', 'shared']

export const FheConceptsWorkshop: React.FC<{
  onComplete?: () => void
  /** Open this card first (a link from the Learn tab); default is the noise card. */
  initialCard?: CardId
}> = ({ onComplete, initialCard }) => {
  const reduced = usePrefersReducedMotion()
  const [expanded, setExpanded] = useState<CardId | null>(
    initialCard && CARD_IDS.includes(initialCard) ? initialCard : 'noise'
  )
  const [done, setDone] = useState<Set<CardId>>(new Set())

  const mark = useCallback(
    (id: CardId) => {
      setDone((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        next.add(id)
        if (next.size === CARD_IDS.length) onComplete?.()
        return next
      })
    },
    [onComplete]
  )
  const toggle = (id: CardId) => setExpanded((p) => (p === id ? null : id))

  const cards: {
    id: CardId
    title: string
    short: string
    subtitle: string
    border: string
    icon: React.ElementType
    body: React.ReactNode
  }[] = [
    {
      id: 'noise',
      title: 'Noise budget and bootstrapping',
      short: 'Noise',
      subtitle: 'CKKS levels and TFHE noise, side by side',
      border: 'border-l-primary',
      icon: BatteryMedium,
      body: <NoiseBudgetDemo onInteract={() => mark('noise')} />,
    },
    {
      id: 'encode',
      title: 'Encode, decode and rounding',
      short: 'Encoding',
      subtitle: 'The CKKS scale Δ, the rounded release, and the TFHE bit layout',
      border: 'border-l-secondary',
      icon: Ruler,
      body: <EncodeDecodeDemo onInteract={() => mark('encode')} />,
    },
    {
      id: 'circuit',
      title: 'From a program to an FHE circuit',
      short: 'Circuits',
      subtitle: 'Both branches, select, unrolled loops, approximated comparisons',
      border: 'border-l-accent',
      icon: GitBranch,
      body: <CircuitDemo onInteract={() => mark('circuit')} />,
    },
    {
      id: 'stream',
      title: 'Key streaming and chunk size',
      short: 'Streaming',
      subtitle: 'The 51-key CKKS set leaving the token chunk by chunk, measured',
      border: 'border-l-success',
      icon: Layers,
      body: <StreamDemo onInteract={() => mark('stream')} />,
    },
    {
      id: 'rotation',
      title: 'Key rotation without decrypting',
      short: 'Rotation',
      subtitle: 'Move stored ciphertexts to a new key, and see what the token refuses',
      border: 'border-l-warning',
      icon: RefreshCw,
      body: <RotationView onInteract={() => mark('rotation')} />,
    },
    {
      id: 'shared',
      title: 'Shared (2-of-2) decryption',
      short: 'Shared',
      subtitle: 'Two tokens each hold a share: what it costs, what it fixes, what it does not',
      border: 'border-l-destructive',
      icon: Users,
      body: <SharedDecryptView onInteract={() => mark('shared')} />,
    },
  ]

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <div className="space-y-5">
        <p className="text-muted-foreground leading-relaxed">
          Six hands-on views of what makes FHE different from ordinary encryption: noise that must
          be managed, numbers that are scaled and rounded, programs that cannot branch on secret
          data, evaluation keys large enough that the custodian streams them out in pieces, a key
          that can be rotated without decrypting the data, and a secret that two tokens can hold as
          shares. Concepts use simplified math; measured numbers link to their evidence.
        </p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Progress:</span>
          {cards.map((c) => (
            <span
              key={c.id}
              className={`px-2 py-0.5 rounded-full border text-xs ${
                done.has(c.id)
                  ? 'border-success text-success bg-success/10'
                  : 'border-border text-muted-foreground'
              }`}
            >
              {c.short}
              {done.has(c.id) && ' ✓'}
            </span>
          ))}
        </div>
        {cards.map((c) => (
          <ConceptSection
            key={c.id}
            id={c.id}
            title={c.title}
            subtitle={c.subtitle}
            borderColor={c.border}
            icon={c.icon}
            isExpanded={expanded === c.id}
            onToggle={() => toggle(c.id)}
            isCompleted={done.has(c.id)}
          >
            {c.body}
          </ConceptSection>
        ))}
      </div>
    </MotionConfig>
  )
}
