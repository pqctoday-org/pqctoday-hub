// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import {
  Key,
  Shield,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TPMKey {
  id: string
  name: string
  abbreviation: string
  hierarchy: 'platform' | 'owner' | 'endorsement' | 'storage'
  description: string
  currentAlgorithm: string
  keySize: string
  pqcStatus: 'spec-defined' | 'roadmap' | 'quantum-safe'
  pqcNote: string
  usedFor: string[]
  standardsRef: string
}

interface HybridApproach {
  name: string
  description: string
  steps: string[]
  tradeoffs: string[]
}

const HIERARCHY_COLORS: Record<string, string> = {
  platform: 'bg-status-error/10 border-status-error/30 text-status-error',
  owner: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
  endorsement: 'bg-primary/10 border-primary/30 text-primary',
  storage: 'bg-status-success/10 border-status-success/30 text-status-success',
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.FC<{ size: number; className: string }> }
> = {
  'spec-defined': {
    label: 'Defined in TPM 2.0 v185',
    color: 'text-status-warning',
    icon: Info,
  },
  roadmap: {
    label: 'Roadmap',
    color: 'text-status-info',
    icon: Info,
  },
  'quantum-safe': {
    label: 'Quantum-Safe',
    color: 'text-status-success',
    icon: CheckCircle,
  },
}

