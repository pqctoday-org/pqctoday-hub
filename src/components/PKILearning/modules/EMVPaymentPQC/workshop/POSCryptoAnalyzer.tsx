// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowDown,
  KeyRound,
  Cpu,
  HardDrive,
  MemoryStick,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  POS_TERMINAL_PROFILES,
  KEY_INJECTION_CEREMONY,
  DUKPT_DERIVATION_TREE,
} from '../data/posCryptoData'
import { PQC_ALGORITHM_SIZES } from '../data/cardCryptoData'
import { TERMINAL_TYPE_LABELS, KEY_SCHEME_LABELS, type TerminalType } from '../data/emvConstants'

// ── Constants ────────────────────────────────────────────────────────────

const TERMINAL_TYPE_ORDER: TerminalType[] = [
  'traditional-pos',
  'mpos',
  'softpos',
  'atm',
  'unattended',
]

const TERMINAL_ICONS: Record<TerminalType, React.ReactNode> = {
  'traditional-pos': <CreditCardIcon />,
  mpos: <Cpu size={14} />,
  softpos: <Cpu size={14} />,
  atm: <HardDrive size={14} />,
  unattended: <MemoryStick size={14} />,
}

// Simple credit card icon stand-in using lucide
function CreditCardIcon() {
  return <KeyRound size={14} />
}

// Resource constraint matrix algorithm subset
const RESOURCE_MATRIX_ALGORITHMS = PQC_ALGORITHM_SIZES.filter((a) =>
  ['ML-KEM-768', 'FN-DSA-512 (Falcon)', 'ML-DSA-44', 'RSA-2048 (current)'].some((name) =>
    a.algorithm.includes(name.split(' ')[0])
  )
)

// ── Component ────────────────────────────────────────────────────────────

