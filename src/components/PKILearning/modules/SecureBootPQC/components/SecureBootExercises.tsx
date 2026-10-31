// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface SecureBootExercisesProps {
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

export const SecureBootExercises: React.FC<SecureBootExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'uefi-key-audit',
      title: '1. UEFI Key Audit',
      description:
        'Use the Secure Boot Chain Analyzer to audit all five UEFI key types (PK, KEK, db, dbx, MOK). Identify which keys are quantum-vulnerable, understand the certificate size impact in UEFI NVRAM, and review the migration priority for each key. Click each key type to expand the detailed analysis.',
      badge: 'Hierarchy',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The db size impact panel shows the size of a minimal ML-DSA-65 certificate next to a minimal RSA-2048 certificate.',
      config: { step: 0 },
    },
    {
      id: 'firmware-signing-migration',
      title: '2. Firmware Signing Migration',
      description:
        'Walk through the 4-step firmware signing migration wizard. Inspect the current RSA-2048 firmware manifest, generate an ML-DSA-65 signing key, sign the firmware, and verify the signature. Compare signature sizes and certificate chain structures at each step.',
      badge: 'Signing',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Step 3 shows the most dramatic difference: ML-DSA-65 signatures are 3,309 bytes vs 256 bytes for RSA-2048 — a 12.9× increase. Step 2 shows the key size delta: public key grows from 256B to 1,952B (7.6×). The demo builds its CMS SignedData with a stub SignerInfo (issuer "demo", serial 1) and no certificate chain.',
      config: { step: 1 },
    },
    {
      id: 'tpm-key-hierarchy',
      title: '3. TPM Key Hierarchy',
      description:
        'Explore the TPM 2.0 key hierarchy — Endorsement Key (EK), Storage Root Key (SRK), Attestation Identity Key (AIK), and Device Identity Key (DevID). See what TPM 2.0 Library v185 adds (ML-KEM and ML-DSA) and learn the hybrid RSA TPM + ML-DSA software key approach for TPMs built to earlier versions.',
      badge: 'TPM',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'The EK, SRK and AIK show "Defined in TPM 2.0 v185"; the Device Identity key shows "Roadmap". Expanding the Hybrid Approach section shows the interim two-signature pattern for a TPM built to an earlier library version: an RSA TPM quote proves hardware binding and an ML-DSA software co-signature provides quantum safety. The timeline lists the March 2026 specification.',
      config: { step: 2 },
    },
    {
      id: 'vendor-selection',
      title: '4. Vendor Selection',
      description:
        'Use the Firmware Vendor Matrix to compare the 6 BIOS/firmware vendors it lists (AMI, Insyde, Tianocore/EDK2, Dell, HPE, Intel). Filter by tier and PQC status, then open the source links for your platform vendor.',
      badge: 'Vendors',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'Firmware-vendor PQC support is early and moves fast. Use the Firmware Vendor Matrix and its source links for the detail.',
      config: { step: 3 },
    },
    {
      id: 'attestation-design',
      title: '5. Attestation Design',
      description:
        'Use the Attestation Flow Designer to explore all 5 attestation types (Measured Boot, TPM Quote, DICE, FIDO Device Onboard, Remote Attestation via TLS). For each type: identify vulnerable crypto operations, review the migration urgency, and understand the PQC migration path.',
      badge: 'Attestation',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Measured Boot itself is quantum-safe (SHA-256 PCR extends). A TPM Quote signed with an RSA AIK is a forgery risk once a CRQC exists, not a harvest-now-decrypt-later one: the signature protects no secret, so urgency follows how long the TPM and its AIK certificate chain stay in service (the designer estimates about 10 years). Remote TLS attestation carries both risks: the TLS key exchange can be recorded now and decrypted later, while the embedded attestation signatures can only be forged later (estimated about 15 years in service).',
      config: { step: 4 },
    },
    {
      id: 'boot-verify-latency',
      title: '6. Boot Verify Latency on an MCU',
      description:
        'Open the Boot Verify Latency calculator at its defaults (2 MB/s SPI flash, 120 MHz Cortex-M4-class core). Compare the load and verify columns for ECDSA P-256, RSA-3072, ML-DSA-44 and LMS H10/W4, then drop the clock to 48 MHz and see which algorithm crosses the illustrative 100 ms budget.',
      badge: 'Embedded',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/30',
      observe:
        'Flash read is never the problem. Verify time dominates. ML-DSA-44 and LMS verify in the same league as ECDSA P-256. RSA-3072 in software is the one that blows the budget. These are model estimates; the 100 ms budget is illustrative, not a standard.',
      config: { step: 5 },
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
          Work through these scenarios to master UEFI Secure Boot key migration, firmware signing,
          TPM attestation, vendor selection, and boot-time verify latency on a microcontroller. Each
          exercise pre-configures the Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                <Play size={14} fill="currentColor" aria-hidden="true" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about Secure Boot and firmware
                PQC migration.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
