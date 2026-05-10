// SPDX-License-Identifier: GPL-3.0-only
import type { RAGChunk } from '@/types/ChatTypes'

export interface ChunkOverrides {
  id?: string
  source?: string
  title?: string
  content?: string
  category?: string
  metadata?: Record<string, string>
  deepLink?: string
  priority?: number
}

let nextId = 0

export function makeChunk(overrides: ChunkOverrides = {}): RAGChunk {
  nextId += 1
  return {
    id: overrides.id ?? `test-chunk-${nextId}`,
    source: overrides.source ?? 'library',
    title: overrides.title ?? 'Test Chunk',
    content: overrides.content ?? 'placeholder content for trust-engine fixtures',
    category: overrides.category ?? 'standards',
    metadata: overrides.metadata ?? {},
    deepLink: overrides.deepLink,
    priority: overrides.priority,
  }
}

export function makeLibraryChunk(referenceId: string, overrides: ChunkOverrides = {}): RAGChunk {
  return makeChunk({
    source: 'library',
    title: referenceId,
    metadata: { referenceId, ...(overrides.metadata ?? {}) },
    ...overrides,
  })
}

export function makeComplianceChunk(id: string, overrides: ChunkOverrides = {}): RAGChunk {
  return makeChunk({
    source: 'compliance',
    title: id,
    metadata: { id, ...(overrides.metadata ?? {}) },
    ...overrides,
  })
}

export function makeThreatChunk(threatId: string, overrides: ChunkOverrides = {}): RAGChunk {
  return makeChunk({
    source: 'threats',
    title: threatId,
    metadata: { threatId, ...(overrides.metadata ?? {}) },
    ...overrides,
  })
}

export function makeTimelineChunk(title: string, overrides: ChunkOverrides = {}): RAGChunk {
  return makeChunk({
    source: 'timeline',
    title,
    ...overrides,
  })
}
