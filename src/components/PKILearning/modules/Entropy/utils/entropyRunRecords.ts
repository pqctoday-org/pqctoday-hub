// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Run records (run manifests) for the Entropy module's researcher tools:
 * the SP 800-90A DRBG known-answer check, the Entropy Testing primitive
 * self-checks, Source Combining and the Entropy Evidence Lab.
 *
 * Each builder turns one run's own results into a `pqctoday.run-manifest/2`
 * record (see `@/services/runManifest`). Nothing is uploaded; full test
 * vectors are not embedded — long outputs are recorded as SHA-256 digests.
 */
import { buildRunManifest, type RunCase, type RunManifest } from '@/services/runManifest'
import type { KATResult, KatTestSpec } from '@/utils/katRunner'
import type { TestResult } from './entropyTests'
import type { KatRun, KatVectorSource } from './drbgKatRun'

// ── Tool versions (must equal the workshopRegistry entries; pinned by tests) ──

export const DRBG_TOOL = { id: 'drbg-demo', title: 'SP 800-90A DRBG', version: '1.0.4' }
export const ENTROPY_TESTING_TOOL = {
  id: 'entropy-test',
  title: 'Entropy Testing',
  version: '1.0.4',
}
export const SOURCE_COMBINING_TOOL = {
  id: 'source-combining',
  title: 'Source Combining',
  version: '1.0.3',
}
/** The Evidence Lab is a Learn workshop step, not a Playground tool: it carries the Entropy module's version. */
export const EVIDENCE_LAB_TOOL_ID = 'entropy-evidence-lab'
export const EVIDENCE_LAB_TITLE = 'Entropy Evidence Lab (SP 800-90B)'

// ── DRBG known-answer check ──────────────────────────────────────────────────

/** Path of the pinned vector file in the site's public source repository. */
export const DRBG_KAT_FILE_PATH =
  'src/components/PKILearning/modules/Entropy/utils/hmacDrbgSha256.kat.json'

/**
 * SHA-256 of the pinned vector file's bytes as committed. The page imports
 * the file as parsed JSON, so the served bytes cannot be hashed at run time;
 * this digest is of the file at the site commit named in the record, and a
 * unit test recomputes it from the file on disk.
 */
export const DRBG_KAT_FILE_SHA256 =
  '266d70080bf5f3a633ee05e29bc3d0d66cf33219934c0b3499b5782f45544b80'

const SOURCE_REPO = 'https://github.com/pqctoday-org/pqctoday-hub'

export const DRBG_LIMITATIONS = [
  'A vector match is not a CAVP/ACVP validation: it shows this browser code computes SP 800-90A Rev. 1 HMAC_DRBG (SHA-256) correctly for these inputs only.',
  'Not an entropy-source test: it says nothing about the quality of any entropy input.',
  'The vectors are a 16-case subset of the NIST ACVP-Server and CAVP files (SHA-256 only); other hash functions and DRBG mechanisms were not run.',
]

