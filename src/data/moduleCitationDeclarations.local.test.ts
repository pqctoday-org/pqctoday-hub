// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guardrail (local-only, not run in CI): when a learn module asserts a DATE or a
 * VERSION for a document, that document must be in the module's own `standards[]`.
 *
 * THE DEFECT CLASS. On 2026-08-22 the accuracy spot-check returned NOT-IN-EVIDENCE
 * on four dated claims across two modules. Every one of them was a claim about a
 * document the module never declared, so `accuracy_spotcheck.py` — which opens only
 * the cached files behind `standards[]` — had nothing to check them against:
 *
 *   cbom          "the EU PQC Roadmap (23 Jun 2025) requires cryptographic
 *                 inventories by end of 2026"   -> wrong date, wrong modal verb,
 *                 wrong subject; the document recommends, to Member States
 *   crypto-mgmt   "NSA CNSA 2.0 (deadlines 2030/2033)"  -> the operative CNSSP 15
 *                 dates (2027/2030/2031) are in a FAQ the module did not cite
 *   crypto-mgmt   "FIPS 140-3 IG (September 2025 PQC update)"  -> superseded; the
 *                 cached file reads "Last Update: April 16, 2026"
 *   crypto-mgmt   "NIST CSWP.39 (Dec 2025)"  -> superseded by CSWP 39-upd1, which
 *                 another file in the SAME module already cited correctly
 *
 * A wrong date is not a typo. It tells a reader a deadline has or has not passed.
 *
 * WHY DATED MENTIONS ONLY, and not every bibliography entry. The first version of
 * this check required every document named in `relatedStandards` to be declared:
 * 43 findings, all resolving to real library rows, and it would have been WRONG to
 * act on. `accuracy_spotcheck.py` opens four documents per module by even stride,
 * so a module that declares twenty gets sixteen it never reads AND dilutes the four
 * it does. Requiring blanket declaration would have made the accuracy check worse
 * while looking like an improvement. Restricting to mentions that assert a date or
 * version — the ones that are checkable CLAIMS rather than pointers — took it to 11.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO. It does not compare revision numbers. The
 * obvious rule — "cite the newest revision in the library" — is actively harmful
 * here, and measuring it is what showed why: SP 800-57 Part 1 R6 and
 * SP 800-131A Rev 3 are both `Initial Public Draft`, while R5 is `Final`. Modules
 * citing "Part 1 Rev. 5" are citing the current final publication and a
 * newest-wins gate would have moved every one of them onto a draft. Exactly one
 * document family in the whole catalogue has a higher-numbered non-final revision,
 * which is far too little to justify the risk. Draft CURRENCY is handled where the
 * evidence supports it — `pqctoday-priv/scripts/audit-draft-version-currency.py`,
 * which compares an Internet-Draft's cited version against the version list on its
 * own cached datatracker page.
 *
 * A mention is only ever flagged when it RESOLVES to an active library
 * reference_id. An unresolvable mention is a different problem (a missing library
 * row) and is reported separately rather than failing anything — this check must
 * never invent a document.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { DATA_FILENAMES } from './generated/dataFilenames.generated'

interface Row {
  reference_id?: string
  status?: string
}

const MODULES_DIR = path.resolve(__dirname, '../components/PKILearning/modules')

/** Document-identifier shapes that appear in module prose. */
const PATTERNS: RegExp[] = [
  /\bRFC[\s.-]?(\d{3,5})\b/gi,
  /\bFIPS[\s.-]?(\d{3}(?:-\d)?)\b/gi,
  /\bSP[\s.-]?800-(\d{1,3}[A-Za-z]?)\b/gi,
  /\bNIST[\s.]?IR[\s.-]?(\d{4})\b/gi,
  /\bCSWP[\s.-]?(\d{1,3}[A-Za-z]?)\b/gi,
  /\b(draft-[a-z0-9]+(?:-[a-z0-9]+)+)\b/gi,
  /\bSC-?(\d{2,3}v\d)\b/gi,
]

/** A parenthetical year, or an explicit version/revision marker. */
const ASSERTS_DATE_OR_VERSION =
  /\((?:[^)]*\b(?:19|20)\d{2}\b[^)]*)\)|\b(?:Ver\.?|version|Rev\.?|-upd\d|updated)\s*[\d.]/i

/**
 * The window in which a date counts as belonging to THIS mention: up to the next
 * sentence boundary, never a fixed character count.
 *
 * A flat 90-character lookahead read "BSI TR-02102. ANSSI RGS. OMB M-23-02 (US
 * federal ... through 2035)" as dating TR-02102 — the date belonged to a document
 * two sentences later. That was the only false positive in the first measurement,
 * and it only surfaced by reading all fifteen findings by hand.
 */