const TPM_KEYS: TPMKey[] = [
  {
    id: 'ek',
    name: 'Endorsement Key',
    abbreviation: 'EK',
    hierarchy: 'endorsement',
    description:
      "The TPM's primary identity key, provisioned by the manufacturer. The EK's public key is enrolled in the TPM vendor's certificate authority. Used to establish trust in the TPM itself during attestation.",
    currentAlgorithm: 'RSA-2048 or ECC P-256',
    keySize: 'RSA: 256B pub / P-256: 65B pub',
    pqcStatus: 'spec-defined',
    pqcNote:
      "TPM 2.0 Library v185 (TCG, 12 March 2026) adds ML-KEM (TPM_ALG_MLKEM, 0x00A0, FIPS 203), and TCG's announcement of 22 March 2026 names it for Endorsement Keys. PC Client PTP 1.07 defines which ML-KEM EK certificates are required. A TPM built to an earlier library version predates ML-KEM: check the version it reports (TPM_PT_REVISION) and the parameter sets it supports (TPM_PT_ML_PARAMETER_SETS) before planning an ML-KEM EK.",
    usedFor: [
      'TPM identity establishment',
      'EK certificate for remote attestation',
      'Privacy CA interactions',
    ],
    standardsRef: 'TCG TPM Library Part 1, Section 7 (Key Hierarchy)',
  },
  {
    id: 'srk',
    name: 'Storage Root Key',
    abbreviation: 'SRK',
    hierarchy: 'storage',
    description:
      'The primary key of the Storage Hierarchy. All user-created keys are ultimately protected by the SRK. Applications create keys under the SRK (or SRK-derived parent keys). The SRK is not exportable.',
    currentAlgorithm: 'RSA-2048 (default) or ECC P-256',
    keySize: 'RSA: 256B pub / P-256: 65B pub',
    pqcStatus: 'spec-defined',
    pqcNote:
      'A storage parent is a restricted-decryption key. TPM 2.0 Library v185 lists ML-KEM among the algorithms such keys can use (Part 1, Table 6: the ML-KEM Labeled KEM for credential protection, salted sessions, and object duplication and import), so a TPM that implements v185 can hold an ML-KEM parent. The software that creates the SRK chooses its algorithm. ML-DSA is sign-only (Part 2, Table 233) and never wraps other keys. On a TPM built to an earlier library version, the hybrid workaround applies: store the ML-DSA software key encrypted under an RSA SRK child key.',
    usedFor: [
      'Wrapping application keys',
      'Protecting ML-DSA software signing keys (hybrid)',
      'BitLocker key sealing',
    ],
    standardsRef: 'TCG TPM Library Part 2, Section 20 (Primary Key Creation)',
  },
  {
    id: 'aik',
    name: 'Attestation Identity Key',
    abbreviation: 'AIK / AK',
    hierarchy: 'endorsement',
    description:
      'A restricted signing key used for TPM quotes. The AIK signs PCR values to prove system state to a remote verifier. The AIK certificate is issued by a Privacy CA or by TPM vendor direct attestation.',
    currentAlgorithm: 'RSA-2048 or ECC P-256',
    keySize: 'RSA: 256B pub / P-256: 65B pub',
    pqcStatus: 'spec-defined',
    pqcNote:
      "TPM 2.0 Library v185 adds ML-DSA (TPM_ALG_MLDSA, 0x00A1, FIPS 204), and TCG's announcement names it for Attestation Keys; new sequence commands sign and verify messages of any size. A TPM that implements v185 can sign with an ML-DSA attestation key. On a TPM built to an earlier library version the interim path is hybrid: the TPM AIK signs a binding token that includes an ML-DSA software key's public key, and the relying party verifies the TPM RSA quote (proves hardware binding) and then the ML-DSA signature (quantum-safe).",
    usedFor: [
      'TPM Quote (PCR attestation)',
      'Remote attestation',
      'Confidential computing attestation',
    ],
    standardsRef: 'TCG TPM Library Part 2, Section 23 (Key Attestation)',
  },
  {
    id: 'devid',
    name: 'Device Identity Key',
    abbreviation: 'DevID / IDevID',
    hierarchy: 'owner',
    description:
      'IEEE 802.1AR Initial Device Identity — a long-lived key provisioned at manufacture, used to prove device identity in network access (802.1X, TEAP). Embedded in TPM at factory.',
    currentAlgorithm: 'RSA-2048 or ECC P-256 (per 802.1AR)',
    keySize: 'RSA: 256B pub / P-256: 65B pub',
    pqcStatus: 'roadmap',
    pqcNote:
      'IEEE 802.1AR PQC amendment (in progress) adds ML-DSA as a supported DevID algorithm. New device provisioning pipelines can issue ML-DSA-65 IDevID certs. Existing devices cannot migrate DevID (it is factory-provisioned in hardware) — requires hardware refresh.',
    usedFor: [
      'Network access control (802.1X)',
      'Device onboarding (FDO)',
      'Zero-trust device identity',
    ],
    standardsRef: 'IEEE 802.1AR-2018, TCG DevID Specification',
  },
  {
    id: 'platform-key-tpm',
    name: 'Platform Auth',
    abbreviation: 'PH',
    hierarchy: 'platform',
    description:
      'The Platform Hierarchy is controlled by the platform owner (OEM). It manages TPM initialization and is typically locked during normal operation. Platform authorization is not a keypair but an auth value.',
    currentAlgorithm: 'HMAC-SHA-256 (auth value, not asymmetric key)',
    keySize: 'Up to 32 bytes',
    pqcStatus: 'quantum-safe',
    pqcNote:
      "HMAC-SHA-256 auth values use symmetric operations. SHA-256 at 256-bit output is quantum-safe (Grover's algorithm yields ~128-bit security). No migration needed for Platform Hierarchy authorization.",
    usedFor: ['TPM initialization', 'Hierarchy control', 'OEM platform management'],
    standardsRef: 'TCG TPM Library Part 1, Section 9 (Platform Authorization)',
  },
]

