// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Shield, FileCode, Key, BarChart3, CheckCircle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { SecureBootIntroduction } from './components/SecureBootIntroduction'
import { SecureBootExercises } from './components/SecureBootExercises'
import { SecureBootChainAnalyzer } from './workshop/SecureBootChainAnalyzer'
import { FirmwareSigningMigrator } from './workshop/FirmwareSigningMigrator'
import { TPMKeyHierarchyExplorer } from './workshop/TPMKeyHierarchyExplorer'
import { FirmwareVendorMatrix } from './workshop/FirmwareVendorMatrix'
import { AttestationFlowDesigner } from './workshop/AttestationFlowDesigner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'boot-chain-analyzer',
    title: 'Step 1: Boot Chain',
    description:
      'Analyze the UEFI Secure Boot key hierarchy (PK/KEK/db) and identify quantum-vulnerable signing surfaces.',
    icon: Shield,
  },
  {
    id: 'firmware-signing',
    title: 'Step 2: Firmware Signing',
    description:
      'Walk through the 4-step ML-DSA-65 firmware signing migration: inventory, keygen, sign, verify.',
    icon: FileCode,
  },
  {
    id: 'tpm-hierarchy',
    title: 'Step 3: TPM Hierarchy',
    description:
      'Explore TPM 2.0 key hierarchies and the hybrid RSA TPM + ML-DSA software key approach for attestation.',
    icon: Key,
  },
  {
    id: 'vendor-matrix',
    title: 'Step 4: Vendor Matrix',
    description:
      'Compare BIOS/firmware vendor PQC readiness: AMI, Insyde, EDK2, Dell, HPE, Lenovo, Intel.',
    icon: BarChart3,
  },
  {
    id: 'attestation-designer',
    title: 'Step 5: Attestation',
    description:
      'Design PQC attestation flows for Measured Boot, TPM Quote, DICE, FIDO Device Onboard, and RA-TLS.',
    icon: CheckCircle,
  },
]

export const SecureBootPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Migrate UEFI Secure Boot, firmware signing, and hardware root of trust to post-quantum cryptography. Covers ML-DSA-65 firmware signatures, TPM 2.0 key hierarchies, UEFI db/KEK/PK migration, and BIOS vendor roadmaps."
    learn={(api) => <SecureBootIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <SecureBootExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SecureBootChainAnalyzer key={`chain-${configKey}`} />
        case 1:
          return <FirmwareSigningMigrator key={`signing-${configKey}`} />
        case 2:
          return (
            <>
              <div className="mb-4 p-4 rounded-lg border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground mb-1">
                    Try it live — real TPM 2.0 V1.85 keygen in the sandbox
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Run the <strong>pqctoday-tpm</strong> fork (Stefan Berger's libtpms + swtpm)
                    against the <strong>pqctoday-hsm</strong> softhsmv3 backend. See real
                    TPM2_CreatePrimary outputs for EK / SRK / AIK / IDevID across classical and PQC
                    (ML-KEM-768, ML-DSA-65) with cross-verification.
                  </p>
                </div>
                <Link
                  to="/playground/sbx-tpm-pqc-migration"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0"
                >
                  Open scenario <ExternalLink size={14} />
                </Link>
              </div>
              <TPMKeyHierarchyExplorer key={`tpm-${configKey}`} />
            </>
          )
        case 3:
          return <FirmwareVendorMatrix key={`vendors-${configKey}`} />
        case 4:
          return <AttestationFlowDesigner key={`attestation-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
