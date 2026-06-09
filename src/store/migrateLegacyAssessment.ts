// SPDX-License-Identifier: GPL-3.0-only
import { pullLegacyAssessmentState, runLegacyAssessmentMigrations } from './assessmentMigration'

const FORM_KEY = 'pqc-assessment-form'
const RESULT_KEY = 'pqc-assessment-result'
const SENTINEL_KEY = 'pqc-assessment-migrated'

// These MUST stay in sync with the `version` option of each target store
// (useAssessmentFormStore / useAssessmentResultStore). We write the persisted
// envelope by hand, so a mismatch would re-trigger an unintended migrate.
const FORM_STORE_VERSION = 2
const RESULT_STORE_VERSION = 0

// Fields owned by useAssessmentResultStore — everything else in the legacy
// combined blob belongs to useAssessmentFormStore. Keep aligned with the
// result store's INITIAL_STATE / partialize.
const RESULT_FIELDS = [
  'hiddenThreats',
  'lastResult',
  'completedAt',
  'lastModifiedAt',
  'previousRiskScore',
  'assessmentHistory',
] as const

/**
 * One-time import of the pre-split `pqc-assessment` localStorage blob into the
 * two stores that replaced it (`pqc-assessment-form` + `pqc-assessment-result`).
 *
 * This MUST run as a standalone startup step (see runStartupMigrations.ts,
 * imported first in main.tsx) and NOT inside either store's persist `migrate`
 * hook. zustand only calls `migrate` when an entry already exists under the
 * *new* key with a mismatched version — but the users this targets have the
 * *old* key and no new key, so a migrate-based import never fires for them.
 *
 * Idempotent: guarded by a sentinel and a "new keys already present" check, so
 * it never clobbers data the user has accumulated under the new stores.
 */
export function migrateLegacyAssessmentOnce(): void {
  try {
    if (localStorage.getItem(SENTINEL_KEY)) return

    // Never overwrite data the user already has under the new keys.
    if (localStorage.getItem(FORM_KEY) || localStorage.getItem(RESULT_KEY)) {
      localStorage.setItem(SENTINEL_KEY, '1')
      return
    }

    const legacy = pullLegacyAssessmentState()
    if (!legacy) {
      localStorage.setItem(SENTINEL_KEY, '1')
      return
    }

    const migrated = runLegacyAssessmentMigrations(legacy.state, legacy.version)

    // Split the combined blob into the two store shapes.
    const resultState: Record<string, unknown> = {}
    const formState: Record<string, unknown> = { ...migrated }
    for (const key of RESULT_FIELDS) {
      resultState[key] = migrated[key]
      delete formState[key]
    }

    localStorage.setItem(
      FORM_KEY,
      JSON.stringify({ state: formState, version: FORM_STORE_VERSION })
    )
    localStorage.setItem(
      RESULT_KEY,
      JSON.stringify({ state: resultState, version: RESULT_STORE_VERSION })
    )
    localStorage.setItem(SENTINEL_KEY, '1')
  } catch (error) {
    console.error('Legacy assessment migration failed:', error)
  }
}
