// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuditReadinessChecklist,
  type ExceptionRow,
  type EvidenceRow,
} from './AuditReadinessChecklist'
import type { ArtifactFormData } from '../../../common/executive/ArtifactBuilder'
import type { AuditPrefillOwnership } from './auditPrefillOwnership'
import { ARTIFACT_AUTOSAVE_DELAY_MS } from '../../../common/executive/ExportableArtifact'
import type { ExecutiveDocument } from '@/services/storage/types'
const save = vi.fn()
let docs: ExecutiveDocument[] = []
const fullContext = {
  isAssessmentComplete: true,
  industry: 'Fictional sector',
  country: 'Fictional country',
  myFrameworks: [{ id: 'sample-framework' }],
  myProducts: [{ id: 'sample-product' }],
  myThreats: [{ id: 'sample-threat' }],
}
let context = fullContext
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => context }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector?: (state: unknown) => unknown) => {
    const state = { addExecutiveDocument: save, artifacts: { executiveDocuments: docs } }
    return selector ? selector(state) : state
  },
}))
beforeEach(() => {
  docs = []
  save.mockReset()
  context = fullContext
})
afterEach(() => vi.useRealTimers())
const box = (name: string) =>
  screen.getByRole('checkbox', { name: new RegExp(`^Review topic: ${name}`) })
const clear = () => screen.getByRole('button', { name: 'Clear untouched topic suggestions' })
const saveNow = () =>
  fireEvent.click(screen.getByRole('button', { name: /^Save$|^Saved(?: · edited since)?$/ }))
type SavedAuditDocument = Omit<ExecutiveDocument, 'inputs'> & {
  inputs: {
    checklistData: ArtifactFormData
    exceptions: ExceptionRow[]
    evidence: EvidenceRow[]
    prefillOwnership: AuditPrefillOwnership
    originalSavedInputs?: unknown
  }
}
const latest = () => save.mock.lastCall![0] as SavedAuditDocument

