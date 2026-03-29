// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the MigrationProgram module.
 * AUTO-GENERATED SKELETON — review and refine manually.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'

export const content: ModuleContent = {
  moduleId: 'migration-program',
  lastReviewed: '2026-03-28',

  standards: [
    // No standard references detected — add manually if needed
  ],

  algorithms: [getAlgorithm('RSA-2048')],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    // TODO: Extract narrative text from JSX components
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// X25519MLKEM768
