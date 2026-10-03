// SPDX-License-Identifier: GPL-3.0-only
/**
 * VECTOR REACHABILITY CHECK  (`npm run audit:vector-reachability`)
 *
 * WHY THIS EXISTS
 * ---------------
 * "Do we hold a vector for X" and "does anything execute the vector for X" are
 * two different questions, and an affirmative to the first keeps being read as
 * an answer to the second.
 *
 * The measurement that forced this gate (2026-09-26, pqctoday-hsm):
 * `tests/acvp/eddsa_test.json` and `tests/acvp/eddsa_ed448_test.json` hold 20
 * NIST ACVP EDDSA-SigGen-1.0 pre-hash cases, every one with a non-empty
 * context, all re-verified against OpenSSL 3.6.3 at adoption (40/40
 * byte-exact). The ONLY reference to either filename anywhere in that tree is a
 * comment in `scripts/check_acvp_provenance.py`. Nothing reads `vectorSets`; no
 * test path touches them. So 20 correct, provenance-verified Tier-1 vectors sat
 * unused while the defect they would have detected stayed live in the engine.
 *
 * This is the same structural class as a test file that no CI gate runs —
 * see scripts/ci/check-test-reachability.ts, whose shape this file follows.
 *
 * WHAT IT DOES
 * ------------
 * 1. Enumerates every vector/KAT data file under the declared VECTOR_ROOTS
 *    (tinyglobby, git-ignored paths removed), and counts the cases each one
 *    holds. The count is the point: "orphaned" is abstract, "orphaned, 60
 *    cases" is a number you can weigh.
 * 2. Asks vitest itself which test files execute (default config = the CI
 *    tier, vitest.local.config.ts = the local tier) and traces the real module
 *    graph out of them — static `import`, `import()`, `require`, `?raw` — to
 *    find every vector file an executing test actually loads.
 * 3. Also counts a `readFileSync`/`fetch` of a path written as a literal, which
 *    no import graph can see. Comments are STRIPPED before that scan, because a
 *    filename in a comment is exactly what fooled us in hsm. (Known and
 *    deliberate conservatism: a module that both names a vector in a string and
 *    reads some other file is credited with reaching it. That direction costs a
 *    missed orphan, never a false one, and it is the direction a mocked suite
 *    needs — useAcvpSuite.mldsaAcvp.local.test.ts reads the real bytes off disk
 *    and `vi.doMock`s them INTO the import, so treating the mock as "not read"
 *    on its own would be wrong.)
 * 4. Handles the ways a vector is loaded WITHOUT its name appearing in any
 *    source file (RUNTIME_LOADERS below): a `readdirSync` directory sweep, a
 *    `${name}.json` template path, a manifest-driven index that supplies the
 *    filename at run time, and a composed root×name×file path. Without these
 *    the check would invent false orphans; each entry replays the loader's own
 *    rule and cites the line.
 * 5. Refuses to count a non-executing read as an execution (NON_EXECUTING_READERS).
 *    A file whose only reader hashes it, schema-checks it or diffs it against
 *    a manifest is exactly the eddsa case: held, verified, never executed.
 * 6. Cross-checks against src/data/validation/vector-manifest.json (declared
 *    vector files) and src/data/validation/testRegistry.ts (declared cases),
 *    and reports all four states — in-manifest+executed, in-manifest+NOT
 *    executed, on-disk+not-in-manifest, executed+not-declared. The middle two
 *    are the blind spot.
 * 7. Proves itself non-vacuous on every run, in both directions plus three
 *    structural invariants (assertNonVacuous). A checker that reports
 *    "0 orphans" because its own tracing is broken is the exact failure mode
 *    being eliminated here, so that is a hard failure, never a warning.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It does not ask whether the test that loads a vector is itself run by a CI
 * gate — that is check-test-reachability.ts's question, and duplicating it here
 * would mean two gates disagreeing about one fact. Where a vector's only
 * executing reader is a `*.local.test.ts` (a tier that check-test-reachability
 * reports as CI-orphaned), this check records it as a WARNING naming that other
 * gate, and does not fail on it.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { glob } from 'tinyglobby'

const ROOT = path.resolve(import.meta.dirname, '..', '..')

const rel = (abs: string): string => path.relative(ROOT, abs).split(path.sep).join('/')
const abs = (r: string): string => path.join(ROOT, r)

// ── The vector universe ──────────────────────────────────────────────────────

/**
 * Where vector/KAT data lives. Worked out by LOOKING (2026-09-26): every
 * directory in this repo that holds test-case bytes, not a guessed layout.
 * Adding a new vector directory without adding it here makes this check blind
 * to it — which is silent, so the accompanying test pins the root count.
 */
export const VECTOR_ROOTS: { id: string; patterns: string[]; reason: string }[] = [
  {
    id: 'acvp',
    patterns: ['src/data/acvp/**/*.json'],
    reason:
      'NIST ACVP / published-standard vector files; the declared domain of vector-manifest.json (vectorRoot: src/data/acvp).',
  },
  {
    id: 'kat-anchor',
    patterns: ['src/test/kat/fixtures/**/*.json'],
    reason:
      'pinned anchor KAT fixtures (one signature/KEM fixture per parameter set) replayed against the OpenSSL wasm driver.',
  },
  {
    id: 'acvp-format-fixtures',
    patterns: ['src/services/acvp/__fixtures__/**/*.json'],
    reason:
      'WS-F ACVP-format prototype fixtures: NIST ACVP-Server prompt/expectedResults pairs plus the dual-engine golden responses.',
  },
  {
    id: 'entropy90b-kat',
    patterns: ['src/wasm/entropy90b/__fixtures__/**/*.json'],
    reason:
      'SP 800-90B estimator KAT: expected outputs captured from the NIST reference implementation.',
  },
  {
    id: 'pkcs11-profiles',
    patterns: [
      'src/data/pkcs11-profiles/test-cases/**/*.xml',
      'src/data/pkcs11-profiles/fixtures/**/*',
    ],
    reason:
      'OASIS PKCS #11 profile test-case transcripts vendored verbatim, plus the DER fixtures those transcripts embed.',
  },
  {
    id: 'kmip-corpus',
    patterns: ['public/kmip-corpus/**/*.xml', 'public/kmip-corpus/**/*.json'],
    reason:
      'OASIS KMIP conformance corpus transcripts (oasis/mandatory, oasis/optional, pqc) staged from pqctoday-hsm by scripts/build-kmip-wasm.sh.',
  },
]

/**
 * Files that sit under a VECTOR_ROOT but carry NO cases — indexes, provenance
 * sidecars, codepoint/spec tables. Excluded from the universe with a reason, and
 * validated: an entry that does not exist, or that turns out to contain cases
 * after all, is reported as stale and FAILS. Blanket shape-heuristics were the
 * alternative and they drop real files silently.
 */
