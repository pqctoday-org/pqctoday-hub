// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import { Plane, Plus, X, AlertTriangle } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { AIRCRAFT_TYPES, getInteropStatus, INTEROP_COLORS, INTEROP_LABELS } from '../data/fleetData'
import { GENERATION_COLORS } from '../data/aerospaceConstants'

const aircraftItems = AIRCRAFT_TYPES.map((a) => ({ id: a.id, label: a.name }))

export const FleetInteroperabilityMatrix: React.FC = () => {
  const [selectedFleet, setSelectedFleet] = useState<string[]>(['b737-800', 'a320neo', 'a350'])
  const [addAircraft, setAddAircraft] = useState<string | null>(null)
  const [pqcPenetration, setPqcPenetration] = useState(30)

  const fleetAircraft = useMemo(
    () => selectedFleet.map((id) => AIRCRAFT_TYPES.find((a) => a.id === id)!).filter(Boolean),
    [selectedFleet]
  )

  const availableAircraft = useMemo(
    () => aircraftItems.filter((a) => !selectedFleet.includes(a.id)),
    [selectedFleet]
  )

  const handleAddAircraft = (id: string) => {
    if (!selectedFleet.includes(id)) {
      setSelectedFleet((prev) => [...prev, id])
    }
    setAddAircraft(null)
  }

  const handleRemoveAircraft = (id: string) => {
    setSelectedFleet((prev) => prev.filter((a) => a !== id))
  }

  // Calculate fleet-wide crypto stats
  const fleetStats = useMemo(() => {
    let totalAircraft = 0
    let pqcCapable = 0
    let retrofitCapable = 0
    let gatewayOnly = 0

    for (const ac of fleetAircraft) {
      totalAircraft += ac.fleetSizeEstimate
      if (ac.pqcUpgradeFeasibility === 'native') pqcCapable += ac.fleetSizeEstimate
      else if (ac.pqcUpgradeFeasibility === 'retrofit') retrofitCapable += ac.fleetSizeEstimate
      else gatewayOnly += ac.fleetSizeEstimate
    }

    const pqcPct = totalAircraft > 0 ? Math.round((pqcCapable / totalAircraft) * 100) : 0
    const retrofitPct = totalAircraft > 0 ? Math.round((retrofitCapable / totalAircraft) * 100) : 0
    const gatewayPct = totalAircraft > 0 ? Math.round((gatewayOnly / totalAircraft) * 100) : 0

    // At the given penetration %, how many links are PQC-protected?
    // Simple model: pqcPenetration% of capable aircraft have PQC deployed
    const deployedPqcAircraft = Math.round(((pqcCapable + retrofitCapable) * pqcPenetration) / 100)
    const protectedLinksPct =
      totalAircraft > 0 ? Math.round((deployedPqcAircraft / totalAircraft) * 100) : 0
    const unprotectedPct = 100 - protectedLinksPct

    return {
      totalAircraft,
      pqcCapable,
      retrofitCapable,
      gatewayOnly,
      pqcPct,
      retrofitPct,
      gatewayPct,
      protectedLinksPct,
      unprotectedPct,
    }
  }, [fleetAircraft, pqcPenetration])

  return (
    <div className="space-y-6">
      {/* Fleet Selector */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Plane size={16} className="text-primary" /> Fleet Composition
        </h3>

        <div className="flex flex-wrap gap-2">
          {fleetAircraft.map((ac) => (
            <div
              key={ac.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${GENERATION_COLORS[ac.generation]}`}
            >
              {ac.name}
              <button
                onClick={() => handleRemoveAircraft(ac.id)}
                className="hover:text-foreground transition-colors"
                aria-label={`Remove ${ac.name}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {availableAircraft.length > 0 && (
            <div className="flex items-center gap-2">
              {addAircraft !== null ? (
                <FilterDropdown
                  items={availableAircraft}
                  selectedId=""
                  onSelect={handleAddAircraft}
                  label="Add aircraft"
                />
              ) : (
                <button
                  onClick={() => setAddAircraft('')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Interoperability Matrix */}
      {fleetAircraft.length >= 2 && (
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">Crypto Interoperability Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium" />
                  {fleetAircraft.map((ac) => (
                    <th
                      key={ac.id}
                      className="text-center py-2 px-3 text-muted-foreground font-medium"
                    >
                      {ac.name.split(' ').pop()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fleetAircraft.map((rowAc) => (
                  <tr key={rowAc.id} className="border-b border-border/50">
                    <td className="py-2 px-3 font-medium text-foreground">{rowAc.name}</td>
                    {fleetAircraft.map((colAc) => {
                      if (rowAc.id === colAc.id) {
                        return (
                          <td
                            key={colAc.id}
                            className="text-center py-2 px-3 text-muted-foreground"
                          >
                            &mdash;
                          </td>
                        )
                      }
                      const status = getInteropStatus(rowAc, colAc)
                      return (
                        <td key={colAc.id} className="text-center py-2 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${INTEROP_COLORS[status]}`}
                          >
                            {INTEROP_LABELS[status]}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-success/30" /> Both PQC-capable
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-warning/30" /> Gateway required
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-status-error/30" /> Legacy (unprotected)
            </span>
          </div>
        </div>
      )}

      {/* PQC Penetration Slider */}
      <div className="glass-panel p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Fleet PQC Deployment Scenario</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">PQC deployment (% of capable fleet):</span>
            <span className="font-bold text-foreground">{pqcPenetration}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={pqcPenetration}
            onChange={(e) => setPqcPenetration(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-foreground">
              {fleetStats.totalAircraft.toLocaleString()}
            </div>
            <div className="text-muted-foreground">Total Fleet</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-status-success">
              {fleetStats.protectedLinksPct}%
            </div>
            <div className="text-muted-foreground">PQC-Protected Links</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-status-error">{fleetStats.unprotectedPct}%</div>
            <div className="text-muted-foreground">Unprotected Links</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-status-warning">{fleetStats.gatewayPct}%</div>
            <div className="text-muted-foreground">Gateway-Only</div>
          </div>
        </div>

        {fleetStats.unprotectedPct > 50 && (
          <div className="flex items-start gap-2 text-xs text-status-warning">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            Over half of fleet data links remain quantum-vulnerable. Ground-side PQC gateways at ATC
            centers and airline ops centers are essential to protect legacy aircraft communication.
          </div>
        )}
      </div>

      {/* Aircraft Detail Cards */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">Aircraft Crypto Profiles</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fleetAircraft.map((ac) => (
            <div key={ac.id} className="bg-muted/50 rounded-lg p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">{ac.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${GENERATION_COLORS[ac.generation]}`}
                >
                  {ac.generation}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <div>
                  Bus: <span className="text-foreground">{ac.avionicsBus}</span>
                </div>
                <div>
                  Fleet:{' '}
                  <span className="text-foreground">{ac.fleetSizeEstimate.toLocaleString()}</span>
                </div>
                <div>
                  Delivered: <span className="text-foreground">{ac.firstDeliveryYear}</span>
                </div>
                <div>
                  Retirement: <span className="text-foreground">{ac.expectedRetirementYear}</span>
                </div>
              </div>
              <div className="text-muted-foreground">{ac.notes}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
