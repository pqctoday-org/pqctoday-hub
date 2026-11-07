// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RiskRegisterBuilder, buildRiskRegisterMarkdown } from './RiskRegisterBuilder'
import { useRiskRegisterStore } from '@/store/useRiskRegisterStore'
import { useModuleStore } from '@/store/useModuleStore'
import { markdownToPdf } from '@/services/export/pdfExport'
import { copyToClipboard } from '@/utils/clipboard'
import { BUSINESS_TOOLS } from '@/components/BusinessCenter/businessToolsRegistry'
import { PERSONA_BLOCKS } from '@/data/personaBlocks'
import { demoDocFor } from '@/components/Simulation/autorun/demoDocs'
import { REAL_DOC_GENERATORS } from '@/components/Simulation/autorun/realToolDocs'

vi.mock('@/services/export/pdfExport', () => ({
  markdownToPdf: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/utils/clipboard', () => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }))
vi.mock('./RiskHeatmapGenerator', () => ({ EducationalGuide: () => null }))

const sample = Object.freeze({
  id: 'fictional-scope-test',
  assetName: 'Fictional signing service',
  currentAlgorithm: 'RSA-2048',
  threatVector: 'forgery',
  likelihood: 4,
  impact: 4,
  mitigation: 'Evaluate sample signing transition',
})
function Harness() {
  const entries = useRiskRegisterStore((s) => s.riskEntries)
  const setEntries = useRiskRegisterStore((s) => s.setRiskEntries)
  return (
    <RiskRegisterBuilder
      riskEntries={entries}
      onRiskEntriesChange={setEntries}
      showExampleBanner={false}
    />
  )
}
const savedDocuments = () => useModuleStore.getState().artifacts.executiveDocuments ?? []

beforeEach(() => {
  useRiskRegisterStore.setState({ riskEntries: [sample], lastSavedKey: null })
  useModuleStore.setState({
    artifacts: { ...useModuleStore.getState().artifacts, executiveDocuments: [] },
  })
  vi.clearAllMocks()
})

describe('risk worksheet scope and production capability teaching', () => {
  it('describes existing fields and limitations without adding owner/date controls or changing scores', () => {
    render(<Harness />)
    expect(screen.getByLabelText('Risk worksheet scope')).toHaveTextContent(
      'does not capture risk owners, scheduled review dates or treatment status'
    )
    expect(screen.getByLabelText('Risk worksheet scope')).toHaveTextContent(
      'completing a record does not demonstrate risk reduction'
    )
    expect(screen.getByDisplayValue(sample.assetName)).toBeInTheDocument()
    expect(screen.getByText('Score: 16 (High)')).toBeInTheDocument()
    expect(
      screen.queryByLabelText(/risk owner|review date|treatment status/i)
    ).not.toBeInTheDocument()
    expect(useRiskRegisterStore.getState().riskEntries).toEqual([sample])
  })

  it('preserves table fields, numeric summary and source footer in the shared Markdown while adding scope', () => {
    const md = buildRiskRegisterMarkdown([sample])
    expect(md.split('\n').filter((line) => line.startsWith('|'))).toEqual([
      '| # | Asset | Algorithm | Threat Vector | L | I | Score | Level | Mitigation |',
      '|---|-------|-----------|---------------|---|---|-------|-------|------------|',
      '| 1 | Fictional signing service | RSA-2048 | Signature Forgery (Code Signing / Certs) | 4 | 4 | 16 | High | Evaluate sample signing transition |',
    ])
    expect(md).toContain(
      '- **Critical:** 0\n- **High:** 1\n- **Medium:** 0\n- **Low:** 0\n- **Total Entries:** 1'
    )
    expect(md).toContain('Sample risk worksheet.')
    expect(md).toContain('does not capture risk owners, scheduled review dates or treatment status')
    expect(md).toContain('## Production-tool capabilities to evaluate')
    expect(md).toContain('NIST CSWP 39 §5 (Strategic Plan) and §6.5')
    expect(sample.mitigation).toBe('Evaluate sample signing transition')
  })

  it('saves, copies and passes the same scope-bearing Markdown to PDF, preserving entries across remount', async () => {
    const view = render(<Harness />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Asset Name' }), {
      target: { value: 'Edited fictional service' },
    })
    const entries = useRiskRegisterStore.getState().riskEntries
    const expected = buildRiskRegisterMarkdown(entries)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(savedDocuments()).toHaveLength(1)
    expect(savedDocuments()[0].data).toBe(expected)
    expect(savedDocuments()[0].type).toBe('risk-register')
    expect(useRiskRegisterStore.getState().riskEntries).toEqual([
      { ...sample, assetName: 'Edited fictional service' },
    ])
    view.unmount()
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
    expect(screen.getByDisplayValue('Edited fictional service')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Copy Markdown' }))
    expect(copyToClipboard).toHaveBeenCalledWith(expected)
    await screen.findByRole('button', { name: 'Copied' })
    fireEvent.click(screen.getByRole('button', { name: '.pdf' }))
    expect(markdownToPdf).toHaveBeenCalledWith(
      expected,
      'quantum-risk-register',
      'Quantum Risk Register',
      { wideTable: true }
    )
    expect(savedDocuments()).toHaveLength(1)
    expect(sample.assetName).toBe('Fictional signing service')
  })

  it('does not rewrite an older saved document merely by rendering the new educational guidance', () => {
    const old = {
      id: 'older-sample',
      moduleId: 'pqc-risk-management',
      type: 'risk-register' as const,
      title: 'Prior sample worksheet',
      data: 'Prior sample rendering, retained verbatim',
      createdAt: 1,
    }
    useModuleStore.setState({
      artifacts: { ...useModuleStore.getState().artifacts, executiveDocuments: [old] },
    })
    useRiskRegisterStore.setState({ lastSavedKey: old.data })
    render(<Harness />)
    expect(savedDocuments()).toEqual([old])
    expect(useRiskRegisterStore.getState().riskEntries).toEqual([sample])
  })

  it('aligns same-writer discovery aliases and both Simulation document paths without inventing fields', () => {
    const entry = BUSINESS_TOOLS.find((x) => x.id === 'risk-register')!
    expect(entry.description).toContain('sample risk worksheet')
    expect(entry.goodAnswer).toContain('does not track owners or review dates')
    expect(entry.workedExample).toContain('Score: 20 (Critical)')
    expect(PERSONA_BLOCKS['/business/tools/risk-register'].grc).not.toContain(
      'impact, owner and mitigation'
    )
    expect(PERSONA_BLOCKS['/business/tools/risk-register'].executive).toContain(
      'does not capture those fields'
    )
    const real = REAL_DOC_GENERATORS['risk-register']!('general')
    expect(real.data).toContain('Sample risk worksheet.')
    const fallback = demoDocFor('risk-register', 'general')
    expect(fallback.data).toContain('Fictional planning example — not a reviewed risk assessment')
    expect(fallback.data).toContain(
      '| Asset | Current algorithm | Threat | Likelihood (1–5) | Impact (1–5) | Mitigation |'
    )
    expect(fallback.data).not.toContain('does not capture risk owners')
  })
})
