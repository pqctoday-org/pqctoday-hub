// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the VPNSSHModule module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'vpn-ssh-pqc',
  version: '1.0.0',
  lastReviewed: '2026-03-28',

  standards: [getStandard('FIPS 203'), getStandard('FIPS 204'), getStandard('RFC 9370')],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    ikeClassicalSize: '800 bytes',
    ikeHybridSize: '2,200 bytes',
    wireGuardIncrease: '2,500 bytes',
    sshClassicalSize: '200 bytes',
    sshHybridSize: '4,500 bytes',
  },
}
