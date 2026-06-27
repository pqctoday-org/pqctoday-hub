/**
 * check-wasm-provenance.ts — drift check for WASM bundles vendored from pqctoday-hsm.
 *
 * Reads public/wasm/wasm-provenance.json and, when a sibling pqctoday-hsm checkout
 * is available, reports any bundle whose recorded `hsmCommit` is behind the hsm
 * source dirs it was built from (i.e. the hub is shipping a stale bundle). Bundles
 * marked `pending-refresh` are always flagged.
 *
 * Mirrors the sync:sandbox pattern: it is a no-op (passes) when the sibling repo
 * is not present (e.g. in hub-only CI), and a hard gate locally / where hsm is checked out.
 *
 *   npx tsx scripts/check-wasm-provenance.ts          # report
 *   npx tsx scripts/check-wasm-provenance.ts --check  # exit 1 on drift/pending
 *
 * Override the hsm location with HSM_REPO_PATH=/path/to/pqctoday-hsm.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const CHECK = process.argv.includes('--check')
const manifestPath = resolve(process.cwd(), 'public/wasm/wasm-provenance.json')

type Bundle = {
  name: string
  files: string[]
  buildScript: string
  sourceDirs: string[]
  track: 'tip' | 'pinned'
  status: 'built' | 'pending-refresh' | 'current'
  hsmCommit: string | null
  builtAt: string | null
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as { bundles: Bundle[] }

const hsmPath = process.env.HSM_REPO_PATH ?? resolve(process.cwd(), '..', 'pqctoday-hsm')

if (!existsSync(resolve(hsmPath, '.git'))) {
  console.log(`⏭  sibling pqctoday-hsm not found at ${hsmPath} — skipping wasm provenance check.`)
  process.exit(0)
}

const git = (...args: string[]) =>
  execFileSync('git', ['-C', hsmPath, ...args], { encoding: 'utf8' }).trim()

let drift = false
const head = git('rev-parse', 'HEAD')
console.log(`wasm provenance vs pqctoday-hsm @ ${head.slice(0, 9)} (${hsmPath})\n`)

for (const b of manifest.bundles) {
  if (b.track !== 'tip') {
    console.log(`  •  ${b.name}: pinned — skipped`)
    continue
  }
  if (b.status === 'pending-refresh' || !b.hsmCommit) {
    console.log(`  ⚠️  ${b.name}: PENDING refresh (no recorded build commit)`)
    drift = true
    continue
  }
  let behind = '0'
  try {
    behind = git('rev-list', '--count', `${b.hsmCommit}..HEAD`, '--', ...b.sourceDirs)
  } catch {
    console.log(
      `  ⚠️  ${b.name}: recorded commit ${b.hsmCommit.slice(0, 9)} not in hsm history — rebuild`
    )
    drift = true
    continue
  }
  if (Number(behind) > 0) {
    console.log(
      `  ❌  ${b.name}: STALE — ${behind} hsm commit(s) to ${b.sourceDirs.join(', ')} since this bundle (built @ ${b.hsmCommit.slice(0, 9)}). Rebuild: ${b.buildScript}`
    )
    drift = true
  } else {
    console.log(`  ✅  ${b.name}: current (built @ ${b.hsmCommit.slice(0, 9)})`)
  }
}

if (drift && CHECK) {
  console.error(
    '\n✗ wasm bundles are stale/pending — rebuild from hsm and update wasm-provenance.json'
  )
  process.exit(1)
}
console.log(
  drift ? '\n(report only; run with --check to gate)' : '\n✓ all tracked wasm bundles current'
)
