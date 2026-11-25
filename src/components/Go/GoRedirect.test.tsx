// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type { KnowledgeCore } from '@/services/knowledge/knowledgeTypes'
import { GoRedirect } from './GoRedirect'

const base = { kind: 'k', type: 't', family: 'f', status: 'active' }
const core: KnowledgeCore = {
  schema: 'knowledge-core/1',
  meta: {
    counts: { records: 3, links: 0, aliases: 2, by_kind: {} },
    inputs: [],
    input_patterns: [],
  },
  records: [
    { ...base, id: 'STG:3', label: 'Practitioner', link: '/learn?stage=3' },
    { ...base, id: 'LIB:FIPS 203', label: 'FIPS 203', link: '/library?ref=FIPS%20203' },
    { ...base, id: 'LM-001/s:intro', label: 'Intro', link: '/learn/pqc-101?section=intro' },
  ],
  aliases: { 'fips 203': [['LIB:FIPS 203', 'label']] },
  links: [],
  relations: {},
}

vi.mock('@/services/knowledge/knowledgeReader', async (orig) => {
  const mod = await orig<typeof import('@/services/knowledge/knowledgeReader')>()
  return { ...mod, loadKnowledgeReader: () => Promise.resolve(new mod.KnowledgeReader(core)) }
})

function Where() {
  const l = useLocation()
  return <p data-testid="where">{l.pathname + l.search}</p>
}

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/go/*" element={<GoRedirect />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('/go/<tag>', () => {
  it.each([
    ['/go/STG:3', '/learn?stage=3'],
    ['/go/LIB:FIPS%20203', '/library?ref=FIPS%20203'],
    ['/go/LM-001/s:intro', '/learn/pqc-101?section=intro'],
    ['/go/FIPS%20203', '/library?ref=FIPS%20203'],
  ])('%s opens %s', async (path, target) => {
    expect(KnowledgeReader).toBeDefined()
    at(path)
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe(target))
  })

  it('shows the not-found page for a tag the model does not have', async () => {
    at('/go/NOPE:1')
    expect(await screen.findByTestId('not-found')).toBeInTheDocument()
  })
})
