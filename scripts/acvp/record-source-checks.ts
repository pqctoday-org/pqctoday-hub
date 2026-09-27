// SPDX-License-Identifier: GPL-3.0-only
/**
 * record-source-checks.ts — run the two source checkers and record, per vector
 * file, that its expected values match the pinned trusted upstream.
 *
 * Maintainer decision 2026-09-26: NIST and Google (Project Wycheproof) are
 * trusted sources, and for them an automated match against the pinned upstream
 * counts as the review — no person's sign-off is needed. This script is how
 * that match gets recorded. It writes
 * src/data/validation/reviews/<id>.source-check.json for every active manifest
 * entry that `sourceCheckEligible` accepts AND whose checker reports a full match:
 *
 *   NIST ACVP-Server   python3 scripts/acvp/subset_reproduce.py --all --strict
 *                      (every leaf value byte-compared with the upstream case of
 *                      the same tcId, upstream file digest-pinned; --strict also
 *                      fails any difference the lineage does not declare)
 *   Wycheproof         python3 scripts/acvp/vendor_wycheproof.py --clone <c> --check
 *                      (clone at the pinned commit, upstream file digest-pinned,
 *                      every value deep-equal, `_provenance` the only added key)
 *
 * A record binds to the manifest entry's canonical hash (the same subject a human
 * review record binds to) and to the file's bytes, so editing either makes it
 * stale. An entry that fails, or is no longer eligible, has its old record
 * REMOVED — a record must never outlive the match it reports.
 *
 * Usage:
 *   npx tsx scripts/acvp/record-source-checks.ts --wycheproof-clone <path>
 *   npx tsx scripts/acvp/record-source-checks.ts --wycheproof-clone <path> --offline
 * The Wycheproof clone must be at the pinned commit (the checker refuses anything
 * else); get one with:
 *   git init w && git -C w fetch --depth 1 https://github.com/C2SP/wycheproof <commit>
 *   git -C w checkout FETCH_HEAD
 * Without --wycheproof-clone the Wycheproof files are left untouched (reported).
 * Exit status is non-zero when any eligible entry did not match.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  SOURCE_CHECK_SCHEMA,
  sourceCheckEligible,
  type SourceCheckRecord,
} from '../../src/data/validation/reviewRecords'
import type { VectorFileEntry } from '../../src/data/validation/validationCaseManifest'
import { canonical } from '../generate-release-evidence'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const MANIFEST = path.join(ROOT, 'src/data/validation/vector-manifest.json')
const REVIEWS = path.join(ROOT, 'src/data/validation/reviews')
const SUFFIX = '.source-check.json'

/**
 * Per-file checkers for vectors taken from a published standard or consensus RFC.
 * Each re-reads every expected value from its hash-pinned document (fetched into
 * the gitignored tmp/acvp-upstream-cache/docs) and exits 0, printing "OK", only on
 * an exact match. An eligible document-sourced file with no entry here is reported
 * as not yet automated and gets no record.
 */
const DOCUMENT_CHECKERS: Record<string, string> = {
  aesgcm_test: 'scripts/acvp/build_gcm_cavp_kat.py',
  pbkdf2_rfc7914_test: 'scripts/acvp/build_rfc7914_pbkdf2.py',
}

const sha256 = (b: Buffer | string) => createHash('sha256').update(b).digest('hex')

interface Args {
  clone: string | null
  offline: boolean
}
function parseArgs(argv: string[]): Args {
  const a: Args = { clone: null, offline: false }
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--wycheproof-clone') a.clone = path.resolve(argv[++i] ?? '')
    else if (argv[i] === '--offline') a.offline = true
    else throw new Error(`unknown argument ${argv[i]}`)
  }
  return a
}

type Verdict = { match: boolean; cases: number; values?: number; detail: string }

