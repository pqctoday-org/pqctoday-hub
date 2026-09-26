// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-validation-manifest — provenance / hash / copy gate for every
 * expected-value vector file under src/data/acvp (plan WS-B, B-1..B-3, B-5, B-6).
 *
 * Fails (exit 1) when:
 *   - the manifest does not validate against validationCaseManifest.schema.json,
 *     or the schema's evidence-class enum drifts from evidenceClasses.ts;
 *   - a JSON file in the vector root is not registered, or a registered file is missing;
 *   - a vector file's SHA-256 differs from the manifest (a changed byte needs a
 *     reviewed manifest update in the same commit);
 *   - a NIST-class record lacks commit / upstream path / retrieval date / upstream
 *     SHA-256, or disagrees with the vector file's own `_provenance` block;
 *   - an `unverified` record is not quarantined, or a class is not backed by the
 *     matching source kind (a published-standard KAT needs a recorded byte
 *     verification against the document);
 *   - a test case exists in a file but is not registered (or vice versa);
 *   - a lineage reference dangles;
 *   - the vector file's own `_provenance.producer` implies a different class and
 *     the conflict is not declared (or a declared conflict no longer exists);
 *   - a copy of a vector (byte-equal file, or a case's expected value embedded
 *     elsewhere in src/ public/ e2e/ kat/) is not declared, or a declared copy
 *     has diverged from the source case;
 *   - a CONTRIBUTED vector (any active file not in PRE_CONTRIBUTOR_FLOW_FILES)
 *     lacks a reviewed license note, complete source identity for its kind,
 *     operation/expectation/testType per case, or an approved, non-stale
 *     two-person review record (reviews/*.review.json) — WS-I contributor flow.
 *
 * Usage:
 *   npx tsx scripts/audit-validation-manifest.ts                 # the gate
 *   npx tsx scripts/audit-validation-manifest.ts --root <dir>    # audit another tree (sabotage copies)
 *   npx tsx scripts/audit-validation-manifest.ts --cross-repo ../pqctoday-hsm [--cross-repo …]
 *       # local-only report of copies in sibling repos (CI cannot read them; never fails)
 *   npx tsx scripts/audit-validation-manifest.ts --scaffold src/data/acvp/<new>.json
 *       # print a skeleton manifest entry for a new vector file
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv from 'ajv'
import {
  EVIDENCE_CLASS_IDS,
  UNVERIFIED,
  isEvidenceClassId,
} from '../src/data/validation/evidenceClasses'
import type {
  CaseContainer,
  ValidationCaseManifest,
  VectorFileEntry,
} from '../src/data/validation/validationCaseManifest'
import {
  sourceCheckEligible,
  validateReviewRecord,
  validateSourceCheck,
  type ReviewItem,
  type ReviewRecord,
  type SourceCheckRecord,
} from '../src/data/validation/reviewRecords'
import { canonical } from './generate-release-evidence'

/**
 * Manifest `source.kind` values whose bytes can be re-verified against an
 * external pinned upstream, so one named reviewer suffices (2026-09-26).
 * Everything else keeps the two-distinct-reviewer rule. Separately, a source
 * that `sourceCheckEligible` accepts may be reviewed by an automated source
 * check instead of any person (see ReviewItem.sourceCheckOk).
 */
const SINGLE_REVIEWER_SOURCE_KINDS = new Set(['nist-acvp-server'])

export const MANIFEST_REL = 'src/data/validation/vector-manifest.json'
export const SCHEMA_REL = 'src/data/validation/validationCaseManifest.schema.json'
/** Where in-hub copies are searched for (B-6). */
export const DEFAULT_SCAN_ROOTS = ['src', 'public', 'e2e', 'kat']
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
  '.claude',
  // sibling-repo (--cross-repo) build output and nested checkouts
  'target',
  '.worktrees',
])
// Code, fixtures and snapshots. CSV catalogs and Markdown enrichment dumps
// (~870 MB, mostly gitignored archives) are excluded: they hold catalog prose,
// not test vectors, and would make the gate take ~30 s instead of a few.
const TEXT_EXT = /\.(json|ts|tsx|js|mjs|cjs|snap|xml|txt|html|yaml|yml)$/i
const MAX_SCAN_BYTES = 64 * 1024 * 1024

/**
 * Vector files registered before the contributor flow (WS-I, 2026-09-25) —
 * the 40 files on the integration branch at 1c35f842f. They predate the
 * two-person review (plan J-5) and are listed in the release evidence's
 * review items. EVERY OTHER active file is a contribution and must carry, in
 * the manifest, a reviewed license/redistribution note, complete source
 * identity for its kind, an operation and expectation per case, and an
 * approved, non-stale two-person review record
 * (src/data/validation/reviews/*.review.json, item vector-source:<id>).
 * Adding an id here is a reviewed decision, never a way around the rule.
 */
