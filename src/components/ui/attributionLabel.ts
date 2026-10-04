// SPDX-License-Identifier: GPL-3.0-only
/**
 * Reader-facing attribution. Curated chunks keep their "human" label; anything
 * produced by an extraction tool is shown as "automated extraction", never the
 * tool's internal identifier.
 */
export function attributionLabel(wasAttributedTo: string | undefined): string {
  const value = (wasAttributedTo ?? '').trim()
  if (!value) return 'unknown'
  if (value.toLowerCase() === 'human') return 'human'
  return 'automated extraction'
}
