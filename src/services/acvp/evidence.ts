// SPDX-License-Identifier: GPL-3.0-only
/**
 * Evidence sidecar (F-6): everything PQC Today knows about a run that is NOT
 * part of the ACVP protocol response — engine identity, timestamps, per-test
 * dispositions, the unsupported list and the required disclaimers. It has its
 * own schema (schemas/evidence.schema.json) and never touches response.json.
 *
 * It carries NO vector payload: the prompt and response are identified by
 * SHA-256 only, so the sidecar can be shared without re-distributing
 * possibly-controlled lab data.
 */
import evidenceSchema from './schemas/evidence.schema.json'
import type { AcvpPromptIR, JsonObject } from './ir'
import { VENDOR_DEFINED_MECHANISMS, type CaseResult, type EngineIdentity } from './dispatch'
import type { GoldenComparison } from './compare'
import type { PinnedVectorSetSchema } from './schemas/registry'
import { validateAgainstSchema } from './schemaValidator'
import fixtureProvenance from './__fixtures__/nist-acvp-server/PROVENANCE.json'

export const EVIDENCE_VERSION = 'pqctoday.acvp-evidence/1'

/** Plan §2.2, first required disclaimer — verbatim. */
export const DISCLAIMER_GENERAL =
  'PQC Today executes selected public reference vectors, standards tests, conformance cases, and implementation probes. A passing result is evidence only for the identified test, operation, parameters, implementation build, and target. It is not an ACVTS verdict, a CAVP/CMVP certificate, or proof of exhaustive conformance.'

/** Plan §2.2, second required disclaimer (prompt import) — verbatim. */
export const DISCLAIMER_IMPORT =
  'Import and response generation do not submit results to NIST and do not establish validation. The laboratory or authorized submitter remains responsible for the ACVTS session and submission.'

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
}

export const buildEvidence = (inp: EvidenceInput): JsonObject => {
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
    evidenceVersion: EVIDENCE_VERSION,
    label: PROTOTYPE_LABEL,
    disclaimers: [DISCLAIMER_GENERAL, DISCLAIMER_IMPORT],
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
    },
    cases: inp.results.map((r) => {
      const c: JsonObject = { tgId: r.tgId, tcId: r.tcId, disposition: r.disposition }
      if (r.reason !== undefined) c.reason = r.reason
      if (r.detail !== undefined) c.detail = r.detail
      if (r.mechanism !== undefined) {
        c.mechanism = r.mechanism
        c.mechanismKind = VENDOR_DEFINED_MECHANISMS[r.mechanism] ? 'vendor-defined' : 'pkcs11-v3.2'
      }
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

  const diagnostics = validateAgainstSchema(evidenceSchema as Record<string, unknown>, evidence)
  if (diagnostics.length > 0) {
    throw new Error(
      `internal: evidence violates its schema: ${diagnostics.map((d) => `${d.path} ${d.reason}`).join('; ')}`
    )
  }
  return evidence
}
