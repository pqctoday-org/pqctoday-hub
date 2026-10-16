// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Engineering migration plan — the developer / IT-ops counterpart of the
 * board pack. Bundles what an engineering team acts on into a ZIP:
 *
 *   engineering-plan/
 *     README.md                — what's inside, how it was produced
 *     migration-plan.md        — profile, algorithm backlog, actions, products
 *     algorithm-backlog.csv    — one row per algorithm to replace
 *     products.csv             — bookmarked products with FIPS state and evidence
 *     test-checklist.md        — the tests a PQC change has to pass
 *     refactor-audit.md        — the latest saved Crypto API Refactor Audit, if any
 *
 * Pure data builder — no React, no DOM. FIPS wording comes from the shared
 * classifier, so the export says exactly what the report's badges say.
 */
import { buildZipBundle, bundleFilename, downloadBlob, type BundleFile } from './exportBundle'
import { withEducationNoticeCsv, withEducationNoticeMarkdown } from '@/data/educationNotice'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { generateCsv } from '@/utils/csvExport'
import {
  classifyFips,
  pqcBoundary,
  FIPS_STATE_LABEL,
  type PqcBoundary,
  type XrefLike,
} from '@/utils/fipsStatus'

export interface EngineeringPlanInput {
  result: AssessmentResult
  /** Products the visitor bookmarked in Migrate. */
  products: SoftwareItem[]
  /** Certificate cross-reference rows per product id (for the PQC-boundary column). */
  certsFor?: (product: SoftwareItem) => XrefLike[]
  /** Markdown of the latest saved Crypto API Refactor Audit, if the visitor saved one. */
  refactorAuditMarkdown?: string
  appVersion?: string
  /** ISO date used in the file name and README; defaults to the result's date. */
  generatedAt?: string
}

const BOUNDARY_LABEL: Record<PqcBoundary, string> = {
  yes: 'PQC inside the validated boundary',
  no: 'PQC outside the validated boundary',
  'not-stated': 'Not stated',
}

/**
 * The tests a post-quantum change must pass before release. Static on
 * purpose: it is the same list whatever the stack, and each item names what
 * to check rather than a tool.
 */
export const ENGINEERING_TEST_CHECKLIST: { area: string; checks: string[] }[] = [
  {
    area: 'Correctness',
    checks: [
      'Known-answer tests (NIST ACVP vectors) for every PQC primitive you call, byte-for-byte.',
      'Negative tests: tampered ciphertext must decapsulate to the implicit-rejection value; tampered message or signature must fail verification.',
    ],
  },
  {
    area: 'Interoperability',
    checks: [
      'Mixed client/server matrix: PQC-capable and classical-only peers, in both directions.',
      'HelloRetryRequest: client offers the hybrid group but sends a key share only for a classical group; the handshake must complete in two round trips.',
      'No common group: the handshake must fail with handshake_failure, not fall back silently.',
    ],
  },
  {
    area: 'Fallback and downgrade',
    checks: [
      'Fallback to a classical group happens only for named peers, under a written policy with an end date, and is logged.',
      'A downgrade attempt by an active attacker is detected (TLS 1.3 transcript binding) and refused.',
      'Rollback of the deployment is tested separately from algorithm downgrade.',
    ],
  },
  {
    area: 'Sizes and limits',
    checks: [
      'Messages, records and certificate chains with ML-KEM and ML-DSA sizes fit every buffer, MTU, proxy and load-balancer limit on the path.',
      'Database columns, caches and queues that store keys, signatures or certificates accept the new sizes (an ML-DSA-65 signature is 3,309 bytes).',
    ],
  },
  {
    area: 'Key management',
    checks: [
      'HSM / KMS: key generation, wrapping and use work for the PQC key types through the interface you actually call (PKCS#11, KMIP, cloud KMS API).',
      'Certificates: issuance, chain building and revocation checking work with the new algorithms end to end.',
    ],
  },
  {
    area: 'Performance',
    checks: [
      'Handshake and signing latency and throughput measured under representative concurrency on production hardware, not in a browser.',
    ],
  },
]

function mdTable(header: string[], rows: string[][]): string {
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ')
  return [
    `| ${header.join(' | ')} |`,
    `|${header.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.map(esc).join(' | ')} |`),
  ].join('\n')
}

interface ProductRow {
  name: string
  category: string
  pqcSupport: string
  fips: string
  pqcBoundary: string
  version: string
  evidence: string
}

function productRows(input: EngineeringPlanInput): ProductRow[] {
  return input.products.map((p) => {
    const certs = input.certsFor?.(p) ?? []
    return {
      name: p.softwareName,
      category: p.categoryName,
      pqcSupport: p.pqcSupport,
      fips: FIPS_STATE_LABEL[classifyFips(p.fipsValidated)],
      pqcBoundary: BOUNDARY_LABEL[pqcBoundary(p.fipsValidated, certs)],
      version: p.latestVersion,
      evidence: p.proofUrl || p.authoritativeSource || p.repositoryUrl || '',
    }
  })
}

