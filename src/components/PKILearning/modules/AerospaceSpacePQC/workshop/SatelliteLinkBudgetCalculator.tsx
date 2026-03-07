// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Satellite, AlertTriangle, Clock, Zap } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  ORBIT_PROFILES,
  RAD_HARD_PROCESSORS,
  calculateKeyRefreshInterval,
  SOLAR_ACTIVITY_MULTIPLIER,
} from '../data/orbitData'
import type { SolarActivity } from '../data/aerospaceConstants'

const orbitItems = ORBIT_PROFILES.map((o) => ({ id: o.id, label: o.name }))
const bandItems = [
  { id: 's-band', label: 'S-Band (2-4 GHz)' },
  { id: 'x-band', label: 'X-Band (8-12 GHz)' },
  { id: 'ka-band', label: 'Ka-Band (26-40 GHz)' },
  { id: 'optical', label: 'Optical (laser)' },
]
const solarItems = [
  { id: 'minimum', label: 'Solar Minimum' },
  { id: 'moderate', label: 'Solar Moderate' },
  { id: 'maximum', label: 'Solar Maximum' },
]

const ML_KEM_768_CIPHERTEXT = 1088
const ML_KEM_768_PUBKEY = 1184
const X25519_PUBKEY = 32
const X25519_CIPHERTEXT = 32
const HANDSHAKE_ROUNDS = 3

