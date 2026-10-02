// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Factory, MapPin, Zap, Shield, ArrowRight, Timer } from 'lucide-react'
import { CompleteStepAction } from '../../../common/CompleteStepAction'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  planSubstation,
  tripTimeClass,
  SUBSTATION_TYPE_LABELS,
  type SubstationProfile,
  type SubstationType,
  type Connectivity,
  type IEC62351Level,
  type NERCCIPImpact,
} from '../data/substationData'

interface SubstationMigrationPlannerProps {
  profile: SubstationProfile
  onProfileChange: (p: SubstationProfile) => void
  onComplete: () => void
}

const CONNECTIVITY_OPTIONS: { value: Connectivity; label: string }[] = [
  { value: 'fiber', label: 'Utility-owned fibre' },
  { value: 'cellular', label: 'Cellular (carrier network)' },
  { value: 'serial', label: 'Serial (RS-232/485)' },
  { value: 'air-gapped', label: 'Air-gapped' },
]

const IEC62351_OPTIONS: { value: IEC62351Level; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'part3', label: 'Part 3 (TLS for MMS)' },
  { value: 'part3-6', label: 'Parts 3 + 6 (TLS + GOOSE/SV MAC)' },
  { value: 'full', label: 'Parts 3, 4, 6, 8, 9' },
]

const NERC_CIP_OPTIONS: { value: NERCCIPImpact; label: string }[] = [
  { value: 'high', label: 'High impact' },
  { value: 'medium', label: 'Medium impact' },
  { value: 'low', label: 'Low impact' },
  { value: 'not-applicable', label: 'Not a BES asset / outside NERC' },
]

const COMPLEXITY_COLORS: Record<string, string> = {
  low: 'text-status-success bg-status-success/10',
  medium: 'text-status-warning bg-status-warning/10',
  high: 'text-status-error bg-status-error/10',
}

function priorityColor(score: number): string {
  if (score >= 70) return 'text-status-error'
  if (score >= 40) return 'text-status-warning'
  return 'text-status-info'
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (n: number) => void
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground block mb-1">
        {label}: {value}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        className="w-full accent-primary"
      />
      <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </label>
  )
}

export const SubstationMigrationPlanner: React.FC<SubstationMigrationPlannerProps> = ({
  profile,
  onProfileChange,
  onComplete,
}) => {
  const update = (patch: Partial<SubstationProfile>) => onProfileChange({ ...profile, ...patch })

  const results = useMemo(() => planSubstation(profile), [profile])
  const totalEffort = results.reduce((s, r) => s + r.effort, 0)
  const truckRolls = results.filter((r) => r.zone.requiresTruckRoll).length
  const trip = tripTimeClass(profile.type)
  const maxPriority = Math.max(...results.map((r) => r.priority), 1)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        The energy worked example. Each substation zone is scored by its real quantum exposure —
        forged commands, firmware or identities count most, recorded traffic next — weighted by the
        site&rsquo;s NERC CIP impact rating. Migration complexity changes the effort, not the
        priority. Model estimate.
      </p>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Factory size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Substation profile</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Substation type
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.type}
              onSelect={(id) => update({ type: id as SubstationType })}
              items={(Object.keys(SUBSTATION_TYPE_LABELS) as SubstationType[]).map((t) => ({
                id: t,
                // eslint-disable-next-line security/detect-object-injection
                label: SUBSTATION_TYPE_LABELS[t],
              }))}
            />
          </div>
          <Slider
            label="IED count"
            value={profile.iedCount}
            min={10}
            max={200}
            step={5}
            onChange={(n) => update({ iedCount: n })}
          />
          <Slider
            label="GOOSE/SV groups (KDC policies)"
            value={profile.gooseGroups}
            min={1}
            max={50}
            step={1}
            onChange={(n) => update({ gooseGroups: n })}
          />
          <Slider
            label="MMS client connections"
            value={profile.mmsConnections}
            min={1}
            max={100}
            step={1}
            onChange={(n) => update({ mmsConnections: n })}
          />
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              WAN connectivity
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.connectivity}
              onSelect={(id) => update({ connectivity: id as Connectivity })}
              items={CONNECTIVITY_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              IEC 62351 deployed
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.iec62351Level}
              onSelect={(id) => update({ iec62351Level: id as IEC62351Level })}
              items={IEC62351_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              NERC CIP impact rating (CIP-002)
            </span>
            <FilterDropdown
              noContainer
              selectedId={profile.nercCipImpact}
              onSelect={(id) => update({ nercCipImpact: id as NERCCIPImpact })}
              items={NERC_CIP_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            />
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 bg-status-info/10 rounded-lg p-3 border border-status-info/20 text-xs">
          <Timer size={14} className="text-status-info shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            <strong className="text-foreground">
              Trip-message budget: {trip.budgetMs} ms ({trip.perfClass}, IEC 61850-5)
            </strong>{' '}
            — the GOOSE trip path keeps its symmetric MAC. No PQC operation goes inside this budget.
          </span>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Zone migration priority</h3>
        </div>
        <div className="space-y-3">
          {results.map(({ zone, priority, effort, noCryptoToday }, idx) => (
            <div
              key={zone.id}
              className={`rounded-lg p-4 border ${
                idx === 0 ? 'bg-status-error/5 border-status-error/20' : 'bg-muted/30 border-border'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold rounded px-1.5 py-0.5 bg-muted text-foreground">
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
                        Site visit
                      </span>
                    )}
                    {noCryptoToday && (
                      <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 border border-border">
                        No crypto at this IEC 62351 level — deploy it first
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{zone.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                    <span className="text-muted-foreground">{zone.currentCrypto}</span>
                    <ArrowRight size={12} className="text-primary shrink-0" />
                    <span className="text-primary font-medium">{zone.pqcTarget}</span>
                  </div>
                  {zone.nercCip.length > 0 && (
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {zone.nercCip.map((cip) => (
                        <span
                          key={cip}
                          className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-mono"
                        >
                          {cip}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
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
              <div className="mt-3 w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(priority / maxPriority) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Migration summary</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Zones</div>
            <div className="text-xl font-bold font-mono text-foreground">{results.length}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Total effort</div>
            <div className="text-xl font-bold font-mono text-foreground">{totalEffort}h</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">Zones needing a site visit</div>
            <div className="text-xl font-bold font-mono text-status-warning">{truckRolls}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-[10px] text-muted-foreground mb-1">First zone</div>
            <div className="text-sm font-bold text-foreground">{results[0]?.zone.name}</div>
          </div>
        </div>
        {(profile.connectivity === 'air-gapped' || profile.connectivity === 'serial') && (
          <div className="mt-3 flex items-start gap-2 bg-status-warning/10 rounded-lg p-3 border border-status-warning/20">
            <Shield size={14} className="text-status-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {profile.connectivity === 'air-gapped' ? 'Air-gapped' : 'Serial'} connectivity
              </span>{' '}
              adds {profile.connectivity === 'air-gapped' ? '50%' : '30%'} to every effort estimate
              (manual configuration, limited remote access) and lowers the WAN zones&rsquo; HNDL
              exposure.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <CompleteStepAction recordsArtifact={false} onClick={onComplete} />
      </div>
    </div>
  )
}