export const NON_VECTOR_SIDECARS: { file: string; expectedBasis: string; reason: string }[] = [
  {
    file: 'src/services/acvp/__fixtures__/goldens/goldens.json',
    expectedBasis: 'none',
    reason:
      'index over the golden responses (schemaId/vsId/canonical hashes/responseFile), not cases itself — it is what RUNTIME_LOADERS acvp-goldens-response-index reads.',
  },
  {
    file: 'src/services/acvp/__fixtures__/nist-acvp-server/PROVENANCE.json',
    expectedBasis: 'none',
    reason:
      'upstream provenance record for the ACVP-Server fixtures (commit, paths, hashes); imported by src/services/acvp/evidence.ts as metadata.',
  },
  {
    file: 'src/data/pkcs11-profiles/fixtures/_provenance.json',
    expectedBasis: 'none',
    reason: 'provenance/derivation note for the DER fixtures beside it; holds no test case.',
  },
  {
    file: 'public/kmip-corpus/manifest.json',
    expectedBasis: 'tests[]',
    reason:
      'the corpus index — it is what RUNTIME_LOADERS kmip-corpus-tier-sweep and the app hook resolve paths through. Its `tests[]` array holds 144 index ENTRIES (name/file/tier/category), not cases, which is why expectedBasis is tests[] rather than none.',
  },
  {
    file: 'public/kmip-corpus/tags-enums.json',
    expectedBasis: 'none',
    reason:
      'KMIP codepoint/spec table (CodepointTable.fromSpec input), not transcripts; loaded by the corpus runner and the TTLV tests.',
  },
  {
    file: 'public/kmip-corpus/section61-headings.json',
    expectedBasis: 'none',
    reason: 'KMIP spec §6.1 heading list used for citation-drift checking; holds no test case.',
  },
]

/** `{count, basis}` so a sidecar exclusion can be VALIDATED rather than trusted:
 *  a declared sidecar must come back with basis 'none'. */
export function countCases(file: string, text: string): { count: number; basis: string } {
  if (!file.endsWith('.json')) return { count: 1, basis: 'transcript-or-blob' }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { count: 1, basis: 'transcript-or-blob' }
  }
  let tcIds = 0
  const arrays = { vectors: 0, tests: 0, cases: 0 }
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const c of node) walk(c)
      return
    }
    if (!node || typeof node !== 'object') return
    const obj = node as Record<string, unknown>
    if ('tcId' in obj) tcIds++
    for (const [k, v] of Object.entries(obj)) {
      if (Array.isArray(v)) {
        if (k === 'vectors') arrays.vectors += v.length
        else if (k === 'tests') arrays.tests += v.length
        else if (k === 'cases') arrays.cases += v.length
      }
      walk(v)
    }
  }
  walk(parsed)
  if (tcIds > 0) return { count: tcIds, basis: 'tcId' }
  if (arrays.vectors > 0) return { count: arrays.vectors, basis: 'vectors[]' }
  if (arrays.cases > 0) return { count: arrays.cases, basis: 'cases[]' }
  if (arrays.tests > 0) return { count: arrays.tests, basis: 'tests[]' }
  // A single-case KAT file carries one `vector` OBJECT, not an array (the
  // shape of the since-deleted composite-sigs-jose-kat / jose-pqc-kem-jwe-kat).
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const v = (parsed as Record<string, unknown>).vector
    if (v && typeof v === 'object') return { count: 1, basis: 'vector' }
  }
  return { count: 0, basis: 'none' }
}

export async function enumerateVectorUniverse(): Promise<string[]> {
  const found = new Set<string>()
  for (const root of VECTOR_ROOTS) {
    const files = await glob(root.patterns, {
      cwd: ROOT,
      ignore: ['**/node_modules/**'],
      dot: false,
    })
    for (const f of files) found.add(f.split(path.sep).join('/'))
  }
  const sidecars = new Set(NON_VECTOR_SIDECARS.map((s) => s.file))
  return dropGitIgnored([...found].filter((f) => !sidecars.has(f)).sort())
}

function dropGitIgnored(files: string[]): string[] {
  if (files.length === 0) return files
  // `git check-ignore --stdin` prints only the ignored paths; exit 1 means
  // "none matched", which is not an error here.
  let out = ''
  try {
    out = execFileSync('git', ['check-ignore', '--stdin'], {
      cwd: ROOT,
      input: files.join('\n'),
      encoding: 'utf8',
    })
  } catch (err) {
    const e = err as { status?: number; stdout?: string }
    if (e.status === 1) out = e.stdout ?? ''
    else throw err
  }
  const ignored = new Set(out.split('\n').filter(Boolean))
  return files.filter((f) => !ignored.has(f))
}

// ── Which tests execute ──────────────────────────────────────────────────────

/** Both vitest tiers. `ci` is what `npx vitest run` (ci.yml job `test`) resolves;
 *  `local` is the `*.local.test.*` tier, whose own gate-coverage is
 *  check-test-reachability.ts's question, not this file's. */
export type Tier = 'ci' | 'local'

const VITEST_TIERS: { tier: Tier; config: string | null; source: string }[] = [
  {
    tier: 'ci',
    config: null,
    source: '.github/workflows/ci.yml job "test": npx vitest run --shard (default config)',
  },
  {
    tier: 'local',
    config: 'vitest.local.config.ts',
    source: 'vitest.local.config.ts (include: **/*.local.test.{ts,tsx}) — npm run test:local',
  },
]

/** Ask vitest itself which files a tier resolves. Re-implementing its
 *  include/exclude semantics by hand produces a wrong answer that looks
 *  authoritative, which is the failure mode this check exists to eliminate. */
function listTestFiles(config: string | null): string[] {
  // `--json` MUST be last: it is declared `--json [path]`, so a positional after
  // it is swallowed as an output file path.
  const args = ['vitest', 'list', '--filesOnly']
  if (config) args.push('--config', config)
  args.push('--json')
  const raw = execFileSync('npx', args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, CI: process.env.CI ?? '', FORCE_COLOR: '0' },
  })
  const i = raw.search(/[[{]/)
  if (i < 0) throw new Error(`no JSON in vitest output:\n${raw.slice(0, 2000)}`)
  const parsed = JSON.parse(raw.slice(i)) as { file: string }[]
  return parsed.map((e) => rel(path.resolve(e.file)))
}

// ── The module graph ─────────────────────────────────────────────────────────

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const RESOLVE_ORDER = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '/index.ts',
  '/index.tsx',
  '/index.js',
]

/** Specifier -> repo-relative path, or null for anything outside this repo
 *  (bare packages, the `@sdk` sibling-repo alias, node builtins). Mirrors
 *  vite.config.ts `resolve.alias` — the only alias into this repo is `@` -> src. */
