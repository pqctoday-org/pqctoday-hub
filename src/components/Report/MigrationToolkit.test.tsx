// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { SoftwareItem } from '@/types/MigrateTypes'

const state = vi.hoisted(() => ({
  hiddenProducts: [] as string[],
  myProducts: [] as string[],
  importProductSelection: false,
  software: [] as SoftwareItem[],
}))

vi.mock('../../store/useMigrateSelectionStore', () => ({
  useMigrateSelectionStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ hiddenProducts: state.hiddenProducts, hideProduct: vi.fn(), restoreAll: vi.fn() }),
  useSelectedProductIds: () => state.myProducts,
}))
vi.mock('../../store/useAssessmentStore', () => ({
  useAssessmentStore: (sel: (s: Record<string, unknown>) => unknown) =>
    sel({ importProductSelection: state.importProductSelection }),
}))
vi.mock('../../data/migrateData', () => ({
  get softwareData() {
    return state.software
  },
}))
vi.mock('./sections/reportContentShared', () => ({ SectionInfoTip: () => null }))
vi.mock('@/components/common/FipsStatusBadge', () => ({ FipsStatusBadge: () => null }))

import { MigrationToolkit } from './MigrationToolkit'

const product = (id: string, layer: string, category: string, targetIndustries: string) =>
  ({
    productId: id,
    softwareName: `Product ${id}`,
    categoryName: category,
    infrastructureLayer: layer,
    pqcSupport: 'Yes',
    pqcMigrationPriority: 'High',
    fipsValidated: '',
    targetIndustries,
  }) as unknown as SoftwareItem

const CATALOGUE = [
  product('hsm-1', 'Hardware', 'HSM', 'Finance & Banking'),
  product('hsm-2', 'Hardware', 'HSM', 'Healthcare'),
  product('cloud-1', 'Cloud', 'KMS', 'Finance & Banking'),
  product('os-1', 'Operating System', 'Linux', ''),
]

type ToolkitProps = {
  infrastructure: string[]
  industry: string
  subCategories?: Record<string, string[]>
}

const toolkit = (props: ToolkitProps) => (
  <MemoryRouter>
    <MigrationToolkit
      assessmentInfrastructure={props.infrastructure}
      assessmentSubCategories={props.subCategories ?? {}}
      assessmentIndustry={props.industry}
    />
  </MemoryRouter>
)

const renderToolkit = (props: ToolkitProps) => render(toolkit(props))

const listedProducts = () => screen.queryAllByText(/^Product /).map((el) => el.textContent)

describe('MigrationToolkit selection basis', () => {
  beforeEach(() => {
    state.hiddenProducts = []
    state.myProducts = []
    state.importProductSelection = false
    state.software = CATALOGUE
  })

  it('lists only products in the assessed infrastructure layers', () => {
    renderToolkit({ infrastructure: ['Hardware'], industry: 'Finance & Banking' })
    expect(listedProducts()).toEqual(['Product hsm-1', 'Product hsm-2'])
  })

  it('lists the same products for two different industries, and says industry does not change it', () => {
    const { rerender } = renderToolkit({
      infrastructure: ['Hardware'],
      industry: 'Finance & Banking',
    })
    const forFinance = listedProducts()
    expect(screen.getByText(/Your industry does not change this list/)).toBeInTheDocument()
    rerender(toolkit({ infrastructure: ['Hardware'], industry: 'Healthcare' }))
    expect(listedProducts()).toEqual(forFinance)
    expect(screen.getByText(/Your industry does not change this list/)).toBeInTheDocument()
  })

  it('names infrastructure layers and sub-categories as the actual basis', () => {
    renderToolkit({ infrastructure: ['Hardware'], industry: 'Healthcare' })
    expect(
      screen.getByText(/in the infrastructure layers and sub-categories you selected/i)
    ).toBeInTheDocument()
  })

  it('narrows within a layer by the chosen sub-category', () => {
    state.software = [
      product('hsm-1', 'Hardware', 'HSM', ''),
      product('tpm-1', 'Hardware', 'TPM', ''),
    ]
    renderToolkit({
      infrastructure: ['Hardware'],
      industry: 'Healthcare',
      subCategories: { Hardware: ['TPM'] },
    })
    expect(listedProducts()).toEqual(['Product tpm-1'])
  })

  it('says the whole catalogue is listed, not a tailored list, when no layer was selected', () => {
    renderToolkit({ infrastructure: [], industry: 'Finance & Banking' })
    // Nothing narrows the list, so every layer's products appear.
    expect(listedProducts()).toHaveLength(CATALOGUE.length)
    expect(screen.getByText(/so nothing narrows this list/i)).toBeInTheDocument()
    expect(screen.getByText(/whole Migrate catalog/i)).toBeInTheDocument()
    expect(screen.queryByText(/matching your infrastructure profile/i)).not.toBeInTheDocument()
  })

  it('does not describe a bookmarked-product list as a filtered recommendation', () => {
    state.importProductSelection = true
    state.myProducts = ['cloud-1']
    renderToolkit({ infrastructure: ['Hardware'], industry: 'Finance & Banking' })
    expect(listedProducts()).toEqual(['Product cloud-1'])
    expect(screen.getByText(/Your bookmarked products/)).toBeInTheDocument()
    expect(screen.queryByText(/nothing narrows this list/i)).not.toBeInTheDocument()
  })
})

describe('MigrationToolkit support label', () => {
  beforeEach(() => {
    state.hiddenProducts = []
    state.myProducts = []
    state.importProductSelection = false
  })

  const withSupport = (id: string, pqcSupport: string) => ({
    ...product(id, 'Hardware', 'HSM', ''),
    pqcSupport,
  })

  it('labels a pre-shared-key-only product "PSK" in its own colour, not as a PQC tier', () => {
    state.software = [
      withSupport('psk-1', 'PSK (pre-shared key mixed in; ML-KEM planned)'),
      withSupport('partial-1', 'Partial (ML-KEM planned)'),
      withSupport('yes-1', 'Yes (ML-KEM)'),
    ]
    renderToolkit({ infrastructure: ['Hardware'], industry: '' })
    const label = screen.getByText('PSK')
    expect(label).toHaveClass('text-info')
    expect(label).not.toHaveClass('text-warning')
    expect(label).toHaveAttribute('title', expect.stringMatching(/pre-shared key/))
    // The other tiers keep their colours and labels.
    expect(screen.getByText('Partial')).toHaveClass('text-warning')
    expect(screen.getByText('Yes')).toHaveClass('text-success')
  })

  it('shows the label "PSK" even when the support text carries more after the prefix', () => {
    state.software = [withSupport('psk-2', 'PSK only - no post-quantum algorithm')]
    renderToolkit({ infrastructure: ['Hardware'], industry: '' })
    expect(screen.getByText('PSK')).toHaveClass('text-info')
    expect(screen.queryByText(/no post-quantum algorithm/)).not.toBeInTheDocument()
  })
})
