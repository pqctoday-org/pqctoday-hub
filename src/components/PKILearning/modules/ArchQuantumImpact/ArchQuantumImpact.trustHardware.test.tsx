// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection, security/detect-non-literal-fs-filename, testing-library/no-node-access */
/**
 * Trust Hardware Selector (Architect Quantum Impact, Step 6): citation, wording and render checks.
 *
 * - Every card sentence, grid cell, scenario answer and combine case carries at least one source id,
 *   and each id resolves in the newest Library CSV (the one the app's loader reads). The one
 *   exception is a grid cell of kind 'not-published', which says so and cites nothing.
 * - Tessera text never uses product words, and CMVP certificate 5485 is not linked to either chip.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { readFileSync } from 'node:fs'
import Papa from 'papaparse'
import '@testing-library/jest-dom'
import { hasStandard } from '@/data/standardsRegistry'
import { loadIndustryLandscape } from '@/data/industryLandscapeData'
import { TrustHardwareSelector } from './components/TrustHardwareSelector'
import { SHORT_TITLE_MAX, sourceLabel } from './data/sourceLabel'
import {
  CATEGORY_IDS,
  COMBINE_CASES,
  GRID_ROWS,
  SCENARIOS,
  TRUST_CARDS,
  allSourcedUnits,
} from './data/trustHardware'

/**
 * The Library rows for Tessera, Caliptra, the DPUs, the cloud services and the key-release
 * documents are admitted in the same release. Until they are in the newest Library CSV in this
 * checkout, set TRUSTHW_EXTRA_LIBRARY_CSV to a CSV that has them (for example the data branch's
 * newest library_*.csv) to check the ids without copying the file.
 */
function extraLibraryIds(): Set<string> {
  const path = process.env.TRUSTHW_EXTRA_LIBRARY_CSV
  if (!path) return new Set()
  const rows = Papa.parse<Record<string, string>>(readFileSync(path, 'utf8'), { header: true })
  return new Set(rows.data.map((r) => r.reference_id).filter(Boolean))
}

const units = allSourcedUnits()

describe('Trust Hardware Selector data', () => {
  it('has eight cards and a 10-row by 8-column grid', () => {
    expect(TRUST_CARDS).toHaveLength(8)
    expect(CATEGORY_IDS).toEqual([
      'tpm',
      'caliptra',
      'tessera',
      'hardware-hsm',
      'cloud-hsm',
      'confidential-computing',
      'dpu-bought',
      'dpu-cloud',
    ])
    expect(GRID_ROWS).toHaveLength(10)
    for (const row of GRID_ROWS) {
      expect(Object.keys(row.cells).sort()).toEqual([...CATEGORY_IDS].sort())
    }
  })

  it('gives every card, cell, answer and case at least one source id', () => {
    const missing = units.filter((u) => !u.optional && u.sources.length === 0).map((u) => u.where)
    expect(missing).toEqual([])
  })

  it('lets only a "not published" grid cell go without a source', () => {
    for (const row of GRID_ROWS) {
      for (const id of CATEGORY_IDS) {
        const cell = row.cells[id]
        if (cell.sources.length === 0) {
          expect(cell.kind, `${row.id}/${id}`).toBe('not-published')
          expect(cell.text).toMatch(/^Not published/)
        }
        if (cell.kind === 'not-published') {
          expect(cell.text, `${row.id}/${id}`).toMatch(/^Not published/)
        }
      }
    }
  })

  it('resolves every source id in the newest Library CSV', () => {
    const extra = extraLibraryIds()
    const ids = [...new Set(units.flatMap((u) => u.sources))]
    const unresolved = ids.filter((id) => !hasStandard(id) && !extra.has(id))
    expect(
      unresolved,
      `Library ids missing from the newest Library CSV: ${unresolved.join(' | ')}. ` +
        'Rows admitted for this release resolve once the Library data is assembled.'
    ).toEqual([])
  })

  it('keeps every grid cell to a short answer', () => {
    for (const row of GRID_ROWS) {
      for (const id of CATEGORY_IDS) {
        expect(row.cells[id].text.length, `${row.id}/${id}`).toBeLessThan(260)
      }
    }
  })
})