export const SatelliteLinkBudgetCalculator: React.FC = () => {
  const [selectedOrbit, setSelectedOrbit] = useState('geo')
  const [selectedBand, setSelectedBand] = useState('ka-band')
  const [dataRateMbps, setDataRateMbps] = useState(10)
  const [solarActivity, setSolarActivity] = useState<SolarActivity>('minimum')

  const orbit = useMemo(() => ORBIT_PROFILES.find((o) => o.id === selectedOrbit)!, [selectedOrbit])

  // eslint-disable-next-line security/detect-object-injection
  const solarMultiplier = SOLAR_ACTIVITY_MULTIPLIER[solarActivity] ?? 1
  const effectiveSeuRate = orbit.seuRatePerBitDay * solarMultiplier

  const analysis = useMemo(() => {
    const rttMs = orbit.typicalRTTms
    const handshakeClassicalMs = HANDSHAKE_ROUNDS * rttMs
    const handshakePqcMs = HANDSHAKE_ROUNDS * rttMs

    const classicalHandshakeBytes = (X25519_PUBKEY + X25519_CIPHERTEXT) * HANDSHAKE_ROUNDS
    const pqcHandshakeBytes = (ML_KEM_768_PUBKEY + ML_KEM_768_CIPHERTEXT) * HANDSHAKE_ROUNDS

    const dataRateBps = dataRateMbps * 1_000_000
    const classicalOverheadPct = (classicalHandshakeBytes / (dataRateBps / 8)) * 100
    const pqcOverheadPct = (pqcHandshakeBytes / (dataRateBps / 8)) * 100
    const overheadRatio = pqcHandshakeBytes / classicalHandshakeBytes

    // Key refresh based on SEU rate
    const mlkemKeyBits = ML_KEM_768_PUBKEY * 8
    const refreshHours = calculateKeyRefreshInterval(effectiveSeuRate, mlkemKeyBits)

    // Handshakes per day
    const handshakesPerDay = Math.ceil(24 / refreshHours)
    const dailyPqcOverheadBytes = handshakesPerDay * pqcHandshakeBytes

    return {
      rttMs,
      handshakeClassicalMs,
      handshakePqcMs,
      classicalHandshakeBytes,
      pqcHandshakeBytes,
      classicalOverheadPct,
      pqcOverheadPct,
      overheadRatio,
      refreshHours,
      handshakesPerDay,
      dailyPqcOverheadBytes,
    }
  }, [orbit, dataRateMbps, effectiveSeuRate])

  // Find compatible processors
  const compatibleProcessors = useMemo(
    () => RAD_HARD_PROCESSORS.filter((p) => p.pqcCapability.mlkem768),
    []
  )

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label
            htmlFor="sat-orbit"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Orbit
          </label>
          <FilterDropdown
            items={orbitItems}
            selectedId={selectedOrbit}
            onSelect={setSelectedOrbit}
            label="Orbit"
          />
        </div>
        <div>
          <label
            htmlFor="sat-band"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Frequency Band
          </label>
          <FilterDropdown
            items={bandItems}
            selectedId={selectedBand}
            onSelect={setSelectedBand}
            label="Band"
          />
        </div>
        <div>
          <label
            htmlFor="sat-data-rate"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Data Rate (Mbps)
          </label>
          <input
            id="sat-data-rate"
            type="range"
            min={0.1}
            max={100}
            step={0.1}
            value={dataRateMbps}
            onChange={(e) => setDataRateMbps(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <span className="text-xs text-foreground font-bold">{dataRateMbps} Mbps</span>
        </div>
        <div>
          <label
            htmlFor="sat-solar"
            className="text-xs font-medium text-muted-foreground mb-1 block"
          >
            Solar Activity
          </label>
          <FilterDropdown
            items={solarItems}
            selectedId={solarActivity}
            onSelect={(id) => setSolarActivity(id as SolarActivity)}
            label="Solar"
          />
        </div>
      </div>

      {/* Orbit Info */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Satellite size={18} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">{orbit.name}</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Altitude:</span>{' '}
            <span className="font-bold text-foreground">
              {orbit.altitudeKm[0].toLocaleString()}
              {orbit.altitudeKm[0] !== orbit.altitudeKm[1] &&
                `–${orbit.altitudeKm[1].toLocaleString()}`}{' '}
              km
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">RTT:</span>{' '}
            <span className="font-bold text-foreground">{orbit.typicalRTTms} ms</span>
          </div>
          <div>
            <span className="text-muted-foreground">Lifetime:</span>{' '}
            <span className="font-bold text-foreground">{orbit.typicalLifetimeYears} years</span>
          </div>
          <div>
            <span className="text-muted-foreground">SEU Rate:</span>{' '}
            <span className="font-bold text-foreground">
              {effectiveSeuRate.toExponential(1)} /bit/day
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{orbit.radiationEnvironment}</p>
      </div>

      {/* Handshake Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock size={16} className="text-muted-foreground" />
            Handshake Latency ({HANDSHAKE_ROUNDS}-round)
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">X25519 (classical):</span>
              <span className="font-bold text-foreground">
                {(analysis.handshakeClassicalMs / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">ML-KEM-768 (PQC hybrid):</span>
              <span className="font-bold text-foreground">
                {(analysis.handshakePqcMs / 1000).toFixed(2)}s
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Handshake data overhead:</span>
              <span className="font-bold text-status-warning">
                {analysis.overheadRatio.toFixed(1)}x classical
              </span>
            </div>
          </div>
        </div>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Zap size={16} className="text-status-warning" />
            SEU-Adjusted Key Refresh
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Key refresh interval:</span>
              <span className="font-bold text-foreground">
                {analysis.refreshHours >= 24
                  ? `${(analysis.refreshHours / 24).toFixed(1)} days`
                  : `${analysis.refreshHours} hours`}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Handshakes/day:</span>
              <span className="font-bold text-foreground">{analysis.handshakesPerDay}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Daily PQC overhead:</span>
              <span className="font-bold text-foreground">
                {(analysis.dailyPqcOverheadBytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bandwidth Impact Visualization */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">
          Bandwidth Consumption: Handshake Overhead
        </h3>
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">X25519 (classical)</span>
              <span className="text-foreground">
                {analysis.classicalHandshakeBytes.toLocaleString()} B (
                {analysis.classicalOverheadPct < 0.001
                  ? '<0.001'
                  : analysis.classicalOverheadPct.toFixed(4)}
                %)
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-status-success/60 rounded-full"
                style={{
                  width: `${Math.max(1, Math.min(100, analysis.classicalOverheadPct * 1000))}%`,
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">ML-KEM-768 (PQC hybrid)</span>
              <span className="text-foreground">
                {analysis.pqcHandshakeBytes.toLocaleString()} B (
                {analysis.pqcOverheadPct < 0.001 ? '<0.001' : analysis.pqcOverheadPct.toFixed(4)}
                %)
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-status-warning/60 rounded-full"
                style={{
                  width: `${Math.max(1, Math.min(100, analysis.pqcOverheadPct * 1000))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Compatible Processors */}
      <div className="glass-panel p-4 space-y-3">
        <h3 className="text-sm font-bold text-foreground">
          Compatible Rad-Hard Processors for ML-KEM-768
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {compatibleProcessors.map((proc) => (
            <div key={proc.id} className="bg-muted/50 rounded-lg p-3 text-xs">
              <div className="font-bold text-foreground mb-1">{proc.name}</div>
              <div className="text-muted-foreground">
                {proc.manufacturer} &middot; {proc.architecture} &middot; {proc.clockMhz} MHz
                &middot; {proc.ramMB >= 1 ? `${proc.ramMB} MB` : `${proc.ramMB * 1024} KB`} RAM
                &middot; TID: {proc.tidKrad} krad
              </div>
            </div>
          ))}
          {compatibleProcessors.length === 0 && (
            <div className="flex items-center gap-2 text-xs text-status-error">
              <AlertTriangle size={14} />
              No rad-hard processors support ML-KEM-768 in this configuration.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
