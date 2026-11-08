// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The three CNSA 2.0 dates of NSA's FAQ (version 2.2, October 2026), worded once so the
 * module's deadline list and the Compliance Gap Analysis step say the same thing. The years
 * come from `CNSA_2_0_BY_CLASS` in `@/data/regulatoryTimelines`.
 */
export const CNSA_ACQUISITION_LABEL =
  'CNSA 2.0: new national security system acquisitions (from 1 January 2027)'

export const CNSA_PHASE_OUT_LABEL =
  'CNSA 2.0: equipment that cannot support CNSA 2.0 phased out (31 December 2030, exceptions possible)'

export const CNSA_MANDATE_LABEL =
  'CNSA 2.0 algorithms mandated for national security systems (31 December 2031, unless otherwise noted)'

/**
 * The 2025 "preferred" step comes from NSA's 2022 category guidance, which the FAQ's three dates
 * replace for planning. Lessons that keep it as history say so in the label.
 */
export const CNSA_2022_PREFERRED_LABEL =
  'NSA 2022 category guidance (older schedule): prefer CNSA 2.0 for new software and firmware signing'
