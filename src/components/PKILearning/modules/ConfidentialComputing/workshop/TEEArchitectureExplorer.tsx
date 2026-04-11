// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, Cpu, CheckSquare, Square, AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Button } from '@/components/ui/button'
import { TEE_ARCHITECTURES } from '../data/teeArchitectureData'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import {
  SCOPE_LABELS,
  PQC_READINESS_COLORS,
  MATURITY_COLORS,
  type TEEScope,
  type PQCReadiness,
  type MaturityLevel,
  type TEEArchitecture,
} from '../data/ccConstants'

type DeploymentFilter = 'All' | 'on-prem' | 'cloud' | 'both'
type ScopeFilter = 'All' | TEEScope
type PQCFilter = 'All' | PQCReadiness

const SCOPE_ITEMS = [
  { id: 'All', label: 'All Scopes' },
  { id: 'process', label: 'Process-Level' },
  { id: 'vm', label: 'VM-Level' },
  { id: 'hardware-partition', label: 'Hardware Partition' },
]

const DEPLOYMENT_ITEMS = [
  { id: 'All', label: 'All Deployments' },
  { id: 'on-prem', label: 'On-Prem' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'both', label: 'Both' },
]

const PQC_ITEMS = [
  { id: 'All', label: 'All Readiness' },
  { id: 'production', label: 'Production' },
  { id: 'preview', label: 'Preview' },
  { id: 'planned', label: 'Planned' },
  { id: 'community-only', label: 'Community Only' },
  { id: 'none', label: 'None' },
]

const PQC_READINESS_LABELS: Record<PQCReadiness, string> = {
  production: 'Production',
  preview: 'Preview',
  planned: 'Planned',
  'community-only': 'Community',
  none: 'None',
}

const MATURITY_LABELS: Record<MaturityLevel, string> = {
  mature: 'Mature',
  emerging: 'Emerging',
  experimental: 'Experimental',
}

const COMPARE_DIMENSIONS: { key: keyof TEEArchitecture; label: string }[] = [
  { key: 'scope', label: 'Isolation Scope' },
  { key: 'isolationMechanism', label: 'Isolation Mechanism' },
  { key: 'memoryEncryption', label: 'Memory Encryption' },
  { key: 'attestationRoot', label: 'Attestation Root' },
  { key: 'maxEnclaveSize', label: 'Max Enclave Size' },
  { key: 'keyManagement', label: 'Key Management' },
  { key: 'maturityLevel', label: 'Maturity' },
  { key: 'pqcReadiness', label: 'PQC Readiness' },
  { key: 'pqcNotes', label: 'PQC Notes' },
]

