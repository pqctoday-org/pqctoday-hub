// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Network,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CRV_SIZE_TABLE,
  THRESHOLD_DEMO_PARAMS,
  LMS_PARAMETER_SETS,
} from '../data/statefulSigsConstants'

type Phase = 'config' | 'setup' | 'signing' | 'result'

interface TrusteeCard {
  id: number
  name: string
  shareHex: string
  selected: boolean
}

// FNV-1a 32-bit hash → deterministic 8-char hex, no external deps
function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function generateTrustees(n: number, paramId: string): TrusteeCard[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i + 1,
    name: `Trustee ${i + 1}`,
    shareHex: fnv1a(`share-${paramId}-trustee-${i + 1}`),
    selected: false,
  }))
}

function simulateSignature(message: string, selectedIds: number[], paramId: string): string {
  const seed = `sig-${paramId}-${message}-${selectedIds.sort().join(',')}`
  const h1 = fnv1a(seed)
  const h2 = fnv1a(seed + '-ext')
  const h3 = fnv1a(seed + '-ext2')
  const h4 = fnv1a(seed + '-ext3')
  return `${h1}${h2}${h3}${h4}...`
}

const PARAM_LABELS: Record<string, string> = {
  'lms-h5-w1': 'LMS H5/W1 (32 sigs)',
  'lms-h5-w8': 'LMS H5/W8 (32 sigs, compact)',
  'lms-h10-w4': 'LMS H10/W4 (1 024 sigs)',
}

