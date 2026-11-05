// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { Step4Sensitivity } from './Step4Sensitivity'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { industrySensitivityConfigs, getIndustryConfigs } from '@/data/industryAssessConfig'
const industry = 'Finance & Banking'
beforeEach(() => {
  useAssessmentStore.setState({ industry, dataSensitivity: [], sensitivityUnknown: false })
  usePersonaStore.setState({ selectedPersona: 'architect', experienceLevel: 'expert' })
})
describe('industry examples represent shared sensitivity-level answers', () => {
  it('two separate high examples select and clear the same single stored level', () => {
    const rows = getIndustryConfigs(industrySensitivityConfigs, industry)
    const highIndices = rows
      .map((row, index) => (row.sensitivityScore === 15 ? index : -1))
      .filter((i) => i >= 0)
    expect(highIndices.length).toBeGreaterThanOrEqual(2)
    render(<Step4Sensitivity hideHints />)
    expect(screen.getByText(/all examples at that level are selected together/)).toHaveTextContent(
      'not an inventory of data types'
    )
    const group = screen.getByRole('group', { name: industry + ' sensitivity-level examples' })
    const buttons = within(group).getAllByRole('button')
    fireEvent.click(buttons[highIndices[0]])
    expect(useAssessmentStore.getState().dataSensitivity).toEqual(['high'])
    expect(buttons[highIndices[0]]).toHaveAttribute('aria-pressed', 'true')
    expect(buttons[highIndices[1]]).toHaveAttribute('aria-pressed', 'true')
    for (const index of rows
      .map((row, index) => (row.sensitivityScore === 25 ? index : -1))
      .filter((i) => i >= 0))
      expect(buttons[index]).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(buttons[highIndices[1]])
    expect(useAssessmentStore.getState().dataSensitivity).toEqual([])
    expect(buttons[highIndices[0]]).toHaveAttribute('aria-pressed', 'false')
  })
})
