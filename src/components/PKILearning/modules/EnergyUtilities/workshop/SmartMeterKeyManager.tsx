// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Key, Gauge, Radio, Clock, CheckCircle2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  COMM_TECHNOLOGIES,
  PQC_KEM_SPECS,
  CLASSICAL_ECDH_SIZE,
  DLMS_KEY_TYPES,
  computeRotationPlan,
} from '../data/smartMeterData'
import type {
  SmartMeterFleetConfig,
  CommTechnology,
  PQCAlgorithm,
  RotationFrequency,
  HSMCapacity,
  SecuritySuite,
} from '../data/energyConstants'
import { FilterDropdown } from '@/components/common/FilterDropdown'

interface SmartMeterKeyManagerProps {
  config: SmartMeterFleetConfig
  onConfigChange: (c: SmartMeterFleetConfig) => void
  onComplete: () => void
}

const ROTATION_OPTIONS: { value: RotationFrequency; label: string }[] = [
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
]

const HSM_OPTIONS: { value: HSMCapacity; label: string; opsPerSec: number }[] = [
  { value: 'standard', label: 'Standard (1,000 ops/s)', opsPerSec: 1000 },
  { value: 'high-throughput', label: 'High-Throughput (10,000 ops/s)', opsPerSec: 10000 },
]

const SUITE_OPTIONS: { value: SecuritySuite; label: string }[] = [
  { value: 'suite-0', label: 'Suite 0 (No security)' },
  { value: 'suite-1', label: 'Suite 1 (AES-128 + ECDSA P-256)' },
  { value: 'suite-2', label: 'Suite 2 (AES-256 + ECDSA P-384)' },
]

const FLEET_PRESETS = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000]

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

function formatGB(gb: number): string {
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  if (gb >= 1) return `${gb.toFixed(1)} GB`
  return `${(gb * 1024).toFixed(0)} MB`
}

