// SPDX-License-Identifier: GPL-3.0-only
/**
 * Step 5 — Fleet Key Manager (moved from Energy & Utilities' Smart Meter Key
 * Manager and generalised to device fleets, 2026-10-01). See data/fleetData.ts
 * for the model and the fixes it carries.
 */
import React, { useMemo, useState } from 'react'
import { Key, Gauge, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import {
  COMM_TECHNOLOGIES,
  DLMS_KEY_TYPES,
  FLEET_PROFILES,
  HSM_OPS_PER_DEVICE,
  HSM_OPS_PER_SEC,
  LINK_UTILISATION,
  PQC_KEM_SPECS,
  PROTOCOL_OVERHEAD_BYTES,
  SECURITY_SUITES,
  computeRotationPlan,
} from '../data/fleetData'
import {
  DEFAULT_FLEET,
  type CommTechnology,
  type FleetConfig,
  type FleetProfile,
  type HSMCapacity,
  type PQCAlgorithm,
  type RotationFrequency,
  type SecuritySuite,
} from '../data/fleetTypes'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const FLEET_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'iot-fleet-mlkem768-decap',
    useCase: 'Device decapsulates the head-end’s key-update ciphertext (ML-KEM-768)',
    standard: 'NIST ACVP (FIPS 203)',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203',
    libraryRefId: 'FIPS 203',
    kind: { type: 'mlkem-decap', variant: 768 },
  },
  {
    id: 'iot-fleet-aesgcm-decrypt',
    useCase: 'Device decrypts a protected reading with the new session key (AES-256-GCM)',
    standard: 'NIST CAVP GCM vectors (SP 800-38D)',
    referenceUrl:
      'https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program/cavp-testing-block-cipher-modes',
    kind: { type: 'aesgcm-decrypt' },
  },
  {
    id: 'iot-fleet-ecdh-baseline',
    useCase: 'Classical baseline being replaced: ECDH P-256 key agreement (two-party round-trip)',
    standard: 'SP 800-56A (functional round-trip, no external vector)',
    referenceUrl: 'https://csrc.nist.gov/pubs/sp/800/56/a/r3/final',
    kind: { type: 'ecdh-derive', curve: 'P-256' },
  },
]

const ROTATION_OPTIONS: { value: RotationFrequency; label: string }[] = [
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi-annual', label: 'Semi-annual' },
  { value: 'annual', label: 'Annual' },
]

const HSM_OPTIONS: { value: HSMCapacity; label: string }[] = [
  {
    value: 'standard',
    label: `Standard (${HSM_OPS_PER_SEC.standard.toLocaleString('en-US')} ops/s)`,
  },
  {
    value: 'high-throughput',
    label: `High-throughput (${HSM_OPS_PER_SEC['high-throughput'].toLocaleString('en-US')} ops/s)`,
  },
]

const FLEET_PRESETS = [100_000, 500_000, 1_000_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000]
const CELL_PRESETS = [100, 250, 500, 1_000, 2_000, 5_000]

