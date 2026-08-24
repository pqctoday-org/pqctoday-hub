// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'network-security-pqc',
  contentVersion: 3,
  lm_id: 'LM-012',
  title: 'Network Security & PQC Migration',
  description:
    'Prepare NGFWs, IDS/IPS, and network security appliances for post-quantum cryptography. Covers TLS inspection impacts, DPI with larger PQC certs, vendor migration roadmaps (Cisco, Palo Alto, Fortinet, Juniper), and PQC-aware zero trust network architecture.',
  whyThisMatters:
    "TLS inspection and DPI already strain under today's certificate sizes — PQC certificates are bigger still, and NGFW/IDS vendors (Cisco, Palo Alto, Fortinet, Juniper) are migrating on different schedules you have to plan around.",
  duration: '90 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Protocols',
  trackOrder: 1,
  learnSections: [
    { id: 'pqc-network-impact', label: 'PQC Network Impact' },
    { id: 'tls-inspection-pqc', label: 'TLS & DPI Challenges' },
    { id: 'ids-ips-migration', label: 'IDS/IPS Migration' },
    { id: 'vendor-roadmaps', label: 'Vendor Roadmaps' },
    { id: 'zero-trust-pqc', label: 'Zero Trust with PQC' },
  ],
  workshopSteps: [
    { id: 'ngfw-cipher-analyzer', label: 'NGFW Cipher Policy Analyzer' },
    { id: 'tls-inspection-lab', label: 'TLS Inspection Lab' },
    { id: 'ids-signature-updater', label: 'IDS Signature Updater' },
    { id: 'vendor-migration-matrix', label: 'Vendor Migration Matrix' },
    { id: 'ztna-pqc-designer', label: 'ZTNA PQC Designer' },
    { id: 'network-telemetry-analyzer', label: 'Network Telemetry Analyzer' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.NetworkSecurityPQCModule })),
}

export default manifest
