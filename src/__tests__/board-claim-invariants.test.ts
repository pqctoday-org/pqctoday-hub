// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Board-facing claim invariants (executive journey audit, 15 Oct 2026).
 *
 * Executives repeat what this site says in funding papers and risk committees,
 * so a handful of legal and regulatory overclaims are banned outright. Each one
 * shipped before and was corrected; these checks stop it coming back.
 *
 * Scope: Learn module sources, the Compliance landing model, and the LATEST
 * dated module Q&A and quiz CSVs (the files the build ships — archives are
 * history and are not scanned). The RAG corpus is generated from these, so it
 * follows once the index is refreshed.
 *
 * Run locally: `npx vitest run src/__tests__/board-claim-invariants.test.ts`
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(p, out)
    else if (/\.(tsx?|md)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name)) out.push(p)
  }
  return out
}

/** Latest dated file for a prefix, by the MMDDYYYY date and then the _rN suffix. */
function latestDated(dir: string, prefix: string): string {
  const key = (f: string) => {
    const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
    return m ? `${m[3]}${m[1]}${m[2]}-${(m[4] ?? '0').padStart(3, '0')}` : ''
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && key(f) !== '')
    .sort((a, b) => key(a).localeCompare(key(b)))
  if (files.length === 0) throw new Error(`no ${prefix}* file in ${dir}`)
  return path.join(dir, files[files.length - 1])
}

const SOURCES: string[] = [
  ...walk(path.join(ROOT, 'src/components/PKILearning/modules')),
  path.join(ROOT, 'src/components/Compliance/redesign/pillarModel.ts'),
  path.join(ROOT, 'src/components/Algorithms/Cnsa20Panel.tsx'),
  path.join(ROOT, 'src/components/Algorithms/cnsa20.ts'),
  path.join(ROOT, 'src/data/algorithmEntryIntents.tsx'),
  latestDated(path.join(ROOT, 'src/data/module-qa'), 'module_qa_combined_'),
  latestDated(path.join(ROOT, 'src/data'), 'pqcquiz_'),
  // Curious journey surfaces (curious journey review, 16 Oct 2026): the first
  // sentences a newcomer reads, outside the Learn modules.
  path.join(ROOT, 'src/components/common/CuriousGuide.tsx'),
  path.join(ROOT, 'src/components/RoleHome/RoleHomeView.tsx'),
  path.join(ROOT, 'src/components/Landing/LandingView.tsx'),
  path.join(ROOT, 'src/components/OpenSSLStudio/TLSSimulatorTab.tsx'),
  path.join(ROOT, 'src/components/PKILearning/common/CuriousSummaryBanner.tsx'),
  path.join(ROOT, 'src/data/libraryCuriousPicks.ts'),
  path.join(ROOT, 'src/data/pageRelations.ts'),
  path.join(ROOT, 'src/data/personaConfig.ts'),
]

/**
 * Split a file into records: one per CSV row (keyed by its leading id, so a row's
 * sentences stay attributable), or the whole file for source code.
 */
function records(file: string): { row: string | null; text: string }[] {
  const raw = fs.readFileSync(file, 'utf-8')
  if (!file.endsWith('.csv')) return [{ row: null, text: raw }]
  return raw
    .split(/\r?\n(?=[a-z][a-z0-9-]*,)/)
    .map((text) => ({ row: text.slice(0, text.indexOf(',')), text }))
}

/** Sentences of every scanned file, whitespace-normalised so JSX line wraps don't hide a match. */
const SENTENCES: { file: string; row: string | null; text: string }[] = SOURCES.flatMap((file) =>
  records(file).flatMap(({ row, text }) =>
    text
      .replace(/\s+/g, ' ')
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => ({ file: path.relative(ROOT, file), row, text: sentence }))
  )
)

/**
 * Quiz rows whose correction is applied in the data release that carries the
 * quiz CSV (4.163.0). Once that newer quiz file ships these rows no longer
 * offend and the entries do nothing — delete this list after 4.163.0.
 */
const PENDING_QUIZ_ROWS = new Set(['cstr-006', 'cstr-008', 'das-005'])

function offenders(test: (s: string) => boolean): string[] {
  return SENTENCES.filter((s) => test(s.text))
    .filter((s) => {
      if (s.row && s.file.includes('pqcquiz_') && PENDING_QUIZ_ROWS.has(s.row)) {
        return false
      }
      return true
    })
    .map((s) => `${s.file}${s.row ? ` [${s.row}]` : ''}: ${s.text.slice(0, 200)}`)
}

const CURIOUS_SURFACE =
  /curious-summary|CuriousGuide|RoleHomeView|LandingView|libraryCuriousPicks|pageRelations|CuriousSummaryBanner|TLSSimulatorTab|modules\/(TLSBasics|PQCCandidates|HybridCrypto)\//

function curiousOffenders(test: (s: string) => boolean): string[] {
  return offenders(test).filter((o) => CURIOUS_SURFACE.test(o.slice(0, o.indexOf(':'))))
}

