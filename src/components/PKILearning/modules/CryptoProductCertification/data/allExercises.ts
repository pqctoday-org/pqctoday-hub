// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/** Aggregates every owner data file's `exercises` (build spec §4). */
import type { ExerciseItem } from './types'
import { exercises as coreExercises } from './coreData'
import { exercises as fipsExercises } from './fipsData'
import { exercises as ccEuExercises } from './ccEuData'
import { exercises as pciExercises } from './pciData'
import { exercises as sharedExercises } from './sharedData'

/** Every owner's exercises, in curriculum order. Exported for the parity test. */
export const ALL_EXERCISES: readonly ExerciseItem[] = [
  ...coreExercises,
  ...fipsExercises,
  ...ccEuExercises,
  ...pciExercises,
  ...sharedExercises,
]
