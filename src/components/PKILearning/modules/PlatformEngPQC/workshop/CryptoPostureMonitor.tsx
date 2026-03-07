// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Activity, BarChart3, Clock, RefreshCw } from 'lucide-react'
import {
  MONITORING_TOOLS,
  SIEM_QUERIES,
  SIZE_COMPARISONS,
  CAPACITY_METRICS,
  ACME_LIFECYCLE_STEPS,
  ACME_STATUS_COLORS,
  ACME_STATUS_LABELS,
} from '../data/monitoringToolsData'

type MonitorTab = 'metrics' | 'siem' | 'capacity' | 'acme'

const TABS: { id: MonitorTab; label: string; icon: React.ReactNode }[] = [
  { id: 'metrics', label: 'Metrics & Alerts', icon: <Activity size={14} /> },
  { id: 'siem', label: 'SIEM Integration', icon: <RefreshCw size={14} /> },
  { id: 'capacity', label: 'Capacity Planner', icon: <BarChart3 size={14} /> },
  { id: 'acme', label: 'ACME Lifecycle', icon: <Clock size={14} /> },
]

const SIEM_SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-status-error/15 text-status-error border-status-error/30',
  high: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  medium: 'bg-status-info/15 text-status-info border-status-info/30',
  low: 'bg-muted text-muted-foreground border-border',
}

const PLATFORM_COLORS: Record<string, string> = {
  Splunk: 'bg-primary/10 text-primary border-primary/30',
  Elastic: 'bg-status-success/15 text-status-success border-status-success/30',
  Datadog: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  'Microsoft Sentinel': 'bg-status-info/15 text-status-info border-status-info/30',
}

// ── Metrics & Alerts tab ──────────────────────────────────────────────────────

