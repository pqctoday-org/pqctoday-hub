// SPDX-License-Identifier: AGPL-3.0-only
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
  Info,
} from 'lucide-react'
import { MEMORY_ENCRYPTION_ENGINES } from '../data/attestationData'
import type { QuantumImpact } from '../data/ccConstants'
import { Button } from '@/components/ui/button'

const QUANTUM_IMPACT_BADGES: Record<QuantumImpact, { label: string; className: string }> = {
  none: {
    label: 'No AES Key Documented',
    className: 'bg-muted text-muted-foreground border-border',
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
  'Full VM memory',
  'Register state (VMSA)',
  'Secure World memory regions',
  'Secure peripherals',
  'Enclave memory (hypervisor-isolated)',
  'Vsock channel data',
  'KMS key material in-transit',
]

/**
 * NIST defines security Categories 1, 3 and 5 by key search on AES-128, AES-192 and AES-256. The gate
 * counts are NIST's 2016 estimates for key recovery with the attack circuit depth limited to
 * MAXDEPTH. They are a published estimate, not a prediction of any real attack.
 */
function getNistCategory(keyWidth: number): {
  label: string
  description: string
  gateEstimate: string
} {
  if (keyWidth >= 256)
    return {
      label: 'Category 5',
      description:
        'NIST Category 5 is defined as at least as hard to break as key search on AES-256. Categories 1 and 3 use AES-128 and AES-192.',
      gateEstimate:
        "NIST's 2016 estimate for AES-256 key recovery is about 2^298/MAXDEPTH quantum gates, or 2^272 classical gates.",
    }
  if (keyWidth >= 192)
    return {
      label: 'Category 3',
      description:
        'NIST Category 3 is defined as at least as hard to break as key search on AES-192. Categories 1 and 5 use AES-128 and AES-256.',
      gateEstimate:
        "NIST's 2016 estimate for AES-192 key recovery is about 2^233/MAXDEPTH quantum gates, or 2^207 classical gates.",
    }
  return {
    label: 'Category 1',
    description:
      'NIST Category 1 is defined as at least as hard to break as key search on AES-128. Categories 3 and 5 use AES-192 and AES-256.',
    gateEstimate:
      "NIST's 2016 estimate for AES-128 key recovery is about 2^170/MAXDEPTH quantum gates, or 2^143 classical gates.",
  }
}

export const EncryptionMechanisms: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [groverKeyWidth, setGroverKeyWidth] = useState(128)

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
  }, [])

  const groverCalc = useMemo(() => {
    const classicalBits = groverKeyWidth
    // Exponent of the idealized sequential Grover iteration count, about 2^(n/2) for an n-bit key.
    const idealGroverBits = groverKeyWidth / 2
    const nist = getNistCategory(groverKeyWidth)
    return { classicalBits, idealGroverBits, nist }
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
                className="h-auto whitespace-normal w-full text-left p-4 flex items-center gap-3"
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
                        <span className="text-muted-foreground">Integrity / ownership checks:</span>{' '}
                        <span className="text-foreground font-bold">{engine.integrityKind}</span>
                      </div>
                      {engine.integrityMechanism && (
                        <div>
                          <span className="text-muted-foreground">Mechanism:</span>{' '}
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
          Grover Impact Calculator (idealized illustration)
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          Grover&apos;s algorithm gives a quadratic speedup for exhaustive key search. This
          calculator shows the idealized count, about 2<sup>n/2</sup> sequential iterations for an
          n-bit key, as an illustration only. NIST notes that Grover&apos;s algorithm needs a long
          serial computation, so a realistic attack runs many smaller instances in parallel, which
          makes the speedup less dramatic. Pick one of the three AES key sizes to compare.
        </p>

        {/* Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="grover-key-width" className="text-xs text-muted-foreground">
              AES Key Size
            </label>
            <span className="text-sm font-bold font-mono text-foreground">
              {groverKeyWidth}-bit
            </span>
          </div>
          <input
            id="grover-key-width"
            type="range"
            min={128}
            max={256}
            step={64}
            value={groverKeyWidth}
            onChange={(e) => setGroverKeyWidth(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>AES-128</span>
            <span>AES-192</span>
            <span>AES-256</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">Classical key search</div>
            <div className="text-lg font-bold font-mono text-foreground">
              2<sup>{groverCalc.classicalBits}</sup>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">
              Idealized Grover iterations
            </div>
            <div className="text-lg font-bold font-mono text-foreground">
              2<sup>{groverCalc.idealGroverBits}</sup>
            </div>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
            <div className="text-[10px] text-muted-foreground mb-1">NIST category (definition)</div>
            <div className="text-sm font-bold text-foreground">{groverCalc.nist.label}</div>
          </div>
        </div>

        {/* Reading guide: three separate things, no verdict */}
        <div className="rounded-lg p-3 border border-border bg-muted/30">
          <div className="flex items-start gap-2">
            <Info size={14} className="text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-foreground">{groverCalc.nist.description}</p>
              <p className="text-xs text-muted-foreground">{groverCalc.nist.gateEstimate}</p>
              <p className="text-xs text-muted-foreground">
                These are three separate things: the idealized iteration count above, NIST&apos;s
                category definition, and the concrete runtime and cost of an attack, which depend on
                circuit depth, error correction, parallelism and hardware and are not modelled here.
                Whether a key size is acceptable is a policy choice about how long the data must
                stay protected and what risk you accept; this calculator does not give a safe or
                unsafe verdict.
              </p>
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
                <td className="p-3 text-muted-foreground font-bold">
                  Cryptographic integrity (MAC)
                </td>
                {MEMORY_ENCRYPTION_ENGINES.map((engine) => (
                  <td key={engine.id} className="p-3 text-center">
                    {engine.integrityProtection ? (
                      <CheckCircle
                        size={14}
                        className="text-status-success mx-auto"
                        aria-label="Cryptographic integrity documented"
                      />
                    ) : (
                      <XCircle
                        size={14}
                        className="text-muted-foreground/40 mx-auto"
                        aria-label="No cryptographic integrity documented"
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
