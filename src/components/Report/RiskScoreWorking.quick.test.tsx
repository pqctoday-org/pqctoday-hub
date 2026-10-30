// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RiskScoreWorking, riskScoreWorking } from './RiskScoreWorking'
import { computeAssessment } from '@/hooks/assessment/orchestrator'
import { EXAMPLE_REPORT_SHARE_PAYLOAD, EXAMPLE_REPORT_GRC_PAYLOAD } from '@/data/exampleReport'
import { decodeShareToken, encodeShareToken } from '@/utils/reportShareToken'

describe('assessment calculation disclosure', () => {
  it('reconciles the actual quick example and preserves its arithmetic when shared', () => {
    const result = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    expect(result.riskScore).toBe(65)
    expect(result.additiveScore?.rows.reduce((sum, row) => sum + row.points, 0)).toBe(
      result.additiveScore?.total
    )
    expect(Math.max(0, Math.min(100, result.additiveScore!.total))).toBe(result.riskScore)
    const shared = decodeShareToken(encodeShareToken({ result }))
    expect(shared?.v).toBe(2)
    if (shared?.v !== 2) throw new Error('Expected a full report snapshot')
    expect(shared.result.additiveScore).toEqual(result.additiveScore)
    render(
      <RiskScoreWorking result={shared.result} industry={EXAMPLE_REPORT_SHARE_PAYLOAD.industry} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'How this was calculated' }))
    expect(screen.getByText('Additive total')).toBeInTheDocument()
    expect(screen.getByText(/After the 0–100 limit: 65/)).toBeInTheDocument()
    expect(screen.queryByText('Weighted total')).not.toBeInTheDocument()
  })

  it('keeps the comprehensive disclosure on the actual weighted scoring path', () => {
    const result = computeAssessment(EXAMPLE_REPORT_GRC_PAYLOAD)
    expect(result.additiveScore).toBeUndefined()
    expect(result.preBoostScore).toBeDefined()
    const working = riskScoreWorking(result, EXAMPLE_REPORT_GRC_PAYLOAD.industry)!
    expect(Math.max(0, Math.min(100, Math.round(working.base)))).toBe(result.preBoostScore)
  })

  it('does not invent a weighted reconstruction for an old quick snapshot', () => {
    const result = { ...computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD), additiveScore: undefined }
    render(<RiskScoreWorking result={result} industry={EXAMPLE_REPORT_SHARE_PAYLOAD.industry} />)
    fireEvent.click(screen.getByRole('button', { name: 'How this was calculated' }))
    expect(screen.getByText(/breakdown is unavailable/)).toBeInTheDocument()
    expect(screen.queryByText('Weighted total')).not.toBeInTheDocument()
  })

  it('refuses malformed or contradictory additive data in a shared URL', () => {
    const result = computeAssessment(EXAMPLE_REPORT_SHARE_PAYLOAD)
    const malformed = {
      ...result,
      additiveScore: { rows: 'invalid', total: 65 },
    } as unknown as typeof result
    expect(decodeShareToken(encodeShareToken({ result: malformed }))).toBeNull()
    const inconsistent = {
      ...result,
      additiveScore: { rows: [{ label: 'Input', points: 1 }], total: 65 },
    }
    expect(decodeShareToken(encodeShareToken({ result: inconsistent }))).toBeNull()
  })
})
