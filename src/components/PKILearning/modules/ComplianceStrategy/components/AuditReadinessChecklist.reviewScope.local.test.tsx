// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { AuditReadinessChecklist } from './AuditReadinessChecklist'

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    isAssessmentComplete: true, industry: 'Fictional sector', country: 'Sample country',
    myFrameworks: [{ id: 'bookmarked-framework' }], myProducts: [{ id: 'bookmarked-product' }], myThreats: [{ id: 'bookmarked-threat' }],
  }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))

describe('Audit planning topic selections do not establish audit results', () => {
  it('preserves seeded participation while refusing readiness claims even after selecting every topic', () => {
    render(<MemoryRouter><AuditReadinessChecklist /></MemoryRouter>)
    const boxes = screen.getAllByRole('checkbox') as HTMLInputElement[]
    expect(boxes.some((box) => box.checked)).toBe(true)
    expect(screen.getByText(/Checked boxes record topic inclusion only/)).toBeInTheDocument()
    for (const box of boxes) if (!box.checked) fireEvent.click(box)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(screen.getByText(`Planning topics selected: ${boxes.length}/${boxes.length} (100%)`)).toBeInTheDocument()
    expect(screen.getByText(/they do not establish completed controls, audited readiness or validation/)).toBeInTheDocument()
    expect(screen.queryByText(/Overall Readiness:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Maturity Level:/)).not.toBeInTheDocument()
  })
})
