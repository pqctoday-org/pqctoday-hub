// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import {
  User,
  Key,
  FileCheck,
  PenLine,
  Database,
  Trash2,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SIGSTORE_STEPS } from '../constants'

/** Map icon string names to actual components */
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  User,
  Key,
  FileCheck,
  PenLine,
  Database,
  Trash2,
  CheckCircle,
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

interface LogEntry {
  uuid: string
  logIndex: number
  body: string
  integratedTime: string
  logID: string
}

function generateLogEntry(): LogEntry {
  return {
    uuid: generateHex(32),
    logIndex: Math.floor(Math.random() * 90000000) + 10000000,
    body: generateHex(256),
    integratedTime: new Date().toISOString(),
    logID: generateHex(32),
  }
}

const STEP_DETAILS: Record<number, { classical: string; pqc: string; detail: string }> = {
  1: {
    classical: 'OIDC token (ECDSA P-256 proof-of-possession)',
    pqc: 'OIDC token (ECDSA P-256 proof-of-possession)',
    detail:
      'The developer logs in via GitHub/Google/Microsoft OIDC. The identity provider issues a JWT that Fulcio uses to bind an identity to a certificate. This step is algorithm-agnostic.',
  },
  2: {
    classical: 'ECDSA P-256 keypair (valid ~20 min)',
    pqc: 'ML-DSA-65 keypair (valid ~20 min)',
    detail:
      "A short-lived keypair is generated locally. The private key never leaves the developer's machine and is automatically destroyed after signing. Key size: ECDSA = 32 bytes, ML-DSA-65 = 1,952 bytes.",
  },
  3: {
    classical: 'X.509 cert with ECDSA P-256 public key',
    pqc: 'X.509 cert with ML-DSA-65 public key',
    detail:
      'Fulcio issues a certificate binding the OIDC identity (e.g., "user@github.com") to the ephemeral public key. The cert is short-lived (~20 minutes) and logged in a Certificate Transparency log.',
  },
  4: {
    classical: 'ECDSA signature (64 bytes)',
    pqc: 'ML-DSA-65 signature (3,309 bytes)',
    detail:
      'The artifact (e.g., container image, npm package) is hashed (SHA-256) and the hash is signed with the ephemeral private key. This is the core signing operation.',
  },
  5: {
    classical: 'Rekor entry with ECDSA signature (~200 bytes total)',
    pqc: 'Rekor entry with ML-DSA-65 signature (~3,600 bytes total)',
    detail:
      'The signature, certificate, and artifact hash are recorded in Rekor, an immutable, append-only transparency log. Each entry gets a unique log index and UUID. Once recorded, the entry cannot be modified or deleted.',
  },
  6: {
    classical: 'ECDSA private key securely erased',
    pqc: 'ML-DSA-65 private key securely erased',
    detail:
      'The ephemeral private key is destroyed immediately after signing. There is no long-term key to protect, rotate, or revoke. The transparency log serves as the permanent proof that the signature was valid at the time of signing.',
  },
  7: {
    classical: 'Verify ECDSA sig + cert chain + Rekor inclusion',
    pqc: 'Verify ML-DSA-65 sig + cert chain + Rekor inclusion',
    detail:
      "Verification checks three things: (1) the signature is valid for the artifact hash, (2) the certificate chains to Fulcio's root CA, and (3) the Rekor log contains a matching entry. No public keys need to be distributed.",
  },
}

