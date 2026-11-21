// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'custody-pqc-migration',
  contentVersion: 2,
  lm_id: 'LM-085',
  title: 'Custody PQC Migration',
  description:
    'What a quantum attacker changes for digital-asset custody and how to migrate: HSM/MPC/enclave quantum deltas, PQ threshold MPC research, Shamir & SLIP-39 seed backups, hardware wallet claim splitting, PQ smart accounts, and phased platform- vs chain-controlled migration.',
  whyThisMatters:
    'None of today’s custody architectures is post-quantum on its own: classical threshold signatures output ordinary ECDSA/EdDSA signatures, share transport and backup envelopes are harvest-now-decrypt-later targets, and enclave attestation chains remain classical. Custodians can migrate platform-controlled channels, backup envelopes, and approval signatures now while preparing account- and chain-controlled paths separately.',
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 13,
  learnSections: [
    { id: 'quantum-limits', label: '7. Quantum Limits (Delta)' },
    { id: 'evolution', label: '8. How Each Model Is Evolving' },
    { id: 'pq-mpc-research', label: '8b. PQ Threshold & MPC Research' },
    { id: 'shamir-seeds', label: '5c. Shamir Seeds & SLIP-39' },
    { id: 'pq-hardware-wallets', label: '5d. PQ Hardware Wallet Claims' },
    { id: 'pq-smart-accounts', label: '8d. PQ Smart Accounts & Custody' },
    { id: 'custody-migration-path', label: '8c. Custody Migration Path' },
    { id: 'quantum-views-of-module-A', label: '7b. Quantum Views of Custody Ops' },
    { id: 'takeaways', label: '9B. Takeaways Matrix' },
  ],
  workshopSteps: [
    { id: 'quantum-limits-check', label: 'Quantum Limits & HNDL Check' },
    { id: 'custody-migration-planner', label: 'Custody Migration Planner' },
    { id: 'shamir-seed-backup', label: 'Shamir Seed & Envelope Demo' },
    { id: 'hw-wallet-claim-reader', label: 'HW Wallet Claim Reader' },
  ],
  startHere: {
    step: 'quantum-limits-check',
    text: 'Start with the Quantum Limits & HNDL Check to pinpoint what a CRQC breaks first in each custody combination and which party-to-party messages are exposed to harvest-now-decrypt-later today.',
  },
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Falcon', 'ECDSA'],
    standards: ['FIPS 203', 'FIPS 204', 'FIPS 205', 'PKCS#11', 'RFC 10024'],
  },
  load: () => import('./index').then((m) => ({ default: m.CustodyPqcMigrationModule })),
}

export default manifest