export const PRE_CONTRIBUTOR_FLOW_FILES: ReadonlySet<string> = new Set([
  'aescbc_test',
  'aescmac_test',
  'aesctr_test',
  'aesgcm_test',
  'aeskw_test',
  'composite-sigs-jose-kat',
  'cose-dilithium-11-jose-kat',
  'ecdsa_p384_test',
  'ecdsa_p521_test',
  'ecdsa_test',
  'eddsa_ed448_test',
  'eddsa_test',
  'hkdf_test',
  'hmac_sha384_test',
  'hmac_sha512_test',
  'hmac_test',
  'jose-pqc-kem-jwe-kat',
  'kmac_test',
  'mldsa_extended_test',
  'mldsa_keygen_test',
  'mldsa_siggen_ctxmsg_test',
  'mldsa_siggen_det_test',
  'mldsa_siggen_prehash_test',
  'mldsa_sigver_test',
  'mldsa_test',
  'mlkem_encapdecap_val_test',
  'mlkem_keygen_test',
  'mlkem_test',
  'pbkdf2_test',
  'rsa_oaep_test',
  'rsapss_test',
  'sha256_test',
  'sha384_test',
  'sha3_256_test',
  'sha3_512_test',
  'sha512_test',
  'slhdsa_ctx_test',
  'slhdsa_siggen_det_test',
  'slhdsa_sigver_sha2_test',
  'slhdsa_sigver_shake_test',
])

export const REVIEWS_REL = 'src/data/validation/reviews'

/** What a contributed (non-baseline) vector record is missing, one message per gap. */
export function contributionProblems(
  e: VectorFileEntry,
  reviews: ReadonlyArray<{ file: string; record: unknown }>,
  sourceChecks: ReadonlyArray<{ file: string; record: unknown }> = []
): { code: string; message: string }[] {
  const out: { code: string; message: string }[] = []
  const note = e.license?.note ?? ''
  if (e.license?.reviewed !== true || /\bTODO\b/.test(note) || note.trim().length < 20)
    out.push({
      code: 'CONTRIB_LICENSE',
      message:
        'a contributed vector needs a reviewed license/redistribution note (license.reviewed: true)',
    })
  const src = e.source
  const missing: string[] = []
  if (src?.kind === 'nist-acvp-server') {
    if (!src.nist) missing.push('source.nist (repository, commit, upstream path, upstream SHA-256)')
  } else if (src?.kind === 'published-document') {
    if (!src.url) missing.push('source.url')
    if (!src.revision) missing.push('source.revision')
    if (!src.verification?.evidence?.some((d) => d.sha256))
      missing.push('source.verification.evidence[].sha256 (hash of the reviewed document)')
  } else if (src?.kind === 'oracle-generated') {
    if (!src.oracle?.name || !src.oracle?.version) missing.push('source.oracle name AND version')
    if (!src.generator) missing.push('source.generator (script/command, in the repo)')
  } else if (src?.kind === 'self-pinned-snapshot') {
    if (!src.generator) missing.push('source.generator')
  } else missing.push('source.kind')
  if (missing.length)
    out.push({
      code: 'CONTRIB_PROVENANCE',
      message: `a contributed vector needs ${missing.join(', ')}`,
    })
  const vague = e.cases.filter((c) => !c.operation || !c.expectation || !c.testType)
  if (vague.length)
    out.push({
      code: 'CONTRIB_EXPECTATION',
      message: `every case needs operation, expectation and testType (missing on ${vague.map((c) => c.caseId).join(', ')})`,
    })
  const item: ReviewItem = {
    id: `vector-source:${e.id}`,
    kind: 'vector-source',
    title: e.path,
    // Externally-verifiable sources need one reviewer, not two (2026-09-26) —
    // see ReviewItem.singleReviewerOk. Derived from the source kind, never from
    // the record, so a record cannot claim the relaxation for itself.
    requirement: SINGLE_REVIEWER_SOURCE_KINDS.has(e.source?.kind ?? '')
      ? 'one named reviewer (externally-verifiable source)'
      : 'two-person review',
    singleReviewerOk: SINGLE_REVIEWER_SOURCE_KINDS.has(e.source?.kind ?? ''),
    sourceCheckOk: sourceCheckEligible(e.source),
    subjectSha256: createHash('sha256').update(canonical(e)).digest('hex'),
  }
  const items = new Map([[item.id, item]])
  const recs = reviews.filter((r) => (r.record as Partial<ReviewRecord>)?.item === item.id)
  const ok = recs.some(
    (r) =>
      validateReviewRecord(r.record, items).length === 0 &&
      (r.record as ReviewRecord).decision === 'approved' &&
      (r.record as ReviewRecord).subjectSha256 === item.subjectSha256
  )
  // An automated source match stands in for the review on eligible sources
  // (maintainer decision 2026-09-26) — but only a current one, bound to this
  // exact entry, and only when no human record exists to decide instead.
  const checked =
    !recs.length &&
    item.sourceCheckOk === true &&
    sourceChecks.some(
      (r) =>
        (r.record as Partial<SourceCheckRecord>)?.item === item.id &&
        validateSourceCheck(r.record, items).length === 0 &&
        (r.record as SourceCheckRecord).subjectSha256 === item.subjectSha256
    )
  if (!ok && !checked)
    out.push({
      code: 'CONTRIB_REVIEW',
      message: recs.length
        ? `the review record for ${item.id} is invalid, not approved, or stale (subject SHA-256 now ${item.subjectSha256})`
        : item.sourceCheckOk
          ? `no current source check for ${item.id} in ${REVIEWS_REL} (run npm run acvp:source-check; a named review record also satisfies this)`
          : item.singleReviewerOk
            ? `no review record for ${item.id} in ${REVIEWS_REL} (source verification + implementation review; one named person may record both, because this source is byte-verifiable against its pinned upstream)`
            : `no two-person review record for ${item.id} in ${REVIEWS_REL} (source verification + implementation review by two distinct named people)`,
    })
  return out
}