export const POSCryptoAnalyzer: React.FC = () => {
  const [selectedType, setSelectedType] = useState<TerminalType>('traditional-pos')
  const [ceremonyMode, setCeremonyMode] = useState<'classical' | 'pqc'>('classical')

  const selectedProfile = useMemo(
    () => POS_TERMINAL_PROFILES.find((p) => p.type === selectedType) ?? POS_TERMINAL_PROFILES[0],
    [selectedType]
  )

  const formatMemory = (kb: number): string => {
    if (kb >= 1_048_576) return `${(kb / 1_048_576).toFixed(0)} GB`
    if (kb >= 1024) return `${(kb / 1024).toFixed(0)} MB`
    return `${kb} KB`
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Analyze POS terminal crypto capabilities, DUKPT key management, and resource constraints for
        PQC migration across different terminal types.
      </p>

      {/* ── Terminal Type Selector ──────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Select Terminal Type</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {TERMINAL_TYPE_ORDER.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedType(type)}
              className="text-xs h-auto py-2 px-3 flex items-center gap-1.5"
            >
              <span className="shrink-0">{TERMINAL_ICONS[type]}</span>
              {TERMINAL_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Terminal Spec Card ──────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">{selectedProfile.name}</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Processor
            </div>
            <div className="text-xs font-mono text-foreground mt-0.5">
              {selectedProfile.processorClass}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">RAM</div>
            <div className="text-xs font-mono text-foreground mt-0.5">
              {formatMemory(selectedProfile.ramKB)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Flash</div>
            <div className="text-xs font-mono text-foreground mt-0.5">
              {formatMemory(selectedProfile.flashKB)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Tamper Resistant
            </div>
            <div className="text-xs text-foreground mt-0.5 flex items-center gap-1">
              {selectedProfile.tamperResistant ? (
                <>
                  <CheckCircle size={12} className="text-status-success" />
                  Yes
                </>
              ) : (
                <>
                  <XCircle size={12} className="text-status-error" />
                  No
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key Schemes */}
        <div className="mb-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Key Schemes
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedProfile.keySchemes.map((scheme) => (
              <span
                key={scheme}
                className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5 text-foreground border border-border"
              >
                {KEY_SCHEME_LABELS[scheme]}
              </span>
            ))}
          </div>
        </div>

        {/* Crypto Chips */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            Crypto Chips
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedProfile.cryptoChips.map((chip) => (
              <span
                key={chip}
                className="text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 border border-primary/30"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quantum Vulnerabilities & PQC Constraints ──────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert size={14} className="text-status-error" />
            <div className="text-sm font-bold text-foreground">Quantum Vulnerabilities</div>
          </div>
          <ul className="space-y-1.5">
            {selectedProfile.quantumVulnerabilities.map((vuln, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-foreground">
                <AlertTriangle size={10} className="text-status-warning shrink-0 mt-0.5" />
                {vuln}
              </li>
            ))}
          </ul>
        </div>

        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={14} className="text-status-info" />
            <div className="text-sm font-bold text-foreground">PQC Constraints</div>
          </div>
          <ul className="space-y-1.5">
            {selectedProfile.pqcConstraints.map((constraint, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-xs text-foreground">
                <span className="text-primary shrink-0 mt-0.5">&#8226;</span>
                {constraint}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── DUKPT Key Derivation Tree ──────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={16} className="text-primary" />
          <div className="text-sm font-bold text-foreground">DUKPT Key Derivation Tree</div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{DUKPT_DERIVATION_TREE.description}</p>

        <div className="flex flex-col items-center space-y-1">
          {DUKPT_DERIVATION_TREE.levels.map((level, idx) => (
            <React.Fragment key={level.level}>
              {/* Level card */}
              <div
                className={`w-full max-w-md rounded-lg p-3 border ${
                  level.quantumSafe
                    ? 'border-status-success/30 bg-status-success/5'
                    : 'border-status-error/30 bg-status-error/5'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-foreground">{level.label}</div>
                  {level.quantumSafe ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-success/20 text-status-success border border-status-success/50">
                      <ShieldCheck size={10} />
                      Quantum-Safe
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-error/20 text-status-error border border-status-error/50">
                      <ShieldAlert size={10} />
                      Vulnerable
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mb-1">{level.description}</p>
                <div className="text-[10px] font-mono text-foreground">{level.algorithm}</div>
              </div>

              {/* Arrow connector */}
              {idx < DUKPT_DERIVATION_TREE.levels.length - 1 && (
                <ArrowDown size={16} className="text-muted-foreground" />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Vulnerable point callout */}
        <div className="mt-4 bg-status-error/10 rounded-lg p-3 border border-status-error/30">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-foreground">Critical Vulnerability</div>
              <p className="text-[10px] text-foreground mt-0.5">
                {DUKPT_DERIVATION_TREE.vulnerablePoint}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Key Injection Ceremony ─────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-bold text-foreground">{KEY_INJECTION_CEREMONY.name}</div>
          <div className="flex items-center gap-1">
            <Button
              variant={ceremonyMode === 'classical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCeremonyMode('classical')}
              className="text-xs h-7 px-2"
            >
              Classical
            </Button>
            <Button
              variant={ceremonyMode === 'pqc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCeremonyMode('pqc')}
              className="text-xs h-7 px-2"
            >
              PQC
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{KEY_INJECTION_CEREMONY.description}</p>

        <div className="space-y-3">
          {KEY_INJECTION_CEREMONY.steps.map((step) => {
            const showPqcCrypto = ceremonyMode === 'pqc' && step.quantumVulnerable
            return (
              <div
                key={step.order}
                className={`rounded-lg p-3 border ${
                  step.quantumVulnerable
                    ? ceremonyMode === 'pqc'
                      ? 'border-status-success/30 bg-status-success/5'
                      : 'border-status-error/30 bg-status-error/5'
                    : 'border-border bg-muted/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground border border-border">
                      {step.order}
                    </span>
                    <span className="text-xs font-bold text-foreground">{step.label}</span>
                  </div>
                  {step.quantumVulnerable ? (
                    ceremonyMode === 'pqc' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-success/20 text-status-success border border-status-success/50">
                        <ShieldCheck size={10} />
                        PQC Protected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-error/20 text-status-error border border-status-error/50">
                        <ShieldAlert size={10} />
                        Vulnerable
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-success/20 text-status-success border border-status-success/50">
                      <ShieldCheck size={10} />
                      Quantum-Safe
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mb-1.5">{step.description}</p>
                <div className="text-[10px]">
                  <span className="text-muted-foreground">Crypto: </span>
                  <span className="font-mono text-foreground">
                    {showPqcCrypto ? step.pqcReplacement : step.cryptoUsed}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Resource Constraint Matrix ─────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          PQC Algorithm Resource Constraints
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                  Algorithm
                </th>
                <th className="text-right p-2 text-muted-foreground font-medium text-xs">
                  Public Key
                </th>
                <th className="text-right p-2 text-muted-foreground font-medium text-xs">Sig/CT</th>
                <th className="text-center p-2 text-muted-foreground font-medium text-xs">Card</th>
                <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                  Terminal
                </th>
              </tr>
            </thead>
            <tbody>
              {RESOURCE_MATRIX_ALGORITHMS.map((alg) => (
                <tr
                  key={alg.algorithm}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="p-2 text-xs font-medium text-foreground font-mono">
                    {alg.algorithm}
                  </td>
                  <td className="p-2 text-xs text-right font-mono text-muted-foreground">
                    {alg.publicKeyBytes.toLocaleString()} B
                  </td>
                  <td className="p-2 text-xs text-right font-mono text-muted-foreground">
                    {alg.signatureOrCiphertextBytes.toLocaleString()} B
                  </td>
                  <td className="p-2 text-center">
                    {alg.suitableForCard ? (
                      <CheckCircle size={14} className="text-status-success mx-auto" />
                    ) : (
                      <XCircle size={14} className="text-status-error mx-auto" />
                    )}
                  </td>
                  <td className="p-2 text-center">
                    {alg.suitableForTerminal ? (
                      <CheckCircle size={14} className="text-status-success mx-auto" />
                    ) : (
                      <XCircle size={14} className="text-status-error mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2">
          {RESOURCE_MATRIX_ALGORITHMS.map((alg) => (
            <p key={alg.algorithm} className="text-[10px] text-muted-foreground">
              <span className="font-mono font-medium text-foreground">{alg.algorithm}:</span>{' '}
              {alg.notes}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
