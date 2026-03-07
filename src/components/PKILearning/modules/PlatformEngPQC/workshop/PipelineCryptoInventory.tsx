// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, ShieldCheck } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PIPELINE_STAGES } from '../data/pipelineStagesData'
import {
  HNDL_COLORS,
  HNDL_LABELS,
  PRIORITY_COLORS,
  ALGORITHM_LABELS,
  type HNDLExposure,
  type MigrationPriority,
} from '../data/platformEngConstants'

type HNDLFilter = 'All' | HNDLExposure
type PriorityFilter = 'All' | MigrationPriority

const HNDL_ITEMS = [
  { id: 'All', label: 'All Exposure Levels' },
  { id: 'high', label: 'High HNDL' },
  { id: 'medium', label: 'Medium HNDL' },
  { id: 'low', label: 'Low HNDL' },
  { id: 'none', label: 'No HNDL Risk' },
]

const PRIORITY_ITEMS = [
  { id: 'All', label: 'All Priorities' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
]

export const PipelineCryptoInventory: React.FC = () => {
  const [hndlFilter, setHndlFilter] = useState<HNDLFilter>('All')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All')
  const [expandedStage, setExpandedStage] = useState<string | null>('source')
  const [expandedAsset, setExpandedAsset] = useState<string | null>(null)

  const filteredStages = useMemo(() => {
    return PIPELINE_STAGES.filter((stage) => {
      if (hndlFilter !== 'All' && stage.hndlExposure !== hndlFilter) return false
      if (priorityFilter !== 'All' && stage.migrationPriority !== priorityFilter) return false
      return true
    })
  }, [hndlFilter, priorityFilter])

  const stats = useMemo(() => {
    const allAssets = PIPELINE_STAGES.flatMap((s) => s.cryptoAssets)
    return {
      totalStages: filteredStages.length,
      criticalAssets: allAssets.filter((a) => a.hndlRisk === 'high').length,
      quantumVulnerable: allAssets.filter((a) => a.quantumVulnerable).length,
      totalAssets: allAssets.length,
    }
  }, [filteredStages])

  const toggleStage = useCallback((id: string) => {
    setExpandedStage((prev) => (prev === id ? null : id))
    setExpandedAsset(null)
  }, [])

  const toggleAsset = useCallback((id: string) => {
    setExpandedAsset((prev) => (prev === id ? null : id))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Pipeline Crypto Asset Inventory</h3>
        <p className="text-sm text-muted-foreground">
          Map every cryptographic primitive embedded in your CI/CD pipeline — from source control to
          runtime. Identify which assets are quantum-vulnerable and their harvest-now-decrypt-later
          (HNDL) exposure window.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.totalStages}</div>
          <div className="text-xs text-muted-foreground">Pipeline Stages</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-error">{stats.quantumVulnerable}</div>
          <div className="text-xs text-muted-foreground">Vulnerable Assets</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-status-warning">{stats.criticalAssets}</div>
          <div className="text-xs text-muted-foreground">High HNDL Risk</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{stats.totalAssets}</div>
          <div className="text-xs text-muted-foreground">Total Assets</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4">
        <div className="flex flex-wrap gap-3">
          <FilterDropdown
            items={HNDL_ITEMS}
            selectedId={hndlFilter}
            onSelect={(id) => setHndlFilter(id as HNDLFilter)}
            label="HNDL Exposure"
            defaultLabel="All Exposure Levels"
            defaultIcon={<AlertTriangle size={16} className="text-status-warning" />}
            noContainer
          />
          <FilterDropdown
            items={PRIORITY_ITEMS}
            selectedId={priorityFilter}
            onSelect={(id) => setPriorityFilter(id as PriorityFilter)}
            label="Migration Priority"
            defaultLabel="All Priorities"
            defaultIcon={<ShieldCheck size={16} className="text-primary" />}
            noContainer
          />
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="space-y-2">
        {filteredStages.map((stage, idx) => {
          const isExpanded = expandedStage === stage.id
          return (
            <div key={stage.id} className="glass-panel overflow-hidden">
              {/* Stage Header */}
              <button
                onClick={() => toggleStage(stage.id)}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{stage.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${HNDL_COLORS[stage.hndlExposure]}`}
                    >
                      HNDL: {HNDL_LABELS[stage.hndlExposure]}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${PRIORITY_COLORS[stage.migrationPriority]}`}
                    >
                      {stage.migrationPriority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{stage.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {stage.cryptoAssets.length} asset{stage.cryptoAssets.length !== 1 ? 's' : ''}
                  </span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Stage Expanded */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3 animate-fade-in">
                  {/* Tools used in this stage */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-xs text-muted-foreground font-medium">Tools:</span>
                    {stage.tools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>

                  {/* Crypto Assets */}
                  {stage.cryptoAssets.map((asset) => {
                    const isAssetExpanded = expandedAsset === asset.id
                    return (
                      <div
                        key={asset.id}
                        className="bg-muted/30 rounded-lg border border-border overflow-hidden"
                      >
                        <button
                          onClick={() => toggleAsset(asset.id)}
                          className="w-full text-left p-3 flex items-center gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-foreground">
                                {asset.name}
                              </span>
                              {asset.quantumVulnerable && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-error/10 text-status-error border border-status-error/30 font-bold">
                                  QUANTUM-VULNERABLE
                                </span>
                              )}
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${HNDL_COLORS[asset.hndlRisk]}`}
                              >
                                HNDL: {HNDL_LABELS[asset.hndlRisk]}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                              <span>
                                Algorithm:{' '}
                                <span className="font-mono text-foreground">
                                  {ALGORITHM_LABELS[asset.algorithm]} {asset.keySize}
                                </span>
                              </span>
                              <span>
                                Exposure:{' '}
                                <span className="text-foreground">{asset.exposureWindow}</span>
                              </span>
                            </div>
                          </div>
                          {isAssetExpanded ? (
                            <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                          )}
                        </button>

                        {isAssetExpanded && (
                          <div className="px-3 pb-3 border-t border-border pt-3 space-y-2 animate-fade-in">
                            {asset.notes && (
                              <p className="text-xs text-muted-foreground">{asset.notes}</p>
                            )}
                            <div className="bg-status-success/10 rounded p-3 border border-status-success/20">
                              <div className="flex items-center gap-1 mb-1">
                                <ShieldCheck size={12} className="text-status-success" />
                                <span className="text-xs font-bold text-foreground">
                                  PQC Replacement
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                <span className="font-mono text-status-success">
                                  {asset.pqcReplacement}
                                </span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {filteredStages.length === 0 && (
          <div className="glass-panel p-8 text-center">
            <p className="text-sm text-muted-foreground">
              No pipeline stages match the current filters.
            </p>
          </div>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Crypto asset inventory data reflects common configurations as of
          early 2026. Actual algorithms depend on your tool versions and configuration. Always
          validate against your specific deployment with a CBOM scanner.
        </p>
      </div>
    </div>
  )
}
