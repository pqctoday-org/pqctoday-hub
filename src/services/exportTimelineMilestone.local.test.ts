// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import JSZip from 'jszip'
import { buildEngineeringPlanBlob } from './engineeringPlanBuilder'
import { buildBoardPackBlob } from './boardPackBuilder'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD } from '@/data/exampleReport'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

const pair = { id: 'Sample migration deadline', authority: 'Sample Authority', year: 2035 }

const resultWith = (timelineMilestone?: typeof pair): AssessmentResult =>
  computeAssessment({
    ...EXAMPLE_REPORT_SHARE_PAYLOAD,
    timelinePressure: 'internal-deadline',
    ...(timelineMilestone ? { timelineMilestone } : {}),
  })

async function unzip(blob: Blob): Promise<Map<string, string>> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const out = new Map<string, string>()
  for (const [path, file] of Object.entries(zip.files))
    if (!file.dir) out.set(path, await file.async('string'))
  return out
}

const boardProfile = {
  industry: 'Finance & Banking',
  country: 'United States',
  generatedAt: '2026-11-06T12:00:00Z',
}

describe('exports carry the chosen milestone', () => {
  it('the markdown migration plan names it in the profile', async () => {
    const files = await unzip(
      await buildEngineeringPlanBlob({ result: resultWith(pair), products: [] })
    )
    expect(files.get('engineering-plan/migration-plan.md')).toContain(
      '- **Timeline:** Distant external deadline: Sample migration deadline (Sample Authority), 2035'
    )
  })

  it('the markdown migration plan is unchanged when there is no pair', async () => {
    const files = await unzip(
      await buildEngineeringPlanBlob({ result: resultWith(), products: [] })
    )
    expect(files.get('engineering-plan/migration-plan.md')).not.toContain('Timeline:')
  })

  it('the structured profile keeps the summary value and the pair side by side', async () => {
    const files = await unzip(
      await buildBoardPackBlob({ result: resultWith(pair), profile: boardProfile })
    )
    const parsed = JSON.parse(files.get('board-pack/profile.json')!)
    expect(parsed.assessmentProfile.timelinePressure).toBe('internal-deadline')
    expect(parsed.assessmentProfile.timelineMilestone).toEqual(pair)
  })

  it('the structured profile has no pair field when none was chosen', async () => {
    const files = await unzip(
      await buildBoardPackBlob({ result: resultWith(), profile: boardProfile })
    )
    const parsed = JSON.parse(files.get('board-pack/profile.json')!)
    expect(parsed.assessmentProfile.timelinePressure).toBe('internal-deadline')
    expect(parsed.assessmentProfile).not.toHaveProperty('timelineMilestone')
  })
})
