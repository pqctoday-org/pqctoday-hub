// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useMemo } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Key,
  Lock,
  CheckCircle2,
  ArrowDown,
  FileKey,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  CARD_AUTH_SPECS,
  PROVISIONING_STEPS,
  CERT_CHAIN_COMPARISONS,
  PQC_ALGORITHM_SIZES,
} from '../data/cardCryptoData'
import {
  PROVISIONING_PHASE_LABELS,
  AUTH_METHOD_LABELS,
  type ProvisioningPhase,
  type AuthMethod,
  type CertChainAlgorithm,
  type CardAuthSpec,
} from '../data/emvConstants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PHASES: ProvisioningPhase[] = [
  'chip-os',
  'pre-perso',
  'personalization',
  'key-injection',
  'activation',
]

const PHASE_ICONS: Record<ProvisioningPhase, React.ReactNode> = {
  'chip-os': <Cpu size={16} />,
  'pre-perso': <FileKey size={16} />,
  personalization: <Lock size={16} />,
  'key-injection': <Key size={16} />,
  activation: <CheckCircle2 size={16} />,
}

const AUTH_METHODS: AuthMethod[] = ['sda', 'dda', 'cda']

const CHAIN_ALGORITHMS: CertChainAlgorithm[] = ['rsa-2048', 'ml-dsa-44', 'fn-dsa-512']

const ALGORITHM_BUTTON_LABELS: Record<CertChainAlgorithm, string> = {
  'rsa-2048': 'RSA-2048',
  'ml-dsa-44': 'ML-DSA-44',
  'fn-dsa-512': 'FN-DSA-512',
}

/** Color coding for relative chain size: smallest=success, medium=warning, largest=error */
function sizeRank(algo: CertChainAlgorithm): string {
  switch (algo) {
    case 'fn-dsa-512':
      return 'text-status-success'
    case 'rsa-2048':
      return 'text-status-warning'
    case 'ml-dsa-44':
      return 'text-status-error'
  }
}