describe('Tessera wording', () => {
  const PRODUCT_WORDS = /\b(ships|shipping|shipped|available|certified|in every server)\b/i
  const tesseraUnits = units.filter(
    (u) =>
      !u.where.includes('ancestor') &&
      (u.where.startsWith('card tessera') ||
        u.where.endsWith('/tessera') ||
        /tessera/i.test(u.text))
  )

  it('collects the Tessera text', () => {
    expect(tesseraUnits.length).toBeGreaterThan(10)
  })

  it('uses no product words in Tessera text', () => {
    const offenders = tesseraUnits.filter((u) => PRODUCT_WORDS.test(u.text)).map((u) => u.where)
    expect(offenders).toEqual([])
  })

  it('describes Tessera as specification and code with no product or certificate yet', () => {
    const card = TRUST_CARDS.find((c) => c.id === 'tessera')!
    expect(card.status).toBe('Specification and code, no product or certificate yet')
    expect(card.sentences.map((s) => s.text).join(' ')).toContain(
      'specification and code, no product or certificate yet'
    )
  })

  it('uses Microsoft’s word "evolution" and keeps ancestor facts in a labelled box', () => {
    const card = TRUST_CARDS.find((c) => c.id === 'tessera')!
    expect(card.sentences.map((s) => s.text)).toContain(
      'Microsoft describes Tessera as an evolution of the Azure Integrated HSM.'
    )
    expect(card.ancestorBox?.title).toBe('About the earlier Azure Integrated HSM')
    const outsideBox = [
      ...card.sentences
        .map((s) => s.text)
        .filter(
          (t) => t !== 'Microsoft describes Tessera as an evolution of the Azure Integrated HSM.'
        ),
      ...GRID_ROWS.map((r) => r.cells.tessera.text),
    ].join(' ')
    expect(outsideBox).not.toMatch(/Azure Integrated/)
  })

  it('labels Tessera targets as requirements or specification, never as measurements', () => {
    for (const row of GRID_ROWS) {
      const cell = row.cells.tessera
      expect(['specified', 'not-published'], row.id).toContain(cell.kind)
    }
  })

  it('does not link CMVP certificate 5485 to either chip', () => {
    expect(units.map((u) => u.text).join(' ')).not.toMatch(/\b5485\b/)
  })
})

describe('Exercises data', () => {
  it('has about eight scenarios, each with one or two accepted kinds and a sourced answer', () => {
    expect(SCENARIOS.length).toBeGreaterThanOrEqual(8)
    for (const s of SCENARIOS) {
      expect(s.best.length, s.id).toBeGreaterThanOrEqual(1)
      expect(s.best.length, s.id).toBeLessThanOrEqual(2)
      expect(s.why.sources.length, s.id).toBeGreaterThan(0)
      for (const l of s.lessWell)
        expect(l.sources.length, `${s.id}/${l.category}`).toBeGreaterThan(0)
    }
  })

  it('marks scenarios written for this step as authored, and covers the kinds the Landscape lacks', () => {
    const authored = SCENARIOS.filter((s) => s.origin === 'authored')
    expect(authored.length).toBeGreaterThanOrEqual(3)
    const covered = new Set(
      authored.flatMap((s) => [...s.best, ...s.lessWell.map((l) => l.category)])
    )
    for (const kind of ['confidential-computing', 'tessera', 'caliptra'] as const) {
      expect(covered.has(kind), kind).toBe(true)
    }
    for (const s of SCENARIOS.filter((x) => x.origin === 'landscape')) {
      expect(s.landscapeUseCaseId, s.id).toBeTruthy()
    }
  })

  it('points each Landscape scenario at a real, non-PCI Industry Landscape use case', () => {
    const rows = loadIndustryLandscape().useCases
    for (const s of SCENARIOS.filter((x) => x.origin === 'landscape')) {
      const row = rows.find((r) => r.useCaseId === s.landscapeUseCaseId)
      expect(row, s.id).toBeDefined()
      expect(`${row?.useCaseLabel} ${row?.useCaseId}`, s.id).not.toMatch(/PCI/i)
    }
  })

  it('has the four documented combine cases', () => {
    expect(COMBINE_CASES.map((c) => c.id)).toEqual([
      'caliptra-in-tessera',
      'tpm-and-confidential-vm',
      'key-release',
      'dpu-keys',
    ])
  })

  it('names the key-release services and teaches the DPU limit without claiming an HSM-to-DPU flow', () => {
    const kr = COMBINE_CASES.find((c) => c.id === 'key-release')!
    const text = kr.steps.map((s) => s.text).join(' ')
    expect(text).toMatch(/Azure Key Vault/)
    expect(text).toMatch(/AWS KMS/)
    expect(kr.takeaway.text).toMatch(/not for any cloud HSM or KMS/)
    const dpu = COMBINE_CASES.find((c) => c.id === 'dpu-keys')!
    const dpuText = [...dpu.steps, dpu.takeaway].map((s) => s.text).join(' ')
    expect(dpuText).toMatch(/no standard way to load a wrapped key/)
    expect(dpuText).toMatch(/Do not assume one exists/)
  })
})

