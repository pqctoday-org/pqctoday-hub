// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PolicyTemplateGenerator } from './PolicyTemplateGenerator'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'

vi.mock('@/hooks/useExecutiveModuleData', () => {
  const data = { frameworksByIndustry: [], myFrameworks: [], migrationDeadlineYear: null }
  return { useExecutiveModuleData: () => data }
})

const current = () => useModuleStore.getState().artifacts.executiveDocuments![0]
const save = () => fireEvent.click(screen.getByRole('button', { name: /^Save/ }))
const choose = (name: RegExp) => fireEvent.click(screen.getByRole('button', { name }))
function addRule(kpi: string, threshold: string, policyAction: string) {
  fireEvent.click(screen.getByRole('button', { name: '+ Add drift rule' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'KPI' }), { target: { value: kpi } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Threshold' }), {
    target: { value: threshold },
  })
  fireEvent.change(screen.getByRole('textbox', { name: 'Policy action' }), {
    target: { value: policyAction },
  })
}
function restore(doc: ExecutiveDocument) {
  act(() =>
    useModuleStore.setState((s) => ({
      artifacts: { ...s.artifacts, executiveDocuments: [JSON.parse(JSON.stringify(doc))] },
    }))
  )
}
function legacy(inputs: unknown, data: string) {
  restore({
    id: 'sample-legacy-policy',
    moduleId: 'pqc-governance',
    type: 'policy-draft',
    title: 'Sample original policy',
    inputs,
    data,
    createdAt: 10,
  })
}
beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})

