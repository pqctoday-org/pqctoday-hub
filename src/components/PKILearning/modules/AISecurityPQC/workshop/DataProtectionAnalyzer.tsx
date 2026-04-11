// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Shield, AlertTriangle, ShieldCheck, Star } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { AI_PIPELINE_PROFILES } from '../data/aiPipelineData'
import { PIPELINE_STAGE_COLORS, PIPELINE_STAGE_LABELS } from '../data/aiSecurityConstants'
import { Button } from '@/components/ui/button'

const PIPELINE_ITEMS = AI_PIPELINE_PROFILES.map((p) => ({ id: p.id, label: p.name }))

export const DataProtectionAnalyzer: React.FC = () => {
  const [selectedPipeline, setSelectedPipeline] = useState(AI_PIPELINE_PROFILES[0].id)
  const [viewMode, setViewMode] = useState<'classical' | 'pqc'>('classical')
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  const profile = useMemo(
    () => AI_PIPELINE_PROFILES.find((p) => p.id === selectedPipeline) ?? AI_PIPELINE_PROFILES[0],
    [selectedPipeline]
  )

  const stats = useMemo(() => {
    const vulnerable = profile.stages.filter((s) => s.quantumVulnerable).length
    const hndl = profile.stages.filter((s) => s.hndlExposure).length
    const avgPriority =
      profile.stages.reduce((sum, s) => sum + s.migrationPriority, 0) / profile.stages.length
    return { total: profile.stages.length, vulnerable, hndl, avgPriority }
  }, [profile])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-1">AI Pipeline Crypto Audit</h3>
        <p className="text-sm text-muted-foreground">
          Select a pipeline type, then walk through each stage to identify quantum-vulnerable
          cryptographic operations and HNDL exposure.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-panel p-4 flex flex-wrap items-center gap-4">
        <FilterDropdown
          items={PIPELINE_ITEMS}
          selectedId={selectedPipeline}
          onSelect={(id) => setSelectedPipeline(id)}
          label="Pipeline"
          defaultLabel="Select Pipeline"
          noContainer
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">View:</span>
          <Button
            variant="ghost"
            onClick={() => setViewMode('classical')}
            className={`px-3 py-1.5 text-sm rounded-l border transition-colors ${
              viewMode === 'classical'
                ? 'bg-status-error/20 text-status-error border-status-error/50'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            Classical
          </Button>
          <Button
            variant="ghost"
            onClick={() => setViewMode('pqc')}
            className={`px-3 py-1.5 text-sm rounded-r border-y border-r transition-colors ${
              viewMode === 'pqc'
                ? 'bg-status-success/20 text-status-success border-status-success/50'
                : 'bg-muted text-muted-foreground border-border'
            }`}
          >
            PQC
          </Button>
        </div>
      </div>

      {/* Pipeline description */}
      <div className="glass-panel p-4">
        <p className="text-sm text-foreground/80">{profile.description}</p>
      </div>

      {/* Stages */}
      <div className="space-y-2">
        {profile.stages.map((stage) => {
          const isExpanded = expandedStage === stage.id
          const isVulnerable = viewMode === 'classical' && stage.quantumVulnerable
          const stageColor = PIPELINE_STAGE_COLORS[stage.stage]

          return (
            <div
              key={stage.id}
              className={`glass-panel overflow-hidden border-l-4 ${
                isVulnerable ? 'border-l-status-error' : 'border-l-status-success'
              }`}
            >
              <Button
                variant="ghost"
                onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${stageColor}`}
                  >
                    {PIPELINE_STAGE_LABELS[stage.stage]}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {stage.operation.toUpperCase()}: {stage.description.slice(0, 80)}...
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {stage.hndlExposure && (
                    <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-status-warning/20 text-status-warning border-status-warning/50">
                      HNDL
                    </span>
                  )}
                  {isVulnerable ? (
                    <AlertTriangle size={16} className="text-status-error" />
                  ) : (
                    <ShieldCheck size={16} className="text-status-success" />
                  )}
                </div>
              </Button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                  <p className="text-sm text-foreground/80">{stage.description}</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="glass-panel p-3">
                      <p className="text-xs text-muted-foreground mb-1">Classical Algorithm</p>
                      <p
                        className={`text-sm font-mono ${stage.quantumVulnerable ? 'text-status-error' : 'text-foreground'}`}
                      >
                        {stage.classicalAlgorithm}
                      </p>
                    </div>
                    <div className="glass-panel p-3">
                      <p className="text-xs text-muted-foreground mb-1">PQC Replacement</p>
                      <p className="text-sm font-mono text-status-success">{stage.pqcAlgorithm}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs">
                    <div>
                      <span className="text-muted-foreground">Data at Risk: </span>
                      <span className="text-foreground">{stage.dataAtRisk}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Priority: </span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={
                            i < stage.migrationPriority
                              ? 'text-status-warning fill-status-warning'
                              : 'text-border'
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Scorecard */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Shield size={16} className="text-primary" />
          Pipeline Security Scorecard
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Stages</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-status-error">{stats.vulnerable}</p>
            <p className="text-xs text-muted-foreground">Quantum Vulnerable</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-status-warning">{stats.hndl}</p>
            <p className="text-xs text-muted-foreground">HNDL Exposed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{stats.avgPriority.toFixed(1)}/5</p>
            <p className="text-xs text-muted-foreground">Avg Priority</p>
          </div>
        </div>
      </div>
    </div>
  )
}
