// SPDX-License-Identifier: GPL-3.0-only
/**
 * W1 — parity of the WASM SP 800-90B tool against the native reference build.
 *
 *   npx tsx scripts/entropy-90b/parity.ts --data <dir> --out <dir> [--runs 5]
 *        [--only id1,id2] [--skip-iid-random] [--real <dir>]
 *
 * Needs the native images from Dockerfile.native tagged ea-native:amd64 and
 * ea-native:arm64 (OrbStack/Docker), and the staged public/wasm/entropy90b.
 *
 * Checks per dataset:
 *  - non-IID (ea_non_iid -v -v): WASM vs native amd64 vs native arm64. Every
 *    numeric field of every JSON test case must be the same double, the error
 *    level/message must match, and the full verbose stdout (which prints each
 *    estimator's intermediate values with %.17g) is compared line by line.
 *  - IID (ea_iid -v -v): the permutation test seeds xoshiro256** from
 *    /dev/urandom on every run (utils.h seed()), so it is NOT deterministic.
 *      (a) seeded: /dev/urandom replaced by a fixed 32-byte file (native: bind
 *          mount + OMP_NUM_THREADS=1; WASM: MEMFS file). Must match exactly,
 *          including every permutation counter.
 *      (b) as shipped: N runs each, native with all OpenMP threads; the
 *          verdicts must agree across all runs and platforms, and the
 *          deterministic fields (H_original, H_bitstring, chi-square, LRS)
 *          must match exactly.
 *  - restart (ea_restart -v -v): same (a)/(b) split — its X_cutoff comes from
 *    a Monte-Carlo simulation seeded from /dev/urandom.
 */
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  runEstimator,
  type EaModuleFactory,
  type EstimatorTool,
} from '../../src/wasm/entropy90b/runner.ts'
import {
  D4_DATASETS,
  KAT_FIXTURE,
  KAT_IID_FIXTURE,
} from '../../src/wasm/entropy90b/syntheticDatasets.ts'

const ROOT = resolve(import.meta.dirname, '../..')
const WASM_DIR = join(ROOT, 'public/wasm/entropy90b')
/**
 * Native references: upstream-flag builds on both arches, plus the diagnostic
 * "strict" builds (-ffp-contract=off, no -march=native) from Dockerfile.native.
 */
const ARCHES = ['amd64', 'arm64', 'amd64-strict', 'arm64-strict'] as const
type Arch = (typeof ARCHES)[number]
type Platform = 'wasm' | `native-${Arch}`

// ---- args -----------------------------------------------------------------
const argv = process.argv.slice(2)
const arg = (k: string, d?: string) => {
  const i = argv.indexOf(k)
  return i >= 0 ? argv[i + 1] : d
}
const DATA = resolve(arg('--data')!)
const OUT = resolve(arg('--out')!)
const RUNS = Number(arg('--runs', '5'))
const ONLY = arg('--only')?.split(',')
const SKIP_IID_RANDOM = argv.includes('--skip-iid-random')
const IID_ON = arg('--iid-on')?.split(',')
mkdirSync(join(OUT, 'raw'), { recursive: true })

/** Fixed parity seed for /dev/urandom (32 bytes = 4 x uint64 xoshiro state). */
const SEED = createHash('sha256').update('pqctoday-90b-parity-seed-v1').digest()
const SEED_FILE = join(OUT, 'parity-urandom-seed.bin')
writeFileSync(SEED_FILE, SEED)