describe('Audit clear prefill preserves learner draft ownership', () => {
  it('keeps off/on learner choice, independent checked topic, notes and focus while clearing only untouched suggestions', () => {
    const view = render(<AuditReadinessChecklist />)
    expect(box('All systems cataloged')).toBeChecked()
    fireEvent.click(box('All systems cataloged'))
    fireEvent.click(box('All systems cataloged'))
    fireEvent.click(box('PQC policy published'))
    fireEvent.click(screen.getByRole('button', { name: '+ Add exception' }))
    fireEvent.change(screen.getByPlaceholderText('Scope (asset / system)'), {
      target: { value: 'Fictional portal, "sample"' },
    })
    fireEvent.change(screen.getByPlaceholderText('Compensating control'), {
      target: { value: 'Keep learner note' },
    })
    fireEvent.click(screen.getByRole('button', { name: '+ Add evidence row' }))
    fireEvent.change(screen.getByPlaceholderText('Product / asset'), {
      target: { value: 'Sample-only note' },
    })
    saveNow()
    const before = latest()
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    const action = clear()
    action.focus()
    fireEvent.click(action)
    expect(action).toHaveFocus()
    expect(
      screen.getAllByRole('checkbox').every((element) => element.hasAttribute('disabled'))
    ).toBe(true)
    expect(screen.getByRole('status')).toHaveTextContent('4 untouched topic suggestions cleared')
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(box('All systems cataloged')).toBeChecked()
    expect(box('PQC policy published')).toBeChecked()
    expect(box('Vendors assessed')).not.toBeChecked()
    expect(box('Migration plan documented')).not.toBeChecked()
    expect(box('Compliance mapping complete')).not.toBeChecked()
    expect(box('Threat model updated')).not.toBeChecked()
    saveNow()
    const saved = latest()
    const input = saved.inputs as typeof before.inputs & {
      prefillOwnership: { untouchedInserted: unknown[]; cleared: boolean }
    }
    expect(input.exceptions).toEqual(before.inputs?.exceptions)
    expect(input.evidence).toEqual(before.inputs?.evidence)
    expect(input.prefillOwnership).toMatchObject({ untouchedInserted: [], cleared: true })
    view.unmount()
    docs = [saved]
    render(<AuditReadinessChecklist />)
    expect(box('All systems cataloged')).toBeChecked()
    expect(box('PQC policy published')).toBeChecked()
    expect(box('Vendors assessed')).not.toBeChecked()
    expect(screen.getByPlaceholderText('Scope (asset / system)')).toHaveValue(
      'Fictional portal, "sample"'
    )
    expect(screen.getByText(/Checked boxes record topic inclusion only/)).toBeInTheDocument()
    expect(
      screen.queryByText(/Suggested planning topics have been selected/)
    ).not.toBeInTheDocument()
  })
  it('preserves a legacy equal-to-default entry with an explanation and keeps one raw snapshot on repeated save/reload', () => {
    const original = {
      checklistData: { 'crypto-inventory': { 'inventory-checklist': ['systems-cataloged'] } },
      exceptions: [
        {
          scope: 'Fictional scope',
          compensatingControl: 'Keep',
          owner: 'Sample role',
          sunset: 'Illustrative',
        },
      ],
      evidence: [],
      futureMemo: { value: 'Opaque saved note' },
    }
    docs = [
      {
        id: 'legacy',
        type: 'audit-checklist',
        moduleId: 'compliance-strategy',
        title: 'Legacy sample draft',
        data: 'Fictional legacy draft',
        createdAt: 1,
        inputs: original,
      },
    ]
    const view = render(<AuditReadinessChecklist />)
    expect(
      screen.getByText(/Loaded draft did not record supported prefill ownership/)
    ).toBeInTheDocument()
    fireEvent.click(clear())
    expect(box('All systems cataloged')).toBeChecked()
    expect(box('Vendors assessed')).not.toBeChecked()
    saveNow()
    const saved = latest()
    expect(saved.inputs?.originalSavedInputs).toEqual(original)
    expect(saved.inputs?.exceptions).toEqual(original.exceptions)
    expect(saved.inputs?.prefillOwnership).toMatchObject({
      untouchedInserted: [],
      inheritedOriginUnknown: true,
    })
    view.unmount()
    docs = [saved]
    render(<AuditReadinessChecklist />)
    fireEvent.click(clear())
    saveNow()
    expect(latest().inputs?.originalSavedInputs).toEqual(original)
    expect(box('All systems cataloged')).toBeChecked()
  })
  it('cancels stale pending autosave after clear and keeps a subsequent context change from repopulating fields', () => {
    vi.useFakeTimers()
    const view = render(<AuditReadinessChecklist />)
    act(() => window.dispatchEvent(new Event('pointerdown', { bubbles: true })))
    saveNow()
    fireEvent.click(box('PQC policy published'))
    act(() => vi.advanceTimersByTime(ARTIFACT_AUTOSAVE_DELAY_MS - 1))
    fireEvent.click(clear())
    act(() => vi.advanceTimersByTime(ARTIFACT_AUTOSAVE_DELAY_MS + 1))
    const input = latest().inputs as {
      checklistData: Record<string, Record<string, string[]>>
      prefillOwnership: { cleared: boolean }
    }
    expect(input.checklistData['policy-governance']['policy-checklist']).toEqual(['pqc-policy'])
    expect(input.checklistData['crypto-inventory']['inventory-checklist']).toEqual([])
    expect(input.prefillOwnership.cleared).toBe(true)
    context = { ...fullContext, country: 'Another fictional context' }
    view.rerender(<AuditReadinessChecklist />)
    expect(box('PQC policy published')).toBeChecked()
    expect(box('All systems cataloged')).not.toBeChecked()
    act(() => vi.advanceTimersByTime(ARTIFACT_AUTOSAVE_DELAY_MS + 1))
    expect(
      (latest().inputs as typeof input).checklistData['crypto-inventory']['inventory-checklist']
    ).toEqual([])
  })
  it('with context but zero inserted ownership keeps manually checked topics', () => {
    context = {
      ...fullContext,
      isAssessmentComplete: false,
      myFrameworks: [],
      myProducts: [],
      myThreats: [],
    }
    render(<AuditReadinessChecklist />)
    fireEvent.click(box('All systems cataloged'))
    fireEvent.click(clear())
    expect(box('All systems cataloged')).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('0 untouched topic suggestions cleared')
    saveNow()
    expect(latest().inputs?.prefillOwnership).toMatchObject({
      untouchedInserted: [],
      cleared: true,
      inheritedOriginUnknown: false,
    })
  })
  it('saves caller-owned note-only edits without changing any selected topic', () => {
    render(<AuditReadinessChecklist />)
    saveNow()
    const before = latest()
    fireEvent.click(screen.getByRole('button', { name: '+ Add exception' }))
    fireEvent.change(screen.getByPlaceholderText('Scope (asset / system)'), {
      target: { value: 'Fictional note only' },
    })
    saveNow()
    const after = latest()
    expect(after.inputs?.checklistData).toEqual(before.inputs?.checklistData)
    expect(after.inputs?.exceptions).toEqual([
      { scope: 'Fictional note only', compensatingControl: '', owner: '', sunset: '' },
    ])
    expect(save).toHaveBeenCalledTimes(2)
  })
  it('saves ownership-only edits even when a toggle away and back restores identical field bytes', () => {
    render(<AuditReadinessChecklist />)
    saveNow()
    const before = latest()
    fireEvent.click(box('All systems cataloged'))
    fireEvent.click(box('All systems cataloged'))
    saveNow()
    const after = latest()
    expect(after.inputs?.checklistData).toEqual(before.inputs?.checklistData)
    const ownership = after.inputs?.prefillOwnership as {
      untouchedInserted: { optionValue: string }[]
    }
    expect(
      ownership.untouchedInserted.some((token) => token.optionValue === 'systems-cataloged')
    ).toBe(false)
    expect(save).toHaveBeenCalledTimes(2)
    fireEvent.click(clear())
    expect(box('All systems cataloged')).toBeChecked()
  })
  it('does not claim or insert new prefill when context arrives after the draft was initialized', () => {
    context = {
      ...fullContext,
      isAssessmentComplete: false,
      myFrameworks: [],
      myProducts: [],
      myThreats: [],
    }
    const view = render(<AuditReadinessChecklist />)
    fireEvent.click(box('PQC policy published'))
    context = fullContext
    view.rerender(<AuditReadinessChecklist />)
    expect(box('All systems cataloged')).not.toBeChecked()
    expect(box('PQC policy published')).toBeChecked()
    expect(
      screen.queryByText(/Suggested planning topics have been selected/)
    ).not.toBeInTheDocument()
    fireEvent.click(clear())
    expect(box('PQC policy published')).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('0 untouched topic suggestions cleared')
  })
})
