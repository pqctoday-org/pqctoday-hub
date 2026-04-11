// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Shield, AlertTriangle, CheckCircle, ChevronDown, ChevronRight, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UEFI_KEY_TYPES, BOOT_CHAIN_STAGES } from '../data/secureBootConstants'

type AnalysisState = 'idle' | 'analyzed'

interface KeyAnalysisResult {
  keyId: string
  risk: 'critical' | 'high' | 'medium' | 'low'
  finding: string
  pqcAction: string
  effort: string
}

const KEY_ANALYSIS_RESULTS: KeyAnalysisResult[] = [
  {
    keyId: 'PK',
    risk: 'critical',
    finding:
      'RSA-2048 Platform Key is quantum-vulnerable. A CRQC can forge PK signatures, allowing an attacker to enroll arbitrary KEKs and bypass Secure Boot entirely.',
    pqcAction:
      'Migrate PK to ML-DSA-65 (FIPS 204, NIST Level 3). Requires OEM cooperation and platform firmware update. Boot Guard ACM re-signing needed for Intel platforms.',
    effort: 'High — requires platform firmware update and OEM coordination',
  },
  {
    keyId: 'KEK',
    risk: 'critical',
    finding:
      'RSA-2048 KEK is quantum-vulnerable. Compromise allows unauthorized updates to the db (Authorized Signature Database), enabling malicious bootloaders to be trusted.',
    pqcAction:
      'Migrate all KEKs to ML-DSA-65. OS vendors (Microsoft, Red Hat, Canonical) must issue PQC KEK certificates. EFI Signature List format update required.',
    effort: 'High — requires coordination with OS vendors and certificate re-issuance',
  },
  {
    keyId: 'db',
    risk: 'high',
    finding:
      'db certificates use RSA-2048. Forged db signatures could allow unauthorized bootloaders. Note: ML-DSA-65 certificates are ~6 KB vs ~1.2 KB RSA — db storage impact is significant.',
    pqcAction:
      'Re-issue all db signing certificates with ML-DSA-65. Update UEFI variable storage allocation to accommodate larger PQC certificates. Typical db grows from 8 KB to 40+ KB.',
    effort: 'Medium — certificate re-issuance; db storage may need expansion',
  },
  {
    keyId: 'dbx',
    risk: 'low',
    finding:
      "dbx stores SHA-256 hashes of revoked binaries, not signatures. SHA-256 at 256-bit output is quantum-safe (Grover's algorithm reduces to ~128-bit security — acceptable). No migration needed for revocation hashes.",
    pqcAction:
      'No action required for dbx hash entries. If dbx also contains revoked certificates (EFI_CERT_X509_SHA256), those may need re-evaluation if the cert used RSA-2048.',
    effort: 'Low — hash-only entries require no migration',
  },
  {
    keyId: 'MOK',
    risk: 'medium',
    finding:
      'MOK list managed by shim uses RSA-2048 or RSA-4096. Quantum attack could forge MOK signatures, allowing custom kernels/modules to load without authorization.',
    pqcAction:
      'shim PQC support pending (depends on UEFI Forum MOK spec update and Microsoft KEK migration). Plan: re-enroll MOK keys with ML-DSA-65 after shim 16.0+ is released with PQC support.',
    effort: 'Medium — requires shim update, admin re-enrollment',
  },
]

const PRIORITY_COLOR: Record<string, string> = {
  critical: 'text-status-error',
  high: 'text-status-warning',
  medium: 'text-status-info',
  low: 'text-status-success',
}

const PRIORITY_BG: Record<string, string> = {
  critical: 'bg-status-error/10 border-status-error/30',
  high: 'bg-status-warning/10 border-status-warning/30',
  medium: 'bg-status-info/10 border-status-info/30',
  low: 'bg-status-success/10 border-status-success/30',
}

