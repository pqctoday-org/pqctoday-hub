// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AssetInventoryBuilder } from './AssetInventoryBuilder'
import { SensitivityScoringEngine } from './SensitivityScoringEngine'
import {
  DEFAULT_ASSETS,
  DEFAULT_SCORING_WEIGHTS,
  scoreAsset,
  type DataAsset,
  type ScoredAsset,
} from '../data/sensitivityConstants'
import { COMPLIANCE_MANDATES } from '../data/industryComplianceData'

vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

const asset = (id: string, retentionPeriod: DataAsset['retentionPeriod']): DataAsset => ({
  id,
  name: `Asset ${id}`,
  assetType: 'data-store',
  sensitivityTier: 'high',
  retentionPeriod,
  currentEncryption: 'RSA-2048 envelope',
  businessOwner: 'Owner',
  industry: 'Healthcare',
  complianceFlags: [],
})

describe('HNDL threshold year explanation', () => {
  it('describes newly captured data and the threshold inequality, not data already taken', () => {
    render(
      <AssetInventoryBuilder
        assets={[asset('short', '5-10y'), asset('long', '25-plus')]}
        onAssetsChange={() => {}}
        crqcYear={2034}
      />
    )
    const note = screen.getByText(/threshold year for/i).closest('div')!.textContent!
    expect(note).toMatch(/newly captured data/)
    expect(note).toMatch(/captured 2027 \+ 7 years = 2034/)
    expect(note).toMatch(/cannot show that anything is already in an adversary/)
    expect(note).not.toMatch(/were collected before/)
    expect(note).not.toMatch(/may already be in adversary archives/)
  })

  it('shows the 7-year sample threshold as 2027 and the 30-year one as already reached', () => {
    render(
      <AssetInventoryBuilder
        assets={[asset('short', '5-10y'), asset('long', '25-plus')]}
        onAssetsChange={() => {}}
        crqcYear={2034}
      />
    )
    const future = screen.getByText('2027')
    expect(future.getAttribute('title')).toMatch(/captured from this year on/)
    const reached = screen.getByText(/2004 \(at risk\)/).closest('span[title]')!
    expect(reached.getAttribute('title')).toMatch(/captured now/)
    for (const el of [future, reached]) {
      expect(el.getAttribute('title')).not.toMatch(/adversary archives/)
      expect(el.getAttribute('title')).not.toMatch(/Data encrypted before/)
    }
  })
})

const HELPER_TEXT =
  'Tick the laws and standards you have confirmed apply to this asset. An asset with none ticked is scored without a legal mandate.'

/** The inventory form feeding the scoring engine, as the module's workshop wires them. */
function Workshop({
  initial = [],
  onScored,
}: {
  initial?: DataAsset[]
  onScored: (scored: ScoredAsset[]) => void
}) {
  const [assets, setAssets] = useState<DataAsset[]>(initial)
  return (
    <>
      <AssetInventoryBuilder assets={assets} onAssetsChange={setAssets} />
      <SensitivityScoringEngine assets={assets} onScoredAssetsChange={onScored} />
    </>
  )
}

async function addAsset(name: string, tick: string[] = []) {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(/Asset Name/), name)
  for (const label of tick) {
    await user.click(screen.getByRole('checkbox', { name: new RegExp(`^${label}\\b`) }))
  }
  await user.click(screen.getByRole('button', { name: /Add Asset/ }))
}