/** Parse subset_reproduce.py's per-entry blocks: "[MATCH] id (...)" then indented lines. */
export function parseSubsetReport(text: string): Map<string, Verdict> {
  const out = new Map<string, Verdict>()
  const blocks = text.split(/\n(?=\[)/)
  for (const b of blocks) {
    const head = /^\[([A-Z*]+)\]\s+(\S+)/.exec(b)
    if (!head) continue
    const [, verdict, id] = head
    const cases = /declared cases (\d+)/.exec(b)
    const values = /leaf values byte-compared (\d+)/.exec(b)
    const counts = /mismatches (\d+)\s+undeclared (\d+)\s+unresolved (\d+)/.exec(b)
    const clean = counts !== null && counts[1] === '0' && counts[2] === '0' && counts[3] === '0'
    out.set(id, {
      // Only a plain MATCH with zero findings of every kind counts; MATCH* (an
      // undeclared normalization) is not a match for this purpose.
      match: verdict === 'MATCH' && clean,
      cases: cases ? Number(cases[1]) : 0,
      values: values ? Number(values[1]) : undefined,
      detail: b.split('\n').slice(0, 1).join(''),
    })
  }
  return out
}

/** Parse vendor_wycheproof.py --check lines: "OK   wycheproof_x.json  N cases  upstream <sha12>". */
export function parseWycheproofReport(text: string): Map<string, Verdict> {
  const out = new Map<string, Verdict>()
  for (const line of text.split('\n')) {
    const m = /^OK\s+(wycheproof_\S+)\.json\s+(\d+) cases/.exec(line)
    if (m) out.set(m[1], { match: true, cases: Number(m[2]), detail: line.trim() })
  }
  return out
}

function run(cmd: string, args: string[]): { status: number; text: string } {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 })
  if (r.error) throw r.error
  return { status: r.status ?? 1, text: `${r.stdout ?? ''}\n${r.stderr ?? ''}` }
}

/** Upstream files + digests as the manifest records them (verification evidence). */
function upstreamFiles(e: VectorFileEntry): { path: string; sha256: string }[] {
  const rev = e.source?.revision ?? ''
  const ev = e.source?.verification?.evidence ?? []
  const files = ev
    .filter((d) => d.sha256 && d.url && rev && d.url.includes(`/${rev}/`))
    .map((d) => ({ path: d.url!.split(`/${rev}/`)[1], sha256: d.sha256! }))
  if (files.length) return files
  const n = e.source?.nist
  return n?.upstreamPath && n.upstreamSha256
    ? [{ path: n.upstreamPath, sha256: n.upstreamSha256 }]
    : []
}

