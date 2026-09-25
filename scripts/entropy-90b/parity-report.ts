// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render parity-results.json (from parity.ts) as a markdown report.
 *
 *   npx tsx scripts/entropy-90b/parity-report.ts <parity-results.json> <out.md> [measurements.jsonl]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const [inPath, outPath, measPath] = process.argv.slice(2)
if (!inPath || !outPath) {
  console.error('usage: parity-report.ts <parity-results.json> <out.md> [measurements.jsonl]')
  process.exit(2)
}

interface Diff {
  field: string
  a: unknown
  b: unknown
}
interface NativeCmp {
  diffsVsWasm: Diff[]
  stdoutVsWasm: { identical: boolean; firstDiff?: [string, string] }
}
type Vals = Record<string, number | boolean | string>
interface Entry {
  id: string
  source: string
  bits: number
  sha256: string
  hI?: number
  nonIid?: { wasm: Vals; wasmMs: number; wasmExit: number; native: Record<string, NativeCmp> }
  iidSeeded?: { wasm: Vals; native: Record<string, NativeCmp> }
  iidUnseeded?: {
    verdicts: Array<{ platform: string; verdict: string }>
    distinctVerdicts: string[]
    deterministicFieldDiffs: Diff[]
  }
  restartSeeded?: { wasm: Vals; wasmMs: number; native: Record<string, NativeCmp> }
  restartUnseeded?: {
    verdicts: Array<{
      platform: string
      verdict: string
      xCutoff: string | null
      xMax: string | null
    }>
    distinctVerdicts: string[]
    distinctXCutoff: Array<string | null>
    jsonDiffsAcrossRuns: Diff[]
  }
  restart?: { skipped: string }
}

const doc = JSON.parse(readFileSync(inPath, 'utf8')) as {
  generatedAt: string
  wasmBuildInfo: { nistCommit: string; compiler: string; files: Record<string, { sha256: string }> }
  node: string
  runsPerRandomisedCheck: number
  parityUrandomSeedSha256: string
  results: Entry[]
}

const NATIVES = ['native-arm64-strict', 'native-arm64', 'native-amd64', 'native-amd64-strict']
const fmt = (v: unknown) => (typeof v === 'number' ? String(v) : String(v ?? '—'))
const maxAbs = (d: Diff[]) =>
  d.reduce(
    (m, x) =>
      typeof x.a === 'number' && typeof x.b === 'number' ? Math.max(m, Math.abs(x.a - x.b)) : m,
    0
  )
const at6 = (d: Diff[]) =>
  d.every(
    (x) => typeof x.a === 'number' && typeof x.b === 'number' && x.a.toFixed(6) === x.b.toFixed(6)
  )

function cmpCell(c: NativeCmp | undefined): string {
  if (!c) return 'n/a'
  if (c.diffsVsWasm.length === 0)
    return c.stdoutVsWasm.identical ? '**identical** (JSON + stdout)' : 'JSON identical'
  const nonNum = c.diffsVsWasm.some((x) => typeof x.a !== 'number' || typeof x.b !== 'number')
  return `${c.diffsVsWasm.length} field(s) differ, max abs ${maxAbs(c.diffsVsWasm).toExponential(1)}${
    nonNum
      ? ', **non-numeric difference**'
      : at6(c.diffsVsWasm)
        ? ', equal at 6 dp'
        : ', **differs at 6 dp**'
  }`
}

const L: string[] = []
L.push('# SP 800-90B WASM parity report (W1)')
L.push('')
L.push(`Generated ${doc.generatedAt} by \`scripts/entropy-90b/parity.ts\`; Node ${doc.node}.`)
L.push(
  `NIST tool commit \`${doc.wasmBuildInfo.nistCommit}\`; WASM built with ${doc.wasmBuildInfo.compiler}.`
)
L.push('')
L.push('WASM artefacts measured:')
for (const [f, m] of Object.entries(doc.wasmBuildInfo.files))
  if (f.endsWith('.wasm')) L.push(`- \`${f}\` sha256 \`${m.sha256}\``)
