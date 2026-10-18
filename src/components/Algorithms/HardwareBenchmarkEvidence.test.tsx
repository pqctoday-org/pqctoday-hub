// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { HardwareBenchmarkEvidence } from './HardwareBenchmarkEvidence'
import { KV260_FPGA_ROWS } from '@/components/PKILearning/modules/PQCHardwareAcceleration/data/measurements'

describe('HardwareBenchmarkEvidence', () => {
  it('actually highlights the KV260 FPGA rows the text calls "highlighted"', () => {
    render(
      <MemoryRouter>
        <HardwareBenchmarkEvidence />
      </MemoryRouter>
    )
    expect(screen.getByText(/highlighted KV260 SLH-DSA-SHAKE rows/)).toBeInTheDocument()
    // eslint-disable-next-line testing-library/no-node-access
    const marked = Array.from(document.querySelectorAll<HTMLElement>('[data-kv260-fpga="true"]'))
    expect(marked.length).toBeGreaterThan(0)
    for (const row of marked) {
      expect(row.className).toMatch(/bg-primary\/10/)
      const name = row.querySelector('th')?.textContent ?? ''
      expect(KV260_FPGA_ROWS).toContain(name)
    }
  })

  it('discloses the measurement window from the cited source', () => {
    render(
      <MemoryRouter>
        <HardwareBenchmarkEvidence />
      </MemoryRouter>
    )
    expect(screen.getByText(/2 s per measurement after a 0\.5 s warm-up/)).toBeInTheDocument()
    expect(screen.getByText(/no run-to-run spread is recorded/)).toBeInTheDocument()
  })
})
