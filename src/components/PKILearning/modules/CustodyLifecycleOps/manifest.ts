// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'custody-lifecycle-ops',
  whyThisMatters:
    'Custody failures happen across the entire key lifecycle, not only during signing: unrevoked token allowances or EIP-7702 delegations outlive withdrawal pauses, untested recovery paths become attack paths, rushed restores re-enable attacker footholds, and premature key destruction permanently burns incoming funds.',
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
  load: () => import('./index').then((m) => ({ default: m.CustodyLifecycleOpsModule })),
}

export default manifest
