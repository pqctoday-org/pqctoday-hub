// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'api-security-jwt',
  whyThisMatters:
    'Public-key-signed JWTs such as RS256 and ES256 face a future forgery risk: a cryptographically relevant quantum computer could reveal signing keys and enable new tokens while verifiers still trust those keys. That is not a harvest-now-decrypt-later threat or a claim that every existing token is forged retroactively. HMAC-based HS256 has a different quantum risk.',
  learnSections: [
    { id: 'jwt', label: 'JWT/JWS/JWE Structure' },
    { id: 'pqc-sign', label: 'ML-DSA JWT Signing' },
    { id: 'jwe', label: 'ML-KEM JWE Key Agreement' },
    { id: 'oauth', label: 'OAuth 2.0 PQC Migration' },
  ],
  workshopSteps: [
    { id: 'jwt-inspector', label: 'JWT Inspector' },
    { id: 'pqc-signing', label: 'PQC JWT Signing' },
    { id: 'hybrid-jwt', label: 'Hybrid JWT' },
    { id: 'jwe-encryption', label: 'JWE Encryption' },
    { id: 'size-analyzer', label: 'Token Size Analyzer' },
    { id: 'matrix-audit', label: 'Matrix Audit' },
    { id: 'attack-lab', label: 'Attack Lab' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'jwt-inspector',
    text: 'Paste a JWT or pick a sample token in the JWT Inspector: the header, payload and signature are decoded, and the declared algorithm is classed as classical or post-quantum (a claim the token makes, not proof) with its key and signature sizes.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.APISecurityJWTModule })),
}

export default resolveManifest(manifest)