export function resolveSpecifier(fromFile: string, spec: string): string | null {
  const clean = spec.split('?')[0]!.split('#')[0]!
  let target: string
  if (clean.startsWith('@/')) target = path.join(ROOT, 'src', clean.slice(2))
  else if (clean.startsWith('./') || clean.startsWith('../'))
    target = path.resolve(ROOT, path.dirname(fromFile), clean)
  else return null
  for (const ext of RESOLVE_ORDER) {
    const candidate = target + ext
    try {
      if (statSync(candidate).isFile()) return rel(candidate)
    } catch {
      /* not this candidate */
    }
  }
  return null
}

const SPEC_PATTERNS = [
  /\bfrom\s*['"]([^'"]+)['"]/g,
  /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /\bimport\s+['"]([^'"]+)['"]/g,
]
const MOCK_PATTERN = /\bvi\.(?:mock|doMock)\s*\(\s*['"]([^'"]+)['"]/g

export type ModuleEdges = {
  /** In-repo modules this file pulls in (source files only — data files are leaves). */
  children: string[]
  /** In-repo non-source files this file pulls in (candidate vectors). */
  dataRefs: string[]
  /** Paths this file vi.mock()s away — a mocked vector's bytes are never read. */
  mocked: string[]
}

export function parseModule(file: string, text: string): ModuleEdges {
  const specs = new Set<string>()
  for (const re of SPEC_PATTERNS) {
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) specs.add(m[1]!)
  }
  const mockedSpecs = new Set<string>()
  MOCK_PATTERN.lastIndex = 0
  let mm: RegExpExecArray | null
  while ((mm = MOCK_PATTERN.exec(text)) !== null) mockedSpecs.add(mm[1]!)

  const children: string[] = []
  const dataRefs: string[] = []
  for (const spec of specs) {
    if (mockedSpecs.has(spec)) continue
    const resolved = resolveSpecifier(file, spec)
    if (!resolved) continue
    if (SOURCE_EXT.has(path.extname(resolved))) children.push(resolved)
    else dataRefs.push(resolved)
  }
  const mocked: string[] = []
  for (const spec of mockedSpecs) {
    const resolved = resolveSpecifier(file, spec)
    if (resolved) mocked.push(resolved)
  }
  return { children, dataRefs, mocked }
}

// ── Loaders that compute their paths at run time ─────────────────────────────

/**
 * A vector can be loaded WITHOUT its filename appearing anywhere in source.
 * Each entry below replays the loader's own rule, cites the line it mirrors,
 * and names the executing module that does the reading. If that module is not
 * in the executing graph the entry is reported as stale and FAILS — a loader
 * declaration that has drifted would otherwise quietly grant reachability to
 * files nothing reads, which is the failure this whole gate is about.
 */
export type RuntimeLoader = {
  id: string
  /** The executing test/module(s) whose code this entry mirrors. */
  modules: string[]
  mechanism: 'readdir-sweep' | 'template-path' | 'manifest-driven' | 'composed-path'
  /** Cite, do not infer. */
  citation: string
  reason: string
  resolve: () => string[]
}

export const RUNTIME_LOADERS: RuntimeLoader[] = [
  {
    id: 'kmip-corpus-tier-sweep',
    modules: ['src/wasm/kmip/corpus/runner.local.test.ts'],
    mechanism: 'readdir-sweep',
    citation:
      'src/wasm/kmip/corpus/runner.local.test.ts:20 (CORPUS_ROOT), :101 (readdirSync over oasis/mandatory + oasis/optional), :158 (readdirSync over pqc)',
    reason:
      'the runner replays every transcript it finds on disk, so no transcript filename appears in any source file; a purely static scan would call all 144 orphans.',
    resolve: () => {
      const root = 'public/kmip-corpus'
      const out: string[] = []
      for (const dir of ['oasis/mandatory', 'oasis/optional', 'pqc']) {
        const full = abs(path.join(root, dir))
        if (!existsSync(full)) continue
        for (const name of readdirSync(full).sort()) {
          if (name.endsWith('.xml')) out.push(`${root}/${dir}/${name}`)
        }
      }
      return out
    },
  },
  {
    id: 'kat-anchor-fixture-template',
    modules: ['src/test/kat/anchor.test.ts'],
    mechanism: 'template-path',
    citation:
      'src/test/kat/anchor.test.ts:49 (loadFixture: readFileSync(join(FIXTURES_DIR, `${alg}.json`))), :58 sigAlgs, :127 kemAlgs',
    reason:
      'the fixture path is built from an algorithm id, so the fixture filenames never appear as literals; the algorithm lists are read back out of the test source here rather than duplicated, so the two cannot drift apart silently.',
    resolve: () => {
      const src = readFileSync(abs('src/test/kat/anchor.test.ts'), 'utf8')
      const algs = new Set<string>()
      const listRe = /\bconst\s+(?:sig|kem)Algs\s*=\s*\[([^\]]*)\]/g
      let m: RegExpExecArray | null
      while ((m = listRe.exec(src)) !== null) {
        for (const q of m[1]!.matchAll(/['"]([^'"]+)['"]/g)) algs.add(q[1]!)
      }
      return [...algs].sort().map((a) => `src/test/kat/fixtures/${a}.json`)
    },
  },
  {
    id: 'acvp-goldens-response-index',
    modules: [
      'src/services/acvp/pipeline.test.ts',
      'src/services/acvp/parser.test.ts',
      'src/services/acvp/acvp.engines.local.test.ts',
      'src/services/acvp-xplat/nativeRunner.local.test.ts',
    ],
    mechanism: 'manifest-driven',
    citation:
      "src/services/acvp/pipeline.test.ts:128-134 (readFileSync(path.join(repo, 'src/services/acvp/__fixtures__/goldens', golden.responseFile))), golden from goldens.json fixtures[name]",
    reason:
      'the response filename comes out of goldens.json at run time; nothing imports the .response.json files, so a static scan would call both of them orphans.',
    resolve: () => {
      const index = JSON.parse(
        readFileSync(abs('src/services/acvp/__fixtures__/goldens/goldens.json'), 'utf8')
      ) as { fixtures?: Record<string, { responseFile?: string }> }
      return Object.values(index.fixtures ?? {})
        .map((f) => f.responseFile)
        .filter((f): f is string => typeof f === 'string')
        .map((f) => `src/services/acvp/__fixtures__/goldens/${f}`)
        .sort()
    },
  },
  {
    id: 'acvp-nist-fixture-composer',
    modules: ['src/services/acvp/node/fixtures.ts'],
    mechanism: 'composed-path',
    citation:
      "src/services/acvp/node/fixtures.ts:7 (FIXTURE_ROOT), :9 (FIXTURE_NAMES), :12-22 (fixturePath/readFixture join root × name × 'prompt.json'|'expectedResults.json')",
    reason:
      'the pinned NIST ACVP-Server prompt/expectedResults paths are composed from a root, a fixture name and a file kind, so none of the four filenames is ever a literal; the names are read back out of the module source here so the two cannot drift apart silently.',
    resolve: () => {
      const src = readFileSync(abs('src/services/acvp/node/fixtures.ts'), 'utf8')
      const root = /FIXTURE_ROOT\s*=\s*['"]([^'"]+)['"]/.exec(src)?.[1]
      const namesBlock = /FIXTURE_NAMES\s*=\s*\[([^\]]*)\]/.exec(src)?.[1]
      if (!root || !namesBlock) return []
      const names = [...namesBlock.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]!)
      return names
        .flatMap((n) => ['prompt.json', 'expectedResults.json'].map((f) => `${root}/${n}/${f}`))
        .sort()
    },
  },
]

