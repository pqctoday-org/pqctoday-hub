// SPDX-License-Identifier: AGPL-3.0-only
/**
 * My work list rules: A12 (one comment shows in every objective that uses the lesson), A17 (chip counts equal list
 * lengths), the Markdown export, tracked outputs phase 1 (A13, A15, O07, O08) and "nothing counts as completion".
 */
import { describe, it, expect, beforeEach } from 'vitest'
import {
  ALL_OBJECTIVES,
  NOT_FILED,
  buildItems,
  countItems,
  filterItems,
  groupByDay,
  type MyWorkObjective,
} from './items'
import { buildMarkdown, exportFileName } from './markdownExport'
import { summarizeAnswerPayload } from './answerSummary'
import {
  collectExistingOutputs,
  outputSourceStatus,
  syncTrackedOutputs,
  toolOutputCapability,
} from './outputs'
import { TOOL_RECORDS } from '@/data/generated/tools.generated'
import { EMPTY_MY_WORK, useMyWorkStore, type MyWorkData } from '@/store/useMyWorkStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { useModuleStore } from '@/store/useModuleStore'
import type { ExecutiveDocument } from '@/services/storage/types'

const objectives: MyWorkObjective[] = [
  { id: 'review', title: 'TLS review', steps: [{ tag: 'LM-008' }, { tag: 'LM-009/s:x' }] },
  { id: 'brief', title: 'Board briefing', steps: [{ tag: 'LM-008/w:simulate' }] },
]

const comment = (id: string, tag: string, at: string) => ({
  id,
  tag,
  anchorKind: 'section' as const,
  body: `body ${id}`,
  createdAt: at,
  updatedAt: at,
  contentVersion: 18,
  edited: false,
})

const data = (): MyWorkData => ({
  comments: [
    comment('c1', 'LM-008/s:handshake', '2026-11-24T10:00:00.000Z'),
    comment('c2', 'LM-050/s:y', '2026-11-24T09:00:00.000Z'),
    comment('c3', 'LM-009/s:x', '2026-11-03T10:00:00.000Z'),
  ],
  outputs: [
    {
      id: 'out-1',
      kind: 'technical',
      producer: { toolId: 'tls-simulator', route: '/playground/tls-simulator' },
      ref: { type: 'history-event', id: 'e1' },
      title: 'TLS simulation',
      storage: 'link',
      createdAt: '2026-11-24T12:00:00.000Z',
      updatedAt: '2026-11-24T12:00:00.000Z',
      runId: 'run:e1',
      objectiveId: 'review',
    },
  ],
  answers: [
    {
      id: 'a1',
      question: 'When is the CNSA 2.0 deadline?',
      savedAt: '2026-11-23T08:00:00.000Z',
      payload: {
        answerText: 'Here is what the Hub holds.',
        rowTags: ['CMP:CNSA-2'],
        source: { tag: 'CMP:CNSA-2' },
      },
    },
  ],
  references: [
    {
      id: 'r1',
      tag: 'GL:ml-kem',
      title: 'ML-KEM',
      kind: 'glossary term',
      savedFrom: 'page',
      createdAt: '2026-11-22T08:00:00.000Z',
    },
  ],
})

describe('the list', () => {
  it('A12: one comment on a lesson shows in every objective that uses it, and nowhere it does not belong', () => {
    const items = buildItems(data(), objectives)
    const c1 = items.find((i) => i.key === 'c:c1')!
    expect(c1.objectiveIds.sort()).toEqual(['brief', 'review']) // LM-008 is a step in both
    expect(items.find((i) => i.key === 'c:c2')!.objectiveIds).toEqual([]) // not filed
  })

  it('is newest first and stable', () => {
    const items = buildItems(data(), objectives)
    expect(items.map((i) => i.key)).toEqual(['o:out-1', 'c:c1', 'c:c2', 'a:a1', 'r:r1', 'c:c3'])
    expect(buildItems(data(), objectives).map((i) => i.key)).toEqual(items.map((i) => i.key))
  })

  it('A17: every chip count equals the length of the list it shows', () => {
    const items = buildItems(data(), objectives)
    for (const type of ['all', 'comments', 'artifacts'] as const) {
      for (const objective of [ALL_OBJECTIVES, NOT_FILED, 'review', 'brief']) {
        const counts = countItems(items, objectives, objective, type)
        expect(counts.all, `all/${type}`).toBe(filterItems(items, ALL_OBJECTIVES, type).length)
        expect(counts.notFiled, `notFiled/${type}`).toBe(filterItems(items, NOT_FILED, type).length)
        expect(counts.byObjective.review).toBe(filterItems(items, 'review', type).length)
        expect(counts.byObjective.brief).toBe(filterItems(items, 'brief', type).length)
        expect(counts.types.comments).toBe(filterItems(items, objective, 'comments').length)
        expect(counts.types.artifacts).toBe(filterItems(items, objective, 'artifacts').length)
        expect(counts.types.all).toBe(filterItems(items, objective, 'all').length)
      }
    }
  })

  it('groups by day, newest day first', () => {
    const days = groupByDay(buildItems(data(), objectives)).map((g) => g.day)
    expect([...days].sort().reverse()).toEqual(days)
  })

  it('an item pointing at an objective that no longer exists is shown as not filed', () => {
    const d = data()
    d.outputs[0].objectiveId = 'gone'
    expect(buildItems(d, objectives).find((i) => i.key === 'o:out-1')!.objectiveIds).toEqual([])
  })
})

