// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'iot-ot-pqc',
  lm_id: 'LM-032',
  title: 'IoT & OT Security',
  description:
    'PQC challenges for constrained devices: algorithm selection for limited memory/compute, firmware signing, CoAP/DTLS protocol impacts, certificate chain bloat, and SCADA/ICS migration.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 3,
  learnSections: [
    { id: 'constrained', label: 'Constrained Devices & Algorithm Selection' },
    { id: 'firmware', label: 'Firmware Signing (LMS/XMSS/ML-DSA)' },
    { id: 'protocols', label: 'CoAP/DTLS 1.3 Protocol Impacts' },
    { id: 'certs', label: 'Certificate Chain Bloat in IoT' },
    { id: 'scada', label: 'SCADA/ICS & Purdue Model Migration' },
  ],
  workshopSteps: [
    { id: 'constrained-algorithm', label: 'Algorithm Explorer' },
    { id: 'firmware-signing', label: 'Firmware Signing' },
    { id: 'dtls-handshake', label: 'DTLS Handshake' },
    { id: 'cert-chain-bloat', label: 'Chain Bloat Analysis' },
    { id: 'scada-assessment', label: 'SCADA Planner' },
  ],
  load: () => import('./index').then((m) => ({ default: m.IoTOTModule })),
}

export default manifest