/**
 * Modules that READ from a vector root but do NOT execute cases. Their reads
 * must never count as reachability — a file whose only reader is one of these
 * is precisely the hsm eddsa case (held, verified, never executed).
 *
 * `kind` says WHY it does not count:
 *   provenance — hashes, schema-checks or diffs the bytes against a manifest.
 *   spec-table — reads a codepoint/heading table sidecar, not a test case.
 *   app-runtime — the shipped app loads it when a PERSON clicks; no automated
 *                 test drives it, so it grants no reachability to anything.
 *
 * Every module the graph walk finds reading a vector root must be either here
 * or in RUNTIME_LOADERS: an unclassified one is reported and FAILS, so a new
 * reader forces a decision instead of quietly changing the verdict.
 */
export const NON_EXECUTING_READERS: {
  module: string
  kind: 'provenance' | 'spec-table' | 'app-runtime'
  reason: string
}[] = [
  {
    module: 'src/utils/katEvidence.test.ts',
    kind: 'provenance',
    reason:
      'readdirSync over src/data/acvp to assert every file agrees with vector-manifest.json (provenance/evidence-class agreement). Reads the bytes; executes no case.',
  },
  {
    module: 'src/wasm/kmip/ttlv/codepointTable.ts',
    kind: 'spec-table',
    reason:
      'fetches /kmip-corpus/tags-enums.json — the KMIP codepoint table (a declared NON_VECTOR_SIDECAR), not a transcript.',
  },
  {
    module: 'src/wasm/kmip/ttlv/codepointPatches.local.test.ts',
    kind: 'spec-table',
    reason: 'reads tags-enums.json to check the codepoint patch set. No transcript is replayed.',
  },
  {
    module: 'src/wasm/kmip/ttlv/opTemplates.local.test.ts',
    kind: 'spec-table',
    reason: 'reads tags-enums.json to build operation templates. No transcript is replayed.',
  },
  {
    module: 'src/components/Playground/kmip/kmip3/learnLessons.local.test.ts',
    kind: 'spec-table',
    reason: 'reads tags-enums.json to validate lesson codepoints. No transcript is replayed.',
  },
  {
    module: 'src/wasm/kmip/section61CitationDrift.local.test.ts',
    kind: 'spec-table',
    reason:
      'reads section61-headings.json (a declared NON_VECTOR_SIDECAR) for citation-drift checking. No transcript is replayed.',
  },
  {
    module: 'scripts/ci/check-vector-reachability.ts',
    kind: 'provenance',
    reason:
      'THIS GATE. Its own source names vector paths as data (the allowlist, the sidecar exclusions, the non-vacuity sentinels) beside its own readFileSync calls, so without this entry it would credit itself with executing them. Reading a file to decide whether anything executes it is not executing it.',
  },
  {
    module: 'scripts/ci/check-vector-reachability.test.ts',
    kind: 'provenance',
    reason:
      "this gate's own non-vacuity proof: it names vector paths in assertions and imports the tables above. Same self-reference as the entry before it — asserting about a path is not executing the file.",
  },
  {
    module: 'src/components/Playground/kmip/useKmipCorpus.ts',
    kind: 'app-runtime',
    reason:
      'the KMIP dev-tab hook: fetches /kmip-corpus/manifest.json and then a transcript per test the VISITOR selects. Nothing automated drives it, so it cannot make a transcript reached — the automated replay is RUNTIME_LOADERS kmip-corpus-tier-sweep.',
  },
]

/**
 * ALLOWLIST — vector files deliberately executed by nothing.
 *
 * Keep it SMALL, give every entry a reason AND the decision behind it. An entry
 * that is actually reached, or that names a file that no longer exists, is
 * reported as stale and FAILS: a rotting allowlist is how a real orphan hides.
 */
export const ALLOWLIST: { file: string; reason: string }[] = [
  {
    file: 'src/data/pkcs11-profiles/fixtures/globalsign-root-ca-r1.der',
    // VERIFIED (2026-09-26): the only reference to this filename in the tree is
    // the comment at src/wasm/pkcs11ConformanceRunner/profileFixtures.ts:197.
    // The bytes ARE executed — CERT-M-1-32 §5.5 embeds them, and
    // profileFixtures.ts carries them as GLOBALSIGN_* hex constants derived
    // from this file and re-verified against fixtures/_provenance.json. The
    // .der is retained as the provenance object for that derivation.
    reason:
      'provenance object for the GLOBALSIGN_* hex constants in src/wasm/pkcs11ConformanceRunner/profileFixtures.ts:203-205 — the bytes execute as those inlined constants, not by loading this file',
  },
  {
    file: 'src/data/pkcs11-profiles/fixtures/globalsign-root-ca-r1.subject.der',
    reason:
      'provenance object for GLOBALSIGN_SUBJECT_ISSUER_DER_HEX (src/wasm/pkcs11ConformanceRunner/profileFixtures.ts:203) — derived from the root CA DER with python cryptography, executed as that inlined constant',
  },
]

// ── Declarations: the manifest and the test registry ─────────────────────────

export type Declarations = {
  /** vector-manifest.json files[]: path -> declared case count. */
  manifestCases: Map<string, number>
  /** The manifest's declared domain, so "not in the manifest" can be qualified. */
  vectorRoot: string
  /** vector file id -> number of cases testRegistry declares a test drives. */
  registeredCases: Map<string, number>
}

export function loadDeclarations(registry: { cases: { caseId: string }[] }[]): Declarations {
  const manifest = JSON.parse(
    readFileSync(abs('src/data/validation/vector-manifest.json'), 'utf8')
  ) as { vectorRoot: string; files: { id: string; path: string; cases: unknown[] }[] }
  const manifestCases = new Map<string, number>()
  const idToPath = new Map<string, string>()
  for (const f of manifest.files) {
    manifestCases.set(f.path, f.cases.length)
    idToPath.set(f.id, f.path)
  }
  const registeredCases = new Map<string, number>()
  for (const test of registry) {
    for (const c of test.cases) {
      const fileId = c.caseId.split('#')[0]!
      if (fileId.startsWith('local:')) continue
      const p = idToPath.get(fileId)
      if (!p) continue
      registeredCases.set(p, (registeredCases.get(p) ?? 0) + 1)
    }
  }
  return { manifestCases, vectorRoot: manifest.vectorRoot, registeredCases }
}

