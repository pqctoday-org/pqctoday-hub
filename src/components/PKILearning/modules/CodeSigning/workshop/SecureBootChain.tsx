// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import {
  Cpu,
  Shield,
  HardDrive,
  CircuitBoard,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle,
  Loader2,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  BOOT_CHAIN_STAGES,
  FIRMWARE_SIGNING_ALGORITHMS,
  MOCK_FIRMWARE_IMAGE,
  type FirmwareSigningAlgorithmId,
} from '../constants'

/** Map icon string names to actual components */
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Cpu,
  Shield,
  HardDrive,
  CircuitBoard,
}

/** Generate realistic-looking hex string */
function generateHex(bytes: number): string {
  const chars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < bytes * 2; i++) {
    result += chars[Math.floor(Math.random() * 16)]
  }
  return result
}

/** Algorithm-specific detail for each boot chain stage */
const STAGE_DETAILS: Record<
  number,
  Record<FirmwareSigningAlgorithmId, { detail: string; verification: string }>
> = {
  0: {
    lms: {
      detail:
        'LMS public key (56 bytes) burned into OTP fuses or stored in TPM NVRAM. Compact size is ideal for hardware embedding where storage is extremely constrained.',
      verification:
        'ROM code reads the LMS public key from fuses and verifies the first-stage bootloader signature using SP 800-208 LMS verification.',
    },
    xmss: {
      detail:
        'XMSS public key (68 bytes) stored in secure element. Slightly larger than LMS but provides forward secrecy — past signatures remain valid even if the current key state is compromised.',
      verification:
        'ROM code reads the XMSS public key and verifies the bootloader signature. WOTS+ hash chain provides multi-target resistance.',
    },
    'ml-dsa': {
      detail:
        'ML-DSA-65 public key (1,952 bytes) stored in ROM. Significantly larger than LMS/XMSS, which may be prohibitive for the most constrained embedded platforms.',
      verification:
        'ROM code reads the ML-DSA public key and performs lattice-based signature verification. No state tracking needed — fully stateless operation.',
    },
  },
  1: {
    lms: {
      detail:
        'UEFI firmware stores the LMS verification key in the Secure Boot key database (db). Bootloader signature verified using the Merkle tree authentication path.',
      verification:
        'Secure Boot reads the LMS signature from the bootloader PE header, computes the hash over the bootloader image, and walks the Merkle authentication path to the root.',
    },
    xmss: {
      detail:
        'UEFI Secure Boot extended to support XMSS signatures. The XMSS public key is enrolled in the db alongside traditional X.509 certificates.',
      verification:
        'Bootloader signature verified using XMSS WOTS+ chain. The bitmask-based hash tree construction provides stronger multi-target resistance than LMS.',
    },
    'ml-dsa': {
      detail:
        'ML-DSA-65 public key enrolled in UEFI Secure Boot key database. Standard X.509 certificate wrapping with ML-DSA as the signature algorithm.',
      verification:
        'Bootloader signature verified using ML-DSA lattice reduction. Verification is fast (~0.2 ms) and requires no state management — each verification is independent.',
    },
  },
  2: {
    lms: {
      detail:
        'OS kernel image signed with LMS. Each kernel build consumes one leaf from the Merkle tree. Build pipeline must track state counter to prevent leaf reuse.',
      verification:
        'Boot manager verifies the kernel signature against the LMS public key from the bootloader stage. TPM PCR registers extended with kernel measurement.',
    },
    xmss: {
      detail:
        'OS kernel signed with XMSS. Forward secrecy means a compromised signing key cannot be used to forge signatures for previously released kernel versions.',
      verification:
        'Kernel signature verified with XMSS. Measured boot extends TPM PCRs. Remote attestation servers can verify the complete boot chain via PCR quotes.',
    },
    'ml-dsa': {
      detail:
        'OS kernel signed with ML-DSA-65. Stateless signing means no leaf tracking — the same key can sign unlimited kernel builds without state management.',
      verification:
        'Standard ML-DSA verification. No counter state to validate. Measured boot extends TPM PCRs identically to the stateful approaches.',
    },
  },
  3: {
    lms: {
      detail:
        'Device firmware (NIC, GPU, BMC) signed with LMS. Firmware updates are infrequent — a tree height of H=20 provides over 1 million signing operations, sufficient for most device lifetimes.',
      verification:
        'Firmware update service verifies the LMS signature before flashing. State counter advances atomically — if power is lost mid-update, the counter is not incremented.',
    },
    xmss: {
      detail:
        'Device firmware signed with XMSS. BSI (German Federal Office for Information Security) recommends XMSS for firmware signing in European government systems.',
      verification:
        'Firmware image hash verified against XMSS signature. The forward secrecy property prevents retroactive forgery of previously deployed firmware versions.',
    },
    'ml-dsa': {
      detail:
        'Device firmware signed with ML-DSA-65. The larger signature (3,309 bytes vs ~2,500 bytes for LMS/XMSS) adds minimal overhead relative to typical firmware image sizes (megabytes).',
      verification:
        'ML-DSA signature verification is fast and stateless. Ideal for constrained devices that cannot maintain a secure state counter.',
    },
  },
}

