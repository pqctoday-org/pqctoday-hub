// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useCallback } from 'react'
import { FileCode, CheckCircle, Loader2, ArrowDown } from 'lucide-react'
import {
  IOT_DEVICE_TYPES,
  IOT_FIRMWARE_ALGORITHMS,
  buildSUITManifest,
  type IoTDeviceType,
  type IoTFirmwareAlgorithm,
} from '../constants'
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'

const IOT_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'iot-constrained-decap',
    useCase: 'Constrained device key exchange',
    standard: 'IEC 62443 + FIPS 203 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203',
    kind: { type: 'mlkem-decap', variant: 512 },
  },
  {
    id: 'iot-firmware-sigver',
    useCase: 'Embedded firmware signing',
    standard: 'IEC 62443 + FIPS 204 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-DSA-sigGen-FIPS204',
    kind: { type: 'mldsa-sigver', variant: 44 },
  },
  {
    id: 'iot-dtls-decap',
    useCase: 'DTLS session key (Level 2 OT)',
    standard: 'IEC 62443 + FIPS 203 ACVP',
    referenceUrl:
      'https://github.com/usnistgov/ACVP-Server/tree/master/gen-val/json-files/ML-KEM-encapDecap-FIPS203',
    kind: { type: 'mlkem-decap', variant: 768 },
  },
]

type SimPhase = 'idle' | 'hashing' | 'signing' | 'manifest' | 'verifying' | 'done'

function randomHex(len: number): string {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('')
}