/** Case fields whose values identify a case when found elsewhere (expected outputs + public keys). */
const FINGERPRINT_FIELDS = new Set([
  'ct',
  'tag',
  'mac',
  'md',
  'okm',
  'dk',
  'sig',
  'signature',
  'ss',
  'wrapped',
  'r',
  's',
  'pk',
  'qx',
  'jws',
  'expected_jws',
  'expected_jwe',
  'expected_shared_secret_hex',
  'public_key_hex',
  'ml_kem_public_key_hex',
])

export interface Finding {
  level: 'error' | 'info'
  code: string
  file?: string
  message: string
}

export const sha256 = (buf: Buffer | string): string =>
  createHash('sha256').update(buf).digest('hex')

type Json = null | boolean | number | string | Json[] | { [k: string]: Json }

export function resolvePointer(doc: Json, pointer: string): Json | undefined {
  if (pointer === '' || pointer === '/') return doc
  let cur: Json | undefined = doc
  for (const raw of pointer.split('/').slice(1)) {
    const tok = raw.replace(/~1/g, '/').replace(/~0/g, '~')
    if (Array.isArray(cur)) cur = cur[Number(tok)]
    else if (cur && typeof cur === 'object') cur = (cur as Record<string, Json>)[tok]
    else return undefined
    if (cur === undefined) return undefined
  }
  return cur
}

const escapeTok = (k: string) => k.replace(/~/g, '~0').replace(/\//g, '~1')

export function enumerateCases(doc: Json, containers: CaseContainer[]): string[] {
  const out: string[] = []
  for (const c of containers) {
    const node = resolvePointer(doc, c.pointer)
    if (c.kind === 'self') {
      if (node && typeof node === 'object' && !Array.isArray(node)) out.push(c.pointer)
    } else if (c.kind === 'array') {
      if (Array.isArray(node)) node.forEach((_, i) => out.push(`${c.pointer}/${i}`))
    } else if (node && typeof node === 'object' && !Array.isArray(node)) {
      for (const k of Object.keys(node)) out.push(`${c.pointer}/${escapeTok(k)}`)
    }
  }
  return out
}

/** Evidence class implied by a vector file's own `_provenance.producer` string. */
export function inFileClass(doc: Json): string | undefined {
  const prov =
    doc && typeof doc === 'object' && !Array.isArray(doc)
      ? (doc as Record<string, Json>)['_provenance']
      : undefined
  const producer =
    prov && typeof prov === 'object' && !Array.isArray(prov)
      ? (prov as Record<string, Json>)['producer']
      : undefined
  if (typeof producer !== 'string' || !producer) return undefined
  if (producer.startsWith('NIST ACVP-Server')) return 'nist-acvp-reference-sample'
  if (producer.startsWith('self-generated')) return 'independent-oracle'
  // A vendored third-party corpus is an oracle, not a standard: Project
  // Wycheproof is maintained by Google / C2SP, which is not a standards body,
  // and no standard prints its values. Without this branch the fallback below
  // would imply `published-standard-kat` for every Wycheproof file and force 6
  // spurious inFileProvenanceConflict declarations that say the same thing.
  if (producer.startsWith('Project Wycheproof')) return 'independent-oracle'
  return 'published-standard-kat'
}

function isFingerprint(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    v.length >= 32 &&
    /^[A-Za-z0-9_.-]+$/.test(v) &&
    new Set(v.toLowerCase()).size >= 10
  )
}

