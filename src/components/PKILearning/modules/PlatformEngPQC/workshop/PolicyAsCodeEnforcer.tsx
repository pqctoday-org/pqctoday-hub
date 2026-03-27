// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { POLICY_RULES, SLSA_LEVEL_LABELS, SLSA_LEVEL_REQUIREMENTS } from '../data/policyRulesData'
import type { PolicyEngine } from '../data/platformEngConstants'

type EngineFilter = 'All' | PolicyEngine
type SeverityFilter = 'All' | 'error' | 'warning'

const ENGINE_ITEMS = [
  { id: 'All', label: 'All Engines' },
  { id: 'opa', label: 'OPA Gatekeeper' },
  { id: 'kyverno', label: 'Kyverno' },
  { id: 'conftest', label: 'Conftest' },
  { id: 'cel', label: 'CEL (Kubernetes)' },
]

const SEVERITY_ITEMS = [
  { id: 'All', label: 'All Severities' },
  { id: 'error', label: 'Enforce (error)' },
  { id: 'warning', label: 'Audit (warning)' },
]

const ENGINE_COLORS: Record<PolicyEngine, string> = {
  opa: 'bg-primary/10 text-primary border-primary/30',
  kyverno: 'bg-status-info/15 text-status-info border-status-info/30',
  conftest: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  cel: 'bg-muted text-muted-foreground border-border',
}

const ENGINE_LABELS: Record<PolicyEngine, string> = {
  opa: 'OPA Gatekeeper',
  kyverno: 'Kyverno',
  conftest: 'Conftest',
  cel: 'CEL',
}

const SLSA_LEVELS = [1, 2, 3, 4] as const

