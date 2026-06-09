// SPDX-License-Identifier: GPL-3.0-only
//
// Side-effecting startup module. MUST be imported FIRST in main.tsx, before any
// module that creates a persisted zustand store. zustand persist hydrates
// synchronously at store-creation time, so cross-key data imports have to run
// before those modules are evaluated.
import { migrateLegacyAssessmentOnce } from './migrateLegacyAssessment'

migrateLegacyAssessmentOnce()