function formatHours(hours: number): string {
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const remaining = Math.round(hours % 24)
    return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`
  }
  return `${hours.toFixed(1)}h`
}

const rangeClasses = 'w-full accent-primary'

export const SmartMeterKeyManager: React.FC<SmartMeterKeyManagerProps> = ({
  config,
  onConfigChange,
  onComplete,
}) => {
  const [compareMode, setCompareMode] = useState(false)

  const update = (patch: Partial<SmartMeterFleetConfig>) => {
    onConfigChange({ ...config, ...patch })
  }

  const result = useMemo(() => computeRotationPlan(config), [config])

  const selectedComm = useMemo(
    () => COMM_TECHNOLOGIES.find((c) => c.id === config.commTechnology),
    [config.commTechnology]
  )
  const selectedKem = useMemo(
    () => PQC_KEM_SPECS.find((k) => k.id === config.pqcAlgorithm),
    [config.pqcAlgorithm]
  )
  const selectedHsm = useMemo(
    () => HSM_OPTIONS.find((h) => h.value === config.hsmCapacity),
    [config.hsmCapacity]
  )

  const hsmSufficient = selectedHsm ? result.hsmOpsPerSecond <= selectedHsm.opsPerSec : false

  // Find closest slider index for fleet size
  const fleetIndex = useMemo(() => {
    let closest = 0
    let minDiff = Math.abs(FLEET_PRESETS[0] - config.fleetSize)
    FLEET_PRESETS.forEach((preset, i) => {
      const diff = Math.abs(preset - config.fleetSize)
      if (diff < minDiff) {
        minDiff = diff
        closest = i
      }
    })
    return closest
  }, [config.fleetSize])

  // Max end day for Gantt scaling
  const maxDay = useMemo(() => Math.max(...result.zones.map((z) => z.endDay), 1), [result.zones])

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Plan PQC key rotation for a smart meter fleet. Configure your fleet size, communication
        technology, and PQC algorithm to see how key exchange overhead scales and how long
        fleet-wide rotation will take.
      </p>

      {/* Fleet Configuration */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Fleet Configuration</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Fleet Size */}
          <label className="block sm:col-span-2 lg:col-span-3">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Fleet Size: {formatNumber(config.fleetSize)} meters
            </span>
            <input
              type="range"
              min={0}
              max={FLEET_PRESETS.length - 1}
              step={1}
              value={fleetIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value)
                // eslint-disable-next-line security/detect-object-injection
                update({ fleetSize: FLEET_PRESETS[idx] })
              }}
              className={rangeClasses}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
              <span>100K</span>
              <span>1M</span>
              <span>5M</span>
              <span>20M</span>
            </div>
          </label>

          {/* Communication Technology */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Communication Technology
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.commTechnology}
              onSelect={(id) => update({ commTechnology: id as CommTechnology })}
              items={COMM_TECHNOLOGIES.map((tech) => ({
                id: tech.id,
                label: `${tech.name} (${tech.bandwidthKbps} kbps)`,
              }))}
            />
            {selectedComm && (
              <p className="text-[10px] text-muted-foreground mt-1">{selectedComm.notes}</p>
            )}
          </div>

          {/* DLMS/COSEM Security Suite */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              DLMS/COSEM Security Suite
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.securitySuite}
              onSelect={(id) => update({ securitySuite: id as SecuritySuite })}
              items={SUITE_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>

          {/* Key Rotation Frequency */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Key Rotation Frequency
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.rotationFrequency}
              onSelect={(id) => update({ rotationFrequency: id as RotationFrequency })}
              items={ROTATION_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>

          {/* PQC Algorithm */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              PQC KEM Algorithm
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.pqcAlgorithm}
              onSelect={(id) => update({ pqcAlgorithm: id as PQCAlgorithm })}
              items={PQC_KEM_SPECS.map((kem) => ({
                id: kem.id,
                label: `${kem.name} (NIST Level ${kem.nistLevel})`,
              }))}
            />
            {selectedKem && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Ciphertext: {selectedKem.ciphertextBytes}B | Public key:{' '}
                {selectedKem.publicKeyBytes}B
              </p>
            )}
          </div>

          {/* HSM Capacity */}
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              HSM Capacity
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.hsmCapacity}
              onSelect={(id) => update({ hsmCapacity: id as HSMCapacity })}
              items={HSM_OPTIONS.map((opt) => ({ id: opt.value, label: opt.label }))}
            />
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">Rotation Analysis</h3>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">Compare Classical vs PQC</span>
            <input
              type="checkbox"
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="accent-primary"
            />
          </label>
        </div>

        {/* Side-by-side comparison */}
        <div className={`grid gap-3 ${compareMode ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {/* PQC column (always shown) */}
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Key size={14} className="text-primary" />
              <span className="text-xs font-bold text-foreground">PQC (ML-KEM)</span>
              <span
                className={`text-[10px] rounded px-1.5 py-0.5 ${
                  parseFloat(result.sizeMultiplier) > 5
                    ? 'text-status-error bg-status-error/10'
                    : parseFloat(result.sizeMultiplier) > 2
                      ? 'text-status-warning bg-status-warning/10'
                      : 'text-status-success bg-status-success/10'
                }`}
              >
                {result.sizeMultiplier}x vs classical
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Data Volume</span>
                <span className="font-mono text-foreground">{formatGB(result.totalDataGB)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Rotation Duration</span>
                <span className="font-mono text-foreground">
                  {formatHours(result.rotationDurationHours)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">HSM Ops/sec Required</span>
                <span
                  className={`font-mono ${hsmSufficient ? 'text-status-success' : 'text-status-error'}`}
                >
                  {result.hsmOpsPerSecond.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Classical column (only in compare mode) */}
          {compareMode && (
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Key size={14} className="text-muted-foreground" />
                <span className="text-xs font-bold text-foreground">Classical (ECDH P-256)</span>
                <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                  baseline
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Data Volume</span>
                  <span className="font-mono text-foreground">
                    {formatGB(result.classicalDataGB)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Rotation Duration</span>
                  <span className="font-mono text-foreground">
                    {formatHours(result.classicalDurationHours)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">ECDH Public Key Size</span>
                  <span className="font-mono text-foreground">{CLASSICAL_ECDH_SIZE} B</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HSM capacity check */}
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg p-3 border ${
            hsmSufficient
              ? 'bg-status-success/5 border-status-success/20'
              : 'bg-status-error/5 border-status-error/20'
          }`}
        >
          {hsmSufficient ? (
            <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
          ) : (
            <Radio size={14} className="text-status-error shrink-0 mt-0.5" />
          )}
          <p className="text-xs text-muted-foreground">
            {hsmSufficient ? (
              <>
                <span className="text-status-success font-medium">HSM capacity sufficient.</span>{' '}
                Selected HSM can handle {selectedHsm?.opsPerSec.toLocaleString()} ops/s;{' '}
                {result.hsmOpsPerSecond.toLocaleString()} ops/s needed for fleet rotation.
              </>
            ) : (
              <>
                <span className="text-status-error font-medium">HSM capacity exceeded.</span>{' '}
                Rotation requires {result.hsmOpsPerSecond.toLocaleString()} ops/s but selected HSM
                supports {selectedHsm?.opsPerSec.toLocaleString()} ops/s. Consider upgrading to
                high-throughput HSM or extending the rotation window.
              </>
            )}
          </p>
        </div>
      </div>

      {/* DLMS/COSEM Key Types Reference */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Key size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">DLMS/COSEM Key Types</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Acronym</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Name</th>
                <th className="text-left p-2 text-muted-foreground font-medium">Description</th>
                <th className="text-left p-2 text-muted-foreground font-medium">
                  Rotation Frequency
                </th>
              </tr>
            </thead>
            <tbody>
              {DLMS_KEY_TYPES.map((keyType, idx) => (
                <tr
                  key={keyType.id}
                  className={`border-b border-border/50 ${idx % 2 === 1 ? 'bg-muted/50' : ''}`}
                >
                  <td className="p-2">
                    <span className="font-mono font-bold text-primary">{keyType.acronym}</span>
                  </td>
                  <td className="p-2 text-foreground font-medium">{keyType.name}</td>
                  <td className="p-2 text-muted-foreground">{keyType.description}</td>
                  <td className="p-2 text-muted-foreground">{keyType.rotationFrequency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zone Rotation Gantt */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Zone Rotation Schedule</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            Total: {formatHours(result.rotationDurationHours)}
          </span>
        </div>

        <div className="space-y-2">
          {result.zones.map((zone) => {
            const widthPercent = ((zone.endDay - zone.startDay) / maxDay) * 100
            const leftPercent = (zone.startDay / maxDay) * 100

            return (
              <div key={zone.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-foreground font-medium">{zone.name}</span>
                  <span className="text-muted-foreground">
                    {formatNumber(zone.meterCount)} meters | {formatGB(zone.dataGB)} | Day{' '}
                    {zone.startDay}
                    {'\u2013'}
                    {zone.endDay}
                  </span>
                </div>
                <div className="relative w-full bg-muted rounded-full h-5 overflow-hidden">
                  <div
                    className="absolute inset-y-0 bg-primary/70 rounded-full flex items-center justify-center"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${Math.max(widthPercent, 2)}%`,
                    }}
                  >
                    <span className="text-[9px] text-foreground font-mono truncate px-1">
                      {zone.endDay - zone.startDay}d
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Day axis labels */}
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Day 0</span>
          <span>Day {Math.round(maxDay / 2)}</span>
          <span>Day {maxDay}</span>
        </div>
      </div>

      {/* Size Comparison Visual */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Key Exchange Size Comparison</div>
        <div className="space-y-2">
          {PQC_KEM_SPECS.map((kem) => {
            const totalPqc = kem.ciphertextBytes + kem.publicKeyBytes + 200
            const totalClassical = CLASSICAL_ECDH_SIZE * 2 + 200
            const maxBytes =
              PQC_KEM_SPECS[PQC_KEM_SPECS.length - 1].ciphertextBytes +
              PQC_KEM_SPECS[PQC_KEM_SPECS.length - 1].publicKeyBytes +
              200
            const isSelected = kem.id === config.pqcAlgorithm

            return (
              <div
                key={kem.id}
                className={`rounded-lg p-3 border ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span
                    className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                  >
                    {kem.name}
                    {isSelected && (
                      <span className="text-[10px] text-primary ml-1">(selected)</span>
                    )}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {totalPqc.toLocaleString()} B ({(totalPqc / totalClassical).toFixed(1)}x)
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-muted-foreground/30 h-full"
                      style={{ width: `${(totalClassical / maxBytes) * 100}%` }}
                    />
                    <div
                      className={`h-full ${isSelected ? 'bg-primary' : 'bg-primary/50'}`}
                      style={{
                        width: `${((totalPqc - totalClassical) / maxBytes) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                  <span>Classical ({totalClassical} B)</span>
                  <span>NIST Level {kem.nistLevel}</span>
                </div>
              </div>
            )
          })}
        </div>
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
