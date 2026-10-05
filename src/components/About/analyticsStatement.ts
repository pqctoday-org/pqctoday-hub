// SPDX-License-Identifier: GPL-3.0-only
/**
 * What the About page says about analytics and where your data goes, in one place.
 * The desktop About (DataPrivacySection) and the phone About (MobileAboutView) both
 * build their text from these sentences, so the two cannot say different things.
 *
 * The /terms page and TERMS.md carry their own wording of the same facts (section 10,
 * held identical to each other by termsParity.test.tsx). When a fact here changes,
 * change that section too.
 */

/** The sentences that follow "PQC Today uses Google Analytics 4 on every visit." */
export const ANALYTICS_DISCLOSURE =
  "It starts when a page loads, and there is no consent prompt or on/off switch on the site yet. It records anonymous usage, and sets cookies that give your browser a random identifier so repeat visits can be counted. We do not send your name, email address, or account details. Because your browser contacts Google to send these events, Google also receives your IP address; Google's Privacy Policy describes how it handles that data."

/** What the page address we send contains, and what two automatic Google features can still record. */
export const PAGE_ADDRESS_STATEMENT =
  "The page address we send has nothing after a “?” or “#”. Two automatic Google Analytics features (site search and navigation tracking) read the browser's own address instead, and can record text after a “?”, such as a search term or the data in a shared-report link."

/** How text you type into a search is treated before it is sent as an event (it follows "searches performed"). */
export const SEARCH_SCRUB_CLAUSE =
  'text you type is scrubbed of email addresses, web addresses, IP addresses, and long key-like strings, and shortened to 80 characters, before it is sent as an event'

/** When the data kept in your browser leaves your device. */
export const LOCAL_DATA_LEAVES_STATEMENT =
  'We do not receive this data. It leaves your device only if you share a report link or use the Gemini cloud mode of the PQC Assistant.'
