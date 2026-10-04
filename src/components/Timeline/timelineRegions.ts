// SPDX-License-Identifier: GPL-3.0-only
/**
 * The regions the Timeline page's region filter offers, and what `?region=`
 * accepts: the id in the URL and the label shown on the page.
 *
 * Kept in a plain module, with no UI imports, so the PQC Assistant can name
 * these exact ids in its link grammar without loading the timeline view.
 */
export const TIMELINE_REGION_LABELS: Record<string, string> = {
  americas: 'Americas',
  eu: 'EU',
  mena: 'MENA',
  apac: 'APAC',
  global: 'Global',
}