export const PolicyAsCodeEnforcer: React.FC = () => {
  const [engineFilter, setEngineFilter] = useState<EngineFilter>('All')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('All')
  const [expandedId, setExpandedId] = useState<string | null>('opa-cert-algo')
  const [showSlsa, setShowSlsa] = useState(false)
  const [selectedSlsaLevel, setSelectedSlsaLevel] = useState<1 | 2 | 3 | 4>(3)

  const filtered = useMemo(() => {
    return POLICY_RULES.filter((r) => {
      if (engineFilter !== 'All' && r.engine !== engineFilter) return false
      if (severityFilter !== 'All' && r.severity !== severityFilter) return false
      return true
    })
  }, [engineFilter, severityFilter])

  const toggleExpand = useCallback(
    (id: string) => setExpandedId((prev) => (prev === id ? null : id)),
    []
  )

  const enforceCount = useMemo(
    () => filtered.filter((r) => r.severity === 'error').length,
    [filtered]
  )
  const auditCount = useMemo(
    () => filtered.filter((r) => r.severity === 'warning').length,
    [filtered]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Policy-as-Code Algorithm Enforcer
        </h3>
        <p className="text-sm text-muted-foreground">
          OPA Gatekeeper and Kyverno rules that block quantum-vulnerable algorithm identifiers (RSA,
          ECDSA, Ed25519) in Kubernetes manifests, Helm values, and cert-manager Certificate
          resources. Each policy maps to a SLSA supply chain integrity level.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{POLICY_RULES.length}</div>
          <div className="text-xs text-muted-foreground">Total Policies</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-error">{enforceCount}</div>
          <div className="text-xs text-muted-foreground">Enforce (Block)</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-warning">{auditCount}</div>
          <div className="text-xs text-muted-foreground">Audit (Warn)</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
        <FilterDropdown
          items={ENGINE_ITEMS}
          selectedId={engineFilter}
          onSelect={(id) => setEngineFilter(id as EngineFilter)}
          label="Policy Engine"
          defaultLabel="All Engines"
          defaultIcon={<ShieldCheck size={16} className="text-primary" />}
          noContainer
        />
        <FilterDropdown
          items={SEVERITY_ITEMS}
          selectedId={severityFilter}
          onSelect={(id) => setSeverityFilter(id as SeverityFilter)}
          label="Action"
          defaultLabel="All Severities"
          defaultIcon={<AlertTriangle size={16} className="text-status-warning" />}
          noContainer
        />
        <button
          onClick={() => setShowSlsa((prev) => !prev)}
          className="ml-auto text-xs text-primary underline underline-offset-2 hover:opacity-80"
        >
          {showSlsa ? 'Hide' : 'Show'} SLSA Level Reference
        </button>
      </div>

      {/* SLSA Level Reference */}
      {showSlsa && (
        <div className="glass-panel p-4 space-y-4 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground">
            SLSA Supply Chain Levels — PQC Requirements
          </h4>
          <div className="flex gap-2 flex-wrap">
            {SLSA_LEVELS.map((level) => (
              <button
                key={level}
                onClick={() => setSelectedSlsaLevel(level)}
                className={`px-3 py-1.5 rounded text-xs font-bold border transition-colors ${
                  selectedSlsaLevel === level
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {SLSA_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {SLSA_LEVEL_REQUIREMENTS[selectedSlsaLevel].map((req, i) => {
              const isPqcReq =
                req.toLowerCase().includes('ml-dsa') || req.toLowerCase().includes('slh-dsa')
              return (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle
                    size={14}
                    className={`mt-0.5 shrink-0 ${isPqcReq ? 'text-status-success' : 'text-muted-foreground'}`}
                  />
                  <span
                    className={`text-xs ${isPqcReq ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                  >
                    {req}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-muted-foreground italic">
            PQC-specific requirements highlighted in bold. SLSA Level 3+ mandates ML-DSA or SLH-DSA
            for provenance signatures — classical ECDSA signatures no longer satisfy Level 3.
          </p>
        </div>
      )}

      {/* Policy Cards */}
      <div className="space-y-2">
        {filtered.map((rule) => {
          const isExpanded = expandedId === rule.id
          return (
            <div key={rule.id} className="glass-panel overflow-hidden">
              <button
                onClick={() => toggleExpand(rule.id)}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                <div className="shrink-0">
                  {rule.severity === 'error' ? (
                    <ShieldX size={18} className="text-status-error" />
                  ) : (
                    <AlertTriangle size={18} className="text-status-warning" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{rule.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${ENGINE_COLORS[rule.engine]}`}
                    >
                      {ENGINE_LABELS[rule.engine]}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                        rule.severity === 'error'
                          ? 'bg-status-error/15 text-status-error border-status-error/30'
                          : 'bg-status-warning/15 text-status-warning border-status-warning/30'
                      }`}
                    >
                      {rule.severity === 'error' ? 'Enforce' : 'Audit'}
                    </span>
                    {rule.slsaLevel && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground font-bold">
                        SLSA L{rule.slsaLevel}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                    <span>
                      Target:{' '}
                      <span className="font-mono text-foreground">{rule.targetResource}</span>
                    </span>
                  </div>
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
                  <p className="text-xs text-muted-foreground">{rule.description}</p>

                  {/* Blocked vs Required algorithms */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-status-error/10 rounded-lg p-3 border border-status-error/20">
                      <div className="flex items-center gap-1 mb-2">
                        <ShieldX size={12} className="text-status-error" />
                        <span className="text-xs font-bold text-status-error">
                          Blocked Algorithms
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rule.blockedAlgorithms.map((algo) => (
                          <span
                            key={algo}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-status-error/10 text-status-error border border-status-error/20"
                          >
                            {algo}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-status-success/10 rounded-lg p-3 border border-status-success/20">
                      <div className="flex items-center gap-1 mb-2">
                        <ShieldCheck size={12} className="text-status-success" />
                        <span className="text-xs font-bold text-status-success">
                          Required Algorithms
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rule.requiredAlgorithms.map((algo) => (
                          <span
                            key={algo}
                            className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-status-success/10 text-status-success border border-status-success/20"
                          >
                            {algo}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Policy rule code */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-muted-foreground">Policy Rule</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{rule.id}</span>
                    </div>
                    <pre className="bg-muted rounded-lg p-3 text-[11px] font-mono text-foreground overflow-x-auto border border-border whitespace-pre-wrap leading-relaxed">
                      {rule.rule}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-muted-foreground">No policies match the current filters.</p>
          </div>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Deployment sequence:</strong> Start with Audit mode (validationFailureAction:
          Audit) to baseline violations without blocking deployments. After 2 weeks of clean audit
          logs, switch to Enforce. Apply policies to non-production namespaces first, then
          progressively roll out to staging and production with a 30-day window for teams to
          remediate.
        </p>
      </div>
    </div>
  )
}