// ---- dataset list -----------------------------------------------------------
interface Job {
  id: string
  file: string
  bits: number
  kind: 'sequential' | 'restart'
  iid: boolean
  pairedSequentialId?: string
  source: 'synthetic-d4' | 'kat' | 'real'
}
const jobs: Job[] = D4_DATASETS.map((d) => ({
  id: d.id,
  file: join(DATA, `${d.id}.bin`),
  bits: d.bitsPerSymbol,
  kind: d.kind,
  iid: IID_ON
    ? IID_ON.includes(d.id)
    : d.intendedTrack === 'iid' || d.id.includes('sha256') || d.id.includes('stuck'),
  pairedSequentialId: d.pairedSequentialId,
  source: 'synthetic-d4' as const,
}))
jobs.unshift({
  id: KAT_IID_FIXTURE.id,
  file: join(DATA, `${KAT_IID_FIXTURE.id}.bin`),
  bits: KAT_IID_FIXTURE.bitsPerSymbol,
  kind: 'sequential',
  iid: true,
  source: 'kat',
})
jobs.unshift({
  id: KAT_FIXTURE.id,
  file: join(DATA, `${KAT_FIXTURE.id}.bin`),
  bits: KAT_FIXTURE.bitsPerSymbol,
  kind: 'sequential',
  iid: true,
  source: 'kat',
})
const realDir = arg('--real')
if (realDir && existsSync(realDir)) {
  // Real datasets (convert-jent-raw.ts output): <name>.bin + <name>.json sidecar.
  const real: Job[] = []
  for (const f of readdirSync(realDir).filter((x) => x.endsWith('.bin'))) {
    const meta = join(realDir, f.replace(/\.bin$/, '.json'))
    if (!existsSync(meta)) continue
    const m = JSON.parse(readFileSync(meta, 'utf8')) as {
      bitsPerSymbol?: number
      kind?: string
      pairedSequentialId?: string
    }
    if (!m.bitsPerSymbol) continue
    real.push({
      id: `real-${f.replace(/\.bin$/, '')}`,
      file: join(realDir, f),
      bits: m.bitsPerSymbol,
      kind: m.kind === 'restart' ? 'restart' : 'sequential',
      iid: false,
      pairedSequentialId: m.pairedSequentialId,
      source: 'real',
    })
  }
  // Sequential first: each restart run needs H_I from its paired sequential run.
  real.sort((a, b) =>
    a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === 'sequential' ? -1 : 1
  )
  jobs.push(...real)
}
const selected = ONLY ? jobs.filter((j) => ONLY.includes(j.id)) : jobs

// ---- runners ----------------------------------------------------------------
interface RunOut {
  platform: Platform
  exitCode: number
  json: Record<string, unknown> | null
  stdout: string[]
  ms: number
}

const factories = new Map<EstimatorTool, EaModuleFactory>()
async function factory(tool: EstimatorTool): Promise<EaModuleFactory> {
  if (!factories.has(tool)) {
    const mod = (await import(pathToFileURL(join(WASM_DIR, `ea_${tool}.mjs`)).href)) as {
      default: EaModuleFactory
    }
    factories.set(tool, mod.default)
  }
  return factories.get(tool)!
}

async function runWasm(
  tool: EstimatorTool,
  job: Job,
  opts: { seeded: boolean; hI?: number }
): Promise<RunOut> {
  const r = await runEstimator(await factory(tool), {
    tool,
    data: readFileSync(job.file),
    bitsPerSymbol: job.bits,
    hI: opts.hI,
    deterministicUrandom: opts.seeded ? SEED : undefined,
  })
  return {
    platform: 'wasm',
    exitCode: r.exitCode,
    json: r.json as Record<string, unknown> | null,
    stdout: r.stdout,
    ms: r.elapsedMs,
  }
}

