// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'digital-assets',
  lm_id: 'LM-045',
  title: 'Digital Assets',
  description:
    'Learn cryptographic foundations of Bitcoin, Ethereum, and Solana. Explore institutional custody architecture with PQC threat analysis.',
  duration: '50 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 5,
  learnSections: [
    { id: 'bitcoin', label: 'Bitcoin: secp256k1 & ECDSA' },
    { id: 'ethereum', label: 'Ethereum: Keccak-256 & Smart Contracts' },
    { id: 'hd-wallets', label: 'HD Wallets: BIP32/39/44' },
    { id: 'pqc-blockchain', label: 'PQC Migration for Digital Assets' },
    { id: 'custody', label: 'Custody Architecture & PQC Threats' },
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
  load: () => import('./index').then((m) => ({ default: m.DigitalAssetsModule })),
}

export default manifest
