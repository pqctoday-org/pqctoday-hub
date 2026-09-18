// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'iot-ot-pqc',
  contentVersion: 6,
  lm_id: 'LM-032',
  title: 'IoT & OT Security',
  description:
    'PQC challenges for constrained devices: algorithm selection for limited memory/compute, firmware signing, CoAP/DTLS protocol impacts, certificate chain bloat, and SCADA/ICS migration.',
  whyThisMatters:
    "A constrained IoT device can't just add more compute for bigger PQC signatures — algorithm selection here is a hard engineering trade-off, and a decade-long deployed device can't easily be patched later.",
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 3,
  // learnSections CORRECTED 2026-07-30 to describe this module's actual
  // learn tab. The previous ids read like the module's workshop steps and
  // did not correspond to any rendered heading — which made the table of
  // contents, section progress and deep links all wrong together.
  learnSections: [
    { id: 'why-different', label: 'Why IoT/OT Is Different' },
    { id: 'constrained', label: 'Algorithm Selection for Constrained Devices' },
    { id: 'certs', label: 'Certificate Chain Bloat' },
    { id: 'firmware', label: 'Firmware Signing for IoT' },
    { id: 'protocols', label: 'Protocol Considerations' },
    { id: 'scada', label: 'SCADA/ICS Security' },
    { id: 'hybrid-constrained', label: 'Hybrid Approaches on Constrained Hardware' },
    { id: 'rail-transit', label: 'Rail & Transit Key Management' },
  ],
  workshopSteps: [
    { id: 'constrained-algorithm', label: 'Algorithm Explorer' },
    { id: 'firmware-signing', label: 'Firmware Signing' },
    { id: 'dtls-handshake', label: 'DTLS Handshake' },
    { id: 'cert-chain-bloat', label: 'Chain Bloat Analysis' },
    { id: 'scada-assessment', label: 'SCADA Planner' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['Falcon', 'LMS/XMSS', 'ML-DSA', 'ML-KEM'],
    standards: ['RFC 9846', 'NIST SP 800-208', 'NSA CNSA 2.0'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.IoTOTModule })),
}

export default manifest
