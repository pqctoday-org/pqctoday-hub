// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-case-evidence — the per-case evidence records the Playground
 * workbench, the Algorithms KAT view and the Learn KAT panels render (plan
 * WS-I). Joins the reviewed vector manifest with the static test registry, so
 * a case carries the SAME class, source, parameters and limitations on every
 * surface, and no UI infers provenance from a producer string.
 *
 *   npx tsx scripts/generate-case-evidence.ts          # (re)write both files
 *   npx tsx scripts/generate-case-evidence.ts --check  # exit 1 if stale (gate)
 *
 * Outputs (deterministic, no timestamps, listed in .prettierignore):
 *   src/data/validation/case-evidence.acvp.generated.json — useAcvpSuite rows,
 *     indexed by row-id template
 *   src/data/validation/case-evidence.kat.generated.json  — katRunner cases,
 *     indexed by KatKind key (caseEvidence.katKindKey)
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { TEST_REGISTRY } from '../src/data/validation/testRegistry'
import { caseKeyOf, type RegisteredTest } from '../src/data/validation/coverageModel'
import {
  CASE_EVIDENCE_SCHEMA,
  katKindKey,
  type CaseEvidenceFile,
  type CaseEvidenceRecord,
  type CaseParamValue,
} from '../src/data/validation/caseEvidence'
import type {
  ValidationCaseManifest,
  VectorFileEntry,
} from '../src/data/validation/validationCaseManifest'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST_REL = 'src/data/validation/vector-manifest.json'
export const ACVP_OUT_REL = 'src/data/validation/case-evidence.acvp.generated.json'
export const KAT_OUT_REL = 'src/data/validation/case-evidence.kat.generated.json'

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

const sortKeys = <T>(o: Record<string, T>): Record<string, T> =>
  Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))

const GAP_TEXT: Record<string, string> = {
  'oracle-version-not-recorded':
    'The oracle version that produced the expected value is not recorded.',
  'generator-script-not-in-repo':
    'The script that generated the expected value is not in the repository.',
  'source-document-hash-not-recorded': 'The source document hash is not recorded.',
  'retrieval-date-not-recorded': 'The source retrieval date is not recorded.',
}

function manifestRecordParts(
  file: VectorFileEntry,
  caseId: string
): Pick<
  CaseEvidenceRecord,
  'algorithm' | 'operation' | 'testType' | 'parameters' | 'upstream' | 'source' | 'limitations'
> {
  const c = file.cases.find((k) => k.caseId === caseId)
  if (!c) throw new Error(`${caseId} is not in ${file.id}`)
  const limitations: string[] = []
  for (const l of file.lineage.filter((x) => x.appliesTo.includes(caseId))) {
    limitations.push(`Upstream: ${l.upstreamOperation} → executed here: ${l.localOperation}`)
    for (const t of l.transformations) limitations.push(`${t.type}: ${t.detail}`)
  }
  for (const g of file.publishabilityGaps) limitations.push(GAP_TEXT[g] ?? g) // eslint-disable-line security/detect-object-injection
  if (file.source.oracle)
    limitations.push(
      `Oracle: ${file.source.oracle.name}${file.source.oracle.version ? ` ${file.source.oracle.version}` : ' (version not recorded)'}`
    )
  if (c.statusReason) limitations.push(c.statusReason)
  const url = file.source.nist?.url ?? file.source.url ?? undefined
  const revision = file.source.nist?.revision ?? file.source.revision ?? undefined
  return {
    algorithm: [c.algorithm.name, c.algorithm.revision].filter(Boolean).join(' '),
    operation: c.operation,
    testType: c.testType,
    parameters: { ...c.parameters },
    ...(c.upstream ? { upstream: { ...c.upstream } } : {}),
    source: {
      citation: file.source.citation,
      ...(url ? { url } : {}),
      ...(revision ? { revision } : {}),
    },
    limitations,
  }
}

