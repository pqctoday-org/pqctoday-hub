// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import {
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Server,
  Clock,
  Radio,
  ChevronDown,
  ChevronRight,
  Info,
  Cpu,
  MapPin,
  Award,
  Zap,
  Target,
} from 'lucide-react'
import type { RegulationRegion } from '../data/automotiveConstants'
import { REGION_LABELS, LIFECYCLE_PHASE_LABELS } from '../data/automotiveConstants'
import {
  LIFECYCLE_PHASES,
  AUTOMOTIVE_HSM_TIERS,
  AUTOMOTIVE_COMPLIANCE_MILESTONES,
  computeVulnerabilityWindow,
} from '../data/lifecycleComplianceData'
import type {
  LifecyclePhaseConfig,
  AutomotiveHSMTier,
  AutomotiveComplianceMilestone,
} from '../data/lifecycleComplianceData'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REGION_KEYS: RegulationRegion[] = ['eu', 'us', 'china', 'japan', 'korea']

const RELEVANCE_STYLES: Record<
  AutomotiveComplianceMilestone['pqcRelevance'],
  { label: string; classes: string }
> = {
  direct: { label: 'Direct', classes: 'bg-status-success/20 text-status-success' },
  indirect: { label: 'Indirect', classes: 'bg-status-warning/20 text-status-warning' },
  informational: { label: 'Info', classes: 'bg-muted text-muted-foreground' },
}

const HSM_PQC_STYLES: Record<string, string> = {
  available: 'text-status-success',
  limited: 'text-status-warning',
  not: 'text-status-error',
  planned: 'text-status-info',
}

