// SPDX-License-Identifier: GPL-3.0-only
/**
 * D5 — package a SELECTION of the D2/D3 device datasets for the Hub's
 * "Entropy Evidence Lab" workshop step, with full provenance.
 *
 *   npx tsx scripts/entropy-90b/package-device-datasets.ts \
 *     <evidenceDir> [--parity scripts/entropy-90b/results/parity-results-0924.json] \
 *     [--out public/data/entropy]
 *
 * <evidenceDir> is pqctoday-priv/local-evidence-cache/entropy/0924 (98 MB,
 * gitignored, never committed). This script:
 *
 * 1. re-hashes every chosen source file and refuses to continue if it does not
 *    match the evidence manifest (datasets.json);
 * 2. reduces raw jitterentropy recordings to 8-bit symbols EXACTLY as upstream
 *    jitterentropy's analysis step does by default —
 *    tests/raw-entropy/validation-runtime/extractlsb.c with mask "FF"
 *    (processdata_helper.sh MASK_LIST="FF:8"): extract() walks the mask from
 *    bit 0 upwards and packs each selected bit of the 64-bit sample into the
 *    output byte at the next position, so for mask 0xFF the output byte is
 *    `sample & 0xFF` (the 8 least-significant bits). One byte per sample, an
 *    alphabet of at most 256 symbols (SP 800-90B §3.1.3 / §6.4);
 * 3. copies the D3 contrast bytes unchanged (they are already bytes of
 *    generator OUTPUT — conditioned/DRBG output, not raw noise);
 * 4. checks each output's SHA-256 against the W1 parity run, so the Hub can
 *    show "matches native reference" by hash;
 * 5. writes <out>/<id>.bin and <out>/device-datasets-manifest.json.
 *
 * The manifest also carries (a) precomputed NATIVE reference results for every
 * dataset in the parity run, keyed by SHA-256, and (b) comparison-only rows for
 * device datasets that are NOT shipped (loaded condition, the Mac restart
 * matrices, the other contrast sets). Output is deterministic: no wall-clock
 * time is written, so re-running on the same inputs yields identical files.
 *
 * Size budget: 8,000,000 bytes of public device data (fails above it).
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { format, resolveConfig } from 'prettier'

const SIZE_BUDGET_BYTES = 8_000_000
const EXTRACTLSB_URL =
  'https://github.com/smuellerDD/jitterentropy-library/blob/e783cf1c450bce4d72f95c9f9c84546a6094976a/tests/raw-entropy/validation-runtime/extractlsb.c'

const args = process.argv.slice(2)
const evidenceDir = args[0]
const opt = (name: string, dflt: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : dflt
}
if (!evidenceDir) {
  console.error(
    'usage: package-device-datasets.ts <evidenceDir> [--parity <parity-results.json>] [--out <dir>]'
  )
  process.exit(2)
}
const parityPath = opt('--parity', 'scripts/entropy-90b/results/parity-results-0924.json')
const outDir = opt('--out', 'public/data/entropy')

const sha = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex')
const die = (msg: string): never => {
  console.error(`✖ ${msg}`)
  process.exit(1)
}

// ── Inputs ────────────────────────────────────────────────────────────────────
interface EvidenceEntry {
  device: string
  environment_kind: string
  environment_file: string
  tool: Record<string, string | null>
  command: string
  start_utc: string
  end_utc: string
  wall_seconds: number
  condition: string
  condition_detail: string | null
  load_before: string | null
  load_after: string | null
  temperature_before?: {
    representative?: { sensor?: string; value_c: number | null; note?: string }
  }
  temperature_after?: {
    representative?: { sensor?: string; value_c: number | null; note?: string }
  }
  dataset_kind: 'sequential' | 'restart' | 'contrast'
  label: string
  file: string
  file_sha256: string
  file_bytes: number
  sample_count: number
  matrix?: { restarts: number; samples_per_restart: number }
  timer?: string
  source?: string
  why_contrast?: string
}
interface EvidenceManifest {
  generated_utc: string
  tool: Record<string, string>
  sample_format: Record<string, string>
  datasets: EvidenceEntry[]
  not_collected: Array<{ what: string; why: string }>
}
interface EnvRecord {
  device: string
  device_description: string
  environment_kind: string
  summary: Record<string, unknown>
  executionEnvironment_sha256: string
}

const evidenceManifestPath = join(evidenceDir, 'datasets.json')
const evidenceManifestText = readFileSync(evidenceManifestPath, 'utf8')
const evidence = JSON.parse(evidenceManifestText) as EvidenceManifest
const parity = JSON.parse(readFileSync(parityPath, 'utf8')) as {
  generatedAt: string
  wasmBuildInfo: { nistCommit: string; files: Record<string, { sha256: string }> }
  results: Array<
    Record<string, unknown> & { id: string; source: string; bits: number; sha256: string }
  >
}
const paritySha = new Map(parity.results.map((r) => [r.sha256, r]))

const envCache = new Map<string, EnvRecord>()
function env(file: string): EnvRecord {
  if (!envCache.has(file))
    envCache.set(file, JSON.parse(readFileSync(join(evidenceDir, file), 'utf8')) as EnvRecord)
  return envCache.get(file)!
}

// ── Selection ────────────────────────────────────────────────────────────────
interface Pick {
  id: string
  source: string // path relative to evidenceDir
  label: string
  conditionLabel: string
  caveats: string[]
}

const MAC_SHARED_HOST =
  'Shared-host baseline, NOT idle: other work kept the Mac load average at 33–60 during collection; no load was added by the collector.'
const MAC_NO_TEMP =
  'No SoC temperature was recorded: reading it on macOS needs root, which the collector did not have.'
const RESTART_SEMANTICS =
  "Each 'restart' is a fresh jitterentropy collector allocation inside ONE process (upstream's raw_entropy_restart procedure), not a reboot or power cycle."

const PICKS: Pick[] = [
  {
    id: 'kv260-idle-sequential',
    source: 'kv260/idle/kv260-idle-sequential-jent-raw-noise.data',
    label: 'KV260 (4× Cortex-A53) — idle, sequential',
    conditionLabel: 'idle (appliance services running)',
    caveats: [
      'No hardware RNG is reachable from Linux on this image (no hw_random class, CONFIG_HW_RANDOM not set).',
    ],
  },
  {
    id: 'kv260-idle-restart',
    source: 'kv260/idle/kv260-idle-restart-matrix.data',
    label: 'KV260 (4× Cortex-A53) — idle, 1000 × 1000 restart matrix',
    conditionLabel: 'idle (appliance services running)',
    caveats: [RESTART_SEMANTICS],
  },
  {
    id: 'imx95-idle-sequential',
    source: 'frdm-imx95/idle/frdm-imx95-idle-sequential-jent-raw-noise.data',
    label: 'i.MX 95 (6× Cortex-A55) — idle, sequential',
    conditionLabel: 'idle (appliance services running)',
    caveats: [
      'The i.MX 95 hardware TRNG (ELE) does not expose raw pre-conditioning samples to Linux; only its /dev/hwrng output is readable.',
      'PMIC temperature zones (pf09, pf53_*) are banded comparators: a reading of 105 °C means "below 105 °C". The a55-thermal sensor is used instead.',
    ],
  },
  {
    id: 'imx95-idle-restart',
    source: 'frdm-imx95/idle/frdm-imx95-idle-restart-matrix.data',
    label: 'i.MX 95 (6× Cortex-A55) — idle, 1000 × 1000 restart matrix',
    conditionLabel: 'idle (appliance services running)',
    caveats: [RESTART_SEMANTICS],
  },
  {
    id: 'mac-native-baseline-sequential',
    source: 'mac-m5max-native/idle/mac-m5max-native-idle-sequential-jent-raw-noise.data',
    label: 'Mac M5 Max, native macOS — shared-host baseline, sequential',
    conditionLabel: 'shared-host baseline (not idle)',
    caveats: [MAC_SHARED_HOST, MAC_NO_TEMP],
  },
  {
    id: 'mac-vm-baseline-sequential',
    source: 'mac-orbstack-linux-vm/idle/mac-orbstack-linux-vm-idle-sequential-jent-raw-noise.data',
    label: 'Mac OrbStack Linux VM (virtualized environment) — shared-host baseline, sequential',
    conditionLabel: 'shared-host baseline (not idle), virtualized environment',
    caveats: [
      'Virtualized environment: the timer is the guest view of a virtualized counter; this is a different operating environment from the Mac host.',
      MAC_SHARED_HOST,
      MAC_NO_TEMP,
    ],
  },
  {
    id: 'imx95-contrast-getrandom',
    source: 'frdm-imx95/contrast/frdm-imx95-contrast-getrandom.bin',
    label: 'i.MX 95 getrandom() output — contrast (conditioned/DRBG output)',
    conditionLabel: 'no defined condition (collected after the loaded run)',
    caveats: [
      'Conditioned/DRBG output of the Linux kernel CRNG, not raw noise. Estimator output on it says nothing about any noise source.',
      'Collected shortly after the loaded run, so it falls under neither the idle nor the loaded condition.',
    ],
  },
]

// ── Reduction ────────────────────────────────────────────────────────────────
/**
 * extractlsb.c extract(sample, mask) for mask = 0xFF: bit i of the output byte
 * is the i-th set bit of the mask applied to the sample, i.e. sample & 0xFF.
 * Lines are parsed as unsigned 64-bit decimal (BigInt keeps full precision).
 */
