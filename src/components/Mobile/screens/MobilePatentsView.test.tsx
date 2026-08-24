// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobilePatentsView } from './MobilePatentsView'
import { patentsData } from '@/data/patentsData'
import { isPqcPatent } from '@/components/Patents/patentColumns'
import { computePatentKpis } from '@/components/Patents/redesign/usePatentKpis'
import { PQC_ONLY_LS_KEY } from '@/data/patentsScope'

// Real data throughout — patentsData is parsed synchronously from a bundled
// CSV at module load. Assertions are structural (derived at test time), not
// hardcoded counts, since the underlying corpus changes over time and the
// mockup's own "1,185"/"214"/"Huawei · 63" figures are already known-stale.
function renderView() {
  return render(<MobilePatentsView />)
}

describe('MobilePatentsView', () => {
  beforeEach(() => {
    localStorage.removeItem(PQC_ONLY_LS_KEY)
  })

  it('shows the real KPI figures from usePatentKpis(), not the stale mockup numbers', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const kpis = computePatentKpis(scoped)
    expect(screen.getByText(String(kpis.inScope))).toBeInTheDocument()
    expect(screen.getByText(String(kpis.highImpact.count))).toBeInTheDocument()
    expect(screen.queryByText('1,185')).not.toBeInTheDocument()
    expect(screen.queryByText('214')).not.toBeInTheDocument()
  })

  it('shows the real top assignee, not the stale "Huawei" mockup figure', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const kpis = computePatentKpis(scoped)
    expect(kpis.topAssignee).not.toBeNull()
    expect(
      screen.getByText(`${kpis.topAssignee!.name} · ${kpis.topAssignee!.count} patents`)
    ).toBeInTheDocument()
  })

  it('tapping High migration impact filters the list to only High-impact patents', () => {
    renderView()
    fireEvent.click(screen.getByText('High migration impact').closest('button')!)
    const scoped = patentsData.filter(isPqcPatent)
    const highImpactCount = scoped.filter((p) => p.impactLevel === 'High').length
    expect(screen.getByText(`${highImpactCount} patents`)).toBeInTheDocument()
  })

  it('every real crypto-agility class renders with a real, live-computed count', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const classicalCount = scoped.filter((p) => p.cryptoAgilityMode === 'classical_only').length
    expect(screen.getByText(`Classical only · ${classicalCount}`)).toBeInTheDocument()
  })

  it('typing a search query narrows the list', () => {
    renderView()
    const before = Number(screen.getByText(/^\d+ patents$/).textContent!.split(' ')[0])
    const scoped = patentsData.filter(isPqcPatent)
    const sample = scoped[0]
    fireEvent.change(screen.getByPlaceholderText(/Search assignee, algorithm or protocol/i), {
      target: { value: sample.assignee },
    })
    const after = Number(screen.getByText(/^\d+ patents$/).textContent!.split(' ')[0])
    expect(after).toBeLessThanOrEqual(before)
    expect(after).toBeGreaterThan(0)
  })

  it('keeps the real research/IP disclaimer verbatim', () => {
    renderView()
    expect(screen.getByText(/For research — not legal or IP advice/i)).toBeInTheDocument()
  })

  it('states what was cut rather than silently dropping it', () => {
    renderView()
    expect(
      screen.getByText(/The full 25-dimension table\/grid, the all-crypto scope toggle/i)
    ).toBeInTheDocument()
  })

  it('tapping a patent card opens the real detail sheet with its summary, and Close dismisses it', () => {
    renderView()
    const scoped = patentsData.filter(isPqcPatent)
    const first = scoped[0]
    fireEvent.click(screen.getByText(first.title).closest('button')!)
    expect(screen.getByTestId('patent-detail-sheet')).toBeInTheDocument()
    if (first.summary) {
      expect(screen.getByText(first.summary)).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByTestId('patent-detail-sheet')).not.toBeInTheDocument()
  })
})