describe('board-facing claim invariants', () => {
  it('scans the shipped files', () => {
    expect(SOURCES.length).toBeGreaterThan(100)
  })

  it('never presents NIS2 or DORA as setting a PQC deadline', () => {
    // NIS2/DORA within ~120 characters of mandate wording, either order; a window that
    // also carries a negation ("no PQC deadline", "not PQC-specific") is the correct claim.
    const mandate =
      'mandates? PQC|PQC mandates?|hard deadlines? for PQC|require[sd]? validated PQC|PQC migration on fixed timelines'
    const near = new RegExp(
      `\\b(NIS2|DORA)\\b.{0,120}?(${mandate})|(${mandate}).{0,120}?\\b(NIS2|DORA)\\b`,
      'i'
    )
    const negated = /\b(no|not|without|isn't|aren't|does not|do not|nor)\b/i
    expect(
      offenders((s) => {
        const m = s.match(near)
        return m !== null && !negated.test(m[0])
      })
    ).toEqual([])
  })

  it('states the SEC trigger as the materiality determination, not discovery', () => {
    expect(offenders((s) => /within (4|four) (business )?days of discovery/i.test(s))).toEqual([])
  })

  it('does not derive personal liability from the SEC disclosure rules', () => {
    expect(offenders((s) => /\bSEC\b/.test(s) && /personal liability/i.test(s))).toEqual([])
  })

  it('does not attribute quotations to an unnamed consensus', () => {
    expect(offenders((s) => /Industry consensus from/i.test(s))).toEqual([])
  })

  it('does not label a single study as authoritative', () => {
    expect(offenders((s) => /anchors? \(authoritative\)/i.test(s))).toEqual([])
  })

  it('does not say ANSSI or BSI require hybrid, outside the French regulated perimeter', () => {
    expect(
      offenders(
        (s) =>
          /(ANSSI|BSI)[^.]{0,40}\brequire[sd]?\b[^.]{0,20}hybrid/i.test(s) &&
          !/regulated perimeter/i.test(s)
      )
    ).toEqual([])
  })

  it('does not claim every framework converges on one hybrid-then-pure arc', () => {
    expect(
      offenders((s) => /converge on/i.test(s)).filter((o) => o.includes('ComplianceStrategy'))
    ).toEqual([])
  })

  it('does not put separate assurance programs on one validation spectrum', () => {
    expect(offenders((s) => /validation (exists )?on a spectrum/i.test(s))).toEqual([])
  })

  it('does not attribute PQC requirements to SOX or PCI DSS, or call DORA the PQC instrument', () => {
    expect(
      offenders(
        (s) =>
          /\b(SOX|PCI DSS)\b[^.]{0,60}\bPQC requirement/i.test(s) ||
          /primary instrument for [^.]{0,40}PQC compliance/i.test(s)
      )
    ).toEqual([])
  })

  it('does not put a 2027 standardisation year on the signature on-ramp', () => {
    // NIST names no
    // standardisation year; HAWK was withdrawn on 29 July 2026 (NIST Round 3 page).
    expect(
      offenders(
        (s) =>
          /\b2027\b/.test(s) &&
          /(on-ramp|\bHAWK\b|SQIsign|winners?|draft FIPS)/i.test(s) &&
          !/conference/i.test(s)
      )
    ).toEqual([])
  })

  it('does not state unsourced cyber-insurance premium figures', () => {
    expect(offenders((s) => /insur/i.test(s) && /\d+\s*[-–]\s*\d+% premium/i.test(s))).toEqual([])
  })

  // ── Curious journey (16 Oct 2026). Short copy must keep its qualifiers. ──
  // Scoped to what a newcomer reads first: every curious summary, the tour, the
  // role card and hero, the Library start shelf, the TLS simulator and the TLS,
  // hybrid and candidates modules. Wider Q&A/quiz wording goes through the data lane.

  it('does not say quantum computers break cryptography instantly', () => {
    expect(
      curiousOffenders((s) => /instantl?y\b[^.]{0,40}\b(crack|break|shatter|solve)/i.test(s))
    ).toEqual([])
  })

  it('does not promise PQC is unbreakable or today is completely safe', () => {
    expect(
      curiousOffenders((s) =>
        /quantum computers? cannot break|completely protected|rock-solid|\bunbreakable\b/i.test(s)
      )
    ).toEqual([])
  })

  it('scopes every CNSA 2.0 mandate to National Security Systems', () => {
    expect(
      curiousOffenders(
        (s) => /CNSA 2\.0 mandat/i.test(s) && !/National Security System|\bNSS\b/i.test(s)
      )
    ).toEqual([])
  })

  it('dates the first NIST selection to 2022 and does not list FN-DSA as a 2024 standard', () => {
    expect(curiousOffenders((s) => /winners in 2024/i.test(s))).toEqual([])
  })

  it('does not teach that an attacker can silently strip ML-KEM from a TLS 1.3 handshake', () => {
    expect(
      curiousOffenders((s) => /\bstrip[a-z]*\b[^.]{0,60}ML-KEM/i.test(s) && !/detect/i.test(s))
    ).toEqual([])
  })

  it('does not forecast NIST dates for the round-3 signature candidates', () => {
    expect(curiousOffenders((s) => /Likely 2027 winners|Fast-track to 2027/i.test(s))).toEqual([])
  })

  it('does not overstate the draft transition plan or a browser’s TLS library', () => {
    expect(
      curiousOffenders((s) =>
        /single most important doc|downstream of this|same OpenSSL your browser/i.test(s)
      )
    ).toEqual([])
  })

  it('cites the published TLS hybrid RFCs, not their superseded drafts', () => {
    expect(
      curiousOffenders((s) => /draft-ietf-tls-hybrid-design|draft-connolly-tls-mlkem/.test(s))
    ).toEqual([])
  })
})