export const TEEArchitectureExplorer: React.FC = () => {
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('All')
  const [deploymentFilter, setDeploymentFilter] = useState<DeploymentFilter>('All')
  const [pqcFilter, setPqcFilter] = useState<PQCFilter>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    return TEE_ARCHITECTURES.filter((tee) => {
      if (scopeFilter !== 'All' && tee.scope !== scopeFilter) return false
      if (deploymentFilter !== 'All' && tee.deploymentModel !== deploymentFilter) return false
      if (pqcFilter !== 'All' && tee.pqcReadiness !== pqcFilter) return false
      return true
    })
  }, [scopeFilter, deploymentFilter, pqcFilter])

  const stats = useMemo(() => {
    const total = filtered.length
    const mature = filtered.filter((t) => t.maturityLevel === 'mature').length
    const pqcReady = filtered.filter(
      (t) => t.pqcReadiness === 'production' || t.pqcReadiness === 'preview'
    ).length
    return { total, mature, pqcReady }
  }, [filtered])

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const toggleCompareSelection = useCallback((id: string) => {
    setSelectedForCompare((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else if (next.size < 3) {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleToggleCompareMode = useCallback(() => {
    setCompareMode((prev) => {
      if (prev) setSelectedForCompare(new Set())
      return !prev
    })
  }, [])

  const comparedTEEs = useMemo(() => {
    return TEE_ARCHITECTURES.filter((t) => selectedForCompare.has(t.id))
  }, [selectedForCompare])

  const renderComparisonValue = (tee: TEEArchitecture, key: keyof TEEArchitecture): string => {
    switch (key) {
      case 'scope':
        return SCOPE_LABELS[tee.scope]
      case 'maturityLevel':
        return MATURITY_LABELS[tee.maturityLevel]
      case 'pqcReadiness':
        return PQC_READINESS_LABELS[tee.pqcReadiness]
      case 'isolationMechanism':
        return tee.isolationMechanism
      case 'memoryEncryption':
        return tee.memoryEncryption
      case 'attestationRoot':
        return tee.attestationRoot
      case 'maxEnclaveSize':
        return tee.maxEnclaveSize
      case 'keyManagement':
        return tee.keyManagement
      case 'pqcNotes':
        return tee.pqcNotes
      default:
        return tee.name
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">TEE Architecture Explorer</h3>
        <p className="text-sm text-muted-foreground">
          Compare 7 trusted execution environment architectures by isolation scope, deployment
          model, and post-quantum readiness. Click a card to expand details, or enable compare mode
          to view platforms side by side.
        </p>
      </div>
      <VendorCoverageNotice migrateLayer="Hardware" className="mb-2" />

      {/* Filter Bar */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap items-center gap-3">
          <FilterDropdown
            items={SCOPE_ITEMS}
            selectedId={scopeFilter}
            onSelect={(id) => setScopeFilter(id as ScopeFilter)}
            label="Scope"
            defaultLabel="All Scopes"
            defaultIcon={<Cpu size={16} className="text-primary" />}
            noContainer
          />
          <FilterDropdown
            items={DEPLOYMENT_ITEMS}
            selectedId={deploymentFilter}
            onSelect={(id) => setDeploymentFilter(id as DeploymentFilter)}
            label="Deployment"
            defaultLabel="All Deployments"
            defaultIcon={<Cpu size={16} className="text-primary" />}
            noContainer
          />
          <FilterDropdown
            items={PQC_ITEMS}
            selectedId={pqcFilter}
            onSelect={(id) => setPqcFilter(id as PQCFilter)}
            label="PQC Readiness"
            defaultLabel="All Readiness"
            defaultIcon={<Cpu size={16} className="text-primary" />}
            noContainer
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <div className="text-xs text-muted-foreground">TEEs Shown</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-success">{stats.mature}</div>
          <div className="text-xs text-muted-foreground">Mature Platforms</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-primary">{stats.pqcReady}</div>
          <div className="text-xs text-muted-foreground">PQC-Ready</div>
        </div>
      </div>

      {/* Compare Mode Toggle */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleToggleCompareMode}>
          {compareMode ? 'Exit Compare' : 'Compare Selected'}
        </Button>
        {compareMode && (
          <span className="text-xs text-muted-foreground">
            Select 2-3 TEEs to compare ({selectedForCompare.size}/3)
          </span>
        )}
      </div>

      {/* TEE Cards */}
      <div className="space-y-2">
        {filtered.map((tee) => {
          const isExpanded = expandedId === tee.id
          const isSelectedForCompare = selectedForCompare.has(tee.id)

          return (
            <div
              key={tee.id}
              className={`glass-panel overflow-hidden transition-colors ${
                isSelectedForCompare ? 'ring-2 ring-primary' : ''
              }`}
            >
              {/* Collapsed Row */}
              <Button
                variant="ghost"
                onClick={() => {
                  if (compareMode) {
                    toggleCompareSelection(tee.id)
                  } else {
                    toggleExpand(tee.id)
                  }
                }}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                {compareMode && (
                  <span className="shrink-0">
                    {isSelectedForCompare ? (
                      <CheckSquare size={18} className="text-primary" />
                    ) : (
                      <Square size={18} className="text-muted-foreground" />
                    )}
                  </span>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{tee.name}</span>
                    <span className="text-xs text-muted-foreground">{tee.vendor}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Scope Badge */}
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {SCOPE_LABELS[tee.scope]}
                    </span>
                    {/* Maturity Badge */}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${MATURITY_COLORS[tee.maturityLevel]}`}
                    >
                      {MATURITY_LABELS[tee.maturityLevel]}
                    </span>
                    {/* PQC Readiness Badge */}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PQC_READINESS_COLORS[tee.pqcReadiness]}`}
                    >
                      PQC: {PQC_READINESS_LABELS[tee.pqcReadiness]}
                    </span>
                    {/* Memory Encryption */}
                    <span className="text-[10px] text-muted-foreground hidden sm:inline">
                      {tee.memoryEncryption.split(',')[0]}
                    </span>
                  </div>
                </div>

                {!compareMode && (
                  <span className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </span>
                )}
              </Button>

              {/* Expanded Details */}
              {isExpanded && !compareMode && (
                <div className="px-4 pb-4 border-t border-border pt-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground mb-4">{tee.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Isolation Mechanism:</span>{' '}
                        <span className="text-foreground">{tee.isolationMechanism}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Attestation Root:</span>{' '}
                        <span className="font-mono text-foreground">{tee.attestationRoot}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Max Enclave Size:</span>{' '}
                        <span className="text-foreground">{tee.maxEnclaveSize}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Key Management:</span>{' '}
                        <span className="text-foreground">{tee.keyManagement}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground font-bold">
                          Side-Channel Protections:
                        </span>
                        <ul className="mt-1 space-y-0.5">
                          {tee.sideChannelProtection.map((p) => (
                            <li key={p} className="text-muted-foreground">
                              &bull; {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {tee.cloudProviders.length > 0 && (
                        <div>
                          <span className="text-muted-foreground font-bold">Cloud Providers:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tee.cloudProviders.map((cp) => (
                              <span
                                key={cp}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                {cp}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-muted-foreground font-bold">Strengths:</span>
                      <ul className="mt-1 space-y-0.5">
                        {tee.strengths.map((s) => (
                          <li key={s} className="text-status-success">
                            &bull; {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <span className="text-muted-foreground font-bold">Limitations:</span>
                      <ul className="mt-1 space-y-0.5">
                        {tee.limitations.map((l) => (
                          <li key={l} className="text-status-warning">
                            &bull; {l}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* PQC Notes */}
                  <div className="mt-4 bg-muted/50 rounded-lg p-3 border border-border">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle size={12} className="text-status-warning" />
                      <span className="text-xs font-bold text-foreground">PQC Migration Notes</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{tee.pqcNotes}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No TEE architectures match the current filters. Try adjusting the scope, deployment,
              or PQC readiness filters.
            </p>
          </div>
        )}
      </div>

      {/* Comparison Table */}
      {compareMode && comparedTEEs.length >= 2 && (
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b border-border">
            <h4 className="text-sm font-bold text-foreground">Side-by-Side Comparison</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-3 text-left text-muted-foreground font-medium w-40">
                    Dimension
                  </th>
                  {comparedTEEs.map((tee) => (
                    <th key={tee.id} className="p-3 text-left text-foreground font-bold">
                      {tee.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARE_DIMENSIONS.map((dim) => (
                  <tr key={dim.key} className="border-b border-border last:border-0">
                    <td className="p-3 text-muted-foreground font-medium">{dim.label}</td>
                    {comparedTEEs.map((tee) => (
                      <td key={tee.id} className="p-3 text-foreground">
                        {renderComparisonValue(tee, dim.key)}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Strengths */}
                <tr className="border-b border-border">
                  <td className="p-3 text-muted-foreground font-medium align-top">Strengths</td>
                  {comparedTEEs.map((tee) => (
                    <td key={tee.id} className="p-3 text-foreground">
                      <ul className="space-y-0.5">
                        {tee.strengths.map((s) => (
                          <li key={s} className="text-status-success">
                            &bull; {s}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
                {/* Limitations */}
                <tr>
                  <td className="p-3 text-muted-foreground font-medium align-top">Limitations</td>
                  {comparedTEEs.map((tee) => (
                    <td key={tee.id} className="p-3 text-foreground">
                      <ul className="space-y-0.5">
                        {tee.limitations.map((l) => (
                          <li key={l} className="text-status-warning">
                            &bull; {l}
                          </li>
                        ))}
                      </ul>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> TEE capabilities and PQC readiness are based on publicly available
          vendor documentation and specifications as of early 2026. Always verify vendor roadmaps
          directly for deployment decisions. PQC migration timelines are estimates.
        </p>
      </div>
    </div>
  )
}