export function buildCaseEvidence(
  manifest: ValidationCaseManifest,
  registry: RegisteredTest[],
  inputs: CaseEvidenceFile['inputs']
): { acvp: CaseEvidenceFile; kat: CaseEvidenceFile } {
  const fileOf = (caseId: string) => manifest.files.find((f) => f.id === caseId.split('#')[0])
  const out = {
    acvp: {
      records: {} as Record<string, CaseEvidenceRecord>,
      index: {} as Record<string, string[]>,
    },
    kat: {
      records: {} as Record<string, CaseEvidenceRecord>,
      index: {} as Record<string, string[]>,
    },
  }
  for (const t of registry) {
    if (t.runner !== 'useAcvpSuite' && t.runner !== 'katRunner') continue
    const target = t.runner === 'useAcvpSuite' ? out.acvp : out.kat
    for (const c of t.cases) {
      const id = `${t.id}#${caseKeyOf(c)}`
      const local = c.caseId.startsWith('local:')
      const file = local ? undefined : fileOf(c.caseId)
      if (!local && !file) throw new Error(`${id}: ${c.caseId} is not in the vector manifest`)
      const fromManifest = file ? manifestRecordParts(file, c.caseId) : undefined
      const limitations = (fromManifest?.limitations ?? []).map((l) =>
        c.operation && l.startsWith('Upstream: ')
          ? `${l.replace(/ → executed here: .*/, '')} → executed here: ${c.operation} (the workbench runs this case as ${fromManifest?.operation ?? '—'})`
          : l
      )
      if (c.evidenceClass === 'functional-round-trip' && local)
        limitations.push(
          'No external expected value: the output is checked only by the same or a paired implementation.'
        )
      if (c.note) limitations.push(c.note)
      if (t.note) limitations.push(t.note)
      const parameters: Record<string, CaseParamValue> = {
        ...(fromManifest?.parameters ?? {}),
        ...((c.parameters ?? {}) as Record<string, CaseParamValue>),
      }
      const source = fromManifest?.source ?? (c.source ? { ...c.source } : undefined)
      const rec: CaseEvidenceRecord = {
        id,
        test: t.id,
        title: t.title,
        runner: t.runner,
        engines: [...t.engines],
        caseId: c.caseId,
        evidenceClass: c.evidenceClass,
        polarity: c.polarity === 'negative' ? 'negative' : 'positive',
        ...(fromManifest?.algorithm ? { algorithm: fromManifest.algorithm } : {}),
        ...((c.operation ?? fromManifest?.operation)
          ? { operation: c.operation ?? fromManifest?.operation }
          : {}),
        ...(fromManifest?.testType ? { testType: fromManifest.testType } : {}),
        parameters: sortKeys(parameters),
        ...(fromManifest?.upstream ? { upstream: fromManifest.upstream } : {}),
        ...(source ? { source } : {}),
        exercises: c.exercises.map((e) =>
          [
            e.capability.mechanism,
            e.capability.operation,
            e.capability.parameterSet,
            e.capability.variant,
          ]
            .filter(Boolean)
            .join(' ')
        ),
        limitations,
      }
      target.records[id] = rec // eslint-disable-line security/detect-object-injection
      const key =
        t.runner === 'useAcvpSuite' ? c.rowId : c.katKind ? katKindKey(c.katKind) : undefined
      if (key) target.index[key] = [...(target.index[key] ?? []), id] // eslint-disable-line security/detect-object-injection
    }
  }
  const finish = (x: typeof out.acvp): CaseEvidenceFile => ({
    schema: CASE_EVIDENCE_SCHEMA,
    inputs,
    records: sortKeys(x.records),
    index: sortKeys(
      Object.fromEntries(Object.entries(x.index).map(([k, v]) => [k, [...v].sort()]))
    ),
  })
  const files = Object.fromEntries(
    manifest.files
      .map((f) => [
        f.path.replace(/^src\/data\//, ''),
        f.status === 'active' && f.evidenceClass !== 'unverified' ? f.evidenceClass : 'unverified',
      ])
      .sort(([a], [b]) => a.localeCompare(b))
  ) as CaseEvidenceFile['files']
  return { acvp: finish(out.acvp), kat: { ...finish(out.kat), files } }
}

function main() {
  const check = process.argv.includes('--check')
  const manifestText = fs.readFileSync(path.join(ROOT, MANIFEST_REL), 'utf8')
  const manifest = JSON.parse(manifestText) as ValidationCaseManifest
  const inputs = {
    manifestSha256: sha256(JSON.stringify(manifest)),
    registrySha256: sha256(
      JSON.stringify(TEST_REGISTRY.map((t) => [t.id, t.title, t.note, t.engines, t.cases]))
    ),
  }
  const { acvp, kat } = buildCaseEvidence(manifest, TEST_REGISTRY, inputs)
  let stale = false
  for (const [rel, data] of [
    [ACVP_OUT_REL, acvp],
    [KAT_OUT_REL, kat],
  ] as const) {
    const text = JSON.stringify(data, null, 2) + '\n'
    const abs = path.join(ROOT, rel)
    const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : ''
    if (check) {
      if (current !== text) {
        console.error(`[gen:case-evidence] ✗ ${rel} is stale — run npm run gen:case-evidence`)
        stale = true
      }
    } else if (current !== text) fs.writeFileSync(abs, text)
  }
  if (stale) process.exit(1)
  console.log(
    `[gen:case-evidence] ${check ? 'OK — outputs current' : 'wrote outputs'} (${Object.keys(acvp.records).length} workbench cases / ${Object.keys(acvp.index).length} row templates, ${Object.keys(kat.records).length} katRunner cases / ${Object.keys(kat.index).length} kinds)`
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
