// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Shared types for the Cryptographic Product Certification module (build spec
 * §4 scaffold contract). Owner files import these; only the scaffold edits them.
 */
import type { PathScoped } from '@/components/PKILearning/manifest/types'

/**
 * One guided exercise on the Exercises tab. Tag it with `paths` (learn-path
 * ids: 'fips' | 'cc' | 'eucc-eidas' | 'pci'); untagged = shared by every path.
 * CertExercises filters the list with useLearnPathFilter.
 */
export interface ExerciseItem extends PathScoped {
  /** unique within the module, e.g. 'fips-mip-is-not-evidence' */
  id: string
  title: string
  description: string
  /** what the learner should notice — name the concept, not the UI */
  observe: string
  /** workshop step id (manifest `workshopSteps[].id`) the exercise opens */
  stepId: string
  /** optional pre-fill handed to the step component as `config` */
  config?: Record<string, unknown>
}

/** Props every workshop step component receives from index.tsx. */
export interface CertWorkshopStepProps {
  /** pre-fill from an exercise's `config` (undefined on a plain visit) */
  config?: Record<string, unknown>
}
