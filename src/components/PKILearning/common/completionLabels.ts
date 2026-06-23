// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical wording for the unified step-completion action across the simulation
 * and the standalone tools. Two words by step nature (see the sim save/validate
 * consistency remediation plan §1):
 *   - a step that RECORDS AN ARTIFACT  → "Save"  / done-state "Saved"
 *   - a REVIEW-ONLY step (no artifact)  → "Mark complete" / done-state "Completed"
 *
 * Centralised so the wording is changed in one place, never re-typed per tool.
 */
export const SAVE_LABEL = 'Save'
export const SAVE_DONE_LABEL = 'Saved'
export const COMPLETE_LABEL = 'Mark complete'
export const COMPLETE_DONE_LABEL = 'Completed'
