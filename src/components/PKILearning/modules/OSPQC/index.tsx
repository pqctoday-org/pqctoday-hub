// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Monitor, Settings, Key, Package, CheckCircle } from 'lucide-react'
import { OSPQCIntroduction } from './components/OSPQCIntroduction'
import { OSPQCExercises } from './components/OSPQCExercises'
import { OSCryptoInventory } from './workshop/OSCryptoInventory'
import { SystemTLSConfigurator } from './workshop/SystemTLSConfigurator'
import { SSHHostKeyMigrator } from './workshop/SSHHostKeyMigrator'
import { PackageSigningMigrator } from './workshop/PackageSigningMigrator'
import { FIPSCompatibilityChecker } from './workshop/FIPSCompatibilityChecker'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'crypto-inventory',
    title: 'Step 1: Crypto Inventory',
    description:
      'Audit all OS-level crypto components: system TLS, SSH daemon, package manager, kernel crypto, and container runtime.',
    icon: Monitor,
  },
  {
    id: 'system-tls',
    title: 'Step 2: System TLS Policy',
    description:
      'Configure system-wide TLS PQC policy on RHEL (crypto-policies), Ubuntu (openssl.cnf), and Windows (Schannel).',
    icon: Settings,
  },
  {
    id: 'ssh-keys',
    title: 'Step 3: SSH Host Keys',
    description:
      'Migrate SSH host keys to ML-DSA-65, update sshd_config, and manage known_hosts across your fleet.',
    icon: Key,
  },
  {
    id: 'package-signing',
    title: 'Step 4: Package Signing',
    description:
      'Migrate RPM and DEB package signing from GPG RSA-4096 to ML-DSA-65 with trust chain analysis.',
    icon: Package,
  },
  {
    id: 'fips-compat',
    title: 'Step 5: FIPS Compatibility',
    description:
      'Analyze FIPS 140-3 module PQC inclusion status and design hybrid FIPS + PQC strategies for regulated environments.',
    icon: CheckCircle,
  },
]

export const OSPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="OS & Platform Crypto PQC"
    description="Migrate OS-level cryptography to post-quantum algorithms: system TLS policies, SSH host keys, package signing, and FIPS mode compatibility."
    learn={(api) => <OSPQCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <OSPQCExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <OSCryptoInventory key={`inventory-${configKey}`} />
        case 1:
          return <SystemTLSConfigurator key={`tls-${configKey}`} />
        case 2:
          return <SSHHostKeyMigrator key={`ssh-${configKey}`} />
        case 3:
          return <PackageSigningMigrator key={`packages-${configKey}`} />
        case 4:
          return <FIPSCompatibilityChecker key={`fips-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