async function sha256Hex(hex: string): Promise<string> {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return Array.from(d, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** A long hex output as "sha256:<digest> (<n> bytes)". */
async function digestOf(hex: string): Promise<string> {
  return `sha256:${await sha256Hex(hex)} (${hex.length / 2} bytes)`
}

function describeSource(s: KatVectorSource) {
  return {
    id: s.id,
    producer: s.producer,
    ...(s.repository ? { repository: s.repository } : {}),
    ...(s.commit ? { commit: s.commit } : {}),
    ...(s.url ? { url: s.url } : {}),
    ...(s.zipSha256 ? { zipSha256: s.zipSha256 } : {}),
    files: s.files.map((f) => ({
      path: f.upstreamPath ?? f.path ?? '',
      ...(f.sourceUrl ? { url: f.sourceUrl } : {}),
      sha256: f.sha256,
    })),
  }
}

/** Run record for one DRBG known-answer check (16 vectors + one-bit negative controls). */
export async function drbgRunManifest(
  run: KatRun,
  site?: RunManifest['site'],
  userAgent?: string
): Promise<RunManifest> {
  const cases: RunCase[] = []
  for (const o of run.outcomes) {
    cases.push({
      id: o.id,
      expected: await digestOf(o.expected),
      actual: await digestOf(o.actual),
      pass: o.passed,
    })
  }
  const commit = site?.commit
  return buildRunManifest(
    {
      tool: DRBG_TOOL,
      executionMode: 'in-browser-implementation',
      inputs: {
        mechanism: 'HMAC_DRBG',
        hash: 'SHA-256',
        specification: 'NIST SP 800-90A Rev. 1 §10.1.2',
        comparison: 'byte-for-byte equality of the last generate output with the published answer',
        vectorFile: DRBG_KAT_FILE_PATH,
        upstreamSources: run.sources.map(describeSource),
        negativeControlBases: [...new Set(run.sabotage.map((v) => v.caseId))],
        negativeControlRule:
          'flip the least-significant bit of the first byte of one input; the output must no longer match',
      },
      vectors: {
        source:
          'NIST ACVP-Server hmacDRBG-1.0 sample set and NIST CAVP HMAC_DRBG.rsp (SHA-256 subset pinned in the site source)',
        url: `${SOURCE_REPO}/blob/${commit || 'main'}/${DRBG_KAT_FILE_PATH}`,
        sha256: DRBG_KAT_FILE_SHA256,
        count: run.outcomes.length,
      },
      cases,
      negativeControls: run.sabotage.map((v) => ({
        id: `${v.caseId}: ${v.input}`,
        mutation: `one bit flipped in the ${v.input}; ${v.matched ? 'output still matched' : 'output no longer matches'}`,
        pass: !v.matched,
      })),
      limitations: DRBG_LIMITATIONS,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
    },
    site,
    userAgent
  )
}

// ── Entropy Testing: primitive self-checks ───────────────────────────────────

export const ENTROPY_TESTING_LIMITATIONS = [
  'Primitive self-checks only; not an SP 800-90B entropy estimate.',
  'The SHA-256 and HMAC checks show the hash and MAC code computes the published answers; they are not entropy-source or RBG tests.',
  'Sample checks, when included, are run on at most a few hundred bytes: they can catch gross failures but cannot show a source is good.',
]

export interface EntropyTestingRunInput {
  specs: KatTestSpec[]
  results: KATResult[]
  startedAt: string
  finishedAt: string
  /** The sample checks shown on the page, when the learner ran them. */
  sample?: { label: string; lengthBytes: number; visual: TestResult[]; health: TestResult[] }
}

const resultRow = (r: TestResult) => ({
  name: r.name,
  value: r.value,
  cutoff: r.threshold,
  withinCutoff: r.passed,
  limit: r.sampleLimit,
})

/** Run record for the Entropy Testing primitive self-checks (SHA-256, HMAC-SHA-256/512). */
export function entropyTestingRunManifest(
  i: EntropyTestingRunInput,
  site?: RunManifest['site'],
  userAgent?: string
): RunManifest {
  return buildRunManifest(
    {
      tool: ENTROPY_TESTING_TOOL,
      executionMode: 'in-browser-implementation',
      inputs: {
        engine: 'SoftHSM v3 compiled to WebAssembly, called through PKCS#11',
        selfChecks: i.specs.map((s) => ({
          id: s.id,
          useCase: s.useCase,
          standard: s.standard,
          referenceUrl: s.referenceUrl,
        })),
        ...(i.sample
          ? {
              sampleChecks: {
                sample: i.sample.label,
                lengthBytes: i.sample.lengthBytes,
                note: 'Shown as separate groups and never totalled; none of them is an entropy estimate.',
                visualization: i.sample.visual.map(resultRow),
                healthTests: i.sample.health.map(resultRow),
              },
            }
          : {}),
      },
      cases: i.results.map((r) => ({
        id: r.id,
        expected: `${r.algorithm}: published answer (${r.standard})`,
        actual: `${r.status}${r.details ? ` — ${r.details}` : ''}`,
        // A skipped check was not run: it is never a pass.
        pass: r.status === 'pass',
      })),
      limitations: ENTROPY_TESTING_LIMITATIONS,
      startedAt: i.startedAt,
      finishedAt: i.finishedAt,
    },
    site,
    userAgent
  )
}

// ── Source Combining ─────────────────────────────────────────────────────────

export const SOURCE_COMBINING_LIMITATIONS = [
  'The noise sources are simulated in the browser; no physical entropy source was sampled.',
  'Not a validation: the verdict judges the stated assumptions only, and is not an SP 800-90B, SP 800-90C, ESV or CMVP result.',
  'Health tests run on one short simulated recording per source; passing them does not show a source is good.',
]

export interface SourceCombiningRunInput {
  scenario: string
  sources: Array<{
    name: string
    condition: string
    failed: boolean
    includedInRequest: boolean
    startup: TestResult[]
    continuous: TestResult[]
  }>
  assumptions: Record<string, string>
  combination: string
  conditioning: string
  seedPath: string
  entropyAccount: { creditedInputBits: number; seedEntropyBits: number }
  conditionedOutputChecks: TestResult[] | null
  verdict: { id: string; label: string; reasons: string[] }
  startedAt: string
  finishedAt: string
}

/** Run record for the Source Combining construction check. */
export function sourceCombiningRunManifest(
  i: SourceCombiningRunInput,
  site?: RunManifest['site'],
  userAgent?: string
): RunManifest {
  const cases: RunCase[] = []
  for (const s of i.sources) {
    for (const [phase, results] of [
      ['startup', s.startup],
      ['continuous', s.continuous],
    ] as const) {
      for (const r of results) {
        cases.push({
          id: `${s.name} ${phase} health test: ${r.name}`,
          expected: `within cutoff ${r.threshold}`,
          actual: `${r.value}`,
          pass: r.passed,
        })
      }
    }
  }
  for (const r of i.conditionedOutputChecks ?? []) {
    cases.push({
      id: `Conditioned output check: ${r.name}`,
      expected: `within cutoff ${r.threshold}`,
      actual: `${r.value}`,
      pass: r.passed,
    })
  }
  return buildRunManifest(
    {
      tool: SOURCE_COMBINING_TOOL,
      executionMode: 'simulation',
      inputs: {
        scenario: i.scenario,
        sources: i.sources.map((s) => ({
          name: s.name,
          condition: s.condition,
          failedHealthTests: s.failed,
          includedInRequest: s.includedInRequest,
        })),
        assumptions: i.assumptions,
        combination: i.combination,
        conditioning: i.conditioning,
        seedPath: i.seedPath,
        entropyAccount: i.entropyAccount,
        verdict: i.verdict,
      },
      cases,
      limitations: SOURCE_COMBINING_LIMITATIONS,
      startedAt: i.startedAt,
      finishedAt: i.finishedAt,
    },
    site,
    userAgent
  )
}

// ── Entropy Evidence Lab ─────────────────────────────────────────────────────

export const EVIDENCE_LAB_LIMITATIONS = [
  'Estimator output for this dataset under its recorded conditions only.',
  'Not an ESV submission, lab analysis, CMVP review or certificate.',
]

export interface EvidenceLabRunInput {
  integrityIssues?: string[]
  moduleVersion: string
  /** The lab's evidence export, kept as it was (schema pqctoday.entropy.evidence-lab-export/1). */
  evidence: Record<string, unknown> & {
    case: { id: string; title: string; provenance: string }
  }
  sequential: { ran: boolean; ok: boolean; h: number | null; hashConfirmedByTool: boolean }
  nativeReference: { sequential: { matches: boolean; identical: number; compared: number } | null }
  restart: { status: string; message: string } | null
  learnerCheck: { ok: boolean; message: string } | null
  conclusion: { verdict: string; label: string; limits: string[] } | null
  startedAt: string
  finishedAt: string
}

/** Run record for the Entropy Evidence Lab: its evidence export, with site and runtime provenance. */
export function evidenceLabRunManifest(
  i: EvidenceLabRunInput,
  site?: RunManifest['site'],
  userAgent?: string
): RunManifest {
  const cases: RunCase[] = []
  if (i.integrityIssues?.length) {
    cases.push({
      id: 'result integrity and consistency',
      expected: 'no failed file-identity, reference or estimate-consistency checks',
      actual: i.integrityIssues.join(' '),
      pass: false,
    })
  }
  if (i.sequential.ran) {
    cases.push({
      id: 'sequential estimator run',
      expected: 'tool completed without error',
      actual: i.sequential.ok
        ? `completed; min-entropy ${i.sequential.h ?? 'n/a'} bits per sample`
        : 'tool reported an error',
      pass: i.sequential.ok,
    })
    cases.push({
      id: 'dataset hash confirmed by the tool',
      expected: "the tool's SHA-256 of its input equals the dataset's published SHA-256",
      actual: i.sequential.hashConfirmedByTool ? 'confirmed' : 'not confirmed',
      pass: i.sequential.hashConfirmedByTool,
    })
  }
  const ref = i.nativeReference.sequential
  if (ref) {
    cases.push({
      id: 'matches pinned native NIST tool result',
      expected: 'every compared field bit-identical',
      actual: `${ref.identical}/${ref.compared} fields identical`,
      pass: ref.matches,
    })
  }
  if (i.restart) {
    cases.push({
      id: 'restart tests (SP 800-90B §3.1.4)',
      expected: 'passed',
      actual: `${i.restart.status} — ${i.restart.message}`,
      pass: i.restart.status === 'passed',
    })
  }
  if (i.learnerCheck) {
    cases.push({
      id: 'learner conclusion',
      expected: 'no stronger than the evidence supports',
      actual: i.learnerCheck.message,
      pass: i.learnerCheck.ok,
    })
  }
  return buildRunManifest(
    {
      tool: { id: EVIDENCE_LAB_TOOL_ID, title: EVIDENCE_LAB_TITLE, version: i.moduleVersion },
      executionMode: 'in-browser-implementation',
      inputs: i.evidence,
      cases,
      limitations: [...EVIDENCE_LAB_LIMITATIONS, ...(i.conclusion?.limits ?? [])],
      startedAt: i.startedAt,
      finishedAt: i.finishedAt,
    },
    site,
    userAgent
  )
}