L.push('')
L.push(
  'Native references (scripts/entropy-90b/Dockerfile.native, Debian trixie, g++ 14.2, glibc 2.41):'
)
L.push(
  '- `native-arm64-strict`: linux/arm64, upstream flags + `-ffp-contract=off`. **The parity reference.**'
)
L.push('- `native-arm64`: linux/arm64, upstream Makefile flags unchanged.')
L.push(
  '- `native-amd64`: linux/amd64 (OrbStack/Rosetta), upstream flags incl. `-march=native` (FMA on).'
)
L.push('- `native-amd64-strict`: linux/amd64, no `-march=native`, `-ffp-contract=off`.')
L.push('')
L.push(
  'Why a "strict" reference: g++ compiles C++ with `-ffp-contract=fast` by default, fusing a*b+c into FMA ' +
    'wherever the CPU has it, and amd64 `long double` is x87 80-bit while arm64/WASM use IEEE binary128. The ' +
    'upstream-flag builds therefore disagree with EACH OTHER in the last bits; the reference tool is not ' +
    'bit-reproducible across its own platforms. WebAssembly has no implicit FMA and uses binary128, so the ' +
    'like-for-like native is arm64 without contraction.'
)
L.push('')
L.push(
  `"stdout" compares every verbose line (-v -v prints each estimator's intermediates with %.17g / %.22Lg). ` +
    `IID/restart "seeded" runs replace /dev/urandom with a fixed 32-byte seed (sha256 of it: \`${doc.parityUrandomSeedSha256}\`) ` +
    `and use OMP_NUM_THREADS=1 natively; "unseeded" runs are the tool as shipped, ${doc.runsPerRandomisedCheck} runs per platform.`
)
L.push('')

L.push('## Reading this report')
L.push('')
L.push(
  '- **These numbers are parity measurements, not entropy claims.** "real" rows are the D2/D3 device datasets ' +
    "(pqctoday-priv local-evidence-cache/entropy/0924), reduced for the tool with jitterentropy's default " +
    '`extractlsb FF:8` (scripts/entropy-90b/convert-jent-raw.ts). They are not a validated entropy source or an ESV ' +
    'submission (plan §1 item 9); the `contrast` rows are conditioned/DRBG output, which is exactly the input SP ' +
    '800-90B assessment must NOT be run on. "synthetic-d4" rows are generated data (public/data/entropy/d4-synthetic-manifest.json).'
)
L.push(
  '- **IID permutation test determinism** (read from the code, iid/permutation_tests.h + shared/utils.h seed()): ' +
    'every run seeds xoshiro256** from 32 bytes of /dev/urandom, and with OpenMP each thread takes its own jumped ' +
    'stream while shared per-test status flags decide when permuting stops, so the counters depend on the seed and on thread scheduling. ' +
    'It is therefore NOT deterministic as shipped (5 unseeded runs of the same native binary gave 5 different ' +
    'counter sets). With /dev/urandom pinned and one thread it is deterministic, and WASM then matches native exactly, ' +
    'counters included. The restart sanity-check cutoff (X_cutoff) is a Monte-Carlo quantile seeded the same way.'
)
L.push(
  '- **Upstream JSON quirk:** ea_iid writes `hAssessed` = the symbol width unless run with `-v -v` ' +
    '(iid_main.cpp only computes it at verbose > 2). The Hub runner defaults to `-v -v`; parity used `-v -v` everywhere.'
)
L.push('')

// ---- summary table ----------------------------------------------------------
L.push('## Summary — non-IID track (ea_non_iid), WASM vs each native')
L.push('')
L.push(
  '| dataset | source | bits | WASM H_assessed | vs arm64-strict | vs arm64 (upstream) | vs amd64 (upstream) |'
)
L.push('|---|---|---|---|---|---|---|')
for (const e of doc.results) {
  if (!e.nonIid) continue
  const h = e.nonIid.wasm['Overall / hAssessed'] ?? e.nonIid.wasm.error ?? '—'
  L.push(
    `| ${e.id} | ${e.source} | ${e.bits} | ${fmt(h)} | ${cmpCell(e.nonIid.native['native-arm64-strict'])} | ${cmpCell(
      e.nonIid.native['native-arm64']
    )} | ${cmpCell(e.nonIid.native['native-amd64'])} |`
  )
}
L.push('')

L.push('## Summary — IID track (ea_iid)')
L.push('')
L.push(
  '| dataset | seeded: vs arm64-strict | seeded: vs arm64 | seeded: vs amd64 | unseeded verdicts (all platforms × runs) | unseeded deterministic-field diffs |'
)
L.push('|---|---|---|---|---|---|')
for (const e of doc.results) {
  if (!e.iidSeeded) continue
  L.push(
    `| ${e.id} | ${cmpCell(e.iidSeeded.native['native-arm64-strict'])} | ${cmpCell(e.iidSeeded.native['native-arm64'])} | ${cmpCell(
      e.iidSeeded.native['native-amd64']
    )} | ${e.iidUnseeded ? `${e.iidUnseeded.distinctVerdicts.join(' / ')} (${e.iidUnseeded.verdicts.length} runs)` : 'not run'} | ${
      e.iidUnseeded ? e.iidUnseeded.deterministicFieldDiffs.length : '—'
    } |`
  )
}
L.push('')