function runNative(
  arch: Arch,
  tool: EstimatorTool,
  job: Job,
  opts: { seeded: boolean; hI?: number; tag: string }
): Promise<RunOut> {
  const outName = `${job.id}.${tool}.${arch}.${opts.tag}.json`
  const args = [
    'run',
    '--rm',
    '--platform',
    `linux/${arch.replace('-strict', '')}`,
    '-v',
    `${job.file}:/work/input.bin:ro`,
    '-v',
    `${join(OUT, 'raw')}:/out`,
  ]
  if (opts.seeded) args.push('-v', `${SEED_FILE}:/dev/urandom:ro`, '-e', 'OMP_NUM_THREADS=1')
  const cli = ['-v', '-v', '-o', `/out/${outName}`, '/work/input.bin', String(job.bits)]
  if (tool === 'restart') cli.push(String(opts.hI))
  const bin = arch.endsWith('-strict') ? `/usr/local/bin/strict/ea_${tool}` : `ea_${tool}`
  args.push(`ea-native:${arch.replace('-strict', '')}`, bin, ...cli)
  const t0 = Date.now()
  return new Promise((res, rej) => {
    const p = spawn('docker', args, { stdio: ['ignore', 'pipe', 'pipe'] })
    let so = ''
    p.stdout.on('data', (d) => (so += d))
    p.stderr.on('data', () => {})
    p.on('error', rej)
    p.on('close', (code) => {
      const jp = join(OUT, 'raw', outName)
      res({
        platform: `native-${arch}`,
        // docker returns the container's exit status; exit(-1) arrives as 255
        exitCode: code === 255 ? -1 : (code ?? -999),
        json: existsSync(jp)
          ? (JSON.parse(readFileSync(jp, 'utf8')) as Record<string, unknown>)
          : null,
        stdout: so.split('\n').filter((l) => l.length > 0),
        ms: Date.now() - t0,
      })
    })
  })
}

// ---- comparison ---------------------------------------------------------------
const VOLATILE = new Set(['dateTimeStamp', 'commandline'])

/** Flatten JSON to path -> leaf value, dropping volatile keys. */
function flatten(v: unknown, p = '', out: Record<string, unknown> = {}): Record<string, unknown> {
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (!p && VOLATILE.has(k)) continue
      flatten(x, p ? `${p}.${k}` : k, out)
    }
  } else out[p] = v
  return out
}

function label(json: Record<string, unknown> | null, path: string): string {
  // testCases.3.hOriginal -> "Compression Test ... / hOriginal"
  const m = /^testCases\.(\d+)\.(.+)$/.exec(path)
  if (!m || !json) return path
  const tc = (json.testCases as Array<Record<string, unknown>>)[Number(m[1])]
  return `${String(tc?.testCaseDesc ?? m[1])} / ${m[2]}`
}

interface Diff {
  field: string
  a: unknown
  b: unknown
}
function diffJson(a: RunOut, b: RunOut, ignore?: (p: string) => boolean): Diff[] {
  const fa = flatten(a.json)
  const fb = flatten(b.json)
  const keys = new Set([...Object.keys(fa), ...Object.keys(fb)])
  const d: Diff[] = []
  for (const k of keys) {
    if (ignore?.(k)) continue
    if (!Object.is(fa[k], fb[k])) d.push({ field: label(a.json, k), a: fa[k], b: fb[k] })
  }
  if (a.exitCode !== b.exitCode) d.push({ field: 'exitCode', a: a.exitCode, b: b.exitCode })
  return d
}

const STDOUT_VOLATILE = /^(Opening file|.*commandline)/
function diffStdout(a: RunOut, b: RunOut): { identical: boolean; firstDiff?: [string, string] } {
  const keep = (l: string) => l.trim().length > 0 && !STDOUT_VOLATILE.test(l)
  const la = a.stdout.filter(keep)
  const lb = b.stdout.filter(keep)
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i])
      return { identical: false, firstDiff: [la[i] ?? '<eof>', lb[i] ?? '<eof>'] }
  }
  return { identical: true }
}

function testCaseValues(
  json: Record<string, unknown> | null
): Record<string, number | boolean | string> {
  const out: Record<string, number | boolean | string> = {}
  if (!json) return out
  if (json.errorLevel !== 0) out.error = String(json.errorMessage ?? json.errorLevel)
  for (const tc of (json.testCases as Array<Record<string, unknown>>) ?? []) {
    for (const [k, v] of Object.entries(tc)) {
      if (k === 'testCaseDesc' || typeof v === 'object') continue
      out[`${tc.testCaseDesc} / ${k}`] = v as number | boolean
    }
  }
  return out
}