// ── The report ───────────────────────────────────────────────────────────────

export type Reach = { mechanism: string; via: string; tier: Tier }

export type VectorFacts = {
  file: string
  casesOnDisk: number
  casesBasis: string
  declaredCases: number | null
  registeredCases: number
  reached: Reach[]
  /** Executing tests that reference it but vi.mock() it away. */
  mockedOnlyBy: string[]
}

export type Report = {
  facts: Map<string, VectorFacts>
  orphans: { file: string; cases: number; reason: string }[]
  /** Reached, but only by the local tier — see the header note on scope. */
  localTierOnly: { file: string; cases: number; reason: string }[]
  /** The four states, each split where "not declared" has two very different
   *  meanings: missing from the manifest's OWN declared root (a real gap) vs
   *  living outside the domain the manifest ever claimed (a scope fact). */
  states: {
    inManifestExecuted: string[]
    inManifestNotExecuted: string[]
    /** Inside vector-manifest.json's vectorRoot but absent from files[]. */
    onDiskNotInManifestInRoot: string[]
    /** Outside the manifest's declared vectorRoot — no manifest entry is expected. */
    onDiskOutsideManifestDomain: string[]
    /** Executed, inside the manifest's root, but absent from files[]. */
    executedNotInManifest: string[]
    /** Executed and in the manifest, but testRegistry declares 0 cases for it. */
    executedNotInRegistry: string[]
  }
  /** Declared files holding more cases on disk than the manifest declares. */
  undeclaredCasesInDeclaredFile: { file: string; onDisk: number; declared: number }[]
  staleAllowlist: { file: string; reason: string }[]
  staleSidecars: { file: string; reason: string }[]
}

function reasonFor(f: VectorFacts, declarations: Declarations): string {
  const bits: string[] = []
  if (f.mockedOnlyBy.length > 0) {
    bits.push(
      `the only executing tests that reference it vi.mock() it away (${f.mockedOnlyBy.join(', ')}), so its bytes are never read`
    )
  } else {
    bits.push(
      'no executing test loads it: no static import, no dynamic import, and no declared RUNTIME_LOADER resolves it'
    )
  }
  if (f.declaredCases !== null) {
    bits.push(
      `vector-manifest.json declares ${f.declaredCases} case(s) for it, and testRegistry declares ${f.registeredCases} — a declaration is not an execution`
    )
  } else if (f.file.startsWith(`${declarations.vectorRoot}/`)) {
    bits.push('and it is not in vector-manifest.json either')
  }
  return bits.join('; ')
}

/** PURE. Given the universe, per-file facts and the allowlist, decide what is
 *  orphaned. Kept free of I/O so the accompanying test can prove it in both
 *  directions without shelling out to vitest. */
export function computeReport(
  universe: string[],
  facts: Map<string, VectorFacts>,
  declarations: Declarations,
  allowlist: { file: string; reason: string }[] = ALLOWLIST,
  sidecars: { file: string; expectedBasis: string; reason: string }[] = NON_VECTOR_SIDECARS,
  sidecarBasis: Map<string, string> = new Map()
): Report {
  const allowed = new Map(allowlist.map((a) => [a.file, a.reason]))
  const orphans: Report['orphans'] = []
  const localTierOnly: Report['localTierOnly'] = []
  const states: Report['states'] = {
    inManifestExecuted: [],
    inManifestNotExecuted: [],
    onDiskNotInManifestInRoot: [],
    onDiskOutsideManifestDomain: [],
    executedNotInManifest: [],
    executedNotInRegistry: [],
  }
  const undeclaredCasesInDeclaredFile: Report['undeclaredCasesInDeclaredFile'] = []

  for (const file of universe) {
    const f = facts.get(file) ?? {
      file,
      casesOnDisk: 0,
      casesBasis: 'unknown',
      declaredCases: declarations.manifestCases.get(file) ?? null,
      registeredCases: declarations.registeredCases.get(file) ?? 0,
      reached: [],
      mockedOnlyBy: [],
    }
    const isReached = f.reached.length > 0
    const inManifest = f.declaredCases !== null
    const inManifestDomain = file.startsWith(`${declarations.vectorRoot}/`)

    if (inManifest && isReached) states.inManifestExecuted.push(file)
    if (inManifest && !isReached) states.inManifestNotExecuted.push(file)
    if (!inManifest && inManifestDomain) states.onDiskNotInManifestInRoot.push(file)
    if (!inManifest && !inManifestDomain) states.onDiskOutsideManifestDomain.push(file)
    if (isReached && !inManifest && inManifestDomain) states.executedNotInManifest.push(file)
    if (isReached && inManifest && f.registeredCases === 0) states.executedNotInRegistry.push(file)

    if (inManifest && f.casesOnDisk > (f.declaredCases ?? 0)) {
      undeclaredCasesInDeclaredFile.push({
        file,
        onDisk: f.casesOnDisk,
        declared: f.declaredCases ?? 0,
      })
    }

    if (!isReached) {
      if (allowed.has(file)) continue
      orphans.push({ file, cases: f.casesOnDisk, reason: reasonFor(f, declarations) })
    } else if (f.reached.every((r) => r.tier === 'local')) {
      localTierOnly.push({
        file,
        cases: f.casesOnDisk,
        reason: `executed only by the local tier (${[...new Set(f.reached.map((r) => r.via))].join(', ')}); whether a gate runs that tier is scripts/ci/check-test-reachability.ts's question, not this gate's`,
      })
    }
  }

  const universeSet = new Set(universe)
  const staleAllowlist = allowlist
    .filter((a) => (facts.get(a.file)?.reached.length ?? 0) > 0 || !universeSet.has(a.file))
    .map((a) => ({
      file: a.file,
      reason: !universeSet.has(a.file)
        ? 'allowlisted vector file does not exist (or is git-ignored, or is excluded as a sidecar) — drop the entry'
        : `allowlisted but actually executed by: ${(facts.get(a.file)?.reached ?? []).map((r) => r.via).join(', ')} — drop the entry`,
    }))

  const staleSidecars = sidecars
    .filter(
      (s) =>
        !existsSync(abs(s.file)) ||
        (sidecarBasis.get(s.file) ?? s.expectedBasis) !== s.expectedBasis
    )
    .map((s) => ({
      file: s.file,
      reason: !existsSync(abs(s.file))
        ? 'sidecar exclusion names a file that does not exist — drop the entry'
        : `excluded as a non-vector sidecar on the basis that its shape is "${s.expectedBasis}", but it now reads as "${sidecarBasis.get(s.file)}" — re-judge it; it may belong in the universe`,
    }))

  return {
    facts,
    orphans,
    localTierOnly,
    states,
    undeclaredCasesInDeclaredFile,
    staleAllowlist,
    staleSidecars,
  }
}