function extractLsbFF(text: string): Uint8Array {
  const lines = text.split('\n').filter((l) => l.trim().length > 0)
  const out = new Uint8Array(lines.length)
  lines.forEach((l, i) => {
    out[i] = Number(BigInt(l.trim().split(' ')[0]) & 0xffn)
  })
  return out
}

function temp(t: EvidenceEntry['temperature_before']) {
  const r = t?.representative
  if (!r) return null
  return { sensor: r.sensor ?? null, valueC: r.value_c ?? null, note: r.note ?? null }
}

// ── Native reference (from the W1 parity run) ─────────────────────────────────
type Flat = Record<string, number | boolean | string>
interface NativeReferenceEntry {
  parityId: string
  source: string
  bits: number
  nonIid?: { values: Flat; nativeArm64StrictIdentical: boolean; wasmMs: number | null }
  iid?: { values: Flat; verdicts: string[]; runs: number }
  restart?: {
    hI: number
    values: Flat
    nativeArm64StrictIdentical: boolean
    verdicts: string[]
    wasmMs: number | null
  }
}
function strictIdentical(block: Record<string, unknown> | undefined): boolean {
  const n = (block?.native as Record<string, { diffsVsWasm?: unknown[] }> | undefined)?.[
    'native-arm64-strict'
  ]
  return !!n && Array.isArray(n.diffsVsWasm) && n.diffsVsWasm.length === 0
}
function nativeReference(): Record<string, NativeReferenceEntry> {
  const out: Record<string, NativeReferenceEntry> = {}
  for (const r of parity.results) {
    const e: NativeReferenceEntry = { parityId: r.id, source: r.source, bits: r.bits }
    const nonIid = r.nonIid as Record<string, unknown> | undefined
    if (nonIid?.wasm)
      e.nonIid = {
        values: nonIid.wasm as Flat,
        nativeArm64StrictIdentical: strictIdentical(nonIid),
        wasmMs: (nonIid.wasmMs as number) ?? null,
      }
    const iidU = r.iidUnseeded as { verdicts?: unknown[]; distinctVerdicts?: string[] } | undefined
    const iidS = r.iidSeeded as Record<string, unknown> | undefined
    if (iidS?.wasm) {
      // Only the fields the tool computes deterministically; permutation-test
      // outcomes are randomised by the tool (seeded from /dev/urandom).
      const v = iidS.wasm as Flat
      const keep: Flat = {}
      for (const [k, x] of Object.entries(v)) if (!/passed/i.test(k)) keep[k] = x
      e.iid = {
        values: keep,
        verdicts: iidU?.distinctVerdicts ?? [],
        runs: iidU?.verdicts?.length ?? 0,
      }
    }
    const rs = r.restartSeeded as Record<string, unknown> | undefined
    if (rs?.wasm) {
      const ru = r.restartUnseeded as { verdicts?: Array<{ verdict: string }> } | undefined
      e.restart = {
        hI: r.hI as number,
        values: rs.wasm as Flat,
        nativeArm64StrictIdentical: strictIdentical(rs),
        verdicts: [...new Set((ru?.verdicts ?? []).map((x) => x.verdict))],
        wasmMs: (rs.wasmMs as number) ?? null,
      }
    }
    out[r.sha256] = e
  }
  return out
}