export const SigstoreFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [compareMode, setCompareMode] = useState<'classical' | 'pqc'>('pqc')
  const [logEntry, setLogEntry] = useState<LogEntry | null>(null)
  const [showLogEntry, setShowLogEntry] = useState(false)

  const currentSigstoreStep = SIGSTORE_STEPS[activeStep]
  const stepDetail = STEP_DETAILS[currentSigstoreStep.step]

  const handleNext = useCallback(() => {
    if (activeStep < SIGSTORE_STEPS.length - 1) {
      setActiveStep((prev) => prev + 1)
      // Generate log entry when reaching the transparency log step
      if (activeStep + 1 === 4) {
        setLogEntry(generateLogEntry())
      }
    }
  }, [activeStep])

  const handlePrev = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1)
    }
  }, [activeStep])

  const handleReset = () => {
    setActiveStep(0)
    setLogEntry(null)
    setShowLogEntry(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Sigstore Keyless Signing Flow</h3>
        <p className="text-sm text-muted-foreground">
          Step through the 7 stages of Sigstore keyless signing. Compare how classical ECDSA and PQC
          ML-DSA-65 differ at each stage.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => setCompareMode('classical')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            compareMode === 'classical'
              ? 'bg-warning/20 text-warning border border-warning/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-warning/30'
          }`}
        >
          Classical (ECDSA P-256)
        </Button>
        <Button
          variant="ghost"
          onClick={() => setCompareMode('pqc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            compareMode === 'pqc'
              ? 'bg-success/20 text-success border border-success/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-success/30'
          }`}
        >
          PQC (ML-DSA-65)
        </Button>
      </div>

      {/* Vertical Stepper */}
      <div className="glass-panel p-4">
        <div className="space-y-1">
          {SIGSTORE_STEPS.map((step, idx) => {
            const StepIcon = ICON_MAP[step.icon] ?? CheckCircle
            const isActive = idx === activeStep
            const isCompleted = idx < activeStep
            const isFuture = idx > activeStep

            return (
              <div key={step.step} className="flex items-stretch gap-3">
                {/* Vertical line + icon */}
                <div className="flex flex-col items-center">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveStep(idx)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors shrink-0 ${
                      isActive
                        ? 'border-primary text-primary bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.3)]'
                        : isCompleted
                          ? 'border-success text-success bg-success/10'
                          : 'border-border text-muted-foreground bg-muted/50'
                    }`}
                    aria-label={`Step ${step.step}: ${step.title}`}
                  >
                    {isCompleted ? <CheckCircle size={14} /> : <StepIcon size={14} />}
                  </Button>
                  {idx < SIGSTORE_STEPS.length - 1 && (
                    <div
                      className={`w-0.5 flex-1 min-h-[16px] ${
                        isCompleted ? 'bg-success/50' : 'bg-border'
                      }`}
                    />
                  )}
                </div>

                {/* Step content */}
                <div className={`flex-1 pb-4 ${isFuture ? 'opacity-40' : ''}`}>
                  <Button
                    variant="ghost"
                    onClick={() => setActiveStep(idx)}
                    className="text-left w-full"
                  >
                    <div
                      className={`text-sm font-bold ${
                        isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-foreground'
                      }`}
                    >
                      {step.step}. {step.title}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </Button>

                  {/* Expanded detail for active step */}
                  {isActive && stepDetail && (
                    <div className="mt-2 space-y-2 animate-fade-in">
                      <div
                        className={`rounded-lg p-3 border ${
                          compareMode === 'pqc'
                            ? 'bg-success/5 border-success/20'
                            : 'bg-warning/5 border-warning/20'
                        }`}
                      >
                        <div className="text-xs font-bold text-foreground mb-1">
                          {compareMode === 'pqc' ? 'PQC (ML-DSA-65)' : 'Classical (ECDSA P-256)'}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">
                          {compareMode === 'pqc' ? stepDetail.pqc : stepDetail.classical}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 border border-border">
                        <p className="text-xs text-muted-foreground">{stepDetail.detail}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={activeStep === 0}
          className="text-sm"
        >
          <ChevronLeft size={14} className="mr-1" /> Previous
        </Button>
        <Button variant="ghost" onClick={handleReset} className="text-sm">
          <RotateCcw size={14} className="mr-1" /> Reset
        </Button>
        <Button
          variant="outline"
          onClick={handleNext}
          disabled={activeStep === SIGSTORE_STEPS.length - 1}
          className="text-sm"
        >
          Next <ChevronRight size={14} className="ml-1" />
        </Button>
      </div>

      {/* Transparency Log Entry */}
      {logEntry && (
        <div className="glass-panel p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Database size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">Rekor Transparency Log Entry</h4>
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowLogEntry(!showLogEntry)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showLogEntry ? 'Collapse' : 'Expand'}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 border border-border space-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">UUID:</span>{' '}
              <span className="font-mono text-foreground">{logEntry.uuid}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Log Index:</span>{' '}
              <span className="font-mono text-foreground">
                {logEntry.logIndex.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Integrated Time:</span>{' '}
              <span className="font-mono text-foreground">{logEntry.integratedTime}</span>
            </div>
          </div>

          {showLogEntry && (
            <div className="mt-3 bg-background rounded-lg p-3 border border-border font-mono text-[11px] text-foreground animate-fade-in">
              <div className="text-muted-foreground mb-2">
                # rekor-cli get --uuid {logEntry.uuid.slice(0, 16)}...
              </div>
              <div className="space-y-1">
                <div>
                  <span className="text-primary">LogIndex:</span> {logEntry.logIndex}
                </div>
                <div>
                  <span className="text-primary">RekordObj:</span>
                </div>
                <div className="ml-4">
                  <span className="text-primary">Hash:</span>
                </div>
                <div className="ml-8">
                  <span className="text-muted-foreground">Algorithm:</span> sha256
                </div>
                <div className="ml-8">
                  <span className="text-muted-foreground">Value:</span> {generateHex(32)}
                </div>
                <div className="ml-4">
                  <span className="text-primary">Signature:</span>
                </div>
                <div className="ml-8">
                  <span className="text-muted-foreground">Format:</span>{' '}
                  {compareMode === 'pqc' ? 'ml-dsa-65' : 'x509'}
                </div>
                <div className="ml-8">
                  <span className="text-muted-foreground">Content:</span>{' '}
                  {compareMode === 'pqc' ? '3,309 bytes' : '64 bytes'}
                </div>
                <div className="ml-4">
                  <span className="text-primary">PublicKey:</span>
                </div>
                <div className="ml-8">
                  <span className="text-muted-foreground">Content:</span>{' '}
                  {compareMode === 'pqc' ? '1,952 bytes (ML-DSA-65)' : '65 bytes (ECDSA P-256)'}
                </div>
                <div>
                  <span className="text-primary">IntegratedTime:</span> {logEntry.integratedTime}
                </div>
                <div>
                  <span className="text-primary">LogID:</span> {logEntry.logID.slice(0, 32)}...
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Size Comparison */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3">
          Classical vs PQC Sigstore: Size Impact
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium">Component</th>
                <th className="text-right p-2 font-bold">
                  <span className="text-warning">ECDSA P-256</span>
                </th>
                <th className="text-right p-2 font-bold">
                  <span className="text-success">ML-DSA-65</span>
                </th>
                <th className="text-right p-2 text-muted-foreground font-medium">Increase</th>
              </tr>
            </thead>
            <tbody>
              {[
                { component: 'Public Key', ecdsa: 65, mldsa: 1952 },
                { component: 'Signature', ecdsa: 64, mldsa: 3309 },
                { component: 'Certificate', ecdsa: 600, mldsa: 6000 },
                { component: 'Rekor Entry', ecdsa: 200, mldsa: 3600 },
              ].map((row) => (
                <tr key={row.component} className="border-b border-border/50">
                  <td className="p-2 text-foreground font-medium">{row.component}</td>
                  <td className="p-2 text-right font-mono text-xs text-foreground">
                    {row.ecdsa.toLocaleString()} B
                  </td>
                  <td className="p-2 text-right font-mono text-xs text-foreground">
                    {row.mldsa.toLocaleString()} B
                  </td>
                  <td className="p-2 text-right font-mono text-xs text-muted-foreground">
                    {(row.mldsa / row.ecdsa).toFixed(1)}x
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          The primary impact is on Rekor log storage (each entry grows ~18x). For individual
          developers, the difference is negligible &mdash; signing and verification remain
          sub-second.
        </p>
      </div>

      {/* Key Advantage */}
      <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
        <div className="text-xs font-bold text-primary mb-2">
          Why Sigstore Simplifies PQC Migration
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div>
            <strong className="text-foreground">Traditional code signing:</strong> Every developer
            manages long-term private keys. PQC migration requires every developer to generate new
            PQC keys, update signing configurations, and distribute new public keys.
          </div>
          <div>
            <strong className="text-foreground">Sigstore keyless signing:</strong> Only Fulcio (CA)
            and Rekor (log) need to upgrade to PQC. Developers get PQC protection automatically
            through ephemeral certificates &mdash; zero configuration changes needed.
          </div>
        </div>
      </div>

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> This walkthrough simulates the Sigstore keyless signing flow with
          realistic data structures. Sigstore is a Linux Foundation project used by npm, PyPI,
          Kubernetes, and many other ecosystems. PQC support in Sigstore is under active
          development. The transparency log entries shown are for educational purposes only.
        </p>
      </div>
    </div>
  )
}
