// SPDX-License-Identifier: GPL-3.0-only
/**
 * The one required education / not-for-production status notice.
 *
 * Two constants, because one sentence cannot serve both readers:
 *
 * - `EDUCATION_NOTICE` is for the UI and for artefacts a *person* reads (board
 *   packs, docx, CBOM, reports, PEM/key exports, generated scripts). It names
 *   the platform and says plainly what must not be done with what it produces.
 * - `ENGINE_NOTICE` is for the *engine* packages and machine-readable metadata
 *   an npm/OCI consumer sees (`package.json` `description`, OCI labels, banner
 *   comments). It is short enough to fit those fields and is deliberately NOT
 *   scoped to "browser" or "the Platform": the WASM engines are published as a
 *   Node-consumable npm package, so a notice bound to a browser session would
 *   not reach the consumer who never opens the UI.
 *
 * Do not edit either wording without updating both this file's pinning test
 * (`educationNotice.test.tsx`) and the copies that cannot import TypeScript —
 * `src/vendor/softhsm-wasm/{package.json,NOTICE,index.js,index.d.ts}` — which
 * the education-notice check holds to these strings.
 */

/** Platform-level status notice, for the UI and for human-read artefacts. */
export const EDUCATION_NOTICE =
  'PQC Today is an educational and demonstration platform, not a production system. Nothing it produces — keys, certificates, configurations, reports, or test results — is fit to protect real data, and none of it may be deployed or relied upon in production.'

/**
 * Engine-level status notice, for npm/OCI metadata and downstream consumers.
 * Short, and deliberately not scoped to a browser or to "the Platform".
 */
export const ENGINE_NOTICE =
  'Educational and demonstration build — not for production use, in any environment. Not security-audited, not certified, and not intended to protect real data.'

/**
 * Plain-text form for exported artefacts (logs, generated scripts, downloads,
 * README sections): the same sentence, prefixed so it reads as a notice in a
 * text file.
 */
export const EDUCATION_NOTICE_TEXT = `Notice: ${EDUCATION_NOTICE}`

/** Plain-text form of the engine notice, for banner comments and labels. */
export const ENGINE_NOTICE_TEXT = `Notice: ${ENGINE_NOTICE}`

/**
 * Hard-wrap a notice for a fixed-width text artefact (a Python comment block,
 * a `.conf` header, a PEM preamble), optionally prefixing every line. Used by
 * the export payload sites so the notice reads as a notice in a text file
 * rather than one 250-column line.
 */
export const wrapNotice = (text: string, prefix = '', width = 76): string => {
  const lines: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    if (line && (line + ' ' + w).length > width) {
      lines.push(line)
      line = w
    } else line = line ? `${line} ${w}` : w
  }
  if (line) lines.push(line)
  return lines.map((l) => `${prefix}${l}`.trimEnd()).join('\n')
}

/**
 * Prefix a Markdown export payload with the status notice, idempotently.
 *
 * Written as a bold paragraph rather than a blockquote on purpose: this same
 * string is handed to the Markdown→docx, →pptx and →pdf converters, and a bold
 * paragraph survives all three whether or not the converter understands `>`.
 * Idempotent so a tool that already states the notice in its own body (e.g.
 * ContractClauseGenerator) does not say it twice.
 */
export const withEducationNoticeMarkdown = (markdown: string): string =>
  markdown.includes(EDUCATION_NOTICE) ? markdown : `**Notice — ${EDUCATION_NOTICE}**\n\n${markdown}`

/**
 * Prefix a CSV export payload with the status notice, idempotently. CSV has no
 * comment syntax, so the notice is a single quoted first field on its own row,
 * followed by a blank line — every spreadsheet shows it as the first cell.
 */
export const withEducationNoticeCsv = (csv: string): string =>
  csv.includes(EDUCATION_NOTICE)
    ? csv
    : `"Notice — ${EDUCATION_NOTICE.replace(/"/g, '""')}"\n\n${csv}`

/**
 * Prefix a plain-text / PEM / config export payload with the status notice as
 * comment lines, idempotently. `comment` is the target format's line-comment
 * marker (`#` for conf/Python/YAML, `;` for ini, `//` for JS-ish).
 */
/**
 * Does `body` already carry the notice, allowing for the line breaks and
 * comment markers `wrapNotice` inserts? A plain `includes` is not enough: the
 * wrapped form contains newlines and `# ` prefixes, so it never literally
 * contains the one-line constant — which would make the comment helpers
 * non-idempotent and stack a second copy on every pass.
 */
const carriesNotice = (body: string, comment: string): boolean =>
  body
    .split('\n')
    .map((l) => (l.trimStart().startsWith(comment) ? l.trimStart().slice(comment.length) : l))
    .join(' ')
    .replace(/\s+/g, ' ')
    .includes(EDUCATION_NOTICE)

export const withEducationNoticeComment = (body: string, comment = '#'): string =>
  carriesNotice(body, comment)
    ? body
    : `${wrapNotice(EDUCATION_NOTICE, `${comment} `, 76)}\n${comment}\n${body}`

/**
 * Inverse of `withEducationNoticeComment`: drop a leading comment block that
 * this app itself prepended, so an export→import round trip (keystore backup →
 * restore) returns the original bytes. Only strips leading comment lines, and
 * only while the notice is still among them.
 */
export const stripEducationNoticeComment = (body: string, comment = '#'): string => {
  const lines = body.split('\n')
  const head: string[] = []
  for (const line of lines) {
    if (!line.startsWith(comment)) break
    head.push(line)
  }
  if (!carriesNotice(head.join('\n'), comment)) return body
  return lines.slice(head.length).join('\n')
}