export const ThresholdSigningDemo: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('config')
  const [n, setN] = useState(3)
  const [t, setT] = useState(2)
  const [paramId, setParamId] = useState<string>(THRESHOLD_DEMO_PARAMS[0])
  const [trustees, setTrustees] = useState<TrusteeCard[]>([])
  const [message, setMessage] = useState('Hello PQC World')
  const [signature, setSignature] = useState<string | null>(null)
  const [aggregating, setAggregating] = useState(false)
  const [insufficientShares, setInsufficientShares] = useState(false)

  const selectedCount = trustees.filter((t) => t.selected).length
  const paramSet = LMS_PARAMETER_SETS.find((p) => p.id === paramId)

  const handleBeginSetup = useCallback(() => {
    setTrustees(generateTrustees(n, paramId))
    setSignature(null)
    setInsufficientShares(false)
    setPhase('setup')
  }, [n, paramId])

  const handleProceedToSigning = useCallback(() => {
    setPhase('signing')
  }, [])

  const toggleTrustee = useCallback((id: number) => {
    setTrustees((prev) => prev.map((tr) => (tr.id === id ? { ...tr, selected: !tr.selected } : tr)))
    setInsufficientShares(false)
    setSignature(null)
  }, [])

  const handleAggregate = useCallback(async () => {
    const selected = trustees.filter((tr) => tr.selected)
    if (selected.length < t) {
      setInsufficientShares(true)
      return
    }
    setAggregating(true)
    await new Promise((r) => setTimeout(r, 800))
    setSignature(
      simulateSignature(
        message,
        selected.map((tr) => tr.id),
        paramId
      )
    )
    setAggregating(false)
    setPhase('result')
  }, [trustees, t, message, paramId])

  const handleReset = useCallback(() => {
    setPhase('config')
    setTrustees([])
    setSignature(null)
    setInsufficientShares(false)
    setN(3)
    setT(2)
    setParamId(THRESHOLD_DEMO_PARAMS[0])
    setMessage('Hello PQC World')
  }, [])

  const handleTryInsufficient = useCallback(() => {
    setTrustees((prev) => prev.map((tr) => ({ ...tr, selected: false })))
    setSignature(null)
    setInsufficientShares(false)
    setPhase('signing')
  }, [])

  return (
    <div className="space-y-6">
      {/* Phase stepper */}
      <div className="flex items-center gap-2 text-sm">
        {(['config', 'setup', 'signing', 'result'] as Phase[]).map((p, i) => {
          const labels = ['1. Configure', '2. Dealer Setup', '3. Sign', '4. Result']
          const active = p === phase
          const done = (['config', 'setup', 'signing', 'result'] as Phase[]).indexOf(phase) > i
          return (
            <React.Fragment key={p}>
              <span
                className={`px-2 py-0.5 rounded font-medium ${
                  active
                    ? 'bg-primary/20 text-primary'
                    : done
                      ? 'text-status-success'
                      : 'text-muted-foreground'
                }`}
              >
                {labels[i]}
              </span>
              {i < 3 && <ChevronRight size={14} className="text-muted-foreground shrink-0" />}
            </React.Fragment>
          )
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main panel */}
        <div className="xl:col-span-2 space-y-6">
          {/* ── Phase 1: Config ── */}
          {phase === 'config' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Network size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground text-lg">Configure Threshold</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Set the number of trustees <em>n</em> and the signing threshold <em>t</em>. Any{' '}
                <em>t</em> of <em>n</em> trustees can produce a valid signature. Only single-level
                LMS is supported — HSS hypertrees are impractical (see CRV table →).
              </p>

              {/* n/t selectors */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Trustees (n): <span className="text-primary font-bold">{n}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const next = Math.max(2, n - 1)
                        setN(next)
                        if (t > next) setT(next)
                      }}
                      className="w-9 h-9 p-0"
                    >
                      −
                    </Button>
                    <div className="flex-1 text-center text-lg font-bold text-foreground">{n}</div>
                    <Button
                      variant="outline"
                      onClick={() => setN(Math.min(5, n + 1))}
                      className="w-9 h-9 p-0"
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Range: 2–5 (practical limit)</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Threshold (t): <span className="text-primary font-bold">{t}</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setT(Math.max(1, t - 1))}
                      className="w-9 h-9 p-0"
                    >
                      −
                    </Button>
                    <div className="flex-1 text-center text-lg font-bold text-foreground">{t}</div>
                    <Button
                      variant="outline"
                      onClick={() => setT(Math.min(n, t + 1))}
                      className="w-9 h-9 p-0"
                    >
                      +
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Must be ≤ n</p>
                </div>
              </div>

              {/* LMS param selector */}
              <div className="space-y-2">
                <span className="text-sm font-medium text-foreground">LMS Parameter Set</span>
                <div className="flex flex-wrap gap-2">
                  {THRESHOLD_DEMO_PARAMS.map((pid) => (
                    <Button
                      key={pid}
                      variant={paramId === pid ? 'gradient' : 'outline'}
                      onClick={() => setParamId(pid)}
                      className="text-sm"
                    >
                      {PARAM_LABELS[pid]}
                    </Button>
                  ))}
                </div>
                {paramSet && (
                  <p className="text-xs text-muted-foreground">
                    Sig size: {paramSet.signatureSize.toLocaleString()} B · Max sigs:{' '}
                    {paramSet.maxSignatures.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="rounded-lg bg-muted/40 border border-border p-3 text-sm text-muted-foreground flex gap-2">
                <Info size={16} className="shrink-0 mt-0.5 text-primary" />
                <span>
                  This is an <strong className="text-foreground">educational simulation</strong>.
                  Shares and signatures are illustrative — no real LMS cryptography is performed.
                  Real CRV sizes are shown in the side panel.
                </span>
              </div>

              <Button variant="gradient" onClick={handleBeginSetup} className="w-full py-3">
                Begin Dealer Setup →
              </Button>
            </div>
          )}

          {/* ── Phase 2: Dealer Setup ── */}
          {phase === 'setup' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground text-lg">
                  Dealer Setup — {t}-of-{n} Threshold
                </h3>
              </div>

              <p className="text-sm text-muted-foreground">
                A trusted dealer generates an LMS key pair and splits the Winternitz OTS tables into
                shares using a PRF. Each trustee receives a secret share. The Common Reference Value
                (CRV) holds correction values for each Merkle tree node; it is published and
                accessible to an aggregator.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Dealer */}
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-primary text-sm">
                    <ShieldCheck size={16} />
                    Trusted Dealer
                  </div>
                  <p className="text-xs text-muted-foreground">Generates LMS key pair</p>
                  <code className="block text-xs font-mono text-foreground bg-muted/60 rounded px-2 py-1 break-all">
                    pk: {fnv1a(`pk-${paramId}`)}…
                  </code>
                  <code className="block text-xs font-mono text-muted-foreground bg-muted/60 rounded px-2 py-1 break-all">
                    sk: {fnv1a(`sk-${paramId}`)}…
                  </code>
                </div>

                {/* CRV */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Network size={16} className="text-primary" />
                    CRV (Published)
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Correction values for each tree node. Real size ≈ {CRV_SIZE_TABLE[0].twoOfThree}{' '}
                    for {t}-of-{n}.
                  </p>
                  <div className="space-y-1">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div
                        key={i}
                        className="text-xs font-mono text-muted-foreground bg-muted/60 rounded px-2 py-0.5"
                      >
                        node[{i}]: {fnv1a(`crv-${paramId}-node-${i}`)}…
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground pl-2">
                      + {Math.pow(2, paramSet?.treeHeight ?? 5) - 4} more…
                    </div>
                  </div>
                </div>

                {/* Trustees */}
                <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
                    <Users size={16} className="text-primary" />
                    Trustees ({n})
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Each receives a secret share of the OTS key material.
                  </p>
                  <div className="space-y-1">
                    {trustees.map((tr) => (
                      <div
                        key={tr.id}
                        className="flex items-center justify-between text-xs font-mono bg-muted/60 rounded px-2 py-0.5"
                      >
                        <span className="text-foreground">{tr.name}</span>
                        <span className="text-muted-foreground">{tr.shareHex}…</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button variant="gradient" onClick={handleProceedToSigning} className="w-full py-3">
                Proceed to Signing →
              </Button>
            </div>
          )}

          {/* ── Phase 3: Signing ── */}
          {phase === 'signing' && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-primary" />
                <h3 className="font-semibold text-foreground text-lg">
                  Threshold Signing — select {t} of {n} trustees
                </h3>
              </div>

              <div className="space-y-2">
                <label htmlFor="threshold-message" className="text-sm font-medium text-foreground">
                  Message to sign
                </label>
                <input
                  id="threshold-message"
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Select participating trustees
                  </span>
                  <span
                    className={`text-sm font-semibold ${selectedCount >= t ? 'text-status-success' : 'text-status-warning'}`}
                  >
                    {selectedCount} / {t} required selected
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {trustees.map((tr) => (
                    <Button
                      key={tr.id}
                      variant="ghost"
                      onClick={() => toggleTrustee(tr.id)}
                      className={`h-auto rounded-lg border p-3 text-left transition-colors flex-col items-start ${
                        tr.selected
                          ? 'border-primary/60 bg-primary/10 text-foreground'
                          : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="font-medium text-sm">{tr.name}</span>
                        {tr.selected ? (
                          <CheckCircle2 size={16} className="text-status-success" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border" />
                        )}
                      </div>
                      <code className="text-xs text-muted-foreground mt-1 block">
                        share: {tr.shareHex}…
                      </code>
                    </Button>
                  ))}
                </div>
              </div>

              {insufficientShares && (
                <div className="flex items-center gap-2 rounded-lg border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-sm text-status-warning">
                  <AlertTriangle size={16} className="shrink-0" />
                  Insufficient shares — need at least {t} trustees to produce a valid signature.
                </div>
              )}

              <Button
                variant="gradient"
                onClick={handleAggregate}
                disabled={aggregating}
                className="w-full py-3"
              >
                {aggregating ? 'Aggregating shares…' : `Aggregate & Sign (${selectedCount}/${t})`}
              </Button>
            </div>
          )}

          {/* ── Phase 4: Result ── */}
          {phase === 'result' && signature && (
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-status-success" />
                <h3 className="font-semibold text-foreground text-lg">Signature Produced</h3>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Simulated LMS Signature
                </span>
                <code className="block text-xs font-mono text-foreground bg-muted/60 rounded px-3 py-2 break-all">
                  {signature}
                </code>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-status-success/40 bg-status-success/10 px-3 py-2 text-sm text-status-success">
                <CheckCircle2 size={16} className="shrink-0" />
                Verified against LMS public key (simulation)
              </div>

              {/* Key reuse prevention comparison */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Key Reuse Prevention</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-status-error/30 bg-status-error/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-status-error">
                      <XCircle size={14} />
                      Single Signer
                    </div>
                    <p className="text-xs text-muted-foreground">
                      One device crash or bug → same OTS leaf reused → private key exposed.
                      Catastrophic.
                    </p>
                  </div>
                  <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3 space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-status-success">
                      <CheckCircle2 size={14} />
                      {t}-of-{n} Threshold
                    </div>
                    <p className="text-xs text-muted-foreground">
                      All {t} trustees must independently reuse the same leaf. Significantly harder
                      to trigger accidentally.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleTryInsufficient}
                  className="flex-1 text-sm"
                >
                  Try Insufficient Shares
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 text-sm"
                >
                  <RotateCcw size={14} />
                  Reset Demo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Side Panel ── */}
        <div className="space-y-4">
          {/* CRV size table */}
          <div className="glass-panel p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Network size={16} className="text-primary" />
              <h4 className="font-semibold text-foreground text-sm">CRV Size vs. HSS Levels</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Common Reference Value grows explosively with tree levels — making HSS hypertrees
              impractical for thresholdisation.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1 pr-2 font-medium">Scheme</th>
                    <th className="text-right py-1 px-1 font-medium">2-of-3</th>
                    <th className="text-right py-1 pl-1 font-medium">3-of-5</th>
                  </tr>
                </thead>
                <tbody>
                  {CRV_SIZE_TABLE.map((row) => (
                    <tr
                      key={row.levels}
                      className={`border-b border-border/50 ${!row.practical ? 'opacity-60' : ''}`}
                    >
                      <td className="py-1 pr-2 text-foreground">{row.label}</td>
                      <td
                        className={`text-right py-1 px-1 font-mono ${row.twoOfThree === 'Impractical' ? 'text-status-error' : 'text-foreground'}`}
                      >
                        {row.twoOfThree}
                      </td>
                      <td
                        className={`text-right py-1 pl-1 font-mono ${row.threeOfFive === 'Impractical' ? 'text-status-error' : 'text-foreground'}`}
                      >
                        {row.threeOfFive}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why not HSS multi-level */}
          <div className="glass-panel p-4 space-y-2 border border-status-warning/30">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-status-warning" />
              <h4 className="font-semibold text-foreground text-sm">Why Not HSS Multi-Level?</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              HSS hypertrees require correction values for <em>every node at every level</em>. Each
              authorised signing subset needs its own set of correction values. For 2+ levels the
              CRV reaches GB–TB scale, making the Haystack construction{' '}
              <strong className="text-status-warning">explicitly impractical</strong> for HSS.
            </p>
            <p className="text-xs text-muted-foreground">
              RFC 8554 and RFC 9858 define no threshold variant. This demo is restricted to
              single-level LMS only.
            </p>
          </div>

          {/* Research citation */}
          <div className="glass-panel p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Info size={16} className="text-primary" />
              <h4 className="font-semibold text-foreground text-sm">Research Basis</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Haystack / Coalition Construction</strong>
              <br />
              Kelsey, Lang &amp; Lucks — threshold stateful hash-based signatures via trusted dealer
              + Common Reference Value. Practical only for small thresholds (n ≤ 5–6) on
              single-level trees.
            </p>
            <p className="text-xs text-muted-foreground">
              For larger thresholds, lattice-based threshold schemes (e.g., threshold Dilithium /
              FROST variants) are currently more practical.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
