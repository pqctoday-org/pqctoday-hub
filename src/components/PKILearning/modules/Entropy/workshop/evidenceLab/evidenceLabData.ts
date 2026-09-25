// SPDX-License-Identifier: GPL-3.0-only
/**
 * Data for the Entropy Evidence Lab: the device-dataset manifest (written by
 * scripts/entropy-90b/package-device-datasets.ts), the lab's case list, the
 * synthetic D4 cases (generated in the browser, never shipped as files) and
 * the public ESV certificate references.
 */
import { D4_DATASETS, type D4DatasetSpec } from '@/wasm/entropy90b/syntheticDatasets'
import type { Flat } from './evidenceLabLogic'

export const DEVICE_MANIFEST_URL = '/data/entropy/device-datasets-manifest.json'

// ── Manifest types (subset the lab reads) ────────────────────────────────────

export interface Temperature {
  sensor: string | null
  valueC: number | null
  note: string | null
}

export interface DeviceDataset {
  id: string
  label: string
  kind: 'sequential' | 'restart' | 'contrast'
  provenance: 'device-raw-noise' | 'conditioned-output-contrast'
  evidenceLabel: string
  device: string
  deviceDescription: string
  environmentKind: string
  environmentSummary: Record<string, string | null>
  environmentRecordSha256: string
  condition: string
  conditionLabel: string
  conditionDetail: string | null
  caveats: string[]
  tool: Record<string, string | null>
  command: string
  startUtc: string
  endUtc: string
  wallSeconds: number
  loadBefore: string | null
  loadAfter: string | null
  temperatureBefore: Temperature | null
  temperatureAfter: Temperature | null
  sampleUnit: string
  timer: string | null
  bitsPerSymbol: number
  alphabet: string
  reduction: {
    method: string
    mask?: string
    keptBits?: number
    description: string
    source?: string
  }
  sampleCount: number
  matrix: { restarts: number; samplesPerRestart: number } | null
  file: string
  bytes: number
  sha256: string
  sourceFile: string
  sourceBytes: number
  sourceSha256: string
  parityId: string
  pairedRestartId?: string
  pairedSequentialId?: string
}

export interface ComparisonOnlyRow {
  parityId: string
  device: string
  kind: 'sequential' | 'restart' | 'contrast'
  condition: string
  label: string
  source: string | null
  sourceFile: string
  sourceSha256: string
  reducedSha256: string | null
  note: string
}

