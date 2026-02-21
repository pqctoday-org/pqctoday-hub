import React, { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, Code } from 'lucide-react'
import { SAMPLE_CBOM, CBOM_CYCLONEDX_SAMPLE, type CBOMEntry } from '../data/cbomTemplates'

export const CBOMScanner: React.FC = () => {
  const [showJson, setShowJson] = useState(false)
  const [filter, setFilter] = useState<'all' | 'vulnerable' | 'safe'>('all')

  const filtered =
    filter === 'all'
      ? SAMPLE_CBOM
      : SAMPLE_CBOM.filter((e) =>
          filter === 'vulnerable' ? e.quantumStatus === 'vulnerable' : e.quantumStatus === 'safe'
        )

  const stats = {
    total: SAMPLE_CBOM.length,
    vulnerable: SAMPLE_CBOM.filter((e) => e.quantumStatus === 'vulnerable').length,
    safe: SAMPLE_CBOM.filter((e) => e.quantumStatus === 'safe').length,
    weakened: SAMPLE_CBOM.filter((e) => e.quantumStatus === 'weakened').length,
  }

  const statusBadge = (status: CBOMEntry['quantumStatus']) => {
    switch (status) {
      case 'vulnerable':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive border border-destructive/20 font-bold">
            VULNERABLE
          </span>
        )
      case 'safe':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
            SAFE
          </span>
        )
      case 'weakened':
        return (
          <span className="text-[10px] px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
            WEAKENED
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">CBOM Scanner</h3>
        <p className="text-sm text-muted-foreground">
          A Cryptographic Bill of Materials (CBOM) catalogs every cryptographic asset in your
          organization. This sample scan shows a typical enterprise with mixed quantum-vulnerable
          and quantum-safe algorithms.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Assets</div>
        </div>
        <div className="glass-panel p-3 text-center border-destructive/20">
          <div className="text-2xl font-bold text-destructive">{stats.vulnerable}</div>
          <div className="text-xs text-muted-foreground">Vulnerable</div>
        </div>
        <div className="glass-panel p-3 text-center border-success/20">
          <div className="text-2xl font-bold text-success">{stats.safe}</div>
          <div className="text-xs text-muted-foreground">Safe</div>
        </div>
        <div className="glass-panel p-3 text-center border-warning/20">
          <div className="text-2xl font-bold text-warning">
            {Math.round((stats.vulnerable / stats.total) * 100)}%
          </div>
          <div className="text-xs text-muted-foreground">At Risk</div>
        </div>
      </div>

      {/* Filters + JSON toggle */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          All ({stats.total})
        </button>
        <button
          onClick={() => setFilter('vulnerable')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            filter === 'vulnerable'
              ? 'bg-destructive/20 text-destructive border border-destructive/50'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          <AlertTriangle size={10} className="inline mr-1" />
          Vulnerable ({stats.vulnerable})
        </button>
        <button
          onClick={() => setFilter('safe')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            filter === 'safe'
              ? 'bg-success/20 text-success border border-success/50'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          <CheckCircle size={10} className="inline mr-1" />
          Safe ({stats.safe})
        </button>

        <div className="flex-1" />

        <button
          onClick={() => setShowJson(!showJson)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
            showJson
              ? 'bg-secondary/20 text-secondary border border-secondary/50'
              : 'bg-muted/50 text-muted-foreground border border-border'
          }`}
        >
          <Code size={12} />
          {showJson ? 'Hide' : 'Show'} CycloneDX JSON
        </button>
      </div>

      {/* CycloneDX JSON view */}
      {showJson && (
        <div className="glass-panel p-4">
          <h4 className="text-xs font-bold text-secondary mb-2">CycloneDX 1.6 CBOM Format</h4>
          <pre className="text-[10px] bg-background p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto font-mono">
            {JSON.stringify(CBOM_CYCLONEDX_SAMPLE, null, 2)}
          </pre>
        </div>
      )}

      {/* CBOM entries */}
      <div className="space-y-2">
        {filtered.map((entry) => (
          <div
            key={entry.id}
            className={`glass-panel p-4 border-l-4 ${
              entry.quantumStatus === 'vulnerable'
                ? 'border-l-destructive/50'
                : entry.quantumStatus === 'weakened'
                  ? 'border-l-warning/50'
                  : 'border-l-success/50'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{entry.component}</span>
                  <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                    {entry.algorithm}
                  </span>
                  {statusBadge(entry.quantumStatus)}
                </div>
                <p className="text-xs text-muted-foreground mb-1">{entry.usage}</p>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span>Location: {entry.location}</span>
                  <span>Key: {entry.keySize} bits</span>
                </div>
              </div>
            </div>
            {entry.quantumStatus === 'vulnerable' && (
              <div className="mt-2 p-2 bg-muted/50 rounded border border-border">
                <div className="flex items-start gap-1">
                  <Shield size={10} className="text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-primary">{entry.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>About CBOM:</strong> The CycloneDX 1.6 standard includes a cryptographic extension
          for tracking cryptographic assets. A CBOM enables organizations to identify
          quantum-vulnerable algorithms, plan migration priorities, and verify compliance with
          frameworks like NIST IR 8547. Tools like IBM&apos;s Quantum Safe Explorer and
          Keyfactor&apos;s CBOM Generator can automate this inventory process.
        </p>
      </div>
    </div>
  )
}