export interface CaseFingerprint {
  fileId: string
  caseId: string
  field: string
  value: string // lowercased
}

export function caseFingerprints(entry: VectorFileEntry, doc: Json): CaseFingerprint[] {
  const out: CaseFingerprint[] = []
  for (const c of entry.cases) {
    const node = resolvePointer(doc, c.pointer)
    if (!node || typeof node !== 'object' || Array.isArray(node)) continue
    for (const [field, v] of Object.entries(node)) {
      if (FINGERPRINT_FIELDS.has(field) && isFingerprint(v)) {
        out.push({ fileId: entry.id, caseId: c.caseId, field, value: v.toLowerCase() })
      }
    }
  }
  return out
}

function* walkFiles(root: string, rel: string): Generator<string> {
  const abs = path.join(root, rel)
  let st: fs.Stats
  try {
    st = fs.statSync(abs)
  } catch {
    return
  }
  if (st.isFile()) {
    yield rel
    return
  }
  if (!st.isDirectory()) return
  for (const name of fs.readdirSync(abs).sort()) {
    if (SKIP_DIRS.has(name)) continue
    yield* walkFiles(root, rel ? `${rel}/${name}` : name)
  }
}

const PREFIX_LEN = 16

/**
 * Fingerprints whose 16-char prefix occurs somewhere in `lower` — one map
 * lookup per character of every long token instead of one full-text search
 * per fingerprint (keeps the whole-repo scan to a few seconds).
 */
function candidateFingerprints(
  lower: string,
  byPrefix: Map<string, CaseFingerprint[]>
): CaseFingerprint[] {
  const out = new Set<CaseFingerprint>()
  for (const m of lower.matchAll(/[0-9a-z_.-]{32,}/g)) {
    const run = m[0]
    for (let i = 0; i + PREFIX_LEN <= run.length; i++) {
      const list = byPrefix.get(run.slice(i, i + PREFIX_LEN))
      if (list) for (const fp of list) out.add(fp)
    }
  }
  return [...out]
}

export interface CopyHit {
  path: string
  kind: 'byte-equal' | 'embedded'
  fileId: string
  caseIds: string[]
  fields: string[]
}

/** Scan `roots` under `root` for copies of registered vectors. */
export function scanForCopies(
  root: string,
  roots: string[],
  entries: { entry: VectorFileEntry; doc: Json; bytesSha: string }[],
  excludePrefixes: string[]
): CopyHit[] {
  const bySha = new Map(entries.map((e) => [e.bytesSha, e.entry.id]))
  const fps = entries.flatMap((e) => caseFingerprints(e.entry, e.doc))
  const byPrefix = new Map<string, CaseFingerprint[]>()
  for (const fp of fps) {
    const k = fp.value.slice(0, PREFIX_LEN)
    const list = byPrefix.get(k)
    if (list) list.push(fp)
    else byPrefix.set(k, [fp])
  }
  const hits: CopyHit[] = []
  for (const r of roots) {
    for (const rel of walkFiles(root, r)) {
      if (excludePrefixes.some((p) => rel === p || rel.startsWith(p.endsWith('/') ? p : p + '/')))
        continue
      if (!TEXT_EXT.test(rel)) continue
      const abs = path.join(root, rel)
      const size = fs.statSync(abs).size
      if (size > MAX_SCAN_BYTES) continue
      const buf = fs.readFileSync(abs)
      if (rel.endsWith('.json')) {
        const id = bySha.get(sha256(buf))
        if (id) {
          hits.push({ path: rel, kind: 'byte-equal', fileId: id, caseIds: [], fields: [] })
          continue
        }
      }
      const text = buf.toString('utf8')
      if (!/[A-Za-z0-9_.-]{32,}/.test(text)) continue
      const lower = text.toLowerCase()
      const perFile = new Map<string, CopyHit>()
      for (const fp of candidateFingerprints(lower, byPrefix)) {
        if (!lower.includes(fp.value)) continue
        let h = perFile.get(fp.fileId)
        if (!h) {
          h = { path: rel, kind: 'embedded', fileId: fp.fileId, caseIds: [], fields: [] }
          perFile.set(fp.fileId, h)
        }
        if (!h.caseIds.includes(fp.caseId)) h.caseIds.push(fp.caseId)
        if (!h.fields.includes(fp.field)) h.fields.push(fp.field)
      }
      hits.push(...perFile.values())
    }
  }
  return hits
}

export interface AuditOptions {
  root: string
  scanRoots?: string[]
}

export interface LoadedEntry {
  entry: VectorFileEntry
  doc: Json
  bytesSha: string
}