function buildReadme(input: EngineeringPlanInput, date: string): string {
  const lines = [
    '# Engineering migration plan',
    '',
    `Generated ${date}${input.appVersion ? ` by PQC Today ${input.appVersion}` : ''}.`,
    '',
    'What is inside:',
    '',
    '- `migration-plan.md` — your assessment profile, the algorithms to replace, the recommended actions and the products you bookmarked.',
    '- `algorithm-backlog.csv` — the algorithm backlog as rows you can import into an issue tracker.',
    `- \`products.csv\` — ${input.products.length} bookmarked product(s) with their FIPS state, whether the PQC algorithms are inside the validated boundary, and an evidence link.`,
    '- `test-checklist.md` — the tests a post-quantum change has to pass before release.',
    input.refactorAuditMarkdown
      ? '- `refactor-audit.md` — your latest saved Crypto API Refactor Audit.'
      : '- No Crypto API Refactor Audit was saved, so `refactor-audit.md` is not included. Save one in the Command Center to add it.',
    '',
    'The inventory is what you entered in the assessment; it is not a scan of your code or systems.',
    input.products.length === 0
      ? 'No products were bookmarked. Bookmark products in Migrate to list them here.'
      : '',
  ]
  return lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n') + '\n'
}

function buildPlan(input: EngineeringPlanInput, date: string): string {
  const { result } = input
  const p = result.assessmentProfile
  const out: string[] = ['# Engineering migration plan', '', `Generated ${date}.`, '']

  if (p) {
    out.push('## Profile', '')
    const item = (label: string, values?: string[] | string) => {
      const v = Array.isArray(values) ? values.join(', ') : values
      if (v) out.push(`- **${label}:** ${v}`)
    }
    item('Algorithms in use', p.algorithmsSelected)
    item('Algorithm families', p.algorithmCategories)
    item('Use cases', p.useCases)
    item('Infrastructure', p.infrastructure)
    item('Crypto agility', p.cryptoAgility)
    item('Data retention', p.retentionPeriods)
    item('Migration status', p.migrationStatus)
    out.push('')
  }

  out.push('## Algorithm backlog', '')
  if (result.algorithmMigrations.length === 0) {
    out.push('No algorithms were entered in the assessment.', '')
  } else {
    out.push(
      mdTable(
        ['Current', 'Quantum-vulnerable', 'Replacement', 'Urgency', 'Notes'],
        result.algorithmMigrations.map((m) => [
          m.classical,
          m.quantumVulnerable ? 'Yes' : 'No',
          m.replacement,
          m.urgency,
          m.notes,
        ])
      ),
      ''
    )
  }

  out.push('## Recommended actions', '')
  const actions = [...result.recommendedActions].sort((a, b) => a.priority - b.priority)
  if (actions.length === 0) out.push('None.', '')
  else {
    for (const a of actions) out.push(`${a.priority}. ${a.action} _(${a.category})_`)
    out.push('')
  }

  out.push('## Products', '')
  const rows = productRows(input)
  if (rows.length === 0) out.push('No products were bookmarked in Migrate.', '')
  else
    out.push(
      mdTable(
        ['Product', 'PQC support', 'FIPS', 'PQC in boundary', 'Evidence'],
        rows.map((r) => [r.name, r.pqcSupport, r.fips, r.pqcBoundary, r.evidence])
      ),
      ''
    )

  out.push('## Tests', '', 'See `test-checklist.md`.', '')
  return out.join('\n')
}

function buildChecklist(): string {
  const out = ['# Test checklist for a post-quantum change', '']
  for (const section of ENGINEERING_TEST_CHECKLIST) {
    out.push(`## ${section.area}`, '', ...section.checks.map((c) => `- [ ] ${c}`), '')
  }
  return out.join('\n')
}

export async function buildEngineeringPlanBlob(input: EngineeringPlanInput): Promise<Blob> {
  const date = (input.generatedAt ?? input.result.generatedAt ?? new Date().toISOString()).slice(
    0,
    10
  )
  const backlog = generateCsv(input.result.algorithmMigrations, [
    { header: 'Current', accessor: (m) => m.classical },
    { header: 'Quantum-vulnerable', accessor: (m) => (m.quantumVulnerable ? 'Yes' : 'No') },
    { header: 'Replacement', accessor: (m) => m.replacement },
    { header: 'Urgency', accessor: (m) => m.urgency },
    { header: 'Notes', accessor: (m) => m.notes },
  ])
  const products = generateCsv(productRows(input), [
    { header: 'Product', accessor: (r) => r.name },
    { header: 'Category', accessor: (r) => r.category },
    { header: 'PQC support', accessor: (r) => r.pqcSupport },
    { header: 'FIPS state', accessor: (r) => r.fips },
    { header: 'PQC in validated boundary', accessor: (r) => r.pqcBoundary },
    { header: 'Latest version', accessor: (r) => r.version },
    { header: 'Evidence', accessor: (r) => r.evidence },
  ])
  const files: BundleFile[] = [
    { path: 'README.md', content: withEducationNoticeMarkdown(buildReadme(input, date)) },
    { path: 'migration-plan.md', content: withEducationNoticeMarkdown(buildPlan(input, date)) },
    { path: 'algorithm-backlog.csv', content: withEducationNoticeCsv(backlog) },
    { path: 'products.csv', content: withEducationNoticeCsv(products) },
    { path: 'test-checklist.md', content: withEducationNoticeMarkdown(buildChecklist()) },
  ]
  if (input.refactorAuditMarkdown) {
    files.push({
      path: 'refactor-audit.md',
      content: withEducationNoticeMarkdown(input.refactorAuditMarkdown),
    })
  }
  return buildZipBundle(files.map((f) => ({ ...f, path: `engineering-plan/${f.path}` })))
}

export async function downloadEngineeringPlan(input: EngineeringPlanInput): Promise<void> {
  const blob = await buildEngineeringPlanBlob(input)
  const date = (input.generatedAt ?? input.result.generatedAt ?? '').slice(0, 10) || undefined
  downloadBlob(blob, bundleFilename('pqc-engineering-plan', 'zip', date))
}