describe('Applicable laws and standards control', () => {
  it('is a labelled group with the helper sentence, and every checkbox has an accessible name', () => {
    render(<AssetInventoryBuilder assets={[]} onAssetsChange={() => {}} />)
    const group = screen.getByRole('group', { name: 'Applicable laws and standards' })
    expect(group).toHaveAccessibleDescription(HELPER_TEXT)
    expect(within(group).getByText(HELPER_TEXT)).toBeInTheDocument()

    const boxes = within(group).getAllByRole('checkbox')
    // Exactly the module's own list: nothing added, nothing dropped.
    expect(boxes).toHaveLength(COMPLIANCE_MANDATES.length)
    COMPLIANCE_MANDATES.forEach((m, i) => {
      expect(boxes[i]).toHaveAccessibleName(`${m.name} ${m.fullName}`)
      expect(boxes[i]).not.toBeChecked()
    })
    // Each box sits in a label that grows to a 44px touch target on phones.
    for (const box of boxes) {
      expect(box.closest('label')?.className).toMatch(/max-md:min-h-\[44px\]/)
    }
  })

  it('can be operated from the keyboard', async () => {
    const user = userEvent.setup()
    render(<AssetInventoryBuilder assets={[]} onAssetsChange={() => {}} />)
    const first = screen.getByRole('checkbox', { name: /^CNSA 2\.0/ })
    first.focus()
    await user.keyboard(' ')
    expect(first).toBeChecked()
    await user.keyboard(' ')
    expect(first).not.toBeChecked()
    await user.tab()
    expect(screen.getByRole('checkbox', { name: /^NIST IR 8547/ })).toHaveFocus()
  })

  it('stores the ticked ids, in list order, on the new asset', async () => {
    const added: DataAsset[][] = []
    render(<Workshop onScored={(s) => added.push(s)} />)
    // Tick out of list order on purpose.
    await addAsset('Ticked asset', ['PCI DSS v4\\.0', 'GDPR'])
    const latest = added[added.length - 1]
    expect(latest).toHaveLength(1)
    expect(latest[0].complianceFlags).toEqual(['GDPR', 'PCI-DSS'])
    for (const flag of latest[0].complianceFlags) {
      expect(COMPLIANCE_MANDATES.map((m) => m.id)).toContain(flag)
    }
  })

  it('changes the score breakdown when a flag is ticked', async () => {
    const results: ScoredAsset[][] = []
    const user = userEvent.setup()
    render(<Workshop onScored={(s) => results.push(s)} />)
    await addAsset('Unticked asset')
    await addAsset('Ticked asset', ['GDPR', 'PCI DSS v4\\.0'])
    const latest = results[results.length - 1]
    const unticked = latest.find((a) => a.name === 'Unticked asset')!
    const ticked = latest.find((a) => a.name === 'Ticked asset')!

    expect(unticked.complianceScore).toBe(0)
    // Two flags (2 x 20) plus the 20-point bonus for PCI DSS.
    expect(ticked.complianceScore).toBe(60)
    expect(ticked.compositeScore).toBeGreaterThan(unticked.compositeScore)

    // The expanded breakdown for each asset says what was scored.
    const buttons = screen.getAllByRole('button', { name: 'Show breakdown' })
    expect(buttons).toHaveLength(2)
    // The engine lists the higher score first.
    await user.click(buttons[0])
    expect(screen.getByText('2 framework(s)')).toBeInTheDocument()
    expect(screen.queryByText('Applicability not stated (scored 0)')).not.toBeInTheDocument()
  })

  it('still says "Applicability not stated (scored 0)" when none is ticked', async () => {
    const user = userEvent.setup()
    let latest: ScoredAsset[] = []
    render(<Workshop onScored={(s) => (latest = s)} />)
    await addAsset('Plain asset')
    expect(latest[0].complianceFlags).toEqual([])
    expect(latest[0].complianceScore).toBe(0)
    await user.click(screen.getByRole('button', { name: 'Show breakdown' }))
    expect(screen.getByText('Applicability not stated (scored 0)')).toBeInTheDocument()
  })

  it('clears the ticks after an asset is added, so they are not carried to the next one', async () => {
    render(<Workshop onScored={() => {}} />)
    await addAsset('First asset', ['GDPR'])
    const group = screen.getByRole('group', { name: 'Applicable laws and standards' })
    for (const box of within(group).getAllByRole('checkbox')) {
      expect(box).not.toBeChecked()
    }
  })

  it('leaves the sample assets, their flags and their scores exactly as they were', async () => {
    const expected = [
      { flags: ['GDPR', 'PCI-DSS'], compliance: 60 },
      { flags: ['NIST-IR-8547'], compliance: 20 },
      { flags: ['CNSA-2.0', 'FIPS-140-3'], compliance: 60 },
      { flags: ['GDPR'], compliance: 20 },
    ]
    expect(DEFAULT_ASSETS).toHaveLength(expected.length)
    DEFAULT_ASSETS.forEach((a, i) => {
      expect(a.complianceFlags).toEqual(expected[i].flags)
      expect(scoreAsset(a, DEFAULT_SCORING_WEIGHTS).complianceScore).toBe(expected[i].compliance)
    })

    // Adding a ticked asset next to them neither edits nor shares their flags.
    const before = JSON.stringify(DEFAULT_ASSETS)
    let latest: ScoredAsset[] = []
    render(<Workshop initial={[...DEFAULT_ASSETS]} onScored={(s) => (latest = s)} />)
    await addAsset('Extra asset', ['HIPAA'])
    expect(JSON.stringify(DEFAULT_ASSETS)).toBe(before)
    DEFAULT_ASSETS.forEach((a, i) => {
      const scored = latest.find((s) => s.id === a.id)!
      expect(scored.complianceFlags).toEqual(expected[i].flags)
      expect(scored.complianceScore).toBe(expected[i].compliance)
    })
    expect(latest.find((s) => s.name === 'Extra asset')!.complianceFlags).toEqual(['HIPAA'])
  })

  it('lists the stated laws and standards in the inventory, and "Not stated" otherwise', async () => {
    render(<Workshop initial={[...DEFAULT_ASSETS]} onScored={() => {}} />)
    await addAsset('Plain asset')
    const table = screen.getByRole('table')
    const rows = within(table).getAllByRole('row')
    const cellsOf = (name: string) =>
      within(rows.find((r) => within(r).queryByText(name))!).getAllByRole('cell')
    expect(within(table).getByRole('columnheader', { name: 'Laws and standards' })).toBeVisible()
    expect(cellsOf('Plain asset').map((c) => c.textContent)).toContain('Not stated')
    expect(cellsOf(DEFAULT_ASSETS[0].name).map((c) => c.textContent)).toContain(
      'GDPR, PCI DSS v4.0'
    )
  })
})
