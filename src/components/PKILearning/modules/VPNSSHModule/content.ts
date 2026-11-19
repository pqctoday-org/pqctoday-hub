// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the VPNSSHModule module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'vpn-ssh-pqc',
  version: '1.0.1',
  lastReviewed: '2026-08-23',
  lastEdited: '2026-11-18',

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
    // As of 2026-11-18, both IKEv2 documents are Active Internet-Drafts submitted to IESG
    // and listed in the RFC Editor queue, awaiting a first editor. pqc-auth is at -12
    // (updated 2026-11-03) and mlkem at -09 (latest revision 2026-07-05). The library ID below still carries the
    // older pqc-auth revision until the library row is refreshed; it links to the
    // Datatracker page, which always shows the latest revision.
    getStandard('draft-ietf-ipsecme-ikev2-pqc-auth-12'),
    getStandard('draft-ietf-ipsecme-ikev2-mlkem-09'),
    // RFC 9329 (obsoletes RFC 8229): the reliable-transport route the limits section names
    getStandard('RFC-9329'),
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('OpenSSH-9-9'), // Historical source for ML-KEM key exchange introduction
    getStandard('OpenSSH-Post-Quantum-Cryptography'), // Current PQ status; release notes qualify role/version support
    getStandard('Multiple-Authentication-Exchanges-in-the-Internet-Key-Exchan'), // pt-vpn-sim: RFC 4739
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
    ikeClassicalSize: "1,400 bytes (this workshop's sample handshake)",
    ikeHybridSize: "3,784 bytes (this workshop's sample handshake)",
    wireGuardIncrease:
      "about 11x with Rosenpass (WireGuard's 240 B handshake plus Rosenpass's 2,464 B)",
    sshClassicalSize: "984 bytes (this workshop's sample handshake)",
    sshHybridSize: "3,296 bytes (this workshop's sample handshake)",
  },
}
