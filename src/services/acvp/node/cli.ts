// SPDX-License-Identifier: GPL-3.0-only
/**
 * `acvp-respond` CLI core (F-8). Entry point: scripts/acvp-respond.ts.
 *
 *   npx tsx scripts/acvp-respond.ts --prompt p.json --engine cpp|rust --out dir
 *        [--expected expectedResults.json] [--no-evidence] [--emit-bundle dir]
 *
 * Uses the SAME parser / dispatch / engine adapter / serializer as the browser
 * panel (../run.ts, ../engine.ts); only engine loading (./loadEngines.ts) and
 * file I/O are Node-specific. Local only: reads and writes files, makes no
 * network request, holds no ACVTS credential.
 *
 * --emit-bundle writes a language-neutral fixture bundle for non-JS runners
 * (e.g. the planned Python/ctypes board runner): prompt.json (verbatim bytes),
 * ir.json, plan.json, response.json, [expectedResults.json], manifest.json
 * (SHA-256 of every file + canonical-JSON SHA-256 of ir/plan/response).
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { canonicalJson, sha256Hex } from '../ir'
import { createPkcs11Engine } from '../engine'
import { executePrepared, preparePrompt } from '../run'
import { loadEngineNode, type EngineId } from './loadEngines'

export interface CliArgs {
  prompt: string
  engine: EngineId
  out: string
  expected?: string
  evidence: boolean
  emitBundle?: string
}

export const USAGE =
  'usage: acvp-respond --prompt <prompt.json> --engine cpp|rust --out <dir> [--expected <expectedResults.json>] [--no-evidence] [--emit-bundle <dir>]'

export const parseCliArgs = (argv: string[]): CliArgs => {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    if (i === -1) return undefined
    const v = argv[i + 1]
    if (v === undefined || v.startsWith('--')) throw new Error(`${flag} needs a value\n${USAGE}`)
    return v
  }
  const prompt = get('--prompt')
  const engine = get('--engine')
  const out = get('--out')
  if (!prompt || !engine || !out) throw new Error(USAGE)
  if (engine !== 'cpp' && engine !== 'rust')
    throw new Error(`--engine must be cpp or rust\n${USAGE}`)
  return {
    prompt,
    engine,
    out,
    expected: get('--expected'),
    evidence: !argv.includes('--no-evidence'),
    emitBundle: get('--emit-bundle'),
  }
}

export interface CliResult {
  exitCode: number
  summary: string
  responsePath?: string
  evidencePath?: string
}

const appVersion = (repoRoot: string): string | null => {
  try {
    return (
      (
        JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
          version?: string
        }
      ).version ?? null
    )
  } catch {
    return null
  }
}

export const runCli = async (args: CliArgs, repoRoot: string): Promise<CliResult> => {
  const promptText = readFileSync(args.prompt, 'utf8')
  const prepared = await preparePrompt(promptText)
  if (!prepared.ok) {
    const lines = prepared.diagnostics.map((d) => `  ${d.path}: [${d.keyword}] ${d.reason}`)
    return { exitCode: 2, summary: `[acvp-respond] prompt rejected:\n${lines.join('\n')}` }
  }

  const { module, identity } = await loadEngineNode(repoRoot, args.engine)
  const engine = createPkcs11Engine(module, identity)
  let run
  try {
    run = await executePrepared(prepared, {
      engine,
      codePath: 'cli',
      appVersion: appVersion(repoRoot),
      expectedText: args.expected ? readFileSync(args.expected, 'utf8') : undefined,
    })
  } finally {
    engine.close()
  }

  mkdirSync(args.out, { recursive: true })
  const responsePath = path.join(args.out, 'response.json')
  writeFileSync(responsePath, run.response.text)
  let evidencePath: string | undefined
  if (args.evidence) {
    evidencePath = path.join(args.out, 'evidence.json')
    writeFileSync(evidencePath, run.evidenceText)
  }

  if (args.emitBundle) {
    const dir = args.emitBundle
    mkdirSync(dir, { recursive: true })
    const files: Record<string, string> = {}
    const put = (name: string, text: string) => {
      writeFileSync(path.join(dir, name), text)
      files[name] = text
    }
    copyFileSync(args.prompt, path.join(dir, 'prompt.json'))
    files['prompt.json'] = promptText
    put('ir.json', `${JSON.stringify(prepared.ir, null, 2)}\n`)
    put('plan.json', `${JSON.stringify(prepared.plan, null, 2)}\n`)
    put('response.json', run.response.text)
    if (args.expected) put('expectedResults.json', readFileSync(args.expected, 'utf8'))
    const sha: Record<string, string> = {}
    for (const [name, text] of Object.entries(files)) sha[name] = await sha256Hex(text)
    const manifest = {
      bundleVersion: 'pqctoday.acvp-bundle/1',
      schemaId: prepared.ir.schemaId,
      vsId: prepared.ir.vsId,
      producedBy: { engine: identity.id, artifactSha256: identity.artifactSha256 },
      files: sha,
      canonicalSha256: {
        ir: await sha256Hex(canonicalJson(prepared.ir)),
        plan: await sha256Hex(canonicalJson(prepared.plan)),
        response: await sha256Hex(canonicalJson(run.response.document)),
      },
      canonicalJson:
        'keys sorted, no whitespace — Python: json.dumps(o, sort_keys=True, separators=(",", ":"))',
      rules: {
        promptToIr: 'src/services/acvp/ir.ts P1–P6',
        irToPlan: 'src/services/acvp/dispatch.ts D1–D7',
        response: 'src/services/acvp/response.ts R1–R5',
      },
      note: 'A conforming runner must reproduce ir.json/plan.json from prompt.json and, executing plan.json on its engine, produce a response.json whose canonical SHA-256 equals canonicalSha256.response.',
    }
    writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  }

  const ev = run.evidence.summary as Record<string, number>
  let summary =
    `[acvp-respond] ${prepared.ir.schemaId} vsId=${prepared.ir.vsId} engine=${identity.id}: ` +
    `${ev.testCases} test cases — ${ev.answered} answered, ${ev.unsupported} unsupported, ${ev.error} error`
  let exitCode = ev.error > 0 ? 1 : 0
  if (run.golden) {
    const g = run.golden
    summary +=
      `; golden vs expectedResults: ${g.matched}/${ev.answered} matched, ` +
      `${g.mismatched.length} mismatched, ${g.unanswered} unanswered, ${g.unexpected.length} unexpected`
    if (g.mismatched.length > 0 || g.unexpected.length > 0) exitCode = 1
  }
  return { exitCode, summary, responsePath, evidencePath }
}
