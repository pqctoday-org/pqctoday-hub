// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { CheckCircle, XCircle, Activity, Gauge, Radio } from 'lucide-react'
import type { SensorType } from '../data/automotiveConstants'
import {
  SENSOR_PROFILES,
  ALGORITHM_THROUGHPUT,
  computeSigningCapacity,
} from '../data/sensorFusionData'
import type { SensorProfile } from '../data/sensorFusionData'
import { Button } from '@/components/ui/button'

// ── Helpers ──────────────────────────────────────────────────────────────

function utilizationColor(pct: number): string {
  if (pct < 50) return 'text-status-success'
  if (pct <= 80) return 'text-status-warning'
  return 'text-status-error'
}

function utilizationBgColor(pct: number): string {
  if (pct < 50) return 'bg-status-success'
  if (pct <= 80) return 'bg-status-warning'
  return 'bg-status-error'
}

function formatDataRate(mbps: number): string {
  if (mbps >= 1) return `${mbps} MB/s`
  return `${(mbps * 1000).toFixed(0)} KB/s`
}

/** Signature bandwidth overhead as % of raw sensor data rate */
function signatureOverheadPercent(sensor: SensorProfile, signatureBytes: number): number {
  const sigBytesPerSecond = signatureBytes * sensor.messageFrequencyHz
  const dataRateBytesPerSecond = sensor.dataRateMBps * 1_000_000
  if (dataRateBytesPerSecond === 0) return 0
  return (sigBytesPerSecond / dataRateBytesPerSecond) * 100
}

// ── Default enabled sensors ──────────────────────────────────────────────

const DEFAULT_ENABLED: SensorType[] = ['lidar', 'camera', 'v2x']

// ── Component ────────────────────────────────────────────────────────────