L.push('## Summary — restart track (ea_restart)')
L.push('')
L.push(
  '| dataset | H_I used | seeded: vs arm64-strict | seeded: vs arm64 | seeded: vs amd64 | unseeded verdicts | X_cutoff seen |'
)
L.push('|---|---|---|---|---|---|---|')
for (const e of doc.results) {
  if (e.restart) {
    L.push(`| ${e.id} | — | ${e.restart.skipped} | | | | |`)
    continue
  }
  if (!e.restartSeeded) continue
  L.push(
    `| ${e.id} | ${fmt(e.hI)} | ${cmpCell(e.restartSeeded.native['native-arm64-strict'])} | ${cmpCell(
      e.restartSeeded.native['native-arm64']
    )} | ${cmpCell(e.restartSeeded.native['native-amd64'])} | ${
      e.restartUnseeded
        ? `${e.restartUnseeded.distinctVerdicts.join(' / ')} (${e.restartUnseeded.verdicts.length} runs)`
        : 'not run'
    } | ${e.restartUnseeded ? e.restartUnseeded.distinctXCutoff.join(', ') : fmt(e.restartSeeded.wasm['X_cutoff'])} |`
  )
}
L.push('')

// ---- per-estimator detail ---------------------------------------------------
L.push('## Detail — every estimator value (non-IID), WASM and each native')
L.push('')
L.push('Blank native cell = identical to WASM. A value is shown only where it differs.')
L.push('')
for (const e of doc.results) {
  if (!e.nonIid) continue
  L.push(`### ${e.id}`)
  L.push('')
  L.push(`sha256 \`${e.sha256}\`, ${e.bits}-bit samples, source: ${e.source}.`)
  L.push('')
  L.push(`| estimator / field | WASM | ${NATIVES.join(' | ')} |`)
  L.push(`|---|---|${NATIVES.map(() => '---').join('|')}|`)
  for (const [k, v] of Object.entries(e.nonIid.wasm)) {
    const cells = NATIVES.map((n) => {
      const d = e.nonIid!.native[n]?.diffsVsWasm.find((x) => x.field === k || k.endsWith(x.field))
      return d ? `**${fmt(d.b)}**` : ''
    })
    L.push(`| ${k} | ${fmt(v)} | ${cells.join(' | ')} |`)
  }
  const extra = NATIVES.flatMap((n) =>
    (e.nonIid!.native[n]?.diffsVsWasm ?? [])
      .filter((d) => !Object.keys(e.nonIid!.wasm).some((k) => k === d.field || k.endsWith(d.field)))
      .map((d) => `${n}: ${d.field} wasm=${fmt(d.a)} native=${fmt(d.b)}`)
  )
  if (extra.length) L.push('', ...extra.map((x) => `- ${x}`))
  L.push('')
}

if (measPath && existsSync(measPath)) {
  L.push('## W2 — Node runtime and memory (one run per fresh process)')
  L.push('')
  L.push(
    'Measured with scripts/entropy-90b/measure-node.ts on an Apple M5 Max (Node 22, single thread) while other ' +
      'sessions kept the host load average around 24, so treat times as upper-side. "WASM memory" is the size the ' +
      'module memory grew to (it never shrinks, so it is the peak). A laptop-browser measurement (plan W2) is NOT done yet.'
  )
  L.push('')
  L.push(
    '| tool | dataset | samples | bits | wall time | WASM memory | process peak RSS | H_assessed |'
  )
  L.push('|---|---|---|---|---|---|---|---|')
  for (const line of readFileSync(measPath, 'utf8').split('\n').filter(Boolean)) {
    const m = JSON.parse(line) as Record<string, unknown>
    L.push(
      `| ${m.tool} | ${String(m.file).split('/').pop()} | ${m.samples} | ${m.bits} | ${(Number(m.elapsedMs) / 1000).toFixed(1)} s | ${m.wasmMemoryMiB} MiB | ${m.peakRssMiB} MiB | ${fmt(m.hAssessed)} |`
    )
  }
  L.push('')
}

writeFileSync(outPath, L.join('\n') + '\n')
console.log(`wrote ${outPath}`)
