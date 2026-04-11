// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import {
  Building2,
  Shield,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Check,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  HOSPITAL_LAYERS,
  COMPLIANCE_MILESTONES,
  PRIORITY_COLORS,
  SEVERITY_COLORS,
  scoreMigrationPriority,
  type HospitalLayer,
  type HospitalLayerConfig,
} from '../data/healthcareConstants'

// ── Constants ────────────────────────────────────────────────────────────

const POSTURE_OPTIONS = [
  { id: 'no-change', label: 'No Change' },
  { id: 'hybrid', label: 'Hybrid (Classical + PQC)' },
  { id: 'full-pqc', label: 'Full PQC (ML-KEM + ML-DSA)' },
  { id: 'planning', label: 'Planning Only' },
]

const POSTURE_COST_FACTOR: Record<string, number> = {
  'no-change': 0,
  planning: 0.1,
  hybrid: 0.7,
  'full-pqc': 1.0,
}

const VENDOR_READINESS_STYLES: Record<string, string> = {
  available: 'bg-status-success/20 text-status-success',
  preview: 'bg-status-warning/20 text-status-warning',
  planned: 'bg-status-info/20 text-status-info',
  none: 'bg-muted text-muted-foreground',
}

const VENDOR_READINESS_LABELS: Record<string, string> = {
  available: 'Available',
  preview: 'Preview',
  planned: 'Planned',
  none: 'None',
}

const RELEVANCE_STYLES: Record<string, string> = {
  direct: 'bg-status-error/20 text-status-error',
  indirect: 'bg-status-warning/20 text-status-warning',
  informational: 'bg-muted text-muted-foreground',
}

const TIMELINE_START_YEAR = 2023
const TIMELINE_END_YEAR = 2031
const TIMELINE_SPAN = TIMELINE_END_YEAR - TIMELINE_START_YEAR

// ── Types ────────────────────────────────────────────────────────────────

interface LayerOverride {
  posture: string
  endpoints: number
}