const MetricsTab: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('certmanager-metrics')
  const toggle = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), [])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Four Prometheus-compatible exporters cover the entire platform crypto surface. Each tool
        exposes key algorithm labels — enabling alert rules that fire when classical crypto is still
        active after your migration deadline.
      </p>

      {MONITORING_TOOLS.map((tool) => {
        const isExpanded = expandedId === tool.id
        return (
          <div key={tool.id} className="glass-panel overflow-hidden">
            <button
              onClick={() => toggle(tool.id)}
              className="w-full text-left p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{tool.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-bold">
                    {tool.source}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{tool.pqcSignal}</p>
              </div>
              <span className="shrink-0">
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-fade-in">
                <p className="text-xs text-muted-foreground">{tool.description}</p>

                {/* Metric examples */}
                <div>
                  <span className="text-xs font-bold text-muted-foreground">Key Metrics</span>
                  <div className="mt-2 space-y-1">
                    {tool.metricExamples.map((m) => (
                      <div
                        key={m}
                        className="font-mono text-[10px] text-foreground bg-muted rounded px-2 py-1 border border-border truncate"
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alert rules */}
                <div>
                  <span className="text-xs font-bold text-muted-foreground">PQC Alert Rules</span>
                  <div className="mt-2 space-y-2">
                    {tool.alertExamples.map((alert) => (
                      <div
                        key={alert.name}
                        className={`rounded-lg p-3 border ${
                          alert.severity === 'critical'
                            ? 'bg-status-error/10 border-status-error/20'
                            : 'bg-status-warning/10 border-status-warning/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] px-1 py-0.5 rounded font-bold ${
                              alert.severity === 'critical'
                                ? 'bg-status-error/20 text-status-error'
                                : 'bg-status-warning/20 text-status-warning'
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-foreground">{alert.name}</span>
                        </div>
                        <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                          {alert.expression}
                        </pre>
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
                          Fires when: {alert.threshold}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Integrations */}
                <div className="flex flex-wrap gap-1">
                  <span className="text-xs text-muted-foreground font-medium">
                    Integrates with:
                  </span>
                  {tool.integrations.map((i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground"
                    >
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── SIEM Integration tab ──────────────────────────────────────────────────────

const SIEMTab: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>('splunk-ecdsa-signing')
  const toggle = useCallback((id: string) => setExpandedId((prev) => (prev === id ? null : id)), [])

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pre-built SIEM queries for detecting quantum-vulnerable cryptographic operations in your
        pipeline. Covers Vault signing key usage, cert-manager RSA issuance, CI/CD OIDC token
        algorithm, and TLS cipher negotiation.
      </p>

      {SIEM_QUERIES.map((query) => {
        const isExpanded = expandedId === query.id
        return (
          <div key={query.id} className="glass-panel overflow-hidden">
            <button
              onClick={() => toggle(query.id)}
              className="w-full text-left p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-foreground">{query.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PLATFORM_COLORS[query.platform] ?? 'bg-muted border-border text-muted-foreground'}`}
                  >
                    {query.platform}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${SIEM_SEVERITY_COLORS[query.severity]}`}
                  >
                    {query.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{query.description}</p>
              </div>
              <span className="shrink-0">
                {isExpanded ? (
                  <ChevronUp size={16} className="text-muted-foreground" />
                ) : (
                  <ChevronDown size={16} className="text-muted-foreground" />
                )}
              </span>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border pt-4 space-y-4 animate-fade-in">
                <p className="text-xs text-muted-foreground">{query.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
                    MITRE: {query.mitreTactic}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-muted-foreground mb-2 block">Query</span>
                  <pre className="bg-muted rounded-lg p-3 text-[11px] font-mono text-foreground overflow-x-auto border border-border whitespace-pre-wrap leading-relaxed">
                    {query.query}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )
      })}

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Integration workflow:</strong> Enable these queries in Audit mode first to
          baseline volumes. Tune thresholds over 2 weeks before enabling alerting. Map alerts to
          your on-call rotation with 48-hour SLA for CRITICAL findings. Weekly SIEM digest reports
          should track percentage of operations using PQC algorithms — target 100% by your mandated
          migration deadline.
        </p>
      </div>
    </div>
  )
}

// ── Capacity Planner tab ──────────────────────────────────────────────────────

const CapacityTab: React.FC = () => {
  const [certCount, setCertCount] = useState(100)
  const [signsPerDay, setSignsPerDay] = useState(500)

  const etcdEntry = useMemo(() => SIZE_COMPARISONS.find((s) => s.id === 'etcd-secret'), [])
  const tlsHandshake = useMemo(
    () => CAPACITY_METRICS.find((m) => m.id === 'tls-handshake-latency'),
    []
  )

  const etcdClassical = etcdEntry ? (certCount * etcdEntry.classicalSize) / 1024 / 1024 : 0
  const etcdPQC = etcdEntry ? (certCount * etcdEntry.pqcSize) / 1024 / 1024 : 0

  const bandwidthClassicalKB = tlsHandshake
    ? (signsPerDay * tlsHandshake.baselinePerUnit) / 1024
    : 0
  const bandwidthPQCKB = tlsHandshake ? (signsPerDay * tlsHandshake.pqcPerUnit) / 1024 : 0

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Quantify the infrastructure impact of migrating from ECDSA to ML-DSA and from X25519 to
        ML-KEM. Calculate storage growth, bandwidth increase, and latency overhead before your
        migration window.
      </p>

      {/* Size Comparison Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-bold text-foreground">
            Cryptographic Object Size Comparison
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 text-left text-muted-foreground font-medium">Component</th>
                <th className="p-3 text-right text-muted-foreground font-medium">Classical</th>
                <th className="p-3 text-right text-muted-foreground font-medium">PQC</th>
                <th className="p-3 text-right text-muted-foreground font-medium">Hybrid</th>
                <th className="p-3 text-right text-muted-foreground font-medium">Multiplier</th>
              </tr>
            </thead>
            <tbody>
              {SIZE_COMPARISONS.map((s) => {
                const multiplier = (s.pqcSize / s.classicalSize).toFixed(0)
                const isLarge = s.pqcSize / s.classicalSize > 20
                return (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{s.component}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {s.classicalAlgo} → {s.pqcAlgo}
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {s.classicalSize.toLocaleString()} {s.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-status-warning">
                      {s.pqcSize.toLocaleString()} {s.unit}
                    </td>
                    <td className="p-3 text-right font-mono text-muted-foreground">
                      {s.hybridSize.toLocaleString()} {s.unit}
                    </td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-bold text-xs ${isLarge ? 'text-status-error' : 'text-status-warning'}`}
                      >
                        {multiplier}×
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Calculator */}
      <div className="glass-panel p-4 space-y-4">
        <h4 className="text-sm font-bold text-foreground">Infrastructure Impact Calculator</h4>
        <p className="text-xs text-muted-foreground">
          Adjust your deployment parameters to estimate the storage and bandwidth impact of PQC
          migration.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              TLS Certificates in Cluster:{' '}
              <span className="text-primary font-bold">{certCount}</span>
            </label>
            <input
              type="range"
              min={10}
              max={5000}
              step={10}
              value={certCount}
              onChange={(e) => setCertCount(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2 border border-border">
                <div className="text-muted-foreground">etcd (Classical)</div>
                <div className="font-bold text-foreground">{etcdClassical.toFixed(2)} MB</div>
              </div>
              <div className="bg-status-warning/10 rounded p-2 border border-status-warning/20">
                <div className="text-muted-foreground">etcd (PQC)</div>
                <div className="font-bold text-status-warning">{etcdPQC.toFixed(2)} MB</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground">
              TLS Handshakes / Day:{' '}
              <span className="text-primary font-bold">{signsPerDay.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min={100}
              max={100000}
              step={100}
              value={signsPerDay}
              onChange={(e) => setSignsPerDay(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2 border border-border">
                <div className="text-muted-foreground">Bandwidth (Classical)</div>
                <div className="font-bold text-foreground">
                  {bandwidthClassicalKB.toFixed(1)} KB/day
                </div>
              </div>
              <div className="bg-status-warning/10 rounded p-2 border border-status-warning/20">
                <div className="text-muted-foreground">Bandwidth (PQC)</div>
                <div className="font-bold text-status-warning">
                  {bandwidthPQCKB.toFixed(1)} KB/day
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Latency metrics */}
        <div>
          <span className="text-xs font-bold text-muted-foreground">Latency Impact</span>
          <div className="mt-2 space-y-2">
            {CAPACITY_METRICS.map((m) => {
              const ratio = m.pqcPerUnit / m.baselinePerUnit
              const pct = Math.round((ratio - 1) * 100)
              return (
                <div key={m.id} className="bg-muted/30 rounded-lg p-3 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-foreground">{m.label}</span>
                    <span className="text-xs font-bold text-status-warning">+{pct}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                    <span>
                      Classical: {m.baselinePerUnit.toLocaleString()} {m.unit}
                    </span>
                    <span>→</span>
                    <span className="text-foreground font-medium">
                      PQC: {m.pqcPerUnit.toLocaleString()} {m.unit}
                    </span>
                  </div>
                  {/* Bar comparison */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[9px] text-muted-foreground w-16 text-right shrink-0">
                        Classical
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-muted-foreground h-2 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[9px] text-muted-foreground w-16 text-right shrink-0">
                        PQC
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                          className="bg-status-warning h-2 rounded-full"
                          style={{ width: `${Math.min(100, (ratio / 8) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2">{m.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ACME Lifecycle tab ────────────────────────────────────────────────────────

const ACMETab: React.FC = () => {
  const [selectedStep, setSelectedStep] = useState<string | null>('key-gen')

  const activeStep = useMemo(
    () => ACME_LIFECYCLE_STEPS.find((s) => s.id === selectedStep),
    [selectedStep]
  )

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The ACME certificate lifecycle with PQC overlay. Each step shows the current state
        (classical / hybrid / PQC-ready / algorithm-agnostic) and what changes are needed for a
        quantum-safe issuance pipeline via cert-manager v1.17+.
      </p>

      {/* Step rail */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {ACME_LIFECYCLE_STEPS.map((step) => (
            <button
              key={step.id}
              onClick={() => setSelectedStep((prev) => (prev === step.id ? null : step.id))}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-colors text-center ${
                selectedStep === step.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-primary/50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                  ACME_STATUS_COLORS[step.status]
                }`}
              >
                {step.step}
              </div>
              <span className="text-[10px] font-medium text-foreground w-16 leading-tight">
                {step.title}
              </span>
              <span
                className={`text-[9px] px-1 py-0.5 rounded border font-bold ${ACME_STATUS_COLORS[step.status]}`}
              >
                {ACME_STATUS_LABELS[step.status]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected step detail */}
      {activeStep && (
        <div className="glass-panel p-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${ACME_STATUS_COLORS[activeStep.status]}`}
            >
              {activeStep.step}
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">{activeStep.title}</h4>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${ACME_STATUS_COLORS[activeStep.status]}`}
              >
                {ACME_STATUS_LABELS[activeStep.status]}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{activeStep.description}</p>

          <div
            className={`rounded-lg p-3 border ${
              activeStep.status === 'pqc'
                ? 'bg-status-success/10 border-status-success/20'
                : activeStep.status === 'hybrid'
                  ? 'bg-status-warning/10 border-status-warning/20'
                  : activeStep.status === 'classical'
                    ? 'bg-status-error/10 border-status-error/20'
                    : 'bg-muted border-border'
            }`}
          >
            <div className="text-xs font-bold text-foreground mb-1">PQC Migration Note</div>
            <p className="text-xs text-muted-foreground">{activeStep.pqcNote}</p>
          </div>
        </div>
      )}

      {/* Summary legend */}
      <div className="glass-panel p-4">
        <h4 className="text-xs font-bold text-foreground mb-3">Step Status Legend</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(ACME_STATUS_LABELS) as ACMEStep['status'][]).map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${ACME_STATUS_COLORS[status]}`}
              >
                {ACME_STATUS_LABELS[status]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3">
          The ACME Lifecycle is fully PQC-compatible by 2027 when Let&apos;s Encrypt production ACME
          supports ML-DSA CSRs. Until then, use internal CAs (Vault PKI, EJBCA) for ML-DSA
          certificate issuance in production environments.
        </p>
      </div>
    </div>
  )
}

// ── ACMEStep type import for legend ──────────────────────────────────────────
import type { ACMEStep } from '../data/monitoringToolsData'

// ── Main component ────────────────────────────────────────────────────────────

export const CryptoPostureMonitor: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MonitorTab>('metrics')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Crypto Posture Monitor</h3>
        <p className="text-sm text-muted-foreground">
          Four-panel monitoring dashboard covering Prometheus metrics, SIEM integration, capacity
          planning for PQC size overhead, and ACME certificate lifecycle automation with
          cert-manager v1.17+.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'metrics' && <MetricsTab />}
      {activeTab === 'siem' && <SIEMTab />}
      {activeTab === 'capacity' && <CapacityTab />}
      {activeTab === 'acme' && <ACMETab />}
    </div>
  )
}