describe('Markdown export (J2)', () => {
  it('writes every kind of item, with versions, tags and links, and says it counts for nothing', () => {
    const text = buildMarkdown(buildItems(data(), objectives), {
      now: new Date('2026-11-25T10:00:00.000Z'),
      origin: 'https://example.invalid',
      objectiveTitle: (id) => objectives.find((o) => o.id === id)?.title,
    })
    expect(text).toContain('# My work, PQC Today')
    expect(text).toContain('Nothing here counts as completion')
    expect(text).toContain('> body c1')
    expect(text).toContain('version 18')
    expect(text).toContain(
      'Tag: LM-008/s:handshake. Link: https://example.invalid/learn/tls-basics?section=handshake'
    )
    expect(text).toContain('Technical artifact: TLS simulation')
    expect(text).toContain('Title and link only today')
    expect(text).toContain('Saved answer: When is the CNSA 2.0 deadline?')
    expect(text).toContain('Records: CMP:CNSA-2')
    expect(text).toContain('Objective: TLS review')
    expect(text).toContain('Saved reference: ML-KEM')
  })

  it('an empty export says so; the file name carries the date', () => {
    expect(buildMarkdown([], { now: new Date('2026-11-25T10:00:00.000Z') })).toContain(
      'Nothing here yet.'
    )
    expect(exportFileName(new Date('2026-11-25T10:00:00.000Z'))).toBe(
      'pqc-today-my-work-2026-11-25.md'
    )
  })

  it('a saved answer shows only what its payload holds, in any shape', () => {
    expect(summarizeAnswerPayload('x')).toEqual({ rowTags: [] })
    const s = summarizeAnswerPayload({
      answerText: 'A',
      groups: [{ rows: [{ tag: 'LM-1' }], more: [{ tag: 'LM-2' }, { tag: 'LM-1' }] }],
    })
    expect(s.rowTags).toEqual(['LM-1', 'LM-2'])
  })
})

describe('tracked outputs, phase 1 (J4)', () => {
  beforeEach(() => {
    localStorage.clear()
    useMyWorkStore.setState({ ...EMPTY_MY_WORK })
    useHistoryStore.setState({ events: [] })
    useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
  })

  const doc = (over: Partial<ExecutiveDocument> = {}): ExecutiveDocument => ({
    id: 'doc-1',
    moduleId: 'learning',
    type: 'roi-model',
    title: 'ROI model',
    data: '{}',
    createdAt: Date.parse('2026-11-24T09:00:00.000Z'),
    approvalStatus: 'draft',
    ...over,
  })

  it('A13: a tool run in history becomes one technical artifact (title and link only), and repeating adds none', () => {
    useHistoryStore.getState().addEvent({
      type: 'tls_simulation',
      timestamp: Date.parse('2026-11-24T10:00:00.000Z'),
      title: 'Ran the TLS simulator',
      route: '/playground/tls-simulator',
    })
    expect(syncTrackedOutputs()).toMatchObject({ ok: true, value: { added: 1 } })
    expect(syncTrackedOutputs()).toMatchObject({ ok: true, value: { added: 0, updated: 0 } })
    const outputs = useMyWorkStore.getState().outputs
    expect(outputs).toHaveLength(1)
    expect(outputs[0]).toMatchObject({
      kind: 'technical',
      storage: 'link',
      producer: { toolId: 'tls-simulator' },
    })
  })

  it('A14/A15: a business document is referenced by id with its approval status; regenerating it is the same record', () => {
    useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [doc()] } }))
    syncTrackedOutputs()
    useModuleStore.setState((s) => ({
      artifacts: {
        ...s.artifacts,
        executiveDocuments: [
          doc({ id: 'doc-2', title: 'ROI model v2', approvalStatus: 'in-review' }),
        ],
      },
    }))
    syncTrackedOutputs()
    const outputs = useMyWorkStore.getState().outputs
    expect(outputs).toHaveLength(1)
    expect(outputs[0]).toMatchObject({
      kind: 'business',
      storage: 'document',
      title: 'ROI model v2',
      approvalStatus: 'in-review',
      ref: { type: 'executive-document', id: 'doc-2' },
    })
  })

  it('O08: when the document or the run is gone the record stays and says so', () => {
    useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [doc()] } }))
    syncTrackedOutputs()
    const output = useMyWorkStore.getState().outputs[0]
    expect(outputSourceStatus(output, [], [doc()])).toBe('present')
    expect(outputSourceStatus(output, [], [])).toBe('missing')
    useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [] } }))
    syncTrackedOutputs()
    expect(useMyWorkStore.getState().outputs).toHaveLength(1) // never disappears silently
  })

  it('only the Hub’s own run events become outputs; an ordinary page view does not', () => {
    const events = [
      { id: 'e1', type: 'page_view' as const, timestamp: 1, title: 'Visited', route: '/learn' },
      {
        id: 'e2',
        type: 'artifact_key' as const,
        timestamp: 2,
        title: 'Generated key',
        route: '/openssl',
      },
    ]
    expect(collectExistingOutputs(events, []).map((o) => o.runId)).toEqual(['run:e2'])
  })

  it('which tools produce an output is read from the tools data file, never typed here', () => {
    // The data file states no output column at this head, so no tool is claimed either way.
    const sample = TOOL_RECORDS[0]
    const stated = (sample as unknown as Record<string, unknown>).producesArtifact
    if (stated === undefined) expect(toolOutputCapability(sample.toolId)).toEqual({ known: false })
    else
      expect(toolOutputCapability(sample.toolId)).toMatchObject({ known: true, produces: stated })
    expect(toolOutputCapability('no-such-tool')).toEqual({ known: false })
  })

  it('O05/C04: registering outputs and writing comments leaves lesson progress alone', () => {
    const before = JSON.stringify(useModuleStore.getState().modules)
    useModuleStore.setState((s) => ({ artifacts: { ...s.artifacts, executiveDocuments: [doc()] } }))
    syncTrackedOutputs()
    expect(JSON.stringify(useModuleStore.getState().modules)).toBe(before)
  })
})
