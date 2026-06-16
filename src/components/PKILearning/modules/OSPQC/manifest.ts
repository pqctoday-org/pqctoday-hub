// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'os-pqc',
  lm_id: 'LM-024',
  title: 'Operating System & Platform Crypto PQC',
  description:
    'Migrate OS-level cryptography to quantum-safe algorithms. Covers system TLS policy (OpenSSL, GnuTLS, SChannel), SSH host key migration to ML-DSA, RPM/DEB package signing, and FIPS mode compatibility for PQC-enabled operating systems.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 2,
  learnSections: [
    { id: 'os-crypto-landscape', label: 'OS Cryptographic Subsystems: OpenSSL, CNG, GnuPG' },
    { id: 'ssh-host-keys', label: 'SSH Host Key Migration to ML-DSA' },
    { id: 'system-tls', label: 'System-Wide TLS Configuration for PQC' },
    { id: 'package-signing', label: 'Package Signing and Repository Trust with PQC' },
    { id: 'fips-mode', label: 'FIPS Mode and PQC-Enabled OS Configurations' },
  ],
  workshopSteps: [
    { id: 'crypto-inventory', label: 'OS Crypto Inventory' },
    { id: 'system-tls', label: 'System TLS Configurator' },
    { id: 'ssh-keys', label: 'SSH Host Key Migrator' },
    { id: 'package-signing', label: 'Package Signing Migrator' },
    { id: 'fips-compat', label: 'FIPS Compatibility Checker' },
  ],
  load: () => import('./index').then((m) => ({ default: m.OSPQCModule })),
}

export default manifest
