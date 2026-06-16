// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'crypto-dev-apis',
  lm_id: 'LM-021',
  title: 'Cryptographic APIs & Developer Languages',
  description:
    'Compare JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, and Bouncy Castle across 7 languages. Provider patterns, PQC library selection, support matrix, crypto agility patterns, and migration decision lab.',
  duration: '80 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Software Infrastructure',
  trackOrder: 3,
  learnSections: [
    { id: 'landscape', label: 'The Crypto API Landscape' },
    { id: 'principles', label: 'Common Principles Across All APIs' },
    { id: 'jca-bc', label: 'JCA/JCE & Bouncy Castle' },
    { id: 'openssl', label: 'OpenSSL & libcrypto' },
    { id: 'pkcs11', label: 'PKCS#11 — Hardware Abstraction' },
    { id: 'cng', label: 'KSP & Windows CNG' },
    { id: 'build-buy', label: 'Build vs Buy vs Open Source' },
    { id: 'pqc-libs', label: 'Open-Source PQC Libraries' },
    { id: 'languages', label: 'Language Ecosystem Overview' },
    { id: 'pqc-roadmap', label: 'PQC Readiness & Roadmap' },
  ],
  workshopSteps: [
    { id: 'api-architecture-explorer', label: 'API Architecture Explorer' },
    { id: 'language-ecosystem', label: 'Language Ecosystem Comparator' },
    { id: 'provider-patterns', label: 'Provider Pattern Workshop' },
    { id: 'build-buy-oss', label: 'Build vs Buy vs Open Source' },
    { id: 'pqc-library-explorer', label: 'PQC Library Explorer' },
    { id: 'pqc-support-matrix', label: 'PQC Support Matrix' },
    { id: 'crypto-agility-patterns', label: 'Crypto Agility Patterns' },
    { id: 'migration-decision-lab', label: 'Migration Decision Lab' },
  ],
  load: () => import('./index').then((m) => ({ default: m.CryptoDevAPIsModule })),
}

export default manifest