function sizeBgRank(algo: CertChainAlgorithm): string {
  switch (algo) {
    case 'fn-dsa-512':
      return 'bg-status-success/20 border-status-success/50'
    case 'rsa-2048':
      return 'bg-status-warning/20 border-status-warning/50'
    case 'ml-dsa-44':
      return 'bg-status-error/20 border-status-error/50'
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

// ---------------------------------------------------------------------------
// CardProvisioningVisualizer
// ---------------------------------------------------------------------------

export const CardProvisioningVisualizer: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<ProvisioningPhase>('chip-os')
  const [selectedAuth, setSelectedAuth] = useState<AuthMethod>('cda')
  const [selectedChainAlgo, setSelectedChainAlgo] = useState<CertChainAlgorithm>('rsa-2048')

  const phaseStep = useMemo(
    () => PROVISIONING_STEPS.find((s) => s.phase === selectedPhase),
    [selectedPhase]
  )

  const authSpec = useMemo(
    () => CARD_AUTH_SPECS.find((s) => s.id === selectedAuth) as CardAuthSpec,
    [selectedAuth]
  )

  const chainComparison = useMemo(
    () => CERT_CHAIN_COMPARISONS.find((c) => c.algorithm === selectedChainAlgo)!,
    [selectedChainAlgo]
  )

  const rsaBaseline = CERT_CHAIN_COMPARISONS.find((c) => c.algorithm === 'rsa-2048')!

  const chainDelta = chainComparison.totalChainBytes - rsaBaseline.totalChainBytes

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------------------- */}
      {/* Provisioning Phase Stepper */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide">
          Card Provisioning Phases
        </h3>

        {/* Horizontal stepper */}
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {PHASES.map((phase, i) => {
            const isActive = phase === selectedPhase
            const step = PROVISIONING_STEPS.find((s) => s.phase === phase)
            return (
              <React.Fragment key={phase}>
                {i > 0 && <div className="hidden sm:block h-px flex-1 bg-border min-w-[12px]" />}
                <Button
                  variant="ghost"
                  onClick={() => setSelectedPhase(phase)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all shrink-0 ${
                    isActive
                      ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                  aria-label={`Phase: ${PROVISIONING_PHASE_LABELS[phase]}`}
                >
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                    {step?.quantumVulnerable ? (
                      <ShieldAlert size={16} className="text-status-error" />
                    ) : (
                      <span className={isActive ? 'text-primary' : 'text-muted-foreground'}>
                        {PHASE_ICONS[phase]}
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-medium text-center leading-tight max-w-[80px]">
                    {PROVISIONING_PHASE_LABELS[phase]}
                  </span>
                </Button>
              </React.Fragment>
            )
          })}
        </div>

        {/* Phase detail panel */}
        {phaseStep && (
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{phaseStep.label}</h4>
                <span className="text-xs text-muted-foreground">Actor: {phaseStep.actor}</span>
              </div>
              {phaseStep.quantumVulnerable ? (
                <span className="flex items-center gap-1 text-xs text-status-error bg-status-error/10 px-2 py-1 rounded-full border border-status-error/30">
                  <ShieldAlert size={13} /> Quantum Vulnerable
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-status-success bg-status-success/10 px-2 py-1 rounded-full border border-status-success/30">
                  <ShieldCheck size={13} /> Quantum Safe
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{phaseStep.description}</p>

            {/* Data elements */}
            <div>
              <h5 className="text-xs font-medium text-secondary mb-1">Data Elements</h5>
              <div className="flex flex-wrap gap-1.5">
                {phaseStep.dataElements.map((el, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    {el}
                  </span>
                ))}
              </div>
            </div>

            {/* Crypto used */}
            <div>
              <h5 className="text-xs font-medium text-secondary mb-1">Cryptography</h5>
              <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                {phaseStep.cryptoUsed.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            {phaseStep.pqcReplacement && (
              <div className="text-xs">
                <span className="font-medium text-status-success">PQC Replacement:</span>{' '}
                <span className="text-muted-foreground">{phaseStep.pqcReplacement}</span>
              </div>
            )}
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* Auth Method Selector + Key Inventory */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide">
          Authentication Method
        </h3>

        <div className="flex gap-2">
          {AUTH_METHODS.map((method) => (
            <Button
              key={method}
              variant={selectedAuth === method ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setSelectedAuth(method)}
            >
              {AUTH_METHOD_LABELS[method]}
            </Button>
          ))}
        </div>

        {authSpec && (
          <div className="glass-panel p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-foreground">{authSpec.fullName}</h4>
                <span className="text-xs text-muted-foreground">
                  {authSpec.algorithm} &middot; {authSpec.prevalence}
                </span>
              </div>
              {authSpec.quantumVulnerable ? (
                <span className="flex items-center gap-1 text-xs text-status-error">
                  <ShieldAlert size={13} /> Vulnerable
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-status-success">
                  <ShieldCheck size={13} /> Safe
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{authSpec.description}</p>

            {/* How it works */}
            <div>
              <h5 className="text-xs font-medium text-secondary mb-1">How It Works</h5>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                {authSpec.howItWorks.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-medium text-status-success mb-1">Strengths</h5>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  {authSpec.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-medium text-status-error mb-1">Weaknesses</h5>
                <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                  {authSpec.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-xs">
              <span className="font-medium text-primary">PQC Migration Path:</span>{' '}
              <span className="text-muted-foreground">{authSpec.pqcMigrationPath}</span>
            </div>

            {/* Key inventory table */}
            <div>
              <h5 className="text-xs font-medium text-secondary mb-2">Key Inventory</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-2 text-muted-foreground font-medium">Property</th>
                      <th className="text-left p-2 text-muted-foreground font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border">
                      <td className="p-2 text-muted-foreground">Algorithm</td>
                      <td className="p-2 text-foreground">{authSpec.algorithm}</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 text-muted-foreground">Key Size</td>
                      <td className="p-2 text-foreground">{authSpec.keySize} bits</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 text-muted-foreground">Signature Size</td>
                      <td className="p-2 text-foreground">{authSpec.signatureBytes} bytes</td>
                    </tr>
                    <tr className="border-b border-border">
                      <td className="p-2 text-muted-foreground">Offline Capable</td>
                      <td className="p-2 text-foreground">
                        {authSpec.offlineCapable ? 'Yes' : 'No'}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 text-muted-foreground">Quantum Vulnerable</td>
                      <td className="p-2">
                        {authSpec.quantumVulnerable ? (
                          <span className="text-status-error">Yes</span>
                        ) : (
                          <span className="text-status-success">No</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ----------------------------------------------------------------- */}
      {/* CA Certificate Chain Tree Visualizer */}
      {/* ----------------------------------------------------------------- */}
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide">
          CA Certificate Chain Comparison
        </h3>

        {/* Algorithm toggle */}
        <div className="flex gap-2">
          {CHAIN_ALGORITHMS.map((algo) => (
            <Button
              key={algo}
              variant={selectedChainAlgo === algo ? 'gradient' : 'outline'}
              size="sm"
              onClick={() => setSelectedChainAlgo(algo)}
            >
              {ALGORITHM_BUTTON_LABELS[algo]}
            </Button>
          ))}
        </div>

        {/* Description + FIPS status */}
        <div className="glass-panel p-4">
          <h4 className="font-semibold text-foreground mb-1">{chainComparison.label}</h4>
          <p className="text-sm text-muted-foreground mb-2">{chainComparison.description}</p>
          <span className="text-xs text-muted-foreground">
            FIPS Status: {chainComparison.fipsStatus}
          </span>
        </div>

        {/* Total chain size + delta */}
        <div className={`glass-panel p-4 text-center border ${sizeBgRank(selectedChainAlgo)}`}>
          <div className={`text-3xl font-bold ${sizeRank(selectedChainAlgo)}`}>
            {formatBytes(chainComparison.totalChainBytes)}
          </div>
          <div className="text-sm text-muted-foreground">Total Chain Size</div>
          {chainDelta !== 0 && (
            <div
              className={`text-sm mt-1 ${chainDelta > 0 ? 'text-status-error' : 'text-status-success'}`}
            >
              {chainDelta > 0 ? '+' : ''}
              {formatBytes(chainDelta)} vs RSA baseline
            </div>
          )}
        </div>

        {/* 4-level vertical tree */}
        <div className="space-y-1">
          {chainComparison.levels.map((level, i) => (
            <div key={level.level}>
              {i > 0 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={16} className="text-muted-foreground opacity-40" />
                </div>
              )}
              <div
                className={`glass-panel p-4 border ${sizeBgRank(selectedChainAlgo)}`}
                style={{ marginLeft: `${i * 16}px` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        L{i}
                      </span>
                      <h5 className="font-semibold text-foreground text-sm">{level.label}</h5>
                    </div>
                    <span className="text-xs text-muted-foreground">{level.algorithm}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-sm font-bold ${sizeRank(selectedChainAlgo)}`}>
                      {formatBytes(level.certificateBytes)}
                    </div>
                    <div className="text-xs text-muted-foreground">cert size</div>
                  </div>
                </div>

                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  <span>
                    Pub Key:{' '}
                    <span className="text-foreground">{formatBytes(level.publicKeyBytes)}</span>
                  </span>
                  <span>
                    Signature:{' '}
                    <span className="text-foreground">{formatBytes(level.signatureBytes)}</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Algorithm size reference table */}
        <div className="glass-panel overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Algorithm</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Public Key</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Sig / CT</th>
                <th className="text-center p-3 text-muted-foreground font-medium">Card</th>
                <th className="text-center p-3 text-muted-foreground font-medium">Terminal</th>
              </tr>
            </thead>
            <tbody>
              {PQC_ALGORITHM_SIZES.map((alg) => (
                <tr key={alg.algorithm} className="border-b border-border last:border-0">
                  <td className="p-3 text-foreground font-medium">{alg.algorithm}</td>
                  <td className="p-3 text-right text-muted-foreground">
                    {formatBytes(alg.publicKeyBytes)}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {formatBytes(alg.signatureOrCiphertextBytes)}
                  </td>
                  <td className="p-3 text-center">
                    {alg.suitableForCard ? (
                      <ShieldCheck size={14} className="mx-auto text-status-success" />
                    ) : (
                      <ShieldAlert size={14} className="mx-auto text-status-error" />
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {alg.suitableForTerminal ? (
                      <ShieldCheck size={14} className="mx-auto text-status-success" />
                    ) : (
                      <ShieldAlert size={14} className="mx-auto text-status-error" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
