// SPDX-License-Identifier: GPL-3.0-only
/**
 * ?highlight=<name>[,<name>…] matching and ?transition=<row slug> lookup,
 * shared by the Detailed and Transition tables (which tint matching rows) and useAlgorithmExplorer (which widens
 * filters when a highlighted row would otherwise be hidden, and reports
 * names that match no row at all). One definition so "is this row
 * highlighted" and "is the highlighted row visible" can never disagree.
 */

/** Split a raw ?highlight value into trimmed, non-empty names. */
export function parseHighlight(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Canonical spelling for name comparison: case-insensitive, and a run of
 * spaces/underscores reads as one hyphen, so `Classic McEliece` meets
 * `Classic-McEliece-460896` and `XMSS-SHA2_20` reads as `xmss-sha2-20`.
 */
function canonicalName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

/** Characters that end a name token (after canonicalName). */
const TOKEN_BOUNDARY = new Set(['-', '/', '('])

/**
 * One token of a parameter-set suffix: a size/level number (`768`, `128s`,
 * `2048`), a CACR level (`L1`), a curve tag (`P` + `256`), or the hash variant
 * that names an SLH-DSA/LMS/XMSS parameter set (`SHA2`, `SHAKE`, `SHA256`).
 */
const PARAM_TOKEN = /^(?:\d+[a-z]?|l\d+|p\d*|sha2|sha3|shake|sha256|sha512)$/

/**
 * True when `rest` — what the longer name adds after the shorter one, starting
 * at the boundary character — only names a parameter set (`-768`,
 * `-sha2-128s`, `-p-256`) and/or a trailing `(…)` qualifier, never another
 * algorithm (`-ecdh-p256`, `-pss`).
 */
function isParameterSuffix(rest: string): boolean {
  let core = rest.replace(/^[-/]/, '')
  const qualified = core.match(/^(.*?)-?\(.*\)$/)
  if (qualified) core = qualified[1]
  if (!core) return true
  return core.split(/[-/]/).every((t) => PARAM_TOKEN.test(t))
}

function nameTokenMatch(name: string, h: string): boolean {
  const a = canonicalName(name)
  const q = canonicalName(h)
  if (!a || !q) return false
  if (a === q) return true
  const [shorter, longer] = a.length < q.length ? [a, q] : [q, a]
  if (!longer.startsWith(shorter)) return false
  if (!TOKEN_BOUNDARY.has(longer.charAt(shorter.length))) return false
  return isParameterSuffix(longer.slice(shorter.length))
}

/**
 * THE ?highlight rule (owner decision 2026-10-03), shared by every matcher
 * below. Case-insensitive; `h` matches `name` when they are equal, or when
 * one is a prefix of the other ending at a token boundary (`-`, space, `/`,
 * `(`) and what the longer one adds is only a parameter set or a `(…)`
 * qualifier. So `ML-KEM` → `ML-KEM-768`, `RSA-2048` → `RSA`, `ML-KEM-768
 * (FIPS 203)` → `ML-KEM-768`, `SLH-DSA` → `SLH-DSA-SHA2-128s` — but
 * `ML-KEM-768` ↛ `ML-KEM-768-ECDH-P256` (another algorithm follows), and
 * `DES` ↔ `3DES` never (no shared prefix). The relation is symmetric.
 *
 * A name of the form `Base (Alias)` — transition rows say `DH
 * (Diffie-Hellman)`, `ECDH (P-256)` — also matches through `Base` or
 * `Alias` alone, so `diffie-hellman` and `P-256` still find their rows.
 */
export function highlightNameMatches(name: string, h: string): boolean {
  if (nameTokenMatch(name, h)) return true
  const aliased = name.trim().match(/^(.+?)\s*\(([^()]+)\)$/)
  return !!aliased && (nameTokenMatch(aliased[1], h) || nameTokenMatch(aliased[2], h))
}

/** Detailed-Comparison row match (see highlightNameMatches). */
export function algoMatchesHighlight(algoName: string, h: string): boolean {
  return highlightNameMatches(algoName, h)
}

/** PQC name of a transition row, without its trailing "(…)" qualifier. */
export function transitionPqcName(pqc: string): string {
  return pqc.split(/\s*\(/)[0].trim()
}

/**
 * Transition-Guide row match. Highlight sets mix classical names (RSA, ECDH)
 * and PQC names (ML-KEM-768), so both columns are checked with the same rule
 * (the PQC name without its "(…)" qualifier).
 */
export function transitionMatchesHighlight(
  t: { classical: string; pqc: string },
  h: string
): boolean {
  return highlightNameMatches(t.classical, h) || highlightNameMatches(transitionPqcName(t.pqc), h)
}

type TransitionRowKey = { function: string; classical: string; pqc: string }

/** Stable `data-deeplink-id` for a transition row (no ID column exists). */
export function transitionRowId(t: TransitionRowKey): string {
  return `${t.function}|${t.classical}|${t.pqc}`
}

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * URL-safe form of transitionRowId for `?transition=<slug>` (kebab-case of
 * function, classical and PQC, joined by `-`), e.g.
 * `encryption-kem-rsa-ml-kem-768-nist-level-3`. Derived, not stored: it is as
 * stable as those three columns. Rows that differ only by Region share an id
 * (and so a slug) — the link opens and highlights all of them.
 */
export function transitionRowSlug(t: TransitionRowKey): string {
  return [t.function, t.classical, t.pqc].map(kebab).filter(Boolean).join('-')
}

/** Rows a `?transition=` value names (case-insensitive); empty when unknown. */
export function findTransitionRows<T extends TransitionRowKey>(
  rows: T[],
  slug: string | null | undefined
): T[] {
  const want = slug?.trim().toLowerCase()
  if (!want) return []
  return rows.filter((r) => transitionRowSlug(r) === want)
}

/**
 * Selector for a deep-linked table row. Detailed and Transition render the
 * same id on a desktop `<tr>` and a phone card (`md:hidden`); the shared
 * scroll hook takes the first match, so pick the element for the layout that
 * is actually showing (Tailwind `md` = 768px).
 */
export function highlightRowSelector(escapedAttrSelector: string): string {
  const desktop =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 768px)').matches
      : true
  return desktop ? `tr${escapedAttrSelector}` : `div${escapedAttrSelector}`
}
