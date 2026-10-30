// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { BoardPackExport } from './BoardPackExport'
import { downloadBoardPack } from '@/services/boardPackBuilder'
import { exampleReportResultFor } from '@/data/exampleReport'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useReportOwnershipStore } from '@/store/useReportOwnershipStore'

vi.mock('@/services/boardPackBuilder', () => ({
  downloadBoardPack: vi.fn().mockResolvedValue(undefined),
}))

describe('BoardPackExport report context', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAssessmentFormStore.setState({ industry: 'Healthcare', country: 'Australia' })
    usePersonaStore.setState({ selectedPersona: 'grc', selectedRegion: 'apac' })
    useReportOwnershipStore.setState({
      programOwner: 'Viewer owner',
      budgetOwner: 'Viewer budget owner',
      accountableExecutive: 'Viewer executive',
    })
  })

  it("exports the displayed fictional estate without copying the viewer's scope or owners", async () => {
    const result = exampleReportResultFor('executive')
    render(<BoardPackExport result={result} persona="executive" shared sample />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Board Pack ZIP' }))
    await waitFor(() => expect(downloadBoardPack).toHaveBeenCalledOnce())
    const { profile } = vi.mocked(downloadBoardPack).mock.calls[0][0]
    expect(profile.industry).toBe(result.assessmentProfile?.industry)
    expect(profile.country).toBe(result.assessmentProfile?.country)
    expect(profile.persona).toBe('executive')
    expect(profile.sample).toBe(true)
    expect(profile.region).toBeUndefined()
    expect(profile.programOwner).toBeUndefined()
    expect(profile.budgetOwner).toBeUndefined()
    expect(profile.accountableExecutive).toBeUndefined()
  })

  it('leaves absent shared-report profile values unknown instead of borrowing viewer values', async () => {
    const result = { ...exampleReportResultFor('executive'), assessmentProfile: undefined }
    render(<BoardPackExport result={result} persona="executive" shared />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Board Pack ZIP' }))
    await waitFor(() => expect(downloadBoardPack).toHaveBeenCalledOnce())
    const { profile } = vi.mocked(downloadBoardPack).mock.calls[0][0]
    expect(profile.country).toBe('')
    expect(profile.industry).toBe('')
  })
})
