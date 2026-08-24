// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'os-pqc',
  contentVersion: 2,
  lm_id: 'LM-024',
  title: 'Operating System & Platform Crypto PQC',
  description:
    'Migrate OS-level cryptography to quantum-safe algorithms. Covers system TLS policy (OpenSSL, GnuTLS, SChannel), SSH host key migration to ML-DSA, RPM/DEB package signing, and FIPS mode compatibility for PQC-enabled operating systems.',
  whyThisMatters:
    'The OS crypto stack — OpenSSL, SChannel, SSH host keys, package signing — is the foundation every application above it silently depends on; get this layer wrong and every app inherits the vulnerability, whether it knows it or not.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 2,
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.OSPQCModule })),
}

export default manifest