// ── Build ────────────────────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true })
const byFile = new Map(evidence.datasets.map((d) => [d.file, d]))
const shipped: Record<string, unknown>[] = []
let total = 0
for (const p of PICKS) {
  const e = byFile.get(p.source) ?? die(`${p.source} is not in ${evidenceManifestPath}`)
  const raw = readFileSync(join(evidenceDir, p.source))
  const srcSha = sha(raw)
  if (srcSha !== e.file_sha256) die(`${p.source}: sha256 ${srcSha} != manifest ${e.file_sha256}`)
  const isContrast = e.dataset_kind === 'contrast'
  const bytes = isContrast ? new Uint8Array(raw) : extractLsbFF(raw.toString('utf8'))
  if (bytes.length !== e.sample_count) die(`${p.id}: ${bytes.length} samples != ${e.sample_count}`)
  const outSha = sha(bytes)
  const par = paritySha.get(outSha)
  if (!par) die(`${p.id}: output sha256 ${outSha} has no W1 parity result`)
  const envRec = env(e.environment_file)
  const s = envRec.summary as Record<string, unknown>
  writeFileSync(join(outDir, `${p.id}.bin`), bytes)
  total += bytes.length
  shipped.push({
    id: p.id,
    label: p.label,
    kind: isContrast ? 'contrast' : e.dataset_kind,
    provenance: isContrast ? 'conditioned-output-contrast' : 'device-raw-noise',
    evidenceLabel: e.label,
    device: e.device,
    deviceDescription: envRec.device_description.replace(/,? reached over SSH.*$/, ''),
    environmentKind: envRec.environment_kind,
    environmentSummary: {
      os: s.os ?? null,
      kernel: s.kernel ?? null,
      cpu: s.cpu ?? null,
      timer: s.timer ?? null,
      cpufreq: s.cpufreq ?? null,
    },
    environmentRecordSha256: envRec.executionEnvironment_sha256,
    condition: e.condition,
    conditionLabel: p.conditionLabel,
    conditionDetail: e.condition_detail,
    caveats: p.caveats,
    tool: e.tool,
    command: e.command,
    startUtc: e.start_utc,
    endUtc: e.end_utc,
    wallSeconds: e.wall_seconds,
    loadBefore: e.load_before,
    loadAfter: e.load_after,
    temperatureBefore: temp(e.temperature_before),
    temperatureAfter: temp(e.temperature_after),
    sampleUnit: isContrast
      ? `one byte of generator output (${e.source ?? 'conditioned/DRBG interface'})`
      : 'one raw jitterentropy time delta (unsigned 64-bit timer difference of jent_measure_jitter), reduced to its 8 least-significant bits',
    timer: e.timer ?? null,
    bitsPerSymbol: 8,
    alphabet: 'at most 256 symbols (one byte per sample)',
    reduction: isContrast
      ? { method: 'none', description: 'bytes of generator output used as 8-bit samples' }
      : {
          method: 'extractlsb',
          mask: 'FF',
          keptBits: 8,
          description:
            'upstream jitterentropy extractlsb.c with mask FF (processdata_helper.sh default MASK_LIST="FF:8"): output byte = sample & 0xFF, the 8 least-significant bits of each 64-bit delta. The mask is the analyst\'s choice; FF is only upstream\'s default.',
          source: EXTRACTLSB_URL,
        },
    sampleCount: bytes.length,
    matrix: e.matrix
      ? { restarts: e.matrix.restarts, samplesPerRestart: e.matrix.samples_per_restart }
      : null,
    file: `data/entropy/${p.id}.bin`,
    bytes: bytes.length,
    sha256: outSha,
    sourceFile: p.source,
    sourceBytes: e.file_bytes,
    sourceSha256: srcSha,
    parityId: par.id,
  })
  console.log(`${p.id.padEnd(34)} ${String(bytes.length).padStart(8)}  ${outSha.slice(0, 16)}`)
}
if (total > SIZE_BUDGET_BYTES) die(`shipped ${total} bytes > budget ${SIZE_BUDGET_BYTES}`)