function getPqcSupportColor(pqcSupport: string): string {
  const lower = pqcSupport.toLowerCase()
  if (lower.startsWith('available')) return HSM_PQC_STYLES.available
  if (lower.startsWith('limited')) return HSM_PQC_STYLES.limited
  if (lower.startsWith('not')) return HSM_PQC_STYLES.not
  return HSM_PQC_STYLES.planned
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Configuration panel for model year, road life, region, and CRQC arrival */
const ConfigPanel: React.FC<{
  modelYear: number
  setModelYear: (v: number) => void
  roadLifeYears: number
  setRoadLifeYears: (v: number) => void
  selectedRegion: RegulationRegion | 'all'
  setSelectedRegion: (v: RegulationRegion | 'all') => void
  crqcArrivalYear: number
  setCrqcArrivalYear: (v: number) => void
}> = ({
  modelYear,
  setModelYear,
  roadLifeYears,
  setRoadLifeYears,
  selectedRegion,
  setSelectedRegion,
  crqcArrivalYear,
  setCrqcArrivalYear,
}) => (
  <div className="glass-panel p-4 space-y-5">
    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
      <Target size={16} className="text-primary" />
      Scenario Configuration
    </h4>

    {/* Model Year */}
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        Model Year: <span className="text-foreground font-bold">{modelYear}</span>
      </label>
      <input
        type="range"
        min={2024}
        max={2032}
        value={modelYear}
        onChange={(e) => setModelYear(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>2024</span>
        <span>2032</span>
      </div>
    </div>

    {/* Road Life */}
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        Road Life: <span className="text-foreground font-bold">{roadLifeYears} years</span>
      </label>
      <input
        type="range"
        min={10}
        max={25}
        value={roadLifeYears}
        onChange={(e) => setRoadLifeYears(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>10 yr</span>
        <span>25 yr</span>
      </div>
    </div>

    {/* Regulatory Region */}
    <div>
      <span className="text-xs font-medium text-muted-foreground block mb-2">
        Regulatory Region
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedRegion('all')}
          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            selectedRegion === 'all'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-card text-muted-foreground hover:border-primary/50'
          }`}
        >
          All Regions
        </button>
        {REGION_KEYS.map((r) => (
          <button
            key={r}
            onClick={() => setSelectedRegion(r)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              selectedRegion === r
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            {REGION_LABELS[r]}
          </button>
        ))}
      </div>
    </div>

    {/* CRQC Arrival Year */}
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1">
        CRQC Arrival Year: <span className="text-foreground font-bold">{crqcArrivalYear}</span>
      </label>
      <input
        type="range"
        min={2030}
        max={2045}
        value={crqcArrivalYear}
        onChange={(e) => setCrqcArrivalYear(Number(e.target.value))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>2030</span>
        <span>2045</span>
      </div>
    </div>
  </div>
)

/** Horizontal bar timeline visualization */
const TimelineVisualization: React.FC<{
  result: ReturnType<typeof computeVulnerabilityWindow>
  modelYear: number
  roadLifeYears: number
  crqcArrivalYear: number
}> = ({ result, modelYear, roadLifeYears, crqcArrivalYear }) => {
  const timelineStart = modelYear - 2
  const timelineEnd = result.vehicleEndYear + 2
  const totalSpan = timelineEnd - timelineStart

  const yearToPercent = (year: number) => ((year - timelineStart) / totalSpan) * 100

  // Generate year markers at regular intervals
  const yearMarkers: number[] = []
  for (let y = Math.ceil(timelineStart / 2) * 2; y <= timelineEnd; y += 2) {
    yearMarkers.push(y)
  }

  // OTA upgrade windows every 4 years during road life
  const otaYears: number[] = []
  for (let y = modelYear + 4; y < modelYear + roadLifeYears; y += 4) {
    otaYears.push(y)
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Calendar size={16} className="text-primary" />
        Vehicle Lifecycle Timeline
      </h4>

      <div className="relative h-16 bg-muted/30 rounded-lg overflow-hidden border border-border">
        {/* Phase bars */}
        {result.phases.map((phase, i) => {
          const left = Math.max(0, yearToPercent(phase.startYear))
          const width = yearToPercent(phase.endYear) - yearToPercent(phase.startYear)
          return (
            <div
              key={i}
              className={`absolute top-2 h-12 rounded ${phase.color} border border-border/50 flex items-center justify-center`}
              style={{ left: `${left}%`, width: `${Math.max(width, 1)}%` }}
            >
              {width > 8 && (
                <span className="text-xs font-medium text-foreground truncate px-1">
                  {phase.label}
                </span>
              )}
            </div>
          )
        })}

        {/* OTA upgrade windows */}
        {otaYears.map((year) => (
          <div
            key={`ota-${year}`}
            className="absolute top-0 h-full border-l-2 border-dashed border-primary/40"
            style={{ left: `${yearToPercent(year)}%` }}
            title={`OTA Upgrade Window: ${year}`}
          >
            <div className="absolute -top-0.5 -left-1.5 w-3 h-3 rounded-full bg-primary/40" />
          </div>
        ))}

        {/* CRQC arrival line */}
        {crqcArrivalYear >= timelineStart && crqcArrivalYear <= timelineEnd && (
          <div
            className="absolute top-0 h-full border-l-2 border-status-error z-10"
            style={{ left: `${yearToPercent(crqcArrivalYear)}%` }}
            title={`CRQC Arrival: ${crqcArrivalYear}`}
          >
            <div className="absolute -top-1 -left-2 px-1 py-0.5 text-[10px] font-bold text-status-error bg-background rounded border border-status-error/50 whitespace-nowrap">
              CRQC {crqcArrivalYear}
            </div>
          </div>
        )}
      </div>

      {/* Year axis */}
      <div className="relative h-5">
        {yearMarkers.map((year) => (
          <div
            key={year}
            className="absolute text-[10px] text-muted-foreground -translate-x-1/2"
            style={{ left: `${yearToPercent(year)}%` }}
          >
            {year}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-primary/30 border border-border/50" />
          Production
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-status-success/30 border border-border/50" />
          Pre-CRQC Road Life
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-status-error/30 border border-border/50" />
          Post-CRQC Vulnerable
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-muted border border-border/50" />
          End of Life
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-primary/40 inline-block" />
          OTA Window
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-0.5 border-t-2 border-status-error inline-block" />
          CRQC Arrival
        </span>
      </div>
    </div>
  )
}

/** Vulnerability summary cards */
const VulnerabilitySummary: React.FC<{
  result: ReturnType<typeof computeVulnerabilityWindow>
  modelYear: number
  crqcArrivalYear: number
}> = ({ result, modelYear, crqcArrivalYear }) => {
  const needsPqcFromFactory =
    modelYear + result.otaUpgradeWindows * 4 < crqcArrivalYear ? false : true

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="glass-panel p-3 text-center">
        <Clock size={18} className="mx-auto text-primary mb-1" />
        <div className="text-xl font-bold text-foreground">{result.vehicleEndYear}</div>
        <div className="text-xs text-muted-foreground">Vehicle End Year</div>
      </div>

      <div className="glass-panel p-3 text-center">
        {result.isVulnerable ? (
          <ShieldAlert size={18} className="mx-auto text-status-error mb-1" />
        ) : (
          <ShieldCheck size={18} className="mx-auto text-status-success mb-1" />
        )}
        <div
          className={`text-xl font-bold ${result.isVulnerable ? 'text-status-error' : 'text-status-success'}`}
        >
          {result.isVulnerable ? `${result.vulnerableYears} yr` : 'None'}
        </div>
        <div className="text-xs text-muted-foreground">Vulnerable Years</div>
      </div>

      <div className="glass-panel p-3 text-center">
        <Radio size={18} className="mx-auto text-primary mb-1" />
        <div className="text-xl font-bold text-foreground">{result.otaUpgradeWindows}</div>
        <div className="text-xs text-muted-foreground">OTA Upgrade Windows</div>
      </div>

      <div className="glass-panel p-3 text-center">
        {needsPqcFromFactory ? (
          <AlertTriangle size={18} className="mx-auto text-status-warning mb-1" />
        ) : (
          <Info size={18} className="mx-auto text-status-info mb-1" />
        )}
        <div
          className={`text-xl font-bold ${needsPqcFromFactory ? 'text-status-warning' : 'text-status-info'}`}
        >
          {needsPqcFromFactory ? 'Yes' : 'No'}
        </div>
        <div className="text-xs text-muted-foreground">PQC from Factory?</div>
      </div>
    </div>
  )
}

/** Regulatory milestones vertical timeline */
const RegulatoryTimeline: React.FC<{
  milestones: AutomotiveComplianceMilestone[]
}> = ({ milestones }) => {
  if (milestones.length === 0) {
    return (
      <div className="glass-panel p-6 text-center">
        <Info size={24} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No regulatory milestones found for this region.
        </p>
      </div>
    )
  }

  return (
    <div className="glass-panel p-4 space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Award size={16} className="text-primary" />
        Regulatory Milestones
      </h4>

      <div className="relative pl-6 space-y-4">
        {/* Vertical line */}
        <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-border" />

        {milestones.map((m) => {
          const style = RELEVANCE_STYLES[m.pqcRelevance]
          return (
            <div key={m.id} className="relative">
              {/* Dot */}
              <div
                className={`absolute -left-[14px] top-1.5 w-3 h-3 rounded-full border-2 border-background ${
                  m.pqcRelevance === 'direct'
                    ? 'bg-status-success'
                    : m.pqcRelevance === 'indirect'
                      ? 'bg-status-warning'
                      : 'bg-muted-foreground'
                }`}
              />

              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-primary">
                    {m.year} {m.quarter}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${style.classes}`}
                  >
                    {style.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.authority}</span>
                </div>
                <h5 className="text-sm font-semibold text-foreground">{m.name}</h5>
                <p className="text-xs text-muted-foreground mt-1">{m.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.affectedSystems.map((sys, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
                    >
                      {sys}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Single HSM tier card */
const HSMTierCard: React.FC<{ tier: AutomotiveHSMTier }> = ({ tier }) => (
  <div className="glass-panel p-4 space-y-3">
    <div className="flex items-start gap-2">
      <Server size={16} className="text-primary shrink-0 mt-0.5" />
      <div>
        <h5 className="text-sm font-bold text-foreground">{tier.name}</h5>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <MapPin size={10} /> {tier.location}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <div>
        <span className="text-muted-foreground">Standard</span>
        <div className="font-mono text-foreground">{tier.standard}</div>
      </div>
      <div>
        <span className="text-muted-foreground">FIPS Level</span>
        <div className="font-mono text-foreground">{tier.fipsLevel}</div>
      </div>
      <div className="col-span-2">
        <span className="text-muted-foreground">PQC Support</span>
        <div className={`font-medium ${getPqcSupportColor(tier.pqcSupport)}`}>
          {tier.pqcSupport}
        </div>
      </div>
    </div>

    <div>
      <span className="text-xs text-muted-foreground">Typical Vendors</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {tier.typicalVendors.map((v, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded border border-primary/20"
          >
            {v}
          </span>
        ))}
      </div>
    </div>

    <div>
      <span className="text-xs text-muted-foreground">Key Types</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {tier.keyTypes.map((k, i) => (
          <span
            key={i}
            className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground"
          >
            {k}
          </span>
        ))}
      </div>
    </div>

    <div className="flex items-center gap-2 text-xs border-t border-border pt-2">
      <Zap size={12} className="text-status-warning shrink-0" />
      <span className="text-muted-foreground">{tier.quantumThreat}</span>
    </div>
  </div>
)

/** Expandable lifecycle phase detail section */
const LifecyclePhaseDetail: React.FC<{
  phase: LifecyclePhaseConfig
  isExpanded: boolean
  onToggle: () => void
}> = ({ phase, isExpanded, onToggle }) => (
  <div className="glass-panel overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
          {phase.id === 'production' ? (
            <Cpu size={14} className="text-primary" />
          ) : phase.id === 'road-life' ? (
            <Calendar size={14} className="text-primary" />
          ) : (
            <Clock size={14} className="text-primary" />
          )}
        </div>
        <div>
          <h5 className="text-sm font-semibold text-foreground">
            {LIFECYCLE_PHASE_LABELS[phase.id]}
          </h5>
          <p className="text-xs text-muted-foreground">
            ~{phase.typicalYears} year{phase.typicalYears !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      {isExpanded ? (
        <ChevronDown size={16} className="text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
      )}
    </button>

    {isExpanded && (
      <div className="px-4 pb-4 space-y-4 border-t border-border pt-4 animate-fade-in">
        <p className="text-xs text-muted-foreground">{phase.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Crypto Actions */}
          <div>
            <h6 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <ShieldCheck size={12} className="text-primary" />
              Crypto Actions
            </h6>
            <ul className="space-y-1.5">
              {phase.cryptoActions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {action}
                </li>
              ))}
            </ul>
          </div>

          {/* HSM Role */}
          <div>
            <h6 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <Server size={12} className="text-status-info" />
              HSM Role
            </h6>
            <ul className="space-y-1.5">
              {phase.hsmRole.map((role, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-info/60" />
                  {role}
                </li>
              ))}
            </ul>
          </div>

          {/* PQC Requirements */}
          <div>
            <h6 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
              <AlertTriangle size={12} className="text-status-warning" />
              PQC Requirements
            </h6>
            <ul className="space-y-1.5">
              {phase.pqcRequirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-status-warning/60" />
                  {req}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    )}
  </div>
)

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export const LifecycleMigrationRoadmap: React.FC = () => {
  const [modelYear, setModelYear] = useState(2027)
  const [roadLifeYears, setRoadLifeYears] = useState(18)
  const [selectedRegion, setSelectedRegion] = useState<RegulationRegion | 'all'>('eu')
  const [crqcArrivalYear, setCrqcArrivalYear] = useState(2035)
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set(['production']))

  const vulnerabilityResult = useMemo(
    () => computeVulnerabilityWindow(modelYear, roadLifeYears, crqcArrivalYear),
    [modelYear, roadLifeYears, crqcArrivalYear]
  )

  const filteredMilestones = useMemo(() => {
    const milestones =
      selectedRegion === 'all'
        ? AUTOMOTIVE_COMPLIANCE_MILESTONES
        : AUTOMOTIVE_COMPLIANCE_MILESTONES.filter((m) => m.region === selectedRegion)
    return [...milestones].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year
      return a.quarter.localeCompare(b.quarter)
    })
  }, [selectedRegion])

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev)
      if (next.has(phaseId)) {
        next.delete(phaseId)
      } else {
        next.add(phaseId)
      }
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Vehicle-Lifecycle PQC Migration Planner
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure a vehicle scenario to visualize its lifecycle against CRQC arrival estimates,
          identify vulnerability windows, and map regulatory milestones to HSM migration actions.
          This is the capstone view &mdash; it ties together HSM tier management, regulatory
          compliance deadlines, and cryptographically relevant quantum computer exposure.
        </p>
      </div>

      {/* Configuration Panel */}
      <ConfigPanel
        modelYear={modelYear}
        setModelYear={setModelYear}
        roadLifeYears={roadLifeYears}
        setRoadLifeYears={setRoadLifeYears}
        selectedRegion={selectedRegion}
        setSelectedRegion={setSelectedRegion}
        crqcArrivalYear={crqcArrivalYear}
        setCrqcArrivalYear={setCrqcArrivalYear}
      />

      {/* Timeline Visualization */}
      <TimelineVisualization
        result={vulnerabilityResult}
        modelYear={modelYear}
        roadLifeYears={roadLifeYears}
        crqcArrivalYear={crqcArrivalYear}
      />

      {/* Vulnerability Summary */}
      <VulnerabilitySummary
        result={vulnerabilityResult}
        modelYear={modelYear}
        crqcArrivalYear={crqcArrivalYear}
      />

      {/* Vulnerability context callout */}
      {vulnerabilityResult.isVulnerable && (
        <div className="bg-status-error/10 border border-status-error/30 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert size={20} className="text-status-error shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <strong>CRQC Exposure Warning:</strong> A {modelYear} model year vehicle with a{' '}
            {roadLifeYears}-year road life will still be in service for{' '}
            <span className="font-bold text-status-error">
              {vulnerabilityResult.vulnerableYears} years
            </span>{' '}
            after CRQC arrival in {crqcArrivalYear}. There are{' '}
            {vulnerabilityResult.otaUpgradeWindows} OTA upgrade windows available to push PQC
            firmware before CRQC arrives. Vehicles must be provisioned with crypto-agile HSMs and
            hybrid certificates to enable OTA migration.
          </div>
        </div>
      )}

      {/* Regulatory Milestones Timeline */}
      <RegulatoryTimeline milestones={filteredMilestones} />

      {/* HSM Tier Overview */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Server size={16} className="text-primary" />
          Automotive HSM Tiers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {AUTOMOTIVE_HSM_TIERS.map((tier) => (
            <HSMTierCard key={tier.id} tier={tier} />
          ))}
        </div>
      </div>

      {/* Lifecycle Phase Detail */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Calendar size={16} className="text-primary" />
          Lifecycle Phase Details
        </h4>
        <div className="space-y-2">
          {LIFECYCLE_PHASES.map((phase) => (
            <LifecyclePhaseDetail
              key={phase.id}
              phase={phase}
              isExpanded={expandedPhases.has(phase.id)}
              onToggle={() => togglePhase(phase.id)}
            />
          ))}
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> CRQC arrival estimates are speculative and based on current quantum
          computing progress. Industry consensus ranges from 2030 (aggressive) to 2045+
          (conservative). The vulnerability window calculation assumes no OTA crypto upgrade has
          been deployed. In practice, OEMs with crypto-agile architectures can push PQC firmware
          updates during any OTA window, reducing actual exposure. HSM tier details reflect current
          (2026) vendor capabilities and may evolve as PQC standards mature.
        </p>
      </div>
    </div>
  )
}
