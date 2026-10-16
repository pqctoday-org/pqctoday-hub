// SPDX-License-Identifier: GPL-3.0-only
/**
 * The security architect's pack recipe: the architecture artifacts a design
 * review needs, in a fixed order. The shared mechanics are in `rolePack.ts`.
 *
 * Design note: pqctoday-plan, security-architect-architecture-pack-design-note.
 */
import { buildRolePack, type RolePack, type RolePackInput, type RolePackRecipe } from './rolePack'

export const ARCHITECTURE_PACK_TITLE = 'Architecture pack'

/** Where the pack's own artifacts (scope, decisions, test plan) are edited. */
export const ARCHITECTURE_PACK_PANEL_PATH = '/business#architecture-pack'

export const ARCHITECTURE_PACK_DISCLAIMER =
  'This is your own working document, built in your browser from what you saved on PQC Today. ' +
  'It is not a PQC Today assessment, and nobody else has reviewed it unless a reviewer is named above.'

export const ARCHITECTURE_PACK_RECIPE: RolePackRecipe = {
  title: ARCHITECTURE_PACK_TITLE,
  disclaimer: ARCHITECTURE_PACK_DISCLAIMER,
  // Fixed order: scope, inventory, design and decisions, change and
  // responsibility, then the evidence that it works.
  sections: [
    {
      type: 'architecture-scope',
      purpose: 'Which systems, boundaries, lifetimes and constraints the decisions apply to.',
      toolPath: ARCHITECTURE_PACK_PANEL_PATH,
    },
    { type: 'crypto-cbom', purpose: 'What cryptography is in use, and where (inventory).' },
    {
      type: 'crypto-architecture',
      purpose: 'How the cryptographic layers fit together today and in the target state.',
    },
    {
      type: 'management-tools-audit',
      purpose: 'Which tools discover, manage and monitor the cryptography.',
    },
    {
      type: 'hybrid-transition',
      purpose: 'Which transition mode (classical, hybrid, pure PQC) applies to which system.',
    },
    {
      type: 'mti-negotiator',
      purpose: 'Which algorithm each pair of systems can actually negotiate.',
    },
    {
      type: 'architecture-decision-record',
      purpose: 'Each design decision, the options weighed, its preconditions and its evidence.',
      multiple: true,
      toolPath: ARCHITECTURE_PACK_PANEL_PATH,
    },
    {
      type: 'crypto-api-refactor',
      purpose: 'What has to change in application code and crypto APIs.',
    },
    {
      type: 'cloud-responsibility-matrix',
      purpose: 'Who holds and operates which keys across cloud and on-premises services.',
    },
    {
      type: 'kmip-quick-run',
      purpose: 'A recorded policy-driven rekey, run on the in-browser KMIP engine.',
      toolPath: '/playground/cacp?tab=migration',
    },
    {
      type: 'architecture-test-plan',
      purpose: 'The checks that show the target design works, with owners and results.',
      toolPath: ARCHITECTURE_PACK_PANEL_PATH,
    },
  ],
}

export const ARCHITECTURE_PACK_SECTIONS = ARCHITECTURE_PACK_RECIPE.sections

export const buildArchitecturePack = (input: RolePackInput): RolePack =>
  buildRolePack(ARCHITECTURE_PACK_RECIPE, input)
