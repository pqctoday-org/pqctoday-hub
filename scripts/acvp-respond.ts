// SPDX-License-Identifier: GPL-3.0-only
// ACVP-format compatible prototype — local prompt → response CLI (WS-F, F-8).
//   npx tsx scripts/acvp-respond.ts --prompt p.json --engine cpp|rust --out dir
//        [--expected expectedResults.json] [--no-evidence] [--emit-bundle dir]
// All logic lives in src/services/acvp/node/cli.ts (type-checked, shared with
// the browser panel's pipeline). Local only — no network, no ACVTS submission.
import { parseCliArgs, runCli } from '../src/services/acvp/node/cli'

const main = async () => {
  let args
  try {
    args = parseCliArgs(process.argv.slice(2))
  } catch (e) {
    console.error((e as Error).message)
    process.exit(64)
  }
  const result = await runCli(args, process.cwd())
  if (result.exitCode === 2) console.error(result.summary)
  else console.warn(result.summary)
  if (result.responsePath) console.warn(`  wrote ${result.responsePath}`)
  if (result.evidencePath) console.warn(`  wrote ${result.evidencePath}`)
  process.exit(result.exitCode)
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : String(e))
  process.exit(70)
})
