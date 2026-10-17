// SPDX-License-Identifier: AGPL-3.0-only

/** The ID-Placeholder sentinel (KMIP 3.0 §6.1 preamble). Use it as a batch item's `uid`
 * to reference the object the previous UID-producing item created — e.g.
 * CreateKeyPair → Activate(`$IDPlaceholder`) → Sign(`$IDPlaceholder`). */
export const ID_PLACEHOLDER = '$IDPlaceholder'
