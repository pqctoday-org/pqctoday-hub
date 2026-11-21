// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'custody-lifecycle-ops',
  contentVersion: 2,
  lm_id: 'LM-084',
  title: 'Custody Key Lifecycle Operations',
  description:
    'How digital-asset custody keys are created, guarded, watched, recovered, and retired in daily operation: DKG and share refresh, why chain keys cannot be revoked, recovery and inheritance, key ceremonies, custody monitoring, access control, backup and disaster recovery, and safe decommissioning.',
  whyThisMatters:
    'Custody failures happen across the entire key lifecycle, not only during signing: unrevoked token allowances or EIP-7702 delegations outlive withdrawal pauses, untested recovery paths become attack paths, rushed restores re-enable attacker footholds, and premature key destruction permanently burns incoming funds.',
  duration: '38 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 12,
  learnSections: [
    { id: 'key-lifecycle', label: '5a. Threshold Key Lifecycle' },
    { id: 'rotation-and-revocation', label: '5e. Rotation & Revocation' },
    { id: 'recovery-and-inheritance', label: '5f. Recovery & Inheritance' },
    { id: 'key-ceremonies', label: '5g. Key Ceremonies' },
    { id: 'monitoring-and-alerting', label: '5h. Monitoring & Alerting' },
    { id: 'access-control', label: '5i. Access Control & Separation' },
    { id: 'backup-and-dr', label: '5j. Backup & Disaster Recovery' },
    { id: 'destruction-and-decommissioning', label: '5k. Destruction & Decommissioning' },
    { id: 'takeaways', label: '9A. Takeaways Matrix' },
  ],
  workshopSteps: [
    { id: 'revoke-or-rotate', label: 'W9. Revoke or Rotate Matrix' },
    { id: 'recovery-and-inheritance-planner', label: 'W10. Recovery & Inheritance Planner' },
    { id: 'ceremony-script-review', label: 'W12. Ceremony Script Review' },
    { id: 'alert-triage', label: 'W14. Custody Alert Triage' },
    { id: 'access-matrix-review', label: 'W15. Access Matrix Review' },
    { id: 'dr-drill', label: 'W16. Disaster Recovery Drill' },
    { id: 'decommission-checklist', label: 'W17. Decommission Checklist' },
  ],
  startHere: {
    step: 'revoke-or-rotate',
    text: 'Open W9 (Revoke or Rotate Matrix) and classify twelve custody items — including an EOA hot wallet, an MPC share, a departed approver device, a token allowance, and an EIP-7702 delegation — to see why sweeping, resharing, and revoking solve different problems.',
  },
  taxonomy: {
    algorithms: ['ECDSA', 'ML-DSA', 'ML-KEM'],
    standards: ['FIPS 140-3', 'PKCS#11', 'KMIP', 'NIST SP 800-57', 'SP 800-88'],
  },
  load: () => import('./index').then((m) => ({ default: m.CustodyLifecycleOpsModule })),
}

export default manifest
