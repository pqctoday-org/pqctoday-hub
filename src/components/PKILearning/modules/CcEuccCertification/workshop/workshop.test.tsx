// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import {
  ASSURANCE_COMPONENTS,
  CC_DECODER_RECORDS,
  CC_MANDATORY_ERRATA_VERSION,
  EIDAS_TRACE_SCENARIOS,
} from '../data/ccEuData'
import { CcClaimDecoder } from './CcClaimDecoder'
import { EidasTrace } from './EidasTrace'

const wrap = (node: React.ReactNode) => render(<MemoryRouter>{node}</MemoryRouter>)

describe('CC certificate claim decoder', () => {
  it('states the selected EUCC scope instead of teaching a universal eIDAS route', () => {
    for (const scenario of EIDAS_TRACE_SCENARIOS) {
      expect(scenario.setup).toMatch(/EUCC/)
      expect(scenario.setup).toMatch(/not a universal|does not make EUCC mandatory/)
    }
    const legal = EIDAS_TRACE_SCENARIOS[0].layers.find((layer) => layer.id === 'legal')
    const correct = legal?.options.find((option) => option.correct)
    expect(correct?.feedback).toContain('legal device-security requirements in Annex II')
    expect(correct?.feedback).not.toContain('does not contain security functional requirements')
  })
  it('checks a component against its exact meaning and exports the current CC baseline', () => {
    const record = CC_DECODER_RECORDS[0]
    const code = record.components[0]
    const meaning = ASSURANCE_COMPONENTS.get(code)?.plain
    if (!meaning) throw new Error(`missing assurance component ${code}`)

    wrap(<CcClaimDecoder config={{ recordId: record.id }} />)
    fireEvent.click(screen.getByRole('button', { name: meaning }))
    expect(screen.getByRole('status')).toHaveTextContent(`Right — ${code}`)
    expect(
      screen.getByText((text) => text.includes(`mandatory errata ${CC_MANDATORY_ERRATA_VERSION}`))
    ).toBeInTheDocument()
  })
})

describe('eIDAS regulation-to-certificate trace', () => {
  it('corrects the regulation-is-a-PP misconception and records a solved layer', () => {
    const scenario = EIDAS_TRACE_SCENARIOS[0]
    const layer = scenario.layers[0]
    const wrong = layer.options.find((o) => !o.correct)
    const right = layer.options.find((o) => o.correct)
    if (!wrong || !right) throw new Error('trace fixture lacks answer choices')

    wrap(<EidasTrace config={{ scenario: scenario.id, layer: layer.id }} />)
    fireEvent.click(screen.getByRole('button', { name: wrong.label }))
    expect(screen.getByRole('status')).toHaveTextContent('Try another option')
    fireEvent.click(screen.getByRole('button', { name: right.label }))
    expect(screen.getByRole('status')).toHaveTextContent('Right')
    expect(
      screen.getAllByText((text) => text.includes(layer.link.slice(0, 30))).length
    ).toBeGreaterThan(0)
    expect(screen.getByText(/Layers traced: 1 of/)).toBeInTheDocument()
  })

  it('binds the remote-QSCD PP layer to the PP, assessment and notification sources', () => {
    const remote = EIDAS_TRACE_SCENARIOS.find((s) => s.id === 'remote-signing')
    const pp = remote?.layers.find((l) => l.id === 'pp')
    expect(pp?.openQuestion).toBeUndefined()
    expect(pp?.sourceIds).toEqual(
      expect.arrayContaining([
        'ANSSI-CC-PP-2018-02-EN-419241-2',
        'CID-EU-2016-650-QSCD-Security-Assessment',
        'CIR-EU-2025-1570-QSCD-Certification-Notification',
      ])
    )
  })

  it('contains no obsolete pending-library annotations', () => {
    const serialized = JSON.stringify(EIDAS_TRACE_SCENARIOS)
    expect(serialized).not.toMatch(/library row pending/i)
  })
})
