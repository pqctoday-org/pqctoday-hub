// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'custody-threats-controls',
  whyThisMatters:
    'Keeping private keys inside an HSM, MPC cluster, or enclave does not prevent unauthorized transfers if an attacker can deceive the signing screen, hijack an authorized requester, or abuse pre-signed authorizations. Decisions depend on putting transaction parsing, policy checks, and quorum approvals inside a protected boundary with stated authority assumptions.',
  learnSections: [
    { id: 'signing-authority', label: '1. Keys vs Signing Authority' },
    { id: 'exfiltration-paths', label: '2. Exfiltration & Misuse Paths' },
    { id: 'adversary-model', label: '2b. Adversary Model' },
    { id: 'agent-authority', label: '2c. AI Agent Spend Authority' },
    { id: 'case-studies', label: '3. Case Studies: Bybit, Drift & Binance' },
    { id: 'limits-of-the-three', label: '4. Limits of HSM, MPC & Enclaves' },
    { id: 'combinations', label: '5. Control Combinations & Assumptions' },
    { id: 'mpc-plus-hsm', label: '5b. Hybrid MPC + HSM Variants' },
    { id: 'takeaways', label: '9A. Takeaways Matrix' },
  ],
  workshopSteps: [
    { id: 'blind-vs-clear', label: 'Blind vs Clear Signing (HSM)' },
    { id: 'quorum-approvals', label: 'Quorum Approvals (ML-DSA-65 + secp256k1)' },
    { id: 'threshold-signing', label: 'Threshold Signing (RFC 9591 FROST)' },
    { id: 'combination-builder', label: 'Control Combination Builder' },
    { id: 'agent-wallet-scope', label: 'Agent Wallet Scoping' },
  ],
  startHere: {
    step: 'blind-vs-clear',
    text: 'Open Blind vs Clear Signing, sign a sample transfer hash with CKM_ECDSA, then swap the hidden payload for a delegatecall upgrade to see why parsing without a policy check refuses nothing.',
  },
  load: () => import('./index').then((m) => ({ default: m.CustodyThreatsControlsModule })),
}

export default resolveManifest(manifest)