export const FirmwareSigningSimulator: React.FC = () => {
  const [deviceIdx, setDeviceIdx] = useState(0)
  const [algoIdx, setAlgoIdx] = useState(0)
  const [phase, setPhase] = useState<SimPhase>('idle')
  const [firmwareHash, setFirmwareHash] = useState('')
  const [signature, setSignature] = useState('')
  const [stateCounter, setStateCounter] = useState(0)

  const device = IOT_DEVICE_TYPES[deviceIdx]
  const algo = IOT_FIRMWARE_ALGORITHMS[algoIdx]

  const totalOverheadBytes = algo.signatureBytes + algo.publicKeyBytes
  const transferTimeSec = (totalOverheadBytes * 8) / (device.bandwidthKbps * 1000)

  const runSimulation = useCallback(async () => {
    setPhase('hashing')
    const hash = randomHex(32)
    setFirmwareHash(hash)
    await new Promise((r) => setTimeout(r, 800))

    setPhase('signing')
    if (algo.stateful) {
      setStateCounter((c) => c + 1)
    }
    const sig = randomHex(Math.min(algo.signatureBytes, 64))
    setSignature(sig + '...')
    await new Promise((r) => setTimeout(r, 1000))

    setPhase('manifest')
    await new Promise((r) => setTimeout(r, 600))

    setPhase('verifying')
    await new Promise((r) => setTimeout(r, 500))

    setPhase('done')
  }, [algo])

  const manifest =
    phase === 'manifest' || phase === 'verifying' || phase === 'done'
      ? buildSUITManifest(device, algo, firmwareHash)
      : []

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Select a device type and signing algorithm, then sign a simulated firmware image. Observe
        the signature size, SUIT manifest, and bandwidth impact on constrained networks.
      </p>

      {/* Device Selection */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">1. Select Device Type</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {IOT_DEVICE_TYPES.map((d, idx) => (
            <button
              key={d.id}
              onClick={() => {
                setDeviceIdx(idx)
                setPhase('idle')
              }}
              className={`p-3 rounded-lg border text-left transition-colors ${
                idx === deviceIdx
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-primary/30'
              }`}
            >
              <div className="text-sm font-bold text-foreground">{d.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Class {d.deviceClass} &middot; {d.connectivity}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {d.bandwidthKbps >= 1000
                  ? `${(d.bandwidthKbps / 1000).toFixed(0)} Mbps`
                  : `${d.bandwidthKbps} kbps`}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Algorithm Selection */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">2. Select Signing Algorithm</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {IOT_FIRMWARE_ALGORITHMS.map((a, idx) => (
            <button
              key={a.id}
              onClick={() => {
                setAlgoIdx(idx)
                setPhase('idle')
              }}
              className={`p-3 rounded-lg border text-left transition-colors ${
                idx === algoIdx
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-muted/30 hover:border-primary/30'
              }`}
            >
              <div className="text-sm font-bold text-foreground">{a.name}</div>
              <div className="text-[10px] text-muted-foreground mt-1">
                Sig: {a.signatureBytes.toLocaleString()} B &middot; Key: {a.publicKeyBytes} B
              </div>
              <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                {a.stateful ? 'Stateful' : 'Stateless'} &middot;{' '}
                <span
                  className={`font-bold ${
                    a.verifySpeed === 'fastest'
                      ? 'text-success'
                      : a.verifySpeed === 'fast'
                        ? 'text-primary'
                        : 'text-warning'
                  }`}
                >
                  {a.verifySpeed === 'fastest'
                    ? 'Fastest'
                    : a.verifySpeed === 'fast'
                      ? 'Fast'
                      : 'Moderate'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sign Button */}
      <div className="text-center">
        <button
          onClick={runSimulation}
          disabled={phase !== 'idle' && phase !== 'done'}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <FileCode size={18} />
          {phase === 'done' ? 'Sign Again' : 'Sign Firmware Image'}
        </button>
      </div>

      {/* Simulation Flow */}
      {phase !== 'idle' && (
        <div className="glass-panel p-4 space-y-4">
          <PhaseStep
            label="1. Hash firmware image"
            active={phase === 'hashing'}
            done={phase !== 'hashing'}
            detail={firmwareHash ? `SHA-256: ${firmwareHash.slice(0, 32)}...` : undefined}
          />
          <div className="flex justify-center">
            <ArrowDown size={16} className="text-muted-foreground" />
          </div>
          <PhaseStep
            label={`2. Sign hash with ${algo.name}`}
            active={phase === 'signing'}
            done={['manifest', 'verifying', 'done'].includes(phase)}
            detail={
              signature
                ? `Signature (${algo.signatureBytes} B): ${signature.slice(0, 32)}...`
                : undefined
            }
          />
          {algo.stateful && (
            <div className="ml-8 text-[10px] text-warning font-mono">
              State counter: {stateCounter} (monotonic, never rollback)
            </div>
          )}
          <div className="flex justify-center">
            <ArrowDown size={16} className="text-muted-foreground" />
          </div>
          <PhaseStep
            label="3. Build SUIT manifest (RFC 9019)"
            active={phase === 'manifest'}
            done={['verifying', 'done'].includes(phase)}
          />
          <div className="flex justify-center">
            <ArrowDown size={16} className="text-muted-foreground" />
          </div>
          <PhaseStep
            label="4. Verify signature"
            active={phase === 'verifying'}
            done={phase === 'done'}
            detail={
              phase === 'done'
                ? `Verified \u2014 ${algo.verifySpeed === 'fastest' ? 'Fastest PQC verifier on constrained MCUs' : algo.verifySpeed === 'fast' ? 'Fast verification on constrained MCUs' : 'Moderate verification speed on constrained MCUs'}`
                : undefined
            }
          />
        </div>
      )}

      {/* SUIT Manifest Display */}
      {manifest.length > 0 && (
        <div className="glass-panel p-4">
          <div className="text-sm font-bold text-foreground mb-3">SUIT Manifest</div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border font-mono text-xs space-y-1">
            {manifest.map((f) => (
              <div key={f.field} className="flex flex-col sm:flex-row sm:items-start gap-1">
                <span className="text-primary font-bold shrink-0 sm:w-48">{f.field}:</span>
                <span className="text-foreground break-all">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bandwidth Impact */}
      {phase === 'done' && (
        <BandwidthImpact
          device={device}
          algo={algo}
          totalOverhead={totalOverheadBytes}
          transferTime={transferTimeSec}
        />
      )}

      <KatValidationPanel
        specs={IOT_KAT_SPECS}
        label="IoT/OT Firmware PQC Known Answer Tests"
        authorityNote="IEC 62443 · NIST FIPS 203/204"
      />
    </div>
  )
}

function PhaseStep({
  label,
  active,
  done,
  detail,
}: {
  label: string
  active: boolean
  done: boolean
  detail?: string
}) {
  return (
    <div
      className={`rounded-lg p-3 border transition-colors ${
        active
          ? 'border-primary bg-primary/10'
          : done
            ? 'border-success/30 bg-success/5'
            : 'border-border bg-muted/30'
      }`}
    >
      <div className="flex items-center gap-2">
        {active && <Loader2 size={14} className="text-primary animate-spin" />}
        {done && <CheckCircle size={14} className="text-success" />}
        {!active && !done && <div className="w-3.5 h-3.5 rounded-full border border-border" />}
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {detail && (
        <div className="mt-1 ml-6 text-[10px] font-mono text-muted-foreground break-all">
          {detail}
        </div>
      )}
    </div>
  )
}

function BandwidthImpact({
  device,
  algo,
  totalOverhead,
  transferTime,
}: {
  device: IoTDeviceType
  algo: IoTFirmwareAlgorithm
  totalOverhead: number
  transferTime: number
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
      <div className="text-sm font-bold text-foreground mb-3">Bandwidth Impact Analysis</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground">Signature</div>
          <div className="text-sm font-bold font-mono text-foreground">
            {algo.signatureBytes.toLocaleString()} B
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Public Key</div>
          <div className="text-sm font-bold font-mono text-foreground">
            {algo.publicKeyBytes.toLocaleString()} B
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Total Overhead</div>
          <div className="text-sm font-bold font-mono text-foreground">
            {totalOverhead.toLocaleString()} B
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">
            Transfer Time ({device.connectivity})
          </div>
          <div className="text-sm font-bold font-mono text-foreground">
            {transferTime < 0.01
              ? '<0.01 s'
              : transferTime < 1
                ? `${(transferTime * 1000).toFixed(0)} ms`
                : `${transferTime.toFixed(2)} s`}
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">
        Over {device.connectivity} at{' '}
        {device.bandwidthKbps >= 1000
          ? `${(device.bandwidthKbps / 1000).toFixed(0)} Mbps`
          : `${device.bandwidthKbps} kbps`}
        , the cryptographic overhead adds{' '}
        {transferTime < 0.01
          ? 'negligible'
          : transferTime < 1
            ? `${(transferTime * 1000).toFixed(0)} ms`
            : `${transferTime.toFixed(2)} seconds`}{' '}
        to the firmware delivery. The firmware payload itself ({device.firmwareSizeKB} KB) dominates
        the transfer.
      </p>
    </div>
  )
}
