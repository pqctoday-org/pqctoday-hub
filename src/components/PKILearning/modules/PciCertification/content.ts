// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Structured content for the PCI Certification deep dive (LM-071).
 *
 * SPLIT 2026-09-27 (out of LM-065, then out of LM-067 the same day): this
 * module lists exactly the references its own files cite (plus any that were
 * listed for its scheme but cited nowhere). The
 * four certification modules share some rows because the fundamentals'
 * shared-PQC sections cite scheme documents too.
 *
 * `standards[]` is the plan r2 §7 source set: the rows "already in" the
 * library plus the WS-1 rows added on 24 September 2026 (library_09242026.csv).
 * Every id below was checked against that CSV (status=active) — getStandard()
 * throws at module-init on an unknown id.
 *
 * Grouped policy/program first, then specifications, so the spot-check stride
 * sample (moduleStandardsOrdering.driftguard.test.ts) reads scheme documents.
 *
 * The six rows that were pending here (build spec §6.2) landed on 2026-09-25
 * and are now cited properly rather than in plain text.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pci-certification',
  version: '0.1.0',
  // No lastReviewed: nobody has reviewed this module's claims via
  // record_module_review.py yet (moduleReviewHonesty.test.ts). v1 ships as
  // "practitioner orientation", not reviewed by a lab or certification body.
  lastEdited: '2026-09-27',

  standards: [
    // ── PCI (public documents only, plan r2 D4) ──
    getStandard('PCI-SSC-Blog-Publishes-PTS-HSM-v5-0'),
    getStandard('PCI-SSC-Bulletin-PTS-HSM-v4-Extension'),
    getStandard('PCI-PTS-HSM-Modular-Security-Requirements-v4-0'),
    getStandard('PCI-PTS-Program-Guide-v1-9'),
    getStandard('PCI-PTS-Listing-Field-Definitions'),
    getStandard('PCI-PIN-v3-1-ROC-Reporting-Template'),
    getStandard('PCI-P2PE-Security-Requirements-v3-1'), // superseded by v3.2 (June 2025)
    getStandard('PCI-SSC-P2PE-Program-Page'),
    getStandard('PCI-SSC-Blog-KMO-v1-0-Published'),
    getStandard('PCI-SSC-Blog-Authentication-Cryptography-Guidance'),
    getStandard('PCI-DSS-v4-0-1-Requirements-and-Testing-Procedures'),
    // FIPS 140-2 → 140-3 transition dates the PCI data cites (pciData.ts)
    getStandard('NIST-CMVP-140-2-to-140-3-Transition-Timeline'),
  ],

  // The anchor product's change (build spec §5): adding ML-KEM and ML-DSA. The
  // parameter sets are the ones EUCC ACM v2 recommends (plan r2 §5, Path C).
  algorithms: [getAlgorithm('ML-KEM-768'), getAlgorithm('ML-DSA-65')],

  deadlines: [
    // Deliberately empty. Market/policy deadlines are read at runtime from the
    // Hub timeline facts (build spec §5), never typed into this module; scheme
    // clocks (plan r2 §5.8) are cited to their library rows in the prose.
  ],

  narratives: {},
}
