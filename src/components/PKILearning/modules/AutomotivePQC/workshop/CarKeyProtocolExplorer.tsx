// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import {
  Smartphone,
  Car,
  Server,
  Users,
  AlertTriangle,
  ArrowRight,
  Wifi,
  Radio,
  Nfc,
} from 'lucide-react'
import type { TransportType, CarKeyActor, CryptoMode } from '../data/automotiveConstants'
import { TRANSPORT_LABELS } from '../data/automotiveConstants'
import {
  CAR_KEY_PROTOCOL_STEPS,
  TRANSPORT_PROFILES,
  computeProtocolTotals,
  computeNFCApduCount,
} from '../data/carKeyProtocolData'
import type { CarKeyProtocolStep, TransportProfile } from '../data/carKeyProtocolData'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Phase = CarKeyProtocolStep['phase']

const PHASE_ORDER: Phase[] = ['pairing', 'authentication', 'sharing']

const PHASE_LABELS: Record<Phase, string> = {
  pairing: 'Pairing',
  authentication: 'Authentication',
  sharing: 'Key Sharing',
}

const PHASE_STYLES: Record<Phase, string> = {
  pairing: 'border-primary/40 bg-primary/10',
  authentication: 'border-secondary/40 bg-secondary/10',
  sharing: 'border-status-success/40 bg-status-success/10',
}

const ACTOR_ICONS: Record<CarKeyActor, React.ElementType> = {
  device: Smartphone,
  vehicle: Car,
  'oem-server': Server,
  'friend-device': Users,
}

const ACTOR_LABELS: Record<CarKeyActor, string> = {
  device: 'Phone',
  vehicle: 'Vehicle',
  'oem-server': 'OEM Server',
  'friend-device': 'Friend Device',
}

const TRANSPORT_ICONS: Record<TransportType, React.ElementType> = {
  nfc: Nfc,
  ble: Wifi,
  uwb: Radio,
}

const FEASIBILITY_STYLES: Record<
  TransportProfile['pqcFeasibility'],
  { label: string; cls: string }
