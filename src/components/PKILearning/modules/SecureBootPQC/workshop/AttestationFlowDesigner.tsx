// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Shield, CheckCircle, AlertTriangle, ArrowRight, Info } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { ATTESTATION_TYPES } from '../data/secureBootConstants'
import type { AttestationType } from '../data/secureBootConstants'

interface FlowStep {
  actor: string
  action: string
  crypto: string
  pqcStatus: 'quantum-safe' | 'vulnerable' | 'hybrid' | 'neutral'
}

interface AttestationFlow {
  id: AttestationType
  steps: FlowStep[]
  currentMigrationPath: string
  hndlWindowYears: number
}

const RISK_COLOR: Record<string, string> = {
  critical: 'text-status-error',
  high: 'text-status-warning',
  medium: 'text-status-info',
  low: 'text-status-success',
}

const RISK_BG: Record<string, string> = {
  critical: 'bg-status-error/10 border-status-error/30',
  high: 'bg-status-warning/10 border-status-warning/30',
  medium: 'bg-status-info/10 border-status-info/30',
  low: 'bg-status-success/10 border-status-success/30',
}

const FLOW_STATUS_COLOR: Record<string, string> = {
  'quantum-safe': 'bg-status-success/10 border-status-success/30 text-status-success',
  vulnerable: 'bg-status-error/10 border-status-error/30 text-status-error',
  hybrid: 'bg-status-warning/10 border-status-warning/30 text-status-warning',
  neutral: 'bg-muted/50 border-border text-muted-foreground',
}

