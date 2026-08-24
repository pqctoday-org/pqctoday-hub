// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'web-gateway-pqc',
  contentVersion: 3,
  lm_id: 'LM-013',
  title: 'Web Gateway PQC',
  description:
    'PQC deployment at the infrastructure edge: TLS termination patterns, certificate lifecycle at scale, CDN/WAF/load balancer vendor migration paths.',
  whyThisMatters:
    'The edge — CDN, WAF, load balancer — is where TLS actually terminates for most traffic; if PQC certificate handling breaks at the gateway, every application behind it inherits the outage regardless of its own readiness.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p6',
  track: 'Protocols',
  trackOrder: 2,
  learnSections: [
    { id: 'architecture', label: 'Gateway Architecture' },
    { id: 'cert-lifecycle', label: 'Cert Lifecycle at Edge' },
    { id: 'performance', label: 'Handshake Performance' },
    { id: 'inspection', label: 'WAF/IDS Inspection' },
    { id: 'cdn-edge', label: 'CDN Edge Deployment' },
    { id: 'vendor-paths', label: 'Vendor Migration Paths' },
  ],
  workshopSteps: [
    { id: 'topology-builder', label: 'Topology Builder' },
    { id: 'tls-termination', label: 'TLS Termination Patterns' },
    { id: 'handshake-budget', label: 'Handshake Budget Calculator' },
    { id: 'cert-rotation', label: 'Certificate Rotation Planner' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Matrix' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.WebGatewayPQCModule })),
}

export default manifest
