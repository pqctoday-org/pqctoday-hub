// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type {
  KnowledgeCore,
  KnowledgeLink,
  KnowledgeRecord,
} from '@/services/knowledge/knowledgeTypes'
import { LessonResourcesBox } from './LessonResourcesBox'

const load = vi.hoisted(() => vi.fn())
vi.mock('@/services/knowledge/knowledgeReader', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/services/knowledge/knowledgeReader')>()),
  loadKnowledgeReader: load,
}))

const rec = (
  id: string,
  family: string,
  type: string,
  label: string,
  link: string
): KnowledgeRecord => ({
  id,
  kind: `${family} ${type}`,
  type,
  family,
  label,
  link,
  status: 'active',
})

function readerOf(records: KnowledgeRecord[], links: KnowledgeLink[]): KnowledgeReader {
  const core: KnowledgeCore = {
    schema: 'knowledge-core/1',
    meta: {
      counts: { records: 0, links: 0, aliases: 0, by_kind: {} },
      inputs: [],
      input_patterns: [],
    },
    records: [
      rec('LM-900', 'module', 'module', 'Fixture lesson', '/learn/fixture-lesson'),
      ...records,
    ],
    aliases: {},
    links,
    relations: {},
  }
  return new KnowledgeReader(core)
}

const taught = (id: string): KnowledgeLink => [id, 'taught_in', 'LM-900', 'declared', 's']

const many = (n: number, make: (i: number) => KnowledgeRecord) =>
  Array.from({ length: n }, (_, i) => make(i + 1))

function renderBox(moduleId = 'fixture-lesson') {
  return render(
    <MemoryRouter>
      <LessonResourcesBox moduleId={moduleId} />
    </MemoryRouter>
  )
}

