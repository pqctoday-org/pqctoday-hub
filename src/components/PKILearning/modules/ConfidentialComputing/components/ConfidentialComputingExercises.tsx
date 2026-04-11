// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
        'In the TEE Architecture Explorer, compare Intel SGX (process-level isolation, 256 MB EPC) against AMD SEV-SNP (full VM encryption) for protecting ML model inference with customer data. Consider TCB size, memory limits, cloud availability, and PQC readiness.',
      badge: 'Architecture',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'SGX has a smaller TCB (CPU + enclave only) but is limited to 256 MB EPC — too small for large ML models without partitioning. SEV-SNP encrypts the full VM including guest OS, which results in a larger TCB. Both are available on Azure and have distinct PQC attestation roadmaps.',
      config: { step: 0 },
    },
    {
      id: 'attestation-flow-analysis',
      title: '2. Attestation Flow Analysis — Identify quantum-vulnerable steps in Intel DCAP',
      description:
        'Open the Attestation Workshop and select the Intel DCAP flow. Step through all 5 stages. Identify which steps use ECDSA P-256 and are therefore quantum-vulnerable. Count the total number of vulnerable steps.',
      badge: 'Attestation',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Three of five DCAP steps are quantum-vulnerable: Quote signing (step 2, ECDSA P-256), Quote verification (step 4, ECDSA P-256), and TCB Info verification (step 5, ECDSA P-256). A CRQC could forge attestation quotes, allowing enclave impersonation and bypassing all trust decisions.',
      config: { step: 1 },
    },
    {
      id: 'grover-impact',
      title: '3. Memory Encryption Grover Impact — Calculate post-quantum security of AES-128',
      description:
        'In the Encryption Mechanisms workshop, examine the Intel TME-MK and AMD SME/SEV engines. Both use AES-XTS-128. Use the Grover impact calculator to determine the effective post-quantum security level.',
      badge: 'Encryption',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'AES-128 effective security drops to 64-bit under Grover — below the NIST Level 1 threshold (128-bit post-quantum). ARM TrustZone and AWS Nitro use AES-256, which remains at 128-bit post-quantum security. Upgrade path: AES-XTS-256 in next-gen Intel/AMD CPUs.',
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
        'The PQC channel replaces ECDSA P-256 with ML-DSA-65 for attestation and ECDH P-256 with ML-KEM-768 for key exchange. ML-KEM-768 ciphertext (1,088 bytes) is ~33x larger than ECDH P-256 (33 bytes). Migration requires both Intel DCAP PQC update and Luna firmware v7.9.2+.',
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
        'Two vectors are critical with HNDL exposure: ECDSA attestation chain forgery and TLS channel key exchange compromise. These must be migrated first. Memory encryption (medium severity) is lower priority because Grover only halves key strength and real-time quantum attack on AES-128 is unlikely. Sealing key and firmware vectors require silicon refresh (highest effort).',
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
        'Nitro attestation uses ECDSA P-384 (quantum-vulnerable). CloudHSM has ML-DSA preview via SDK only — no native PKCS#11 PQC support. AES-256 memory encryption is Grover-resilient. Patient records have long retention (HIPAA: 6+ years) making HNDL exposure critical. Overall: 3 of 5 layers need PQC migration, with attestation and TLS channel as highest priority.',
      config: { step: 4 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
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
