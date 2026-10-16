// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { buildEngineeringPlanBlob, ENGINEERING_TEST_CHECKLIST } from './engineeringPlanBuilder'
import type { AssessmentResult } from '@/hooks/assessmentTypes'
import type { SoftwareItem } from '@/types/MigrateTypes'

const result = {
  riskScore: 70,
  riskLevel: 'high',
  algorithmMigrations: [
    {
      classical: 'RSA-2048',
      quantumVulnerable: true,
      replacement: 'ML-KEM-768',
      urgency: 'immediate',
      notes: 'Key transport, TLS',
    },
  ],
  complianceImpacts: [],
  recommendedActions: [
    { priority: 1, action: 'Inventory TLS endpoints', category: 'immediate', relatedModule: '' },
  ],
  narrative: '',
  generatedAt: '2026-10-16T08:00:00.000Z',
  assessmentProfile: { algorithmsSelected: ['RSA-2048'], infrastructure: ['Cloud'] },
} as unknown as AssessmentResult

const product = (over: Partial<SoftwareItem>): SoftwareItem =>
  ({
    productId: 'p',
    softwareName: 'P',
    categoryName: 'Libraries',
    pqcSupport: 'Yes (ML-KEM)',
    fipsValidated: 'No',
    latestVersion: '1.0',
    authoritativeSource: '',
    repositoryUrl: '',
    ...over,
  }) as SoftwareItem

async function unzip(blob: Blob): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const out: Record<string, string> = {}
  for (const [path, f] of Object.entries(zip.files)) if (!f.dir) out[path] = await f.async('string')
  return out
}

describe('engineering migration plan', () => {
  it('bundles the plan, backlog, products and checklist under engineering-plan/', async () => {
    const files = await unzip(
      await buildEngineeringPlanBlob({ result, products: [product({ softwareName: 'LibA' })] })
    )
    expect(Object.keys(files).sort()).toEqual([
      'engineering-plan/NOTICE.md',
      'engineering-plan/README.md',
      'engineering-plan/algorithm-backlog.csv',
      'engineering-plan/migration-plan.md',
      'engineering-plan/products.csv',
      'engineering-plan/test-checklist.md',
    ])
    expect(files['engineering-plan/algorithm-backlog.csv']).toContain('RSA-2048')
    expect(files['engineering-plan/migration-plan.md']).toContain('Inventory TLS endpoints')
    expect(files['engineering-plan/README.md']).toContain('not a scan of your code')
    for (const s of ENGINEERING_TEST_CHECKLIST)
      expect(files['engineering-plan/test-checklist.md']).toContain(`## ${s.area}`)
  })

  it('states FIPS with the shared classifier, including PQC outside the boundary', async () => {
    const files = await unzip(
      await buildEngineeringPlanBlob({
        result,
        products: [
          product({
            softwareName: 'ModA',
            fipsValidated: 'Yes (FIPS 140-3 CMVP #4985, Active; classical algorithms only)',
          }),
          product({ softwareName: 'LibB', fipsValidated: 'No (implements FIPS 203 algorithm)' }),
        ],
      })
    )
    const csv = files['engineering-plan/products.csv']
    expect(csv).toMatch(/ModA,.*FIPS 140 validated,PQC outside the validated boundary/)
    expect(csv).toMatch(/LibB,.*Not FIPS validated/)
    expect(csv).not.toMatch(/Partial/)
  })

  it('adds the refactor audit only when one was saved', async () => {
    const withAudit = await unzip(
      await buildEngineeringPlanBlob({ result, products: [], refactorAuditMarkdown: '# Audit' })
    )
    expect(withAudit['engineering-plan/refactor-audit.md']).toContain('# Audit')
    const without = await unzip(await buildEngineeringPlanBlob({ result, products: [] }))
    expect(without['engineering-plan/refactor-audit.md']).toBeUndefined()
    expect(without['engineering-plan/README.md']).toContain('No Crypto API Refactor Audit')
  })
})
