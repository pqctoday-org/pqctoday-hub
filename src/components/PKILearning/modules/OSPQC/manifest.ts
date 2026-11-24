// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'os-pqc',
  whyThisMatters:
    'System crypto policy can change how applications use shared TLS backends. Applications with bundled libraries or explicit settings may need their own migration. Identify what each client actually uses before rolling out a policy.',
  learnSections: [
    { id: 'os-crypto-landscape', label: 'OS Crypto Subsystems' },
    { id: 'ssh-host-keys', label: 'SSH Host Key Migration' },
    { id: 'system-tls', label: 'System TLS for PQC' },
    { id: 'package-signing', label: 'Package Signing & Trust' },
    { id: 'fips-mode', label: 'FIPS Mode & PQC OS' },
  ],
  workshopSteps: [
    { id: 'crypto-inventory', label: 'OS Crypto Inventory' },
    { id: 'system-tls', label: 'System TLS Configurator' },
    { id: 'ssh-keys', label: 'SSH Host Key Migrator' },
    { id: 'package-signing', label: 'Package Signing Migrator' },
    { id: 'fips-compat', label: 'FIPS Compatibility Checker' },
  ],
  startHere: {
    step: 'ssh-keys',
    text: 'Migrate SSH host keys to ML-DSA-65 in step 3: the sshd_config changes and the known_hosts roll-out across a fleet are laid out in order.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.OSPQCModule })),
}

export default resolveManifest(manifest)
