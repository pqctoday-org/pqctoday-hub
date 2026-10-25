// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Evidence sidecar (F-6): everything PQC Today knows about a run that is NOT
 * part of the ACVP protocol response — engine identity, timestamps, per-test
 * dispositions, the unsupported list and the required disclaimers. It has its
 * own schema (schemas/evidence.v<N>.schema.json, selected by evidenceVersion in schemas/evidenceSchemas.ts) and never touches response.json.
 *
 * It carries NO vector payload: the prompt and response are identified by
 * SHA-256 only, so the sidecar can be shared without re-distributing
 * possibly-controlled lab data.
 */
import { evidenceSchemaForPlan, EXTENDED_EVIDENCE_VERSION } from './schemas/evidenceSchemas'
import type { AcvpPromptIR, JsonObject } from './ir'
import {
  PLAN_VERSION,
  PLAN_VERSION_EXTENDED,
  VENDOR_DEFINED_MECHANISMS,
  type CaseResult,
  type EngineIdentity,
  type InputKind,
} from './dispatch'
import type { GoldenComparison } from './compare'
import type { PinnedVectorSetSchema } from './schemas/registry'
import { validateAgainstSchema } from './schemaValidator'
import fixtureProvenance from './__fixtures__/nist-acvp-server/PROVENANCE.json'
// Relative, NOT the `@/` alias, and deliberately so: this module is on the
// import path of `scripts/acvp-respond.ts` and `scripts/acvp-xplat-compare.ts`,
// which run under `tsx`. tsx resolves path aliases from the ROOT
// `tsconfig.json`, and that file is a solution file — `{"files": [], "references": [...]}`
// with no `compilerOptions.paths`. The `@/*` -> `./src/*` mapping lives only in
// `tsconfig.app.json`, which tsx never reads, so a VALUE import via `@/` here
// dies at runtime with ERR_MODULE_NOT_FOUND. (Type-only `@/` imports survive
// because tsx erases them; see `src/services/acvp-xplat/compare.ts` for the
// same relative convention on this same CLI-reachable path.)
import { VALIDATION_DISCLAIMER } from '../../data/validationDisclaimer'

export const EVIDENCE_VERSION = 'pqctoday.acvp-evidence/2'

/**
 * Plan §2.2, first required disclaimer — verbatim.
 *
 * Re-exported from `src/data/validationDisclaimer`, not copied. Until 2026-09-26
 * this was a byte-identical literal copy of `VALIDATION_DISCLAIMER`: two
 * sources of truth for one required sentence, each with its own pinning test,
 * so an approved wording change would have had to land twice and a missed one
 * would have shipped two different "verbatim" disclaimers.
 */
export const DISCLAIMER_GENERAL = VALIDATION_DISCLAIMER

/** Plan §2.2, second required disclaimer (prompt import) — verbatim. */
export const DISCLAIMER_IMPORT =
  'Import and response generation do not submit results to NIST and do not establish validation. The laboratory or authorized submitter remains responsible for the ACVTS session and submission.'

/**
 * Third disclaimer of an evidence v3 document (extended plan profile only).
 * Wording approved by the owner on 24 October 2026.
 */
export const DISCLAIMER_TEST_INPUT =
  'Some answers in this run were produced with a test-only input (the random value m of ML-KEM encapsulation, which outside testing FIPS 203 has the module sample itself), with a value computed outside the engine, or from what the engine does when a key is imported. They are teaching evidence that the engine reproduces NIST\u2019s published values; they are not a validation and not an ACVTS response.'

export const PROTOTYPE_LABEL = 'ACVP-format compatible prototype'

export interface KnownFixture {
  repository: string
  commit: string
  upstreamPath: string
}

/** If the prompt bytes are one of the pinned public NIST samples, say which. */
export const identifyKnownFixture = (promptSha256: string): KnownFixture | null => {
  const hit = fixtureProvenance.files.find((f) => f.sha256 === promptSha256)
  return hit
    ? {
        repository: fixtureProvenance.repository,
        commit: fixtureProvenance.commit,
        upstreamPath: hit.upstreamPath,
      }
    : null
}

export interface EvidenceInput {
  ir: AcvpPromptIR
  schema: PinnedVectorSetSchema
  promptSha256: string
  responseSha256: string
  results: CaseResult[]
  engine: EngineIdentity
  codePath: 'browser' | 'cli'
  appVersion: string | null
  startedAt: string
  finishedAt: string
  goldenComparison?: GoldenComparison | null
  /** The plan the results come from; absent = the bounded plan (version 1). */
  planVersion?: string
}

const INPUT_KINDS: readonly InputKind[] = [
  'test-input-m',
  'computed-mu',
  'computed-ph',
  'key-import-result',
]