> = {
  good: { label: 'Good', cls: 'text-status-success bg-status-success/15 border-status-success/30' },
  challenging: {
    label: 'Challenging',
    cls: 'text-status-warning bg-status-warning/15 border-status-warning/30',
  },
  problematic: {
    label: 'Problematic',
    cls: 'text-status-error bg-status-error/15 border-status-error/30',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function pctIncrease(classical: number, pqc: number): string {
  if (classical === 0) return 'N/A'
  return `+${Math.round(((pqc - classical) / classical) * 100)}%`
}

// ---------------------------------------------------------------------------
// CarKeyProtocolExplorer
// ---------------------------------------------------------------------------

export const CarKeyProtocolExplorer: React.FC = () => {
  const [selectedTransport, setSelectedTransport] = useState<TransportType>('ble')
  const [cryptoMode, setCryptoMode] = useState<CryptoMode>('classical')

  const totals = useMemo(() => computeProtocolTotals(cryptoMode), [cryptoMode])
  const classicalTotals = useMemo(() => computeProtocolTotals('classical'), [])
  const pqcTotals = useMemo(() => computeProtocolTotals('pqc'), [])

  const stepsByPhase = useMemo(() => {
    const grouped: Record<Phase, CarKeyProtocolStep[]> = {
      pairing: [],
      authentication: [],
      sharing: [],
    }
    for (const step of CAR_KEY_PROTOCOL_STEPS) {
      grouped[step.phase].push(step)
    }
    return grouped
  }, [])

  // Phase-level summaries
  const phaseSummaries = useMemo(() => {
    return PHASE_ORDER.map((phase) => {
      const steps = stepsByPhase[phase]
      const classicalBytes = steps.reduce((s, st) => s + st.classicalSizeBytes, 0)
      const pqcBytes = steps.reduce((s, st) => s + st.pqcSizeBytes, 0)
      return { phase, stepCount: steps.length, classicalBytes, pqcBytes }
    })
  }, [stepsByPhase])

  // NFC APDU total
  const nfcTotalApdus = useMemo(() => {
    return CAR_KEY_PROTOCOL_STEPS.reduce(
      (sum, step) => sum + computeNFCApduCount(step.pqcSizeBytes),
      0
    )
  }, [])

  const showNfcWarning = selectedTransport === 'nfc' && cryptoMode === 'pqc'

  // Max size for bar normalization
  const maxStepSize = useMemo(() => {
    return Math.max(
      ...CAR_KEY_PROTOCOL_STEPS.map((s) => Math.max(s.classicalSizeBytes, s.pqcSizeBytes))
    )
  }, [])

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Step through the CCC Digital Key 3.0 protocol flow. Compare classical and post-quantum
        cryptographic payloads across NFC, BLE, and UWB transports to understand the PQC migration
        challenges for digital car keys.
      </p>

      {/* ── Transport Selector ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TRANSPORT_PROFILES.map((tp) => {
          const Icon = TRANSPORT_ICONS[tp.id]
          const feasibility = FEASIBILITY_STYLES[tp.pqcFeasibility]
          const isSelected = tp.id === selectedTransport
          return (
            <Button
              variant="ghost"
              key={tp.id}
              onClick={() => setSelectedTransport(tp.id)}
              className={`glass-panel p-4 text-left transition-all ${
                isSelected ? 'ring-2 ring-primary shadow-glow' : 'hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-primary" />
                <span className="text-sm font-bold text-foreground">{TRANSPORT_LABELS[tp.id]}</span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Range: <span className="font-mono text-foreground">{tp.rangeMeters} m</span>
                </div>
                <div>
                  Latency:{' '}
                  <span className="font-mono text-foreground">{tp.typicalLatencyMs} ms</span>
                </div>
                <div>
                  Max payload:{' '}
                  <span className="font-mono text-foreground">{tp.maxPayloadBytes} B</span>
                </div>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${feasibility.cls}`}
                >
                  PQC: {feasibility.label}
                </span>
              </div>
            </Button>
          )
        })}
      </div>

      {/* ── Crypto Mode Toggle ── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-foreground">Cryptographic Mode</span>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${cryptoMode === 'classical' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
            >
              Classical
            </span>
            <Button
              variant="ghost"
              role="switch"
              aria-checked={cryptoMode === 'pqc'}
              aria-label="Toggle PQC mode"
              onClick={() => setCryptoMode((m) => (m === 'classical' ? 'pqc' : 'classical'))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                cryptoMode === 'pqc' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${
                  cryptoMode === 'pqc' ? 'translate-x-6' : ''
                }`}
              />
            </Button>
            <span
              className={`text-sm ${cryptoMode === 'pqc' ? 'text-foreground font-bold' : 'text-muted-foreground'}`}
            >
              PQC
            </span>
          </div>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          Total protocol size:{' '}
          <span className="font-mono text-foreground font-bold">
            {formatBytes(totals.totalBytes)}
          </span>
          {cryptoMode === 'pqc' && (
            <span className="text-status-warning ml-2">
              ({pctIncrease(classicalTotals.totalBytes, pqcTotals.totalBytes)} vs classical)
            </span>
          )}
        </div>
      </div>

      {/* ── NFC Fragmentation Alert ── */}
      {showNfcWarning && (
        <div className="flex items-start gap-3 bg-status-error/10 rounded-lg p-4 border border-status-error/30">
          <AlertTriangle size={20} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground">NFC APDU Fragmentation Alert</div>
            <p className="text-xs text-muted-foreground mt-1">
              NFC ISO 7816 APDUs are limited to ~256 bytes per command. With PQC algorithms, the
              total protocol requires{' '}
              <strong className="text-foreground">{nfcTotalApdus} APDUs</strong> across all steps
              (vs{' '}
              {CAR_KEY_PROTOCOL_STEPS.reduce(
                (sum, s) => sum + computeNFCApduCount(s.classicalSizeBytes),
                0
              )}{' '}
              classical). Each APDU round-trip adds ~200 ms latency, making the PQC handshake
              significantly slower over NFC. Consider BLE as the primary transport for PQC car key
              protocols.
            </p>
          </div>
        </div>
      )}

      {/* ── Protocol Flow ── */}
      <div className="space-y-6">
        {PHASE_ORDER.map((phase) => {
          const steps = stepsByPhase[phase]
          return (
            <div key={phase}>
              <div
                className={`px-3 py-1.5 rounded-t-lg border-b-2 text-xs font-bold text-foreground ${PHASE_STYLES[phase]}`}
              >
                {PHASE_LABELS[phase]} Phase
              </div>
              <div className="space-y-2 mt-2">
                {steps.map((step) => {
                  const FromIcon = ACTOR_ICONS[step.fromActor]
                  const ToIcon = ACTOR_ICONS[step.toActor]
                  const activeSize =
                    cryptoMode === 'classical' ? step.classicalSizeBytes : step.pqcSizeBytes
                  const classicalPct = (step.classicalSizeBytes / maxStepSize) * 100
                  const pqcPct = (step.pqcSizeBytes / maxStepSize) * 100
                  const apduCount =
                    selectedTransport === 'nfc' && cryptoMode === 'pqc'
                      ? computeNFCApduCount(step.pqcSizeBytes)
                      : null

                  return (
                    <div key={step.id} className="glass-panel p-4">
                      <div className="flex items-start gap-3">
                        {/* Step number */}
                        <div className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                          {step.order}
                        </div>

                        <div className="flex-1 space-y-2 min-w-0">
                          {/* Label */}
                          <h5 className="font-semibold text-foreground text-sm">{step.label}</h5>

                          {/* Actor badges */}
                          <div className="flex items-center gap-2 text-xs">
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-foreground">
                              <FromIcon size={12} />
                              {ACTOR_LABELS[step.fromActor]}
                            </span>
                            <ArrowRight size={14} className="text-muted-foreground" />
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-foreground">
                              <ToIcon size={12} />
                              {ACTOR_LABELS[step.toActor]}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-xs text-muted-foreground">{step.description}</p>

                          {/* Crypto info */}
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                            <div className="text-muted-foreground">
                              <span className="font-medium text-secondary">Classical:</span>{' '}
                              {step.classicalCrypto}
                            </div>
                            <div className="text-muted-foreground">
                              <span className="font-medium text-status-success">PQC:</span>{' '}
                              {step.pqcReplacement}
                            </div>
                          </div>

                          {/* Size comparison bars */}
                          <div className="space-y-1">
                            <div>
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-muted-foreground">Classical</span>
                                <span className="font-mono text-foreground">
                                  {formatBytes(step.classicalSizeBytes)}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-secondary/60 transition-all"
                                  style={{ width: `${Math.max(classicalPct, 1)}%` }}
                                />
                              </div>
                            </div>
                            <div>
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-muted-foreground">PQC</span>
                                <span className="font-mono text-foreground">
                                  {formatBytes(step.pqcSizeBytes)}
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="h-2 rounded-full bg-primary/60 transition-all"
                                  style={{ width: `${Math.max(pqcPct, 1)}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Active size + APDU info */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              Active:{' '}
                              <span className="font-mono text-foreground font-medium">
                                {formatBytes(activeSize)}
                              </span>
                            </span>
                            {apduCount !== null && apduCount > 1 && (
                              <span className="text-status-warning">
                                {apduCount} NFC APDUs required
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Phase Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {phaseSummaries.map(({ phase, stepCount, classicalBytes, pqcBytes }) => (
          <div key={phase} className="glass-panel p-4">
            <div className="text-sm font-bold text-foreground mb-2">{PHASE_LABELS[phase]}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Steps</span>
                <span className="font-mono text-foreground">{stepCount}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Classical</span>
                <span className="font-mono text-foreground">{formatBytes(classicalBytes)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>PQC</span>
                <span className="font-mono text-foreground">{formatBytes(pqcBytes)}</span>
              </div>
              <div className="pt-1 border-t border-border flex justify-between">
                <span className="text-muted-foreground">Size increase</span>
                <span className="font-mono text-status-warning font-medium">
                  {pctIncrease(classicalBytes, pqcBytes)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Transport Comparison Table ── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Transport Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 pr-3">Transport</th>
                <th className="pb-2 pr-3">Est. Handshake Time</th>
                <th className="pb-2 pr-3">PQC Total Bytes</th>
                <th className="pb-2 pr-3">Max Payload</th>
                <th className="pb-2">PQC Feasibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TRANSPORT_PROFILES.map((tp) => {
                const estTime = pqcTotals.totalSteps * tp.typicalLatencyMs
                const feasibility = FEASIBILITY_STYLES[tp.pqcFeasibility]
                return (
                  <tr key={tp.id} className={tp.id === selectedTransport ? 'bg-primary/5' : ''}>
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {TRANSPORT_LABELS[tp.id]}
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">{estTime} ms</td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {formatBytes(pqcTotals.totalBytes)}
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {tp.maxPayloadBytes} B
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${feasibility.cls}`}
                      >
                        {feasibility.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Handshake time estimated as steps ({pqcTotals.totalSteps}) multiplied by transport typical
          latency. Actual times depend on protocol optimizations and fragmentation.
        </p>
      </div>
    </div>
  )
}