export function auditManifest(opts: AuditOptions): {
  findings: Finding[]
  manifest?: ValidationCaseManifest
  loaded: LoadedEntry[]
} {
  const { root } = opts
  const findings: Finding[] = []
  const err = (code: string, message: string, file?: string) =>
    findings.push({ level: 'error', code, message, file })
  const loaded: LoadedEntry[] = []

  const manifestAbs = path.join(root, MANIFEST_REL)
  const schemaAbs = path.join(root, SCHEMA_REL)
  let manifest: ValidationCaseManifest
  let schema: Record<string, unknown>
  try {
    manifest = JSON.parse(fs.readFileSync(manifestAbs, 'utf8'))
    schema = JSON.parse(fs.readFileSync(schemaAbs, 'utf8'))
  } catch (e) {
    err('LOAD', `cannot read manifest/schema: ${(e as Error).message}`)
    return { findings, loaded }
  }

  // 1. schema + enum drift
  const ajv = new Ajv({ allErrors: true, strict: false })
  const validate = ajv.compile(schema)
  if (!validate(manifest)) {
    for (const e of validate.errors ?? [])
      err('SCHEMA', `${e.instancePath || '/'} ${e.message ?? ''}`.trim())
  }
  const defs = (schema.definitions ?? {}) as Record<string, { enum?: string[] }>
  const schemaEnum = [...(defs.evidenceClass?.enum ?? [])].sort()
  const tsEnum = [...EVIDENCE_CLASS_IDS, UNVERIFIED].sort()
  if (JSON.stringify(schemaEnum) !== JSON.stringify(tsEnum))
    err(
      'CLASS_ENUM_DRIFT',
      `schema evidenceClass enum [${schemaEnum}] != evidenceClasses.ts [${tsEnum}]`
    )
  if (!Array.isArray(manifest.files)) return { findings, manifest, loaded }

  // 2. registration
  const vectorRoot = manifest.vectorRoot
  const onDisk = fs.existsSync(path.join(root, vectorRoot))
    ? fs
        .readdirSync(path.join(root, vectorRoot))
        .filter((f) => f.endsWith('.json'))
        .map((f) => `${vectorRoot}/${f}`)
    : []
  const registered = new Map<string, VectorFileEntry>()
  const ids = new Set<string>()
  const lineageIds = new Set<string>()
  for (const e of manifest.files) {
    if (registered.has(e.path)) err('DUPLICATE_ENTRY', `${e.path} registered twice`, e.path)
    registered.set(e.path, e)
    if (ids.has(e.id)) err('DUPLICATE_ID', `id ${e.id} used twice`, e.path)
    ids.add(e.id)
    if (path.posix.basename(e.path, '.json') !== e.id)
      err('ID_MISMATCH', `id ${e.id} does not match file name`, e.path)
    if (!e.path.startsWith(`${vectorRoot}/`))
      err('OUTSIDE_ROOT', `${e.path} is outside ${vectorRoot}`, e.path)
  }
  for (const f of onDisk)
    if (!registered.has(f))
      err('UNREGISTERED_FILE', `${f} is not registered in ${MANIFEST_REL} (run --scaffold ${f})`, f)

  for (const e of manifest.files) {
    const abs = path.join(root, e.path)
    if (!fs.existsSync(abs)) {
      err('MISSING_FILE', `${e.path} is registered but does not exist`, e.path)
      continue
    }
    const bytes = fs.readFileSync(abs)
    const bytesSha = sha256(bytes)
    if (bytesSha !== e.sha256)
      err(
        'HASH_MISMATCH',
        `${e.path} SHA-256 is ${bytesSha}, manifest records ${e.sha256} — a vector byte changed without a reviewed manifest update`,
        e.path
      )
    let doc: Json
    try {
      doc = JSON.parse(bytes.toString('utf8'))
    } catch (x) {
      err('PARSE', `${e.path}: ${(x as Error).message}`, e.path)
      continue
    }
    loaded.push({ entry: e, doc, bytesSha })

    // 3. class / status
    const classes = [e.evidenceClass, ...e.cases.map((c) => c.evidenceClass)].filter(Boolean)
    for (const cls of classes)
      if (cls !== UNVERIFIED && !isEvidenceClassId(cls))
        err('UNKNOWN_CLASS', `unknown evidence class ${cls}`, e.path)
    if (e.evidenceClass === UNVERIFIED && e.status !== 'quarantined')
      err('UNVERIFIED_ACTIVE', `unverified file must be quarantined`, e.path)
    for (const c of e.cases)
      if (c.evidenceClass === UNVERIFIED && c.status !== 'quarantined')
        err('UNVERIFIED_ACTIVE', `unverified case ${c.caseId} must be quarantined`, e.path)

    // 3b. the class must be backed by the matching kind of source evidence
    const kind = e.source?.kind
    const verdict = e.source?.verification?.result
    const classSourceProblem =
      e.evidenceClass === 'published-standard-kat'
        ? kind !== 'published-document'
          ? `needs source.kind published-document (has ${kind})`
          : !verdict || verdict === 'mismatch'
            ? 'needs a recorded source.verification whose result is match/partial'
            : undefined
        : e.evidenceClass === 'independent-oracle' && kind !== 'oracle-generated'
          ? `needs source.kind oracle-generated (has ${kind})`
          : e.evidenceClass === 'functional-round-trip' &&
              kind !== 'self-pinned-snapshot' &&
              kind !== 'oracle-generated'
            ? `needs a self-pinned or oracle-generated source (has ${kind})`
            : (e.evidenceClass === 'nist-acvp-reference-sample' ||
                  e.evidenceClass === 'published-standard-kat') &&
                verdict === 'mismatch'
              ? 'source verification recorded a mismatch'
              : undefined
    if (classSourceProblem)
      err('CLASS_SOURCE_MISMATCH', `${e.evidenceClass} ${classSourceProblem}`, e.path)

    // 4. NIST provenance completeness + agreement with the in-file block
    const usesNist =
      e.evidenceClass === 'nist-acvp-reference-sample' ||
      e.cases.some((c) => c.evidenceClass === 'nist-acvp-reference-sample')
    if (usesNist) {
      const n = e.source?.nist
      const missing = !n
        ? ['source.nist']
        : (['revision', 'upstreamPath', 'retrieved', 'upstreamSha256'] as const).filter(
            (k) => !n[k]
          )
      if (missing.length)
        err('NIST_PROVENANCE_INCOMPLETE', `NIST record missing ${missing.join(', ')}`, e.path)
      if (n) {
        const expectUrl = `https://raw.githubusercontent.com/usnistgov/ACVP-Server/${n.revision}/${n.upstreamPath}`
        if (n.url !== expectUrl)
          err(
            'NIST_URL_MISMATCH',
            `source.nist.url does not equal the commit + upstream path (${expectUrl})`,
            e.path
          )
        const prov = (doc as Record<string, Json>)?._provenance as Record<string, Json> | undefined
        if (prov && typeof prov === 'object') {
          const pairs: [string, Json | undefined, string][] = [
            ['source_url', prov.source_url, n.url],
            ['source_release', prov.source_release, n.revision],
            ['source_sha256', prov.source_sha256, n.upstreamSha256],
            ['retrieved', prov.retrieved, n.retrieved],
            ['source_commit', prov.source_commit, n.revision],
            ['source_path', prov.source_path, n.upstreamPath],
          ]
          for (const [k, inFile, man] of pairs)
            if (inFile !== undefined && inFile !== null && inFile !== man)
              err(
                'NIST_INFILE_DRIFT',
                `_provenance.${k} (${String(inFile)}) disagrees with the manifest (${man})`,
                e.path
              )
        }
      }
    }

    // 5. in-file provenance conflict must be declared, and declarations must be live
    const implied = inFileClass(doc)
    const conflicting = implied !== undefined && implied !== e.evidenceClass
    if (conflicting && !e.inFileProvenanceConflict)
      err(
        'IN_FILE_CLASS_CONFLICT',
        `vector _provenance.producer implies ${implied} but the manifest says ${e.evidenceClass}; declare inFileProvenanceConflict with the evidence, or fix the classification`,
        e.path
      )
    if (!conflicting && e.inFileProvenanceConflict)
      err(
        'STALE_CONFLICT_DECLARATION',
        `inFileProvenanceConflict is declared but the in-file block no longer conflicts`,
        e.path
      )

    // 6. case registry
    const enumerated = enumerateCases(doc, e.caseContainers)
    const regPointers = new Set<string>()
    const caseIds = new Set<string>()
    for (const c of e.cases) {
      if (regPointers.has(c.pointer)) err('DUPLICATE_CASE', `${c.pointer} registered twice`, e.path)
      regPointers.add(c.pointer)
      if (c.caseId !== `${e.id}#${c.pointer}`)
        err('CASE_ID_MISMATCH', `${c.caseId} should be ${e.id}#${c.pointer}`, e.path)
      caseIds.add(c.caseId)
      const node = resolvePointer(doc, c.pointer)
      if (!node || typeof node !== 'object' || Array.isArray(node))
        err('CASE_POINTER', `${c.pointer} does not resolve to a test case object`, e.path)
      else if (!enumerated.includes(c.pointer))
        err('CASE_OUTSIDE_CONTAINER', `${c.pointer} is not inside a declared caseContainer`, e.path)
    }
    for (const p of enumerated)
      if (!regPointers.has(p)) err('UNREGISTERED_CASE', `test case ${p} is not registered`, e.path)

    // 7. lineage (B-5)
    const fileLineage = new Set<string>()
    for (const l of e.lineage) {
      if (lineageIds.has(l.id)) err('DUPLICATE_LINEAGE', `lineage id ${l.id} used twice`, e.path)
      lineageIds.add(l.id)
      fileLineage.add(l.id)
      for (const t of l.appliesTo)
        if (!caseIds.has(t))
          err('LINEAGE_TARGET', `lineage ${l.id} applies to unknown case ${t}`, e.path)
    }
    for (const c of e.cases) {
      for (const ref of c.lineage ?? [])
        if (!fileLineage.has(ref))
          err('LINEAGE_REF', `${c.caseId} references unknown lineage ${ref}`, e.path)
      if (c.upstream?.tcId !== undefined && !(c.lineage ?? []).length)
        err(
          'LINEAGE_MISSING',
          `${c.caseId} is taken from an upstream set (tcId ${c.upstream.tcId}) but records no lineage`,
          e.path
        )
    }

    // 8. declared copies still match (B-6)
    for (const cp of e.copies) {
      const cpAbs = path.join(root, cp.path)
      if (!fs.existsSync(cpAbs)) {
        err('COPY_MISSING', `declared copy ${cp.path} does not exist`, e.path)
        continue
      }
      const cpBuf = fs.readFileSync(cpAbs)
      if (cp.kind === 'byte-equal') {
        if (sha256(cpBuf) !== bytesSha)
          err(
            'COPY_DIVERGED',
            `${cp.path} is declared byte-equal but its bytes differ — resync it or declare a new lineage record`,
            e.path
          )
        continue
      }
      const lower = cpBuf.toString('utf8').toLowerCase()
      for (const cid of cp.cases ?? []) {
        const c = e.cases.find((x) => x.caseId === cid)
        if (!c) {
          err('COPY_CASE', `copy ${cp.path} names unknown case ${cid}`, e.path)
          continue
        }
        const node = resolvePointer(doc, c.pointer) as Record<string, Json> | undefined
        for (const f of cp.fields ?? []) {
          const v = node?.[f]
          if (typeof v !== 'string' || !v) {
            err('COPY_FIELD', `copy ${cp.path}: case ${cid} has no string field ${f}`, e.path)
          } else if (!lower.includes(v.toLowerCase())) {
            err(
              'COPY_DIVERGED',
              `${cp.path} no longer contains ${cid} field ${f} — the copy and the vector have diverged`,
              e.path
            )
          }
        }
      }
    }
  }

  // 9. undeclared copies anywhere in the in-hub scan roots (B-6)
  const hits = scanForCopies(root, opts.scanRoots ?? DEFAULT_SCAN_ROOTS, loaded, [
    vectorRoot,
    path.posix.dirname(MANIFEST_REL),
  ])
  const byId = new Map(manifest.files.map((f) => [f.id, f]))
  for (const h of hits) {
    const entry = byId.get(h.fileId)
    const declared = entry?.copies.find((c) => c.path === h.path)
    if (!declared) {
      err(
        'UNDECLARED_COPY',
        h.kind === 'byte-equal'
          ? `${h.path} is a byte-equal copy of ${entry?.path}; declare it under copies (kind byte-equal) so it shares that identity`
          : `${h.path} embeds ${h.caseIds.join(', ')} (${h.fields.join(', ')}); declare it under ${entry?.path} copies`,
        entry?.path
      )
      continue
    }
    if (h.kind === 'embedded') {
      const missing = h.caseIds.filter((c) => !(declared.cases ?? []).includes(c))
      if (declared.kind === 'byte-equal' || missing.length)
        err(
          'UNDECLARED_COPY',
          `${h.path} embeds ${missing.join(', ') || h.caseIds.join(', ')} not listed in its copy declaration`,
          entry?.path
        )
    }
  }

  // 9. contributor flow (WS-I): a vector added after the baseline is trusted
  //    only with complete provenance, license, expectations and a two-person review.
  const reviewsDir = path.join(root, REVIEWS_REL)
  const readRecords = (suffix: string) =>
    fs.existsSync(reviewsDir)
      ? fs
          .readdirSync(reviewsDir)
          .filter((f) => f.endsWith(suffix))
          .map((f) => {
            try {
              return {
                file: f,
                record: JSON.parse(fs.readFileSync(path.join(reviewsDir, f), 'utf8')),
              }
            } catch {
              return { file: f, record: null }
            }
          })
      : []
  const reviews = readRecords('.review.json')
  const sourceChecks = readRecords('.source-check.json')
  for (const e of manifest.files) {
    if (e.status !== 'active' || PRE_CONTRIBUTOR_FLOW_FILES.has(e.id)) continue
    for (const p of contributionProblems(e, reviews, sourceChecks))
      err(p.code, `${e.id}: ${p.message}`, e.path)
  }

  return { findings, manifest, loaded }
}

