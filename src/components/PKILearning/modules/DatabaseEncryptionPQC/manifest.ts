// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'database-encryption-pqc',
  lm_id: 'LM-023',
  title: 'Database Encryption & PQC',
  description:
    'Migrate database encryption to quantum-safe algorithms: TDE re-keying, BYOK/HYOK key ownership, queryable encryption compatibility, and fleet readiness assessment.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Software Infrastructure',
  trackOrder: 1,
  learnSections: [
    { id: 'encryption-layers', label: 'Encryption Layers: TDE, CLE, Field-Level, Queryable' },
    { id: 'byok-hyok', label: 'BYOK, HYOK, and External PQC Key Managers' },
    { id: 'online-migration', label: 'Online vs Offline Migration, Performance Overhead' },
    { id: 'queryable-pqc', label: 'Queryable Encryption Patterns with PQC' },
    { id: 'compliance', label: 'GDPR, HIPAA, and Regulatory Requirements' },
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
