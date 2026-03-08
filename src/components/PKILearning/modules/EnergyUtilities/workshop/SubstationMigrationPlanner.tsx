// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Factory, MapPin, Zap, Shield, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUBSTATION_ZONES, computeZonePriority, estimateZoneEffort } from '../data/energyConstants'
import type {
  SubstationProfile,
  SubstationType,
  Connectivity,
  IEC62351Level,
  NERCCIPImpact,
} from '../data/energyConstants'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface SubstationMigrationPlannerProps {
  profile: SubstationProfile
  onProfileChange: (p: SubstationProfile) => void
  onComplete: () => void
}

const SUBSTATION_TYPE_OPTIONS: { value: SubstationType; label: string }[] = [
  { value: 'transmission', label: 'Transmission (230kV+)' },
  { value: 'sub-transmission', label: 'Sub-transmission (69-230kV)' },
  { value: 'distribution', label: 'Distribution (4-69kV)' },
  { value: 'generation', label: 'Generation' },
]

const CONNECTIVITY_OPTIONS: { value: Connectivity; label: string }[] = [
  { value: 'fiber', label: 'Fiber Optic' },
  { value: 'cellular', label: 'Cellular (4G/5G)' },
  { value: 'serial', label: 'Serial (RS-232/485)' },
  { value: 'air-gapped', label: 'Air-Gapped' },
]

const IEC62351_OPTIONS: { value: IEC62351Level; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'part3', label: 'Part 3 (TLS for MMS)' },
  { value: 'part3-6', label: 'Part 3+6 (TLS + GOOSE Auth)' },
  { value: 'full', label: 'Full (Part 3, 4, 5, 6)' },
]

const NERC_CIP_OPTIONS: { value: NERCCIPImpact; label: string }[] = [
  { value: 'high', label: 'High Impact' },
  { value: 'medium', label: 'Medium Impact' },
  { value: 'low', label: 'Low Impact' },
  { value: 'not-applicable', label: 'Not Applicable' },
]

const COMPLEXITY_COLORS: Record<string, string> = {
  low: 'text-status-success bg-status-success/10',
  medium: 'text-status-warning bg-status-warning/10',
  high: 'text-status-error bg-status-error/10',
}

function priorityColor(score: number): string {
  if (score >= 60) return 'text-status-error'
  if (score >= 35) return 'text-status-warning'
  return 'text-status-info'
}

function priorityBarColor(score: number): string {
  if (score >= 60) return 'bg-status-error'
  if (score >= 35) return 'bg-status-warning'
  return 'bg-primary'
}

const rangeClasses = 'w-full accent-primary'