/** Local-only: copies of the registered vectors in sibling repositories. */
export function crossRepoReport(root: string, otherRepo: string, loaded: LoadedEntry[]): Finding[] {
  const out: Finding[] = []
  const hits = scanForCopies(otherRepo, [''], loaded, [])
  const names = new Map(loaded.map((l) => [path.posix.basename(l.entry.path), l]))
  for (const h of hits) {
    out.push({
      level: 'info',
      code: h.kind === 'byte-equal' ? 'CROSS_REPO_BYTE_EQUAL' : 'CROSS_REPO_EMBEDDED',
      file: h.path,
      message:
        h.kind === 'byte-equal'
          ? `${h.path} == ${h.fileId}`
          : `${h.path} embeds ${h.caseIds.length} case(s) of ${h.fileId} (${h.fields.join(', ')})`,
    })
  }
  // same-named files that are NOT byte-equal: divergent parallel copies
  for (const rel of walkFiles(otherRepo, '')) {
    const base = path.posix.basename(rel)
    const l = names.get(base)
    if (!l || rel.includes('node_modules')) continue
    const s = sha256(fs.readFileSync(path.join(otherRepo, rel)))
    if (s !== l.bytesSha)
      out.push({
        level: 'info',
        code: 'CROSS_REPO_DIVERGENT_NAME',
        file: rel,
        message: `${rel} has the same name as ${l.entry.path} but different bytes`,
      })
  }
  void root
  return out
}

