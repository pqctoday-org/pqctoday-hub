// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * The id stays `emv-payment-pqc` even though the module now covers banking and
 * retail as well. It is referenced in 40+ places outside this directory — the
 * public URL, sitemap, embed manifest, SEO canonical, RAG corpus, quiz
 * vocabulary, the simulation's sector track, and `module_ids` on 24 library
 * rows. Renaming buys a tidier slug and breaks all of that. The title carries
 * the scope change; the route does not.
 */
const manifest: ModuleManifest = {
  id: 'emv-payment-pqc',
  contentVersion: 6,
  lm_id: 'LM-044',
  title: 'Financial Services & Payments PQC',
  description:
    'The whole payments and banking stack: EMV card authentication, tokenization, acquiring and retail checkout, interbank settlement rails, bank key management and key blocks, and the sector regulation that sets the pace — planned as one quantum-safe migration.',
  whyThisMatters:
    'Cards, banking rails and retail checkout share cryptography, share vendors, and increasingly share deadlines — but are usually migrated by different teams reading different documents. One un-migrated link is a fraud vector at scale, and no single institution can fix a correspondent chain alone.',
  duration: '120 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 4,
  learnSections: [
    { id: 'emv-ecosystem', label: 'The EMV Payment Ecosystem' },
    { id: 'card-auth', label: 'Card Auth: SDA, DDA & CDA' },
    { id: 'network-architecture', label: 'Network Architecture' },
    { id: 'tokenization', label: 'Tokenization & Mobile Pay' },
    { id: 'ecommerce', label: 'E-Commerce, CNP & Retail Checkout' },
    { id: 'pos-terminals', label: 'POS & Key Injection' },
    { id: 'interbank-rails', label: 'Interbank Rails & Settlement' },
    { id: 'banking-key-management', label: 'Banking Key Management & Key Blocks' },
    { id: 'sector-regulation', label: 'Sector Regulation & Deadlines' },
    { id: 'open-banking-psd2', label: 'Open Banking & PSD2 Strong Customer Authentication' },
    { id: 'quantum-threats', label: 'Quantum Payment Threats' },
    { id: 'migration-landscape', label: 'PQC Migration Landscape' },
  ],
  /**
   * Three industries deep-link into this module (Payment Card Industry,
   * Financial Services / Banking, Retail / E-Commerce). Each lands on its own
   * entry section and completes on its own sections — 110 minutes is the whole
   * module, not what any one learner is asked for.
   *
   * 'quantum-threats' and 'migration-landscape' are deliberately in every
   * path: they are the payoff, and no audience should skip them.
   */
  learnPaths: [
    {
      id: 'cards',
      label: 'Cards & Acceptance',
      audience: 'Issuers, acquirers, processors, terminal estates',
      entrySection: 'emv-ecosystem',
      duration: '55 min',
      sections: [
        'emv-ecosystem',
        'card-auth',
        'network-architecture',
        'tokenization',
        'pos-terminals',
        'quantum-threats',
        'migration-landscape',
      ],
    },
    {
      id: 'banking',
      label: 'Banking & Settlement',
      audience: 'Banks, central banks, financial market infrastructure',
      entrySection: 'interbank-rails',
      duration: '55 min',
      sections: [
        'interbank-rails',
        'banking-key-management',
        'sector-regulation',
        'open-banking-psd2',
        'quantum-threats',
        'migration-landscape',
      ],
    },
    {
      id: 'retail',
      label: 'Retail & E-Commerce',
      audience: 'Merchants, PSPs, e-commerce platforms',
      entrySection: 'ecommerce',
      duration: '25 min',
      sections: ['ecommerce', 'tokenization', 'quantum-threats', 'migration-landscape'],
    },
  ],
  workshopSteps: [
    { id: 'network-comparator', label: 'Network Comparator' },
    { id: 'transaction-simulator', label: 'Transaction Simulator' },
    { id: 'card-provisioning', label: 'Card Provisioning' },
    { id: 'tokenization-explorer', label: 'Tokenization Explorer' },
    { id: 'pos-crypto-analyzer', label: 'POS Crypto Analyzer' },
    { id: 'migration-risk-matrix', label: 'Migration Risk Matrix' },
    { id: 'settlement-exposure', label: 'Settlement Exposure Modeller' },
    { id: 'regulation-timeline', label: 'Sector Regulation Timeline' },
  ],
  // simRelevance.ts already maps this module to the financial and retail
  // scenarios; declaring it here is what actually surfaces the sim as practice.
  practiceInSim: true,
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EMVPaymentPQCModule })),
}

export default manifest
