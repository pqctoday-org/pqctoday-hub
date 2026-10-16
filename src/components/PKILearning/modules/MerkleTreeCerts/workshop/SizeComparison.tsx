// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState, useMemo } from 'react'
import { BarChart3, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  ALGORITHM_SIZES,
  getSizeBreakdown,
  formatBytes,
  computeProofBytes,
  describeSizeChange,
  STANDALONE_COSIGNATURE_COUNT,
} from '../data/mtcConstants'

// Two subtree cadences, because draft-ietf-plants-merkle-tree-certs-07 §6.5 projects
// two — a standalone subtree is cut every checkpoint (~3,000 certs, 12 hashes, 384 B),
// a landmark-relative one every landmark (~5.4M certs, 23 hashes, 736 B). Driving both
// columns from a single slider is what previously published a 736 B standalone proof,
// nearly double the spec's own estimate.
const STANDALONE_MARKS = [
  { exp: 3, label: 'Demo (8)' },
  { exp: 8, label: 'Fast checkpoint (256)' },
  { exp: 12, label: 'Spec: 2s checkpoint (~3K)' },
  { exp: 16, label: 'Slow checkpoint (65K)' },
]

const LANDMARK_MARKS = [
  { exp: 16, label: 'Frequent (65K)' },
  { exp: 20, label: 'Large CA (1M)' },
  { exp: 23, label: 'Spec: hourly (~5.4M)' },
  { exp: 24, label: 'Max (16.7M)' },
]

function formatBatchSize(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return n.toLocaleString()
}

