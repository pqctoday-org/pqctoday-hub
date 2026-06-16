// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'web-gateway-pqc',
  lm_id: 'LM-013',
  title: 'Web Gateway PQC',
  description:
    'PQC deployment at the infrastructure edge: TLS termination patterns, certificate lifecycle at scale, CDN/WAF/load balancer vendor migration paths.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Protocols',
  trackOrder: 2,
  learnSections: [
    { id: 'architecture', label: 'Web Gateway Architecture & TLS Termination Patterns' },
    { id: 'cert-lifecycle', label: 'Certificate Lifecycle at Edge Scale' },
    { id: 'performance', label: 'PQC Handshake Performance & Session Optimization' },
    { id: 'inspection', label: 'WAF/IDS Inspection Challenges with PQC' },
    { id: 'cdn-edge', label: 'CDN Edge Deployment & Origin Shielding' },
    { id: 'vendor-paths', label: 'Vendor-Specific PQC Migration Paths' },
  ],
  workshopSteps: [
    { id: 'topology-builder', label: 'Topology Builder' },
    { id: 'tls-termination', label: 'TLS Termination Patterns' },
    { id: 'handshake-budget', label: 'Handshake Budget Calculator' },
    { id: 'cert-rotation', label: 'Certificate Rotation Planner' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Matrix' },
  ],
  load: () => import('./index').then((m) => ({ default: m.WebGatewayPQCModule })),
}

export default manifest
