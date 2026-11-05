// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, waitFor, act } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import type { RevisionEntry } from '@/hooks/useRevisions'
vi.mock('@/components/Playground/workshopRegistry', () => ({ WORKSHOP_TOOLS: [] }))
vi.mock('@/components/PKILearning/moduleData', () => ({ MODULE_CATALOG: {} }))
vi.mock('@/data/conceptXwalkData', () => ({ conceptXwalkData: [] }))
vi.mock('@/store/usePersonaStore', () => ({
  usePersonaStore: (select: (state: { selectedPersona: null }) => unknown) =>
    select({ selectedPersona: null }),
}))
const record = (domain: string, scope: string, day: number): RevisionEntry => ({
  pr_number: 0,
  merge_sha: 'pending',
  merge_timestamp: `2026-11-0${day}T12:00:00Z`,
  change_type: 'manual_data_correction',
  domain,
  scope_summary: scope,
  rows_affected: 1,
  module_id: null,
  tool_id: null,
  reviewer_id: 'sample-reviewer',
  reviewer_display: 'Sample Reviewer',
  approval_method: 'offline',
  approved_via: null,
  proxy_github_handle: null,
  authored_by_llm: false,
  confidence_delta: null,
  record_ids: [scope],
})
const library = record('library', 'Fictional library revision', 1)
const tool = record('tool', 'Fictional tool revision', 2)
const ok = (rows: RevisionEntry[]) =>
  new Response(rows.map((row) => JSON.stringify(row)).join('\n'), { status: 200 })
beforeEach(() => {
  vi.resetModules()
  vi.stubGlobal('fetch', vi.fn())
})
afterEach(() => vi.unstubAllGlobals())
describe('revision scope and recoverable loading', () => {
  it('filters domain-only scope and resets pagination when route scope changes', async () => {
    vi.mocked(fetch).mockResolvedValue(
      ok([
        library,
        tool,
        record('library', 'Fictional second library revision', 3),
        record('tool', 'Fictional second tool revision', 4),
      ])
    )
    const { GlobalRevisionsFeed } = await import('./GlobalRevisionsFeed')
    const view = render(
      <MemoryRouter>
        <GlobalRevisionsFeed domainFilter="library" pageSize={1} />
      </MemoryRouter>
    )
    expect(await screen.findAllByText('Fictional second library revision')).toHaveLength(2)
    expect(screen.queryByText('Fictional tool revision')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Load more/ }))
    expect(screen.getAllByText('Fictional library revision')[0]).toBeInTheDocument()
    view.rerender(
      <MemoryRouter>
        <GlobalRevisionsFeed domainFilter="tool" pageSize={1} />
      </MemoryRouter>
    )
    expect(await screen.findAllByText('Fictional second tool revision')).toHaveLength(2)
    expect(screen.queryByText('Fictional tool revision')).not.toBeInTheDocument()
    expect(screen.queryByText('Fictional library revision')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
    view.rerender(
      <MemoryRouter>
        <GlobalRevisionsFeed domainFilter="tool" entityFilter={library.scope_summary} />
      </MemoryRouter>
    )
    expect(await screen.findByText('No revision records match this scope.')).toBeInTheDocument()
  })
  it('distinguishes HTTP failure from empty history and retries once for all mounted consumers', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(ok([library, tool]))
    const { GlobalRevisionsFeed } = await import('./GlobalRevisionsFeed')
    const { useRevisions } = await import('@/hooks/useRevisions')
    function Peer() {
      const { revisions, error, isLoading } = useRevisions()
      return (
        <output aria-label="Peer revision count">
          {isLoading ? 'loading' : error ? 'unavailable' : revisions.length}
        </output>
      )
    }
    render(
      <MemoryRouter>
        <GlobalRevisionsFeed domainFilter="library" />
        <Peer />
      </MemoryRouter>
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Revision history could not be loaded.'
    )
    expect(screen.getByLabelText('Peer revision count')).toHaveTextContent('unavailable')
    expect(screen.queryByText('No revision records.')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Retry revision history' }))
    expect(await screen.findAllByText(library.scope_summary)).toHaveLength(2)
    expect(screen.queryByText(tool.scope_summary)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Peer revision count')).toHaveTextContent('2')
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(screen.getByText(/Recorded reviewer: Sample Reviewer/)).toBeInTheDocument()
  })
  it('keeps a successful empty feed distinct from a thrown network failure', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new TypeError('sample network failure'))
      .mockResolvedValueOnce(ok([]))
    const { GlobalRevisionsFeed } = await import('./GlobalRevisionsFeed')
    render(
      <MemoryRouter>
        <GlobalRevisionsFeed />
      </MemoryRouter>
    )
    await screen.findByRole('alert')
    expect(screen.queryByText('No revision records.')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry revision history' }))
    expect(await screen.findByText('No revision records.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
  it('shares a pending load and preserves record fields when it completes', async () => {
    let resolve!: (value: Response) => void
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((done) => {
        resolve = done
      })
    )
    const { GlobalRevisionsFeed } = await import('./GlobalRevisionsFeed')
    const { useRevisions } = await import('@/hooks/useRevisions')
    function Peer() {
      return (
        <output aria-label="Recorded revision data">
          {JSON.stringify(useRevisions().revisions)}
        </output>
      )
    }
    render(
      <MemoryRouter>
        <GlobalRevisionsFeed domainFilter="library" />
        <Peer />
      </MemoryRouter>
    )
    expect(screen.getByRole('status', { name: 'Loading revision history' })).toBeInTheDocument()
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    await act(async () => {
      resolve(ok([library]))
    })
    expect(await screen.findAllByText(library.scope_summary)).toHaveLength(2)
    expect(
      JSON.parse(screen.getByLabelText('Recorded revision data').textContent ?? 'null')
    ).toEqual([library])
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
