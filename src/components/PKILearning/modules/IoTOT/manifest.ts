// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'iot-ot-pqc',
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
  learnSections: [
    { id: 'constrained', label: 'Constrained Devices' },
    { id: 'firmware', label: 'Firmware Signing' },
    { id: 'protocols', label: 'CoAP/DTLS Protocols' },
    { id: 'certs', label: 'Cert Chain Bloat in IoT' },
    { id: 'scada', label: 'SCADA/ICS Migration' },
  ],
  workshopSteps: [
    { id: 'constrained-algorithm', label: 'Algorithm Explorer' },
    { id: 'firmware-signing', label: 'Firmware Signing' },
    { id: 'dtls-handshake', label: 'DTLS Handshake' },
    { id: 'cert-chain-bloat', label: 'Chain Bloat Analysis' },
    { id: 'scada-assessment', label: 'SCADA Planner' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.IoTOTModule })),
}

export default manifest