export const SizeComparison: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>(ALGORITHM_SIZES[2].shortName)
  // Defaults are the spec's own two operating points (§6.5), not one applied twice.
  const [standaloneExponent, setStandaloneExponent] = useState(12) // ~3K certs → 12 hashes → 384 B
  const [landmarkExponent, setLandmarkExponent] = useState(23) // ~5.4M certs → 23 hashes → 736 B

  const standaloneBatch = useMemo(() => Math.pow(2, standaloneExponent), [standaloneExponent])
  const landmarkBatch = useMemo(() => Math.pow(2, landmarkExponent), [landmarkExponent])
  const standaloneProof = useMemo(() => computeProofBytes(standaloneBatch), [standaloneBatch])
  const landmarkProof = useMemo(() => computeProofBytes(landmarkBatch), [landmarkBatch])

  const algo = useMemo(
    () => ALGORITHM_SIZES.find((a) => a.shortName === selectedAlgo) ?? ALGORITHM_SIZES[2],
    [selectedAlgo]
  )

  const breakdown = useMemo(
    () => getSizeBreakdown(algo, standaloneProof, landmarkProof),
    [algo, standaloneProof, landmarkProof]
  )
  const allBreakdowns = useMemo(
    () => ALGORITHM_SIZES.map((a) => getSizeBreakdown(a, standaloneProof, landmarkProof)),
    [standaloneProof, landmarkProof]
  )
  const globalMax = useMemo(
    () => Math.max(...allBreakdowns.map((b) => b.traditionalTotal)),
    [allBreakdowns]
  )
  // Savings range over the post-quantum algorithms only; classical keys behave differently.
  const { pqStandalone, pqLandmark } = useMemo(() => {
    const pq = allBreakdowns.filter((_, i) => ALGORITHM_SIZES[i].category !== 'classical')
    const range = (pick: (b: (typeof pq)[number]) => number) => ({
      min: Math.min(...pq.map(pick)),
      max: Math.max(...pq.map(pick)),
    })
    return {
      pqStandalone: range((b) => b.reductionPercent),
      pqLandmark: range((b) => b.landmarkReductionPercent),
    }
  }, [allBreakdowns])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          TLS Handshake Size: Traditional vs MTC
        </h3>
        <p className="text-sm text-muted-foreground">
          Compare the authentication data a TLS server sends: a traditional leaf-plus-intermediate
          X.509 chain (the root is already in the client&apos;s trust store) versus a Merkle Tree
          Certificate. Every column includes the server&apos;s public key and its CertificateVerify
          signature. The two MTC columns are sized from <em>separate</em> subtrees: a standalone
          certificate&apos;s proof reaches the latest checkpoint, a landmark certificate&apos;s
          reaches the last landmark, and the draft projects those at ~3,000 and ~5.4M certificates
          respectively. Adjust either to see proof size scale logarithmically. In Step 5,
          you&apos;ll see the CA sign a real Merkle root with ML-DSA-44 — the signature that
          replaces the per-certificate CA signatures.
        </p>
      </div>

      {/* Subtree size sliders — one per certificate type (§6.5 projects both separately) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(
          [
            {
              key: 'standalone' as const,
              title: 'Standalone subtree (checkpoint cadence)',
              exponent: standaloneExponent,
              setExponent: setStandaloneExponent,
              batch: standaloneBatch,
              proof: standaloneProof,
              marks: STANDALONE_MARKS,
              min: 3,
              max: 16,
              accent: 'success',
            },
            {
              key: 'landmark' as const,
              title: 'Landmark subtree (landmark cadence)',
              exponent: landmarkExponent,
              setExponent: setLandmarkExponent,
              batch: landmarkBatch,
              proof: landmarkProof,
              marks: LANDMARK_MARKS,
              min: 16,
              max: 24,
              accent: 'primary',
            },
          ] as const
        ).map((cfg) => (
          <div key={cfg.key} className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-foreground">{cfg.title}</h4>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-foreground">
                  {formatBatchSize(cfg.batch)} certs
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border ${
                    cfg.accent === 'success'
                      ? 'bg-success/10 text-success border-success/30'
                      : 'bg-primary/10 text-primary border-primary/30'
                  }`}
                >
                  {cfg.exponent} hashes &rarr; {formatBytes(cfg.proof)}
                </span>
              </div>
            </div>

            <input
              type="range"
              min={cfg.min}
              max={cfg.max}
              step={1}
              value={cfg.exponent}
              onChange={(e) => cfg.setExponent(Number(e.target.value))}
              className={`w-full ${cfg.accent === 'success' ? 'accent-success' : 'accent-primary'}`}
              aria-label={`${cfg.title} (logarithmic)`}
            />

            <div className="flex justify-between mt-1 gap-1">
              {cfg.marks.map((mark) => (
                <Button
                  key={mark.exp}
                  onClick={() => cfg.setExponent(mark.exp)}
                  variant="link"
                  className={`whitespace-normal text-[9px] h-auto p-0 text-left transition-colors ${
                    cfg.exponent === mark.exp
                      ? 'text-primary font-bold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mark.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Algorithm selector */}
      <div>
        <span className="text-sm font-bold text-foreground mb-2 block">Signature Algorithm</span>
        <div className="flex flex-wrap gap-2">
          {ALGORITHM_SIZES.map((a) => (
            <Button
              key={a.shortName}
              onClick={() => setSelectedAlgo(a.shortName)}
              variant="ghost"
              className={`px-3 py-2 h-auto rounded-lg text-xs font-medium transition-colors ${
                selectedAlgo === a.shortName
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {a.shortName}
              <span className="ml-1 text-[10px]">({formatBytes(a.signatureBytes)} sig)</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Detailed breakdown for selected algorithm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Traditional */}
        <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
          <h4 className="text-sm font-bold text-destructive mb-3">Traditional X.509 Chain</h4>
          <div className="space-y-2">
            {breakdown.traditional.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="text-muted-foreground">{item.component}</span>
                  <span className="font-mono text-foreground">{formatBytes(item.bytes)}</span>
                </div>
                <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-destructive/40 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.bytes / breakdown.traditionalTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-destructive/20 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold font-mono text-destructive">
                {formatBytes(breakdown.traditionalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Standalone MTC */}
        <div className="bg-success/5 rounded-lg p-4 border border-success/20">
          <h4 className="text-sm font-bold text-success mb-3">Standalone MTC</h4>
          <p className="text-[10px] text-muted-foreground mb-2">
            Carries {STANDALONE_COSIGNATURE_COUNT} CA cosignature (the minimum; the draft leaves the
            number to relying-party policy) — works without predistributed state.
          </p>
          <div className="space-y-2">
            {breakdown.mtc.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="text-muted-foreground">{item.component}</span>
                  <span className="font-mono text-foreground">{formatBytes(item.bytes)}</span>
                </div>
                <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-success/40 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.bytes / breakdown.traditionalTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-success/20 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold font-mono text-success">
                {formatBytes(breakdown.mtcTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Landmark MTC */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
          <h4 className="text-sm font-bold text-primary mb-3">
            Landmark MTC{' '}
            <span className="text-[10px] font-normal text-success">(no cosignatures)</span>
          </h4>
          <p className="text-[10px] text-muted-foreground mb-2">
            Client pre-syncs the trusted subtree, so the certificate carries no cosignatures. The
            server still sends its key and CertificateVerify signature.
          </p>
          <div className="space-y-2">
            {breakdown.mtcLandmark.map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center text-xs mb-0.5">
                  <span className="text-muted-foreground">{item.component}</span>
                  <span className="font-mono text-foreground">{formatBytes(item.bytes)}</span>
                </div>
                <div className="bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary/40 rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.bytes / breakdown.traditionalTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="border-t border-primary/20 pt-2 mt-2 flex justify-between items-center">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-sm font-bold font-mono text-primary">
                {formatBytes(breakdown.mtcLandmarkTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Reduction badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="text-center bg-success/10 rounded-lg p-4 border border-success/30">
          <span className="text-3xl font-bold text-success">
            {describeSizeChange(breakdown.reductionPercent).text}
          </span>
          <div className="text-sm text-muted-foreground mt-1">
            Standalone MTC ({algo.shortName})
          </div>
        </div>
        <div className="text-center bg-primary/10 rounded-lg p-4 border border-primary/30">
          <span className="text-3xl font-bold text-primary">
            {describeSizeChange(breakdown.landmarkReductionPercent).text}
          </span>
          <div className="text-sm text-muted-foreground mt-1">Landmark MTC ({algo.shortName})</div>
        </div>
      </div>

      {/* All algorithms comparison chart */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-bold text-foreground mb-3">
          <BarChart3 size={14} className="inline mr-1" />
          All Algorithms — Handshake Size Comparison
        </h4>
        <div className="space-y-4">
          {allBreakdowns.map((b, i) => {
            const a = ALGORITHM_SIZES[i]
            const isSelected = a.shortName === selectedAlgo
            return (
              <div
                key={a.shortName}
                className={`transition-all ${isSelected ? 'ring-1 ring-primary rounded-lg p-2' : 'p-2'}`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span
                    className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                  >
                    {a.shortName}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-success font-bold text-[10px]">
                      Standalone {describeSizeChange(b.reductionPercent).text}
                    </span>
                    <span className="text-primary font-bold text-[10px]">
                      Landmark {describeSizeChange(b.landmarkReductionPercent).text}
                    </span>
                  </div>
                </div>
                {/* Traditional bar */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">Trad.</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-destructive/50 rounded-full transition-all duration-500"
                      style={{ width: `${(b.traditionalTotal / globalMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">
                    {formatBytes(b.traditionalTotal)}
                  </span>
                </div>
                {/* Standalone MTC bar */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">MTC</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-success/50 rounded-full transition-all duration-500"
                      style={{ width: `${(b.mtcTotal / globalMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">
                    {formatBytes(b.mtcTotal)}
                  </span>
                </div>
                {/* Landmark MTC bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">Landmark</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded-full transition-all duration-500"
                      style={{ width: `${(b.mtcLandmarkTotal / globalMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">
                    {formatBytes(b.mtcLandmarkTotal)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">Key insight:</strong> An MTC inclusion proof grows{' '}
            <em>logarithmically</em> with subtree size &mdash; doubling the subtree adds only 32
            bytes &mdash; and depends on nothing else, least of all the signature algorithm. That is
            why the two columns differ: {formatBytes(standaloneProof)} for a standalone proof over{' '}
            {formatBatchSize(standaloneBatch)} certs, {formatBytes(landmarkProof)} for a landmark
            proof over {formatBatchSize(landmarkBatch)}. Charging the larger figure to both, as this
            page once did, nearly doubles the standalone proof. The proof replaces the certificate
            signatures, not the server&apos;s own: every handshake still carries the server&apos;s
            public key and a CertificateVerify signature. For the post-quantum algorithms that makes
            standalone MTC about {pqStandalone.min}–{pqStandalone.max}% smaller and landmark MTC
            about {pqLandmark.min}–{pqLandmark.max}% smaller than the leaf-plus-intermediate chain.
            With a classical key the proof is not worth it: a landmark proof (
            {formatBytes(landmarkProof)}) is bigger than an entire ECDSA chain.
          </div>
        </div>
      </div>

      {/* Summary table */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
        <h4 className="text-sm font-bold text-foreground mb-3">Detailed Summary</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 pr-3">Algorithm</th>
              <th className="text-left py-2 px-2">Category</th>
              <th className="text-right py-2 px-2">Traditional</th>
              <th className="text-right py-2 px-2">Standalone</th>
              <th className="text-right py-2 px-2">Landmark</th>
              <th className="text-right py-2 px-2">Standalone vs traditional</th>
              <th className="text-right py-2 pl-2">Landmark vs traditional</th>
            </tr>
          </thead>
          <tbody>
            {ALGORITHM_SIZES.map((a) => {
              const b = getSizeBreakdown(a, standaloneProof, landmarkProof)
              return (
                <tr
                  key={a.shortName}
                  className={`border-b border-border/50 ${
                    a.shortName === selectedAlgo ? 'bg-primary/10' : ''
                  }`}
                >
                  <td className="py-2 pr-3 font-medium text-foreground">{a.shortName}</td>
                  <td className="py-2 px-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        a.category === 'classical'
                          ? 'bg-primary/20 text-primary'
                          : a.category === 'pqc-lattice'
                            ? 'bg-success/20 text-success'
                            : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {a.category === 'classical'
                        ? 'Classical'
                        : a.category === 'pqc-lattice'
                          ? 'Lattice'
                          : 'Hash'}
                    </span>
                  </td>
                  <td className="text-right py-2 px-2 font-mono">
                    {formatBytes(b.traditionalTotal)}
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-success">
                    {formatBytes(b.mtcTotal)}
                  </td>
                  <td className="text-right py-2 px-2 font-mono text-primary">
                    {formatBytes(b.mtcLandmarkTotal)}
                  </td>
                  <td className="text-right py-2 px-2 font-bold text-success">
                    {describeSizeChange(b.reductionPercent).text}
                  </td>
                  <td className="text-right py-2 pl-2 font-bold text-primary">
                    {describeSizeChange(b.landmarkReductionPercent).text}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
