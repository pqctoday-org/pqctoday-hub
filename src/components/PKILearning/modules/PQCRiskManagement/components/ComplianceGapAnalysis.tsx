// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ShieldAlert, Info, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'

interface RiskEntry {
  id: string
  assetName: string
  currentAlgorithm: string
  threatVector: string
  likelihood: number
  impact: number
  mitigation: string
}

interface ComplianceGapAnalysisProps {
  riskEntries: RiskEntry[]
}

/* ── Classify algorithms as classical (vulnerable) or PQC-safe ── */
const CLASSICAL_PATTERNS = [
  'rsa',
  'ecdsa',
  'ecdh',
  'dh',
  'eddsa',
  'ed25519',
  'ed448',
  'x25519',
  'x448',
  'p-256',
  'p-384',
  'p-521',
  'secp',
  'aes-128',
  'des',
  '3des',
]
const PQC_PATTERNS = ['ml-kem', 'ml-dsa', 'slh-dsa', 'fn-dsa', 'lms', 'hss', 'xmss', 'frodo']

function classifyAlgorithm(algo: string): 'classical' | 'pqc' | 'unknown' {
  const lower = algo.toLowerCase()
  if (PQC_PATTERNS.some((p) => lower.includes(p))) return 'pqc'
  if (CLASSICAL_PATTERNS.some((p) => lower.includes(p))) return 'classical'
  return 'unknown'
}

/** Map an algorithm to its recommended PQC replacement */
function pqcReplacement(algo: string): string {
  const lower = algo.toLowerCase()
  if (lower.includes('rsa') || lower.includes('ecdh') || lower.includes('dh ')) return 'ML-KEM'
  if (
    lower.includes('ecdsa') ||
    lower.includes('eddsa') ||
    lower.includes('ed25519') ||
    lower.includes('rsa')
  )
    return 'ML-DSA or SLH-DSA'
  if (lower.includes('x25519') || lower.includes('x448'))
    return 'ML-KEM (KEM) or X25519+ML-KEM hybrid'
  if (lower.includes('aes-128')) return 'AES-256 (double key size)'
  return 'ML-KEM or ML-DSA'
}

/* ── Compliance milestone data ── */
const MILESTONES = [
  {
    id: 'cnsa-preferred',
    label: 'CNSA 2.0 Preferred',
    year: CNSA_2_0.softwarePreferred,
    source: 'CNSA 2.0',
    description: 'PQC algorithms preferred for U.S. national security systems',
    scope: 'NSS / Government',
  },
  {
    id: 'nist-deprecate',
    label: 'NIST Deprecation',
    year: NIST_DEPRECATION.deprecateClassical,
    source: 'NIST IR 8547',
    description: 'Target: deprecate RSA-2048 and 112-bit ECC',
    scope: 'Federal / Industry',
  },
  {
    id: 'cnsa-exclusive',
    label: 'CNSA 2.0 Exclusive',
    year: CNSA_2_0.softwareExclusive,
    source: 'CNSA 2.0',
    description: 'Only PQC algorithms permitted in national security systems',
    scope: 'NSS / Government',
  },
  {
    id: 'nist-disallow',
    label: 'NIST Disallowance',
    year: NIST_DEPRECATION.disallowClassical,
    source: 'NIST IR 8547',
    description: 'Target: disallow all classical public-key cryptography',
    scope: 'Federal / Industry',
  },
]

function getDeadlineStatus(
  assetClass: 'classical' | 'pqc' | 'unknown',
  deadlineYear: number,
  crqcYear: number
): 'safe' | 'at-risk' | 'critical' | 'compliant' {
  if (assetClass === 'pqc') return 'compliant'
  if (assetClass === 'unknown') return 'safe'
  // Classical asset: at risk if CRQC arrives before the deadline
  if (crqcYear <= deadlineYear - 2) return 'critical'
  if (crqcYear <= deadlineYear) return 'at-risk'
  return 'at-risk' // classical assets always need migration
}

const STATUS_CONFIG = {
  compliant: {
    label: 'Compliant',
    icon: CheckCircle2,
    color: 'text-status-success',
    bg: 'bg-status-success/10',
  },
  safe: { label: 'N/A', icon: Info, color: 'text-muted-foreground', bg: 'bg-muted/30' },
  'at-risk': {
    label: 'At Risk',
    icon: AlertTriangle,
    color: 'text-status-warning',
    bg: 'bg-status-warning/10',
  },
  critical: {
    label: 'Critical',
    icon: ShieldAlert,
    color: 'text-status-error',
    bg: 'bg-status-error/10',
  },
}

const CURRENT_YEAR = new Date().getFullYear()

