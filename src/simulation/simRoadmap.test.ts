// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildSimRoadmapDoc, serializeSimRoadmap, type SimRoadmapInput } from './simRoadmap'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'

const input: SimRoadmapInput = {
  sector: 'financial',
  size: 'global',
  country: 'US',
  difficulty: 'hard',
  phases: [
    { id: 'p0', name: 'Executive Mandate', level: 2, cleared: true },
    { id: 'p1', name: 'Discovery', level: 1, cleared: false },
  ],
  clearedCount: 1,
  totalPhases: 8,
  readinessPct: 42,
  yearsToHorizon: 3,
  over: 1,
}

describe('buildSimRoadmapDoc (WS-15)', () => {
  it('builds a sim-roadmap ExecutiveDocument from a run', () => {
    const doc = buildSimRoadmapDoc(input, 1000)
    expect(doc.type).toBe('sim-roadmap')
    expect(doc.id).toBe('sim-roadmap-1000')
    expect(doc.title).toContain('financial')
    expect(doc.moduleId).toBeTruthy()
    expect(doc.createdAt).toBe(1000)
    // C1: the structured run is preserved so the Migrate RoadmapBuilder can read
    // it back and seed an editable draft (not just the markdown body).
    expect(doc.inputs).toEqual(input)
  })

  it('serializes the run into a readable roadmap body', () => {
    const md = serializeSimRoadmap(input)
    expect(md).toContain('PQC Migration Roadmap')
    expect(md).toContain('1/8 phases cleared')
    expect(md).toContain('readiness 42%')
    expect(md).toContain('✓ P0 Executive Mandate — L2')
  })

  it('committing adds exactly one document and leaves the assessment untouched', () => {
    useAssessmentResultStore.setState({ lastResult: null, completedAt: null })
    const before = (useModuleStore.getState().artifacts.executiveDocuments ?? []).length

    useModuleStore.getState().addExecutiveDocument(buildSimRoadmapDoc(input, 2000))

    const docs = useModuleStore.getState().artifacts.executiveDocuments ?? []
    expect(docs.length).toBe(before + 1)
    expect(docs.some((d) => d.id === 'sim-roadmap-2000' && d.type === 'sim-roadmap')).toBe(true)
    // the read-only assessment was not mutated
    expect(useAssessmentResultStore.getState().lastResult).toBeNull()
  })
})