export const SensorDataIntegritySimulator: React.FC = () => {
  const [enabledSensors, setEnabledSensors] = useState<Set<SensorType>>(
    () => new Set(DEFAULT_ENABLED)
  )
  const [selectedSensorId, setSelectedSensorId] = useState<SensorType>('lidar')

  const toggleSensor = (id: SensorType) => {
    setEnabledSensors((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const enabledProfiles = useMemo(
    () => SENSOR_PROFILES.filter((s) => enabledSensors.has(s.id)),
    [enabledSensors]
  )

  const selectedSensor = useMemo(
    () => SENSOR_PROFILES.find((s) => s.id === selectedSensorId) ?? SENSOR_PROFILES[0],
    [selectedSensorId]
  )

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Compare PQC signing throughput against real automotive sensor data rates and latency
        budgets. Toggle sensors to see which algorithms can keep up with each sensor&apos;s message
        frequency.
      </p>

      {/* ── Sensor Toggle Panel ──────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Radio size={14} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Sensor Selection</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {SENSOR_PROFILES.map((sensor) => {
            const isEnabled = enabledSensors.has(sensor.id)
            return (
              <Button
                variant="ghost"
                key={sensor.id}
                onClick={() => toggleSensor(sensor.id)}
                className={`flex items-center gap-3 rounded-lg p-3 border text-left transition-colors ${
                  isEnabled
                    ? 'border-primary/50 bg-primary/10'
                    : 'border-border bg-muted/20 opacity-60'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    isEnabled ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}
                >
                  {isEnabled && <CheckCircle size={10} className="text-primary-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground truncate">{sensor.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatDataRate(sensor.dataRateMBps)} &middot; {sensor.messageFrequencyHz} Hz
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </div>

      {/* ── Algorithm Comparison Table ────────────────────────────────── */}
      {enabledProfiles.length > 0 && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-primary" />
            <span className="text-sm font-bold text-foreground">
              Algorithm Throughput Comparison
            </span>
          </div>

          <div className="space-y-5">
            {enabledProfiles.map((sensor) => (
              <div key={sensor.id}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-foreground">{sensor.name}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {sensor.messageFrequencyHz} msg/s required
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                          Algorithm
                        </th>
                        <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                          Sign (ms)
                        </th>
                        <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                          Verify (ms)
                        </th>
                        <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                          Sig Size
                        </th>
                        <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                          Capacity
                        </th>
                        <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                          Keeps Up
                        </th>
                        <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                          Utilization
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ALGORITHM_THROUGHPUT.map((alg) => {
                        const cap = computeSigningCapacity(alg, sensor.messageFrequencyHz)
                        const maxMps = 1000 / cap.msPerMessage
                        return (
                          <tr
                            key={alg.algorithm}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="p-2 text-xs font-medium text-foreground font-mono">
                              {alg.algorithm}
                            </td>
                            <td className="p-2 text-xs text-right font-mono text-muted-foreground">
                              {alg.signingTimeMs.toFixed(2)}
                            </td>
                            <td className="p-2 text-xs text-right font-mono text-muted-foreground">
                              {alg.verificationTimeMs.toFixed(2)}
                            </td>
                            <td className="p-2 text-xs text-right font-mono text-muted-foreground">
                              {alg.signatureBytes.toLocaleString()} B
                            </td>
                            <td className="p-2 text-xs text-right font-mono text-muted-foreground">
                              {maxMps >= 1000
                                ? `${(maxMps / 1000).toFixed(1)}K`
                                : maxMps.toFixed(0)}{' '}
                              msg/s
                            </td>
                            <td className="p-2 text-center">
                              {cap.canKeepUp ? (
                                <CheckCircle size={14} className="text-status-success mx-auto" />
                              ) : (
                                <XCircle size={14} className="text-status-error mx-auto" />
                              )}
                            </td>
                            <td className="p-2 text-right">
                              <span
                                className={`text-xs font-bold font-mono ${utilizationColor(cap.utilization)}`}
                              >
                                {cap.utilization.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Latency Budget Visualization ──────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gauge size={14} className="text-primary" />
          <span className="text-sm font-bold text-foreground">Latency Budget Analysis</span>
        </div>

        {/* Sensor selector for latency view */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {SENSOR_PROFILES.map((sensor) => (
            <Button
              variant="ghost"
              key={sensor.id}
              onClick={() => setSelectedSensorId(sensor.id)}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                selectedSensorId === sensor.id
                  ? 'border-primary bg-primary/10 text-primary font-bold'
                  : 'border-border bg-muted/20 text-muted-foreground hover:text-foreground'
              }`}
            >
              {sensor.name}
            </Button>
          ))}
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Budget:{' '}
            <span className="font-mono font-bold text-foreground">
              {selectedSensor.latencyBudgetMs} ms
            </span>
          </span>
          <span className="text-[10px] text-muted-foreground">
            {selectedSensor.messageFrequencyHz} Hz &middot;{' '}
            {formatDataRate(selectedSensor.dataRateMBps)}
          </span>
        </div>

        <div className="space-y-2">
          {ALGORITHM_THROUGHPUT.map((alg) => {
            const totalMs = alg.signingTimeMs + alg.verificationTimeMs
            const pctOfBudget = (totalMs / selectedSensor.latencyBudgetMs) * 100
            const clampedPct = Math.min(pctOfBudget, 100)
            const fits = totalMs <= selectedSensor.latencyBudgetMs

            return (
              <div key={alg.algorithm}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-mono text-foreground">{alg.algorithm}</span>
                  <span
                    className={`text-[10px] font-bold ${fits ? 'text-status-success' : 'text-status-error'}`}
                  >
                    {totalMs.toFixed(2)} ms {fits ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="relative h-4 rounded-full bg-muted overflow-hidden border border-border">
                  {/* Sign portion */}
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/60 transition-all"
                    style={{
                      width: `${Math.min((alg.signingTimeMs / selectedSensor.latencyBudgetMs) * 100, 100)}%`,
                    }}
                  />
                  {/* Verify portion (stacked after sign) */}
                  <div
                    className={`absolute inset-y-0 transition-all ${fits ? 'bg-primary/30' : 'bg-status-error/50'}`}
                    style={{
                      left: `${Math.min((alg.signingTimeMs / selectedSensor.latencyBudgetMs) * 100, 100)}%`,
                      width: `${Math.min((alg.verificationTimeMs / selectedSensor.latencyBudgetMs) * 100, 100 - Math.min((alg.signingTimeMs / selectedSensor.latencyBudgetMs) * 100, 100))}%`,
                    }}
                  />
                  {/* Budget marker at 100% */}
                  <div className="absolute inset-y-0 right-0 w-px bg-foreground/40" />
                  {/* Percentage label */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[9px] font-mono font-bold text-foreground drop-shadow-sm">
                      {clampedPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-primary/60" /> Sign
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-primary/30" /> Verify
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-2 rounded-sm bg-status-error/50" /> Over budget
          </span>
        </div>
      </div>

      {/* ── Bandwidth Impact ──────────────────────────────────────────── */}
      {enabledProfiles.length > 0 && (
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">Signature Bandwidth Overhead</div>
          <p className="text-[10px] text-muted-foreground mb-3">
            Percentage of raw sensor data rate consumed by signature bytes at message frequency.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                    Sensor
                  </th>
                  {ALGORITHM_THROUGHPUT.map((alg) => (
                    <th
                      key={alg.algorithm}
                      className="text-right p-2 text-muted-foreground font-medium text-[10px] font-mono"
                    >
                      {alg.algorithm}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {enabledProfiles.map((sensor) => (
                  <tr
                    key={sensor.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-2 text-xs font-medium text-foreground">{sensor.name}</td>
                    {ALGORITHM_THROUGHPUT.map((alg) => {
                      const overhead = signatureOverheadPercent(sensor, alg.signatureBytes)
                      return (
                        <td key={alg.algorithm} className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-12 h-2 rounded-full bg-muted overflow-hidden border border-border">
                              <div
                                className={`h-full rounded-full transition-all ${utilizationBgColor(overhead * 10)}`}
                                style={{ width: `${Math.min(overhead * 10, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                overhead < 0.01
                                  ? 'text-status-success'
                                  : overhead < 1
                                    ? 'text-status-warning'
                                    : 'text-status-error'
                              }`}
                            >
                              {overhead < 0.001
                                ? '<0.001%'
                                : overhead < 0.01
                                  ? overhead.toFixed(4) + '%'
                                  : overhead.toFixed(3) + '%'}
                            </span>
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 bg-status-info/10 rounded-lg p-3 border border-status-info/30">
            <p className="text-[10px] text-foreground">
              <span className="font-bold">Key insight:</span> Signature overhead is negligible for
              high-bandwidth sensors (LiDAR, camera) but becomes noticeable for low-bandwidth
              sensors (ultrasonic, GPS/IMU) with large PQC signatures like SLH-DSA.
            </p>
          </div>
        </div>
      )}

      {enabledProfiles.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <Radio size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Enable at least one sensor above to see algorithm comparison data.
          </p>
        </div>
      )}
    </div>
  )
}
