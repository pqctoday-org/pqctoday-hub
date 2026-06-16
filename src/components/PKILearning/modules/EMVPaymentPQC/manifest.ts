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
    { id: 'card-auth', label: 'Card Authentication: SDA, DDA & CDA' },
    { id: 'network-architecture', label: 'Payment Network Architecture' },
    { id: 'tokenization', label: 'Tokenization & Mobile Payments' },
    { id: 'ecommerce', label: 'E-Commerce & Card-Not-Present' },
    { id: 'pos-terminals', label: 'POS Terminals & Key Injection' },
    { id: 'quantum-threats', label: 'Quantum Threats to Payment Systems' },
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
  load: () => import('./index').then((m) => ({ default: m.EMVPaymentPQCModule })),
}

export default manifest
