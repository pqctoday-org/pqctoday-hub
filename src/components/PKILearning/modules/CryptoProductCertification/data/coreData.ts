// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Core (Shared author)
/**
 * STUB (scaffold). Build spec §4 contract:
 *  - `exercises`: Exercises-tab items, each tagged with `paths` (untagged = all
 *    paths). CertExercises aggregates and path-filters them.
 *  - `stepExercises`: one question per workshop step you own, keyed
 *    `crypto-product-certification/scheme-selector`, `crypto-product-certification/boundary-drawer`, in the src/data/stepExercises.ts shape.
 *    Append the SAME entries as your own keyed block in src/data/stepExercises.ts
 *    (the renderer reads that file); the parity test fails if the two differ.
 */
import type { StepExercise } from '@/data/stepExercises'
import type { ExerciseItem } from './types'

export const exercises: ExerciseItem[] = []

export const stepExercises: Record<string, StepExercise> = {}
