// SPDX-License-Identifier: GPL-3.0-only
/**
 * release-freeze — snapshot a conference/release candidate (ACVP validation
 * remediation plan 2026-09-24, WS-J J-4: "freeze a conference release
 * candidate with exact commits and artifact hashes no later than 19 October").
 *
 * The freeze manifest binds, in one file:
 *   - the hub commit (HEAD), its `git describe`, package version and whether
 *     the tree was clean;
 *   - every vendored WASM bundle's pqctoday-hsm commit (public/wasm/wasm-provenance.json)
 *     and the SHA-256 of each bundle file as it is on disk now;
 *   - the engine artifacts the coverage matrix and mechanism inventory were
 *     generated from (and whether they still match the recorded hash);
 *   - the SHA-256 of the generated release evidence report and of every input
 *     it was generated from;
 *   - the frozen cross-target evidence runs (matrix SHA-256 per run);
 *   - optionally the conference deck files and the result of the deck check
 *     (`--presentation <dir>`: banned claims + every bound figure).
 *
 *   npx tsx scripts/release-freeze.ts                          # DRY RUN (default): print, write nothing
 *   npx tsx scripts/release-freeze.ts --presentation <dir>     # dry run incl. the deck check
 *   Add `--evidence-checker <module>` (a module exporting `checkReleaseEvidence`)
 *   to run the release-evidence check, which is maintained outside this
 *   repository; without it the check is recorded as failed and --write is refused.
 *
 *   npx tsx scripts/release-freeze.ts --write --label <label> --presentation <dir>
 *        # write evidence/release-freeze/<label>.freeze.json — refused on a dirty
 *        # tree, a failing release-evidence check, a failing deck check, or an
 *        # existing file (a freeze is never overwritten)
 *   npx tsx scripts/release-freeze.ts --check evidence/release-freeze/<label>.freeze.json
 *        # verify the current tree still matches a freeze: exit 1 when any frozen
 *        # artifact, generated report or evidence run differs; commits made since
 *        # the freeze are listed (plan J-4 allows blocker fixes only)
 */
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import {
  REPORT_JSON_REL,
  REPORT_MD_REL,
  ROOT,
  claimsSha256,
  sha256,
  type EvidenceChecker,
} from './lib/releaseEvidenceHash'

export const FREEZE_SCHEMA = 'pqctoday.release-freeze/v1'
export const NO_CHECKER =
  'release-evidence check not supplied (--evidence-checker <module>); it runs outside this repository'
export const FREEZE_DIR_REL = 'evidence/release-freeze'
const PROVENANCE_REL = 'public/wasm/wasm-provenance.json'
const INVENTORY_REL = 'src/data/validation/mechanism-inventory.generated.json'

export interface FileHash {
  path: string
  sha256: string | null
}

export interface FreezeManifest {
  schema: typeof FREEZE_SCHEMA
  label: string | null
  mode: 'dry-run' | 'frozen'
  frozenAt: string
  hub: {
    commit: string | null
    describe: string | null
    version: string | null
    clean: boolean | null
    uncommitted: string[]
  }
  wasmBundles: Array<{
    name: string
    hsmCommit: string | null
    builtAt: string | null
    files: FileHash[]
  }>
  engines: Array<{
    engine: string
    sourceCommit: string | null
    artifacts: Array<{
      path: string
      recordedSha256: string
      sha256: string | null
      matches: boolean
    }>
  }>
  /** Full report files (informational: review status and the checklist may still move). */
  generated: FileHash[]
  /** SHA-256 of the report's figure sections — compared by --check. */
  reportClaimsSha256: string | null
  reportInputs: Record<string, string>
  evidenceRuns: Array<{ runId: string; matrix: FileHash }>
  presentation: null | {
    dir: string
    files: FileHash[]
    check: 'pass' | 'fail'
    findings: string[]
  }
  checks: { releaseEvidence: 'pass' | 'fail'; errors: string[] }
}

