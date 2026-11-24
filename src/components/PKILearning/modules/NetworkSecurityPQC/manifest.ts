// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'network-security-pqc',
  whyThisMatters:
    "TLS inspection and DPI already strain under today's certificate sizes — PQC certificates are bigger still, and NGFW/IDS vendors (Cisco, Palo Alto, Fortinet, Juniper) are migrating on different schedules you have to plan around.",
  learnSections: [
    { id: 'pqc-network-impact', label: 'PQC Network Impact' },
    { id: 'tls-inspection-pqc', label: 'TLS & DPI Challenges' },
    { id: 'ids-ips-migration', label: 'IDS/IPS Migration' },
    { id: 'vendor-roadmaps', label: 'Vendor Roadmaps' },
    { id: 'zero-trust-pqc', label: 'Zero Trust with PQC' },
    { id: 'network-operations-pqc', label: 'Network Operations' },
    { id: 'network-contingency-recovery', label: 'Contingency & Recovery Plans' },
  ],
  workshopSteps: [
    { id: 'ngfw-cipher-analyzer', label: 'NGFW Cipher Policy Analyzer' },
    { id: 'tls-inspection-lab', label: 'TLS Inspection Lab' },
    { id: 'ids-signature-updater', label: 'IDS Signature Updater' },
    { id: 'vendor-migration-matrix', label: 'Vendor Migration Matrix' },
    { id: 'ztna-pqc-designer', label: 'ZTNA PQC Designer' },
    { id: 'network-telemetry-analyzer', label: 'Network Telemetry Analyzer' },
  ],
  startHere: {
    step: 'ngfw-cipher-analyzer',
    text: 'Switch the NGFW Cipher Policy from classical to hybrid to pure PQC: the analyzer shows the certificate-size and hardware-offload impact of each.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.NetworkSecurityPQCModule })),
}

export default resolveManifest(manifest)
