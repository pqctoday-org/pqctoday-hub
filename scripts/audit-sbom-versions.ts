/**
 * Fails when the About page's Software Bill of Materials states a version that
 * is not what package.json actually resolves to.
 *
 * WHY THIS EXISTS
 * ---------------
 * SbomSection.tsx lists ~88 components by hand, each with a version string, on
 * the one public page whose entire purpose is saying what this app is built
 * from. Nothing checked it, and on 2026-08-09 eleven of them were wrong — in
 * BOTH directions, which rules out "someone bumped and forgot":
 *
 *     React Router   page said v7.17.0   app shipped 8.3.0    (page behind)
 *     Framer Motion  page said v12.35.0  app shipped 12.27.5  (page AHEAD)
 *     @xyflow/react  page said v12.10.1  app shipped 12.11.2
 *     …and eight more
 *
 * A page that is confidently wrong about its own dependencies is worse than one
 * that says nothing, because a reader has no way to tell which entries to trust.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It does not require every dependency to appear on the page — the list is
 * curated, and that is a deliberate editorial choice. It only checks the
 * entries that ARE listed and DO resolve to a real package.json dependency.
 * Anything the page mentions that is not a direct dependency (transitive
 * libraries, tools, standards) is ignored rather than guessed at.
 */
import { readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SBOM = join(ROOT, 'src/components/About/sections/SbomSection.tsx')

/**
 * Display name on the page -> package.json key, for the entries whose label is
 * prose rather than the package name. Anything not listed here is matched by
 * its literal label, which covers every scoped package (`@xyflow/react` etc).
 */
const ALIASES: Record<string, string> = {
  React: 'react',
  'Framer Motion': 'framer-motion',
  'React Router': 'react-router',
  'Lucide React': 'lucide-react',
  'Tailwind CSS': 'tailwindcss',
  'React Markdown': 'react-markdown',
  Zustand: 'zustand',
  ESLint: 'eslint',
  Prettier: 'prettier',
  Vitest: 'vitest',
}

/** `^1.2.3` / `~1.2.3` / `1.2.3` -> `1.2.3`. Ranges we cannot pin are skipped. */
function exactVersion(spec: string): string | null {
  const m = /^[\^~]?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(spec.trim())
  return m ? m[1] : null
}

function main(): void {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies }
  const src = readFileSync(SBOM, 'utf8')

  const entry =
    /<span className="text-muted-foreground">([^<]+)<\/span>[\s\S]*?<span className="text-xs text-muted-foreground">v([0-9][^<]*)<\/span>/g

  const mismatches: { name: string; shown: string; actual: string }[] = []
  let listed = 0
  let checked = 0

  for (const m of src.matchAll(entry)) {
    listed++
    const label = m[1].trim()
    const shown = m[2].trim()
    const spec = deps[ALIASES[label] ?? label]
    if (!spec) continue // curated entry that is not a direct dependency — not our business
    const actual = exactVersion(spec)
    if (!actual) continue // an unpinnable range; nothing to compare against
    checked++
    if (actual !== shown) mismatches.push({ name: label, shown, actual })
  }

  console.log(`SBOM versions — ${listed} listed, ${checked} resolve to a direct dependency`)

  if (mismatches.length === 0) {
    console.log('PASS every listed version matches package.json')
    return
  }

  console.error(`\n✗ ${mismatches.length} version(s) on the public About page are wrong:\n`)
  for (const { name, shown, actual } of mismatches) {
    console.error(
      `   ${name.padEnd(28)} page says v${shown.padEnd(12)} package.json says ${actual}`
    )
  }
  console.error(`\n  Fix the version strings in src/components/About/sections/SbomSection.tsx.`)
  console.error(`  A dependency bump has to update this page too — it is not generated.\n`)
  process.exit(1)
}

main()