export const buildEvidence = (inp: EvidenceInput): JsonObject => {
  const planVersion = inp.planVersion ?? PLAN_VERSION
  const extended = planVersion === PLAN_VERSION_EXTENDED
  const count = (d: CaseResult['disposition']) =>
    inp.results.filter((r) => r.disposition === d).length

  // Collapse unsupported entries that share (tgId, scope, reason) into one row.
  const unsupported: JsonObject[] = []
  const idx = new Map<string, JsonObject>()
  for (const r of inp.results) {
    if (r.disposition !== 'unsupported') continue
    const key = `${r.tgId}|${r.scope}|${r.reason}`
    const row = idx.get(key)
    if (row) (row.tcIds as number[]).push(r.tcId)
    else {
      const fresh: JsonObject = {
        tgId: r.tgId,
        scope: r.scope ?? 'test',
        reason: r.reason ?? '',
        tcIds: [r.tcId],
      }
      idx.set(key, fresh)
      unsupported.push(fresh)
    }
  }

  // Every vendor-defined (non-PKCS#11-v3.2) mechanism a case was dispatched to.
  const vendorRows: JsonObject[] = []
  for (const [name, meta] of Object.entries(VENDOR_DEFINED_MECHANISMS)) {
    const hits = inp.results.filter((r) => r.mechanism === name)
    if (hits.length === 0 || !meta) continue
    vendorRows.push({
      name,
      value: meta.value,
      source: meta.source,
      tgIds: [...new Set(hits.map((r) => r.tgId))],
      answered: hits.filter((r) => r.disposition === 'answered').length,
    })
  }

  const fixture = identifyKnownFixture(inp.promptSha256)
  const evidence: JsonObject = {
    evidenceVersion: extended ? EXTENDED_EVIDENCE_VERSION : EVIDENCE_VERSION,
    label: PROTOTYPE_LABEL,
    disclaimers: extended
      ? [DISCLAIMER_GENERAL, DISCLAIMER_IMPORT, DISCLAIMER_TEST_INPUT]
      : [DISCLAIMER_GENERAL, DISCLAIMER_IMPORT],
    evidenceClass: fixture ? 'nist-acvp-reference-sample' : 'unverified-imported-vector-set',
    generator: {
      name: 'PQC Today Hub — ACVP-format import/response export',
      codePath: inp.codePath,
      appVersion: inp.appVersion,
      irVersion: inp.ir.irVersion,
    },
    prompt: {
      sha256: inp.promptSha256,
      knownPublicFixture: fixture ? { ...fixture } : null,
      framing: inp.ir.framing,
      acvVersion: inp.ir.acvVersion,
      vsId: inp.ir.vsId,
      algorithm: inp.schema.algorithm,
      mode: inp.schema.mode,
      revision: inp.schema.revision,
      isSample: typeof inp.ir.vectorSet.isSample === 'boolean' ? inp.ir.vectorSet.isSample : null,
      pinnedSchema: {
        id: inp.schema.id,
        promptSchemaFile: inp.schema.promptSchemaFile,
        responseSchemaFile: inp.schema.responseSchemaFile,
        specRepository: inp.schema.specSource.repository,
        specCommit: inp.schema.specSource.commit,
        specDocument: inp.schema.specSource.document,
      },
    },
    response: { fileName: 'response.json', sha256: inp.responseSha256 },
    engine: { ...inp.engine },
    startedAt: inp.startedAt,
    finishedAt: inp.finishedAt,
    summary: {
      testCases: inp.results.length,
      answered: count('answered'),
      unsupported: count('unsupported'),
      error: count('error'),
      ...(extended
        ? {
            // `standard` = no special input. It still includes the answers that used the
            // vendor-defined external-μ mechanism with the prompt's own μ; readers that need
            // the mechanism split use countAnswerKinds (answerKinds.ts) on the cases.
            byInputKind: {
              standard: inp.results.filter((r) => r.disposition === 'answered' && !r.inputKind)
                .length,
              ...Object.fromEntries(
                INPUT_KINDS.map((k) => [
                  k,
                  inp.results.filter((r) => r.disposition === 'answered' && r.inputKind === k)
                    .length,
                ])
              ),
            },
          }
        : {}),
    },
    cases: inp.results.map((r) => {
      const c: JsonObject = { tgId: r.tgId, tcId: r.tcId, disposition: r.disposition }
      if (r.reason !== undefined) c.reason = r.reason
      if (r.detail !== undefined) c.detail = r.detail
      if (r.mechanism !== undefined) {
        c.mechanism = r.mechanism
        c.mechanismKind = VENDOR_DEFINED_MECHANISMS[r.mechanism]
          ? 'vendor-defined'
          : r.mechanism === 'CKM_HASH_ML_DSA'
            ? // The extended plan uses the generic mechanism only for SHA-512/t, a v3.3 working-draft allowance.
              'pkcs11-v3.3-draft'
            : 'pkcs11-v3.2'
      }
      if (extended && r.inputKind !== undefined) c.inputKind = r.inputKind
      return c
    }),
    vendorDefinedMechanisms: vendorRows,
    unsupported,
    goldenComparison: inp.goldenComparison
      ? {
          matched: inp.goldenComparison.matched,
          mismatched: inp.goldenComparison.mismatched.length,
          unanswered: inp.goldenComparison.unanswered,
          unexpected: inp.goldenComparison.unexpected.length,
          expectedTotal: inp.goldenComparison.expectedTotal,
        }
      : null,
  }

  const diagnostics = validateAgainstSchema(evidenceSchemaForPlan(planVersion), evidence)
  if (diagnostics.length > 0) {
    throw new Error(
      `internal: evidence violates its schema: ${diagnostics.map((d) => `${d.path} ${d.reason}`).join('; ')}`
    )
  }
  return evidence
}
