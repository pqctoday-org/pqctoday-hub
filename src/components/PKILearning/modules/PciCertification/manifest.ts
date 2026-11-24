// SPDX-License-Identifier: AGPL-3.0-only
// OWNER: Scaffold
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * PCI Certification (LM-071).
 *
 * SPLIT 2026-09-27 (user decision) out of the FIPS 140-3 & PCI deep dive
 * (`fips-pci-certification`, LM-067, itself split out of LM-065 that morning).
 * The PCI sections, workshop step, exercises and data moved here unchanged,
 * with the same ids. Learners who open the old URL with `?path=pci` are
 * redirected here; saved progress on the old id carries to LM-067
 * (MODULE_ID_RENAMES is 1→1). The anchor product (the fictional Orrin N7
 * network HSM) and the shared types stay single-sourced in LM-065's data/.
 *
 * One timed ~60-minute route. Depth beyond it is `optional` reference
 * material, excluded from duration and completion.
 */
const manifest: ModuleManifest = {
  id: 'pci-certification',
  whyThisMatters:
    'A PCI PTS HSM approval proves one device, and the PIN, P2PE and KMO standards govern how it is operated. A payment HSM that adds PQC needs its own PCI route, and a FIPS 140-3 certificate is not a PCI approval.',
  learnSections: [
    { id: 'pci-pts-approval', label: 'PTS HSM device approval' },
    { id: 'pci-v5-changes', label: 'What PTS HSM v5.0 changed' },
    { id: 'pci-pqc-truth', label: 'PQC and PCI: what is and isn’t required' },
    { id: 'pci-operating-stack', label: 'PIN, P2PE, KMO and key-injection: the boundary' },
    { id: 'pci-pin-security', label: 'PCI PIN Security v3.1', optional: true },
    { id: 'pci-p2pe-kif', label: 'P2PE and key-injection facilities', optional: true },
    { id: 'pci-kmo', label: 'PCI KMO v1.0', optional: true },
  ],
  workshopSteps: [{ id: 'pci-evidence-review', label: 'Payment HSM evidence review' }],
  startHere: {
    step: 'pci-evidence-review',
    text: 'Open Payment HSM evidence review and check a payment HSM’s PTS listing, Security Policy, FIPS certificate and KMO/PIN assessment scope.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PciCertificationModule })),
}

export default manifest
