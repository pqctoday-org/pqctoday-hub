// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  ScanSearch,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import {
  SCAN_TARGETS,
  SCAN_RESULTS,
  type ScanTarget,
  type ScanResult,
} from '../data/testingConstants'

const RISK_COLOR = (score: number) => {
  if (score >= 80) return 'text-destructive'
  if (score >= 50) return 'text-status-warning'
  if (score >= 25) return 'text-status-info'
  return 'text-status-success'
}

const RISK_BG = (score: number) => {
  if (score >= 80) return 'bg-destructive/10 border-destructive/30'
  if (score >= 50) return 'bg-status-warning/10 border-status-warning/30'
  if (score >= 25) return 'bg-status-info/10 border-status-info/30'
  return 'bg-status-success/10 border-status-success/30'
}

const PQC_BADGE: Record<
  ScanResult['pqcSupport'],
  { label: string; cls: string; icon: React.ReactNode }
> = {
  full: {
    label: 'Quantum-Safe',
    cls: 'bg-status-success/10 text-status-success border-status-success/30',
    icon: <ShieldCheck size={12} />,
  },
  hybrid: {
    label: 'Hybrid PQC',
    cls: 'bg-status-info/10 text-status-info border-status-info/30',
    icon: <ShieldAlert size={12} />,
  },
  none: {
    label: 'Vulnerable',
    cls: 'bg-destructive/10 text-destructive border-destructive/30',
    icon: <ShieldOff size={12} />,
  },
}

const PROTO_BADGE: Record<ScanTarget['protocol'], string> = {
  tls: 'bg-primary/10 text-primary border-primary/20',
  ssh: 'bg-secondary/10 text-secondary border-secondary/20',
  ikev2: 'bg-accent/10 text-accent border-accent/20',
}