const HYBRID_APPROACH: HybridApproach = {
  name: 'Hybrid RSA TPM + ML-DSA Software Key',
  description:
    'On a TPM built to a library version earlier than 185, ML-DSA is not available inside the TPM, so the practical short-term solution is a hybrid binding: use the TPM RSA AIK to attest the binding of an ML-DSA software signing key. This adds a quantum-safe signature while keeping hardware-backed proof of authenticity.',
  steps: [
    'Generate ML-DSA-65 key pair in software (using OpenSSL 3.3+ with ML-DSA provider)',
    'Use TPM AIK to sign a "key binding attestation" containing the ML-DSA-65 public key + TPM platform state',
    'Issue a certificate binding the ML-DSA public key to the device identity (signed by Privacy CA)',
    'For attestation: produce both a TPM RSA quote (hardware proof) and ML-DSA signature (quantum-safe)',
    'Relying party validates: RSA quote proves hardware binding, ML-DSA signature is quantum-safe',
  ],
  tradeoffs: [
    'The RSA AIK is the hardware proof and stays quantum-vulnerable: once a CRQC exists, a quote could be forged, leaving the software ML-DSA signature as the only quantum-safe evidence (a forgery risk, not harvest-now-decrypt-later)',
    'Extra complexity: verifiers must validate two signatures',
    'Certificate management: need PKI for ML-DSA binding certs',
  ],
}