describe('LessonResourcesBox', () => {
  beforeEach(() => {
    load.mockReset()
  })

  it('shows the three groups as lists of real links, with the counts in their names', async () => {
    const records = [
      rec('GL:x509', 'glossary', 'term', 'X.509', '/learn?glossary=X.509'),
      rec('ALG:ml-dsa', 'algorithm', 'algorithm', 'ML-DSA', '/algorithms?algo=ML-DSA'),
      rec('LIB:fips-204', 'library', 'standard', 'FIPS 204', '/library?ref=FIPS%20204'),
      rec('IL:bank', 'usecase', 'usecase', 'Bank card issuing', '/algorithms?usecase=bank'),
    ]
    load.mockResolvedValue(
      readerOf(
        records,
        records.map((r) => taught(r.id))
      )
    )
    renderBox()

    const box = await screen.findByRole('region', { name: 'Related resources' })
    expect(within(box).getByRole('heading', { level: 2, name: 'Related resources' })).toBeTruthy()

    const terms = within(box).getByRole('list', { name: 'Terms taught here (2)' })
    expect(within(terms).getByRole('link', { name: 'X.509' }).getAttribute('href')).toBe(
      '/learn?glossary=X.509'
    )
    expect(
      within(terms).getByRole('link', { name: 'ML-DSA, Algorithm' }).getAttribute('href')
    ).toBe('/algorithms?algo=ML-DSA')

    const documents = within(box).getByRole('list', { name: 'Documents this lesson draws on (1)' })
    const doc = within(documents).getByRole('link', { name: /FIPS 204/ })
    expect(doc.getAttribute('href')).toBe('/library?ref=FIPS%20204')
    expect(doc.textContent).toContain('Library document')

    const cases = within(box).getByRole('list', { name: 'Industry use cases covered (1)' })
    expect(within(cases).getByRole('link', { name: /Bank card issuing/ })).toBeTruthy()
    expect(within(box).queryByRole('button')).toBeNull()
  })

  it('shows 12 terms, then every one after Show all, and folds them back', async () => {
    const records = many(15, (i) =>
      rec(
        `GL:t${String(i).padStart(2, '0')}`,
        'glossary',
        'term',
        `Term ${String(i).padStart(2, '0')}`,
        `/t/${i}`
      )
    )
    load.mockResolvedValue(
      readerOf(
        records,
        records.map((r) => taught(r.id))
      )
    )
    renderBox()

    const terms = await screen.findByRole('list', { name: 'Terms taught here (15)' })
    expect(within(terms).getAllByRole('link')).toHaveLength(12)
    const user = userEvent.setup()
    const button = screen.getByRole('button', { name: 'Show all 15' })
    expect(button.getAttribute('aria-expanded')).toBe('false')
    expect(button.getAttribute('aria-controls')).toBe(terms.id)

    await user.click(button)
    expect(within(terms).getAllByRole('link')).toHaveLength(15)
    const fold = screen.getByRole('button', { name: 'Show fewer' })
    expect(fold.getAttribute('aria-expanded')).toBe('true')

    await user.click(fold)
    expect(within(terms).getAllByRole('link')).toHaveLength(12)
  })

  it('shows 5 documents and 5 use cases, each group expanding on its own', async () => {
    const docs = many(7, (i) =>
      rec(`LIB:d${i}`, 'library', 'document', `Doc ${i}`, `/library?ref=d${i}`)
    )
    const cases = many(6, (i) => rec(`IL:u${i}`, 'usecase', 'usecase', `Case ${i}`, `/u/${i}`))
    const all = [...docs, ...cases]
    load.mockResolvedValue(
      readerOf(
        all,
        all.map((r) => taught(r.id))
      )
    )
    renderBox()

    const docList = await screen.findByRole('list', { name: 'Documents this lesson draws on (7)' })
    const caseList = screen.getByRole('list', { name: 'Industry use cases covered (6)' })
    expect(within(docList).getAllByRole('link')).toHaveLength(5)
    expect(within(caseList).getAllByRole('link')).toHaveLength(5)

    await userEvent.setup().click(screen.getByRole('button', { name: 'Show all 7' }))
    expect(within(docList).getAllByRole('link')).toHaveLength(7)
    expect(within(caseList).getAllByRole('link')).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Show all 6' }).getAttribute('aria-expanded')).toBe(
      'false'
    )
  })

  it('leaves out a group with nothing in it, and has no Show all for a short one', async () => {
    const r = rec('IL:u', 'usecase', 'usecase', 'Only case', '/u/1')
    load.mockResolvedValue(readerOf([r], [taught(r.id)]))
    renderBox()
    await screen.findByRole('region', { name: 'Related resources' })
    expect(screen.queryByText(/Terms taught here/)).toBeNull()
    expect(screen.queryByText(/Documents this lesson draws on/)).toBeNull()
    expect(screen.getByText(/Industry use cases covered/)).toBeTruthy()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders nothing when the lesson has no linked records', async () => {
    load.mockResolvedValue(readerOf([], []))
    const { container } = renderBox()
    await waitFor(() => expect(load).toHaveBeenCalled())
    await Promise.resolve()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing while the file loads', () => {
    load.mockImplementation(() => new Promise(() => undefined))
    const { container } = renderBox()
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing, and does not throw, when the file fails to load', async () => {
    load.mockImplementation(() => Promise.reject(new Error('knowledge core: 503')))
    const { container } = renderBox()
    await waitFor(() => expect(load).toHaveBeenCalled())
    await Promise.resolve()
    expect(container.innerHTML).toBe('')
  })
})

