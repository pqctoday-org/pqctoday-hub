// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'digital-assets',
  whyThisMatters:
    "Bitcoin, Ethereum, and Solana wallets sign with ECDSA/EdDSA today — a cryptographically-relevant quantum computer doesn't just threaten future transactions, it threatens every public key already exposed on-chain.",
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
    { id: 'air-gapped-vault-design', label: 'Air-Gapped Vault Design' },
  ],
  workshopSteps: [
    { id: 'bitcoin', label: 'Bitcoin Flow' },
    { id: 'ethereum', label: 'Ethereum Flow' },
    { id: 'solana', label: 'Solana Flow' },
    { id: 'hd-wallet', label: 'HD Wallet Flow' },
    { id: 'pqc-migration', label: 'PQC Defense' },
    { id: 'custody-architecture', label: 'Custody Architecture' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'bitcoin',
    text: 'Choose Bitcoin on the chain selector and walk its nine steps: a secp256k1 key is generated inside the in-browser HSM, an address derived, then a transaction formatted, signed and verified.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DigitalAssetsModule })),
}

export default manifest