export const ActivePQCScanner: React.FC = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scanned, setScanned] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [filterProto, setFilterProto] = useState<'all' | ScanTarget['protocol']>('all')

  const filteredTargets = useMemo(
    () => SCAN_TARGETS.filter((t) => filterProto === 'all' || t.protocol === filterProto),
    [filterProto]
  )

  const toggleTarget = (id: string) => {
    if (scanned) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (scanned) return
    setSelected(new Set(filteredTargets.map((t) => t.id)))
  }

  const runScan = () => {
    if (selected.size === 0) return
    setScanning(true)
    setTimeout(() => {
      setScanning(false)
      setScanned(true)
    }, 1600)
  }

  const resetScan = () => {
    setScanned(false)
    setSelected(new Set())
  }

  const results = useMemo(
    () => [...selected].map((id) => SCAN_RESULTS[id]).filter(Boolean),
    [selected]
  )

  const criticalCount = results.filter((r) => r.riskScore >= 80).length
  const hybridCount = results.filter((r) => r.pqcSupport === 'hybrid').length
  const safeCount = results.filter((r) => r.pqcSupport === 'full').length

  return (
    <div className="space-y-6">
      {/* Tool banner */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <ScanSearch size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Simulating:</span> pqcscan (Anvil Secure)
          active endpoint probe. Sends TLS/SSH/IKEv2 handshake to each target and inspects
          negotiated algorithms.{' '}
          <span className="text-status-warning">
            Active mode — connection attempts made to each target.
          </span>
        </p>
      </div>

      {/* Protocol filter + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-foreground">Protocol:</span>
        {(['all', 'tls', 'ssh', 'ikev2'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setFilterProto(p)}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              filterProto === p
                ? 'bg-primary text-primary-foreground border-primary font-semibold'
                : 'bg-background/60 text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {p === 'all' ? 'All' : p.toUpperCase()}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {!scanned && (
            <button
              onClick={selectAll}
              className="text-xs px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded hover:text-foreground transition-colors"
            >
              Select all
            </button>
          )}
          {!scanned ? (
            <button
              onClick={runScan}
              disabled={selected.size === 0 || scanning}
              className="text-xs px-4 py-1.5 bg-primary text-primary-foreground rounded font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {scanning
                ? 'Scanning…'
                : `Scan ${selected.size} target${selected.size !== 1 ? 's' : ''}`}
            </button>
          ) : (
            <button
              onClick={resetScan}
              className="text-xs px-3 py-1.5 bg-muted text-muted-foreground border border-border rounded hover:text-foreground transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Target selection grid */}
      {!scanned && (
        <div className="grid sm:grid-cols-2 gap-2">
          {filteredTargets.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTarget(t.id)}
              className={`text-left p-3 rounded-lg border transition-all ${
                selected.has(t.id)
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-muted/30 border-border hover:border-border/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {t.hostname}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded border font-mono ${PROTO_BADGE[t.protocol]}`}
                >
                  :{t.port}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded border uppercase font-semibold ${PROTO_BADGE[t.protocol]}`}
                >
                  {t.protocol}
                </span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Scanning animation */}
      {scanning && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Probing {selected.size} endpoint{selected.size !== 1 ? 's' : ''}…
          </p>
        </div>
      )}

      {/* Results */}
      {scanned && !scanning && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-center">
              <div className="text-2xl font-bold text-destructive">{criticalCount}</div>
              <div className="text-xs text-muted-foreground">Critical / High Risk</div>
            </div>
            <div className="p-3 rounded-lg border border-status-info/30 bg-status-info/5 text-center">
              <div className="text-2xl font-bold text-status-info">{hybridCount}</div>
              <div className="text-xs text-muted-foreground">Hybrid PQC</div>
            </div>
            <div className="p-3 rounded-lg border border-status-success/30 bg-status-success/5 text-center">
              <div className="text-2xl font-bold text-status-success">{safeCount}</div>
              <div className="text-xs text-muted-foreground">Quantum-Safe</div>
            </div>
          </div>

          {/* Per-target results */}
          <div className="space-y-3">
            {results
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((r) => {
                const target = SCAN_TARGETS.find((t) => t.id === r.targetId)!
                const badge = PQC_BADGE[r.pqcSupport]
                return (
                  <div key={r.targetId} className={`p-4 rounded-lg border ${RISK_BG(r.riskScore)}`}>
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {target.hostname}:{target.port}
                          </span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border uppercase font-semibold ${PROTO_BADGE[target.protocol]}`}
                          >
                            {target.protocol}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${badge.cls}`}
                          >
                            {badge.icon} {badge.label}
                          </span>
                          {r.hybridAlgorithm && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {r.hybridAlgorithm}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={`text-2xl font-bold tabular-nums ${RISK_COLOR(r.riskScore)}`}
                        >
                          {r.riskScore}
                        </span>
                        <span className="text-xs text-muted-foreground">risk score</span>
                      </div>
                    </div>

                    {/* Crypto details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mb-3 text-xs font-mono">
                      <span className="text-muted-foreground">TLS/protocol:</span>
                      <span className="text-foreground/80">{r.tlsVersion}</span>
                      <span className="text-muted-foreground">Key exchange:</span>
                      <span className="text-foreground/80">{r.keyExchange}</span>
                      <span className="text-muted-foreground">Cipher:</span>
                      <span className="text-foreground/80">{r.cipherSuite}</span>
                      <span className="text-muted-foreground">Certificate:</span>
                      <span className="text-foreground/80">
                        {r.certAlgorithm} ({r.certKeySize}-bit)
                      </span>
                    </div>

                    {/* Vulnerabilities */}
                    {r.vulnerabilities.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {r.vulnerabilities.map((v, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <AlertTriangle
                              size={12}
                              className="text-status-warning mt-0.5 shrink-0"
                            />
                            <span className="text-foreground/70">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recommendation */}
                    <div className="flex items-start gap-2 pt-2 border-t border-border/40 text-xs">
                      <CheckCircle size={12} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{r.recommendation}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}