describe('LessonResourcesBox: the kept links', () => {
  beforeEach(() => {
    load.mockReset()
  })

  it('shows Related lessons and Elsewhere on the Hub at once, before the knowledge file has loaded', () => {
    load.mockImplementation(() => new Promise(() => undefined))
    renderBox('kms-pqc')
    const box = screen.getByRole('region', { name: 'Related resources' })
    const lessons = within(box).getByRole('list', { name: /^Related lessons \(\d+\)$/ })
    const trust = within(lessons).getByRole('link', {
      name: /Compare with the other trust hardware/,
    })
    expect(trust.getAttribute('href')).toBe('/learn/arch-quantum-impact?tab=workshop&step=5')
    expect(trust.textContent).toContain('Workshop step')
    expect(trust.textContent).toContain('HSMs, TPMs, confidential computing and DPUs side by side')
    const pages = within(box).getByRole('list', { name: /^Elsewhere on the Hub \(\d+\)$/ })
    const migrate = within(pages).getByRole('link', { name: /Migration Guide/ })
    expect(migrate.getAttribute('href')).toBe('/migrate')
    expect(migrate.textContent).toContain('Page: Migrate')
  })

  it('shows the kept groups ahead of the generated ones', async () => {
    const records = [
      rec('LM-901', 'module', 'module', 'KMS', '/learn/kms-pqc'),
      rec('LIB:x', 'library', 'standard', 'FIPS 203', '/library?ref=x'),
    ]
    const core = readerOf(records, [['LIB:x', 'taught_in', 'LM-901', 'declared', 's']]).core
    load.mockResolvedValue(new KnowledgeReader(core))
    renderBox('kms-pqc')
    await screen.findByRole('list', { name: /^Documents this lesson draws on/ })
    const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(names).toEqual([
      expect.stringMatching(/^Related lessons/),
      expect.stringMatching(/^Elsewhere on the Hub/),
      expect.stringMatching(/^Documents this lesson draws on/),
    ])
  })

  it('shows 5 kept lessons then Show all', async () => {
    load.mockResolvedValue(readerOf([], []))
    renderBox('hybrid-crypto')
    const lessons = screen.getByRole('list', { name: /^Related lessons \(6\)$/ })
    expect(within(lessons).getAllByRole('link')).toHaveLength(5)
    await userEvent.setup().click(screen.getByRole('button', { name: 'Show all 6' }))
    expect(within(lessons).getAllByRole('link')).toHaveLength(6)
  })

  it('shows a kept link with no reason as a kind and a title only', () => {
    load.mockImplementation(() => new Promise(() => undefined))
    renderBox('pqc-business-case')
    const lessons = screen.getByRole('list', { name: /^Related lessons/ })
    const link = within(lessons).getByRole('link', { name: /PQC Risk Management/ })
    expect(link.querySelectorAll('span')).toHaveLength(2)
    expect(link.getAttribute('href')).toBe('/learn/pqc-risk-management')
  })

  it('draws no kept group for a lesson the file does not list', async () => {
    load.mockResolvedValue(readerOf([], []))
    const { container } = renderBox('quiz')
    await waitFor(() => expect(load).toHaveBeenCalled())
    await Promise.resolve()
    expect(container.innerHTML).toBe('')
  })

  it('says which record a chip means when a term and an algorithm share a name', async () => {
    const recs = [
      rec('GL:x25519', 'glossary', 'term', 'X25519MLKEM768', '/learn?glossary=x'),
      rec('ALG:x25519', 'algorithm', 'algorithm', 'X25519MLKEM768', '/algorithms?algo=x'),
    ]
    load.mockResolvedValue(
      readerOf(
        recs,
        recs.map((r) => taught(r.id))
      )
    )
    renderBox('fixture-lesson')
    const terms = await screen.findByRole('list', { name: /^Terms taught here/ })
    const text = within(terms)
      .getAllByRole('link')
      .map((a) => a.textContent)
    // The algorithm's chip names its kind (visibly, and for a screen reader); the glossary term's does not.
    expect(text).toEqual(['X25519MLKEM768· Algorithm, Algorithm', 'X25519MLKEM768'])
  })
})

describe('LessonResourcesBox: the trust-hardware comparison', () => {
  beforeEach(() => {
    load.mockReset()
    load.mockImplementation(() => new Promise(() => undefined))
  })

  it.each(['confidential-computing', 'hsm-pqc', 'kms-pqc', 'secure-boot-pqc'])(
    '%s offers one "Compare with the other trust hardware" link, to Step 6 of Architect Quantum Impact',
    (lesson) => {
      renderBox(lesson)
      const links = screen
        .getAllByRole('link', { name: /Compare with the other trust hardware/ })
        .map((a) => a.getAttribute('href'))
      expect(links).toEqual(['/learn/arch-quantum-impact?tab=workshop&step=5'])
    }
  )
})
