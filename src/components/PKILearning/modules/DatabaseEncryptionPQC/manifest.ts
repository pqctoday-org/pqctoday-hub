// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'database-encryption-pqc',
  contentVersion: 4,
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
  startHere: {
    step: 'tde-migration-planner',
    text: 'Step through the TDE Migration Planner: the AES-256 master key is re-wrapped under ML-KEM, and you see what the database has to re-encrypt — the key hierarchy, not the data.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['NSM-10', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DatabaseEncryptionPQCModule })),
}

export default manifest