const ATTESTATION_FLOWS: AttestationFlow[] = [
  {
    id: 'measured-boot',
    steps: [
      {
        actor: 'UEFI Firmware',
        action: 'Extend SHA-256 hash of firmware code into PCR[0]',
        crypto: 'SHA-256 extend (no signature)',
        pqcStatus: 'quantum-safe',
      },
      {
        actor: 'UEFI Firmware',
        action: 'Extend Secure Boot variable hashes into PCR[7]',
        crypto: 'SHA-256 extend (no signature)',
        pqcStatus: 'quantum-safe',
      },
      {
        actor: 'Bootloader',
        action: 'Extend boot configuration into PCR[4] and PCR[5]',
        crypto: 'SHA-256 extend (no signature)',
        pqcStatus: 'quantum-safe',
      },
      {
        actor: 'OS',
        action: 'Read PCR values via TPM2_PCR_Read',
        crypto: 'No crypto — plain read',
        pqcStatus: 'neutral',
      },
      {
        actor: 'Verifier',
        action: 'Compare PCR values against golden reference log',
        crypto: 'SHA-256 comparison',
        pqcStatus: 'quantum-safe',
      },
    ],
    currentMigrationPath:
      'Measured Boot itself requires no PQC migration — PCR extend operations use SHA-256 which is quantum-safe. Migration is needed for TPM Quote signatures used to attest the PCR values to remote verifiers.',
    hndlWindowYears: 0,
  },
  {
    id: 'tpm-quote',
    steps: [
      {
        actor: 'Verifier',
        action: 'Send attestation request with nonce',
        crypto: 'TLS 1.3 (ECDH + ECDSA)',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Device TPM',
        action: 'TPM2_Quote: hash PCR selection + nonce',
        crypto: 'SHA-256 digest (quantum-safe)',
        pqcStatus: 'quantum-safe',
      },
      {
        actor: 'Device TPM',
        action: 'TPM2_Sign: AIK signs the quoted digest',
        crypto: 'RSA-2048 or ECDSA P-256 (AIK)',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Device',
        action: 'Return TPM Quote + AIK certificate + PCR log',
        crypto: 'Signed quote blob',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Verifier',
        action: 'Verify AIK cert chain, then verify quote signature',
        crypto: 'RSA-2048 or ECDSA P-256 verification',
        pqcStatus: 'vulnerable',
      },
    ],
    currentMigrationPath:
      'Hybrid path: (1) TPM RSA AIK signs quote as normal, (2) software ML-DSA-65 key co-signs the same nonce, (3) verifier validates both. Full migration requires TPM hardware upgrade to TCG PQC spec (targeted 2027+).',
    hndlWindowYears: 10,
  },
  {
    id: 'dice',
    steps: [
      {
        actor: 'Hardware (DICE layer 0)',
        action: 'Derive CDI from UDS + firmware measurement via HKDF',
        crypto: 'HKDF-SHA-256 (quantum-safe)',
        pqcStatus: 'quantum-safe',
      },
      {
        actor: 'Firmware (DICE layer 1)',
        action: 'Generate key pair from CDI, create layer certificate',
        crypto: 'ECDSA P-256 (current) / ML-DSA-44 (PQC)',
        pqcStatus: 'hybrid',
      },
      {
        actor: 'Bootloader (DICE layer 2)',
        action: 'Measure next layer, derive new CDI, issue certificate',
        crypto: 'ECDSA P-256 or ML-DSA-44',
        pqcStatus: 'hybrid',
      },
      {
        actor: 'Verifier',
        action: 'Validate DICE certificate chain to root of trust',
        crypto: 'ECDSA or ML-DSA certificate chain verification',
        pqcStatus: 'hybrid',
      },
    ],
    currentMigrationPath:
      'DICE specification update adds ML-DSA-44 for constrained devices. Key derivation (HKDF) is already quantum-safe. New device provisioning uses ML-DSA-44 DevID. Existing devices: hardware reset required (CDI is immutable). Deploy ML-DSA certificates in new device manufacturing runs.',
    hndlWindowYears: 8,
  },
  {
    id: 'fido-onboard',
    steps: [
      {
        actor: 'Manufacturer',
        action: 'Issue device attestation certificate at factory',
        crypto: 'RSA-2048 or ECDSA P-384 (current) / ML-DSA-65 (PQC)',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Device',
        action: 'First-boot: connect to FDO Rendezvous Server',
        crypto: 'TLS 1.3 mutual authentication',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Rendezvous Server',
        action: 'Verify device attestation certificate',
        crypto: 'RSA or ECDSA certificate verification',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Owner Onboarding Server',
        action: 'Transfer device ownership via signed voucher',
        crypto: 'ECDSA P-384 voucher signature',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Device',
        action: 'Receive credentials, complete onboarding',
        crypto: 'AES-256 session encryption (quantum-safe)',
        pqcStatus: 'quantum-safe',
      },
    ],
    currentMigrationPath:
      'FIDO Alliance FDO specification (planned PQC update) adds ML-DSA-65 support. OEM must issue PQC device attestation certs at manufacture. Update rendezvous server and owner onboarding server to support ML-DSA certificate verification. Voucher signing chain migrates to ML-DSA-65.',
    hndlWindowYears: 12,
  },
  {
    id: 'remote-tls',
    steps: [
      {
        actor: 'Device',
        action: 'Initiate RA-TLS connection with attestation extension',
        crypto: 'TLS 1.3: ECDH key exchange + ECDSA handshake',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Device',
        action: 'Generate ephemeral TLS key pair; bind to attestation evidence',
        crypto: 'ECDSA P-256 (TLS cert) + TPM Quote (attestation evidence)',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Verifier',
        action: 'Extract attestation evidence from TLS certificate extension',
        crypto: 'TLS 1.3 record layer verification',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Verifier',
        action: 'Verify attestation evidence (TPM quote or DICE chain)',
        crypto: 'RSA-2048 or ECDSA P-256 signature verification',
        pqcStatus: 'vulnerable',
      },
      {
        actor: 'Both',
        action: 'Establish encrypted session',
        crypto: 'AES-256-GCM (quantum-safe for confidentiality)',
        pqcStatus: 'quantum-safe',
      },
    ],
    currentMigrationPath:
      'Two-layer migration: (1) TLS layer — migrate to ML-KEM-768 key exchange + ML-DSA-65 certificates (follow TLS 1.3 PQC hybrid migration). (2) Attestation layer — replace embedded ECDSA/RSA signatures with ML-DSA-65 (depends on TPM/DICE PQC timeline). Both layers must migrate to eliminate HNDL risk.',
    hndlWindowYears: 15,
  },
]

const ATTESTATION_FILTER_ITEMS = ATTESTATION_TYPES.map((t) => ({
  id: t.id,
  label: t.name,
}))