describe('Policy rule draft fidelity', () => {
  it('preserves exact structured strings and saves rules-only changes; Markdown keeps three cells', () => {
    const rule = {
      kpi: 'Coverage | "sample"\nnext',
      threshold: '< 80% | 90%',
      policyAction: 'Review C:\\sample | owner',
    }
    legacy(
      { policyType: 'crypto-algorithm', formData: {}, kpiDriftRules: [rule] },
      'Sample structured draft'
    )
    render(<PolicyTemplateGenerator />)
    save()
    expect(current().inputs).toMatchObject({
      policyType: 'crypto-algorithm',
      kpiDriftRules: [rule],
    })
    fireEvent.change(screen.getByRole('textbox', { name: 'Threshold' }), {
      target: { value: '75.5%' },
    })
    save()
    expect(current().inputs).toMatchObject({ kpiDriftRules: [{ ...rule, threshold: '75.5%' }] })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    // The production Markdown renderer independently parses the escaped export.
    // eslint-disable-next-line testing-library/no-node-access -- inspect the parsed table containing its unique header
    const table = screen.getByRole('columnheader', { name: 'KPI' }).closest('table')!
    const rows = within(table).getAllByRole('row')
    expect(within(rows[1]).getAllByRole('cell')).toHaveLength(3)
    expect(within(rows[1]).getAllByRole('cell')[0]).toHaveTextContent('Coverage | "sample" next')
    expect(within(rows[1]).getAllByRole('cell')[2]).toHaveTextContent('Review C:\\sample | owner')
  })

  it('roundtrips separate policy drafts and explicit empty rules without overwriting the other type', () => {
    const view = render(<PolicyTemplateGenerator />)
    addRule('Portal coverage', '80%', 'Review portal plan')
    fireEvent.change(screen.getByRole('textbox', { name: /Organization Name/ }), {
      target: { value: 'Sample portal policy' },
    })
    save()
    choose(/Key Management Policy/i)
    expect(screen.queryByRole('textbox', { name: 'KPI' })).not.toBeInTheDocument()
    addRule('Key rotation', '90 days', 'Review key plan')
    fireEvent.change(screen.getByRole('textbox', { name: /Organization Name/ }), {
      target: { value: 'Sample key policy' },
    })
    save()
    const saved = JSON.parse(JSON.stringify(current())) as ExecutiveDocument
    expect(saved.inputs).toMatchObject({
      policyDraftsByType: {
        'crypto-algorithm': {
          kpiDriftRules: [
            { kpi: 'Portal coverage', threshold: '80%', policyAction: 'Review portal plan' },
          ],
        },
        'key-management': {
          kpiDriftRules: [
            { kpi: 'Key rotation', threshold: '90 days', policyAction: 'Review key plan' },
          ],
        },
      },
    })
    view.unmount()
    restore(saved)
    const { unmount: unmountReopened } = render(<PolicyTemplateGenerator />)
    expect(screen.getByRole('textbox', { name: /Organization Name/ })).toHaveValue(
      'Sample portal policy'
    )
    expect(screen.getByRole('textbox', { name: 'KPI' })).toHaveValue('Portal coverage')
    fireEvent.click(screen.getByRole('button', { name: 'Remove drift rule' }))
    save()
    expect(current().inputs).toMatchObject({
      kpiDriftRules: [],
      policyDraftsByType: {
        'crypto-algorithm': { kpiDriftRules: [] },
        'key-management': { kpiDriftRules: [{ kpi: 'Key rotation' }] },
      },
    })
    const empty = JSON.parse(JSON.stringify(current())) as ExecutiveDocument
    unmountReopened()
    restore(empty)
    render(<PolicyTemplateGenerator />)
    expect(screen.queryByRole('textbox', { name: 'KPI' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Start replacement rule list' })
    ).not.toBeInTheDocument()
    choose(/Key Management Policy/i)
    expect(screen.getByRole('textbox', { name: /Organization Name/ })).toHaveValue(
      'Sample key policy'
    )
    expect(screen.getByRole('textbox', { name: 'KPI' })).toHaveValue('Key rotation')
  })

  it('does not leak unsaved rule edits across policy tabs', () => {
    render(<PolicyTemplateGenerator />)
    addRule('Unsaved sample rule', '12', 'Discuss')
    choose(/Vendor Crypto Requirements/i)
    expect(screen.queryByRole('textbox', { name: 'KPI' })).not.toBeInTheDocument()
    choose(/Cryptographic Algorithm Policy/i)
    expect(screen.getByRole('textbox', { name: 'KPI' })).toHaveValue('Unsaved sample rule')
  })

  it('keeps ambiguous original text read-only and preserved until an explicit replacement, retaining unknown keys', () => {
    const original =
      '# Original sample\n\n## KPI Drift Rules\n| ambiguous | text | extra |\n## KPI Drift Rules\ncontinued\n'
    const future = { raw: 'unchanged', rules: { unsupported: ['future'] } }
    legacy(
      {
        policyType: 'crypto-algorithm',
        formData: { general: { 'org-name': 'Original sample' } },
        futureTop: { preserved: true },
        policyDraftsByType: { 'future-policy': future },
      },
      original
    )
    const view = render(<PolicyTemplateGenerator />)
    expect(screen.queryByRole('textbox', { name: 'KPI' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start replacement rule list' })).toBeInTheDocument()
    fireEvent.change(screen.getByRole('textbox', { name: /Organization Name/ }), {
      target: { value: 'Edited sample name' },
    })
    save()
    expect(current().data).toContain(original)
    expect(current().data).not.toContain('_No drift rules defined.')
    expect(current().inputs).toMatchObject({
      futureTop: { preserved: true },
      policyDraftsByType: { 'future-policy': future },
    })
    expect((current().inputs as Record<string, unknown>).kpiDriftRules).toBeUndefined()
    const preserved = JSON.parse(JSON.stringify(current())) as ExecutiveDocument
    view.unmount()
    restore(preserved)
    render(<PolicyTemplateGenerator />)
    expect(screen.getByRole('button', { name: 'Start replacement rule list' })).toBeInTheDocument()
    save()
    fireEvent.click(screen.getByRole('button', { name: 'Start replacement rule list' }))
    save()
    expect(current().inputs).toMatchObject({
      kpiDriftRules: [],
      originalPolicySnapshot: { data: original },
    })
    expect(current().data).toContain('_No sample drift rules defined.')
    expect(current().data).toContain(original)
    expect(current().inputs).toMatchObject({ policyDraftsByType: { 'future-policy': future } })
  })
})
