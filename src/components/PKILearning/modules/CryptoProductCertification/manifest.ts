// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * Cryptographic Product Certification (LM-065).
 *
 * Ids, labels, paths and optional flags are fixed by the build spec
 * (pqctoday-priv/nextfeature/cryptographic-certification-module-build-spec-09242026.md
 * §1–§3). Change them there first; four authors build against these ids.
 *
 * Four alternative curricula (plan r2 D2): each path is one timed 120-minute
 * route — common core + one scheme + the shared PQC / agility / capstone
 * material. Depth beyond the timed route is `optional` reference material,
 * excluded from duration and completion. Off-path sections are hidden.
 *
 * `prerequisiteIds` (plan r2 §3: standards-bodies, pqc-101) is deliberately NOT
 * declared: moduleRelations.driftguard.test.ts pins that no module authors a
 * graph yet, and declaring one REPLACES the computed "Related modules" list.
 */
const SHARED_TIMED = ['pqc-impact', 'agility-latency', 'transition-deadlines']
const SHARED_REFERENCE = ['change-routes-detail', 'electronic-exchange']
const CORE = ['four-questions', 'scope-before-level']

const manifest: ModuleManifest = {
  id: 'crypto-product-certification',
  contentVersion: 1,
  lm_id: 'LM-065',
  title: 'Cryptographic Product Certification',
  description:
    'FIPS 140-3, Common Criteria, EUCC and PCI: what each certificate proves, how to read one, and how to add PQC without losing certification.',
  whyThisMatters:
    'A certificate proves something narrow — a defined module, target or device, at a version and configuration, against one scheme’s requirements. Adding PQC changes the product, and each scheme has its own route for that change: a market deadline creates urgency, but no shortcut.',
  duration: '120 min',
  difficulty: 'advanced',
  frameworkPhase: 'p7',
  track: 'Hardware Infrastructure',
  trackOrder: 5,
  learnSections: [
    { id: 'four-questions', label: 'Four schemes, four questions' },
    { id: 'scope-before-level', label: 'Scope before level' },
    { id: 'fips-what-it-is', label: 'FIPS 140-3 and the CMVP' },
    { id: 'fips-requirement-areas', label: 'The eleven requirement areas' },
    { id: 'fips-levels', label: 'Security Levels 1–4' },
    { id: 'fips-lifecycle', label: 'Validation lifecycle and the MIP queue' },
    { id: 'fips-acvp-bridge', label: 'Algorithm validation is not the certificate' },
    { id: 'fips-landscape', label: 'Today’s landscape and the 2026 horizon' },
    { id: 'fips-route-table', label: 'CMVP submission routes (Manual v2.7)', optional: true },
    { id: 'cc-model', label: 'The Common Criteria model' },
    { id: 'cc-eal-decoding', label: 'EALs and "EAL4+"' },
    { id: 'cc-lifecycle', label: 'Certification lifecycle and CC:2022 transition' },
    { id: 'cc-continuity', label: 'Assurance continuity (CCDB-014)', optional: true },
    { id: 'eucc-scheme', label: 'EUCC is a scheme, not a PP' },
    { id: 'eidas-chain', label: 'From eIDAS to a certified device' },
    { id: 'pp-en419221-5', label: 'PP case: EN 419221-5 HSM' },
    { id: 'pp-security-ic', label: 'PP case: Security IC Platform', optional: true },
    { id: 'eucc-pqc-today', label: 'PQC under EUCC today (ACM v2)' },
    { id: 'pci-pts-approval', label: 'PTS HSM device approval' },
    { id: 'pci-v5-changes', label: 'What PTS HSM v5.0 changed' },
    { id: 'pci-pqc-truth', label: 'PQC and PCI: what is and isn’t required' },
    { id: 'pci-operating-stack', label: 'PIN, P2PE, KMO and key-injection: the boundary' },
    { id: 'pci-pin-security', label: 'PCI PIN Security v3.1', optional: true },
    { id: 'pci-p2pe-kif', label: 'P2PE and key-injection facilities', optional: true },
    { id: 'pci-kmo', label: 'PCI KMO v1.0', optional: true },
    { id: 'pqc-impact', label: 'What PQC changes in certification' },
    { id: 'agility-latency', label: 'Crypto agility vs certification latency' },
    { id: 'transition-deadlines', label: 'Deadlines: urgency without shortcuts' },
    { id: 'change-routes-detail', label: 'Incremental-change routes by scheme', optional: true },
    { id: 'electronic-exchange', label: 'Electronic evidence exchange', optional: true },
  ],
  learnPaths: [
    {
      id: 'fips',
      label: 'FIPS 140-3 / CMVP',
      entrySection: 'four-questions',
      duration: '120 min',
      sections: [
        ...CORE,
        'fips-what-it-is',
        'fips-requirement-areas',
        'fips-levels',
        'fips-lifecycle',
        'fips-acvp-bridge',
        'fips-landscape',
        'fips-route-table',
        ...SHARED_TIMED,
        ...SHARED_REFERENCE,
      ],
    },
    {
      id: 'cc',
      label: 'Common Criteria',
      entrySection: 'four-questions',
      duration: '120 min',
      sections: [
        ...CORE,
        'cc-model',
        'cc-eal-decoding',
        'cc-lifecycle',
        'cc-continuity',
        'pp-security-ic',
        ...SHARED_TIMED,
        ...SHARED_REFERENCE,
      ],
    },
    {
      id: 'eucc-eidas',
      label: 'EUCC & eIDAS',
      entrySection: 'four-questions',
      duration: '120 min',
      sections: [
        ...CORE,
        'eucc-scheme',
        'eidas-chain',
        'pp-en419221-5',
        'pp-security-ic',
        'eucc-pqc-today',
        ...SHARED_TIMED,
        ...SHARED_REFERENCE,
      ],
    },
    {
      id: 'pci',
      label: 'PCI (full stack)',
      entrySection: 'four-questions',
      duration: '120 min',
      sections: [
        ...CORE,
        'pci-pts-approval',
        'pci-v5-changes',
        'pci-pqc-truth',
        'pci-operating-stack',
        'pci-pin-security',
        'pci-p2pe-kif',
        'pci-kmo',
        ...SHARED_TIMED,
        ...SHARED_REFERENCE,
      ],
    },
  ],
  offPathSections: 'hide',
  workshopSteps: [
    { id: 'scheme-selector', label: 'Which scheme answers the question?' },
    { id: 'boundary-drawer', label: 'Draw the certification boundary' },
    { id: 'fips-level-planner', label: 'Level and boundary planner', paths: ['fips'] },
    { id: 'cc-claim-decoder', label: 'Decode the certificate claim', paths: ['cc'] },
    { id: 'eidas-trace', label: 'Regulation-to-certificate trace', paths: ['eucc-eidas'] },
    { id: 'pci-evidence-review', label: 'Payment HSM evidence review', paths: ['pci'] },
    { id: 'capstone', label: 'One product, four markets' },
    { id: 'change-analyzer', label: 'PQC change analyzer', optional: true },
    { id: 'evidence-exchange', label: 'Evidence exchange demo', optional: true },
  ],
  startHere: {
    step: 'scheme-selector',
    text: 'Open Which scheme answers the question? and match each certification claim to FIPS 140-3, Common Criteria, EUCC or PCI — the scheme whose certificate can actually answer it.',
  },
  // Derived from content.ts, restricted to the STANDARD_TAXONOMY vocabulary
  // (moduleEnrichment.ts). Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA'],
    standards: ['FIPS 140-3', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.CryptoProductCertificationModule })),
}

export default manifest
