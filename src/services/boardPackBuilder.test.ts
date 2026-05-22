// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { buildBoardPackBlob } from './boardPackBuilder'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

const baseResult: AssessmentResult = {
  riskScore: 62,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [
    { framework: 'CNSA 2.0', requiresPQC: true, deadline: '2027', notes: 'US Federal' },
    {
      framework: 'GDPR',
      requiresPQC: null,
      deadline: 'Ongoing',
      notes: 'EU data protection, retention drives HNDL',
    },
  ],
  recommendedActions: [
    {
      priority: 1,
      action: 'Inventory crypto-using systems',
      category: 'immediate',
      relatedModule: 'cbom',
      effort: 'medium',
    },
    {
      priority: 2,
      action: 'Pilot hybrid key exchange',
      category: 'short-term',
      relatedModule: 'hybrid-crypto',
    },
    {
      priority: 3,
      action: 'Plan PKI rotation',
      category: 'long-term',
      relatedModule: 'pki-workshop',
    },
  ],
  narrative: 'Sample narrative.',
  generatedAt: '2026-05-21T12:00:00Z',
  keyFindings: ['Finding A', 'Finding B'],
}

const baseProfile = {
  industry: 'Finance & Banking',
  country: 'United States',
  region: 'americas',
  generatedAt: '2026-05-21T12:00:00Z',
  persona: 'executive',
}

async function extract(blob: Blob): Promise<Record<string, string>> {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer())
  const out: Record<string, string> = {}
  await Promise.all(
    Object.keys(zip.files).map(async (path) => {
      const file = zip.files[path]
      if (!file || file.dir) return
      out[path] = await file.async('string')
    })
  )
  return out
}

describe('buildBoardPackBlob', () => {
  it('emits all 6 expected files inside the board-pack/ folder', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    expect(Object.keys(files).sort()).toEqual([
      'board-pack/README.md',
      'board-pack/compliance-deadlines.csv',
      'board-pack/executive-summary.md',
      'board-pack/key-findings.md',
      'board-pack/profile.json',
      'board-pack/recommended-actions.md',
    ])
  })

  it('puts the risk score and persona in the executive summary', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    const summary = files['board-pack/executive-summary.md']
    expect(summary).toContain('62 / 100')
    expect(summary).toContain('medium')
    expect(summary).toContain('Finance & Banking')
  })

  it('lists the top 3 actions in priority order under their categories', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    const actions = files['board-pack/recommended-actions.md']
    expect(actions).toContain('Inventory crypto-using systems')
    expect(actions).toContain('Pilot hybrid key exchange')
    expect(actions).toContain('Plan PKI rotation')
    // Categories appear in canonical order
    expect(actions.indexOf('Immediate')).toBeLessThan(actions.indexOf('Short-term'))
    expect(actions.indexOf('Short-term')).toBeLessThan(actions.indexOf('Long-term'))
  })

  it('escapes commas and quotes in the compliance CSV', async () => {
    const result: AssessmentResult = {
      ...baseResult,
      complianceImpacts: [
        {
          framework: 'Quoted "Framework"',
          requiresPQC: true,
          deadline: '2027, ongoing',
          notes: 'Comma, in, notes',
        },
      ],
    }
    const blob = await buildBoardPackBlob({ result, profile: baseProfile })
    const files = await extract(blob)
    const csv = files['board-pack/compliance-deadlines.csv']
    expect(csv).toContain('"Quoted ""Framework"""')
    expect(csv).toContain('"2027, ongoing"')
    expect(csv).toContain('"Comma, in, notes"')
  })

  it('marks null PQC requirement as "unknown"', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    expect(files['board-pack/compliance-deadlines.csv']).toMatch(/GDPR,unknown,Ongoing/)
  })

  it('echoes the assessment profile + score in profile.json', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    const parsed = JSON.parse(files['board-pack/profile.json']) as {
      score: { risk: number; riskLevel: string }
      profile: { industry: string }
    }
    expect(parsed.score.risk).toBe(62)
    expect(parsed.score.riskLevel).toBe('medium')
    expect(parsed.profile.industry).toBe('Finance & Banking')
  })

  it('handles a result with no key findings', async () => {
    const result: AssessmentResult = { ...baseResult, keyFindings: undefined }
    const blob = await buildBoardPackBlob({ result, profile: baseProfile })
    const files = await extract(blob)
    expect(files['board-pack/key-findings.md']).toContain('No findings recorded')
  })
})