// ── Non-vacuity ──────────────────────────────────────────────────────────────

/** Statically imported by src/utils/katRunner.ts, which executing tests import. */
const SENTINEL_STATIC = 'src/data/acvp/mlkem_test.json'
/** Only ever found by the corpus runner's readdirSync — proves the runtime-loader
 *  path is live, which a static-only tracer would silently get wrong. */
const SENTINEL_RUNTIME = 'public/kmip-corpus/oasis/mandatory/QS-M-1-30.xml'
/** Cannot exist, so nothing can load it. */
const SENTINEL_SYNTHETIC_ORPHAN = 'src/data/acvp/__reachability_probe__/synthetic-orphan_test.json'

/**
 * NON-VACUITY, asserted on every real run, as a hard failure.
 *
 * Direction 1: a vector file we KNOW is loaded must report reached — once via a
 *   static import, once via a runtime loader, so neither mechanism can quietly die.
 * Direction 2: a synthetic vector file nothing references must report orphaned.
 * Direction 3: no loader may resolve a file the universe globs missed (roots too narrow).
 * Direction 4: the traced module graph must be substantial and must contain a
 *   module we know is in it. A resolver that silently resolves nothing would
 *   otherwise report every vector as an orphan, or — worse, after someone
 *   "fixes" that by widening the allowlist — as reached.
 * Direction 5: no NON_EXECUTING_READER may also be a RUNTIME_LOADER; that confusion
 *   is exactly how a provenance read gets mistaken for an execution.
 */
export function assertNonVacuous(
  report: Report,
  universe: string[],
  declarations: Declarations,
  graph: { modules: Set<string>; loaderResolved: Map<string, string[]> }
): string[] {
  const problems: string[] = []

  for (const [sentinel, how] of [
    [SENTINEL_STATIC, 'static import'],
    [SENTINEL_RUNTIME, 'runtime loader'],
  ] as const) {
    if (!existsSync(abs(sentinel))) {
      problems.push(`non-vacuity sentinel is missing from the repo: ${sentinel}`)
      continue
    }
    if ((report.facts.get(sentinel)?.reached.length ?? 0) === 0) {
      problems.push(
        `non-vacuity FAILED (direction 1, ${how}): ${sentinel} must be reported reached but resolved to nothing — this tool's tracing is broken, not the repo.`
      )
    }
  }

  const probeFacts = new Map(report.facts)
  probeFacts.set(SENTINEL_SYNTHETIC_ORPHAN, {
    file: SENTINEL_SYNTHETIC_ORPHAN,
    casesOnDisk: 1,
    casesBasis: 'synthetic',
    declaredCases: null,
    registeredCases: 0,
    reached: [],
    mockedOnlyBy: [],
  })
  const probe = computeReport(
    [...universe, SENTINEL_SYNTHETIC_ORPHAN],
    probeFacts,
    declarations,
    ALLOWLIST
  )
  if (!probe.orphans.some((o) => o.file === SENTINEL_SYNTHETIC_ORPHAN)) {
    problems.push(
      `non-vacuity FAILED (direction 2): the synthetic unreferenced vector file ${SENTINEL_SYNTHETIC_ORPHAN} was not reported as an orphan.`
    )
  }

  const universeSet = new Set(universe)
  for (const [loaderId, files] of graph.loaderResolved) {
    if (files.length === 0) {
      problems.push(
        `non-vacuity FAILED (direction 3): RUNTIME_LOADER "${loaderId}" resolved 0 files — its replay of the loader's rule is broken or the loader is gone.`
      )
      continue
    }
    for (const f of files) {
      if (!universeSet.has(f)) {
        problems.push(
          `non-vacuity FAILED (direction 3): RUNTIME_LOADER "${loaderId}" loads ${f}, which the VECTOR_ROOTS globs did not find — the roots are too narrow.`
        )
      }
    }
  }

  if (graph.modules.size < 500) {
    problems.push(
      `non-vacuity FAILED (direction 4): the traced module graph has only ${graph.modules.size} modules — the specifier resolver is resolving nothing, so every "reached"/"orphan" verdict is worthless.`
    )
  }
  for (const known of [
    'src/utils/katRunner.ts',
    'src/components/Playground/hsm/acvp/useAcvpSuite.ts',
  ]) {
    if (!graph.modules.has(known)) {
      problems.push(
        `non-vacuity FAILED (direction 4): ${known} is not in the traced module graph, but executing tests import it — the graph walk is broken.`
      )
    }
  }

  const loaderModules = new Set(RUNTIME_LOADERS.flatMap((l) => l.modules))
  for (const reader of NON_EXECUTING_READERS) {
    if (loaderModules.has(reader.module)) {
      problems.push(
        `non-vacuity FAILED (direction 5): ${reader.module} is declared both a NON_EXECUTING_READER and a RUNTIME_LOADER — a provenance read must never count as an execution.`
      )
    }
  }

  return problems
}

// ── Main ─────────────────────────────────────────────────────────────────────

type Graph = {
  modules: Set<string>
  loaderResolved: Map<string, string[]>
  staleLoaders: { id: string; reason: string }[]
  unclassifiedReaders: { module: string; reason: string }[]
}

