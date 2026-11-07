// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import * as reportModule from './niceGapReport'
import { NICE_WORK_ROLES } from '@/data/niceFramework'
import { NiceGapReportSection } from '@/components/Report/NiceGapReportSection'
import type { AssessmentInput, AssessmentResult } from '@/hooks/assessmentTypes'

const input: AssessmentInput = {
  industry: 'Technology',
  currentCrypto: ['RSA-2048'],
  dataSensitivity: ['high'],
  complianceRequirements: [],
  migrationStatus: 'planning',
  persona: 'grc',
}
const result: AssessmentResult = {
  riskScore: 40,
  riskLevel: 'medium',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: '',
  generatedAt: '2026-11-05T00:00:00Z',
}
afterEach(() => vi.restoreAllMocks())

const decodedExport = (report: reportModule.NiceGapReport) =>
  JSON.parse(JSON.stringify(report.exportData)) as {
    workRoles: {
      niceCode: string
      title: string
      officialName: string
      nearestMatchNote?: string
      rationale: string
      mappingContext: string
    }[]
  }

describe('existing NICE mapping caveats in generated reports', () => {
  it.each(['grc', 'developer', 'ops', 'executive'] as const)(
    'preserves activity names, caveats and original export fields for %s without reranking roles',
    (persona) => {
      const report = reportModule.generateNiceGapReport({ ...input, persona }, result)
      const exported = decodedExport(report).workRoles
      expect(exported).toHaveLength(report.workRoleRecommendations.length)
      report.workRoleRecommendations.forEach((role, index) => {
        const source = NICE_WORK_ROLES[role.workRoleId]
        expect(role.officialName).toBe(source.officialName)
        expect(role.nearestMatchNote).toBe(source.nearestMatchNote)
        expect(exported[index]).toMatchObject({
          niceCode: source.niceCode,
          title: source.title,
          officialName: source.officialName,
          rationale: role.rationale,
          mappingContext: 'Hub curriculum/job-title mapping to the recorded NICE activity',
        })
        expect(exported[index].nearestMatchNote).toBe(source.nearestMatchNote)
      })
      if (persona === 'grc') {
        expect(exported).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              title: 'Risk Manager',
              officialName: 'Systems Authorization',
              nearestMatchNote: expect.stringContaining('Nearest v2.2.0 match'),
            }),
          ])
        )
      }
    }
  )

  it('shows all three existing nearest-match caveats separately from Hub job titles', () => {
    const report = reportModule.generateNiceGapReport(input, result)
    // Explicit display fixture: test all existing caveated roles, including those
    // not necessarily selected by this input. No change to recommendation ranking.
    report.workRoleRecommendations = [
      'risk-manager',
      'iam-specialist',
      'validation-engineer',
      'security-architect',
    ].map((id) => {
      const role = NICE_WORK_ROLES[id as keyof typeof NICE_WORK_ROLES]
      return {
        workRoleId: role.id,
        niceCode: role.niceCode,
        officialName: role.officialName,
        nearestMatchNote: role.nearestMatchNote,
        title: role.title,
        description: role.description,
        rationale: 'Illustrative display fixture',
        onboardingModules: [],
      }
    })
    vi.spyOn(reportModule, 'generateNiceGapReport').mockReturnValue(report)
    render(
      <MemoryRouter>
        <NiceGapReportSection input={input} result={result} />
      </MemoryRouter>
    )
    expect(screen.getByText(/Hub job-title and curriculum mappings/)).toBeVisible()
    for (const id of ['risk-manager', 'iam-specialist', 'validation-engineer'] as const) {
      const role = NICE_WORK_ROLES[id]
      expect(screen.getByText(role.title)).toBeVisible()
      expect(screen.getByText(`Recorded NICE activity: ${role.officialName}`)).toBeVisible()
      expect(screen.getByText(role.nearestMatchNote!)).toBeVisible()
    }
    expect(screen.getByText('Recorded NICE activity: Cybersecurity Architecture')).toBeVisible()
    expect(screen.getAllByText(/^Nearest v2.2.0 match:/)).toHaveLength(3)
  })

  it('downloads the generated activity identity and caveat with the existing JSON fields', async () => {
    const expected = decodedExport(reportModule.generateNiceGapReport(input, result))
    let captured: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((value) => {
      captured = value as Blob
      return 'blob:sample-nice-report'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <NiceGapReportSection input={input} result={result} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Export.*JSON/i }))
    expect(captured?.type).toBe('application/json')
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(captured!)
    })
    expect(JSON.parse(text).workRoles).toEqual(expected.workRoles)
  })
})
