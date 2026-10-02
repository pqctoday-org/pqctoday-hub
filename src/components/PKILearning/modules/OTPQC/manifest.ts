// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

/**
 * OT & Industrial Control Systems PQC (LM-075).
 *
 * SPLIT 2026-10-01 (owner decision, iot-ot-split-plan-10012026.md): built on
 * the old Energy & Utilities module (energy-utilities-pqc) plus the OT half of
 * the old IoT/OT module (Purdue planner, rail section). Smart meters / AMI and
 * RF mesh moved to iot-pqc.
 */
const manifest: ModuleManifest = {
  id: 'ot-pqc',
  contentVersion: 2,
  lm_id: 'LM-075',
  title: 'OT & Industrial Control Systems PQC',
  description:
    'PQC for operational technology across energy, water, rail, manufacturing and building automation: IEC 62443 zones and conduits, OT protocol security (IEC 61850/62351, DNP3, OPC UA, CIP Security, PROFINET, BACnet/SC), safety-critical timing, PLC firmware and project signing, NERC CIP and NIS2, and brownfield retrofit.',
  whyThisMatters:
    'In OT a quantum computer’s worst trick is not reading old traffic but forging what controllers trust — firmware, project downloads, certificates and commands — on assets that stay in service for decades and cannot change crypto without a safety review.',
  duration: '90 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 6,
  learnSections: [
    { id: 'why-ot', label: 'Why OT is different' },
    { id: 'architecture', label: 'Purdue, zones and conduits' },
    { id: 'ot-protocols', label: 'OT protocol native security' },
    { id: 'safety-timing', label: 'Safety-critical timing' },
    { id: 'firmware-project-signing', label: 'Firmware and project signing' },
    { id: 'remote-access', label: 'Remote access and boundaries' },
    { id: 'sectors', label: 'Sector deep dives' },
    { id: 'retrofit', label: 'Brownfield retrofit' },
    { id: 'regulations', label: 'Key regulations' },
  ],
  workshopSteps: [
    { id: 'protocol-security-analyzer', label: 'Protocol Analyzer' },
    { id: 'zone-conduit-planner', label: 'Zone & Conduit Planner' },
    { id: 'substation-migration-planner', label: 'Substation Planner' },
    { id: 'safety-consequence-scorer', label: 'Safety & Consequence Scorer' },
    { id: 'sector-migration-roadmap', label: 'Sector Roadmap' },
    { id: 'firmware-project-signing-lab', label: 'Firmware & Project Signing Lab' },
  ],
  startHere: {
    step: 'zone-conduit-planner',
    text: 'Open the Zone & Conduit Planner and see why controllers rank high once forged firmware — not just harvested traffic — is scored.',
  },
  // Derived from the algorithm and standard ids this module's content.ts
  // declares (the References tab's own data), restricted to the
  // STANDARD_TAXONOMY / ALGORITHM_TAXONOMY vocabulary (PQC families only, as
  // elsewhere). Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'LMS/XMSS'],
    standards: ['FIPS 203', 'FIPS 204', 'NIST SP 800-208', 'NSA CNSA 2.0'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.OTPQCModule })),
}

export default manifest