const READ_CALL = /\breaddirSync\b|\breadFileSync\b|\bfetch\s*\(|\bglob\s*\(/

/**
 * Comments out, then string literals only. A filename in a comment is what the
 * hsm eddsa miss was made of, so it must not be able to look like a read.
 */
export function stringLiterals(text: string): string[] {
  const code = text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, (_m, p1: string) => p1)
  const out: string[] = []
  for (const m of code.matchAll(/['"`]([^'"`\n]+)['"`]/g)) out.push(m[1]!)
  return out
}

function buildFacts(
  universe: string[],
  declarations: Declarations,
  testsByTier: Map<Tier, string[]>
): { facts: Map<string, VectorFacts>; graph: Graph } {
  const vectorSet = new Set(universe)
  const facts = new Map<string, VectorFacts>()
  for (const file of universe) {
    const { count, basis } = countCases(file, readFileSync(abs(file), 'utf8'))
    facts.set(file, {
      file,
      casesOnDisk: basis === 'none' ? 1 : count,
      casesBasis: basis === 'none' ? 'opaque-fixture' : basis,
      declaredCases: declarations.manifestCases.get(file) ?? null,
      registeredCases: declarations.registeredCases.get(file) ?? 0,
      reached: [],
      mockedOnlyBy: [],
    })
  }

  const edges = new Map<string, ModuleEdges>()
  const edgesOf = (file: string): ModuleEdges => {
    let e = edges.get(file)
    if (!e) {
      let text = ''
      try {
        text = readFileSync(abs(file), 'utf8')
      } catch {
        text = ''
      }
      e = parseModule(file, text)
      edges.set(file, e)
    }
    return e
  }

  // Literal-path reads, per module: `readFileSync(path.join(DATA, 'x_test.json'))`
  // is invisible to an import graph. Comments are stripped first.
  const byPath = new Map<string, string>(universe.map((f) => [f, f]))
  const byBasename = new Map<string, string[]>()
  for (const f of universe) {
    const b = path.posix.basename(f)
    byBasename.set(b, [...(byBasename.get(b) ?? []), f])
  }
  const nonExecutingReaders = new Set(NON_EXECUTING_READERS.map((r) => r.module))
  const literalRefs = new Map<string, string[]>()
  const literalRefsOf = (file: string): string[] => {
    let r = literalRefs.get(file)
    if (r) return r
    if (nonExecutingReaders.has(file)) {
      literalRefs.set(file, [])
      return []
    }
    const text = readFileSafe(file)
    if (!READ_CALL.test(text)) {
      literalRefs.set(file, [])
      return []
    }
    const hits = new Set<string>()
    const literals = stringLiterals(text)
    for (const lit of literals) {
      const normalised = lit.replace(/^\.\//, '').split('?')[0]!
      const exact = byPath.get(normalised)
      if (exact) {
        hits.add(exact)
        continue
      }
      const candidates = byBasename.get(path.posix.basename(normalised))
      if (!candidates) continue
      if (candidates.length === 1) hits.add(candidates[0]!)
      else {
        // Ambiguous basename: require the file's own directory to appear too.
        for (const c of candidates) {
          if (literals.some((l) => l.includes(path.posix.dirname(c).split('/').pop()!))) hits.add(c)
        }
      }
    }
    r = [...hits].sort()
    literalRefs.set(file, r)
    return r
  }

  const allModules = new Set<string>()
  const mockedBy = new Map<string, Set<string>>()

  for (const [tier, roots] of testsByTier) {
    for (const root of roots) {
      // BFS the closure of this one test file, then subtract what it mocks.
      const seen = new Set<string>([root])
      const queue = [root]
      const refs = new Set<string>()
      const literal = new Set<string>()
      const mocked = new Set<string>()
      while (queue.length > 0) {
        const cur = queue.pop()!
        allModules.add(cur)
        const e = edgesOf(cur)
        const counts = !nonExecutingReaders.has(cur)
        for (const d of e.dataRefs) if (counts && vectorSet.has(d)) refs.add(d)
        for (const m of e.mocked) if (vectorSet.has(m)) mocked.add(m)
        for (const l of literalRefsOf(cur)) literal.add(l)
        for (const c of e.children) {
          if (seen.has(c)) continue
          seen.add(c)
          queue.push(c)
        }
      }
      for (const m of mocked) {
        if (refs.has(m) && !literal.has(m)) {
          refs.delete(m)
          const s = mockedBy.get(m) ?? new Set<string>()
          s.add(root)
          mockedBy.set(m, s)
        }
      }
      for (const r of refs) {
        facts.get(r)!.reached.push({ mechanism: 'module-graph import', via: root, tier })
      }
      for (const l of literal) {
        if (refs.has(l)) continue
        facts.get(l)!.reached.push({ mechanism: 'literal-path read', via: root, tier })
      }
    }
  }

  // Runtime loaders.
  const loaderResolved = new Map<string, string[]>()
  const staleLoaders: { id: string; reason: string }[] = []
  for (const loader of RUNTIME_LOADERS) {
    const tiers = new Map<string, Tier>()
    const missing: string[] = []
    for (const mod of loader.modules) {
      if (testsByTier.get('ci')?.includes(mod)) tiers.set(mod, 'ci')
      else if (testsByTier.get('local')?.includes(mod)) tiers.set(mod, 'local')
      // A non-test module (e.g. a shared node-side loader) counts at the tier of
      // whatever imports it; the graph proves it is imported, so credit 'ci' —
      // the stricter of the two for everything this gate then concludes.
      else if (allModules.has(mod)) tiers.set(mod, 'ci')
      else missing.push(mod)
    }
    if (missing.length > 0) {
      staleLoaders.push({
        id: loader.id,
        reason: `declares module(s) ${missing.join(', ')}, which are not in the executing test set or module graph — re-read ${loader.citation} or drop them from the entry`,
      })
    }
    if (tiers.size === 0) continue
    const resolved = loader.resolve()
    loaderResolved.set(loader.id, resolved)
    for (const f of resolved) {
      for (const [mod, tier] of tiers) {
        facts
          .get(f)
          ?.reached.push({ mechanism: `${loader.mechanism} (${loader.id})`, via: mod, tier })
      }
    }
  }

  for (const [file, roots] of mockedBy) {
    const f = facts.get(file)
    if (f && f.reached.length === 0) f.mockedOnlyBy = [...roots].sort()
  }

  // Any executing module that reads a vector root but is neither a declared
  // loader nor a declared provenance sweep: force a decision rather than let it
  // silently create false orphans (or, worse, false reach).
  const declaredReaders = new Set([
    ...RUNTIME_LOADERS.flatMap((l) => l.modules),
    ...NON_EXECUTING_READERS.map((s) => s.module),
  ])
  const rootPrefixes = [
    ...new Set(
      VECTOR_ROOTS.flatMap((r) => r.patterns.map((p) => p.split('*')[0]!.replace(/\/$/, '')))
    ),
  ]
  const unclassifiedReaders: { module: string; reason: string }[] = []
  for (const mod of allModules) {
    if (declaredReaders.has(mod)) continue
    const text = readFileSafe(mod)
    if (!READ_CALL.test(text)) continue
    // A module whose reads DO land on named universe files is already accounted
    // for by the literal-path mechanism. Only an unexplained root read is a gap.
    if (literalRefsOf(mod).length > 0) continue
    if ((edgesOf(mod).dataRefs ?? []).some((d) => vectorSet.has(d))) continue
    const literals = stringLiterals(text)
    const hit = rootPrefixes.find((p) =>
      literals.some((l) => l.includes(p) || l.includes(p.replace(/^public\//, '/')))
    )
    if (!hit) continue
    unclassifiedReaders.push({
      module: mod,
      reason: `reads from vector root "${hit}" at run time, resolves to no named vector file, and is declared neither a RUNTIME_LOADER nor a NON_EXECUTING_READER — decide which it is, or this gate is guessing about the files it touches`,
    })
  }

  return {
    facts,
    graph: { modules: allModules, loaderResolved, staleLoaders, unclassifiedReaders },
  }
}

function readFileSafe(file: string): string {
  try {
    return readFileSync(abs(file), 'utf8')
  } catch {
    return ''
  }
}

async function main(): Promise<void> {
  const asJson = process.argv.includes('--json')
  const universe = await enumerateVectorUniverse()

  const sidecarBasis = new Map<string, string>()
  for (const s of NON_VECTOR_SIDECARS) {
    if (!existsSync(abs(s.file))) continue
    sidecarBasis.set(s.file, countCases(s.file, readFileSync(abs(s.file), 'utf8')).basis)
  }

  const { TEST_REGISTRY } = (await import('../../src/data/validation/testRegistry')) as {
    TEST_REGISTRY: { cases: { caseId: string }[] }[]
  }
  const declarations = loadDeclarations(TEST_REGISTRY)

  const testsByTier = new Map<Tier, string[]>()
  for (const t of VITEST_TIERS) {
    if (!asJson) process.stderr.write(`asking vitest for the ${t.tier} tier …\n`)
    testsByTier.set(t.tier, listTestFiles(t.config))
  }

  const { facts, graph } = buildFacts(universe, declarations, testsByTier)
  const report = computeReport(
    universe,
    facts,
    declarations,
    ALLOWLIST,
    NON_VECTOR_SIDECARS,
    sidecarBasis
  )
  const problems = assertNonVacuous(report, universe, declarations, graph)

  const casesIn = (files: string[]): number =>
    files.reduce((n, f) => n + (facts.get(f)?.casesOnDisk ?? 0), 0)

  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        {
          universeCount: universe.length,
          casesOnDisk: casesIn(universe),
          modulesTraced: graph.modules.size,
          testsByTier: Object.fromEntries([...testsByTier].map(([k, v]) => [k, v.length])),
          states: Object.fromEntries(
            Object.entries(report.states).map(([k, v]) => [
              k,
              { files: v.length, cases: casesIn(v) },
            ])
          ),
          orphans: report.orphans,
          localTierOnly: report.localTierOnly,
          undeclaredCasesInDeclaredFile: report.undeclaredCasesInDeclaredFile,
          staleAllowlist: report.staleAllowlist,
          staleSidecars: report.staleSidecars,
          staleLoaders: graph.staleLoaders,
          unclassifiedReaders: graph.unclassifiedReaders,
          nonVacuityProblems: problems,
        },
        null,
        2
      )}\n`
    )
  } else {
    console.log('\n=== Vector reachability ===')
    console.log(
      `vector files on disk: ${universe.length} (${casesIn(universe)} cases), across ${VECTOR_ROOTS.length} declared roots`
    )
    console.log(
      `executing test files: ci=${testsByTier.get('ci')?.length}, local=${testsByTier.get('local')?.length}`
    )
    console.log(`modules traced from those test files: ${graph.modules.size}`)
    for (const l of RUNTIME_LOADERS) {
      console.log(
        `  runtime loader ${l.id}: ${graph.loaderResolved.get(l.id)?.length ?? 'STALE'} files (${l.modules.join(', ')})`
      )
    }
    console.log(`\n-- four states (manifest domain: ${declarations.vectorRoot}) --`)
    const S = report.states
    console.log(
      `  (a) in manifest AND executed          : ${S.inManifestExecuted.length} files, ${casesIn(S.inManifestExecuted)} cases`
    )
    console.log(
      `  (b) in manifest, NOT executed         : ${S.inManifestNotExecuted.length} files, ${casesIn(S.inManifestNotExecuted)} cases  <-- blind spot`
    )
    console.log(
      `  (c1) in the manifest's root, absent from it : ${S.onDiskNotInManifestInRoot.length} files, ${casesIn(S.onDiskNotInManifestInRoot)} cases  <-- blind spot`
    )
    console.log(
      `  (c2) on disk, outside the manifest's domain : ${S.onDiskOutsideManifestDomain.length} files, ${casesIn(S.onDiskOutsideManifestDomain)} cases  (scope, not drift)`
    )
    console.log(
      `  (d1) executed, absent from the manifest     : ${S.executedNotInManifest.length} files, ${casesIn(S.executedNotInManifest)} cases`
    )
    console.log(
      `  (d2) executed, in manifest, 0 registry cases: ${S.executedNotInRegistry.length} files, ${casesIn(S.executedNotInRegistry)} cases`
    )
    console.log(
      `\nORPHANS: ${report.orphans.length} files, ${report.orphans.reduce((n, o) => n + o.cases, 0)} cases`
    )
    for (const o of report.orphans)
      console.log(`  ✗ ${o.file}  (${o.cases} cases)\n      ${o.reason}`)
    console.log(`allowlisted (deliberately unexecuted): ${ALLOWLIST.length}`)
    if (report.localTierOnly.length > 0) {
      console.log(
        `\nWARNING — executed only by the local tier: ${report.localTierOnly.length} files, ${report.localTierOnly.reduce((n, o) => n + o.cases, 0)} cases`
      )
      for (const w of report.localTierOnly) console.log(`  ~ ${w.file}  (${w.cases} cases)`)
    }
    if (report.undeclaredCasesInDeclaredFile.length > 0) {
      console.log(`\nWARNING — cases on disk that the manifest does not declare:`)
      for (const u of report.undeclaredCasesInDeclaredFile)
        console.log(
          `  ~ ${u.file}: ${u.onDisk} on disk, ${u.declared} declared (${u.onDisk - u.declared} undeclared)`
        )
    }
    for (const s of report.staleAllowlist)
      console.log(`  ! stale allowlist: ${s.file}\n      ${s.reason}`)
    for (const s of report.staleSidecars)
      console.log(`  ! stale sidecar exclusion: ${s.file}\n      ${s.reason}`)
    for (const s of graph.staleLoaders)
      console.log(`  ! stale runtime loader: ${s.id}\n      ${s.reason}`)
    for (const u of graph.unclassifiedReaders)
      console.log(`  ! unclassified vector reader: ${u.module}\n      ${u.reason}`)
    for (const p of problems) console.log(`  !! ${p}`)
  }

  if (
    problems.length > 0 ||
    report.orphans.length > 0 ||
    report.staleAllowlist.length > 0 ||
    report.staleSidecars.length > 0 ||
    graph.staleLoaders.length > 0 ||
    graph.unclassifiedReaders.length > 0
  ) {
    process.exitCode = 1
  }
}

// `import.meta.main` is not available under tsx/node 22 for this entry shape;
// compare the resolved entry path instead so importing this module from a test
// never kicks off a multi-minute vitest sweep.
const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) ===
    path.resolve(import.meta.dirname, 'check-vector-reachability.ts')
if (invokedDirectly) {
  await main()
}
