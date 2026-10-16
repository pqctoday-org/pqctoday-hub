// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Where the researcher's evidence workspace lives, and the links its lists
 * use. Kept free of imports so start-up code (the history seeder) can use it.
 */

/** The workspace panel on the researcher's Command Center. */
export const RESEARCH_WORKSPACE_PATH = '/business#research-workspace'

/** A Library record, opened in its drawer. */
export const libraryRecordPath = (referenceId: string) =>
  `/library?ref=${encodeURIComponent(referenceId)}`

/** The record's entries in the correction log (Revisions page). */
export const recordRevisionsPath = (referenceId: string) =>
  `/revisions?domain=library&entity=${encodeURIComponent(referenceId)}`
