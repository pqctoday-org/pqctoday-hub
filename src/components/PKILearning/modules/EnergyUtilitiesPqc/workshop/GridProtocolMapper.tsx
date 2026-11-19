// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Radio, ShieldAlert, CheckCircle2, AlertTriangle, Info, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GRID_ARCHITECTURE_ZONES, type GridDomainId } from '../data/energyGridData'

type HndlFilter = 'all' | 'high' | 'medium'

const HNDL_BADGE_CLASSES: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-status-error/15 text-status-error border-status-error/40',
  medium: 'bg-status-warning/15 text-status-warning border-status-warning/40',
  low: 'bg-status-success/15 text-status-success border-status-success/40',
}

export const GridProtocolMapper: React.FC = () => {
  const [hndlFilter, setHndlFilter] = useState<HndlFilter>('all')
  const [selectedZoneId, setSelectedZoneId] = useState<GridDomainId>('substation')
  const [inScopeIds, setInScopeIds] = useState<GridDomainId[]>([
    'substation',
    'scada-center',
    'ami-mesh',
    'der-edge',
  ])

  const filteredZones = GRID_ARCHITECTURE_ZONES.filter(
    (z) => hndlFilter === 'all' || z.hndlRisk === hndlFilter
  )

  const activeZone =
    GRID_ARCHITECTURE_ZONES.find((z) => z.id === selectedZoneId) ?? GRID_ARCHITECTURE_ZONES[0]

  const toggleInScope = (id: GridDomainId) => {
    setInScopeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const inScopeZones = GRID_ARCHITECTURE_ZONES.filter((z) => inScopeIds.includes(z.id))
  const highHndlCount = inScopeZones.filter((z) => z.hndlRisk === 'high').length

  return (
    <div className="space-y-6">
      {/* Educational Scope Disclaimer */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
        <Info size={15} className="text-primary shrink-0 mt-0.5" />
        <span>
          <strong>Educational Sample Mapper:</strong> Explore a fictional utility estate across
          generation/transmission substations, SCADA control centers, AMI meshes, and DER edge
          gateways. Separate each <strong>operational grid service</strong> from its{' '}
          <strong>protected asset</strong>, and reconcile against passive OT discovery in
          production.
        </span>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">In-Scope Utility Zones</p>
          <p className="text-2xl font-bold text-foreground mt-1">{inScopeZones.length} / 4</p>
          <p className="text-xs text-muted-foreground mt-1">
            Toggle zones below to model your utility footprint
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">High HNDL Exposure Zones</p>
          <p className="text-2xl font-bold text-status-error mt-1">{highHndlCount}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Long-lived topology &amp; metering backhaul priorities
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground">Critical Integrity Zones</p>
          <p className="text-2xl font-bold text-primary mt-1">{inScopeZones.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Protection, telecontrol &amp; firmware authenticity
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Filter utility zones by HNDL risk"
          className="flex flex-wrap items-center gap-2"
        >
          {(
            [
              { id: 'all', label: 'All Zones' },
              { id: 'high', label: 'High HNDL Risk' },
              { id: 'medium', label: 'Medium HNDL Risk' },
            ] as const
          ).map((opt) => (
            <Button
              key={opt.id}
              variant={hndlFilter === opt.id ? 'gradient' : 'outline'}
              size="sm"
              aria-pressed={hndlFilter === opt.id}
              onClick={() => setHndlFilter(opt.id)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          Showing {filteredZones.length} of {GRID_ARCHITECTURE_ZONES.length} utility zones
        </span>
      </div>

      {/* Zone Cards + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-3">
          {filteredZones.map((zone) => {
            const isSelected = activeZone.id === zone.id
            const isInScope = inScopeIds.includes(zone.id)
            return (
              <div
                key={zone.id}
                className={`rounded-xl border p-4 transition-colors space-y-2 ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card/60 hover:border-primary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedZoneId(zone.id)}
                    aria-pressed={isSelected}
                    className="h-auto p-0 text-left flex-1 min-w-0 justify-start flex-col items-start hover:bg-transparent"
                  >
                    <span className="text-sm font-bold text-foreground block">{zone.zoneName}</span>
                    <span className="text-xs text-muted-foreground font-normal block mt-0.5">
                      {zone.latencyBudget}
                    </span>
                  </Button>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded border shrink-0 ${HNDL_BADGE_CLASSES[zone.hndlRisk]}`}
                  >
                    HNDL: {zone.hndlRisk}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {zone.protocols.slice(0, 3).map((proto) => (
                    <span
                      key={proto}
                      className="text-[11px] px-2 py-0.5 rounded bg-muted text-muted-foreground"
                    >
                      {proto}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedZoneId(zone.id)}
                    className="h-auto p-0 text-xs font-medium text-primary hover:bg-transparent hover:underline"
                  >
                    Inspect migration pattern
                  </Button>
                  <Button
                    variant={isInScope ? 'outline' : 'ghost'}
                    size="sm"
                    aria-pressed={isInScope}
                    aria-label={`${isInScope ? 'Remove' : 'Include'} ${zone.zoneName} in estate scope`}
                    onClick={() => toggleInScope(zone.id)}
                    className="h-7 px-2.5 text-xs"
                  >
                    {isInScope ? 'In Scope' : 'Excluded'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Active Zone Inspector */}
        <article className="lg:col-span-7 glass-panel p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Radio size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">{activeZone.zoneName}</h3>
                <p className="text-xs text-muted-foreground">{activeZone.mtuOrFrameLimit}</p>
              </div>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded border ${HNDL_BADGE_CLASSES[activeZone.hndlRisk]}`}
            >
              HNDL Exposure: {activeZone.hndlRisk.toUpperCase()}
            </span>
          </div>

          {/* Operational Service vs Protected Asset */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Layers size={14} className="text-primary shrink-0" />
              <span>Operational Service vs. Protected Asset</span>
            </div>
            <p className="text-foreground/90">
              <strong>Operational Service:</strong> {activeZone.operationalService}
            </p>
            <p className="text-foreground/90">
              <strong>Protected Asset:</strong> {activeZone.protectedAsset}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="font-semibold text-foreground">Cryptographic Role</p>
              <p className="text-muted-foreground leading-relaxed">{activeZone.cryptoRole}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <p className="font-semibold text-foreground">Latency &amp; Frame Constraint</p>
              <p className="text-muted-foreground leading-relaxed">
                {activeZone.latencyBudget}. {activeZone.mtuOrFrameLimit}.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-status-success/40 bg-status-success/10 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <CheckCircle2 size={14} className="text-status-success shrink-0" />
              <span>Recommended PQC Migration Pattern</span>
            </div>
            <p className="text-foreground/90 leading-relaxed">{activeZone.pqcMigrationPattern}</p>
          </div>

          <div className="rounded-lg border border-status-error/40 bg-status-error/10 p-3.5 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <AlertTriangle size={14} className="text-status-error shrink-0" />
              <span>Engineering Anti-Pattern (What Not to Do)</span>
            </div>
            <p className="text-foreground/90 leading-relaxed">{activeZone.whatNotToDo}</p>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <ShieldAlert size={14} className="text-primary shrink-0" />
              <span>Production Verification Evidence</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {activeZone.productionVerification}
            </p>
          </div>
        </article>
      </div>
    </div>
  )
}