function claimWindow(text: string, from: number): string {
  const rest = text.slice(from, from + 160)
  const stop = rest.search(/\.\s+[A-Z]|;\s+[A-Z]/)
  return stop === -1 ? rest : rest.slice(0, stop)
}

const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** The latest library CSV, resolved once. Throws rather than silently reading
 *  nothing — an empty parse would make every assertion here pass vacuously. */
function libraryCsvPath(): string {
  const name = DATA_FILENAMES.library
  if (!name) throw new Error('[module citations] DATA_FILENAMES.library is not set')
  return path.join(__dirname, name)
}

function activeReferenceIds(): string[] {
  const csv = fs.readFileSync(libraryCsvPath(), 'utf8')
  const { data } = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true })
  return data
    .filter((r) => r.reference_id && (r.status ?? 'active').trim().toLowerCase() !== 'deprecated')
    .map((r) => r.reference_id as string)
}

/**
 * Resolve a prose mention to an active reference_id, honouring any revision the
 * prose itself names.
 *
 * The revision step is not cosmetic. Without it "SP 800-57 Part 1 Rev. 5" resolved
 * to `NIST-SP-800-57-Pt1-R6` purely because R6 sorted first, which would have
 * reported a module citing the Final as though it cited something else entirely.
 */
function candidatesFor(mention: string, ids: string[]): string[] {
  const n = norm(mention)
  const exact = ids.filter((id) => norm(id) === n)
  if (exact.length) return exact
  return ids.filter((id) => {
    const k = norm(id)
    return k.length >= 5 && n.length >= 5 && k.includes(n)
  })
}

/**
 * Pick the candidate the prose most likely means, honouring any revision it names.
 *
 * The revision step is not cosmetic. Without it "SP 800-57 Part 1 Rev. 5" resolved
 * to `NIST-SP-800-57-Pt1-R6` purely because R6 sorted first, reporting a module
 * that cites the Final as though it cited something else.
 */
function pickCandidate(candidates: string[], window: string): string {
  if (candidates.length === 1) return candidates[0]
  const rev = window.match(/\bRev\.?\s*(\d+)/i)
  if (rev) {
    const wanted = candidates.find((id) => new RegExp(`R(?:ev)?\\.?-?${rev[1]}$`, 'i').test(id))
    if (wanted) return wanted
  }
  return candidates.slice().sort()[0]
}

/**
 * Known, named, and deliberately not fixed yet — NOT a place to park new findings.
 *
 * Nine modules were flagged on the first run. Four were fixed outright, because
 * their `standards[]` lists are short enough that adding an entry costs nothing:
 * accuracy_spotcheck.py opens four documents by even stride, and a list of four or
 * fewer is opened in full. Two more were fixed by repointing a DEPRECATED
 * declaration at its recorded successor, which happened to resolve the mention too.
 *
 * These five cannot be fixed that way. Each already declares four or more
 * documents, so adding one DISPLACES a document that is currently sampled — and
 * choosing which claim stops being checkable is a judgement about that module's
 * content, not something this file can make. CryptoMgmtModernization is the clearest
 * case: after today's review it declares eight, of which four are read, and it makes
 * six dated claims. No ordering satisfies all of them. The honest resolutions are to
 * declare and displace, or to stop asserting a date the module cannot support — both
 * belong to that module's own review.
 *
 * The assertion below compares against this list exactly, so it fails on a NEW
 * occurrence and equally on a fixed one left here. Entries leave as modules are
 * reviewed; nothing is hidden, every one is named.
 */
const PENDING_ORDERING_REVIEW = [
  'APISecurityJWT:RFC-9964',
  'CryptoMgmtModernization:FIPS-140-3',
  'CryptoMgmtModernization:NIST-SP-800-131A-Rev3',
  'EnergyUtilities:NIST SP 800-82 Rev. 3',
  'OpsQuantumImpact:NIST-SP-800-57-Pt1-R5',
].sort()

interface Finding {
  module: string
  mention: string
  referenceId: string
  quote: string
}

