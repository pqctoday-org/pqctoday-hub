// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'web-gateway-pqc',
  contentVersion: 7,
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
  startHere: {
    step: 'topology-builder',
    text: 'Build a gateway topology in the Topology Builder: it marks the PQC upgrade points, so you see which hops change and which stay classical.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['RFC 8555', 'RFC 9846', 'NIST SP 800-227', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.WebGatewayPQCModule })),
}

export default manifest
