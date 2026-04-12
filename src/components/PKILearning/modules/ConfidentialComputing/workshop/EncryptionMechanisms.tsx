// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useCallback } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowDown,
  Lock,
} from 'lucide-react'
import { MEMORY_ENCRYPTION_ENGINES } from '../data/attestationData'
import type { QuantumImpact } from '../data/ccConstants'
import { Button } from '@/components/ui/button'

const QUANTUM_IMPACT_BADGES: Record<QuantumImpact, { label: string; className: string }> = {
  none: {
    label: 'Quantum Safe',
    className: 'bg-status-success/20 text-status-success border-status-success/50',
  },
  'grover-halved': {
    label: 'Grover Halved',
    className: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  },
  'key-expansion-needed': {
    label: 'Key Expansion Needed',
    className: 'bg-status-error/20 text-status-error border-status-error/50',
  },
}

/** Protection scopes across all engines for the comparison table. */
const ALL_PROTECTION_SCOPES = [
  'DRAM contents',
  'Cache lines (encrypted at LLC boundary)',
  'Page table entries',
  'Full VM memory',
  'Register state (VMSA)',
  'Interrupt descriptor table',
  'Secure World memory regions',
  'Secure peripherals',
  'Crypto accelerator key slots',
  'Enclave memory (hypervisor-isolated)',
  'Vsock channel data',
  'KMS key material in-transit',
]

function getNistLevelAssessment(postQuantumBits: number): {
  label: string
  color: string
  description: string
} {
  if (postQuantumBits >= 256)
    return {
      label: 'NIST Level 5',
      color: 'text-status-success',
      description: 'Exceeds all NIST post-quantum security levels.',
    }
  if (postQuantumBits >= 192)
    return {
      label: 'NIST Level 3+',
      color: 'text-status-success',
      description: 'Exceeds NIST Level 3 (192-bit) post-quantum threshold.',
    }
  if (postQuantumBits >= 128)
    return {
      label: 'NIST Level 1',
      color: 'text-status-success',
      description: 'Meets NIST Level 1 (128-bit) post-quantum security. Considered adequate.',
    }
  if (postQuantumBits >= 96)
    return {
      label: 'Below NIST Level 1',
      color: 'text-status-warning',
      description:
        'Below NIST Level 1 but may provide short-term security. Key expansion recommended.',
    }
  return {
    label: 'Insufficient',
    color: 'text-status-error',
    description:
      'Post-quantum security is insufficient. Immediate upgrade to AES-256 or larger keys required.',
  }
}

function getRecommendation(keyWidth: number): string {
  if (keyWidth >= 256)
    return 'AES-256 provides 128-bit post-quantum security under Grover, meeting NIST Level 1. No immediate action needed for memory encryption key width.'
  if (keyWidth >= 192)
    return 'AES-192 provides 96-bit post-quantum security under Grover. While below NIST Level 1, it offers a reasonable security margin. Consider upgrading to AES-256 for future-proofing.'
  if (keyWidth >= 128)
    return 'AES-128 provides only 64-bit post-quantum security under Grover, well below the NIST Level 1 threshold of 128-bit. Upgrade to AES-256 memory encryption is recommended when next-generation CPUs become available.'
  return 'Key width below 128 bits is critically insufficient even against classical attacks. Immediate upgrade required.'
}

