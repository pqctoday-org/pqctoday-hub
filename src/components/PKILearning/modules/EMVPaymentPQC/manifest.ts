// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'emv-payment-pqc',
  lm_id: 'LM-044',
  title: 'EMV Payment Systems & PQC',
  description:
    'Explore the EMV payment ecosystem — card authentication, tokenization, authorization networks, POS terminals, and e-commerce — and plan quantum-safe migration across Visa, Mastercard, Amex, UnionPay, and Discover.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 4,
  learnSections: [
    { id: 'emv-ecosystem', label: 'The EMV Payment Ecosystem' },
    { id: 'card-auth', label: 'Card Auth: SDA, DDA & CDA' },
    { id: 'network-architecture', label: 'Network Architecture' },
    { id: 'tokenization', label: 'Tokenization & Mobile Pay' },
    { id: 'ecommerce', label: 'E-Commerce & CNP' },
    { id: 'pos-terminals', label: 'POS & Key Injection' },
    { id: 'quantum-threats', label: 'Quantum Payment Threats' },
    { id: 'migration-landscape', label: 'PQC Migration Landscape' },
  ],
  workshopSteps: [
    { id: 'network-comparator', label: 'Network Comparator' },
    { id: 'transaction-simulator', label: 'Transaction Simulator' },
    { id: 'card-provisioning', label: 'Card Provisioning' },
    { id: 'tokenization-explorer', label: 'Tokenization Explorer' },
    { id: 'pos-crypto-analyzer', label: 'POS Crypto Analyzer' },
    { id: 'migration-risk-matrix', label: 'Migration Risk Matrix' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EMVPaymentPQCModule })),
}

export default manifest
