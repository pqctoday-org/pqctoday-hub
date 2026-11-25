// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'web-gateway-pqc',
  whyThisMatters:
    'The edge — CDN, WAF, load balancer — is where TLS actually terminates for most traffic; if PQC certificate handling breaks at the gateway, every application behind it inherits the outage regardless of its own readiness.',
  learnSections: [
    { id: 'architecture', label: 'Gateway Architecture' },
    { id: 'cert-lifecycle', label: 'Cert Lifecycle at Edge' },
    { id: 'performance', label: 'Handshake Performance' },
    { id: 'inspection', label: 'WAF/IDS Inspection' },
    { id: 'cdn-edge', label: 'CDN Edge Deployment' },
    { id: 'vendor-paths', label: 'Vendor Migration Paths' },
    { id: 'pq-tls-termination-point', label: 'PQ TLS at the Termination Point' },
  ],
  workshopSteps: [
    { id: 'topology-builder', label: 'Topology Builder' },
    { id: 'tls-termination', label: 'TLS Termination Patterns' },
    { id: 'handshake-budget', label: 'Handshake Budget Calculator' },
    { id: 'cert-rotation', label: 'Certificate Rotation Planner' },
    { id: 'vendor-readiness', label: 'Vendor Readiness Matrix' },
  ],
  startHere: {
    step: 'topology-builder',
    text: 'Build a gateway topology in the Topology Builder: it marks the PQC upgrade points, so you see which hops change and which stay classical.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.WebGatewayPQCModule })),
}

export default manifest
