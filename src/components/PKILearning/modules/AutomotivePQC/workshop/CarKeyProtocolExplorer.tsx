// SPDX-License-Identifier: AGPL-3.0-only
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
  CAR_KEY_LOCAL_EVENTS,
  FRAGMENT_BOUND_BYTES,
  RADIO_SCENARIOS,
  SAMPLE_CHALLENGE_BYTES,
  TRANSPORT_PROFILES,
  buildCarKeyFlow,
  fragmentCount,
  summarizeCarKeyFlow,
} from '../data/carKeyProtocolData'
import type {
  CarKeyMessage,
  FlowSummary,
  FlowTransport,
  RadioScenario,
  ServiceMs,
  TransportProfile,
} from '../data/carKeyProtocolData'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

type Phase = CarKeyMessage['phase']

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
  'oem-server': 'Carmaker',
  'friend-device': 'Friend Device',
}

const TRANSPORT_ICONS: Record<TransportType, React.ElementType> = {
  nfc: Nfc,
  ble: Wifi,
  uwb: Radio,
}

const SCENARIO_LABELS: Record<RadioScenario, string> = {
  nfc: 'NFC',
  ble: 'BLE',
  'ble+uwb': 'BLE + UWB ranging',
}

/** Radio that carries the credential messages in each scenario. */
const SCENARIO_CREDENTIAL_RADIO: Record<RadioScenario, TransportType> = {
  nfc: 'nfc',
  ble: 'ble',
  'ble+uwb': 'ble',
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
  const [radio, setRadio] = useState<RadioScenario>('ble')
  const [cryptoMode, setCryptoMode] = useState<CryptoMode>('classical')
  // Service-time inputs are text so an empty box stays empty. There are no defaults.
  const [serviceInputs, setServiceInputs] = useState<Partial<Record<FlowTransport, string>>>({})

  const flow = useMemo(
    () =>
      buildCarKeyFlow({
        challengeBytes: SAMPLE_CHALLENGE_BYTES,
        ownerCertRoute: 'direct-carmaker',
        radio,
      }),
    [radio]
  )
  const classical = useMemo(() => summarizeCarKeyFlow(flow, 'classical'), [flow])
  const pqc = useMemo(() => summarizeCarKeyFlow(flow, 'pqc'), [flow])
  const active: FlowSummary = cryptoMode === 'classical' ? classical : pqc

  const scenarioRows = useMemo(
    () =>
      RADIO_SCENARIOS.map((scenario) => {
        const messages = buildCarKeyFlow({
          challengeBytes: SAMPLE_CHALLENGE_BYTES,
          ownerCertRoute: 'direct-carmaker',
          radio: scenario,
        })
        return {
          scenario,
          credentialRadio: SCENARIO_CREDENTIAL_RADIO[scenario],
          classical: summarizeCarKeyFlow(messages, 'classical'),
          pqc: summarizeCarKeyFlow(messages, 'pqc'),
        }
      }),
    []
  )

  const messagesByPhase = useMemo(() => {
    const grouped: Record<Phase, CarKeyMessage[]> = { pairing: [], authentication: [], sharing: [] }
    for (const m of flow) grouped[m.phase].push(m)
    return grouped
  }, [flow])

  const phaseSummaries = useMemo(
    () =>
      PHASE_ORDER.map((phase) => {
        const msgs = messagesByPhase[phase]
        return {
          phase,
          count: msgs.length,
          classicalBytes: msgs.reduce((s, m) => s + m.classicalBytes, 0),
          pqcBytes: msgs.reduce((s, m) => s + m.pqcBytes, 0),
        }
      }),
    [messagesByPhase]
  )

  const maxMessageSize = useMemo(
    () => Math.max(...flow.map((m) => Math.max(m.classicalBytes, m.pqcBytes))),
    [flow]
  )

  // Timing exists only when every transport used by this flow has a positive input.
  const usedTransports = useMemo(() => Object.keys(pqc.transports) as FlowTransport[], [pqc])
  const serviceMs: ServiceMs | null = useMemo(() => {
    const out: ServiceMs = {}
    for (const t of usedTransports) {
      const raw = serviceInputs[t]
      if (raw === undefined || raw.trim() === '') return null
      const n = Number(raw)
      if (!Number.isFinite(n) || n <= 0) return null
      out[t] = n
    }
    return out
  }, [serviceInputs, usedTransports])
  const elapsed = useMemo(
    () =>
      serviceMs
        ? {
            classical: summarizeCarKeyFlow(flow, 'classical', serviceMs).serialServiceMs,
            pqc: summarizeCarKeyFlow(flow, 'pqc', serviceMs).serialServiceMs,
          }
        : null,
    [flow, serviceMs]
  )

  const showNfcAlert = radio === 'nfc' && cryptoMode === 'pqc'
  const kemPublicFragments = fragmentCount('nfc', 1184)
  const kemCiphertextFragments = fragmentCount('nfc', 1088)

  const networkTotals = active.transports.network
  const radioTransports = (Object.keys(active.transports) as FlowTransport[]).filter(
    (t) => t !== 'network'
  ) as TransportType[]
  const radioBytes = radioTransports.reduce((s, t) => s + (active.transports[t]?.bytes ?? 0), 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Step through a fictional digital car key flow and compare classical and post-quantum payload
        sizes. Messages that travel on the carmaker network are counted apart from messages that
        travel on the local radio (NFC, BLE or UWB), so the two are never mixed into one figure.
      </p>

      <p className="text-xs text-muted-foreground">
        This is a fictional project sample. Its message table is authored for this module: it is not
        the CCC Digital Key wire format, it defines no new wire format, and it does not execute an
        NFC or BLE exchange, show encoded certificates, or establish interoperability. Sizes add up
        application payload bytes only, with no framing or headers. In this sample the carmaker
        delivers the owner certificate to the vehicle directly, and the friend device forwards its
        own certificate to the vehicle on first use.
      </p>

      {/* ── Radio scenario selector ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {RADIO_SCENARIOS.map((scenario) => {
          const tp = TRANSPORT_PROFILES.find((p) => p.id === SCENARIO_CREDENTIAL_RADIO[scenario])!
          const Icon = TRANSPORT_ICONS[tp.id]
          const feasibility = FEASIBILITY_STYLES[tp.pqcFeasibility]
          const isSelected = scenario === radio
          return (
            <Button
              variant="ghost"
              key={scenario}
              onClick={() => setRadio(scenario)}
              className={`glass-panel h-auto min-w-0 w-full flex-col items-stretch whitespace-normal p-4 text-left transition-all ${
                isSelected ? 'ring-2 ring-primary shadow-glow' : 'hover:border-primary/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className="text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {SCENARIO_LABELS[scenario]}
                </span>
              </div>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div>
                  Range: <span className="font-mono text-foreground">{tp.rangeMeters} m</span>
                </div>
                <div>
                  Sample payload bound:{' '}
                  <span className="font-mono text-foreground">{tp.maxPayloadBytes} B</span>
                </div>
                <div>
                  {scenario === 'ble+uwb'
                    ? 'Credentials on BLE; ranging on UWB'
                    : 'Credentials on this radio'}
                </div>
              </div>
              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-0.5 rounded border text-[10px] font-medium ${feasibility.cls}`}
                >
                  Sample fit: {feasibility.label}
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
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div>
            Whole-flow payload:{' '}
            <span className="font-mono text-foreground font-bold">
              {active.totalBytes.toLocaleString()} bytes
            </span>
            {cryptoMode === 'pqc' && (
              <span className="text-status-warning ml-2">
                ({pctIncrease(classical.totalBytes, pqc.totalBytes)} vs classical)
              </span>
            )}
          </div>
          <div>
            Carmaker network:{' '}
            <span className="font-mono text-foreground">
              {(networkTotals?.bytes ?? 0).toLocaleString()} bytes in {networkTotals?.messages ?? 0}{' '}
              messages
            </span>
            {' · '}
            Local radio:{' '}
            <span className="font-mono text-foreground">{radioBytes.toLocaleString()} bytes</span>
            {radioTransports.map((t) => (
              <span key={t} className="font-mono text-foreground">
                {' · '}
                {TRANSPORT_LABELS[t]} {active.transports[t]?.payloadFragments} fragments
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── NFC Fragmentation Alert ── */}
      {showNfcAlert && (
        <div className="flex items-start gap-3 bg-status-error/10 rounded-lg p-4 border border-status-error/30">
          <AlertTriangle size={20} className="text-status-error shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-foreground">NFC Fragmentation</div>
            <p className="text-xs text-muted-foreground mt-1">
              This calculation assumes short NFC commands of about {FRAGMENT_BOUND_BYTES.nfc} bytes,
              not a universal ISO 7816 APDU limit. The ML-KEM-768 public value (1,184 bytes) takes{' '}
              {kemPublicFragments} fragments and the returned ciphertext (1,088 bytes) takes{' '}
              {kemCiphertextFragments} more, because the two travel as separate messages:{' '}
              <strong className="text-foreground">
                {kemPublicFragments} + {kemCiphertextFragments} ={' '}
                {kemPublicFragments + kemCiphertextFragments} fragments
              </strong>{' '}
              for each key agreement (2,272 bytes in all). Over the whole flow the local radio
              carries {pqc.transports.nfc?.payloadFragments} fragments (
              {classical.transports.nfc?.payloadFragments} classical). This page shows no elapsed
              time unless you enter the service times below. Actual implementations may support
              extended-length APDUs or chaining; evaluate the exact profile, framing and device
              capabilities.
            </p>
          </div>
        </div>
      )}

      {/* ── Protocol Flow ── */}
      <div className="space-y-6">
        {PHASE_ORDER.map((phase) => (
          <div key={phase}>
            <div
              className={`px-3 py-1.5 rounded-t-lg border-b-2 text-xs font-bold text-foreground ${PHASE_STYLES[phase]}`}
            >
              {PHASE_LABELS[phase]} Phase
            </div>
            <div className="space-y-2 mt-2">
              {messagesByPhase[phase].map((m) => {
                const FromIcon = ACTOR_ICONS[m.fromActor]
                const ToIcon = ACTOR_ICONS[m.toActor]
                const activeSize = cryptoMode === 'classical' ? m.classicalBytes : m.pqcBytes
                const classicalPct = (m.classicalBytes / maxMessageSize) * 100
                const pqcPct = (m.pqcBytes / maxMessageSize) * 100
                const fragments =
                  m.transport === 'network' ? null : fragmentCount(m.transport, activeSize)
                return (
                  <div key={m.id} className="glass-panel p-4">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                        {flow.indexOf(m) + 1}
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <h5 className="font-semibold text-foreground text-sm">{m.label}</h5>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-foreground">
                            <FromIcon size={12} />
                            {ACTOR_LABELS[m.fromActor]}
                          </span>
                          <ArrowRight size={14} className="text-muted-foreground" />
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded border border-border bg-muted/50 text-foreground">
                            <ToIcon size={12} />
                            {ACTOR_LABELS[m.toActor]}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded border text-[10px] font-medium ${
                              m.transport === 'network'
                                ? 'border-status-info/40 bg-status-info/10 text-status-info'
                                : 'border-primary/40 bg-primary/10 text-primary'
                            }`}
                          >
                            {m.transport === 'network'
                              ? 'Carmaker network'
                              : `${TRANSPORT_LABELS[m.transport]} radio`}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{m.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                          <div className="text-muted-foreground">
                            <span className="font-medium text-secondary">Classical:</span>{' '}
                            {m.classicalCrypto}
                          </div>
                          <div className="text-muted-foreground">
                            <span className="font-medium text-status-success">PQC:</span>{' '}
                            {m.pqcReplacement}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <div className="flex justify-between text-[10px] mb-0.5">
                              <span className="text-muted-foreground">Classical</span>
                              <span className="font-mono text-foreground">
                                {formatBytes(m.classicalBytes)}
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
                                {formatBytes(m.pqcBytes)}
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
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            Active:{' '}
                            <span className="font-mono text-foreground font-medium">
                              {formatBytes(activeSize)}
                            </span>
                          </span>
                          {fragments !== null && m.transport !== 'network' && (
                            <span className={fragments > 1 ? 'text-status-warning' : ''}>
                              {fragments} {TRANSPORT_LABELS[m.transport]}{' '}
                              {fragments === 1 ? 'fragment' : 'fragments'} of up to{' '}
                              {FRAGMENT_BOUND_BYTES[m.transport]} B
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
        ))}
      </div>

      {/* ── Radio events and local steps, outside the totals ── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-2">Not counted in the totals</h4>
        <div className="space-y-2">
          {CAR_KEY_LOCAL_EVENTS.map((event) => (
            <div key={event.id} className="text-xs">
              <span className="font-bold text-foreground">{event.label}.</span>{' '}
              <span className="text-muted-foreground">{event.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phase Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {phaseSummaries.map(({ phase, count, classicalBytes, pqcBytes }) => (
          <div key={phase} className="glass-panel p-4">
            <div className="text-sm font-bold text-foreground mb-2">{PHASE_LABELS[phase]}</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Messages</span>
                <span className="font-mono text-foreground">{count}</span>
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

      {/* ── Service-time assumptions ── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-1">Your timing assumptions</h4>
        <p className="text-xs text-muted-foreground mb-3">
          No elapsed time is assumed. Enter how long you think each local radio fragment and each
          carmaker network message takes to serve; the page then adds them up as one serial
          sequence, with no overlap or batching. The result is only as good as your inputs.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {usedTransports.map((t) => (
            <div key={t}>
              <label htmlFor={`service-${t}`} className="block text-xs text-muted-foreground mb-1">
                {t === 'network'
                  ? 'Carmaker network: ms per message'
                  : `${TRANSPORT_LABELS[t]}: ms per fragment`}
              </label>
              <Input
                id={`service-${t}`}
                type="number"
                min={0}
                step="any"
                placeholder="not set"
                value={serviceInputs[t] ?? ''}
                onChange={(e) => setServiceInputs((prev) => ({ ...prev, [t]: e.target.value }))}
                className="h-9 text-sm font-mono"
              />
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs" data-testid="elapsed-result" role="status" aria-live="polite">
          {elapsed && elapsed.classical !== null && elapsed.pqc !== null ? (
            <span className="text-foreground">
              Serial service time from your inputs:{' '}
              <span className="font-mono font-bold">{elapsed.classical.toLocaleString()} ms</span>{' '}
              classical,{' '}
              <span className="font-mono font-bold">{elapsed.pqc.toLocaleString()} ms</span> PQC.
            </span>
          ) : (
            <span className="text-muted-foreground">
              No elapsed time shown: enter a positive value for every box above.
            </span>
          )}
        </div>
      </div>

      {/* ── Scenario Comparison Table ── */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Radio Scenario Comparison</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2 pr-3">Scenario</th>
                <th className="pb-2 pr-3">PQC whole flow</th>
                <th className="pb-2 pr-3">PQC carmaker network</th>
                <th className="pb-2 pr-3">PQC local radio</th>
                <th className="pb-2 pr-3">Credential radio fragments (PQC / classical)</th>
                <th className="pb-2">Sample fit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {scenarioRows.map((row) => {
                const profile = TRANSPORT_PROFILES.find((p) => p.id === row.credentialRadio)!
                const feasibility = FEASIBILITY_STYLES[profile.pqcFeasibility]
                const localBytes = Object.entries(row.pqc.transports)
                  .filter(([t]) => t !== 'network')
                  .reduce((s, [, v]) => s + v.bytes, 0)
                return (
                  <tr key={row.scenario} className={row.scenario === radio ? 'bg-primary/5' : ''}>
                    <td className="py-2 pr-3 font-medium text-foreground">
                      {SCENARIO_LABELS[row.scenario]}
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {row.pqc.totalBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {(row.pqc.transports.network?.bytes ?? 0).toLocaleString()} B
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {localBytes.toLocaleString()} B
                    </td>
                    <td className="py-2 pr-3 font-mono text-muted-foreground">
                      {row.pqc.transports[row.credentialRadio]?.payloadFragments} /{' '}
                      {row.classical.transports[row.credentialRadio]?.payloadFragments}
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
          Fragments are counted per message (a payload of n bytes takes ceil(n / bound) fragments),
          so the public value and the ciphertext of a key agreement are never merged. Payload bounds
          and fit ratings describe this authored scenario, not universal NFC, BLE or UWB limits. BLE
          segmentation and reassembly depend on the negotiated MTU; the 512-byte assumption is not a
          general L2CAP ceiling. In your own tools, test the complete encoded exchange, framing,
          latency and supported transport profile before choosing a design.
        </p>
      </div>
    </div>
  )
}