export const AttestationFlowDesigner: React.FC = () => {
  const [selectedType, setSelectedType] = useState<string>('tpm-quote')

  const selectedAttType = ATTESTATION_TYPES.find((t) => t.id === selectedType)
  const selectedFlow = ATTESTATION_FLOWS.find((f) => f.id === selectedType)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Attestation Flow Designer</h3>
        <p className="text-sm text-muted-foreground">
          Explore attestation protocols and their PQC migration paths. Select an attestation type to
          see the step-by-step flow, identify quantum-vulnerable operations, and understand the
          migration strategy.
        </p>
      </div>

      {/* Type Selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <FilterDropdown
          label="Attestation Type"
          items={ATTESTATION_FILTER_ITEMS}
          selectedId={selectedType}
          onSelect={setSelectedType}
          defaultLabel="Select type"
          noContainer
        />
      </div>

      {selectedAttType && selectedFlow && (
        <>
          {/* Type Overview */}
          <div className="glass-panel p-5">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${RISK_BG[selectedAttType.hndlRisk]}`}>
                {selectedAttType.hndlRisk === 'low' || selectedAttType.hndlRisk === 'medium' ? (
                  <CheckCircle
                    size={18}
                    className={RISK_COLOR[selectedAttType.hndlRisk]}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    size={18}
                    className={RISK_COLOR[selectedAttType.hndlRisk]}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="text-sm font-bold text-foreground">{selectedAttType.name}</h4>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold capitalize ${RISK_COLOR[selectedAttType.hndlRisk]} border-current/30`}
                  >
                    {selectedAttType.hndlRisk} HNDL risk
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {selectedAttType.tpmNative ? 'TPM-native' : 'Software / external'}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 mb-2">{selectedAttType.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-muted-foreground">Current crypto: </span>
                    <span className="text-foreground">{selectedAttType.currentCrypto}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Standards body: </span>
                    <span className="text-foreground">{selectedAttType.standardsBody}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Flow Diagram */}
          <div className="glass-panel p-6">
            <h4 className="text-sm font-bold text-foreground mb-4">
              Protocol Flow: {selectedAttType.name}
            </h4>

            <div className="space-y-2">
              {selectedFlow.steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight
                        size={14}
                        className="text-muted-foreground rotate-90"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className={`rounded-lg border p-3 ${FLOW_STATUS_COLOR[step.pqcStatus]}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-bold w-5 shrink-0 mt-0.5 text-center">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground">{step.actor}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded border capitalize font-medium ${FLOW_STATUS_COLOR[step.pqcStatus]}`}
                          >
                            {step.pqcStatus === 'quantum-safe'
                              ? 'Quantum-safe'
                              : step.pqcStatus === 'vulnerable'
                                ? 'Vulnerable'
                                : step.pqcStatus === 'hybrid'
                                  ? 'Hybrid path available'
                                  : 'Neutral'}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/80">{step.action}</p>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {step.crypto}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
              {Object.entries(FLOW_STATUS_COLOR).map(([key, cls]) => (
                <div
                  key={key}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-medium ${cls}`}
                >
                  <span className="capitalize">
                    {key === 'quantum-safe'
                      ? 'Quantum-safe'
                      : key === 'vulnerable'
                        ? 'Vulnerable'
                        : key === 'hybrid'
                          ? 'Hybrid'
                          : 'Neutral'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Migration Path */}
          <div className="glass-panel p-6">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-primary" aria-hidden="true" />
              <h4 className="text-sm font-bold text-foreground">PQC Migration Path</h4>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4">
              {selectedAttType.pqcMigrationPath}
            </p>

            {selectedFlow.hndlWindowYears > 0 && (
              <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
                <div className="flex items-start gap-2">
                  <Info
                    size={14}
                    className="text-status-warning shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div>
                    <div className="text-xs font-bold text-status-warning mb-1">
                      HNDL (Harvest Now, Decrypt Later) Window: ~{selectedFlow.hndlWindowYears}{' '}
                      years
                    </div>
                    <p className="text-[10px] text-foreground/80">
                      An adversary collecting attestation tokens today can break the RSA/ECDSA
                      signatures when a CRQC becomes available. For systems with long-lived secrets
                      or high-value attestation, migration urgency is proportional to this window.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Comparison of all types */}
          <div className="glass-panel p-6">
            <h4 className="text-sm font-bold text-foreground mb-4">
              All Attestation Types — HNDL Risk Summary
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      Current Crypto
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      HNDL Risk
                    </th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                      TPM Native
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ATTESTATION_TYPES.map((t) => (
                    <tr
                      key={t.id}
                      className={`border-b border-border/50 cursor-pointer transition-colors ${t.id === selectedType ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                      onClick={() => setSelectedType(t.id)}
                    >
                      <td className="py-2 px-2 font-medium text-foreground">{t.name}</td>
                      <td className="py-2 px-2 text-muted-foreground">{t.currentCrypto}</td>
                      <td className={`py-2 px-2 font-bold capitalize ${RISK_COLOR[t.hndlRisk]}`}>
                        {t.hndlRisk}
                      </td>
                      <td className="py-2 px-2">
                        {t.tpmNative ? (
                          <CheckCircle
                            size={14}
                            className="text-status-success"
                            aria-label="TPM native"
                          />
                        ) : (
                          <span className="text-muted-foreground text-[10px]">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
