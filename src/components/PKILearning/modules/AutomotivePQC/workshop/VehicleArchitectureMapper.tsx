// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo, useCallback } from 'react'
import {
  Car,
  Cpu,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Radio,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react'
import type { VehicleType, ArchitectureStyle, ECUZone } from '../data/automotiveConstants'
import {
  VEHICLE_TYPE_LABELS,
  ARCHITECTURE_LABELS,
  ZONE_COLORS,
  ZONE_LABELS,
  BUS_LABELS,
} from '../data/automotiveConstants'
import { ECU_ZONES, BUS_PROFILES, VEHICLE_TYPES } from '../data/vehicleArchitectureData'
import type { ECUZoneConfig } from '../data/vehicleArchitectureData'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Determine quantum risk level based on whether the zone uses asymmetric crypto */
function getQuantumRisk(zone: ECUZoneConfig): 'high' | 'medium' | 'low' {
  const vulnCount = zone.quantumVulnerablePoints.length
  if (vulnCount >= 3) return 'high'
  if (vulnCount >= 2) return 'medium'
  return 'low'
}

const RISK_STYLES: Record<string, { label: string; classes: string; icon: typeof ShieldAlert }> = {
  high: {
    label: 'High',
    classes: 'text-status-error bg-status-error/15',
    icon: ShieldAlert,
  },
  medium: {
    label: 'Medium',
    classes: 'text-status-warning bg-status-warning/15',
    icon: AlertTriangle,
  },
  low: {
    label: 'Low',
    classes: 'text-status-success bg-status-success/15',
    icon: ShieldCheck,
  },
}

const FEASIBILITY_STYLES: Record<string, string> = {
  good: 'text-status-success',
  challenging: 'text-status-warning',
  problematic: 'text-status-error',
}

// ---------------------------------------------------------------------------
// VehicleArchitectureMapper
// ---------------------------------------------------------------------------

export const VehicleArchitectureMapper: React.FC = () => {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('sedan')
  const [selectedArchitecture, setSelectedArchitecture] =
    useState<ArchitectureStyle>('domain-based')
  const [selectedZone, setSelectedZone] = useState<ECUZone | null>(null)

  const vehicleConfig = useMemo(
    () => VEHICLE_TYPES.find((v) => v.id === selectedVehicle)!,
    [selectedVehicle]
  )

  const selectedZoneConfig = useMemo(
    () => (selectedZone ? (ECU_ZONES.find((z) => z.id === selectedZone) ?? null) : null),
    [selectedZone]
  )

  const selectedBusProfile = useMemo(() => {
    if (!selectedZoneConfig) return null
    return BUS_PROFILES.find((b) => b.id === selectedZoneConfig.primaryBus) ?? null
  }, [selectedZoneConfig])

  // Summary stats
  const stats = useMemo(() => {
    const totalECUs = ECU_ZONES.reduce((sum, z) => sum + z.ecuCount[selectedVehicle], 0)
    const highRiskZones = ECU_ZONES.filter((z) => getQuantumRisk(z) === 'high').length
    const pqcFeasibleBusZones = ECU_ZONES.filter((z) => {
      const bus = BUS_PROFILES.find((b) => b.id === z.primaryBus)
      return bus?.pqcFeasibility === 'good'
    }).length
    return { totalECUs, highRiskZones, pqcFeasibleBusZones }
  }, [selectedVehicle])

  const handleZoneClick = useCallback((zoneId: ECUZone) => {
    setSelectedZone((prev) => (prev === zoneId ? null : zoneId))
  }, [])

  const handleVehicleChange = useCallback((vehicleId: VehicleType) => {
    setSelectedVehicle(vehicleId)
    setSelectedZone(null)
  }, [])

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Vehicle E/E Architecture Explorer
        </h3>
        <p className="text-sm text-muted-foreground">
          Select a vehicle type and architecture style, then click any ECU zone to explore its
          cryptographic requirements, quantum vulnerabilities, and PQC migration recommendations.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-3 text-center">
          <Cpu size={20} className="mx-auto text-primary mb-1" />
          <div className="text-2xl font-bold text-foreground">{stats.totalECUs}</div>
          <div className="text-xs text-muted-foreground">Total ECUs</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <ShieldAlert size={20} className="mx-auto text-status-error mb-1" />
          <div className="text-2xl font-bold text-foreground">{stats.highRiskZones}</div>
          <div className="text-xs text-muted-foreground">High Quantum Risk Zones</div>
        </div>
        <div className="glass-panel p-3 text-center">
          <ShieldCheck size={20} className="mx-auto text-status-success mb-1" />
          <div className="text-2xl font-bold text-foreground">{stats.pqcFeasibleBusZones}</div>
          <div className="text-xs text-muted-foreground">PQC-Feasible Bus Zones</div>
        </div>
      </div>

      {/* Vehicle Type Selector */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Car size={16} className="text-primary" />
          Vehicle Type
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VEHICLE_TYPES.map((vt) => (
            <button
              key={vt.id}
              onClick={() => handleVehicleChange(vt.id)}
              className={`p-3 rounded-lg border text-left transition-all ${
                selectedVehicle === vt.id
                  ? 'border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.2)]'
                  : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              <div className="text-sm font-semibold text-foreground">
                {VEHICLE_TYPE_LABELS[vt.id]}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{vt.totalECUs} ECUs</div>
              <div className="text-xs text-muted-foreground">{vt.autonomyLevel}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Architecture Style Toggle */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap size={16} className="text-primary" />
          Architecture Style
        </h4>
        <div className="flex gap-2">
          {(['domain-based', 'zonal'] as const).map((style) => (
            <button
              key={style}
              onClick={() => setSelectedArchitecture(style)}
              className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                selectedArchitecture === style
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="text-sm font-semibold text-foreground">
                {ARCHITECTURE_LABELS[style]}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {style === 'domain-based'
                  ? 'Traditional: each zone has its own domain controller. Simpler but more ECUs and wiring.'
                  : 'Modern: zonal gateways aggregate multiple domains. Fewer ECUs, centralized compute, Ethernet backbone.'}
              </p>
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selectedArchitecture === 'zonal'
            ? 'Zonal architectures favor Automotive Ethernet, making PQC adoption easier due to larger payloads and TLS/MACsec support.'
            : 'Domain-based architectures rely heavily on CAN/CAN FD buses, where PQC signature sizes are a significant constraint.'}
        </p>
      </div>

      {/* Zone Grid */}
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">
          ECU Zones &mdash; {VEHICLE_TYPE_LABELS[selectedVehicle]}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ECU_ZONES.map((zone) => {
            const risk = getQuantumRisk(zone)
            const riskStyle = RISK_STYLES[risk]
            const RiskIcon = riskStyle.icon
            const isSelected = selectedZone === zone.id
            const ecuCount = zone.ecuCount[selectedVehicle]

            return (
              <button
                key={zone.id}
                onClick={() => handleZoneClick(zone.id)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'ring-2 ring-primary border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                {/* Zone name with color accent */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded border ${ZONE_COLORS[zone.id]}`}
                  >
                    {ZONE_LABELS[zone.id]}
                  </span>
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${isSelected ? 'rotate-90 text-primary' : 'text-muted-foreground'}`}
                  />
                </div>

                {/* ECU count */}
                <div className="flex items-center gap-1 text-sm text-foreground mb-1">
                  <Cpu size={12} className="text-muted-foreground" />
                  <span className="font-medium">{ecuCount} ECUs</span>
                </div>

                {/* Primary bus */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Radio size={10} />
                  {BUS_LABELS[zone.primaryBus]}
                </div>

                {/* Quantum risk badge */}
                <div
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${riskStyle.classes}`}
                >
                  <RiskIcon size={10} />
                  {riskStyle.label} Risk
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Zone Detail Panel */}
      {selectedZoneConfig && (
        <div className="glass-panel p-5 space-y-5 animate-fade-in">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${ZONE_COLORS[selectedZoneConfig.id]}`}
                >
                  {ZONE_LABELS[selectedZoneConfig.id]}
                </span>
                {selectedZoneConfig.name}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">{selectedZoneConfig.description}</p>
            </div>
            <button
              onClick={() => setSelectedZone(null)}
              className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
              aria-label="Close zone detail"
            >
              <X size={18} className="text-muted-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Current Crypto Stack */}
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-2">Current Crypto Stack</h5>
              <ul className="space-y-1.5">
                {selectedZoneConfig.currentCrypto.map((crypto, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-primary/60" />
                    {crypto}
                  </li>
                ))}
              </ul>
            </div>

            {/* Quantum-Vulnerable Points */}
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                <AlertTriangle size={14} className="text-status-warning" />
                Quantum-Vulnerable Points
              </h5>
              <ul className="space-y-1.5">
                {selectedZoneConfig.quantumVulnerablePoints.map((vuln, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-status-warning">
                    <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                    {vuln}
                  </li>
                ))}
              </ul>
            </div>

            {/* PQC Recommendation */}
            <div className="md:col-span-2">
              <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                <ShieldCheck size={14} className="text-status-success" />
                PQC Recommendation
              </h5>
              <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                  <div className="text-xs">
                    <span className="text-muted-foreground font-medium">KEM:</span>{' '}
                    <span className="font-mono text-foreground">
                      {selectedZoneConfig.pqcRecommendation.kem}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground font-medium">Signature:</span>{' '}
                    <span className="font-mono text-foreground">
                      {selectedZoneConfig.pqcRecommendation.signature}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedZoneConfig.pqcRecommendation.rationale}
                </p>
              </div>
            </div>

            {/* Timing & Bandwidth */}
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                <Clock size={14} className="text-primary" />
                Performance Budget
              </h5>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Latency Budget</span>
                  <span className="font-mono text-foreground">
                    {selectedZoneConfig.latencyBudgetMs} ms
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Bandwidth</span>
                  <span className="font-mono text-foreground">
                    {selectedZoneConfig.bandwidthKbps >= 1000
                      ? `${(selectedZoneConfig.bandwidthKbps / 1000).toLocaleString()} Mbps`
                      : `${selectedZoneConfig.bandwidthKbps} kbps`}
                  </span>
                </div>
              </div>
            </div>

            {/* Bus Protocol Details */}
            {selectedBusProfile && (
              <div>
                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1">
                  <Radio size={14} className="text-primary" />
                  Primary Bus: {selectedBusProfile.name}
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Bandwidth</span>
                    <span className="font-mono text-foreground">
                      {selectedBusProfile.maxBandwidthMbps} Mbps
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Payload</span>
                    <span className="font-mono text-foreground">
                      {selectedBusProfile.maxPayloadBytes} bytes
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">PQC Feasibility</span>
                    <span
                      className={`font-semibold capitalize ${FEASIBILITY_STYLES[selectedBusProfile.pqcFeasibility]}`}
                    >
                      {selectedBusProfile.pqcFeasibility}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Authentication:</span>{' '}
                    <span className="text-foreground">
                      {selectedBusProfile.authenticationSupport}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 border-t border-border pt-2">
                    {selectedBusProfile.notes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Secondary bus note */}
          {selectedZoneConfig.secondaryBus && (
            <div className="text-xs text-muted-foreground border-t border-border pt-3">
              <span className="font-medium text-foreground">Secondary Bus:</span>{' '}
              {BUS_LABELS[selectedZoneConfig.secondaryBus]}
              {(() => {
                const secBus = BUS_PROFILES.find((b) => b.id === selectedZoneConfig.secondaryBus)
                return secBus
                  ? ` (${secBus.maxPayloadBytes} bytes payload, PQC feasibility: ${secBus.pqcFeasibility})`
                  : ''
              })()}
            </div>
          )}
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> ECU counts and bus configurations represent typical production
          architectures. Real vehicles vary by OEM and model year. PQC recommendations are based on
          algorithm performance characteristics and bus payload constraints. Vehicles produced today
          have a {vehicleConfig.typicalLifeYears}-year road life, meaning cryptographic choices must
          remain secure well into the 2040s.
        </p>
      </div>
    </div>
  )
}
