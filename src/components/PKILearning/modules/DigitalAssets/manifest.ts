// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'digital-assets',
  contentVersion: 3,
  lm_id: 'LM-045',
  title: 'Digital Assets',
  description:
    'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana. Explore institutional custody architecture with PQC threat analysis.',
  whyThisMatters:
    "Bitcoin, Ethereum, and Solana wallets sign with ECDSA/EdDSA today — a cryptographically-relevant quantum computer doesn't just threaten future transactions, it threatens every public key already exposed on-chain.",
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 5,
  // learnSections CORRECTED 2026-07-30 to describe this module's actual
  // learn tab. The previous ids read like the module's workshop steps and
  // did not correspond to any rendered heading — which made the table of
  // contents, section progress and deep links all wrong together.
  learnSections: [
    { id: 'blockchain-crypto', label: 'What is Blockchain Cryptography?' },
    { id: 'elliptic-curves', label: 'Elliptic Curves: secp256k1 vs Ed25519' },
    { id: 'address-derivation', label: 'Address Derivation Across Chains' },
    { id: 'signatures', label: 'Digital Signatures: ECDSA vs EdDSA' },
    { id: 'hd-wallets', label: 'HD Wallets and Key Management' },
    { id: 'pqc-blockchain', label: 'Post-Quantum Threats to Blockchains' },
  ],
  workshopSteps: [
    { id: 'bitcoin', label: 'Bitcoin Flow' },
    { id: 'ethereum', label: 'Ethereum Flow' },
    { id: 'solana', label: 'Solana Flow' },
    { id: 'hd-wallet', label: 'HD Wallet Flow' },
    { id: 'pqc-migration', label: 'PQC Defense' },
    { id: 'custody-architecture', label: 'Custody Architecture' },
  ],
  playgroundTool: 'bitcoin-flow',
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DigitalAssetsModule })),
}

export default manifest
