// SPDX-License-Identifier: GPL-3.0-only
// WS-H H-5/H-6: cross-target comparison of one evidence run (logic:
// src/services/acvp-xplat/compare.ts + node/runDir.ts).
//   npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/<runId>          # write matrix + divergences
//   npx tsx scripts/acvp-xplat-compare.ts --run evidence/acvp-xplat/<runId> --check  # exit 1 if committed output is stale
import path from 'node:path'
import { checkRun, renderRun, writeRun } from '../src/services/acvp-xplat/node/runDir'
import { STATUSES } from '../src/services/acvp-xplat/compare'

const main = async () => {
  const i = process.argv.indexOf('--run')
  const runDir = i === -1 ? undefined : process.argv[i + 1]
  if (!runDir) {
    console.error('usage: acvp-xplat-compare --run <evidence/acvp-xplat/runId> [--check]')
    process.exit(64)
  }
  const rendered = await renderRun(process.cwd(), runDir, path.basename(runDir))
  const m = rendered.output.matrix
  for (const t of m.targets) {
    const c = m.totals[t.id]
    console.warn(
      `  ${t.id.padEnd(18)} ${t.declaredStatus.padEnd(7)} publishable=${String(t.publishable).padEnd(5)} ${STATUSES.map((s) => `${s}=${c[s]}`).join(' ')}`
    )
  }
  console.warn(`  divergences: ${m.divergences.length}`)
  if (process.argv.includes('--check')) {
    const problems = checkRun(runDir, rendered)
    for (const p of problems) console.error(`[acvp-xplat-compare] ${p}`)
    process.exit(problems.length ? 1 : 0)
  }
  writeRun(runDir, rendered)
  console.warn(
    `[acvp-xplat-compare] wrote ${runDir}/matrix.{json,md} + ${m.divergences.length} divergence file(s)`
  )
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : String(e))
  process.exit(70)
})