interface PrioritizedLayer {
  layer: HospitalLayerConfig
  score: number
  priorityLevel: 'critical' | 'high' | 'medium'
  phase: number
  posture: string
  endpoints: number
  subtotal: number
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getPriorityLevel(score: number): 'critical' | 'high' | 'medium' {
  if (score >= 11) return 'critical'
  if (score >= 8) return 'high'
  return 'medium'
}

function getPhase(score: number): number {
  if (score >= 11) return 1
  if (score >= 8) return 2
  return 3
}

function layerNameById(id: HospitalLayer): string {
  return HOSPITAL_LAYERS.find((l) => l.id === id)?.name ?? id
}

// ── Section Header Sub-component ──────────────────────────────────────────

const SectionHeader: React.FC<{
  sectionKey: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  expanded: boolean
  onToggle: (key: string) => void
}> = ({ sectionKey, icon, title, subtitle, expanded, onToggle }) => (
  <Button
    variant="ghost"
    onClick={() => onToggle(sectionKey)}
    className="w-full flex items-center justify-between p-4 pb-0 text-left"
    aria-expanded={expanded}
  >
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <div className="text-sm font-bold text-foreground">{title}</div>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {expanded ? (
      <ChevronUp size={16} className="text-muted-foreground shrink-0" />
    ) : (
      <ChevronDown size={16} className="text-muted-foreground shrink-0" />
    )}
  </Button>
)

// ── Component ────────────────────────────────────────────────────────────

export const HospitalMigrationPlanner: React.FC = () => {
  const [overrides, setOverrides] = useState<Record<HospitalLayer, LayerOverride>>(
    () =>
      Object.fromEntries(
        HOSPITAL_LAYERS.map((l) => [l.id, { posture: 'no-change', endpoints: l.typicalEndpoints }])
      ) as Record<HospitalLayer, LayerOverride>
  )

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    architecture: true,
    timeline: true,
    budget: true,
    matrix: true,
    roadmap: true,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  // ── Derived Data ─────────────────────────────────────────────────────

  const prioritizedLayers = useMemo<PrioritizedLayer[]>(() => {
    return HOSPITAL_LAYERS.map((layer) => {
      const override = overrides[layer.id]
      const score = scoreMigrationPriority(layer)
      const costFactor = POSTURE_COST_FACTOR[override.posture] ?? 0
      const subtotal = override.endpoints * layer.estimatedCostPerEndpoint * costFactor

      return {
        layer,
        score,
        priorityLevel: getPriorityLevel(score),
        phase: getPhase(score),
        posture: override.posture,
        endpoints: override.endpoints,
        subtotal,
      }
    }).sort((a, b) => b.score - a.score)
  }, [overrides])

  const totalBudget = useMemo(
    () => prioritizedLayers.reduce((sum, p) => sum + p.subtotal, 0),
    [prioritizedLayers]
  )

  const phaseGroups = useMemo(() => {
    const phases = [
      {
        phase: 1,
        label: 'Phase 1: Critical Priority (2023\u20132027)',
        description:
          'Internet-facing and highest-sensitivity layers. Deploy PQC hybrid TLS on patient portals, begin medical device firmware signing migration, and protect genomic research infrastructure.',
        layers: prioritizedLayers.filter((p) => p.phase === 1),
      },
      {
        phase: 2,
        label: 'Phase 2: High Priority (2027\u20132029)',
        description:
          'Internal clinical systems with significant data sensitivity. Upgrade EHR workstations, medical imaging PACS, and laboratory systems during planned maintenance cycles.',
        layers: prioritizedLayers.filter((p) => p.phase === 2),
      },
      {
        phase: 3,
        label: 'Phase 3: Standard Priority (2029\u20132031)',
        description:
          'Internal pharmacy and remaining laboratory systems. Align with NIST classical algorithm deprecation timeline and vendor update availability.',
        layers: prioritizedLayers.filter((p) => p.phase === 3),
      },
    ]
    return phases.filter((p) => p.layers.length > 0)
  }, [prioritizedLayers])

  // ── Handlers ─────────────────────────────────────────────────────────

  const handlePostureChange = (layerId: HospitalLayer, posture: string) => {
    setOverrides((prev) => ({
      ...prev,
      [layerId]: { ...prev[layerId], posture },
    }))
  }

  const handleEndpointsChange = (layerId: HospitalLayer, value: number) => {
    setOverrides((prev) => ({
      ...prev,
      [layerId]: { ...prev[layerId], endpoints: Math.max(1, value) },
    }))
  }

  const resetAll = () => {
    setOverrides(
      Object.fromEntries(
        HOSPITAL_LAYERS.map((l) => [l.id, { posture: 'no-change', endpoints: l.typicalEndpoints }])
      ) as Record<HospitalLayer, LayerOverride>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Configure the 7 layers of a hospital network architecture to generate a prioritized PQC
        migration roadmap with compliance milestones and budget estimates. Adjust crypto posture and
        endpoint counts to see how migration priority and costs change.
      </p>

      {/* ── Section 1: Hospital Architecture Configurator ────────────── */}
      <div className="glass-panel overflow-hidden">
        <SectionHeader
          sectionKey="architecture"
          icon={<Building2 size={16} className="text-primary" />}
          title="Hospital Architecture"
          subtitle="7-layer network stack with cryptographic posture configuration"
          expanded={expandedSections.architecture}
          onToggle={toggleSection}
        />

        {expandedSections.architecture && (
          <div className="p-4 space-y-3">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={resetAll} className="text-xs">
                Reset All
              </Button>
            </div>

            {HOSPITAL_LAYERS.map((layer) => {
              const override = overrides[layer.id]
              const prioritized = prioritizedLayers.find((p) => p.layer.id === layer.id)
              const score = prioritized?.score ?? 0
              const priorityLevel = prioritized?.priorityLevel ?? 'medium'

              return (
                <div
                  key={layer.id}
                  className={`glass-panel p-4 border-l-4 ${
                    priorityLevel === 'critical'
                      ? 'border-l-destructive'
                      : priorityLevel === 'high'
                        ? 'border-l-warning'
                        : 'border-l-primary'
                  }`}
                >
                  {/* Row 1: Layer header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                          L{layer.level}
                        </span>
                        <span className="text-sm font-bold text-foreground">{layer.name}</span>
                        {layer.internetFacing && (
                          <span className="flex items-center gap-1 text-[10px] bg-status-error/20 text-status-error rounded px-1.5 py-0.5">
                            <Globe size={10} />
                            Internet-facing
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${SEVERITY_COLORS[layer.dataSensitivity]}`}
                        >
                          {layer.dataSensitivity.toUpperCase()}
                        </span>
                        <span
                          className={`text-[10px] rounded px-1.5 py-0.5 ${VENDOR_READINESS_STYLES[layer.vendorReadiness]}`}
                        >
                          {VENDOR_READINESS_LABELS[layer.vendorReadiness]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{layer.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Current crypto:{' '}
                        <span className="font-mono text-foreground">{layer.defaultCrypto}</span>
                      </p>
                    </div>
                  </div>

                  {/* Row 2: Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <FilterDropdown
                        items={POSTURE_OPTIONS}
                        selectedId={override.posture}
                        onSelect={(id) => handlePostureChange(layer.id, id)}
                        label="Crypto Posture"
                        defaultLabel="No Change"
                        defaultIcon={<Shield size={14} className="text-muted-foreground" />}
                        noContainer
                        className="min-w-[200px]"
                      />
                    </div>
                    <div className="w-32">
                      <label
                        htmlFor={`endpoints-${layer.id}`}
                        className="block text-[10px] text-muted-foreground mb-1"
                      >
                        Endpoints
                      </label>
                      <input
                        id={`endpoints-${layer.id}`}
                        type="number"
                        min={1}
                        max={100000}
                        value={override.endpoints}
                        onChange={(e) =>
                          handleEndpointsChange(layer.id, parseInt(e.target.value) || 1)
                        }
                        className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground font-mono"
                      />
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground mb-1">Priority</div>
                      <span
                        className={`text-xs font-bold rounded px-2 py-1 border ${PRIORITY_COLORS[priorityLevel]}`}
                      >
                        {score} pts
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Section 2: Compliance Milestone Timeline ─────────────────── */}
      <div className="glass-panel overflow-hidden">
        <SectionHeader
          sectionKey="timeline"
          icon={<Clock size={16} className="text-status-warning" />}
          title="Compliance Milestone Timeline"
          subtitle="Key regulatory deadlines from 2025 to 2031"
          expanded={expandedSections.timeline}
          onToggle={toggleSection}
        />

        {expandedSections.timeline && (
          <div className="p-4">
            {/* Timeline axis */}
            <div className="relative">
              {/* Year markers */}
              <div className="flex justify-between text-[10px] text-muted-foreground mb-2 px-1">
                {Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => (
                  <span key={i} className="font-mono">
                    {TIMELINE_START_YEAR + i}
                  </span>
                ))}
              </div>

              {/* Track line */}
              <div className="relative h-3 bg-muted rounded-full mb-6">
                {/* Year tick marks */}
                {Array.from({ length: TIMELINE_SPAN + 1 }, (_, i) => (
                  <div
                    key={i}
                    className="absolute top-0 w-px h-3 bg-border"
                    style={{ left: `${(i / TIMELINE_SPAN) * 100}%` }}
                  />
                ))}

                {/* Milestone markers on the track */}
                {COMPLIANCE_MILESTONES.map((ms) => {
                  const quarterOffset =
                    ms.quarter === 'Q1'
                      ? 0
                      : ms.quarter === 'Q2'
                        ? 0.25
                        : ms.quarter === 'Q3'
                          ? 0.5
                          : 0.75
                  const position =
                    ((ms.year - TIMELINE_START_YEAR + quarterOffset) / TIMELINE_SPAN) * 100
                  return (
                    <div
                      key={ms.id}
                      className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background ${
                        ms.pqcRelevance === 'direct'
                          ? 'bg-status-error'
                          : ms.pqcRelevance === 'indirect'
                            ? 'bg-status-warning'
                            : 'bg-muted-foreground'
                      }`}
                      style={{ left: `${Math.min(Math.max(position, 1), 99)}%` }}
                      title={`${ms.name} (${ms.year} ${ms.quarter})`}
                    />
                  )
                })}
              </div>

              {/* Milestone detail cards */}
              <div className="space-y-2">
                {COMPLIANCE_MILESTONES.map((ms) => (
                  <div key={ms.id} className="bg-muted/30 rounded-lg p-3 border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                            {ms.year} {ms.quarter}
                          </span>
                          <span className="text-xs font-bold text-foreground">{ms.name}</span>
                          <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                            {ms.authority}
                          </span>
                          <span
                            className={`text-[10px] rounded px-1.5 py-0.5 ${RELEVANCE_STYLES[ms.pqcRelevance]}`}
                          >
                            {ms.pqcRelevance}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{ms.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ms.affectedLayers.map((lid) => (
                        <span
                          key={lid}
                          className="text-[9px] bg-primary/10 text-primary rounded px-1.5 py-0.5"
                        >
                          {layerNameById(lid)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Budget Estimator ──────────────────────────────── */}
      <div className="glass-panel overflow-hidden">
        <SectionHeader
          sectionKey="budget"
          icon={<DollarSign size={16} className="text-status-success" />}
          title="Budget Estimator"
          subtitle="Per-layer cost estimates based on endpoint count and selected posture"
          expanded={expandedSections.budget}
          onToggle={toggleSection}
        />

        {expandedSections.budget && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                      Layer
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                      Endpoints
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">
                      Cost/Endpoint
                    </th>
                    <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden md:table-cell">
                      Posture
                    </th>
                    <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {HOSPITAL_LAYERS.map((layer) => {
                    const override = overrides[layer.id]
                    const costFactor = POSTURE_COST_FACTOR[override.posture] ?? 0
                    const subtotal =
                      override.endpoints * layer.estimatedCostPerEndpoint * costFactor
                    const postureLabel =
                      POSTURE_OPTIONS.find((p) => p.id === override.posture)?.label ?? 'No Change'

                    return (
                      <tr key={layer.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="p-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-muted-foreground">
                              L{layer.level}
                            </span>
                            <span className="text-xs font-medium text-foreground">
                              {layer.name}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <span className="text-xs font-mono text-foreground">
                            {override.endpoints.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2 text-right hidden sm:table-cell">
                          <span className="text-xs font-mono text-muted-foreground">
                            ${layer.estimatedCostPerEndpoint.toLocaleString()}
                          </span>
                        </td>
                        <td className="p-2 hidden md:table-cell">
                          <span className="text-[10px] text-muted-foreground">{postureLabel}</span>
                        </td>
                        <td className="p-2 text-right">
                          <span
                            className={`text-xs font-mono font-bold ${
                              subtotal === 0 ? 'text-muted-foreground' : 'text-foreground'
                            }`}
                          >
                            ${subtotal.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border">
                    <td colSpan={4} className="p-2 text-right text-xs font-bold text-foreground">
                      Total Estimated Budget
                    </td>
                    <td className="p-2 text-right">
                      <span className="text-sm font-mono font-bold text-primary">
                        ${totalBudget.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {totalBudget === 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3 bg-muted/30 rounded-lg p-3">
                <AlertTriangle size={14} className="text-status-warning shrink-0" />
                <span>
                  All layers are set to &ldquo;No Change.&rdquo; Select a crypto posture above to
                  generate budget estimates.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Section 4: Migration Priority Matrix ─────────────────────── */}
      <div className="glass-panel overflow-hidden">
        <SectionHeader
          sectionKey="matrix"
          icon={<Shield size={16} className="text-status-error" />}
          title="Migration Priority Matrix"
          subtitle="Auto-calculated from sensitivity, internet exposure, and vendor readiness"
          expanded={expandedSections.matrix}
          onToggle={toggleSection}
        />

        {expandedSections.matrix && (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                      Layer
                    </th>
                    <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                      Score
                    </th>
                    <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                      Priority
                    </th>
                    <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                      Phase
                    </th>
                    <th className="text-center p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">
                      Internet
                    </th>
                    <th className="text-center p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">
                      Sensitivity
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {prioritizedLayers.map((p) => (
                    <tr key={p.layer.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            L{p.layer.level}
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {p.layer.name}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-xs font-mono font-bold text-foreground">
                          {p.score}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`text-[10px] font-bold rounded px-2 py-0.5 border ${PRIORITY_COLORS[p.priorityLevel]}`}
                        >
                          {p.priorityLevel.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2 text-center">
                        <span className="text-xs font-mono text-primary">Phase {p.phase}</span>
                      </td>
                      <td className="p-2 text-center hidden sm:table-cell">
                        {p.layer.internetFacing ? (
                          <Globe size={14} className="text-status-error mx-auto" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground">&mdash;</span>
                        )}
                      </td>
                      <td className="p-2 text-center hidden sm:table-cell">
                        <span
                          className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${SEVERITY_COLORS[p.layer.dataSensitivity]}`}
                        >
                          {p.layer.dataSensitivity.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 5: 3-Phase Roadmap Summary ───────────────────────── */}
      <div className="glass-panel overflow-hidden">
        <SectionHeader
          sectionKey="roadmap"
          icon={<Check size={16} className="text-status-success" />}
          title="3-Phase Migration Roadmap"
          subtitle="Prioritized timeline with budget allocation per phase"
          expanded={expandedSections.roadmap}
          onToggle={toggleSection}
        />

        {expandedSections.roadmap && (
          <div className="p-4 space-y-3">
            {phaseGroups.map((pg) => {
              const phaseBudget = pg.layers.reduce((sum, p) => sum + p.subtotal, 0)
              const phaseColor =
                pg.phase === 1
                  ? 'border-l-destructive'
                  : pg.phase === 2
                    ? 'border-l-warning'
                    : 'border-l-primary'

              return (
                <div
                  key={pg.phase}
                  className={`bg-muted/30 rounded-lg p-4 border border-border border-l-4 ${phaseColor}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="text-xs font-bold text-foreground">{pg.label}</div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={12} className="text-status-success" />
                      <span className="text-xs font-mono font-bold text-primary">
                        ${phaseBudget.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-3">{pg.description}</p>

                  <div className="space-y-1.5">
                    {pg.layers.map((p) => {
                      const postureLabel =
                        POSTURE_OPTIONS.find((opt) => opt.id === p.posture)?.label ?? 'No Change'
                      return (
                        <div
                          key={p.layer.id}
                          className="flex items-center justify-between bg-background/50 rounded px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-muted-foreground">
                              L{p.layer.level}
                            </span>
                            <span className="text-xs font-medium text-foreground truncate">
                              {p.layer.name}
                            </span>
                            {p.layer.internetFacing && (
                              <Globe size={10} className="text-status-error shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">
                              {postureLabel}
                            </span>
                            <span className="text-[10px] font-mono text-foreground">
                              ${p.subtotal.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Total summary */}
            <div className="flex items-center justify-between bg-primary/10 rounded-lg p-4 border border-primary/30">
              <div className="flex items-center gap-2">
                <DollarSign size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Total Migration Budget</span>
              </div>
              <span className="text-lg font-mono font-bold text-primary">
                ${totalBudget.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── HNDL Warning ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-status-warning/10 rounded-lg p-4 border border-status-warning/30">
        <AlertTriangle size={18} className="text-status-warning shrink-0 mt-0.5" />
        <div>
          <div className="text-sm font-bold text-foreground">HNDL Risk for Healthcare Networks</div>
          <p className="text-xs text-muted-foreground mt-1">
            Hospital networks carry some of the longest data retention requirements of any sector.
            Patient records, genomic data, and biometric identifiers must be protected for decades
            to a lifetime. Encrypted healthcare data captured today by harvest-now-decrypt-later
            adversaries could be decrypted when cryptographically relevant quantum computers arrive,
            exposing irreplaceable patient information. Internet-facing layers (patient portals,
            research infrastructure) and high-sensitivity internal systems (medical devices, EHR)
            should be prioritized for immediate PQC migration planning.
          </p>
        </div>
      </div>
    </div>
  )
}