export interface NativeReferenceEntry {
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

export interface DeviceManifest {
  schema: 'pqctoday.entropy.device-datasets/1'
  truthBoundary: string
  recorderTool: Record<string, string>
  sampleFormat: Record<string, string>
  sizeBudgetBytes: number
  totalBytes: number
  datasets: DeviceDataset[]
  comparisonOnly: ComparisonOnlyRow[]
  notCollected: Array<{ what: string; why: string }>
  nativeReference: {
    tool: string
    commit: string
    platform: string
    parityRunAt: string
    parityReport: string
    wasmSha256: Record<string, string>
    notes: string[]
    bySha256: Record<string, NativeReferenceEntry>
  }
}

export async function loadDeviceManifest(fetchImpl: typeof fetch = fetch): Promise<DeviceManifest> {
  const res = await fetchImpl(DEVICE_MANIFEST_URL)
  if (!res.ok) throw new Error(`Could not load the dataset manifest (HTTP ${res.status}).`)
  const m = (await res.json()) as DeviceManifest
  if (m.schema !== 'pqctoday.entropy.device-datasets/1')
    throw new Error(`Unexpected manifest schema: ${String(m.schema)}`)
  return m
}

// ── Lab cases ────────────────────────────────────────────────────────────────

export type CaseGroup = 'device' | 'contrast' | 'synthetic'

export type DataRef = { kind: 'device'; datasetId: string } | { kind: 'synthetic'; d4Id: string }

export interface LabCase {
  id: string
  group: CaseGroup
  title: string
  /** One-line lesson shown on the picker card. */
  lesson: string
  provenance: 'device-raw-noise' | 'conditioned-output-contrast' | 'synthetic'
  bitsPerSymbol: number
  sequential: DataRef
  restart?: DataRef
  /** Synthetic: SHA-256-conditioned output of a stuck source. */
  syntheticConditioned?: boolean
  /** Comparison-only native result for a restart matrix not shipped (e.g. Mac). */
  referenceRestartParityId?: string
}

const SYNTHETIC_CASES: Array<{
  id: string
  title: string
  lesson: string
  seq: string
  restart?: string
  conditioned?: boolean
}> = [
  {
    id: 'syn-stuck',
    title: 'Stuck source',
    lesson: 'One symbol forever: the tool awards no entropy.',
    seq: 'd4-stuck-8bit',
  },
  {
    id: 'syn-biased',
    title: 'Biased bits (P(1) = 0.75)',
    lesson: 'True min-entropy is −log2(0.75) ≈ 0.415 bit per sample.',
    seq: 'd4-biased-1bit',
  },
  {
    id: 'syn-markov',
    title: 'Non-IID bits (Markov, repeats 70%)',
    lesson: 'Balanced but correlated: predictors see what Most Common Value misses.',
    seq: 'd4-markov-1bit',
  },
  {
    id: 'syn-healthy',
    title: 'Healthy-looking IID-like PRNG output',
    lesson: 'Passes the statistics, yet anyone with the seed predicts it.',
    seq: 'd4-healthy-iid-8bit',
    restart: 'd4-healthy-iid-8bit-restart',
  },
  {
    id: 'syn-restart-correlated',
    title: 'Restart-correlated source',
    lesson: 'Looks healthy in one long run; every restart replays the same state.',
    seq: 'd4-healthy-iid-8bit',
    restart: 'd4-restart-correlated-8bit',
  },
  {
    id: 'syn-conditioned-stuck',
    title: 'SHA-256-conditioned stuck source',
    lesson: 'Conditioning hides a failed source: near 8 bits/byte from zero entropy.',
    seq: 'd4-sha256-conditioned-stuck-8bit',
    conditioned: true,
  },
]

export function d4Spec(id: string): D4DatasetSpec {
  const s = D4_DATASETS.find((d) => d.id === id)
  if (!s) throw new Error(`Unknown synthetic dataset ${id}`)
  return s
}

const DEVICE_LESSONS: Record<string, string> = {
  kv260: 'A real embedded noise source (CPU jitter) with a restart matrix.',
  'frdm-imx95': 'A real embedded noise source (CPU jitter) with a restart matrix.',
  'mac-m5max-native': 'Shared-host baseline; no restart matrix shipped — watch what that does.',
  'mac-orbstack-linux-vm':
    'The same Mac, virtualized: a different operating environment from the host.',
}

/** Build the case list from the manifest plus the synthetic D4 catalogue. */
export function buildLabCases(manifest: DeviceManifest): LabCase[] {
  const cases: LabCase[] = []
  for (const d of manifest.datasets) {
    if (d.kind === 'sequential') {
      const restartParity = manifest.comparisonOnly.find(
        (c) =>
          c.device === d.device &&
          c.kind === 'restart' &&
          c.parityId.includes(d.condition === 'idle' ? '-idle-' : `-${d.condition}-`)
      )
      cases.push({
        id: d.id,
        group: 'device',
        title: d.label,
        lesson: DEVICE_LESSONS[d.device] ?? 'Raw device noise samples.',
        provenance: 'device-raw-noise',
        bitsPerSymbol: d.bitsPerSymbol,
        sequential: { kind: 'device', datasetId: d.id },
        restart: d.pairedRestartId ? { kind: 'device', datasetId: d.pairedRestartId } : undefined,
        referenceRestartParityId: d.pairedRestartId ? undefined : restartParity?.parityId,
      })
    } else if (d.kind === 'contrast') {
      cases.push({
        id: d.id,
        group: 'contrast',
        title: d.label,
        lesson: 'DRBG output "passes" — and is still not evidence about a noise source.',
        provenance: 'conditioned-output-contrast',
        bitsPerSymbol: d.bitsPerSymbol,
        sequential: { kind: 'device', datasetId: d.id },
      })
    }
  }
  for (const s of SYNTHETIC_CASES) {
    cases.push({
      id: s.id,
      group: 'synthetic',
      title: `Synthetic: ${s.title}`,
      lesson: s.lesson,
      provenance: 'synthetic',
      bitsPerSymbol: d4Spec(s.seq).bitsPerSymbol,
      sequential: { kind: 'synthetic', d4Id: s.seq },
      restart: s.restart ? { kind: 'synthetic', d4Id: s.restart } : undefined,
      syntheticConditioned: s.conditioned,
    })
  }
  return cases
}

export function deviceDataset(manifest: DeviceManifest, id: string): DeviceDataset {
  const d = manifest.datasets.find((x) => x.id === id)
  if (!d) throw new Error(`Unknown device dataset ${id}`)
  return d
}

// ── Loading bytes ────────────────────────────────────────────────────────────

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice()))
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('')
}

export interface LoadedData {
  bytes: Uint8Array
  sha256: string
  /** Expected SHA-256 (manifest or the pinned D4 manifest), when one exists. */
  expectedSha256: string | null
}

