// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'api-security-jwt',
  lm_id: 'LM-011',
  title: 'API Security & JWT',
  description:
    'JWT/JWS/JWE with post-quantum algorithms: ML-DSA signing, ML-KEM key agreement, hybrid tokens, and OAuth 2.0 migration.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Protocols',
  trackOrder: 3,
  learnSections: [
    { id: 'jwt', label: 'JWT/JWS/JWE Structure' },
    { id: 'pqc-sign', label: 'ML-DSA JWT Signing' },
    { id: 'hybrid-jwt', label: 'Hybrid JWT & Backwards Compatibility' },
    { id: 'jwe', label: 'ML-KEM JWE Key Agreement' },
    { id: 'oauth', label: 'OAuth 2.0 PQC Migration' },
  ],
  workshopSteps: [
    { id: 'jwt-inspector', label: 'JWT Inspector' },
    { id: 'pqc-signing', label: 'PQC JWT Signing' },
    { id: 'hybrid-jwt', label: 'Hybrid JWT' },
    { id: 'jwe-encryption', label: 'JWE Encryption' },
    { id: 'size-analyzer', label: 'Token Size Analyzer' },
  ],
  playgroundTool: 'api-security-jwt',
  taxonomy: { algorithms: ['ML-DSA', 'SLH-DSA'], standards: ['JOSE', 'RFC 9421'] },
  load: () => import('./index').then((m) => ({ default: m.APISecurityJWTModule })),
}

export default manifest
