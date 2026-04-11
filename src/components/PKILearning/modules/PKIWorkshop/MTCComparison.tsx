// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TreePine, Info } from 'lucide-react'
import {
  ALGORITHM_SIZES,
  getSizeBreakdown,
  formatBytes,
} from '../MerkleTreeCerts/data/mtcConstants'
import { Button } from '@/components/ui/button'

interface MTCComparisonProps {
  onComplete?: () => void
}

export const MTCComparison: React.FC<MTCComparisonProps> = ({ onComplete }) => {
  const [selectedAlgo, setSelectedAlgo] = useState<string>(ALGORITHM_SIZES[2].shortName)

  const algo = useMemo(
    () => ALGORITHM_SIZES.find((a) => a.shortName === selectedAlgo) ?? ALGORITHM_SIZES[2],
    [selectedAlgo]
  )

  const breakdown = useMemo(() => getSizeBreakdown(algo), [algo])

  const maxBytes = Math.max(breakdown.traditionalTotal, breakdown.mtcTotal)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Traditional Chain vs Merkle Tree Certificates
        </h3>
        <p className="text-sm text-muted-foreground">
          Compare the TLS handshake authentication size between a traditional X.509 certificate
          chain and the Merkle Tree Certificate (MTC) approach. Select an algorithm to see how
          signature size impacts both approaches.
        </p>
      </div>

      {/* Algorithm selector */}
      <div>
        <span className="text-sm font-bold text-foreground mb-2 block">Signature Algorithm</span>
        <div className="flex flex-wrap gap-2">
          {ALGORITHM_SIZES.map((a) => (
            <Button
              variant="ghost"
              key={a.shortName}
              onClick={() => setSelectedAlgo(a.shortName)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                selectedAlgo === a.shortName
                  ? 'bg-primary/20 text-primary border border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              {a.shortName}
            </Button>
          ))}
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Traditional chain */}
        <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
          <h4 className="text-sm font-bold text-destructive mb-3">Traditional X.509 Chain</h4>
          <div className="space-y-2">
            {breakdown.traditional.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{item.component}</span>
                <span className="font-mono text-foreground">{formatBytes(item.bytes)}</span>
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

        {/* MTC approach */}
        <div className="bg-success/5 rounded-lg p-4 border border-success/20">
          <h4 className="text-sm font-bold text-success mb-3">Merkle Tree Certificate</h4>
          <div className="space-y-2">
            {breakdown.mtc.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">{item.component}</span>
                <span className="font-mono text-foreground">{formatBytes(item.bytes)}</span>
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

      {/* Visual bar comparison */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <h4 className="text-sm font-bold text-foreground mb-3">Handshake Size Comparison</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Traditional</span>
              <span className="font-mono text-foreground">
                {formatBytes(breakdown.traditionalTotal)}
              </span>
            </div>
            <div className="bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-destructive/60 rounded-full transition-all duration-500"
                style={{ width: `${(breakdown.traditionalTotal / maxBytes) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">MTC</span>
              <span className="font-mono text-foreground">{formatBytes(breakdown.mtcTotal)}</span>
            </div>
            <div className="bg-muted rounded-full h-4 overflow-hidden">
              <div
                className="h-full bg-success/60 rounded-full transition-all duration-500"
                style={{ width: `${(breakdown.mtcTotal / maxBytes) * 100}%` }}
              />
            </div>
          </div>
        </div>
        <div className="mt-3 text-center">
          <span className="text-lg font-bold text-success">{breakdown.reductionPercent}%</span>
          <span className="text-sm text-muted-foreground ml-2">size reduction with MTC</span>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-3 border border-border">
        <div className="flex items-start gap-2">
          <Info size={16} className="text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-muted-foreground">
            <strong className="text-foreground">How it works:</strong> Instead of each certificate
            carrying its own CA signature, the MTCA batches ~4.4 million certificates as leaves in a
            Merkle tree and signs only the root hash. Each certificate then carries a compact
            inclusion proof (a chain of sibling hashes) that lets any verifier confirm it belongs to
            the signed batch &mdash; without needing the full chain of individual signatures.
          </div>
        </div>
      </div>

      {/* All-algorithm summary table */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border overflow-x-auto">
        <h4 className="text-sm font-bold text-foreground mb-3">All Algorithms Comparison</h4>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border">
              <th className="text-left py-2 pr-4">Algorithm</th>
              <th className="text-right py-2 px-2">Sig Size</th>
              <th className="text-right py-2 px-2">Traditional</th>
              <th className="text-right py-2 px-2">MTC</th>
              <th className="text-right py-2 pl-2">Reduction</th>
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
                  <td className="py-2 pr-4 font-medium text-foreground">{a.shortName}</td>
                  <td className="text-right py-2 px-2 font-mono">
                    {formatBytes(a.signatureBytes)}
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

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="ghost"
          onClick={onComplete}
          className="px-4 py-2 bg-accent text-accent-foreground font-bold rounded-lg hover:bg-accent/90 transition-colors text-sm"
        >
          Mark Complete
        </Button>
        <Link
          to="/learn/merkle-tree-certs"
          className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <TreePine size={14} /> Full MTC Interactive Workshop <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}