export async function loadData(
  ref: DataRef,
  manifest: DeviceManifest,
  fetchImpl: typeof fetch = fetch
): Promise<LoadedData> {
  if (ref.kind === 'device') {
    const d = deviceDataset(manifest, ref.datasetId)
    const res = await fetchImpl(`/${d.file}`)
    if (!res.ok) throw new Error(`Could not load ${d.file} (HTTP ${res.status}).`)
    const bytes = new Uint8Array(await res.arrayBuffer())
    return { bytes, sha256: await sha256Hex(bytes), expectedSha256: d.sha256 }
  }
  const bytes = d4Spec(ref.d4Id).build()
  const sha = await sha256Hex(bytes)
  const pinned = Object.entries(manifest.nativeReference.bySha256).find(
    ([, e]) => e.parityId === ref.d4Id
  )
  return { bytes, sha256: sha, expectedSha256: pinned ? pinned[0] : null }
}

// ── Public ESV certificates (reference comparison) ───────────────────────────

export interface EsvCertificateRef {
  number: string
  implementation: string
  vendor: string
  version: string
  standard: string
  noiseSourceClassification: string
  /** Validation history dates as listed on the certificate page. */
  validationDates: string[]
  lab: string
  /** As listed on the certificate page (vetted conditioning / output). */
  listedOutput: string
  operatingEnvironments: string[]
  url: string
  publicUseDocument: string
  checked: string
}

/**
 * Each page was fetched and read on 2026-09-25 (UTC) with
 * pqctoday-priv/scripts/fetch_resilient.py, and each Public Use Document PDF
 * link resolved to a PDF the same day. Re-verify before relying on them.
 */
export const ESV_CERTIFICATES: EsvCertificateRef[] = [
  {
    number: 'E19',
    implementation: 'Kernel CPU Time Jitter RNG',
    vendor: 'SUSE LLC',
    version: '2.2.0',
    standard: 'SP 800-90B',
    noiseSourceClassification: 'Non-Physical',
    validationDates: ['2/13/2023', '7/15/2024'],
    lab: 'atsec information security corporation',
    listedOutput: '56.22 bits of entropy per 64-bit output',
    operatingEnvironments: [
      'SUSE Linux Enterprise Server 15 SP4 on Ampere Altra Q80-30',
      'SUSE Linux Enterprise Server 15 SP4 on AMD EPYC 7371',
      'SUSE Linux Enterprise Server 15 SP4 on IBM Z System z15',
      'SUSE Linux Enterprise Server 15 SP4 on Intel Xeon Silver 4215R',
      'SUSE Linux Enterprise Server 15 SP4 on PowerVM on IBM POWER10',
    ],
    url: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/19',
    publicUseDocument:
      'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/entropy/E19_PublicUse.pdf',
    checked: '2026-09-25',
  },
  {
    number: 'E200',
    implementation: 'Userspace Standalone CPU Time Jitter RNG',
    vendor: 'SUSE LLC',
    version: '3.4.0',
    standard: 'SP 800-90B',
    noiseSourceClassification: 'Non-Physical',
    validationDates: ['10/2/2024'],
    lab: 'atsec information security corporation',
    listedOutput: 'Full entropy, 256-bit output (vetted conditioning SHA3-256, CAVP A5411)',
    operatingEnvironments: [
      'SUSE Linux Enterprise Server 15 SP6 on AMD EPYC 7343',
      'SUSE Linux Enterprise Server 15 SP6 on Ampere Altra Q80-30',
      'SUSE Linux Enterprise Server 15 SP6 on IBM Z System Telum',
      'SUSE Linux Enterprise Server 15 SP6 on Intel Xeon Gold 5416S',
    ],
    url: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/200',
    publicUseDocument:
      'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/entropy/E200_PublicUse.pdf',
    checked: '2026-09-25',
  },
  {
    number: 'E280',
    implementation: 'AWS-LC CPU Jitter RNG Entropy Source',
    vendor: 'Amazon Web Services, Inc.',
    version: '3.6.3',
    standard: 'SP 800-90B',
    noiseSourceClassification: 'Non-Physical',
    validationDates: ['8/25/2025', '4/13/2026'],
    lab: 'atsec information security corporation',
    listedOutput:
      'Full entropy, 256-bit output (vetted conditioning SHA3-256, CAVP A6881 and A7962)',
    operatingEnvironments: [
      'Amazon Linux 2 / 2023 on EC2 m5dn.metal (Intel Xeon Platinum 8259CL)',
      'Amazon Linux 2 / 2023 on EC2 m7i.metal-24xl (Intel Xeon Platinum 8488C)',
      'Amazon Linux 2023 on EC2 c6i.metal (Intel Xeon Platinum 8375C)',
      'Amazon Linux 2023 on EC2 c7a.metal (AMD EPYC 4th Generation)',
      'Amazon Linux 2023 on EC2 r8g.metal-24xl (AWS Graviton4)',
    ],
    url: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/280',
    publicUseDocument:
      'https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/entropy/E280_PublicUse.pdf',
    checked: '2026-09-25',
  },
]
