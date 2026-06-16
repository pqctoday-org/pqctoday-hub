// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'ai-security-pqc',
  lm_id: 'LM-033',
  title: 'AI Security & PQC',
  description:
    'Quantum threats to AI systems: pipeline data protection, model weight security, synthetic data contamination, agent authentication, agentic commerce, and encryption at scale.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Applications',
  trackOrder: 2,
  learnSections: [
    { id: 'pipeline-threats', label: 'AI Data Pipeline: The Quantum Threat Surface' },
    { id: 'synthetic-data', label: 'The Synthetic Data Crisis: Model Collapse & Authenticity' },
    { id: 'model-weights', label: 'Model Weight Protection & IP Security' },
    { id: 'agentic-ai', label: 'Agentic AI: Identity, Delegation & Commerce' },
    { id: 'scale', label: 'Protecting Data at Scale: Petabyte-Era Cryptography' },
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
  load: () => import('./index').then((m) => ({ default: m.AISecurityPQCModule })),
}

export default manifest
