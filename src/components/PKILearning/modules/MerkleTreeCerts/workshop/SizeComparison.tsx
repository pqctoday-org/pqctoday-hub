import React, { useState, useMemo } from 'react'
import { BarChart3, Info } from 'lucide-react'
import { ALGORITHM_SIZES, getSizeBreakdown, formatBytes } from '../data/mtcConstants'

export const SizeComparison: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>(ALGORITHM_SIZES[2].shortName)

  const algo = useMemo(
    () => ALGORITHM_SIZES.find((a) => a.shortName === selectedAlgo) ?? ALGORITHM_SIZES[2],
    [selectedAlgo]
  )

  const breakdown = useMemo(() => getSizeBreakdown(algo), [algo])
  const allBreakdowns = useMemo(() => ALGORITHM_SIZES.map(getSizeBreakdown), [])
  const globalMax = useMemo(
    () => Math.max(...allBreakdowns.map((b) => b.traditionalTotal)),
    [allBreakdowns]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          TLS Handshake Size: Traditional vs MTC
        </h3>
        <p className="text-sm text-muted-foreground">
          Compare the total authentication data transmitted during a TLS handshake using traditional
          X.509 certificate chains versus Merkle Tree Certificates. Select different algorithms to
          see how PQ signature sizes impact both approaches.
        </p>
      </div>

      {/* Algorithm selector */}
      <div>
        <span className="text-sm font-bold text-foreground mb-2 block">Signature Algorithm</span>
        <div className="flex flex-wrap gap-2">
          {ALGORITHM_SIZES.map((a) => (
            <button
              key={a.shortName}
              onClick={() => setSelectedAlgo(a.shortName)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedAlgo === a.shortName
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {a.shortName}
              <span className="ml-1 text-[10px] opacity-70">
                ({formatBytes(a.signatureBytes)} sig)
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed breakdown for selected algorithm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* MTC */}
        <div className="bg-success/5 rounded-lg p-4 border border-success/20">
          <h4 className="text-sm font-bold text-success mb-3">Merkle Tree Certificate</h4>
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
      </div>

      {/* Reduction badge */}
      <div className="text-center bg-success/10 rounded-lg p-4 border border-success/30">
        <span className="text-3xl font-bold text-success">{breakdown.reductionPercent}%</span>
        <span className="text-sm text-muted-foreground ml-2">
          smaller with MTC ({algo.shortName})
        </span>
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
                  <span className="text-success font-bold">&minus;{b.reductionPercent}%</span>
                </div>
                {/* Traditional bar */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">Trad.</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-destructive/50 rounded-full transition-all duration-500"
                      style={{ width: `${(b.traditionalTotal / globalMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">
                    {formatBytes(b.traditionalTotal)}
                  </span>
                </div>
                {/* MTC bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground w-16 shrink-0">MTC</span>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-success/50 rounded-full transition-all duration-500"
                      style={{ width: `${(b.mtcTotal / globalMax) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground w-14 text-right shrink-0">
                    {formatBytes(b.mtcTotal)}
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
            <strong className="text-foreground">Key insight:</strong> The MTC inclusion proof size
            (~736 bytes) is <em>constant</em> regardless of the signature algorithm &mdash; it
            depends only on the tree depth (number of certificates in the batch). This means the
            savings grow proportionally with signature size: MTCs provide a modest 43% reduction for
            ECDSA but a dramatic 74% reduction for SLH-DSA-128s.
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
              <th className="text-right py-2 px-2">Sig Size</th>
              <th className="text-right py-2 px-2">Key Size</th>
              <th className="text-right py-2 px-2">Traditional</th>
              <th className="text-right py-2 px-2">MTC</th>
              <th className="text-right py-2 pl-2">Saved</th>
            </tr>
          </thead>
          <tbody>
            {ALGORITHM_SIZES.map((a) => {
              const b = getSizeBreakdown(a)
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
                    {formatBytes(a.signatureBytes)}
                  </td>
                  <td className="text-right py-2 px-2 font-mono">
                    {formatBytes(a.publicKeyBytes)}
                  </td>
                  <td className="text-right py-2 px-2 font-mono">
                    {formatBytes(b.traditionalTotal)}
                  </td>
                  <td className="text-right py-2 px-2 font-mono">{formatBytes(b.mtcTotal)}</td>
                  <td className="text-right py-2 pl-2 font-bold text-success">
                    {b.reductionPercent}%
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
