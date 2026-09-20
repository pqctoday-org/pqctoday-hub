// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'ai-security-pqc',
  contentVersion: 7,
  lm_id: 'LM-033',
  title: 'AI Security & PQC',
  description:
    'Quantum threats to AI systems: pipeline data protection, model weight security, synthetic data contamination, agent authentication, agentic commerce, and encryption at scale.',
  whyThisMatters:
    'AI pipelines and model weights are attack surface too — an adversary who steals training data or model IP today can decrypt it the moment a cryptographically-relevant quantum computer arrives, and agentic systems add a new class of authentication risk.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 2,
  learnSections: [
    { id: 'pipeline-threats', label: 'AI Pipeline Threats' },
    { id: 'synthetic-data', label: 'Synthetic Data Crisis' },
    { id: 'model-weights', label: 'Model Weight Protection' },
    { id: 'agentic-ai', label: 'Agentic AI Identity' },
    { id: 'scale', label: 'Petabyte-Era Cryptography' },
  ],
  workshopSteps: [
    { id: 'data-protection-analyzer', label: 'Data Protection Analyzer' },
    { id: 'data-authenticity-verifier', label: 'Data Authenticity Verifier' },
    { id: 'model-weight-vault', label: 'Model Weight Vault' },
    { id: 'agent-auth-designer', label: 'Agent Auth Designer' },
    { id: 'agentic-commerce-simulator', label: 'Agentic Commerce Simulator' },
    { id: 'agent-to-agent-protocol', label: 'Agent-to-Agent Protocol' },
    { id: 'scale-encryption-planner', label: 'Scale Encryption Planner' },
  ],
  startHere: {
    step: 'data-protection-analyzer',
    text: "Audit a sample AI pipeline in the Data Protection Analyzer: each stage's crypto operations are listed with the quantum-vulnerable touchpoints and HNDL exposure marked.",
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['RFC 9846', 'FIPS 140-3'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AISecurityPQCModule })),
}

export default manifest
