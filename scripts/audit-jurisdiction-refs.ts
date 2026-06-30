// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-jurisdiction-refs — CI gate ensuring jurisdiction data consumers
 * import from the canonical source (jurisdictionsData.ts) rather than the
 * legacy locations being migrated away.
 *
 * Detects two real migration debts:
 *
 * 1. Hardcoded JURISDICTIONS array still imported from the Learn module's
 *    internal data file (use JURISDICTIONS_LEGACY from jurisdictionsData).
 *
 * 2. Hardcoded JURISDICTION_RULES const still defined directly in a file
 *    (not a re-export). jurisdiction.ts is the only allowed re-export shim.
 *    All other consumers importing JURISDICTION_RULES from @/data/jurisdiction
 *    are fine because that file now re-exports from the CSV-driven source.
 *
 * NOT flagged (intentionally):
 *   - REGION_COUNTRIES_MAP from personaConfig: the Timeline/Report/Coverage
 *     consumers need the broader non-picker list from personaConfig; only the
 *     Assess picker was migrated to use jurisdictionsData directly.
 *   - Any imports from @/data/jurisdiction (it is a thin re-export shim).
 *
 * Run:  npm run audit:jurisdiction-refs
 */

import { execSync } from 'child_process'
import * as path from 'path'

const SRC = path.resolve(import.meta.dirname, '../src')

/** grep a pattern in TS/TSX files under SRC; return matching file paths. */
function grepFiles(pattern: string): string[] {
  try {
    const out = execSync(`grep -rn --include="*.ts" --include="*.tsx" -l "${pattern}" "${SRC}"`, {
      encoding: 'utf8',
    }).trim()
    return out
      .split('\n')
      .filter(Boolean)
      .map((f) => path.relative(path.resolve(import.meta.dirname, '..'), f))
  } catch {
    return [] // grep exits non-zero when nothing found
  }
}

interface Rule {
  description: string
  pattern: string
  allowed: string[]
}

const RULES: Rule[] = [
  {
    description:
      'JURISDICTIONS imported from ComplianceStrategy/data/jurisdictions.ts ' +
      '(migrate to: import { JURISDICTIONS_LEGACY as JURISDICTIONS } from "@/data/jurisdictionsData")',
    // Match the import statement (not comments that mention the file path)
    pattern: "from '@/components/PKILearning/modules/ComplianceStrategy/data/jurisdictions'",
    allowed: [
      // The old file itself is the source; it exports JURISDICTIONS for any remaining legacy
      // consumers inside the ComplianceStrategy module.
      'src/components/PKILearning/modules/ComplianceStrategy/data/jurisdictions.ts',
    ],
  },
  {
    description:
      'Hardcoded JURISDICTION_RULES const defined inline (not a re-export). ' +
      'All rules must come from the CSV via jurisdictionsData.ts. ' +
      '(The jurisdiction.ts re-export shim is the only allowed host.)',
    // Match `export const JURISDICTION_RULES` or `const JURISDICTION_RULES` direct definitions.
    pattern: 'const JURISDICTION_RULES',
    allowed: [
      // jurisdictionsData.ts IS the canonical source — it exports the const derived from CSV.
      'src/data/jurisdictionsData.ts',
    ],
  },
]

let failures = 0

for (const rule of RULES) {
  const files = grepFiles(rule.pattern)
  const violations = files.filter((f) => !rule.allowed.some((a) => f.endsWith(a) || f === a))

  if (violations.length > 0) {
    console.error(`\n✗ ${rule.description}`)
    for (const v of violations) {
      console.error(`  ${v}`)
    }
    failures += violations.length
  }
}

if (failures === 0) {
  console.log('✓ audit:jurisdiction-refs — all jurisdiction imports use the canonical source')
  process.exit(0)
} else {
  console.error(`\n${failures} violation(s) found.`)
  process.exit(1)
}
