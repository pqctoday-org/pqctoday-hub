// SPDX-License-Identifier: AGPL-3.0-only
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
  it('emits all 10 expected files inside the board-pack/ folder', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    expect(Object.keys(files).sort()).toEqual([
      // NOTICE.md added 2026-09-26: a board pack is forwarded and quoted by
      // people who never opened the app, so the status travels in the archive.
      'board-pack/NOTICE.md',
      'board-pack/README.md',
      'board-pack/compliance-deadlines.csv',
      'board-pack/executive-summary.md',
      'board-pack/figure-sources.csv',
      'board-pack/figure-sources.md',
      'board-pack/key-findings.md',
      'board-pack/profile.json',
      'board-pack/program-effort.md',
      'board-pack/recommended-actions.md',
    ])
  })

  it('includes an illustrative, override-flagged program effort rollup', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    expect(files['board-pack/program-effort.md']).toContain('Program Effort & Timeline')
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

  it('labels a fictional pack in its readme and machine-readable profile', async () => {
    const files = await extract(
      await buildBoardPackBlob({ result: baseResult, profile: { ...baseProfile, sample: true } })
    )
    expect(files['board-pack/README.md']).toContain('Fictional worked example')
    expect(JSON.parse(files['board-pack/profile.json']).profile.sample).toBe(true)
  })

  it('includes program ownership in the README when provided', async () => {
    const blob = await buildBoardPackBlob({
      result: baseResult,
      profile: {
        ...baseProfile,
        programOwner: 'Jane Doe, CISO',
        budgetOwner: 'John Smith, CFO',
        accountableExecutive: 'Alex Lee, CEO',
      },
    })
    const files = await extract(blob)
    const readme = files['board-pack/README.md']
    expect(readme).toContain('Program Owner:** Jane Doe, CISO')
    expect(readme).toContain('Budget Owner:** John Smith, CFO')
    expect(readme).toContain('Accountable Executive:** Alex Lee, CEO')
  })

  it('omits ownership lines from the README when not provided', async () => {
    const blob = await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    const files = await extract(blob)
    expect(files['board-pack/README.md']).not.toContain('Program Owner')
  })

  it('handles a result with no key findings', async () => {
    const result: AssessmentResult = { ...baseResult, keyFindings: undefined }
    const blob = await buildBoardPackBlob({ result, profile: baseProfile })
    const files = await extract(blob)
    expect(files['board-pack/key-findings.md']).toContain('No findings recorded')
  })
})

