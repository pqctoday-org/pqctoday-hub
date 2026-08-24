// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'database-encryption-pqc',
  contentVersion: 2,
  lm_id: 'LM-023',
  title: 'Database Encryption & PQC',
  description:
    'Migrate database encryption to quantum-safe algorithms: TDE re-keying, BYOK/HYOK key ownership, queryable encryption compatibility, and fleet readiness assessment.',
  whyThisMatters:
    "Database encryption keys often outlive the application built around them — a TDE re-key done wrong doesn't just risk downtime, it risks re-encrypting data that was never at risk while missing the columns that were.",
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 1,
  learnSections: [
    { id: 'encryption-layers', label: 'TDE, CLE & Queryable' },
    { id: 'byok-hyok', label: 'BYOK, HYOK & PQC Keys' },
    { id: 'online-migration', label: 'Online vs Offline' },
    { id: 'queryable-pqc', label: 'Queryable Encryption PQC' },
    { id: 'compliance', label: 'GDPR, HIPAA & Regulatory' },
  ],
  workshopSteps: [
    { id: 'encryption-layer-mapper', label: 'Encryption Layer Mapper' },
    { id: 'tde-migration-planner', label: 'TDE Migration Planner' },
    { id: 'byok-key-designer', label: 'BYOK Architecture Designer' },
    { id: 'queryable-encryption-lab', label: 'Queryable Encryption Lab' },
    { id: 'database-readiness', label: 'Migration Readiness Assessment' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DatabaseEncryptionPQCModule })),
}

export default manifest