function main(): number {
  const args = parseArgs(process.argv.slice(2))
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) as { files: VectorFileEntry[] }
  const today = new Date().toISOString().slice(0, 10)

  const nistCmd = ['scripts/acvp/subset_reproduce.py', '--all', '--strict']
  if (args.offline) nistCmd.push('--offline')
  console.log(`running python3 ${nistCmd.join(' ')} …`)
  const nist = parseSubsetReport(run('python3', nistCmd).text)

  let wyc: Map<string, Verdict> | null = null
  const wycCmd = ['scripts/acvp/vendor_wycheproof.py', '--clone', args.clone ?? '', '--check']
  if (args.clone) {
    console.log(`running python3 ${wycCmd.join(' ')} …`)
    wyc = parseWycheproofReport(run('python3', wycCmd).text)
  }

  fs.mkdirSync(REVIEWS, { recursive: true })
  const written: string[] = []
  const removed: string[] = []
  const failed: string[] = []
  const untouched: string[] = []
  const notYet: string[] = []
  const want = new Set<string>()

  for (const e of manifest.files) {
    if (e.status !== 'active' || !sourceCheckEligible(e.source)) continue
    const recPath = path.join(REVIEWS, `${e.id}${SUFFIX}`)
    if (e.source?.kind === 'published-document') {
      const checker = DOCUMENT_CHECKERS[e.id]
      if (!checker) {
        notYet.push(e.id)
        continue
      }
      const r = run('python3', [checker, '--check'])
      if (r.status !== 0 || !/^OK\s/m.test(r.text)) {
        failed.push(
          `${e.id}: ${checker} --check did not match (${r.text.trim().split('\n').pop()})`
        )
        continue
      }
      const ev = e.source?.verification?.evidence ?? []
      if (!ev.length || !e.source?.url) {
        failed.push(`${e.id}: manifest records no document URL/digest to cite`)
        continue
      }
      const doc: SourceCheckRecord = {
        schema: SOURCE_CHECK_SCHEMA,
        item: `vector-source:${e.id}`,
        subjectSha256: sha256(canonical(e)),
        fileSha256: sha256(fs.readFileSync(path.join(ROOT, e.path))),
        result: 'match',
        tool: checker,
        command: `python3 ${checker} --check`,
        upstream: {
          repository: e.source.url,
          revision: ev[0].sha256!,
          files: ev.map((d) => ({ path: d.title ?? d.url ?? '', sha256: d.sha256! })),
        },
        compared: { cases: e.cases.length },
        checkedAt: today,
      }
      fs.writeFileSync(recPath, JSON.stringify(doc, null, 2) + '\n')
      want.add(path.basename(recPath))
      written.push(e.id)
      continue
    }
    const isNist = e.source?.kind === 'nist-acvp-server'
    const verdict = isNist ? nist.get(e.id) : wyc?.get(e.id)
    if (!isNist && wyc === null) {
      if (fs.existsSync(recPath)) want.add(path.basename(recPath))
      untouched.push(e.id)
      continue
    }
    if (!verdict?.match) {
      failed.push(`${e.id}: ${verdict ? verdict.detail : 'not reported by the checker'}`)
      continue
    }
    const files = upstreamFiles(e)
    const rev = e.source?.revision ?? e.source?.nist?.revision ?? ''
    if (!files.length || !/^[0-9a-f]{40}$/.test(rev)) {
      failed.push(`${e.id}: manifest records no upstream revision/file digests to cite`)
      continue
    }
    const rec: SourceCheckRecord = {
      schema: SOURCE_CHECK_SCHEMA,
      item: `vector-source:${e.id}`,
      subjectSha256: sha256(canonical(e)),
      fileSha256: sha256(fs.readFileSync(path.join(ROOT, e.path))),
      result: 'match',
      tool: isNist ? 'scripts/acvp/subset_reproduce.py' : 'scripts/acvp/vendor_wycheproof.py',
      command: isNist
        ? `python3 scripts/acvp/subset_reproduce.py --id ${e.id} --strict`
        : 'python3 scripts/acvp/vendor_wycheproof.py --clone <clone of C2SP/wycheproof at the pinned commit> --check',
      upstream: {
        repository: isNist
          ? 'https://github.com/usnistgov/ACVP-Server'
          : 'https://github.com/C2SP/wycheproof',
        revision: rev,
        files,
      },
      compared:
        verdict.values === undefined
          ? { cases: verdict.cases }
          : { cases: verdict.cases, values: verdict.values },
      checkedAt: today,
    }
    fs.writeFileSync(recPath, JSON.stringify(rec, null, 2) + '\n')
    want.add(path.basename(recPath))
    written.push(e.id)
  }

  // A record must never outlive its match: drop any source check we did not just
  // (re)confirm, except Wycheproof ones left alone because no clone was given.
  for (const f of fs.readdirSync(REVIEWS).filter((n) => n.endsWith(SUFFIX))) {
    if (!want.has(f)) {
      fs.rmSync(path.join(REVIEWS, f))
      removed.push(f)
    }
  }

  console.log(`\nrecorded ${written.length} source check(s)`)
  if (untouched.length)
    console.log(`left untouched (no --wycheproof-clone): ${untouched.join(', ')}`)
  if (notYet.length)
    console.log(
      `not yet automated (published standard, no document checker yet): ${notYet.join(', ')}`
    )
  if (removed.length)
    console.log(
      `removed ${removed.length} record(s) no longer backed by a match: ${removed.join(', ')}`
    )
  if (failed.length) {
    console.log(
      `\nNOT recorded — ${failed.length} eligible entr${failed.length === 1 ? 'y' : 'ies'} did not match:`
    )
    for (const f of failed) console.log(`  ${f}`)
  }
  return failed.length ? 1 : 0
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main())
}
