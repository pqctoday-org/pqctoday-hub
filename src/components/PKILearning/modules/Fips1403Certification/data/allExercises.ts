// SPDX-License-Identifier: GPL-3.0-only
import type { ExerciseItem } from '@/components/PKILearning/modules/CryptoProductCertification/data/types'
import { exercises as fipsDataExercises } from './fipsData'

export const ALL_EXERCISES: readonly ExerciseItem[] = [...fipsDataExercises]
