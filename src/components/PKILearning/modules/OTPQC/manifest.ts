// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

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
  whyThisMatters:
    'In OT a quantum computer’s worst trick is not reading old traffic but forging what controllers trust — firmware, project downloads, certificates and commands — on assets that stay in service for decades and cannot change crypto without a safety review.',
  learnSections: [
    { id: 'why-ot', label: 'Why OT is different' },
    { id: 'architecture', label: 'Purdue, zones and conduits' },
    { id: 'attack-surface', label: 'OT attack surface: three paths in' },
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.OTPQCModule })),
}

export default resolveManifest(manifest)
