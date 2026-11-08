// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ClosureHandoverRegister } from './ClosureHandoverRegister'
import { useModuleStore } from '@/store/useModuleStore'
import { CLOSURE_SCOPE, CLOSURE_TYPE, CLOSURE_MODULE } from './closureHandoverArtifact'
import { scopedArtifactInputs } from '@/hooks/useSavedArtifactInputs'
vi.mock('@/utils/analytics', async (original) => ({
  ...(await original<typeof import('@/utils/analytics')>()),
  logArtifactGenerated: vi.fn(),
}))
const roles = [
  ['CBOM + continuous discovery', 'Crypto Gov Owner', '2027-01-02'],
  ['Vendor governance cadence', 'Supplier Risk', '2027-01-03'],
  ['SOC detection content (crypto drift)', 'SOC Manager', '2027-01-04'],
  ['KRI / board reporting', 'Risk / GRC', '2027-01-05'],
  ['Crypto-agility OKRs', 'Architecture', '2027-01-06'],
] as const
const criteria = [
  'Maturity ≥ Level 4 across domains',
  'Tier-1 systems 100% verified',
  'Tier-2 sample verified, failures cleared',
  'Residual risk accepted by SteerCo (owner + re-eval date)',
]
function documents() {
  return useModuleStore.getState().artifacts.executiveDocuments ?? []
}
beforeEach(() => {
  localStorage.clear()
  useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
})
afterEach(() => {
  vi.restoreAllMocks()
})
async function fill() {
  const user = userEvent.setup()
  for (const [label, owner, date] of roles) {
    await user.click(screen.getByRole('button', { name: 'Owner for ' + label }))
    await user.click(screen.getByRole('option', { name: owner }))
    fireEvent.change(screen.getByLabelText('Handover date for ' + label), {
      target: { value: date },
    })
  }
  for (const name of criteria)
    await user.click(
      screen.getByRole('button', { name: (accessibleName) => accessibleName.includes(name) })
    )
  return user
}
describe('Actual closure artifact save and restore', () => {
  it('does not award a saved/archive outcome just for completing fields; saves exact values and restores them', async () => {
    const view = render(<ClosureHandoverRegister />),
      user = await fill()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(
      screen.getByText('Sample checklist entries complete — closure not assessed')
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const saved = documents().find((d) => d.moduleId === CLOSURE_MODULE)!
    expect(saved.type).toBe(CLOSURE_TYPE)
    expect(saved.inputs).toMatchObject({
      __artifactScope: CLOSURE_SCOPE,
      owner: { cbom: 'Crypto Gov Owner', agility: 'Architecture' },
      date: { vendor: '2027-01-03' },
      criteria: ['maturity', 'tier1', 'tier2', 'residual'],
    })
    expect(saved.data).toContain(
      'Entry completeness: Complete (5/5 capability assignments; 4/4 acknowledgments)'
    )
    expect(screen.getByRole('button', { name: 'Saved' })).toBeInTheDocument()
    view.unmount()
    render(<ClosureHandoverRegister />)
    expect(screen.getByLabelText('Handover date for Vendor governance cadence')).toHaveValue(
      '2027-01-03'
    )
    expect(screen.getByRole('button', { name: 'Owner for Crypto-agility OKRs' })).toHaveTextContent(
      'Architecture'
    )
    expect(
      within(screen.getByRole('region', { name: 'Generated sample closure record' })).getByText(
        'Entry completeness: Complete (5/5 capability assignments; 4/4 acknowledgments).'
      )
    ).toBeInTheDocument()
  })
  it('re-saves an actual changed date and unselected acknowledgment and preserves unrelated docs', async () => {
    useModuleStore.setState((s) => ({
      artifacts: {
        ...s.artifacts,
        executiveDocuments: [
          {
            id: 'other',
            moduleId: 'other-module',
            type: CLOSURE_TYPE,
            title: 'Other',
            data: 'Unrelated original',
            createdAt: 1,
            inputs: scopedArtifactInputs(CLOSURE_SCOPE, {
              other: true,
              owner: { cbom: 'Architecture' },
              date: { cbom: '2029-09-09' },
              criteria: ['maturity'],
            }),
          },
        ],
      },
    }))
    const view = render(<ClosureHandoverRegister />)
    expect(screen.getByLabelText('Handover date for CBOM + continuous discovery')).toHaveValue('')
    const user = await fill()
    await user.click(screen.getByRole('button', { name: 'Save' }))
    fireEvent.change(screen.getByLabelText('Handover date for CBOM + continuous discovery'), {
      target: { value: '' },
    })
    await user.click(screen.getByRole('button', { name: /Tier-1 systems 100% verified/ }))
    expect(screen.getByRole('button', { name: 'Saved · edited since' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Saved · edited since' }))
    const saved = documents().find((d) => d.moduleId === CLOSURE_MODULE)!
    expect(saved.inputs).toMatchObject({
      date: { cbom: '' },
      criteria: ['maturity', 'tier2', 'residual'],
    })
    expect(saved.data).toContain(
      'Entry completeness: Incomplete (4/5 capability assignments; 3/4 acknowledgments)'
    )
    expect(documents().find((d) => d.id === 'other')).toMatchObject({
      data: 'Unrelated original',
      inputs: scopedArtifactInputs(CLOSURE_SCOPE, {
        other: true,
        owner: { cbom: 'Architecture' },
        date: { cbom: '2029-09-09' },
        criteria: ['maturity'],
      }),
    })
    view.unmount()
    render(<ClosureHandoverRegister />)
    expect(screen.getByLabelText('Handover date for CBOM + continuous discovery')).toHaveValue('')
  })
  it('downloads actual Markdown matching the saved record and containing incomplete states', async () => {
    const blobs: Blob[] = []
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn((blob: Blob) => {
        blobs.push(blob)
        return 'blob:closure-sample'
      }),
    })
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    render(<ClosureHandoverRegister />)
    await userEvent.click(screen.getByRole('button', { name: '.md' }))
    expect(blobs).toHaveLength(1)
    expect(click).toHaveBeenCalledOnce()
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = reject
      reader.readAsText(blobs[0])
    })
    expect(text).toContain(
      'Entry completeness: Incomplete (0/5 capability assignments; 0/4 acknowledgments)'
    )
    expect(text).toContain('not an archive receipt')
    expect(text).toContain(documents().find((d) => d.moduleId === CLOSURE_MODULE)!.data)
  })
  it('renders restored punctuation as literal text while retaining raw saved inputs', () => {
    const raw = '[label](https://example.invalid) `code` *bold* _under_'
    const original = {
      id: 'literal',
      moduleId: CLOSURE_MODULE,
      type: CLOSURE_TYPE,
      title: 'Sample',
      data: 'prior',
      createdAt: 1,
      inputs: scopedArtifactInputs(CLOSURE_SCOPE, { owner: { cbom: raw }, date: {}, criteria: [] }),
    }
    useModuleStore.setState((state) => ({
      artifacts: { ...state.artifacts, executiveDocuments: [original] },
    }))
    render(<ClosureHandoverRegister />)
    const preview = within(screen.getByRole('region', { name: 'Generated sample closure record' }))
    expect(preview.getByRole('cell', { name: raw })).toBeInTheDocument()
    expect(preview.queryByRole('link', { name: 'label' })).not.toBeInTheDocument()
    expect(documents()).toEqual([original])
  })
  it('ignores unrelated scoped input and preserves a different occupant of the save slot', () => {
    const foreign = {
      id: 'foreign',
      moduleId: CLOSURE_MODULE,
      type: CLOSURE_TYPE,
      title: 'Foreign',
      data: 'Keep this document',
      createdAt: 1,
      inputs: scopedArtifactInputs('other-scope', {
        owner: { cbom: 'Crypto Gov Owner' },
        date: { cbom: '2027-01-02' },
        criteria: ['maturity'],
      }),
    }
    useModuleStore.setState((s) => ({
      artifacts: { ...s.artifacts, executiveDocuments: [foreign] },
    }))
    render(<ClosureHandoverRegister />)
    expect(screen.getByRole('alert')).toHaveTextContent('preserved')
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Handover date for CBOM + continuous discovery')).toHaveValue('')
    expect(documents()).toEqual([foreign])
  })
})