export function scaffoldEntry(root: string, rel: string): VectorFileEntry {
  const bytes = fs.readFileSync(path.join(root, rel))
  const doc = JSON.parse(bytes.toString('utf8')) as Json
  const id = path.posix.basename(rel, '.json')
  const obj = doc as Record<string, Json>
  let containers: CaseContainer[]
  if (Array.isArray(obj.testGroups))
    containers = (obj.testGroups as Json[]).map((_, i) => ({
      pointer: `/testGroups/${i}/tests`,
      kind: 'array' as const,
    }))
  else if (Array.isArray(obj.vectors)) containers = [{ pointer: '/vectors', kind: 'array' }]
  else if (obj.vector) containers = [{ pointer: '/vector', kind: 'self' }]
  else containers = [{ pointer: '/TODO', kind: 'map' }]
  const TODO = 'TODO'
  return {
    id,
    path: rel,
    sha256: sha256(bytes),
    status: 'quarantined',
    statusReason: 'TODO: new file — classify, then set status active',
    evidenceClass: UNVERIFIED,
    source: { kind: 'published-document', citation: TODO },
    license: { note: TODO, reviewed: false },
    caseContainers: containers,
    cases: enumerateCases(doc, containers).map((pointer) => ({
      caseId: `${id}#${pointer}`,
      pointer,
      algorithm: { name: TODO, revision: null },
      operation: TODO,
      parameters: {},
      testType: TODO,
      expectation: 'positive',
    })),
    lineage: [],
    copies: [],
    publishabilityGaps: [],
  }
}