// Pair sequential ↔ restart by device + condition.
for (const d of shipped) {
  if (d.kind !== 'sequential') continue
  const r = shipped.find(
    (x) => x.kind === 'restart' && x.device === d.device && x.condition === d.condition
  )
  if (r) {
    d.pairedRestartId = r.id
    r.pairedSequentialId = d.id
  }
}

// Comparison-only rows: device datasets NOT shipped, with their native result.
const shippedSources = new Set(PICKS.map((p) => p.source))
const comparisonOnly = evidence.datasets
  .filter((e) => !shippedSources.has(e.file))
  .map((e) => {
    const parityId = `real-${e.file
      .split('/')
      .pop()!
      .replace(/\.(data|bin)$/, '')}`
    const par = parity.results.find((r) => r.id === parityId)
    const isMac = e.device.startsWith('mac-')
    const neither =
      e.dataset_kind === 'contrast'
        ? 'Falls under neither the idle nor the loaded condition.'
        : null
    return {
      parityId,
      device: e.device,
      kind: e.dataset_kind,
      condition: isMac && e.condition === 'idle' ? 'shared-host baseline (not idle)' : e.condition,
      label: e.label,
      source: e.source ?? null,
      sourceFile: e.file,
      sourceSha256: e.file_sha256,
      reducedSha256: par?.sha256 ?? null,
      note: [
        'Dataset not shipped in the Hub (size budget); precomputed native reference result only.',
        isMac ? MAC_SHARED_HOST.replace(/^Shared-host baseline, NOT idle: /, '') : null,
        neither,
      ]
        .filter(Boolean)
        .join(' '),
    }
  })