const fmtN = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(0)}K`
      : `${n}`

const fmtHours = (h: number): string => {
  if (h >= 48) return `${(h / 24).toFixed(1)} days`
  if (h >= 1) return `${h.toFixed(1)} h`
  return `${(h * 60).toFixed(0)} min`
}

const nearest = (arr: number[], v: number) =>
  arr.reduce((best, x, i) => (Math.abs(x - v) < Math.abs(arr[best] - v) ? i : best), 0)

export const FleetKeyManager: React.FC<{ initial?: Partial<FleetConfig> }> = ({ initial }) => {
  const [config, setConfig] = useState<FleetConfig>({ ...DEFAULT_FLEET, ...initial })
  const update = (patch: Partial<FleetConfig>) => setConfig((c) => ({ ...c, ...patch }))
  const result = useMemo(() => computeRotationPlan(config), [config])
  const profile = FLEET_PROFILES.find((p) => p.id === config.profile) ?? FLEET_PROFILES[0]
  const comm = COMM_TECHNOLOGIES.find((c) => c.id === config.commTechnology)
  const suite = SECURITY_SUITES.find((s) => s.id === config.securitySuite)
  const kem = PQC_KEM_SPECS.find((k) => k.id === config.pqcAlgorithm)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Plan a fleet-wide key rotation. Devices are spread over many cells or collectors that run in
        parallel, while every device&apos;s key update passes through the same head-end HSM — so at
        fleet scale the HSM, not the radio, is often the limit. All results are model estimates.
      </p>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Fleet</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">Fleet type</span>
            <FilterDropdown
              noContainer
              selectedId={config.profile}
              onSelect={(id) => {
                const p = FLEET_PROFILES.find((x) => x.id === id)
                if (p) update({ profile: id as FleetProfile, ...p.defaults })
              }}
              items={FLEET_PROFILES.map((p) => ({ id: p.id, label: p.name }))}
            />
          </div>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Fleet size: {fmtN(config.fleetSize)} devices
            </span>
            <input
              type="range"
              aria-label="Fleet size"
              min={0}
              max={FLEET_PRESETS.length - 1}
              value={nearest(FLEET_PRESETS, config.fleetSize)}
              onChange={(e) => update({ fleetSize: FLEET_PRESETS[Number(e.target.value)] })}
              className="w-full accent-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Devices per cell / collector: {config.devicesPerCell.toLocaleString('en-US')}
            </span>
            <input
              type="range"
              aria-label="Devices per cell"
              min={0}
              max={CELL_PRESETS.length - 1}
              value={nearest(CELL_PRESETS, config.devicesPerCell)}
              onChange={(e) => update({ devicesPerCell: CELL_PRESETS[Number(e.target.value)] })}
              className="w-full accent-primary"
            />
          </label>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">Link</span>
            <FilterDropdown
              noContainer
              selectedId={config.commTechnology}
              onSelect={(id) => update({ commTechnology: id as CommTechnology })}
              items={COMM_TECHNOLOGIES.map((t) => ({ id: t.id, label: t.name }))}
            />
            {comm && <p className="text-[10px] text-muted-foreground mt-1">{comm.rateSource}</p>}
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Key establishment today
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.securitySuite}
              onSelect={(id) => update({ securitySuite: id as SecuritySuite })}
              items={SECURITY_SUITES.map((s) => ({ id: s.id, label: s.label }))}
            />
            {suite && <p className="text-[10px] text-muted-foreground mt-1">{suite.description}</p>}
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">PQC KEM</span>
            <FilterDropdown
              noContainer
              selectedId={config.pqcAlgorithm}
              onSelect={(id) => update({ pqcAlgorithm: id as PQCAlgorithm })}
              items={PQC_KEM_SPECS.map((k) => ({
                id: k.id,
                label: `${k.name} (category ${k.nistLevel})`,
              }))}
            />
            {kem && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Public key {kem.publicKeyBytes} B, ciphertext {kem.ciphertextBytes} B (FIPS 203)
              </p>
            )}
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Rotation frequency
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.rotationFrequency}
              onSelect={(id) => update({ rotationFrequency: id as RotationFrequency })}
              items={ROTATION_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            />
          </div>
          <div>
            <span className="text-xs font-medium text-muted-foreground block mb-1">
              Head-end HSM
            </span>
            <FilterDropdown
              noContainer
              selectedId={config.hsmCapacity}
              onSelect={(id) => update({ hsmCapacity: id as HSMCapacity })}
              items={HSM_OPTIONS.map((o) => ({ id: o.value, label: o.label }))}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Illustrative ratings, {HSM_OPS_PER_DEVICE} operations per device (one encapsulation,
              one signature).
            </p>
          </div>
        </div>
      </div>

      {!result.publicKeyCapable && (
        <div className="flex items-start gap-3 bg-warning/10 rounded-lg p-4 border border-warning/30 text-xs">
          <AlertTriangle size={16} className="text-warning shrink-0 mt-0.5" />
          <p className="text-muted-foreground">{comm?.notes}</p>
        </div>
      )}

      <div className="glass-panel p-4" data-testid="rotation-results">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Rotation analysis — model estimate</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <Cell
            label="Bytes per device (PQC)"
            value={`${result.pqcBytesPerDevice.toLocaleString('en-US')} B`}
          />
          <Cell
            label="Bytes per device (today)"
            value={`${result.classicalBytesPerDevice.toLocaleString('en-US')} B`}
            note={
              result.sizeMultiplier
                ? `PQC is ${result.sizeMultiplier.toFixed(1)}×`
                : 'symmetric key transport'
            }
          />
          <Cell
            label="Network time per cell"
            value={fmtHours(result.networkHoursPerCell)}
            note={`${result.cells.toLocaleString('en-US')} cells in parallel · today ${fmtHours(result.classicalNetworkHoursPerCell)}`}
          />
          <Cell
            label="Head-end HSM time"
            value={fmtHours(result.hsmHours)}
            note={`${(config.fleetSize * HSM_OPS_PER_DEVICE).toLocaleString('en-US')} operations`}
          />
        </div>
        <div
          className={`mt-3 flex items-start gap-2 rounded-lg p-3 border text-xs ${
            result.periodShare <= 0.1
              ? 'bg-status-success/5 border-status-success/20'
              : 'bg-status-warning/5 border-status-warning/20'
          }`}
        >
          {result.periodShare <= 0.1 ? (
            <CheckCircle2 size={14} className="text-status-success shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
          )}
          <p className="text-muted-foreground">
            Fleet rotation takes about <strong>{fmtHours(result.rotationHours)}</strong>, limited by
            the <strong>{result.bottleneck === 'hsm' ? 'head-end HSM' : 'per-cell network'}</strong>{' '}
            — {(result.periodShare * 100).toFixed(1)}% of each {Math.round(result.periodDays)}-day
            rotation period. Annual key-update traffic across the fleet:{' '}
            {result.annualFleetGB.toFixed(1)} GB.
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Model: device sends a fresh KEM public key, the head-end returns the ciphertext, plus{' '}
          {PROTOCOL_OVERHEAD_BYTES} B of framing; links run at {LINK_UTILISATION * 100}% of the
          stated rate.
        </p>
        {!result.suiteHasPublicKey && (
          <p className="text-[10px] text-muted-foreground mt-1">
            With symmetric-only key transport there is no public-key exchange for Shor&apos;s
            algorithm to attack. Moving to a KEM is a design choice (fresh keys without a shared
            KEK), not a quantum fix.
          </p>
        )}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-2">
          <Info size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Harvest now, decrypt later</h3>
        </div>
        <p className="text-xs text-muted-foreground">{profile.dataLifetime}</p>
      </div>

      {config.profile === 'smart-meter' && (
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Key size={16} className="text-primary" />
            <h3 className="text-sm font-bold text-foreground">DLMS/COSEM keys in a meter</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Key</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Name</th>
                  <th className="text-left p-2 text-muted-foreground font-medium">Role</th>
                </tr>
              </thead>
              <tbody>
                {DLMS_KEY_TYPES.map((k) => (
                  <tr key={k.id} className="border-b border-border/50">
                    <td className="p-2 font-mono font-bold text-primary">{k.acronym}</td>
                    <td className="p-2 text-foreground">{k.name}</td>
                    <td className="p-2 text-muted-foreground">{k.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <KatValidationPanel
        specs={FLEET_KAT_SPECS}
        label="Fleet key-update known-answer tests"
        authorityNote="NIST FIPS 203 · SP 800-38D · SP 800-56A"
      />
    </div>
  )
}

function Cell({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="bg-muted/30 rounded-lg p-3 border border-border">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-bold font-mono text-foreground">{value}</div>
      {note && <div className="text-[10px] text-muted-foreground">{note}</div>}
    </div>
  )
}
