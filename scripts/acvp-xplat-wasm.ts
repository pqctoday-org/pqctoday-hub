// SPDX-License-Identifier: GPL-3.0-only
// WS-H H-2(a): run the WASM C++ + Rust baseline targets and emit THE fixture
// bundle every native/board target consumes (logic:
// src/services/acvp-xplat/node/wasmBaseline.ts).
//   npx tsx scripts/acvp-xplat-wasm.ts --run evidence/acvp-xplat/<runId> --bundle-dir <scratch>
//        [--hsm-repo ../pqctoday-hsm]
// --verify-bundles-only: regenerate the bundles into --bundle-dir and check that
// their manifest.json bytes equal the committed ones (replay check, no evidence written).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { runCli } from '../src/services/acvp/node/cli'
import { FIXTURE_NAMES, fixturePath } from '../src/services/acvp/node/fixtures'
import { runWasmBaseline } from '../src/services/acvp-xplat/node/wasmBaseline'

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? undefined : process.argv[i + 1]
}

const main = async () => {
  const repoRoot = process.cwd()
  const runDir = arg('--run')
  const bundleDir = arg('--bundle-dir')
  if (!runDir || !bundleDir) {
    console.error(
      'usage: acvp-xplat-wasm --run <evidence/acvp-xplat/runId> --bundle-dir <dir> [--hsm-repo <dir>] [--verify-bundles-only]'
    )
    process.exit(64)
  }
  if (process.argv.includes('--verify-bundles-only')) {
    let bad = 0
    for (const name of FIXTURE_NAMES) {
      const dir = path.join(bundleDir, 'cpp', name)
      await runCli(
        {
          prompt: fixturePath(repoRoot, name, 'prompt.json'),
          engine: 'cpp',
          out: path.join(bundleDir, 'verify-out', name),
          expected: fixturePath(repoRoot, name, 'expectedResults.json'),
          evidence: false,
          emitBundle: dir,
        },
        repoRoot
      )
      const same =
        readFileSync(path.join(dir, 'manifest.json'), 'utf8') ===
        readFileSync(path.join(runDir, 'bundles', name, 'manifest.json'), 'utf8')
      console.warn(
        `[acvp-xplat-wasm] ${name}: regenerated bundle manifest ${same ? 'IDENTICAL to' : 'DIFFERS from'} the committed one`
      )
      if (!same) bad++
    }
    process.exit(bad ? 1 : 0)
  }
  const log = await runWasmBaseline({
    repoRoot,
    runDir,
    bundleDir,
    hsmRepo: arg('--hsm-repo') ?? path.join(repoRoot, '..', 'pqctoday-hsm'),
  })
  for (const l of log) console.warn(l)
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : String(e))
  process.exit(70)
})
