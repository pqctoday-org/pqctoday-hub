// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the VPNSSHModule module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'vpn-ssh-pqc',
  version: '1.0.0',
  lastReviewed: '2026-08-22',

  // Expanded from a single line 2026-08-23. The one-line form is why the five
  // declarations below first landed in algorithms[] — an applier that looked for the
  // next '\n  ],' found the ALGORITHMS array's close, because this block had none of
  // its own. Only tsc caught it; a span-based self-check repeated the same mistake and
  // reported it clean.
  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('RFC 9370'),
    // DECLARED 2026-08-23: named to a reader with nothing cited. Captures verified
    // clean (no Obsoleted-by / Withdrawn header) before declaring.
    getStandard('RFC-3526-More-Modular-Exponential-MODP-Diffie-Hellman-groups'),
    getStandard('IETF RFC 7296'),
    getStandard('RFC-7383'),
    getStandard('IETF RFC 8731'),
    getStandard('RFC-9242'),
    // DECLARED 2026-08-23: the module states how ML-KEM and ML-DSA are carried in IKEv2
    // and cited neither draft. The names it used were dead slugs — the library records
    // draft-ietf-ipsecme-ikev2-mldsa and -mlkem as deprecated bare slugs superseded by
    // the revisioned WG documents below, and one site still named Fluhrer's individual
    // submission, whose own capture reads "Expired Internet-Draft (individual) Expired &
    // archived".
    getStandard('draft-ietf-ipsecme-ikev2-pqc-auth-08'),
    getStandard('draft-ietf-ipsecme-ikev2-mlkem-06'),
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines discussed in this module — confirmed via review
  ],

  narratives: {
    ikeClassicalSize: '2,040 bytes',
    ikeHybridSize: '3,784 bytes',
    wireGuardIncrease: '22x',
    sshClassicalSize: '984 bytes',
    sshHybridSize: '3,296 bytes',
  },
}