const manifest = {
  schema: 'pqctoday.entropy.device-datasets/1',
  truthBoundary:
    'Real measurements taken for teaching (plan §1 item 9). Not a validated entropy source, not an ESV submission, and no min-entropy claim about these devices beyond what the estimator output shows for each dataset under its recorded conditions.',
  generatedBy: 'scripts/entropy-90b/package-device-datasets.ts',
  sourceManifest: {
    path: 'pqctoday-priv/local-evidence-cache/entropy/0924/datasets.json (not published)',
    sha256: sha(evidenceManifestText),
    generatedUtc: evidence.generated_utc,
  },
  recorderTool: evidence.tool,
  sampleFormat: {
    gcdReduction: evidence.sample_format.gcd_reduction,
    restartSemantics: evidence.sample_format.restart_semantics,
    restartMatrixLayout:
      'row-major 1000 × 1000: byte (r-1)*1000 + (c-1) = restart r, sample c (0-based offset)',
  },
  sizeBudgetBytes: SIZE_BUDGET_BYTES,
  totalBytes: total,
  datasets: shipped,
  comparisonOnly,
  notCollected: evidence.not_collected,
  nativeReference: {
    tool: 'usnistgov/SP800-90B_EntropyAssessment',
    commit: parity.wasmBuildInfo.nistCommit,
    platform:
      'native-arm64-strict: linux/arm64, Debian trixie, g++ 14.2, upstream flags + -ffp-contract=off (the W1 parity reference)',
    parityRunAt: parity.generatedAt,
    parityReport: 'scripts/entropy-90b/results/parity-report-0924.md',
    wasmSha256: Object.fromEntries(
      Object.entries(parity.wasmBuildInfo.files)
        .filter(([k]) => k.endsWith('.wasm'))
        .map(([k, v]) => [k, v.sha256])
    ),
    notes: [
      'non-IID values: every estimator field of the tool JSON; native-arm64-strict produced identical JSON and stdout to the WASM build.',
      'IID values: only the deterministic fields. The permutation test is seeded by the tool from /dev/urandom, so its counters vary run to run; verdicts are those seen over the unseeded parity runs.',
      'restart values: runs with a pinned /dev/urandom. The sanity-check cutoff X_cutoff is a Monte-Carlo quantile, so a learner run may print a different X_cutoff.',
    ],
    bySha256: nativeReference(),
  },
}
const manifestPath = join(outDir, 'device-datasets-manifest.json')
// Written through the repo's pinned Prettier so format:check stays green.
const prettierOptions = (await resolveConfig(manifestPath)) ?? {}
writeFileSync(
  manifestPath,
  await format(JSON.stringify(manifest), { ...prettierOptions, filepath: manifestPath })
)
console.log(`total ${total} bytes (budget ${SIZE_BUDGET_BYTES}) → ${manifestPath}`)
if (!existsSync(manifestPath)) die('manifest not written')