describe('Compliance pack (GRC)', () => {
  it('adds an applicability register for GRC, strongest tier first, and names the folder for it', async () => {
    const files = await extract(
      await buildBoardPackBlob({ result: baseResult, profile: { ...baseProfile, persona: 'grc' } })
    )
    const path = Object.keys(files).find((f) => f.endsWith('applicability-register.csv'))
    expect(path).toBe('compliance-pack/applicability-register.csv')
    const csv = files[path as string]
    expect(csv).toContain(
      'framework_id,framework,tier,why_it_applies,binding_status,requires_pqc,binding_basis,deadline,publisher_relationship,publisher_type,source'
    )
    const tiers = csv
      .split('\n')
      .filter((l) => /^[^#,][^,]*,/.test(l) && !l.startsWith('framework_id'))
      .map(
        (l) => l.match(/,(mandatory|recognized|cross-border|advisory|derived|informational),/)?.[1]
      )
      .filter(Boolean)
    expect(tiers.length).toBeGreaterThan(0)
    expect(tiers[0]).toBe('mandatory')
  })

  it('leaves the executive board pack unchanged', async () => {
    const files = await extract(
      await buildBoardPackBlob({ result: baseResult, profile: baseProfile })
    )
    expect(Object.keys(files).some((f) => f.endsWith('applicability-register.csv'))).toBe(false)
    expect(Object.keys(files).every((f) => f.startsWith('board-pack/'))).toBe(true)
  })
})

/** A result that exercises every figure the pack can state. */
const fullResult: AssessmentResult = {
  ...baseResult,
  narrative: 'Your organization faces a high quantum risk (62/100).\nData persists 6 years.',
  hndlRiskWindow: {
    dataRetentionYears: 15,
    estimatedQuantumThreatYear: 2035,
    crqcEstimateYear: 2035,
    currentYear: 2026,
    isAtRisk: true,
    riskWindowYears: 6,
  },
  tnflRiskWindow: {
    credentialLifetimeYears: 10,
    estimatedQuantumThreatYear: 2035,
    currentYear: 2026,
    isAtRisk: true,
    riskWindowYears: 1,
    hasSigningAlgorithms: true,
    tnflRelevantUseCases: ['code signing'],
  },
  migrationEffort: [
    { algorithm: 'RSA-2048', complexity: 'medium', estimatedScope: 'moderate', rationale: 'r' },
    {
      algorithm: 'ECDH P-256',
      complexity: 'high',
      estimatedScope: 'major-project',
      rationale: 'r',
    },
  ],
  keyFindings: ['2 algorithms need replacement', 'Data stays exposed 6 years past 2035'],
}

const MARKER = /\[(C\d+)\]/g
const HAS_MARKER = /\[C\d+\]/

/** Lines that state a number but carry no [Cn] marker — the pack's own timestamp excepted. */
function unmarkedFigureLines(markdown: string): string[] {
  return markdown
    .split('\n')
    .filter((l) => !l.startsWith('**Generated:**'))
    .filter((l) => /\d/.test(l) && !HAS_MARKER.test(l))
}

describe('Sources of figures in the pack', () => {
  for (const persona of ['executive', 'grc']) {
    it(`ships figure-sources.csv and figure-sources.md (${persona})`, async () => {
      const files = await extract(
        await buildBoardPackBlob({ result: fullResult, profile: { ...baseProfile, persona } })
      )
      const folder = persona === 'grc' ? 'compliance-pack' : 'board-pack'
      const csv = files[`${folder}/figure-sources.csv`]
      expect(csv).toContain('id,claim,value,kind,source,url,ref,method,scope,as_of,caveat')
      expect(files[`${folder}/figure-sources.md`]).toContain(
        '# Sources of the figures in this pack'
      )
      expect(files[`${folder}/README.md`]).toContain('figure-sources.csv')
    })
  }

  it('resolves every [Cn] marker and claim_id to a ledger entry', async () => {
    const files = await extract(
      await buildBoardPackBlob({ result: fullResult, profile: baseProfile })
    )
    const ledgerIds = new Set(
      [...files['board-pack/figure-sources.csv'].matchAll(/^(C\d+),/gm)].map((m) => m[1])
    )
    expect(ledgerIds.size).toBeGreaterThan(0)
    const cited = new Set<string>()
    for (const [path, content] of Object.entries(files)) {
      if (path.includes('figure-sources')) continue
      for (const m of content.matchAll(MARKER)) cited.add(m[1])
    }
    const csv = files['board-pack/compliance-deadlines.csv']
    const header = csv.split('\n').find((l) => l.startsWith('framework,'))
    expect(header).toBe('framework,requires_pqc,deadline,notes,claim_id')
    for (const m of csv.matchAll(/,(C\d+)$/gm)) cited.add(m[1])
    expect(csv.match(/,(C\d+)$/gm)?.length).toBe(fullResult.complianceImpacts.length)
    expect(cited.size).toBeGreaterThan(5)
    for (const id of cited) expect(ledgerIds.has(id), `${id} is not in the ledger`).toBe(true)
    // …and every ledger entry is printed somewhere in the pack.
    for (const id of ledgerIds) expect(cited.has(id), `${id} is never cited`).toBe(true)
  })

  it('puts a [Cn] marker on every line that states a number', async () => {
    const files = await extract(
      await buildBoardPackBlob({ result: fullResult, profile: baseProfile })
    )
    for (const name of ['executive-summary.md', 'key-findings.md', 'program-effort.md']) {
      const content = files[`board-pack/${name}`]
      expect(content, name).toMatch(MARKER)
      expect(unmarkedFigureLines(content), name).toEqual([])
    }
    // The guard itself catches an unmarked figure.
    expect(unmarkedFigureLines('**Budget:** $2m')).toEqual(['**Budget:** $2m'])
  })
})