interface SigningResult {
  algorithm: FirmwareSigningAlgorithmId
  hash: string
  signature: string
  stateIndex: number | null
  timestamp: string
}

export const SecureBootChain: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<FirmwareSigningAlgorithmId>('lms')
  const [activeStage, setActiveStage] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(-1)
  const [signingResult, setSigningResult] = useState<SigningResult | null>(null)
  const [stateCounter, setStateCounter] = useState(0)

  const activeAlgorithm = FIRMWARE_SIGNING_ALGORITHMS.find((a) => a.id === selectedAlgorithm)!

  const handleNextStage = useCallback(() => {
    if (activeStage < BOOT_CHAIN_STAGES.length - 1) {
      setActiveStage((prev) => prev + 1)
    }
  }, [activeStage])

  const handlePrevStage = useCallback(() => {
    if (activeStage > 0) {
      setActiveStage((prev) => prev - 1)
    }
  }, [activeStage])

  const handleReset = () => {
    setActiveStage(0)
    setSigningResult(null)
    setSimulationStep(-1)
    setStateCounter(0)
  }

  const handleSignFirmware = useCallback(async () => {
    setIsSimulating(true)
    setSigningResult(null)
    setSimulationStep(0)

    const isStateful = selectedAlgorithm !== 'ml-dsa'
    const steps = isStateful
      ? [
          `Computing SHA-256 digest of firmware image (${MOCK_FIRMWARE_IMAGE.sizeKB.toLocaleString()} KB)...`,
          `Generating ${activeAlgorithm.name} signature over digest...`,
          `Advancing state counter: leaf ${stateCounter} \u2192 leaf ${stateCounter + 1}`,
          'Embedding signature in firmware image header...',
          'Verifying signature against root of trust public key...',
        ]
      : [
          `Computing SHA-256 digest of firmware image (${MOCK_FIRMWARE_IMAGE.sizeKB.toLocaleString()} KB)...`,
          `Generating ${activeAlgorithm.name} signature over digest...`,
          'Embedding signature in firmware image header...',
          'Verifying signature against root of trust public key...',
        ]

    for (let i = 0; i < steps.length; i++) {
      setSimulationStep(i)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    const newStateIndex = isStateful ? stateCounter + 1 : null
    if (isStateful) setStateCounter((prev) => prev + 1)

    setSigningResult({
      algorithm: selectedAlgorithm,
      hash: generateHex(32),
      signature: generateHex(activeAlgorithm.signatureSize),
      stateIndex: newStateIndex,
      timestamp: new Date().toISOString(),
    })
    setSimulationStep(-1)
    setIsSimulating(false)
  }, [selectedAlgorithm, activeAlgorithm, stateCounter])

  const simulationSteps =
    selectedAlgorithm !== 'ml-dsa'
      ? [
          `Computing SHA-256 digest of firmware image (${MOCK_FIRMWARE_IMAGE.sizeKB.toLocaleString()} KB)...`,
          `Generating ${activeAlgorithm.name} signature over digest...`,
          `Advancing state counter: leaf ${stateCounter} \u2192 leaf ${stateCounter + 1}`,
          'Embedding signature in firmware image header...',
          'Verifying signature against root of trust public key...',
        ]
      : [
          `Computing SHA-256 digest of firmware image (${MOCK_FIRMWARE_IMAGE.sizeKB.toLocaleString()} KB)...`,
          `Generating ${activeAlgorithm.name} signature over digest...`,
          'Embedding signature in firmware image header...',
          'Verifying signature against root of trust public key...',
        ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">
          Secure Boot &amp; Firmware Signing
        </h3>
        <p className="text-sm text-muted-foreground">
          Explore the boot trust chain and compare firmware signing algorithms. Step through each
          stage to understand how <InlineTooltip term="Secure Boot">Secure Boot</InlineTooltip>{' '}
          verifies integrity from hardware root of trust to runtime firmware, and why{' '}
          <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> mandates stateful hash-based
          signatures for this use case.
        </p>
      </div>

      {/* Algorithm Selector */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">Firmware Signing Algorithm</h4>
        <div className="flex flex-wrap gap-2">
          {FIRMWARE_SIGNING_ALGORITHMS.map((alg) => (
            <Button
              variant="ghost"
              key={alg.id}
              onClick={() => {
                setSelectedAlgorithm(alg.id)
                setSigningResult(null)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedAlgorithm === alg.id
                  ? alg.stateful
                    ? 'bg-warning/20 text-warning border border-warning/50'
                    : 'bg-success/20 text-success border border-success/50'
                  : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
              }`}
            >
              <div>{alg.name}</div>
              <div className="text-[10px] opacity-70">
                {alg.stateful ? 'Stateful' : 'Stateless'} &middot; {alg.standard}
              </div>
            </Button>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Signature:{' '}
          <span className="font-mono">{activeAlgorithm.signatureSize.toLocaleString()}</span> bytes
          &middot; Public key:{' '}
          <span className="font-mono">{activeAlgorithm.publicKeySize.toLocaleString()}</span> bytes
          &middot; Verify: {activeAlgorithm.verificationSpeed}
          {activeAlgorithm.stateful && (
            <span className="text-warning"> &middot; State counter required</span>
          )}
        </div>
      </div>

      {/* Firmware Image Info */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu size={16} className="text-primary" />
          <h4 className="text-sm font-bold text-foreground">Firmware Image</h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Name</div>
            <div className="text-sm font-mono text-foreground">{MOCK_FIRMWARE_IMAGE.name}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Version</div>
            <div className="text-sm font-mono text-foreground">v{MOCK_FIRMWARE_IMAGE.version}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Target</div>
            <div className="text-sm font-mono text-foreground">{MOCK_FIRMWARE_IMAGE.target}</div>
          </div>
          <div className="bg-muted/50 rounded-lg p-2 border border-border">
            <div className="text-[10px] text-muted-foreground">Size</div>
            <div className="text-sm font-mono text-foreground">
              {MOCK_FIRMWARE_IMAGE.sizeKB.toLocaleString()} KB
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="text-[10px] font-bold text-muted-foreground mb-1">Components</div>
          <div className="bg-background rounded p-2 border border-border">
            {MOCK_FIRMWARE_IMAGE.components.map((file) => (
              <div key={file} className="flex items-center gap-2 py-0.5">
                <FileText size={10} className="text-muted-foreground shrink-0" />
                <span className="font-mono text-[11px] text-foreground">{file}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Boot Trust Chain — Vertical Stepper */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-4">Boot Trust Chain</h4>
        <div className="space-y-1">
          {BOOT_CHAIN_STAGES.map((stage, idx) => {
            const StageIcon = ICON_MAP[stage.icon] ?? Cpu
            const isActive = idx === activeStage
            const isCompleted = idx < activeStage
            const isFuture = idx > activeStage
            const stageDetail = STAGE_DETAILS[idx]?.[selectedAlgorithm]

            return (
              <div key={stage.stage} className="flex items-stretch gap-3">
                {/* Vertical line + icon */}
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveStage(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 ${
                      isActive
                        ? 'border-primary text-primary bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
                        : isCompleted
                          ? 'border-success text-success bg-success/10'
                          : 'border-border text-muted-foreground bg-muted/50'
                    }`}
                    aria-label={`Stage ${stage.stage}: ${stage.title}`}
                  >
                    {isCompleted ? <CheckCircle size={14} /> : <StageIcon size={14} />}
                  </Button>
                  {idx < BOOT_CHAIN_STAGES.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-[16px] ${
                        isCompleted ? 'bg-success/50' : 'bg-border'
                      }`}
                    />
                  )}
                </div>

                {/* Stage content */}
                <div className={`flex-1 pb-4 ${isFuture ? 'opacity-40' : ''}`}>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveStage(idx)}
                    className="text-left w-full"
                  >
                    <div
                      className={`text-sm font-bold ${
                        isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {stage.stage}. {stage.title}
                    </div>
                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                  </Button>

                  {/* Expanded detail for active stage */}
                  {isActive && stageDetail && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/50 rounded-lg p-2 border border-border">
                          <span className="text-muted-foreground font-medium">Component:</span>{' '}
                          <span className="text-foreground">{stage.component}</span>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2 border border-border">
                          <span className="text-muted-foreground font-medium">Verifies:</span>{' '}
                          <span className="text-foreground">{stage.verifies}</span>
                        </div>
                      </div>
                      <div
                        className={`rounded-lg p-3 border ${
                          activeAlgorithm.stateful
                            ? 'bg-warning/5 border-warning/20'
                            : 'bg-success/5 border-success/20'
                        }`}
                      >
                        <div className="text-xs font-bold text-foreground mb-1">
                          {activeAlgorithm.name} at this stage
                        </div>
                        <p className="text-xs text-muted-foreground">{stageDetail.detail}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 border border-border">
                        <div className="text-xs font-bold text-foreground mb-1">
                          Verification process
                        </div>
                        <p className="text-xs text-muted-foreground">{stageDetail.verification}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevStage}
          disabled={activeStage === 0}
          className="text-sm"
        >
          <ChevronLeft size={14} className="mr-1" /> Previous
        </Button>
        <Button variant="ghost" onClick={handleReset} className="text-sm">
          <RotateCcw size={14} className="mr-1" /> Reset
        </Button>
        <Button
          variant="outline"
          onClick={handleNextStage}
          disabled={activeStage === BOOT_CHAIN_STAGES.length - 1}
          className="text-sm"
        >
          Next <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* State Counter (LMS / XMSS only) */}
      {activeAlgorithm.stateful && (
        <div className="rounded-lg p-4 border border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-sm font-bold text-foreground">
              State Counter ({activeAlgorithm.name})
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-background rounded-lg p-3 border border-border font-mono text-center">
              <div className="text-[10px] text-muted-foreground mb-1">Current Leaf Index</div>
              <div className="text-2xl font-bold text-warning">{stateCounter}</div>
            </div>
            <div className="text-xs text-muted-foreground flex-1">
              <p>{activeAlgorithm.stateRequirement}</p>
              <p className="mt-1">
                Each signing operation advances the counter by 1. Reusing a leaf index is{' '}
                <strong className="text-destructive">catastrophic</strong> — it reveals the private
                key material.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sign Firmware Button */}
      <div className="flex justify-center">
        <Button
          variant="gradient"
          onClick={handleSignFirmware}
          disabled={isSimulating}
          className="text-sm px-6"
        >
          {isSimulating ? (
            <>
              <Loader2 size={14} className="animate-spin mr-2" /> Signing Firmware...
            </>
          ) : (
            <>
              <Shield size={14} className="mr-2" /> Sign Firmware Image
            </>
          )}
        </Button>
      </div>

      {/* Signing Steps Animation */}
      {isSimulating && (
        <div className="glass-panel p-4 animate-fade-in">
          <h4 className="text-sm font-bold text-foreground mb-3">Firmware Signing Progress</h4>
          <div className="space-y-2">
            {simulationSteps.map((step, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 text-sm transition-opacity ${
                  idx <= simulationStep ? 'opacity-100' : 'opacity-30'
                }`}
              >
                {idx < simulationStep ? (
                  <CheckCircle size={14} className="text-success shrink-0" />
                ) : idx === simulationStep ? (
                  <Loader2 size={14} className="animate-spin text-primary shrink-0" />
                ) : (
                  <div className="w-3.5 h-3.5 rounded-full border border-border shrink-0" />
                )}
                <span
                  className={`font-mono text-xs ${idx <= simulationStep ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signing Result */}
      {signingResult && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-panel p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle size={16} className="text-success" />
              <h4 className="text-sm font-bold text-foreground">Firmware Signed Successfully</h4>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-2">
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Algorithm:</span>{' '}
                <span className="font-mono text-foreground">{activeAlgorithm.name}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">SHA-256 Digest:</span>{' '}
                <span className="font-mono text-foreground">{signingResult.hash}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Signature Size:</span>{' '}
                <span className="font-mono text-foreground">
                  {activeAlgorithm.signatureSize.toLocaleString()} bytes
                </span>
              </div>
              {signingResult.stateIndex !== null && (
                <div className="text-xs">
                  <span className="text-muted-foreground font-medium">State Counter:</span>{' '}
                  <span className="font-mono text-warning">
                    leaf {signingResult.stateIndex - 1} &rarr; leaf {signingResult.stateIndex}
                  </span>
                </div>
              )}
              <div className="text-xs">
                <span className="text-muted-foreground font-medium">Timestamp:</span>{' '}
                <span className="font-mono text-foreground">{signingResult.timestamp}</span>
              </div>
            </div>

            {/* Firmware Header Structure */}
            <div className="mt-3">
              <div className="text-xs font-bold text-foreground mb-2">Firmware Image Header</div>
              <div className="bg-background rounded-lg p-3 border border-border font-mono text-[11px] text-foreground space-y-1">
                <div className="text-muted-foreground">
                  # fwupd verify {MOCK_FIRMWARE_IMAGE.name}-{MOCK_FIRMWARE_IMAGE.version}.bin
                </div>
                <div>
                  <span className="text-primary">Target:</span> {MOCK_FIRMWARE_IMAGE.target}
                </div>
                <div>
                  <span className="text-primary">Algorithm:</span> {activeAlgorithm.name} (
                  {activeAlgorithm.standard})
                </div>
                <div>
                  <span className="text-primary">Hash:</span> SHA-256
                </div>
                <div>
                  <span className="text-primary">Digest:</span> {signingResult.hash.slice(0, 32)}
                  ...
                </div>
                <div>
                  <span className="text-primary">Signature:</span>{' '}
                  {activeAlgorithm.signatureSize.toLocaleString()} bytes
                </div>
                <div className="ml-4 text-[10px] text-muted-foreground break-all">
                  {signingResult.signature.slice(0, 128)}...
                </div>
                <div>
                  <span className="text-primary">Public Key:</span>{' '}
                  {activeAlgorithm.publicKeySize.toLocaleString()} bytes
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className="rounded-lg p-4 border bg-success/10 border-success/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-success" />
              <span className="text-sm font-bold text-success">
                Firmware Signature Verified &mdash; Boot Authorized
              </span>
            </div>
            <div className="font-mono text-[11px] text-foreground space-y-1">
              <div className="text-muted-foreground">
                $ fwupdtool verify-update {MOCK_FIRMWARE_IMAGE.name}-{MOCK_FIRMWARE_IMAGE.version}
                .bin
              </div>
              <div>
                {MOCK_FIRMWARE_IMAGE.name}-{MOCK_FIRMWARE_IMAGE.version}.bin: signature valid (
                {activeAlgorithm.name})
              </div>
              <div>
                Trust chain: Root of Trust &rarr; Bootloader &rarr; OS &rarr; Firmware &bull; OK
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Algorithm Comparison Table */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Firmware Signing Algorithm Comparison
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right p-2 text-muted-foreground font-medium">Sig Size</th>
                <th className="text-right p-2 text-muted-foreground font-medium">Key Size</th>
                <th className="text-center p-2 text-muted-foreground font-medium">Stateful</th>
                <th className="text-left p-2 text-muted-foreground font-medium">CNSA 2.0</th>
                <th className="text-left p-2 text-muted-foreground font-medium hidden sm:table-cell">
                  Best For
                </th>
              </tr>
            </thead>
            <tbody>
              {FIRMWARE_SIGNING_ALGORITHMS.map((alg) => (
                <tr
                  key={alg.id}
                  className={`border-b border-border/50 ${alg.id === selectedAlgorithm ? 'bg-primary/5' : ''}`}
                >
                  <td className="p-2 font-medium text-foreground">
                    {alg.name}
                    {alg.id === selectedAlgorithm && (
                      <span className="ml-2 text-[10px] text-primary font-bold">(selected)</span>
                    )}
                  </td>
                  <td className="p-2 text-right font-mono text-xs text-foreground">
                    {alg.signatureSize.toLocaleString()} B
                  </td>
                  <td className="p-2 text-right font-mono text-xs text-foreground">
                    {alg.publicKeySize.toLocaleString()} B
                  </td>
                  <td className="p-2 text-center">
                    {alg.stateful ? (
                      <span className="text-warning font-bold text-xs">Yes</span>
                    ) : (
                      <span className="text-success font-bold text-xs">No</span>
                    )}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {alg.id === 'lms' ? (
                      <span className="text-success font-bold">Mandated</span>
                    ) : alg.id === 'xmss' ? (
                      <span className="text-warning">Accepted</span>
                    ) : (
                      <span className="text-muted-foreground">Not required</span>
                    )}
                  </td>
                  <td className="p-2 text-xs text-muted-foreground hidden sm:table-cell">
                    {alg.bestFor}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CNSA 2.0 Timeline */}
      <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
        <div className="text-xs font-bold text-primary mb-2">
          CNSA 2.0 Firmware Signing Timeline
        </div>
        <div className="space-y-2">
          {[
            {
              year: '2025',
              text: 'New software and firmware should support and prefer CNSA 2.0 algorithms (LMS/XMSS)',
            },
            {
              year: '2030',
              text: 'All deployed National Security Systems must use CNSA 2.0 signatures for firmware and software',
            },
            {
              year: '2033\u201335',
              text: 'Full quantum-resistant enforcement across all NSS cryptographic operations',
            },
          ].map((milestone) => (
            <div key={milestone.year} className="flex items-start gap-3">
              <span className="text-xs font-bold text-primary bg-primary/10 rounded px-2 py-0.5 shrink-0">
                {milestone.year}
              </span>
              <p className="text-xs text-muted-foreground">{milestone.text}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Firmware signing was prioritized ahead of general PQC because firmware keys have
          10&ndash;20 year lifetimes. Devices deployed today will still be in the field when
          cryptographically relevant quantum computers arrive.
        </p>
      </div>

      {/* Cross-reference to Stateful Signatures module */}
      {activeAlgorithm.stateful && (
        <div className="rounded-lg p-4 border border-warning/20 bg-warning/5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-warning" />
            <span className="text-sm font-bold text-foreground">State Management Deep Dive</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Stateful signatures require careful operational procedures &mdash; the state counter
            must be persisted atomically, never cloned, and never rolled back. A single leaf reuse
            catastrophically compromises the entire key. For a detailed exploration of Merkle tree
            mechanics, parameter selection, and state management risks, see the{' '}
            <Link
              to="/learn/stateful-signatures"
              className="text-primary hover:underline font-bold"
            >
              Stateful Hash Signatures module
            </Link>
            .
          </p>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> This simulation demonstrates the secure boot trust chain and
          firmware signing workflow with realistic data structures and signature sizes. In
          production, firmware signing keys are managed in FIPS 140-validated HSMs, and the boot
          chain verification happens in hardware (TPM, secure elements). All keys and signatures
          shown are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