export const SubstationMigrationPlanner: React.FC<SubstationMigrationPlannerProps> = ({
  profile,
  onProfileChange,
  onComplete,
}) => {
  const update = (patch: Partial<SubstationProfile>) => {
    onProfileChange({ ...profile, ...patch })
  }

  const zoneResults = useMemo(() => {
    return SUBSTATION_ZONES.map((zone) => ({
      zone,
      priority: computeZonePriority(zone, profile),
      effort: estimateZoneEffort(zone, profile),
    })).sort((a, b) => b.priority - a.priority)
  }, [profile])

  const totalEffort = useMemo(
    () => zoneResults.reduce((sum, r) => sum + r.effort, 0),
    [zoneResults]
  )
  const totalTruckRolls = useMemo(
    () => zoneResults.filter((r) => r.zone.requiresTruckRoll).length,
    [zoneResults]
  )
  const maxPriority = useMemo(
    () => Math.max(...zoneResults.map((r) => r.priority), 1),
    [zoneResults]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configure a substation profile to generate a zone-based PQC migration plan. The planner
        scores each zone by NERC CIP impact, internet exposure, current crypto posture, and
        migration complexity.
      </p>

      {/* Configuration Form */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Factory size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Substation Profile</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Substation Type */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Substation Type
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.type}
              onSelect={(id) => update({ type: id as SubstationType })}
              items={SUBSTATION_TYPE_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>

          {/* IED Count */}
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              IED Count: {profile.iedCount}
            </span>
            <input
              type="range"
              min={10}
              max={200}
              step={5}
              value={profile.iedCount}
              onChange={(e) => update({ iedCount: parseInt(e.target.value) })}
              className={rangeClasses}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>10</span>
              <span>200</span>
            </div>
          </label>

          {/* GOOSE Groups */}
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              GOOSE Groups: {profile.gooseGroups}
            </span>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={profile.gooseGroups}
              onChange={(e) => update({ gooseGroups: parseInt(e.target.value) })}
              className={rangeClasses}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>1</span>
              <span>50</span>
            </div>
          </label>

          {/* MMS Connections */}
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              MMS Connections: {profile.mmsConnections}
            </span>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={profile.mmsConnections}
              onChange={(e) => update({ mmsConnections: parseInt(e.target.value) })}
              className={rangeClasses}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>1</span>
              <span>100</span>
            </div>
          </label>

          {/* Connectivity */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Connectivity
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.connectivity}
              onSelect={(id) => update({ connectivity: id as Connectivity })}
              items={CONNECTIVITY_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>

          {/* IEC 62351 Level */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              IEC 62351 Level
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.iec62351Level}
              onSelect={(id) => update({ iec62351Level: id as IEC62351Level })}
              items={IEC62351_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>

          {/* NERC CIP Impact */}
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              NERC CIP Impact Rating
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.nercCipImpact}
              onSelect={(id) => update({ nercCipImpact: id as NERCCIPImpact })}
              items={NERC_CIP_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>
        </div>
      </div>

      {/* Zone Results */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Zone Migration Priority</h3>
        </div>

        <div className="space-y-3">
          {zoneResults.map(({ zone, priority, effort }, idx) => (
            <div
              key={zone.id}
              className={`rounded-lg p-4 border border-border ${
                idx === 0 ? 'bg-status-error/5 border-status-error/20' : 'bg-muted/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold rounded px-1.5 py-0.5 ${
                        idx === 0
                          ? 'bg-status-error/10 text-status-error'
                          : idx < 3
                            ? 'bg-status-warning/10 text-status-warning'
                            : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-bold text-foreground">{zone.name}</span>
                    <span
                      className={`text-[10px] rounded px-1.5 py-0.5 ${COMPLEXITY_COLORS[zone.migrationComplexity]}`}
                    >
                      {zone.migrationComplexity} complexity
                    </span>
                    {zone.requiresTruckRoll && (
                      <span className="text-[10px] bg-status-warning/10 text-status-warning rounded px-1.5 py-0.5">
                        Truck roll required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>

                  {/* Protocols */}
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {zone.protocols.map((proto) => (
                      <span
                        key={proto}
                        className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5"
                      >
                        {proto}
                      </span>
                    ))}
                  </div>

                  {/* Crypto migration path */}
                  <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                    <span className="text-muted-foreground">{zone.currentCrypto}</span>
                    <ArrowRight size={12} className="text-primary shrink-0" />
                    <span className="text-primary font-medium">{zone.pqcTarget}</span>
                  </div>

                  {/* NERC CIP standards */}
                  <div className="flex items-center gap-1 mt-2 flex-wrap">
                    {zone.nercCipRelevance.map((cip) => (
                      <span
                        key={cip}
                        className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono"
                      >
                        {cip}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Right side: score + effort */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Priority</div>
                    <div className={`text-xl font-bold font-mono ${priorityColor(priority)}`}>
                      {priority}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground">Effort</div>
                    <div className="text-sm font-bold font-mono text-foreground">{effort}h</div>
                  </div>
                </div>
              </div>

              {/* Priority bar */}
              <div className="mt-3">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${priorityBarColor(priority)}`}
                    style={{ width: `${(priority / maxPriority) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Migration Summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Total Zones</div>
            <div className="text-xl font-bold font-mono text-foreground">{zoneResults.length}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Total Effort</div>
            <div className="text-xl font-bold font-mono text-foreground">{totalEffort}h</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Truck Rolls</div>
            <div className="text-xl font-bold font-mono text-status-warning">{totalTruckRolls}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Highest Priority</div>
            <div
              className={`text-xl font-bold font-mono ${priorityColor(zoneResults[0]?.priority ?? 0)}`}
            >
              {zoneResults[0]?.priority ?? 0}
            </div>
          </div>
        </div>

        {/* Connectivity overhead note */}
        {(profile.connectivity === 'air-gapped' || profile.connectivity === 'serial') && (
          <div className="mt-3 flex items-start gap-2 bg-status-warning/10 rounded-lg p-3 border border-status-warning/20">
            <Shield size={14} className="text-status-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {profile.connectivity === 'air-gapped' ? 'Air-gapped' : 'Serial'} connectivity
              </span>{' '}
              adds {profile.connectivity === 'air-gapped' ? '50%' : '30%'} overhead to effort
              estimates due to manual configuration requirements and limited remote access.
            </p>
          </div>
        )}
      </div>

      {/* Complete Button */}
      <div className="flex justify-end pt-2">
        <Button variant="gradient" onClick={onComplete}>
          <CheckCircle2 size={16} className="mr-2" />
          Mark Step Complete
        </Button>
      </div>
    </div>
  )
}
