// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import {
  ALL_ITEMS,
  AuditReadinessChecklist,
  renderAuditPreview as exportPlanningMarkdown,
  renderExceptionsAndEvidenceMd as exportReferenceMarkdown,
} from './AuditReadinessChecklist'

vi.mock('@/hooks/useExecutiveModuleData', () => ({
  useExecutiveModuleData: () => ({
    isAssessmentComplete: false,
    industry: '',
    country: '',
    myFrameworks: [],
    myProducts: [],
    myThreats: [],
  }),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))

describe('Hub planning template and related-reading scope', () => {
  it('qualifies all-selected output without changing selected IDs or source references', () => {
    const data = Object.fromEntries(
      Object.entries(ALL_ITEMS).map(([section, items]) => [
        section,
        { selected: items.map((item) => item.value) },
      ])
    )
    const md = exportPlanningMarkdown(data, 'Fictional sector', 'Sample country')
    expect(md).toContain('not proof that every field is a source-mandated control')
    expect(md).toContain('Compatibility depends on the negotiated profile')
    expect(md).toContain('does not require every listed algorithm in every system')
    expect(md).not.toContain('deployed to maintain backward compatibility')
    for (const item of Object.values(ALL_ITEMS).flat()) {
      expect(md).toContain(`- [x] **Review topic: ${item.label}**`)
      expect(md).toContain(`Related reading: ${item.reference}`)
    }
    const examples = exportReferenceMarkdown(
      [],
      [
        {
          productOrAsset: 'Fictional portal',
          cmvpCertNumber: 'SAMPLE-MODULE',
          acvpRunId: 'SAMPLE-REFERENCE',
          esvStatus: 'Illustrative',
          cveScanDate: 'Sample date',
        },
      ]
    )
    expect(examples).toContain('Fictional reference examples')
    expect(examples).toContain('Keep Hub sample-test results separate from this checklist')
    expect(examples).toContain('SAMPLE-REFERENCE')
    expect(examples).not.toContain('validation prerequisite')
  })

  it('shows references as related reading in the actual planning controls', () => {
    render(
      <MemoryRouter>
        <AuditReadinessChecklist />
      </MemoryRouter>
    )
    expect(screen.getByText(/This is a Hub-authored educational/)).toBeTruthy()
    const hybrid = screen.getByRole('checkbox', { name: /Review topic: Hybrid mode deployed/ })
    expect(hybrid.getAttribute('aria-label') ?? hybrid.parentElement?.textContent).toContain(
      'Related reading:'
    )
    fireEvent.click(hybrid)
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(
      screen.getAllByText(/Compatibility depends on the negotiated profile/).length
    ).toBeGreaterThan(0)
  })
})