// ---- main ---------------------------------------------------------------------
const report: Record<string, unknown>[] = []
const save = () =>
  writeFileSync(
    join(OUT, 'parity-results.json'),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        wasmBuildInfo: JSON.parse(readFileSync(join(WASM_DIR, 'BUILDINFO.json'), 'utf8')),
        node: process.version,
        runsPerRandomisedCheck: RUNS,
        parityUrandomSeedSha256: createHash('sha256').update(SEED).digest('hex'),
        results: report,
      },
      null,
      2
    ) + '\n'
  )

const hIFor = new Map<string, number>()

for (const job of selected) {
  if (!existsSync(job.file)) {
    console.log(`skip ${job.id}: missing ${job.file}`)
    continue
  }
  const sha = createHash('sha256').update(readFileSync(job.file)).digest('hex')
  const entry: Record<string, unknown> = {
    id: job.id,
    source: job.source,
    bits: job.bits,
    sha256: sha,
  }
  report.push(entry)

  if (job.kind === 'sequential') {
    // non-IID — deterministic
    console.log(`[${job.id}] non-IID ...`)
    const [w, ...natives] = await Promise.all([
      runWasm('non_iid', job, { seeded: false }),
      ...ARCHES.map((a) => runNative(a, 'non_iid', job, { seeded: false, tag: 'nonid' })),
    ])
    const hA = (w.json?.testCases as Array<Record<string, unknown>> | undefined)?.find(
      (t) => t.testCaseDesc === 'Overall'
    )?.hAssessed
    if (typeof hA === 'number') hIFor.set(job.id, hA)
    entry.nonIid = {
      wasm: testCaseValues(w.json),
      wasmMs: Math.round(w.ms),
      wasmExit: w.exitCode,
      native: Object.fromEntries(
        natives.map((n) => [
          n.platform,
          { diffsVsWasm: diffJson(w, n), stdoutVsWasm: diffStdout(w, n), ms: n.ms },
        ])
      ),
      nativeAmd64VsArm64: diffJson(natives[0], natives[1]),
      nativeArm64VsArm64Strict: diffJson(natives[1], natives[3]),
    }
    console.log(
      `   wasm ${Math.round(w.ms)}ms; json diffs vs ${natives.map((n) => `${n.platform}=${diffJson(w, n).length}`).join(' ')}`
    )
    save()

    if (job.iid) {
      console.log(`[${job.id}] IID seeded ...`)
      const [ws, ...ns] = await Promise.all([
        runWasm('iid', job, { seeded: true }),
        ...ARCHES.map((a) => runNative(a, 'iid', job, { seeded: true, tag: 'seeded' })),
      ])
      entry.iidSeeded = {
        wasm: testCaseValues(ws.json),
        wasmMs: Math.round(ws.ms),
        native: Object.fromEntries(
          ns.map((n) => [
            n.platform,
            { diffsVsWasm: diffJson(ws, n), stdoutVsWasm: diffStdout(ws, n), ms: n.ms },
          ])
        ),
      }
      console.log(
        `   json diffs vs ${ns.map((n) => `${n.platform}=${diffJson(ws, n).length}`).join(' ')}`
      )
      save()

      if (!SKIP_IID_RANDOM) {
        console.log(`[${job.id}] IID x${RUNS} unseeded ...`)
        const runs: RunOut[] = []
        for (let i = 0; i < RUNS; i++) {
          runs.push(
            ...(await Promise.all([
              runWasm('iid', job, { seeded: false }),
              ...ARCHES.map((a) => runNative(a, 'iid', job, { seeded: false, tag: `run${i}` })),
            ]))
          )
        }
        const verdict = (r: RunOut) => {
          const tc = (r.json?.testCases as Array<Record<string, unknown>> | undefined)?.[0]
          return tc
            ? `chi2=${tc.passedChiSquareTests} lrs=${tc.passedLongestRepeatedSubstringTest} perm=${tc.passedIidPermutationTests}`
            : `error:${String(r.json?.errorMessage ?? r.exitCode)}`
        }
        const verdicts = runs.map((r) => ({
          platform: r.platform,
          verdict: verdict(r),
          ms: Math.round(r.ms),
        }))
        const distinct = [...new Set(verdicts.map((v) => v.verdict))]
        // deterministic part: everything except the permutation counters
        const detDiffs = runs
          .slice(1)
          .flatMap((r) => diffJson(runs[0], r, (p) => /permutation|testResults/i.test(p)))
        entry.iidUnseeded = {
          verdicts,
          distinctVerdicts: distinct,
          deterministicFieldDiffs: detDiffs,
        }
        console.log(`   verdicts: ${distinct.join(' | ')}; det diffs ${detDiffs.length}`)
        save()
      }
    }
  } else {
    const hI = job.pairedSequentialId ? hIFor.get(job.pairedSequentialId) : undefined
    if (hI === undefined) {
      entry.restart = { skipped: 'no H_I (run the paired sequential dataset first)' }
      save()
      continue
    }
    entry.hI = hI
    console.log(`[${job.id}] restart seeded (H_I=${hI}) ...`)
    const [ws, ...ns] = await Promise.all([
      runWasm('restart', job, { seeded: true, hI }),
      ...ARCHES.map((a) => runNative(a, 'restart', job, { seeded: true, hI, tag: 'seeded' })),
    ])
    entry.restartSeeded = {
      wasm: testCaseValues(ws.json),
      wasmMs: Math.round(ws.ms),
      native: Object.fromEntries(
        ns.map((n) => [
          n.platform,
          { diffsVsWasm: diffJson(ws, n), stdoutVsWasm: diffStdout(ws, n), ms: n.ms },
        ])
      ),
    }
    console.log(
      `   json diffs vs ${ns.map((n) => `${n.platform}=${diffJson(ws, n).length}`).join(' ')}`
    )
    save()
    if (!SKIP_IID_RANDOM && job.source !== 'real') {
      console.log(`[${job.id}] restart x${RUNS} unseeded ...`)
      const runs: RunOut[] = []
      for (let i = 0; i < RUNS; i++) {
        runs.push(
          ...(await Promise.all([
            runWasm('restart', job, { seeded: false, hI }),
            ...ARCHES.map((a) =>
              runNative(a, 'restart', job, { seeded: false, hI, tag: `run${i}` })
            ),
          ]))
        )
      }
      const grab = (r: RunOut, re: RegExp) =>
        r.stdout.map((l) => re.exec(l)?.[1]).find(Boolean) ?? null
      const verdicts = runs.map((r) => ({
        platform: r.platform,
        exitCode: r.exitCode,
        xCutoff: grab(r, /X_cutoff: (\d+)/),
        xMax: grab(r, /^X_max: (\d+)/),
        verdict: r.json?.errorLevel === 0 ? 'passed' : `failed: ${String(r.json?.errorMessage)}`,
        ms: Math.round(r.ms),
      }))
      const detDiffs = runs.slice(1).flatMap((r) => diffJson(runs[0], r))
      entry.restartUnseeded = {
        verdicts,
        distinctVerdicts: [...new Set(verdicts.map((v) => v.verdict))],
        distinctXCutoff: [...new Set(verdicts.map((v) => v.xCutoff))],
        jsonDiffsAcrossRuns: detDiffs,
      }
      console.log(
        `   verdicts: ${entry.restartUnseeded && (entry.restartUnseeded as { distinctVerdicts: string[] }).distinctVerdicts.join(' | ')}`
      )
      save()
    }
  }
}
save()
console.log(`wrote ${join(OUT, 'parity-results.json')}`)
