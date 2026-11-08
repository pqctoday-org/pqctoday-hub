// SPDX-License-Identifier: AGPL-3.0-only
//
// Sources whose address did not resolve on 8 Nov 2026.
//
// "Did not resolve" covers a page that is gone (not found) and a page that
// could not be shown to answer at all. Anything not shown to return a real page
// is held.
//
// An analysis names the page it was written from. Where that page no longer
// returns a real page, linking it would send a reader to an error page, and
// presenting facts "from another source" that no longer exists would mislead.
// So the roadmap panels do not show the source link for these addresses, and
// the "Analysis from another source" block (link and facts) is not shown for a
// roadmap row whose only other-source analysis is held.
//
// - A hold is on the exact address. If the analysis is re-pointed to a page
//   that answers, the address changes and the hold stops applying by itself.
// - An entry whose address no analysis records any more is stale, and a test
//   fails until it is removed.
// - To release a hold, remove the entry once the address answers again.

export interface HeldAnalysisSource {
  vendorId: string
  /** The exact analysis address that did not resolve. */
  url: string
  /** What was seen when it was checked. */
  seen: string
}

export const HELD_ANALYSIS_SOURCES: readonly HeldAnalysisSource[] = [
  {
    vendorId: 'VND-168',
    url: 'https://arqitgroup.com/company/our-approach',
    seen: 'page not found',
  },
  {
    vendorId: 'VND-059',
    url: 'https://docs.venafi.com/Docs/24.3/TopNav/Content/CodeSigning/t-codesigning-pqc.php',
    seen: 'page not found',
  },
  {
    vendorId: 'VND-240',
    url: 'https://www.orange.com/en/news/2025/orange-leading-way-quantum-technologies-safer-smarter-future',
    seen: 'page not found',
  },
  {
    vendorId: 'VND-379',
    url: 'https://www.businesswire.com/news/home/20260324083438/en/HPE-Introduces-Sweeping-Security-Advancements-to-Secure-AI-Adoption-and-Strengthen-Enterprise-Resiliency',
    seen: 'could not be opened (connection error in a desktop browser, access refused to automated checks)',
  },
]

const HELD_ADDRESSES = new Set(HELD_ANALYSIS_SOURCES.map((h) => h.url))

/** True when this analysis address is held (see the notes above). */
export function isHeldAnalysisSource(url: string | undefined): boolean {
  return HELD_ADDRESSES.has((url ?? '').trim())
}
