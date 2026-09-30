// SPDX-License-Identifier: GPL-3.0-only
/**
 * check-bundle — compare the npm packages a fresh production build actually bundled
 * (node_modules/.tmp/sbom-bundled.json, written by the build's SBOM plugin) with the committed
 * snapshot src/data/sbomBundledPackages.json that the About page and the CycloneDX file are
 * generated from.
 *
 *   npm run build            # or any `vite build`
 *   npm run check:sbom-bundle
 *
 * A package that entered or left the bundle changes what the site ships, so the snapshot must be
 * refreshed (`npm run sbom:snapshot-bundle`) and the diff reviewed. This does not run inside the
 * build itself: a stale SBOM must not be able to block an emergency deploy, but it must be caught
 * before release (it is part of gate:e2e, which builds).
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const built = join(ROOT, 'node_modules', '.tmp', 'sbom-bundled.json')
const snapshot = join(ROOT, 'src', 'data', 'sbomBundledPackages.json')

if (!existsSync(built)) {
  console.error(
    '✗ no build record — run `npm run build` first (node_modules/.tmp/sbom-bundled.json)'
  )
  process.exit(1)
}
const have = new Set((JSON.parse(readFileSync(built, 'utf8')) as { packages: string[] }).packages)
const want = new Set(
  (JSON.parse(readFileSync(snapshot, 'utf8')) as { packages: string[] }).packages
)
const added = [...have].filter((k) => !want.has(k)).sort()
const removed = [...want].filter((k) => !have.has(k)).sort()
if (added.length || removed.length) {
  console.error(
    '✗ the production build bundles a different set of npm packages than the SBOM snapshot:'
  )
  for (const k of added) console.error(`   + ${k}  (bundled now, not in the snapshot)`)
  for (const k of removed) console.error(`   - ${k}  (in the snapshot, no longer bundled)`)
  console.error(
    '   Refresh with `npm run sbom:snapshot-bundle`, review the diff, then `npm run gen:sbom-versions`.'
  )
  process.exit(1)
}
console.log(`✓ the build bundles exactly the ${have.size} npm packages the SBOM snapshot records`)
