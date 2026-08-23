// SPDX-License-Identifier: GPL-3.0-only
/**
 * Decode HTML/JSX character references in learner-facing text.
 *
 * This replaced a hand-written map of 14 named entities inside
 * export-learn-manifest-snapshot.ts, whose fallback was `?? m` — so every
 * reference outside that list reached the snapshot verbatim. Measured
 * 2026-08-22 across all 65 modules: 553 undecoded instances in 46 of them,
 * led by &bull; (222), &ldquo;/&rdquo; (162) and &rsquo; (47), plus &darr;
 * &middot; &minus; &sect; &alpha; &beta; &rang; and numeric references.
 *
 * That corrupts every consumer of the snapshot, not only the accuracy checker
 * — where it produced a false CONTRADICTED against the Executive Order, on a
 * sentence quoting that same order verbatim, because its quote marks arrived
 * as `&ldquo;`.
 *
 * It lives here rather than in the exporter because the exporter imports from
 * src/, which puts it in Vite's app graph where its shebang breaks the SSR
 * transform — it cannot be imported by a test. This module is pure and has no
 * such constraint.
 */
import { decodeHTMLStrict } from 'entities'

/**
 * `decodeHTMLStrict` requires the terminating semicolon, so prose containing a
 * bare `&not`, `AT&T` or `R&D` is left alone rather than half-decoded — the
 * HTML5 legacy rules would turn `&notanentity` into `¬anentity`. Decoding is
 * single-pass: `&amp;lt;` becomes `&lt;`, never `<`.
 */
/**
 * Space separators that decoding can introduce. The exporter collapses
 * whitespace BEFORE decoding, so a `&nbsp;` that becomes U+00A0 here would
 * survive into the snapshot uncollapsed — and `&nbsp;` is exactly what the old
 * allowlist mapped to a plain space. Folding them keeps that behaviour and
 * extends it to the separators the allowlist never covered (&ensp; &emsp;
 * &thinsp; &#8239; …), so downstream word-splitting sees one kind of space.
 */
const UNICODE_SPACES = /[\u00a0\u1680\u2000-\u200a\u202f\u205f\u3000]/g

export function decodeJsxEntities(s: string): string {
  return decodeHTMLStrict(s).replace(UNICODE_SPACES, ' ')
}
