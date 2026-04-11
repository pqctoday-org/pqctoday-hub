// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
        'Clicking "Analyze PQC Requirements" reveals that PK and KEK are critical-priority migrations. The db size impact panel shows that ML-DSA-65 certificates are 5× larger than RSA-2048, growing a typical db from ~8 KB to 40+ KB. dbx hash entries require no migration.',
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
        'Step 3 shows the most dramatic difference: ML-DSA-65 signatures are 3,309 bytes vs 256 bytes for RSA-2048 — a 12.9× increase. Step 2 shows the key size delta: public key grows from 256B to 1,952B (7.6×). The certificate chain in Step 3 uses ML-DSA-87 for intermediate and root CAs.',
      config: { step: 1 },
    },
    {
      id: 'tpm-key-hierarchy',
      title: '3. TPM Key Hierarchy',
      description:
        'Explore the TPM 2.0 key hierarchy — Endorsement Key (EK), Storage Root Key (SRK), Attestation Identity Key (AIK), and Device Identity Key (DevID). Understand why TPM 2.0 cannot support ML-DSA natively and learn the hybrid RSA TPM + ML-DSA software key approach.',
      badge: 'TPM',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'The AIK key shows "Hybrid Available" status. Expanding the Hybrid Approach section reveals that TPM 2.0\'s hardware constraint requires a two-signature pattern: RSA TPM quote proves hardware binding, ML-DSA co-signature provides quantum safety. Full PQC requires new hardware (TCG 2027 roadmap).',
      config: { step: 2 },
    },
    {
      id: 'vendor-selection',
      title: '4. Vendor Selection',
      description:
        'Use the Firmware Vendor Matrix to compare 8 BIOS/firmware vendors (AMI, Insyde, Phoenix, Tianocore/EDK2, Dell, HPE, Lenovo, Intel). Filter by tier and PQC status to identify vendors with committed roadmaps. Review migration guidance for your platform vendor.',
      badge: 'Vendors',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'HPE iLO 6 is the only enterprise OEM with available ML-DSA firmware signing (iLO 6.20+). EDK2 has ML-DSA merged into mainline (Q1 2026). AMI and Lenovo have 2026 roadmaps. Phoenix has no committed timeline. Intel Boot Guard PQC requires new silicon (Granite Rapids, 2026).',
      config: { step: 3 },
    },
    {
      id: 'attestation-design',
      title: '5. Attestation Design',
      description:
        'Use the Attestation Flow Designer to explore all 5 attestation types (Measured Boot, TPM Quote, DICE, FIDO Device Onboard, Remote Attestation via TLS). For each type: identify vulnerable crypto operations, review the HNDL window, and understand the PQC migration path.',
      badge: 'Attestation',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Measured Boot itself is quantum-safe (SHA-256 PCR extends). TPM Quote (RSA AIK) has a 10-year HNDL window — the most urgent attestation migration. Remote TLS attestation has a 15-year HNDL window because both the TLS key exchange AND the embedded attestation signatures are quantum-vulnerable.',
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
          Work through these scenarios to master UEFI Secure Boot key migration, firmware signing,
          TPM attestation, and vendor selection. Each exercise pre-configures the Workshop &mdash;
          click &quot;Load &amp; Run&quot; to begin.
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
