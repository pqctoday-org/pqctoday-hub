// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { DataAssetExercises } from './DataAssetExercises'

describe('root-CA exercise: CNSA 2.0 dates', () => {
  it('gives the FAQ dates, not the 2022 category schedule, as the requirement', () => {
    render(
      <MemoryRouter>
        <DataAssetExercises onNavigateToWorkshop={vi.fn()} onSetWorkshopConfig={vi.fn()} />
      </MemoryRouter>
    )
    expect(
      screen.getByText(
        /new acquisitions from 1 January 2027, equipment that cannot support CNSA 2\.0 phased out by 31 December 2030 \(exceptions possible\), and CNSA 2\.0 algorithms mandated by 31 December 2031 unless otherwise noted/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/exclusive CNSA 2\.0 use by 2030|exclusive use by 2033/)).toBeNull()
  })
})
