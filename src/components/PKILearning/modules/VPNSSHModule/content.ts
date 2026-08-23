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

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204'), getStandard('RFC 9370')],

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