export const TPMKeyHierarchyExplorer: React.FC = () => {
  const [expandedKey, setExpandedKey] = useState<string | null>('aik')
  const [showHybrid, setShowHybrid] = useState(false)

  const hierarchyOrder: string[] = ['endorsement', 'owner', 'storage', 'platform']
  const groupedByHierarchy = hierarchyOrder.map((h) => ({
    hierarchy: h,
    keys: TPM_KEYS.filter((k) => k.hierarchy === h),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">TPM 2.0 Key Hierarchy Explorer</h3>
        <p className="text-sm text-muted-foreground">
          Explore TPM 2.0 key hierarchies and understand the path to post-quantum attestation. TPM
          2.0 Library v185 adds ML-DSA and ML-KEM — see how each key type changes, and learn the
          hybrid approach for TPMs built to earlier versions.
        </p>
      </div>

      {/* TPM PQC Status Banner */}
      <div className="bg-status-warning/10 border border-status-warning/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle
            size={18}
            className="text-status-warning shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <div className="text-sm font-bold text-status-warning mb-1">
              TPM 2.0 Library v185 Defines ML-DSA and ML-KEM; Installed TPMs Predate It
            </div>
            <p className="text-xs text-foreground/80">
              The Trusted Computing Group (TCG) published TPM 2.0 Library v185 on 12 March 2026. Its
              change history states: &ldquo;Introduced support for ML-DSA, HashML-DSA, and
              ML-KEM.&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Key Hierarchy Visualization */}
      <div className="glass-panel p-6">
        <h4 className="text-sm font-bold text-foreground mb-4">TPM Key Hierarchy</h4>

        <div className="space-y-4">
          {groupedByHierarchy.map(({ hierarchy, keys }) => (
            <div key={hierarchy}>
              <div
                className={`text-[10px] font-bold uppercase px-2 py-1 rounded mb-2 inline-block ${HIERARCHY_COLORS[hierarchy]}`}
              >
                {hierarchy} hierarchy
              </div>

              <div className="space-y-2">
                {keys.map((tpmKey) => {
                  const isExpanded = expandedKey === tpmKey.id
                  const statusConf = STATUS_CONFIG[tpmKey.pqcStatus]
                  const StatusIcon = statusConf.icon

                  return (
                    <div
                      key={tpmKey.id}
                      className="rounded-lg border border-border bg-muted/30 overflow-hidden"
                    >
                      <Button
                        variant="ghost"
                        onClick={() => setExpandedKey(isExpanded ? null : tpmKey.id)}
                        className="flex items-center gap-3 w-full p-3 text-left"
                      >
                        <div
                          className={`p-1.5 rounded shrink-0 ${HIERARCHY_COLORS[tpmKey.hierarchy]}`}
                        >
                          <Key size={14} aria-hidden="true" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              {tpmKey.name}
                            </span>
                            <code className="text-[10px] px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-muted-foreground">
                              {tpmKey.abbreviation}
                            </code>
                            <span
                              className={`text-[10px] flex items-center gap-1 ${statusConf.color}`}
                            >
                              <StatusIcon size={12} className={statusConf.color} />
                              {statusConf.label}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {tpmKey.currentAlgorithm} — {tpmKey.keySize}
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground shrink-0" />
                        )}
                      </Button>

                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
                          <p className="text-xs text-foreground/80">{tpmKey.description}</p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div className="bg-background rounded p-2 border border-border">
                              <div className="text-[10px] font-bold text-muted-foreground mb-1">
                                Used For
                              </div>
                              <ul className="space-y-0.5">
                                {tpmKey.usedFor.map((use) => (
                                  <li
                                    key={use}
                                    className="text-[10px] text-foreground/80 flex gap-1"
                                  >
                                    <span className="text-primary shrink-0">•</span> {use}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div
                              className={`rounded p-2 border ${
                                tpmKey.pqcStatus === 'quantum-safe'
                                  ? 'bg-status-success/5 border-status-success/20'
                                  : tpmKey.pqcStatus === 'spec-defined'
                                    ? 'bg-status-warning/5 border-status-warning/20'
                                    : 'bg-muted/50 border-border'
                              }`}
                            >
                              <div className={`text-[10px] font-bold mb-1 ${statusConf.color}`}>
                                PQC Migration Note
                              </div>
                              <p className="text-[10px] text-foreground/80">{tpmKey.pqcNote}</p>
                            </div>
                          </div>

                          <div className="text-[10px] text-muted-foreground">
                            <span className="font-bold">Standards ref:</span> {tpmKey.standardsRef}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hybrid Approach */}
      <div className="glass-panel p-6">
        <Button
          variant="ghost"
          onClick={() => setShowHybrid(!showHybrid)}
          className="h-auto whitespace-normal flex items-center gap-2 w-full text-left"
        >
          <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
          <h4 className="text-sm font-bold text-foreground flex-1">
            Hybrid Approach: RSA TPM + ML-DSA Software Key
          </h4>
          {showHybrid ? (
            <ChevronDown size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </Button>

        {showHybrid && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-foreground/80">{HYBRID_APPROACH.description}</p>

            <div className="space-y-2">
              <div className="text-xs font-bold text-foreground">Implementation Steps:</div>
              {HYBRID_APPROACH.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 bg-muted/50 rounded-lg p-3 border border-border"
                >
                  <span className="text-xs font-bold text-primary shrink-0 w-4">{idx + 1}</span>
                  <p className="text-xs text-foreground/80">{step}</p>
                </div>
              ))}
            </div>

            <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
              <div className="text-xs font-bold text-status-warning mb-2">
                Tradeoffs and Limitations:
              </div>
              <ul className="space-y-1.5">
                {HYBRID_APPROACH.tradeoffs.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-xs text-foreground/80">
                    <AlertTriangle
                      size={12}
                      className="text-status-warning shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">TCG TPM PQC Timeline</div>
              <div className="space-y-2">
                {[
                  {
                    year: 'Mar 2026',
                    event:
                      'TCG publishes TPM 2.0 Library v185 (dated 12 March). Part 0 change history: "Introduced support for ML-DSA, HashML-DSA, and ML-KEM." The 22 March announcement names ML-KEM (including Endorsement Keys) and ML-DSA (including Attestation Keys).',
                  },
                  {
                    year: 'Mar 2026',
                    event:
                      'PC Client Platform TPM Profile (PTP) 1.07, listed by TCG as 23 March 2026, adds larger data transport to the CRB interface and defines which ML-KEM Endorsement Key certificates are required.',
                  },
                ].map((item) => (
                  <div
                    key={item.event}
                    className="flex items-start gap-3 bg-background rounded p-2 border border-border"
                  >
                    <span className="text-xs font-bold text-primary shrink-0 w-16">
                      {item.year}
                    </span>
                    <p className="text-[10px] text-foreground/80">{item.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
