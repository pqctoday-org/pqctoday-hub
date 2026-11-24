// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

/**
 * IoT & Embedded Device PQC (LM-074).
 *
 * SPLIT 2026-10-01 out of LM-032 `iot-ot-pqc` (IoT/OT) and LM-042
 * `energy-utilities-pqc`: the device side (constrained algorithms, firmware
 * signing, constrained protocols, certificates, fleet keys and LPWAN) lives
 * here; SCADA/ICS, Purdue, zones and conduits and the sector deep dives moved
 * to LM-075 `ot-pqc`; V2X and secure-boot latency moved to the Automotive and
 * Secure Boot modules. learnSections ids equal the rendered data-section-id
 * anchors; workshopSteps ids equal index.tsx PARTS (both pinned by the parity
 * test).
 */
const manifest: ModuleManifest = {
  id: 'iot-pqc',
  whyThisMatters:
    'A device shipped today may still be in the field when a quantum computer can forge its update signatures. Whether it can verify a PQC signature, fit a PQC handshake in its radio frames and rotate keys across a fleet is decided now, in hardware and protocol choices that cannot be patched in later.',
  learnSections: [
    { id: 'why-iot', label: 'Why IoT is different: device classes' },
    { id: 'algorithm-selection', label: 'Algorithm selection: verify vs sign' },
    { id: 'firmware-signing', label: 'Firmware and update signing (SUIT, COSE)' },
    { id: 'constrained-protocols', label: 'Constrained protocols' },
    { id: 'certificates-identity', label: 'Certificates and device identity' },
    { id: 'fleet-keys-lpwan', label: 'Fleet key management and LPWAN' },
    { id: 'hardware-support', label: 'Hardware support: secure elements and TPMs' },
    { id: 'hybrid', label: 'Hybrid on constrained hardware' },
    { id: 'regulations', label: 'IoT security regulations' },
  ],
  workshopSteps: [
    { id: 'constrained-algorithm', label: 'Algorithm Explorer' },
    { id: 'firmware-signing', label: 'Firmware Signing' },
    { id: 'constrained-handshake', label: 'Constrained Handshake' },
    { id: 'cert-chain', label: 'Certificate Chain' },
    { id: 'fleet-key-manager', label: 'Fleet Key Manager' },
    { id: 'lpwan-airtime', label: 'LPWAN Airtime' },
  ],
  startHere: {
    step: 'constrained-algorithm',
    text: 'Pick a device class and a job — verify, sign or key establishment — in the Algorithm Explorer to see which PQC algorithms fit, with the benchmark behind each number.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.IoTPQCModule })),
}

export default resolveManifest(manifest)