const git = (root: string, ...args: string[]): string | null => {
  try {
    return execFileSync('git', ['-C', root, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return null
  }
}

const hashFile = (root: string, rel: string): string | null => {
  const abs = path.join(root, rel)
  return fs.existsSync(abs) && fs.statSync(abs).isFile() ? sha256(fs.readFileSync(abs)) : null
}

/** Files under a path (a file, or every file below a directory), sorted, repo-relative. */
function expand(root: string, rel: string): string[] {
  const abs = path.join(root, rel)
  if (!fs.existsSync(abs)) return [rel.replace(/\/$/, '')]
  if (fs.statSync(abs).isFile()) return [rel]
  const out: string[] = []
  const walk = (d: string) => {
    for (const n of fs.readdirSync(d).sort()) {
      const p = path.join(d, n)
      if (fs.statSync(p).isDirectory()) walk(p)
      else out.push(path.relative(root, p).split(path.sep).join('/'))
    }
  }
  walk(abs)
  return out
}

const hashAll = (root: string, rels: string[]): FileHash[] =>
  rels.flatMap((r) => expand(root, r)).map((p) => ({ path: p, sha256: hashFile(root, p) }))

interface ProvenanceFile {
  bundles: Array<{ name: string; files: string[]; hsmCommit?: string; builtAt?: string }>
}
interface InventoryFile {
  engines: Record<
    string,
    { identity: { artifacts: Array<{ path: string; sha256: string }>; sourceCommit?: string } }
  >
}
interface ReportShape extends Record<string, unknown> {
  inputs: Record<string, string>
  crossTarget: { runs: Array<{ runId: string; dir: string }> }
}

export async function buildFreezeManifest(
  root: string = ROOT,
  opts: {
    label?: string | null
    presentation?: string | null
    mode?: 'dry-run' | 'frozen'
    /** The release-evidence check. It runs outside this repository; without
     * it the check is recorded as failed, so a freeze cannot be written. */
    checkEvidence?: EvidenceChecker | null
  } = {}
): Promise<FreezeManifest> {
  const readJson = <T>(rel: string): T | null => {
    const abs = path.join(root, rel)
    return fs.existsSync(abs) ? (JSON.parse(fs.readFileSync(abs, 'utf8')) as T) : null
  }
  const status = git(root, 'status', '--porcelain')
  const pkg = readJson<{ version?: string }>('package.json')
  const prov = readJson<ProvenanceFile>(PROVENANCE_REL)
  const inv = readJson<InventoryFile>(INVENTORY_REL)
  const report = readJson<ReportShape>(REPORT_JSON_REL)

  const checkReleaseEvidence: EvidenceChecker =
    opts.checkEvidence ?? (async () => ({ errors: [NO_CHECKER], notes: [] as string[] }))
  const check = await checkReleaseEvidence(root, [])
  let presentation: FreezeManifest['presentation'] = null
  if (opts.presentation) {
    const dir = path.resolve(opts.presentation)
    const files = fs.existsSync(dir)
      ? fs
          .readdirSync(dir)
          .filter((n) => fs.statSync(path.join(dir, n)).isFile() && !n.startsWith('.'))
          .sort()
          .map((n) => ({ path: n, sha256: sha256(fs.readFileSync(path.join(dir, n))) }))
      : []
    const deck = fs.existsSync(dir)
      ? await checkReleaseEvidence(root, [dir])
      : { errors: [`presentation path does not exist: ${dir}`], notes: [] }
    presentation = {
      dir,
      files,
      check: deck.errors.length ? 'fail' : 'pass',
      findings: deck.errors,
    }
  }

  return {
    schema: FREEZE_SCHEMA,
    label: opts.label ?? null,
    mode: opts.mode ?? 'dry-run',
    frozenAt: new Date().toISOString(),
    hub: {
      commit: git(root, 'rev-parse', 'HEAD'),
      describe: git(root, 'describe', '--tags', '--always', '--dirty'),
      version: pkg?.version ?? null,
      clean: status === null ? null : status === '',
      uncommitted: status ? status.split('\n').filter(Boolean) : [],
    },
    wasmBundles: (prov?.bundles ?? []).map((b) => ({
      name: b.name,
      hsmCommit: b.hsmCommit ?? null,
      builtAt: b.builtAt ?? null,
      files: hashAll(root, b.files),
    })),
    engines: Object.entries(inv?.engines ?? {}).map(([engine, e]) => ({
      engine,
      sourceCommit: e.identity.sourceCommit ?? null,
      artifacts: e.identity.artifacts.map((a) => {
        const now = hashFile(root, a.path)
        return { path: a.path, recordedSha256: a.sha256, sha256: now, matches: now === a.sha256 }
      }),
    })),
    generated: hashAll(root, [REPORT_JSON_REL, REPORT_MD_REL]),
    reportClaimsSha256: report ? claimsSha256(report) : null,
    reportInputs: report?.inputs ?? {},
    evidenceRuns: (report?.crossTarget.runs ?? []).map((r) => ({
      runId: r.runId,
      matrix: { path: `${r.dir}/matrix.json`, sha256: hashFile(root, `${r.dir}/matrix.json`) },
    })),
    presentation,
    checks: { releaseEvidence: check.errors.length ? 'fail' : 'pass', errors: check.errors },
  }
}

/** Why a freeze may not be written (empty = allowed). */
export function refuseToWrite(m: FreezeManifest): string[] {
  const out: string[] = []
  if (!m.label || !/^[A-Za-z0-9._-]+$/.test(m.label))
    out.push('--label <label> is required ([A-Za-z0-9._-])')
  if (m.hub.commit === null) out.push('not a git checkout — no commit to freeze')
  if (m.hub.clean !== true)
    out.push(
      `the tree is not clean (${m.hub.uncommitted.length} uncommitted path(s)) — commit first`
    )
  if (m.checks.releaseEvidence !== 'pass')
    out.push('the release-evidence check fails — regenerate and commit the report first')
  if (!m.presentation)
    out.push('--presentation <dir> is required: the freeze must record the deck check')
  else if (m.presentation.check !== 'pass')
    out.push('the deck check fails (see presentation.findings)')
  for (const e of m.engines)
    for (const a of e.artifacts)
      if (!a.matches)
        out.push(
          `${a.path} no longer matches the hash the inventory recorded — regenerate the inventory`
        )
  return out
}

/** Compare the current tree to a written freeze. Returns the differences (empty = still frozen). */
export function compareToFreeze(
  root: string,
  frozen: FreezeManifest
): { diffs: string[]; notes: string[] } {
  const diffs: string[] = []
  const notes: string[] = []
  const cmp = (kind: string, files: FileHash[]) => {
    for (const f of files) {
      const now = hashFile(root, f.path)
      if (now !== f.sha256)
        diffs.push(`${kind} ${f.path}: frozen ${f.sha256 ?? 'absent'} → now ${now ?? 'absent'}`)
    }
  }
  for (const b of frozen.wasmBundles) cmp(`wasm bundle ${b.name}`, b.files)
  for (const e of frozen.engines)
    cmp(
      `engine ${e.engine}`,
      e.artifacts.map((a) => ({ path: a.path, sha256: a.sha256 }))
    )
  for (const f of frozen.generated) {
    const now = hashFile(root, f.path)
    if (now !== f.sha256)
      notes.push(
        `${f.path} changed since the freeze (reviews / checklist may move; the figures are compared below)`
      )
  }
  const reportAbs = path.join(root, REPORT_JSON_REL)
  const claimsNow = fs.existsSync(reportAbs)
    ? claimsSha256(JSON.parse(fs.readFileSync(reportAbs, 'utf8')) as Record<string, unknown>)
    : null
  if (claimsNow !== frozen.reportClaimsSha256)
    diffs.push(
      `release evidence figures: frozen ${frozen.reportClaimsSha256 ?? 'absent'} → now ${claimsNow ?? 'absent'}`
    )
  cmp(
    'report input',
    Object.entries(frozen.reportInputs).map(([p, h]) => ({ path: p, sha256: h }))
  )
  for (const r of frozen.evidenceRuns) cmp(`evidence run ${r.runId}`, [r.matrix])
  const prov = path.join(root, PROVENANCE_REL)
  if (fs.existsSync(prov)) {
    const cur = JSON.parse(fs.readFileSync(prov, 'utf8')) as ProvenanceFile
    for (const b of frozen.wasmBundles) {
      const c = cur.bundles.find((x) => x.name === b.name)
      if ((c?.hsmCommit ?? null) !== b.hsmCommit)
        diffs.push(
          `wasm bundle ${b.name}: frozen hsm commit ${b.hsmCommit} → now ${c?.hsmCommit ?? 'absent'}`
        )
    }
  }
  if (frozen.hub.commit) {
    const head = git(root, 'rev-parse', 'HEAD')
    if (head && head !== frozen.hub.commit) {
      const since = git(root, 'log', '--oneline', `${frozen.hub.commit}..HEAD`)
      const n = since ? since.split('\n').filter(Boolean).length : 0
      notes.push(
        `${n} commit(s) since the freeze at ${frozen.hub.commit.slice(0, 12)} — plan J-4 allows blocker fixes only:\n${since ?? ''}`
      )
    }
  }
  return { diffs, notes }
}

function arg(args: string[], name: string): string | null {
  const i = args.indexOf(name)
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const checkFile = arg(args, '--check')
  if (checkFile) {
    const frozen = JSON.parse(fs.readFileSync(checkFile, 'utf8')) as FreezeManifest
    if (frozen.schema !== FREEZE_SCHEMA) {
      console.error(`[release:freeze] ${checkFile} is not a ${FREEZE_SCHEMA} manifest`)
      process.exit(1)
    }
    const { diffs, notes } = compareToFreeze(ROOT, frozen)
    for (const n of notes) console.warn(`[release:freeze] ${n}`)
    if (diffs.length) {
      console.error(`[release:freeze] FAIL — ${diffs.length} difference(s) from ${checkFile}:`)
      for (const d of diffs) console.error(`  ${d}`)
      process.exit(1)
    }
    console.warn(`[release:freeze] OK — the tree still matches ${checkFile}`)
    return
  }
  const write = args.includes('--write')
  const checkerPath = arg(args, '--evidence-checker')
  const checkEvidence = checkerPath
    ? (
        (await import(pathToFileURL(path.resolve(checkerPath)).href)) as {
          checkReleaseEvidence: EvidenceChecker
        }
      ).checkReleaseEvidence
    : null
  const m = await buildFreezeManifest(ROOT, {
    checkEvidence,
    label: arg(args, '--label'),
    presentation: arg(args, '--presentation'),
    mode: write ? 'frozen' : 'dry-run',
  })
  const text = JSON.stringify(m, null, 2) + '\n'
  if (!write) {
    process.stdout.write(text)
    const why = refuseToWrite({ ...m, label: m.label ?? 'dry-run' })
    console.warn(
      `[release:freeze] DRY RUN — nothing written.${why.length ? ` A --write now would be refused:\n  ${why.join('\n  ')}` : ' A --write with this label would be accepted.'}`
    )
    return
  }
  const why = refuseToWrite(m)
  const out = path.join(ROOT, FREEZE_DIR_REL, `${m.label}.freeze.json`)
  if (fs.existsSync(out))
    why.push(`${path.relative(ROOT, out)} exists — a freeze is never overwritten`)
  if (why.length) {
    console.error(`[release:freeze] refused:\n  ${why.join('\n  ')}`)
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(out), { recursive: true })
  fs.writeFileSync(out, text)
  console.warn(`[release:freeze] wrote ${path.relative(ROOT, out)} — commit it`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main()
}