export const ComplianceGapAnalysis: React.FC<ComplianceGapAnalysisProps> = ({ riskEntries }) => {
  const [crqcYear, setCrqcYear] = useState(2035)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const analysisRows = useMemo(
    () =>
      riskEntries.map((entry) => {
        const assetClass = classifyAlgorithm(entry.currentAlgorithm)
        const milestoneStatuses = MILESTONES.map((m) => ({
          milestoneId: m.id,
          status: getDeadlineStatus(assetClass, m.year, crqcYear),
        }))
        const worstStatus = milestoneStatuses.some((s) => s.status === 'critical')
          ? 'critical'
          : milestoneStatuses.some((s) => s.status === 'at-risk')
            ? 'at-risk'
            : assetClass === 'pqc'
              ? 'compliant'
              : 'safe'
        return { entry, assetClass, milestoneStatuses, worstStatus }
      }),
    [riskEntries, crqcYear]
  )

  const summary = useMemo(
    () => ({
      critical: analysisRows.filter((r) => r.worstStatus === 'critical').length,
      atRisk: analysisRows.filter((r) => r.worstStatus === 'at-risk').length,
      compliant: analysisRows.filter((r) => r.worstStatus === 'compliant').length,
      total: analysisRows.length,
    }),
    [analysisRows]
  )

  if (riskEntries.length === 0) {
    return (
      <div className="glass-panel p-8 text-center space-y-4">
        <Info size={32} className="text-muted-foreground mx-auto" />
        <p className="text-foreground font-semibold">No risk register entries yet</p>
        <p className="text-sm text-muted-foreground">
          Go to Step 2 — Risk Register Builder to add assets, then return here to see their
          compliance gap analysis.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* CRQC Year Selector */}
      <div className="glass-panel p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">CRQC Arrival Year</h3>
          <span className="text-2xl font-bold text-primary">{crqcYear}</span>
        </div>
        <input
          type="range"
          min={2028}
          max={2045}
          value={crqcYear}
          onChange={(e) => setCrqcYear(Number(e.target.value))}
          className="w-full accent-primary"
          aria-label="CRQC arrival year"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>2028 (Optimistic)</span>
          <span>2035 (Consensus)</span>
          <span>2045 (Conservative)</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {crqcYear <= CURRENT_YEAR + 6
            ? 'Near-term scenario — aggressive migration is required immediately.'
            : crqcYear <= 2035
              ? 'Mid-term scenario — begin migration now; all classical assets must be replaced before this year.'
              : 'Long-term scenario — still time to plan, but HNDL attacks could compromise data harvested today.'}
        </p>
      </div>

      {/* Summary Badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: 'Critical',
            count: summary.critical,
            color: 'text-status-error',
            bg: 'bg-status-error/10 border-status-error/20',
          },
          {
            label: 'At Risk',
            count: summary.atRisk,
            color: 'text-status-warning',
            bg: 'bg-status-warning/10 border-status-warning/20',
          },
          {
            label: 'Compliant',
            count: summary.compliant,
            color: 'text-status-success',
            bg: 'bg-status-success/10 border-status-success/20',
          },
        ].map((s) => (
          <div key={s.label} className={`glass-panel p-4 border ${s.bg} text-center`}>
            <div className={`text-3xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Compliance Milestone Legend */}
      <div className="glass-panel p-4 space-y-2">
        <h4 className="text-sm font-semibold text-foreground mb-3">Compliance Milestones</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MILESTONES.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-xs">
              <span className="font-bold text-primary shrink-0">{m.year}</span>
              <div>
                <span className="font-medium text-foreground">{m.label}</span>
                <span className="text-muted-foreground"> — {m.description}</span>
                <span className="ml-1 text-muted-foreground/60">({m.scope})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-Asset Table */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-foreground">Asset Compliance Status</h4>
        {analysisRows.map((row) => {
          const isExpanded = expandedRow === row.entry.id
          const worstCfg = STATUS_CONFIG[row.worstStatus as keyof typeof STATUS_CONFIG]
          const WorstIcon = worstCfg.icon

          return (
            <div key={row.entry.id} className="glass-panel overflow-hidden">
              <Button
                variant="ghost"
                onClick={() => setExpandedRow(isExpanded ? null : row.entry.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/20"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <WorstIcon size={16} className={`shrink-0 ${worstCfg.color}`} />
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {row.entry.assetName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {row.entry.currentAlgorithm}
                      {row.assetClass === 'classical' && (
                        <span className="ml-2 text-status-warning">
                          → {pqcReplacement(row.entry.currentAlgorithm)}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${worstCfg.bg} ${worstCfg.color}`}
                  >
                    {worstCfg.label}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </div>
              </Button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                    {row.milestoneStatuses.map((ms) => {
                      const milestone = MILESTONES.find((m) => m.id === ms.milestoneId)!
                      const cfg = STATUS_CONFIG[ms.status as keyof typeof STATUS_CONFIG]
                      const Ic = cfg.icon
                      return (
                        <div
                          key={ms.milestoneId}
                          className={`rounded-lg p-3 border ${cfg.bg} text-center`}
                        >
                          <Ic size={14} className={`${cfg.color} mx-auto mb-1`} />
                          <p className="text-xs font-medium text-foreground">{milestone.label}</p>
                          <p className="text-xs text-muted-foreground">{milestone.year}</p>
                          <p className={`text-xs font-semibold mt-1 ${cfg.color}`}>{cfg.label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {row.assetClass === 'classical' && (
                    <div className="glass-panel p-3 border-l-4 border-l-status-warning">
                      <p className="text-xs text-muted-foreground">
                        <strong className="text-foreground">Recommended action:</strong> Migrate{' '}
                        <strong>{row.entry.assetName}</strong> from{' '}
                        <span className="font-mono text-status-warning">
                          {row.entry.currentAlgorithm}
                        </span>{' '}
                        to{' '}
                        <span className="font-mono text-status-success">
                          {pqcReplacement(row.entry.currentAlgorithm)}
                        </span>{' '}
                        before {Math.min(crqcYear, NIST_DEPRECATION.deprecateClassical)}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
