// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: WorkshopConfig
}

export const ConfidentialComputingExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'tee-architecture-selection',
      title:
        '1. TEE Architecture Selection — Choose the right TEE for ML model inference at a bank',
      description:
        'In the TEE Architecture Explorer, compare Intel SGX (process-level isolation; ~256 MB EPC on legacy client parts, hundreds of GB on recent Xeon) against AMD SEV-SNP (full VM encryption) for protecting ML model inference with customer data. Consider TCB size, memory limits, cloud availability, and PQC readiness.',
      badge: 'Architecture',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'SGX has a smaller TCB (CPU + enclave only); legacy client SGX was capped at ~256 MB EPC (too small for large ML models without partitioning), though recent Xeon server parts raise this to hundreds of GB. SEV-SNP encrypts the full VM including guest OS, which results in a larger TCB. Both are available on Azure; we found no published PQC attestation roadmap for either.',
      config: { step: 0 },
    },
    {
      id: 'attestation-flow-analysis',
      title: '2. Attestation Flow Analysis — Identify quantum-vulnerable steps in Intel DCAP',
      description:
        'Open the Attestation Workshop and select the Intel DCAP flow. Step through all 6 stages. Identify which steps use ECDSA P-256 and are therefore quantum-vulnerable. Count the total number of vulnerable steps.',
      badge: 'Attestation',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Four of six DCAP steps are quantum-vulnerable: AK certification where PCK signs the QE REPORT (step 2, ECDSA P-256), Quote signing by the QE using the AK (step 3, ECDSA P-256), Verifying each key binding and signature (step 5, ECDSA P-256), and Checking TCB Info and QE Identity collateral (step 6, ECDSA P-256). A CRQC could forge attestation quotes or collateral, allowing enclave impersonation and bypassing trust decisions.',
      config: { step: 1 },
    },
    {
      id: 'grover-impact',
      title: '3. Memory Encryption Grover Impact — Calculate post-quantum security of AES-128',
      description:
        'In the Encryption Mechanisms workshop, examine the Intel TME-MK and AMD SME/SEV engines. This lesson uses a 128-bit key as its sample; key size and mode vary by processor generation (Intel’s multi-key specification describes 128- or 256-bit keys; AMD documents AES-128 XEX and AES-256 XTS). Use the Grover impact calculator to determine the effective post-quantum security level.',
      badge: 'Encryption',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'The Grover calculator shows AES-128 brute-force search dropping from 2^128 to ~2^64 operations in the idealized Grover model. In practice that speedup is far less useful (Grover has enormous circuit depth and barely parallelizes), which is why NIST still rates AES-128 at security category 1. AES-256 (NIST category 5) keeps a large margin for long-term (HNDL) confidentiality; note that ARM TrustZone and AWS Nitro enclaves rely on hardware or hypervisor isolation rather than a defined enclave DRAM cipher (AWS documents AES-256-GCM for in-transit encryption on compatible Nitro Cards). Prefer 256-bit memory-encryption keys where your processor generation enumerates and supports them.',
      config: { step: 2 },
    },
    {
      id: 'tee-hsm-integration',
      title: '4. TEE-HSM Integration Design — Build a PQC channel between SGX and Luna HSM',
      description:
        'In the TEE-HSM Trusted Channel workshop, select Intel SGX as the TEE and Thales Luna 7 as the HSM. Toggle between classical and PQC modes to compare key exchange sizes. Walk through the 4-step key provisioning simulation.',
      badge: 'Integration',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'The PQC channel replaces ECDSA P-256 with ML-DSA-65 for attestation and ECDH P-256 with ML-KEM-768 for key exchange. ML-KEM-768 ciphertext (1,088 bytes) is ~33x larger than a compressed ECDH P-256 public key (33 bytes). Migration requires both Intel DCAP PQC update and Luna HSM firmware v7.9+.',
      config: { step: 3 },
    },
    {
      id: 'quantum-migration-priority',
      title: '5. Quantum Migration Prioritization — Rank 5 threat vectors by severity and effort',
      description:
        'In the Quantum Threat Migration workshop, examine the threat vector table and priority matrix. Identify which threats have HNDL exposure (recorded data at risk). Determine the correct migration order based on severity and effort.',
      badge: 'Migration',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Two vectors are critical: ECDSA attestation chain forgery and TLS channel key exchange compromise. Only the TLS channel has HNDL exposure (recorded data at risk); attestation forgery is a signature risk, and NIST IR 8547 (final, October 2026) says the authentication algorithm "may be transitioned at a different time". Both are migrated first because of their severity. Memory encryption (medium severity) is lower priority because Grover only halves key strength and real-time quantum attack on AES-128 is unlikely. Sealing key and firmware vectors require silicon refresh (highest effort).',
      config: { step: 4 },
    },
    {
      id: 'end-to-end-assessment',
      title: '6. End-to-End PQC Readiness — Assess Nitro + CloudHSM for healthcare',
      description:
        'For a healthcare organization using AWS Nitro Enclaves with CloudHSM to process patient records, assess PQC readiness across all 5 layers: TEE architecture, attestation, memory encryption, HSM integration, and quantum threats. Use the Quantum Threat Migration workshop to build the complete picture.',
      badge: 'Assessment',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Nitro attestation uses ECDSA P-384 (quantum-vulnerable). AWS documents ML-DSA key generation and signing inside CloudHSM, in FIPS mode on hsm2m.medium clusters from 1 September 2026, but no ML-KEM, and the HSM\u2019s CMVP certificate does not list ML-DSA yet (checked October 2026). These details move faster than any catalogue, so confirm them in AWS documentation before you design around them. Nitro Enclaves rely on hypervisor-enforced memory isolation (no enclave DRAM encryption cipher is documented; compatible Nitro Cards document AES-256-GCM for in-transit encryption, which has a large Grover margin). Patient records can have long retention: state law generally governs how long medical records are retained (the HIPAA Privacy Rule has no medical-record retention requirement), while HIPAA requires covered entities to retain required compliance documentation for 6 years, making HNDL exposure critical for long-lived records. Overall: 3 of 5 layers need PQC migration, with attestation and TLS channel as highest priority.',
      config: { step: 4 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to explore TEE architectures, attestation flows, memory
          encryption, TEE-HSM integration, and quantum threat migration. Each exercise
          pre-configures the Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about confidential computing and
                TEE security.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