function main(): void {
  const args = process.argv.slice(2)
  const opt = (name: string) => {
    const i = args.indexOf(name)
    return i >= 0 ? args[i + 1] : undefined
  }
  const root = path.resolve(
    opt('--root') ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
  )
  const scaffold = opt('--scaffold')
  if (scaffold) {
    process.stdout.write(JSON.stringify(scaffoldEntry(root, scaffold), null, 2) + '\n')
    return
  }
  const { findings, manifest, loaded } = auditManifest({ root })
  const errors = findings.filter((f) => f.level === 'error')
  const cases = manifest?.files?.reduce((n, f) => n + (f.cases?.length ?? 0), 0) ?? 0
  const copies = manifest?.files?.reduce((n, f) => n + (f.copies?.length ?? 0), 0) ?? 0
  console.warn(
    `[audit-validation-manifest] ${manifest?.files?.length ?? 0} vector files, ${cases} cases, ${copies} declared copies`
  )
  for (const f of errors)
    console.error(`  ✗ ${f.code}${f.file ? ` [${f.file}]` : ''}: ${f.message}`)

  const crossRepos = args.flatMap((a, i) => (a === '--cross-repo' ? [args[i + 1]] : []))
  for (const repo of crossRepos) {
    const report = crossRepoReport(root, path.resolve(repo), loaded)
    console.warn(`[cross-repo] ${repo}: ${report.length} observation(s) (informational)`)
    for (const f of report) console.warn(`  · ${f.code}: ${f.message}`)
  }

  if (errors.length) {
    console.error(`[audit-validation-manifest] FAIL — ${errors.length} error(s)`)
    process.exit(1)
  }
  console.warn('[audit-validation-manifest] OK')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main()
}
