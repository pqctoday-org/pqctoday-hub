// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * FIPS 140-3 & PCI Certification (LM-067).
 *
 * SPLIT 2026-09-27 out of LM-065 (crypto-product-certification), which the
 * user judged too large. Sections, workshop steps, exercises and data moved
 * here unchanged, with the same ids; LM-065 keeps the fundamentals every
 * scheme shares (four questions, scope before level, what PQC changes, the
 * capstone). The anchor product (the fictional Orrin N7 network HSM) and the
 * shared types stay single-sourced in LM-065's data/ folder.
 *
 * Two alternative learn paths, one per scheme, each a timed ~60-minute route.
 * Depth beyond the timed route is `optional` reference material, excluded
 * from duration and completion. Off-path sections are hidden.
 */
const manifest: ModuleManifest = {
  id: 'fips-pci-certification',
  contentVersion: 1,
  lm_id: 'LM-067',
  title: 'FIPS 140-3 & PCI Certification',
  description:
    'FIPS 140-3 and the CMVP, and PCI PTS HSM with the payment operating stack (PIN, P2PE, KMO): what each certificate proves, how to read one, and what adding PQC means for each.',
  whyThisMatters:
    'The two lab-tested schemes a payment or network HSM meets first: a FIPS 140-3 certificate proves one module at one version and configuration; a PCI PTS HSM approval proves one device, and the PIN, P2PE and KMO standards govern how it is operated. Neither accepts a PQC change without its own route.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p7',
  track: 'Hardware Infrastructure',
  trackOrder: 6,
  learnSections: [
    { id: 'fips-what-it-is', label: 'FIPS 140-3 and the CMVP' },
    { id: 'fips-requirement-areas', label: 'The eleven requirement areas' },
    { id: 'fips-levels', label: 'Security Levels 1–4' },
    { id: 'fips-lifecycle', label: 'Validation lifecycle and the MIP queue' },
    { id: 'fips-acvp-bridge', label: 'Algorithm validation is not the certificate' },
    { id: 'fips-landscape', label: 'Today’s landscape and the 2026 horizon' },
    { id: 'fips-route-table', label: 'CMVP submission routes (Manual v2.7)', optional: true },
    { id: 'pci-pts-approval', label: 'PTS HSM device approval' },
    { id: 'pci-v5-changes', label: 'What PTS HSM v5.0 changed' },
    { id: 'pci-pqc-truth', label: 'PQC and PCI: what is and isn’t required' },
    { id: 'pci-operating-stack', label: 'PIN, P2PE, KMO and key-injection: the boundary' },
    { id: 'pci-pin-security', label: 'PCI PIN Security v3.1', optional: true },
    { id: 'pci-p2pe-kif', label: 'P2PE and key-injection facilities', optional: true },
    { id: 'pci-kmo', label: 'PCI KMO v1.0', optional: true },
  ],
  learnPaths: [
    {
      id: 'fips',
      label: 'FIPS 140-3 / CMVP',
      entrySection: 'fips-what-it-is',
      duration: '60 min',
      sections: [
        'fips-what-it-is',
        'fips-requirement-areas',
        'fips-levels',
        'fips-lifecycle',
        'fips-acvp-bridge',
        'fips-landscape',
        'fips-route-table',
      ],
    },
    {
      id: 'pci',
      label: 'PCI (full stack)',
      entrySection: 'pci-pts-approval',
      duration: '60 min',
      sections: [
        'pci-pts-approval',
        'pci-v5-changes',
        'pci-pqc-truth',
        'pci-operating-stack',
        'pci-pin-security',
        'pci-p2pe-kif',
        'pci-kmo',
      ],
    },
  ],
  offPathSections: 'hide',
  referencePaths: {
    // ── FIPS 140-3 / CMVP (Path A) ──
    'FIPS-140-3-STANDARD': ['fips'],
    'CMVP-MGMT-MANUAL': ['fips'],
    'NIST-FIPS140-3-IG-PQC': ['fips'],
    'NIST-CMVP-MIP-List': ['fips'],
    'NIST-CMVP-Validated-Modules': ['fips'],
    'NIST-CMVP-140-2-to-140-3-Transition-Timeline': ['fips'],
    'EO-2026-06-22-Securing-the-Nation': ['fips'],
    'NIST-SP-800-140': ['fips'],
    'NIST-SP-800-140A': ['fips'],
    'NIST-SP-800-140B': ['fips'],
    'NIST-SP-800-140C': ['fips'],
    'NIST-SP-800-140D': ['fips'],
    'NIST-SP-800-140E': ['fips'],
    'NIST-SP-800-140F': ['fips'],
    'NIST-ACVP': ['fips'],
    'NIST-CMVP-ESV': ['fips'],
    'NIST-SP-1800-40B-IPD': ['fips'],
    'NIST-SP-1800-40A-PD': ['fips'],
    'NIST-CSWP-37A': ['fips'],
    'NIST-CSWP-37B-IPD': ['fips'],
    'NIST IR 8547': ['fips'],

    // ── Common Criteria / CCRA (Path B) ──
    // CCMC-011 is CCRA/EUCC co-existence, so it belongs to both schemes.
    // ── EUCC, eIDAS and Protection Profiles (Path C) ──
    // The protection profiles are evaluated under Common Criteria and cited by
    // the EUCC path, so both paths get them.
    // ── PCI (Path D) ──
    'PCI-SSC-Blog-Publishes-PTS-HSM-v5-0': ['pci'],
    'PCI-SSC-Bulletin-PTS-HSM-v4-Extension': ['pci'],
    'PCI-PTS-HSM-Modular-Security-Requirements-v4-0': ['pci'],
    'PCI-PTS-Program-Guide-v1-9': ['pci'],
    'PCI-PTS-Listing-Field-Definitions': ['pci'],
    'PCI-PIN-v3-1-ROC-Reporting-Template': ['pci'],
    'PCI-P2PE-Security-Requirements-v3-1': ['pci'],
    'PCI-SSC-P2PE-Program-Page': ['pci'],
    'PCI-SSC-Blog-KMO-v1-0-Published': ['pci'],
    'PCI-SSC-Blog-Authentication-Cryptography-Guidance': ['pci'],
    'PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures': ['pci'],
  },
  workshopSteps: [
    { id: 'fips-level-planner', label: 'Level and boundary planner', paths: ['fips'] },
    { id: 'pci-evidence-review', label: 'Payment HSM evidence review', paths: ['pci'] },
  ],
  startHere: {
    step: 'fips-level-planner',
    text: 'Open Level and boundary planner and choose the FIPS 140-3 security level and module boundary for the anchor HSM — or switch to the PCI path and open Payment HSM evidence review.',
  },
  // Derived from content.ts, restricted to the STANDARD_TAXONOMY vocabulary
  // (moduleEnrichment.ts). Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA'],
    standards: ['FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.FipsPciCertificationModule })),
}

export default manifest
