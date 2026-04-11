// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { DEVICE_CLASSES, CONSTRAINED_ALGORITHMS, type DeviceClass } from '../constants'
import { Button } from '@/components/ui/button'

export const ConstrainedAlgorithmExplorer: React.FC = () => {
  const [selectedClassIdx, setSelectedClassIdx] = useState(1)
  const selectedClass = DEVICE_CLASSES[selectedClassIdx]

  const algorithmFit = useMemo(() => {
    return CONSTRAINED_ALGORITHMS.map((alg) => {
      const fits = alg.suitableForClass.includes(selectedClassIdx)
      const ramPct = (alg.ramKB / selectedClass.ramKB) * 100
      // Consider "tight" if consuming > 50% of device RAM
      const tight = fits && ramPct > 50
      return { alg, fits, tight, ramPct: Math.min(ramPct, 100) }
    })
  }, [selectedClassIdx, selectedClass])

  const kems = algorithmFit.filter((a) => a.alg.type === 'KEM')
  const sigs = algorithmFit.filter((a) => a.alg.type === 'Signature')

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Select a device class to see which PQC algorithms fit within its resource constraints. Green
        means the algorithm fits comfortably, amber means it&apos;s tight (&gt;50% of available
        RAM), and red means it exceeds the device&apos;s capabilities.
      </p>

      {/* Device Class Selector */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Select Device Class</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DEVICE_CLASSES.map((dc, idx) => (
            <Button
              variant="ghost"
              key={dc.id}
              onClick={() => setSelectedClassIdx(idx)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                idx === selectedClassIdx
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-muted/30 text-muted-foreground hover:border-primary/30'
              }`}
            >
              <div className="text-sm font-bold">{dc.name}</div>
              <div className="text-xs mt-1">
                {dc.ramKB} KB RAM / {dc.flashKB} KB Flash
              </div>
              <div className="text-[10px] mt-1 text-muted-foreground">{dc.examples[0]}</div>
            </Button>
          ))}
        </div>
      </div>

      {/* Selected Device Info */}
      <DeviceInfoCard device={selectedClass} />

      {/* KEM Algorithms */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          Key Encapsulation (KEM) Algorithms
        </div>
        <div className="space-y-3">
          {kems.map(({ alg, fits, tight, ramPct }) => (
            <AlgorithmRow
              key={alg.name}
              name={alg.name}
              ramKB={alg.ramKB}
              deviceRamKB={selectedClass.ramKB}
              outputLabel="Ciphertext"
              outputBytes={alg.ciphertextOrSigBytes}
              publicKeyBytes={alg.publicKeyBytes}
              nistLevel={alg.nistLevel}
              quantumSafe={alg.quantumSafe}
              fits={fits}
              tight={tight}
              ramPct={ramPct}
              notes={alg.notes}
            />
          ))}
        </div>
      </div>

      {/* Signature Algorithms */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Signature Algorithms</div>
        <div className="space-y-3">
          {sigs.map(({ alg, fits, tight, ramPct }) => (
            <AlgorithmRow
              key={alg.name}
              name={alg.name}
              ramKB={alg.ramKB}
              deviceRamKB={selectedClass.ramKB}
              outputLabel="Signature"
              outputBytes={alg.ciphertextOrSigBytes}
              publicKeyBytes={alg.publicKeyBytes}
              nistLevel={alg.nistLevel}
              quantumSafe={alg.quantumSafe}
              fits={fits}
              tight={tight}
              ramPct={ramPct}
              notes={alg.notes}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <div className="text-xs font-bold text-foreground mb-2">{selectedClass.name} Summary</div>
        <p className="text-xs text-muted-foreground">
          {selectedClassIdx === 0 &&
            'Class 0 devices can only use LMS for signature verification (0.5 KB RAM, 56-byte public key). No PQC KEM fits \u2014 use pre-shared keys or gateway-mediated PQC.'}
          {selectedClassIdx === 1 &&
            'Class 1 devices can run ML-KEM-512 (3 KB) for key exchange and LMS/XMSS/FN-DSA for signatures. ML-DSA and ML-KEM-768 exceed the RAM budget.'}
          {selectedClassIdx === 2 &&
            'Class 2 devices support ML-KEM-512/768, ML-DSA-44, and all compact PQC signatures. Hybrid X25519 + ML-KEM-768 is tight but feasible.'}
          {selectedClassIdx === 3 &&
            'Class 3+ devices can run the full PQC suite including ML-KEM-1024 and ML-DSA-65. Hybrid modes are comfortable. Only FrodoKEM remains infeasible.'}
        </p>
      </div>
    </div>
  )
}

function DeviceInfoCard({ device }: { device: DeviceClass }) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-bold text-foreground">{device.name}</div>
        <div className="text-xs text-muted-foreground">RFC 7228</div>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{device.description}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-muted-foreground">RAM</div>
          <div className="text-sm font-bold font-mono text-foreground">{device.ramKB} KB</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Flash</div>
          <div className="text-sm font-bold font-mono text-foreground">{device.flashKB} KB</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">Examples</div>
          <div className="text-xs text-foreground">{device.examples.join(', ')}</div>
        </div>
      </div>
    </div>
  )
}

interface AlgorithmRowProps {
  name: string
  ramKB: number
  deviceRamKB: number
  outputLabel: string
  outputBytes: number
  publicKeyBytes: number
  nistLevel: number
  quantumSafe: boolean
  fits: boolean
  tight: boolean
  ramPct: number
  notes: string
}

function AlgorithmRow({
  name,
  ramKB,
  deviceRamKB,
  outputLabel,
  outputBytes,
  publicKeyBytes,
  nistLevel,
  quantumSafe,
  fits,
  tight,
  ramPct,
  notes,
}: AlgorithmRowProps) {
  return (
    <div
      className={`rounded-lg p-3 border ${
        !fits
          ? 'border-destructive/30 bg-destructive/5'
          : tight
            ? 'border-warning/30 bg-warning/5'
            : 'border-success/30 bg-success/5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {!fits ? (
            <XCircle size={16} className="text-destructive" />
          ) : tight ? (
            <AlertTriangle size={16} className="text-warning" />
          ) : (
            <CheckCircle size={16} className="text-success" />
          )}
          <span className="text-sm font-bold text-foreground">{name}</span>
          {!quantumSafe && (
            <span className="text-[10px] bg-destructive/20 text-destructive rounded px-1.5 py-0.5">
              Classical
            </span>
          )}
          {quantumSafe && (
            <span className="text-[10px] bg-success/20 text-success rounded px-1.5 py-0.5">
              Level {nistLevel}
            </span>
          )}
        </div>
        <span
          className={`text-xs font-bold ${!fits ? 'text-destructive' : tight ? 'text-warning' : 'text-success'}`}
        >
          {!fits ? 'Too Large' : tight ? 'Tight Fit' : 'Fits'}
        </span>
      </div>

      {/* RAM Usage Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] mb-0.5">
          <span className="text-muted-foreground">
            RAM: {ramKB} KB / {deviceRamKB} KB
          </span>
          <span className="font-mono text-foreground">{ramPct.toFixed(0)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              !fits ? 'bg-destructive/60' : tight ? 'bg-warning/60' : 'bg-success/60'
            }`}
            style={{ width: `${Math.min(ramPct, 100)}%` }}
          />
        </div>
      </div>

      {/* Sizes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
        <div>
          <span className="text-muted-foreground">Public Key: </span>
          <span className="font-mono text-foreground">{publicKeyBytes.toLocaleString()} B</span>
        </div>
        <div>
          <span className="text-muted-foreground">{outputLabel}: </span>
          <span className="font-mono text-foreground">{outputBytes.toLocaleString()} B</span>
        </div>
      </div>

      <p className="text-[10px] text-muted-foreground mt-1">{notes}</p>
    </div>
  )
}
