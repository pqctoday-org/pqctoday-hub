// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { MTCIntroduction } from './MTCIntroduction'
import { SizeComparison } from '../workshop/SizeComparison'
import { ALGORITHM_SIZES, getSizeBreakdown, describeSizeChange } from '../data/mtcConstants'
import summary from '../rag-summary.md?raw'

function intro() {
  return render(
    <EmbedProvider>
      <MemoryRouter>
        <MTCIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
}

describe('MTC learning surfaces use the existing authentication component model', () => {
  it('derives the visible default table and advantage from the real model, with explicit denominator', () => {
    const { container } = intro()
    fireEvent.click(screen.getByRole('button', { name: /Deep Dive: Landmark Certificates/ }))
    const table = screen.getByRole('table')
    const traditional = within(table).getByRole('row', { name: /Traditional X.509/ })
    const standalone = within(table).getByRole('row', { name: /Standalone MTC/ })
    const landmark = within(table).getByRole('row', { name: /Landmark MTC/ })
    // Independent sum: 2*1312 + 3*2420 + 2*119 + 2*200 =10522.
    expect(
      within(traditional)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['Traditional X.509', '9,884 B', '0 B (not used)', '10,522 B', 'baseline'])
    expect(
      within(standalone)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['Standalone MTC', '6,152 B', '384 B', '6,736 B', '36%'])
    expect(
      within(landmark)
        .getAllByRole('cell')
        .map((c) => c.textContent)
    ).toEqual(['Landmark MTC (no cosignatures)', '3,732 B', '736 B', '4,668 B', '56%'])
    const text = container.textContent ?? ''
    expect(text).toContain('not full TLS wire bytes')
    expect(text).toContain('200 B metadata per certificate')
    expect(text).toContain('2 × 119 B SCTs')
    expect(text).toContain('fixed 64 B signature input and 65 B public point')
    expect(text).toContain('DER encoded')
    expect(text).not.toMatch(/63[–-]65%|92[–-]96%|31% smaller/)
  })

  it('shows the positive standalone case and contrary ECDSA landmark case in the real workshop', () => {
    render(<SizeComparison />)
    fireEvent.click(screen.getByRole('button', { name: /^ECDSA/ }))
    expect(screen.getAllByText('19% smaller').length).toBeGreaterThan(0)
    expect(screen.getAllByText('11% larger').length).toBeGreaterThan(0)
    expect(screen.getAllByText('960 B').length).toBeGreaterThan(0)
    expect(screen.getAllByText('777 B').length).toBeGreaterThan(0)
    expect(screen.getByText(/Authored component estimates, not measured DER/)).toBeTruthy()
    const a = ALGORITHM_SIZES.find((a) => a.shortName === 'ECDSA')!
    // 3*64+2*65+238+400=960; 65+128+384+200=777; 65+64+736+200=1065.
    expect(getSizeBreakdown(a)).toMatchObject({
      traditionalTotal: 960,
      mtcTotal: 777,
      mtcLandmarkTotal: 1065,
      reductionPercent: 19,
      landmarkReductionPercent: -11,
    })
  })

  it('changes only the selected subtree proof at an actual slider boundary and restores it', () => {
    render(<SizeComparison />)
    expect(screen.getAllByText('36% smaller').length).toBeGreaterThan(0)
    expect(screen.getAllByText('56% smaller').length).toBeGreaterThan(0)
    const standalone = screen.getByRole('slider', { name: /Standalone subtree/ })
    fireEvent.change(standalone, { target: { value: '16' } })
    expect(screen.getAllByText('35% smaller').length).toBeGreaterThan(0)
    expect(screen.getAllByText('56% smaller').length).toBeGreaterThan(0)
    const landmark = screen.getByRole('slider', { name: /Landmark subtree/ })
    fireEvent.change(landmark, { target: { value: '24' } })
    expect(screen.getAllByText('55% smaller').length).toBeGreaterThan(0)
    const algo = ALGORITHM_SIZES.find((a) => a.shortName === 'ML-DSA-44')!
    expect(getSizeBreakdown(algo, 512, 768)).toMatchObject({
      traditionalTotal: 10522,
      mtcTotal: 6864,
      mtcLandmarkTotal: 4700,
      reductionPercent: 35,
      landmarkReductionPercent: 55,
    })
    fireEvent.change(standalone, { target: { value: '12' } })
    fireEvent.change(landmark, { target: { value: '23' } })
    expect(screen.getAllByText('36% smaller').length).toBeGreaterThan(0)
    expect(screen.getAllByText('56% smaller').length).toBeGreaterThan(0)
    expect(describeSizeChange(0)).toEqual({ text: '0% smaller', smaller: true })
  })

  it('binds current quiz answer aliases and the generated summary snapshot to the same scoped arithmetic', () => {
    const ml = QUIZ_QUESTIONS.find((q) => q.id === 'mtc-004')!
    const slh = QUIZ_QUESTIONS.find((q) => q.id === 'mtc-015')!
    expect(ml.correctAnswer).toBe('c')
    expect(ml.options.find((o) => o.id === 'c')?.text).toContain('36%')
    expect(ml.explanation).toMatch(/6,736/)
    expect(ml.explanation).toMatch(/10,522/)
    expect(slh.correctAnswer).toBe('b')
    expect(slh.options.find((o) => o.id === 'b')?.text).toContain('33%')
    const a = ALGORITHM_SIZES.find((a) => a.shortName === 'SLH-DSA-128s')!
    expect(getSizeBreakdown(a)).toMatchObject({
      traditionalTotal: 24270,
      mtcTotal: 16328,
      mtcLandmarkTotal: 8824,
      reductionPercent: 33,
      landmarkReductionPercent: 64,
    })
    expect(summary).toContain(
      '10,522 B traditional, 6,736 B standalone (36% smaller) and 4,668 B landmark (56% smaller)'
    )
    expect(summary).not.toMatch(/31–65%|63–65%|~31%/)
  })
})