function sweep(ids: string[]): { flagged: Finding[]; unresolved: string[] } {
  const flagged: Finding[] = []
  const unresolved: string[] = []

  for (const dir of fs.readdirSync(MODULES_DIR)) {
    const contentPath = path.join(MODULES_DIR, dir, 'content.ts')
    if (!fs.existsSync(contentPath)) continue
    const src = fs.readFileSync(contentPath, 'utf8')

    const declared = new Set(
      [...src.matchAll(/getStandard\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1])
    )
    const block = src.match(/relatedStandards:\s*\n?\s*(['"`])([\s\S]*?)\1\s*,/)
    if (!block) continue
    const prose = block[2]

    const seen = new Set<string>()
    for (const pattern of PATTERNS) {
      for (const m of prose.matchAll(pattern)) {
        const at = m.index ?? 0
        const window = claimWindow(prose, at + m[0].length)
        if (!ASSERTS_DATE_OR_VERSION.test(window)) continue
        const mention = m[0].trim()
        if (seen.has(mention)) continue
        seen.add(mention)

        const candidates = candidatesFor(mention, ids)
        if (!candidates.length) {
          unresolved.push(`${dir}: ${mention}`)
          continue
        }
        // Satisfied if the module declares ANY plausible candidate, not only the
        // one this resolver ranks first. "SP 800-171 Rev. 3" normalises to a
        // prefix of BOTH `NIST-SP-800-171Ar3` (the assessment companion, a
        // different publication) and `NIST-SP-800-171-Rev-3-...` (the one meant).
        // GovernmentDefensePQC declares the latter and was flagged anyway. The
        // trade is explicit: this can no longer catch a module that declares the
        // wrong sibling of a document family, and in exchange it stops inventing
        // work. Catching wrong-sibling needs the document read, not a name match.
        if (candidates.some((c) => declared.has(c))) continue
        const rid = pickCandidate(candidates, window)
        flagged.push({
          module: dir,
          mention,
          referenceId: rid,
          quote: prose.slice(at, at + 110).replace(/\s+/g, ' '),
        })
      }
    }
  }
  return { flagged, unresolved }
}

describe('learn module citation declarations', () => {
  const ids = activeReferenceIds()

  it('the library CSV actually loaded — a silent empty parse would pass everything', () => {
    expect(ids.length).toBeGreaterThan(500)
  })

  it('every dated or versioned document mention is declared in the module standards[]', () => {
    const { flagged } = sweep(ids)
    const report = flagged
      .map((f) => `  ${f.module}: "${f.mention}" -> ${f.referenceId}\n      ${f.quote}`)
      .join('\n')
    expect(
      flagged.map((f) => `${f.module}:${f.referenceId}`).sort(),
      `the set of modules asserting a date or version for a document they do not\n` +
        `declare has changed. Current findings:\n${report}\n\n` +
        `A NEW entry: add getStandard('<id>') to that module's standards[] — and mind\n` +
        `the ORDER. accuracy_spotcheck.py opens only four entries by even stride, so on\n` +
        `a list longer than four a new entry pushes a claim-bearing document out of the\n` +
        `sampled set. If no ordering works, the other honest fix is to stop asserting a\n` +
        `date the module cannot support.\n` +
        `A FIXED entry: remove it from PENDING_ORDERING_REVIEW above.`
    ).toEqual(PENDING_ORDERING_REVIEW)
  })

  it('no module declares a library row that has been deprecated', () => {
    // Free to check once the CSV is open, and it found two on the first run:
    // Entropy and ResearchQuantumImpact both declare `NIST SP 800-90A`, which was
    // deprecated in favour of the active `NIST-SP-800-90A-R1`. A module pointing
    // the accuracy check at a retired row is worse than pointing it nowhere —
    // the check runs, reads a superseded document, and reports success.
    const csv = fs.readFileSync(libraryCsvPath(), 'utf8')
    const { data } = Papa.parse<Row>(csv, { header: true, skipEmptyLines: true })
    const deprecated = new Set(
      data
        .filter((r) => r.reference_id && (r.status ?? '').trim().toLowerCase() === 'deprecated')
        .map((r) => r.reference_id as string)
    )
    const offenders: string[] = []
    for (const dir of fs.readdirSync(MODULES_DIR)) {
      const contentPath = path.join(MODULES_DIR, dir, 'content.ts')
      if (!fs.existsSync(contentPath)) continue
      const src = fs.readFileSync(contentPath, 'utf8')
      for (const m of src.matchAll(/getStandard\(\s*['"]([^'"]+)['"]\s*\)/g)) {
        if (deprecated.has(m[1])) offenders.push(`${dir}: ${m[1]}`)
      }
    }
    expect(
      offenders,
      `these modules declare deprecated library rows; repoint each at the active\n` +
        `successor:\n${offenders.map((o) => `  ${o}`).join('\n')}`
    ).toEqual([])
  })

  it('reports mentions that resolve to no library row at all, without failing', () => {
    const { unresolved } = sweep(ids)
    // Reporting only. A mention with no library row is a missing-row problem for a
    // human, not a declaration problem, and failing on it here would make this
    // suite red for reasons its message cannot help anyone fix.
    if (unresolved.length) {
      console.warn(
        `[module citations] ${unresolved.length} mention(s) match no active library row:`
      )
      for (const u of unresolved) console.warn(`    ${u}`)
    }
    expect(Array.isArray(unresolved)).toBe(true)
  })
})