export const EncryptionMechanisms: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [groverKeyWidth, setGroverKeyWidth] = useState(128)

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const groverCalc = useMemo(() => {
    const classicalBits = groverKeyWidth
    const postQuantumBits = Math.floor(groverKeyWidth / 2)
    const nist = getNistLevelAssessment(postQuantumBits)
    const recommendation = getRecommendation(groverKeyWidth)
    const isSafe = postQuantumBits >= 128
    return { classicalBits, postQuantumBits, nist, recommendation, isSafe }
  }, [groverKeyWidth])

  /** Parse the sealing key derivation chain into arrow steps. */
  const parseSealingChain = (derivation: string): string[] => {
    return derivation.split('\u2192').map((s) => s.trim())
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Memory Encryption Mechanisms</h3>
        <p className="text-sm text-muted-foreground">
          Compare hardware memory encryption engines across TEE vendors. Understand how Grover's
          algorithm impacts AES key strength and explore sealing key derivation chains.
        </p>
      </div>

      {/* Engine Cards */}
      <div className="space-y-2">
        {MEMORY_ENCRYPTION_ENGINES.map((engine) => {
          const isExpanded = expandedId === engine.id
          const badge = QUANTUM_IMPACT_BADGES[engine.quantumImpact]

          return (
            <div key={engine.id} className="glass-panel overflow-hidden">
              {/* Collapsed Row */}
              <Button
                variant="ghost"
                onClick={() => toggleExpand(engine.id)}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                <Lock size={16} className="text-primary shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-foreground">{engine.name}</span>
                    <span className="text-xs text-muted-foreground">{engine.vendor}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                      {engine.algorithm}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">
                      {engine.keyWidth}-bit
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>

                <span className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-muted-foreground" />
                  ) : (
                    <ChevronDown size={16} className="text-muted-foreground" />
                  )}
                </span>
              </Button>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-border pt-4 animate-fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground">Granularity:</span>{' '}
                        <span className="text-foreground">{engine.granularity}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Integrity Protection:</span>{' '}
                        {engine.integrityProtection ? (
                          <span className="text-status-success font-bold">Yes</span>
                        ) : (
                          <span className="text-status-error font-bold">No</span>
                        )}
                      </div>
                      {engine.integrityMechanism && (
                        <div>
                          <span className="text-muted-foreground">Integrity Mechanism:</span>{' '}
                          <span className="text-foreground">{engine.integrityMechanism}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <span className="text-muted-foreground font-bold">Quantum Notes:</span>
                        <p className="text-muted-foreground mt-1">{engine.quantumNotes}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-muted-foreground font-bold">Protection Scope:</span>
                      <ul className="mt-1 space-y-0.5">
                        {engine.protectionScope.map((scope) => (
                          <li key={scope} className="text-foreground flex items-center gap-1">
                            <Shield size={10} className="text-primary shrink-0" />
                            {scope}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Sealing Key Derivation Chain */}
                    <div>
                      <span className="text-muted-foreground font-bold">
                        Sealing Key Derivation:
                      </span>
                      <div className="mt-2 space-y-1">
                        {parseSealingChain(engine.sealingKeyDerivation).map((step, idx, arr) => (
                          <div key={idx} className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              <span className="text-foreground font-mono text-[10px]">{step}</span>
                            </div>
                            {idx < arr.length - 1 && (
                              <div className="ml-0.5 flex items-center">
                                <ArrowDown size={12} className="text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Grover Impact Calculator */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle size={16} className="text-status-warning" />
          Grover Impact Calculator
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          Grover's algorithm provides a quadratic speedup for brute-force key search, effectively
          halving the security level of symmetric ciphers. Adjust the AES key width to see the
          post-quantum impact.
        </p>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="grover-key-width" className="text-xs text-muted-foreground">
              AES Key Width
            </label>
            <span className="text-sm font-bold font-mono text-foreground">
              {groverKeyWidth}-bit
            </span>
          </div>
          <input
            id="grover-key-width"
            type="range"
            min={64}
            max={256}
            step={64}
            value={groverKeyWidth}
            onChange={(e) => setGroverKeyWidth(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>64-bit</span>
            <span>128-bit</span>
            <span>192-bit</span>
            <span>256-bit</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Classical Security</div>
            <div className="text-lg font-bold font-mono text-foreground">
              {groverCalc.classicalBits}-bit
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Post-Quantum Security</div>
            <div
              className={`text-lg font-bold font-mono ${groverCalc.isSafe ? 'text-status-success' : 'text-status-error'}`}
            >
              {groverCalc.postQuantumBits}-bit
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">NIST Assessment</div>
            <div className={`text-sm font-bold ${groverCalc.nist.color}`}>
              {groverCalc.nist.label}
            </div>
          </div>
        </div>

        {/* Assessment Box */}
        <div
          className={`rounded-lg p-3 border ${
            groverCalc.isSafe
              ? 'bg-status-success/10 border-status-success/30'
              : 'bg-status-error/10 border-status-error/30'
          }`}
        >
          <div className="flex items-start gap-2">
            {groverCalc.isSafe ? (
              <CheckCircle size={14} className="text-status-success shrink-0 mt-0.5" />
            ) : (
              <XCircle size={14} className="text-status-error shrink-0 mt-0.5" />
            )}
            <div>
              <p className="text-xs text-foreground mb-1">{groverCalc.nist.description}</p>
              <p className="text-xs text-muted-foreground">{groverCalc.recommendation}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Encryption Scope Comparison Table */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-border">
          <h4 className="text-sm font-bold text-foreground">Encryption Scope Comparison</h4>
          <p className="text-xs text-muted-foreground mt-1">
            What each memory encryption engine protects at the hardware level.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="p-3 text-left text-muted-foreground font-medium">
                  Protection Scope
                </th>
                {MEMORY_ENCRYPTION_ENGINES.map((engine) => (
                  <th key={engine.id} className="p-3 text-center text-foreground font-bold">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{engine.name}</span>
                      <span className="text-[10px] font-normal text-muted-foreground">
                        {engine.vendor}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PROTECTION_SCOPES.map((scope) => (
                <tr key={scope} className="border-b border-border last:border-0">
                  <td className="p-3 text-muted-foreground">{scope}</td>
                  {MEMORY_ENCRYPTION_ENGINES.map((engine) => {
                    const hasScope = engine.protectionScope.includes(scope)
                    return (
                      <td key={engine.id} className="p-3 text-center">
                        {hasScope ? (
                          <CheckCircle
                            size={14}
                            className="text-status-success mx-auto"
                            aria-label="Protected"
                          />
                        ) : (
                          <XCircle
                            size={14}
                            className="text-muted-foreground/40 mx-auto"
                            aria-label="Not protected"
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {/* Integrity row */}
              <tr className="border-b border-border">
                <td className="p-3 text-muted-foreground font-bold">Integrity Protection</td>
                {MEMORY_ENCRYPTION_ENGINES.map((engine) => (
                  <td key={engine.id} className="p-3 text-center">
                    {engine.integrityProtection ? (
                      <CheckCircle
                        size={14}
                        className="text-status-success mx-auto"
                        aria-label="Has integrity protection"
                      />
                    ) : (
                      <XCircle
                        size={14}
                        className="text-muted-foreground/40 mx-auto"
                        aria-label="No integrity protection"
                      />
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Sealing Key Derivation Section */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
          <Lock size={16} className="text-primary" />
          Sealing Key Derivation Chains
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          Each engine derives sealing keys through a chain from the platform root of trust to the
          final workload-specific key. Understanding this chain is critical for PQC migration
          planning.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MEMORY_ENCRYPTION_ENGINES.map((engine) => {
            const steps = parseSealingChain(engine.sealingKeyDerivation)
            return (
              <div key={engine.id} className="bg-muted/50 rounded-lg p-4 border border-border">
                <div className="text-xs font-bold text-foreground mb-3">{engine.name}</div>
                <div className="space-y-0.5">
                  {steps.map((step, idx) => (
                    <div key={idx} className="flex flex-col items-start">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                            idx === 0
                              ? 'bg-status-error/20 text-status-error border border-status-error/50'
                              : idx === steps.length - 1
                                ? 'bg-status-success/20 text-status-success border border-status-success/50'
                                : 'bg-primary/20 text-primary border border-primary/50'
                          }`}
                        >
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-mono text-foreground">{step}</span>
                      </div>
                      {idx < steps.length - 1 && (
                        <div className="ml-2.5 my-0.5">
                          <ArrowDown size={12} className="text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Educational Disclaimer */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Note:</strong> Memory encryption implementations vary by CPU generation and
          firmware version. Grover's algorithm impact assumes a fault-tolerant quantum computer with
          sufficient logical qubits. Real-world quantum attacks on AES would require sustained
          quantum computation over extended periods. This calculator is for educational assessment
          only.
        </p>
      </div>
    </div>
  )
}