export const SecureBootChainAnalyzer: React.FC = () => {
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [expandedStage, setExpandedStage] = useState<string | null>(null)

  const handleAnalyze = () => {
    setAnalysisState('analyzed')
    setExpandedKey('PK')
  }

  const handleReset = () => {
    setAnalysisState('idle')
    setExpandedKey(null)
    setExpandedStage(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Secure Boot Chain Analyzer</h3>
        <p className="text-sm text-muted-foreground">
          Inspect the UEFI Secure Boot key hierarchy (PK → KEK → db) and identify which keys are
          quantum-vulnerable. Click Analyze to see PQC migration requirements for each key type.
        </p>
      </div>

      {/* Key Hierarchy Diagram */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">UEFI Key Hierarchy</h4>

        {/* Visual hierarchy */}
        <div className="space-y-3">
          {UEFI_KEY_TYPES.map((keyType, idx) => {
            const analysis = KEY_ANALYSIS_RESULTS.find((a) => a.keyId === keyType.id)
            const isExpanded = expandedKey === keyType.id
            const isAnalyzed = analysisState === 'analyzed'

            return (
              <React.Fragment key={keyType.id}>
                {idx > 0 && idx < 4 && (
                  <div className="flex justify-center">
                    <div className="w-0.5 h-4 bg-border" />
                  </div>
                )}
                {idx === 4 && (
                  <div className="mt-3 border-t border-dashed border-border pt-3">
                    <div className="text-[10px] text-muted-foreground text-center mb-2">
                      User-managed extension (shim)
                    </div>
                  </div>
                )}

                <div
                  className={`rounded-lg border-2 transition-all duration-200 ${
                    isAnalyzed && analysis
                      ? PRIORITY_BG[analysis.risk]
                      : 'border-border bg-muted/30'
                  }`}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedKey(isExpanded ? null : keyType.id)}
                    className="flex items-start gap-3 w-full p-4 text-left"
                  >
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        keyType.quantumVulnerable ? 'bg-status-error/10' : 'bg-status-success/10'
                      }`}
                    >
                      {keyType.quantumVulnerable ? (
                        <AlertTriangle
                          size={16}
                          className="text-status-error"
                          aria-label="Quantum vulnerable"
                        />
                      ) : (
                        <CheckCircle
                          size={16}
                          className="text-status-success"
                          aria-label="Quantum safe"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-foreground">
                          {keyType.fullName}
                        </span>
                        <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-muted-foreground">
                          {keyType.name}
                        </code>
                        {isAnalyzed && analysis && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded border font-bold capitalize ${PRIORITY_COLOR[analysis.risk]} border-current/30 bg-current/5`}
                          >
                            {analysis.risk} risk
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-1 flex-wrap">
                        <span className="text-[10px] text-muted-foreground">
                          Owner: {keyType.owner}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Current: {keyType.currentAlgorithm}
                        </span>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronDown size={16} className="text-muted-foreground shrink-0 mt-1" />
                    ) : (
                      <ChevronRight size={16} className="text-muted-foreground shrink-0 mt-1" />
                    )}
                  </Button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      <p className="text-xs text-foreground/80">{keyType.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="bg-status-error/5 rounded-lg p-3 border border-status-error/20">
                          <div className="text-[10px] font-bold text-status-error mb-1">
                            Current (Classical)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {keyType.currentAlgorithm}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Size: {keyType.typicalSize}
                          </div>
                        </div>
                        <div className="bg-primary/5 rounded-lg p-3 border border-primary/20">
                          <div className="text-[10px] font-bold text-primary mb-1">
                            Target (PQC)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {keyType.pqcAlgorithm}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Size: {keyType.pqcSize}
                          </div>
                        </div>
                      </div>

                      {isAnalyzed && analysis && (
                        <div className={`rounded-lg p-3 border ${PRIORITY_BG[analysis.risk]}`}>
                          <div
                            className={`text-[10px] font-bold mb-1 capitalize ${PRIORITY_COLOR[analysis.risk]}`}
                          >
                            {analysis.risk.toUpperCase()} RISK — {analysis.effort}
                          </div>
                          <p className="text-xs text-foreground/80 mb-2">{analysis.finding}</p>
                          <div className="bg-background/60 rounded p-2">
                            <div className="text-[10px] font-bold text-primary mb-1">
                              PQC Action Required:
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              {analysis.pqcAction}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </React.Fragment>
            )
          })}
        </div>

        {/* Analyze / Reset buttons */}
        <div className="flex gap-3 mt-5">
          {analysisState === 'idle' ? (
            <Button onClick={handleAnalyze} variant="gradient" className="flex items-center gap-2">
              <Shield size={16} />
              Analyze PQC Requirements
            </Button>
          ) : (
            <Button onClick={handleReset} variant="outline" className="flex items-center gap-2">
              Reset Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Size Impact Summary */}
      {analysisState === 'analyzed' && (
        <div className="glass-panel p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info size={16} className="text-primary" />
            <h4 className="text-sm font-bold text-foreground">db Storage Size Impact</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-status-error">~1.2 KB</div>
              <div className="text-[10px] text-muted-foreground">RSA-2048 cert in db</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/20 text-center">
              <div className="text-lg font-bold text-primary">~6 KB</div>
              <div className="text-[10px] text-muted-foreground">ML-DSA-65 cert in db</div>
            </div>
            <div className="bg-status-warning/5 rounded-lg p-3 border border-status-warning/20 text-center">
              <div className="text-lg font-bold text-status-warning">5×</div>
              <div className="text-[10px] text-muted-foreground">Size increase per cert</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">40+ KB</div>
              <div className="text-[10px] text-muted-foreground">Typical PQC db (8 certs)</div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            UEFI NVRAM stores Secure Boot variables (db, dbx, KEK, PK). Many platforms allocate only
            32–64 KB for NVRAM. A full PQC migration may require BIOS NVRAM reallocation — verify
            your platform&apos;s NVRAM capacity before deployment.
          </p>
        </div>
      )}

      {/* Boot Chain Stages */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">Boot Chain: Signing Surfaces</h4>
        <div className="space-y-3">
          {BOOT_CHAIN_STAGES.map((stage) => {
            const isExpanded = expandedStage === stage.id
            return (
              <div
                key={stage.id}
                className="rounded-lg border border-border bg-muted/30 overflow-hidden"
              >
                <Button
                  variant="ghost"
                  onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                  className="flex items-center gap-3 w-full p-3 text-left"
                >
                  <span className="text-xs font-bold text-muted-foreground w-6 text-center shrink-0">
                    {stage.order + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{stage.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-bold capitalize ${PRIORITY_COLOR[stage.hndlRisk]} border-current/30`}
                      >
                        {stage.hndlRisk} HNDL risk
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {stage.currentAlgorithm}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                  )}
                </Button>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-2">
                    <p className="text-xs text-foreground/80">{stage.description}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="bg-background rounded p-2 border border-border">
                        <div className="text-[10px] font-bold text-muted-foreground mb-1">
                          Signing Key
                        </div>
                        <div className="text-xs text-foreground">{stage.signingKey}</div>
                      </div>
                      <div className="bg-primary/5 rounded p-2 border border-primary/20">
                        <div className="text-[10px] font-bold text-primary mb-1">PQC Status</div>
                        <div className="text-xs text-foreground/80">{stage.pqcStatus}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