function renderStep() {
  return render(
    <MemoryRouter>
      <TrustHardwareSelector />
    </MemoryRouter>
  )
}

describe('TrustHardwareSelector render', () => {
  it('shows the eight cards with their labelled questions and a source line per sentence', () => {
    renderStep()
    for (const card of TRUST_CARDS) {
      const el = screen.getByTestId(`trust-card-${card.id}`)
      expect(within(el).getByRole('heading', { level: 3, name: card.name })).toBeInTheDocument()
    }
    const tessera = screen.getByTestId('trust-card-tessera')
    expect(
      within(tessera).getByText('Specification and code, no product or certificate yet')
    ).toBeInTheDocument()
    expect(within(tessera).getByText('About the earlier Azure Integrated HSM')).toBeInTheDocument()
  })

  it('shows the grid in its own horizontal-scroll container with 10 rows and 8 kinds', () => {
    renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'Side-by-side grid' }))
    const scroller = screen.getByTestId('trust-grid-scroll')
    expect(scroller.className).toContain('overflow-x-auto')
    expect(scroller.querySelectorAll('tbody tr')).toHaveLength(10)
    expect(within(scroller).getAllByRole('columnheader')).toHaveLength(9)
    for (const row of GRID_ROWS) {
      for (const id of CATEGORY_IDS) {
        expect(screen.getByTestId(`grid-cell-${row.id}-${id}`)).toBeInTheDocument()
      }
    }
  })

  it('reveals the sources of a grid row on request', () => {
    renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'Side-by-side grid' }))
    expect(screen.queryByText(/Sources for “Where it sits”/)).not.toBeInTheDocument()
    fireEvent.click(screen.getAllByRole('button', { name: /Show sources/ })[0])
    expect(screen.getByText(/Sources for “Where it sits”/)).toBeInTheDocument()
  })

  it('runs "Pick the right one": check, explain, and move on', () => {
    renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'Pick the right one' }))
    const first = SCENARIOS[0]
    expect(screen.getByText(first.title)).toBeInTheDocument()
    const check = screen.getByRole('button', { name: 'Check my answer' })
    expect(check).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Cloud HSM' }))
    fireEvent.click(check)
    const answer = screen.getByTestId('trust-pick-answer')
    expect(within(answer).getByText(/Matches the documented answer/)).toBeInTheDocument()
    expect(within(answer).getByText(/Why the others fit less well/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next scenario' }))
    expect(screen.getByText(SCENARIOS[1].title)).toBeInTheDocument()
  })

  it('marks a wrong pick as not the documented answer and still explains', () => {
    renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'Pick the right one' }))
    fireEvent.click(screen.getByRole('button', { name: 'Caliptra' }))
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }))
    expect(screen.getByText(/Not the documented answer/)).toBeInTheDocument()
  })

  it('runs "How they combine" and reveals what each case teaches', () => {
    renderStep()
    fireEvent.click(screen.getByRole('button', { name: 'How they combine' }))
    fireEvent.click(screen.getByRole('button', { name: 'Case 4' }))
    expect(screen.getByText(/where its keys come from/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'What does this case teach?' }))
    expect(screen.getByText(/Do not assume one exists/)).toBeInTheDocument()
  })

  it('renders no infographic while the slot is empty', () => {
    renderStep()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
  })
})

describe('sourceLabel', () => {
  it('shows a Library row by its document title, keeping the id as the full label source', () => {
    const l = sourceLabel('RFC 9334')
    expect(l.short).toBe('Remote ATtestation procedureS (RATS) Architecture')
    expect(l.full).toBe(l.short)
  })

  it('drops site-name suffixes and cuts long titles at a word boundary', () => {
    const g = sourceLabel('Cloud-HSM-architecture-Security-Google-Cloud-Documentation')
    expect(g.short).toBe('Cloud HSM architecture')
    const long = sourceLabel('CSA-PQC-Guide-2025')
    expect(long.short.length).toBeLessThanOrEqual(SHORT_TITLE_MAX + 1)
  })

  it('falls back to the id for a row that is not in the Library', () => {
    expect(sourceLabel('No-Such-Row').short).toBe('No-Such-Row')
  })
})
